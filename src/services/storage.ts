import {
  Campaign,
  CharacterSheet,
  ChatMessage,
  CustomChatRoom,
  LoreEntry,
  RoomPlayer,
  RuleDocument,
  SketchAsset,
  UrdMessage,
  UserContact,
  UserProfile
} from '../types';

export const ADMIN_EMAIL = 'henrique.v.berbert@gmail.com';
export const DEFAULT_MASTER_PASSWORD = 'TabernaMestre2026!';

// Limite de jogadores por sala (o mestre não conta)
export const MAX_PLAYERS = 8;

// Alfabeto sem caracteres ambíguos (sem 0/O, 1/I) para a chave ser fácil de ditar e digitar
const JOIN_KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Gera uma chave de sala no formato XXXX-XXXX
export function generateJoinKey(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, b => JOIN_KEY_ALPHABET[b % JOIN_KEY_ALPHABET.length]);
  return chars.slice(0, 4).join('') + '-' + chars.slice(4).join('');
}

// Normaliza o que o jogador digitou (minúsculas, espaços, sem hífen) para XXXX-XXXX.
// Retorna null se não tiver 8 caracteres válidos.
export function normalizeJoinKey(raw: string): string | null {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 8) return null;
  return clean.slice(0, 4) + '-' + clean.slice(4);
}

/**
 * Gera uma tag única de 7 caracteres (contendo variação entre letras maiúsculas e números).
 * Exemplo: K7M9P2X, T4H9R2K, etc.
 */
export function generateUserTag(existingTags: string[] = []): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const all = letters + numbers;

  let tag = '';
  let attempts = 0;
  do {
    // Garante que tenha variação real: pelo menos 2 letras e 2 números
    const chars: string[] = [
      letters[Math.floor(Math.random() * letters.length)],
      letters[Math.floor(Math.random() * letters.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
    ];
    while (chars.length < 7) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }
    // Embaralha para que os números e letras fiquem espalhados
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    tag = chars.join('');
    attempts++;
  } while (existingTags.includes(tag) && attempts < 1000);

  return tag;
}

/**
 * Normaliza a tag digitada (remove #, espaços e converte para maiúsculas).
 */
