import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Layers,
  Shield,
  Wand2,
  Eye,
  Filter,
  RefreshCw,
  Check,
  Info,
  Cpu,
  Key,
  Trash2,
  AlertTriangle,
  X,
  Coins,
  Edit3,
  Calculator,
  FileText,
  Copy
} from 'lucide-react';
import { Campaign, SketchAsset, SketchCostEstimate } from '../types';
import {
  aiService,
  GEMINI_SKETCH_MODEL,
  getEffectiveGeminiKey,
  buildSketchPrompt,
  explainPromptInterpretation,
  calculateSketchCost
} from '../services/aiService';

const MAX_SKETCHES = 10;

interface SketchStudioViewProps {
  sketches: SketchAsset[];
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSaveSketch: (sketch: Omit<SketchAsset, 'id' | 'createdAt'>) => void;
  onDeleteSketch?: (id: string) => void;
}

export const SketchStudioView: React.FC<SketchStudioViewProps> = ({
  sketches,
  campaigns,
  activeCampaignId,
  onSaveSketch,
  onDeleteSketch,
}) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<'item' | 'npc' | 'criatura' | 'mapa' | 'cena'>('item');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCampaignForSave, setSelectedCampaignForSave] = useState(activeCampaignId || campaigns[0]?.id || '');
  const [previewAsset, setPreviewAsset] = useState<SketchAsset | null>(null);
  const [sketchToDelete, setSketchToDelete] = useState<SketchAsset | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('taberna_gemini_api_key') || '' : ''
  );

  // Estados da Função 1: Modal Aberto de Edição & Autorização Prévia
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [interpretedSummary, setInterpretedSummary] = useState('');
  const [previewCost, setPreviewCost] = useState<SketchCostEstimate | null>(null);

  // Estados da Função 2: Recibo de Tokens e Custo da Última Execução
  const [lastCostReceipt, setLastCostReceipt] = useState<SketchCostEstimate | null>(null);

  const isFull = sketches.length >= MAX_SKETCHES;
  const usagePercentage = Math.min(100, Math.round((sketches.length / MAX_SKETCHES) * 100));

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

  const handleDeleteConfirm = () => {
    if (!sketchToDelete) return;
    if (onDeleteSketch) {
      onDeleteSketch(sketchToDelete.id);
      if (previewAsset?.id === sketchToDelete.id) {
        setPreviewAsset(null);
      }
      setSuccessToast(`Asset excluído com sucesso! 1 slot liberado no estúdio (${sketches.length - 1}/${MAX_SKETCHES} utilizados).`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
    setSketchToDelete(null);
  };

  // Abre o Modal de Revisão & Edição do que foi compreendido antes de chamar a IA
  const handleInitiateConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    if (isFull) {
      setStorageNotice(`Capacidade máxima de ${MAX_SKETCHES} assets atingida! Exclua ao menos uma imagem abaixo para liberar slots.`);
      return;
    }

    const refined = buildSketchPrompt(prompt.trim(), category);
    const explanation = explainPromptInterpretation(prompt.trim(), category, aspectRatio);
    const estCost = calculateSketchCost(GEMINI_SKETCH_MODEL, refined, '1K');

    setEditablePrompt(refined);
    setInterpretedSummary(explanation);
    setPreviewCost(estCost);
    setIsConfirmModalOpen(true);
  };

  // Executa efetivamente a geração somente após a liberação/confirmação do usuário
  const handleExecuteConfirmed = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsConfirmModalOpen(false);
    setIsGenerating(true);
    setQuotaNotice(null);
    setStorageNotice(null);

    try {
      const result = await aiService.generateSketch(prompt, category, {
        aspectRatio,
        imageSize: '1K',
        customRefinedPrompt: editablePrompt
      });

      onSaveSketch({
        prompt: prompt.trim(),
        imageUrl: result.imageUrl,
        category,
        campaignId: selectedCampaignForSave || undefined,
        description: result.description,
        modelUsed: result.modelUsed,
        aspectRatio,
        refinedPrompt: result.executedPrompt,
        costEstimate: result.costEstimate
      });

      if (result.costEstimate) {
        setLastCostReceipt(result.costEstimate);
      }

      if (result.quotaNotice) {
        setQuotaNotice(result.quotaNotice);
      } else if (result.isAiGenerated && result.costEstimate) {
        setSuccessToast(`✨ Ilustração sintetizada pelo ${result.modelUsed}! Gasto: $${result.costEstimate.estimatedCostUsd.toFixed(4)} USD (~R$ ${result.costEstimate.estimatedCostBrl.toFixed(2)} BRL) em ${result.costEstimate.totalTokens} tokens.`);
      } else {
        setSuccessToast(`Novo rascunho gravado na galeria! (${sketches.length + 1}/${MAX_SKETCHES})`);
      }

      setTimeout(() => setSuccessToast(''), 7000);
      setPrompt('');
    } catch (err: any) {
      console.error('Erro ao gerar sketch:', err);
      if (err?.name === 'QuotaExceededError' || err?.message?.includes('exceeded the quota')) {
        setStorageNotice('O armazenamento local do navegador atingiu a capacidade máxima. Exclua imagens anteriores da galeria para liberar memória.');
      } else {
        setQuotaNotice(err?.message || 'Erro durante a geração');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={26} color="var(--amber-torch)" />
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>
                Sketch Studio — Motor de Ilustração Monocromática
              </h2>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                Desenho detalhado de RPG em grafite e nanquim com o modelo econômico e veloz <strong>Gemini 3.1 Flash Image (Nano Banana 2)</strong>.
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
        marginBottom: '16px',
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
              Modelo Ativo: <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>gemini-3.1-flash-image</span> (Nano Banana 2)
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <div style={{ fontSize: '12px', color: '#fef3c7' }}>
            <strong>Estilo Travado:</strong> Monocromático • Grafite Fino & Hachura • Pergaminho Texturizado
          </div>
        </div>

        <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px', padding: '3px 8px' }}>
          ✨ IA Conectada
        </span>
      </div>

      {/* Capacity & Asset Quota Bar (10 Assets Max) */}
      <div style={{
        backgroundColor: isFull ? 'rgba(239, 68, 68, 0.12)' : 'rgba(26, 16, 8, 0.85)',
        border: `1.5px solid ${isFull ? '#ef4444' : 'var(--wood-border)'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color={isFull ? '#ef4444' : 'var(--amber-torch)'} />
            <span style={{ fontWeight: 700, fontSize: '13px', color: isFull ? '#fca5a5' : '#fef3c7' }}>
              Capacidade do Estúdio: {sketches.length} de {MAX_SKETCHES} assets utilizados
            </span>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isFull ? '#7f1d1d' : 'rgba(217, 119, 6, 0.2)',
            color: isFull ? '#fecaca' : '#fbbf24'
          }}>
            {isFull ? 'Limite Atingido — Exclua rascunhos para liberar slots' : `${MAX_SKETCHES - sketches.length} slots livres`}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${usagePercentage}%`,
            height: '100%',
            backgroundColor: isFull ? '#ef4444' : usagePercentage >= 80 ? '#f59e0b' : '#10b981',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Chave Gemini Customizada Config Modal/Drawer */}
      {showKeyConfig && (
        <form onSubmit={handleSaveCustomKey} className="parchment-card" style={{ padding: '16px 20px', marginBottom: '20px', border: '2px solid var(--amber-torch)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, fontSize: '13px' }}>
            <Key size={16} color="var(--amber-deep)" />
            Chave de Acesso Gemini API (Opcional para Cota Própria de Imagens)
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-dark)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            O modelo <code>gemini-3.1-flash-image</code> (Nano Banana 2) utiliza sua cota ativa do Google AI Studio com excelente velocidade e custo 50% menor por geração.
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

      {/* Storage Local Warning */}
      {storageNotice && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#991b1b',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <strong>Aviso de Limite de Assets:</strong> {storageNotice}
            </div>
          </div>
          <button
            onClick={() => setStorageNotice(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
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
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={20} color="#b45309" style={{ flexShrink: 0 }} />
            <div>
              <strong>Aviso da API Gemini:</strong> {quotaNotice}
            </div>
          </div>
          <button
            onClick={() => setQuotaNotice(null)}
            style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Generator Controls Card */}
        <div className="parchment-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              Descrever Novo Asset para a Mesa
            </h3>
            <span style={{ fontSize: '12px', color: isFull ? '#dc2626' : 'var(--ink-light)', fontWeight: 600 }}>
              {sketches.length} de {MAX_SKETCHES} slots ocupados
            </span>
          </div>

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
                  disabled={isFull}
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
                    minHeight: '34px',
                    opacity: isFull ? 0.6 : 1
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleInitiateConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Prompt de Criação (Enviado ao Gemini 3.1 Flash Image):
              </label>
              <textarea
                rows={3}
                required
                disabled={isFull}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={isFull ? "Exclua um asset da galeria abaixo para liberar espaço..." : "Ex: Espada longa élfica com gume serrilhado em aço negro, runas brilhantes no punho de couro trançado..."}
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
                  disabled={isFull}
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
                  disabled={isFull}
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
                  disabled={isFull}
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
              disabled={isGenerating || !prompt.trim() || isFull}
              className={`btn-tavern ${isFull ? 'btn-secondary' : 'btn-primary'}`}
              style={{
                marginTop: '6px',
                opacity: isFull ? 0.7 : 1,
                backgroundColor: isFull ? '#451a03' : undefined,
                color: isFull ? '#fef08a' : undefined
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="torch-flicker" />
                  <span>Sintetizando Traços em Grafite com {GEMINI_SKETCH_MODEL}...</span>
                </>
              ) : isFull ? (
                <>
                  <AlertTriangle size={16} color="#fbbf24" />
                  <span>Limite de 10 Assets Atingido (Exclua uma imagem para liberar slot)</span>
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  <span>Revisar & Autorizar Rascunho com IA ({sketches.length}/10)</span>
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

        {/* Extrato / Recibo de Tokens e Custo da Última Execução */}
        {lastCostReceipt && (
          <div style={{
            backgroundColor: 'rgba(26, 16, 8, 0.95)',
            border: '2px solid var(--amber-torch)',
            borderRadius: '8px',
            padding: '16px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setLastCostReceipt(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
              title="Fechar extrato de consumo"
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Coins size={20} color="var(--amber-torch)" />
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#fef3c7' }}>
                Extrato do Consumo de IA — Último Pedido Concluído
              </h4>
              <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px', padding: '2px 8px' }}>
                {lastCostReceipt.model}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Tokens de Entrada (Prompt)</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fef08a' }}>
                  {lastCostReceipt.promptTokens} <span style={{ fontSize: '11px', fontWeight: 400 }}>tokens</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Tokens de Imagem & Lore</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fef08a' }}>
                  {lastCostReceipt.outputTokens} <span style={{ fontSize: '11px', fontWeight: 400 }}>tokens</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Total de Tokens Gastos</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
                  {lastCostReceipt.totalTokens} <span style={{ fontSize: '11px', fontWeight: 400 }}>tokens</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#a7f3d0', marginBottom: '2px' }}>Estimativa de Custo Real</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399' }}>
                  ${lastCostReceipt.estimatedCostUsd.toFixed(4)} USD
                </div>
                <div style={{ fontSize: '11px', color: '#6ee7b7' }}>
                  ≈ R$ {lastCostReceipt.estimatedCostBrl.toFixed(2)} BRL (câmbio e impostos Google Cloud Brasil)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery of Sketches */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '18px', margin: 0 }}>
                Galeria de Rascunhos ({sketches.length} de {MAX_SKETCHES} assets gravados)
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Exclua imagens que não for mais usar para liberar espaço para novos desenhos
              </span>
            </div>

            <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
              {MAX_SKETCHES - sketches.length} slots disponíveis
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

                  {item.costEstimate && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.92)',
                      color: '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      <Coins size={10} />
                      ${item.costEstimate.estimatedCostUsd.toFixed(3)}
                    </div>
                  )}
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

                {/* Actions: Ver Detalhes, Download e Excluir */}
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
                      padding: '6px 10px',
                      fontSize: '11px',
                      minHeight: '34px'
                    }}
                    title="Baixar imagem"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => setSketchToDelete(item)}
                    className="btn-tavern btn-danger"
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      minHeight: '34px',
                      backgroundColor: '#7f1d1d',
                      borderColor: '#b91c1c'
                    }}
                    title="Excluir asset para liberar vaga"
                  >
                    <Trash2 size={14} color="#fee2e2" />
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

            {/* Métricas de Custo e Tokens Gastos */}
            {previewAsset.costEstimate && (
              <div style={{
                backgroundColor: 'rgba(26, 16, 8, 0.85)',
                border: '1.5px solid var(--amber-torch)',
                borderRadius: '6px',
                padding: '12px 14px',
                marginBottom: '16px',
                color: '#fef3c7'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#facc15', textTransform: 'uppercase' }}>
                    <Coins size={14} color="#facc15" />
                    Consumo & Estimativa de Custos da IA
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {previewAsset.costEstimate.model}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Tokens Entrada</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fef08a' }}>{previewAsset.costEstimate.promptTokens}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Tokens Imagem</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fef08a' }}>{previewAsset.costEstimate.outputTokens}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Total Tokens</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{previewAsset.costEstimate.totalTokens}</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Custo Estimado</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                      ${previewAsset.costEstimate.estimatedCostUsd.toFixed(4)} USD
                    </div>
                    <div style={{ fontSize: '9px', color: '#6ee7b7' }}>
                      (~R$ {previewAsset.costEstimate.estimatedCostBrl.toFixed(2)} BRL)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Refinado Executado */}
            {previewAsset.refinedPrompt && (
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid #ccb993',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber-deep)', textTransform: 'uppercase' }}>
                    Prompt Artístico Refinado Efetivamente Executado:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(previewAsset.refinedPrompt || '');
                      alert('Prompt refinado copiado!');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--amber-deep)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Copy size={12} /> Copiar
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ink-dark)', margin: 0, fontFamily: 'monospace', lineHeight: 1.4, maxHeight: '80px', overflowY: 'auto' }}>
                  {previewAsset.refinedPrompt}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSketchToDelete(previewAsset)}
                className="btn-tavern btn-danger"
                style={{ fontSize: '11px', backgroundColor: '#7f1d1d', borderColor: '#b91c1c' }}
              >
                <Trash2 size={14} />
                Excluir Asset
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
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
        </div>
      )}

      {/* Confirmation Modal to Delete Sketch */}
      {sketchToDelete && (
        <div className="tavern-modal-backdrop" onClick={() => setSketchToDelete(null)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
              Excluir Rascunho?
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--ink-dark)', lineHeight: 1.5, marginBottom: '16px' }}>
              Tem certeza que deseja apagar o rascunho de <strong>"{sketchToDelete.prompt}"</strong>? Esta ação liberará <strong>1 slot de asset</strong> no estúdio.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setSketchToDelete(null)}
                className="btn-tavern btn-secondary"
                style={{ flex: 1, color: '#fef08a', backgroundColor: '#2a180b' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-tavern btn-danger"
                style={{ flex: 1, backgroundColor: '#dc2626' }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aberto de Validação & Confirmação Antes da Execução */}
      {isConfirmModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsConfirmModalOpen(false)}>
          <div
            className="tavern-modal-content parchment-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '680px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1.5px solid #ccb993', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="var(--amber-deep)" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink-dark)' }}>
                  Revisão & Autorização do Rascunho
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-light)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: Entendimento do Pedido */}
            <div style={{
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              borderLeft: '4px solid var(--amber-torch)',
              padding: '12px 14px',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--amber-deep)', textTransform: 'uppercase', marginBottom: '4px' }}>
                <Sparkles size={13} color="var(--amber-torch)" />
                Interpretação do Pedido pelo Motor Artístico
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-dark)', margin: 0, lineHeight: 1.45 }}>
                {interpretedSummary}
              </p>
            </div>

            {/* Section 2: Prompt Editável Aberto */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="var(--amber-deep)" />
                  Prompt Artístico Refinado (Aberto para sua Edição):
                </label>
                <span style={{ fontSize: '11px', color: 'var(--ink-light)' }}>
                  Edite livremente antes de autorizar
                </span>
              </div>

              <textarea
                rows={5}
                value={editablePrompt}
                onChange={e => {
                  const val = e.target.value;
                  setEditablePrompt(val);
                  setPreviewCost(calculateSketchCost(GEMINI_SKETCH_MODEL, val, '1K'));
                }}
                className="tavern-input font-lore"
                style={{
                  fontSize: '13px',
                  lineHeight: 1.45,
                  padding: '10px 12px',
                  backgroundColor: '#fffdfa',
                  border: '1.5px solid #b4976c',
                  borderRadius: '6px'
                }}
              />

              {/* Botões Rápidos de Refinamento */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const addition = ' Adicionar marcas sutis de batalha, ranhuras de desgaste metálico e pátina envelhecida pelo tempo.';
                    const updated = editablePrompt + addition;
                    setEditablePrompt(updated);
                    setPreviewCost(calculateSketchCost(GEMINI_SKETCH_MODEL, updated, '1K'));
                  }}
                  className="btn-tavern"
                  style={{ fontSize: '10px', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid #ccb993' }}
                >
                  + Marcas de Batalha & Desgaste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const addition = ' Enfatizar sombreamento denso por hachuras cruzadas e contraste dramático de iluminação.';
                    const updated = editablePrompt + addition;
                    setEditablePrompt(updated);
                    setPreviewCost(calculateSketchCost(GEMINI_SKETCH_MODEL, updated, '1K'));
                  }}
                  className="btn-tavern"
                  style={{ fontSize: '10px', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid #ccb993' }}
                >
                  + Hachuras Densas & Contraste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const addition = ' Adicionar entalhes intrincados de runas arcanas misteriosas ao longo das bordas do pergaminho.';
                    const updated = editablePrompt + addition;
                    setEditablePrompt(updated);
                    setPreviewCost(calculateSketchCost(GEMINI_SKETCH_MODEL, updated, '1K'));
                  }}
                  className="btn-tavern"
                  style={{ fontSize: '10px', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid #ccb993' }}
                >
                  + Runas Arcanas no Fundo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const original = buildSketchPrompt(prompt.trim(), category);
                    setEditablePrompt(original);
                    setPreviewCost(calculateSketchCost(GEMINI_SKETCH_MODEL, original, '1K'));
                  }}
                  className="btn-tavern"
                  style={{ fontSize: '10px', padding: '4px 8px', backgroundColor: '#fef3c7', border: '1px solid #d97706', color: '#92400e' }}
                >
                  🔄 Restaurar Padrão
                </button>
              </div>
            </div>

            {/* Section 3: Estimativa de Consumo Prévia */}
            {previewCost && (
              <div style={{
                backgroundColor: 'rgba(26, 16, 8, 0.85)',
                border: '1.5px solid var(--amber-torch)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
                color: '#fef3c7'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#facc15', textTransform: 'uppercase' }}>
                    <Calculator size={14} color="#facc15" />
                    Estimativa Prévia de Recursos
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    Modelo: {previewCost.model}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Tokens do Prompt</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fef08a' }}>
                      ~{previewCost.promptTokens}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Tokens de Imagem</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fef08a' }}>
                      ~{previewCost.outputTokens}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Total Previsto</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                      ~{previewCost.totalTokens} tokens
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '8px 10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Custo Estimado</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                      ${previewCost.estimatedCostUsd.toFixed(4)} USD
                    </div>
                    <div style={{ fontSize: '9px', color: '#6ee7b7' }}>
                      (~R$ {previewCost.estimatedCostBrl.toFixed(2)} BRL)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn-tavern btn-secondary"
                style={{ color: '#fef08a', backgroundColor: '#2a180b', borderColor: '#78350f', minHeight: '40px', padding: '8px 16px' }}
              >
                Voltar / Ajustar Ideia
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmed}
                className="btn-tavern btn-primary"
                style={{
                  minHeight: '40px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Wand2 size={16} />
                Autorizar e Gerar Imagem com IA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
