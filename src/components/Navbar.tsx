import React, { useState, useEffect } from 'react';
import {
  Compass,
  Crown,
  KeyRound,
  LogOut,
  LogIn,
  Volume2,
  VolumeX,
  Coins,
  Menu,
  Shield,
  Palette,
  Flame,
  MessageSquare
} from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';
import { tavernAudio } from '../services/tavernAudio';
import { AvatarFrame } from './AvatarFrame';
import { getEffectiveGold } from '../services/tavernShopCatalog';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat';
  setActiveTab: (tab: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenChangePassword: () => void;
  onOpenMyProfile?: () => void;
  onOpenShop?: () => void;
  onLogout: () => void;
  pendingCount: number;
  bannerMode?: boolean;
}

interface TabItemConfig {
  id: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat';
  title: string;
  icon: React.ReactNode;
}

const TAB_ITEMS: TabItemConfig[] = [
  {
    id: 'hub',
    title: 'Salão Principal',
    icon: <Compass size={20} strokeWidth={2.2} />
  },
  {
    id: 'campaigns',
    title: 'Mesa dos Apostadores (Mesas & Fichas)',
    icon: <Shield size={20} strokeWidth={2.2} />
  },
  {
    id: 'sketch',
    title: 'Recanto dos Bardos (Telas & Pintura)',
    icon: <Palette size={20} strokeWidth={2.2} />
  },
  {
    id: 'urd',
    title: 'Urd, o Taberneiro (Oráculo da Lareira)',
    icon: <Flame size={20} strokeWidth={2.2} />
  },
  {
    id: 'chat',
    title: 'Mesa dos Apostadores (Chat ao Vivo)',
    icon: <MessageSquare size={20} strokeWidth={2.2} />
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenAuth,
  onOpenChangePassword,
  onOpenMyProfile,
  onOpenShop,
  onLogout,
  pendingCount,
}) => {
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Estado que controla se a barra lateral está totalmente visível ou oculta
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return tavernAudio.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
  }, []);

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    tavernAudio.toggle();
  };

  return (
    <>
      {/* 1. Barra de Tarefas SUPERIOR: Estática, cor própria de madeira defumada sem linha inferior */}
      <header
        id="tavern-top-taskbar"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '54px',
          zIndex: 990,
          backgroundColor: '#181008',
          borderBottom: 'none',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxSizing: 'border-box',
          userSelect: 'none'
        }}
      >
        {/* Canto Superior Esquerdo: Ícone para puxar barra lateral + Logo Minimalista de Caneca de Chopp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="tavern-toggle-sidebar-btn"
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title={isOpen ? 'Recolher Ferramentas da Taverna' : 'Expandir Ferramentas da Taverna'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: isOpen ? 'rgba(217, 119, 6, 0.22)' : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: isOpen ? '#fbbf24' : '#d4b896',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.25)';
              e.currentTarget.style.color = '#fffbeb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isOpen ? 'rgba(217, 119, 6, 0.22)' : 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = isOpen ? '#fbbf24' : '#d4b896';
            }}
          >
            <Menu size={20} />
          </button>

          {/* Logo Minimalista Medieval: Nome da Taverna */}
          <div
            onClick={() => {
              setActiveTab('hub');
              setIsOpen(false);
            }}
            title="Voltar ao Salão Principal da Taverna"
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-cinzel), Georgia, serif',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#fef3c7'
              }}
            >
              TABERNA DIGITAL
            </span>
          </div>
        </div>

        {/* Lado Direito: Ações (Bazar e Música) - TOTALMENTE SEM BORDAS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentUser && (
            <button
              type="button"
              onClick={onOpenShop}
              title="Abrir Bazar da Taverna (Títulos de Honra & Molduras Místicas)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: 'rgba(217, 119, 6, 0.16)',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'var(--font-cinzel), Georgia, serif',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.28)';
                e.currentTarget.style.color = '#fffbeb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.16)';
                e.currentTarget.style.color = '#fbbf24';
              }}
            >
              <Coins size={14} style={{ color: '#fbbf24' }} />
              <span>{getEffectiveGold(currentUser).toLocaleString('pt-BR')} PO</span>
              <span style={{ opacity: 0.8, fontWeight: 500 }}>• Bazar</span>
            </button>
          )}

          {/* Botão de Música da Taverna - TOTALMENTE SEM BORDA */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: isPlayingAudio ? 'rgba(217, 119, 6, 0.22)' : 'rgba(255, 255, 255, 0.05)',
              color: isPlayingAudio ? '#fef3c7' : '#cfc6b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-cinzel), Georgia, serif',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isPlayingAudio ? 'rgba(217, 119, 6, 0.32)' : 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isPlayingAudio ? 'rgba(217, 119, 6, 0.22)' : 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = isPlayingAudio ? '#fef3c7' : '#cfc6b8';
            }}
          >
            {isPlayingAudio ? (
              <>
                <Volume2 size={14} style={{ color: '#f59e0b' }} />
                <span>Alaúde & Lareira</span>
              </>
            ) : (
              <>
                <VolumeX size={14} />
                <span>Ouvir Música</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Barra Lateral de Ferramentas: Fina, apenas símbolos/ícones das abas, mesma cor da barra superior e fixa em toda a lateral esquerda */}
      <aside
        id="tavern-lateral-toolbar"
        className="tavern-sidebar"
        aria-label="Barra de ferramentas lateral da Taberna Digital"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          height: '100vh',
          width: '56px',
          backgroundColor: '#181008',
          borderRight: '1px solid rgba(245, 158, 11, 0.12)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease',
          boxShadow: isOpen ? '4px 0 20px rgba(0, 0, 0, 0.6)' : 'none',
          userSelect: 'none'
        }}
      >
        {/* Topo da Barra Lateral: Botão Toggle no mesmo alinhamento de 54px da Barra Superior */}
        <div
          style={{
            height: '54px',
            minHeight: '54px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Recolher Barra Lateral"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(217, 119, 6, 0.22)',
              border: 'none',
              color: '#fbbf24',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.32)';
              e.currentTarget.style.color = '#fffbeb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.22)';
              e.currentTarget.style.color = '#fbbf24';
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Lista de Ícones/Símbolos das Abas da Taverna (Sem Nenhum Texto) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            padding: '4px 0'
          }}
        >
          {TAB_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                }}
                title={item.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(217, 119, 6, 0.22)' : 'transparent',
                  color: isActive ? '#f59e0b' : '#c9b097',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  padding: 0,
                  boxShadow: isActive ? '0 0 12px rgba(245, 158, 11, 0.22)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fffbeb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#c9b097';
                  }
                }}
              >
                {item.icon}
              </button>
            );
          })}

          {/* Símbolo do Bazar da Taverna */}
          <button
            type="button"
            onClick={() => {
              onOpenShop?.();
            }}
            title={
              currentUser
                ? `Bazar da Taverna (${getEffectiveGold(currentUser).toLocaleString('pt-BR')} PO)`
                : 'Bazar da Taverna'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid transparent',
              backgroundColor: 'transparent',
              color: '#fbbf24',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.22)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <Coins size={20} strokeWidth={2.2} />
          </button>

          {/* Símbolo de Administração (SuperAdmin) */}
          {isSuperAdmin && (
            <button
              id="admin-exclusive-btn"
              type="button"
              onClick={() => {
                onOpenAdmin();
              }}
              title="Área Administrativa do Mestre Guardião"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#f59e0b',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                padding: 0,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
                e.currentTarget.style.color = '#fffbeb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.12)';
                e.currentTarget.style.color = '#f59e0b';
              }}
            >
              <Crown size={20} strokeWidth={2.2} />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444'
                  }}
                />
              )}
            </button>
          )}
        </div>

        {/* Separador Sutil */}
        <div
          style={{
            width: '30px',
            height: '1px',
            backgroundColor: 'rgba(245, 158, 11, 0.14)',
            margin: '6px 0'
          }}
        />

        {/* Espaçador Flexível */}
        <div style={{ flex: 1 }} />

        {/* Ações Inferiores (Apenas Símbolos/Ícones) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            padding: '6px 0 12px'
          }}
        >
          {/* Botão de Áudio (Alaúde & Lareira) */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: isPlayingAudio ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
              backgroundColor: isPlayingAudio ? 'rgba(217, 119, 6, 0.22)' : 'transparent',
              color: isPlayingAudio ? '#f59e0b' : '#c9b097',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#fffbeb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isPlayingAudio ? 'rgba(217, 119, 6, 0.22)' : 'transparent';
              e.currentTarget.style.color = isPlayingAudio ? '#f59e0b' : '#c9b097';
            }}
          >
            {isPlayingAudio ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          {currentUser ? (
            <>
              {/* Avatar do Aventureiro (Abrir Perfil) */}
              <button
                type="button"
                onClick={() => {
                  onOpenMyProfile?.();
                }}
                title={`${currentUser.displayName || currentUser.email} (Abrir Perfil)`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <AvatarFrame user={currentUser} size="xs" />
              </button>

              {/* Alterar Senha */}
              <button
                type="button"
                onClick={() => {
                  onOpenChangePassword();
                }}
                title="Alterar Senha"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  backgroundColor: 'transparent',
                  color: '#c9b097',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#fffbeb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#c9b097';
                }}
              >
                <KeyRound size={17} />
              </button>

              {/* Sair da Taverna (Logout) */}
              <button
                type="button"
                onClick={() => {
                  onLogout();
                }}
                title="Abandonar a Taverna (Logout)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.color = '#f87171';
                }}
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            /* Entrar na Taverna (Login) */
            <button
              type="button"
              onClick={() => {
                onOpenAuth();
              }}
              title="Entrar na Taverna"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                backgroundColor: 'rgba(217, 119, 6, 0.22)',
                color: '#fbbf24',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.35)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.22)';
                e.currentTarget.style.color = '#fbbf24';
              }}
            >
              <LogIn size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
