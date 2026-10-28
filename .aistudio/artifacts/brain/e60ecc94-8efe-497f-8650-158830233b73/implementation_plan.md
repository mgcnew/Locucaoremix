# Plano de Implementação: Modo Diurno Real, Qualidade Real de Locutor & Três Durações

## 1. Contexto e Objetivos
O usuário solicitou:
1. **Modo Diurno funcionando de verdade**: Fazer com que a troca para o Modo Diurno (Light Mode) de fato altere todas as cores, fundos e textos da aplicação sem que fique escuro ou inconsistente.
2. **Textos com qualidade autêntica de locutor de varejo**: O texto deve soar exatamente como um locutor real de rádio e som de loja brasileiro falando com os clientes, com entonação de preços envolvente, ganchos de chamada e entusiasmo comercial.
3. **Opção de Duração em 3 Níveis Claros**:
   - **Curta (15s a 20s)**: Chamada rápida de impacto / oferta relâmpago.
   - **Média (30s a 40s)**: Formato comercial padrão para som de loja e rádio.
   - **Longa (60s a 90s)**: Encarte semanal completo com festival de ofertas detalhado.

---

## 2. Mudanças Planejadas

### A. Correção Completa do Modo Diurno (Tailwind v4)
- Em `src/index.css`, configurar a variante de tema escuro explícita para Tailwind v4:
  ```css
  @import "tailwindcss";
  @custom-variant dark (&:where(.dark, .dark *));
  ```
- No `src/App.tsx`, garantir que a alternância da classe `.dark` no elemento `<html>` altere imediatamente todas as superfícies para o modo claro limpo (`bg-slate-50`, cards `bg-white`, textos `text-slate-900`) e escuro (`dark:bg-slate-950`, `dark:text-slate-100`).
- Testar visualmente os inputs, seletores e modais para garantir alto contraste e legibilidade em ambos os modos.

### B. Sistema de Roteirização Profissional de Locutor de Varejo (`server.ts`)
- Reformular o prompt de geração do Gemini 3.8 Flash e o gerador de contingência para incorporar os segredos dos melhores locutores de supermercado e açougue do Brasil:
  - **Aberturas autênticas de som de loja**: *"Atenção clientes e amigos do [Loja]!"*, *"Parou tudo no balcão!"*, *"Atenção dona de casa e mestre churrasqueiro!"*.
  - **Pronúncia e ritmo de preços por extenso**: *"de trinta e nove por apenas vinte e dois e noventa o quilo!"*, com cadência que soa natural e convidativa na fala.
  - **Pontuação estratégica para locução**: Exclamações, vírgulas de pausa para respiração e ênfase em cortes de carne e marcas.
  - **Controle rigoroso pelas 3 durações**:
    - **Curta (15s a 20s)**: 35 a 50 palavras focadas na oferta principal e urgência.
    - **Média (30s a 40s)**: 75 a 95 palavras com abertura da loja, 2 a 3 ofertas com De/Por e chamada de fechamento.
    - **Longa (60s a 90s)**: 140 a 200 palavras no estilo encarte completo de rádio/som de loja com apresentação dos setores, todos os produtos em destaque, formas de pagamento e slogan da loja.

### C. Interface do Estúdio (`src/components/LocutionStudio.tsx` & `src/types.ts`)
- Atualizar os seletores de duração para as 3 opções combinadas:
  - `Curta (15s a 20s)`
  - `Média (30s a 40s)`
  - `Longa (60s a 90s)`
- Adicionar indicadores visuais de ritmo de leitura falada e teleprompter.

---

## 3. Verificação
- Executar `compile_applet` e `lint_applet` para validar integridade do código.
- Testar a troca de tema claro/escuro para certificar que o Modo Diurno funciona 100%.
- Realizar teste de geração via API para cada uma das 3 durações e validar o roteiro de locutor gerado.
