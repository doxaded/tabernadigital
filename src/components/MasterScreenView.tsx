import React, { useState, useEffect, useRef } from 'react';
import {
  Scroll,
  BookOpen,
  Sparkles,
  Shield,
  Zap,
  Sword,
  Search,
  RotateCcw,
  Plus,
  Send,
  X,
  Eye,
  FileText,
  BookmarkPlus,
  ArrowLeft,
  ChevronRight,
  Flame,
  AlertTriangle,
  Compass,
  Layers,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { marked } from 'marked';
import { Campaign, CharacterSheet, CompendiumDoc, LoreEntry, MasterChatMessage, UserProfile } from '../types';
import { masterOracleService, CompendiumData, cleanLookupText } from '../services/masterOracleService';

interface MasterScreenViewProps {
  campaign: Campaign;
  currentUser: UserProfile;
  onBackToCampaign: () => void;
  onAddLore: (campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>) => void;
}

export const MasterScreenView: React.FC<MasterScreenViewProps> = ({
  campaign,
  currentUser,
  onBackToCampaign,
  onAddLore,
}) => {
  // Verificação Restrita de Segurança: Apenas o Mestre Criador da Sala (ou Admin) pode acessar
  const isMaster = campaign.masterId === currentUser.uid || currentUser.role === 'admin';

  // Estados do Compêndio e Catálogo
  const [compendium, setCompendium] = useState<CompendiumData | null>(null);
  const [imageCatalog, setImageCatalog] = useState<Record<string, string>>({});
  const [isLoadingCompendium, setIsLoadingCompendium] = useState(true);

  // Estados do Chat do Oráculo do Mestre
  const [messages, setMessages] = useState<MasterChatMessage[]>([
    {
      id: 'welcome-master',
      sender: 'oracle',
      text: `### 📜 Mesa de Pergaminhos Aberta, Mestre ${campaign.masterName}!\n\nEste é o seu escudo sagrado e oráculo particular de regras para a campanha **"${campaign.name}"**.\n\nVocê possui acesso irrestrito ao acervo oficial do **D&D 2024 (SRD 5.2)** com **339 monstros**, **326 magias**, **12 classes**, regras de combate e ao contexto narrativo e fichas dos heróis da sua sala.\n\n*Utilize a barra de dados no topo para rolagens rápidas ou a bandeja 3D física. Qualquer ideia de lore ou encontro gerada pode ser gravada diretamente nos pergaminhos da sua sala pelo botão "Salvar na Campanha".*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Painel Lateral Ativo: 'context' (Ideias & Fichas da Sala) | 'compendium' (Catálogos D&D 2024)
  const [sidebarTab, setSidebarTab] = useState<'context' | 'compendium'>('context');

  // Estados de Visualização de Fontes e Itens
  const [viewingSourceDoc, setViewingSourceDoc] = useState<CompendiumDoc | null>(null);
  const [savedSuccessToast, setSavedSuccessToast] = useState('');

  // Estados dos Dados e Arena 3D
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [trayDice, setTrayDice] = useState<number[]>([20]);
  const [trayModifier, setTrayModifier] = useState<number>(0);
  const [diceRollResult, setDiceRollResult] = useState<{
    expression: string;
    rolls: number[];
    modifier: number;
    total: number;
    hasNat20: boolean;
    hasNat1: boolean;
  } | null>(null);
  const [customDiceStr, setCustomDiceStr] = useState('1d20 + 3');
  const [activeQuickDice, setActiveQuickDice] = useState<number>(20);
  const [viewingSheet, setViewingSheet] = useState<CharacterSheet | null>(null);

  // Inicializa Compêndio Oficial D&D 2024 e Imagens
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      setIsLoadingCompendium(true);
      const [compData, imgCat] = await Promise.all([
        masterOracleService.loadCompendium(),
        masterOracleService.loadImageCatalog()
      ]);
      if (isMounted) {
        if (compData) setCompendium(compData);
        if (imgCat) setImageCatalog(imgCat);
        setIsLoadingCompendium(false);
      }
    }
    initData();
    return () => { isMounted = false; };
  }, []);

  // Rola automaticamente para o fim da conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnswering]);

  // Inicializa o motor de física 3D quando o modal for aberto
  useEffect(() => {
    if (isDiceModalOpen) {
      const timer = setTimeout(() => {
        const canvas = document.getElementById('masterDiceCanvas') as HTMLCanvasElement;
        const w = window as any;
        if (canvas && w.DicePhysicsEngine) {
          try {
            if (!w.masterDiceEngineInstance) {
              w.masterDiceEngineInstance = new w.DicePhysicsEngine(canvas);
            } else {
              w.masterDiceEngineInstance.handleResize();
            }
          } catch (e) {
            console.warn('Erro ao inicializar DicePhysicsEngine:', e);
          }
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isDiceModalOpen]);

  // Bloqueio de Acesso para não-mestres
  if (!isMaster) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="parchment-card" style={{ padding: '40px 24px', border: '2px solid var(--amber-torch)' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>
            Acesso Restrito ao Mestre da Sala
          </h2>
          <p className="font-lore" style={{ fontSize: '15px', color: 'var(--ink-dark)', lineHeight: 1.5, marginBottom: '20px' }}>
            A "Mesa de Pergaminhos" guarda os segredos, monstros e ideias narrativas do Mestre de Jogo. Apenas o criador de <strong>"{campaign.name}"</strong> pode quebrar o selo deste ambiente.
          </p>
          <button onClick={onBackToCampaign} className="btn-tavern btn-primary" style={{ padding: '10px 24px' }}>
            <ArrowLeft size={16} /> Voltar à Sala
          </button>
        </div>
      </div>
    );
  }

  // Envio de Pergunta para o Oráculo
  const handleSendPrompt = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isAnswering) return;

    // Detecta comando de dados `/roll` ou `/dado`
    if (q.startsWith('/roll ') || q.startsWith('/dado ')) {
      const expr = q.split(' ', 2)[1] || '1d20';
      const rollRes = masterOracleService.rollDice(expr);
      const userMsg: MasterChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const diceMsg: MasterChatMessage = {
        id: `dice-${Date.now()}`,
        sender: 'oracle',
        text: `🎲 **Rolagem na Mesa:** \`${rollRes.expression}\`\n\n- **Dados:** [${rollRes.rolls.join(', ')}]\n- **Modificador:** ${rollRes.modifier >= 0 ? '+' : ''}${rollRes.modifier}\n\n### 🏆 Total: **${rollRes.total}**${rollRes.hasNat20 ? ' — 🌟 **ACERTO CRÍTICO!**' : ''}${rollRes.hasNat1 ? ' — 💀 **FALHA CRÍTICA!**' : ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diceResult: rollRes
      };
      setMessages(prev => [...prev, userMsg, diceMsg]);
      setInputQuery('');
      setDiceRollResult(rollRes);
      return;
    }

    const userMsg: MasterChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsAnswering(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.text
      }));

      const res = await masterOracleService.askMasterOracle(q, history, campaign, compendium);
      const oracleMsg: MasterChatMessage = {
        id: `oracle-${Date.now()}`,
        sender: 'oracle',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources
      };
      setMessages(prev => [...prev, oracleMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `oracle-err-${Date.now()}`,
          sender: 'oracle',
          text: `*O Oráculo tosse e a fumaça da lareira falha:* "${err?.message || 'Erro ao processar a pergunta com o acervo oficial.'}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  // Rolador Rápido de Dado na Barra Superior
  const handleQuickRoll = (sides: number) => {
    setActiveQuickDice(sides);
    const rollRes = masterOracleService.rollDice(`1d${sides}`);
    setDiceRollResult(rollRes);
    const diceMsg: MasterChatMessage = {
      id: `dice-${Date.now()}`,
      sender: 'oracle',
      text: `🎲 **Rolagem Rápida:** \`1d${sides}\` ➔ **${rollRes.total}** ${rollRes.hasNat20 ? '🌟 (Nat 20!)' : ''}${rollRes.hasNat1 ? '💀 (Nat 1!)' : ''}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      diceResult: rollRes
    };
    setMessages(prev => [...prev, diceMsg]);
  };

  // Disparo da Física 3D na Bandeja
  const handleTrigger3dPhysics = () => {
    const w = window as any;
    const engine = w.masterDiceEngineInstance;
    if (!engine) {
      // Fallback matemático se Three.js não estiver carregado
      const expr = trayDice.map(s => `1d${s}`).join('+') + (trayModifier !== 0 ? `${trayModifier >= 0 ? '+' : ''}${trayModifier}` : '');
      const rollRes = masterOracleService.rollDice(expr);
      setDiceRollResult(rollRes);
      return;
    }

    const dicePlan = trayDice.map(sides => ({
      sides,
      value: Math.floor(Math.random() * sides) + 1
    }));

    engine.roll(dicePlan, (settledDice: any[]) => {
      let sum = 0;
      let hasNat20 = false;
      let hasNat1 = false;
      const rolls: number[] = [];

      settledDice.forEach(d => {
        sum += d.targetVal;
        rolls.push(d.targetVal);
        if (d.sides === 20) {
          if (d.targetVal === 20) hasNat20 = true;
          if (d.targetVal === 1) hasNat1 = true;
        }
      });

      const total = sum + trayModifier;
      const rollRes = {
        expression: trayDice.map(s => `1d${s}`).join(' + ') + (trayModifier !== 0 ? ` ${trayModifier >= 0 ? '+' : '-'} ${Math.abs(trayModifier)}` : ''),
        rolls,
        modifier: trayModifier,
        total,
        hasNat20,
        hasNat1: hasNat1 && !hasNat20
      };
      setDiceRollResult(rollRes);
    });
  };

  // Salva uma ideia ou monstro gerado diretamente no Lore da Campanha
  const handleSaveToCampaignLore = (textToSave: string, title?: string) => {
    const cleanTitle = title || `Anotação do Mestre: ${new Date().toLocaleDateString()}`;
    onAddLore(campaign.id, {
      title: cleanTitle,
      category: 'diario',
      content: textToSave,
      author: `Mestre ${campaign.masterName} (Oráculo)`,
      tags: ['Mesa de Pergaminhos', 'Ideia do Mestre', 'D&D 2024']
    });
    setSavedSuccessToast(`📜 "${cleanTitle}" gravado com sucesso no Lore da Campanha!`);
    setTimeout(() => setSavedSuccessToast(''), 4500);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* Top Banner & Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        borderBottom: '2px solid var(--wood-border)',
        paddingBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onBackToCampaign}
            className="btn-tavern btn-secondary"
            style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}
          >
            <ArrowLeft size={15} />
            <span>Voltar à Sala: {campaign.name}</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#fef3c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scroll size={22} color="var(--amber-torch)" />
                Mesa de Pergaminhos
              </h2>
              <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
                Exclusivo do Mestre
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0 0' }}>
              Oráculo de regras oficiais do D&D 2024, rolador de dados e co-piloto da campanha <strong>"{campaign.name}"</strong>
            </p>
          </div>
        </div>

        {/* Status Indicators & 3D Dice Modal Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            color: '#fef08a',
            backgroundColor: 'rgba(217, 119, 6, 0.15)',
            border: '1px solid var(--amber-deep)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: 700
          }}>
            📚 {compendium ? compendium.totalDocs : 785} Docs D&D 2024 (339 🐉 | 326 🔮)
          </span>

          <button
            type="button"
            onClick={() => setIsDiceModalOpen(true)}
            className="btn-tavern"
            style={{
              fontSize: '12px',
              padding: '7px 14px',
              backgroundColor: '#92400e',
              borderColor: '#f59e0b',
              color: '#fef08a',
              boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)',
              gap: '6px',
              fontWeight: 800
            }}
          >
            🎲 Bandeja de Dados 3D
          </button>
        </div>
      </div>

      {/* Quick Dice Roller Bar */}
      <div style={{
        backgroundColor: 'rgba(25, 15, 7, 0.95)',
        border: '1.5px solid var(--wood-border)',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--amber-torch)', textTransform: 'uppercase' }}>
            Dados Rápidos:
          </span>
          {[4, 6, 8, 10, 12, 20, 100].map(sides => (
            <button
              key={sides}
              type="button"
              onClick={() => handleQuickRoll(sides)}
              className="btn-tavern"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                minWidth: '42px',
                backgroundColor: sides === activeQuickDice ? '#78350f' : 'var(--wood-medium)',
                borderColor: sides === activeQuickDice ? 'var(--amber-torch)' : 'var(--wood-border)',
                color: '#fef3c7',
                fontWeight: 700
              }}
            >
              d{sides}
            </button>
          ))}
        </div>

        {/* Custom roll mini form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="text"
            value={customDiceStr}
            onChange={e => setCustomDiceStr(e.target.value)}
            placeholder="Ex: 2d6+3, 1d20+7"
            className="tavern-input"
            style={{ width: '130px', padding: '5px 8px', fontSize: '12px' }}
          />
          <button
            type="button"
            onClick={() => handleSendPrompt(`/roll ${customDiceStr}`)}
            className="btn-tavern btn-primary"
            style={{ fontSize: '11px', padding: '5px 12px' }}
          >
            Rolar
          </button>
        </div>

        {/* Quick Result Pill */}
        {diceRollResult && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: diceRollResult.hasNat20 ? 'rgba(16, 185, 129, 0.25)' : diceRollResult.hasNat1 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.2)',
            border: `1px solid ${diceRollResult.hasNat20 ? '#10b981' : diceRollResult.hasNat1 ? '#ef4444' : '#d97706'}`,
            borderRadius: '6px',
            padding: '4px 12px',
            fontSize: '12px',
            color: '#fef3c7'
          }}>
            <span>Última Rolagem: <strong>{diceRollResult.expression}</strong> = <strong style={{ fontSize: '14px', color: '#fbbf24' }}>{diceRollResult.total}</strong></span>
            {diceRollResult.hasNat20 && <span style={{ color: '#34d399', fontWeight: 900 }}>🌟 Nat 20!</span>}
            {diceRollResult.hasNat1 && <span style={{ color: '#f87171', fontWeight: 900 }}>💀 Nat 1!</span>}
          </div>
        )}
      </div>

      {/* Main Workspace: Left Panel (Story Context & Compendium) + Center (Master Oracle Chat) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '18px', alignItems: 'start' }}>
        {/* Left Sidebar Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Tabs Switcher: Contexto da História vs Compêndio D&D 2024 */}
          <div style={{ display: 'flex', backgroundColor: 'var(--wood-dark)', borderRadius: '8px', padding: '4px', border: '1px solid var(--wood-border)' }}>
            <button
              type="button"
              onClick={() => setSidebarTab('context')}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: sidebarTab === 'context' ? 'var(--amber-torch)' : 'transparent',
                color: sidebarTab === 'context' ? '#fff' : '#cbd5e1',
                transition: 'all 0.2s'
              }}
            >
              📖 Contexto da Sala
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('compendium')}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: sidebarTab === 'compendium' ? 'var(--amber-torch)' : 'transparent',
                color: sidebarTab === 'compendium' ? '#fff' : '#cbd5e1',
                transition: 'all 0.2s'
              }}
            >
              🐉 Acervo D&D 2024
            </button>
          </div>

          {/* TAB 1: Contexto da Sala & Fichas Ativas */}
          {sidebarTab === 'context' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Campaign Info Card */}
              <div className="parchment-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--amber-deep)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Campanha Selecionada
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: 'var(--ink-dark)' }}>
                  {campaign.name}
                </h3>
                <p className="font-lore" style={{ fontSize: '13px', color: 'var(--ink-medium)', margin: 0, lineHeight: 1.4 }}>
                  {campaign.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              {/* Quick Story Hooks Prompts Generator */}
              <div style={{ backgroundColor: 'var(--wood-dark)', border: '1px solid var(--wood-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#facc15" />
                  Geradores Rápidos de História
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt(`Como Mestre de Jogo para a campanha "${campaign.name}", crie um encontro de combate equilibrado para os personagens da mesa, incluindo terreno, tática do monstro e gancho dramático.`)}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#fef08a' }}
                  >
                    ⚔️ Gerar Encontro Adaptado à Mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt(`Crie um NPC misterioso que chega à taverna com um segredo e um pedido de ajuda urgente relacionado aos rumores da campanha "${campaign.name}".`)}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#fef08a' }}
                  >
                    🎭 Criar NPC com Motivo Oculto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt(`Gere 3 boatos intrigantes e sussurrados de taverna para a crônica "${campaign.name}", sendo dois verdadeiros e um falso.`)}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#fef08a' }}
                  >
                    🍺 3 Rumores para a Taverna
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt(`Proponha um enigma ou armadilha ambiental para catacumbas no D&D 2024 com 3 pistas e teste de perícia correspondente.`)}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#fef08a' }}
                  >
                    🗝️ Propor Enigma ou Armadilha
                  </button>
                </div>
              </div>

              {/* Active Heroes Sheets Overview */}
              <div style={{ backgroundColor: 'var(--wood-dark)', border: '1px solid var(--wood-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Heróis na Mesa ({campaign.sheets.length})</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Fichas Ativas</span>
                </div>

                {campaign.sheets.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                    Nenhuma ficha cadastrada ainda nesta sala.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                    {campaign.sheets.map(sheet => (
                      <div
                        key={sheet.id}
                        onClick={() => setViewingSheet(sheet)}
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--wood-border)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                        title="Clique para ver a ficha completa"
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fef3c7' }}>
                            {sheet.name} {sheet.isNpc && <span style={{ fontSize: '9px', color: '#f59e0b' }}>(NPC)</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {sheet.race} {sheet.class} Nv.{sheet.level}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px' }}>
                          <span style={{ color: '#34d399', fontWeight: 700 }}>PV {sheet.hp}/{sheet.maxHp}</span>
                          <span style={{ color: '#38bdf8', marginLeft: '6px' }}>CA {sheet.armorClass}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Compêndio & Catálogos D&D 2024 */}
          {sidebarTab === 'compendium' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--wood-dark)', border: '1px solid var(--wood-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Catálogos com Tabela Dinâmica
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Liste os monstros existentes organizados por Nível de Desafio (ND)')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '7px 10px', color: '#fef08a', borderColor: '#d97706' }}
                  >
                    🐉 <strong>Bestiário: 339 Monstros</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Liste as magias existentes organizadas por círculo e escola')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '7px 10px', color: '#fef08a', borderColor: '#9333ea' }}
                  >
                    🔮 <strong>Grimório: 326 Magias</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Quais são as 12 classes e subclasses oficiais do D&D 2024?')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '7px 10px', color: '#fef08a' }}
                  >
                    ⚔️ <strong>12 Classes & Subclasses</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Liste as ferramentas (tools) e kits de artesão do D&D 2024 em uma tabela com habilidades e utilidade')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '7px 10px', color: '#fef08a' }}
                  >
                    🧰 <strong>Ferramentas & Kits</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Liste as armas simples e marciais do D&D 2024 em uma tabela com dano, propriedades e custo')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '7px 10px', color: '#fef08a' }}
                  >
                    🗡️ <strong>Armas & Equipamentos</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Liste todos os tipos de dano e condições do D&D 2024 em uma tabela com descrições')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '7px 10px', color: '#fef08a' }}
                  >
                    ⚡ <strong>Tipos de Dano & Condições</strong>
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--wood-dark)', border: '1px solid var(--wood-border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Consultas Rápidas de Regras
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Como funciona a condição Caído (Prone) no combate do D&D 2024?')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#cbd5e1' }}
                  >
                    🛡️ Condição: Caído (Prone)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Como funciona 0 PV, Testes de Morte e Morte Instantânea no D&D 2024?')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#cbd5e1' }}
                  >
                    💀 0 PV e Testes de Morte
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Como funciona o Descanso Curto e Descanso Longo no D&D 2024?')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#cbd5e1' }}
                  >
                    ⛺ Regras de Descanso
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendPrompt('Como funciona a magia Bola de Fogo (Fireball) e dano em área?')}
                    className="btn-tavern btn-secondary"
                    style={{ fontSize: '11px', textAlign: 'left', padding: '6px 10px', color: '#cbd5e1' }}
                  >
                    🔥 Magia: Bola de Fogo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel: Master Oracle Chat Stream */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '75vh',
          backgroundColor: 'var(--wood-dark)',
          border: '1.5px solid var(--wood-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)'
        }}>
          {/* Chat Stream Header */}
          <div style={{
            padding: '12px 18px',
            backgroundColor: '#2a180b',
            borderBottom: '1.5px solid var(--wood-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef3c7', fontFamily: 'var(--font-cinzel)' }}>
                Oráculo da Mesa de Pergaminhos
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja limpar a conversa da mesa?')) {
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'oracle',
                      text: `*Os pergaminhos foram recolhidos e a mesa está limpa para novas consultas, Mestre ${campaign.masterName}.*`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
            >
              🗑️ Limpar Conversa
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.sender === 'user' ? '80%' : '98%',
                  backgroundColor: msg.sender === 'user' ? '#78350f' : 'rgba(25, 15, 7, 0.95)',
                  border: msg.sender === 'user' ? '1px solid var(--amber-torch)' : '1px solid var(--wood-border)',
                  borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '14px 18px',
                  color: msg.sender === 'user' ? '#fff' : '#f8fafc',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: msg.sender === 'user' ? '#fde047' : 'var(--amber-torch)', textTransform: 'uppercase' }}>
                    {msg.sender === 'user' ? `Mestre ${campaign.masterName}` : 'Oráculo D&D 2024'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Render do Conteúdo em Markdown com Suporte à Tabela Dinâmica Interativa */}
                <DynamicMarkdownViewer
                  rawMarkdown={msg.text}
                  imageCatalog={imageCatalog}
                  onConsultItem={(itemName) => handleSendPrompt(`Quais são os atributos, ficha oficial e regras de "${itemName}" no D&D 2024?`)}
                />

                {/* Fontes Oficiais Recuperadas */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>🔍 Fontes D&D 2024:</span>
                    {msg.sources.map((src, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          if (compendium) {
                            const found = compendium.docs.find(d => d.path === src.path || d.title === src.title);
                            if (found) setViewingSourceDoc(found);
                          }
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(217, 119, 6, 0.15)',
                          border: '1px solid var(--amber-deep)',
                          color: '#fef08a',
                          cursor: 'pointer'
                        }}
                      >
                        📄 {src.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Botão de Salvar Ideia/Encontro no Lore da Campanha */}
                {msg.sender === 'oracle' && (
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveToCampaignLore(msg.text)}
                      className="btn-tavern"
                      style={{ fontSize: '11px', padding: '4px 10px', color: '#fef08a', borderColor: '#d97706', gap: '4px' }}
                      title="Salvar esta sugestão ou regra diretamente nos Pergaminhos da Sala"
                    >
                      <BookmarkPlus size={13} color="#f59e0b" />
                      Salvar no Lore da Sala
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isAnswering && (
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(25, 15, 7, 0.9)',
                border: '1px solid var(--wood-border)',
                borderRadius: '12px 12px 12px 2px',
                padding: '12px 16px',
                color: '#fef08a',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Flame size={16} color="var(--amber-torch)" className="animate-spin" />
                <span>O Oráculo consulta o acervo oficial de regras e pondera...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Toast de Confirmação de Lore Salvo */}
          {savedSuccessToast && (
            <div style={{
              backgroundColor: '#064e3b',
              color: '#a7f3d0',
              borderTop: '1px solid #059669',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Check size={14} />
              {savedSuccessToast}
            </div>
          )}

          {/* Input Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            style={{
              padding: '12px 16px',
              backgroundColor: '#2a180b',
              borderTop: '1.5px solid var(--wood-border)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Pergunte sobre qualquer regra, monstro, magia ou peça ideias para a campanha (ou /roll 1d20+5)..."
              className="tavern-input font-lore"
              style={{ fontSize: '13.5px', padding: '10px 14px', flex: 1 }}
            />
            <button
              type="submit"
              disabled={isAnswering || !inputQuery.trim()}
              className="btn-tavern btn-primary"
              style={{ padding: '10px 18px', gap: '6px', fontSize: '13px' }}
            >
              <Send size={15} />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal 3D Dice Physics Arena (Bandeja de Rolagem Física 3D) */}
      {isDiceModalOpen && (
        <div className="dice-modal-overlay" onClick={() => setIsDiceModalOpen(false)}>
          <div className="dice-modal-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="dice-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🎲</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#fef3c7', fontFamily: 'var(--font-cinzel)' }}>
                    Bandeja de Rolagem Física 3D
                  </h3>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    Física de dados em tempo real para a mesa de "{campaign.name}"
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiceModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Canvas 3D Arena */}
            <div className="dice-arena-container">
              <canvas id="masterDiceCanvas" />
              {diceRollResult?.hasNat20 && (
                <div className="dice-crit-banner crit-success">
                  🌟 ACERTO CRÍTICO! (Nat 20)
                </div>
              )}
              {diceRollResult?.hasNat1 && (
                <div className="dice-crit-banner crit-fail">
                  💀 FALHA CRÍTICA! (Nat 1)
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="dice-modal-controls">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                  Adicionar Dados à Bandeja:
                </div>
                <div className="tray-dice-buttons">
                  {[4, 6, 8, 10, 12, 20, 100].map(sides => (
                    <button
                      key={sides}
                      type="button"
                      onClick={() => setTrayDice(prev => prev.length < 12 ? [...prev, sides] : prev)}
                      className={`tray-btn ${sides === 20 ? 'tray-d20' : ''}`}
                    >
                      + d{sides}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTrayDice([20]);
                      setTrayModifier(0);
                      setDiceRollResult(null);
                    }}
                    className="tray-btn tray-clear"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Action and Modifier Bar */}
              <div className="dice-tray-action-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Fórmula:</span>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#fef08a', fontFamily: 'monospace' }}>
                    {trayDice.length === 0 ? 'Vazio' : trayDice.map(s => `1d${s}`).join(' + ') + (trayModifier !== 0 ? ` ${trayModifier >= 0 ? '+' : '-'} ${Math.abs(trayModifier)}` : '')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#cbd5e1' }}>Mod:</label>
                  <input
                    type="number"
                    value={trayModifier}
                    onChange={e => setTrayModifier(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '60px', padding: '4px', textAlign: 'center', backgroundColor: '#0e0804', border: '1px solid var(--wood-border)', color: '#fff', borderRadius: '4px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTrigger3dPhysics}
                  className="btn-roll-physics"
                >
                  ⚡ Rolar Dados Físicos
                </button>
              </div>

              {/* Results Breakdown */}
              {diceRollResult && (
                <div className="dice-result-panel">
                  <div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '2px' }}>
                      Dados Sorteados: [{diceRollResult.rolls.join(', ')}] {diceRollResult.modifier !== 0 ? `(Mod: ${diceRollResult.modifier >= 0 ? '+' : ''}${diceRollResult.modifier})` : ''}
                    </div>
                    <div className="result-total-badge">
                      Total: {diceRollResult.total}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const msgText = `🎲 **Resultado da Bandeja 3D:** \`${diceRollResult.expression}\` ➔ Total: **${diceRollResult.total}** [${diceRollResult.rolls.join(', ')}] ${diceRollResult.hasNat20 ? '🌟 (Nat 20!)' : ''}${diceRollResult.hasNat1 ? '💀 (Nat 1!)' : ''}`;
                      setMessages(prev => [
                        ...prev,
                        {
                          id: `tray-${Date.now()}`,
                          sender: 'oracle',
                          text: msgText,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          diceResult: diceRollResult
                        }
                      ]);
                      setIsDiceModalOpen(false);
                    }}
                    className="btn-insert-chat"
                  >
                    💬 Inserir Resultado na Conversa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Ficha de Herói */}
      {viewingSheet && (
        <div className="tavern-modal-backdrop" onClick={() => setViewingSheet(null)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1.5px solid var(--parchment-dark)', paddingBottom: '8px' }}>
              <div>
                <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
                  Ficha de Herói {viewingSheet.isNpc ? '(NPC)' : ''}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0', color: 'var(--ink-dark)' }}>
                  {viewingSheet.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSheet(null)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-light)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {viewingSheet.avatarUrl && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <img src={viewingSheet.avatarUrl} alt={viewingSheet.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--amber-torch)' }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', color: 'var(--ink-dark)' }}>
              <div><strong>Jogador:</strong> {viewingSheet.player}</div>
              <div><strong>Raça:</strong> {viewingSheet.race}</div>
              <div><strong>Classe:</strong> {viewingSheet.class}</div>
              <div><strong>Nível:</strong> {viewingSheet.level}</div>
              <div><strong>PV:</strong> {viewingSheet.hp} / {viewingSheet.maxHp}</div>
              <div><strong>PM:</strong> {viewingSheet.mp} / {viewingSheet.maxMp}</div>
              <div><strong>CA:</strong> {viewingSheet.armorClass}</div>
              {viewingSheet.stats && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--wood-border)' }}><strong>FOR:</strong> {viewingSheet.stats.strength}</div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--wood-border)' }}><strong>DES:</strong> {viewingSheet.stats.dexterity}</div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--wood-border)' }}><strong>CON:</strong> {viewingSheet.stats.constitution}</div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--wood-border)' }}><strong>INT:</strong> {viewingSheet.stats.intelligence}</div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--wood-border)' }}><strong>SAB:</strong> {viewingSheet.stats.wisdom}</div>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--wood-border)' }}><strong>CAR:</strong> {viewingSheet.stats.charisma}</div>
                </div>
              )}
              {viewingSheet.traits && viewingSheet.traits.length > 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <strong>Traços & Habilidades:</strong>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                    {viewingSheet.traits.map((t, idx) => <li key={idx}>{t}</li>)}
                  </ul>
                </div>
              )}
              {viewingSheet.equipment && viewingSheet.equipment.length > 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <strong>Equipamentos:</strong>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                    {viewingSheet.equipment.map((e, idx) => <li key={idx}>{e}</li>)}
                  </ul>
                </div>
              )}
              {viewingSheet.notes && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <strong>Anotações:</strong>
                  <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{viewingSheet.notes}</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingSheet(null)}
                className="btn-tavern btn-secondary"
                style={{ fontSize: '12px', color: '#fef08a', backgroundColor: '#2a180b' }}
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fonte Oficial Original do Compêndio */}
      {viewingSourceDoc && (
        <div className="tavern-modal-backdrop" onClick={() => setViewingSourceDoc(null)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1.5px solid var(--parchment-dark)', paddingBottom: '8px' }}>
              <div>
                <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
                  {viewingSourceDoc.category}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0', color: 'var(--ink-dark)' }}>
                  {viewingSourceDoc.title} {viewingSourceDoc.title_en && <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--ink-light)' }}>({viewingSourceDoc.title_en})</span>}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSourceDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-light)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {viewingSourceDoc.image && (
              <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                <img
                  src={viewingSourceDoc.image}
                  alt={viewingSourceDoc.title}
                  style={{ maxHeight: '220px', borderRadius: '8px', border: '2px solid var(--parchment-dark)' }}
                />
              </div>
            )}

            <div
              className="font-lore"
              style={{ fontSize: '14px', color: 'var(--ink-dark)', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: marked.parse(viewingSourceDoc.content) as string }}
            />

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  handleSendPrompt(`Quais são as táticas, mecânicas e uso prático de "${viewingSourceDoc.title}" no D&D 2024?`);
                  setViewingSourceDoc(null);
                }}
                className="btn-tavern btn-primary"
                style={{ fontSize: '12px' }}
              >
                🔮 Consultar Oráculo Sobre Isto
              </button>
              <button
                type="button"
                onClick={() => setViewingSourceDoc(null)}
                className="btn-tavern btn-secondary"
                style={{ fontSize: '12px', color: '#fef08a', backgroundColor: '#2a180b' }}
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

