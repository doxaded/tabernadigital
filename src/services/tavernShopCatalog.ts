import { ShopFrameItem, ShopTitleItem, UserProfile } from '../types';

export const DEFAULT_INITIAL_GOLD = 250;
export const DAILY_REWARD_GOLD = 50;
export const DEFAULT_TITLE_NAME = 'O Novato da Estalagem';
export const DEFAULT_FRAME_ID = 'frame-default';

export const SHOP_TITLES: ShopTitleItem[] = [
  {
    id: 'novato',
    name: 'O Novato da Estalagem',
    price: 0,
    description: 'Todo grande herói começou sentado em um banquinho de taverna ouvindo boatos.',
    rarity: 'comum',
    icon: '🍺'
  },
  {
    id: 'bardo',
    name: 'Bardo Cantador de Histórias',
    price: 80,
    description: 'Conhece todas as baladas, piadas e fofocas dos quatro reinos de cor e salteado.',
    rarity: 'comum',
    icon: '🪕'
  },
  {
    id: 'cervejeiro',
    name: 'Guardião do Barril de Carvalho',
    price: 120,
    description: 'O melhor amigo de todo taverneiro e o terror dos barris de cerveja preta.',
    rarity: 'comum',
    icon: '🍻'
  },
  {
    id: 'lareira',
    name: 'Lorde da Lareira Aconchegante',
    price: 160,
    description: 'Sempre encontra o assento mais aquecido e confortável ao lado do fogo.',
    rarity: 'raro',
    icon: '🔥'
  },
  {
    id: 'apostador',
    name: 'Apostador Audaz dos Dados',
    price: 220,
    description: 'Dobrou a aposta nos dados de marfim e viveu com os bolsos cheios para contar.',
    rarity: 'raro',
    icon: '🎲'
  },
  {
    id: 'goblins',
    name: 'Flagelo dos Goblins',
    price: 280,
    description: 'Nem as cavernas mais escuras nem as colinas são refúgio contra sua lâmina afiada.',
    rarity: 'raro',
    icon: '🗡️'
  },
  {
    id: 'arquivista',
    name: 'Arquivista Arcano dos Grimórios',
    price: 350,
    description: 'Lê pergaminhos antigos à luz de velas e decifra runas milenares proibidas.',
    rarity: 'epico',
    icon: '📜'
  },
  {
    id: 'mestre-dados',
    name: 'Mestre dos Vinte Lados',
    price: 450,
    description: 'Abençoado pelos deuses da sorte; o lendário 20 natural o acompanha nas batalhas.',
    rarity: 'epico',
    icon: '✨'
  },
  {
    id: 'dragao',
    name: 'Campeão do Dragão Ancião',
    price: 600,
    description: 'Sobreviveu ao sopro de chamas e ostenta a escama carmesim no peito.',
    rarity: 'lendario',
    icon: '🐉'
  },
  {
    id: 'patrono',
    name: 'Patrono Lendário da Taverna',
    price: 800,
    description: 'Sua caneca pessoal de ouro maciço repousa com honras eternas atrás do balcão.',
    rarity: 'lendario',
    icon: '👑'
  }
];

