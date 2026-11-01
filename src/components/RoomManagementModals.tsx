import React, { useEffect, useState } from 'react';
import { Crown, X, Scroll, Loader2 } from 'lucide-react';
import { Campaign, CampaignProgress, RoomPlayer } from '../types';

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  background: 'rgba(10, 6, 4, 0.82)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const card: React.CSSProperties = {
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#1a110b',
  border: '1px solid rgba(212,163,89,0.35)',
  borderRadius: '16px',
  padding: '26px',
  color: '#EAE0D5',
  boxShadow: '0 30px 70px -10px rgba(0,0,0,0.85)',
  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
};

const eyebrow: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#D4A359',
  opacity: 0.8,
  marginBottom: '6px',
};

const ModalHeader: React.FC<{ eyebrowText: string; title: string; onClose: () => void; icon: React.ReactNode }> = ({ eyebrowText, title, onClose, icon }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
    <div>
      <div style={eyebrow}>{eyebrowText}</div>
      <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        {title}
      </h3>
    </div>
    <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', color: '#EAE0D5', opacity: 0.7, cursor: 'pointer', padding: '4px' }}>
      <X size={20} />
    </button>
  </div>
);

/* ============ PASSAR MANTO DE MESTRE ============ */

interface TransferMasterModalProps {
  campaign: Campaign;
  onClose: () => void;
  onTransfer: (newMasterUid: string) => Promise<{ success: boolean; error?: string }>;
}

export const TransferMasterModal: React.FC<TransferMasterModalProps> = ({ campaign, onClose, onTransfer }) => {
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [error, setError] = useState('');
  const players: RoomPlayer[] = campaign.players || [];

  const handleConfirm = async (uid: string) => {
    setBusyUid(uid);
    setError('');
    const res = await onTransfer(uid);
    setBusyUid(null);
    if (res.success) onClose();
    else setError(res.error || 'Não foi possível passar o manto.');
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={{ ...card, maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <ModalHeader eyebrowText="Mesa • Cargo de Mestre" title="Passar Manto de Mestre" onClose={onClose} icon={<Crown size={22} color="#D4A359" />} />
        <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.85, margin: '0 0 18px', lineHeight: 1.5 }}>
          Escolha o aventureiro que assumirá a mesa <strong>{campaign.name}</strong>. Todas as permissões de administração serão transferidas imediatamente e você passará a ser jogador.
        </p>

        {players.length === 0 ? (
          <div style={{ padding: '18px', border: '1px dashed rgba(212,163,89,0.35)', borderRadius: '10px', fontStyle: 'italic', opacity: 0.8 }}>
            Ainda não há aventureiros nesta mesa. Compartilhe a chave da sala para que alguém ingresse.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {players.map(p => {
              const isConfirming = confirmUid === p.uid;
              return (
                <div
                  key={p.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid ' + (isConfirming ? 'rgba(212,163,89,0.6)' : 'rgba(255,255,255,0.1)'),
                    background: isConfirming ? 'rgba(212,163,89,0.1)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{p.name}</span>
                  {isConfirming ? (
                    <span style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleConfirm(p.uid)}
                        disabled={busyUid !== null}
                        className="editorial-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                      >
                        {busyUid === p.uid ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
                        Confirmar
                      </button>
                      <button onClick={() => setConfirmUid(null)} disabled={busyUid !== null} className="editorial-btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        Voltar
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmUid(p.uid)} className="editorial-btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                      Tornar Mestre
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && <div style={{ marginTop: '14px', color: '#f0a090', fontSize: '14px' }}>{error}</div>}
      </div>
    </div>
  );
};

/* ============ CRÔNICAS E PROGRESSO DA MESA ============ */

type ProgressForm = Omit<CampaignProgress, 'updatedAt' | 'updatedBy'>;

const EMPTY: ProgressForm = {
  chapterSummary: '',
  storyContext: '',
  location: '',
  npcs: '',
  quests: '',
  sessionNotes: '',
};

interface CampaignProgressModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSave: (data: ProgressForm) => { success: boolean; error?: string };
}

const FIELDS: { key: keyof ProgressForm; label: string; placeholder: string; rows: number }[] = [
  { key: 'chapterSummary', label: 'Resumo do Capítulo Atual', placeholder: 'O que aconteceu até aqui neste capítulo da saga...', rows: 3 },
  { key: 'storyContext', label: 'Contexto da História', placeholder: 'Premissa, conflitos centrais, segredos em jogo...', rows: 3 },
  { key: 'location', label: 'Localização Atual do Grupo', placeholder: 'Onde o grupo se encontra agora', rows: 1 },
  { key: 'npcs', label: 'NPCs Encontrados', placeholder: 'Nomes, papéis e atitudes dos personagens do mestre', rows: 3 },
  { key: 'quests', label: 'Missões em Andamento', placeholder: 'Objetivos ativos, pistas e prazos', rows: 3 },
  { key: 'sessionNotes', label: 'Notas de Sessão', placeholder: 'Lembretes para a próxima sessão', rows: 3 },
];

export const CampaignProgressModal: React.FC<CampaignProgressModalProps> = ({ campaign, onClose, onSave }) => {
  const [form, setForm] = useState<ProgressForm>(EMPTY);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const p = campaign.progress;
    setForm(p ? {
      chapterSummary: p.chapterSummary || '',
      storyContext: p.storyContext || '',
      location: p.location || '',
      npcs: p.npcs || '',
      quests: p.quests || '',
      sessionNotes: p.sessionNotes || '',
    } : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  const handleSave = () => {
    const res = onSave(form);
    setStatus(res.success ? { ok: true, msg: 'Progresso gravado nas crônicas da mesa.' } : { ok: false, msg: res.error || 'Falha ao salvar.' });
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(212,163,89,0.25)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#EAE0D5',
    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
    fontSize: '16px',
    outline: 'none',
    resize: 'vertical',
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={{ ...card, maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <ModalHeader eyebrowText={campaign.name} title="Crônicas e Progresso da Mesa" onClose={onClose} icon={<Scroll size={22} color="#D4A359" />} />
        <p style={{ fontStyle: 'italic', fontSize: '15px', opacity: 0.8, margin: '0 0 18px' }}>
          O que for gravado aqui alimenta o contexto do Oráculo do Mestre e do Taberneiro.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FIELDS.map(f => (
            <label key={f.key} style={{ display: 'block' }}>
              <span style={{ ...eyebrow, display: 'block' }}>{f.label}</span>
              {f.rows === 1 ? (
                <input
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={fieldStyle}
                />
              ) : (
                <textarea
                  rows={f.rows}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={fieldStyle}
                />
              )}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '22px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.75, color: status ? (status.ok ? '#b9d8a0' : '#f0a090') : '#EAE0D5' }}>
            {status
              ? status.msg
              : campaign.progress
                ? `Última atualização: ${new Date(campaign.progress.updatedAt).toLocaleString('pt-BR')} por ${campaign.progress.updatedBy}`
                : 'Nenhum progresso salvo ainda.'}
          </span>
          <button onClick={handleSave} className="editorial-btn-primary">
            Salvar Progresso
          </button>
        </div>
      </div>
    </div>
  );
};