export function normalizeUserTag(raw: string): string {
  return raw.trim().toUpperCase().replace(/^#/, '').replace(/\s+/g, '');
}

const STORAGE_KEYS = {
  USERS: 'taberna_users_v1',
  CURRENT_USER: 'taberna_current_user_v1',
  CAMPAIGNS: 'taberna_campaigns_v1',
  SKETCHES: 'taberna_sketches_v1',
  URD_MESSAGES: 'taberna_urd_messages_v1',
  PASSWORDS: 'taberna_passwords_v1',
  CHATS: 'taberna_chats_v1',
  USER_CONTACTS: 'taberna_user_contacts_v1',
  CUSTOM_ROOMS: 'taberna_custom_rooms_v1',
};

const DEFAULT_PASSWORDS: Record<string, string> = {
  [ADMIN_EMAIL.toLowerCase()]: DEFAULT_MASTER_PASSWORD,
  'thorin.escudo@taberna.rpg': '123456',
  'lyanna.sombra@taberna.rpg': '123456',
  'garrick.bardo@taberna.rpg': '123456',
};

// Dados padrão iniciais com perfis personalizados e tags de 7 caracteres
const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'admin-henrique',
    email: ADMIN_EMAIL,
    displayName: 'Henrique Berbert',
    role: 'admin',
    status: 'APPROVED',
    createdAt: '2026-10-01T12:00:00Z',
    approvedAt: '2026-10-01T12:00:00Z',
    userTag: 'K7M9P2X',
    tag: 'K7M9P2X',
    title: 'Mestre da Estalagem',
    favoriteClass: 'Mestre & Mago',
    customBadgeColor: '#d97706',
    bio: 'Guardião supremo da Taberna Digital. Conduz sagas épicas e guarda os tomos ancestrais do mundo.',
    diceTheme: 'Dourado Nobre'
  },
  {
    uid: 'user-thorin',
    email: 'thorin.escudo@taberna.rpg',
    displayName: 'Thorin Quebra-Machado',
    role: 'user',
    status: 'APPROVED',
    createdAt: '2026-10-02T10:30:00Z',
    approvedAt: '2026-10-02T11:00:00Z',
    approvedBy: ADMIN_EMAIL,
    userTag: 'T4H9R2K',
    tag: 'T4H9R2K',
    title: 'O Quebra-Machado',
    favoriteClass: 'Guerreiro / Patrulheiro',
    customBadgeColor: '#dc2626',
    bio: 'Veterano das montanhas de ferro. Leal aos seus aliados e devastador em combate próximo.',
    diceTheme: 'Rubi Forjado'
  },
  {
    uid: 'user-lyanna',
    email: 'lyanna.sombra@taberna.rpg',
    displayName: 'Lyanna Sombra-da-Noite',
    role: 'user',
    status: 'PENDING',
    createdAt: '2026-10-02T20:15:00Z',
    userTag: 'L8Y3N4S',
    tag: 'L8Y3N4S',
    title: 'A Silenciosa',
    favoriteClass: 'Ladino / Sombra',
    customBadgeColor: '#7c3aed',
    bio: 'Especialista em invasão furtiva e decifração de fechaduras antigas. Nunca deixa pegadas.',
    diceTheme: 'Ametista Arcana'
  },
  {
    uid: 'user-garrick',
    email: 'garrick.bardo@taberna.rpg',
    displayName: 'Garrick das Sete Cordas',
    role: 'user',
    status: 'PENDING',
    createdAt: '2026-10-02T21:00:00Z',
    userTag: 'G7R2K9B',
    tag: 'G7R2K9B',
    title: 'O Menestrel Andarilho',
    favoriteClass: 'Bardo do Conhecimento',
    customBadgeColor: '#059669',
    bio: 'Encanta tavernas com canções de heroísmo e segredos sussurrados. Uma caneca cheia sempre garante uma boa história.',
    diceTheme: 'Esmeralda Silvestre'
  }
];

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'A Sombra da Floresta Sussurrante',
    description: 'Antigas ruínas élficas despertaram no coração da mata. Criaturas de galhos retorcidos cercam as caravanas comerciais da fronteira.',
    system: 'Dungeons & Dragons 5e',
    coverUrl: '/assets/tavern_bg.jpg',
    masterId: 'admin-henrique',
    masterName: 'Henrique Berbert (Mestre)',
    createdAt: '2026-10-01T14:00:00Z',
    sheets: [
      {
        id: 'sheet-1',
        campaignId: 'camp-1',
        name: 'Kaelen Lua-de-Prata',
        player: 'Thorin Quebra-Machado',
        class: 'Ladino / Patrulheiro',
        level: 4,
        race: 'Meio-Elfo',
        hp: 34,
        maxHp: 34,
        mp: 12,
        maxMp: 12,
        armorClass: 16,
        stats: { strength: 10, dexterity: 18, constitution: 14, intelligence: 12, wisdom: 14, charisma: 10 },
        traits: ['Visão no Escuro', 'Ataque Furtivo (2d6)', 'Sentidos Aguçados', 'Evasão'],
        equipment: ['Arco Longo Élfico', 'Adaga Envenenada de Mithral', 'Armadura de Couro Batido', 'Corda de Seda (15m)'],
        notes: 'Busca vingança contra o Culto da Casca Negra após a destruição do posto avançado de Val-Sombria.',
        avatarUrl: '/assets/sketch_sword.jpg',
        isNpc: false,
      },
      {
        id: 'sheet-2',
        campaignId: 'camp-1',
        name: 'Irmão Donald, O Inabalável',
        player: 'Mestre da Mesa (NPC)',
        class: 'Clérigo da Luz',
        level: 5,
        race: 'Humano',
        hp: 42,
        maxHp: 42,
        mp: 20,
        maxMp: 20,
        armorClass: 18,
        stats: { strength: 16, dexterity: 10, constitution: 15, intelligence: 10, wisdom: 17, charisma: 13 },
        traits: ['Canalizar Divindade', 'Chama Sagrada', 'Escudo da Fé'],
        equipment: ['Maça de Guerra Abençoada', 'Cota de Malha Pesada', 'Símbolo Sagrado de Latão'],
        notes: 'Guardião do templo local. Está disposto a curar ferimentos em troca de orações e apoio ao orfanato da aldeia.',
        isNpc: true,
      }
    ],
    lore: [
      {
        id: 'lore-1',
        campaignId: 'camp-1',
        title: 'Sessão 01: O Ataque na Ponte do Salgueiro',
        category: 'diario',
        author: 'Henrique Berbert',
        createdAt: '2026-10-01T20:30:00Z',
        tags: ['Combate', 'Emboscada', 'Goblins'],
        content: `A comitiva partiu ao entardecer sob forte neblina. Próximo ao marco de pedra da velha ponte de madeira, galhos caídos bloquearam a passagem da carroça de suprimentos. 
Três goblins montados em lobos cinzentos atacaram das margens pantanosas. Kaelen conseguiu abater o batedor com uma flecha precisa no olho, mas o mercador Borin foi ferido no ombro. 
Encontraram com o líder dos goblins uma moeda com o selo gravado de um corvo de três asas.`
      },
      {
        id: 'lore-2',
        campaignId: 'camp-1',
        title: 'A Lenda da Cidadela Submersa de Ilhar',
        category: 'mundo',
        author: 'Henrique Berbert',
        createdAt: '2026-10-02T11:00:00Z',
        tags: ['História Antiga', 'Magia Perdida'],
        content: `Dizem os anciãos que há 400 anos, antes do Grande Rompimento, a Cidadela de Ilhar abrigava os maiores tecelões de runas do continente. 
Quando a represa das montanhas cedeu misteriosamente em uma única noite de luar escarlate, a cidade foi engolida pelas águas negras do lago. Rumores afirmam que as tochas dos corredores submersos continuam ardendo sob feitiço perpétuo.`
      }
    ],
    rules: [
      {
        id: 'rule-1',
        campaignId: 'camp-1',
        title: 'Guia Rápido de Ações de Combate (D&D 5e)',
        category: 'combate',
        description: 'Resumo oficial das ações permitidas por turno: Ação, Ação Bônus, Reação, Desengajar, Disparar e Ajudar.',
        fileSize: '1.2 MB (PDF)',
        pageCount: 4,
        tags: ['Combate', 'Iniciativa', 'Reações'],
        contentSnippet: `No seu turno de combate, você pode se deslocar uma distância até o seu deslocamento e realizar uma ação principal. 
Ações disponíveis: Atacar, Conjurar Magia, Disparar, Desengajar, Esquivar, Ajudar, Esconder-se, Procurar ou Usar um Objeto.`
      },
      {
        id: 'rule-2',
        campaignId: 'camp-1',
        title: 'Regras da Casa: Descanso Rápido e Fadiga Realista',
        category: 'geral',
        description: 'Adaptação do Mestre para deixar a sobrevivência na mata mais tensa e recompensadora.',
        fileSize: '340 KB (PDF)',
        pageCount: 2,
        tags: ['Homebrew', 'Descanso', 'Sobrevivência'],
        contentSnippet: `1. Descansos Curtos duram 2 horas e requerem consumo de 1 ração de viagem e água limpa.
2. Descansos Longos em áreas selvagens hostis só recuperam metade dos Dados de Vida a menos que um acampamento fortificado seja montado.`
      }
    ]
  },
  {
    id: 'camp-2',
    name: 'A Cripta Esquecida de Valdor',
    description: 'Catacumbas subterrâneas sob uma antiga abadia abandonada guardam um artefato que pode conter a praga da podridão.',
    system: 'Tormenta 20',
    coverUrl: '/assets/tavern_bg.jpg',
    masterId: 'admin-henrique',
    masterName: 'Henrique Berbert (Mestre)',
    createdAt: '2026-10-02T16:00:00Z',
    sheets: [],
    lore: [],
    rules: []
  }
];

