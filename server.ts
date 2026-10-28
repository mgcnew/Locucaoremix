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
      console.warn(
        `[VozVarejo] Modelo ${modelName} indisponível (${err?.status || err?.message}), tentando próximo...`
      );
    }
  }
  throw lastError || new Error('Todos os modelos de texto estão ocupados no momento.');
}

function resolveRadioStationName(storeName?: string, radioStationName?: string): string {
  const trimmedRadio = (radioStationName || '').trim();
  if (trimmedRadio) return trimmedRadio;
  const trimmedStore = (storeName || '').trim() || 'Nossa Loja';
  if (/^r[áa]dio\b/i.test(trimmedStore)) {
    return trimmedStore;
  }
  return `Rádio ${trimmedStore}`;
}

// Status: informa ao front se a IA (Gemini) está configurada
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({ ai: Boolean(process.env.GEMINI_API_KEY) });
});

// Endpoint 1: Roteirizador Promocional com IA (Comercial Tradicional & Modo Rádio Interna)
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
    scriptMode = 'comercial',
    radioFormat = 'flash_interrupcao',
    radioStationName = '',
  } = req.body;

  const effectiveStoreName = (storeName || '').trim() || 'Nosso Estabelecimento';
  const effectiveRadioName = resolveRadioStationName(effectiveStoreName, radioStationName);

  try {
    const ai = getGeminiClient();

    if (!ai) {
      const fallbackScript = generateFallbackScript({
        storeName: effectiveStoreName,
        storeType,
        slogan,
        tone,
        products,
        customOfferText,
        paymentMethods,
        targetDuration,
        scriptMode,
        radioFormat,
        effectiveRadioName,
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
      fechamento_loja:
        'Chamada cordial e urgente de reta final do expediente na loja, convidando os clientes a garantirem as últimas ofertas.',
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
        words: '38 a 55 palavras',
      },
      media: {
        label: 'Média (30 a 40 segundos)',
        range: '30s a 40s',
        words: '75 a 100 palavras',
      },
      longa: {
        label: 'Longa (60 a 90 segundos)',
        range: '60s a 90s',
        words: '145 a 190 palavras',
      },
    };

    const currentDurationConfig = durationConfigs[durationNormalized];

    const modeInstructions =
      scriptMode === 'radio'
        ? radioFormat === 'dupla_locutores'
          ? `FORMATO ESPECIAL: PROGRAMA DE RÁDIO AO VIVO COM DUPLA DE LOCUTORES (${effectiveRadioName})
- Escreva o roteiro como um diálogo super dinâmico, carismático e natural entre dois apresentadores de rádio: "Locutor:" e "Locutora:".
- Cada fala DEVE começar em uma nova linha exatamente com "Locutor: " ou "Locutora: ".
- Na abertura, o Locutor ou a Locutora interrompe a programação musical da rádio (ex: "Locutor: E paramos a nossa programação aqui na ${effectiveRadioName} porque o balcão de ofertas do ${effectiveStoreName} acaba de liberar preços imperdíveis!").
- Durante o meio, Locutor e Locutora revezam anunciando os produtos e preços com entusiasmo, comentando a qualidade e convidando quem está na loja a encher o carrinho.
- No encerramento, eles se despedem juntos e devolvem para a música citando nominalmente a rádio (ex: "Locutora: Aproveite aqui no ${effectiveStoreName}! E voltamos agora com a programação musical da ${effectiveRadioName}!").`
          : `FORMATO ESPECIAL: LOCUÇÃO ESTILO RÁDIO INTERNA — INTERRUPÇÃO DA PROGRAMAÇÃO (${effectiveRadioName})
- O locutor age literalmente como o apresentador oficial da rádio interna "${effectiveRadioName}".
- ABERTURA OBRIGATÓRIA ESTILO RÁDIO: Inicie interrompendo a programação musical com naturalidade e carisma de radialista (ex: "E paramos a nossa programação aqui na ${effectiveRadioName} para um plantão de ofertas especiais no ${effectiveStoreName}!" ou "Atenção ouvintes e clientes, interrompemos a nossa programação musical porque tem promoção saindo agora no ${effectiveStoreName}!").
- DESENVOLVIMENTO: Anuncie os produtos e preços com ritmo envolvente de locutor de rádio conversando com quem está nos corredores da loja.
- ENCERRAMENTO OBRIGATÓRIO ESTILO RÁDIO: Finalize convidando o cliente a aproveitar e devolva para a música citando o nome da rádio (ex: "Encha o carrinho e aproveite! E voltamos agora com a programação da ${effectiveRadioName}!").`
        : `FORMATO: LOCUÇÃO COMERCIAL TRADICIONAL DE LOJA
- Escreva um texto corrido pronto para ser falado no microfone da loja, sem marcações de palco como "[música]" ou "[locutor]".
- Cite o nome "${effectiveStoreName}" na abertura e no encerramento.`;

    const prompt = `Você é um locutor comercial e radialista profissional de supermercados e açougues no Brasil.
Crie um roteiro autêntico, humano e vendedor pronto para ir ao ar.

DADOS:
- Estabelecimento: "${effectiveStoreName}"
- Nome da Rádio Interna: "${effectiveRadioName}"
- Segmento: ${storeType === 'acougue' ? 'Açougue e Casa de Carnes' : 'Supermercado e Varejo'}
- Estilo/Clima: ${toneDescriptions[tone] || toneDescriptions.varejao_energico}
- Duração desejada: ${currentDurationConfig.label} (${currentDurationConfig.words})
- Pagamento: "${paymentMethods}"
${slogan ? `- Slogan: "${slogan}"` : ''}
${location ? `- Endereço: "${location}"` : ''}
${openingGreeting && scriptMode !== 'radio' ? `- Abertura sugerida: "${openingGreeting}"` : ''}
${closingPhrase && scriptMode !== 'radio' ? `- Fechamento sugerido: "${closingPhrase}"` : ''}

${modeInstructions}

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

REGRAS FINAIS:
1. Não use rubricas entre colchetes como "[música sobe]" ou "[efeito sonoro]".
2. Respeite a quantidade aproximada de palavras (${currentDurationConfig.words}).

Retorne APENAS um JSON válido:
{
  "headline": "Título curto da locução",
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
      headline:
        parsedData.headline ||
        (scriptMode === 'radio' ? `Flash ${effectiveRadioName}` : `Ofertas - ${effectiveStoreName}`),
      callToAction: parsedData.callToAction || `Vem pro ${effectiveStoreName}!`,
      audioTips: parsedData.audioTips || 'Fale com entusiasmo e destaque os preços.',
      estimatedDuration: parsedData.estimatedDuration || currentDurationConfig.range,
    });
  } catch (error: any) {
    console.warn('Usando gerador local de contingência para roteiro:', error?.message);
    const fallbackScript = generateFallbackScript({
      storeName: effectiveStoreName,
      storeType,
      slogan,
      tone,
      products,
      customOfferText,
      paymentMethods,
      targetDuration,
      scriptMode,
      radioFormat,
      effectiveRadioName,
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
  const {
    originalScript,
    instruction,
    storeName,
    scriptMode = 'comercial',
    radioFormat = 'flash_interrupcao',
    radioStationName = '',
  } = req.body;

  if (!originalScript || !instruction) {
    return res.status(400).json({
      success: false,
      error: 'Roteiro e instrução de ajuste são obrigatórios.',
    });
  }

  const effectiveStoreName = (storeName || '').trim() || 'Nossa Loja';
  const effectiveRadioName = resolveRadioStationName(effectiveStoreName, radioStationName);

  try {
    const ai = getGeminiClient();
    if (!ai) {
      const refined = applyLocalRefinement(
        originalScript,
        instruction,
        effectiveStoreName,
        scriptMode,
        radioFormat,
        effectiveRadioName
      );
      return res.json({
        success: true,
        script: refined,
      });
    }

    const radioContextRule =
      scriptMode === 'radio'
        ? radioFormat === 'dupla_locutores'
          ? `- Mantenha o formato de diálogo entre "Locutor:" e "Locutora:" em linhas separadas, com a interrupção da programação na abertura e o encerramento voltando para a programação da "${effectiveRadioName}".`
          : `- Mantenha o formato de locutor da "${effectiveRadioName}", iniciando com a interrupção da programação e encerrando com "E voltamos agora com a programação da ${effectiveRadioName}!".`
        : '- Entregue APENAS o texto falado pelo locutor (sem colchetes como [Locutor] ou [Música]).';

    const prompt = `Você é um locutor e redator comercial especialista em supermercados, açougues e rádios internas.
Reescreva o roteiro abaixo aplicando o pedido de ajuste do cliente.

ESTABELECIMENTO: "${effectiveStoreName}"
RÁDIO INTERNA: "${effectiveRadioName}"

ROTEIRO ATUAL:
"${originalScript}"

PEDIDO DE AJUSTE:
"${instruction}"

REGRAS:
${radioContextRule}
- Mantenha os produtos e preços do roteiro atual, aplicando o ajuste pedido com naturalidade.

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

    const fallbackRefined = applyLocalRefinement(
      originalScript,
      instruction,
      effectiveStoreName,
      scriptMode,
      radioFormat,
      effectiveRadioName
    );
    return res.json({
      success: true,
      script: fallbackRefined,
    });
  } catch (error: any) {
    console.warn('Usando refinador local inteligente:', error?.message);
    const refined = applyLocalRefinement(
      originalScript,
      instruction,
      effectiveStoreName,
      scriptMode,
      radioFormat,
      effectiveRadioName
    );
    return res.json({
      success: true,
      script: refined,
    });
  }
});

