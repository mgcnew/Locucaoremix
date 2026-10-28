---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components"]
---

# Surface: VozVarejo Studio (app inteiro: Criar locução, Modelos prontos, Histórico)

Mode: Operate. Tarefa: lojista transforma ofertas em MP3 de locução em poucos minutos, no celular ou no PC.
Constraints: Fluxo em 3 passos visíveis; feedback em toda ação demorada (IA, voz, MP3) com sucesso/erro em linguagem de lojista; aviso claro de modo sem IA; acessível (foco visível, rótulos, live regions, Esc em diálogos) e bom em 390px e 1440px; tema claro/escuro preservado.
Quality bar: ElevenLabs (escolhido pelo usuário).

## Direction contract

THESIS: O padrão da categoria executado com capricho: um estúdio de voz SaaS limpo onde o caminho ofertas → roteiro → voz & MP3 é sempre óbvio. Recusa o painel genérico de cartões laranja empilhados e botões que competem entre si.

OWN-WORLD: Chão neutro frio quase branco, superfícies brancas com bordas de 1px, tinta quase preta para a ação primária, violeta como única cor de destaque (passo ativo, seleção, IA). Verde, âmbar e vermelho apenas para estado. Geist para a UI, números tabulares em preços e tempos. Raios de 10–12px, sombras suaves só em camadas flutuantes.

STORY: O lojista vê a loja e o status da IA na barra lateral, preenche ofertas, gera o roteiro, ajusta, escolhe a voz num elenco de cartões, ouve e baixa o MP3. Sempre sabe o que está acontecendo e o que fazer a seguir.

FIRST VIEWPORT: Desktop: barra lateral de 256px (logo, passos 1-2-3 com estado, Modelos, Histórico, cartão da loja, status IA, tema); área principal com o passo atual e botão "Continuar"; barra do player fixa embaixo com título, duração estimada, Ouvir e Baixar MP3. Mobile: barra superior, stepper horizontal, player acima da navegação inferior.

FORM: Category standard (canon), escolhido pelo usuário; fora da lista ordenada. seed:d7ed826e8b077625

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
