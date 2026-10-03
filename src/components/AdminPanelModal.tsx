import React, { useState } from 'react';
import { X, Crown, CheckCircle2, XCircle, Users, ShieldAlert, Clock, Sparkles, AlertTriangle } from 'lucide-react';
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
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  campaigns,
  onApproveUser,
  onRejectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'stats'>('pending');

  if (!isOpen) return null;

  // Verificação estrita de autorização
  const isSuperAdmin = currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isSuperAdmin) {
    return (
      <div className="tavern-modal-backdrop" onClick={onClose}>
        <div 
          className="tavern-modal-content parchment-card" 
          onClick={e => e.stopPropagation()}
          style={{ padding: '32px', textAlign: 'center', maxWidth: '480px' }}
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
            border: '2px solid #ef4444'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>
            Acesso Restrito & Negado
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-dark)', marginBottom: '20px' }}>
            A Câmara do Taberneiro-Chefe é de acesso <strong>exclusivo e estrito</strong> ao usuário:
            <br />
            <strong style={{ color: '#b45309' }}>{ADMIN_EMAIL}</strong>.
            <br />
            Seu usuário atual não possui credenciais administrativas.
          </p>
          <button onClick={onClose} className="btn-tavern btn-primary" style={{ margin: '0 auto' }}>
            Retornar ao Salão Comum
          </button>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const approvedUsers = users.filter(u => u.status === 'APPROVED');
  const totalCampaigns = campaigns.length;

  return (
    <div className="tavern-modal-backdrop" onClick={onClose}>
      <div 
        className="tavern-modal-content wood-panel wood-panel-glow" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '780px', padding: '0', overflow: 'hidden' }}
      >
        {/* Admin Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #2a180b 0%, #160e07 100%)',
          borderBottom: '2px solid var(--amber-deep)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
            }}>
              <Crown size={24} color="#facc15" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fef3c7', margin: 0 }}>
                  Câmara do Taberneiro-Chefe
                </h2>
                <span className="wax-badge wax-badge-admin">Exclusivo: Henrique Berbert</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--amber-torch)', margin: 0 }}>
                Painel Administrativo & Controle Central de Aventureiros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--parchment-base)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid var(--wood-border)'
        }}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`btn-tavern ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <Clock size={15} />
            Pendentes ({pendingUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`btn-tavern ${activeTab === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <Users size={15} />
            Membros Aprovados ({approvedUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`btn-tavern ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <Sparkles size={15} />
            Estatísticas da Taberna
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {/* TAB 1: PENDING USERS (REQUIRE APPROVAL) */}
          {activeTab === 'pending' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#fff4d9', margin: 0 }}>
                    Solicitações de Acesso Pendentes
                  </h3>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0' }}>
                    Novos aventureiros que registraram conta e aguardam seu aval para explorar a taberna.
                  </p>
                </div>
                {pendingUsers.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>
                    {pendingUsers.length} aguardando
                  </span>
                )}
              </div>

              {pendingUsers.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  border: '1px dashed var(--wood-border)'
                }}>
                  <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>
                    Nenhum aventureiro na fila de espera!
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Todos os cadastros foram avaliados ou não há novas solicitações no momento.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingUsers.map(u => (
                    <div
                      key={u.uid}
                      style={{
                        backgroundColor: 'var(--wood-medium)',
                        border: '1px solid var(--amber-deep)',
                        borderRadius: '8px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#fef3c7', fontSize: '14px' }}>
                            {u.displayName}
                          </span>
                          <span className="wax-badge wax-badge-pending">Pendente</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {u.email}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--amber-torch)', marginTop: '4px' }}>
                          Cadastrado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')} às {new Date(u.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onApproveUser(u.uid)}
                          className="btn-tavern"
                          style={{
                            backgroundColor: '#065f46',
                            color: '#ecfdf5',
                            border: '1px solid #10b981',
                            padding: '6px 14px',
                            fontSize: '11px'
                          }}
                        >
                          <CheckCircle2 size={15} />
                          Aprovar Entrada
                        </button>

                        <button
                          onClick={() => onRejectUser(u.uid)}
                          className="btn-tavern"
                          style={{
                            backgroundColor: '#7f1d1d',
                            color: '#fee2e2',
                            border: '1px solid #ef4444',
                            padding: '6px 14px',
                            fontSize: '11px'
                          }}
                        >
                          <XCircle size={15} />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPROVED USERS */}
          {activeTab === 'approved' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', color: '#fff4d9', margin: 0 }}>
                  Aventureiros com Acesso Autorizado
                </h3>
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0' }}>
                  Usuários que possuem salvo-conduto ativo para criar salas, consultar Urd e usar o Sketch Studio.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {approvedUsers.map(u => {
                  const isCurrentAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  return (
                    <div
                      key={u.uid}
                      style={{
                        backgroundColor: 'var(--wood-dark)',
                        border: '1px solid var(--wood-border)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#fef3c7', fontSize: '14px' }}>
                            {u.displayName}
                          </span>
                          {isCurrentAdmin ? (
                            <span className="wax-badge wax-badge-admin">Mestre Taberneiro</span>
                          ) : (
                            <span className="wax-badge wax-badge-approved">Aprovado</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {u.email}
                        </div>
                      </div>

                      {!isCurrentAdmin && (
                        <button
                          onClick={() => onRejectUser(u.uid)}
                          className="btn-tavern btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '11px', color: '#fca5a5' }}
                          title="Revogar salvo-conduto"
                        >
                          Revogar Acesso
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STATS & AUDIT */}
          {activeTab === 'stats' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{
                  backgroundColor: 'var(--wood-dark)',
                  border: '1px solid var(--wood-border)',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#facc15' }}>
                    {users.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total de Usuários
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--wood-dark)',
                  border: '1px solid var(--amber-torch)',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>
                    {pendingUsers.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pendentes de Aprovação
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--wood-dark)',
                  border: '1px solid #10b981',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
                    {approvedUsers.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Aprovados Ativos
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--wood-dark)',
                  border: '1px solid #6366f1',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#a5b4fc' }}>
                    {totalCampaigns}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Campanhas Ativas
                  </div>
                </div>
              </div>

              {/* Security Audit Note */}
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px 18px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#e2e8f0',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, color: '#facc15', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crown size={15} />
                  Garantia de Segurança Restrita
                </div>
                O painel administrativo está amarrado ao e-mail <strong>{ADMIN_EMAIL}</strong>. Qualquer tentativa de acesso por outros endereços de e-mail é automaticamente bloqueada tanto no front-end quanto nas regras de segurança.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