// Componente Especializado para Renderização Dinâmica de Markdown e Tabelas Interativas (REGRA MANDATÓRIA 2)
interface DynamicMarkdownViewerProps {
  rawMarkdown: string;
  imageCatalog: Record<string, string>;
  onConsultItem: (itemName: string) => void;
}

const DynamicMarkdownViewer: React.FC<DynamicMarkdownViewerProps> = ({
  rawMarkdown,
  imageCatalog,
  onConsultItem,
}) => {
  // Verifica se a mensagem contém tabela Markdown (ex: `| Nome | ... |`)
  const hasMarkdownTable = /\|.+\|[\r\n]+\|[\s:\-]+\|[\r\n]+(\|.+\|[\r\n]*)+/.test(rawMarkdown);

  if (!hasMarkdownTable) {
    return (
      <div
        className="font-lore"
        style={{ fontSize: '14px', lineHeight: 1.55 }}
        dangerouslySetInnerHTML={{ __html: marked.parse(rawMarkdown) as string }}
      />
    );
  }

  // Se possui tabelas, divide os blocos de texto e tabelas para transformar cada tabela no DynamicTableWidget
  const lines = rawMarkdown.split('\n');
  const blocks: Array<{ type: 'text' | 'table'; content: string }> = [];
  let currentType: 'text' | 'table' = 'text';
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

    if (isTableLine) {
      if (currentType === 'text') {
        if (buffer.length > 0) {
          blocks.push({ type: 'text', content: buffer.join('\n') });
          buffer = [];
        }
        currentType = 'table';
      }
      buffer.push(line);
    } else {
      if (currentType === 'table') {
        if (buffer.length > 0) {
          blocks.push({ type: 'table', content: buffer.join('\n') });
          buffer = [];
        }
        currentType = 'text';
      }
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    blocks.push({ type: currentType, content: buffer.join('\n') });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'text') {
          return (
            <div
              key={bIdx}
              className="font-lore"
              style={{ fontSize: '14px', lineHeight: 1.55 }}
              dangerouslySetInnerHTML={{ __html: marked.parse(block.content) as string }}
            />
          );
        } else {
          return (
            <InteractiveTableWidget
              key={bIdx}
              tableMarkdown={block.content}
              imageCatalog={imageCatalog}
              onConsultItem={onConsultItem}
            />
          );
        }
      })}
    </div>
  );
};

