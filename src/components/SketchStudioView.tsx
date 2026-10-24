import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Trash2,
  Maximize2,
  PenLine,
  X,
  Music,
  Send,
  Feather
} from 'lucide-react';
import { SketchAsset } from '../types';
import { aiService } from '../services/aiService';

interface SketchStudioViewProps {
  sketches: SketchAsset[];
  campaigns?: { id: string; name: string }[];
  activeCampaignId?: string | null;
  onSaveSketch: (asset: Omit<SketchAsset, 'id' | 'createdAt'>) => void;
  onDeleteSketch: (id: string) => void;
}

type Category = 'item' | 'npc' | 'criatura' | 'mapa' | 'cena';
type Aspect = '1:1' | '3:4' | '16:9';
type Technique = 'nanquim' | 'xilogravura' | 'carvao' | 'iluminura';

const TECHNIQUES: { value: Technique; label: string; suffix: string }[] = [
  { value: 'nanquim', label: 'Pena & Nanquim', suffix: ', traço de bico de pena e nanquim sobre pergaminho com hachuras medievais' },
  { value: 'xilogravura', label: 'Xilogravura', suffix: ', gravura em madeira rústica estilo xilogravura medieval de alto contraste' },
  { value: 'carvao', label: 'Estudo a Carvão', suffix: ', estudo sombreado a carvão vegetal com esfuminho e textura rica' },
  { value: 'iluminura', label: 'Iluminura Real', suffix: ', estilo iluminura medieval com detalhes ornamentais nobres e folha de prata' },
];

interface ChatMessage {
  id: string;
  from: 'user' | 'bard';
  text?: string;
  art?: {
    imageUrl: string;
    prompt: string;
    description?: string;
    category: Category;
  };
  pending?: boolean;
  tone?: 'normal' | 'warn';
}

const CATEGORIES: { value: Category; label: string; aspect: Aspect }[] = [
  { value: 'item', label: 'Item', aspect: '1:1' },
  { value: 'npc', label: 'Personagem', aspect: '3:4' },
  { value: 'criatura', label: 'Criatura', aspect: '1:1' },
  { value: 'mapa', label: 'Mapa', aspect: '1:1' },
  { value: 'cena', label: 'Cenário', aspect: '16:9' },
];

const ASPECTS: { value: Aspect; label: string }[] = [
  { value: '1:1', label: 'Quadrado' },
  { value: '3:4', label: 'Retrato' },
  { value: '16:9', label: 'Panorama' },
];

const IDEAS: { label: string; prompt: string; category: Category }[] = [
  { label: 'Espada rúnica', prompt: 'Espada longa mágica antiga cravada em pedestal de pedra com runas nórdicas gravadas no gume', category: 'item' },
  { label: 'Mímico disfarçado', prompt: 'Baú de madeira reforçado com dentes afiados nas frestas e língua monstruosa de fora', category: 'criatura' },
  { label: 'Taberneiro anão', prompt: 'Retrato de um taberneiro anão corpulento com avental de couro e longa barba trançada segurando caneca de cerveja', category: 'npc' },
  { label: 'Catacumba', prompt: 'Planta baixa desenhada à mão de catacumba com sarcófagos, corredores armadilhados e sala do oráculo', category: 'mapa' },
  { label: 'Salão da taverna', prompt: 'Interior aconchegante de taverna medieval com lareira crepitante, mesas rústicas de carvalho e barris', category: 'cena' },
];

const BARDIC_INSPIRATIONS = [
  { prompt: 'Um anel de ferro forjado que chora lágrimas de prata quando detecta magia vil', category: 'item' as Category },
  { prompt: 'Uma maga élfica idosa com tranças brancas e um cajado feito de chifre de basilisco', category: 'npc' as Category },
  { prompt: 'Uma quimera das cavernas com escamas de obsidiana e cauda espinhosa', category: 'criatura' as Category },
  { prompt: 'A ponte de pedra suspensa sobre um abismo repleto de cristais luminosos', category: 'cena' as Category },
  { prompt: 'O selo heráldico da guilda dos corvos com duas espadas cruzadas e um cálice', category: 'mapa' as Category },
];

