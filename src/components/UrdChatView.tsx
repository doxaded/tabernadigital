import React, { useState, useRef, useEffect } from 'react';
import { Send, Beer, Sparkles, BookOpen, Copy, Check, RotateCcw } from 'lucide-react';
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

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

  const onPortraitMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: -((e.clientY - r.top) / r.height - 0.5) * 8,
      y: ((e.clientX - r.left) / r.width - 0.5) * 8,
    });
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
        'Perdoai este velho, forasteiro! Minha cabeça deu um nó com tantas canecas. Repeti o que dissestes, por favor!'
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
    <>
      {/* Banner: Urd, o Taberneiro */}
      <header className="salao-hero salao-hero--urd">
        <div className="salao-hero__inner">
          <h1 className="salao-hero__title" aria-label="Urd, o Taberneiro">
            <span className="salao-hero__line salao-hero__line--a">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">Urd</span>
              </span>
            </span>
            <span className="salao-hero__line salao-hero__line--b">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">o Taberneiro</span>
              </span>
            </span>
          </h1>
        </div>
      </header>

      {/* Balcão do Taberneiro: layout em duas colunas igual à Galeria do Bardo */}
      <section className="bardo urd-chamber" aria-label="Balcão do Taberneiro">
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
              <span className="bardo__eyebrow">Taberneiro & Oráculo</span>
              <strong className="bardo__name">Urd de Pedra-Funda</strong>
            </div>

            <div className="bardo__slots" title={`Mesa ativa: ${activeCampaign ? activeCampaign.name : 'Nenhuma selecionada'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--amber-glow)', fontWeight: 600 }}>
                <Beer size={14} />
                <span>Caneca de Carvalho</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.4 }}>
                {activeCampaign ? (
                  <>Vinculado à mesa <strong>{activeCampaign.name}</strong></>
                ) : (
                  'Pronto para ouvir seus pedidos'
                )}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClearChat}
                className="bardo-chip"
                title="Limpar balcão e reiniciar conversa"
                style={{ justifyContent: 'center' }}
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
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber-torch)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(245, 236, 220, 0.15)' }}>
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
                                style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--amber-glow)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                              >
                                {savedToLoreId === msg.id ? <Check size={12} color="#34d399" /> : <BookOpen size={12} />}
                                <span>{savedToLoreId === msg.id ? 'Salvo no Lore!' : `Salvar no Lore`}</span>
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
                      <Beer size={22} className="torch-flicker" color="var(--amber-glow)" />
                      <span className="font-lore" style={{ fontStyle: 'italic', fontSize: '14px' }}>
                        Urd está enxugando a caneca de carvalho e rebuscando histórias antigas...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pílulas de Ações Rápidas */}
            <div className="bardo__ideas">
              <span className="bardo__eyebrow">Perguntar ao Urd:</span>
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleSend(q.text)}
                  disabled={isLoading}
                  className="bardo-pill"
                >
                  {q.label}
                </button>
              ))}
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

      {/* Parede de Boatos & Crônicas do Balcão (análoga à parede de pergaminhos do Bardo) */}
      <section className="bardo-wall urd-wall" aria-label="Boatos e Crônicas de Taberna">
        <div className="bardo-wall__head">
          <div>
            <span className="bardo__eyebrow" style={{ display: 'block', marginBottom: '4px' }}>
              Memória da Estalagem
            </span>
            <h2 className="bardo-wall__title">Boatos do Balcão</h2>
          </div>
          <span className="bardo-wall__count">
            {activeCampaign ? `Crônicas da mesa: ${activeCampaign.lore.filter(l => l.category === 'rumores').length} boatos` : 'Segredos sussurrados entre canecas'}
          </span>
        </div>

        {/* Grid de boatos e sabedorias de taverna */}
        <div className="bardo-wall__grid">
          {activeCampaign && activeCampaign.lore.filter(l => l.category === 'rumores').length > 0 ? (
            activeCampaign.lore.filter(l => l.category === 'rumores').map((lore, idx) => (
              <figure key={lore.id} className="bardo-card" style={{ '--tilt': `${(idx % 5 - 2) * 1.5}deg` } as React.CSSProperties}>
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
                        onClick={() => handleCopy(lore.id, lore.content)}
                        className="bardo-chip"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        {copiedId === lore.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        <span>{copiedId === lore.id ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </figure>
            ))
          ) : (
            // Cartões de Boatos Atmosféricos da Taverna quando não há boatos registrados na sala ativa
            [
              {
                id: 'rumor-1',
                title: 'O Sino Submerso do Pântano',
                text: 'Dizem que nas noites de lua nova, quando a névoa engole os juncos, um sino de bronze toca debaixo d’água onde ficava a capela afundada.',
                cat: 'Pântano dos Sussurros'
              },
              {
                id: 'rumor-2',
                title: 'A Caravana Sem Rastros',
                text: 'Três carroções de ferro de mercadores anões entraram na garganta rochosa e jamais saíram. Nem cinzas, nem rodas partidas foram achadas.',
                cat: 'Passo do Corvo'
              },
              {
                id: 'rumor-3',
                title: 'O Espelho Rachado da Cripta',
                text: 'Quem se olha naquele vidro antigo no sarcófago do barão vê o reflexo de si mesmo com dez anos a mais — e com uma ferida fatal visível no peito.',
                cat: 'Ruínas do Castelo Cinzento'
              }
            ].map((r, idx) => (
              <figure key={r.id} className="bardo-card" style={{ '--tilt': `${(idx % 3 - 1) * 2}deg` } as React.CSSProperties}>
                <div className="bardo-card__frame" style={{ cursor: 'default' }}>
                  <div style={{ padding: '16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <span className="bardo-card__cat">{r.cat}</span>
                      <Beer size={13} color="var(--amber-torch)" />
                    </div>
                    <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-strong)', marginBottom: '8px', fontFamily: 'var(--font-cinzel)' }}>
                      {r.title}
                    </strong>
                    <p className="bardo-card__prompt font-lore" style={{ fontSize: '13px', WebkitLineClamp: 4, color: 'var(--text-soft)' }}>
                      "{r.text}"
                    </p>
                    <div className="bardo-card__actions">
                      <button
                        type="button"
                        onClick={() => handleSend(`Urd, me conte mais detalhes sobre "${r.title}": o que os viajantes dizem a respeito?`)}
                        className="bardo-chip"
                        style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--amber-glow)' }}
                      >
                        <Sparkles size={12} />
                        <span>Investigar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(r.id, r.text)}
                        className="bardo-chip"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
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
    </>
  );
};
