import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Sparkles,
  Beer,
  MessageSquare,
  Crown,
  User,
  KeyRound,
  LogOut,
  LogIn,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat';
  setActiveTab: (tab: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenChangePassword: () => void;
  onOpenMyProfile?: () => void;
  onLogout: () => void;
  pendingCount: number;
  bannerMode?: boolean;
}

interface NavItemConfig {
  id: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat';
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'hub',
    label: 'Início',
    subtitle: 'Taverna Hub',
    icon: <Compass size={20} strokeWidth={2.2} />
  },
  {
    id: 'campaigns',
    label: 'Mesa dos Apostadores',
    subtitle: 'Campanhas & Fichas',
    icon: <BookOpen size={20} strokeWidth={2.2} />
  },
  {
    id: 'sketch',
    label: 'Telas do Alaúde',
    subtitle: 'Ateliê do Bardo',
    icon: <Sparkles size={20} strokeWidth={2.2} />
  },
  {
    id: 'urd',
    label: 'Urd, o Taberneiro',
    subtitle: 'Oráculo & Lareira',
    icon: <Beer size={20} strokeWidth={2.2} />
  },
  {
    id: 'chat',
    label: 'Recanto dos Bardos',
    subtitle: 'Scriptorium & Chat',
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
  onLogout,
  pendingCount,
}) => {
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Estado que controla se a barra lateral está aberta (cursor interagindo sobre a mesma)
  const [isHovered, setIsHovered] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  // Paleta da barra lateral no tom bege/pergaminho editorial exato dos banners (#F4EDDD)
  const barBg = '#F4EDDD';
  const fg = '#0B0B0B';
  const fgMuted = '#5c4e40';
  const fgSubtle = '#857563';
  const borderColor = 'rgba(0, 0, 0, 0.12)';

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.userTag) {
      navigator.clipboard.writeText(currentUser.userTag);
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2000);
    }
  };

  return (
    <aside
      id="tavern-lateral-toolbar"
      className="tavern-sidebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsHovered(false);
        }
      }}
      aria-label="Barra de ferramentas lateral da Taberna Digital"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100vh',
        width: isHovered ? '264px' : '64px',
        backgroundColor: barBg,
        borderRight: `1px solid ${borderColor}`,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isHovered
          ? '14px 0 42px rgba(0, 0, 0, 0.65), 4px 0 12px rgba(0, 0, 0, 0.25)'
          : '3px 0 10px rgba(0, 0, 0, 0.15)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        userSelect: 'none'
      }}
    >
      {/* Topo: Logotipo / Monograma */}
      <div
        style={{
          height: '64px',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: `1px solid ${borderColor}`,
          boxSizing: 'border-box',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => setActiveTab('hub')}
        title="Voltar ao início da Taberna Digital"
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: '#0B0B0B',
            color: '#F4EDDD',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
          }}
        >
          TD.
        </div>

        {/* Logo completa com texto quando expandida */}
        <div
          style={{
            marginLeft: '12px',
            display: 'flex',
            flexDirection: 'column',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            whiteSpace: 'nowrap',
            pointerEvents: isHovered ? 'auto' : 'none'
          }}
        >
          <img
            src="/assets/taberna_logo_exact_2x.png"
            alt="TABERNADIGITAL."
            style={{
              height: '13px',
              width: 'auto',
              display: 'block'
            }}
          />
          <span
            style={{
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: fgSubtle,
              marginTop: '3px'
            }}
          >
            Taverna Virtual
          </span>
        </div>

        {/* Indicador sutil de hover na lateral */}
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: `translateY(-50%) rotate(${isHovered ? '180deg' : '0deg'})`,
            opacity: isHovered ? 0.6 : 0.3,
            transition: 'transform 0.3s ease, opacity 0.2s ease',
            color: fg,
            display: 'flex',
            alignItems: 'center'
          }}
          title={isHovered ? 'Fechar barra lateral' : 'Expandir barra lateral'}
        >
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Rótulo de Seção quando expandido */}
      {isHovered && (
        <div
          style={{
            padding: '16px 16px 6px',
            fontSize: '9.5px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: fgSubtle,
            whiteSpace: 'nowrap'
          }}
        >
          Salas & Ferramentas
        </div>
      )}

      {/* Lista de Navegação Principal */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: isHovered ? '8px 12px' : '12px 10px',
          flex: 1
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                height: '44px',
                minHeight: '44px',
                padding: '0 10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#0B0B0B' : 'transparent',
                color: isActive ? '#F4EDDD' : fg,
                boxShadow: isActive ? '0 3px 10px rgba(0, 0, 0, 0.25)' : 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
                textAlign: 'left',
                position: 'relative',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Ícone fixo de 20px centralizado no slot */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {item.icon}
              </div>

              {/* Rótulo e Subtítulo expandidos */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                  transition: 'opacity 0.22s ease, transform 0.22s ease'
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 600,
                    lineHeight: 1.2
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isActive ? 'rgba(244, 237, 221, 0.7)' : fgSubtle,
                    lineHeight: 1.2,
                    marginTop: '2px'
                  }}
                >
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}

        {/* Divisor */}
        <div
          style={{
            height: '1px',
            backgroundColor: borderColor,
            margin: '8px 4px'
          }}
        />

        {/* Botão de Área Administrativa (Exclusivo SuperAdmin) */}
        {isSuperAdmin && (
          <button
            id="admin-exclusive-btn"
            onClick={onOpenAdmin}
            title="Área Administrativa"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '44px',
              minHeight: '44px',
              padding: '0 10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: '#854d0e',
              transition: 'background-color 0.15s ease',
              textAlign: 'left',
              position: 'relative',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(234, 179, 8, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
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
                position: 'relative'
              }}
            >
              <Crown size={20} strokeWidth={2.2} />
              {/* Badge no modo colapsado */}
              {!isHovered && pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    backgroundColor: '#000000',
                    color: '#F4EDDD',
                    fontSize: '9px',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                transition: 'opacity 0.22s ease, transform 0.22s ease'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#713f12' }}>
                Administração
              </span>
              {pendingCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#0B0B0B',
                    color: '#F4EDDD',
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

      {/* Rodapé: Área do Usuário / Perfil & Logout */}
      <div
        style={{
          borderTop: `1px solid ${borderColor}`,
          padding: isHovered ? '12px' : '10px',
          backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {currentUser ? (
          <>
            {/* Bloco Perfil / Identificação do Usuário */}
            <div
              onClick={() => onOpenMyProfile?.()}
              title={`${currentUser.displayName || currentUser.email} (Abrir Perfil)`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar do Usuário */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '50%',
                  background: '#0B0B0B',
                  color: '#F4EDDD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 800,
                  overflow: 'hidden',
                  border: '1.5px solid #0B0B0B'
                }}
              >
                {(currentUser.photoURL || currentUser.avatarUrl) ? (
                  <img
                    src={currentUser.photoURL || currentUser.avatarUrl}
                    alt={currentUser.displayName || 'Avatar'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (currentUser.displayName || currentUser.email || 'A').charAt(0).toUpperCase()
                )}
              </div>

              {/* Nome e Tag no modo expandido */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? 'translateX(0)' : 'translateX(-6px)',
                  transition: 'opacity 0.22s ease, transform 0.22s ease'
                }}
              >
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: fg,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '170px'
                  }}
                >
                  {currentUser.displayName || currentUser.email.split('@')[0]}
                </span>

                {/* Tag de 7 Caracteres Única com botão de cópia rápida */}
                {currentUser.userTag && (
                  <div
                    onClick={handleCopyTag}
                    title="Clique para copiar sua tag"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: copiedTag ? '#15803d' : fgSubtle,
                      marginTop: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>#{currentUser.userTag}</span>
                    {copiedTag ? <Check size={11} /> : <Copy size={10} />}
                  </div>
                )}
              </div>
            </div>

            {/* Ações Rápidas quando Expandido: Alterar Senha e Sair */}
            {isHovered && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  paddingTop: '4px'
                }}
              >
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  title="Alterar Senha"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: '#FFFFFF',
                    color: fgMuted,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = fg;
                    e.currentTarget.style.color = fg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderColor;
                    e.currentTarget.style.color = fgMuted;
                  }}
                >
                  <KeyRound size={13} />
                  <span>Senha</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Encerrar Sessão e Sair"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    background: 'rgba(220, 38, 38, 0.08)',
                    color: '#dc2626',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc2626';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Usuário não logado: Botão Entrar */
          <button
            onClick={onOpenAuth}
            title="Entrar na Taverna Digital"
            style={{
              width: '100%',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isHovered ? 'flex-start' : 'center',
              gap: '10px',
              padding: isHovered ? '0 14px' : '0',
              borderRadius: '8px',
              border: 'none',
              background: '#0B0B0B',
              color: '#F4EDDD',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#26201a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0B0B0B';
            }}
          >
            <LogIn size={18} />
            {isHovered && <span>Entrar na Taverna</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
