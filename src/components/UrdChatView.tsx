import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Beer, Sparkles, BookOpen, Copy, Check, RotateCcw, Flame, Swords, Skull, HelpCircle, Scroll as ScrollIcon, Trash2 } from 'lucide-react';
import { Campaign, UrdMessage } from '../types';
import { aiService } from '../services/aiService';
import { TavernInteractiveDesk } from './TavernInteractiveDesk';
import { tavernAudio } from '../services/tavernAudio';

interface UrdChatViewProps {
  onBack?: () => void;
  messages: UrdMessage[];
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSendMessage: (sender: 'user' | 'urd', text: string) => void;
  onAddToLore: (campaignId: string, title: string, content: string) => void;
  onClearChat: () => void;
}

const DWARVEN_TOASTS = [
  'Pelas barbas de Durin! Que sua lâmina nunca perca o fio e seu caneco nunca veja o fundo!',
  'Aos bravos que exploram criptas e aos espertos que voltam vivos para gastar o ouro aqui!',
  'Pelo fogo da montanha e pela espuma da cerveja! Que nenhuma flecha acerte suas costas!',
  'Em Pedra-Funda dizemos: quem bebe na mesma mesa não desembainha ferro na calada da noite!',
  'Um brinde aos mortos pelas armadilhas, aos vivos pelas poções, e aos deuses que cuidam dos tolos!',
];

const STONE_COASTERS: Array<{
  id: string;
  label: string;
  icon: React.ReactNode;
  text: string;
}> = [
  { id: 'rumores', label: 'Rumores da Noite', icon: <Beer size={13} />, text: 'Urd, que fofoca ou boato sinistro você ouviu dos viajantes na estalagem hoje?' },
  { id: 'gancho', label: 'Gancho de Missão', icon: <Swords size={13} />, text: 'Preciso de um gancho empolgante para um grupo de nível 3 que acabou de chegar a uma vila ribeirinha.' },
  { id: 'fera', label: 'Fera das Sombras', icon: <Skull size={13} />, text: 'Crie um encontro selvagem surpresa com uma besta das trevas e reviravolta ambiental.' },
  { id: 'enigma', label: 'Enigma de Cripta', icon: <HelpCircle size={13} />, text: 'Me dê um enigma inteligente para abrir a porta secreta de uma cripta sem usar chave.' },
  { id: 'causo', label: 'Causo Ancestral', icon: <ScrollIcon size={13} />, text: 'Conte uma lenda antiga sobre as forjas profundas e o que dorme sob os alicerces desta região.' },
];

