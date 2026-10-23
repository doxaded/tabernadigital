import React, { useEffect, useRef, useState } from 'react';
import { User, KeyRound, LogOut } from 'lucide-react';
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

  // Cores da barra de ferramentas retangular no mesmo branco/bege exato dos banners (#F4EDDD)
  const barBg = '#F4EDDD';
  const fg = '#0B0B0B';
  const fgMuted = '#4a3f35';

  // Desaparece suavemente ao scrollar
  const [hideOnScroll, setHideOnScroll] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (currentY <= 15) {
            setHideOnScroll(false);
          } else if (currentY > lastY + 6 && currentY > 40) {
            // Rolando para baixo: a barra desaparece
            setHideOnScroll(true);
          } else if (currentY < lastY - 6) {
            // Rolando para cima: a barra reaparece
            setHideOnScroll(false);
          }
          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTextStyle = (isActive: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? fg : fgMuted,
    textTransform: 'lowercase',
    letterSpacing: '0.01em',
    padding: '6px 0',
    borderBottom: isActive ? `2px solid ${fg}` : '2px solid transparent',
    transition: 'color 0.2s ease, border-color 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  });

  const menuItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '9px 12px',
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'left',
    color: fg,
    textTransform: 'lowercase',
    transition: 'background 0.15s ease'
  };

  return (
    <>
      {/* Topbar Editorial (Fundo Branco/Bege #FAF7F2, texto Preto - desaparece com o scrollar) */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          backgroundColor: barBg,
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
          transform: hideOnScroll ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease',
          pointerEvents: hideOnScroll ? 'none' : 'auto',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '56px',
            padding: '0 var(--edge)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            boxSizing: 'border-box'
          }}
        >
          {/* Lado Esquerdo: Logotipo Editorial IDENTICO TABERNADIGITAL. (um pouco menor) */}
          <div
            onClick={() => setActiveTab('hub')}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
            title="Voltar ao início da Taberna Digital"
          >
            <img
              src="/assets/taberna_logo_exact_2x.png"
              alt="TABERNADIGITAL."
              style={{
                height: '13px',
                width: 'auto',
                display: 'block',
                userSelect: 'none'
              }}
            />
          </div>

          {/* Lado Direito: Links área administrativa e perfil / entrar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              zIndex: 10
            }}
          >
            {/* Área Administrativa (Super Admin) */}
            {isSuperAdmin && (
              <button
                id="admin-exclusive-btn"
                className="desktop-only"
                onClick={onOpenAdmin}
                style={navTextStyle(false)}
                title="Área Administrativa"
                onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
              >
                <span>área administrativa</span>
                {pendingCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#000000',
                      color: '#F2ECE1',
                      fontSize: '9px',
                      fontWeight: 800,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Perfil: Abre a Aba Lateral Direita (substituindo a aba centralizada) */}
            {currentUser ? (
              <button
                id="profile-menu-btn"
                onClick={() => onOpenMyProfile?.()}
                style={navTextStyle(false)}
                title="Abrir aba lateral de perfil"
                onMouseEnter={(e) => { e.currentTarget.style.color = fg; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = fgMuted; }}
              >
                perfil
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                style={{
                  background: '#0B0B0B',
                  color: '#F2ECE1',
                  border: '1.5px solid #0B0B0B',
                  borderRadius: '30px',
                  padding: '7px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#221c17';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0B0B0B';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>
      {/* Espaçador estático para manter o fluxo do documento sob o topo fixo */}
      <div style={{ height: '56px', width: '100%', flexShrink: 0 }} aria-hidden="true" />
    </>
  );
};
