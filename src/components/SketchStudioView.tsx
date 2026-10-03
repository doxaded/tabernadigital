import React, { useState } from 'react';
import { Sparkles, Download, Layers, Shield, Wand2, Eye, Filter, RefreshCw, Check } from 'lucide-react';
import { Campaign, SketchAsset } from '../types';
import { aiService, SKETCH_SYSTEM_INSTRUCTION } from '../services/aiService';

interface SketchStudioViewProps {
  sketches: SketchAsset[];
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSaveSketch: (sketch: Omit<SketchAsset, 'id' | 'createdAt'>) => void;
}

export const SketchStudioView: React.FC<SketchStudioViewProps> = ({
  sketches,
  campaigns,
  activeCampaignId,
  onSaveSketch,
}) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<'item' | 'npc' | 'criatura' | 'mapa' | 'cena'>('item');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCampaignForSave, setSelectedCampaignForSave] = useState(activeCampaignId || campaigns[0]?.id || '');
  const [previewAsset, setPreviewAsset] = useState<SketchAsset | null>(null);
  const [successToast, setSuccessToast] = useState('');

  const PRESET_IDEAS = [
    { label: '🗡️ Espada Rúnica Anciã', prompt: 'Espada mágica antiga cravada no pedestal de pedra com inscrições rúnicas', category: 'item' as const },
    { label: '🧌 Mímico Disfarçado de Baú', prompt: 'Baú de tesouro de madeira com dentes pontiagudos e língua monstruosa revelada', category: 'criatura' as const },
    { label: '🧔 Taberneiro Experiente', prompt: 'Retrato de um taberneiro anão com barba trançada segurando uma caneca de carvalho', category: 'npc' as const },
    { label: '🗺️ Mapa de Catacumba', prompt: 'Mapa desenhado à mão com corredores de pedra, armadilhas e câmara do altar', category: 'mapa' as const },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await aiService.generateSketch(prompt, category);
      const newAsset = onSaveSketch({
        prompt: prompt.trim(),
        imageUrl: result.imageUrl,
        category,
        campaignId: selectedCampaignForSave || undefined,
      });

      setSuccessToast('Novo rascunho em grafite gravado na galeria!');
      setTimeout(() => setSuccessToast(''), 4000);
      setPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={24} color="var(--amber-torch)" />
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>
            Sketch Studio — Motor de Ilustração Monocromática
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
          Geração de assets visuais para RPG estritamente restritos ao padrão <strong>Sketch</strong> (desenho em grafite/nanquim, sem cores, com consistência de traço).
        </p>
      </div>

      {/* Constraints Notice Banner */}
      <div style={{
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        border: '1px solid var(--amber-torch)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={18} color="var(--amber-glow)" />
          <div style={{ fontSize: '12px', color: '#fef3c7' }}>
            <strong>Parâmetros de Estilização Travados:</strong> Monocromático • Traço a lápis/nanquim uniforme • Hachuras cruzadas • Fundo pergaminho leve • 0% cores adicionais.
          </div>
        </div>
        <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
          Motor Ativo
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Generator Controls Card */}
        <div className="parchment-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>
            Descrever Novo Asset para a Mesa
          </h3>

          {/* Preset Buttons */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-light)' }}>
              Inspirações Rápidas:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {PRESET_IDEAS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setPrompt(p.prompt);
                    setCategory(p.category);
                  }}
                  className="btn-tavern"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid #ccb993',
                    color: 'var(--ink-dark)',
                    fontSize: '11px',
                    padding: '6px 12px',
                    minHeight: '34px'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Prompt de Criação:
              </label>
              <textarea
                rows={3}
                required
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ex: Escudo redondo de carvalho com bordas de ferro forjado e uma cabeça de javali gravada..."
                className="tavern-input font-lore"
                style={{ fontSize: '15px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  Categoria do Asset:
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="tavern-input"
                >
                  <option value="item">Item / Arma / Equipamento</option>
                  <option value="npc">Personagem / NPC da Taberna</option>
                  <option value="criatura">Monstro / Criatura Mágica</option>
                  <option value="mapa">Mapa / Planta de Masmorra</option>
                  <option value="cena">Cena / Arquitetura Medieval</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  Vincular à Campanha (Opcional):
                </label>
                <select
                  value={selectedCampaignForSave}
                  onChange={e => setSelectedCampaignForSave(e.target.value)}
                  className="tavern-input"
                >
                  <option value="">Nenhuma (Galeria Geral)</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.system})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="btn-tavern btn-primary"
              style={{ marginTop: '6px' }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="torch-flicker" />
                  <span>Esboçando Traços em Grafite...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Traçar Rascunho Monocromático</span>
                </>
              )}
            </button>
          </form>

          {successToast && (
            <div style={{
              marginTop: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Check size={16} />
              {successToast}
            </div>
          )}
        </div>

        {/* Gallery of Sketches */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>
              Galeria de Rascunhos ({sketches.length} assets gravados)
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Estilo padronizado em traço e espessura
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {sketches.map(item => (
              <div
                key={item.id}
                className="parchment-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}
              >
                {/* Sketch Image Frame with Torn Paper Edge Effect */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#f3ebd7',
                  border: '2px solid #ccb993',
                  boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.15)',
                  marginBottom: '10px'
                }}>
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'contrast(1.05) grayscale(100%)',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(26, 16, 8, 0.8)',
                    color: '#fef08a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-cinzel)',
                    fontWeight: 700
                  }}>
                    {item.category.toUpperCase()}
                  </div>
                </div>

                <div>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--ink-dark)',
                    margin: '0 0 8px 0',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    "{item.prompt}"
                  </p>
                  <div style={{ fontSize: '10px', color: 'var(--ink-light)', marginBottom: '10px' }}>
                    Gravado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setPreviewAsset(item)}
                    className="btn-tavern btn-secondary"
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '11px',
                      color: 'var(--ink-dark)',
                      borderColor: 'var(--parchment-dark)',
                      minHeight: '34px'
                    }}
                  >
                    <Eye size={14} />
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => alert('Download do rascunho em alta resolução!')}
                    className="btn-tavern btn-primary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      minHeight: '34px'
                    }}
                    title="Baixar imagem"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Visualização em Detalhes */}
      {previewAsset && (
        <div className="tavern-modal-backdrop" onClick={() => setPreviewAsset(null)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>
              Rascunho Original em Traço a Lápis
            </h3>
            <div style={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid #ccb993',
              boxShadow: 'var(--shadow-parchment)',
              marginBottom: '16px',
              backgroundColor: '#fff'
            }}>
              <img
                src={previewAsset.imageUrl}
                alt={previewAsset.prompt}
                style={{ width: '100%', height: 'auto', display: 'block', filter: 'grayscale(100%)' }}
              />
            </div>
            <p className="font-lore" style={{ fontSize: '16px', color: 'var(--ink-dark)', lineHeight: 1.5, marginBottom: '16px' }}>
              <strong>Prompt:</strong> "{previewAsset.prompt}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewAsset.prompt);
                  alert('Prompt copiado para a área de transferência!');
                }}
                className="btn-tavern btn-secondary"
                style={{ color: 'var(--ink-dark)', borderColor: 'var(--parchment-dark)', fontSize: '11px' }}
              >
                Copiar Prompt
              </button>
              <button
                onClick={() => setPreviewAsset(null)}
                className="btn-tavern btn-primary"
                style={{ fontSize: '11px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
