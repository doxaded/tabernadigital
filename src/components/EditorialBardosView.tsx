import React, { useState, useEffect, useRef } from 'react';
import { Send, Dices, User } from 'lucide-react';
import { Campaign, ChatMessage, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialBardosViewProps {
  currentUser: UserProfile | null;
  campaigns: Campaign[];
  allUsers: UserProfile[];
  onOpenProfile?: (user: UserProfile) => void;
}

export const EditorialBardosView: React.FC<EditorialBardosViewProps> = ({
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
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px 24px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.6s ease',
      }}
    >
      <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px' }}>
        Sala IV • Confraria da Taberna
      </div>

      <h1
        style={{
          fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
          fontSize: 'clamp(34px, 5.5vw, 50px)',
          fontWeight: 500,
          margin: '0 0 12px 0',
          letterSpacing: '0.02em',
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
          margin: '0 0 28px 0',
          opacity: 0.85,
        }}
      >
        Onde os aventureiros partilham crônicas, trocam rumores e celebram com canecos erguidos.
      </p>

      {/* Ação de Rolagem Rápida */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleQuickDice}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '13px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.85,
          }}
          className="hover:opacity-100"
        >
          🎲 Lançar d20 na Mesa
        </button>
      </div>

      {/* Feed Tipográfico Limpo de Mensagens */}
      <div
        style={{
          width: '100%',
          maxHeight: '360px',
          overflowY: 'auto',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          borderTop: '1px solid rgba(230, 204, 178, 0.18)',
          borderBottom: '1px solid rgba(230, 204, 178, 0.18)',
          padding: '24px 8px',
          marginBottom: '24px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '16px', opacity: 0.7, padding: '20px 0' }}>
            O silêncio reina sob as vigas. Seja o primeiro a entoar uma canção ou rumor...
          </div>
        ) : (
          messages.slice(-20).map((m) => {
            const isMe = m.senderUid === currentUser?.uid;
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    opacity: isMe ? 0.9 : 0.65,
                    fontWeight: 600,
                  }}
                >
                  {m.senderName || 'Viajante'}
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

      {/* Formulário Minimalista de Envio */}
      <form
        onSubmit={handleSend}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Envie uma palavra à taverna ou digite /d20..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(230, 204, 178, 0.35)',
            padding: '8px 4px',
            fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
            fontSize: '16px',
            color: 'inherit',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 12px',
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '14px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
            cursor: 'pointer',
            color: 'inherit',
            opacity: !inputText.trim() ? 0.4 : 1,
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};
