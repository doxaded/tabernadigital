import { CharacterSheet, CustomStat } from '../types';

/** Atributos padrão: sempre exibidos primeiro e nesta ordem. */
export const DEFAULT_STATS = [
  { key: 'strength', code: 'FOR' },
  { key: 'dexterity', code: 'DES' },
  { key: 'constitution', code: 'CON' },
  { key: 'intelligence', code: 'INT' },
  { key: 'wisdom', code: 'SAB' },
  { key: 'charisma', code: 'CAR' },
] as const;

export type DefaultStatKey = (typeof DEFAULT_STATS)[number]['key'];
export type DefaultStats = Record<DefaultStatKey, number>;

export const DEFAULT_STAT_CODES: string[] = DEFAULT_STATS.map(s => s.code);

/** Sigla válida: exatamente 3 letras maiúsculas (A–Z). */
export const STAT_CODE_REGEX = /^[A-Z]{3}$/;

/** Normaliza o que o usuário digita: remove acentos/símbolos, deixa só letras maiúsculas e corta em 3. */
export const normalizeStatCode = (raw: string): string =>
  raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3);

/** Retorna uma mensagem de erro para a lista de atributos extras, ou null se estiver tudo certo. */
export const validateCustomStats = (list: CustomStat[]): string | null => {
  const seen = new Set<string>(DEFAULT_STAT_CODES);
  for (const stat of list) {
    if (!STAT_CODE_REGEX.test(stat.code)) {
      return 'Todo atributo extra precisa de um nome com exatamente 3 letras maiúsculas (ex.: SAN, LUC).';
    }
    if (seen.has(stat.code)) {
      return `O atributo "${stat.code}" já existe nesta ficha. Use outro nome.`;
    }
    seen.add(stat.code);
  }
  return null;
};

/** Lista completa de atributos de uma ficha: padrões primeiro, depois os extras. */
export const getOrderedStats = (sheet: Pick<CharacterSheet, 'stats' | 'customStats'>): { code: string; value: number }[] => {
  const defaults = DEFAULT_STATS.map(({ key, code }) => ({
    code,
    value: Number(sheet.stats?.[key] ?? 10),
  }));
  const extras = (sheet.customStats || []).map(s => ({ code: s.code, value: Number(s.value) }));
  return [...defaults, ...extras];
};
