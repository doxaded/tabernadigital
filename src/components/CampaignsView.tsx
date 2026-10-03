import React, { useState } from 'react';
import { 
  BookOpen, Plus, Shield, Scroll, Library, Edit3, Trash2, Heart, Zap, 
  Sparkles, FileText, ChevronRight, User, AlertCircle, Eye, Check, X,
  ExternalLink, Download, Layers
} from 'lucide-react';
import { Campaign, CharacterSheet, LoreEntry, RuleDocument, UserProfile } from '../types';

interface CampaignsViewProps {
  campaigns: Campaign[];
  currentUser: UserProfile;
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onCreateCampaign: (name: string, description: string, system: string, coverUrl?: string) => { success: boolean; error?: string; campaign?: Campaign };
  onUpdateCampaign: (id: string, data: { name?: string; coverUrl?: string; description?: string; system?: string }) => void;
  onDeleteCampaign: (id: string) => void;
  onAddSheet: (campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>) => void;
  onUpdateSheet: (campaignId: string, sheetId: string, data: Partial<CharacterSheet>) => void;
  onDeleteSheet: (campaignId: string, sheetId: string) => void;
  onAddLore: (campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>) => void;
  onDeleteLore: (campaignId: string, loreId: string) => void;
  onAddRule: (campaignId: string, rule: Omit<RuleDocument, 'id' | 'campaignId'>) => void;
  onDeleteRule: (campaignId: string, ruleId: string) => void;
  onOpenMasterScreen?: (campaignId: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  currentUser,
  selectedCampaignId,
  onSelectCampaign,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onAddSheet,
  onUpdateSheet,
  onDeleteSheet,
  onAddLore,
  onDeleteLore,
  onAddRule,
  onDeleteRule,
  onOpenMasterScreen,
}) => {
  // Partições da sala ativa: 'sheets' | 'lore' | 'rules'
  const [activePartition, setActivePartition] = useState<'sheets' | 'lore' | 'rules'>('sheets');

  // Modais de Criação & Edição
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [isNewLoreModalOpen, setIsNewLoreModalOpen] = useState(false);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [viewingRuleDoc, setViewingRuleDoc] = useState<RuleDocument | null>(null);

  // Formulário Nova Sala
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomSystem, setNewRoomSystem] = useState('D&D 5e');
  const [newRoomCover, setNewRoomCover] = useState('/assets/tavern_bg.jpg');
  const [roomError, setRoomError] = useState('');

  // Formulário Edição Sala (Mestre)
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomCover, setEditRoomCover] = useState('');
  const [editRoomDesc, setEditRoomDesc] = useState('');

  // Formulário Nova Ficha
  const [sheetName, setSheetName] = useState('');
  const [sheetPlayer, setSheetPlayer] = useState('');
  const [sheetClass, setSheetClass] = useState('Guerreiro');
  const [sheetLevel, setSheetLevel] = useState(1);
  const [sheetRace, setSheetRace] = useState('Humano');
  const [sheetHp, setSheetHp] = useState(25);
  const [sheetMp, setSheetMp] = useState(10);
  const [sheetAc, setSheetAc] = useState(14);
  const [sheetIsNpc, setSheetIsNpc] = useState(false);

  // Formulário Novo Lore
  const [loreTitle, setLoreTitle] = useState('');
  const [loreCategory, setLoreCategory] = useState<'diario' | 'mundo' | 'locais' | 'faccoes' | 'rumores'>('diario');
  const [loreContent, setLoreContent] = useState('');
  const [loreTags, setLoreTags] = useState('Aventura, Mistério');

  // Formulário Nova Regra / PDF
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleCategory, setRuleCategory] = useState<'combate' | 'magia' | 'geral' | 'criaturas' | 'itens'>('combate');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleContent, setRuleContent] = useState('');
  const [ruleFileName, setRuleFileName] = useState('Livro_Regras_Apoio.pdf');

  // Campanhas criadas pelo usuário atual (para validação do limite de 3)
  const userMasteredCampaigns = campaigns.filter(c => c.masterId === currentUser.uid);
  const userRoomCount = userMasteredCampaigns.length;
  const isRoomLimitReached = userRoomCount >= 3;

  // Campanha selecionada
  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
  const isMasterOfActive = activeCampaign && (activeCampaign.masterId === currentUser.uid || currentUser.role === 'admin');

  const handleOpenEditRoom = (camp: Campaign) => {
    setEditRoomName(camp.name);
    setEditRoomCover(camp.coverUrl);
    setEditRoomDesc(camp.description);
    setIsEditRoomModalOpen(true);
  };

  const handleSaveEditRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) return;
    onUpdateCampaign(activeCampaign.id, {
      name: editRoomName,
      coverUrl: editRoomCover,
      description: editRoomDesc,
    });
    setIsEditRoomModalOpen(false);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError('');
    if (!newRoomName.trim()) {
      setRoomError('Informe o nome da campanha.');
      return;
    }

    const result = onCreateCampaign(newRoomName, newRoomDesc, newRoomSystem, newRoomCover);
    if (!result.success) {
      setRoomError(result.error || 'Erro ao criar campanha.');
      return;
    }

    setNewRoomName('');
    setNewRoomDesc('');
    setIsNewRoomModalOpen(false);
    if (result.campaign) {
      onSelectCampaign(result.campaign.id);
    }
  };

  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !sheetName.trim()) return;

    onAddSheet(activeCampaign.id, {
      name: sheetName.trim(),
      player: sheetPlayer.trim() || currentUser.displayName,
      class: sheetClass,
      level: Number(sheetLevel),
      race: sheetRace,
      hp: Number(sheetHp),
      maxHp: Number(sheetHp),
      mp: Number(sheetMp),
      maxMp: Number(sheetMp),
      armorClass: Number(sheetAc),
      stats: { strength: 14, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 12, charisma: 10 },
      traits: ['Treinado em Sobrevivência', 'Ataque Poderoso'],
      equipment: ['Espada Longa', 'Armadura de Couro', 'Mochila com Tochas'],
      notes: 'Personagem ativo na campanha.',
      isNpc: sheetIsNpc,
    });

    setSheetName('');
    setSheetPlayer('');
    setIsNewSheetModalOpen(false);
  };

  const handleCreateLore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !loreTitle.trim()) return;

    onAddLore(activeCampaign.id, {
      title: loreTitle.trim(),
      category: loreCategory,
      content: loreContent.trim(),
      author: currentUser.displayName,
      tags: loreTags.split(',').map(t => t.trim()).filter(Boolean),
    });

    setLoreTitle('');
    setLoreContent('');
    setIsNewLoreModalOpen(false);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !ruleTitle.trim()) return;

    onAddRule(activeCampaign.id, {
      title: ruleTitle.trim(),
      category: ruleCategory,
      description: ruleDesc.trim(),
      fileSize: '1.4 MB (' + ruleFileName + ')',
      pageCount: 6,
      tags: ['Regras', ruleCategory.toUpperCase()],
      contentSnippet: ruleContent.trim() || 'Documento de apoio e regras adicionais arquivado na biblioteca da sala.',
    });

    setRuleTitle('');
    setRuleDesc('');
    setRuleContent('');
    setIsNewRuleModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 40px' }}>
      {/* Top Bar: Rooms Carousel & Creation Limit Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
              Salas de Campanha
            </h2>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-cinzel)',
              padding: '3px 8px',
              borderRadius: '12px',
              backgroundColor: isRoomLimitReached ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${isRoomLimitReached ? '#ef4444' : '#f59e0b'}`,
              color: isRoomLimitReached ? '#fca5a5' : '#fef08a',
              fontWeight: 700
            }}>
              Suas Salas: {userRoomCount} / 3 ativas
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '2px 0 0' }}>
            Módulos mecânicos e narrativos para sua mesa de RPG de mesa.
          </p>
        </div>

        <button
          onClick={() => {
            setRoomError('');
            setIsNewRoomModalOpen(true);
          }}
          disabled={isRoomLimitReached}
          className="btn-tavern btn-primary"
          title={isRoomLimitReached ? 'Você atingiu o limite de 3 salas de campanha ativas' : 'Criar Nova Campanha'}
        >
          <Plus size={16} />
          <span>Criar Nova Sala</span>
        </button>
      </div>

      {/* Room Selector Strip */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '24px'
      }}>
        {campaigns.map(camp => {
          const isSelected = activeCampaign && activeCampaign.id === camp.id;
          const isMaster = camp.masterId === currentUser.uid || currentUser.role === 'admin';
          return (
            <div
              key={camp.id}
              onClick={() => onSelectCampaign(camp.id)}
              style={{
                minWidth: '240px',
                maxWidth: '280px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: isSelected ? 'var(--wood-light)' : 'var(--wood-dark)',
                border: isSelected ? '2px solid var(--amber-torch)' : '1px solid var(--wood-border)',
                boxShadow: isSelected ? '0 0 14px rgba(245, 158, 11, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--amber-torch)', fontWeight: 700 }}>
                  {camp.system}
                </span>
                {isMaster && (
                  <span className="wax-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '9px', padding: '2px 6px' }}>
                    Mestre
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#fff9ed' : '#cbd5e1', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {camp.name}
              </h4>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {camp.sheets.length} fichas • {camp.lore.length} crônicas
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Campaign Room Banner & Master Controls */}
      {activeCampaign ? (
        <div>
          <div style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            border: '2px solid var(--wood-border)',
            boxShadow: 'var(--shadow-card)',
            backgroundImage: `linear-gradient(to top, rgba(14, 8, 4, 0.95) 0%, rgba(20, 12, 7, 0.6) 60%, rgba(0, 0, 0, 0.4) 100%), url(${activeCampaign.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '190px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="wax-badge wax-badge-admin" style={{ fontSize: '10px' }}>
                    {activeCampaign.system}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--amber-torch)', fontWeight: 600 }}>
                    Mestre da Sala: {activeCampaign.masterName}
                  </span>
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fef3c7', margin: 0 }}>
                  {activeCampaign.name}
                </h1>
                <p style={{ fontSize: '13px', color: '#e2e8f0', maxWidth: '650px', marginTop: '6px', lineHeight: 1.4 }}>
                  {activeCampaign.description}
                </p>
              </div>

              {/* Master Exclusive Room Controls */}
              {isMasterOfActive && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {onOpenMasterScreen && (
                    <button
                      onClick={() => onOpenMasterScreen(activeCampaign.id)}
                      className="btn-tavern"
                      style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 800,
                        backgroundColor: '#92400e',
                        borderColor: '#f59e0b',
                        color: '#fef08a',
                        boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      title="Abrir Mesa de Pergaminhos (Escudo, Dados e Oráculo exclusivo do Mestre)"
                    >
                      <Scroll size={15} color="#fbbf24" />
                      <span>Mesa de Pergaminhos</span>
                      <span className="wax-badge wax-badge-admin" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        Mestre
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditRoom(activeCampaign)}
                    className="btn-tavern btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '11px', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(42, 24, 11, 0.85)' }}
                    title="Editar Nome, Descrição e Banner da Campanha (Privilégio do Mestre)"
                  >
                    <Edit3 size={14} />
                    <span>Personalizar Sala</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja encerrar e excluir a campanha "${activeCampaign.name}"?`)) {
                        onDeleteCampaign(activeCampaign.id);
                      }
                    }}
                    className="btn-tavern btn-danger"
                    style={{ padding: '8px 12px', fontSize: '11px' }}
                    title="Excluir Campanha"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Partitions Tabs (Fichas, Lore, Regras) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid var(--wood-border)',
            paddingBottom: '8px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => setActivePartition('sheets')}
              className={`btn-tavern ${activePartition === 'sheets' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              <Scroll size={16} />
              <span>Fichas ({activeCampaign.sheets.length})</span>
            </button>

            <button
              onClick={() => setActivePartition('lore')}
              className={`btn-tavern ${activePartition === 'lore' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              <BookOpen size={16} />
              <span>Contexto & Lore ({activeCampaign.lore.length})</span>
            </button>

            <button
              onClick={() => setActivePartition('rules')}
              className={`btn-tavern ${activePartition === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', padding: '8px 18px' }}
            >
              <Library size={16} />
              <span>Biblioteca de Regras ({activeCampaign.rules.length})</span>
            </button>

            {isMasterOfActive && onOpenMasterScreen && (
              <button
                onClick={() => onOpenMasterScreen(activeCampaign.id)}
                className="btn-tavern btn-secondary"
                style={{
                  fontSize: '13px',
                  padding: '8px 18px',
                  borderColor: 'var(--amber-torch)',
                  color: '#fef08a',
                  backgroundColor: 'rgba(146, 64, 14, 0.25)',
                  gap: '8px'
                }}
                title="Acesso exclusivo ao escudo do Mestre"
              >
                <Scroll size={16} color="var(--amber-torch)" />
                <span>Mesa de Pergaminhos</span>
                <span className="wax-badge" style={{ backgroundColor: '#78350f', color: '#fbbf24', fontSize: '9px', padding: '2px 5px' }}>
                  Mestre
                </span>
              </button>
            )}
          </div>

          {/* PARTITION 1: FICHAS DE PERSONAGENS & NPCS */}
          {activePartition === 'sheets' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', margin: 0 }}>
                  Repositório de Personagens & NPCs da Mesa
                </h3>
                <button
                  onClick={() => setIsNewSheetModalOpen(true)}
                  className="btn-tavern btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  Nova Ficha
                </button>
              </div>

              {activeCampaign.sheets.length === 0 ? (
                <div className="parchment-card" style={{ padding: '36px', textAlign: 'center' }}>
                  <Scroll size={36} color="var(--amber-deep)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Nenhum pergaminho de personagem registrado</h4>
                  <p style={{ fontSize: '13px', color: 'var(--ink-medium)', marginTop: '4px' }}>
                    Adicione os heróis da comitiva ou os NPCs encontrados na taberna para acompanhar seus pontos de vida e habilidades.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {activeCampaign.sheets.map(sheet => (
                    <div key={sheet.id} className="parchment-card" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                              {sheet.name}
                            </h4>
                            {sheet.isNpc && (
                              <span className="wax-badge" style={{ backgroundColor: 'rgba(180, 83, 9, 0.15)', color: '#78350f', fontSize: '9px', padding: '2px 5px' }}>
                                NPC
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-light)', marginTop: '2px' }}>
                            {sheet.race} • {sheet.class} (Nível {sheet.level})
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-medium)' }}>
                            Jogador: <strong>{sheet.player}</strong>
                          </div>
                        </div>

                        {isMasterOfActive && (
                          <button
                            onClick={() => onDeleteSheet(activeCampaign.id, sheet.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '2px' }}
                            title="Remover Ficha"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Stat Counters: HP, MP, AC */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        margin: '14px 0',
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        padding: '8px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <Heart size={12} fill="#ef4444" color="#ef4444" /> HP
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-dark)' }}>
                            {sheet.hp} / {sheet.maxHp}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { hp: Math.max(0, sheet.hp - 1) })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #ccb993', background: '#fff', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              -
                            </button>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { hp: Math.min(sheet.maxHp + 10, sheet.hp + 1) })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #ccb993', background: '#fff', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <Zap size={12} fill="#3b82f6" color="#3b82f6" /> Mana
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-dark)' }}>
                            {sheet.mp} / {sheet.maxMp}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { mp: Math.max(0, sheet.mp - 1) })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #ccb993', background: '#fff', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              -
                            </button>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { mp: sheet.mp + 1 })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid #ccb993', background: '#fff', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <Shield size={12} /> C.A.
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-dark)' }}>
                            {sheet.armorClass}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--ink-light)', marginTop: '4px' }}>
                            Armadura
                          </div>
                        </div>
                      </div>

                      {/* Six Core Attributes */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '4px',
                        textAlign: 'center',
                        fontSize: '11px',
                        marginBottom: '10px'
                      }}>
                        {Object.entries(sheet.stats).map(([k, v]) => (
                          <div key={k} style={{ border: '1px solid #ccb993', padding: '3px', borderRadius: '4px', background: 'rgba(255,255,255,0.5)' }}>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', color: 'var(--ink-light)' }}>
                              {k.slice(0, 3)}
                            </span>
                            <div style={{ fontWeight: 800, fontSize: '12px' }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Equipment or Notes */}
                      {sheet.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--ink-medium)', fontStyle: 'italic', borderTop: '1px dashed #ccb993', paddingTop: '8px' }}>
                          "{sheet.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PARTITION 2: CONTEXTO & LORE */}
          {activePartition === 'lore' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>
                    Worldbuilding, Diário de Sessão & Linhas Narrativas
                  </h3>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0' }}>
                    Cronologias, mistérios, locais explorados e notas do Mestre e jogadores.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewLoreModalOpen(true)}
                  className="btn-tavern btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  Nova Anotação de Lore
                </button>
              </div>

              {activeCampaign.lore.length === 0 ? (
                <div className="parchment-card" style={{ padding: '36px', textAlign: 'center' }}>
                  <BookOpen size={36} color="var(--amber-deep)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Nenhum registro de crônica gravado</h4>
                  <p style={{ fontSize: '13px', color: 'var(--ink-medium)', marginTop: '4px' }}>
                    Registre o resumo da primeira sessão ou consulte o oráculo Urd para gerar lendas para o mundo!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeCampaign.lore.map(entry => (
                    <div key={entry.id} className="parchment-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="wax-badge" style={{ backgroundColor: '#2a180b', color: '#fef08a', fontSize: '9px' }}>
                              {entry.category.toUpperCase()}
                            </span>
                            <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                              {entry.title}
                            </h4>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-light)', marginTop: '3px' }}>
                            Gravado por <strong>{entry.author}</strong> em {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        {isMasterOfActive && (
                          <button
                            onClick={() => onDeleteLore(activeCampaign.id, entry.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '4px' }}
                            title="Excluir Anotação"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="font-lore" style={{ fontSize: '15px', color: 'var(--ink-dark)', lineHeight: 1.6, margin: '14px 0', whiteSpace: 'pre-line' }}>
                        {entry.content}
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {entry.tags.map(t => (
                            <span key={t} style={{ fontSize: '10px', backgroundColor: 'rgba(180, 83, 9, 0.12)', color: '#78350f', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PARTITION 3: BIBLIOTECA DE REGRAS & PDFS */}
          {activePartition === 'rules' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>
                    Grimório & Biblioteca de Regras (.PDFs e Guias de Apoio)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '2px 0 0' }}>
                    Manuais de combate, magias e livros de regras oficiais e da casa para consulta rápida durante a sessão.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewRuleModalOpen(true)}
                  className="btn-tavern btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  Adicionar Documento / PDF
                </button>
              </div>

              {activeCampaign.rules.length === 0 ? (
                <div className="parchment-card" style={{ padding: '36px', textAlign: 'center' }}>
                  <Library size={36} color="var(--amber-deep)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Nenhum documento de regras arquivado</h4>
                  <p style={{ fontSize: '13px', color: 'var(--ink-medium)', marginTop: '4px' }}>
                    Envie guias de combate, listas de magias ou PDFs do sistema de RPG para consulta imediata na mesa.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {activeCampaign.rules.map(doc => (
                    <div key={doc.id} className="parchment-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={22} color="var(--amber-deep)" />
                            <div>
                              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
                                {doc.title}
                              </h4>
                              <span style={{ fontSize: '11px', color: 'var(--amber-torch)', fontWeight: 600 }}>
                                {doc.fileSize || 'PDF'} • Categoria: {doc.category}
                              </span>
                            </div>
                          </div>

                          {isMasterOfActive && (
                            <button
                              onClick={() => onDeleteRule(activeCampaign.id, doc.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '2px' }}
                              title="Remover Documento"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--ink-medium)', margin: '10px 0', lineHeight: 1.4 }}>
                          {doc.description}
                        </p>

                        {doc.contentSnippet && (
                          <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--ink-dark)',
                            borderLeft: '2px solid var(--amber-deep)',
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-line'
                          }}>
                            {doc.contentSnippet}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button
                          onClick={() => setViewingRuleDoc(doc)}
                          className="btn-tavern btn-primary"
                          style={{ flex: 1, padding: '6px 10px', fontSize: '11px' }}
                        >
                          <Eye size={14} />
                          Abrir Leitor PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="parchment-card" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--amber-deep)" style={{ margin: '0 auto 12px' }} />
          <h3>Nenhuma sala de campanha encontrada</h3>
          <p style={{ color: 'var(--ink-medium)', marginTop: '6px' }}>
            Crie sua primeira campanha para começar a mestrar!
          </p>
        </div>
      )}

      {/* MODAL: CRIAR NOVA CAMPANHA (Limitação estrita de 3) */}
      {isNewRoomModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewRoomModalOpen(false)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="var(--amber-deep)" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Criar Nova Sala de Campanha</h3>
              </div>
              <button onClick={() => setIsNewRoomModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {roomError && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', marginBottom: '14px' }}>
                {roomError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Nome da Campanha:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: A Maldição do Rei Pálido"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="tavern-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Sistema de Regras:
                </label>
                <select
                  value={newRoomSystem}
                  onChange={e => setNewRoomSystem(e.target.value)}
                  className="tavern-input"
                >
                  <option value="D&D 5e">Dungeons & Dragons 5e</option>
                  <option value="Tormenta 20">Tormenta 20</option>
                  <option value="Pathfinder 2e">Pathfinder 2e</option>
                  <option value="Chamado de Cthulhu">Chamado de Cthulhu</option>
                  <option value="Sistema Próprio / OSR">Sistema Próprio / OSR</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Descrição & Sinopse:
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o prelúdio e o objetivo da aventura..."
                  value={newRoomDesc}
                  onChange={e => setNewRoomDesc(e.target.value)}
                  className="tavern-input"
                />
              </div>

              <div style={{
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid var(--amber-torch)',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '11px',
                color: 'var(--ink-dark)'
              }}>
                <strong>Regra da Taberna:</strong> Você assumirá o posto de <strong>Mestre</strong> exclusivo desta sala e terá privilégios para alterar o banner, fichas e documentos.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>
                  Fundar Campanha
                </button>
                <button type="button" onClick={() => setIsNewRoomModalOpen(false)} className="btn-tavern btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PERSONALIZAR SALA (MESTRE) */}
      {isEditRoomModalOpen && activeCampaign && (
        <div className="tavern-modal-backdrop" onClick={() => setIsEditRoomModalOpen(false)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={20} color="var(--amber-deep)" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Personalização da Sala (Exclusivo do Mestre)</h3>
              </div>
              <button onClick={() => setIsEditRoomModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoom} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Nome da Campanha:
                </label>
                <input
                  type="text"
                  required
                  value={editRoomName}
                  onChange={e => setEditRoomName(e.target.value)}
                  className="tavern-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Foto/Banner de Capa (URL da Imagem):
                </label>
                <input
                  type="text"
                  value={editRoomCover}
                  onChange={e => setEditRoomCover(e.target.value)}
                  className="tavern-input"
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setEditRoomCover('/assets/tavern_bg.jpg')}
                    style={{ fontSize: '10px', background: '#fff', border: '1px solid #ccb993', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Usar Fundo da Taverna
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRoomCover('/assets/sketch_sword.jpg')}
                    style={{ fontSize: '10px', background: '#fff', border: '1px solid #ccb993', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Usar Espada Rúnica
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Sinopse da Campanha:
                </label>
                <textarea
                  rows={3}
                  value={editRoomDesc}
                  onChange={e => setEditRoomDesc(e.target.value)}
                  className="tavern-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>
                  Salvar Alterações
                </button>
                <button type="button" onClick={() => setIsEditRoomModalOpen(false)} className="btn-tavern btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA FICHA */}
      {isNewSheetModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewSheetModalOpen(false)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ padding: '26px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800 }}>Criar Nova Ficha de Personagem</h3>
            <form onSubmit={handleCreateSheet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Nome do Personagem:</label>
                  <input required value={sheetName} onChange={e => setSheetName(e.target.value)} className="tavern-input" placeholder="Ex: Valen Coração-de-Leão" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Jogador / Mestre:</label>
                  <input value={sheetPlayer} onChange={e => setSheetPlayer(e.target.value)} className="tavern-input" placeholder={currentUser.displayName} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Classe:</label>
                  <input value={sheetClass} onChange={e => setSheetClass(e.target.value)} className="tavern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Raça:</label>
                  <input value={sheetRace} onChange={e => setSheetRace(e.target.value)} className="tavern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Nível:</label>
                  <input type="number" min={1} max={20} value={sheetLevel} onChange={e => setSheetLevel(Number(e.target.value))} className="tavern-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Pontos de Vida (HP):</label>
                  <input type="number" value={sheetHp} onChange={e => setSheetHp(Number(e.target.value))} className="tavern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Pontos de Magia (MP):</label>
                  <input type="number" value={sheetMp} onChange={e => setSheetMp(Number(e.target.value))} className="tavern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Classe de Armadura:</label>
                  <input type="number" value={sheetAc} onChange={e => setSheetAc(Number(e.target.value))} className="tavern-input" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                <input type="checkbox" id="isNpcCheck" checked={sheetIsNpc} onChange={e => setSheetIsNpc(e.target.checked)} />
                <label htmlFor="isNpcCheck" style={{ fontSize: '12px', fontWeight: 600 }}>Marcar como NPC / Monstro da Taberna</label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>Registrar Ficha</button>
                <button type="button" onClick={() => setIsNewSheetModalOpen(false)} className="btn-tavern btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LORE */}
      {isNewLoreModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewLoreModalOpen(false)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ padding: '26px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800 }}>Adicionar Crônica ou Lore da Campanha</h3>
            <form onSubmit={handleCreateLore} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Título da Anotação:</label>
                <input required value={loreTitle} onChange={e => setLoreTitle(e.target.value)} className="tavern-input" placeholder="Ex: A Emboscada no Desfiladeiro dos Corvos" />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Categoria:</label>
                <select value={loreCategory} onChange={e => setLoreCategory(e.target.value as any)} className="tavern-input">
                  <option value="diario">Diário de Sessão</option>
                  <option value="mundo">História do Mundo / Worldbuilding</option>
                  <option value="locais">Cidades, Fortalezas e Locais</option>
                  <option value="faccoes">Facções e Guildas Rivais</option>
                  <option value="rumores">Boatos e Rumores da Taverna</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Texto da Narrativa:</label>
                <textarea rows={5} required value={loreContent} onChange={e => setLoreContent(e.target.value)} className="tavern-input font-lore" placeholder="Escreva os acontecimentos épicos..." />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Tags (separadas por vírgula):</label>
                <input value={loreTags} onChange={e => setLoreTags(e.target.value)} className="tavern-input" />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>Gravar no Grimório</button>
                <button type="button" onClick={() => setIsNewLoreModalOpen(false)} className="btn-tavern btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA REGRA / PDF */}
      {isNewRuleModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewRuleModalOpen(false)}>
          <div className="tavern-modal-content parchment-card" onClick={e => e.stopPropagation()} style={{ padding: '26px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800 }}>Adicionar Documento de Regras / PDF</h3>
            <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Nome do Documento / Livro:</label>
                <input required value={ruleTitle} onChange={e => setRuleTitle(e.target.value)} className="tavern-input" placeholder="Ex: Tabela Oficial de Ações em Combate" />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Categoria de Apoio:</label>
                <select value={ruleCategory} onChange={e => setRuleCategory(e.target.value as any)} className="tavern-input">
                  <option value="combate">Regras de Combate</option>
                  <option value="magia">Conjuração & Grimório de Magias</option>
                  <option value="geral">Regras Gerais do Sistema</option>
                  <option value="criaturas">Manual de Monstros / Fichas Rápidas</option>
                  <option value="itens">Equipamentos & Itens Mágicos</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Nome do Arquivo PDF:</label>
                <input value={ruleFileName} onChange={e => setRuleFileName(e.target.value)} className="tavern-input" />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Resumo Rápido para Consulta na Mesa:</label>
                <textarea rows={4} value={ruleContent} onChange={e => setRuleContent(e.target.value)} className="tavern-input" placeholder="Insira o texto das regras principais para consulta sem necessidade de abrir o PDF completo..." />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>Arquivar Regra</button>
                <button type="button" onClick={() => setIsNewRuleModalOpen(false)} className="btn-tavern btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE PDF / DOCUMENTO */}
      {viewingRuleDoc && (
        <div className="tavern-modal-backdrop" onClick={() => setViewingRuleDoc(null)}>
          <div className="tavern-modal-content wood-panel wood-panel-glow" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', padding: '0' }}>
            <div style={{ padding: '16px 20px', background: '#24170e', borderBottom: '2px solid var(--amber-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--amber-glow)" />
                <h4 style={{ margin: 0, color: '#fef3c7', fontSize: '16px' }}>{viewingRuleDoc.title}</h4>
              </div>
              <button onClick={() => setViewingRuleDoc(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'var(--parchment-base)', color: 'var(--ink-dark)', minHeight: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccb993', paddingBottom: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-deep)' }}>
                  Visualizador de Documento • Página 1 de {viewingRuleDoc.pageCount || 1}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ink-light)' }}>
                  Tamanho: {viewingRuleDoc.fileSize || '1.2 MB'}
                </span>
              </div>

              <div className="font-lore" style={{ fontSize: '16px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {viewingRuleDoc.contentSnippet || viewingRuleDoc.description}
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: '#190f07', borderTop: '1px solid var(--wood-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => alert('Download do arquivo de regras iniciado!')} className="btn-tavern btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>
                <Download size={14} />
                Baixar PDF Completo
              </button>
              <button onClick={() => setViewingRuleDoc(null)} className="btn-tavern btn-secondary" style={{ padding: '6px 14px', fontSize: '11px' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