export const SHOP_FRAMES: ShopFrameItem[] = [
  {
    id: 'frame-default',
    name: 'Ferro Forjado Rústico',
    price: 0,
    description: 'Moldura sóbria de ferro batido na bigorna da estalagem com rebites firmes.',
    rarity: 'comum',
    borderColor: '#71717a',
    glowColor: 'rgba(113, 113, 122, 0.4)',
    boxShadow: '0 0 0 2px #3f3f46, 0 4px 10px rgba(0,0,0,0.5)',
    badge: '⚙️ Comum',
    cssStyle: 'border: 3px solid #71717a; box-shadow: 0 0 10px rgba(0,0,0,0.6);'
  },
  {
    id: 'frame-wood',
    name: 'Carvalho Imperial Entalhado',
    price: 100,
    description: 'Madeira nobre de carvalho secular, lixada e finalizada com cera aromática.',
    rarity: 'comum',
    borderColor: '#854d0e',
    glowColor: 'rgba(161, 98, 7, 0.4)',
    boxShadow: '0 0 0 3px #78350f, 0 0 14px rgba(180, 83, 9, 0.35)',
    badge: '🪵 Carvalho',
    cssStyle: 'border: 3px solid #b45309; outline: 2px solid #451a03; box-shadow: 0 0 12px rgba(180,83,9,0.4);'
  },
  {
    id: 'frame-bronze',
    name: 'Bronze dos Antigos Guardiões',
    price: 150,
    description: 'Metal forjado em eras passadas, com um brilho cobreado fosco e resistente.',
    rarity: 'comum',
    borderColor: '#b45309',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    boxShadow: '0 0 0 3px #78350f, inset 0 0 6px rgba(0,0,0,0.6), 0 0 12px rgba(217, 119, 6, 0.3)',
    badge: '🛡️ Bronze',
    cssStyle: 'border: 3px solid #d97706; box-shadow: inset 0 0 8px #78350f, 0 0 14px rgba(217,119,6,0.4);'
  },
  {
    id: 'frame-gold',
    name: 'Ouro Real dos Reis da Taverna',
    price: 250,
    description: 'Guarnição folheada a ouro reluzente com filigranas detalhadas de alta realeza.',
    rarity: 'raro',
    borderColor: '#fbbf24',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    boxShadow: '0 0 0 3px #d97706, 0 0 18px rgba(245, 158, 11, 0.65), inset 0 0 8px rgba(251, 191, 36, 0.4)',
    badge: '🪙 Ouro Nobre',
    cssStyle: 'border: 3px solid #f59e0b; outline: 1px solid #fbbf24; box-shadow: 0 0 20px rgba(245,158,11,0.6);'
  },
  {
    id: 'frame-nature',
    name: 'Hera Mística das Florestas Élficas',
    price: 300,
    description: 'Ramos vivos encantados que sussurram histórias silvanas e emitem pólen luminoso.',
    rarity: 'raro',
    borderColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    boxShadow: '0 0 0 3px #047857, 0 0 18px rgba(16, 185, 129, 0.55), inset 0 0 8px rgba(52, 211, 153, 0.3)',
    badge: '🌿 Élfico',
    cssStyle: 'border: 3px solid #10b981; outline: 2px solid #064e3b; box-shadow: 0 0 18px rgba(16,185,129,0.55);'
  },
  {
    id: 'frame-fire',
    name: 'Chamas Vivas da Lareira Eterna',
    price: 380,
    description: 'Ember pulsante e fagulhas incandescentes que nunca se extinguem ao redor do rosto.',
    rarity: 'epico',
    borderColor: '#f97316',
    glowColor: 'rgba(239, 68, 68, 0.75)',
    boxShadow: '0 0 0 3px #c2410c, 0 0 24px rgba(249, 115, 22, 0.7), inset 0 0 10px rgba(239, 68, 68, 0.4)',
    badge: '🔥 Fogo Vivo',
    cssStyle: 'border: 3px solid #f97316; outline: 2px solid #ef4444; box-shadow: 0 0 24px rgba(239,68,68,0.7);'
  },
  {
    id: 'frame-ice',
    name: 'Gelo Glacial dos Picos de Jotun',
    price: 420,
    description: 'Cristais pontiagudos de gelo eterno envoltos em uma fina geada mística celeste.',
    rarity: 'epico',
    borderColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    boxShadow: '0 0 0 3px #0284c7, 0 0 22px rgba(56, 189, 248, 0.65), inset 0 0 8px rgba(186, 230, 253, 0.5)',
    badge: '❄️ Glacial',
    cssStyle: 'border: 3px solid #38bdf8; outline: 2px solid #0369a1; box-shadow: 0 0 22px rgba(56,189,248,0.65);'
  },
  {
    id: 'frame-dragon',
    name: 'Escamas Rubras do Dragão Voraz',
    price: 550,
    description: 'Forjada a partir de escamas impenetráveis banhadas no calor das profundezas vulcânicas.',
    rarity: 'lendario',
    borderColor: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.85)',
    boxShadow: '0 0 0 3px #881337, 0 0 28px rgba(225, 29, 72, 0.8), inset 0 0 12px rgba(244, 63, 94, 0.5)',
    badge: '🐉 Dracônico',
    cssStyle: 'border: 3.5px solid #e11d48; outline: 2px solid #4c0519; box-shadow: 0 0 28px rgba(225,29,72,0.85);'
  },
  {
    id: 'frame-celestial',
    name: 'Aura Celestial dos Deuses da Sorte',
    price: 750,
    description: 'O brilho estelar infinito das constelações bordado por runas cósmicas violeta e ouro.',
    rarity: 'lendario',
    borderColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.85)',
    boxShadow: '0 0 0 3px #6b21a8, 0 0 30px rgba(168, 85, 247, 0.85), 0 0 12px rgba(234, 179, 8, 0.6)',
    badge: '🌌 Cósmico',
    cssStyle: 'border: 3.5px solid #c084fc; outline: 2px solid #eab308; box-shadow: 0 0 32px rgba(192,132,252,0.85);'
  }
];

