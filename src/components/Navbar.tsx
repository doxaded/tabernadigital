import React, { useEffect, useRef, useState } from 'react';
import { Shield, Sparkles, BookOpen, Crown, LogOut, UserCheck, KeyRound } from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: 'campaigns' | 'sketch' | 'urd';
  setActiveTab: (tab: 'campaigns' | 'sketch' | 'urd') => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  pendingCount: number;
  /** Quando true, a barra se funde ao banner marrom do Salão Principal. */
  bannerMode?: boolean;
}

const NAV_ITEMS: { id: 'campaigns' | 'sketch' | 'urd'; label: string }[] = [
  { id: 'campaigns', label: 'mesa central' },
  { id: 'sketch', label: 'galeria do bardo' },
  { id: 'urd', label: 'taberneiro' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenAuth,
  onOpenChangePassword,
  onLogout,
  pendingCount,
  bannerMode = false,
}) => {
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isApproved = currentUser?.status === 'APPROVED';

  // Cores adaptadas ao fundo: banner marrom escuro (texto creme) ou página creme (texto preto)
  const fg = bannerMode ? '#f5ecdc' : '#15100b';
  const fgMuted = bannerMode ? '#a89a85' : '#7c6d58';
  const line = bannerMode ? 'rgba(245,236,220,0.18)' : 'rgba(60,36,18,0.18)';
  const hoverBg = bannerMode ? 'rgba(245,236,220,0.1)' : 'rgba(60,36,18,0.08)';

  // Menu "perfil" (dropdown com dados da conta, trocar senha e sair)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProfileOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsProfileOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileOpen]);

  // Comportamento do cabeçalho do makemepulse (baseado na POSIÇÃO de rolagem, não na direção):
  // ao sair do topo (≥ 20px) a barra "gruda" e recolhe: o menu some com fade, o logotipo vira um
  // círculo e aparece o ícone de menu (2 linhas). Passar o mouse na barra expande tudo de novo;
  // voltar ao topo restaura o estado normal.
  const STICKY_AT = 20;
  const canHoverRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
  );
  const [isSticky, setIsSticky] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const isCollapsed = isSticky && !isHover && !isProfileOpen;

  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 769px)');
    const update = () => {
      // No mobile (≤768px) a navegação fica na barra inferior: não recolhe
      setIsSticky(desktopMq.matches && window.scrollY >= STICKY_AT);
      // Em telas de toque o menu expandido recolhe de novo ao rolar
      if (!canHoverRef.current) setIsHover(false);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Curvas e tempos. O site de referência usa 15 frames = 0,25s; aqui as animações são
  // desaceleradas pelo fator SLOWDOWN para o recolher/expandir ficar bem mais suave.
  const SLOWDOWN = 2.4;
  const t = (sec: number) => `${(sec * SLOWDOWN).toFixed(2)}s`;
  const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const EASE_SMOOTH = 'cubic-bezier(0.66, 0, 0.34, 1)';

  // Cor de fundo da barra (a cor dos itens recolhidos fica na camada de blend, em branco)
  const barBg = bannerMode ? '#000000' : '#F4EDDD';

  // Estilo único dos itens de texto da barra (abas, área administrativa e perfil)
  const navTextStyle = (isActive: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '13px', fontWeight: isActive ? 600 : 500,
    color: isActive ? fg : fgMuted,
    textTransform: 'lowercase', letterSpacing: '0.005em',
    padding: '6px 0',
    borderBottom: isActive ? `1px solid ${fg}` : '1px solid transparent',
    transition: 'color 0.2s, border-color 0.2s',
    display: 'inline-flex', alignItems: 'center', gap: '8px'
  });

  const menuItemStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: '9px 12px', borderRadius: '6px',
    fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, textAlign: 'left',
    textTransform: 'lowercase', transition: 'background 0.15s'
  };

  const statusLabel = isSuperAdmin ? 'Admin' : currentUser?.status === 'APPROVED' ? 'Aprovado' : 'Pendente';

  return (
    <>
    {/* Espaçador: mantém no fluxo a altura da barra, que é fixa na tela */}
    <div aria-hidden="true" style={{ height: 'var(--nav-h)' }} />
    <header
      onMouseEnter={() => { if (canHoverRef.current) setIsHover(true); }}
      onMouseLeave={() => { if (canHoverRef.current) setIsHover(false); }}
      style={{
        // Parada no topo: fundo sólido. "Grudada" (rolando): transparente, para não cobrir o conteúdo
        backgroundColor: isSticky ? 'transparent' : barBg,
        transition: `background-color ${t(0.25)} ${EASE_IN_OUT}`,
        borderBottom: '1px solid transparent',
        // Fixa: o logotipo e as ferramentas (recolhidos ou não) ficam sempre na tela, mesmo rolando
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 800,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      {/* Degradê suave atrás do menu quando expandido durante a rolagem (como no site de referência) */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: isSticky && !isCollapsed ? 1 : 0,
        transition: `opacity ${t(0.25)} ${EASE_IN_OUT}`,
        background: `linear-gradient(${barBg} 0%, ${barBg} 45%, transparent 100%)`
      }} />
      <div style={{
        width: '100%',
        // Distância do topo (--nav-top) é menor que a das laterais (--edge)
        padding: 'var(--nav-top) var(--edge) 0',
        height: 'var(--nav-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        // Ao "grudar", a barra sobe até 20px (como o top-20 → top-0 do site de referência)
        transform: isSticky ? 'translateY(calc(min(20px, var(--nav-top)) * -1))' : 'translateY(0)',
        transition: `transform ${t(0.25)} ${EASE_IN_OUT}`
      }}>
        {/* Brand / Logo — recolhe em um círculo quando a barra está "grudada" */}
        <div 
          onClick={() => setActiveTab('campaigns')}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', zIndex: 10 }}
        >
          {/* Reserva o espaço do círculo (desenhado na camada de blend abaixo) e mantém a área clicável do logo */}
          <span aria-hidden="true" style={{
            display: 'block',
            flex: '0 0 auto',
            width: isCollapsed ? '16px' : '0px',
            height: '16px',
            transition: isCollapsed
              ? `width ${t(0.5)} ${EASE_SMOOTH} ${t(0.3)}`
              : `width ${t(0.5)} ${EASE_SMOOTH}`
          }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: isCollapsed ? '0fr' : '1fr',
            transition: `grid-template-columns ${t(0.8)} ${EASE_SMOOTH}`
          }}>
            <span style={{
              display: 'block',
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              opacity: isCollapsed ? 0 : 1,
              transition: `opacity ${t(0.5)} ${EASE_SMOOTH}`
            }}>
              <h1 style={{ 
                fontSize: '19px', 
                fontWeight: 700, 
                color: fg, 
                margin: 0, 
                letterSpacing: '-0.035em',
                textTransform: 'lowercase'
              }}>
                taberna<span style={{ fontWeight: 400, color: fgMuted }}>digital.</span>
              </h1>
            </span>
          </div>
        </div>

        {/* Navegação + ações (alinhadas à direita, estilo minimalista em minúsculas) — somem com fade ao recolher */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '36px', zIndex: 10,
          opacity: isCollapsed ? 0 : 1,
          visibility: isCollapsed ? 'hidden' : 'visible',
          pointerEvents: isCollapsed ? 'none' : 'auto',
          transition: isCollapsed
            ? `opacity ${t(0.25)} ${EASE_IN_OUT}, visibility 0s linear ${t(0.25)}`
            : `opacity ${t(0.25)} ${EASE_IN_OUT} ${t(0.017)}, visibility 0s`
        }}>
        {isApproved && (
          <nav id="main-nav" className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  style={navTextStyle(isActive)}
                  onMouseEnter={(e) => e.currentTarget.style.color = fg}
                  onMouseLeave={(e) => e.currentTarget.style.color = isActive ? fg : fgMuted}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Área administrativa (somente super admin) */}
        {isSuperAdmin && (
          <button
            id="admin-exclusive-btn"
            className="desktop-only"
            onClick={onOpenAdmin}
            style={navTextStyle(false)}
            title="Área Administrativa"
            onMouseEnter={(e) => e.currentTarget.style.color = fg}
            onMouseLeave={(e) => e.currentTarget.style.color = fgMuted}
          >
            <span>área administrativa</span>
            {pendingCount > 0 && (
              <span style={{
                backgroundColor: '#f59e0b',
                color: '#000',
                fontSize: '9px',
                fontWeight: 800,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Perfil / Entrar */}
        {currentUser ? (
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              id="profile-menu-btn"
              onClick={() => setIsProfileOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
              style={navTextStyle(isProfileOpen)}
              onMouseEnter={(e) => e.currentTarget.style.color = fg}
              onMouseLeave={(e) => e.currentTarget.style.color = isProfileOpen ? fg : fgMuted}
            >
              perfil
            </button>

            {isProfileOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 18px)',
                  right: 0,
                  width: '248px',
                  backgroundColor: bannerMode ? '#111111' : '#F4EDDD',
                  border: `1px solid ${line}`,
                  borderRadius: '10px',
                  boxShadow: '0 18px 40px -12px rgba(30, 16, 8, 0.45)',
                  padding: '6px',
                  zIndex: 900,
                }}
              >
                <div style={{ padding: '10px 12px 12px', borderBottom: `1px solid ${line}`, marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: fg, wordBreak: 'break-word' }}>{currentUser.displayName}</div>
                  <div style={{ fontSize: '11px', color: fgMuted, wordBreak: 'break-all', marginTop: '2px' }}>{currentUser.email}</div>
                  <div style={{ fontSize: '11px', color: fgMuted, marginTop: '2px' }}>{statusLabel}</div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => { setIsProfileOpen(false); onOpenChangePassword(); }}
                  style={{ ...menuItemStyle, color: fg }}
                  onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <KeyRound size={15} /> trocar senha
                </button>

                <button
                  role="menuitem"
                  onClick={() => { setIsProfileOpen(false); onLogout(); }}
                  style={{ ...menuItemStyle, color: bannerMode ? '#fca5a5' : '#b91c1c' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} /> sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              background: '#15100b',
              color: '#f5ecdc',
              border: 'none',
              borderRadius: '30px',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 0.2s, opacity 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Entrar
          </button>
        )}
        </div>
      </div>
    </header>

    {/* Camada dos itens recolhidos (círculo do logo + ícone de menu). Fica acima da barra com
        mix-blend-mode: difference PERMANENTE (branco → claro no preto, escuro no creme); só escala
        e opacidade animam, então não há troca brusca de composição/cor durante as animações. */}
    <div aria-hidden={!isCollapsed} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 801,
      pointerEvents: 'none',
      mixBlendMode: 'difference'
    }}>
      <div style={{
        width: '100%',
        padding: 'var(--nav-top) var(--edge) 0',
        height: 'var(--nav-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        transform: isSticky ? 'translateY(calc(min(20px, var(--nav-top)) * -1))' : 'translateY(0)',
        transition: `transform ${t(0.25)} ${EASE_IN_OUT}`
      }}>
        <span style={{
          display: 'block',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          transform: isCollapsed ? 'scale(1)' : 'scale(0)',
          transition: isCollapsed
            ? `transform ${t(0.5)} ${EASE_SMOOTH} ${t(0.3)}`
            : `transform ${t(0.3)} ${EASE_SMOOTH}`
        }} />

        {/* Ícone de menu (2 linhas) — aparece só com a barra recolhida, como no site de referência */}
        <button
          type="button"
          id="nav-collapsed-menu"
          className="desktop-only"
          aria-label="Abrir menu"
          tabIndex={isCollapsed ? 0 : -1}
          onClick={() => setIsHover(true)}
          onFocus={() => setIsHover(true)}
          style={{
            background: 'none',
            border: 'none',
            padding: '14px 0 14px 14px',
            cursor: 'pointer',
            color: '#ffffff',
            pointerEvents: isCollapsed && !canHoverRef.current ? 'auto' : 'none'
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', width: '30px', height: '8px' }}>
            {[100, 40].map((w, i) => (
              <span key={w} style={{
                display: 'block',
                width: `${w}%`,
                height: '1px',
                backgroundColor: 'currentColor',
                transformOrigin: '100% 0',
                transform: isCollapsed ? 'scaleX(1)' : 'scaleX(0)',
                transition: isCollapsed
                  ? `transform ${t(0.2)} cubic-bezier(0.5, 0, 0.5, 1) ${t(0.17 + i * 0.033)}`
                  : `transform ${t(0.17)} cubic-bezier(0.32, 0.47, 0.83, 1) ${t(i * 0.033)}`
              }} />
            ))}
          </span>
        </button>
      </div>
    </div>
    </>
  );
};
