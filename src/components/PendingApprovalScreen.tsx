import React from 'react';
import { Lock, Clock, ShieldAlert, RefreshCw, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface PendingApprovalScreenProps {
  user: UserProfile;
  onRefresh: () => void;
  onLogout: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  onRefresh,
  onLogout,
}) => {
  return (
    <div style={{
      maxWidth: '540px',
      margin: '60px auto',
      padding: '0 20px',
    }}>
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '48px 40px', 
        textAlign: 'center',
        boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)',
        border: '1px solid #f1f5f9'
      }}>
        {/* Animated Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <Lock size={32} color="#111" />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>
          Acesso Restrito
        </h2>

        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '24px',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          borderRadius: '16px',
          fontWeight: 500,
          fontSize: '12px',
          padding: '6px 14px'
        }}>
          <Clock size={14} />
          Aguardando Aprovação Administrativa
        </div>

        {/* Flavor Lore Narrative */}
        <p style={{ 
          fontSize: '15px', 
          color: '#64748b', 
          lineHeight: 1.6, 
          marginBottom: '32px', 
        }}>
          Sua solicitação de acesso foi registrada com sucesso e aguarda a revisão do administrador. 
          Você não poderá acessar o painel principal até que seu usuário ({user.email}) seja oficialmente aprovado.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
          <button
            onClick={onRefresh}
            style={{ 
              width: '100%',
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} />
            Atualizar Status
          </button>

          <button
            onClick={onLogout}
            style={{ 
              width: '100%',
              backgroundColor: '#fff',
              color: '#475569',
              border: '1px solid #e2e8f0',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
