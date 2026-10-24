import React, { useState, useEffect } from 'react';
import {
  Compass,
  Crown,
  KeyRound,
  LogOut,
  LogIn,
  Copy,
  Check,
  Flame,
  Volume2,
  VolumeX,
  Coins,
  X
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
      {/* 1. Sensor Interativo na Borda Esquerda da Tela (Aproximação do Cursor) */}
      <div
        id="tavern-sidebar-edge-sensor"
        onMouseEnter={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '20px',
          height: '100vh',
          zIndex: 994,
          cursor: 'pointer',
          pointerEvents: isOpen ? 'none' : 'auto'
        }}
        title="Aproxime o cursor para abrir as Ferramentas da Taverna"
        aria-hidden="true"
      />

      {/* 2. Ícone / Logo Flutuante no Canto Superior Esquerdo da Tela */}
      <button
        id="tavern-topleft-seal-btn"
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Abrir Ferramentas da Taverna (ou aproxime o cursor do canto esquerdo)"
        style={{
          position: 'fixed',
          top: '12px',
          left: '12px',
          zIndex: 995,
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
          color: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #f59e0b',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.8), 0 0 16px rgba(245, 158, 11, 0.45)',
          cursor: 'pointer',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
          transform: isOpen ? 'scale(0.8) translateX(-15px)' : 'scale(1) translateX(0)'
        }}
      >
        <Flame size={20} style={{ color: '#fffbeb', filter: 'drop-shadow(0 0 5px #f59e0b)' }} />
      </button>

      {/* 3. Backdrop Semitransparente ao Abrir */}
      {isOpen && (
        <div
          id="tavern-sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 998,
            transition: 'opacity 0.25s ease'
          }}
          aria-hidden="true"
        />
      )}

      {/* 4. Barra Lateral de Ferramentas (Esconde-se inteiramente até ser ativada) */}
      <aside
        id="tavern-lateral-toolbar"
        className="tavern-sidebar tavern-wood-beam"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label="Barra de ferramentas lateral da Taberna Digital"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          height: '100vh',
          width: '272px',
          background: 'linear-gradient(180deg, #1c1109 0%, #120a05 100%)',
          borderRight: '2px solid #5a3518',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease, box-shadow 0.28s ease',
          boxShadow: isOpen
            ? '20px 0 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(245, 158, 11, 0.25), inset -1px 0 0 rgba(245, 158, 11, 0.3)'
            : 'none',
          fontFamily: 'var(--font-cinzel), Georgia, serif',
          userSelect: 'none'
        }}
      >
        {/* Topo da Barra: Brasão da Taberna e Botão Fechar */}
        <div
          style={{
            height: '66px',
            minHeight: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              setActiveTab('hub');
              setIsOpen(false);
            }}
            title="Voltar ao Salão Principal da Taberna"
          >
            {/* Medalhão da Taberna com Chama */}
            <div
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
                color: '#fef3c7',
                boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)',
                border: '1px solid #f59e0b'
              }}
            >
              <Flame size={18} style={{ color: '#fffbeb', filter: 'drop-shadow(0 0 4px #f59e0b)' }} />
            </div>

            <div style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#fef3c7',
                  textShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
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
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#d4b896',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#d4b896';
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.35)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
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
              padding: '0 12px',
              borderRadius: '8px',
              border: isPlayingAudio ? '1px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.25)',
              background: isPlayingAudio
                ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.3) 0%, rgba(120, 53, 15, 0.2) 100%)'
                : 'rgba(0, 0, 0, 0.35)',
              color: isPlayingAudio ? '#fef3c7' : '#cfc6b8',
              cursor: 'pointer',
              boxShadow: isPlayingAudio ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
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
              <span style={{ fontSize: '9px', color: '#f59e0b', fontFamily: 'var(--font-body)' }}>
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
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: isActive
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : isShop
                    ? '1.5px solid rgba(245, 158, 11, 0.35)'
                    : '1px solid transparent',
                  borderLeft: isActive
                    ? '3px solid #f59e0b'
                    : isShop
                    ? '3px solid #fbbf24'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.28) 0%, rgba(120, 53, 15, 0.12) 100%)'
                    : isShop
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.2) 0%, rgba(69, 26, 3, 0.25) 100%)'
                    : 'transparent',
                  color: isActive || isShop ? '#fef3c7' : '#cfc6b8',
                  boxShadow: isActive ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
                  e.currentTarget.style.color = '#fffbeb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isActive
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.28) 0%, rgba(120, 53, 15, 0.12) 100%)'
                    : isShop
                    ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.2) 0%, rgba(69, 26, 3, 0.25) 100%)'
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
                    color: isShop ? '#fbbf24' : isActive ? '#f59e0b' : 'inherit',
                    filter: isShop || isActive ? 'drop-shadow(0 0 6px #f59e0b)' : 'none'
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
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                cursor: 'pointer',
                background: 'rgba(217, 119, 6, 0.08)',
                color: '#fcd34d',
                transition: 'background-color 0.15s ease',
                textAlign: 'left',
                position: 'relative',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
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
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  overflow: 'hidden',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
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
                        gap: '2px',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#fcd34d',
                        backgroundColor: 'rgba(217, 119, 6, 0.25)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        padding: '1px 5px',
                        borderRadius: '8px',
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
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
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
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
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
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
                color: '#fffbeb',
                border: '1px solid #f59e0b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
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
