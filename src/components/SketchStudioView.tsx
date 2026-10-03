import React, { useState } from 'react';
import { Sparkles, Download, Layers, Shield, Wand2, Eye, Filter, RefreshCw, Check, Info, Cpu, Ratio, Key } from 'lucide-react';
import { Campaign, SketchAsset } from '../types';
import { aiService, GEMINI_SKETCH_MODEL, getEffectiveGeminiKey } from '../services/aiService';

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
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCampaignForSave, setSelectedCampaignForSave] = useState(activeCampaignId || campaigns[0]?.id || '');
  const [previewAsset, setPreviewAsset] = useState<SketchAsset | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('taberna_gemini_api_key') || '' : ''
  );

  const PRESET_IDEAS = [
    { label: '🗡️ Espada Rúnica Anciã', prompt: 'Espada longa mágica antiga cravada em pedestal de pedra com runas nórdicas gravadas no gume', category: 'item' as const },
    { label: '🧌 Mímico Disfarçado', prompt: 'Baú de madeira reforçado com dentes afiados nas frestas e língua monstruosa de fora', category: 'criatura' as const },
    { label: '🧔 Taberneiro Anão', prompt: 'Retrato de um taberneiro anão corpulento com avental de couro e longa barba trançada segurando caneca de cerveja', category: 'npc' as const },
    { label: '🗺️ Mapa de Catacumba', prompt: 'Planta baixa desenhada à mão de catacumba com sarcófagos, corredores armadilhados e sala do oráculo', category: 'mapa' as const },
    { label: '🏰 Salão da Taberna', prompt: 'Interior aconchegante de taverna medieval com lareira crepitante, mesas rústicas de carvalho e barris', category: 'cena' as const },
  ];

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (customKeyInput.trim()) {
        localStorage.setItem('taberna_gemini_api_key', customKeyInput.trim());
      } else {
        localStorage.removeItem('taberna_gemini_api_key');
      }
      setShowKeyConfig(false);
      setSuccessToast('Chave de API do Gemini atualizada com sucesso!');
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  const handleDownload = (asset: SketchAsset) => {
    const link = document.createElement('a');
    link.href = asset.imageUrl;
    link.download = `sketch_${asset.category}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setQuotaNotice(null);

    try {
      const result = await aiService.generateSketch(prompt, category, {
        aspectRatio,
        imageSize: '2K'
      });

      onSaveSketch({
        prompt: prompt.trim(),
        imageUrl: result.imageUrl,
        category,
        campaignId: selectedCampaignForSave || undefined,
        description: result.description,
        modelUsed: result.modelUsed,
      });

      if (result.quotaNotice) {
        setQuotaNotice(result.quotaNotice);
      } else if (result.isAiGenerated) {
        setSuccessToast(`✨ Ilustração sintetizada pelo Gemini 3 Pro Image (2K) e gravada na galeria!`);
      } else {
        setSuccessToast(`Novo rascunho enriquecido com IA gravado na galeria!`);
      }

      setTimeout(() => setSuccessToast(''), 6000);
      setPrompt('');
    } catch (err: any) {
      console.error('Erro ao gerar sketch:', err);
      setQuotaNotice(err?.message || 'Erro durante a geração');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={26} color="var(--amber-torch)" />
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>
                Sketch Studio — Motor de Ilustração Monocromática
              </h2>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                Desenho detalhado de RPG em grafite e nanquim com o modelo de ponta <strong>Gemini 3 Pro Image (Nano Banana Pro)</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="btn-tavern btn-secondary"
            style={{
              fontSize: '11px',
              padding: '6px 12px',
              color: '#fef08a',
              borderColor: '#78350f',
              backgroundColor: '#2a180b',
              gap: '6px'
            }}
          >
            <Key size={13} color="#facc15" />
            Configurar Chave Gemini
          </button>
        </div>
      </div>

      {/* Model Spec & Constraints Banner */}
      <div style={{
        backgroundColor: 'rgba(217, 119, 6, 0.12)',
        border: '1px solid var(--amber-torch)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={16} color="var(--amber-torch)" />
            <span style={{ fontSize: '12px', color: '#fef3c7', fontWeight: 700 }}>
              Modelo: <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>gemini-3-pro-image</span> (Nano Banana Pro)
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <div style={{ fontSize: '12px', color: '#fef3c7' }}>
            <strong>Estilo Travado:</strong> Monocromático • Grafite Fino & Hachura • Pergaminho Texturizado • Resolução 2K
          </div>
        </div>

        <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px', padding: '3px 8px' }}>
          ✨ IA Conectada
        </span>
      </div>

      {/* Chave Gemini Customizada Config Modal/Drawer */}
      {showKeyConfig && (
        <form onSubmit={handleSaveCustomKey} className="parchment-card" style={{ padding: '16px 20px', marginBottom: '20px', border: '2px solid var(--amber-torch)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, fontSize: '13px' }}>
            <Key size={16} color="var(--amber-deep)" />
            Chave de Acesso Gemini API (Opcional para Cota Própria de Imagens)
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-dark)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            O modelo <code>gemini-3-pro-image</code> exige faturamento ativado no Google AI Studio (limite 0 no Free Tier). Se você possuir uma chave do Google Cloud / AI Studio com plano ativo, insira-a abaixo para usá-la prioritariamente.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="password"
              value={customKeyInput}
              onChange={e => setCustomKeyInput(e.target.value)}
              placeholder="Cole sua API Key do Gemini (ex: AIzaSy... ou AQ.Ab...)"
              className="tavern-input"
              style={{ flex: 1, minWidth: '260px' }}
            />
            <button type="submit" className="btn-tavern btn-primary" style={{ fontSize: '12px', padding: '8px 16px' }}>
              Salvar Chave
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomKeyInput('');
                localStorage.removeItem('taberna_gemini_api_key');
                setShowKeyConfig(false);
                setSuccessToast('Chave customizada removida. Voltando à chave padrão do ambiente.');
                setTimeout(() => setSuccessToast(''), 4000);
              }}
              className="btn-tavern btn-secondary"
              style={{ fontSize: '12px', padding: '8px 14px', color: '#fef08a', backgroundColor: '#2a180b' }}
            >
              Restaurar Padrão
            </button>
          </div>
        </form>
      )}

      {/* Quota Notice Banner */}
      {quotaNotice && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1.5px solid #d97706',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#92400e',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Info size={20} color="#b45309" style={{ flexShrink: 0 }} />
          <div>
            <strong>Aviso de Cota do Google AI Studio:</strong> {quotaNotice}
            <div style={{ fontSize: '11px', marginTop: '3px', opacity: 0.9 }}>
              O asset foi renderizado com estilo temático e descrição contextual gerada pela IA enquanto a cota de imagem não estiver ativada com faturamento.
            </div>
          </div>
        </div>
      )}

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
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
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
                Prompt de Criação (Enviado ao Gemini 3 Pro Image):
              </label>
              <textarea
                rows={3}
                required
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ex: Espada longa élfica com gume serrilhado em aço negro, runas brilhantes no punho de couro trançado..."
                className="tavern-input font-lore"
                style={{ fontSize: '15px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
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
                  Proporção de Tela (Aspect Ratio):
                </label>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value as any)}
                  className="tavern-input"
                >
                  <option value="1:1">1:1 (Quadrado • Padrão de Ficha)</option>
                  <option value="3:4">3:4 (Retrato • Corpo Inteiro / NPC)</option>
                  <option value="4:3">4:3 (Paisagem • Encontros)</option>
                  <option value="16:9">16:9 (Panorâmico • Cenários)</option>
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
                  <span>Conectando ao Gemini 3 Pro Image (Sintetizando Traços em Grafite)...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Traçar Rascunho com Gemini 3 Pro</span>
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
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={18} color="#059669" />
              {successToast}
            </div>
          )}
        </div>

        {/* Gallery of Sketches */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>
              Galeria de Rascunhos ({sketches.length} assets gravados)
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Ilustrações conceituais de alta fidelidade
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
                {/* Sketch Image Frame */}
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
                    backgroundColor: 'rgba(26, 16, 8, 0.85)',
                    color: '#fef08a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-cinzel)',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}>
                    {item.category.toUpperCase()}
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(26, 16, 8, 0.85)',
                    color: '#fbbf24',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontFamily: 'monospace'
                  }}>
                    {item.modelUsed || GEMINI_SKETCH_MODEL}
                  </div>
                </div>

                <div>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--ink-dark)',
                    margin: '0 0 4px 0',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    "{item.prompt}"
                  </p>

                  {item.description && (
                    <p className="font-lore" style={{
                      fontSize: '12px',
                      color: 'var(--ink-dark)',
                      margin: '0 0 8px 0',
                      lineHeight: 1.35,
                      fontStyle: 'italic',
                      opacity: 0.85,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.description}
                    </p>
                  )}

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
                      color: '#fef08a',
                      borderColor: '#78350f',
                      backgroundColor: '#2a180b',
                      minHeight: '34px'
                    }}
                  >
                    <Eye size={14} color="#facc15" />
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
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
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Rascunho Original em Traço a Lápis
              </h3>
              <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
                {previewAsset.modelUsed || GEMINI_SKETCH_MODEL}
              </span>
            </div>

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

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-deep)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Prompt Original
              </div>
              <p className="font-lore" style={{ fontSize: '15px', color: 'var(--ink-dark)', lineHeight: 1.4, margin: 0 }}>
                "{previewAsset.prompt}"
              </p>
            </div>

            {previewAsset.description && (
              <div style={{
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                borderLeft: '3px solid var(--amber-torch)',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber-deep)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Descrição de Ficha (IA)
                </div>
                <p className="font-lore" style={{ fontSize: '14px', color: 'var(--ink-dark)', lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                  {previewAsset.description}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewAsset.prompt);
                  alert('Prompt copiado para a área de transferência!');
                }}
                className="btn-tavern btn-secondary"
                style={{ color: '#fef08a', backgroundColor: '#2a180b', borderColor: '#78350f', fontSize: '11px' }}
              >
                Copiar Prompt
              </button>
              <button
                onClick={() => handleDownload(previewAsset)}
                className="btn-tavern btn-primary"
                style={{ fontSize: '11px' }}
              >
                <Download size={14} />
                Baixar Rascunho
              </button>
              <button
                onClick={() => setPreviewAsset(null)}
                className="btn-tavern btn-secondary"
                style={{ color: '#fef08a', backgroundColor: '#2a180b', borderColor: '#78350f', fontSize: '11px' }}
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