// Componente da Tabela Dinâmica Interativa com Busca em Tempo Real, Ordenação e Abertura de Ficha (Regra 2)
interface InteractiveTableWidgetProps {
  tableMarkdown: string;
  imageCatalog: Record<string, string>;
  onConsultItem: (itemName: string) => void;
}

const InteractiveTableWidget: React.FC<InteractiveTableWidgetProps> = ({
  tableMarkdown,
  imageCatalog,
  onConsultItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedItemDetail, setSelectedItemDetail] = useState<{
    primaryName: string;
    secondaryName: string;
    cells: string[];
    headers: string[];
    image: string | null;
  } | null>(null);

  // Parse das linhas da tabela
  const rawLines = tableMarkdown.trim().split('\n').filter(l => l.trim().startsWith('|'));
  if (rawLines.length < 2) return null;

  const headerLine = rawLines[0];
  const headers = headerLine.split('|').map(s => s.trim()).filter(Boolean);
  const dataLines = rawLines.slice(2); // Pula cabeçalho e separador `|---|---|`

  const rows = dataLines.map((line, idx) => {
    const cells = line.split('|').map(s => s.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const primaryName = cells[0] || `Item ${idx + 1}`;
    const secondaryName = cells[1] || '';
    const image = masterOracleService.lookupImage(primaryName, secondaryName, imageCatalog);
    return {
      index: idx,
      primaryName,
      secondaryName,
      cells,
      image
    };
  });

  // Filtro de pesquisa
  const filteredRows = rows.filter(r => {
    if (!searchTerm.trim()) return true;
    const term = cleanLookupText(searchTerm);
    return r.cells.some(c => cleanLookupText(c).includes(term));
  });

  // Ordenação
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortCol === null) return 0;
    const valA = a.cells[sortCol] || '';
    const valB = b.cells[sortCol] || '';
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const handleHeaderClick = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  // Se o usuário clicou em um item para abrir o detalhamento integrado
  if (selectedItemDetail) {
    return (
      <div className="dt-detail-view">
        <div className="dt-detail-topbar">
          <button
            type="button"
            onClick={() => setSelectedItemDetail(null)}
            className="dt-btn-back"
          >
            <ArrowLeft size={14} />
            <span>Voltar à lista</span>
          </button>
          <span className="dt-detail-badge">📜 Detalhamento do Item Oficial</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {selectedItemDetail.image && (
            <img
              src={selectedItemDetail.image}
              alt={selectedItemDetail.primaryName}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--amber-torch)' }}
            />
          )}
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: 'var(--ink-dark)' }}>
              {selectedItemDetail.primaryName}
            </h4>
            {selectedItemDetail.secondaryName && (
              <span style={{ fontSize: '12px', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                Nome Original (EN): {selectedItemDetail.secondaryName}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {selectedItemDetail.headers.map((h, hIdx) => {
            const val = selectedItemDetail.cells[hIdx];
            if (!val || hIdx === 0) return null;
            return (
              <div key={hIdx} style={{ backgroundColor: '#fff', border: '1px solid var(--parchment-dark)', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--amber-deep)', textTransform: 'uppercase' }}>
                  {h}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-dark)' }}>
                  {val}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onConsultItem(selectedItemDetail.primaryName)}
            className="btn-tavern btn-primary"
            style={{ fontSize: '11px', padding: '6px 14px' }}
          >
            🔮 Consultar Oráculo Sobre Este Item
          </button>
          <button
            type="button"
            onClick={() => setSelectedItemDetail(null)}
            className="btn-tavern btn-secondary"
            style={{ fontSize: '11px', padding: '6px 12px', color: '#fef08a', backgroundColor: '#2a180b' }}
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-table-widget">
      {/* Toolbar com Barra de Busca e Contador em Tempo Real */}
      <div className="dt-toolbar">
        <div className="dt-search-wrapper">
          <Search size={14} className="dt-search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar nesta lista (nome, tipo, atributos, círculo, ND)..."
            className="dt-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="dt-search-clear"
              title="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>

        <div className="dt-meta-row">
          <span className="dt-count-badge">
            📊 Mostrando <strong>{sortedRows.length}</strong> de {rows.length} itens
          </span>
          <span className="dt-hint-badge">
            💡 Clique em qualquer linha para abrir a ficha completa do item
          </span>
        </div>
      </div>

      {/* Tabela Interativa Rolável */}
      <div className="dt-scroll-container">
        <table className="dt-interactive-table">
          <thead>
            <tr>
              {headers.map((h, colIdx) => (
                <th
                  key={colIdx}
                  onClick={() => handleHeaderClick(colIdx)}
                  className="dt-sortable-th"
                  title={`Clique para ordenar por "${h}"`}
                >
                  {h} {sortCol === colIdx ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
              ))}
              <th className="dt-action-th">Ação</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Nenhum item encontrado para "{searchTerm}".
                </td>
              </tr>
            ) : (
              sortedRows.map(r => (
                <tr
                  key={r.index}
                  onClick={() => setSelectedItemDetail({
                    primaryName: r.primaryName,
                    secondaryName: r.secondaryName,
                    cells: r.cells,
                    headers,
                    image: r.image
                  })}
                  className="dt-row"
                  title={`Clique para abrir o detalhamento de "${r.primaryName}"`}
                >
                  {r.cells.map((cell, cIdx) => {
                    if (cIdx === 0) {
                      return (
                        <td key={cIdx}>
                          <div className="dt-row-name-group">
                            {r.image && (
                              <img
                                src={r.image}
                                alt={r.primaryName}
                                className="dt-row-avatar"
                                loading="lazy"
                              />
                            )}
                            <strong style={{ color: '#fef3c7' }}>{cell}</strong>
                          </div>
                        </td>
                      );
                    }
                    return <td key={cIdx}>{cell}</td>;
                  })}
                  <td className="dt-action-cell">
                    <button
                      type="button"
                      className="dt-btn-view-item"
                    >
                      👁️ Abrir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
