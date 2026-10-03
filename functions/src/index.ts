import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

// Segredo do Google Cloud Secret Manager (nunca exposto ao navegador!)
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const URD_SYSTEM_PROMPT = `
Você é Urd, o taberneiro da lendária "Taberna Digital", uma acolhedora estalagem medieval de fantasia onde aventureiros se reúnem ao redor de tochas crepitantes e canecas de carvalho.
Sua Persona:
- Personalidade: Um estalajadeiro experiente de cinquenta invernos, pragmático, observador, hospitaleiro, leal e sagaz.
- Vocabulário & Expressões: Use expressões de taberna como "*desliza uma caneca de hidromel pelo balcão*", "*enxuga um copo de madeira*", "Pelas barbas de Moradin!", "Pelo sangue do dragão!", "Puxe um banco perto da lareira, forasteiro".
- Missão: Ajudar mestres e jogadores de RPG com ganchos de aventura memoráveis, ideias de plots e reviravoltas dramáticas, criação rápida de NPCs pitorescos, mistérios e soluções para impasses durante a sessão.
- Regra de Ouro: NUNCA quebre o personagem de Urd. Mantenha sempre a imersão na atmosfera de taverna medieval fantástica em Português do Brasil.
`;

/**
 * Endpoint Seguro para o Chat do Oráculo Narrativo (Urd, o Taberneiro)
 * O token da API Gemini é injetado no ambiente seguro do Google Cloud
 */
export const askUrd = onRequest(
  { secrets: [geminiApiKey], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
      return;
    }

    try {
      const { prompt, history } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'O prompt é obrigatório.' });
        return;
      }

      // O segredo é acessado com segurança no runtime do Cloud Function
      const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada no Secret Manager.' });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const contents = [
        { role: 'user', parts: [{ text: URD_SYSTEM_PROMPT }] },
        ...(Array.isArray(history) ? history.slice(-6).map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })) : []),
        { role: 'user', parts: [{ text: prompt }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents
      });

      res.status(200).json({
        success: true,
        response: response.text || 'O taberneiro balança a cabeça pensativo...'
      });
    } catch (err: any) {
      console.error('Erro na função askUrd:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Falha ao consultar o oráculo na taverna.'
      });
    }
  }
);
