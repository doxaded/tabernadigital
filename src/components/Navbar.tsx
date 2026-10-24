import React, { useState, useEffect } from 'react';
import {
  Crown,
  LogIn,
  Volume2,
  VolumeX,
  Coins,
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
                fontFamily: 'var(--font-body)',
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
                fontFamily: 'var(--font-body)',
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
              fontFamily: 'var(--font-body)',
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

      {/* 2. Barra Lateral de Ferramentas: Surge estritamente inferior à barra superior, ícones menores, ferramentas e perfil no extremo inferior */}
      <aside
        id="tavern-lateral-toolbar"
        className="tavern-sidebar"
        aria-label="Barra de ferramentas lateral da Taberna Digital"
        style={{
          position: 'fixed',
          top: '54px',
          left: 0,
          bottom: 0,
          height: 'calc(100vh - 54px)',
          width: '46px',
          backgroundColor: '#181008',
          borderRight: '1px solid rgba(245, 158, 11, 0.12)',
          zIndex: 980,
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
          userSelect: 'none',
          padding: '12px 0 14px'
        }}
      >
        {/* Ferramentas Superiores da Barra Lateral */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: '100%'
          }}
        >
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
              width: '32px',
              height: '32px',
              borderRadius: '8px',
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
            <Coins size={15} strokeWidth={2.2} />
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
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
              <Crown size={15} strokeWidth={2.2} />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444'
                  }}
                />
              )}
            </button>
          )}

          {/* Botão de Áudio (Alaúde & Lareira) */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isPlayingAudio ? 'Silenciar Alaúde & Lareira' : 'Ouvir Música da Taverna (Alaúde & Lareira)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
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
            {isPlayingAudio ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>

        {/* Espaçador Flexível para jogar o perfil no extremo inferior */}
        <div style={{ flex: 1 }} />

        {/* Ícone de Perfil no Extremo Inferior da Barra Lateral */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            paddingTop: '6px'
          }}
        >
          {currentUser ? (
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
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
          ) : (
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
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
              <LogIn size={15} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