const DEFAULT_SKETCHES: SketchAsset[] = [
  {
    id: 'sketch-1',
    prompt: 'Espada mágica antiga cravada no pedestal de pedra com inscrições rúnicas',
    imageUrl: '/assets/sketch_sword.jpg',
    category: 'item',
    createdAt: '2026-10-02T18:00:00Z',
    campaignId: 'camp-1',
    modelUsed: 'gemini-3.1-flash-image',
    description: 'Traço minucioso em grafite sobre pergaminho envelhecido revelando runas arcanas cravadas no gume de aço forjado.'
  },
  {
    id: 'sketch-2',
    prompt: 'Retrato de Urd, o experiente taberneiro medieval com barba trançada e caneca de madeira',
    imageUrl: '/assets/urd_portrait.jpg',
    category: 'npc',
    createdAt: '2026-10-02T19:30:00Z',
    modelUsed: 'gemini-3.1-flash-image',
    description: 'Retrato em nanquim e sombreamento cruzado do taberneiro de cinquenta invernos com olhar astuto e caneca entalhada.'
  }
];

const DEFAULT_URD_MESSAGES: UrdMessage[] = [
  {
    id: 'urd-init',
    sender: 'urd',
    text: `Salve, forasteiro! Sede bem-vindo à Taberna Digital. Sou Urd, e há cinquenta invernos ouço rumores de masmorras, dragões e traições. Que vos traz aqui hoje?`,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
];

const DEFAULT_CHATS: ChatMessage[] = [
  {
    id: 'seed-chat-1',
    channelId: 'camp_camp-1_public',
    scope: 'campaign-public',
    campaignId: 'camp-1',
    campaignName: 'A Sombra da Floresta Sussurrante',
    senderUid: 'admin-henrique',
    senderName: 'Henrique Berbert',
    senderTitle: 'Mestre da Estalagem',
    senderBadgeColor: '#d97706',
    text: 'Saudações, bravos aventureiros! Sejam bem-vindos ao Salão Geral da campanha. Preparem suas magias e equipamentos para a travessia das ruínas élficas.',
    createdAt: '2026-10-02T14:10:00Z',
  },
  {
    id: 'seed-chat-2',
    channelId: 'camp_camp-1_public',
    scope: 'campaign-public',
    campaignId: 'camp-1',
    campaignName: 'A Sombra da Floresta Sussurrante',
    senderUid: 'user-thorin',
    senderName: 'Thorin Quebra-Machado',
    senderTitle: 'O Quebra-Machado',
    senderBadgeColor: '#dc2626',
    text: 'Meu machado e meu arco estão prontos! Rolei minha iniciativa de prontidão.',
    createdAt: '2026-10-02T14:15:00Z',
    diceResult: {
      expression: '1d20+2',
      rolls: [16],
      modifier: 2,
      total: 18,
      hasNat20: false,
      hasNat1: false,
    },
  },
  {
    id: 'seed-chat-3',
    channelId: 'camp_camp-1_whisper_admin-henrique_user-thorin',
    scope: 'campaign-private',
    campaignId: 'camp-1',
    campaignName: 'A Sombra da Floresta Sussurrante',
    senderUid: 'admin-henrique',
    senderName: 'Henrique Berbert',
    senderTitle: 'Mestre da Estalagem',
    senderBadgeColor: '#d97706',
    recipientUid: 'user-thorin',
    recipientName: 'Thorin Quebra-Machado',
    text: '[Sussurro Secreto] Thorin, sob o cabo da adaga de mithral que você resgatou na ponte há marcas de um clã anão desaparecido.',
    createdAt: '2026-10-02T15:00:00Z',
  },
  {
    id: 'seed-chat-4',
    channelId: 'camp_camp-1_whisper_admin-henrique_user-thorin',
    scope: 'campaign-private',
    campaignId: 'camp-1',
    campaignName: 'A Sombra da Floresta Sussurrante',
    senderUid: 'user-thorin',
    senderName: 'Thorin Quebra-Machado',
    senderTitle: 'O Quebra-Machado',
    senderBadgeColor: '#dc2626',
    recipientUid: 'admin-henrique',
    recipientName: 'Henrique Berbert',
    text: 'Entendido, Mestre! Vou examiná-la discretamente na próxima fogueira.',
    createdAt: '2026-10-02T15:04:00Z',
  },
  {
    id: 'seed-chat-5',
    channelId: 'dm_admin-henrique_user-thorin',
    scope: 'direct',
    senderUid: 'user-thorin',
    senderName: 'Thorin Quebra-Machado',
    senderTitle: 'O Quebra-Machado',
    senderBadgeColor: '#dc2626',
    recipientUid: 'admin-henrique',
    recipientName: 'Henrique Berbert',
    text: 'Olá Henrique! Atualizei a história de fundo do meu personagem com as novas diretrizes.',
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'seed-chat-6',
    channelId: 'dm_admin-henrique_user-thorin',
    scope: 'direct',
    senderUid: 'admin-henrique',
    senderName: 'Henrique Berbert',
    senderTitle: 'Mestre da Estalagem',
    senderBadgeColor: '#d97706',
    recipientUid: 'user-thorin',
    recipientName: 'Thorin Quebra-Machado',
    text: 'Excelente! A personalização do perfil ficou fantástica. Nos vemos na mesa!',
    createdAt: '2026-10-03T10:12:00Z',
  },
];

export const storageService = {
  // Usuários
  getUsers(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users = DEFAULT_USERS;
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      users = JSON.parse(raw);
    } catch {
      users = DEFAULT_USERS;
    }

    // Garante que campos de personalização e userTag única de 7 caracteres existam mesmo se vierem do cache antigo
    let updated = false;
    const existingTags = users
      .map(u => (u.userTag ? normalizeUserTag(u.userTag) : ''))
      .filter(t => t.length === 7);

    users = users.map(u => {
      const def = DEFAULT_USERS.find(d => d.uid === u.uid || d.email.toLowerCase() === u.email.toLowerCase());
      let t = u.userTag || u.tag;
      if (!t || t.length !== 7) {
        if (def?.userTag) {
          t = def.userTag;
        } else {
          t = generateUserTag(existingTags);
        }
        existingTags.push(t);
        updated = true;
      }

      if (def && (!u.title || !u.customBadgeColor || !u.favoriteClass || !u.userTag)) {
        updated = true;
        return {
          ...def,
          ...u,
          userTag: t,
          tag: t,
          title: u.title || def.title,
          favoriteClass: u.favoriteClass || def.favoriteClass,
          customBadgeColor: u.customBadgeColor || def.customBadgeColor,
          bio: u.bio || def.bio,
          diceTheme: u.diceTheme || def.diceTheme,
        };
      }

      if (u.userTag !== t || u.tag !== t) {
        updated = true;
        return {
          ...u,
          userTag: t,
          tag: t
        };
      }

      return u;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  },

  updateUserProfile(uid: string, updates: Partial<UserProfile>): UserProfile | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.uid === uid);
    if (idx === -1) return null;

    // Não permite alterar status ou role por este método de perfil
    const { status: _s, role: _r, ...safeUpdates } = updates;
    const updatedUser: UserProfile = {
      ...users[idx],
      ...safeUpdates,
    };
    users[idx] = updatedUser;
    this.saveUsers(users);

    const current = this.getCurrentUser();
    if (current && current.uid === uid) {
      this.setCurrentUser(updatedUser);
    }
    window.dispatchEvent(new CustomEvent('taberna-profile-updated', { detail: { user: updatedUser } }));
    return updatedUser;
  },

  saveUsers(users: UserProfile[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      const user: UserProfile = JSON.parse(raw);
      const allUsers = this.getUsers();
      const matched = allUsers.find(u => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
      if (matched && (!user.userTag || user.userTag !== matched.userTag)) {
        const fixed: UserProfile = {
          ...user,
          userTag: matched.userTag,
          tag: matched.userTag
        };
        this.setCurrentUser(fixed);
        return fixed;
      }
      return user;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Cadastro de novo usuário com fluxo obrigatório de PENDING (Bloqueio estrito de personificação do Admin)
  registerUser(email: string, displayName: string, password?: string): { user: UserProfile; isPending: boolean } {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Proibição de registrar o e-mail do admin como usuário comum
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      throw new Error('O e-mail ' + ADMIN_EMAIL + ' pertence exclusivamente ao Administrador Mestre da estalagem. Utilize a opção de login.');
    }

    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      throw new Error('Este e-mail já possui cadastro na estalagem. Faça login com sua palavra secreta.');
    }

    if (password) {
      const passwords = this.getPasswords();
      passwords[cleanEmail] = password;
      this.savePasswords(passwords);
    }

    const existingTags = users.map(u => u.userTag).filter(Boolean) as string[];
    const assignedTag = generateUserTag(existingTags);

    const newUser: UserProfile = {
      uid: 'user-' + Date.now(),
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      userTag: assignedTag,
      tag: assignedTag,
      role: 'user',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    return { user: newUser, isPending: true };
  },

  // Gerenciamento de Palavras Secretas (Senhas)
  getPasswords(): Record<string, string> {
    const raw = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(DEFAULT_PASSWORDS));
      return { ...DEFAULT_PASSWORDS };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_PASSWORDS };
    }
  },

  savePasswords(passwords: Record<string, string>) {
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
  },

  verifyPassword(email: string, passwordAttempt: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    const passwords = this.getPasswords();
    const expected = passwords[cleanEmail] || (cleanEmail === ADMIN_EMAIL.toLowerCase() ? DEFAULT_MASTER_PASSWORD : '123456');
    return passwordAttempt === expected;
  },

  changePassword(email: string, currentPasswordAttempt: string, newPassword: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova palavra secreta deve conter no mínimo 6 caracteres.' };
    }

    if (!this.verifyPassword(cleanEmail, currentPasswordAttempt)) {
      return { success: false, error: 'A palavra secreta atual informada está incorreta.' };
    }

    const passwords = this.getPasswords();
    passwords[cleanEmail] = newPassword;
    this.savePasswords(passwords);
    return { success: true };
  },

  // Login de usuário existente (Não registra automaticamente desconhecidos)
  loginUser(email: string): UserProfile {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Se for o admin e ainda não estiver na lista de usuários por algum motivo, inicializa o admin
      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
        const adminProfile: UserProfile = {
          uid: 'admin-henrique',
          email: ADMIN_EMAIL,
          displayName: 'Henrique Berbert',
          role: 'admin',
          status: 'APPROVED',
          createdAt: '2026-10-01T12:00:00Z',
          approvedAt: '2026-10-01T12:00:00Z',
        };
        users.unshift(adminProfile);
        this.saveUsers(users);
        found = adminProfile;
      } else {
        throw new Error('Nenhum aventureiro encontrado com este e-mail. Por favor, crie seu cadastro primeiro.');
      }
    }

    this.setCurrentUser(found);
    return found;
  },

  // Ações de Administração (Exclusivas para henrique.v.berbert@gmail.com)
  approveUser(targetUid: string, adminEmail: string): boolean {
    if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      console.error('Acesso negado: Somente ' + ADMIN_EMAIL + ' pode aprovar usuários.');
      return false;
    }

    const users = this.getUsers();
    const target = users.find(u => u.uid === targetUid);
    if (!target) return false;

    target.status = 'APPROVED';
    target.approvedAt = new Date().toISOString();
    target.approvedBy = adminEmail;
    this.saveUsers(users);

    // Se o usuário atual for o mesmo, atualiza a sessão
    const current = this.getCurrentUser();
    if (current && current.uid === targetUid) {
      this.setCurrentUser(target);
    }
    return true;
  },

  rejectUser(targetUid: string, adminEmail: string): boolean {
    if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return false;
    }

    const users = this.getUsers();
    const target = users.find(u => u.uid === targetUid);
    if (!target) return false;

    target.status = 'REJECTED';
    this.saveUsers(users);

    const current = this.getCurrentUser();
    if (current && current.uid === targetUid) {
      this.setCurrentUser(target);
    }
    return true;
  },

  // Observador chamado a cada gravação de campanhas (usado pela sincronização com a nuvem)
  campaignsListener: null as ((campaigns: Campaign[]) => void) | null,

  // Campanhas
  getCampaigns(): Campaign[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    let list: Campaign[];
    if (!raw) {
      list = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGNS));
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGNS));
      }
    }

    // Migração: campanhas antigas ganham chave de sala e lista de jogadores
    let migrated = !raw;
    list.forEach(c => {
      if (!c.joinKey) {
        c.joinKey = generateJoinKey();
        migrated = true;
      }
      if (!c.players) {
        c.players = [];
        migrated = true;
      }
    });
    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(list));
    }
    return list;
  },

  // silent=true grava só o cache local, sem acionar a sincronização com a nuvem
  saveCampaigns(campaigns: Campaign[], silent = false) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    if (!silent) this.campaignsListener?.(campaigns);
  },

  // Limite estrito de 3 campanhas ativas por usuário
  createCampaign(user: UserProfile, name: string, description: string, system: string, coverUrl?: string): { success: boolean; error?: string; campaign?: Campaign } {
    const campaigns = this.getCampaigns();
    const userCampaigns = campaigns.filter(c => c.masterId === user.uid);

    if (userCampaigns.length >= 3) {
      return {
        success: false,
        error: 'Limite máximo atingido! Cada mestre pode comandar no máximo 3 campanhas ativas simultâneas na Taberna.'
      };
    }

    const newCampaign: Campaign = {
      id: 'camp-' + Date.now(),
      name: name.trim(),
      description: description.trim() || 'Uma jornada épica pelas terras desconhecidas.',
      system: system || 'D&D 5e',
      coverUrl: coverUrl || '/assets/tavern_bg.jpg',
      masterId: user.uid,
      masterName: user.displayName,
      createdAt: new Date().toISOString(),
      sheets: [],
      lore: [],
      rules: [],
      joinKey: generateJoinKey(),
      players: []
    };

    campaigns.push(newCampaign);
    this.saveCampaigns(campaigns);
    return { success: true, campaign: newCampaign };
  },

  updateCampaign(campaignId: string, user: UserProfile, data: Partial<Pick<Campaign, 'name' | 'coverUrl' | 'description' | 'system'>>): { success: boolean; error?: string } {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);

    if (!campaign) {
      return { success: false, error: 'Campanha não encontrada.' };
    }

    if (campaign.masterId !== user.uid && user.role !== 'admin') {
      return { success: false, error: 'Apenas o Mestre criador da sala tem autoridade para alterar as informações da campanha.' };
    }

    if (data.name) campaign.name = data.name.trim();
    if (data.description !== undefined) campaign.description = data.description.trim();
    if (data.coverUrl) campaign.coverUrl = data.coverUrl;
    if (data.system) campaign.system = data.system;

    this.saveCampaigns(campaigns);
    return { success: true };
  },

  deleteCampaign(campaignId: string, user: UserProfile): { success: boolean; error?: string } {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);

    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };

    if (campaign.masterId !== user.uid && user.role !== 'admin') {
      return { success: false, error: 'Apenas o Mestre pode encerrar esta campanha.' };
    }

    const filtered = campaigns.filter(c => c.id !== campaignId);
    this.saveCampaigns(filtered);
    return { success: true };
  },

  // Chave de sala (modo local): gera uma nova chave, invalidando a anterior para novos jogadores.
  // Quem já entrou continua na sala.
  regenerateJoinKey(campaignId: string, user: UserProfile): { success: boolean; error?: string; joinKey?: string } {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };
    if (campaign.masterId !== user.uid && user.role !== 'admin') {
      return { success: false, error: 'Apenas o Mestre da sala pode gerar uma nova chave.' };
    }
    campaign.joinKey = generateJoinKey();
    this.saveCampaigns(campaigns);
    return { success: true, joinKey: campaign.joinKey };
  },

  // Entrada por chave (modo local): vale entre contas que compartilham este navegador
  joinCampaignByKey(user: UserProfile, rawKey: string): { success: boolean; error?: string; campaignId?: string } {
    const key = normalizeJoinKey(rawKey);
    if (!key) return { success: false, error: 'Chave inválida. Use o formato XXXX-XXXX.' };

    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.joinKey === key);
    if (!campaign) return { success: false, error: 'Nenhuma sala encontrada com essa chave.' };
    if (campaign.masterId === user.uid) return { success: false, error: 'Você é o mestre desta sala.' };

    const players = campaign.players || [];
    if (players.some(p => p.uid === user.uid)) {
      return { success: true, campaignId: campaign.id };
    }
    if (players.length >= MAX_PLAYERS) {
      return { success: false, error: `Sala cheia (${MAX_PLAYERS}/${MAX_PLAYERS} jogadores).` };
    }

    const player: RoomPlayer = { uid: user.uid, name: user.displayName, joinedAt: new Date().toISOString() };
    campaign.players = [...players, player];
    this.saveCampaigns(campaigns);
    return { success: true, campaignId: campaign.id };
  },

  // Remove um jogador da sala (o próprio jogador saindo, ou o mestre expulsando)
  removePlayer(campaignId: string, playerUid: string, user: UserProfile): { success: boolean; error?: string } {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campanha não encontrada.' };
    const isMaster = campaign.masterId === user.uid || user.role === 'admin';
    if (!isMaster && playerUid !== user.uid) {
      return { success: false, error: 'Apenas o Mestre pode remover outros jogadores.' };
    }
    campaign.players = (campaign.players || []).filter(p => p.uid !== playerUid);
    this.saveCampaigns(campaigns);
    return { success: true };
  },

  // Fichas
  addSheet(campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>): CharacterSheet {
    const campaigns = this.getCampaigns();
    let campaign = campaigns.find(c => c.id === campaignId);

    // Fallback se a campanha específica não for encontrada
    if (!campaign && campaigns.length > 0) {
      campaign = campaigns[0];
      campaignId = campaign.id;
    }

    const uniqueId = 'sheet-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newSheet: CharacterSheet = {
      ...sheet,
      id: uniqueId,
      campaignId: campaign ? campaign.id : (campaignId || 'camp-default'),
    };

    if (campaign) {
      if (!Array.isArray(campaign.sheets)) {
        campaign.sheets = [];
      }
      campaign.sheets.push(newSheet);
      this.saveCampaigns(campaigns);
    } else {
      // Se não houver nenhuma campanha cadastrada, cria uma mesa padrão
      const defaultCamp: Campaign = {
        id: 'camp-' + Date.now(),
        name: 'Mesa Principal dos Aventureiros',
        description: 'Mesa de aventuras da Taberna Digital.',
        system: 'D&D 5e',
        coverUrl: '/assets/tavern_bg.jpg',
        masterId: 'system',
        masterName: 'Mestre da Taverna',
        createdAt: new Date().toISOString(),
        sheets: [newSheet],
        lore: [],
        rules: [],
      };
      campaigns.push(defaultCamp);
      newSheet.campaignId = defaultCamp.id;
      this.saveCampaigns(campaigns);
    }

    // Persistência espelhada no Arquivo Global de Fichas do Jogador
    try {
      const ARCHIVE_KEY = 'taberna_player_sheets_archive_v1';
      const existingRaw = localStorage.getItem(ARCHIVE_KEY);
      const list: CharacterSheet[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.push(newSheet);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('Aviso: Falha ao gravar no arquivo global de fichas:', err);
    }

    return newSheet;
  },

  updateSheet(campaignId: string, sheetId: string, data: Partial<CharacterSheet>) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId) || campaigns.find(c => c.sheets?.some(s => s.id === sheetId));
    if (campaign) {
      if (!Array.isArray(campaign.sheets)) campaign.sheets = [];
      const index = campaign.sheets.findIndex(s => s.id === sheetId);
      if (index !== -1) {
        campaign.sheets[index] = { ...campaign.sheets[index], ...data };
        this.saveCampaigns(campaigns);
      }
    }

    // Atualiza também no Arquivo Global
    try {
      const ARCHIVE_KEY = 'taberna_player_sheets_archive_v1';
      const existingRaw = localStorage.getItem(ARCHIVE_KEY);
      if (existingRaw) {
        const list: CharacterSheet[] = JSON.parse(existingRaw);
        const idx = list.findIndex(s => s.id === sheetId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data };
          localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list));
        }
      }
    } catch {}
  },

  deleteSheet(campaignId: string, sheetId: string) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId) || campaigns.find(c => c.sheets?.some(s => s.id === sheetId));
    if (campaign && Array.isArray(campaign.sheets)) {
      campaign.sheets = campaign.sheets.filter(s => s.id !== sheetId);
      this.saveCampaigns(campaigns);
    }

    // Remove também do Arquivo Global
    try {
      const ARCHIVE_KEY = 'taberna_player_sheets_archive_v1';
      const existingRaw = localStorage.getItem(ARCHIVE_KEY);
      if (existingRaw) {
        const list: CharacterSheet[] = JSON.parse(existingRaw);
        const filtered = list.filter(s => s.id !== sheetId);
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered));
      }
    } catch {}
  },

  // Lore
  addLore(campaignId: string, lore: Omit<LoreEntry, 'id' | 'campaignId' | 'createdAt'>): LoreEntry {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    const newLore: LoreEntry = {
      ...lore,
      id: 'lore-' + Date.now(),
      campaignId,
      createdAt: new Date().toISOString(),
    };
    if (campaign) {
      campaign.lore.unshift(newLore);
      this.saveCampaigns(campaigns);
    }
    return newLore;
  },

  deleteLore(campaignId: string, loreId: string) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.lore = campaign.lore.filter(l => l.id !== loreId);
      this.saveCampaigns(campaigns);
    }
  },

  updateLore(campaignId: string, loreId: string, data: Partial<LoreEntry>) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    const index = campaign.lore.findIndex(l => l.id === loreId);
    if (index !== -1) {
      campaign.lore[index] = { ...campaign.lore[index], ...data };
      this.saveCampaigns(campaigns);
    }
  },

  // Regras / PDFs
  addRule(campaignId: string, rule: Omit<RuleDocument, 'id' | 'campaignId'>): RuleDocument {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    const newRule: RuleDocument = {
      ...rule,
      id: 'rule-' + Date.now(),
      campaignId,
    };
    if (campaign) {
      campaign.rules.unshift(newRule);
      this.saveCampaigns(campaigns);
    }
    return newRule;
  },

  deleteRule(campaignId: string, ruleId: string) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.rules = campaign.rules.filter(r => r.id !== ruleId);
      this.saveCampaigns(campaigns);
    }
  },

  updateRule(campaignId: string, ruleId: string, data: Partial<RuleDocument>) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    const index = campaign.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      campaign.rules[index] = { ...campaign.rules[index], ...data };
      this.saveCampaigns(campaigns);
    }
  },

  // Sketch Studio
  getSketches(): SketchAsset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SKETCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SKETCHES, JSON.stringify(DEFAULT_SKETCHES));
      return DEFAULT_SKETCHES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SKETCHES;
    }
  },

  saveSketch(sketch: Omit<SketchAsset, 'id' | 'createdAt'>): SketchAsset {
    const list = this.getSketches();
    const item: SketchAsset = {
      ...sketch,
      id: 'sketch-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);

    // Limite máximo de 10 assets na galeria do estúdio
    if (list.length > 10) {
      list.length = 10;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SKETCHES, JSON.stringify(list));
    } catch (e) {
      console.warn('Alerta de cota no armazenamento local, liberando slots mais antigos:', e);
      // Se estourar a cota local do navegador, descarta o mais antigo até caber
      while (list.length > 1) {
        list.pop();
        try {
          localStorage.setItem(STORAGE_KEYS.SKETCHES, JSON.stringify(list));
          break;
        } catch {}
      }
    }
    return item;
  },

  deleteSketch(id: string): void {
    const list = this.getSketches();
    const filtered = list.filter(s => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SKETCHES, JSON.stringify(filtered));
    } catch (e) {
      console.error('Erro ao excluir sketch:', e);
    }
  },

  // Urd Mensagens
  getUrdMessages(): UrdMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.URD_MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.URD_MESSAGES, JSON.stringify(DEFAULT_URD_MESSAGES));
      return DEFAULT_URD_MESSAGES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_URD_MESSAGES;
    }
  },

  addUrdMessage(sender: 'user' | 'urd', text: string): UrdMessage {
    const messages = this.getUrdMessages();
    const msg: UrdMessage = {
      id: 'msg-' + Date.now(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(msg);
    localStorage.setItem(STORAGE_KEYS.URD_MESSAGES, JSON.stringify(messages));
    return msg;
  },

  clearUrdChat() {
    localStorage.setItem(STORAGE_KEYS.URD_MESSAGES, JSON.stringify(DEFAULT_URD_MESSAGES));
  },

  // Portal de Chats — Mensagens e Canais
  getChatMessages(channelId?: string): ChatMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    let messages: ChatMessage[] = DEFAULT_CHATS;
    if (raw) {
      try {
        messages = JSON.parse(raw);
      } catch {
        messages = DEFAULT_CHATS;
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(DEFAULT_CHATS));
    }
    if (channelId) {
      return messages.filter(m => m.channelId === channelId);
    }
    return messages;
  },

  saveChatMessage(message: ChatMessage): ChatMessage {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    let messages: ChatMessage[] = [];
    if (raw) {
      try {
        messages = JSON.parse(raw);
      } catch {
        messages = [...DEFAULT_CHATS];
      }
    } else {
      messages = [...DEFAULT_CHATS];
    }
    messages.push(message);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('taberna-chat-updated', { detail: { message } }));
    return message;
  },

  clearChatMessages(channelId: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!raw) return;
    try {
      const messages: ChatMessage[] = JSON.parse(raw);
      const remaining = messages.filter(m => m.channelId !== channelId);
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('taberna-chat-updated', { detail: { channelId } }));
    } catch {
      // ignore
    }
  },

  // ==========================================
  // CONTATOS (ADICIONADOS & FAVORITOS POR TAG)
  // ==========================================
  getUserContacts(userUid: string): UserContact[] {
    const raw = localStorage.getItem(`${STORAGE_KEYS.USER_CONTACTS}_${userUid}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveUserContacts(userUid: string, contacts: UserContact[]) {
    localStorage.setItem(`${STORAGE_KEYS.USER_CONTACTS}_${userUid}`, JSON.stringify(contacts));
    window.dispatchEvent(new CustomEvent('taberna-contacts-updated', { detail: { userUid } }));
  },

  addUserContactByTag(currentUserUid: string, rawTag: string): { success: boolean; error?: string; contact?: UserContact; user?: UserProfile } {
    const cleanTag = normalizeUserTag(rawTag);
    if (!cleanTag || cleanTag.length !== 7) {
      return { success: false, error: 'A tag do aventureiro deve conter exatamente 7 caracteres alfanuméricos em maiúsculas (ex: K7M9P2X).' };
    }

    const allUsers = this.getUsers();
    const targetUser = allUsers.find(u => {
      const uTag = u.userTag ? normalizeUserTag(u.userTag) : (u.tag ? normalizeUserTag(u.tag) : '');
      return uTag === cleanTag;
    });

    if (!targetUser) {
      return { success: false, error: `Nenhum aventureiro encontrado com a tag #${cleanTag}. Confirme a tag de 7 caracteres com seu companheiro.` };
    }

    if (targetUser.uid === currentUserUid) {
      return { success: false, error: 'Você não pode adicionar a sua própria tag aos contatos.' };
    }

    const currentContacts = this.getUserContacts(currentUserUid);
    if (currentContacts.some(c => c.uid === targetUser.uid)) {
      return { success: false, error: `${targetUser.displayName} já está na sua lista de aventureiros adicionados.` };
    }

    const newContact: UserContact = {
      uid: targetUser.uid,
      userTag: targetUser.userTag || cleanTag,
      addedAt: new Date().toISOString(),
      isFavorite: false
    };

    currentContacts.unshift(newContact);
    this.saveUserContacts(currentUserUid, currentContacts);

    return { success: true, contact: newContact, user: targetUser };
  },

  removeUserContact(currentUserUid: string, targetUid: string): boolean {
    const currentContacts = this.getUserContacts(currentUserUid);
    const filtered = currentContacts.filter(c => c.uid !== targetUid);
    if (filtered.length !== currentContacts.length) {
      this.saveUserContacts(currentUserUid, filtered);
      return true;
    }
    return false;
  },

  toggleFavoriteContact(currentUserUid: string, targetUid: string): boolean {
    const currentContacts = this.getUserContacts(currentUserUid);
    const contact = currentContacts.find(c => c.uid === targetUid);
    if (!contact) return false;
    contact.isFavorite = !contact.isFavorite;
    this.saveUserContacts(currentUserUid, currentContacts);
    return true;
  },

  setContactNickname(currentUserUid: string, targetUid: string, nickname: string): boolean {
    const currentContacts = this.getUserContacts(currentUserUid);
    const contact = currentContacts.find(c => c.uid === targetUid);
    if (!contact) return false;
    const clean = nickname.trim();
    if (clean) contact.nickname = clean;
    else delete contact.nickname;
    this.saveUserContacts(currentUserUid, currentContacts);
    return true;
  },

  // ==========================================
  // SALAS E CHATS EM GRUPO CUSTOMIZADOS
  // ==========================================
  getCustomRooms(userUid?: string): CustomChatRoom[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_ROOMS);
    let rooms: CustomChatRoom[] = [];
    if (raw) {
      try {
        rooms = JSON.parse(raw);
      } catch {
        rooms = [];
      }
    }
    if (userUid) {
      return rooms.filter(r => r.memberUids.includes(userUid) || r.creatorUid === userUid);
    }
    return rooms;
  },

  saveCustomRooms(rooms: CustomChatRoom[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_ROOMS, JSON.stringify(rooms));
    window.dispatchEvent(new CustomEvent('taberna-rooms-updated'));
  },

  createCustomRoom(creator: UserProfile, data: { name: string; description?: string; iconEmoji?: string; memberUids: string[] }): CustomChatRoom {
    const rooms = this.getCustomRooms();
    const initialMembers = Array.from(new Set([creator.uid, ...(data.memberUids || [])]));
    const newRoom: CustomChatRoom = {
      id: 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: data.name.trim(),
      description: data.description?.trim(),
      iconEmoji: data.iconEmoji || '🛡️',
      color: creator.customBadgeColor || '#d97706',
      creatorUid: creator.uid,
      creatorName: creator.displayName,
      adminUids: [creator.uid],
      memberUids: initialMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    rooms.unshift(newRoom);
    this.saveCustomRooms(rooms);
    return newRoom;
  },

  updateCustomRoom(roomId: string, userUid: string, updates: Partial<CustomChatRoom>): { success: boolean; error?: string } {
    const rooms = this.getCustomRooms();
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return { success: false, error: 'Sala não encontrada.' };
    const room = rooms[idx];
    const isAdmin = room.adminUids.includes(userUid) || room.creatorUid === userUid;
    if (!isAdmin) return { success: false, error: 'Apenas administradores podem editar as informações da sala.' };

    rooms[idx] = {
      ...room,
      ...updates,
      name: updates.name ? updates.name.trim() : room.name,
      description: updates.description !== undefined ? updates.description.trim() : room.description,
      iconEmoji: updates.iconEmoji || room.iconEmoji,
      color: updates.color || room.color,
      updatedAt: new Date().toISOString()
    };
    this.saveCustomRooms(rooms);
    return { success: true };
  },

  toggleAdminCustomRoom(roomId: string, userUid: string, targetUid: string): { success: boolean; error?: string } {
    const rooms = this.getCustomRooms();
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return { success: false, error: 'Sala não encontrada.' };
    const room = rooms[idx];
    const isOwner = room.creatorUid === userUid;
    const isCurrentUserAdmin = room.adminUids.includes(userUid);

    if (!isCurrentUserAdmin && !isOwner) {
      return { success: false, error: 'Apenas administradores da sala podem gerenciar cargos.' };
    }

    if (targetUid === room.creatorUid) {
      return { success: false, error: 'O criador original da sala sempre mantém o cargo de liderança.' };
    }

    const isTargetAdmin = room.adminUids.includes(targetUid);
    let updatedAdmins: string[];
    if (isTargetAdmin) {
      // Rebaixar cargo
      if (!isOwner) {
        return { success: false, error: 'Apenas o criador da sala pode remover o cargo de um administrador.' };
      }
      updatedAdmins = room.adminUids.filter(id => id !== targetUid);
    } else {
      // Promover cargo
      updatedAdmins = [...room.adminUids, targetUid];
    }

    rooms[idx] = {
      ...room,
      adminUids: updatedAdmins,
      updatedAt: new Date().toISOString()
    };
    this.saveCustomRooms(rooms);
    return { success: true };
  },

  removeMemberFromCustomRoom(roomId: string, userUid: string, targetUid: string): { success: boolean; error?: string } {
    const rooms = this.getCustomRooms();
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return { success: false, error: 'Sala não encontrada.' };
    const room = rooms[idx];
    const isOwner = room.creatorUid === userUid;
    const isCurrentUserAdmin = room.adminUids.includes(userUid);

    // Permite que o próprio membro saia voluntariamente
    const isSelfLeaving = userUid === targetUid;

    if (!isSelfLeaving && !isCurrentUserAdmin && !isOwner) {
      return { success: false, error: 'Apenas administradores podem expulsar membros da sala.' };
    }

    if (!isSelfLeaving && targetUid === room.creatorUid) {
      return { success: false, error: 'O criador da sala não pode ser expulso.' };
    }

    // Se quem está expulsando for admin comum, não pode expulsar outro admin (apenas o criador pode)
    if (!isSelfLeaving && !isOwner && room.adminUids.includes(targetUid)) {
      return { success: false, error: 'Apenas o criador da sala pode expulsar outro administrador.' };
    }

    rooms[idx] = {
      ...room,
      memberUids: room.memberUids.filter(id => id !== targetUid),
      adminUids: room.adminUids.filter(id => id !== targetUid),
      updatedAt: new Date().toISOString()
    };
    this.saveCustomRooms(rooms);
    return { success: true };
  },

  addMemberToCustomRoom(roomId: string, userUid: string, newMemberUid: string): { success: boolean; error?: string } {
    const rooms = this.getCustomRooms();
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return { success: false, error: 'Sala não encontrada.' };
    const room = rooms[idx];
    const isAdmin = room.adminUids.includes(userUid) || room.creatorUid === userUid;
    if (!isAdmin) return { success: false, error: 'Apenas administradores podem adicionar aventureiros a esta sala.' };

    if (room.memberUids.includes(newMemberUid)) {
      return { success: false, error: 'Este aventureiro já faz parte da sala.' };
    }

    rooms[idx] = {
      ...room,
      memberUids: [...room.memberUids, newMemberUid],
      updatedAt: new Date().toISOString()
    };
    this.saveCustomRooms(rooms);
    return { success: true };
  },

  leaveOrDeleteCustomRoom(roomId: string, userUid: string): { success: boolean; deleted?: boolean; error?: string } {
    const rooms = this.getCustomRooms();
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return { success: false, error: 'Sala não encontrada.' };
    const room = rooms[idx];

    if (room.creatorUid === userUid) {
      // Exclui a sala se for o criador
      const updated = rooms.filter(r => r.id !== roomId);
      this.saveCustomRooms(updated);
      return { success: true, deleted: true };
    } else {
      // Sai da sala
      rooms[idx] = {
        ...room,
        memberUids: room.memberUids.filter(id => id !== userUid),
        adminUids: room.adminUids.filter(id => id !== userUid),
        updatedAt: new Date().toISOString()
      };
      this.saveCustomRooms(rooms);
      return { success: true, deleted: false };
    }
  }
};

