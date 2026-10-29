import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, isLiveFirebaseConfigured } from './firebase';
import { storageService } from './storage';
import { masterOracleService } from './masterOracleService';
import { Campaign, ChatChannel, ChatDiceResult, ChatMessage, ChatScope, UserProfile } from '../types';

export const chatService = {
  // Gera ID determinístico para DMs (1-on-1)
  getDirectChannelId(uidA: string, uidB: string): string {
    const sorted = [uidA, uidB].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  },

  // Gera ID para canal público da campanha
  getCampaignPublicChannelId(campaignId: string): string {
    return `camp_${campaignId}_public`;
  },

  // Gera ID para sussurro secreto (Mestre <-> Jogador na campanha)
  getCampaignPrivateChannelId(campaignId: string, uidA: string, uidB: string): string {
    const sorted = [uidA, uidB].sort();
    return `camp_${campaignId}_whisper_${sorted[0]}_${sorted[1]}`;
  },

  // Constrói e organiza todos os canais visíveis para o usuário atual
  buildChannels(
    currentUser: UserProfile,
    campaigns: Campaign[],
    allUsers: UserProfile[]
  ): {
    campaignPublic: ChatChannel[];
    campaignPrivate: ChatChannel[];
    direct: ChatChannel[];
    favorites: ChatChannel[];
    rooms: ChatChannel[];
    allChannels: ChatChannel[];
  } {
    const allStoredMessages = storageService.getChatMessages();
    const getLastMsg = (channelId: string) => {
      const msgs = allStoredMessages.filter(m => m.channelId === channelId);
      return msgs[msgs.length - 1];
    };

    // 1. Canais Públicos de Campanhas (Mesa Geral)
    const campaignPublic: ChatChannel[] = campaigns.map(camp => {
      const channelId = this.getCampaignPublicChannelId(camp.id);
      const last = getLastMsg(channelId);
      const participantIds = [camp.masterId, ...(camp.players?.map(p => p.uid) || [])];

      return {
        id: channelId,
        type: 'campaign-public',
        title: `📢 ${camp.name}`,
        subtitle: `${camp.system} • ${participantIds.length} aventureiros no salão`,
        campaignId: camp.id,
        campaignName: camp.name,
        participants: participantIds,
        lastMessage: last ? (last.diceResult ? `🎲 ${last.senderName} rolou ${last.diceResult.expression} = ${last.diceResult.total}` : `${last.senderName}: ${last.text}`) : 'Nenhuma mensagem recente.',
        lastMessageAt: last?.createdAt || camp.createdAt,
        badgeColor: '#d97706',
      };
    });

    // 2. Canais Privados de Campanhas (Sussurros Mestre <-> Jogadores)
    const campaignPrivate: ChatChannel[] = [];
    campaigns.forEach(camp => {
      const isMaster = camp.masterId === currentUser.uid || currentUser.role === 'admin';

      if (isMaster) {
        // Se for o Mestre, ele tem um canal de sussurro com cada jogador da mesa
        camp.players?.forEach(player => {
          if (player.uid === currentUser.uid) return;
          const channelId = this.getCampaignPrivateChannelId(camp.id, currentUser.uid, player.uid);
          const last = getLastMsg(channelId);
          campaignPrivate.push({
            id: channelId,
            type: 'campaign-private',
            title: `🤫 Sussurros: ${player.name}`,
            subtitle: `Segredos e tramas confidenciais na mesa "${camp.name}"`,
            campaignId: camp.id,
            campaignName: camp.name,
            participants: [camp.masterId, player.uid],
            lastMessage: last ? `${last.senderName}: ${last.text}` : 'Canal de sussurros privado pronto.',
            lastMessageAt: last?.createdAt,
            badgeColor: '#dc2626',
          });
        });
      } else {
        // Se for jogador, tem o canal de sussurro direto com o Mestre da sala
        const channelId = this.getCampaignPrivateChannelId(camp.id, currentUser.uid, camp.masterId);
        const last = getLastMsg(channelId);
        campaignPrivate.push({
          id: channelId,
          type: 'campaign-private',
          title: `🤫 Sussurros com o Mestre (${camp.name})`,
          subtitle: `Converse em sigilo com ${camp.masterName}`,
          campaignId: camp.id,
          campaignName: camp.name,
          participants: [camp.masterId, currentUser.uid],
          lastMessage: last ? `${last.senderName}: ${last.text}` : 'Converse em particular com o Mestre.',
          lastMessageAt: last?.createdAt,
          badgeColor: '#dc2626',
        });
      }
    });

    // 3. Canais Diretos (Apenas para Contatos Adicionados pelo Usuário!)
    const direct: ChatChannel[] = [];
    const favorites: ChatChannel[] = [];
    const userContacts = storageService.getUserContacts(currentUser.uid);

    userContacts.forEach(contact => {
      const other = allUsers.find(u => u.uid === contact.uid);
      if (!other) return;
      const channelId = this.getDirectChannelId(currentUser.uid, other.uid);
      const last = getLastMsg(channelId);

      const ch: ChatChannel = {
        id: channelId,
        type: 'direct',
        title: contact.nickname || other.displayName,
        subtitle: `${other.title ? other.title + ' • ' : ''}${other.favoriteClass || 'Aventureiro'} #${other.userTag || contact.userTag}`,
        participants: [currentUser.uid, other.uid],
        lastMessage: last ? (last.diceResult ? `🎲 ${last.senderName} rolou ${last.diceResult.expression}` : `${last.senderName}: ${last.text}`) : 'Iniciar conversa particular.',
        lastMessageAt: last?.createdAt || contact.addedAt,
        badgeColor: other.customBadgeColor || '#7c3aed',
        directOtherUser: other,
        isFavorite: !!contact.isFavorite,
      };

      direct.push(ch);
      if (contact.isFavorite) {
        favorites.push(ch);
      }
    });

    // 4. Salas e Grupos de Conversa Customizados
    const userRooms = storageService.getCustomRooms(currentUser.uid);
    const rooms: ChatChannel[] = userRooms.map(room => {
      const channelId = `room_${room.id}`;
      const last = getLastMsg(channelId);
      const isOwner = room.creatorUid === currentUser.uid;
      const isAdmin = room.adminUids.includes(currentUser.uid);
      const roleLabel = isOwner ? 'Líder / Criador' : (isAdmin ? 'Administrador' : 'Membro');

      return {
        id: channelId,
        type: 'group',
        title: `${room.iconEmoji || '🛡️'} ${room.name}`,
        subtitle: `${room.memberUids.length} membros • ${roleLabel}`,
        participants: room.memberUids,
        lastMessage: last ? (last.diceResult ? `🎲 ${last.senderName} rolou ${last.diceResult.expression}` : `${last.senderName}: ${last.text}`) : (room.description || 'Sala de bate-papo da estalagem.'),
        lastMessageAt: last?.createdAt || room.updatedAt || room.createdAt,
        badgeColor: room.color || '#d97706',
        customRoom: room,
      };
    });

    // Ordena canais por atividade recente
    const sortByRecent = (a: ChatChannel, b: ChatChannel) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    };

    campaignPublic.sort(sortByRecent);
    campaignPrivate.sort(sortByRecent);
    direct.sort(sortByRecent);
    favorites.sort(sortByRecent);
    rooms.sort(sortByRecent);

    return {
      campaignPublic,
      campaignPrivate,
      direct,
      favorites,
      rooms,
      allChannels: [...rooms, ...direct, ...campaignPublic, ...campaignPrivate],
    };
  },

  // Envia mensagem em um canal (com suporte a rolagem de dados embutida)
  async sendMessage(params: {
    channelId: string;
    scope: ChatScope;
    text: string;
    currentUser: UserProfile;
    campaignId?: string;
    campaignName?: string;
    recipientUid?: string;
    recipientName?: string;
  }): Promise<ChatMessage> {
    const rawText = params.text.trim();
    if (!rawText) throw new Error('A mensagem não pode estar vazia.');

    let diceResult: ChatDiceResult | undefined = undefined;
    let messageText = rawText;

    // Detecta comandos de dados: /r 2d6+3, /roll 1d20, /d20, /dado 3d8
    const rollPattern = /^\/(?:r|roll|dado|d)\s*(.*)$/i;
    const match = rawText.match(rollPattern);
    
    if (match) {
      let diceExpr = match[1]?.trim();
      // Se digitou apenas "/d20" ou "/d6"
      if (!diceExpr && rawText.startsWith('/d')) {
        diceExpr = rawText.slice(1);
      }
      if (!diceExpr) diceExpr = '1d20';

      const roll = masterOracleService.rollDice(diceExpr);
      diceResult = {
        expression: roll.expression,
        rolls: roll.rolls,
        modifier: roll.modifier,
        total: roll.total,
        hasNat20: roll.hasNat20,
        hasNat1: roll.hasNat1,
      };
      messageText = `🎲 Rolou ${diceResult.expression}: **${diceResult.total}**${diceResult.hasNat20 ? ' — 🌟 Acerto Crítico!' : ''}${diceResult.hasNat1 ? ' — 💀 Falha Crítica!' : ''}`;
    }

    const message: ChatMessage = {
      id: 'chat-msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      channelId: params.channelId,
      scope: params.scope,
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      senderUid: params.currentUser.uid,
      senderName: params.currentUser.displayName,
      senderEmail: params.currentUser.email,
      senderTitle: params.currentUser.title,
      senderBadgeColor: params.currentUser.customBadgeColor || '#d97706',
      senderAvatarUrl: params.currentUser.photoURL,
      recipientUid: params.recipientUid,
      recipientName: params.recipientName,
      text: messageText,
      createdAt: new Date().toISOString(),
      diceResult,
    };

    // Salva localmente de forma síncrona
    storageService.saveChatMessage(message);

    // Se conectado ao Firebase, sincroniza com o Firestore
    if (isLiveFirebaseConfigured && auth.currentUser) {
      try {
        let participants: string[] = [];
        if (params.channelId.startsWith('dm_')) {
          participants = params.channelId.replace('dm_', '').split('_');
        } else if (params.channelId.startsWith('room_')) {
          const roomId = params.channelId.replace('room_', '');
          const room = storageService.getCustomRooms().find(r => r.id === roomId);
          participants = room ? room.memberUids : [params.currentUser.uid];
        } else if (params.recipientUid) {
          participants = [params.currentUser.uid, params.recipientUid];
        }

        await setDoc(doc(db, 'messages', message.id), {
          ...message,
          participants,
        });
      } catch (err) {
        console.warn('Falha ao enviar mensagem para o Firestore (mantido localmente):', err);
      }
    }

    return message;
  },

  // Inscreve-se para receber mensagens de um canal em tempo real
  subscribeChannel(channelId: string, onUpdate: (messages: ChatMessage[]) => void): () => void {
    // Carrega mensagens locais iniciais
    const local = storageService.getChatMessages(channelId);
    onUpdate(local);

    // Listener local para eventos da mesma aba / janelas
    const handleLocalEvent = () => {
      onUpdate(storageService.getChatMessages(channelId));
    };
    window.addEventListener('taberna-chat-updated', handleLocalEvent);

    let unsubscribeFirestore = () => {};

    // Listener de Firestore caso ativo
    if (isLiveFirebaseConfigured && auth.currentUser) {
      try {
        const q = query(
          collection(db, 'messages'),
          where('channelId', '==', channelId),
          limit(100)
        );

        unsubscribeFirestore = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudMsgs: ChatMessage[] = [];
              snapshot.forEach(docSnap => {
                cloudMsgs.push(docSnap.data() as ChatMessage);
              });
              
              // Mescla com locais
              const localMsgs = storageService.getChatMessages(channelId);
              const map = new Map<string, ChatMessage>();
              localMsgs.forEach(m => map.set(m.id, m));
              cloudMsgs.forEach(m => map.set(m.id, m));

              const merged = Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              onUpdate(merged);
            }
          },
          (err) => {
            console.warn('Erro na escuta do Firestore para chat:', err);
          }
        );
      } catch (err) {
        console.warn('Não foi possível iniciar onSnapshot do chat no Firestore:', err);
      }
    }

    return () => {
      window.removeEventListener('taberna-chat-updated', handleLocalEvent);
      unsubscribeFirestore();
    };
  }
};
