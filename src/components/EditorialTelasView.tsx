import React, { useState, useEffect } from 'react';
import { Download, Trash2, Loader2, Sparkles, X } from 'lucide-react';
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
  /** Se o usuário pode gerar imagens (liberado pelo Administrador) */
  canGenerate?: boolean;
  permissionRequested?: boolean;
  onRequestPermission?: () => void;
}

/** Estilo fixo aplicado a toda gravura (a seleção de técnicas foi removida) */
const IMAGE_STYLE_SUFFIX = ', traço de bico de pena e nanquim sobre pergaminho com hachuras medievais';

/** Prego minimalista: círculo plano na cor do fundo do site, sem brilho, degradê ou sombra */
const ForgedNail: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: '-5px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      pointerEvents: 'none',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: '#100905',
    }}
    aria-hidden="true"
  />
);

/** Gravura solta sobre o fundo escuro, levemente torta, presa por um prego plano */
const PinnedParchmentEngraving: React.FC<{
  sketch: SketchAsset;
  index: number;
  onSelect: () => void;
  onDelete: (id: string) => void;
}> = ({ sketch, index, onSelect, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseRotation = index % 2 === 0 ? -1.5 : 1.5;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        transformOrigin: '50% 0',
        transform: isHovered ? 'rotate(0deg) scale(1.02)' : `rotate(${baseRotation}deg)`,
        transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: 'pointer',
        boxSizing: 'border-box',
        width: '100%',
        aspectRatio: '1 / 1',
        zIndex: isHovered ? 5 : 1,
      }}
    >
      <img
        src={sketch.imageUrl}
        alt={sketch.prompt}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <ForgedNail />
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '6px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 11,
        }}
      >
        <a
          href={sketch.imageUrl}
          download={`gravura-${sketch.id}.png`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#F4E8D7', background: 'rgba(16,9,5,0.6)', borderRadius: '50%', padding: '5px', display: 'inline-flex' }}
          title="Baixar Gravura"
        >
          <Download size={13} />
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(sketch.id);
          }}
          style={{ color: '#F4E8D7', background: 'rgba(16,9,5,0.6)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', display: 'inline-flex' }}
          title="Remover Gravura da Parede"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export const EditorialTelasView: React.FC<EditorialTelasViewProps> = ({
  onBack,
  sketches,
  campaigns,
  activeCampaignId,
  onSaveSketch,
  onDeleteSketch,
  canGenerate = false,
  permissionRequested = false,
  onRequestPermission,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSketch, setSelectedSketch] = useState<SketchAsset | null>(null);

  const activeCampaignName = campaigns?.find(c => c.id === activeCampaignId)?.name || 'Salão Geral';

  useEffect(() => {
    if (!selectedSketch) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSketch(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSketch]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) return;
    if (!promptText.trim() || isGenerating) return;

    setIsGenerating(true);
    tavernAudio.playBellChime();

    try {
      const fullPrompt = `${promptText.trim()}${IMAGE_STYLE_SUFFIX}`;
      const result = await aiService.generateSketch(fullPrompt, 'cena', {
        aspectRatio: '1:1',
        imageSize: '1K',
      });

      if (result && result.imageUrl) {
        onSaveSketch({
          imageUrl: result.imageUrl,
          prompt: promptText.trim(),
          description: 'Gravura',
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

            {!canGenerate && (
              <div style={{ maxWidth: '620px', marginBottom: '18px', padding: '14px 18px', border: '1px solid rgba(212,163,89,0.35)', borderRadius: '10px', background: 'rgba(212,163,89,0.08)', fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#EAE0D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontStyle: 'italic' }}>Geração restrita — solicite autorização ao Mestre Supremo / Administrador da Taverna.</span>
                <button
                  type="button"
                  onClick={onRequestPermission}
                  disabled={permissionRequested}
                  className="editorial-btn-primary"
                  style={{ opacity: permissionRequested ? 0.6 : 1 }}
                >
                  {permissionRequested ? 'Pedido Enviado' : 'Solicitar Permissão'}
                </button>
              </div>
            )}
            {/* Formulário de Criação Alinhado à Esquerda */}
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '620px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Instrua o bardo: um dragão de rubi sobre montanhas nevadas..."
                  disabled={isGenerating || !canGenerate}
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
                  disabled={!canGenerate || isGenerating || !promptText.trim()}
                  className="editorial-btn-primary"
                  style={{ opacity: !canGenerate || isGenerating || !promptText.trim() ? 0.5 : 1 }}
                >
                  {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {isGenerating ? 'Iluminando Pergaminho...' : 'Traçar Gravura'}
                </button>


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

      {/* 4. Seção Inferior: Mural de Gravuras Pregadas na Parede de Madeira */}
      <div className="editorial-frosted-panel room-matte-II" style={{ marginTop: '36px' }}>
        <div style={{ fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 600, marginBottom: '24px' }}>
          Mural de Gravuras da Estalagem ({sketches.length})
        </div>

        {sketches.length > 0 ? (
          <div
            className="telas-mural-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '32px',
              padding: '12px 6px',
            }}
          >
            {sketches.map((sk, index) => (
              <PinnedParchmentEngraving
                key={sk.id}
                sketch={sk}
                index={index}
                onSelect={() => setSelectedSketch(sk)}
                onDelete={onDeleteSketch}
              />
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

      {/* Lightbox / Visualização Ampliada da Gravura Pregada */}
      {selectedSketch && (
        <div
          onClick={() => setSelectedSketch(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(10, 6, 4, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '640px',
              width: '100%',
              backgroundColor: '#E8D9C4',
              backgroundImage: 'radial-gradient(circle at 50% 30%, #F5E9D8 0%, #E8D9C4 65%, #D4BEA0 100%)',
              padding: '36px 24px 22px 24px',
              borderRadius: '2px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(115, 85, 55, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Prego no topo do modal de pergaminho */}
            <ForgedNail />

            <button
              onClick={() => setSelectedSketch(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#423024',
                padding: '6px',
                borderRadius: '4px',
                opacity: 0.7,
                display: 'inline-flex',
                transition: 'opacity 0.2s',
              }}
              className="hover:opacity-100"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: '100%',
                maxHeight: '62vh',
                overflow: 'hidden',
                backgroundColor: '#1C130B',
                borderRadius: '1px',
                boxShadow: 'inset 0 0 14px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0,0,0,0.25)',
                border: '1px solid rgba(90, 65, 42, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={selectedSketch.imageUrl}
                alt={selectedSketch.prompt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '62vh',
                  objectFit: 'contain',
                  filter: 'sepia(14%) contrast(104%)',
                  display: 'block',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#281B12',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={selectedSketch.prompt}
                >
                  {selectedSketch.prompt}
                </div>

              </div>

              <a
                href={selectedSketch.imageUrl}
                download={`gravura-${selectedSketch.id}.png`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: 'rgba(58, 42, 30, 0.88)',
                  color: '#F4E8D7',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
                className="hover:opacity-90"
              >
                <Download size={13} />
                Baixar
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
