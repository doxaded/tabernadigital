import React, { useState, useRef, useEffect } from 'react';
import { Send, Beer, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { UrdMessage } from '../types';
import { aiService } from '../services/aiService';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialTaberneiroViewProps {
  messages: UrdMessage[];
  campaigns?: { id: string; name: string }[];
  activeCampaignId?: string | null;
  onSendMessage: (sender: 'user' | 'urd', text: string) => void;
  onAddToLore?: (campaignId: string, title: string, content: string) => void;
  onClearChat?: () => void;
}

const QUICK_PROMPTS = [
  { label: 'Rumores da Noite', text: 'Urd, que fofoca sinistra você ouviu dos viajantes na estalagem hoje?' },
  { label: 'Gancho de Missão', text: 'Preciso de um gancho empolgante para um grupo de aventureiros na mata.' },
  { label: 'Enigma de Cripta', text: 'Me dê um enigma inteligente para destrancar uma porta de pedra ancestral.' },
  { label: 'Lenda da Taberna', text: 'Conte uma lenda antiga sobre o fogo perpétuo desta lareira.' },
];

export const EditorialTaberneiroView: React.FC<EditorialTaberneiroViewProps> = ({
  messages,
  campaigns,
  activeCampaignId,
  onSendMessage,
  onAddToLore,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    onSendMessage('user', text);
    setIsLoading(true);
    tavernAudio.playBellChime();

    try {
      const reply = await aiService.chatWithUrd(text, messages);
      if (reply) {
        onSendMessage('urd', reply);
        tavernAudio.playToastSound();
      } else {
        onSendMessage('urd', 'O fogo da lareira crepitou alto demais e perdi sua fala, forasteiro. Diga novamente.');
      }
    } catch {
      onSendMessage('urd', 'Uma corrente de vento frio apagou a vela. Repita suas palavras.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToast = () => {
    tavernAudio.playToastSound();
    onSendMessage('urd', 'Pelas barbas de Durin! Que sua lâmina nunca perca o fio e seu caneco nunca veja o fundo!');
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
        Sala III • O Oráculo da Taverna
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
        O Taberneiro
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
        Urd, o anão de barbas grisalhas, guarda os segredos, lendas e caminhos esquecidos deste reino.
      </p>

      {/* Ações Rápidas de Diálogo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px', marginBottom: '28px' }}>
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleSend(qp.text)}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              color: 'inherit',
              cursor: 'pointer',
              opacity: 0.8,
            }}
            className="hover:opacity-100"
          >
            {qp.label}
          </button>
        ))}

        <button
          onClick={handleToast}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.8,
          }}
          className="hover:opacity-100"
        >
          Brinde com Caneca
        </button>
      </div>

      {/* Caixa de Mensagens Estilo Pérgula / Manuscrito Clássico */}
      <div
        style={{
          width: '100%',
          maxHeight: '360px',
          overflowY: 'auto',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          borderTop: '1px solid rgba(245, 230, 211, 0.2)',
          borderBottom: '1px solid rgba(245, 230, 211, 0.2)',
          padding: '24px 8px',
          marginBottom: '24px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '16px', opacity: 0.7, padding: '20px 0' }}>
            Aproxime-se do balcão e puxe conversa com o taberneiro...
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                }}
              >
                {m.sender === 'user' ? 'Viajante' : 'Urd, o Taberneiro'}
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontSize: '16px',
                  lineHeight: '1.75',
                  fontStyle: m.sender === 'urd' ? 'italic' : 'normal',
                  opacity: 0.95,
                  whiteSpace: 'pre-line',
                }}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Campo de Entrada de Consulta */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
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
          placeholder="Pergunte ao taberneiro sobre lendas, monstros ou rumores..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(245, 230, 211, 0.35)',
            padding: '8px 4px',
            fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
            fontSize: '16px',
            color: 'inherit',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
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
            cursor: isLoading ? 'wait' : 'pointer',
            color: 'inherit',
            opacity: isLoading || !inputText.trim() ? 0.4 : 1,
          }}
        >
          {isLoading ? 'Ouvindo...' : 'Consultar'}
        </button>

        {messages.length > 0 && onClearChat && (
          <button
            type="button"
            onClick={onClearChat}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '12px',
              opacity: 0.5,
              textDecoration: 'underline',
              color: 'inherit',
              cursor: 'pointer',
            }}
            title="Limpar histórico de conversa"
          >
            Limpar
          </button>
        )}
      </form>
    </div>
  );
};
