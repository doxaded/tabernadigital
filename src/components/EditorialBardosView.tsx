import React, { useState, useEffect, useRef } from 'react';
import { Send, Dices, User } from 'lucide-react';
import { Campaign, ChatMessage, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialBardosViewProps {
  onBack?: () => void;
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  allUsers: UserProfile[];
  onOpenProfile?: (user: UserProfile) => void;
}

export const EditorialBardosView: React.FC<EditorialBardosViewProps> = ({
  onBack,
  currentUser,
  campaigns,
  allUsers,
  onOpenProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeCampaign = campaigns[0];

  useEffect(() => {
    const unsub = chatService.subscribeChannel('room_geral', (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const text = inputText.trim();
    setInputText('');
    tavernAudio.playBellChime();

    await chatService.sendMessage({
      channelId: 'room_geral',
      scope: 'group',
      text,
      currentUser,
      campaignId: activeCampaign?.id,
      campaignName: activeCampaign?.name,
    });
  };

  const handleQuickDice = async () => {
    if (!currentUser) return;
    tavernAudio.playDiceRoll();
    await chatService.sendMessage({
      channelId: 'room_geral',
      scope: 'group',
      text: '/d20',
      currentUser,
      campaignId: activeCampaign?.id,
      campaignName: activeCampaign?.name,
    });
  };

  return (
    <main className="editorial-room-container">
      {/* 2. Cabeçalho Interno da Sala em Linha Única */}
      <div className="editorial-header-bar">
        <button
          onClick={() => {
            if (onBack) onBack();
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 0',
            cursor: 'pointer',
            color: 'inherit',
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '14px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'opacity 0.2s ease',
          }}
          className="hover:opacity-100"
        >
          ← Voltar à Galeria
        </button>

        <div className="editorial-segmented-control dark-theme">
          <button
            onClick={handleQuickDice}
            className="editorial-segmented-item"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Dices size={13} />
            Lançar d20 no Salão
          </button>
        </div>
      </div>

      {/* 3. Layout Assimétrico Estilo Kerbache HR / Claude (8 colunas / 4 colunas) */}
      <div className="editorial-grid-12">
        {/* Coluna Principal (Esquerda - 8 colunas) envolta em Bloco Fosco */}
        <div className="editorial-frosted-card room-matte-IV" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px' }}>
            SALA IV • CONFRARIA DA TAVERNA
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
              fontSize: 'clamp(32px, 4.5vw, 44px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              color: 'inherit',
            }}
          >
            Recanto dos Bardos
          </h1>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '17px',
              lineHeight: '1.7',
              maxWidth: '580px',
              margin: '0 0 24px 0',
              opacity: 0.85,
            }}
          >
            Onde os aventureiros partilham crônicas, trocam rumores e celebram com canecos erguidos ao redor do fogo.
          </p>

          {/* Feed Editorial Claude de Mensagens */}
          <div
            className="editorial-claude-card dark-theme"
            style={{
              maxHeight: '440px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '20px',
              padding: '24px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.7, padding: '24px 0', textAlign: 'left' }}>
                O silêncio reina sob as vigas. Seja o primeiro a entoar uma canção ou rumor...
              </div>
            ) : (
              messages.slice(-30).map((m) => {
                const isMe = m.senderUid === currentUser?.uid;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                          fontSize: '12px',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          opacity: isMe ? 0.95 : 0.65,
                          fontWeight: 600,
                        }}
                      >
                        {m.senderName || 'Viajante'}
                      </span>
                      {m.createdAt && (
                        <span style={{ fontSize: '10px', opacity: 0.45 }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                        fontSize: '16px',
                        lineHeight: '1.7',
                        opacity: 0.95,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário de Envio Alinhado à Esquerda */}
          <form
            onSubmit={handleSend}
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Envie uma palavra à taverna ou digite /d20..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '14px 18px',
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontSize: '16px',
                color: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="editorial-btn-primary"
              style={{ opacity: !inputText.trim() ? 0.5 : 1 }}
            >
              <Send size={14} />
              Enviar
            </button>
          </form>
        </div>

        {/* Coluna Lateral (Direita - 4 colunas): Card Editorial Claude Fosco */}
        <aside className="editorial-frosted-card room-matte-IV">
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '14px', fontWeight: 600 }}>
            Viajantes na Estalagem
          </div>

          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Salão Ativo</span>
            <span className="editorial-meta-value">{activeCampaign?.name || 'Geral'}</span>
          </div>

          <div className="editorial-meta-row">
            <span className="editorial-meta-label">Presentes</span>
            <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {allUsers.length || 1}
            </span>
          </div>

          <div style={{ marginTop: '20px', marginBottom: '12px', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6 }}>
            Membros da Confraria
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allUsers.slice(0, 6).map((u) => (
              <div
                key={u.uid}
                onClick={() => onOpenProfile?.(u)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  cursor: onOpenProfile ? 'pointer' : 'default',
                  opacity: 0.85,
                }}
                className="hover:opacity-100"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={13} style={{ opacity: 0.6 }} />
                  <span style={{ fontWeight: 500 }}>{u.displayName || u.email?.split('@')[0] || 'Aventureiro'}</span>
                </div>
                <span className="editorial-pill-tag" style={{ fontSize: '9px', padding: '2px 6px' }}>
                  {u.title || 'Viajante'}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.7, lineHeight: '1.6', marginTop: '20px', marginBottom: 0 }}>
            Utilize comandos rápidos como <code style={{ fontStyle: 'normal', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px' }}>/d20</code> ou <code style={{ fontStyle: 'normal', background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '4px' }}>/d6</code> para rolar dados visíveis a todos os presentes.
          </p>
        </aside>
      </div>
    </main>
  );
};
