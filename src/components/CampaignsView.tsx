import React, { useRef, useState } from 'react';
import { 
  BookOpen, Plus, Shield, Scroll, Library, Edit3, Trash2, Heart, Zap, 
  Sparkles, FileText, ChevronRight, User, AlertCircle, Eye, Check, X,
  ExternalLink, Download, Layers, Upload, Loader2, Copy, RefreshCw, LogOut
} from 'lucide-react';
import { Campaign, CharacterSheet, CustomStat, LoreEntry, RuleDocument, UserProfile } from '../types';
import { SHEET_IMPORT_ACCEPT, extractCharacterSheetFromFile } from '../services/sheetImportService';
import { MAX_PLAYERS } from '../services/storage';
import { DefaultStats, getOrderedStats, validateCustomStats } from '../services/sheetStats';
import { SheetStatsEditor } from './SheetStatsEditor';

interface CampaignsViewProps {
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

  const renderRoomRow = (camp: Campaign) => {
    const isSelected = !!activeCampaign && activeCampaign.id === camp.id;
    return (
      <button
        key={camp.id}
        type="button"
        className={`salao-room${isSelected ? ' is-selected' : ''}`}
        onClick={() => handlePickRoom(camp.id)}
        aria-pressed={isSelected}
      >
        <span className="salao-room__system">{camp.system}</span>
        <span className="salao-room__name">{camp.name}</span>
        <span className="salao-room__meta">{camp.sheets.length} fichas • {camp.lore.length} crônicas • {(camp.players || []).length}/{MAX_PLAYERS} jogadores</span>
      </button>
    );
  };