export function getEffectiveGold(user: UserProfile | null | undefined): number {
  if (!user) return 0;
  if (typeof user.gold === 'number') return user.gold;
  return DEFAULT_INITIAL_GOLD;
}

export function getFrameById(frameId?: string): ShopFrameItem {
  if (!frameId) return SHOP_FRAMES[0];
  const found = SHOP_FRAMES.find(f => f.id === frameId);
  return found || SHOP_FRAMES[0];
}

export function getTitleById(titleId?: string): ShopTitleItem | undefined {
  if (!titleId) return undefined;
  return SHOP_TITLES.find(t => t.id === titleId || t.name === titleId);
}

export function isItemUnlocked(
  user: UserProfile | null | undefined,
  type: 'title' | 'frame',
  itemId: string
): boolean {
  if (!user) return false;

  if (type === 'title') {
    // Novato é sempre desbloqueado
    if (itemId === 'novato' || itemId === DEFAULT_TITLE_NAME) return true;
    const unlocked = user.unlockedTitles || [];
    return unlocked.includes(itemId) || unlocked.includes(SHOP_TITLES.find(t => t.id === itemId)?.name || '');
  }

  if (type === 'frame') {
    // Default é sempre desbloqueado
    if (itemId === DEFAULT_FRAME_ID) return true;
    const unlocked = user.unlockedFrames || [];
    return unlocked.includes(itemId);
  }

  return false;
}

export function isItemEquipped(
  user: UserProfile | null | undefined,
  type: 'title' | 'frame',
  itemId: string
): boolean {
  if (!user) return false;

  if (type === 'title') {
    const userTitle = user.title || DEFAULT_TITLE_NAME;
    const item = SHOP_TITLES.find(t => t.id === itemId);
    return userTitle === itemId || (!!item && userTitle === item.name);
  }

  if (type === 'frame') {
    const userFrame = user.frameId || DEFAULT_FRAME_ID;
    return userFrame === itemId;
  }

  return false;
}

export function isDailyRewardAvailable(user: UserProfile | null | undefined): boolean {
  if (!user || !user.lastDailyRewardDate) return true;
  try {
    const lastDate = new Date(user.lastDailyRewardDate);
    const now = new Date();
    // 24 horas de intervalo
    const diffMs = now.getTime() - lastDate.getTime();
    return diffMs >= 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export function getTimeUntilNextDaily(user: UserProfile | null | undefined): string {
  if (!user || !user.lastDailyRewardDate) return '';
  try {
    const lastDate = new Date(user.lastDailyRewardDate);
    const nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = nextDate.getTime() - now.getTime();
    if (diffMs <= 0) return '';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch {
    return '';
  }
}
