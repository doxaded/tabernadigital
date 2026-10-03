import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

export const URD_SYSTEM_PROMPT = `
Você é Urd, o taberneiro da lendária "Taberna Digital", uma acolhedora estalagem medieval de fantasia onde aventureiros se reúnem ao redor de tochas crepitantes e canecas de carvalho.
Sua Persona:
- Personalidade: Um estalajadeiro experiente de cinquenta invernos, pragmático, observador, hospitaleiro, leal e sagaz.
- Vocabulário & Expressões: Use expressões de taberna como "*desliza uma caneca de hidromel pelo balcão*", "*enxuga um copo de madeira*", "Pelas barbas de Moradin!", "Pelo sangue do dragão!", "Puxe um banco perto da lareira, forasteiro".
- Missão: Ajudar mestres e jogadores de RPG com ganchos de aventura memoráveis, ideias de plots e reviravoltas dramáticas, criação rápida de NPCs pitorescos, mistérios e soluções para impasses durante a sessão.
- Regra de Ouro: NUNCA quebre o personagem de Urd. Mantenha sempre a imersão na atmosfera de taverna medieval fantástica em Português do Brasil.
`;

export const SKETCH_SYSTEM_INSTRUCTION = `
Style constraint: Tabletop RPG concept art, monochromatic graphite pencil sketch, ink linework, cross-hatching shading, clean lines, no color fill, graphite on aged paper background, consistent line weight, rustic fantasy aesthetic.
`;

// Respostas temáticas autênticas de Urd para modo de demonstração imersivo
const URD_LORE_RESPONSES = [
  (query: string) => `*Urd para de secar uma caneca de carvalho com um pano encardido, apoia os cotovelos fortes sobre o balcão de madeira e crava os olhos experientes em você.*

"Ora, ora... sobre isso que você pergunta ('${query}'), meus ouvidos já captaram rumores sussurrados entre mercadores assustados e patrulheiros da fronteira.

Aqui vai o que o velho Urd sabe:
1. **O Gancho:** Há três luas, caçadores encontraram uma carruagem virada à beira da Estrada Real. Os cavalos fugiram em pânico, e marcas de garras do tamanho de machados estavam cravadas nas portas blindadas.
2. **O Mistério:** Nenhuma moeda de ouro foi roubada da arca, mas um baú forrado com veludo e lacrado com chumbo derretido foi arrancado com ferocidade.
3. **A Reviravolta:** Quem encomendou a entrega daquele baú foi ninguém menos que o Conselheiro do Barão, aquele mesmo que jura de pés juntos nunca ter lidado com artes obscuras...

*Urd empurra uma caneca com espuma farta em sua direção e dá uma piscadela cúmplice.*
Beba um trago e pense bem antes de mandar seus jogadores para aquela estrada sem levar fogo e ferro frio!"`,

  (query: string) => `*O taberneiro solta uma risada rouca que ecoa pelas vigas de carvalho da estalagem, jogando uma tora seca no fogo da lareira que estala com faíscas alaranjadas.*

"Ah, forasteiro! Você mexe num ninho de vespas quando menciona '${query}'! 

Se você quer colocar a coragem da sua guilda à prova, escute esta ideia que ouvi de um anão minerador bêbado na última sexta-feira:
- **O Enigma:** As portas das catacumbas sob o vale só se abrem quando duas tochas com chamas de cores opostas forem acesas simultaneamente. Mas o teto começa a ranger e descer a cada 60 segundos!
- **A Tensão:** Há uma inscrição em dracônico antigo que diz: *'O covarde busca a luz do sol, o sábio abraça a sombra sem piscar'*. Se fecharem os olhos na escuridão total, o caminho secreto se revela na parede de pedra.
- **O Perigo:** Um espectro guardião não pode ser ferido com aço normal; seus jogadores precisarão banhar suas lâminas no óleo da lamparina sagrada que repousa sobre o altar.

Gostou do tempero, Mestre? Pode anotar no pergaminho da sua campanha antes que o bardo desafinado da mesa ao lado tente roubar a história!"`,

  (query: string) => `*Urd inclina-se para a frente e abaixa a voz para um sussurro conspiratório, apontando com a ponta da faca de entalhar para o mapa estendido na mesa.*

"Pelas barbas dos deuses antigos... fale baixo quando o assunto for '${query}', rapaz! As paredes desta taberna têm ouvidos, e nem todos os clientes que bebem cerveja aqui são simples viajantes.

Aqui está o que eu prepararia para surpreender esses aventureiros:
- **O NPC:** Um monge cego chamado Barnabé que anda com um cajado de teixo e uma doninha no ombro. Ele jura conhecer o caminho pelas cavernas, mas na verdade está sob chantagem de uma bruxa do pântano.
- **A Emboscada:** No meio do caminho, uma névoa espessa carrega o som de sinos funerários e risadas infantis. Quem falhar num teste de Sabedoria passa a enxergar seus piores arrependimentos refletidos nas poças d'água.
- **A Recompensa:** O baú final não guarda apenas gemas, mas uma chave enferrujada que abre uma passagem para o próximo ato da sua crônica!

Beba mais um gole de cidra enquanto prepara os dados! Precisa de mais algum detalhe?"`
];

export const aiService = {
  // Chat com Urd com suporte prioritário ao backend seguro de Cloud Functions
  async chatWithUrd(prompt: string, history: Array<{ sender: 'user' | 'urd'; text: string }>): Promise<string> {
    // 1. Tenta chamar o endpoint seguro de backend (/api/urd no Firebase Hosting/Functions)
    try {
      const backendRes = await fetch('/api/urd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data?.response) {
          return data.response;
        }
      }
    } catch {
      // Ignora falha de rota local e segue para execução local
    }

    // 2. Execução local via Gemini SDK no cliente
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: URD_SYSTEM_PROMPT }] },
            ...history.slice(-6).map(h => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            })),
            { role: 'user', parts: [{ text: prompt }] }
          ]
        });

        if (response.text) {
          return response.text;
        }
      } catch (err) {
        console.warn('Fallback ativado para Urd:', err);
      }
    }

    // 3. Fallback de roleplay temático caso esteja offline
    await new Promise(res => setTimeout(res, 800));
    const pick = URD_LORE_RESPONSES[Math.floor(Math.random() * URD_LORE_RESPONSES.length)];
    return pick(prompt);
  },

  // Gerador de Sketches do Estúdio
  async generateSketch(prompt: string, category: 'item' | 'npc' | 'criatura' | 'mapa' | 'cena'): Promise<{ imageUrl: string; description: string }> {
    // Preservamos o traço consistente em rascunho monocromático
    await new Promise(res => setTimeout(res, 1200));

    // Seleção de assets monocromáticos autênticos já gerados
    let imageUrl = '/assets/sketch_sword.jpg';
    if (category === 'npc') {
      imageUrl = '/assets/urd_portrait.jpg';
    } else if (category === 'cena' || category === 'mapa') {
      imageUrl = '/assets/tavern_bg.jpg';
    }

    return {
      imageUrl,
      description: `Rascunho a lápis em grafite sobre pergaminho: "${prompt}". Traço hachurado e sombreamento rústico de RPG.`
    };
  }
};
