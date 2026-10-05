import React, { useState } from 'react';
import { X, Crown, CheckCircle2, XCircle, Users, ShieldAlert, Clock, Sparkles, AlertTriangle, KeyRound } from 'lucide-react';
import { UserProfile, Campaign } from '../types';
import { ADMIN_EMAIL } from '../services/storage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  campaigns: Campaign[];
  onApproveUser: (uid: string) => void;
  onRejectUser: (uid: string) => void;
  onOpenChangePassword?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  campaigns,
  onApproveUser,
  onRejectUser,
  onOpenChangePassword,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'stats'>('pending');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isSuperAdmin) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}
        onClick={onClose}
      >
        <div 
          onClick={e => e.stopPropagation()}
          style={{ 
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '40px', 
            textAlign: 'center', 
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>
            Acesso Restrito
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', lineHeight: 1.5 }}>
            A Câmara do Taberneiro-Chefe é exclusiva ao administrador <strong>{ADMIN_EMAIL}</strong>.
          </p>
          <button 
            onClick={onClose} 
            style={{
              backgroundColor: '#111',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Retornar
          </button>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const approvedUsers = users.filter(u => u.status === 'APPROVED');
  const totalCampaigns = campaigns.length;

  const btnStyle = (isActive: boolean) => ({
    background: 'none',
    border: 'none',
    borderBottom: isActive ? '2px solid #111' : '2px solid transparent',
    padding: '12px 0',
    color: isActive ? '#111' : '#64748b',
    fontWeight: isActive ? 600 : 400,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  });

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '800px', 
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '32px 40px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Painel Administrativo
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Gerenciamento de acessos e estatísticas do sistema.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {onOpenChangePassword && (
              <button
                onClick={() => { onClose(); onOpenChangePassword(); }}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  color: '#475569',
                  padding: '8px 12px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <KeyRound size={14} />
                <span className="desktop-only">Alterar Senha</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '32px',
          padding: '0 40px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <button style={btnStyle(activeTab === 'pending')} onClick={() => setActiveTab('pending')}>
            Pendentes {pendingUsers.length > 0 && <span style={{ backgroundColor: '#111', color: '#fff', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{pendingUsers.length}</span>}
          </button>
          <button style={btnStyle(activeTab === 'approved')} onClick={() => setActiveTab('approved')}>
            Aprovados
          </button>
          <button style={btnStyle(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>
            Estatísticas
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: PENDING */}
          {activeTab === 'pending' && (
            <div>
              {pendingUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <CheckCircle2 size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '16px', color: '#111', fontWeight: 500, margin: '0 0 8px 0' }}>Nenhum usuário pendente</p>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>A fila de aprovação está vazia.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingUsers.map(u => (
                    <div
                      key={u.uid}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#111', fontSize: '15px' }}>{u.displayName}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{u.email}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                          Criado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => onRejectUser(u.uid)}
                          style={{
                            background: 'none',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Rejeitar
                        </button>
                        <button
                          onClick={() => onApproveUser(u.uid)}
                          style={{
                            backgroundColor: '#111',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPROVED */}
          {activeTab === 'approved' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {approvedUsers.map(u => {
                const isCurrentAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                return (
                  <div
                    key={u.uid}
                    style={{
                      border: '1px solid #f1f5f9',
                      backgroundColor: '#fafafa',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#111', fontSize: '15px' }}>{u.displayName}</span>
                        {isCurrentAdmin && (
                          <span style={{ backgroundColor: '#111', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>ADMIN</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{u.email}</div>
                    </div>
                    {!isCurrentAdmin && (
                      <button
                        onClick={() => onRejectUser(u.uid)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Revogar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                <div style={{ border: '1px solid #f1f5f9', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#111' }}>{users.length}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Total de Contas</div>
                </div>
                <div style={{ border: '1px solid #f1f5f9', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#111' }}>{pendingUsers.length}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Fila de Espera</div>
                </div>
                <div style={{ border: '1px solid #f1f5f9', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#111' }}>{approvedUsers.length}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Aprovados</div>
                </div>
                <div style={{ border: '1px solid #f1f5f9', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: '#111' }}>{totalCampaigns}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Campanhas</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
