import React, { useState, useEffect } from 'react';
import {
  Compass,
  Crown,
  KeyRound,
  LogOut,
  LogIn,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Coins,
  X,
  Menu
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

interface NavItemConfig {
  id: 'hub' | 'shop';
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  action: 'navigate' | 'shop';
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'hub',
    label: 'Salão Principal',
    subtitle: 'Lareira & Banners das Salas',
    icon: <Compass size={20} strokeWidth={2.2} />,
    action: 'navigate'
  },
  {
    id: 'shop',
    label: 'Bazar da Taverna',
    subtitle: 'Títulos, Molduras & PO',
    icon: <Coins size={20} strokeWidth={2.2} />,
    action: 'shop'
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
  const [copiedTag, setCopiedTag] = useState(false);
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

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.userTag) {
      navigator.clipboard.writeText(currentUser.userTag);
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2000);
    }
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

      {/* 2. Barra Lateral de Ferramentas (Integrada à tela sem backdrop e sem desfoque do fundo) */}
      <aside
        id="tavern-lateral-toolbar"
        className="tavern-sidebar tavern-wood-beam"
        aria-label="Barra de ferramentas lateral da Taberna Digital"
        style={{
          position: 'fixed',
          top: '54px',
          left: 0,
          bottom: 0,
          height: 'calc(100vh - 54px)',
          width: '258px',
          background: 'linear-gradient(180deg, #181008 0%, #120a05 100%)',
          borderRight: '1px solid #3c2415',
          zIndex: 980,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
          boxShadow: isOpen
            ? '4px 0 20px rgba(0, 0, 0, 0.55)'
            : 'none',
          fontFamily: 'var(--font-cinzel), Georgia, serif',
          userSelect: 'none'
        }}
      >
        {/* Topo da Barra: Nome da Taberna e Botão Fechar */}
        <div
          style={{
            height: '56px',
            minHeight: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            borderBottom: '1px solid rgba(245, 158, 11, 0.12)',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              setActiveTab('hub');
              setIsOpen(false);
            }}
            title="Voltar ao Salão Principal da Taverna"
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#fef3c7',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)'
                }}
              >
                TABERNA DIGITAL
              </span>
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#d97706',
                  marginTop: '1px',
                  fontFamily: 'var(--font-body)'
                }}
              >
                RPG Companion
              </span>
            </div>
          </div>

          {/* Botão de Fechar Barra Lateral */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Ocultar Barra Lateral"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#d4b896',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#d4b896';
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.35)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Botão de Música da Taverna (Lareira & Alaúde) */}
        <div style={{ padding: '10px 14px 6px', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
            style={{
              width: '100%',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '10px',
              padding: '0 14px',
              borderRadius: '9999px',
              border: isPlayingAudio ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: isPlayingAudio
                ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.25) 0%, rgba(120, 53, 15, 0.15) 100%)'
                : 'rgba(0, 0, 0, 0.35)',
              color: isPlayingAudio ? '#fef3c7' : '#cfc6b8',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPlayingAudio ? '#f59e0b' : '#a89a85',
                flexShrink: 0
              }}
            >
              {isPlayingAudio ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: isPlayingAudio ? '#fef3c7' : '#d6c6b2' }}>
                {isPlayingAudio ? 'Música da Taverna' : 'Tocar Música'}
              </span>
              <span style={{ fontSize: '9px', color: '#d97706', fontFamily: 'var(--font-body)' }}>
                {isPlayingAudio ? 'Lareira & Alaúde ligados' : 'Lareira & Alaúde'}
              </span>
            </div>
          </button>
        </div>

        {/* Título da Seção */}
        <div
          style={{
            padding: '12px 16px 4px',
            fontSize: '9.5px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: '#b45309',
            whiteSpace: 'nowrap'
          }}
        >
          Ferramentas da Taverna
        </div>

        {/* Lista de Navegação Principal: Salão Principal & Bazar da Taverna */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '6px 12px',
            flex: 1
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === 'hub' ? activeTab === 'hub' : false;
            const isShop = item.id === 'shop';

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action === 'shop') {
                    onOpenShop?.();
                  } else {
                    setActiveTab('hub');
                  }
                  setIsOpen(false);
                }}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  height: '48px',
                  minHeight: '48px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: isActive
                    ? '1px solid rgba(245, 158, 11, 0.35)'
                    : isShop
                    ? '1px solid rgba(245, 158, 11, 0.25)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.22) 0%, rgba(120, 53, 15, 0.08) 100%)'
                    : isShop
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.16) 0%, rgba(69, 26, 3, 0.18) 100%)'
                    : 'transparent',
                  color: isActive || isShop ? '#fef3c7' : '#cfc6b8',
                  boxShadow: 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                  e.currentTarget.style.color = '#fffbeb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isActive
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.22) 0%, rgba(120, 53, 15, 0.08) 100%)'
                    : isShop
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.16) 0%, rgba(69, 26, 3, 0.18) 100%)'
                    : 'transparent';
                  e.currentTarget.style.color = isActive || isShop ? '#fef3c7' : '#cfc6b8';
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isShop ? '#fbbf24' : isActive ? '#f59e0b' : 'inherit'
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isActive || isShop ? 800 : 600,
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                      fontFamily: 'var(--font-cinzel), Georgia, serif',
                      color: isShop ? '#fbbf24' : '#fef3c7'
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 500,
                      color: isShop ? '#fcd34d' : isActive ? '#fcd34d' : '#8c7a6b',
                      lineHeight: 1.2,
                      marginTop: '2px',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {isShop && currentUser
                      ? `🪙 ${getEffectiveGold(currentUser).toLocaleString('pt-BR')} PO • Títulos & Molduras`
                      : item.subtitle}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Divisor de Madeira Rústica */}
          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              margin: '8px 4px'
            }}
          />

          {/* Botão de Área Administrativa (SuperAdmin) */}
          {isSuperAdmin && (
            <button
              id="admin-exclusive-btn"
              onClick={() => {
                onOpenAdmin();
                setIsOpen(false);
              }}
              title="Área Administrativa do Mestre Guardião"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                height: '44px',
                minHeight: '44px',
                padding: '0 12px',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.18)',
                cursor: 'pointer',
                background: 'rgba(217, 119, 6, 0.08)',
                color: '#fcd34d',
                transition: 'background-color 0.15s ease',
                textAlign: 'left',
                position: 'relative',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.08)';
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                  color: '#f59e0b'
                }}
              >
                <Crown size={20} strokeWidth={2.2} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fcd34d' }}>
                  Administração
                </span>
                {pendingCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '12px'
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </div>
            </button>
          )}
        </nav>

        {/* Rodapé: Cartão de Couro do Aventureiro / Perfil & Logout */}
        <div
          style={{
            borderTop: '1px solid rgba(245, 158, 11, 0.15)',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.35)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {currentUser ? (
            <>
              {/* Bloco Perfil / Identificação do Aventureiro */}
              <div
                onClick={() => {
                  onOpenMyProfile?.();
                  setIsOpen(false);
                }}
                title={`${currentUser.displayName || currentUser.email} (Abrir Perfil)`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  overflow: 'hidden',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                  background: 'linear-gradient(180deg, rgba(40, 25, 15, 0.6) 0%, rgba(20, 12, 7, 0.8) 100%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Moldura Mística do Avatar com AvatarFrame */}
                <AvatarFrame user={currentUser} size="sm" />

                {/* Nome, Título, Tag e Ouro */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#fef3c7',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '175px'
                    }}
                  >
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>

                  {/* Título Honorífico Equipado */}
                  {currentUser.title && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#fbbf24',
                        fontStyle: 'italic',
                        lineHeight: 1.1,
                        marginTop: '1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '175px'
                      }}
                      title={currentUser.title}
                    >
                      "{currentUser.title}"
                    </span>
                  )}

                  {/* Tag de 7 Caracteres Única e Pílula de Ouro */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    {currentUser.userTag && (
                      <div
                        onClick={handleCopyTag}
                        title="Clique para copiar sua tag de aventureiro"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '9.5px',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: copiedTag ? '#22c55e' : '#f59e0b',
                          cursor: 'pointer'
                        }}
                      >
                        <span>#{currentUser.userTag}</span>
                        {copiedTag ? <Check size={10} /> : <Copy size={9} />}
                      </div>
                    )}

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenShop?.();
                        setIsOpen(false);
                      }}
                      title="Bolsa de Peças de Ouro (Clique para abrir o Bazar)"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#fcd34d',
                        backgroundColor: 'rgba(217, 119, 6, 0.22)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>🪙</span>
                      <span>{getEffectiveGold(currentUser).toLocaleString('pt-BR')} PO</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações do Rodapé: Alterar Senha e Sair */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  paddingTop: '2px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onOpenChangePassword();
                    setIsOpen(false);
                  }}
                  title="Alterar Senha do Aventureiro"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(245, 158, 11, 0.22)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#d4b896',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                    e.currentTarget.style.color = '#fef3c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.color = '#d4b896';
                  }}
                >
                  <KeyRound size={13} />
                  <span>Senha</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  title="Abandonar a Taverna (Logout)"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                >
                  <LogOut size={13} />
                  <span>Sair</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setIsOpen(false);
              }}
              title="Entrar na Taverna"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
                color: '#fffbeb',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.65)'
              }}
            >
              <LogIn size={15} />
              <span>Entrar na Taverna</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
