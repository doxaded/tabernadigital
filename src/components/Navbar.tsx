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
      backgroundColor: 'var(--wood-dark)',
      borderBottom: '2px solid var(--wood-border)',
      position: 'sticky',
      top: 0,
      zIndex: 800,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('campaigns')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'var(--wood-medium)',
            border: '2px solid var(--amber-torch)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(245, 158, 11, 0.4)',
            overflow: 'hidden'
          }}>
            <img src="/icon.svg" alt="Taberna Digital" style={{ width: '32px', height: '32px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fef3c7', margin: 0, letterSpacing: '0.04em' }}>
                TABERNA DIGITAL
              </h1>
              <Flame size={16} color="var(--amber-glow)" className="torch-flicker" />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--amber-torch)', fontFamily: 'var(--font-cinzel)', margin: 0 }}>
              Companheiro de RPG de Mesa
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Only if approved) */}
        {isApproved && (
          <nav className="desktop-only" style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`btn-tavern ${activeTab === 'campaigns' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              <BookOpen size={16} />
              Campanhas
            </button>

            <button
              onClick={() => setActiveTab('sketch')}
              className={`btn-tavern ${activeTab === 'sketch' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              <Sparkles size={16} />
              Sketch Studio
            </button>

            <button
              onClick={() => setActiveTab('urd')}
              className={`btn-tavern ${activeTab === 'urd' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              <Shield size={16} />
              Urd, o Taberneiro
            </button>
          </nav>
        )}

        {/* User Status & Admin Exclusive Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Admin Exclusive Button (Strictly for henrique.v.berbert@gmail.com) */}
          {isSuperAdmin && (
            <button
              id="admin-exclusive-btn"
              onClick={onOpenAdmin}
              className="btn-tavern"
              style={{
                background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
                color: '#fffbeb',
                border: '1px solid #f59e0b',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
                padding: '6px 14px',
                fontSize: '11px',
                position: 'relative'
              }}
              title="Área Administrativa exclusiva de Henrique Berbert"
            >
              <Crown size={15} color="#fef08a" />
              <span className="desktop-only">Câmara do Taberneiro</span>
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fff'
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* Current User Badge */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                onClick={onOpenAuth}
                style={{
                  backgroundColor: 'var(--wood-medium)',
                  border: '1px solid var(--wood-border)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isSuperAdmin ? '#b45309' : '#3e2412',
                  border: isSuperAdmin ? '1px solid #f59e0b' : '1px solid #6b4020',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px'
                }}>
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="desktop-only" style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fef3c7', lineHeight: 1.1 }}>
                    {currentUser.displayName}
                  </div>
                  <div style={{ fontSize: '10px', color: isSuperAdmin ? '#f59e0b' : currentUser.status === 'APPROVED' ? '#34d399' : '#fbbf24' }}>
                    {isSuperAdmin ? 'Taberneiro-Chefe (Admin)' : currentUser.status === 'APPROVED' ? 'Aventureiro Aprovado' : 'Aguardando Aprovação'}
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenChangePassword}
                className="btn-tavern btn-secondary"
                style={{ padding: '8px 10px', minHeight: 'unset' }}
                title="Trocar Palavra Secreta (Senha)"
              >
                <KeyRound size={15} color="#fbbf24" />
              </button>

              <button
                onClick={onLogout}
                className="btn-tavern btn-secondary"
                style={{ padding: '8px 10px', minHeight: 'unset' }}
                title="Sair da Taberna"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-tavern btn-primary"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              <UserCheck size={16} />
              Entrar na Taberna
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
