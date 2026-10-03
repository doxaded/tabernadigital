import React, { useState, useRef, useEffect } from 'react';
import { Send, Beer, Sparkles, BookOpen, Copy, Check, RotateCcw, Volume2, Shield } from 'lucide-react';
import { Campaign, UrdMessage } from '../types';
import { aiService } from '../services/aiService';

interface UrdChatViewProps {
  messages: UrdMessage[];
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSendMessage: (sender: 'user' | 'urd', text: string) => void;
  onAddToLore: (campaignId: string, title: string, content: string) => void;
  onClearChat: () => void;
}

export const UrdChatView: React.FC<UrdChatViewProps> = ({
  messages,
  campaigns,
  activeCampaignId,
  onSendMessage,
  onAddToLore,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedToLoreId, setSavedToLoreId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  const QUICK_QUESTIONS = [
    { label: '🍺 Rumor da Taverna', text: 'Urd, que fofoca ou boato sinistro você ouviu dos viajantes na estalagem hoje?' },
    { label: '⚔️ Gancho de Aventura', text: 'Preciso de um gancho empolgante para um grupo de nível 3 que acabou de chegar a uma vila ribeirinha.' },
    { label: '🧌 Emboscada na Mata', text: 'Crie um encontro selvagem surpresa com reviravolta ambiental (névoa, lama, terreno desmoronando).' },
    { label: '🧩 Enigma de Masmorra', text: 'Me dê um enigma inteligente para abrir a porta secreta de uma cripta sem usar chave.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    // Adiciona mensagem do usuário
    onSendMessage('user', text);
    setInputText('');
    setIsLoading(true);

    try {
      const urdResponse = await aiService.chatWithUrd(text, messages);
      onSendMessage('urd', urdResponse);
    } catch (err) {
      onSendMessage(
        'urd',
        '*Urd tosse com a fumaça da lareira.* "Perdoe este velho, viajante! Minha cabeça deu um nó com tantas canecas. Repita o que disse, por favor!"'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToLore = (msg: UrdMessage) => {
    if (!activeCampaign) {
      alert('Selecione ou crie uma campanha primeiro para salvar o lore.');
      return;
    }
    const title = 'Rumor de Urd: ' + msg.text.slice(0, 35).replace(/[*#]/g, '') + '...';
    onAddToLore(activeCampaign.id, title, msg.text);
    setSavedToLoreId(msg.id);
    setTimeout(() => setSavedToLoreId(null), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* Tavernkeeper Header Card */}
      <div className="wood-panel wood-panel-glow" style={{
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            position: 'relative',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--amber-torch)',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
            backgroundColor: '#1b1008'
          }}>
            <img
              src="/assets/urd_portrait.jpg"
              alt="Urd, o Taberneiro"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fef3c7', margin: 0 }}>
                Urd, o Taberneiro
              </h2>
              <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
                Oráculo Narrativo
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--amber-torch)', margin: '3px 0 0' }}>
              "Cerveja fresca, conselhos práticos e histórias que nenhum bardo ousa cantar."
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClearChat}
            className="btn-tavern btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
            title="Limpar conversa e reiniciar o balcão"
          >
            <RotateCcw size={14} />
            <span>Limpar Balcão</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="parchment-card" style={{
        padding: '20px',
        minHeight: '420px',
        maxHeight: '600px',
        overflowY: 'auto',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map(msg => {
          const isUrd = msg.sender === 'urd';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUrd ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                flexDirection: isUrd ? 'row' : 'row-reverse',
              }}
            >
              {/* Avatar Icon */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: isUrd ? '#3e2412' : 'var(--amber-torch)',
                border: isUrd ? '2px solid var(--amber-torch)' : '2px solid #fbbf24',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {isUrd ? (
                  <img src="/assets/urd_portrait.jpg" alt="Urd" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '13px' }}>Você</span>
                )}
              </div>

              {/* Message Box */}
              <div style={{
                backgroundColor: isUrd ? 'rgba(255, 255, 255, 0.7)' : '#3e2412',
                color: isUrd ? 'var(--ink-dark)' : '#fef3c7',
                padding: '14px 18px',
                borderRadius: '10px',
                border: isUrd ? '1px solid #ccb993' : '1px solid #6b4020',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isUrd ? 'var(--amber-deep)' : '#f59e0b' }}>
                    {isUrd ? 'Urd, o Taberneiro' : 'Mestre / Jogador'}
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>
                    {msg.timestamp}
                  </span>
                </div>

                <div className={isUrd ? 'font-lore' : ''} style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {msg.text}
                </div>

                {/* Actions for Urd Messages */}
                {isUrd && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #ccb993' }}>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: 'var(--ink-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px'
                      }}
                    >
                      {copiedId === msg.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      {copiedId === msg.id ? 'Copiado!' : 'Copiar'}
                    </button>

                    {activeCampaign && (
                      <button
                        onClick={() => handleSaveToLore(msg)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: 'var(--amber-deep)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px'
                        }}
                      >
                        {savedToLoreId === msg.id ? <Check size={13} color="#10b981" /> : <BookOpen size={13} />}
                        {savedToLoreId === msg.id ? 'Salvo no Lore!' : `Salvar no Lore de "${activeCampaign.name.slice(0, 18)}..."`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#3e2412',
              border: '2px solid var(--amber-torch)',
              overflow: 'hidden'
            }}>
              <img src="/assets/urd_portrait.jpg" alt="Urd" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid #ccb993',
              fontSize: '14px',
              color: 'var(--ink-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Beer size={18} className="torch-flicker" color="var(--amber-deep)" />
              <span className="font-lore" style={{ fontStyle: 'italic' }}>
                Urd está enxugando uma caneca e lembrando de uma história...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Prompt Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => handleSend(q.text)}
            disabled={isLoading}
            className="btn-tavern btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              minHeight: '34px'
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend(inputText);
        }}
        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Pergunte ao Urd sobre ideias de trama, ganchos de aventura, enigmas..."
          disabled={isLoading}
          className="tavern-input font-lore"
          style={{
            flex: 1,
            fontSize: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--ink-dark)',
            border: '2px solid var(--amber-deep)',
            minHeight: '44px'
          }}
        />

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="btn-tavern btn-primary"
          style={{ minHeight: '44px', padding: '0 20px' }}
        >
          <Send size={16} />
          <span className="desktop-only">Consultar Urd</span>
        </button>
      </form>
    </div>
  );
};
