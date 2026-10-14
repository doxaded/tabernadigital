import { GoogleGenAI, Type } from '@google/genai';
import { CharacterSheet } from '../types';
import { GEMINI_TEXT_MODEL, compressBase64Image, getEffectiveGeminiKey } from './aiService';
import { DEFAULT_STAT_CODES, STAT_CODE_REGEX, normalizeStatCode } from './sheetStats';

/**
 * Importação automática de ficha de personagem a partir de imagem (foto/print) ou PDF.
 * O arquivo é lido pelo Gemini (multimodal) e convertido em dados estruturados
 * que preenchem o formulário de "Nova Ficha" para revisão antes de registrar.
 */

export const SHEET_IMPORT_ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf,.pdf,.png,.jpg,.jpeg,.webp';

// O envio inline ao Gemini aceita até ~20 MB por requisição; mantemos margem de segurança.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export type ExtractedSheet = Pick<
  CharacterSheet,
  'name' | 'player' | 'class' | 'race' | 'level' | 'maxHp' | 'maxMp' | 'armorClass' | 'stats' | 'customStats' | 'traits' | 'equipment' | 'notes'
>;

const SHEET_PROMPT = `
Você é um assistente que lê fichas de personagem de RPG de mesa (principalmente D&D 5e, em Português ou Inglês),
seja em foto, print, ficha escaneada ou PDF, e extrai os dados com precisão.

Regras:
- Responda SOMENTE com JSON no formato do schema. Nunca invente valores: se um campo não estiver visível, use "" (texto) ou 0 (número) ou [] (lista).
- Todos os textos devem sair em Português do Brasil (traduza classe, raça e traços do inglês quando necessário, ex.: Fighter → Guerreiro, Elf → Elfo).
- "level": nível total do personagem. Se for multiclasse, some os níveis e escreva as classes em "class" (ex.: "Guerreiro 3 / Mago 2").
- "maxHp": pontos de vida máximos (não os atuais).
- "armorClass": Classe de Armadura (CA).
- "maxMp": total de espaços de magia, pontos de feitiçaria/ki/mana, se existirem; caso contrário 0.
- Atributos (strength=Força, dexterity=Destreza, constitution=Constituição, intelligence=Inteligência, wisdom=Sabedoria, charisma=Carisma):
  use o VALOR do atributo (ex.: 16), não o modificador. Se só houver modificadores, calcule valor = 10 + 2 × modificador.
- "extraStats": atributos adicionais que NÃO sejam os seis acima (ex.: Sanidade, Sorte, Honra). Use sigla de exatamente 3 letras
  maiúsculas em "code" (ex.: SAN, SOR, HON) e o valor numérico em "value". Não inclua perícias, salvaguardas nem modificadores.
- "traits": características de classe/raça/antecedente, talentos e proficiências relevantes (máx. 14 itens curtos).
- "equipment": armas, armaduras e itens do inventário, um por item (inclua dano de armas quando visível).
- "notes": resumo curto de antecedente, alinhamento, idiomas, magias principais e qualquer detalhe importante (máx. ~600 caracteres).
- "player": nome do jogador, se constar na ficha.
`;

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const normalizeExtraStats = (value: unknown): { code: string; value: number }[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>(DEFAULT_STAT_CODES);
  const result: { code: string; value: number }[] = [];
  for (const item of value) {
    const code = normalizeStatCode(String((item as any)?.code ?? ''));
    if (!STAT_CODE_REGEX.test(code) || seen.has(code)) continue;
    seen.add(code);
    result.push({ code, value: clampNumber((item as any)?.value, 0, 99, 10) });
    if (result.length >= 12) break;
  }
  return result;
};

const toStringList = (value: unknown, limit: number): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
    .slice(0, limit);
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });

export const extractCharacterSheetFromFile = async (file: File): Promise<ExtractedSheet> => {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (!isPdf && !isImage) {
    throw new Error('Formato não suportado. Envie uma imagem (PNG, JPG, WEBP) ou um PDF.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Arquivo muito grande. O limite é de 15 MB.');
  }

  const apiKey = getEffectiveGeminiKey();
  if (!apiKey) {
    throw new Error('Nenhuma chave Gemini configurada. Cadastre sua chave no Sketch Studio para usar a leitura automática.');
  }

  let mimeType = isPdf ? 'application/pdf' : file.type;
  let dataUrl = await fileToDataUrl(file);

  // Imagens grandes são reduzidas para acelerar o envio sem perder legibilidade do texto
  if (isImage) {
    dataUrl = await compressBase64Image(dataUrl, 2200, 0.9);
    mimeType = dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : mimeType;
  }

  const base64 = dataUrl.split(',')[1] || '';
  if (!base64) throw new Error('Arquivo vazio ou corrompido.');

  const client = new GoogleGenAI({ apiKey });
  let rawText = '';
  try {
    const res = await client.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: SHEET_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            player: { type: Type.STRING },
            class: { type: Type.STRING },
            race: { type: Type.STRING },
            level: { type: Type.INTEGER },
            maxHp: { type: Type.INTEGER },
            maxMp: { type: Type.INTEGER },
            armorClass: { type: Type.INTEGER },
            strength: { type: Type.INTEGER },
            dexterity: { type: Type.INTEGER },
            constitution: { type: Type.INTEGER },
            intelligence: { type: Type.INTEGER },
            wisdom: { type: Type.INTEGER },
            charisma: { type: Type.INTEGER },
            extraStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { code: { type: Type.STRING }, value: { type: Type.INTEGER } },
                required: ['code', 'value'],
              },
            },
            traits: { type: Type.ARRAY, items: { type: Type.STRING } },
            equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
            notes: { type: Type.STRING },
          },
          required: ['name', 'class', 'race', 'level', 'maxHp', 'armorClass'],
        },
      },
    });
    rawText = res.text || '';
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    if (/429|quota|rate/i.test(msg)) {
      throw new Error('Limite de uso da API Gemini atingido. Tente novamente em instantes.');
    }
    if (/API key|permission|403|401/i.test(msg)) {
      throw new Error('Chave Gemini inválida ou sem permissão. Verifique a chave configurada.');
    }
    throw new Error('Falha ao ler a ficha com a IA. Tente outra imagem/PDF mais nítido.');
  }

  let data: any;
  try {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    data = JSON.parse(cleaned);
  } catch {
    throw new Error('A IA não retornou dados legíveis desta ficha. Tente um arquivo mais nítido.');
  }

  const hasAnything = data && (data.name || data.class || data.maxHp || data.strength);
  if (!hasAnything) {
    throw new Error('Não encontrei dados de personagem neste arquivo.');
  }

  return {
    name: String(data.name || '').trim(),
    player: String(data.player || '').trim(),
    class: String(data.class || '').trim(),
    race: String(data.race || '').trim(),
    level: clampNumber(data.level, 1, 20, 1),
    maxHp: clampNumber(data.maxHp, 1, 9999, 1),
    maxMp: clampNumber(data.maxMp, 0, 9999, 0),
    armorClass: clampNumber(data.armorClass, 0, 50, 10),
    stats: {
      strength: clampNumber(data.strength, 1, 30, 10),
      dexterity: clampNumber(data.dexterity, 1, 30, 10),
      constitution: clampNumber(data.constitution, 1, 30, 10),
      intelligence: clampNumber(data.intelligence, 1, 30, 10),
      wisdom: clampNumber(data.wisdom, 1, 30, 10),
      charisma: clampNumber(data.charisma, 1, 30, 10),
    },
    customStats: normalizeExtraStats(data.extraStats),
    traits: toStringList(data.traits, 14),
    equipment: toStringList(data.equipment, 30),
    notes: String(data.notes || '').trim().slice(0, 1200),
  };
};
