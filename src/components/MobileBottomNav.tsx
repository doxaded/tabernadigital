import React from 'react';
import { BookOpen, Sparkles, Shield, Crown, User, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';

interface MobileBottomNavProps {
  activeTab: 'campaigns' | 'sketch' | 'urd' | 'chat';
  setActiveTab: (tab: 'campaigns' | 'sketch' | 'urd' | 'chat') => void;
  currentUser: UserProfile | null;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  pendingCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAdmin,
  onOpenAuth,
  pendingCount,
}) => {
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <nav className="mobile-only mobile-bottom-nav">
      <button
        onClick={() => setActiveTab('campaigns')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'campaigns' ? 'var(--amber-glow)' : '#a89a85',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          fontSize: '10px',
          fontFamily: 'var(--font-cinzel)',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '6px 8px'
        }}
      >
        <BookOpen size={19} />
        <span>Salão</span>
      </button>

      <button
        onClick={() => setActiveTab('sketch')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'sketch' ? 'var(--amber-glow)' : '#a89a85',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          fontSize: '10px',
          fontFamily: 'var(--font-cinzel)',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '6px 8px'
        }}
      >
        <Sparkles size={19} />
        <span>Alaúde</span>
      </button>

      <button
        onClick={() => setActiveTab('urd')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'urd' ? 'var(--amber-glow)' : '#a89a85',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          fontSize: '10px',
          fontFamily: 'var(--font-cinzel)',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '6px 8px'
        }}
      >
        <Shield size={19} />
        <span>Urd</span>
      </button>

      <button
        onClick={() => setActiveTab('chat')}
        style={{
          background: 'none',
          border: 'none',
          color: activeTab === 'chat' ? 'var(--amber-glow)' : '#a89a85',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          fontSize: '10px',
          fontFamily: 'var(--font-cinzel)',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '6px 8px'
        }}
      >
        <MessageSquare size={19} />
        <span>Chats</span>
      </button>

      {/* Admin Button on Mobile (Only for henrique.v.berbert@gmail.com) */}
      {isSuperAdmin ? (
        <button
          onClick={onOpenAdmin}
          style={{
            background: 'none',
            border: 'none',
            color: '#fbbf24',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px 10px',
            position: 'relative'
          }}
        >
          <Crown size={20} />
          <span>Admin</span>
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={onOpenAuth}
          style={{
            background: 'none',
            border: 'none',
            color: '#a89a85',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-cinzel)',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '6px 10px'
          }}
        >
          <User size={20} />
          <span>Conta</span>
        </button>
      )}
    </nav>
  );
};
