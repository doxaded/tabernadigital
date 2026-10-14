// Sincronização das campanhas (salas) com o Firestore + sistema de chave de sala.
//
// O app trabalha de forma síncrona sobre o cache em localStorage (storageService).
// Este módulo espelha esse cache no Firestore:
//   - campaigns/{id}      -> dados da sala (só mestre/admin escrevem; jogadores só atualizam "sheets")
//   - roomKeys/{XXXX-XXXX} -> chave de sala: campaignId, masterId e jogadores (máx. MAX_PLAYERS)
// Se o Firebase não estiver disponível (ou a conta for só local), tudo continua funcionando em modo local.
import {
  collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc, runTransaction
} from 'firebase/firestore';
import { auth, db, isLiveFirebaseConfigured } from './firebase';
import { MAX_PLAYERS, generateJoinKey, normalizeJoinKey, storageService } from './storage';
import { Campaign, RoomPlayer, UserProfile } from '../types';

interface RoomKeyDoc {
  campaignId: string;
  masterId: string;
  masterName: string;
  campaignName: string;
  playerIds: string[];
  players: RoomPlayer[];
  createdAt: string;
}

interface SyncedEntry {
  json: string;
  sheetsJson: string;
  managed: boolean;
  joinKey: string;
}

class RoomError extends Error {}

const BACKUP_KEY = 'taberna_campaigns_backup_v1';
const migratedKey = (uid: string) => `taberna_cloud_migrated_v1_${uid}`;

let activeUser: UserProfile | null = null;
let pulled = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let flushRetries = 0;
const synced = new Map<string, SyncedEntry>();

const isManager = (c: Campaign, user: UserProfile) => c.masterId === user.uid || user.role === 'admin';
const isMember = (c: Campaign, user: UserProfile) => !!c.players?.some(p => p.uid === user.uid);

// Versão da campanha que vai para a nuvem: os jogadores ficam só no roomKeys
function toCloud(c: Campaign): Record<string, unknown> {
  const { players: _players, ...rest } = c;
  return JSON.parse(JSON.stringify(rest));
}

async function cloudReady(user: UserProfile): Promise<boolean> {
  if (!isLiveFirebaseConfigured) return false;
  try {
    await auth.authStateReady();
  } catch {
    return false;
  }
  return !!auth.currentUser && auth.currentUser.uid === user.uid;
}

function roomKeyFor(c: Campaign, players: RoomPlayer[] = []): RoomKeyDoc {
  return {
    campaignId: c.id,
    masterId: c.masterId,
    masterName: c.masterName,
    campaignName: c.name,
    playerIds: players.map(p => p.uid),
    players,
    createdAt: new Date().toISOString(),
  };
}

async function ensureRoomKey(c: Campaign): Promise<RoomPlayer[]> {
  const ref = doc(db, 'roomKeys', c.joinKey as string);
  const snap = await getDoc(ref);
  if (snap.exists()) return (snap.data() as RoomKeyDoc).players || [];
  await setDoc(ref, roomKeyFor(c));
  return [];
}

function rememberSynced(c: Campaign, managed: boolean) {
  const cloud = toCloud(c);
  synced.set(c.id, {
    json: JSON.stringify(cloud),
    sheetsJson: JSON.stringify(cloud.sheets ?? []),
    managed,
    joinKey: c.joinKey || '',
  });
}

// ---------- Envio (local -> nuvem) ----------

