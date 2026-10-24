import React, { useRef, useState } from 'react';
import { 
  Crown, ArrowLeft, BookOpen, Plus, Shield, Scroll, Library, Edit3, Trash2, Heart, Zap, 
  Sparkles, FileText, ChevronRight, User, Users, Maximize2, AlertCircle, Eye, Check, X,
  ExternalLink, Download, Layers, Upload, Loader2, Copy, RefreshCw, LogOut,
  Dices, Clipboard, Search, KeyRound
} from 'lucide-react';
import { Campaign, CharacterSheet, CustomStat, LoreEntry, RuleDocument, UserProfile } from '../types';
import { SHEET_IMPORT_ACCEPT, extractCharacterSheetFromFile } from '../services/sheetImportService';
import { MAX_PLAYERS } from '../services/storage';
import { DefaultStats, getOrderedStats, validateCustomStats } from '../services/sheetStats';
import { SheetStatsEditor } from './SheetStatsEditor';
import { TavernInteractiveDesk } from './TavernInteractiveDesk';
import { tavernAudio } from '../services/tavernAudio';
import { AvatarFrame } from './AvatarFrame';

interface CampaignsViewProps {
  onBack?: () => void;
  campaigns: Campaign[];
  currentUser: UserProfile;
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onJoinByKey: (key: string) => Promise<{ success: boolean; error?: string; campaignId?: string }>;
  onRegenerateKey: (campaignId: string) => Promise<{ success: boolean; error?: string }>;
  onRemovePlayer: (campaignId: string, playerUid: string) => Promise<{ success: boolean; error?: string }>;
  onCreateCampaign: (name: string, description: string, system: string, coverUrl?: string) => { success: boolean; error?: string; campaign?: Campaign };
  onUpdateCampaign: (id: string, data: { name?: string; coverUrl?: string; description?: string; system?: string }) => void;
  onDeleteCampaign: (id: string) => void;
  onAddSheet: (campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>) => void;
  onUpdateSheet: (campaignId: string, sheetId: string, data: Partial<CharacterSheet>) => void;
  onDeleteSheet: (campaignId: string, sheetId: string) => void;
  onAddLore: (campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>) => void;
  onDeleteLore: (campaignId: string, loreId: string) => void;
  onUpdateLore: (campaignId: string, loreId: string, data: Partial<LoreEntry>) => void;
  onAddRule: (campaignId: string, rule: Omit<RuleDocument, 'id' | 'campaignId'>) => void;
  onDeleteRule: (campaignId: string, ruleId: string) => void;
  onUpdateRule: (campaignId: string, ruleId: string, data: Partial<RuleDocument>) => void;
  onOpenMasterScreen?: (campaignId: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  onBack,
  campaigns,
  currentUser,
  selectedCampaignId,
  onSelectCampaign,
  onJoinByKey,
  onRegenerateKey,
  onRemovePlayer,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onAddSheet,
  onUpdateSheet,
  onDeleteSheet,
  onAddLore,
  onDeleteLore,
  onUpdateLore,
  onAddRule,
  onDeleteRule,
  onUpdateRule,
  onOpenMasterScreen,
}) => {
  // Partições da sala ativa: 'sheets' | 'lore' | 'rules'
  const [activePartition, setActivePartition] = useState<'sheets' | 'lore' | 'rules'>('sheets');

  // Lado expandido pelo cursor no quadro de referência: 'join' | 'master' | null
  const [expandedRefSide, setExpandedRefSide] = useState<'join' | 'master' | null>(null);

  // Modais de Criação & Edição
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [isNewLoreModalOpen, setIsNewLoreModalOpen] = useState(false);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [viewingRuleDoc, setViewingRuleDoc] = useState<RuleDocument | null>(null);
  // Quando preenchidos, os modais de Lore/Regra editam o item em vez de criar um novo
  const [editingLoreId, setEditingLoreId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Formulário Nova Sala
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomSystem, setNewRoomSystem] = useState('D&D 5e');
  const [newRoomCover, setNewRoomCover] = useState('/assets/tavern_bg.jpg');
  const [roomError, setRoomError] = useState('');

  // Chave de sala: entrada do jogador e gestão pelo mestre
  const [joinKeyInput, setJoinKeyInput] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Formulário Edição Sala (Mestre)
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomCover, setEditRoomCover] = useState('');
  const [editRoomDesc, setEditRoomDesc] = useState('');

  // Painel de Controle: Estados de Busca, Filtro e Dados
  const [tableFilter, setTableFilter] = useState<'all' | 'joined' | 'master'>('all');
  const [roomSearch, setRoomSearch] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [quickDiceHistory, setQuickDiceHistory] = useState<Array<{ die: string; result: number; time: string }>>([]);
  const [isRollingQuick, setIsRollingQuick] = useState<string | null>(null);

  const handleRollQuickDie = (die: string, sides: number) => {
    if (isRollingQuick) return;
    setIsRollingQuick(die);
    tavernAudio.playDiceRoll();
    setTimeout(() => {
      const val = Math.floor(Math.random() * sides) + 1;
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setQuickDiceHistory(prev => [{ die, result: val, time }, ...prev.slice(0, 6)]);
      setIsRollingQuick(null);
    }, 280);
  };

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
  const DEFAULT_SHEET_STATS: DefaultStats = { strength: 14, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 12, charisma: 10 };
  const [sheetStats, setSheetStats] = useState<DefaultStats>(DEFAULT_SHEET_STATS);
  const [sheetCustomStats, setSheetCustomStats] = useState<CustomStat[]>([]);
  const [sheetStatsError, setSheetStatsError] = useState('');
  // Quando preenchido, o modal de ficha edita esta ficha em vez de criar uma nova
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [sheetTraits, setSheetTraits] = useState('Treinado em Sobrevivência\nAtaque Poderoso');
  const [sheetEquipment, setSheetEquipment] = useState('Espada Longa\nArmadura de Couro\nMochila com Tochas');
  const [sheetNotes, setSheetNotes] = useState('Personagem ativo na campanha.');

  // Importação automática da ficha (imagem ou PDF lidos por IA)
  const [importStatus, setImportStatus] = useState<'idle' | 'reading' | 'done' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const sheetFileInputRef = useRef<HTMLInputElement>(null);

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
  const totalPlayersInMasteredRooms = userMasteredCampaigns.reduce(
    (acc, c) => acc + (c.players?.length || 0), 0
  );

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

  const splitLines = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean);

  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !sheetName.trim()) return;

    const statsProblem = validateCustomStats(sheetCustomStats);
    if (statsProblem) {
      setSheetStatsError(statsProblem);
      return;
    }
    setSheetStatsError('');

    const common = {
      name: sheetName.trim(),
      player: sheetPlayer.trim() || currentUser.displayName,
      class: sheetClass,
      level: Number(sheetLevel),
      race: sheetRace,
      maxHp: Number(sheetHp),
      maxMp: Number(sheetMp),
      armorClass: Number(sheetAc),
      stats: { ...sheetStats },
      customStats: sheetCustomStats.map(s => ({ code: s.code, value: Number(s.value) })),
      traits: splitLines(sheetTraits),
      equipment: splitLines(sheetEquipment),
      notes: sheetNotes.trim(),
      isNpc: sheetIsNpc,
    };

    if (editingSheetId) {
      const existing = activeCampaign.sheets.find(s => s.id === editingSheetId);
      onUpdateSheet(activeCampaign.id, editingSheetId, {
        ...common,
        // Mantém os pontos atuais, limitados ao novo máximo
        hp: Math.min(existing?.hp ?? common.maxHp, common.maxHp),
        mp: Math.min(existing?.mp ?? common.maxMp, common.maxMp),
      });
    } else {
      onAddSheet(activeCampaign.id, { ...common, hp: common.maxHp, mp: common.maxMp });
    }

    resetSheetForm();
    setEditingSheetId(null);
    setIsNewSheetModalOpen(false);
  };

  // Lê o arquivo (imagem/PDF) com IA e preenche o formulário para revisão
  const handleImportSheetFile = async (file?: File | null) => {
    if (!file) return;
    setImportStatus('reading');
    setImportMessage(`Lendo "${file.name}"...`);
    try {
      const data = await extractCharacterSheetFromFile(file);
      if (data.name) setSheetName(data.name);
      if (data.player) setSheetPlayer(data.player);
      if (data.class) setSheetClass(data.class);
      if (data.race) setSheetRace(data.race);
      setSheetLevel(data.level);
      setSheetHp(data.maxHp);
      setSheetMp(data.maxMp);
      setSheetAc(data.armorClass);
      setSheetStats(data.stats);
      setSheetCustomStats(data.customStats || []);
      setSheetTraits(data.traits.join('\n'));
      setSheetEquipment(data.equipment.join('\n'));
      setSheetNotes(data.notes);
      setImportStatus('done');
      setImportMessage('Ficha lida com sucesso! Revise os campos abaixo e salve.');
    } catch (err: any) {
      setImportStatus('error');
      setImportMessage(err?.message || 'Não foi possível ler este arquivo.');
    } finally {
      if (sheetFileInputRef.current) sheetFileInputRef.current.value = '';
    }
  };

  const resetSheetForm = () => {
    setSheetName('');
    setSheetPlayer('');
    setSheetClass('Guerreiro');
    setSheetRace('Humano');
    setSheetLevel(1);
    setSheetHp(25);
    setSheetMp(10);
    setSheetAc(14);
    setSheetIsNpc(false);
    setSheetStats(DEFAULT_SHEET_STATS);
    setSheetCustomStats([]);
    setSheetTraits('Treinado em Sobrevivência\nAtaque Poderoso');
    setSheetEquipment('Espada Longa\nArmadura de Couro\nMochila com Tochas');
    setSheetNotes('Personagem ativo na campanha.');
    setSheetStatsError('');
    setImportStatus('idle');
    setImportMessage('');
  };

  const handleOpenNewSheet = () => {
    resetSheetForm();
    setEditingSheetId(null);
    setIsNewSheetModalOpen(true);
  };

  // Abre o mesmo modal preenchido com os dados da ficha para edição
  const handleOpenEditSheet = (sheet: CharacterSheet) => {
    resetSheetForm();
    setEditingSheetId(sheet.id);
    setSheetName(sheet.name);
    setSheetPlayer(sheet.player);
    setSheetClass(sheet.class);
    setSheetRace(sheet.race);
    setSheetLevel(sheet.level);
    setSheetHp(sheet.maxHp);
    setSheetMp(sheet.maxMp);
    setSheetAc(sheet.armorClass);
    setSheetIsNpc(!!sheet.isNpc);
    setSheetStats({ ...DEFAULT_SHEET_STATS, ...sheet.stats });
    setSheetCustomStats((sheet.customStats || []).map(s => ({ ...s })));
    setSheetTraits((sheet.traits || []).join('\n'));
    setSheetEquipment((sheet.equipment || []).join('\n'));
    setSheetNotes(sheet.notes || '');
    setIsNewSheetModalOpen(true);
  };

  const handleOpenNewLore = () => {
    setEditingLoreId(null);
    setLoreTitle('');
    setLoreCategory('diario');
    setLoreContent('');
    setLoreTags('Aventura, Mistério');
    setIsNewLoreModalOpen(true);
  };

  const handleOpenEditLore = (entry: LoreEntry) => {
    setEditingLoreId(entry.id);
    setLoreTitle(entry.title);
    setLoreCategory(entry.category);
    setLoreContent(entry.content);
    setLoreTags((entry.tags || []).join(', '));
    setIsNewLoreModalOpen(true);
  };

  const handleCreateLore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !loreTitle.trim()) return;

    const tags = loreTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingLoreId) {
      onUpdateLore(activeCampaign.id, editingLoreId, {
        title: loreTitle.trim(),
        category: loreCategory,
        content: loreContent.trim(),
        tags,
      });
    } else {
      onAddLore(activeCampaign.id, {
        title: loreTitle.trim(),
        category: loreCategory,
        content: loreContent.trim(),
        author: currentUser.displayName,
        tags,
      });
    }

    setLoreTitle('');
    setLoreContent('');
    setEditingLoreId(null);
    setIsNewLoreModalOpen(false);
  };

  const handleOpenNewRule = () => {
    setEditingRuleId(null);
    setRuleTitle('');
    setRuleCategory('combate');
    setRuleDesc('');
    setRuleContent('');
    setRuleFileName('Livro_Regras_Apoio.pdf');
    setIsNewRuleModalOpen(true);
  };

  const handleOpenEditRule = (doc: RuleDocument) => {
    setEditingRuleId(doc.id);
    setRuleTitle(doc.title);
    setRuleCategory(doc.category);
    setRuleDesc(doc.description || '');
    setRuleContent(doc.contentSnippet || '');
    // O nome do arquivo fica entre parênteses em fileSize (ex.: "1.4 MB (Guia.pdf)")
    const match = (doc.fileSize || '').match(/\((.*)\)\s*$/);
    setRuleFileName(match ? match[1] : '');
    setIsNewRuleModalOpen(true);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !ruleTitle.trim()) return;

    const snippet = ruleContent.trim() || 'Documento de apoio e regras adicionais arquivado na biblioteca da sala.';

    if (editingRuleId) {
      const existing = activeCampaign.rules.find(r => r.id === editingRuleId);
      // Mantém o tamanho original e apenas atualiza o nome do arquivo informado
      const baseSize = (existing?.fileSize || '1.4 MB').replace(/\s*\(.*\)\s*$/, '');
      const fileSize = ruleFileName.trim() ? `${baseSize} (${ruleFileName.trim()})` : baseSize;
      // Troca a etiqueta da categoria antiga pela nova, preservando as demais tags
      const oldTag = existing?.category.toUpperCase();
      const newTag = ruleCategory.toUpperCase();
      const tags = (existing?.tags || ['Regras']).map(t => (t === oldTag ? newTag : t));
      if (!tags.includes(newTag)) tags.push(newTag);

      onUpdateRule(activeCampaign.id, editingRuleId, {
        title: ruleTitle.trim(),
        category: ruleCategory,
        description: ruleDesc.trim(),
        fileSize,
        tags,
        contentSnippet: snippet,
      });
    } else {
      onAddRule(activeCampaign.id, {
        title: ruleTitle.trim(),
        category: ruleCategory,
        description: ruleDesc.trim(),
        fileSize: '1.4 MB (' + ruleFileName + ')',
        pageCount: 6,
        tags: ['Regras', ruleCategory.toUpperCase()],
        contentSnippet: snippet,
      });
    }

    setRuleTitle('');
    setRuleDesc('');
    setRuleContent('');
    setEditingRuleId(null);
    setIsNewRuleModalOpen(false);
  };

  // Salas em que o usuário entrou como jogador com a chave do mestre (admin enxerga todas as demais)
  const joinedCampaigns = campaigns.filter(c =>
    c.masterId !== currentUser.uid &&
    (currentUser.role === 'admin' || !!c.players?.some(p => p.uid === currentUser.uid))
  );
  const isPlayerOfActive = !!activeCampaign && activeCampaign.masterId !== currentUser.uid &&
    !!activeCampaign.players?.some(p => p.uid === currentUser.uid);

  const handleJoinKeyChange = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setJoinKeyInput(clean.length > 4 ? clean.slice(0, 4) + '-' + clean.slice(4) : clean);
    setJoinMessage(null);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleJoinKeyChange(text.trim());
      }
    } catch {
      setJoinMessage({ type: 'error', text: 'Permissão para ler a área de transferência não concedida.' });
    }
  };


  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    setIsJoining(true);
    setJoinMessage(null);
    const res = await onJoinByKey(joinKeyInput);
    setIsJoining(false);
    if (!res.success) {
      setJoinMessage({ type: 'error', text: res.error || 'Não foi possível entrar na sala.' });
      return;
    }
    setJoinKeyInput('');
    setJoinMessage({ type: 'success', text: 'Você entrou na mesa! Boa aventura.' });
    setTimeout(() => {
      document.getElementById('sala-ativa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  const handleCopyKey = async () => {
    if (!activeCampaign?.joinKey) return;
    try {
      await navigator.clipboard.writeText(activeCampaign.joinKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      setKeyError('Não foi possível copiar automaticamente. Selecione a chave e copie manualmente.');
    }
  };

  const handleRegenerateKey = async () => {
    if (!activeCampaign || keyBusy) return;
    if (!confirm('Gerar uma nova chave? A chave atual deixa de funcionar para novos jogadores. Quem já entrou continua na sala.')) return;
    setKeyBusy(true);
    setKeyError('');
    const res = await onRegenerateKey(activeCampaign.id);
    setKeyBusy(false);
    if (!res.success) setKeyError(res.error || 'Não foi possível gerar a nova chave.');
  };

  const handleRemovePlayer = async (playerUid: string, playerName: string) => {
    if (!activeCampaign || keyBusy) return;
    if (!confirm(`Remover ${playerName} da sala? Ele poderá voltar a entrar com a chave, se ela ainda estiver ativa.`)) return;
    setKeyBusy(true);
    setKeyError('');
    const res = await onRemovePlayer(activeCampaign.id, playerUid);
    setKeyBusy(false);
    if (!res.success) setKeyError(res.error || 'Não foi possível remover o jogador.');
  };

  const handleLeaveRoom = async () => {
    if (!activeCampaign || keyBusy) return;
    if (!confirm(`Sair da mesa "${activeCampaign.name}"? Para voltar, você precisará da chave do mestre.`)) return;
    setKeyBusy(true);
    setKeyError('');
    const res = await onRemovePlayer(activeCampaign.id, currentUser.uid);
    setKeyBusy(false);
    if (!res.success) setKeyError(res.error || 'Não foi possível sair da mesa.');
  };

  // Seleciona a sala e rola até os detalhes dela
  const handlePickRoom = (id: string) => {
    onSelectCampaign(id);
    requestAnimationFrame(() => {
      document.getElementById('sala-ativa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const renderRoomRow = (camp: Campaign, isMasterSide: boolean) => {
    const isSelected = !!activeCampaign && activeCampaign.id === camp.id;
    const isExpanded = expandedRefSide === (isMasterSide ? 'master' : 'join');
    const players = camp.players || [];

    return (
      <div
        key={camp.id}
        className={`salao-ref-room-card${isSelected ? ' is-active' : ''}${isExpanded ? ' is-expanded-mode' : ''}`}
        onClick={() => handlePickRoom(camp.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handlePickRoom(camp.id); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <span className="salao-room-tag">{camp.system}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {camp.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="salao-room-players-badge">
              <Users size={11} />
              {players.length}/{MAX_PLAYERS}
            </span>
            <ChevronRight size={15} color={isSelected ? '#F2ECE1' : '#64748b'} />
          </div>
        </div>

        {/* Detalhes extras quando expandido pelo hover */}
        {isExpanded ? (
          <div className="salao-room-expanded-details">
            {isMasterSide ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Chave da Sala: <strong style={{ color: '#F2ECE1', letterSpacing: '0.08em' }}>{camp.joinKey || '—'}</strong></span>
                  <span>{camp.sheets.length} fichas • {camp.lore.length} crônicas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>Jogadores na mesa:</span>
                  {players.length > 0 ? (
                    players.map(p => (
                      <span key={p.uid} className="salao-player-pill" title={`Jogador: ${p.name}`}>
                        <User size={10} />
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                      Nenhum jogador entrou ainda
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Mestre: <strong style={{ color: '#F2ECE1' }}>{camp.masterName}</strong></span>
                  <span>{camp.sheets.length} fichas • {camp.lore.length} crônicas</span>
                </div>
                {players.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>Companheiros:</span>
                    {players.map(p => (
                      <span key={p.uid} className="salao-player-pill" style={{ opacity: p.uid === currentUser.uid ? 1 : 0.85 }}>
                        <User size={10} />
                        {p.uid === currentUser.uid ? 'Você' : p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>{isMasterSide ? `Chave: ${camp.joinKey || '—'}` : `Mestre: ${camp.masterName}`}</span>
            <span>{camp.sheets.length} fichas • {camp.lore.length} crônicas</span>
          </div>
        )}
      </div>
    );
  };

  const filteredCampaigns = campaigns.filter(c => {
    const q = roomSearch.trim().toLowerCase();
    if (q) {
      const matchName = c.name.toLowerCase().includes(q);
      const matchSystem = c.system?.toLowerCase().includes(q);
      const matchMaster = c.masterName?.toLowerCase().includes(q);
      if (!matchName && !matchSystem && !matchMaster) return false;
    }
    if (tableFilter === 'master') return c.masterId === currentUser.uid;
    if (tableFilter === 'joined') return c.masterId !== currentUser.uid;
    return true;
  });

  const handleCopyJoinKey = (key?: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setKeyCopied(true);
    tavernAudio.playBellChime();
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinKeyInput.trim() || isJoining) return;
    setIsJoining(true);
    setJoinMessage(null);
    const res = await onJoinByKey(joinKeyInput.trim());
    setIsJoining(false);
    if (res.success) {
      setIsJoinModalOpen(false);
      setJoinKeyInput('');
      tavernAudio.playToastSound();
      if (res.campaignId) onSelectCampaign(res.campaignId);
    } else {
      setJoinMessage({ type: 'error', text: res.error || 'Chave de mesa inválida ou lotada.' });
    }
  };

  return (
    <div className="tavern-cockpit-view">
      {/* COCKPIT HEADER */}
      <header className="tavern-cockpit-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
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
              <Dices size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#fef3c7', margin: 0, letterSpacing: '0.02em' }}>
                  Mesa dos Apostadores
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
                  PAINEL DE CONTROLE
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                {activeCampaign ? `Mesa ativa: ${activeCampaign.name}` : 'Gerencie campanhas, fichas e rolagens em tela única'}
              </p>
            </div>
          </div>
        </div>

        {/* CENTRO: UTENSÍLIOS E DECORAÇÕES INTERATIVAS DA TABERNA */}
        <TavernInteractiveDesk />

        {/* AÇÕES RÁPIDAS NO TOPO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="tavern-btn tavern-btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <KeyRound size={13} color="#f59e0b" />
            <span>Chave de Entrada</span>
          </button>

          <button
            onClick={() => setIsNewRoomModalOpen(true)}
            disabled={isRoomLimitReached}
            className="tavern-btn tavern-btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isRoomLimitReached ? 0.5 : 1,
              cursor: isRoomLimitReached ? 'not-allowed' : 'pointer'
            }}
            title={isRoomLimitReached ? 'Limite máximo de 3 campanhas como mestre atingido' : 'Criar nova mesa'}
          >
            <Plus size={14} />
            <span>Nova Mesa</span>
            <span style={{ fontSize: '10px', opacity: 0.85 }}>({userRoomCount}/3)</span>
          </button>
        </div>
      </header>

      {/* COCKPIT BODY: 3 COLUNAS EM TELA ÚNICA */}
      <div className="tavern-cockpit-body">
        {/* COLUNA 1: MESAS DA TABERNA */}
        <aside
          className="tavern-cockpit-panel"
          style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Topo da Coluna 1 */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(217, 119, 6, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mesas Disponíveis
              </span>
              <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>
                {campaigns.length} {campaigns.length === 1 ? 'mesa' : 'mesas'}
              </span>
            </div>

            {/* Filtros rápidos */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {(['all', 'master', 'joined'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTableFilter(tab)}
                  style={{
                    flex: 1,
                    padding: '4px 2px',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    background: tableFilter === tab ? 'rgba(217, 119, 6, 0.25)' : 'rgba(0,0,0,0.3)',
                    color: tableFilter === tab ? '#fbbf24' : '#a89a8a',
                    border: tableFilter === tab ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer'
                  }}
                >
                  {tab === 'all' ? 'Todas' : tab === 'master' ? 'Mestre' : 'Jogador'}
                </button>
              ))}
            </div>

            {/* Busca rápida */}
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#78716c' }}
              />
              <input
                type="text"
                placeholder="Filtrar por nome ou sistema..."
                value={roomSearch}
                onChange={e => setRoomSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(217, 119, 6, 0.25)',
                  borderRadius: '6px',
                  color: '#f5ecdc',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Lista com scrollbar interna fina */}
          <div className="tavern-thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {filteredCampaigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#78716c' }}>
                <p style={{ fontSize: '12px', margin: '0 0 8px 0' }}>Nenhuma mesa encontrada.</p>
                <button
                  onClick={() => setIsNewRoomModalOpen(true)}
                  disabled={isRoomLimitReached}
                  style={{
                    background: 'none',
                    border: '1px dashed rgba(217, 119, 6, 0.4)',
                    color: '#f59e0b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: isRoomLimitReached ? 'not-allowed' : 'pointer'
                  }}
                >
                  + Criar nova mesa
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredCampaigns.map(camp => {
                  const isSelected = activeCampaign?.id === camp.id;
                  const isMaster = camp.masterId === currentUser.uid;
                  return (
                    <div
                      key={camp.id}
                      onClick={() => {
                        onSelectCampaign(camp.id);
                        tavernAudio.playBellChime();
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isSelected
                          ? 'rgba(217, 119, 6, 0.18)'
                          : 'rgba(24, 16, 11, 0.75)',
                        border: isSelected
                          ? '1px solid rgba(245, 158, 11, 0.6)'
                          : '1px solid rgba(217, 119, 6, 0.12)',
                        boxShadow: isSelected ? '0 0 14px rgba(217, 119, 6, 0.2)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          {isMaster && <Crown size={12} color="#fbbf24" />}
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              fontWeight: 700,
                              color: isSelected ? '#fff' : '#f5ecdc',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '150px'
                            }}
                          >
                            {camp.name}
                          </h4>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#d6c7b2'
                          }}
                        >
                          {camp.system || 'D&D 5e'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#a89a8a' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={11} />
                          {(camp.players?.length || 0) + 1} membros
                        </span>
                        {camp.joinKey && (
                          <span style={{ fontSize: '10px', color: '#d97706', fontFamily: 'monospace' }}>
                            {camp.joinKey}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* COLUNA 2: PAINEL DA MESA ATIVA (CENTRAL) */}
        <main
          className="tavern-cockpit-panel"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {activeCampaign ? (
            <>
              {/* Barra da Mesa Ativa */}
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid rgba(217, 119, 6, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(217, 119, 6, 0.2)',
                      border: '1px solid rgba(217, 119, 6, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f59e0b'
                    }}
                  >
                    <Shield size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fef3c7' }}>
                        {activeCampaign.name}
                      </h2>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(217, 119, 6, 0.2)',
                          color: '#f59e0b',
                          fontWeight: 700
                        }}
                      >
                        {activeCampaign.system}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                      Mestre: <strong style={{ color: '#fbbf24' }}>{activeCampaign.masterName || 'Ancião'}</strong> • {activeCampaign.description || 'Campanha em andamento na Taberna Digital'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeCampaign.joinKey && (
                    <button
                      onClick={() => handleCopyJoinKey(activeCampaign.joinKey)}
                      className="tavern-btn tavern-btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      title="Copiar chave de entrada para novos jogadores"
                    >
                      <Copy size={12} color="#f59e0b" />
                      <span>{keyCopied ? 'Chave Copiada!' : `Chave: ${activeCampaign.joinKey}`}</span>
                    </button>
                  )}

                  {onOpenMasterScreen && isMasterOfActive && (
                    <button
                      onClick={() => onOpenMasterScreen(activeCampaign.id)}
                      className="tavern-btn tavern-btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      title="Abrir Tela do Mestre com ferramentas ao vivo"
                    >
                      <Maximize2 size={12} />
                      <span>Tela do Mestre</span>
                    </button>
                  )}

                  {isMasterOfActive ? (
                    <button
                      onClick={() => handleOpenEditRoom(activeCampaign)}
                      className="tavern-btn tavern-btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                      title="Editar detalhes da mesa"
                    >
                      <Edit3 size={12} />
                    </button>
                  ) : null}

                  {isMasterOfActive && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente dissolver a mesa "${activeCampaign.name}"?`)) {
                          onDeleteCampaign(activeCampaign.id);
                        }
                      }}
                      className="tavern-btn tavern-btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '11px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Dissolver mesa"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Seletor de Abas Internas da Mesa */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px 0 16px',
                  borderBottom: '1px solid rgba(217, 119, 6, 0.15)',
                  backgroundColor: 'rgba(15, 10, 7, 0.5)'
                }}
              >
                <button
                  onClick={() => setActivePartition('sheets')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    borderBottom: activePartition === 'sheets' ? '2px solid #f59e0b' : '2px solid transparent',
                    color: activePartition === 'sheets' ? '#fef3c7' : '#a89a8a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Users size={13} />
                  <span>Fichas de Personagem</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {activeCampaign.sheets?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActivePartition('lore')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    borderBottom: activePartition === 'lore' ? '2px solid #f59e0b' : '2px solid transparent',
                    color: activePartition === 'lore' ? '#fef3c7' : '#a89a8a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <BookOpen size={13} />
                  <span>Grimório & Diário de Bordo</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {activeCampaign.lore?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActivePartition('rules')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    borderBottom: activePartition === 'rules' ? '2px solid #f59e0b' : '2px solid transparent',
                    color: activePartition === 'rules' ? '#fef3c7' : '#a89a8a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={13} />
                  <span>Compêndio & Manuais PDF</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {activeCampaign.rules?.length || 0}
                  </span>
                </button>
              </div>

              {/* CONTEÚDO DA ABA SELECIONADA */}
              <div className="tavern-thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {activePartition === 'sheets' && (
                  <div>
                    {/* Ações de Fichas */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
                          Personagens Vinculados à Mesa
                        </h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                          Visualize atributos, perícias, pontos de vida e magias dos jogadores.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingSheetId(null);
                            setIsNewSheetModalOpen(true);
                          }}
                          className="tavern-btn tavern-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Plus size={13} />
                          <span>Adicionar Ficha</span>
                        </button>
                      </div>
                    </div>

                    {!activeCampaign.sheets || activeCampaign.sheets.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          border: '1px dashed rgba(217, 119, 6, 0.25)',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <Shield size={36} color="#d97706" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#fef3c7' }}>
                          Nenhuma ficha vinculada a esta mesa
                        </h4>
                        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#a89a8a', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
                          Crie a ficha do seu aventureiro ou importe um PDF preenchido para extrair atributos automaticamente.
                        </p>
                        <button
                          onClick={() => {
                            setEditingSheetId(null);
                            setIsNewSheetModalOpen(true);
                          }}
                          className="tavern-btn tavern-btn-primary"
                          style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                          Criar Primeira Ficha
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                        {activeCampaign.sheets.map(sheet => (
                          <div
                            key={sheet.id}
                            style={{
                              backgroundColor: 'rgba(20, 13, 9, 0.85)',
                              border: '1px solid rgba(217, 119, 6, 0.25)',
                              borderRadius: '10px',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <AvatarFrame
                                displayName={sheet.name}
                                size="md"
                                showTitleBadge={Boolean(sheet.level)}
                                customTitle={sheet.level ? `Nv ${sheet.level}` : undefined}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#fef3c7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {sheet.name}
                                </h4>
                                <p style={{ margin: 0, fontSize: '11px', color: '#fbbf24' }}>
                                  {sheet.class || 'Aventureiro'} {sheet.race ? `• ${sheet.race}` : ''}
                                </p>
                              </div>
                            </div>

                            {/* Vigor / Vida & CA */}
                            <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                              <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <span style={{ color: '#f87171', fontWeight: 700 }}>HP: </span>
                                <span style={{ color: '#fff' }}>{sheet.hp ?? 10} / {sheet.maxHp ?? 10}</span>
                              </div>
                              <div style={{ width: '60px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                                <span style={{ color: '#60a5fa', fontWeight: 700 }}>CA: </span>
                                <span style={{ color: '#fff' }}>{sheet.armorClass ?? 10}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
                              <button
                                onClick={() => {
                                  setEditingSheetId(sheet.id);
                                  setSheetName(sheet.name);
                                  setSheetPlayer(sheet.player || '');
                                  setSheetClass(sheet.class);
                                  setSheetLevel(sheet.level);
                                  setSheetRace(sheet.race);
                                  setSheetHp(sheet.maxHp);
                                  setSheetMp(sheet.maxMp || 10);
                                  setSheetAc(sheet.armorClass);
                                  setSheetIsNpc(Boolean(sheet.isNpc));
                                  setSheetStats(sheet.stats || DEFAULT_SHEET_STATS);
                                  setSheetCustomStats(sheet.customStats || []);
                                  setSheetTraits((sheet.traits || []).join('\n'));
                                  setSheetEquipment((sheet.equipment || []).join('\n'));
                                  setSheetNotes(sheet.notes || '');
                                  setIsNewSheetModalOpen(true);
                                }}
                                className="tavern-btn tavern-btn-secondary"
                                style={{ flex: 1, padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <Eye size={12} />
                                <span>Ver / Editar</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover ficha de "${sheet.name}"?`)) {
                                    onDeleteSheet(activeCampaign.id, sheet.id);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  cursor: 'pointer'
                                }}
                                title="Remover ficha"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activePartition === 'lore' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
                          Grimório & Crônicas da Mesa
                        </h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                          Registros históricos, pistas, mapas e rumores desvendados pelo grupo.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingLoreId(null);
                          setLoreTitle('');
                          setLoreContent('');
                          setLoreCategory('diario');
                          setLoreTags('Aventura, Mistério');
                          setIsNewLoreModalOpen(true);
                        }}
                        className="tavern-btn tavern-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={13} />
                        <span>Novo Registro</span>
                      </button>
                    </div>

                    {!activeCampaign.lore || activeCampaign.lore.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '36px',
                          border: '1px dashed rgba(217, 119, 6, 0.25)',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <BookOpen size={32} color="#d97706" style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#fef3c7' }}>
                          O Tomo desta aventura ainda está em branco
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#a89a8a' }}>
                          Registre a crônica da última sessão, nomes de estalagens, relíquias e pistas de investigação.
                        </p>
                        <button
                          onClick={() => {
                            setEditingLoreId(null);
                            setIsNewLoreModalOpen(true);
                          }}
                          className="tavern-btn tavern-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '11px' }}
                        >
                          Escrever Primeiro Registro
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeCampaign.lore.map(entry => (
                          <div
                            key={entry.id}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: 'rgba(20, 13, 9, 0.8)',
                              border: '1px solid rgba(217, 119, 6, 0.2)',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Scroll size={15} color="#f59e0b" />
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
                                  {entry.title}
                                </h4>
                                <span
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(217, 119, 6, 0.2)',
                                    color: '#fbbf24',
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {entry.category}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setEditingLoreId(entry.id);
                                    setLoreTitle(entry.title);
                                    setLoreContent(entry.content);
                                    setLoreCategory(entry.category);
                                    setLoreTags(entry.tags?.join(', ') || '');
                                    setIsNewLoreModalOpen(true);
                                  }}
                                  className="tavern-btn tavern-btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Excluir o registro "${entry.title}"?`)) {
                                      onDeleteLore(activeCampaign.id, entry.id);
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            <p style={{ margin: 0, fontSize: '12px', color: '#d6c7b2', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                              {entry.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activePartition === 'rules' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fef3c7' }}>
                          Manuais e Documentos em PDF
                        </h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#a89a8a' }}>
                          Consulte regras oficiais, suplementos e tabelas durante a partida.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingRuleId(null);
                          setRuleTitle('');
                          setRuleDesc('');
                          setRuleContent('');
                          setIsNewRuleModalOpen(true);
                        }}
                        className="tavern-btn tavern-btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={13} />
                        <span>Adicionar Manual</span>
                      </button>
                    </div>

                    {!activeCampaign.rules || activeCampaign.rules.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '36px',
                          border: '1px dashed rgba(217, 119, 6, 0.25)',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <FileText size={32} color="#d97706" style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#fef3c7' }}>
                          Nenhum documento adicionado a esta mesa
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#a89a8a' }}>
                          Adicione resumos de regras, tabelas de monstros ou suplementos para consulta direta no painel.
                        </p>
                        <button
                          onClick={() => {
                            setEditingRuleId(null);
                            setIsNewRuleModalOpen(true);
                          }}
                          className="tavern-btn tavern-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '11px' }}
                        >
                          Adicionar Regra
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activeCampaign.rules.map(doc => (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              backgroundColor: 'rgba(20, 13, 9, 0.8)',
                              border: '1px solid rgba(217, 119, 6, 0.2)',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <FileText size={18} color="#f59e0b" />
                              <div>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fef3c7' }}>
                                  {doc.title}
                                </h4>
                                <span style={{ fontSize: '10px', color: '#a89a8a' }}>
                                  {doc.category} • {doc.fileSize || '1.4 MB'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setViewingRuleDoc(doc)}
                                className="tavern-btn tavern-btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={12} />
                                <span>Abrir</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover manual "${doc.title}"?`)) {
                                    onDeleteRule(activeCampaign.id, doc.id);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ESTADO QUANDO NENHUMA MESA ESTÁ SELECIONADA */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                  marginBottom: '16px'
                }}
              >
                <Dices size={32} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fef3c7', margin: '0 0 8px 0' }}>
                O Salão dos Apostadores Aguarda Seus Dados
              </h2>
              <p style={{ fontSize: '13px', color: '#a89a8a', maxWidth: '440px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Selecione uma mesa à esquerda para gerenciar fichas e compêndios, ou funde uma nova campanha com até 3 mesas simultâneas.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsNewRoomModalOpen(true)}
                  disabled={isRoomLimitReached}
                  className="tavern-btn tavern-btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>Fundar Nova Mesa</span>
                </button>
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="tavern-btn tavern-btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <KeyRound size={14} color="#f59e0b" />
                  <span>Entrar com Chave</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* COLUNA 3: AVENTUREIROS & BANDEJA DE ROLAGENS RÁPIDA */}
        <aside
          className="tavern-cockpit-panel"
          style={{ width: '290px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Topo Coluna 3: Membros da Mesa / Aventureiros */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(217, 119, 6, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Aventureiros na Mesa
              </span>
              <span style={{ fontSize: '10px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Online
              </span>
            </div>
          </div>

          <div
            className="tavern-thin-scrollbar"
            style={{ maxHeight: '160px', overflowY: 'auto', padding: '10px', borderBottom: '1px solid rgba(217, 119, 6, 0.15)' }}
          >
            {activeCampaign ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Mestre da Mesa */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(217, 119, 6, 0.12)',
                    border: '1px solid rgba(217, 119, 6, 0.25)'
                  }}
                >
                  <AvatarFrame
                    displayName={activeCampaign.masterName || 'Mestre'}
                    size="sm"
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activeCampaign.masterName || 'Mestre da Mesa'}
                      </span>
                      <Crown size={11} color="#fbbf24" />
                    </div>
                    <span style={{ fontSize: '10px', color: '#f59e0b' }}>
                      {activeCampaign.masterId === currentUser.uid ? 'Você (Mestre)' : 'Mestre do Jogo'}
                    </span>
                  </div>
                </div>

                {/* Jogadores Conectados */}
                {activeCampaign.players && activeCampaign.players.map((p, i) => (
                  <div
                    key={p.uid || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.25)'
                    }}
                  >
                    <AvatarFrame
                      displayName={p.name || `Hero ${i}`}
                      size="sm"
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f5ecdc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name || 'Aventureiro'}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#a89a8a' }}>
                        Jogador {p.uid === currentUser.uid ? '(Você)' : ''}
                      </span>
                    </div>

                    {isMasterOfActive && p.uid !== currentUser.uid && (
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${p.name} da mesa?`)) {
                            onRemovePlayer(activeCampaign.id, p.uid);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#78716c',
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                        title="Remover jogador da mesa"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px' }}>
                <AvatarFrame displayName={currentUser.displayName || 'Você'} size="sm" />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f5ecdc' }}>
                    {currentUser.displayName || 'Você'}
                  </span>
                  <p style={{ margin: 0, fontSize: '10px', color: '#a89a8a' }}>Pronto para rolar</p>
                </div>
              </div>
            )}
          </div>

          {/* BANDEJA DE DADOS INTERATIVA */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(217, 119, 6, 0.15)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Bandeja de Rolagens
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[
                { sides: 4, label: 'd4' },
                { sides: 6, label: 'd6' },
                { sides: 8, label: 'd8' },
                { sides: 10, label: 'd10' },
                { sides: 12, label: 'd12' },
                { sides: 20, label: 'd20' },
                { sides: 100, label: 'd100' }
              ].map(die => (
                <button
                  key={die.sides}
                  onClick={() => handleRollQuickDie(die.label, die.sides)}
                  disabled={Boolean(isRollingQuick)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    backgroundColor: die.sides === 20 ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: die.sides === 20 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(217, 119, 6, 0.2)',
                    color: die.sides === 20 ? '#fbbf24' : '#f5ecdc',
                    fontWeight: 800,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isRollingQuick === die.label ? '...' : die.label}
                </button>
              ))}
            </div>
          </div>

          {/* HISTÓRICO DE ROLAGENS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: '#a89a8a', fontWeight: 700 }}>ÚLTIMOS RESULTADOS</span>
              {quickDiceHistory.length > 0 && (
                <button
                  onClick={() => setQuickDiceHistory([])}
                  style={{ background: 'none', border: 'none', color: '#78716c', fontSize: '10px', cursor: 'pointer' }}
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="tavern-thin-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px 10px' }}>
              {quickDiceHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#78716c', fontSize: '11px' }}>
                  Clique em um dado acima para rolar na mesa.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {quickDiceHistory.map((item, idx) => {
                    const isCrit = item.die === 'd20' && item.result === 20;
                    const isFumble = item.die === 'd20' && item.result === 1;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: isCrit
                            ? 'rgba(217, 119, 6, 0.2)'
                            : isFumble
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(0, 0, 0, 0.3)',
                          border: isCrit
                            ? '1px solid #f59e0b'
                            : isFumble
                            ? '1px solid #ef4444'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#d6c7b2', fontWeight: 600 }}>
                          {item.die}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 900,
                              color: isCrit ? '#fbbf24' : isFumble ? '#f87171' : '#fff'
                            }}
                          >
                            {item.result}
                          </span>
                          {isCrit && <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 800 }}>CRÍTICO!</span>}
                          {isFumble && <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 800 }}>FALHA!</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL: ENTRAR COM CHAVE DE MESA */}
      {isJoinModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsJoinModalOpen(false)}>
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '24px', maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Entrar com Chave</h3>
              </div>
              <button onClick={() => setIsJoinModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>
              Insira a chave da mesa compartilhada pelo Mestre (ex: TAB-7821).
            </p>

            {joinMessage && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '12px',
                  backgroundColor: joinMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: joinMessage.type === 'error' ? '#ef4444' : '#22c55e',
                  border: `1px solid ${joinMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                }}
              >
                {joinMessage.text}
              </div>
            )}

            <form onSubmit={handleQuickJoin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Ex: TAB-7821"
                maxLength={12}
                value={joinKeyInput}
                onChange={e => setJoinKeyInput(e.target.value.toUpperCase())}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #d97706',
                  fontSize: '16px',
                  fontWeight: 800,
                  textAlign: 'center',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase'
                }}
                required
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="tavern-btn tavern-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="tavern-btn tavern-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  {isJoining ? 'Entrando...' : 'Entrar na Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: CRIAR NOVA CAMPANHA (Limitação estrita de 3) */}
      {isNewRoomModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewRoomModalOpen(false)}>
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#0A0A0A" />
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
                color: 'var(--text-strong)'
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
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
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
                    style={{ fontSize: '10px', background: 'rgba(60, 36, 18, 0.08)', border: '1px solid var(--line-soft)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Usar Fundo da Taverna
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRoomCover('/assets/sketch_sword.jpg')}
                    style={{ fontSize: '10px', background: 'rgba(60, 36, 18, 0.08)', border: '1px solid var(--line-soft)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
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
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '26px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800 }}>{editingSheetId ? 'Editar Ficha de Personagem' : 'Criar Nova Ficha de Personagem'}</h3>

            {/* Importação automática: imagem ou PDF da ficha */}
            <div
              id="sheet-import-dropzone"
              role="button"
              tabIndex={0}
              onClick={() => importStatus !== 'reading' && sheetFileInputRef.current?.click()}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && importStatus !== 'reading') { e.preventDefault(); sheetFileInputRef.current?.click(); } }}
              onDragOver={e => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDraggingFile(false);
                if (importStatus !== 'reading') handleImportSheetFile(e.dataTransfer.files?.[0]);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', marginBottom: '14px',
                border: `1.5px dashed ${isDraggingFile ? 'var(--amber-deep)' : 'var(--line-soft)'}`,
                borderRadius: '10px',
                backgroundColor: isDraggingFile ? 'rgba(180, 83, 9, 0.12)' : 'rgba(60, 36, 18, 0.05)',
                cursor: importStatus === 'reading' ? 'progress' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={sheetFileInputRef}
                id="sheet-import-input"
                type="file"
                accept={SHEET_IMPORT_ACCEPT}
                style={{ display: 'none' }}
                onChange={e => handleImportSheetFile(e.target.files?.[0])}
              />
              {importStatus === 'reading'
                ? <Loader2 size={26} className="spin" color="var(--amber-deep)" />
                : importStatus === 'done'
                  ? <Check size={26} color="#047857" />
                  : importStatus === 'error'
                    ? <AlertCircle size={26} color="#b91c1c" />
                    : <Upload size={26} color="var(--amber-deep)" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-strong)' }}>
                  {importStatus === 'reading' ? 'Lendo a ficha com IA...' : 'Importar ficha de imagem ou PDF'}
                </div>
                <div style={{
                  fontSize: '11px', marginTop: '2px', lineHeight: 1.4,
                  color: importStatus === 'error' ? '#b91c1c' : importStatus === 'done' ? '#047857' : 'var(--text-muted)'
                }}>
                  {importMessage || 'Arraste o arquivo aqui ou clique para escolher (PNG, JPG, WEBP ou PDF • até 15 MB). Os atributos são preenchidos automaticamente.'}
                </div>
              </div>
            </div>

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
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Pontos de Vida máx. (HP):</label>
                  <input type="number" value={sheetHp} onChange={e => setSheetHp(Number(e.target.value))} className="tavern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Pontos de Magia máx. (MP):</label>
                  <input type="number" value={sheetMp} onChange={e => setSheetMp(Number(e.target.value))} className="tavern-input" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Classe de Armadura:</label>
                  <input type="number" value={sheetAc} onChange={e => setSheetAc(Number(e.target.value))} className="tavern-input" />
                </div>
              </div>

              <SheetStatsEditor
                stats={sheetStats}
                onStatsChange={setSheetStats}
                customStats={sheetCustomStats}
                onCustomStatsChange={list => { setSheetCustomStats(list); setSheetStatsError(''); }}
                error={sheetStatsError}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Características &amp; Talentos (um por linha):</label>
                  <textarea value={sheetTraits} onChange={e => setSheetTraits(e.target.value)} className="tavern-input" rows={4} style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600 }}>Equipamento (um por linha):</label>
                  <textarea value={sheetEquipment} onChange={e => setSheetEquipment(e.target.value)} className="tavern-input" rows={4} style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Anotações:</label>
                <textarea value={sheetNotes} onChange={e => setSheetNotes(e.target.value)} className="tavern-input" rows={2} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                <input type="checkbox" id="isNpcCheck" checked={sheetIsNpc} onChange={e => setSheetIsNpc(e.target.checked)} />
                <label htmlFor="isNpcCheck" style={{ fontSize: '12px', fontWeight: 600 }}>Marcar como NPC / Monstro da Taberna</label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>{editingSheetId ? 'Salvar Alterações' : 'Registrar Ficha'}</button>
                <button type="button" onClick={() => setIsNewSheetModalOpen(false)} className="btn-tavern btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LORE */}
      {isNewLoreModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewLoreModalOpen(false)}>
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '26px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800 }}>{editingLoreId ? 'Editar Crônica ou Lore da Campanha' : 'Adicionar Crônica ou Lore da Campanha'}</h3>
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
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>{editingLoreId ? 'Salvar Alterações' : 'Gravar no Grimório'}</button>
                <button type="button" onClick={() => setIsNewLoreModalOpen(false)} className="btn-tavern btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA REGRA / PDF */}
      {isNewRuleModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewRuleModalOpen(false)}>
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '26px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800 }}>{editingRuleId ? 'Editar Documento de Regras / PDF' : 'Adicionar Documento de Regras / PDF'}</h3>
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
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Descrição:</label>
                <input value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} className="tavern-input" placeholder="Ex: Guia rápido das ações disponíveis em combate" />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600 }}>Resumo Rápido para Consulta na Mesa:</label>
                <textarea rows={4} value={ruleContent} onChange={e => setRuleContent(e.target.value)} className="tavern-input" placeholder="Insira o texto das regras principais para consulta sem necessidade de abrir o PDF completo..." />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="btn-tavern btn-primary" style={{ flex: 1 }}>{editingRuleId ? 'Salvar Alterações' : 'Arquivar Regra'}</button>
                <button type="button" onClick={() => setIsNewRuleModalOpen(false)} className="btn-tavern btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE PDF / DOCUMENTO */}
      {viewingRuleDoc && (
        <div className="tavern-modal-backdrop" onClick={() => setViewingRuleDoc(null)}>
          <div className="tavern-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', color: '#111' }}>
            <div style={{ padding: '16px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#111" />
                <h4 style={{ margin: 0, color: '#111', fontSize: '16px', fontWeight: 700 }}>{viewingRuleDoc.title}</h4>
              </div>
              <button onClick={() => setViewingRuleDoc(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#ffffff', color: '#111', minHeight: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>
                  Visualizador de Documento • Página 1 de {viewingRuleDoc.pageCount || 1}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Tamanho: {viewingRuleDoc.fileSize || '1.2 MB'}
                </span>
              </div>

              <div className="font-lore" style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-line', color: '#334155' }}>
                {viewingRuleDoc.contentSnippet || viewingRuleDoc.description}
              </div>
            </div>

            <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => alert('Download do arquivo de regras iniciado!')} style={{ backgroundColor: '#111', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} />
                Baixar PDF Completo
              </button>
              <button onClick={() => setViewingRuleDoc(null)} style={{ backgroundColor: '#fff', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
