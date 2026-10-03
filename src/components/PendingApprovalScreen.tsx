import React from 'react';
import { Lock, Clock, ShieldAlert, RefreshCw, Crown, LogOut, Beer } from 'lucide-react';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../services/storage';

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
      maxWidth: '680px',
      margin: '40px auto',
      padding: '0 16px',
    }}>
      <div className="parchment-card" style={{ padding: '36px 28px', textAlign: 'center' }}>
        {/* Animated Torch/Lock Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#3e2412',
          border: '3px solid #b45309',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 24px rgba(245, 158, 11, 0.4)',
        }}>
          <Lock size={36} color="#fbbf24" className="torch-flicker" />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          Portão da Taberna Trancado
        </h2>

        <div className="wax-badge wax-badge-pending" style={{ marginBottom: '18px' }}>
          <Clock size={12} />
          Status: Aguardando Aprovação Administrativa
        </div>

        {/* Flavor Lore Narrative */}
        <p className="font-lore" style={{ fontSize: '18px', color: 'var(--ink-dark)', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic' }}>
          "O estalajadeiro olha suas botas empoeiradas e guarda a chave de bronze no bolso do avental de couro.
          'Paciência, forasteiro! Pelas regras da guilda, ninguém empunha dados ou consulta o oráculo Urd sem o salvo-conduto assinado pelo Taberneiro-Chefe.'"
        </p>

        {/* Technical & Administrative Notice */}
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          border: '1px solid var(--amber-torch)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'left',
          marginBottom: '28px',
          fontSize: '13px',
          color: 'var(--ink-dark)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700, color: 'var(--amber-deep)' }}>
            <ShieldAlert size={18} />
            Controle Obrigatório de Moderação
          </div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Sua conta (<strong>{user.email}</strong>) foi registrada com sucesso, mas o acesso aos módulos de <strong>Campanhas</strong>, <strong>Sketch Studio</strong> e <strong>Urd o Taberneiro</strong> requer aprovação expressa do administrador único:
          </p>
          <div style={{
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: '#fff',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#b45309'
          }}>
            {ADMIN_EMAIL}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', margin: '0 auto' }}>
          <button
            onClick={onRefresh}
            className="btn-tavern btn-primary"
            style={{ width: '100%' }}
          >
            <RefreshCw size={16} />
            Verificar se Já Fui Aprovado
          </button>

          <button
            onClick={onLogout}
            className="btn-tavern btn-secondary"
            style={{ width: '100%', color: 'var(--ink-dark)', borderColor: 'var(--parchment-dark)' }}
          >
            <LogOut size={15} />
            Trocar de Conta / Sair
          </button>
        </div>
      </div>
    </div>
  );
};
