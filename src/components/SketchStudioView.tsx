import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Feather, Maximize2, PenLine, Send, Trash2, X } from 'lucide-react';
import { Campaign, SketchAsset, SketchCostEstimate } from '../types';
import { aiService } from '../services/aiService';
import { HeroAtmosphere } from './HeroAtmosphere';

const MAX_SKETCHES = 10;

type Category = 'item' | 'npc' | 'criatura' | 'mapa' | 'cena';
type Aspect = '1:1' | '3:4' | '4:3' | '16:9';

interface SketchStudioViewProps {
  sketches: SketchAsset[];
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSaveSketch: (sketch: Omit<SketchAsset, 'id' | 'createdAt'>) => void;
  onDeleteSketch?: (id: string) => void;
}

interface ChatArt {
  imageUrl: string;
  prompt: string;
  category: Category;
  description?: string;
  cost?: SketchCostEstimate;
}

interface ChatMessage {
  id: string;
  from: 'bard' | 'user';
  text?: string;
  tone?: 'warn';
  pending?: boolean;
  art?: ChatArt;
}

const CATEGORIES: { value: Category; label: string; aspect: Aspect }[] = [
  { value: 'item', label: 'Item', aspect: '1:1' },
  { value: 'npc', label: 'Personagem', aspect: '3:4' },
  { value: 'criatura', label: 'Criatura', aspect: '1:1' },
  { value: 'mapa', label: 'Mapa', aspect: '4:3' },
  { value: 'cena', label: 'Cena', aspect: '16:9' },
];

const ASPECTS: { value: Aspect; label: string }[] = [
  { value: '1:1', label: 'Quadrado' },
  { value: '3:4', label: 'Retrato' },
  { value: '4:3', label: 'Paisagem' },
  { value: '16:9', label: 'Panorama' },
];

const IDEAS: { label: string; prompt: string; category: Category }[] = [
  { label: 'Espada rúnica', prompt: 'Espada longa mágica antiga cravada em pedestal de pedra com runas nórdicas gravadas no gume', category: 'item' },
  { label: 'Mímico disfarçado', prompt: 'Baú de madeira reforçado com dentes afiados nas frestas e língua monstruosa de fora', category: 'criatura' },
  { label: 'Taberneiro anão', prompt: 'Retrato de um taberneiro anão corpulento com avental de couro e longa barba trançada segurando caneca de cerveja', category: 'npc' },
  { label: 'Catacumba', prompt: 'Planta baixa desenhada à mão de catacumba com sarcófagos, corredores armadilhados e sala do oráculo', category: 'mapa' },
  { label: 'Salão da taverna', prompt: 'Interior aconchegante de taverna medieval com lareira crepitante, mesas rústicas de carvalho e barris', category: 'cena' },
];

const DRAWING_LINES = [
  'Molha a pena no tinteiro…',
  'Esboça os primeiros traços…',
  'Sombreia com hachuras cruzadas…',
  'Sopra o excesso de grafite…',
  'Dá os últimos retoques…',
];

const DELIVERY_LINES = [
  'Sopra o grafite e ergue o pergaminho contra a luz da lareira.',
  'Assina o canto do desenho com um floreio.',
  'Bate a poeira das mãos e desliza o pergaminho pelo balcão.',
];

const GREETING: ChatMessage[] = [
  {
    id: 'greet-1',
    from: 'bard',
    text: '*Afina uma corda do alaúde, pousa a pena atrás da orelha e puxa um pergaminho em branco.*',
  },
  {
    id: 'greet-2',
    from: 'bard',
    text: 'Salve, viajante! Sou Orlan Pena-Fina, bardo desta taverna e artista de ocasião. Diga o que seus olhos imaginam (um herói, um monstro, uma espada, um mapa) e eu risco no pergaminho.',
  },
];

// Trechos entre *asteriscos* viram ações de cena em itálico
function renderRich(text: string): React.ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('*') && part.endsWith('*')
      ? <em key={i} className="bardo-msg__act">{part.slice(1, -1)}</em>
      : <span key={i}>{part}</span>
  );
}

