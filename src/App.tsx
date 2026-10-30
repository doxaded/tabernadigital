import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { 
  X, Music, Shield, KeyRound, Home, LogOut, LogIn, Trash2, Crown, ChevronRight 
} from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
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
  description: string;
  inscriptionLeft: string;
  inscriptionRight: string;
  inscription?: string;
  bgColor: string;
  cardColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  imageUrl: string;
}

export const ROOMS: Record<RoomId, RoomConfig> = {
  I: {
    id: 'I',
    name: 'Mesa dos Apostadores',
    subtitle: 'I. Mesa dos Apostadores',
    description: 'Um salão medieval onde você pode se juntar a aventureiros ou mestrar uma campanha ao redor da mesa.',
    inscription: 'Sob o teto enfumaçado desta taverna, elfos, anões, magos e ladinos dividem o mesmo salão entre canecas e olhares desconfiados. Ao redor desta mesa marcada por adagas e moedas, nascem rivalidades mortais e selam-se pactos de sangue. Reúna sua companhia, assuma o manto de Mestre ou lance os dados para decidir quem sobreviverá à próxima missão.',
    inscriptionLeft: 'Sob o teto enfumaçado desta taverna, elfos, anões, magos e ladinos dividem o mesmo salão entre canecas e olhares desconfiados. Ao redor desta mesa marcada por adagas e moedas, nascem rivalidades mortais e selam-se pactos de sangue. Reúna sua companhia, assuma o manto de Mestre ou lance os dados para decidir quem sobreviverá à próxima missão.',
    inscriptionRight: '',
    bgColor: '#100905', // Ébano Profundo da Sala V unificado
    cardColor: '#1A0F09', // Bloco Fosco Interno Padronizado
    textColor: '#EAE0D5', // Pergaminho Claro
    borderColor: 'rgba(212, 163, 89, 0.15)',
    accentColor: '#D4A359', // Âmbar / Ouro Velho
    imageUrl: '/assets/room_I_mestrar_v2.jpg',
  },
  II: {
    id: 'II',
    name: 'Telas do Alaúde',
    subtitle: 'II. Telas do Alaúde',
    description: 'O ateliê de crônicas e artes visuais, onde memórias, retratos e cenas da aventura ganham forma e estilo.',
    inscription: 'Em um canto iluminado por velas de sebo, cronistas da taverna registram os rostos daqueles que partem rumo ao desconhecido. De bárbaros cobertos de cicatrizes a clérigos e bruxos misteriosos, eternize a aparência da sua companhia, retrate as feras abatidas e dê forma aos mapas e brasões do seu grupo em traços de carvão, nanquim e ouro.',
    inscriptionLeft: 'Em um canto iluminado por velas de sebo, cronistas da taverna registram os rostos daqueles que partem rumo ao desconhecido. De bárbaros cobertos de cicatrizes a clérigos e bruxos misteriosos, eternize a aparência da sua companhia, retrate as feras abatidas e dê forma aos mapas e brasões do seu grupo em traços de carvão, nanquim e ouro.',
    inscriptionRight: '',
    bgColor: '#100905', // Ébano Profundo da Sala V unificado
    cardColor: '#1A0F09', // Bloco Fosco Interno Padronizado
    textColor: '#EAE0D5', // Pergaminho Claro
    borderColor: 'rgba(212, 163, 89, 0.15)',
    accentColor: '#D4A359',
    imageUrl: '/assets/room_II_escriba_v3.jpg',
  },
  III: {
    id: 'III',
    name: 'Taberneiro',
    subtitle: 'III. Taberneiro',
    description: 'O balcão do taberneiro, onde você pode pedir informações, tirar dúvidas sobre regras, consultar o bestiário e ouvir boatos.',
    inscription: 'Encostados no balcão de carvalho maciço, paladinos, mercenários e feiticeiros trocam moedas por hidromel e ouvidos atentos. O velho taberneiro conhece cada rixa entre clãs e cada recompensa por cabeças de monstros. Consulte os tomos de regras da casa, estude as fraquezas das criaturas no bestiário e colha rumores antes de pegar a estrada.',
    inscriptionLeft: 'Encostados no balcão de carvalho maciço, paladinos, mercenários e feiticeiros trocam moedas por hidromel e ouvidos atentos. O velho taberneiro conhece cada rixa entre clãs e cada recompensa por cabeças de monstros. Consulte os tomos de regras da casa, estude as fraquezas das criaturas no bestiário e colha rumores antes de pegar a estrada.',
    inscriptionRight: '',
    bgColor: '#100905', // Ébano Profundo da Sala V unificado
    cardColor: '#1A0F09', // Bloco Fosco Interno Padronizado
    textColor: '#EAE0D5', // Pergaminho Claro
    borderColor: 'rgba(212, 163, 89, 0.18)',
    accentColor: '#D4A359',
    imageUrl: '/assets/room_III_taberneiro_v3.jpg',
  },
  IV: {
    id: 'IV',
    name: 'Recanto dos Bardos',
    subtitle: 'IV. Recanto dos Bardos',
    description: 'O recanto das canções e histórias, onde bardos controlam a ambiência sonora, trilhas e melodias da taverna.',
    inscription: 'Onde os barris de vinho e cerveja nunca secam, bardos e trovadores errantes dedilham seus alaúdes para acalmar os ânimos ou incendiar disputas no salão. Deixe que a música dite o clima do encontro, controlando as melodias da taverna, o crepitar da lareira e os cânticos que embalam os juramentos da sua companhia.',
    inscriptionLeft: 'Onde os barris de vinho e cerveja nunca secam, bardos e trovadores errantes dedilham seus alaúdes para acalmar os ânimos ou incendiar disputas no salão. Deixe que a música dite o clima do encontro, controlando as melodias da taverna, o crepitar da lareira e os cânticos que embalam os juramentos da sua companhia.',
    inscriptionRight: '',
    bgColor: '#100905', // Ébano Profundo da Sala V unificado
    cardColor: '#1A0F09', // Bloco Fosco Interno Padronizado
    textColor: '#EAE0D5', // Pergaminho Claro
    borderColor: 'rgba(212, 163, 89, 0.18)',
    accentColor: '#D4A359',
    imageUrl: '/assets/banner_recanto_barris_v2.jpg',
  },
  V: {
    id: 'V',
    name: 'Bazar da Taverna',
    subtitle: 'V. Bazar da Taverna',
    description: 'O mercado oculto de relíquias e tesouros, onde moedas de ouro são trocadas por artefatos raros para a sua jornada.',
    inscription: 'Nos fundos vigiados da taverna, mercadores de terras exóticas abrem suas arcas para aventureiros recém-chegados de missões sangrentas. Não importa sua raça ou classe, aqui a única língua respeitada é o brilho do ouro. Troque suas moedas por relíquias místicas, títulos de renome e artefatos que elevarão seu nome acima dos rivais.',
    inscriptionLeft: 'Nos fundos vigiados da taverna, mercadores de terras exóticas abrem suas arcas para aventureiros recém-chegados de missões sangrentas. Não importa sua raça ou classe, aqui a única língua respeitada é o brilho do ouro. Troque suas moedas por relíquias místicas, títulos de renome e artefatos que elevarão seu nome acima dos rivais.',
    inscriptionRight: '',
    bgColor: '#100905', // Ébano Profundo da Sala V
    cardColor: '#1A0F09', // Bloco Fosco Interno Padronizado
    textColor: '#EAE0D5', // Pergaminho Claro
    borderColor: 'rgba(212, 163, 89, 0.18)',
    accentColor: '#D4A359',
    imageUrl: '/assets/room_V_bazar_v3.jpg',
  },
};

