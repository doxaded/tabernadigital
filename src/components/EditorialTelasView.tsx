import React, { useState } from 'react';
import { Download, Trash2, Music, Loader2, Sparkles } from 'lucide-react';
import { SketchAsset } from '../types';
import { aiService } from '../services/aiService';
import { tavernAudio } from '../services/tavernAudio';

interface EditorialTelasViewProps {
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

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '820px',
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
        Sala II • Ateliê de Gravuras
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
        Telas do Alaúde
      </h1>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: '17px',
          lineHeight: '1.7',
          maxWidth: '620px',
          margin: '0 0 36px 0',
          opacity: 0.85,
        }}
      >
        Gravuras e estudos visuais das sagas narradas ao redor do fogo, traçados à pena pelo bardo da estalagem.
      </p>

      {/* Galeria Central Compacta (Estilo Editorial Museum) */}
      {sketches.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '32px',
            width: '100%',
            marginBottom: '40px',
          }}
        >
          {sketches.map((sk) => (
            <div
              key={sk.id}
              onClick={() => setSelectedSketch(sk)}
              style={{
                width: '210px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              className="hover:scale-105"
            >
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.2)',
                  marginBottom: '12px',
                }}
              >
                <img
                  src={sk.imageUrl}
                  alt={sk.prompt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'sepia(20%) contrast(105%)',
                  }}
                />
              </div>

              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sk.prompt}
              </div>

              <div style={{ fontStyle: 'italic', fontSize: '12px', opacity: 0.75, marginBottom: '6px' }}>
                {sk.description || 'Pena & Nanquim'}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSketch(sk.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '11px',
                  textDecoration: 'underline',
                  color: 'inherit',
                  opacity: 0.6,
                  cursor: 'pointer',
                }}
                title="Apagar gravura do mural"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ margin: '36px 0', fontStyle: 'italic', fontSize: '17px', opacity: 0.75 }}>
          Nenhuma gravura orna os muros deste ateliê ainda. Instrua o bardo para que ele trace a primeira obra.
        </div>
      )}

      {/* Formulário Minimalista de Criação do Bardo */}
      <form
        onSubmit={handleGenerate}
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid rgba(31, 18, 11, 0.2)',
          paddingTop: '28px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', fontSize: '13px' }}>
          {TECHNIQUES.map((tech) => (
            <button
              type="button"
              key={tech.value}
              onClick={() => setSelectedTechnique(tech.value)}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 4px',
                cursor: 'pointer',
                color: 'inherit',
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                textDecoration: selectedTechnique === tech.value ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                fontWeight: selectedTechnique === tech.value ? 700 : 400,
                opacity: selectedTechnique === tech.value ? 1 : 0.6,
              }}
            >
              {tech.label}
            </button>
          ))}
        </div>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Instrua o bardo: um dragão de rubi sobre montanhas..."
            disabled={isGenerating}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(31, 18, 11, 0.35)',
              padding: '8px 4px',
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              fontSize: '16px',
              color: 'inherit',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={isGenerating || !promptText.trim()}
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
              cursor: isGenerating ? 'wait' : 'pointer',
              color: 'inherit',
              opacity: isGenerating || !promptText.trim() ? 0.4 : 1,
            }}
          >
            {isGenerating ? 'Traçando...' : 'Ilustrar'}
          </button>
        </div>
      </form>
    </div>
  );
};
