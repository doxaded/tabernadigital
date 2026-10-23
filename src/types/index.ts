export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  // Personalização de Perfil de Aventureiro
  userTag?: string; // Tag única de 7 caracteres (letras e números maiúsculos, ex: K7M9P2X)
  tag?: string;
  bio?: string;
  title?: string;
  favoriteClass?: string;
  customBadgeColor?: string;
  bannerUrl?: string;
  diceTheme?: string;
}

export interface UserContact {
  uid: string;
  userTag: string;
  addedAt: string;
  isFavorite?: boolean;
}

export interface CustomChatRoom {
  id: string;
  name: string;
  description?: string;
  iconEmoji?: string;
  avatarUrl?: string;
  color?: string;
  creatorUid: string;
  creatorName: string;
  adminUids: string[];
  memberUids: string[];
  createdAt: string;
  updatedAt?: string;
}

/** Atributo extra criado pelo usuário (sigla de 3 letras maiúsculas). */
export interface CustomStat {
  code: string;
  value: number;
}

export interface CharacterSheet {
  id: string;
  campaignId: string;
  name: string;
  player: string;
  class: string;
  level: number;
  race: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  armorClass: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  /** Atributos adicionais, exibidos sempre depois dos 6 padrões. */
  customStats?: CustomStat[];
  traits: string[];
  equipment: string[];
  notes: string;
  avatarUrl?: string;
  isNpc?: boolean;
}

export interface LoreEntry {
  id: string;
  campaignId: string;
  title: string;
  category: 'diario' | 'mundo' | 'locais' | 'faccoes' | 'rumores';
  content: string;
  createdAt: string;
  tags?: string[];
  author: string;
}

export interface RuleDocument {
  id: string;
  campaignId: string;
  title: string;
  category: 'combate' | 'magia' | 'geral' | 'criaturas' | 'itens';
  description: string;
  fileUrl?: string;
  fileSize?: string;
  pageCount?: number;
  contentSnippet?: string;
  tags: string[];
}

// Jogador que entrou na sala de um mestre usando a chave
export interface RoomPlayer {
  uid: string;
  name: string;
  joinedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  system: string;
  coverUrl: string;
  masterId: string;
  masterName: string;
  createdAt: string;
  sheets: CharacterSheet[];
  lore: LoreEntry[];
  rules: RuleDocument[];
  // Chave de sala (XXXX-XXXX) que o mestre compartilha com os jogadores
  joinKey?: string;
  // Jogadores que já entraram na sala (máximo de MAX_PLAYERS)
  players?: RoomPlayer[];
}

export interface SketchCostEstimate {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostBrl: number;
  model: string;
  calculatedAt?: string;
}

export interface SketchAsset {
  id: string;
  prompt: string;
  imageUrl: string;
  category: 'item' | 'npc' | 'criatura' | 'mapa' | 'cena';
  createdAt: string;
  campaignId?: string;
  description?: string;
  modelUsed?: string;
  aspectRatio?: string;
  refinedPrompt?: string;
  costEstimate?: SketchCostEstimate;
}

export interface UrdMessage {
  id: string;
  sender: 'user' | 'urd';
  text: string;
  timestamp: string;
  attachedToLore?: boolean;
}

export interface CompendiumDoc {
  id: string;
  title: string;
  title_en: string;
  category: string;
  cr?: string;
  type?: string;
  info?: string;
  path: string;
  image?: string | null;
  content: string;
}

export interface MasterChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; category: string; path: string }>;
  diceResult?: {
    expression: string;
    rolls: number[];
    modifier: number;
    total: number;
    hasNat20?: boolean;
    hasNat1?: boolean;
  };
}

// ==========================================
// PORTAL DE CHATS — MENSAGENS E CANAIS
// ==========================================

export type ChatScope = 'campaign-public' | 'campaign-private' | 'direct' | 'group';

export interface ChatDiceResult {
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  hasNat20?: boolean;
  hasNat1?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  scope: ChatScope;
  campaignId?: string;
  campaignName?: string;
  senderUid: string;
  senderName: string;
  senderEmail?: string;
  senderTitle?: string;
  senderBadgeColor?: string;
  senderAvatarUrl?: string;
  recipientUid?: string;
  recipientName?: string;
  text: string;
  createdAt: string;
  diceResult?: ChatDiceResult;
}

export interface ChatChannel {
  id: string;
  type: ChatScope;
  title: string;
  subtitle?: string;
  campaignId?: string;
  campaignName?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  badgeColor?: string;
  directOtherUser?: UserProfile;
  customRoom?: CustomChatRoom;
  isFavorite?: boolean;
}

