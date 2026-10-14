import { GoogleGenAI } from '@google/genai';
import { SketchCostEstimate } from '../types';
import { URD_SYSTEM_PROMPT } from './urdPersona';

export { URD_SYSTEM_PROMPT };

const VITE_ENV_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
  || (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY)
  || '';

// Recupera a melhor chave de API disponível (chave customizada salva ou variável de ambiente)
export const getEffectiveGeminiKey = (customKey?: string): string => {
  if (customKey && customKey.trim()) return customKey.trim();
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('taberna_gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  return VITE_ENV_KEY || '';
};

// Modelos Gemini Oficiais Recomendados
export const GEMINI_SKETCH_MODEL = 'gemini-3.1-flash-image'; // Nano Banana 2: Modelo rápido, econômico (50% mais barato) e de alta performance
export const GEMINI_SKETCH_FALLBACK_MODEL = 'gemini-3-pro-image'; // Nano Banana Pro: Modelo de alta definição e raciocínio profundo
export const GEMINI_TEXT_MODEL = 'gemini-flash-latest'; // Modelo moderno padrão para diálogos e enriquecimento de lore

export const SKETCH_SYSTEM_INSTRUCTION = `
Diretriz de estilo: Arte conceitual para RPG de mesa, rascunho minucioso a lápis grafite monocromático, linhas de nanquim escuro, sombreamento clássico por hachuras cruzadas, traço limpo e expressivo, sem cores, grafite sobre fundo de pergaminho antigo envelhecido, peso de linha consistente, estética rústica e imersiva de fantasia medieval.
`;

export interface GenerateSketchOptions {
  category?: 'item' | 'npc' | 'criatura' | 'mapa' | 'cena';
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9';
  imageSize?: '1K' | '2K';
  customApiKey?: string;
  customRefinedPrompt?: string; // Prompt editado/confirmado pelo usuário no modal de pré-execução
}

export interface GenerateSketchResult {
  imageUrl: string;
  description: string;
  modelUsed: string;
  isAiGenerated: boolean;
  quotaNotice?: string;
  costEstimate?: SketchCostEstimate;
  executedPrompt: string;
}

// Respostas curtas de Urd para modo de contingência (sem ações, linguagem clássica)
const URD_LORE_RESPONSES = [
  (query: string) => `Pelas barbas de Merlim, forasteiro! Sobre "${query}", ouvi rumores na estrada real: uma carruagem tombada, garras do tamanho de machados nas portas e um baú lacrado em chumbo roubado. Deveras estranho.`,
  (query: string) => `Ora essa, mexeis em ninho de vespas! Um anão bêbado me contou que há catacumbas sob o vale que só se abrem com duas tochas de chamas opostas. Cautela, nobre senhor.`,
  (query: string) => `Falai baixo, bom homem, que as paredes desta estalagem têm ouvidos. Quereis saber de "${query}"? Procurai um monge cego chamado Barnabé, mas não vos fieis em demasia: ele é chantageado por uma bruxa do pântano.`
];

// Gera prompt refinado para arte em grafite / sketch de RPG (100% em Língua Portuguesa)
export const buildSketchPrompt = (
  userPrompt: string,
  category: 'item' | 'npc' | 'criatura' | 'mapa' | 'cena' = 'item'
): string => {
  const categoryTerms: Record<string, string> = {
    item: 'item mágico, arma lendária ou relíquia mística de RPG de mesa',
    npc: 'retrato de personagem aventureiro ou frequentador de taverna de RPG de mesa',
    criatura: 'monstro fantástico, fera mística ou criatura de masmorra de RPG de mesa',
    mapa: 'mapa tático de batalha desenhado à mão, cartografia ou planta baixa de RPG de mesa',
    cena: 'cena de interior de taverna medieval fantástica ou arquitetura clássica de RPG'
  };

  const subject = categoryTerms[category] || 'recurso e ilustração de fantasia para RPG de mesa';

  return [
    `Ilustração artística conceitual de alto detalhamento representando ${subject}: "${userPrompt}".`,
    `Técnica e Material: Desenho minucioso a lápis grafite monocromático e traços finos de nanquim escuro.`,
    `Estilo de Traço: Sombreamento por hachuras cruzadas, linhas de contorno expressivas, precisão nos detalhes, estética medieval rústica de livro clássico de RPG.`,
    `Fundo e Suporte: Papel pergaminho antigo com textura artesanal sutil.`,
    `Restrições Estritas: Exclusivamente em preto e branco / grafite monocromático. Sem preenchimento de cores, sem renderização 3D digital plástica, sem filtros fotográficos, traço autêntico de desenho à mão.`
  ].join(' ');
};

// Explica em linguagem clara como o motor compreendeu e estruturou o pedido artístico
export const explainPromptInterpretation = (
  userPrompt: string,
  category: 'item' | 'npc' | 'criatura' | 'mapa' | 'cena' = 'item',
  aspectRatio: string = '1:1'
): string => {
  const categoryNames: Record<string, string> = {
    item: 'Item Mágico / Relíquia / Equipamento',
    npc: 'Personagem / Habitante da Taberna (NPC)',
    criatura: 'Monstro Fantástico / Entidade de Masmorra',
    mapa: 'Cartografia / Planta Baixa Desenhada à Mão',
    cena: 'Cenário Medieval / Salão da Taverna'
  };

  const ratioDescriptions: Record<string, string> = {
    '1:1': 'Quadrado (1024×1024) — Ideal para tokens e avatares',
    '3:4': 'Retrato Vertical (864×1184) — Ideal para cartas e fichas de personagens',
    '4:3': 'Paisagem Clássica (1184×864) — Ideal para ilustrações de cenas',
    '16:9': 'Widescreen Panorâmico (1344×768) — Ideal para mapas e salões'
  };

  return `O motor artístico interpretou seu pedido como um(a) "${categoryNames[category] || 'Ilustração de RPG'}". O traço será guiado por estética tradicional de RPG de mesa: grafite monocromático sobre pergaminho rústico envelhecido, com sombreamento hachurado e nanquim sépia, no formato ${ratioDescriptions[aspectRatio] || aspectRatio}.`;
};

// Taxa efetiva de conversão da Google Cloud Brasil (câmbio comercial + IOF e impostos faturados ~ R$ 6,05 / USD)
export const EFFECTIVE_GOOGLE_CLOUD_BRL_RATE = 6.05;

// Calcula a quantidade de tokens consumidos e estima os custos da geração em USD ($) e BRL (R$)
// Calibrado conforme testes reais em produção faturados na Google Cloud (~R$ 0,90 BRL por geração de imagem)
export const calculateSketchCost = (
  model: string,
  promptText: string,
  imageSize: '1K' | '2K' = '1K',
  actualUsage?: { prompt_token_count?: number; candidates_token_count?: number; total_token_count?: number; prompt_tokens?: number; candidates_tokens?: number; total_tokens?: number }
): SketchCostEstimate => {
  // 1. Tokens de entrada do prompt (considera prompt detalhado + cabeçalhos e formatação do Gemini)
  const promptTokens = actualUsage?.prompt_token_count 
    || actualUsage?.prompt_tokens 
    || Math.max(25, Math.ceil(promptText.length / 3.8) + 20);

  // 2. Tokens de saída da imagem gerada pelo modelo (Google AI Studio: 1K = 1.120 tokens, 2K = 1.680 tokens)
  const baseImageTokens = imageSize === '2K' ? 1680 : 1120;
  const outputTokens = actualUsage?.candidates_token_count 
    || actualUsage?.candidates_tokens 
    || (baseImageTokens + 65); // +65 tokens da descrição de lore gerada pelo Gemini Flash

  const totalTokens = actualUsage?.total_token_count 
    || actualUsage?.total_tokens 
    || (promptTokens + outputTokens);

  // 3. Custos calibrados com base na fatura real da Google Cloud Brasil:
  // No nível pago, a geração de imagem com multimodalidade e impostos locais custa ~R$ 0,90 BRL (~$0.148 USD)
  const isPro = model.toLowerCase().includes('pro');
  const inputRatePerMillion = isPro ? 2.00 : 0.25;
  const imageBaseCost = isPro 
    ? (imageSize === '2K' ? 0.360 : 0.240) 
    : (imageSize === '2K' ? 0.220 : 0.148);

  const inputCost = (promptTokens / 1_000_000) * inputRatePerMillion;
  const loreCost = (180 / 1_000_000) * 0.15; // Estimativa residual de lore do Gemini Flash

  const totalUsd = imageBaseCost + inputCost + loreCost;
  const totalBrl = totalUsd * EFFECTIVE_GOOGLE_CLOUD_BRL_RATE;

  return {
    promptTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: Number(totalUsd.toFixed(4)),
    estimatedCostBrl: Number(totalBrl.toFixed(2)),
    model,
    calculatedAt: new Date().toISOString()
  };
};

// Otimizador de imagem base64 para armazenamento leve no navegador
export const compressBase64Image = (dataUrl: string, maxDim = 1024, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const aiService = {
  // Chat com Urd: Gemini direto com a mesma chave usada nas imagens (getEffectiveGeminiKey)
  async chatWithUrd(prompt: string, history: Array<{ sender: 'user' | 'urd'; text: string }>, customApiKey?: string): Promise<string> {
    const apiKey = getEffectiveGeminiKey(customApiKey);

    // Histórico recente; o Gemini espera que a conversa comece com uma fala do usuário
    const recent = history.slice(-14);
    const firstUser = recent.findIndex(h => h.sender === 'user');
    const turns = (firstUser === -1 ? [] : recent.slice(firstUser)).map(h => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // 1. Execução direta via Google Gen AI SDK
    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const response = await client.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: [...turns, { role: 'user', parts: [{ text: prompt }] }],
          config: { systemInstruction: URD_SYSTEM_PROMPT }
        });

        if (response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err) {
        console.error('[Urd] Falha ao conversar com o Gemini:', err);
      }
    }

    // 2. Endpoint de backend (Cloud Function), caso esteja publicado
    try {
      const backendRes = await fetch('/api/urd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      });
      if (backendRes.ok && (backendRes.headers.get('content-type') || '').includes('application/json')) {
        const data = await backendRes.json();
        if (data?.response) {
          return data.response;
        }
      }
    } catch {
      // Ignora e segue para o roleplay de contingência
    }

    // 3. Fallback de roleplay temático imersivo
    await new Promise(res => setTimeout(res, 800));
    const pick = URD_LORE_RESPONSES[Math.floor(Math.random() * URD_LORE_RESPONSES.length)];
    return pick(prompt);
  },

  // Gerador de Sketches do Estúdio conectado ao Gemini: gemini-3.1-flash-image (Nano Banana 2)
  async generateSketch(
    prompt: string,
    category: 'item' | 'npc' | 'criatura' | 'mapa' | 'cena' = 'item',
    options?: GenerateSketchOptions
  ): Promise<GenerateSketchResult> {
    const apiKey = getEffectiveGeminiKey(options?.customApiKey);
    const aspectRatio = options?.aspectRatio || '1:1';
    const imageSize = options?.imageSize || '1K';
    const enhancedPrompt = (options?.customRefinedPrompt && options.customRefinedPrompt.trim())
      ? options.customRefinedPrompt.trim()
      : buildSketchPrompt(prompt, category);

    let quotaNotice: string | undefined = undefined;

    // Se houver chave Gemini disponível, tenta a geração com os modelos de ponta
    if (apiKey) {
      // Prioridade 1: gemini-3.1-flash-image (Nano Banana 2: Rápido, econômico e eficiente)
      // Prioridade 2: gemini-3-pro-image (Nano Banana Pro: Fallback de alta resolução)
      const candidateModels = [GEMINI_SKETCH_MODEL, GEMINI_SKETCH_FALLBACK_MODEL];

      for (const model of candidateModels) {
        try {
          const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
            method: 'POST',
            headers: {
              'x-goog-api-key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              input: enhancedPrompt,
              response_format: {
                type: 'image',
                mime_type: 'image/jpeg',
                aspect_ratio: aspectRatio,
                image_size: imageSize
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            let base64Image: string | undefined = data?.output_image?.data;
            let mimeType: string = data?.output_image?.mime_type || 'image/jpeg';

            // Busca na árvore de steps se não estiver direto na raiz
            if (!base64Image && Array.isArray(data?.steps)) {
              for (const step of data.steps) {
                if (step.type === 'model_output' && Array.isArray(step.content)) {
                  const imgPart = step.content.find((c: any) => c.type === 'image' && c.data);
                  if (imgPart) {
                    base64Image = imgPart.data;
                    mimeType = imgPart.mime_type || mimeType;
                    break;
                  }
                }
              }
            }

            if (base64Image) {
              let finalImageUrl = `data:${mimeType};base64,${base64Image}`;
              try {
                // Comprime suavemente para caber confortavelmente em múltiplos assets
                finalImageUrl = await compressBase64Image(finalImageUrl, 1024, 0.85);
              } catch (compErr) {
                console.warn('Erro ao otimizar base64:', compErr);
              }

              const actualUsage = (data as any)?.usage_metadata || (data as any)?.usageMetadata || (data as any)?.usage;
              const costEstimate = calculateSketchCost(model, enhancedPrompt, imageSize, actualUsage);
              const description = await this.describeSketchWithGemini(prompt, category, apiKey);

              return {
                imageUrl: finalImageUrl,
                description,
                modelUsed: model,
                isAiGenerated: true,
                costEstimate,
                executedPrompt: enhancedPrompt
              };
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData?.error?.message || res.statusText;
            console.warn(`[Gemini Sketch] Retorno da API para ${model} (HTTP ${res.status}):`, errMsg);

            if (res.status === 429 || errMsg.includes('Rate limit') || errMsg.includes('quota') || errMsg.includes('limit: 0')) {
              quotaNotice = `Aviso do Google AI Studio para ${model}: ${errMsg}`;
            }
          }
        } catch (callErr: any) {
          console.warn(`[Gemini Sketch] Erro de rede na chamada para ${model}:`, callErr.message);
        }
      }
    } else {
      quotaNotice = 'Nenhuma chave Gemini configurada. Utilizando modo rascunho de contingência.';
    }

    // Se a chamada de imagem não gerou imagem direta (ex: cota ou offline),
    // enriquecemos o rascunho com descrição artística detalhada gerada pelo Gemini Flash
    const description = await this.describeSketchWithGemini(prompt, category, apiKey);
    const fallbackCost = calculateSketchCost(GEMINI_SKETCH_MODEL, enhancedPrompt, imageSize);

    // Seleção de asset de traço tradicional de acordo com a categoria
    let imageUrl = '/assets/sketch_sword.jpg';
    if (category === 'npc') {
      imageUrl = '/assets/urd_portrait.jpg';
    } else if (category === 'cena' || category === 'mapa') {
      imageUrl = '/assets/tavern_bg.jpg';
    }

    return {
      imageUrl,
      description,
      modelUsed: GEMINI_SKETCH_MODEL,
      isAiGenerated: false,
      quotaNotice,
      costEstimate: {
        ...fallbackCost,
        estimatedCostUsd: 0,
        estimatedCostBrl: 0
      },
      executedPrompt: enhancedPrompt
    };
  },

  // Gera uma descrição de ficha temática para o rascunho usando o Gemini
  async describeSketchWithGemini(prompt: string, category: string, apiKey?: string): Promise<string> {
    const key = apiKey || getEffectiveGeminiKey();
    if (key) {
      try {
        const client = new GoogleGenAI({ apiKey: key });
        const res = await client.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: `Escreva em 1 ou 2 frases curtas e imersivas em Português do Brasil a descrição visual de um rascunho de RPG de mesa a lápis grafite retratando: "${prompt}" (categoria: ${category}). Destaque o traço em nanquim, as hachuras e os detalhes medievais no pergaminho. Sem introduções genéricas.`
        });
        if (res.text && res.text.trim()) {
          return res.text.trim();
        }
      } catch (err) {
        console.warn('[Gemini Sketch] Falha ao gerar descrição com Gemini Flash:', err);
      }
    }

    return `Rascunho a lápis em grafite sobre pergaminho: "${prompt}". Traço hachurado e sombreamento rústico de RPG.`;
  }
};
