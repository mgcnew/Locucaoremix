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

// Endpoint 1: Roteirizador Promocional com IA (Gemini 3.8 Flash)
app.post('/api/generate-script', async (req: Request, res: Response) => {
  try {
    const {
      storeName,
      storeType = 'supermercado',
      slogan = '',
      location = '',
      tone = 'varejao_energico',
      targetDuration = '30s',
      products = [],
      customOfferText = '',
      additionalNotes = '',
      paymentMethods = 'Aceitamos cartões, dinheiro e Pix!',
      openingGreeting = '',
      closingPhrase = '',
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Retorna fallback inteligente estruturado se a chave de API não estiver disponível
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
        audioTips: 'Ritmo acelerado nos preços e ênfase no nome da loja.',
        estimatedDuration: targetDuration,
        note: 'Gerado via motor local de varejo.',
      });
    }

    const toneDescriptions: Record<string, string> = {
      varejao_energico: 'Locução de varejão estilo carro de som e rádio popular: muito entusiasmada, rápida, enérgica, com jargões como "Atenção dona de casa!", "Preço baixo de verdade!", "Corre que vai acabar!".',
      acougue_especial: 'Locução de especialista em carnes e churrasco: apetitosa, suculenta, destacando a qualidade dos cortes, maciez, carnes frescas inspecionadas e carnes para o churrasco perfeito.',
      amigavel_acolhedor: 'Tom acolhedor, familiar, caloroso e simpático, transmitindo confiança, higiene, carinho e respeito ao cliente.',
      festa_aniversario: 'Clima festivo e comemorativo de aniversário/festa de ofertas: confetes sonoros, celebração, "o aniversário é nosso, mas o presente é seu!", muita alegria contagiante.',
      oferta_relampago: 'Alerta urgente de oferta relâmpago! "Atenção loja!", "É só enquanto durar o estoque!", ritmo acelerado, cria senso imediato de escassez.',
      final_de_semana: 'Foco total no sextou, sabadão e domingão em família: cerveja gelada, carnes na brasa, economia para o fim de semana.',
      fechamento_loja: 'Última chamada antes de fechar! Ofertas finais do dia para levar agora mesmo para casa.',
    };

    const durationNormalized =
      targetDuration === 'curta' || targetDuration === '15s'
        ? 'curta'
        : targetDuration === 'longa' || targetDuration === '60s'
        ? 'longa'
        : 'media';

    const durationConfigs: Record<string, { label: string; range: string; words: string; structure: string }> = {
      curta: {
        label: 'Curta (15 a 20 segundos)',
        range: '15s a 20s',
        words: '35 a 50 palavras no total',
        structure: 'Gancho imediato de impacto e escuta no som da loja + citação rápida e enfática do nome do estabelecimento + oferta principal com preço de impacto + chamada urgente para aproveitar agora.',
      },
      media: {
        label: 'Média (30 a 40 segundos)',
        range: '30s a 40s',
        words: '75 a 95 palavras no total',
        structure: 'Saudação vibrante de rádio/som de loja + anúncio com o nome da loja + apresentação de 2 a 4 ofertas com comparação De/Por e apetite appeal + menção a formas de pagamento e facilidades + convite caloroso de encerramento.',
      },
      longa: {
        label: 'Longa (60 a 90 segundos)',
        range: '60s a 90s',
        words: '145 a 195 palavras no total',
        structure: 'Abertura de grande encarte comercial de rádio + apresentação dos setores (açougue com carnes nobres frescas, hortifrúti e despensa) + todas as ofertas detalhadas com benefícios e preços irresistíveis + facilidades de pagamento (cartões e Pix) + assinatura com o nome do estabelecimento e slogan convidando a família inteira.',
      },
    };

    const currentDurationConfig = durationConfigs[durationNormalized];

    const prompt = `Você é uma das maiores vozes da locução comercial de rádio, carro de som e rádio interna de supermercados e açougues do Brasil.
Sua missão é criar um texto que SOE EXATAMENTE COMO UM LOCUTOR PROFISSIONAL DE VERDADE FALANDO NO MICROFONE COM OS CLIENTES NA LOJA.

DADOS DO ESTABELECIMENTO:
- Nome da Loja: "${storeName || 'Nosso Estabelecimento'}"
- Segmento: ${storeType === 'acougue' ? 'Açougue e Casa de Carnes' : storeType === 'supermercado' ? 'Supermercado e Mercearia' : 'Varejo e Atacarejo'}
- Slogan/Diferencial: "${slogan || 'Onde sua economia e qualidade acontecem de verdade'}"
- Localização: "${location || ''}"
- Estilo e Perfil da Locução: ${toneDescriptions[tone] || toneDescriptions.varejao_energico}
- DURAÇÃO EXATA: ${currentDurationConfig.label}
- META DE EXTENSÃO: O texto DEVE TER ENTRE ${currentDurationConfig.words} (não faça nem mais curto, nem mais longo).
- ESTRUTURA RECOMENDADA: ${currentDurationConfig.structure}
- Formas de Pagamento: "${paymentMethods}"
${openingGreeting ? `- Saudação inicial personalizada solicitada: "${openingGreeting}"` : ''}
${closingPhrase ? `- Assinatura de encerramento personalizada solicitada: "${closingPhrase}"` : ''}

PRODUTOS E OFERTAS:
${products && products.length > 0 
  ? products.map((p: any, i: number) => {
      const dePor = p.regularPrice ? `(De R$ ${p.regularPrice} por APENAS R$ ${p.promoPrice})` : `(Por APENAS R$ ${p.promoPrice})`;
      return `${i + 1}. ${p.name} ${dePor} / ${p.unit || 'kg'} ${p.limit ? `[Limite: ${p.limit}]` : ''} ${p.details ? `[Obs: ${p.details}]` : ''}`;
    }).join('\n')
  : (customOfferText || 'Ofertas imperdíveis preparadas para hoje!')}

${additionalNotes ? `INSTRUÇÕES EXTRAS DO CLIENTE: ${additionalNotes}` : ''}

SEGREDO DO LOCUTOR DE VERDADE (SIGA RIGOROSAMENTE):
1. FALA ORAL, VIVA E HUMANA: Use a linguagem falada real de quem está no microfone da rádio interna ou rádio comercial (ex: "Atenção clientes e amigos do ${storeName}!", "Parou tudo!", "Olha a economia passando no seu carrinho!", "Segura essa oferta!").
2. PRONÚNCIA ENVOLVENTE DOS PREÇOS: Escreva os valores por extenso ou de forma fonética rítmica para o locutor falar com prazer comercial (ex: "por apenas quarenta e nove e noventa o quilo!", "por só três e quarenta e nove a unidade!").
3. PONTUAÇÃO DE RESPIRAÇÃO: Use exclamações e vírgulas para dar ritmo cadenciado, sem frases longas que façam o locutor perder o fôlego.
4. NOME DA LOJA EM DESTAQUE: Cite o nome "${storeName || 'nossa loja'}" com orgulho no início e no fechamento.
5. APETITE E CONVERSÃO: Destaque a maciez das carnes, o frescor dos cortes, a gelada da cerveja e a economia real para o bolso.
6. RESPEITO ABSOLUTO À DURAÇÃO: Entregue um texto com ${currentDurationConfig.words}.

Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
{
  "headline": "Título chamativo do anúncio para identificação interna",
  "script": "Texto completo da locução pronto para o locutor falar no microfone",
  "callToAction": "Chamada curta de fechamento",
  "audioTips": "Dica de entonação para o locutor",
  "estimatedDuration": "${currentDurationConfig.range}"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.85,
      },
    });

    const text = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      // fallback parsing
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
      headline: parsedData.headline || `Ofertas do ${storeName}`,
      callToAction: parsedData.callToAction || `Vem correndo pro ${storeName}!`,
      audioTips: parsedData.audioTips || 'Utilize um sino de chamada antes do anúncio.',
      estimatedDuration: parsedData.estimatedDuration || targetDuration,
    });
  } catch (error: any) {
    console.warn('Gemini API indisponível temporariamente, acionando motor inteligente local de varejo:', error?.message);
    const {
      storeName,
      storeType = 'supermercado',
      slogan = '',
      tone = 'varejao_energico',
      targetDuration = 'media',
      products = [],
      customOfferText = '',
      paymentMethods = 'Aceitamos cartões, dinheiro e Pix!',
    } = req.body;

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
      audioTips: 'Ritmo acelerado nos preços e ênfase no nome da loja.',
      estimatedDuration: targetDuration,
      note: 'Gerado com sucesso via motor de contingência de varejo.',
    });
  }
});

// Endpoint 2: Refinar / Ajustar Roteiro existente com IA
app.post('/api/refine-script', async (req: Request, res: Response) => {
  try {
    const { originalScript, instruction, storeName } = req.body;
    if (!originalScript || !instruction) {
      return res.status(400).json({ error: 'Roteiro e instrução de ajuste são obrigatórios.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        script: `${originalScript}\n\n[Ajuste: ${instruction}]`,
      });
    }

    const prompt = `Você é um redator sênior de rádio e locução comercial de varejo.
Aqui está um roteiro comercial para o estabelecimento "${storeName || 'nossa loja'}":

ROTEIRO ATUAL:
"${originalScript}"

INSTRUÇÃO DE AJUSTE DO CLIENTE:
"${instruction}"

Reescreva o roteiro aplicando exatamente o ajuste solicitado, mantendo o tom profissional, vendedor e envolvente de supermercado/açougue.
Retorne EXCLUSIVAMENTE um objeto JSON:
{
  "script": "Texto ajustado da locução"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      script: parsed.script || originalScript,
    });
  } catch (error: any) {
    console.error('Erro ao refinar roteiro:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao refinar roteiro.',
    });
  }
});