async function flush() {
  const user = activeUser;
  if (!user || flushing) return;
  if (!(await cloudReady(user))) return;

  // Ainda sem o primeiro download: espera para não sobrescrever a nuvem com dados velhos
  if (!pulled) {
    if (flushRetries++ < 10) scheduleFlush(1500);
    return;
  }
  flushRetries = 0;
  flushing = true;
  try {
    const list = storageService.getCampaigns();

    for (const c of list) {
      const managed = isManager(c, user);
      if (!managed && !isMember(c, user)) continue;

      const cloud = toCloud(c);
      const json = JSON.stringify(cloud);
      const prev = synced.get(c.id);
      if (prev && prev.json === json) continue;

      try {
        if (managed) {
          await setDoc(doc(db, 'campaigns', c.id), cloud);
          if (!prev || prev.joinKey !== c.joinKey) await ensureRoomKey(c);
        } else {
          await updateDoc(doc(db, 'campaigns', c.id), { sheets: cloud.sheets ?? [] });
        }
        rememberSynced(c, managed);
      } catch (err) {
        console.warn('Falha ao sincronizar a campanha com a nuvem:', c.id, err);
      }
    }

    // Campanhas apagadas localmente pelo mestre
    for (const [id, prev] of Array.from(synced.entries())) {
      if (list.some(c => c.id === id) || !prev.managed) continue;
      try {
        await deleteDoc(doc(db, 'campaigns', id));
        if (prev.joinKey) await deleteDoc(doc(db, 'roomKeys', prev.joinKey));
        synced.delete(id);
      } catch (err) {
        console.warn('Falha ao excluir a campanha na nuvem:', id, err);
      }
    }
  } finally {
    flushing = false;
  }
}

function scheduleFlush(delay = 500) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, delay);
}

// ---------- Download (nuvem -> local) ----------

// Retorna true quando o cache local foi atualizado com o estado da nuvem
async function pull(user: UserProfile): Promise<boolean> {
  if (!(await cloudReady(user))) return false;
  try {
    const local = storageService.getCampaigns();
    const remote = new Map<string, Campaign>();

    // 1. Salas que o usuário mestra (admin enxerga todas)
    const ownSnap = user.role === 'admin'
      ? await getDocs(collection(db, 'campaigns'))
      : await getDocs(query(collection(db, 'campaigns'), where('masterId', '==', user.uid)));
    ownSnap.forEach(d => remote.set(d.id, { ...(d.data() as Campaign), id: d.id }));

    // 2. Migração única: sobe as salas que só existiam neste navegador
    if (!localStorage.getItem(migratedKey(user.uid))) {
      for (const c of local) {
        if (remote.has(c.id) || !isManager(c, user)) continue;
        try {
          await setDoc(doc(db, 'campaigns', c.id), toCloud(c));
          remote.set(c.id, { ...c, players: [] });
        } catch (err) {
          console.warn('Falha ao migrar a campanha para a nuvem:', c.id, err);
        }
      }
      localStorage.setItem(migratedKey(user.uid), '1');
    }

    // 3. Jogadores de cada sala própria (garante também a chave de sala na nuvem)
    await Promise.all(Array.from(remote.values()).map(async c => {
      if (!c.joinKey) {
        c.joinKey = generateJoinKey();
        await updateDoc(doc(db, 'campaigns', c.id), { joinKey: c.joinKey });
      }
      c.players = await ensureRoomKey(c);
    }));

    // 4. Salas em que o usuário entrou como jogador
    const memberKeys = await getDocs(query(collection(db, 'roomKeys'), where('playerIds', 'array-contains', user.uid)));
    const memberCampaigns: Campaign[] = [];
    await Promise.all(memberKeys.docs.map(async k => {
      const data = k.data() as RoomKeyDoc;
      if (remote.has(data.campaignId)) return;
      try {
        const snap = await getDoc(doc(db, 'campaigns', data.campaignId));
        if (snap.exists()) {
          memberCampaigns.push({ ...(snap.data() as Campaign), id: snap.id, players: data.players || [] });
        }
      } catch (err) {
        console.warn('Sem acesso à sala:', data.campaignId, err);
      }
    }));
    memberCampaigns.forEach(c => remote.set(c.id, c));

    // Se houve edição local pendente, não sobrescreve (será enviada primeiro)
    if (flushTimer || flushing) return false;

    const merged = Array.from(remote.values());
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(local));
    } catch {
      // backup é só uma salvaguarda; ignora se estourar a cota
    }
    storageService.saveCampaigns(merged, true);

    synced.clear();
    merged.forEach(c => rememberSynced(c, isManager(c, user)));
    pulled = true;
    return true;
  } catch (err) {
    console.warn('Falha ao baixar as campanhas da nuvem (mantendo dados locais):', err);
    return false;
  }
}

// ---------- Chave de sala ----------

