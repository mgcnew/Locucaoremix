import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const TEXT_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.8-flash'];
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

async function generateTextWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  temperature = 0.8
): Promise<string> {
  let lastError: any = null;
  for (const modelName of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[VozVarejo] Modelo ${modelName} indisponível (${err?.status || err?.message}), tentando próximo...`);
    }
  }
  throw lastError || new Error('Todos os modelos de texto estão ocupados no momento.');
}

// Status: informa ao front se a IA (Gemini) está configurada
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({ ai: Boolean(process.env.GEMINI_API_KEY) });
});

// Endpoint 1: Roteirizador Promocional com IA
app.post('/api/generate-script', async (req: Request, res: Response) => {
  const {
    storeName,
    storeType = 'supermercado',
    slogan = '',
    location = '',
    tone = 'varejao_energico',
    targetDuration = 'media',
    products = [],
    customOfferText = '',
    additionalNotes = '',
    paymentMethods = 'Aceitamos cartões, dinheiro e Pix!',
    openingGreeting = '',
    closingPhrase = '',
  } = req.body;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackScript = generateFallbackScript({
        storeName: storeName || 'Nosso Estabelecimento',
        storeType,
        slogan,
        tone,
        products,
        customOfferText,
        paymentMethods,
        targetDuration,
      });
      return res.json({
        success: true,
        script: fallbackScript.text,
        headline: fallbackScript.headline,
        callToAction: fallbackScript.cta,
        audioTips: 'Ritmo comercial animado e destaque nos preços.',
        estimatedDuration: targetDuration,
      });
    }

    const toneDescriptions: Record<string, string> = {
      varejao_energico:
        'Locução de varejão estilo rádio popular: entusiasmada, rápida, enérgica, com chamadas como "Atenção clientes!", "Preço baixo de verdade!", "Corre aproveitar!".',
      acougue_especial:
        'Locução especialista em carnes e churrasco: apetitosa, destacando a qualidade dos cortes, maciez, carnes frescas selecionadas para o churrasco ou dia a dia.',
      amigavel_acolhedor:
        'Tom acolhedor, familiar, simpático e próximo do cliente, transmitindo confiança, qualidade e carinho.',
      festa_aniversario:
        'Clima festivo de aniversário e campanha especial: muita alegria, celebração e preços de festa.',
      oferta_relampago:
        'Alerta urgente de oferta relâmpago: "Atenção loja!", "É só enquanto durar o estoque!", ritmo dinâmico.',
      final_de_semana:
        'Foco no fim de semana em família: churrasco, bebida gelada, almoço especial e economia.',
    };

    const durationNormalized =
      targetDuration === 'curta' || targetDuration === '15s'
        ? 'curta'
        : targetDuration === 'longa' || targetDuration === '60s'
        ? 'longa'
        : 'media';

    const durationConfigs: Record<string, { label: string; range: string; words: string }> = {
      curta: {
        label: 'Curta (15 a 20 segundos)',
        range: '15s a 20s',
        words: '35 a 50 palavras',
      },
      media: {
        label: 'Média (30 a 40 segundos)',
        range: '30s a 40s',
        words: '70 a 95 palavras',
      },
      longa: {
        label: 'Longa (60 a 90 segundos)',
        range: '60s a 90s',
        words: '140 a 185 palavras',
      },
    };

    const currentDurationConfig = durationConfigs[durationNormalized];

    const prompt = `Você é um locutor comercial profissional de supermercados e açougues no Brasil.
Crie um texto pronto para locução que soe natural, humano e vendedor no microfone da loja.

DADOS:
- Estabelecimento: "${storeName || 'Nosso Mercado'}"
- Segmento: ${storeType === 'acougue' ? 'Açougue e Casa de Carnes' : 'Supermercado e Varejo'}
- Estilo da Locução: ${toneDescriptions[tone] || toneDescriptions.varejao_energico}
- Duração desejada: ${currentDurationConfig.label} (${currentDurationConfig.words})
- Pagamento: "${paymentMethods}"
${slogan ? `- Slogan: "${slogan}"` : ''}
${location ? `- Endereço: "${location}"` : ''}
${openingGreeting ? `- Abertura: "${openingGreeting}"` : ''}
${closingPhrase ? `- Fechamento: "${closingPhrase}"` : ''}

OFERTAS PARA ANUNCIAR:
${
  products && products.length > 0
    ? products
        .map((p: any, i: number) => {
          const dePor = p.regularPrice
            ? `(De R$ ${p.regularPrice} por R$ ${p.promoPrice})`
            : `(Por apenas R$ ${p.promoPrice})`;
          return `${i + 1}. ${p.name} ${dePor} ${p.unit || 'kg'}`;
        })
        .join('\n')
    : customOfferText || 'Ofertas especiais selecionadas hoje!'
}
${additionalNotes ? `Observação extra: ${additionalNotes}` : ''}

REGRAS:
1. Escreva um texto corrido pronto para ser falado no microfone, sem marcações de palco como "[música]" ou "[locutor]".
2. Cite o nome "${storeName || 'nossa loja'}" na abertura e no encerramento.
3. Respeite a quantidade de palavras (${currentDurationConfig.words}).

Retorne APENAS um JSON válido:
{
  "headline": "Título curto da campanha",
  "script": "Texto completo da locução",
  "callToAction": "Frase final de impacto",
  "audioTips": "Dica breve de entonação",
  "estimatedDuration": "${currentDurationConfig.range}"
}`;

    const text = await generateTextWithFallback(ai, prompt, 0.85);
    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Falha ao decodificar JSON gerado.');
      }
    }

    return res.json({
      success: true,
      script: parsedData.script,
      headline: parsedData.headline || `Ofertas - ${storeName}`,
      callToAction: parsedData.callToAction || `Vem pro ${storeName}!`,
      audioTips: parsedData.audioTips || 'Fale com entusiasmo e destaque os preços.',
      estimatedDuration: parsedData.estimatedDuration || currentDurationConfig.range,
    });
  } catch (error: any) {
    console.warn('Usando gerador local de contingência para roteiro:', error?.message);
    const fallbackScript = generateFallbackScript({
      storeName: storeName || 'Nosso Estabelecimento',
      storeType,
      slogan,
      tone,
      products,
      customOfferText,
      paymentMethods,
      targetDuration,
    });

    return res.json({
      success: true,
      script: fallbackScript.text,
      headline: fallbackScript.headline,
      callToAction: fallbackScript.cta,
      audioTips: 'Ritmo comercial animado e ênfase no nome da loja.',
      estimatedDuration: targetDuration,
    });
  }
});

// Endpoint 2: Refinar / Ajustar Roteiro existente com IA
app.post('/api/refine-script', async (req: Request, res: Response) => {
  const { originalScript, instruction, storeName } = req.body;
  if (!originalScript || !instruction) {
    return res.status(400).json({
      success: false,
      error: 'Roteiro e instrução de ajuste são obrigatórios.',
    });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      const refined = applyLocalRefinement(originalScript, instruction, storeName);
      return res.json({
        success: true,
        script: refined,
      });
    }

    const prompt = `Você é um locutor e redator comercial especialista em supermercados e açougues.
Reescreva o roteiro abaixo aplicando o pedido de ajuste do cliente.

ESTABELECIMENTO: "${storeName || 'Nossa Loja'}"

ROTEIRO ATUAL:
"${originalScript}"

PEDIDO DE AJUSTE:
"${instruction}"

REGRAS:
- Entregue APENAS o texto falado pelo locutor (sem colchetes como [Locutor] ou [Música]).
- Mantenha os produtos e preços do roteiro atual, aplicando o ajuste pedido.

Retorne EXCLUSIVAMENTE um objeto JSON:
{
  "script": "Texto ajustado da locução pronto para falar"
}`;

    const text = await generateTextWithFallback(ai, prompt, 0.75);
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    if (parsed && parsed.script) {
      return res.json({
        success: true,
        script: parsed.script,
      });
    }

    const fallbackRefined = applyLocalRefinement(originalScript, instruction, storeName);
    return res.json({
      success: true,
      script: fallbackRefined,
    });
  } catch (error: any) {
    console.warn('Usando refinador local inteligente:', error?.message);
    const refined = applyLocalRefinement(originalScript, instruction, storeName);
    return res.json({
      success: true,
      script: refined,
    });
  }
});

// Endpoint 3: Síntese de Voz Profissional (Gemini TTS)
app.post('/api/generate-tts', async (req: Request, res: Response) => {
  const {
    text,
    voiceName = 'Fenrir',
    tone = 'varejao_energico',
  } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texto para locução é obrigatório.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: false,
      fallbackToWebSpeech: true,
      error: 'A voz profissional ainda não está ativada. Peça a quem instalou o VozVarejo para ativar a IA.',
    });
  }

  const styleByTone: Record<string, string> = {
    varejao_energico:
      'Locutor comercial de supermercado brasileiro muito animado, voz firme, ritmo dinâmico e alegre.',
    acougue_especial:
      'Locutor caloroso de casa de carnes e churrasco, voz encorpada e convidativa.',
    amigavel_acolhedor:
      'Locutor simpático, acolhedor, cordial e próximo dos clientes.',
    festa_aniversario:
      'Locutor empolgado comemorando grande festa de aniversário de ofertas.',
    oferta_relampago:
      'Locutor urgente e vibrante anunciando oferta relâmpago.',
    final_de_semana:
      'Locutor animado anunciando ofertas de fim de semana e churrasco.',
  };

  const chosenStyle = styleByTone[tone] || styleByTone.varejao_energico;

  for (const ttsModel of TTS_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text,
                speechMetadata: {
                  style: chosenStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          voiceName,
        });
      }
    } catch (error: any) {
      console.warn(`[VozVarejo] TTS ${ttsModel} falhou (${error?.message}), tentando alternativa...`);
    }
  }

  return res.json({
    success: false,
    fallbackToWebSpeech: true,
    error: 'Serviço de voz ocupado no momento.',
  });
});

// Refinador inteligente local caso a API de texto passe por pico de demanda
function applyLocalRefinement(originalScript: string, instruction: string, storeName = 'nossa loja'): string {
  const lower = instruction.toLowerCase();
  let text = originalScript.trim();

  if (lower.includes('curt') || lower.includes('encurtar') || lower.includes('resum')) {
    const sentences = text
      .split(/(?<=[.!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length > 3) {
      const first = sentences[0];
      const middle = sentences.slice(1, Math.max(2, Math.ceil(sentences.length * 0.6))).join(' ');
      const last = sentences[sentences.length - 1];
      return `${first} ${middle} Aproveite já no ${storeName}! ${last}`;
    }
    return `Atenção clientes do ${storeName}! Oferta rápida: ${text}`;
  }

  if (lower.includes('energ') || lower.includes('animad') || lower.includes('varej')) {
    const cleaned = text.replace(/^Atenção[^!]*!\s*/i, '');
    return `ATENÇÃO LOJA! PAROU TUDO NO ${storeName.toUpperCase()}! Olha o preço baixo passando no seu carrinho agora! ${cleaned} Corre que é só hoje, vem aproveitar!`;
  }

  if (lower.includes('carn') || lower.includes('churrasc') || lower.includes('brasa') || lower.includes('maciez')) {
    return `Atenção amantes de um bom churrasco! Cortes selecionados, fresquinhos e com aquela maciez de dar água na boca aqui no ${storeName}! ${text} Garanta já a carne perfeita para a sua grelha!`;
  }

  if (lower.includes('pix') || lower.includes('cart')) {
    if (!text.toLowerCase().includes('pix')) {
      return `${text} E para facilitar suas compras, aceitamos Pix, cartões de débito e crédito!`;
    }
    return `${text} Pague com toda facilidade no Pix ou no cartão aqui no ${storeName}!`;
  }

  if (lower.includes('acolhedor') || lower.includes('amig') || lower.includes('famíl') || lower.includes('suav')) {
    const cleaned = text.replace(/PAROU TUDO!?/gi, 'Que alegria receber você aqui!');
    return `Olá amigos e clientes do ${storeName}, sejam muito bem-vindos! Preparamos com todo carinho ofertas especiais para a mesa da sua família: ${cleaned}`;
  }

  // Instrução livre personalizada
  const cleanInstruction = instruction
    .replace(/^(adicione que|fale que|inclua que|diga que|coloque que)\s+/i, '')
    .trim();
  const formattedAddition =
    cleanInstruction.charAt(0).toUpperCase() + cleanInstruction.slice(1);
  const endingPunctuation = /[.!?]$/.test(formattedAddition) ? '' : '!';

  return `${text} Lembrando você: ${formattedAddition}${endingPunctuation} Esperamos você no ${storeName}!`;
}

// Helper de Fallback para criação de roteiro
function generateFallbackScript(params: {
  storeName: string;
  storeType: string;
  slogan: string;
  tone: string;
  products: any[];
  customOfferText: string;
  paymentMethods: string;
  targetDuration?: string;
}) {
  const { storeName, slogan, products, customOfferText, paymentMethods, targetDuration = 'media' } = params;
  const isCurta = targetDuration === 'curta' || targetDuration === '15s';
  const isLonga = targetDuration === 'longa' || targetDuration === '60s';

  let itemsText = '';
  if (products && products.length > 0) {
    if (isCurta) {
      const p = products[0];
      itemsText = `tem ${p.name} por APENAS R$ ${p.promoPrice} ${p.unit || 'o quilo'}!`;
    } else if (isLonga) {
      itemsText = products
        .map(
          (p) =>
            `No nosso balcão de ofertas tem ${p.name}, qualidade selecionada, ${
              p.regularPrice ? `de R$ ${p.regularPrice} ` : ''
            }por APENAS R$ ${p.promoPrice} ${p.unit || 'o quilo'}!`
        )
        .join(' E tem mais economia para você: ');
    } else {
      itemsText = products
        .slice(0, 4)
        .map(
          (p) =>
            `Tem ${p.name}${p.regularPrice ? ` de R$ ${p.regularPrice}` : ''} por APENAS R$ ${p.promoPrice} ${p.unit || 'o quilo'}!`
        )
        .join(' E não para por aí: ');
    }
  } else {
    itemsText =
      customOfferText ||
      'ofertas especiais preparadas hoje para você economizar de verdade!';
  }

  let script = '';
  if (isCurta) {
    script = `Atenção clientes do ${storeName}! Oferta rápida passando agora: ${itemsText} Corre aproveitar enquanto durar o estoque no ${storeName}!`;
  } else if (isLonga) {
    script = `Atenção clientes e amigos do ${storeName}! Parou tudo para ouvir o nosso festival de ofertas! Quem pesquisa qualidade e preço baixo compra aqui! ${itemsText} É produto fresquinho e selecionado direto para a mesa da sua família! ${paymentMethods} Venha aproveitar agora mesmo no ${storeName}${slogan ? ` — ${slogan}` : ''}!`;
  } else {
    script = `Atenção clientes amigos do ${storeName}! Confira as ofertas imperdíveis que preparamos para você hoje! ${itemsText} Qualidade garantida e economia de verdade para o seu bolso! ${paymentMethods} Vem pro ${storeName}!`;
  }

  return {
    headline: `Ofertas - ${storeName}`,
    text: script,
    cta: `Aproveite hoje no ${storeName}!`,
  };
}

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[VozVarejo] Servidor rodando em http://0.0.0.0:${port}`);
  });
}

startServer();