export const UrdChatView: React.FC<UrdChatViewProps> = ({
  onBack,
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeCoaster, setActiveCoaster] = useState<string | null>(null);

  // Elementos Interativos do Balcão: Brinde com Urd e Lareira
  const [isToastClinking, setIsToastClinking] = useState(false);
  const [currentToast, setCurrentToast] = useState<string | null>(null);
  const [isHearthActive, setIsHearthActive] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const onPortraitMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: -((e.clientY - r.top) / r.height - 0.5) * 8,
      y: ((e.clientX - r.left) / r.width - 0.5) * 8,
    });
  };

  const handleToastWithUrd = () => {
    if (isToastClinking) return;
    setIsToastClinking(true);
    const chosen = DWARVEN_TOASTS[Math.floor(Math.random() * DWARVEN_TOASTS.length)];
    setTimeout(() => {
      setCurrentToast(chosen);
      setIsToastClinking(false);
    }, 400);
  };

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    onSendMessage('user', text);
    setInputText('');
    setIsLoading(true);

    try {
      const urdResponse = await aiService.chatWithUrd(text, messages);
      onSendMessage('urd', urdResponse);
    } catch (err) {
      onSendMessage(
        'urd',
        '*Urd cospe na serragem do balcão e resmunga:* Pelos deuses da montanha... minhas memórias se turvaram como cerveja velha. Tente me perguntar de novo, forasteiro!'
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

  const allRumors = [
    ...(activeCampaign?.lore?.filter(l => l.category === 'rumores').map(l => ({
      id: l.id,
      title: l.title,
      cat: 'LORE DA MESA',
      text: l.content
    })) || []),
    {
      id: 'd1',
      title: 'O Sino do Abismo',
      cat: 'RUMOR',
      text: 'Três mineiros juram ter ouvido o badalar de um carrilhão de bronze no fundo do poço da mina velha... mas não há sino lá há mais de cem anos.'
    },
    {
      id: 'd2',
      title: 'O Corvo de Prata',
      cat: 'CAUSO',
      text: 'Um mercador jurou que um corvo com penas metálicas deixou uma moeda sem face em seu prato na taverna antes de alçar voo rumo às montanhas.'
    },
    {
      id: 'd3',
      title: 'A Noite Sem Estrelas',
      cat: 'SEGREDO',
      text: 'O antigo livro de registros da estalagem tem doze páginas rasgadas do ano da Geada Negra. Ninguém em Pedra-Funda ousa falar o porquê.'
    }
  ];

  return (
    <div className="tavern-cockpit-view">
      {/* COCKPIT HEADER */}
      <header className="tavern-cockpit-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
          {onBack && (
            <button
              onClick={onBack}
              className="tavern-btn tavern-btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '6px'
              }}
              title="Voltar ao Salão Principal"
            >
              <ArrowLeft size={14} />
              <span>Salão</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid rgba(217, 119, 6, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}
            >
              <Beer size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#fef3c7', margin: 0, letterSpacing: '0.02em' }}>
                  Urd o Taberneiro
                </h1>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(217, 119, 6, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(217, 119, 6, 0.3)',
                    fontWeight: 700
                  }}
                >
                  ORÁCULO DA TAVERNA
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                {activeCampaign ? `Vinculado à mesa: ${activeCampaign.name}` : 'Consulte causos, ganchos de aventura e segredos de taverna'}
              </p>
            </div>
          </div>
        </div>

        {/* CENTRO: UTENSÍLIOS E DECORAÇÕES INTERATIVAS DA TABERNA */}
        <TavernInteractiveDesk />

        {/* AÇÕES NO TOPO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleToastWithUrd}
            className="tavern-btn tavern-btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Brindar com Urd e ouvir um causo anão"
          >
            <Beer size={13} color="#f59e0b" />
            <span>{isToastClinking ? 'Tilintando!' : 'Brinde com Urd'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHearthActive(prev => !prev)}
            className="tavern-btn tavern-btn-secondary"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isHearthActive ? '#fbbf24' : '#a89a8a'
            }}
            title="Alternar fogo da lareira"
          >
            <Flame size={13} color={isHearthActive ? '#f59e0b' : '#78716c'} />
            <span>{isHearthActive ? 'Fogo Alto' : 'Brasa'}</span>
          </button>
        </div>
      </header>

      {/* COCKPIT BODY: 3 COLUNAS EM TELA ÚNICA */}
      <div className="tavern-cockpit-body">
        {/* COLUNA 1: O TABERNEIRO & GATILHOS RÁPIDOS */}
        <aside
          className="tavern-cockpit-panel tavern-thin-scrollbar"
          style={{ width: '270px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '14px', gap: '12px' }}
        >
          {/* Retrato de Urd */}
          <div
            className="bardo__portrait"
            onMouseMove={onPortraitMove}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
            style={{
              transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              height: '140px',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img src="/assets/urd_portrait.jpg" alt="Urd de Pedra-Funda" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span className={`bardo__status${isLoading ? ' is-drawing' : ''}`}>
              <span className="bardo__status-dot" aria-hidden="true" />
              {isLoading ? 'Lembrando causos...' : 'Ao balcão'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Taberneiro & Oráculo
            </div>
            <h3 style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
              Urd de Pedra-Funda
            </h3>
          </div>

          {currentToast && (
            <div
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '6px',
                fontSize: '11px',
                fontStyle: 'italic',
                color: '#fef3c7',
                lineHeight: 1.4
              }}
            >
              &ldquo;{currentToast}&rdquo;
            </div>
          )}

          {/* Bolachas de Chopp (Tópicos Rápidos) */}
          <div>
            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Perguntas Rápidas:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {STONE_COASTERS.map(c => {
                const isSelected = activeCoaster === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCoaster(c.id);
                      handleSend(c.text);
                    }}
                    disabled={isLoading}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(217, 119, 6, 0.15)',
                      color: isSelected ? '#fbbf24' : '#f5ecdc',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    title={c.text}
                  >
                    <span style={{ color: '#f59e0b' }}>{c.icon}</span>
                    <span style={{ flex: 1 }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limpar conversa */}
          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(217, 119, 6, 0.15)' }}>
            <button
              type="button"
              onClick={onClearChat}
              className="tavern-btn tavern-btn-secondary"
              style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              title="Limpar mensagens e reiniciar conversa"
            >
              <RotateCcw size={12} />
              <span>Limpar Balcão</span>
            </button>
          </div>
        </aside>

        {/* COLUNA 2: A CONVERSA NO BALCÃO (CENTRAL) */}
        <main
          className="tavern-cockpit-panel"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {/* Feed de mensagens com scrollbar fina */}
          <div
            className="bardo__log tavern-thin-scrollbar"
            ref={logRef}
            role="log"
            aria-live="polite"
            style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {messages.map(msg => {
              const isUrd = msg.sender === 'urd';
              return (
                <div key={msg.id} className={`bardo-msg ${isUrd ? '' : 'bardo-msg--user'}`}>
                  {isUrd && (
                    <img className="bardo-msg__avatar" src="/assets/urd_portrait.jpg" alt="Urd" width={32} height={32} />
                  )}
                  <div className="bardo-msg__body">
                    <div className="bardo-msg__text">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: isUrd ? '#fbbf24' : '#f5ecdc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {isUrd ? 'Urd, o Taberneiro' : 'Aventureiro'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#78716c' }}>
                          {msg.timestamp}
                        </span>
                      </div>
                      <div className={isUrd ? 'font-lore' : ''} style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: 1.65, color: '#f5ecdc' }}>
                        {msg.text}
                      </div>

                      {isUrd && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(245, 236, 225, 0.15)' }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="tavern-btn tavern-btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiedId === msg.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                            <span>{copiedId === msg.id ? 'Copiado' : 'Copiar'}</span>
                          </button>

                          {activeCampaign && (
                            <button
                              type="button"
                              onClick={() => handleSaveToLore(msg)}
                              className="tavern-btn tavern-btn-primary"
                              style={{ padding: '3px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {savedToLoreId === msg.id ? <Check size={12} color="#34d399" /> : <BookOpen size={12} />}
                              <span>{savedToLoreId === msg.id ? 'Salvo no Lore!' : 'Salvar no Lore'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="bardo-msg">
                <img className="bardo-msg__avatar" src="/assets/urd_portrait.jpg" alt="Urd" width={32} height={32} />
                <div className="bardo-msg__body">
                  <div className="bardo-draw" aria-label="Urd está lembrando causos">
                    <Beer size={20} className="torch-flicker" color="#f59e0b" />
                    <span className="font-lore" style={{ fontStyle: 'italic', fontSize: '13px', color: '#fbbf24' }}>
                      Urd está enxugando a caneca de carvalho e rebuscando memórias ancestrais...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra de entrada / Compositor */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(217, 119, 6, 0.18)', backgroundColor: 'rgba(15, 10, 7, 0.7)' }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend(inputText);
              }}
              style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
            >
              <textarea
                rows={2}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputText);
                  }
                }}
                placeholder="Pergunte ao Urd sobre ideias de trama, ganchos de aventura, enigmas, boatos da taverna..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  borderRadius: '8px',
                  color: '#f5ecdc',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="tavern-btn tavern-btn-primary"
                style={{
                  padding: '12px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '52px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>Consultar Urd</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </main>

        {/* COLUNA 3: BOATOS DO BALCÃO & REGISTROS */}
        <aside
          className="tavern-cockpit-panel"
          style={{ width: '310px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Topo Coluna 3 */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Boatos do Balcão
            </span>
            <span style={{ fontSize: '10px', color: '#a89a8a' }}>
              {allRumors.length} registros
            </span>
          </div>

          {/* Lista com scrollbar interna fina */}
          <div className="tavern-thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allRumors.map(r => (
              <div
                key={r.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(20, 13, 9, 0.85)',
                  border: '1px solid rgba(217, 119, 6, 0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(217, 119, 6, 0.2)',
                      color: '#fbbf24',
                      textTransform: 'uppercase'
                    }}
                  >
                    {r.cat}
                  </span>
                  <span style={{ fontSize: '10px', color: '#78716c' }}>#segredo</span>
                </div>

                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#fef3c7' }}>
                  {r.title}
                </h4>

                <p className="font-lore" style={{ margin: 0, fontSize: '11px', color: '#d6c7b2', lineHeight: 1.4 }}>
                  &ldquo;{r.text}&rdquo;
                </p>

                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleSend(`Urd, me conte mais sobre "${r.title}": o que os viajantes andam falando a respeito?`)}
                    disabled={isLoading}
                    className="tavern-btn tavern-btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}
                  >
                    <Sparkles size={10} color="#f59e0b" />
                    <span>Investigar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(r.id, r.text)}
                    className="tavern-btn tavern-btn-secondary"
                    style={{ padding: '3px 6px', fontSize: '10px' }}
                    title="Copiar texto"
                  >
                    {copiedId === r.id ? <Check size={10} color="#34d399" /> : <Copy size={10} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
