import React, { useState, useRef, useEffect } from 'react';
import { Send, Beer, Sparkles, BookOpen, Copy, Check, RotateCcw, Flame, Swords, Skull, HelpCircle, Scroll as ScrollIcon, Trash2 } from 'lucide-react';
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

  return (
    <div className="urd-view" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#000000', color: '#f5ecdc', padding: 0, margin: 0 }}>
      {/* ========================================================================= */}
      {/* BALCÃO DO TABERNEIRO — Tela maximizada com Urd de Pedra-Funda */}
      {/* ========================================================================= */}
      <section className="bardo urd-chamber" aria-label="Balcão de Pedra e Lareira de Urd">
        <div className="bardo__inner">
          <aside className="bardo__side">
            <div
              className="bardo__portrait"
              onMouseMove={onPortraitMove}
              onMouseLeave={() => setTilt({ x: 0, y: 0 })}
              style={{ transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
            >
              <img
                src="/assets/urd_portrait.jpg"
                alt="Urd de Pedra-Funda, o taberneiro"
                width={640}
                height={640}
              />
              <span className={`bardo__status${isLoading ? ' is-drawing' : ''}`}>
                <span className="bardo__status-dot" aria-hidden="true" />
                {isLoading ? 'Lembrando causos' : 'Ao balcão'}
              </span>
            </div>

            <div className="bardo__who">
              <span className="bardo__eyebrow" style={{ color: '#f59e0b', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>TABERNEIRO &amp; ORÁCULO</span>
              <strong className="bardo__name">URD DE PEDRA-FUNDA</strong>
            </div>

            <div className="bardo__slots" title={`Mesa ativa: ${activeCampaign ? activeCampaign.name : 'Nenhuma selecionada'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Beer size={14} color="#f59e0b" />
                <span>Caneca de Carvalho</span>
              </div>
              <span style={{ fontSize: '11px', color: '#8A8275', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {activeCampaign ? (
                  <>Vinculado à mesa <strong>{activeCampaign.name}</strong></>
                ) : (
                  'PRONTO PARA OUVIR SEUS PEDIDOS'
                )}
              </span>
            </div>

            {/* Ações do Balcão */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleToastWithUrd}
                className="bardo-chip urd-action-btn"
                style={{
                  justifyContent: 'center',
                  background: isToastClinking ? '#FAF7F2' : 'rgba(255, 255, 255, 0.05)',
                  color: isToastClinking ? '#0A0A0A' : '#FAF7F2',
                  borderColor: 'rgba(242, 236, 225, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                title="Bater canecos e ouvir um brinde anão"
              >
                <Beer size={14} />
                <span>{isToastClinking ? 'Bate Canecos!' : 'Brinde com Urd!'}</span>
              </button>

              {currentToast && (
                <div style={{ padding: '10px 12px', background: '#141414', border: '1px solid rgba(242, 236, 225, 0.25)', borderRadius: '6px', fontSize: '12px', color: '#FAF7F2', fontStyle: 'italic', lineHeight: 1.4 }}>
                  &ldquo;{currentToast}&rdquo;
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsHearthActive(prev => !prev)}
                className="bardo-chip urd-action-btn"
                style={{
                  justifyContent: 'center',
                  color: '#FAF7F2',
                  borderColor: isHearthActive ? 'rgba(242, 236, 225, 0.4)' : 'rgba(242, 236, 225, 0.15)',
                  background: isHearthActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
                }}
                title="Alternar estado da lareira da taberna"
              >
                <Flame size={13} style={{ opacity: isHearthActive ? 1 : 0.4 }} />
                <span>{isHearthActive ? 'Lareira: Crepitante' : 'Lareira: Baixa'}</span>
              </button>

              <button
                type="button"
                onClick={onClearChat}
                className="bardo-chip urd-action-btn"
                title="Limpar balcão e reiniciar conversa"
                style={{ justifyContent: 'center', color: '#EAE2D3', borderColor: 'rgba(242, 236, 225, 0.2)' }}
              >
                <RotateCcw size={13} />
                <span>Limpar Balcão</span>
              </button>
            </div>
          </aside>

          <div className="bardo__chat">
            <div className="bardo__log" ref={logRef} role="log" aria-live="polite" aria-label="Conversa com o taberneiro">
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
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#FAF7F2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {isUrd ? 'Urd, o Taberneiro' : 'Aventureiro'}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {msg.timestamp}
                          </span>
                        </div>
                        <div className={isUrd ? 'font-lore' : ''} style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: 1.65 }}>
                          {msg.text}
                        </div>

                        {isUrd && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(245, 236, 225, 0.15)' }}>
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="bardo-chip"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              {copiedId === msg.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                              <span>{copiedId === msg.id ? 'Copiado' : 'Copiar'}</span>
                            </button>

                            {activeCampaign && (
                              <button
                                type="button"
                                onClick={() => handleSaveToLore(msg)}
                                className="bardo-chip"
                                style={{ padding: '3px 8px', fontSize: '11px', color: '#FAF7F2', borderColor: 'rgba(242, 236, 225, 0.25)' }}
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
                      <Beer size={22} className="torch-flicker" color="#FAF7F2" />
                      <span className="font-lore" style={{ fontStyle: 'italic', fontSize: '14px' }}>
                        Urd está enxugando a caneca de carvalho e rebuscando histórias antigas...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bolachas de Chopp de Pedra (Medalhões Táteis do Balcão) */}
            <div className="urd-coasters-container" aria-label="Perguntar ao Urd">
              <span className="bardo__eyebrow" style={{ color: '#f59e0b', letterSpacing: '0.14em', marginBottom: '8px', display: 'block', fontWeight: 800 }}>
                PERGUNTAR AO URD:
              </span>
              <div className="urd-coasters-tray">
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
                      className={`urd-stone-coaster ${isSelected ? 'is-selected' : ''}`}
                      title={c.text}
                    >
                      <span className="urd-stone-coaster__icon">{c.icon}</span>
                      <span className="urd-stone-coaster__label">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compositor de Mensagem */}
            <form
              className="bardo__composer"
              onSubmit={e => {
                e.preventDefault();
                handleSend(inputText);
              }}
            >
              <div className="bardo__input-row">
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
                  className="bardo__input font-lore"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="bardo__send"
                >
                  <span>Consultar Urd</span>
                  <Send size={15} className="bardo__send-arrow" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* REGISTRO DA TAVERNA — Memória da Estalagem & Boatos do Balcão */}
      {/* ========================================================================= */}
      <section className="bardo-wall urd-wall" aria-label="Memória da Estalagem - Boatos do Balcão">
        <div className="bardo-wall__head">
          <div>
            <span className="bardo__eyebrow" style={{ display: 'block', marginBottom: '6px', color: '#f59e0b', letterSpacing: '0.16em', fontWeight: 800 }}>
              MEMÓRIA DA ESTALAGEM
            </span>
            <h2 className="bardo-wall__title" style={{ color: '#f5ecdc', fontFamily: "'Cinzel Hero', var(--font-cinzel)", letterSpacing: '0.04em' }}>
              BOATOS DO BALCÃO
            </h2>
          </div>
          <span className="bardo-wall__count" style={{ color: '#a89a85', fontWeight: 600 }}>
            Segredos sussurrados entre canecas
          </span>
        </div>

        {/* Grid de boatos e sabedorias em estilo despojado de taverna */}
        <div className="bardo-wall__grid">
          {activeCampaign && activeCampaign.lore.filter(l => l.category === 'rumores').length > 0 ? (
            activeCampaign.lore.filter(l => l.category === 'rumores').map((lore, idx) => (
              <figure key={lore.id} className="bardo-card" style={{ ['--tilt' as string]: `${((idx % 5) - 2) * 1.5}deg` }}>
                <div className="bardo-card__frame" style={{ cursor: 'default' }}>
                  <div style={{ padding: '16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <span className="bardo-card__cat">Boato Registrado</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(lore.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-strong)', marginBottom: '8px', fontFamily: 'var(--font-cinzel)' }}>
                      {lore.title}
                    </strong>
                    <p className="bardo-card__prompt font-lore" style={{ fontSize: '13px', WebkitLineClamp: 4, color: 'var(--text-soft)' }}>
                      {lore.content}
                    </p>
                    <div className="bardo-card__actions">
                      <button
                        type="button"
                        onClick={() => handleSend(`Urd, me conte mais sobre "${lore.title}": o que os viajantes andam falando a respeito?`)}
                        className="bardo-chip urd-investigate-btn"
                        style={{ padding: '6px 12px', fontSize: '11px', color: '#0A0A0A', background: '#F2ECE1', borderColor: '#FAF7F2', fontWeight: 700 }}
                        disabled={isLoading}
                      >
                        <Sparkles size={12} />
                        <span>Investigar com Urd</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(lore.id, lore.content)}
                        className="bardo-chip"
                        style={{ padding: '6px 12px', fontSize: '11px', color: '#FAF7F2', borderColor: 'rgba(242, 236, 225, 0.2)' }}
                      >
                        {copiedId === lore.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </figure>
            ))
          ) : (
            // Cartões de Boatos da Taverna Padrão
            [
              {
                id: 'rumor-1',
                title: 'O Sino Submerso do Pântano',
                text: 'Dizem que nas noites de lua nova, quando a névoa engole os juncos, um sino de bronze toca debaixo d’água onde afundou a capela.',
                cat: 'Pântano dos Sussurros'
              },
              {
                id: 'rumor-2',
                title: 'A Caravana Sem Rastros',
                text: 'Três carroções blindados de mercadores anões entraram na garganta do desfiladeiro e jamais saíram. Nem cinzas, nem rodas partidas foram achadas.',
                cat: 'Passo do Corvo'
              },
              {
                id: 'rumor-3',
                title: 'O Espelho Rachado da Cripta',
                text: 'Quem se olha naquele vidro antigo no sarcófago do barão vê o reflexo de si mesmo com dez anos a mais — e com uma ferida fatal visível no peito.',
                cat: 'Ruínas do Castelo Cinzento'
              }
            ].map((r, idx) => (
              <figure
                key={r.id}
                className="bardo-card"
                style={{ ['--tilt' as string]: `${((idx % 3) - 1) * 2}deg` }}
              >
                <div className="bardo-card__frame" style={{ cursor: 'default' }}>
                  <div style={{ padding: '16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <span className="bardo-card__cat" style={{ color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '11px', background: 'transparent', padding: 0 }}>
                        {r.cat}
                      </span>
                      <Trash2 size={13} color="#f59e0b" style={{ opacity: 0.8 }} />
                    </div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#f5ecdc', marginBottom: '8px', fontFamily: "'Cinzel Hero', var(--font-cinzel)", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {r.title}
                    </strong>
                    <p className="bardo-card__prompt font-lore" style={{ fontSize: '13px', WebkitLineClamp: 4, color: '#c4b8a5' }}>
                      &ldquo;{r.text}&rdquo;
                    </p>
                    <div className="bardo-card__actions">
                      <button
                        type="button"
                        onClick={() => handleSend(`Urd, me conte mais sobre "${r.title}": o que os viajantes andam falando a respeito?`)}
                        className="bardo-chip urd-investigate-btn"
                        style={{ padding: '6px 12px', fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.35)', fontWeight: 700 }}
                        disabled={isLoading}
                      >
                        <Sparkles size={12} color="#f59e0b" />
                        <span>Investigar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(r.id, r.text)}
                        className="bardo-chip"
                        style={{ padding: '6px 12px', fontSize: '11px', color: '#f5ecdc', borderColor: 'rgba(242, 236, 225, 0.2)', background: 'rgba(255, 255, 255, 0.04)' }}
                      >
                        {copiedId === r.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </figure>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