// Helper: Extrai falas de diálogo (Locutor / Locutora) ou divide texto em 2 vozes para Multi-Speaker TTS
function buildDialogueTurns(rawText: string): Array<{ speaker: 'Locutor' | 'Locutora'; text: string }> {
  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const labeledTurns: Array<{ speaker: 'Locutor' | 'Locutora'; text: string }> = [];

  for (const line of lines) {
    const match = line.match(/^(locutora|locutor|apresentadora|apresentador)\s*:\s*(.+)$/i);
    if (match) {
      const role = match[1].toLowerCase();
      const speaker: 'Locutor' | 'Locutora' =
        role === 'locutora' || role === 'apresentadora' ? 'Locutora' : 'Locutor';
      labeledTurns.push({ speaker, text: match[2].trim() });
    } else if (labeledTurns.length > 0) {
      // Continuação da fala anterior
      labeledTurns[labeledTurns.length - 1].text += ` ${line}`;
    }
  }

  if (labeledTurns.length >= 2) {
    return labeledTurns;
  }

  // Se o texto não tinha marcações "Locutor:" / "Locutora:", dividimos as frases alternando entre os dois
  const sentences = rawText
    .replace(/^(locutora|locutor)\s*:\s*/gim, '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return [
      { speaker: 'Locutor', text: rawText.trim() },
      { speaker: 'Locutora', text: 'Aproveite agora mesmo as nossas ofertas!' },
    ];
  }

  const turns: Array<{ speaker: 'Locutor' | 'Locutora'; text: string }> = [];
  sentences.forEach((sentence, idx) => {
    const speaker: 'Locutor' | 'Locutora' = idx % 2 === 0 ? 'Locutor' : 'Locutora';
    turns.push({ speaker, text: sentence });
  });

  return turns;
}

