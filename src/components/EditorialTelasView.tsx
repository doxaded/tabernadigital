import React, { useState } from 'react';
import { Download, Trash2, Music, Loader2, Sparkles } from 'lucide-react';
import { SketchAsset } from '../types';
import { aiService } from '../services/aiService';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialTelasViewProps {
  onBack?: () => void;
  sketches: SketchAsset[];
  campaigns?: { id: string; name: string }[];
  activeCampaignId?: string | null;
  onSaveSketch: (asset: Omit<SketchAsset, 'id' | 'createdAt'>) => void;
  onDeleteSketch: (id: string) => void;
}

type Technique = 'nanquim' | 'xilogravura' | 'carvao' | 'iluminura';

const TECHNIQUES: { value: Technique; label: string; suffix: string }[] = [
  { value: 'nanquim', label: 'Pena & Nanquim', suffix: ', traço de bico de pena e nanquim sobre pergaminho com hachuras medievais' },
  { value: 'xilogravura', label: 'Xilogravura', suffix: ', gravura em madeira rústica estilo xilogravura medieval de alto contraste' },
  { value: 'carvao', label: 'Estudo a Carvão', suffix: ', estudo sombreado a carvão vegetal com esfuminho e textura rica' },
  { value: 'iluminura', label: 'Iluminura Real', suffix: ', estilo iluminura medieval com detalhes ornamentais nobres e folha de prata' },
];

export const EditorialTelasView: React.FC<EditorialTelasViewProps> = ({
  onBack,
  sketches,
  campaigns,
  activeCampaignId,
  onSaveSketch,
  onDeleteSketch,
}) => {
  const [promptText, setPromptText] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<Technique>('nanquim');
  const [isGenerating, setIsGenerating] = useState(false);
  const [_selectedSketch, setSelectedSketch] = useState<SketchAsset | null>(() => sketches[0] || null);

  const activeCampaignName = campaigns?.find(c => c.id === activeCampaignId)?.name || 'Salão Geral';

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isGenerating) return;

    setIsGenerating(true);
    tavernAudio.playBellChime();

    try {
      const tech = TECHNIQUES.find(t => t.value === selectedTechnique) || TECHNIQUES[0];
      const fullPrompt = `${promptText.trim()}${tech.suffix}`;
      const result = await aiService.generateSketch(fullPrompt, 'cena', {
        aspectRatio: '1:1',
        imageSize: '1K',
      });

      if (result && result.imageUrl) {
        onSaveSketch({
          imageUrl: result.imageUrl,
          prompt: promptText.trim(),
          description: tech.label,
          category: 'cena',
          campaignId: activeCampaignId || undefined,
          modelUsed: result.modelUsed,
          aspectRatio: '1:1',
        });
        tavernAudio.playToastSound();
        setPromptText('');
      } else {
        alert('O bardo hesitou ao molhar a pena. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Não foi possível concluir a gravura.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentTechObj = TECHNIQUES.find(t => t.value === selectedTechnique) || TECHNIQUES[0];

  return (
    <main className="editorial-room-container">
      {/* 2. Cabeçalho Interno da Sala em Linha Única */}
      <div className="editorial-header-bar">
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

        <div className="editorial-segmented-control">
          {TECHNIQUES.map((tech) => {
            const isActive = selectedTechnique === tech.value;
            return (
              <button
                key={tech.value}
                onClick={() => setSelectedTechnique(tech.value)}
                className={`editorial-segmented-item ${isActive ? 'is-active' : ''}`}
              >
                {tech.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Layout Assimétrico Estilo Kerbache HR / Claude (8 colunas / 4 colunas) */}
      <div className="editorial-grid-12" style={{ alignItems: 'stretch' }}>
        {/* Coluna Principal (Esquerda - 8 colunas) Envolvida em Bloco Fosco Padronizado */}
        <div 
          className="editorial-frosted-card room-matte-II"
          style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}
        >
          <div>
            <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '12px', color: '#D4A359' }}>
              SALA II • ATELIÊ DE GRAVURAS
            </div>

            <h1
              style={{
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                fontSize: 'clamp(32px, 4.5vw, 44px)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '0 0 16px 0',
                color: '#EAE0D5',
              }}
            >
              Telas do Alaúde
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
                color: '#EAE0D5',
              }}
            >
              Gravuras e estudos visuais das sagas narradas ao redor do fogo, traçados à pena pelo bardo da estalagem com inteligência oracular.
            </p>

            {/* Formulário de Criação Alinhado à Esquerda */}
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '620px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Instrua o bardo: um dragão de rubi sobre montanhas nevadas..."
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(212, 163, 89, 0.22)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontSize: '16px',
                    color: '#EAE0D5',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={isGenerating || !promptText.trim()}
                  className="editorial-btn-primary"
                  style={{ opacity: isGenerating || !promptText.trim() ? 0.5 : 1 }}
                >
                  {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {isGenerating ? 'Iluminando Pergaminho...' : 'Traçar Gravura'}
                </button>

                <span style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.75, color: '#D4A359' }}>
                  Técnica ativa: <strong>{currentTechObj.label}</strong>
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Coluna Lateral (Direita - 4 colunas): Card Editorial Claude */}
        <aside 
          className="editorial-claude-card room-matte-II"
          style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}
        >
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.65, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
              Guia do Ateliê
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Técnica</span>
              <span className="editorial-meta-value">{currentTechObj.label}</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Proporção</span>
              <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>1:1 Quadrada</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Qualidade</span>
              <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>1K Studio</span>
            </div>

            <div className="editorial-meta-row">
              <span className="editorial-meta-label">Mural</span>
              <span className="editorial-meta-value">{activeCampaignName}</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.75, lineHeight: '1.6', marginTop: '16px', marginBottom: 0 }}>
            As iluminuras geradas são consagradas no arquivo visual da mesa ativa para consulta de todos os aventureiros.
          </p>
        </aside>
      </div>

      {/* 4. Seção Inferior: Grade de Gravuras Criadas */}
      <div className="editorial-frosted-panel room-matte-II" style={{ marginTop: '36px' }}>
        <div style={{ fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 600, marginBottom: '20px' }}>
          Mural de Gravuras da Estalagem ({sketches.length})
        </div>

        {sketches.length > 0 ? (
          <div className="editorial-cards-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {sketches.map((sk) => (
              <div
                key={sk.id}
                onClick={() => setSelectedSketch(sk)}
                className="editorial-claude-card"
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '220px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <img
                    src={sk.imageUrl}
                    alt={sk.prompt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'sepia(18%) contrast(104%)',
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '17px', fontWeight: 600, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sk.prompt}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span className="editorial-pill-tag">
                      {sk.description || 'Pena & Nanquim'}
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a
                        href={sk.imageUrl}
                        download={`gravura-${sk.id}.png`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'inherit', opacity: 0.75, display: 'inline-flex' }}
                        title="Baixar Gravura"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSketch(sk.id);
                        }}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', opacity: 0.6, cursor: 'pointer', display: 'inline-flex' }}
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="editorial-claude-card" style={{ padding: '36px', textAlign: 'left' }}>
            <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.75, margin: 0 }}>
              Nenhuma gravura orna os muros deste ateliê ainda. Instrua o bardo para que ele trace a primeira obra.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