// Imagens do díptico da Sala I (esquerda: Mestrar · direita: Ingressar)
const ROOM_I_FRAMES = {
  left: '/assets/room_I_mestrar_v2.jpg',
  right: '/assets/room_I_ingressar_v2.jpg',
};

// Imagens do díptico da Sala IV (esquerda: Mensagens · direita: Jogadores)
const ROOM_IV_FRAMES = {
  left: '/assets/banner_recanto_barris_v2.jpg',
  right: '/assets/banner_recanto_bardos.jpg',
};

// Geometria do quadro central por sala (ritmo visual entre as abas)
const GALLERY_FRAME_CLASS: Record<RoomId, string> = {
  I: 'gallery-frame--diptych',
  II: 'gallery-frame--landscape',
  III: 'gallery-frame--square',
  IV: 'gallery-frame--portrait',
  V: 'gallery-frame--square-lg',
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
  const [hasEntered, setHasEntered] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'functional'>('gallery');
  const [activeRoom, setActiveRoom] = useState<RoomId>('I');
  // Ação inicial ao entrar na Sala I pelo díptico da galeria
  const [roomIAction, setRoomIAction] = useState<'create' | 'join' | null>(null);
  // Partição escolhida no díptico da Sala IV
  const [roomIVPartition, setRoomIVPartition] = useState<'chat' | 'contacts'>('chat');
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
    setHasEntered(false);
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

  // Sincroniza fundo e texto do body para cobertura total sem cortes pretos
  useEffect(() => {
    if (hasEntered) {
      document.body.style.backgroundColor = currentTheme.bgColor;
      document.body.style.color = currentTheme.textColor;
    } else {
      document.body.style.backgroundColor = '#F2E6D0';
      document.body.style.color = '#23150D';
    }
  }, [hasEntered, currentTheme.bgColor, currentTheme.textColor]);

  // Se o usuário ainda não entrou na taverna, exibe a Tela de Início (Abertura com Título em Tela Cheia)
  if (!hasEntered) {
    return (
      <>
        <LandingPage
          onEnter={() => {
            tavernAudio.playBellChime();
            setHasEntered(true);
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
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
      </>
    );
  }

  return (
    <div
      className="awwwards-app-root"
      style={{
        backgroundColor: currentTheme.bgColor,
        color: currentTheme.textColor,
      }}
    >
      {/* ========================================================
          1. CABEÇALHO SUPERIOR MINIMALISTA (TOP NAVIGATION)
          Totalmente limpo, colado no topo e extremidades laterais.
          ======================================================== */}
      <nav className="awwwards-top-nav">
        {/* Canto Superior Esquerdo: Texto MENU */}
        <button
          onClick={() => {
            tavernAudio.playBellChime();
            setIsMenuOpen(true);
          }}
          className="awwwards-nav-menu-btn"
          title="Abrir Menu Principal"
        >
          <span className="awwwards-nav-stretched-text">MENU</span>
        </button>

        {/* Centro (Navegação das Salas em Algarismos Romanos): I   II   III   IV   V */}
        <div className="awwwards-nav-center">
          <div className="awwwards-nav-numerals">
            {(['I', 'II', 'III', 'IV', 'V'] as RoomId[]).map((roman, idx) => {
              const activeIndex = (['I', 'II', 'III', 'IV', 'V'] as RoomId[]).indexOf(activeRoom);
              const distance = Math.abs(activeIndex - idx);
              const dynamicOpacity = distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.30 : distance === 3 ? 0.16 : 0.08;
              const isActive = activeRoom === roman;
              return (
                <button
                  key={roman}
                  onClick={() => handleSelectRoom(roman)}
                  onMouseEnter={() => setHoveredRoom(roman)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  className={`awwwards-nav-numeral-btn ${isActive ? 'is-active' : 'is-inactive'}`}
                  style={{
                    opacity: hoveredRoom === roman ? Math.max(dynamicOpacity, 0.85) : dynamicOpacity,
                    transition: 'opacity 0.4s ease, transform 0.3s ease',
                  }}
                  title={ROOMS[roman].name}
                >
                  <span className="awwwards-nav-stretched-text">{roman}</span>
                </button>
              );
            })}
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
          className="awwwards-nav-player-btn"
          title={currentUser ? `Perfil de ${currentUser.displayName || currentUser.email}` : 'Entrar na Taberna'}
        >
          <span className="awwwards-nav-stretched-text">JOGADOR</span>
        </button>
      </nav>

      {/* ========================================================
          DOIS NÍVEIS DE NAVEGAÇÃO:
          NÍVEL 1: MODO GALERIA (DISPLAY PRINCIPAL)
          NÍVEL 2: MODO FUNCIONAL (INTERIOR DA SALA)
          ======================================================== */}
      <main
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Caso especial: Usuário pendente */}
        {currentUser && currentUser.status === 'PENDING' ? (
          <div style={{ maxWidth: '480px', margin: '120px auto 40px', textAlign: 'center', padding: '0 24px' }}>
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
                <div style={{ maxWidth: '640px', margin: '120px auto 60px', padding: '0 20px', textAlign: 'center' }}>
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
              <div style={{ width: '100%', paddingTop: '100px', paddingBottom: '48px' }}>
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
             NÍVEL 1 — DISPLAY PRINCIPAL (GALERIA MINIMALISTA)
             - Apenas o(s) quadro(s) central(is), cantos retos, object-cover
             - Sala I: díptico (Mestrar | Ingressar) · II: paisagem · III: quadrado
               · IV: retrato · V: quadrado amplo
             ======================================================== */
          <div className="awwwards-gallery-stage">
            {activeRoom === 'I' ? (
              <div className="gallery-diptych">
                <button
                  type="button"
                  className="gallery-frame gallery-frame--diptych"
                  onClick={() => {
                    tavernAudio.playToastSound();
                    setRoomIAction('create');
                    setViewMode('functional');
                  }}
                  aria-label="Fundar Mesa e Mestrar"
                >
                  <img src={ROOM_I_FRAMES.left} alt="Fundar Mesa • Mestrar" draggable={false} />
                  <span className="gallery-microcaption">Fundar Mesa • Mestrar</span>
                </button>
                <button
                  type="button"
                  className="gallery-frame gallery-frame--diptych"
                  onClick={() => {
                    tavernAudio.playToastSound();
                    setRoomIAction('join');
                    setViewMode('functional');
                  }}
                  aria-label="Ingressar em Sala com Código"
                >
                  <img src={ROOM_I_FRAMES.right} alt="Ingressar em Sala • Código" draggable={false} />
                  <span className="gallery-microcaption">Ingressar em Sala • Código</span>
                </button>
              </div>
            ) : activeRoom === 'IV' ? (
              <div className="gallery-diptych">
                <button
                  type="button"
                  className="gallery-frame gallery-frame--diptych"
                  onClick={() => {
                    tavernAudio.playToastSound();
                    setRoomIVPartition('chat');
                    setViewMode('functional');
                  }}
                  aria-label="Mensagens e Confraria"
                >
                  <img src={ROOM_IV_FRAMES.left} alt="Mensagens e Confraria" draggable={false} />
                  <span className="gallery-microcaption">Mensagens • Confraria</span>
                </button>
                <button
                  type="button"
                  className="gallery-frame gallery-frame--diptych"
                  onClick={() => {
                    tavernAudio.playToastSound();
                    setRoomIVPartition('contacts');
                    setViewMode('functional');
                  }}
                  aria-label="Jogadores e Contatos"
                >
                  <img src={ROOM_IV_FRAMES.right} alt="Jogadores e Contatos" draggable={false} />
                  <span className="gallery-microcaption">Jogadores • Contatos</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`gallery-frame ${GALLERY_FRAME_CLASS[activeRoom]}`}
                onClick={() => {
                  tavernAudio.playToastSound();
                  setViewMode('functional');
                }}
                aria-label={`Adentrar em ${currentTheme.name}`}
              >
                <img src={currentTheme.imageUrl} alt={currentTheme.name} draggable={false} />
                <span className="gallery-microcaption">{currentTheme.name}</span>
              </button>
            )}
          </div>
        ) : (
          /* ========================================================
             NÍVEL 2 — MODO FUNCIONAL (INTERIOR DA SALA)
             - Mantém a mesma cor de fundo e texto da sala
             - Botão textual discreto ← VOLTAR À GALERIA
             - Ferramentas limpas, sem botões brancos sólidos ou caixas pesadas
             - Deixando pelo menos 60% de espaço negativo ao redor
             ======================================================== */
          <div className="awwwards-functional-stage" style={{ padding: 0 }}>
            {/* SALA I — MESA DOS APOSTADORES */}
            {activeRoom === 'I' && (
              <CampaignsView
                hideHeader={true}
                initialAction={roomIAction}
                onInitialActionConsumed={() => setRoomIAction(null)}
                onBack={() => {
                  tavernAudio.playBellChime();
                  setViewMode('gallery');
                }}
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
            )}

            {/* SALA II — TELAS DO ALAÚDE */}
            {activeRoom === 'II' && (
              <EditorialTelasView
                onBack={() => {
                  tavernAudio.playBellChime();
                  setViewMode('gallery');
                }}
                sketches={sketches}
                campaigns={visibleCampaigns}
                activeCampaignId={selectedCampaignId}
                onSaveSketch={handleSaveSketch}
                onDeleteSketch={handleDeleteSketch}
              />
            )}

            {/* SALA III — TABERNEIRO */}
            {activeRoom === 'III' && (
              <EditorialTaberneiroView
                onBack={() => {
                  tavernAudio.playBellChime();
                  setViewMode('gallery');
                }}
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
            )}

            {/* SALA IV — RECANTO DOS BARDOS */}
            {activeRoom === 'IV' && (
              <EditorialBardosView
                key={roomIVPartition}
                initialPartition={roomIVPartition}
                onBack={() => {
                  tavernAudio.playBellChime();
                  setViewMode('gallery');
                }}
                currentUser={currentUser}
                campaigns={visibleCampaigns}
                allUsers={users}
                onOpenProfile={(u) => {
                  setProfileModalUser(u);
                  setIsProfileModalOpen(true);
                }}
              />
            )}

            {/* SALA V — BAZAR DA TAVERNA */}
            {activeRoom === 'V' && (
              <EditorialBazarView
                onBack={() => {
                  tavernAudio.playBellChime();
                  setViewMode('gallery');
                }}
                currentUser={currentUser}
                onSaveProfile={handleSaveProfile}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          3. REFORMA COMPLETA DO MODAL 'MENU' (ELIMINAR POLUIÇÃO E SOBREPOSIÇÃO)
          - Fundo denso: bg-[#140C08]/95 backdrop-blur-xl cobrindo tudo
          - Card central: max-w-md w-full bg-white/[0.03] border border-amber-500/15 rounded-2xl p-8
          - Lista editorial limpa (I a V) com hover suave
          - Linha divisória sutil + opções de sistema em bloco fosco secundário
          - Botão [ X ] Fechar no canto superior direito
          ======================================================== */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(20, 12, 8, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            animation: 'fadeIn 0.25s ease',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(212, 163, 89, 0.15)',
              borderRadius: '16px',
              padding: '32px',
              boxSizing: 'border-box',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
              color: '#EAE0D5',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão [ X ] Fechar no canto superior direito do card */}
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#EAE0D5',
                opacity: 0.6,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Fechar Menu"
              aria-label="Fechar Menu"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho do Menu */}
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                  fontSize: '22px',
                  fontWeight: 600,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  margin: '0 0 4px 0',
                  color: '#EAE0D5',
                }}
              >
                TABERNA DIGITAL
              </h2>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontSize: '14px',
                  letterSpacing: '0.06em',
                  opacity: 0.65,
                  margin: 0,
                  color: '#EAE0D5',
                }}
              >
                Salões & Crônicas Medievais
              </p>
            </div>

            {/* Lista Editorial Limpa com Hover Suave (I a V) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
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
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(212, 163, 89, 0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(212, 163, 89, 0.25)' : '1px solid transparent',
                      color: isActive ? '#D4A359' : '#EAE0D5',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', minWidth: '32px' }}>
                      {roman}
                    </span>
                    <span style={{ fontSize: '14px', letterSpacing: '0.12em', textTransform: 'uppercase', flex: 1, textAlign: 'right' }}>
                      {room.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Linha Divisória Sutil */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

            {/* Bloco Fosco Secundário com Ícones Discretos Alinhados à Esquerda */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {/* Música do Alaúde */}
              <button
                onClick={async () => {
                  const state = await tavernAudio.toggle();
                  setIsAudioPlaying(state);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#EAE0D5',
                  cursor: 'pointer',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s ease',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Music size={15} style={{ opacity: 0.75, color: '#D4A359', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>Música do Alaúde: {isAudioPlaying ? 'Tocando' : 'Silenciada'}</span>
              </button>

              {/* Painel de Administração */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAdminModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#D4A359',
                    cursor: 'pointer',
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    transition: 'background 0.2s ease',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Shield size={15} style={{ opacity: 0.9, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>Painel de Administração</span>
                </button>
              )}

              {!currentUser && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#D4A359',
                    cursor: 'pointer',
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    transition: 'background 0.2s ease',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogIn size={15} style={{ opacity: 0.85, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>Entrar / Criar Personagem</span>
                </button>
              )}

              {/* Tela de Início */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setHasEntered(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#EAE0D5',
                  opacity: 0.65,
                  cursor: 'pointer',
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.65';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Home size={15} style={{ opacity: 0.7, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>Tela de Início (Abertura)</span>
              </button>
            </div>
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
