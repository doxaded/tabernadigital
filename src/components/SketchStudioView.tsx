import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
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
import { TavernInteractiveDesk } from './TavernInteractiveDesk';
import { tavernAudio } from '../services/tavernAudio';

interface SketchStudioViewProps {
  onBack?: () => void;
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
  onBack,
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
              <Feather size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#fef3c7', margin: 0, letterSpacing: '0.02em' }}>
                  Telas do Alaúde
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
                  ATELIÊ DE GRAVURAS
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                Retratos, mapas, armas e cenários desenhados pelo bardo Orlan
              </p>
            </div>
          </div>
        </div>

        {/* CENTRO: UTENSÍLIOS E DECORAÇÕES INTERATIVAS DA TABERNA */}
        <TavernInteractiveDesk />

        {/* AÇÕES NO TOPO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: '#a89a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Pergaminhos no mural:</span>
            <strong style={{ color: isFull ? '#ef4444' : '#fbbf24' }}>
              {sketches.length}/{MAX_SKETCHES}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleStrumLute}
            disabled={isGenerating}
            className="tavern-btn tavern-btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Dedilhar as cordas do alaúde para obter uma inspiração mística"
          >
            <Music size={14} color="#f59e0b" />
            <span>{isStrumming ? (strumNote || '♪') : 'Dedilhar Alaúde'}</span>
          </button>
        </div>
      </header>

      {/* COCKPIT BODY: 3 PAINÉIS EM TELA ÚNICA */}
      <div className="tavern-cockpit-body">
        {/* COLUNA 1: O RETRATISTA & TÉCNICAS */}
        <aside
          className="tavern-cockpit-panel tavern-thin-scrollbar"
          style={{ width: '270px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '14px', gap: '12px' }}
        >
          {/* Retrato do Bardo */}
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
            style={{
              transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              height: '140px',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img src="/assets/bardo_portrait.jpg" alt="Orlan Pena-Fina" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span className={`bardo__status${isGenerating ? ' is-drawing' : ''}`}>
              <span className="bardo__status-dot" aria-hidden="true" />
              {isGenerating ? 'Desenhando...' : 'Afinando alaúde'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Bardo e Retratista
            </div>
            <h3 style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
              Orlan Pena-Fina
            </h3>
          </div>

          {/* Seletores de Técnica */}
          <div>
            <span style={{ fontSize: '10px', color: '#a89a8a', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Técnica de Gravura
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TECHNIQUES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTechnique(t.value)}
                  style={{
                    padding: '5px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    background: technique === t.value ? 'rgba(217, 119, 6, 0.3)' : 'rgba(0,0,0,0.3)',
                    color: technique === t.value ? '#fbbf24' : '#a89a8a',
                    border: technique === t.value ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria do Desenho */}
          <div>
            <span style={{ fontSize: '10px', color: '#a89a8a', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Categoria
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setCategory(c.value);
                    setAspect(c.aspect);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    background: category === c.value ? 'rgba(217, 119, 6, 0.3)' : 'rgba(0,0,0,0.3)',
                    color: category === c.value ? '#fbbf24' : '#a89a8a',
                    border: category === c.value ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer'
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <span style={{ fontSize: '10px', color: '#a89a8a', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Formato
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {ASPECTS.map(a => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAspect(a.value)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    background: aspect === a.value ? 'rgba(217, 119, 6, 0.3)' : 'rgba(0,0,0,0.3)',
                    color: aspect === a.value ? '#fbbf24' : '#a89a8a',
                    border: aspect === a.value ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer'
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ideias Rápidas */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(217, 119, 6, 0.15)' }}>
            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Ideias do Balcão
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {IDEAS.map(idea => (
                <button
                  key={idea.label}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => pickIdea(idea)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#d6c7b2',
                    border: '1px solid rgba(217, 119, 6, 0.2)',
                    cursor: 'pointer'
                  }}
                >
                  {idea.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* COLUNA 2: O CAVALETE DE CRIAÇÃO (CENTRAL) */}
        <main
          className="tavern-cockpit-panel"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {/* Chat com o Bardo (Com scroll interno) */}
          <div
            className="bardo__log tavern-thin-scrollbar"
            ref={logRef}
            role="log"
            aria-live="polite"
            style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
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

          {/* Barra de entrada / Encomenda de ilustração */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(217, 119, 6, 0.18)', backgroundColor: 'rgba(15, 10, 7, 0.7)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <textarea
                ref={inputRef}
                rows={2}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                placeholder={isFull ? 'O mural está cheio. Rasgue um pergaminho ao lado para pedir outro…' : 'Peça ao bardo… ex.: um guerreiro anão com martelo de guerra e runas douradas'}
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
                disabled={isGenerating || !draft.trim() || isFull}
                className="tavern-btn tavern-btn-primary"
                style={{
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '52px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Feather size={16} />
                <span>{isGenerating ? 'Desenhando...' : 'Pedir Gravura'}</span>
                <Send size={13} />
              </button>
            </form>
          </div>
        </main>

        {/* COLUNA 3: MURAL DE PERGAMINHOS NA PAREDE (GALERIA) */}
        <aside
          className="tavern-cockpit-panel"
          style={{ width: '310px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Topo Coluna 3 */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pergaminhos no Mural
            </span>
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
              {sketches.length}/{MAX_SKETCHES}
            </span>
          </div>

          {/* Grid de gravuras salvas com scrollbar fina */}
          <div className="tavern-thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {sketches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: '#78716c' }}>
                <Feather size={32} color="#d97706" style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '12px', margin: '0 0 4px 0', color: '#fef3c7' }}>O mural está vazio</p>
                <p style={{ fontSize: '11px', margin: 0, color: '#a89a8a' }}>
                  Faça um pedido ao bardo para pregar o primeiro pergaminho na parede.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sketches.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(20, 13, 9, 0.85)',
                      border: '1px solid rgba(217, 119, 6, 0.22)',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setLightbox({
                        imageUrl: item.imageUrl,
                        prompt: item.prompt,
                        description: item.description,
                        category: item.category
                      })}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(217, 119, 6, 0.3)',
                        padding: 0,
                        background: '#000',
                        cursor: 'pointer'
                      }}
                      title="Clique para ampliar"
                    >
                      <img src={item.imageUrl} alt={item.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(217, 119, 6, 0.2)',
                          color: '#fbbf24',
                          textTransform: 'uppercase'
                        }}
                      >
                        {item.category}
                      </span>
                      <p
                        className="font-lore"
                        style={{
                          margin: '4px 0 6px 0',
                          fontSize: '11px',
                          color: '#f5ecdc',
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={item.prompt}
                      >
                        {item.prompt}
                      </p>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleDownload(item.imageUrl, item.category)}
                          className="tavern-btn tavern-btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Baixar gravura"
                        >
                          <Download size={11} />
                          <span>Baixar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(item)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            cursor: 'pointer'
                          }}
                          title="Rasgar pergaminho"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

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
              A gravura será descartada e liberará um espaço no mural de carvalho.
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