async function joinByKey(user: UserProfile, rawKey: string): Promise<{ success: boolean; error?: string; campaignId?: string }> {
  const key = normalizeJoinKey(rawKey);
  if (!key) return { success: false, error: 'Chave inválida. Use o formato XXXX-XXXX.' };
  if (!(await cloudReady(user))) return storageService.joinCampaignByKey(user, rawKey);

  const ref = doc(db, 'roomKeys', key);
  try {
    const campaignId = await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new RoomError('Nenhuma sala encontrada com essa chave.');
      const data = snap.data() as RoomKeyDoc;
      if (data.masterId === user.uid) throw new RoomError('Você é o mestre desta sala.');
      const ids = data.playerIds || [];
      if (ids.includes(user.uid)) return data.campaignId;
      if (ids.length >= MAX_PLAYERS) throw new RoomError(`Sala cheia (${MAX_PLAYERS}/${MAX_PLAYERS} jogadores).`);
      const player: RoomPlayer = { uid: user.uid, name: user.displayName, joinedAt: new Date().toISOString() };
      tx.update(ref, { playerIds: [...ids, user.uid], players: [...(data.players || []), player] });
      return data.campaignId;
    });
    await pull(user);
    return { success: true, campaignId };
  } catch (err: any) {
    if (err instanceof RoomError) return { success: false, error: err.message };
    if (err?.code === 'permission-denied') {
      return { success: false, error: `Não foi possível entrar: a sala pode estar cheia (limite de ${MAX_PLAYERS} jogadores).` };
    }
    console.warn('Erro ao entrar na sala:', err);
    return { success: false, error: 'Não foi possível entrar na sala agora. Tente novamente.' };
  }
}

// Jogador saindo da sala ou mestre removendo um jogador
async function removePlayer(campaign: Campaign, playerUid: string, user: UserProfile): Promise<{ success: boolean; error?: string }> {
  if (!(await cloudReady(user)) || !campaign.joinKey) {
    return storageService.removePlayer(campaign.id, playerUid, user);
  }
  const ref = doc(db, 'roomKeys', campaign.joinKey);
  try {
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data() as RoomKeyDoc;
      tx.update(ref, {
        playerIds: (data.playerIds || []).filter(id => id !== playerUid),
        players: (data.players || []).filter(p => p.uid !== playerUid),
      });
    });
    if (!(await pull(user))) {
      storageService.removePlayer(campaign.id, playerUid, user);
    }
    return { success: true };
  } catch (err) {
    console.warn('Erro ao remover jogador:', err);
    return { success: false, error: 'Não foi possível concluir agora. Tente novamente.' };
  }
}

// Nova chave: a anterior deixa de funcionar para novos jogadores; quem já entrou continua na sala
async function regenerateKey(campaign: Campaign, user: UserProfile): Promise<{ success: boolean; error?: string }> {
  if (!(await cloudReady(user)) || !campaign.joinKey) {
    return storageService.regenerateJoinKey(campaign.id, user);
  }
  const oldKey = campaign.joinKey;
  const newKey = generateJoinKey();
  try {
    const oldRef = doc(db, 'roomKeys', oldKey);
    const oldSnap = await getDoc(oldRef);
    const players = oldSnap.exists() ? (oldSnap.data() as RoomKeyDoc).players || [] : [];
    await setDoc(doc(db, 'roomKeys', newKey), roomKeyFor(campaign, players));
    await updateDoc(doc(db, 'campaigns', campaign.id), { joinKey: newKey });
    await deleteDoc(oldRef);

    // Atualiza o cache local sem disparar um novo envio
    const list = storageService.getCampaigns();
    const target = list.find(c => c.id === campaign.id);
    if (target) {
      target.joinKey = newKey;
      storageService.saveCampaigns(list, true);
      rememberSynced(target, true);
    }
    return { success: true };
  } catch (err) {
    console.warn('Erro ao gerar nova chave:', err);
    return { success: false, error: 'Não foi possível gerar a nova chave agora. Tente novamente.' };
  }
}

// ---------- Ciclo de vida ----------

storageService.campaignsListener = () => {
  if (activeUser) scheduleFlush();
};

function setUser(user: UserProfile | null) {
  if (activeUser?.uid !== user?.uid) {
    pulled = false;
    synced.clear();
    flushRetries = 0;
  }
  activeUser = user;
}

export const cloudCampaigns = { setUser, pull, joinByKey, removePlayer, regenerateKey };