// Endpoint 3: Síntese de Voz Profissional (Gemini 3.8 Flash Lite TTS)
app.post('/api/generate-tts', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceName = 'Fenrir', // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      tone = 'varejao_energico',
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto para locução é obrigatório.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        success: false,
        fallbackToWebSpeech: true,
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Usando síntese nativa de voz do navegador.',
      });
    }

    const styleByTone: Record<string, string> = {
      varejao_energico: 'Locutor de supermercado e varejo popular muito animado, voz alta, ritmo comercial acelerado, alegre e confiante.',
      acougue_especial: 'Locutor caloroso e experiente de casa de carnes, voz encorpada, convidativa para churrasco e carnes nobres.',
      amigavel_acolhedor: 'Locutor acolhedor, tom simpático de vizinhança, cordial, caloroso e atencioso.',
      festa_aniversario: 'Locutor festivo, empolgadíssimo, comemorando aniversário de loja e festival de prêmios.',
      oferta_relampago: 'Locutor urgente, com muita energia, chamando atenção imediata para ofertas que vão acabar agora.',
      final_de_semana: 'Locutor animado de fim de semana, com energia de lazer, churrasco e festa em família.',
      fechamento_loja: 'Locutor solícito de última hora, alertando com dinamismo para o fechamento.',
    };

    const chosenStyle = styleByTone[tone] || styleByTone.varejao_energico;

    // Conforme SKILL.md de gemini-api:
    // Modelo: "gemini-3.8-flash-lite-tts"
    // Unary default: completo WAV file (audio/wav, RIFF header, 24kHz mono 16-bit).
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
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

    if (!base64Audio) {
      return res.json({
        success: false,
        fallbackToWebSpeech: true,
        error: 'Não foi possível sintetizar o áudio com a API de voz. Alternando para voz local.',
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceName,
    });
  } catch (error: any) {
    console.warn('Erro ou demanda alta no TTS Gemini, alternando para síntese nativa:', error?.message);
    return res.json({
      success: false,
      fallbackToWebSpeech: true,
      error: 'Voz da nuvem ocupada. Reproduzindo via síntese de voz nativa.',
    });
  }
});