  return (
    <>
      {/* Banner: Salão Comunal */}
      <header className="salao-hero salao-hero--mesa">
        <div className="salao-hero__inner">
          <h1 className="salao-hero__title" aria-label="Salão Comunal">
            <span className="salao-hero__line salao-hero__line--a">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">Salão</span>
              </span>
            </span>
            <span className="salao-hero__line salao-hero__line--b">
              <span className="salao-hero__mask">
                <span className="salao-hero__word">Comunal</span>
              </span>
            </span>
          </h1>
        </div>
      </header>

      {/* Duas abas verticais: juntar-se a uma mesa existente ou mestrar a sua */}
      <section className="salao-split" aria-label="Mesas">
        <div className="salao-split__panel salao-split__panel--join" id="panel-juntar">
          <span className="salao-split__eyebrow">Jogador</span>
          <h2 className="salao-split__title">Juntar-se à mesa</h2>
          <p className="salao-split__lead">Digite a chave que o mestre compartilhou com você.</p>

          <form className="join-key" onSubmit={handleJoinSubmit}>
            <label className="join-key__label" htmlFor="join-key-input">Chave da sala</label>
            <div className="join-key__row">
              <input
                id="join-key-input"
                className="join-key__input"
                type="text"
                value={joinKeyInput}
                onChange={(e) => handleJoinKeyChange(e.target.value)}
                placeholder="XXXX-XXXX"
                maxLength={9}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-describedby="join-key-message"
              />
              <button
                type="submit"
                id="join-key-submit"
                className="join-key__submit"
                disabled={isJoining || joinKeyInput.replace('-', '').length < 8}
              >
                {isJoining ? <Loader2 size={15} className="join-key__spin" /> : null}
                <span>{isJoining ? 'Entrando' : 'Entrar'}</span>
              </button>
            </div>
            <p
              id="join-key-message"
              className={`join-key__message${joinMessage ? ` is-${joinMessage.type}` : ''}`}
              role="status"
              aria-live="polite"
            >
              {joinMessage?.text || `Cada sala aceita até ${MAX_PLAYERS} jogadores.`}
            </p>
          </form>

          <div className="salao-split__list">
            {joinedCampaigns.length > 0 ? (
              joinedCampaigns.map(renderRoomRow)
            ) : (
              <p className="salao-split__empty">Você ainda não entrou em nenhuma mesa. Peça a chave ao mestre.</p>
            )}
          </div>
        </div>

        <div className="salao-split__panel salao-split__panel--master" id="panel-mestrar">
          <span className="salao-split__eyebrow">Mestre</span>
          <h2 className="salao-split__title">Mestrar</h2>
          <p className="salao-split__lead">Crie e conduza suas próprias campanhas.</p>

          <div className="salao-split__actions">
            <div
              className={`salao-hero__slots${isRoomLimitReached ? ' is-full' : ''}`}
              title={`Suas Salas: ${userRoomCount} / 3 ativas`}
            >
              <span className="salao-hero__dots" aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <span key={i} className={`salao-hero__dot${i < userRoomCount ? ' is-on' : ''}`} />
                ))}
              </span>
              <span>Suas Salas: {userRoomCount} / 3 ativas</span>
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

          <div className="salao-split__list">
            {userMasteredCampaigns.length > 0 ? (
              userMasteredCampaigns.map(renderRoomRow)
            ) : (
              <p className="salao-split__empty">Crie sua primeira campanha para começar a mestrar!</p>
            )}
          </div>
        </div>
      </section>

    <div id="sala-ativa" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px 40px', scrollMarginTop: 'calc(var(--nav-h) + 12px)' }}>

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
                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fef3c7', margin: 0 }}>
                  {activeCampaign.name}
                </h2>
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
                    style={{ padding: '8px 14px', fontSize: '11px', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(28, 22, 16, 0.85)' }}
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

          {/* Chave da sala (mestre): compartilhar, gerar nova e gerenciar jogadores */}
          {isMasterOfActive && (
            <section className="room-key" aria-label="Chave da sala e jogadores">
              <div className="room-key__main">
                <span className="room-key__label">Chave da sala</span>
                <div className="room-key__row">
                  <code className="room-key__code" id="room-key-code">{activeCampaign.joinKey || '—'}</code>
                  <button type="button" id="room-key-copy" className="room-key__btn" onClick={handleCopyKey}>
                    {keyCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{keyCopied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <button type="button" id="room-key-regenerate" className="room-key__btn" onClick={handleRegenerateKey} disabled={keyBusy}>
                    <RefreshCw size={14} />
                    <span>Gerar nova chave</span>
                  </button>
                </div>
                <p className="room-key__hint">
                  Compartilhe esta chave. Quem digitar em “Juntar-se à mesa” entra na sua sala.
                </p>
                {keyError && <p className="room-key__error" role="alert">{keyError}</p>}
              </div>

              <div className="room-key__players">
                <div className="room-key__count">
                  <span className="room-key__label">Jogadores</span>
                  <span className="room-key__number">{(activeCampaign.players || []).length}/{MAX_PLAYERS}</span>
                </div>
                <div className="room-key__seats" aria-hidden="true">
                  {Array.from({ length: MAX_PLAYERS }, (_, i) => (
                    <span key={i} className={`room-key__seat${i < (activeCampaign.players || []).length ? ' is-on' : ''}`} />
                  ))}
                </div>
                {(activeCampaign.players || []).length > 0 ? (
                  <ul className="room-key__list">
                    {(activeCampaign.players || []).map(p => (
                      <li key={p.uid} className="room-key__player">
                        <span>{p.name}</span>
                        <button
                          type="button"
                          className="room-key__remove"
                          onClick={() => handleRemovePlayer(p.uid, p.name)}
                          disabled={keyBusy}
                          aria-label={`Remover ${p.name} da sala`}
                          title="Remover da sala"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="room-key__hint">Nenhum jogador entrou ainda.</p>
                )}
                {(activeCampaign.players || []).length >= MAX_PLAYERS && (
                  <p className="room-key__hint">Sala cheia. Remova alguém para liberar uma vaga.</p>
                )}
              </div>
            </section>
          )}

          {/* Jogador: aviso e saída da mesa */}
          {isPlayerOfActive && (
            <div className="room-key room-key--player">
              <span className="room-key__hint">Você participa desta mesa como jogador.</span>
              <button type="button" id="room-leave" className="room-key__btn" onClick={handleLeaveRoom} disabled={keyBusy}>
                <LogOut size={14} />
                <span>Sair da mesa</span>
              </button>
              {keyError && <p className="room-key__error" role="alert">{keyError}</p>}
            </div>
          )}

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
                  color: '#fbbf24',
                  backgroundColor: 'rgba(146, 64, 14, 0.25)',
                  gap: '8px'
                }}
                title="Acesso exclusivo ao escudo do Mestre"
              >
                <Scroll size={16} color="var(--amber-torch)" />
                <span>Mesa de Pergaminhos</span>
                <span className="wax-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontSize: '9px', padding: '2px 5px' }}>
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
                  onClick={handleOpenNewSheet}
                  className="btn-tavern btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  Nova Ficha
                </button>
              </div>

              {activeCampaign.sheets.length === 0 ? (
                <div className="surface-card" style={{ padding: '36px', textAlign: 'center' }}>
                  <Scroll size={36} color="var(--amber-deep)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Nenhum pergaminho de personagem registrado</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                    Adicione os heróis da comitiva ou os NPCs encontrados na taberna para acompanhar seus pontos de vida e habilidades.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {activeCampaign.sheets.map(sheet => (
                    <div key={sheet.id} className="surface-card" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                              {sheet.name}
                            </h4>
                            {sheet.isNpc && (
                              <span className="wax-badge" style={{ backgroundColor: 'rgba(180, 83, 9, 0.15)', color: '#92400e', fontSize: '9px', padding: '2px 5px' }}>
                                NPC
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {sheet.race} • {sheet.class} (Nível {sheet.level})
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
                            Jogador: <strong>{sheet.player}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditSheet(sheet)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber-deep)', padding: '2px' }}
                            title="Editar Ficha"
                            aria-label={`Editar ficha de ${sheet.name}`}
                          >
                            <Edit3 size={16} />
                          </button>
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
                      </div>

                      {/* Stat Counters: HP, MP, AC */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        margin: '14px 0',
                        backgroundColor: 'rgba(60, 36, 18, 0.08)',
                        padding: '8px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <Heart size={12} fill="#ef4444" color="#ef4444" /> HP
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-strong)' }}>
                            {sheet.hp} / {sheet.maxHp}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { hp: Math.max(0, sheet.hp - 1) })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--line-soft)', background: 'rgba(60, 36, 18, 0.08)', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              -
                            </button>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { hp: Math.min(sheet.maxHp + 10, sheet.hp + 1) })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--line-soft)', background: 'rgba(60, 36, 18, 0.08)', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <Zap size={12} fill="#3b82f6" color="#3b82f6" /> Mana
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-strong)' }}>
                            {sheet.mp} / {sheet.maxMp}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { mp: Math.max(0, sheet.mp - 1) })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--line-soft)', background: 'rgba(60, 36, 18, 0.08)', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              -
                            </button>
                            <button
                              onClick={() => onUpdateSheet(activeCampaign.id, sheet.id, { mp: sheet.mp + 1 })}
                              style={{ width: '20px', height: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--line-soft)', background: 'rgba(60, 36, 18, 0.08)', cursor: 'pointer', borderRadius: '3px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <Shield size={12} /> C.A.
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-strong)' }}>
                            {sheet.armorClass}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Armadura
                          </div>
                        </div>
                      </div>

                      {/* Atributos: padrões primeiro, depois os extras */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                        gap: '4px',
                        textAlign: 'center',
                        fontSize: '11px',
                        marginBottom: '10px'
                      }}>
                        {getOrderedStats(sheet).map(({ code, value }) => (
                          <div key={code} style={{ border: '1px solid var(--line-soft)', padding: '3px', borderRadius: '4px', background: 'rgba(60, 36, 18, 0.08)' }}>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', color: 'var(--text-muted)' }}>
                              {code}
                            </span>
                            <div style={{ fontWeight: 800, fontSize: '12px' }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Equipment or Notes */}
                      {sheet.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-soft)', fontStyle: 'italic', borderTop: '1px dashed var(--line-soft)', paddingTop: '8px' }}>
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
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: '2px 0 0' }}>
                    Cronologias, mistérios, locais explorados e notas do Mestre e jogadores.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewLore}
                  className="btn-tavern btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  Nova Anotação de Lore
                </button>
              </div>

              {activeCampaign.lore.length === 0 ? (
                <div className="surface-card" style={{ padding: '36px', textAlign: 'center' }}>
                  <BookOpen size={36} color="var(--amber-deep)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Nenhum registro de crônica gravado</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                    Registre o resumo da primeira sessão ou consulte o oráculo Urd para gerar lendas para o mundo!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeCampaign.lore.map(entry => (
                    <div key={entry.id} className="surface-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="wax-badge" style={{ backgroundColor: 'rgba(245, 236, 220, 0.1)', color: 'var(--amber-glow)', fontSize: '9px' }}>
                              {entry.category.toUpperCase()}
                            </span>
                            <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                              {entry.title}
                            </h4>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            Gravado por <strong>{entry.author}</strong> em {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditLore(entry)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber-deep)', padding: '4px' }}
                            title="Editar Anotação"
                            aria-label={`Editar anotação ${entry.title}`}
                          >
                            <Edit3 size={16} />
                          </button>
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
                      </div>

                      <div className="font-lore" style={{ fontSize: '15px', color: 'var(--text-strong)', lineHeight: 1.6, margin: '14px 0', whiteSpace: 'pre-line' }}>
                        {entry.content}
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {entry.tags.map(t => (
                            <span key={t} style={{ fontSize: '10px', backgroundColor: 'rgba(180, 83, 9, 0.12)', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
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
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: '2px 0 0' }}>
                    Manuais de combate, magias e livros de regras oficiais e da casa para consulta rápida durante a sessão.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewRule}
                  className="btn-tavern btn-primary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  Adicionar Documento / PDF
                </button>
              </div>

              {activeCampaign.rules.length === 0 ? (
                <div className="surface-card" style={{ padding: '36px', textAlign: 'center' }}>
                  <Library size={36} color="var(--amber-deep)" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Nenhum documento de regras arquivado</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '4px' }}>
                    Envie guias de combate, listas de magias ou PDFs do sistema de RPG para consulta imediata na mesa.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {activeCampaign.rules.map(doc => (
                    <div key={doc.id} className="surface-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditRule(doc)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber-deep)', padding: '2px' }}
                              title="Editar Documento"
                              aria-label={`Editar documento ${doc.title}`}
                            >
                              <Edit3 size={16} />
                            </button>
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
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: '10px 0', lineHeight: 1.4 }}>
                          {doc.description}
                        </p>

                        {doc.contentSnippet && (
                          <div style={{
                            backgroundColor: 'rgba(60, 36, 18, 0.08)',
                            padding: '8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--text-strong)',
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
      ) : null}

      {/* MODAL: CRIAR NOVA CAMPANHA (Limitação estrita de 3) */}
      {isNewRoomModalOpen && (
        <div className="tavern-modal-backdrop" onClick={() => setIsNewRoomModalOpen(false)}>
          <div className="tavern-modal-content surface-card" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
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
    </>
  );
};