export const SketchStudioView: React.FC<SketchStudioViewProps> = ({
  sketches,
  activeCampaignId,
  onSaveSketch,
  onDeleteSketch,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(GREETING);
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<Category>('item');
  const [aspect, setAspect] = useState<Aspect>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawingStep, setDrawingStep] = useState(0);
  const [lightbox, setLightbox] = useState<{ imageUrl: string; prompt: string; description?: string; category: string } | null>(null);
  const [toDelete, setToDelete] = useState<SketchAsset | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isFull = sketches.length >= MAX_SKETCHES;
  const deliveryIndex = useRef(0);

  // Mantém a conversa sempre rolada até a última fala
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Frases do bardo enquanto desenha
  useEffect(() => {
    if (!isGenerating) {
      setDrawingStep(0);
      return;
    }
    const timer = setInterval(() => setDrawingStep(s => (s + 1) % DRAWING_LINES.length), 2600);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Fecha o lightbox/modal com Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightbox(null);
        setToDelete(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-ajuste da altura do campo de pedido
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 132) + 'px';
  }, [draft]);

  const slotsLabel = useMemo(() => `${sketches.length}/${MAX_SKETCHES}`, [sketches.length]);

  const pickCategory = (value: Category) => {
    setCategory(value);
    const preset = CATEGORIES.find(c => c.value === value);
    if (preset) setAspect(preset.aspect);
  };

  const pickIdea = (idea: typeof IDEAS[number]) => {
    pickCategory(idea.category);
    setDraft(idea.prompt);
    inputRef.current?.focus();
  };

  const pushMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);
  const replaceMessage = (id: string, msg: ChatMessage) =>
    setMessages(prev => prev.map(m => (m.id === id ? msg : m)));

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const request = draft.trim();
    if (!request || isGenerating) return;

    const userId = 'u-' + Date.now();
    pushMessage({ id: userId, from: 'user', text: request });
    setDraft('');

    if (isFull) {
      pushMessage({
        id: 'b-' + Date.now(),
        from: 'bard',
        tone: 'warn',
        text: '*Aponta para a parede lotada de pergaminhos.* Meu cavalete está cheio! Rasgue algum pergaminho da parede abaixo para abrir espaço, e eu desenho o seu pedido.',
      });
      return;
    }

    const pendingId = 'b-' + (Date.now() + 1);
    pushMessage({ id: pendingId, from: 'bard', pending: true });
    setIsGenerating(true);

    try {
      const result = await aiService.generateSketch(request, category, {
        aspectRatio: aspect,
        imageSize: '1K',
      });

      onSaveSketch({
        prompt: request,
        imageUrl: result.imageUrl,
        category,
        campaignId: activeCampaignId || undefined,
        description: result.description,
        modelUsed: result.modelUsed,
        aspectRatio: aspect,
        refinedPrompt: result.executedPrompt,
        costEstimate: result.costEstimate,
      });

      const line = DELIVERY_LINES[deliveryIndex.current++ % DELIVERY_LINES.length];
      replaceMessage(pendingId, {
        id: pendingId,
        from: 'bard',
        text: `*${line}* Aqui está, viajante. Se quiser algum ajuste, é só pedir.`,
        art: {
          imageUrl: result.imageUrl,
          prompt: request,
          category,
          description: result.description,
          cost: result.costEstimate,
        },
      });

      if (result.quotaNotice) {
        pushMessage({
          id: 'w-' + Date.now(),
          from: 'bard',
          tone: 'warn',
          text: `*Franze a testa.* O tinteiro mágico não respondeu direito, então fiz o que pude. ${result.quotaNotice}`,
        });
      }
    } catch (err: any) {
      console.error('Erro ao gerar sketch:', err);
      const quota = err?.name === 'QuotaExceededError' || err?.message?.includes('exceeded the quota');
      replaceMessage(pendingId, {
        id: pendingId,
        from: 'bard',
        tone: 'warn',
        text: quota
          ? '*Revira o baú, aflito.* Não cabe mais nenhum pergaminho na memória deste navegador. Rasgue alguns da parede e peça de novo.'
          : `*Sacode o tinteiro vazio.* Algo deu errado: ${err?.message || 'erro durante a geração'}.`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleDownload = (imageUrl: string, cat: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `bardo_${cat}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const askAdjustment = (art: ChatArt) => {
    pickCategory(art.category);
    setDraft(`${art.prompt}, mas `);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const confirmDelete = () => {
    if (toDelete && onDeleteSketch) {
      onDeleteSketch(toDelete.id);
      if (lightbox?.imageUrl === toDelete.imageUrl) setLightbox(null);
    }
    setToDelete(null);
  };

  const onPortraitMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top) / r.height - 0.5) * -8,
      y: ((e.clientX - r.left) / r.width - 0.5) * 8,
    });
  };

  return (
    <>
      {/* Banner: Telas do Alaúde */}
      <header className="salao-hero salao-hero--bardo">
        <HeroAtmosphere variant="alaude" />
        <div className="salao-hero__inner">
          <h1 className="salao-hero__title" aria-label="Telas do Alaúde">
            <span className="salao-hero__line salao-hero__line--a">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">Telas</span>
              </span>
            </span>
            <span className="salao-hero__line salao-hero__line--b">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">do Alaúde</span>
              </span>
            </span>
          </h1>
        </div>
      </header>

      {/* Pedido ao bardo: conversa imersiva */}
      <section className="bardo" aria-label="Pedido ao bardo">
        <div className="bardo__inner">
          <aside className="bardo__side">
            <div
              className="bardo__portrait"
              onMouseMove={onPortraitMove}
              onMouseLeave={() => setTilt({ x: 0, y: 0 })}
              style={{ transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
            >
              <img src="/assets/bardo_portrait.jpg" alt="Orlan Pena-Fina, o bardo da taverna" width={640} height={640} />
              <span className={`bardo__status${isGenerating ? ' is-drawing' : ''}`}>
                <span className="bardo__status-dot" aria-hidden="true" />
                {isGenerating ? 'Desenhando' : 'Afinando o alaúde'}
              </span>
            </div>
            <div className="bardo__who">
              <span className="bardo__eyebrow">Bardo e retratista</span>
              <strong className="bardo__name">Orlan Pena-Fina</strong>
            </div>
            <div className="bardo__slots" title={`Pergaminhos na parede: ${slotsLabel}`}>
              <span className="bardo__dots" aria-hidden="true">
                {Array.from({ length: MAX_SKETCHES }, (_, i) => (
                  <span key={i} className={`bardo__dot${i < sketches.length ? ' is-on' : ''}${isFull ? ' is-full' : ''}`} />
                ))}
              </span>
              <span>Pergaminhos na parede: {slotsLabel}</span>
            </div>
          </aside>

          <div className="bardo__chat">
            <div className="bardo__log" ref={logRef} role="log" aria-live="polite" aria-label="Conversa com o bardo">
              {messages.map(m => (
                <div key={m.id} className={`bardo-msg bardo-msg--${m.from}${m.tone ? ` is-${m.tone}` : ''}`}>
                  {m.from === 'bard' && (
                    <img className="bardo-msg__avatar" src="/assets/bardo_portrait.jpg" alt="" width={32} height={32} />
                  )}
                  <div className="bardo-msg__body">
                    {m.pending ? (
                      <div className="bardo-draw" aria-label="O bardo está desenhando">
                        <svg className="bardo-draw__svg" viewBox="0 0 120 80" aria-hidden="true">
                          <path d="M8 62 C 28 20, 52 16, 68 42 S 100 66, 112 18" />
                          <path d="M14 70 C 40 52, 62 60, 90 48" />
                          <path d="M30 30 L 44 56 M40 26 L 54 52 M50 24 L 64 50" />
                        </svg>
                        <span className="bardo-draw__line" key={drawingStep}>
                          <em className="bardo-msg__act">{DRAWING_LINES[drawingStep]}</em>
                        </span>
                      </div>
                    ) : (
                      <>
                        {m.text && <p className="bardo-msg__text">{renderRich(m.text)}</p>}
                        {m.art && (
                          <figure className="bardo-art">
                            <button
                              type="button"
                              className="bardo-art__frame"
                              onClick={() => setLightbox({ imageUrl: m.art!.imageUrl, prompt: m.art!.prompt, description: m.art!.description, category: m.art!.category })}
                              aria-label="Ampliar a ilustração"
                            >
                              <img src={m.art.imageUrl} alt={m.art.prompt} />
                              <span className="bardo-art__zoom"><Maximize2 size={14} /></span>
                            </button>
                            <figcaption className="bardo-art__bar">
                              <button type="button" className="bardo-chip" onClick={() => handleDownload(m.art!.imageUrl, m.art!.category)}>
                                <Download size={13} /> Baixar
                              </button>
                              <button type="button" className="bardo-chip" onClick={() => askAdjustment(m.art!)}>
                                <PenLine size={13} /> Pedir ajuste
                              </button>
                              {m.art.cost && (
                                <span className="bardo-art__meta">
                                  US$ {m.art.cost.estimatedCostUsd.toFixed(3)} · {m.art.cost.totalTokens} tokens
                                </span>
                              )}
                            </figcaption>
                          </figure>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bardo__ideas" aria-label="Ideias rápidas">
              <span className="bardo__eyebrow">Ideias do balcão</span>
              {IDEAS.map(idea => (
                <button key={idea.label} type="button" className="bardo-chip" disabled={isGenerating} onClick={() => pickIdea(idea)}>
                  {idea.label}
                </button>
              ))}
            </div>

            <form className="bardo__composer" onSubmit={handleSend}>
              <div className="bardo__options">
                <div className="bardo__group" role="group" aria-label="O que desenhar">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`bardo-pill${category === c.value ? ' is-on' : ''}`}
                      aria-pressed={category === c.value}
                      onClick={() => pickCategory(c.value)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="bardo__group" role="group" aria-label="Formato do pergaminho">
                  {ASPECTS.map(a => (
                    <button
                      key={a.value}
                      type="button"
                      className={`bardo-pill${aspect === a.value ? ' is-on' : ''}`}
                      aria-pressed={aspect === a.value}
                      onClick={() => setAspect(a.value)}
                      title={a.value}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bardo__input-row">
                <textarea
                  ref={inputRef}
                  id="bardo-input"
                  className="bardo__input"
                  rows={1}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  placeholder={isFull ? 'A parede está cheia. Rasgue um pergaminho para pedir outro…' : 'Peça ao bardo… ex.: um dragão velho dormindo sobre moedas de ouro'}
                  aria-label="Seu pedido ao bardo"
                />
                <button
                  type="submit"
                  id="bardo-send"
                  className="bardo__send"
                  disabled={isGenerating || !draft.trim()}
                  aria-label="Enviar pedido ao bardo"
                >
                  <Feather size={16} className={isGenerating ? 'bardo__send-icon is-busy' : 'bardo__send-icon'} />
                  <span>{isGenerating ? 'Desenhando' : 'Pedir'}</span>
                  <Send size={14} className="bardo__send-arrow" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Parede de pergaminhos */}
      <section className="bardo-wall" aria-label="Pergaminhos do bardo">
        <div className="bardo-wall__head">
          <h2 className="bardo-wall__title">Pergaminhos na parede</h2>
          <span className="bardo-wall__count">{slotsLabel}</span>
        </div>

        {sketches.length > 0 ? (
          <div className="bardo-wall__grid">
            {sketches.map((item, i) => (
              <figure key={item.id} className="bardo-card" style={{ ['--tilt' as string]: `${i % 2 === 0 ? -1.1 : 0.9}deg` }}>
                <button
                  type="button"
                  className="bardo-card__frame"
                  onClick={() => setLightbox({ imageUrl: item.imageUrl, prompt: item.prompt, description: item.description, category: item.category })}
                  aria-label={`Ampliar: ${item.prompt}`}
                >
                  <img src={item.imageUrl} alt={item.prompt} loading="lazy" />
                </button>
                <figcaption className="bardo-card__caption">
                  <span className="bardo-card__cat">{item.category}</span>
                  <p className="bardo-card__prompt">{item.prompt}</p>
                  <div className="bardo-card__actions">
                    <button type="button" className="bardo-icon" onClick={() => handleDownload(item.imageUrl, item.category)} aria-label="Baixar ilustração" title="Baixar">
                      <Download size={14} />
                    </button>
                    <button type="button" className="bardo-icon bardo-icon--danger" onClick={() => setToDelete(item)} aria-label="Rasgar pergaminho" title="Rasgar pergaminho">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="bardo-wall__empty">A parede está vazia. Faça o primeiro pedido ao bardo.</p>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="bardo-modal" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label="Ilustração ampliada">
          <div className="bardo-modal__card bardo-modal__card--wide" onClick={e => e.stopPropagation()}>
            <button type="button" className="bardo-modal__close" onClick={() => setLightbox(null)} aria-label="Fechar">
              <X size={18} />
            </button>
            <img className="bardo-modal__img" src={lightbox.imageUrl} alt={lightbox.prompt} />
            <div className="bardo-modal__text">
              <span className="bardo__eyebrow">{lightbox.category}</span>
              <p className="bardo-modal__prompt">{lightbox.prompt}</p>
              {lightbox.description && <p className="bardo-modal__desc">{lightbox.description}</p>}
              <div className="bardo-card__actions">
                <button type="button" className="bardo-chip" onClick={() => handleDownload(lightbox.imageUrl, lightbox.category)}>
                  <Download size={13} /> Baixar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação: rasgar pergaminho */}
      {toDelete && (
        <div className="bardo-modal" onClick={() => setToDelete(null)} role="dialog" aria-modal="true" aria-label="Rasgar pergaminho">
          <div className="bardo-modal__card" onClick={e => e.stopPropagation()}>
            <h3 className="bardo-modal__title">Rasgar este pergaminho?</h3>
            <p className="bardo-modal__prompt">“{toDelete.prompt}”</p>
            <p className="bardo-modal__desc">A ilustração será apagada e abrirá uma vaga na parede.</p>
            <div className="bardo-modal__actions">
              <button type="button" className="bardo-chip" onClick={() => setToDelete(null)}>Manter</button>
              <button type="button" className="bardo-chip bardo-chip--danger" onClick={confirmDelete}>Rasgar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
