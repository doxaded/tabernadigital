import { Campaign, CharacterSheet, LoreEntry, RuleDocument, SketchAsset, UrdMessage, UserProfile } from '../types';

export const ADMIN_EMAIL = 'henrique.v.berbert@gmail.com';
export const DEFAULT_MASTER_PASSWORD = 'TabernaMestre2026!';

const STORAGE_KEYS = {
  USERS: 'taberna_users_v1',
  CURRENT_USER: 'taberna_current_user_v1',
  CAMPAIGNS: 'taberna_campaigns_v1',
  SKETCHES: 'taberna_sketches_v1',
  URD_MESSAGES: 'taberna_urd_messages_v1',
  PASSWORDS: 'taberna_passwords_v1',
};

const DEFAULT_PASSWORDS: Record<string, string> = {
  [ADMIN_EMAIL.toLowerCase()]: DEFAULT_MASTER_PASSWORD,
  'thorin.escudo@taberna.rpg': '123456',
  'lyanna.sombra@taberna.rpg': '123456',
  'garrick.bardo@taberna.rpg': '123456',
};

// Dados padrão iniciais
const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'admin-henrique',
    email: ADMIN_EMAIL,
    displayName: 'Henrique Berbert',
    role: 'admin',
    status: 'APPROVED',
    createdAt: '2026-10-01T12:00:00Z',
    approvedAt: '2026-10-01T12:00:00Z',
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
  },
  {
    uid: 'user-lyanna',
    email: 'lyanna.sombra@taberna.rpg',
    displayName: 'Lyanna Sombra-da-Noite',
    role: 'user',
    status: 'PENDING',
    createdAt: '2026-10-02T20:15:00Z',
  },
  {
    uid: 'user-garrick',
    email: 'garrick.bardo@taberna.rpg',
    displayName: 'Garrick das Sete Cordas',
    role: 'user',
    status: 'PENDING',
    createdAt: '2026-10-02T21:00:00Z',
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
    text: `*Puxa um banco de carvalho rústico e desliza uma caneca espumante de cerveja preta pelo balcão em sua direção.* 
Saudações, viajante! Bem-vindo à **Taberna Digital**! Eu sou o Urd, e nestes cinquenta invernos já ouvi mais histórias de masmorras, dragões e traições do que qualquer mago em sua torre. 
Se você precisa de um bom boato para atiçar seus jogadores, um gancho de aventura nas catacumbas, ou um enigma que fará seus aventureiros coçarem as barbas... você veio ao lugar certo. O que a mesa pede hoje?`,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
];

export const storageService = {
  // Usuários
  getUsers(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
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
      return JSON.parse(raw);
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

    const newUser: UserProfile = {
      uid: 'user-' + Date.now(),
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
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

  // Campanhas
  getCampaigns(): Campaign[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(DEFAULT_CAMPAIGNS));
      return DEFAULT_CAMPAIGNS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CAMPAIGNS;
    }
  },

  saveCampaigns(campaigns: Campaign[]) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
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
      rules: []
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

  // Fichas
  addSheet(campaignId: string, sheet: Omit<CharacterSheet, 'id' | 'campaignId'>): CharacterSheet {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    const newSheet: CharacterSheet = {
      ...sheet,
      id: 'sheet-' + Date.now(),
      campaignId,
    };
    if (campaign) {
      campaign.sheets.push(newSheet);
      this.saveCampaigns(campaigns);
    }
    return newSheet;
  },

  updateSheet(campaignId: string, sheetId: string, data: Partial<CharacterSheet>) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    const index = campaign.sheets.findIndex(s => s.id === sheetId);
    if (index !== -1) {
      campaign.sheets[index] = { ...campaign.sheets[index], ...data };
      this.saveCampaigns(campaigns);
    }
  },

  deleteSheet(campaignId: string, sheetId: string) {
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.sheets = campaign.sheets.filter(s => s.id !== sheetId);
      this.saveCampaigns(campaigns);
    }
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
  }
};
