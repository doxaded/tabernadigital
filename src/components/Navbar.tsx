import React, { useState, useEffect } from 'react';
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
  Check,
  Flame,
  Volume2,
  VolumeX,
  Music,
  Coins
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
  id: 'hub' | 'campaigns' | 'sketch' | 'urd' | 'chat';
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'hub',
    label: 'Salão da Taverna',
    subtitle: 'Lareira & Início',
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
    subtitle: 'Balcão & Lareira',
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
  onOpenShop,
  onLogout,
  pendingCount,
}) => {
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Estado que controla se a barra lateral está aberta (cursor interagindo sobre a mesma)
  const [isHovered, setIsHovered] = useState(false);
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
    <aside
      id="tavern-lateral-toolbar"
      className="tavern-sidebar tavern-wood-beam"
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
        background: 'linear-gradient(180deg, #1b120a 0%, #130b06 100%)',
        borderRight: '2px solid #3c2415',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isHovered
          ? '16px 0 45px rgba(0, 0, 0, 0.85), inset -1px 0 0 rgba(245, 158, 11, 0.2)'
          : '4px 0 16px rgba(0, 0, 0, 0.65)',
        fontFamily: 'var(--font-cinzel), Georgia, serif',
        userSelect: 'none'
      }}
    >
      {/* Topo: Selo de Latão / Brasão da Taberna */}
      <div
        style={{
          height: '66px',
          minHeight: '66px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)',
          boxSizing: 'border-box',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => setActiveTab('hub')}
        title="Voltar ao Salão Principal da Taberna"
      >
        {/* Medalhão da Taberna em Ouro Envelhecido com Brasa */}
        <div
          style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
            color: '#fef3c7',
            fontWeight: 900,
            fontSize: '13px',
            letterSpacing: '0.04em',
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(254, 243, 199, 0.5)',
            border: '1px solid #f59e0b',
            position: 'relative'
          }}
        >
          <Flame size={18} style={{ color: '#fffbeb', filter: 'drop-shadow(0 0 4px #f59e0b)' }} />
        </div>

        {/* Nome da Taberna e subtítulo quando expandido */}
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
          <span
            style={{
              fontSize: '14px',
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
              marginTop: '2px',
              fontFamily: 'var(--font-body)'
            }}
          >
            RPG Companion
          </span>
        </div>

        {/* Indicador de expansão */}
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: `translateY(-50%) rotate(${isHovered ? '180deg' : '0deg'})`,
            opacity: isHovered ? 0.8 : 0.4,
            transition: 'transform 0.3s ease, opacity 0.2s ease',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center'
          }}
          title={isHovered ? 'Recolher menu' : 'Expandir menu'}
        >
          <ChevronRight size={15} />
        </div>
      </div>

      {/* Botão de Música da Taverna (Lareira & Alaúde) */}
      <div
        style={{
          padding: isHovered ? '10px 12px 6px' : '10px 10px 4px',
          boxSizing: 'border-box'
        }}
      >
        <button
          type="button"
          onClick={handleToggleAudio}
          title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
          style={{
            width: '100%',
            height: isHovered ? '38px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isHovered ? 'flex-start' : 'center',
            gap: '10px',
            padding: isHovered ? '0 10px' : '0',
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

          {isHovered && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: isPlayingAudio ? '#fef3c7' : '#d6c6b2' }}>
                {isPlayingAudio ? 'Música da Taverna' : 'Tocar Música'}
              </span>
              <span style={{ fontSize: '9px', color: '#f59e0b', fontFamily: 'var(--font-body)' }}>
                {isPlayingAudio ? 'Lareira & Alaúde ligados' : 'Lareira & Alaúde'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Rótulo de Seção no modo expandido */}
      {isHovered && (
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
          Aposentos da Taverna
        </div>
      )}

      {/* Lista de Navegação Principal */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: isHovered ? '6px 12px' : '8px 10px',
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
                height: '46px',
                minHeight: '46px',
                padding: '0 10px',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                borderLeft: isActive ? '3px solid #f59e0b' : '1px solid transparent',
                cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.28) 0%, rgba(120, 53, 15, 0.12) 100%)'
                  : 'transparent',
                color: isActive ? '#fef3c7' : '#cfc6b8',
                boxShadow: isActive ? '0 0 16px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(254, 243, 199, 0.15)' : 'none',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                position: 'relative',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                  e.currentTarget.style.color = '#fffbeb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#cfc6b8';
                }
              }}
            >
              {/* Ícone fixo de 20px com brilho âmbar se ativo */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: isActive ? '#f59e0b' : 'inherit',
                  filter: isActive ? 'drop-shadow(0 0 6px #f59e0b)' : 'none'
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
                    fontSize: '12.5px',
                    fontWeight: isActive ? 800 : 600,
                    lineHeight: 1.2,
                    letterSpacing: '0.02em',
                    fontFamily: 'var(--font-cinzel), Georgia, serif'
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isActive ? '#fcd34d' : '#8c7a6b',
                    lineHeight: 1.2,
                    marginTop: '2px',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}

        {/* Botão de Destaque: Bazar da Taverna (Loja Virtual de Títulos & Molduras) */}
        {currentUser && (
          <button
            id="tavern-shop-btn"
            onClick={onOpenShop}
            title={`Bazar da Taverna - ${getEffectiveGold(currentUser)} Peças de Ouro (PO)`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '46px',
              minHeight: '46px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(69, 26, 3, 0.25) 100%)',
              color: '#fbbf24',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              position: 'relative',
              boxSizing: 'border-box',
              margin: '4px 0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
              e.currentTarget.style.borderColor = '#fbbf24';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
              e.currentTarget.style.transform = 'translateX(0)';
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
                color: '#fbbf24',
                filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
              }}
            >
              <Coins size={20} strokeWidth={2.2} />
            </div>

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: '0.02em',
                    fontFamily: 'var(--font-cinzel), Georgia, serif',
                    color: '#fef3c7'
                  }}
                >
                  Bazar da Taverna
                </span>
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#fbbf24',
                  lineHeight: 1.2,
                  marginTop: '2px',
                  fontFamily: 'var(--font-body)'
                }}
              >
                🪙 {getEffectiveGold(currentUser).toLocaleString('pt-BR')} PO
              </span>
            </div>
          </button>
        )}

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
            onClick={onOpenAdmin}
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
              {!isHovered && pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 6px #ef4444'
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
          padding: isHovered ? '12px' : '10px',
          background: 'rgba(0, 0, 0, 0.25)',
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
                overflow: 'hidden',
                border: '1px solid rgba(245, 158, 11, 0.15)',
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

              {/* Nome, Título, Tag e Ouro no modo expandido */}
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
                    color: '#fef3c7',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '170px'
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
                      maxWidth: '170px'
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
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#cfc6b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-body)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.color = '#fef3c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
                    e.currentTarget.style.color = '#cfc6b8';
                  }}
                >
                  <KeyRound size={13} />
                  <span>Senha</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da Taverna"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Usuário não logado: Botão Entrar na Taverna */
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
              border: '1px solid #f59e0b',
              background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
              color: '#fef3c7',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
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
