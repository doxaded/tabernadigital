import React from 'react';
import { Shield, Sparkles, BookOpen, Crown, LogOut, UserCheck, Flame, KeyRound } from 'lucide-react';
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenAuth,
  onOpenChangePassword,
  onLogout,
  pendingCount,
}) => {
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isApproved = currentUser?.status === 'APPROVED';

  return (
    <header style={{
      backgroundColor: '#050505',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 800,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 32px',
        height: '76px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('campaigns')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', zIndex: 10 }}
        >
          <h1 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#ffffff', 
            margin: 0, 
            letterSpacing: '-0.03em',
          }}>
            Taberna Digital.
          </h1>
          <Flame size={16} color="#f59e0b" style={{ marginTop: '-4px' }} />
        </div>

        {/* Desktop Navigation Tabs */}
        {isApproved && (
          <nav className="desktop-only" style={{ 
            display: 'flex', 
            gap: '40px', 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          }}>
            <button
              onClick={() => setActiveTab('campaigns')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: activeTab === 'campaigns' ? 600 : 500,
                color: activeTab === 'campaigns' ? '#ffffff' : '#71717a',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'color 0.2s', padding: '26px 0',
                borderBottom: activeTab === 'campaigns' ? '2px solid #ffffff' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = activeTab === 'campaigns' ? '#ffffff' : '#71717a'}
            >
              Campanhas
            </button>

            <button
              onClick={() => setActiveTab('sketch')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: activeTab === 'sketch' ? 600 : 500,
                color: activeTab === 'sketch' ? '#ffffff' : '#71717a',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'color 0.2s', padding: '26px 0',
                borderBottom: activeTab === 'sketch' ? '2px solid #ffffff' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = activeTab === 'sketch' ? '#ffffff' : '#71717a'}
            >
              Sketch Studio
            </button>

            <button
              onClick={() => setActiveTab('urd')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: activeTab === 'urd' ? 600 : 500,
                color: activeTab === 'urd' ? '#ffffff' : '#71717a',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'color 0.2s', padding: '26px 0',
                borderBottom: activeTab === 'urd' ? '2px solid #ffffff' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = activeTab === 'urd' ? '#ffffff' : '#71717a'}
            >
              Urd
            </button>
          </nav>
        )}

        {/* User Status & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10 }}>
          {isSuperAdmin && (
            <button
              id="admin-exclusive-btn"
              onClick={onOpenAdmin}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '30px',
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              title="Área Administrativa"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>Admin</span>
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

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                onClick={onOpenAuth}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px'
                }}>
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="desktop-only" style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                    {currentUser.displayName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>
                    {isSuperAdmin ? 'Admin' : currentUser.status === 'APPROVED' ? 'Aprovado' : 'Pendente'}
                  </div>
                </div>
              </div>

              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onOpenChangePassword}
                  style={{
                    background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                  }}
                  title="Trocar Senha"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
                >
                  <KeyRound size={16} />
                </button>

                <button
                  onClick={onLogout}
                  style={{
                    background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                  }}
                  title="Sair"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: '#ffffff',
                color: '#000000',
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
  );
};