// Remove rótulos "Locutor:" / "Locutora:" quando sintetizado por uma única voz
function stripSpeakerLabels(rawText: string): string {
  return rawText
    .replace(/^(locutora|locutor|apresentadora|apresentador)\s*:\s*/gim, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Endpoint 3: Síntese de Voz Profissional (Gemini TTS Single-Speaker & Multi-Speaker)
app.post('/api/generate-tts', async (req: Request, res: Response) => {
  const {
    text,
    voiceName = 'Fenrir',
    tone = 'varejao_energico',
    styleInstruction = '',
    isMultiSpeaker = false,
  } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texto para locução é obrigatório.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: false,
      fallbackToWebSpeech: true,
      error:
        'A voz profissional ainda não está ativada. Peça a quem instalou o VozVarejo para ativar a IA.',
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
    fechamento_loja:
      'Locutor cordial e firme anunciando os últimos minutos de compras na loja.',
  };

  const chosenStyle =
    (styleInstruction && styleInstruction.trim()) ||
    styleByTone[tone] ||
    styleByTone.varejao_energico;

  const shouldUseMultiSpeaker =
    Boolean(isMultiSpeaker) ||
    voiceName === 'DUPLA_FM' ||
    voiceName === 'Dupla_Radio' ||
    (/^\s*locutor\s*:/im.test(text) && /^\s*locutora\s*:/im.test(text));

  // 1) Tentativa Multi-Speaker (Dupla de Locutores) via gemini-3.8-flash-tts
  if (shouldUseMultiSpeaker) {
    try {
      const turns = buildDialogueTurns(text);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: turns.map((turn) => ({
              text: turn.text,
              speechMetadata: {
                speaker: turn.speaker,
                style:
                  turn.speaker === 'Locutor'
                    ? 'Apresentador de rádio FM comercial brasileira, voz masculina vibrante, simpática e entusiasmada'
                    : 'Apresentadora de rádio FM comercial brasileira, voz feminina carismática, alegre e comunicativa',
              },
            })),
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Locutor',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Puck' },
                  },
                },
                {
                  speaker: 'Locutora',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
                },
              ],
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
          voiceName: 'DUPLA_FM',
        });
      }
    } catch (multiErr: any) {
      console.warn(
        `[VozVarejo] Multi-speaker TTS indisponível (${multiErr?.message}), usando fallback single-speaker...`
      );
    }
  }

  // 2) Single-Speaker TTS (com fallback entre modelos TTS)
  const cleanSingleText = stripSpeakerLabels(text);
  const singlePrebuiltVoice =
    voiceName === 'DUPLA_FM' || voiceName === 'Dupla_Radio' ? 'Puck' : voiceName;

  for (const ttsModel of TTS_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanSingleText,
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
              prebuiltVoiceConfig: { voiceName: singlePrebuiltVoice },
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
          voiceName: singlePrebuiltVoice,
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
function applyLocalRefinement(
  originalScript: string,
  instruction: string,
  storeName = 'nossa loja',
  scriptMode = 'comercial',
  radioFormat = 'flash_interrupcao',
  effectiveRadioName = `Rádio ${storeName}`
): string {
  const lower = instruction.toLowerCase();
  let text = originalScript.trim();

  if (lower.includes('rádio') || lower.includes('radio') || lower.includes('programação')) {
    const core = stripSpeakerLabels(text)
      .replace(/^E paramos a nossa programação[^!.]*[!.]\s*/i, '')
      .replace(/E voltamos agora com a programação[^!.]*[!.]\s*$/i, '')
      .trim();
    if (radioFormat === 'dupla_locutores') {
      return `Locutor: E paramos a nossa programação aqui na ${effectiveRadioName} porque tem oferta imperdível no ${storeName}!\nLocutora: É isso mesmo! Confira só o que está valendo agora: ${core}\nLocutor: Corre aproveitar aqui no ${storeName}!\nLocutora: E voltamos agora com a programação musical da ${effectiveRadioName}!`;
    }
    return `E paramos a nossa programação aqui na ${effectiveRadioName} para anunciar ofertas especiais no ${storeName}! ${core} Aproveite agora mesmo! E voltamos agora com a programação da ${effectiveRadioName}!`;
  }

  if (lower.includes('curt') || lower.includes('encurtar') || lower.includes('resum')) {
    const sentences = text
      .split(/(?<=[.!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length > 3) {
      const first = sentences[0];
      const middle = sentences.slice(1, Math.max(2, Math.ceil(sentences.length * 0.6))).join(' ');
      const last = sentences[sentences.length - 1];
      return `${first} ${middle} ${last}`;
    }
    if (scriptMode === 'radio') {
      return `E paramos a nossa programação na ${effectiveRadioName} para um flash rápido no ${storeName}: ${stripSpeakerLabels(text)} E voltamos agora com a ${effectiveRadioName}!`;
    }
    return `Atenção clientes do ${storeName}! Oferta rápida: ${text}`;
  }

  if (lower.includes('energ') || lower.includes('animad') || lower.includes('varej')) {
    if (scriptMode === 'radio') {
      const cleaned = stripSpeakerLabels(text)
        .replace(/^E paramos a nossa programação[^!]*!\s*/i, '')
        .replace(/E voltamos agora com a programação[^!]*!\s*$/i, '');
      return `E paramos a nossa programação agora na ${effectiveRadioName} porque o balcão de ofertas do ${storeName} está pegando fogo! ${cleaned} Corre pro corredor de ofertas aproveitar! E voltamos agora com a programação da ${effectiveRadioName}!`;
    }
    const cleaned = text.replace(/^Atenção[^!]*!\s*/i, '');
    return `ATENÇÃO LOJA! PAROU TUDO NO ${storeName.toUpperCase()}! Olha o preço baixo passando no seu carrinho agora! ${cleaned} Corre que é só hoje, vem aproveitar!`;
  }

  if (lower.includes('carn') || lower.includes('churrasc') || lower.includes('brasa') || lower.includes('maciez')) {
    if (scriptMode === 'radio') {
      return `${text}\nE atenção churrasqueiros de plantão: cortes fresquinhos e selecionados esperando por você no balcão do ${storeName}!`;
    }
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

  if (scriptMode === 'radio') {
    const withoutClosing = text.replace(/E voltamos agora com a programação[^!.\n]*[!.]?\s*$/i, '').trim();
    return `${withoutClosing} Lembrando você: ${formattedAddition}${endingPunctuation} E voltamos agora com a programação da ${effectiveRadioName}!`;
  }

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
  scriptMode?: string;
  radioFormat?: string;
  effectiveRadioName?: string;
}) {
  const {
    storeName,
    slogan,
    products,
    customOfferText,
    paymentMethods,
    targetDuration = 'media',
    scriptMode = 'comercial',
    radioFormat = 'flash_interrupcao',
    effectiveRadioName = `Rádio ${storeName}`,
  } = params;
  const isCurta = targetDuration === 'curta' || targetDuration === '15s';
  const isLonga = targetDuration === 'longa' || targetDuration === '60s';

  // Modo Rádio Interna — Dupla de Locutores
  if (scriptMode === 'radio' && radioFormat === 'dupla_locutores') {
    const productTurns =
      products && products.length > 0
        ? products
            .map((p, idx) => {
              const speaker = idx % 2 === 0 ? 'Locutor' : 'Locutora';
              const dePor = p.regularPrice ? `de R$ ${p.regularPrice} ` : '';
              return `${speaker}: Olha só essa oferta: ${p.name}, qualidade de primeira, ${dePor}por apenas R$ ${p.promoPrice} ${p.unit || 'o quilo'}!`;
            })
            .join('\n')
        : `Locutor: Preparamos ofertas especiais em toda a loja para você economizar de verdade hoje!`;

    const text = [
      `Locutor: E paramos a nossa programação aqui na ${effectiveRadioName} porque tem promoção saindo agora no ${storeName}!`,
      `Locutora: É isso mesmo! Quem está fazendo compras com a gente hoje vai levar qualidade e preço baixo de verdade! Confira só:`,
      productTurns,
      isLonga
        ? `Locutora: É muita economia para a sua família! ${paymentMethods}`
        : `Locutora: Aproveite enquanto durar o estoque aqui no ${storeName}!`,
      `Locutor: Encha o carrinho e boas compras! E voltamos agora com a programação musical da ${effectiveRadioName}!`,
    ].join('\n');

    return {
      headline: `Programa ${effectiveRadioName}`,
      text,
      cta: `E voltamos agora com a ${effectiveRadioName}!`,
    };
  }

  // Modo Rádio Interna — Interrupção da Programação (Flash Musical)
  if (scriptMode === 'radio') {
    const itemsList =
      products && products.length > 0
        ? products
            .map(
              (p) =>
                `${p.name}${p.regularPrice ? ` de R$ ${p.regularPrice}` : ''} por apenas R$ ${p.promoPrice} ${p.unit || 'o quilo'}!`
            )
            .join(' Tem também ')
        : customOfferText || 'ofertas imperdíveis em todos os setores da loja!';

    const text = isCurta
      ? `E paramos a nossa programação aqui na ${effectiveRadioName} para um aviso rápido de economia no ${storeName}! Confira: ${itemsList} Aproveite agora mesmo! E voltamos agora com a programação da ${effectiveRadioName}!`
      : isLonga
      ? `E paramos a nossa programação musical aqui na ${effectiveRadioName} porque o ${storeName} acaba de liberar um verdadeiro festival de ofertas para você que está comprando com a gente! Atenção para os preços de hoje: ${itemsList} Produtos selecionados e fresquinhos para a mesa da sua família! ${paymentMethods}${slogan ? ` ${storeName} — ${slogan}!` : ''} Boas compras e voltamos agora com a programação normal da ${effectiveRadioName}!`
      : `E paramos a nossa programação aqui na ${effectiveRadioName} para anunciar ofertas especiais saindo agora no ${storeName}! Olha só o que preparamos para você: ${itemsList} Passe no nosso balcão e garanta já! ${paymentMethods} E voltamos agora com a programação da ${effectiveRadioName}!`;

    return {
      headline: `Flash ${effectiveRadioName}`,
      text,
      cta: `Voltamos agora com a ${effectiveRadioName}!`,
    };
  }

  // Modo Comercial Tradicional
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