const DRAWING_LINES = [
  'Molha a pena de ganso no tinteiro de nanquim…',
  'Esboça os primeiros traços sobre o pergaminho…',
  'Sombreia com hachuras cruzadas e carvão…',
  'Sopra o pó de grafite e dá os últimos retoques…',
];

const GREETING: ChatMessage[] = [
  {
    id: 'b-welcome-1',
    from: 'bard',
    text: '*Afina uma corda do alaúde, pousa a pena atrás da orelha e puxa um pergaminho em branco.*',
  },
  {
    id: 'b-welcome-2',
    from: 'bard',
    text: 'Salve, viajante! Sou Orlan Pena-Fina, bardo desta taverna e artista de ocasião. Diga o que seus olhos imaginam (um herói, um monstro, uma espada, um mapa) e eu risco no pergaminho.',
  },
];

const MAX_SKETCHES = 10;

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
  const [technique, setTechnique] = useState<Technique>('nanquim');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawingStep, setDrawingStep] = useState(0);
  const [lightbox, setLightbox] = useState<{ imageUrl: string; prompt: string; description?: string; category: string } | null>(null);
  const [toDelete, setToDelete] = useState<SketchAsset | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Alaúde interativo
  const [isStrumming, setIsStrumming] = useState(false);
  const [strumNote, setStrumNote] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isFull = sketches.length >= MAX_SKETCHES;

  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(() => {
      setDrawingStep(s => (s + 1) % DRAWING_LINES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleStrumLute = () => {
    if (isStrumming || isGenerating) return;
    setIsStrumming(true);
    const randomItem = BARDIC_INSPIRATIONS[Math.floor(Math.random() * BARDIC_INSPIRATIONS.length)];
    const notes = ['♪', '♫', '♩', '♬', '✦'];
    setStrumNote(notes[Math.floor(Math.random() * notes.length)]);

    setTimeout(() => {
      setDraft(randomItem.prompt);
      setCategory(randomItem.category);
      const catConfig = CATEGORIES.find(c => c.value === randomItem.category);
      if (catConfig) setAspect(catConfig.aspect);
      setIsStrumming(false);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(randomItem.prompt.length, randomItem.prompt.length);
      }
    }, 450);
  };

  const pickIdea = (idea: { label: string; prompt: string; category: Category }) => {
    setCategory(idea.category);
    setDraft(idea.prompt);
    const catConfig = CATEGORIES.find(c => c.value === idea.category);
    if (catConfig) setAspect(catConfig.aspect);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const askAdjustment = (prompt: string, cat: Category) => {
    setCategory(cat);
    setDraft(`${prompt}, mas com `);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const pushMessage = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);
  const replaceMessage = (id: string, msg: ChatMessage) =>
    setMessages(prev => prev.map(m => (m.id === id ? msg : m)));

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const rawRequest = draft.trim();
    if (!rawRequest || isGenerating) return;

    const userId = 'u-' + Date.now();
    pushMessage({ id: userId, from: 'user', text: rawRequest });
    setDraft('');

    if (isFull) {
      pushMessage({
        id: 'b-' + Date.now(),
        from: 'bard',
        tone: 'warn',
        text: '*Orlan gesticula para a parede repleta de pergaminhos.* A parede está cheia! Rasgue um pergaminho antigo para que eu possa riscar o novo.',
      });
      return;
    }

    const pendingId = 'b-' + (Date.now() + 1);
    pushMessage({ id: pendingId, from: 'bard', pending: true });
    setIsGenerating(true);

    try {
      const selectedTech = TECHNIQUES.find(t => t.value === technique);
      const techSuffix = selectedTech ? selectedTech.suffix : '';
      const finalPrompt = rawRequest + techSuffix;

      const result = await aiService.generateSketch(finalPrompt, category, {
        aspectRatio: aspect,
        imageSize: '1K',
      });

      onSaveSketch({
        prompt: rawRequest,
        imageUrl: result.imageUrl,
        category,
        campaignId: activeCampaignId || undefined,
        description: result.description,
        modelUsed: result.modelUsed,
        aspectRatio: aspect,
        refinedPrompt: result.executedPrompt,
        costEstimate: result.costEstimate,
      });

      replaceMessage(pendingId, {
        id: pendingId,
        from: 'bard',
        text: `*Orlan sopra o excesso de nanquim e fixa a gravura na parede.* Aqui está sua encomenda, forasteiro! O que seus olhos acham deste risco?`,
        art: {
          imageUrl: result.imageUrl,
          prompt: rawRequest,
          description: result.description,
          category,
        },
      });
    } catch (err) {
      replaceMessage(pendingId, {
        id: pendingId,
        from: 'bard',
        tone: 'warn',
        text: '*Orlan quebra a ponta da pena e suspira.* As musas se esconderam na névoa... Não consegui concluir esta gravura. Tente novamente!',
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

  const handleDownload = async (url: string, cat: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `taberna-${cat}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="sketch-studio-view" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0e0906', backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(217, 119, 6, 0.12) 0%, rgba(14, 9, 6, 0.98) 75%)', color: '#f5ecdc', padding: 0, margin: 0 }}>
      {/* ========================================================================= */}
      {/* ATELIÊ DO BARDO — Cavalete com Orlan Pena-Fina e Estúdio de Gravura */}
      {/* ========================================================================= */}
      <section className="bardo" aria-label="Ateliê Iluminurista de Orlan Pena-Fina">
        <div className="bardo__inner">
          <aside className="bardo__side">
            <div
              className="bardo__portrait"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTilt({
                  x: -((e.clientY - r.top) / r.height - 0.5) * 8,
                  y: ((e.clientX - r.left) / r.width - 0.5) * 8,
                });
              }}
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

            <div className="bardo__slots" title={`Pergaminhos na parede: ${sketches.length} de ${MAX_SKETCHES}`}>
              <span className="bardo__dots" aria-hidden="true">
                {Array.from({ length: MAX_SKETCHES }, (_, i) => (
                  <span key={i} className={`bardo__dot${i < sketches.length ? ' is-on' : ''}${isFull ? ' is-full' : ''}`} />
                ))}
              </span>
              <span>Pergaminhos na parede: {sketches.length} de {MAX_SKETCHES}</span>
            </div>

            {/* Dedilhar Alaúde: Injeção de Inspiração */}
            <div style={{ marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleStrumLute}
                disabled={isGenerating}
                className="bardo-chip"
                style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', gap: '8px' }}
                title="Dedilhar as cordas do alaúde para obter uma inspiração mística"
              >
                <Music size={15} />
                <span>{isStrumming ? (strumNote || '♪') : 'Dedilhar Alaúde'}</span>
              </button>
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
                        <span className="bardo-draw__line">
                          <em className="bardo-msg__act">{DRAWING_LINES[drawingStep]}</em>
                        </span>
                      </div>
                    ) : (
                      <>
                        {m.text && <p className="bardo-msg__text font-lore">{renderRich(m.text)}</p>}
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
                            <figcaption className="bardo-art__bar" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                              <button type="button" className="bardo-chip" onClick={() => handleDownload(m.art!.imageUrl, m.art!.category)}>
                                <Download size={13} /> Baixar
                              </button>
                              <button type="button" className="bardo-chip" onClick={() => askAdjustment(m.art!.prompt, m.art!.category)}>
                                <PenLine size={13} /> Pedir ajuste
                              </button>
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
              <span className="bardo__eyebrow">Ideias do balcão:</span>
              {IDEAS.map(idea => (
                <button key={idea.label} type="button" className="bardo-chip" disabled={isGenerating} onClick={() => pickIdea(idea)}>
                  {idea.label}
                </button>
              ))}
            </div>

            <form className="bardo__composer" onSubmit={handleSend}>
              <div className="bardo__options">
                <div className="bardo__group bardo__group--tech" role="group" aria-label="Técnica de Gravura">
                  {TECHNIQUES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      className={`bardo-pill bardo-pill--tech${technique === t.value ? ' is-on' : ''}`}
                      aria-pressed={technique === t.value}
                      onClick={() => setTechnique(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="bardo__group" role="group" aria-label="O que desenhar">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`bardo-pill${category === c.value ? ' is-on' : ''}`}
                      aria-pressed={category === c.value}
                      onClick={() => {
                        setCategory(c.value);
                        setAspect(c.aspect);
                      }}
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
                  className="bardo__input font-lore"
                  rows={2}
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

      {/* ========================================================================= */}
      {/* PERGAMINHOS NA PAREDE — Galeria de Gravuras em Manuscrito */}
      {/* ========================================================================= */}
      <section className="bardo-wall" aria-label="Pergaminhos na Parede">
        <div className="bardo-wall__head">
          <h2 className="bardo-wall__title" style={{ color: '#f5ecdc', fontFamily: "'Cinzel Hero', var(--font-cinzel)", letterSpacing: '0.04em' }}>
            PERGAMINHOS NA PAREDE
          </h2>
          <span className="bardo-wall__count" style={{ color: '#a89a85', fontWeight: 600 }}>
            {sketches.length}/{MAX_SKETCHES}
          </span>
        </div>

        {sketches.length > 0 ? (
          <div className="bardo-wall__grid">
            {sketches.map((item, i) => (
              <figure
                key={item.id}
                className="bardo-card"
                style={{ ['--tilt' as string]: `${((i % 5) - 2) * 1.5}deg` }}
              >
                <button
                  type="button"
                  className="bardo-card__frame"
                  onClick={() => setLightbox({
                    imageUrl: item.imageUrl,
                    prompt: item.prompt,
                    description: item.description,
                    category: item.category
                  })}
                  aria-label={`Ampliar: ${item.prompt}`}
                >
                  <img src={item.imageUrl} alt={item.prompt} loading="lazy" />
                  <span className="bardo-art__zoom"><Maximize2 size={14} /></span>
                </button>
                <figcaption className="bardo-card__caption">
                  <span className="bardo-card__cat">{item.category}</span>
                  <p className="bardo-card__prompt font-lore">{item.prompt}</p>
                  <div className="bardo-card__actions">
                    <button
                      type="button"
                      className="bardo-icon"
                      onClick={() => handleDownload(item.imageUrl, item.category)}
                      aria-label="Baixar ilustração"
                      title="Baixar"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className="bardo-icon bardo-icon--danger"
                      onClick={() => setToDelete(item)}
                      aria-label="Rasgar pergaminho"
                      title="Rasgar pergaminho"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="bardo-wall__empty font-lore">
            A parede está vazia. Faça o primeiro pedido ao bardo acima.
          </p>
        )}
      </section>

      {/* Lightbox / Modal de Gravura */}
      {lightbox && (
        <div className="bardo-modal" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label="Ilustração ampliada">
          <div className="bardo-modal__card bardo-modal__card--wide" onClick={e => e.stopPropagation()}>
            <button type="button" className="bardo-modal__close" onClick={() => setLightbox(null)} aria-label="Fechar">
              <X size={18} />
            </button>
            <img className="bardo-modal__img" src={lightbox.imageUrl} alt={lightbox.prompt} />
            <div className="bardo-modal__text">
              <span className="bardo__eyebrow">{lightbox.category}</span>
              <p className="bardo-modal__prompt font-lore">{lightbox.prompt}</p>
              {lightbox.description && <p className="bardo-modal__desc font-lore">{lightbox.description}</p>}
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <button type="button" className="bardo-chip" onClick={() => handleDownload(lightbox.imageUrl, lightbox.category)}>
                  <Download size={13} /> Baixar Imagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {toDelete && (
        <div className="bardo-modal" onClick={() => setToDelete(null)} role="dialog" aria-modal="true" aria-label="Confirmar exclusão">
          <div className="bardo-modal__card" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontFamily: 'var(--font-cinzel)', color: 'var(--text-strong)' }}>
              Rasgar este pergaminho?
            </h3>
            <p className="font-lore" style={{ fontSize: '14px', color: 'var(--text-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              A gravura será descartada e liberará um espaço na parede de carvalho.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="bardo-chip" onClick={() => setToDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="bardo-chip"
                style={{ background: '#b91c1c', color: '#fff', borderColor: '#ef4444' }}
                onClick={() => {
                  onDeleteSketch(toDelete.id);
                  setToDelete(null);
                }}
              >
                Rasgar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
