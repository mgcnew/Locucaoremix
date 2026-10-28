# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Donos e gerentes de pequenos e médios mercados, mercearias, atacarejos e açougues no Brasil. Criam os próprios anúncios, geralmente com pressa, entre uma tarefa e outra da loja, sem conhecimento técnico de áudio ou de redação publicitária. Usam o app no celular e no computador com a mesma frequência.

## Product Purpose

Transformar uma lista de ofertas (produto, preço, unidade) em uma locução comercial pronta para tocar, em poucos minutos: o app escreve o roteiro no tom certo, sintetiza a voz de um locutor, adiciona a vinheta de abertura e exporta um MP3. Sucesso é o lojista sair com o MP3 baixado e tocando sem precisar contratar locutor.

## Positioning

Feito para o varejo alimentar popular brasileiro: o vocabulário, os tons ("varejão animado", "açougue & churrasco", "oferta relâmpago") e os modelos sazonais (Sextou do Churrasco, Quarta da Carne, Arraiá, Black da Carne, Natal) já falam a língua do balcão. Preços são escritos por extenso para o locutor ler corretamente.

## Operating Context

- O áudio final toca no som interno da loja, em carro de som e rádio local, e é enviado por WhatsApp e redes sociais.
- Fluxo: dados da loja → produtos em oferta → estilo e duração → roteiro gerado por IA (editável e ajustável com instruções rápidas) → voz + sino de abertura → prévia → MP3 → histórico.
- O perfil da loja (nome, ramo, slogan, endereço, pagamento, abertura e encerramento fixos) é salvo no navegador e entra em todas as locuções.

## Capabilities and Constraints

- React 19 + Vite + Tailwind CSS v4 no front; Express (`server.ts`, via `tsx`) no back, com Gemini para roteiro, ajuste e voz (TTS).
- Sem `GEMINI_API_KEY`, o roteiro vem de um gerador local e a voz cai para a síntese do navegador (pt-BR); o MP3 com voz profissional depende da chave.
- Exportação MP3/WAV feita no navegador (`src/utils/audioExporter.ts`), mixando sino + voz.
- Dados (perfil, histórico, tema) ficam em `localStorage`; não há conta de usuário nem backend de dados.
- Interface inteira em português do Brasil.

## Brand Commitments

- Nome: VozVarejo (VozVarejo Studio). Subtítulo: "Locução para Mercados & Açougues".
- Voz da marca: direta, popular, animada, sem jargão técnico.

## Evidence on Hand

- Dados de exemplo (loja "Açougue & Casa de Carnes Boi de Ouro", 10 modelos sazonais em `src/data/templates.ts`, produtos populares em `src/data/popularProducts.ts`, vozes em `src/data/voices.ts`) são demonstração, não clientes reais.
- Não há depoimentos, clientes, métricas ou logos de parceiros; não inventar.

## Product Principles

1. Do produto ao MP3 no menor número de passos; a próxima ação deve estar sempre óbvia.
2. Toda ação demorada (IA, voz, MP3) mostra progresso e termina com sucesso ou erro explicado em linguagem do lojista.
3. Funcionar sem IA: quando a chave não existe, o app avisa e segue útil com os recursos locais.
4. Igualmente bom no celular e no computador.

## Accessibility & Inclusion

Usuários pouco técnicos, muitas vezes no celular e em ambiente de loja: alvos de toque grandes, texto legível, contraste alto, navegação por teclado com foco visível, rótulos em todos os campos e mensagens anunciadas para leitores de tela.
