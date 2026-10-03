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
}

export interface UrdMessage {
  id: string;
  sender: 'user' | 'urd';
  text: string;
  timestamp: string;
  attachedToLore?: boolean;
}
