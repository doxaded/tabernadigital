import React, { useRef, useState, useEffect } from 'react';
import { 
  Crown, ArrowLeft, BookOpen, Plus, Shield, Scroll, Library, Edit3, Trash2, Heart, Zap, 
  Sparkles, FileText, ChevronRight, User, Users, Maximize2, AlertCircle, Eye, Check, X,
  ExternalLink, Download, Layers, Upload, Loader2, Copy, RefreshCw, LogOut,
  Dices, Clipboard, Search, KeyRound, PanelLeftClose, PanelLeftOpen, MoreVertical
} from 'lucide-react';
import { Campaign, CharacterSheet, CustomStat, LoreEntry, RuleDocument, UserProfile } from '../types';
import { SHEET_IMPORT_ACCEPT, extractCharacterSheetFromFile } from '../services/sheetImportService';
import { MAX_PLAYERS } from '../services/storage';
import { DefaultStats, getOrderedStats, validateCustomStats } from '../services/sheetStats';
import { SheetStatsEditor } from './SheetStatsEditor';
import { TavernInteractiveDesk } from './TavernInteractiveDesk';
import { tavernAudio } from '../services/tavernAudio';
import { AvatarFrame } from './AvatarFrame';
import { GrimorioBestiarioView } from './GrimorioBestiarioView';

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
  onOpenShop?: () => void;
  onOpenMyProfile?: () => void;
  onOpenAdmin?: () => void;
  onOpenAuth?: () => void;
  hideHeader?: boolean;
  /** Ação disparada ao entrar pela galeria: abre o modal de criação ou de ingresso por chave */
  initialAction?: 'create' | 'join' | null;
  onInitialActionConsumed?: () => void;
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
  onOpenShop,
  onOpenMyProfile,
  onOpenAdmin,
  onOpenAuth,
  hideHeader = false,
  initialAction = null,
  onInitialActionConsumed,
}) => {

  // ==========================================
  // NAVEGAÇÃO EDITORIAL (AWWWARDS STYLE)
  // I = Mesas Disponíveis (Salão Principal)
  // II = Fichas de Personagem
  // III = Grimório & Diário de Bordo
  // IV = Compêndio & Manuais PDF
  // V = Bandeja de Rolagens & Aventureiros
  // ==========================================
  type ChapterId = 'I' | 'II' | 'III' | 'IV' | 'V';
  const [activeChapter, setActiveChapter] = useState<ChapterId>('I');

  const CHAPTERS: Record<ChapterId, {
    title: string;
    subtitle: string;
    bgColor: string;
    cardColor: string;
    textColor: string;
    subtextColor: string;
    accentColor: string;
    roomClass: string;
  }> = {
    'I': {
      title: 'Mesa dos Apostadores',
      subtitle: 'Salão Principal',
      bgColor: '#100905', // Ébano Profundo da Sala V unificado
      cardColor: '#1A0F09', // Bloco Fosco Padronizado
      textColor: '#EAE0D5', // Pergaminho Claro
      subtextColor: '#C9BAA9',
      accentColor: '#D4A359', // Âmbar / Ouro Velho
      roomClass: 'room-matte-I',
    },
    'II': {
      title: 'Fichas de Personagem',
      subtitle: 'Galeria dos Aventureiros',
      bgColor: '#100905', // Ébano Profundo da Sala V unificado
      cardColor: '#1A0F09',
      textColor: '#EAE0D5',
      subtextColor: '#C9BAA9',
      accentColor: '#D4A359',
      roomClass: 'room-matte-II',
    },
    'III': {
      title: 'Grimório & Bestiário',
      subtitle: 'Crônicas & Monstros',
      bgColor: '#100905', // Ébano Profundo da Sala V unificado
      cardColor: '#1A0F09',
      textColor: '#EAE0D5',
      subtextColor: '#C9BAA9',
      accentColor: '#D4A359',
      roomClass: 'room-matte-III',
    },
    'IV': {
      title: 'Compêndio & Manuais PDF',
      subtitle: 'Biblioteca de Regras',
      bgColor: '#100905', // Ébano Profundo da Sala V unificado
      cardColor: '#1A0F09',
      textColor: '#EAE0D5',
      subtextColor: '#C9BAA9',
      accentColor: '#D4A359',
      roomClass: 'room-matte-IV',
    },
    'V': {
      title: 'Bandeja de Rolagens & Aventureiros',
      subtitle: 'Oráculo dos Dados & Confraria',
      bgColor: '#100905', // Ébano Carbonizado
      cardColor: '#1A0F09',
      textColor: '#EAE0D5',
      subtextColor: '#C9BAA9',
      accentColor: '#D4A359',
      roomClass: 'room-matte-V',
    }
  };

  const currentTheme = CHAPTERS[activeChapter];

  // Partições da sala ativa: 'sheets' | 'lore' | 'rules'
  const [activePartition, setActivePartition] = useState<'sheets' | 'lore' | 'rules'>('sheets');

  // Lado expandido pelo cursor no quadro de referência: 'join' | 'master' | null
  const [expandedRefSide, setExpandedRefSide] = useState<'join' | 'master' | null>(null);

  // Barra lateral retrátil de mesas e menu contextual de fichas
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [openSheetMenuId, setOpenSheetMenuId] = useState<string | null>(null);

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

  // Redirecionamento vindo do díptico da galeria (Sala I)
  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === 'create') setIsNewRoomModalOpen(true);
    if (initialAction === 'join') setIsJoinModalOpen(true);
    onInitialActionConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);
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

  const [sheetAvatarUrl, setSheetAvatarUrl] = useState<string | undefined>(undefined);

  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetName.trim()) return;

    const statsProblem = validateCustomStats(sheetCustomStats);
    if (statsProblem) {
      setSheetStatsError(statsProblem);
      return;
    }
    setSheetStatsError('');

    const common = {
      name: sheetName.trim(),
      player: sheetPlayer.trim() || currentUser.displayName,
      class: sheetClass || 'Guerreiro',
      level: Number(sheetLevel) || 1,
      race: sheetRace || 'Humano',
      maxHp: Number(sheetHp) || 25,
      maxMp: Number(sheetMp) || 10,
      armorClass: Number(sheetAc) || 14,
      stats: { ...sheetStats },
      customStats: sheetCustomStats.map(s => ({ code: s.code, value: Number(s.value) })),
      traits: splitLines(sheetTraits),
      equipment: splitLines(sheetEquipment),
      notes: sheetNotes.trim(),
      isNpc: sheetIsNpc,
      avatarUrl: sheetAvatarUrl,
    };

    const targetCampaignId = activeCampaign ? activeCampaign.id : (campaigns[0]?.id || 'camp-default');

    if (editingSheetId && activeCampaign) {
      const existing = activeCampaign.sheets?.find(s => s.id === editingSheetId);
      onUpdateSheet(targetCampaignId, editingSheetId, {
        ...common,
        // Mantém os pontos atuais, limitados ao novo máximo
        hp: Math.min(existing?.hp ?? common.maxHp, common.maxHp),
        mp: Math.min(existing?.mp ?? common.maxMp, common.maxMp),
      });
    } else {
      onAddSheet(targetCampaignId, { ...common, hp: common.maxHp, mp: common.maxMp });
    }

    try {
      tavernAudio.playDiceRoll();
    } catch {}

    resetSheetForm();
    setEditingSheetId(null);
    setIsNewSheetModalOpen(false);
  };

  // Lê o arquivo (imagem/PDF) com IA e preenche o formulário para revisão
  const handleImportSheetFile = async (file?: File | null) => {
    if (!file) return;
    setImportStatus('reading');
    setImportMessage(`Lendo "${file.name}"...`);

    // Se for imagem, salva também como avatar do personagem
    if (file.type.startsWith('image/')) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setSheetAvatarUrl(String(e.target.result));
        };
        reader.readAsDataURL(file);
      } catch {}
    }

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
    setSheetAvatarUrl(undefined);
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
    setSheetAvatarUrl(sheet.avatarUrl);
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
    <div
      className="editorial-taberna-view min-h-screen transition-colors duration-700 ease-in-out"
      style={{
        backgroundColor: currentTheme.bgColor,
        color: currentTheme.textColor,
        fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        transition: 'background-color 700ms ease-in-out, color 700ms ease-in-out',
        paddingTop: '100px',
        paddingBottom: '80px',
        boxSizing: 'border-box',
        ['--room-bg' as any]: currentTheme.bgColor,
      }}
    >
      {/* 1. CABEÇALHO MINIMALISTA COM ALGARISMOS ROMANOS (TOP NAVIGATION) */}
      {!hideHeader && (
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: '24px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            color: currentTheme.textColor,
            transition: 'color 700ms ease-in-out',
            border: 'none',
          }}
        >
          {/* Esquerda: Nome 'TABERNA DIGITAL' em fonte serifada clássica, caixa alta e tracking-widest */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveChapter('I');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                fontSize: '18px',
                fontWeight: 600,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'inherit',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              title="Capítulo I • Salão Principal"
              className="hover:opacity-70"
            >
              TABERNA DIGITAL
            </button>
          </div>

          {/* Centro (Navegação por Capítulos): I   II   III   IV   V */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {(['I', 'II', 'III', 'IV', 'V'] as ChapterId[]).map((roman) => {
                const isActive = activeChapter === roman;
                return (
                  <button
                    key={roman}
                    onClick={() => {
                      setActiveChapter(roman);
                      tavernAudio.playBellChime();
                    }}
                    title={CHAPTERS[roman].title}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                      fontSize: '22px',
                      fontWeight: isActive ? 700 : 400,
                      opacity: isActive ? 1 : 0.35,
                      color: 'inherit',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                      transform: isActive ? 'scale(1.12)' : 'scale(1)',
                      letterSpacing: '0.08em',
                    }}
                    className="hover:opacity-70"
                  >
                    {roman}
                  </button>
                );
              })}
            </nav>
            {/* Subtítulo suave abaixo indicando o capítulo ativo */}
            <div
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '13px',
                letterSpacing: '0.06em',
                opacity: 0.75,
                transition: 'opacity 0.4s ease',
                textAlign: 'center',
              }}
            >
              {CHAPTERS[activeChapter].title}
            </div>
          </div>

          {/* Direita: Botão textual limpo 'MESA ATIVA', 'BAZAR (0 PO)' e 'PERFIL' */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => setActiveChapter('I')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'inherit',
                cursor: 'pointer',
                opacity: 0.85,
                transition: 'opacity 0.2s ease',
              }}
              title="Selecionar ou Inspecionar Mesa"
              className="hover:opacity-100"
            >
              {activeCampaign ? activeCampaign.name : 'MESA ATIVA'}
            </button>
            <button
              onClick={() => onOpenShop?.()}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'inherit',
                cursor: 'pointer',
                opacity: 0.85,
                transition: 'opacity 0.2s ease',
              }}
              title="Abrir Bazar de Itens"
              className="hover:opacity-100"
            >
              BAZAR ({currentUser.gold || 0} PO)
            </button>
            {onOpenMyProfile && (
              <button
                onClick={() => onOpenMyProfile()}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'inherit',
                  cursor: 'pointer',
                  opacity: 0.85,
                  transition: 'opacity 0.2s ease',
                }}
                title="Ver Perfil de Aventureiro"
                className="hover:opacity-100"
              >
                PERFIL
              </button>
            )}
            {currentUser.role === 'admin' && onOpenAdmin && (
              <button
                onClick={() => onOpenAdmin()}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'inherit',
                  cursor: 'pointer',
                  opacity: 0.85,
                  transition: 'opacity 0.2s ease',
                }}
                title="Painel de Administração"
                className="hover:opacity-100"
              >
                ADMIN
              </button>
            )}
          </div>
        </header>
      )}

      {/* 3. CONTAINER PRINCIPAL ESTRUTURADO (ALINHADO À ESQUERDA, ESTILO EDITORIAL / CLAUDE) */}
      <main className="editorial-room-container">
        {/* Cabeçalho Interno da Sala em Linha Única: ← Voltar à Galeria à esquerda e Sub-abas à direita */}
        <div className="editorial-header-bar">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
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

          {/* Sub-abas no estilo Segmented Control */}
          <div className="editorial-segmented-control dark-theme">
            {([
              { id: 'I', label: 'Mesa Ativa' },
              { id: 'II', label: 'Fichas' },
              { id: 'III', label: 'Grimório & Bestiário' },
              { id: 'IV', label: 'Manuais' },
              { id: 'V', label: 'Dados' },
            ] as { id: ChapterId; label: string }[]).map((tab) => {
              const isActive = activeChapter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveChapter(tab.id);
                    tavernAudio.playBellChime();
                  }}
                  className={`editorial-segmented-item ${isActive ? 'is-active' : ''}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            GUIA I: MESAS DISPONÍVEIS (SALÃO PRINCIPAL)
            ======================================================== */}
        {activeChapter === 'I' && (
          <section style={{ width: '100%', animation: 'fadeIn 0.5s ease', textAlign: 'left' }}>
            {activeCampaign ? (
              <>
                {/* 3. Layout Assimétrico Estilo Kerbache HR / Claude (Grid 8 colunas / 4 colunas) com Alturas Alinhadas */}
                <div className="editorial-grid-12" style={{ alignItems: 'stretch' }}>
                  {/* Coluna Principal (Esquerda - 8 colunas) Envolvida em Bloco Fosco Padronizado */}
                  <div 
                    className="editorial-frosted-card room-matte-I" 
                    style={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '12px', color: '#D4A359' }}>
                        CAPÍTULO I • SALÃO PRINCIPAL
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
                        {activeCampaign.name}
                      </h1>

                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                          fontStyle: 'italic',
                          fontSize: '17px',
                          lineHeight: '1.7',
                          maxWidth: '580px',
                          margin: '0 0 32px 0',
                          opacity: 0.85,
                          color: '#EAE0D5',
                        }}
                      >
                        {activeCampaign.description || 'Uma jornada aguarda pelos bravos aventureiros reunidos em torno da lareira desta taverna.'}
                      </p>
                    </div>

                    {/* Barra de Ações Limpa com Botão Excluir Mesa Restaurado */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                      {isMasterOfActive && onOpenMasterScreen && (
                        <button
                          onClick={() => onOpenMasterScreen(activeCampaign.id)}
                          className="editorial-btn-primary"
                        >
                          <Crown size={15} />
                          Tela do Mestre
                        </button>
                      )}

                      {isMasterOfActive && (
                        <button
                          onClick={() => handleOpenEditRoom(activeCampaign)}
                          className="editorial-btn-secondary"
                        >
                          <Edit3 size={14} />
                          Editar Mesa
                        </button>
                      )}

                      {isMasterOfActive && (
                        <button
                          onClick={handleRegenerateKey}
                          disabled={keyBusy}
                          className="editorial-btn-secondary"
                        >
                          <RefreshCw size={14} className={keyBusy ? 'animate-spin' : ''} />
                          {keyBusy ? 'Renovando...' : 'Renovar Chave'}
                        </button>
                      )}

                      {/* Botão de Excluir Mesa Ativa (Restaurado) */}
                      {isMasterOfActive && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja realmente apagar a mesa "${activeCampaign.name}" permanentemente? Todas as crônicas e fichas associadas serão perdidas.`)) {
                              onDeleteCampaign(activeCampaign.id);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            backgroundColor: 'rgba(127, 29, 29, 0.25)',
                            color: '#fca5a5',
                            borderRadius: '8px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(153, 27, 27, 0.4)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.25)'}
                          title="Excluir esta mesa permanentemente"
                        >
                          <Trash2 size={14} />
                          Excluir Mesa
                        </button>
                      )}

                      {!isMasterOfActive && (
                        <button
                          onClick={() => onRemovePlayer(activeCampaign.id, currentUser.uid)}
                          className="editorial-btn-secondary"
                        >
                          <LogOut size={14} />
                          Abandonar Mesa
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coluna Lateral de Metadados (Direita - 4 colunas): Card Editorial Claude Alinhado */}
                  <aside 
                    className="editorial-claude-card room-matte-I"
                    style={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.65, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
                        Registro da Mesa
                      </div>

                      <div className="editorial-meta-row">
                        <span className="editorial-meta-label">Sistema</span>
                        <span className="editorial-meta-value">{activeCampaign.system || 'Dungeons & Dragons 5e'}</span>
                      </div>

                      <div className="editorial-meta-row">
                        <span className="editorial-meta-label">Mestre</span>
                        <span className="editorial-meta-value">{activeCampaign.masterName || 'Cronista'}</span>
                      </div>

                      <div className="editorial-meta-row">
                        <span className="editorial-meta-label">Aventureiros</span>
                        <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {(activeCampaign.players?.length || 0)}/6
                        </span>
                      </div>

                      <div className="editorial-meta-row">
                        <span className="editorial-meta-label">Chave</span>
                        <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <span>{activeCampaign.joinKey || 'N/A'}</span>
                          <button
                            onClick={handleCopyKey}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '4px',
                              cursor: 'pointer',
                              color: 'inherit',
                              opacity: 0.75,
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Copiar Chave"
                            className="hover:opacity-100"
                          >
                            {keyCopied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', fontStyle: 'italic', opacity: 0.65, marginTop: '20px', lineHeight: '1.6' }}>
                      Compartilhe a chave acima para que aventureiros entrem nesta saga.
                    </div>
                  </aside>
                </div>

                {/* 4. Seção Inferior ('Outras Mesas Disponíveis') em Container Fosco Unificado */}
                <div className="editorial-frosted-panel room-matte-I">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 600, color: '#D4A359' }}>
                      Outras Mesas Disponíveis
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => setIsNewRoomModalOpen(true)}
                        className="editorial-btn-secondary"
                      >
                        <Plus size={14} />
                        Fundar Nova Mesa
                      </button>
                      <button
                        onClick={() => setIsJoinModalOpen(true)}
                        className="editorial-btn-secondary"
                      >
                        <KeyRound size={14} />
                        Ingressar por Chave
                      </button>
                    </div>
                  </div>

                  {campaigns.filter(c => c.id !== activeCampaign.id).length > 0 ? (
                    <div className="editorial-cards-grid-2">
                      {campaigns.filter(c => c.id !== activeCampaign.id).map(camp => {
                        const canDelete = camp.masterId === currentUser.uid || currentUser.role === 'admin';
                        return (
                          <div
                            key={camp.id}
                            onClick={() => {
                              onSelectCampaign(camp.id);
                              tavernAudio.playBellChime();
                            }}
                            className="editorial-campaign-card room-matte-I"
                            role="button"
                            tabIndex={0}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '18px', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {camp.name}
                              </div>
                              <div style={{ fontSize: '12px', opacity: 0.65, fontStyle: 'italic' }}>
                                Mestre: {camp.masterName || 'Cronista'} • {camp.players?.length || 0}/6 aventureiros
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                              <span className="editorial-pill-tag">
                                {camp.system || 'D&D 5e'}
                              </span>

                              {/* Botão de Excluir Mesa nas Outras Mesas */}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Deseja realmente apagar a mesa "${camp.name}"? Esta ação não pode ser desfeita.`)) {
                                      onDeleteCampaign(camp.id);
                                    }
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#f87171',
                                    opacity: 0.65,
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.65';
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                  title="Excluir mesa"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', fontSize: '15px', opacity: 0.65, margin: '8px 0' }}>
                      Não há outras mesas fundadas nesta taverna no momento.
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Caso não haja mesa ativa selecionada: Envolvido em Bloco Fosco */
              <div className="editorial-frosted-card room-matte-I" style={{ textAlign: 'left', maxWidth: '780px' }}>
                <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '12px', color: '#D4A359' }}>
                  CAPÍTULO I • SALÃO PRINCIPAL
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '38px', fontWeight: 400, margin: '0 0 16px 0', color: '#EAE0D5' }}>
                  Nenhuma Mesa Ativa
                </h1>
                <p style={{ fontStyle: 'italic', fontSize: '17px', opacity: 0.85, maxWidth: '560px', margin: '0 0 32px 0', color: '#EAE0D5' }}>
                  Funde uma nova saga como Mestre ou ingresse em uma mesa com a chave de convite fornecida pelo seu cronista.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                  <button onClick={() => setIsNewRoomModalOpen(true)} className="editorial-btn-primary">
                    <Plus size={15} />
                    Fundar Nova Mesa
                  </button>
                  <button onClick={() => setIsJoinModalOpen(true)} className="editorial-btn-secondary">
                    <KeyRound size={15} />
                    Ingressar por Chave
                  </button>
                </div>
                {campaigns.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(212, 163, 89, 0.15)', paddingTop: '24px' }}>
                    <div style={{ fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600, marginBottom: '18px', color: '#D4A359' }}>
                      Mesas Existentes na Taverna
                    </div>
                    <div className="editorial-cards-grid-2">
                      {campaigns.map(camp => (
                        <div
                          key={camp.id}
                          onClick={() => {
                            onSelectCampaign(camp.id);
                            tavernAudio.playBellChime();
                          }}
                          className="editorial-campaign-card room-matte-I"
                          role="button"
                          tabIndex={0}
                        >
                          <div>
                            <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                              {camp.name}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.65, fontStyle: 'italic' }}>
                              Mestre: {camp.masterName || 'Cronista'}
                            </div>
                          </div>
                          <span className="editorial-pill-tag">
                            {camp.system || 'D&D 5e'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            GUIA II: FICHAS DE PERSONAGEM (GALERIA DOS AVENTUREIROS)
            ======================================================== */}
        {activeChapter === 'II' && (
          <section style={{ width: '100%', animation: 'fadeIn 0.5s ease', textAlign: 'left' }}>
            {/* Header Fosco Padronizado */}
            <div 
              className="editorial-frosted-card room-matte-II"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}
            >
              <div>
                <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '8px', color: '#D4A359' }}>
                  Capítulo II • Galeria dos Aventureiros
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400, margin: '0 0 8px 0', letterSpacing: '-0.01em', color: '#EAE0D5' }}>
                  Fichas de Personagem
                </h1>
                <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.85, margin: 0, maxWidth: '580px', color: '#EAE0D5' }}>
                  Toque no retrato para contemplar e registrar os feitos do herói.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={handleOpenNewSheet} className="editorial-btn-primary">
                  <Plus size={15} />
                  Nova Ficha
                </button>
                <button onClick={() => sheetFileInputRef.current?.click()} className="editorial-btn-secondary">
                  <Upload size={14} />
                  Importar via IA
                </button>
              </div>
            </div>

            {/* Grid de Fichas alinhado à esquerda */}
            {activeCampaign && activeCampaign.sheets && activeCampaign.sheets.length > 0 ? (
              <div className="editorial-cards-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
                {activeCampaign.sheets.map((sheet) => {
                  const portraitSrc = sheet.avatarUrl || '/assets/tavern_bg.jpg';
                  return (
                    <div
                      key={sheet.id}
                      onClick={() => handleOpenEditSheet(sheet)}
                      className="editorial-claude-card"
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', gap: '18px', alignItems: 'center' }}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        style={{
                          width: '74px',
                          height: '92px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={portraitSrc}
                          alt={sheet.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'sepia(18%) contrast(102%)',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/tavern_bg.jpg';
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '20px', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sheet.name}
                        </div>
                        <div style={{ fontStyle: 'italic', fontSize: '13px', opacity: 0.75, marginBottom: '8px' }}>
                          {sheet.race || 'Humano'} • {sheet.class || 'Aventureiro'}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            opacity: 0.85,
                            display: 'flex',
                            gap: '8px',
                          }}
                        >
                          <span className="editorial-pill-tag" style={{ padding: '2px 8px', fontSize: '10px' }}>HP {sheet.hp}/{sheet.maxHp}</span>
                          <span className="editorial-pill-tag" style={{ padding: '2px 8px', fontSize: '10px' }}>CA {sheet.armorClass || 10}</span>
                          <span className="editorial-pill-tag" style={{ padding: '2px 8px', fontSize: '10px' }}>NV {sheet.level}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="editorial-claude-card" style={{ padding: '36px', textAlign: 'left' }}>
                <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.75, margin: '0 0 16px 0' }}>
                  Nenhum retrato adorna a galeria desta mesa ainda.
                </p>
                <button onClick={handleOpenNewSheet} className="editorial-btn-secondary">
                  <Plus size={14} />
                  Criar Primeiro Aventureiro
                </button>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
        {/* ========================================================
            GUIA III: GRIMÓRIO DE RPG & BESTIÁRIO (D&D 2024 & CRÔNICAS)
            ======================================================== */}
        {activeChapter === 'III' && (
          <section style={{ width: '100%', animation: 'fadeIn 0.5s ease', textAlign: 'left' }}>
            <GrimorioBestiarioView
              activeCampaignId={activeCampaign?.id}
              loreEntries={activeCampaign?.lore || []}
              onAddLore={() => {
                setEditingLoreId(null);
                setLoreTitle('');
                setLoreContent('');
                setLoreTags('Aventura, Mistério');
                setIsNewLoreModalOpen(true);
              }}
              onEditLore={handleOpenEditLore}
              onDeleteLore={(loreId) => {
                if (activeCampaign) {
                  onDeleteLore(activeCampaign.id, loreId);
                }
              }}
            />
          </section>
        )}

        {/* ========================================================
            GUIA IV: COMPÊNDIO & MANUAIS PDF
            ======================================================== */}
        {activeChapter === 'IV' && (
          <section style={{ width: '100%', animation: 'fadeIn 0.5s ease', textAlign: 'left' }}>
            <div className="editorial-grid-12" style={{ alignItems: 'start' }}>
              {/* Coluna Principal (8 colunas) Envolvida em Bloco Fosco */}
              <div className="editorial-frosted-card room-matte-IV">
                <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '8px', color: '#D4A359' }}>
                  Capítulo IV • Biblioteca de Regras
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400, margin: '0 0 8px 0', letterSpacing: '-0.01em', color: '#EAE0D5' }}>
                  Compêndio & Manuais PDF
                </h1>
                <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.85, margin: '0 0 24px 0', maxWidth: '580px', color: '#EAE0D5' }}>
                  Manuais de apoio, suplementos e documentos de regras catalogados para a mesa.
                </p>

                <div style={{ marginBottom: '28px' }}>
                  <button
                    onClick={() => {
                      setEditingRuleId(null);
                      setRuleTitle('');
                      setRuleDesc('');
                      setRuleContent('');
                      setRuleFileName('Livro_Regras_Apoio.pdf');
                      setIsNewRuleModalOpen(true);
                    }}
                    className="editorial-btn-primary"
                  >
                    <Plus size={15} />
                    Anexar Novo Manual
                  </button>
                </div>

                {activeCampaign && activeCampaign.rules && activeCampaign.rules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activeCampaign.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="editorial-campaign-card room-matte-IV"
                        style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="editorial-pill-tag">
                            {rule.category || 'Geral'} • {rule.fileSize || 'PDF'}
                          </span>
                          <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                            <button
                              onClick={() => handleOpenEditRule(rule)}
                              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => onDeleteRule(activeCampaign.id, rule.id)}
                              style={{ background: 'none', border: 'none', padding: 0, color: '#fca5a5', cursor: 'pointer', textDecoration: 'underline', opacity: 0.8 }}
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        <h3 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: '22px', fontWeight: 600, margin: '0 0 8px 0', color: '#EAE0D5' }}>
                          {rule.title}
                        </h3>

                        <p style={{ fontStyle: 'italic', fontSize: '15px', lineHeight: '1.6', opacity: 0.85, margin: '0 0 16px 0', color: '#EAE0D5' }}>
                          {rule.description || 'Manual de referência rápida de mecânicas e magias.'}
                        </p>

                        <button
                          onClick={() => setViewingRuleDoc(rule)}
                          className="editorial-btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '12px', alignSelf: 'flex-start' }}
                        >
                          <BookOpen size={13} />
                          Folhear Documento
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="editorial-claude-card room-matte-IV" style={{ padding: '28px' }}>
                    <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.75, margin: 0, color: '#EAE0D5' }}>
                      Nenhum compêndio ou manual foi anexado a este salão até o momento.
                    </p>
                  </div>
                )}
              </div>

              {/* Coluna Lateral (4 colunas) */}
              <aside className="editorial-claude-card room-matte-IV">
                <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.65, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
                  Estante de Regras
                </div>
                <div className="editorial-meta-row">
                  <span className="editorial-meta-label">Manuais Ativos</span>
                  <span className="editorial-meta-value">{activeCampaign?.rules?.length || 0}</span>
                </div>
                <div className="editorial-meta-row">
                  <span className="editorial-meta-label">Formato</span>
                  <span className="editorial-meta-value">PDF & Texto</span>
                </div>
                <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.6', marginTop: '16px', marginBottom: 0 }}>
                  Guarde fichas de referência rápida, grimórios de feitiços e suplementos para consulta instantânea durante a sessão de RPG.
                </p>
              </aside>
            </div>
          </section>
        )}

        {/* ========================================================
            GUIA V: BANDEJA DE ROLAGENS & AVENTUREIROS
            ======================================================== */}
        {activeChapter === 'V' && (
          <section style={{ width: '100%', animation: 'fadeIn 0.5s ease', textAlign: 'left' }}>
            <div className="editorial-grid-12" style={{ alignItems: 'start' }}>
              {/* Coluna Principal (8 colunas) Envolvida em Bloco Fosco */}
              <div className="editorial-frosted-card room-matte-V">
                <div style={{ letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', opacity: 0.65, marginBottom: '8px', color: '#D4A359' }}>
                  Capítulo V • Oráculo dos Dados & Confraria
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif", fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 400, margin: '0 0 8px 0', letterSpacing: '-0.01em', color: '#EAE0D5' }}>
                  Bandeja de Rolagens
                </h1>
                <p style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.85, margin: '0 0 28px 0', maxWidth: '580px', color: '#EAE0D5' }}>
                  Toque nos dados para que a sorte decida o destino da sua aventura.
                </p>

                {/* Linha Minimalista de Dados estilo botões secundários */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
                  {[
                    { name: 'd4', sides: 4 },
                    { name: 'd6', sides: 6 },
                    { name: 'd8', sides: 8 },
                    { name: 'd10', sides: 10 },
                    { name: 'd12', sides: 12 },
                    { name: 'd20', sides: 20 },
                    { name: 'd100', sides: 100 },
                  ].map(({ name, sides }) => (
                    <button
                      key={name}
                      onClick={() => handleRollQuickDie(name, sides)}
                      disabled={isRollingQuick !== null}
                      className="editorial-btn-secondary"
                      style={{
                        padding: '10px 18px',
                        fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
                        fontSize: '18px',
                        fontWeight: 600,
                        opacity: isRollingQuick === name ? 0.4 : 1,
                      }}
                    >
                      <Dices size={16} />
                      {name}
                    </button>
                  ))}
                </div>

                {/* Resultado em Destaque Alinhado à Esquerda */}
                <div className="editorial-claude-card room-matte-V" style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '24px' }}>
                  {quickDiceHistory.length > 0 ? (
                    <div>
                      <div
                        style={{
                          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                          fontSize: 'clamp(56px, 10vw, 84px)',
                          fontWeight: 700,
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                          color: '#D4A359',
                          marginBottom: '8px',
                        }}
                      >
                        {quickDiceHistory[0].result}
                      </div>
                      <div style={{ fontStyle: 'italic', fontSize: '14px', opacity: 0.8, color: '#EAE0D5' }}>
                        O {quickDiceHistory[0].die.toUpperCase()} rolou sobre a madeira às {quickDiceHistory[0].time}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontStyle: 'italic', fontSize: '16px', opacity: 0.65, color: '#EAE0D5' }}>
                      Aguardando a primeira rolagem sobre a mesa...
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Lateral (4 colunas) */}
              <aside className="editorial-claude-card room-matte-V">
                <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.65, marginBottom: '14px', fontWeight: 600, color: '#D4A359' }}>
                  Histórico Recente
                </div>
                {quickDiceHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {quickDiceHistory.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="editorial-meta-row">
                        <span className="editorial-meta-label">{item.die.toUpperCase()} • {item.time}</span>
                        <span className="editorial-meta-value" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: idx === 0 ? '#D4A359' : '#EAE0D5' }}>
                          {item.result}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.75, margin: 0 }}>
                    Nenhum dado lançado na sessão atual.
                  </p>
                )}
              </aside>
            </div>
          </section>
        )}
      </main>

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
          <div className="tavern-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', padding: '0', backgroundColor: '#1C110B', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(212, 163, 89, 0.25)', color: '#EAE0D5', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
            <div style={{ padding: '16px 20px', background: '#251710', borderBottom: '1px solid rgba(212, 163, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#D4A359" />
                <h4 style={{ margin: 0, color: '#F5E6D3', fontSize: '16px', fontWeight: 700, fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.04em' }}>{viewingRuleDoc.title}</h4>
              </div>
              <button onClick={() => setViewingRuleDoc(null)} style={{ background: 'none', border: 'none', color: '#B89F86', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#1C110B', color: '#EAE0D5', minHeight: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212, 163, 89, 0.12)', paddingBottom: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#D4A359' }}>
                  Visualizador de Documento • Página 1 de {viewingRuleDoc.pageCount || 1}
                </span>
                <span style={{ fontSize: '11px', color: '#A89A85' }}>
                  Tamanho: {viewingRuleDoc.fileSize || '1.2 MB'}
                </span>
              </div>

              <div className="font-lore" style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-line', color: '#EAE0D5' }}>
                {viewingRuleDoc.contentSnippet || viewingRuleDoc.description}
              </div>
            </div>

            <div style={{ padding: '14px 20px', background: '#251710', borderTop: '1px solid rgba(212, 163, 89, 0.15)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => alert('Download do arquivo de regras iniciado!')} style={{ backgroundColor: '#D4A359', color: '#160E0A', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} />
                Baixar PDF Completo
              </button>
              <button onClick={() => setViewingRuleDoc(null)} style={{ backgroundColor: 'transparent', color: '#E6CCB2', border: '1px solid rgba(212, 163, 89, 0.25)', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
