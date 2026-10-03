import { GoogleGenAI } from '@google/genai';
import { Campaign, CharacterSheet, CompendiumDoc, LoreEntry } from '../types';
import { getEffectiveGeminiKey } from './aiService';

export interface CompendiumData {
  version: string;
  totalDocs: number;
  catalogCounts: {
    monstros: number;
    magias: number;
    classes: number;
    subclasses: number;
    talentos: number;
    racas: number;
    regras: number;
  };
  catalog: {
    monstros: Array<{ title: string; title_en: string; cr: string; type: string; path: string }>;
    magias: Array<{ title: string; title_en: string; info: string; path: string }>;
    classes: Array<{ title: string; title_en: string; path: string }>;
    subclasses: Array<{ title: string; title_en: string; path: string }>;
    talentos: Array<{ title: string; title_en: string; path: string }>;
    racas: Array<{ title: string; title_en: string; path: string }>;
    regras: Array<{ title: string; title_en: string; path: string }>;
  };
  docs: CompendiumDoc[];
}

let cachedCompendium: CompendiumData | null = null;
let cachedImageCatalog: Record<string, string> | null = null;

export const cleanLookupText = (s?: string): string => {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

export const masterOracleService = {
  // Carrega e armazena em cache o compêndio oficial D&D 2024 compilado
  async loadCompendium(): Promise<CompendiumData | null> {
    if (cachedCompendium) return cachedCompendium;
    try {
      const res = await fetch('/data/dnd2024_compendium.json');
      if (res.ok) {
        cachedCompendium = await res.json();
        return cachedCompendium;
      }
    } catch (err) {
      console.warn('Falha ao carregar compêndio local D&D 2024:', err);
    }
    return null;
  },

  // Carrega mapeamento de imagens das ilustrações oficiais
  async loadImageCatalog(): Promise<Record<string, string>> {
    if (cachedImageCatalog) return cachedImageCatalog;
    try {
      const res = await fetch('/assets/images/image_catalog.json');
      if (res.ok) {
        cachedImageCatalog = await res.json();
        return cachedImageCatalog || {};
      }
    } catch (err) {
      console.warn('Falha ao carregar catálogo de imagens:', err);
    }
    return {};
  },

  lookupImage(term1?: string, term2?: string, catalogMap?: Record<string, string>): string | null {
    const map = catalogMap || cachedImageCatalog || {};
    const c1 = cleanLookupText(term1);
    const c2 = cleanLookupText(term2);

    for (const t of [c1, c2]) {
      if (t && map[t]) return map[t];
    }
    for (const t of [c1, c2]) {
      if (!t || t.length < 3) continue;
      for (const [k, v] of Object.entries(map)) {
        if (k.includes(t) || t.includes(k)) return v;
      }
    }
    return null;
  },

  // Motor RAG de Busca Inteligente no Acervo D&D 2024
  searchDocs(query: string, docs: CompendiumDoc[], topK = 8): CompendiumDoc[] {
    const qClean = cleanLookupText(query);
    if (!qClean) return docs.slice(0, topK);

    const queryTokens = query
      .toLowerCase()
      .split(/[^a-zA-Z0-9\u00C0-\u00FF]+/)
      .filter(t => t.length > 2);

    const scored = docs.map(doc => {
      let score = 0;
      const titleClean = cleanLookupText(doc.title);
      const enClean = cleanLookupText(doc.title_en);

      // Match exato no título tem prioridade máxima
      if (titleClean === qClean || enClean === qClean) {
        score += 150;
      } else if (titleClean.includes(qClean) || (enClean && enClean.includes(qClean))) {
        score += 70;
      }

      // Pontuação por token
      for (const token of queryTokens) {
        if (titleClean.includes(token)) score += 25;
        if (enClean.includes(token)) score += 20;
        if (doc.type && doc.type.toLowerCase().includes(token)) score += 15;
        if (doc.category.toLowerCase().includes(token)) score += 10;
        if (doc.content.toLowerCase().includes(token)) score += 3;
      }

      return { doc, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.doc);
  },

  // Gera catálogo oficial formatado em tabela markdown para intenções de listagem
  generateCatalogTable(intent: string, compendium: CompendiumData): string | null {
    const qLower = intent.toLowerCase();

    // 1. Monstros / Bestiário
    if (qLower.includes('monstro') || qLower.includes('bestiario') || qLower.includes('bestiário') || qLower.includes('criatura')) {
      let list = compendium.catalog.monstros;
      let filterTitle = 'Catálogo Oficial Completo de Monstros (D&D 2024)';

      if (qLower.includes('drag')) {
        list = list.filter(m => m.title.toLowerCase().includes('drag') || m.type === 'Dragão');
        filterTitle = 'Bestiário: Dragões Oficiais (D&D 2024)';
      } else if (qLower.includes('morto') || qLower.includes('zumbi') || qLower.includes('esqueleto')) {
        list = list.filter(m => m.type === 'Morto-Vivo' || m.title.toLowerCase().includes('zumbi') || m.title.toLowerCase().includes('esqueleto'));
        filterTitle = 'Bestiário: Mortos-Vivos Oficiais (D&D 2024)';
      } else if (qLower.includes('demonio') || qLower.includes('demônio') || qLower.includes('diabo')) {
        list = list.filter(m => m.type === 'Demônio' || m.type === 'Diabo');
        filterTitle = 'Bestiário: Fiordes, Demônios e Diabos (D&D 2024)';
      }

      const rows = list.slice(0, 100).map(m => `| ${m.title} | ${m.title_en || '—'} | ND ${m.cr} | ${m.type} | Ficha oficial D&D 2024 |`).join('\n');
      return `### 🐉 ${filterTitle} (${list.length} criaturas)\n\n| Monstro (PT-BR) | Nome Original (EN) | ND / CR | Tipo | Resumo / Detalhes |\n| :--- | :--- | :---: | :--- | :--- |\n${rows}`;
    }

    // 2. Magias / Grimório
    if (qLower.includes('magia') || qLower.includes('grimorio') || qLower.includes('grimório') || qLower.includes('feitico') || qLower.includes('feitiço')) {
      const list = compendium.catalog.magias;
      const rows = list.slice(0, 100).map(s => `| ${s.title} | ${s.title_en || '—'} | ${s.info || 'Magia'} | Grimório oficial D&D 2024 |`).join('\n');
      return `### 🔮 Grimório Oficial de Magias (${list.length} magias indexadas)\n\n| Magia (PT-BR) | Nome Original (EN) | Círculo / Tipo | Resumo / Uso |\n| :--- | :--- | :--- | :--- |\n${rows}`;
    }

    // 3. Classes e Subclasses
    if (qLower.includes('classe') || qLower.includes('subclasse')) {
      const rows = compendium.catalog.classes.map(c => `| ${c.title} | ${c.title_en || '—'} | Classe Básica | Livro do Jogador D&D 2024 |`).join('\n');
      return `### ⚔️ Classes Oficiais do D&D 2024\n\n| Classe (PT-BR) | Nome Original (EN) | Categoria | Descrição |\n| :--- | :--- | :--- | :--- |\n${rows}`;
    }

    return null;
  },

  // Consulta ao Oráculo do Mestre integrando Gemini + RAG + Contexto da Campanha
  async askMasterOracle(
    userQuery: string,
    history: Array<{ role: 'user' | 'model'; content: string }>,
    activeCampaign: Campaign,
    compendium: CompendiumData | null,
    customApiKey?: string
  ): Promise<{ text: string; sources: Array<{ title: string; category: string; path: string }> }> {
    const apiKey = getEffectiveGeminiKey(customApiKey);

    // 1. Detecta listagens de catálogo instantâneas
    const qLower = userQuery.toLowerCase();
    const isListing = ['liste', 'listar', 'lista', 'quais', 'todos os', 'todas as', 'catalogo', 'catálogo', 'grimorio', 'grimório', 'bestiario', 'bestiário'].some(k => qLower.includes(k));

    if (isListing && compendium) {
      const catalogTable = this.generateCatalogTable(userQuery, compendium);
      if (catalogTable) {
        return {
          text: `Saudações, Mestre. Aqui está o catálogo solicitado do acervo oficial do D&D 2024, estruturado em tabela interativa para fácil filtragem e consulta:\n\n${catalogTable}\n\n*Clique em qualquer item da tabela acima para inspecionar os detalhes ou faça uma pergunta específica para aprofundar.*`,
          sources: [{ title: 'Catálogo Oficial D&D 2024', category: 'Regras Oficiais', path: 'dnd_2024_regras_ptbr' }]
        };
      }
    }

    // 2. Busca RAG por documentos relevantes no acervo oficial
    let retrievedDocs: CompendiumDoc[] = [];
    if (compendium && compendium.docs.length > 0) {
      retrievedDocs = this.searchDocs(userQuery, compendium.docs, 6);
    }

    // 3. Formata o contexto da campanha (Mesa do Mestre)
    const sheetsSummary = activeCampaign.sheets.length > 0
      ? activeCampaign.sheets.map(s => `- ${s.name} (${s.isNpc ? 'NPC' : 'Herói do Jogador ' + s.player}): ${s.race} ${s.class} Nível ${s.level} | CA: ${s.armorClass} | PV: ${s.hp}/${s.maxHp}`).join('\n')
      : 'Nenhuma ficha cadastrada ainda na sala.';

    const loreSummary = activeCampaign.lore.length > 0
      ? activeCampaign.lore.slice(0, 5).map(l => `- [${l.category.toUpperCase()}] "${l.title}": ${l.content.slice(0, 180)}...`).join('\n')
      : 'Nenhuma crônica registrada ainda na sala.';

    let ragContextText = '';
    if (retrievedDocs.length > 0) {
      ragContextText = '=== REGRAS OFICIAIS DO D&D 2024 (RAG) ===\n' +
        retrievedDocs.map(d => `--- Documento: ${d.title} (${d.category}) ---\n${d.content.slice(0, 3500)}`).join('\n\n') + '\n\n';
    }

    const systemInstruction = `
Você é o Oráculo da Mesa de Pergaminhos, o conselheiro experiente do Mestre de Jogo na lendária Taberna Digital.
Você é um árbitro supremo das regras oficiais de D&D 5ª Edição (2024 Free Rules / SRD 5.2) e um co-roteirista ágil e criativo para o Mestre da sala.

=== DADOS E CONTEXTO DA SALA DO MESTRE ===
- Nome da Campanha: "${activeCampaign.name}" (${activeCampaign.system})
- Descrição da Aventura: "${activeCampaign.description}"
- Mestre Criador da Sala: ${activeCampaign.masterName}
- Heróis & NPCs na Mesa:
${sheetsSummary}
- Crônicas & Rumores Ativos:
${loreSummary}

=== DIRETRIZES FUNDAMENTAIS (REGRAS MANDATÓRIAS DO PROJETO) ===
1. Idioma & Tom: Responda SEMPRE em Português do Brasil com tom erudito, medieval, direto e prático para o Mestre durante a sessão.
2. Fidelidade às Regras Oficiais: Baseie-se estritamente nas regras oficiais do D&D 2024 fornecidas no contexto. Use nomenclatura bilíngue para mecânicas (ex: Pontos de Vida (PV / Hit Points), Classe de Armadura (CA / Armor Class), Nível de Desafio (ND / CR), Teste de Resistência (Saving Throw)).
3. REGRA MANDATÓRIA 2 - LISTAS E CATÁLOGOS OBRIGATORIAMENTE EM TABELAS MARKDOWN:
   Sempre que o Mestre solicitar lista de itens, monstros, magias, armas, ferramentas, condições ou qualquer catálogo, você DEVE OBRIGATORIAMENTE formatar como TABELA MARKDOWN rica:
   | Nome (PT-BR) | Nome Original (EN) | Tipo / Categoria | Custo / ND / Círculo | Resumo / Efeito Principal |
   | :--- | :--- | :--- | :--- | :--- |
   O sistema web converte tabelas Markdown automaticamente em componentes dinâmicos interativos com busca, ordenação e fichas clicáveis!
4. Co-criação de História: Ao sugerir encontros, reviravoltas ou NPCs, adapte-os especificamente para o contexto da campanha e os heróis listados acima.
`;

    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const contents = [
          ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.content }]
          })),
          {
            role: 'user',
            parts: [{ text: `${ragContextText}=== PERGUNTA OU PEDIDO DO MESTRE ===\n${userQuery}` }]
          }
        ];

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            temperature: 0.35
          }
        });

        if (response.text) {
          return {
            text: response.text,
            sources: retrievedDocs.map(d => ({ title: d.title, category: d.category, path: d.path }))
          };
        }
      } catch (err: any) {
        console.warn('Falha na chamada ao Gemini para a Mesa do Mestre:', err);
      }
    }

    // Fallback de Contingência com base no acervo RAG
    if (retrievedDocs.length > 0) {
      const topDoc = retrievedDocs[0];
      return {
        text: `### 📜 ${topDoc.title}\n*Categoria: ${topDoc.category} | D&D 2024*\n\n${topDoc.content.slice(0, 1200)}...\n\n*(Consulte com a chave do Gemini ativa para sínteses dialógicas completas e criação de ganchos personalizados).*`,
        sources: retrievedDocs.map(d => ({ title: d.title, category: d.category, path: d.path }))
      };
    }

    return {
      text: `Mestre da sala "${activeCampaign.name}", os pergaminhos da taberna estão abertos. Você pode rolar dados físicos no painel superior, consultar regras do D&D 2024, examinar as fichas dos seus jogadores e gerar ideias narrativas para a sua sessão.`,
      sources: []
    };
  },

  // Avaliador de rolagem de dados
  rollDice(expression: string): {
    expression: string;
    rolls: number[];
    modifier: number;
    total: number;
    hasNat20: boolean;
    hasNat1: boolean;
  } {
    const cleaned = expression.toLowerCase().replace(/\s+/g, '');
    const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) {
      return { expression, rolls: [20], modifier: 0, total: 20, hasNat20: false, hasNat1: false };
    }

    const numDice = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    const safeNum = Math.min(Math.max(1, numDice), 20);
    const rolls: number[] = [];
    let hasNat20 = false;
    let hasNat1 = false;

    for (let i = 0; i < safeNum; i++) {
      const val = Math.floor(Math.random() * sides) + 1;
      rolls.push(val);
      if (sides === 20) {
        if (val === 20) hasNat20 = true;
        if (val === 1) hasNat1 = true;
      }
    }

    const total = rolls.reduce((acc, v) => acc + v, 0) + modifier;
    return {
      expression,
      rolls,
      modifier,
      total,
      hasNat20,
      hasNat1: hasNat1 && !hasNat20
    };
  }
};
