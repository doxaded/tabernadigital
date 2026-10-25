import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CampaignsView } from './components/CampaignsView';
import { EditorialTelasView } from './components/EditorialTelasView';
import { EditorialTaberneiroView } from './components/EditorialTaberneiroView';
import { EditorialBardosView } from './components/EditorialBardosView';
import { EditorialBazarView } from './components/EditorialBazarView';
import { UserProfileModal } from './components/UserProfileModal';
import { TavernShopModal } from './components/TavernShopModal';
import { MasterScreenView } from './components/MasterScreenView';
import { storageService, ADMIN_EMAIL } from './services/storage';
import { firebaseAuthService, db, auth, isLiveFirebaseConfigured } from './services/firebase';
import { cloudCampaigns } from './services/cloudCampaigns';
import { tavernAudio } from './services/tavernAudio';
import { Campaign, CharacterSheet, LoreEntry, RuleDocument, SketchAsset, UserProfile } from './types';

export type RoomId = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface RoomConfig {
  id: RoomId;
  name: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  imageUrl: string;
}

export const ROOMS: Record<RoomId, RoomConfig> = {
  I: {
    id: 'I',
    name: 'Mesa dos Apostadores',
    subtitle: 'I. Mesa dos Apostadores',
    bgColor: '#DEC29B', // Pergaminho / Bege Lareira
    textColor: '#2A1B12', // Marrom Café Escuro
    borderColor: 'rgba(42, 27, 18, 0.15)',
    imageUrl: '/assets/banner_mesa_alchemist.png', // Ilustração do alquimista & orbe enviada pelo usuário
  },
  II: {
    id: 'II',
    name: 'Telas do Alaúde',
    subtitle: 'II. Telas do Alaúde',
    bgColor: '#C49A6C', // Camurça / Madeira Clara
    textColor: '#1F120B', // Ébano Quente
    borderColor: 'rgba(31, 18, 11, 0.15)',
    imageUrl: '/assets/banner_telas_alaude.jpg', // Pintura renascentista do bardo com alaúde
  },
  III: {
    id: 'III',
    name: 'Taberneiro',
    subtitle: 'III. Taberneiro',
    bgColor: '#8C4A27', // Brasa de Lareira / Terracota Amadeirado
    textColor: '#F5E6D3', // Creme Pergaminho
    borderColor: 'rgba(245, 230, 211, 0.18)',
    imageUrl: '/assets/banner_urd_taberneiro.jpg', // Pintura de Urd brindando com a caneca
  },
  IV: {
    id: 'IV',
    name: 'Recanto dos Bardos',
    subtitle: 'IV. Recanto dos Bardos',
    bgColor: '#3B2216', // Mogno Envelhecido / Madeira Escura
    textColor: '#E6CCB2', // Bege Suave
    borderColor: 'rgba(230, 204, 178, 0.18)',
    imageUrl: '/assets/tavern_bg.jpg', // Pintura do salão da taverna à luz de tochas
  },
  V: {
    id: 'V',
    name: 'Bazar da Taverna',
    subtitle: 'V. Bazar da Taverna',
    bgColor: '#1C120C', // Ébano / Carvão com Ouro Velho
    textColor: '#D4A359', // Ouro Velho
    borderColor: 'rgba(212, 163, 89, 0.18)',
    imageUrl: '/assets/banner_bazar_treasury.jpg', // Pintura a óleo renascentista da tesouraria
  },
};

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const existing = storageService.getCurrentUser();
    if (existing) return existing;
    const all = storageService.getUsers();
    const fallback = all[0] || null;
    if (fallback) {
      storageService.setCurrentUser(fallback);
    }
    return fallback;
  });
  const [users, setUsers] = useState<UserProfile[]>(() => storageService.getUsers());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storageService.getCampaigns());
  const [sketches, setSketches] = useState<SketchAsset[]>(() => storageService.getSketches());
  const [urdMessages, setUrdMessages] = useState(() => storageService.getUrdMessages());

  // Navegação em Dois Níveis: 'gallery' (Display Principal) e 'functional' (Interior da Sala)
  const [viewMode, setViewMode] = useState<'gallery' | 'functional'>('gallery');
  const [activeRoom, setActiveRoom] = useState<RoomId>('I');
  const [hoveredRoom, setHoveredRoom] = useState<RoomId | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(() => campaigns[0]?.id || null);
  const [masterScreenCampaignId, setMasterScreenCampaignId] = useState<string | null>(null);

  // Modais
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLegacyShopOpen, setIsLegacyShopOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<UserProfile | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(tavernAudio.isPlaying());

  // Sincroniza estado de áudio da taberna
  useEffect(() => {
    const unsub = tavernAudio.subscribe((playing) => {
      setIsAudioPlaying(playing);
    });
    return () => unsub();
  }, []);

  // Sincroniza dados com o storage
  const reloadData = async () => {
    const allUsers = await firebaseAuthService.getAllUsers();
    setUsers(allUsers);
    setCampaigns(storageService.getCampaigns());
    setSketches(storageService.getSketches());
    setUrdMessages(storageService.getUrdMessages());
    const refreshedCurrent = storageService.getCurrentUser();
    setCurrentUser(refreshedCurrent);
  };

  useEffect(() => {
    reloadData();

    // Auto-login silencioso se houver credenciais salvas
    const localUser = storageService.getCurrentUser();
    if (localUser) {
      const unsubscribe = firebaseAuthService.subscribeAuthState(async (fbUser) => {
        if (!fbUser) {
          const passwords = storageService.getPasswords();
          const localPass = passwords[localUser.email.toLowerCase()];
          if (localPass) {
            try {
              await firebaseAuthService.loginWithEmail(localUser.email, localPass);
              reloadData();
            } catch (err) {
              console.warn('Falha na auto-recuperação da sessão:', err);
            }
          }
        }
        unsubscribe();
      });
    }
  }, []);

  // Sincroniza campanhas com a nuvem (Firestore)
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'APPROVED') {
      cloudCampaigns.setUser(null);
      return;
    }
    cloudCampaigns.setUser(currentUser);
    let cancelled = false;
    const run = async () => {
      const updated = await cloudCampaigns.pull(currentUser);
      if (updated && !cancelled) setCampaigns(storageService.getCampaigns());
    };
    run();
    const interval = setInterval(run, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.status]);

  // Filtra campanhas visíveis
  const visibleCampaigns = currentUser
    ? campaigns.filter(c =>
        currentUser.role === 'admin' ||
        c.masterId === currentUser.uid ||
        !!c.players?.some(p => p.uid === currentUser.uid)
      )
    : [];

  const handleLogout = async () => {
    await firebaseAuthService.logout();
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsAuthModalOpen(false);
  };

  const handleApproveUser = async (uid: string) => {
    if (!currentUser) return;
    const ok = await firebaseAuthService.approveUser(uid, currentUser.email);
    if (ok) reloadData();
  };

  const handleRejectUser = async (uid: string) => {
    if (!currentUser) return;
    const ok = await firebaseAuthService.rejectUser(uid, currentUser.email);
    if (ok) reloadData();
  };

  // Handlers de Campanhas
  const handleCreateCampaign = (name: string, description: string, system: string, coverUrl?: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const res = storageService.createCampaign(currentUser, name, description, system, coverUrl);
    if (res.success) {
      reloadData();
      if (res.campaign) {
        setSelectedCampaignId(res.campaign.id);
      }
    }
    return res;
  };

  const handleUpdateCampaign = (id: string, data: Partial<Pick<Campaign, 'name' | 'coverUrl' | 'description' | 'system'>>) => {
    if (!currentUser) return;
    storageService.updateCampaign(id, currentUser, data);
    reloadData();
  };

  const handleDeleteCampaign = (id: string) => {
    if (!currentUser) return;
    storageService.deleteCampaign(id, currentUser);
    reloadData();
    const remaining = storageService.getCampaigns().filter(c =>
      currentUser.role === 'admin' ||
      c.masterId === currentUser.uid ||
      !!c.players?.some(p => p.uid === currentUser.uid)
    );
    setSelectedCampaignId(remaining[0]?.id || null);
  };

  const handleJoinByKey = async (rawKey: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const res = await cloudCampaigns.joinByKey(currentUser, rawKey);
    if (res.success) {
      setCampaigns(storageService.getCampaigns());
      if (res.campaignId) setSelectedCampaignId(res.campaignId);
    }
    return res;
  };

  const handleRegenerateKey = async (campaignId: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const campaign = storageService.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };
    const res = await cloudCampaigns.regenerateKey(campaign, currentUser);
    setCampaigns(storageService.getCampaigns());
    return res;
  };

  const handleRemovePlayer = async (campaignId: string, playerUid: string) => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    const campaign = storageService.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };
    const res = await cloudCampaigns.removePlayer(campaign, playerUid, currentUser);
    setCampaigns(storageService.getCampaigns());
    if (res.success && playerUid === currentUser.uid) {
      const remaining = storageService.getCampaigns().filter(c =>
        currentUser.role === 'admin' ||
        c.masterId === currentUser.uid ||
        !!c.players?.some(p => p.uid === currentUser.uid)
      );
      setSelectedCampaignId(remaining[0]?.id || null);
    }
    return res;
  };

  // Handlers de Divisórias (Fichas, Lore, Regras)
  const handleAddSheet = (campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>) => {
    storageService.addSheet(campaignId, sheet);
    reloadData();
  };

  const handleUpdateSheet = (campaignId: string, sheetId: string, data: Partial<CharacterSheet>) => {
    storageService.updateSheet(campaignId, sheetId, data);
    reloadData();
  };

  const handleDeleteSheet = (campaignId: string, sheetId: string) => {
    storageService.deleteSheet(campaignId, sheetId);
    reloadData();
  };

  const handleAddLore = (campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>) => {
    storageService.addLore(campaignId, lore);
    reloadData();
  };

  const handleDeleteLore = (campaignId: string, loreId: string) => {
    storageService.deleteLore(campaignId, loreId);
    reloadData();
  };

  const handleUpdateLore = (campaignId: string, loreId: string, data: Partial<LoreEntry>) => {
    storageService.updateLore(campaignId, loreId, data);
    reloadData();
  };

  const handleUpdateRule = (campaignId: string, ruleId: string, data: Partial<RuleDocument>) => {
    storageService.updateRule(campaignId, ruleId, data);
    reloadData();
  };

  const handleAddRule = (campaignId: string, rule: Omit<RuleDocument, 'id' | 'campaignId'>) => {
    storageService.addRule(campaignId, rule);
    reloadData();
  };

  const handleDeleteRule = (campaignId: string, ruleId: string) => {
    storageService.deleteRule(campaignId, ruleId);
    reloadData();
  };

  // Handlers do Sketch Studio
  const handleSaveSketch = (sketch: Omit<SketchAsset, 'id' | 'createdAt'>) => {
    const item = storageService.saveSketch(sketch);
    reloadData();
    return item;
  };

  const handleDeleteSketch = (id: string) => {
    storageService.deleteSketch(id);
    reloadData();
  };

  // Handlers do Urd
  const handleSendUrdMessage = (sender: 'user' | 'urd', text: string) => {
    storageService.addUrdMessage(sender, text);
    reloadData();
  };

  const handleClearUrdChat = () => {
    storageService.clearUrdChat();
    reloadData();
  };

  // Handlers de Perfil
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = storageService.updateUserProfile(currentUser.uid, updates);
    if (updated) {
      setCurrentUser(updated);
      setProfileModalUser(updated);
    }
    if (isLiveFirebaseConfigured && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          ...updates,
        });
        if (updates.displayName || updates.photoURL) {
          await updateProfile(auth.currentUser, {
            displayName: updates.displayName || auth.currentUser.displayName || undefined,
            photoURL: updates.photoURL || auth.currentUser.photoURL || undefined
          });
        }
      } catch (err) {
        console.warn('Falha ao sincronizar perfil com o Firestore:', err);
      }
    }
    reloadData();
  };

  const handleStartDirectChat = (_targetUser: UserProfile) => {
    setIsProfileModalOpen(false);
    setActiveRoom('IV'); // Recanto dos Bardos
    setViewMode('functional');
  };

  const handleSelectRoom = (roman: RoomId) => {
    tavernAudio.playBellChime();
    if (activeRoom === roman) {
      // Se clicar no numeral da sala já ativa: se estiver no modo funcional, volta para a galeria!
      setViewMode(prev => (prev === 'functional' ? 'gallery' : 'functional'));
    } else {
      setActiveRoom(roman);
      setViewMode('gallery');
    }
    setMasterScreenCampaignId(null);
  };

  const currentTheme = ROOMS[activeRoom];

  return (
    <div
      className="min-h-screen w-full transition-colors duration-700 ease-in-out relative flex flex-col"
      style={{
        backgroundColor: currentTheme.bgColor,
        color: currentTheme.textColor,
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      }}
    >
      {/* ========================================================
          1. CABEÇALHO SUPERIOR MINIMALISTA (TOP NAVIGATION)
          fixed top-0 left-0 w-full px-10 py-7 flex justify-between items-center z-50
          Totalmente limpo, sem linhas divisórias e com fundo transparente.
          ======================================================== */}
      <nav
        className="fixed top-0 left-0 w-full px-6 sm:px-10 py-6 sm:py-7 flex justify-between items-center z-50 pointer-events-auto"
        style={{
          backgroundColor: 'transparent',
          color: currentTheme.textColor,
          transition: 'color 700ms ease-in-out',
        }}
      >
        {/* Canto Superior Esquerdo: Texto MENU */}
        <button
          onClick={() => {
            tavernAudio.playBellChime();
            setIsMenuOpen(true);
          }}
          className="hover:opacity-60 transition-opacity duration-300 cursor-pointer"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            color: 'inherit',
            padding: 0,
            margin: 0,
          }}
          title="Abrir Menu Principal"
        >
          MENU
        </button>

        {/* Centro (Navegação das Salas em Algarismos Romanos): I   II   III   IV   V */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-6 sm:gap-12">
            {(['I', 'II', 'III', 'IV', 'V'] as RoomId[]).map((roman) => {
              const isActive = activeRoom === roman;
              return (
                <button
                  key={roman}
                  onClick={() => handleSelectRoom(roman)}
                  onMouseEnter={() => setHoveredRoom(roman)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive ? 'opacity-100 font-bold scale-110' : 'opacity-30 hover:opacity-70'
                  }`}
                  style={{
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                    fontSize: '24px',
                    letterSpacing: '0.08em',
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    padding: '2px 4px',
                  }}
                  title={ROOMS[roman].name}
                >
                  {roman}
                </button>
              );
            })}
          </div>

          {/* Nome da sala sutil e elegante */}
          <div
            className="text-center transition-all duration-300 pointer-events-none mt-1"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '13px',
              letterSpacing: '0.14em',
              opacity: 0.8,
              height: '16px',
              whiteSpace: 'nowrap',
            }}
          >
            {hoveredRoom ? ROOMS[hoveredRoom].subtitle : ROOMS[activeRoom].subtitle}
          </div>
        </div>

        {/* Canto Superior Direito: Texto JOGADOR */}
        <button
          onClick={() => {
            tavernAudio.playBellChime();
            if (currentUser) {
              setProfileModalUser(currentUser);
              setIsProfileModalOpen(true);
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          className="hover:opacity-60 transition-opacity duration-300 cursor-pointer"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            color: 'inherit',
            padding: 0,
            margin: 0,
          }}
          title={currentUser ? `Perfil de ${currentUser.displayName || currentUser.email}` : 'Entrar na Taberna'}
        >
          JOGADOR
        </button>
      </nav>

      {/* ========================================================
          DOIS NÍVEIS DE NAVEGAÇÃO:
          NÍVEL 1: MODO GALERIA (DISPLAY PRINCIPAL)
          NÍVEL 2: MODO FUNCIONAL (INTERIOR DA SALA)
          ======================================================== */}
      <main
        className="flex-1 flex flex-col items-center justify-center min-h-screen w-full relative"
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Caso especial: Usuário pendente */}
        {currentUser && currentUser.status === 'PENDING' ? (
          <div className="max-w-md mx-auto text-center px-6">
            <PendingApprovalScreen
              user={currentUser}
              onRefresh={reloadData}
              onLogout={handleLogout}
            />
          </div>
        ) : masterScreenCampaignId ? (
          /* Tela do Mestre para a mesa selecionada */
          (() => {
            const targetCampaign = visibleCampaigns.find(c => c.id === masterScreenCampaignId) || visibleCampaigns[0];
            const isMasterOfCampaign = targetCampaign && (targetCampaign.masterId === currentUser?.uid || currentUser?.role === 'admin');
            if (!isMasterOfCampaign) {
              return (
                <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
                    Acesso Restrito ao Mestre da Sala
                  </h3>
                  <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '24px' }}>
                    Apenas o criador da sala possui acesso aos pergaminhos secretos desta mesa.
                  </p>
                  <button
                    onClick={() => setMasterScreenCampaignId(null)}
                    style={{
                      background: 'none',
                      border: `1px solid ${currentTheme.textColor}`,
                      padding: '8px 20px',
                      color: 'inherit',
                      fontFamily: 'inherit',
                      letterSpacing: '0.15em',
                      cursor: 'pointer',
                    }}
                  >
                    Voltar à Mesa
                  </button>
                </div>
              );
            }
            return (
              <div className="w-full pt-24 pb-12">
                <MasterScreenView
                  campaign={targetCampaign}
                  currentUser={currentUser || { uid: 'guest', email: 'visitante@taberna.rpg', displayName: 'Viajante', role: 'user', status: 'APPROVED', gold: 50, createdAt: new Date().toISOString() }}
                  onBackToCampaign={() => setMasterScreenCampaignId(null)}
                  onAddLore={handleAddLore}
                />
              </div>
            );
          })()
        ) : viewMode === 'gallery' ? (
          /* ========================================================
             NÍVEL 1 — DISPLAY PRINCIPAL (MODO CAPA / GALERIA MINIMALISTA)
             - Título da Sala em tipografia serifada elegante e discreta acima da imagem
             - Imagem Central (Quadro/Pintura renascentista/dark fantasy) perfeitamente centralizada
             - Ocupando o centro e deixando ~70% de espaço negativo ao redor
             - Micro-legenda no hover: 'Clique para adentrar'
             ======================================================== */
          <div className="flex-1 flex flex-col items-center justify-center min-h-screen w-full relative px-6 select-none animate-fade-in">
            {/* Título da Sala discreto e elegante acima da imagem */}
            <h1
              className="text-lg sm:text-xl md:text-2xl font-normal tracking-widest uppercase mb-6 sm:mb-8 text-center"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                letterSpacing: '0.24em',
                opacity: 0.88,
              }}
            >
              {currentTheme.subtitle}
            </h1>

            {/* Imagem Central (Quadro/Pintura renascentista) */}
            <div
              onClick={() => {
                tavernAudio.playToastSound();
                setViewMode('functional');
              }}
              className="group relative cursor-pointer flex flex-col items-center"
              title={`Clique para adentrar em ${currentTheme.name}`}
            >
              <div
                className="relative overflow-hidden transition-all duration-700 ease-out"
                style={{
                  width: 'clamp(260px, 30vw, 360px)',
                  height: 'clamp(280px, 36vw, 400px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.22)',
                }}
              >
                <img
                  src={currentTheme.imageUrl}
                  alt={currentTheme.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    filter: 'contrast(1.02) saturate(1.02)',
                  }}
                />
              </div>

              {/* Micro-legenda sutil abaixo da imagem no hover */}
              <div
                className="mt-6 text-xs sm:text-sm tracking-widest uppercase opacity-0 group-hover:opacity-75 transition-opacity duration-300 text-center pointer-events-none"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  letterSpacing: '0.25em',
                  fontStyle: 'italic',
                }}
              >
                Clique para adentrar
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             NÍVEL 2 — MODO FUNCIONAL (INTERIOR DA SALA)
             - Mantém a mesma cor de fundo e texto da sala
             - Botão textual discreto ← VOLTAR À GALERIA
             - Ferramentas limpas, sem botões brancos sólidos ou caixas pesadas
             - Deixando pelo menos 60% de espaço negativo ao redor
             ======================================================== */
          <div className="w-full flex-1 flex flex-col items-center animate-fade-in pb-16">
            {/* Barra de Retorno à Galeria */}
            <div className="w-full max-w-4xl mx-auto px-6 pt-24 pb-4 flex items-center justify-between">
              <button
                onClick={() => {
                  tavernAudio.playBellChime();
                  setViewMode('gallery');
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-widest uppercase hover:opacity-60 transition-opacity cursor-pointer"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  letterSpacing: '0.2em',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                <span>← Voltar à Galeria</span>
              </button>

              <span
                className="text-xs tracking-widest uppercase opacity-50 italic"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
              >
                {currentTheme.name}
              </span>
            </div>

            {/* SALA I — MESA DOS APOSTADORES */}
            {activeRoom === 'I' && (
              <div className="w-full flex justify-center">
                <CampaignsView
                  hideHeader={true}
                  campaigns={visibleCampaigns}
                  currentUser={currentUser || { uid: 'guest', email: 'viajante@taberna.rpg', displayName: 'Viajante Convidado', role: 'user', status: 'APPROVED', gold: 50, createdAt: new Date().toISOString() }}
                  selectedCampaignId={selectedCampaignId}
                  onSelectCampaign={setSelectedCampaignId}
                  onJoinByKey={handleJoinByKey}
                  onRegenerateKey={handleRegenerateKey}
                  onRemovePlayer={handleRemovePlayer}
                  onCreateCampaign={handleCreateCampaign}
                  onUpdateCampaign={handleUpdateCampaign}
                  onDeleteCampaign={handleDeleteCampaign}
                  onAddSheet={handleAddSheet}
                  onUpdateSheet={handleUpdateSheet}
                  onDeleteSheet={handleDeleteSheet}
                  onAddLore={handleAddLore}
                  onDeleteLore={handleDeleteLore}
                  onUpdateLore={handleUpdateLore}
                  onAddRule={handleAddRule}
                  onDeleteRule={handleDeleteRule}
                  onUpdateRule={handleUpdateRule}
                  onOpenMasterScreen={(campId) => setMasterScreenCampaignId(campId)}
                  onOpenShop={() => {
                    setActiveRoom('V');
                    setViewMode('functional');
                  }}
                  onOpenMyProfile={() => {
                    if (currentUser) {
                      setProfileModalUser(currentUser);
                      setIsProfileModalOpen(true);
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  onOpenAdmin={() => setIsAdminModalOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              </div>
            )}

            {/* SALA II — TELAS DO ALAÚDE */}
            {activeRoom === 'II' && (
              <div className="w-full flex justify-center">
                <EditorialTelasView
                  sketches={sketches}
                  campaigns={visibleCampaigns}
                  activeCampaignId={selectedCampaignId}
                  onSaveSketch={handleSaveSketch}
                  onDeleteSketch={handleDeleteSketch}
                />
              </div>
            )}

            {/* SALA III — TABERNEIRO */}
            {activeRoom === 'III' && (
              <div className="w-full flex justify-center">
                <EditorialTaberneiroView
                  messages={urdMessages}
                  campaigns={visibleCampaigns}
                  activeCampaignId={selectedCampaignId}
                  onSendMessage={handleSendUrdMessage}
                  onAddToLore={(campaignId, title, content) => {
                    handleAddLore(campaignId, {
                      title,
                      content,
                      category: 'rumores',
                      author: 'Urd, o Taberneiro',
                      tags: ['Oráculo Urd', 'Boato de Taberna'],
                    });
                  }}
                  onClearChat={handleClearUrdChat}
                />
              </div>
            )}

            {/* SALA IV — RECANTO DOS BARDOS */}
            {activeRoom === 'IV' && (
              <div className="w-full flex justify-center">
                <EditorialBardosView
                  currentUser={currentUser}
                  campaigns={visibleCampaigns}
                  allUsers={users}
                  onOpenProfile={(u) => {
                    setProfileModalUser(u);
                    setIsProfileModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* SALA V — BAZAR DA TAVERNA */}
            {activeRoom === 'V' && (
              <div className="w-full flex justify-center">
                <EditorialBazarView
                  currentUser={currentUser}
                  onSaveProfile={handleSaveProfile}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          MENU MODAL EDITORIAL MINIMALISTA
          ======================================================== */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in"
          style={{
            backgroundColor: 'rgba(20, 12, 8, 0.88)',
            backdropFilter: 'blur(10px)',
            color: '#F5E6D3',
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-md text-center py-10 px-8 relative"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título do Menu */}
            <h2
              className="text-2xl font-semibold tracking-widest uppercase mb-1"
              style={{ letterSpacing: '0.25em' }}
            >
              TABERNA DIGITAL
            </h2>
            <p className="italic text-sm opacity-60 mb-8" style={{ letterSpacing: '0.08em' }}>
              Salões & Crônicas Medievais
            </p>

            {/* Links das 5 Salas */}
            <div className="flex flex-col gap-5 mb-8">
              {(['I', 'II', 'III', 'IV', 'V'] as RoomId[]).map((roman) => {
                const room = ROOMS[roman];
                const isActive = activeRoom === roman;
                return (
                  <button
                    key={roman}
                    onClick={() => {
                      setActiveRoom(roman);
                      setViewMode('gallery');
                      setMasterScreenCampaignId(null);
                      tavernAudio.playBellChime();
                      setIsMenuOpen(false);
                    }}
                    className="group flex items-center justify-between py-2 border-b transition-all duration-300 cursor-pointer"
                    style={{
                      borderColor: isActive ? '#DEC29B' : 'rgba(245, 230, 211, 0.12)',
                      background: 'none',
                      color: isActive ? '#DEC29B' : '#F5E6D3',
                    }}
                  >
                    <span className="text-xl font-bold tracking-wider">{roman}</span>
                    <span className="text-base tracking-widest uppercase group-hover:translate-x-1 transition-transform duration-300">
                      {room.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ações Secundárias */}
            <div className="flex flex-col gap-3 pt-4 border-t border-amber-900/30 text-sm tracking-wider uppercase">
              <button
                onClick={async () => {
                  const state = await tavernAudio.toggle();
                  setIsAudioPlaying(state);
                }}
                className="py-2 hover:opacity-75 transition-opacity cursor-pointer"
                style={{ background: 'none', border: 'none', color: 'inherit' }}
              >
                Música do Alaúde & Lareira: {isAudioPlaying ? 'Tocando' : 'Silenciada'}
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAdminModalOpen(true);
                  }}
                  className="py-2 hover:opacity-75 transition-opacity cursor-pointer text-amber-400"
                  style={{ background: 'none', border: 'none' }}
                >
                  Painel de Administração
                </button>
              )}

              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="py-2 hover:opacity-75 transition-opacity cursor-pointer"
                    style={{ background: 'none', border: 'none', color: 'inherit' }}
                  >
                    Trocar Senha
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="py-2 hover:opacity-75 transition-opacity cursor-pointer text-red-300/80"
                    style={{ background: 'none', border: 'none' }}
                  >
                    Abandonar a Taverna (Sair)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="py-2 hover:opacity-75 transition-opacity cursor-pointer text-amber-200"
                  style={{ background: 'none', border: 'none' }}
                >
                  Entrar / Criar Personagem
                </button>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(false)}
              className="mt-6 text-xs uppercase tracking-widest opacity-40 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'inherit' }}
            >
              [ Fechar Menu ]
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAIS GLOBAIS
          ======================================================== */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          reloadData();
        }}
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        users={users}
        campaigns={campaigns}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        targetUser={profileModalUser}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onStartDirectChat={handleStartDirectChat}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenShop={() => {
          setActiveRoom('V');
          setViewMode('functional');
        }}
        onLogout={handleLogout}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {isLegacyShopOpen && (
        <TavernShopModal
          isOpen={isLegacyShopOpen}
          onClose={() => setIsLegacyShopOpen(false)}
          currentUser={currentUser}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );
}
export default App;