// Helper de Fallback sem API com suporte às 3 durações de locução
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
      // Pega o produto principal para impacto rápido
      const p = products[0];
      itemsText = `tem ${p.name}, de ${p.regularPrice ? `R$ ${p.regularPrice}` : 'preço de tabela'} por APENAS R$ ${p.promoPrice} o ${p.unit || 'quilo'}!`;
    } else if (isLonga) {
      itemsText = products
        .map(
          (p) =>
            `No setor de ofertas tem ${p.name}, com corte selecionado e fresco, de ${p.regularPrice ? `R$ ${p.regularPrice}` : 'preço normal'} por APENAS R$ ${p.promoPrice} o ${p.unit || 'quilo'}! ${p.details ? `Observação: ${p.details}.` : ''}`
        )
        .join(' E tem mais economia imperdível! ');
    } else {
      itemsText = products
        .slice(0, 3)
        .map(
          (p) =>
            `Tem ${p.name}, de ${p.regularPrice ? `R$ ${p.regularPrice}` : 'preço normal'} por APENAS R$ ${p.promoPrice} o ${p.unit || 'quilo'}!`
        )
        .join(' E não para por aí! ');
    }
  } else {
    itemsText = customOfferText || 'ofertas imperdíveis preparadas especialmente para você economizar de verdade no seu carrinho!';
  }

  let script = '';
  if (isCurta) {
    script = `Atenção loja, atenção clientes do ${storeName}! Alerta de oferta rápida! Só agora: ${itemsText} Corre para aproveitar enquanto durar o estoque! ${storeName}!`;
  } else if (isLonga) {
    script = `Atenção clientes e amigos do ${storeName}! Parou tudo para ouvir o festival de ofertas da semana! Quem pesquisa, compra aqui! ${itemsText} É produto de primeira qualidade direto para a sua mesa com economia que você sente no bolso! E para facilitar suas compras, ${paymentMethods} Venha agora mesmo com toda a família e aproveite! ${storeName} — ${slogan || 'a sua melhor escolha todo dia!'}`;
  } else {
    script = `Atenção clientes amigos do ${storeName}! Parou tudo para ouvir as melhores ofertas preparadas para você! ${itemsText} É preço baixo de verdade e procedência que cabe no seu bolso! Aproveite agora mesmo! ${paymentMethods} ${storeName} — ${slogan || 'onde seu dinheiro rende muito mais!'}`;
  }

  return {
    headline: `Super Ofertas - ${storeName}`,
    text: script,
    cta: `Corra e garanta suas ofertas no ${storeName}!`,
  };
}

// Configuração Vite Middleware ou Static
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
