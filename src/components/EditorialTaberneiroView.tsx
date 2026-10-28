import React, { useState, useRef, useEffect } from 'react';
import { Send, Beer } from 'lucide-react';
import { UrdMessage } from '../types';
import { aiService } from '../services/aiService';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialTaberneiroViewProps {
  onBack?: () => void;
  messages: UrdMessage[];
  campaigns?: { id: string; name: string }[];
  activeCampaignId?: string | null;
  onSendMessage: (sender: 'user' | 'urd', text: string) => void;
  onAddToLore?: (campaignId: string, title: string, content: string) => void;
  onClearChat?: () => void;
}

export const EditorialTaberneiroView: React.FC<EditorialTaberneiroViewProps> = ({
  onBack,
  messages,
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
    <main className="editorial-room-container">
      {/* 2. Cabeçalho Interno da Sala em Linha Única */}
      <div className="editorial-header-bar" style={{ maxWidth: '896px', margin: '0 auto 24px auto', width: '100%' }}>
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
            onClick={handleToast}
            className="editorial-segmented-item"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Beer size={13} />
            Brindar com Urd
          </button>
          {messages.length > 0 && onClearChat && (
            <button
              onClick={onClearChat}
              className="editorial-segmented-item"
            >
              Limpar Diálogo
            </button>
          )}
        </div>
      </div>

      {/* 3. Layout de Coluna Única Centralizada (max-w-4xl w-full mx-auto) */}
      <div className="max-w-4xl w-full mx-auto">
        <div className="editorial-frosted-card room-matte-III" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '12px' }}>
            SALA III • O ORÁCULO DA TAVERNA
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
              fontSize: 'clamp(32px, 4.5vw, 44px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 20px 0',
              color: 'inherit',
            }}
          >
            O Taberneiro
          </h1>

          {/* Diálogo em Cards Editoriais Claude Suaves */}
          <div
            className="editorial-claude-card dark-theme"
            style={{
              maxHeight: '440px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '20px',
              padding: '24px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.7, padding: '24px 0', textAlign: 'left' }}>
                Aproxime-se do balcão e puxe conversa com o taberneiro...
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                        fontSize: '11px',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        opacity: 0.6,
                        fontWeight: 600,
                      }}
                    >
                      {m.sender === 'user' ? 'Viajante' : 'Urd, o Taberneiro'}
                    </span>
                    {m.sender === 'urd' && onAddToLore && activeCampaignId && (
                      <button
                        onClick={() => onAddToLore(activeCampaignId, 'Relato de Urd', m.text)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11px',
                          color: 'inherit',
                          opacity: 0.55,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                        title="Salvar esta fala no Grimório"
                      >
                        Salvar no Grimório
                      </button>
                    )}
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
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte ao taberneiro sobre lendas, monstros ou rumores..."
              disabled={isLoading}
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
              disabled={isLoading || !inputText.trim()}
              className="editorial-btn-primary"
              style={{ opacity: isLoading || !inputText.trim() ? 0.5 : 1 }}
            >
              <Send size={14} />
              {isLoading ? 'Ouvindo...' : 'Consultar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
