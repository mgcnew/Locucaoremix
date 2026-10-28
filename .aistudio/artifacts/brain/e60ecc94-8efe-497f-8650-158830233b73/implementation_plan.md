# Plano de Implementação — Modo Rádio Interna & Novas Vozes de Locução

Expansão do estúdio **VozVarejo** para suportar **Locução Estilo Rádio Interna** (como uma estação de rádio própria do mercado ou açougue) e novas opções de vozes comerciais e populares, preservando integralmente o design system atual, limpo e organizado em duas colunas.

---

## Decisões Confirmadas & Revisão do Usuário

- **Formato do Modo Rádio Interna**: Disponibilização de dois formatos autênticos de rádio selecionáveis quando o Modo Rádio estiver ativo:
  1. **Interrupção da Programação (Flash Musical)**: O locutor interrompe a programação musical da loja (*"E paramos a nossa programação aqui na Rádio..."*), anuncia as ofertas com entusiasmo e encerra devolvendo para a música (*"E voltamos agora com a programação da Rádio Novo Boi João Dias!"*).
  2. **Dupla de Locutores (Programa de Rádio ao Vivo)**: Dois apresentadores (voz masculina e voz feminina) conversam em ritmo dinâmico de programa de rádio FM, comentando os preços das ofertas e devolvendo juntos para a programação musical da rádio da loja.
- **Identificação da Rádio da Loja**: Campo opcional **"Nome da Rádio"** exibido contextualmente apenas quando o Modo Rádio estiver selecionado. Se deixado em branco, o sistema assume automaticamente **`Rádio [Nome do Estabelecimento]`** (ex.: *Rádio Novo Boi João Dias*).
- **Novos Estilos de Voz**: Adição de perfis vocais específicos para varejo e rádio:
  - **Locutor e Locutora estilo Rádio FM Comercial** (timbre vibrante, sorriso na voz e cadência de emissora FM).
  - **Locutor Popular Carismático estilo Rádio Sertaneja e Bairro** (tom caloroso, próximo da comunidade, ideal para açougues e mercados tradicionais).
  - **Dupla de Locutores FM (Interação Masculino + Feminino)** com síntese nativa multi-voz (`multiSpeakerVoiceConfig`).

---

## 1. Visão Geral & Conceito Central

Redes de supermercados e açougues de destaque utilizam o conceito de **Rádio Interna** para criar proximidade com os clientes no salão de vendas. Em vez de soar apenas como um aviso gravado repetitivo, o anúncio entra como um "flash ao vivo" dentro da programação musical da loja.

Com esta evolução, o **VozVarejo** passa a oferecer dois modos principais de roteiro e locução:
1. **Locução Comercial Tradicional**: Chamada direta de ofertas para som ambiente, carro de som ou redes sociais.
2. **Modo Rádio Interna**: Locução imersiva com vinheta de entrada, jargões reais de emissora FM/Sertaneja, interação com o ouvinte no corredor da loja e devolução final para a programação musical da rádio do estabelecimento.

---

## 2. Experiência do Usuário & Design Visual

Para manter a interface leve, amigável e sem poluição visual (seguindo o padrão de 2 colunas já aprovado):

- **Seletor de Formato no Passo 2 ("Estilo e Duração")**:
  - Um controle segmentado limpo no topo do card permite alternar entre **Comercial Tradicional** e **Modo Rádio Interna**.
  - Ao ativar **Modo Rádio Interna**, surge suavemente um sub-painel enxuto contendo apenas:
    - Escolha entre os 2 formatos: **Flash: Interrupção da Programação** ou **Programa: Dupla de Locutores**.
    - Campo opcional **Nome da Rádio** com preenchimento automático inteligente no placeholder (`Ex: Rádio Novo Boi João Dias — automático pelo nome da loja`).
- **Seletor de Vozes Expandido no Passo 3 ("Voz e Áudio")**:
  - Organização clara das vozes em cartões compactos de 1 linha com indicação do estilo (Varejo Clássico, Rádio FM Comercial, Rádio Sertaneja/Popular e Dupla de Rádio FM).
  - Quando o formato **Dupla de Locutores** é selecionado no Modo Rádio, o seletor destaca automaticamente a opção de síntese em dupla (Locutor + Locutora conversando), permitindo também ouvir ou baixar tudo em MP3 com 1 clique.
- **Vinheta de Rádio Opcional**:
  - Adição da opção **"Vinheta Rádio FM"** ao seletor de sinal sonoro inicial, gerando um acorde curto de sintonização/vinheta de emissora antes da fala do locutor.

---

## 3. Decisões de Produto & Trade-Offs

- **Revelação Progressiva (Zero Poluição Visual)**: Os controles exclusivos de rádio (formato de programa e nome da estação) ficam ocultos quando o usuário está no modo Comercial Tradicional. Isso preserva a simplicidade visual conquistada na tela principal.
- **Síntese Multi-Voz Real vs. Voz Única**:
  - No formato **Dupla de Locutores**, o roteiro é estruturado com marcações claras (`Locutor:` e `Locutora:`) e sintetizado usando o recurso nativo de múltiplos locutores do modelo de voz (`multiSpeakerVoiceConfig`), entregando duas vozes reais interagindo no mesmo arquivo MP3.
  - Caso o usuário prefira usar apenas um locutor no Modo Rádio, o formato **Interrupção da Programação** utiliza a voz individual escolhida com direção de interpretação de radialista.

---

## 4. Arquitetura Técnica & Fluxo de Dados

```
+-------------------------------------------------------------------------+
|                        ESTÚDIO VOZVAREJO (UI)                           |
|  [Modo: Comercial | Rádio Interna] -> [Formato: Flash | Dupla Ao Vivo]  |
|  [Nome da Rádio (Opcional)] -> Fallback automático: "Rádio {NomeLoja}"  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    MOTOR DE ROTEIRIZAÇÃO (Backend)                      |
|  - Comercial: Gancho de loja + Ofertas por extenso + Fechamento         |
|  - Rádio Flash: "E paramos a nossa programação..." + Ofertas +          |
|                 "E voltamos agora com a programação da {NomeRádio}!"    |
|  - Rádio Dupla: Diálogo dinâmico Locutor & Locutora + Volta musical     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  MOTOR DE SÍNTESE DE VOZ & ÁUDIO MP3                    |
|  - Voz Individual: Direção de estilo (FM Comercial / Sertanejo Popular) |
|  - Voz em Dupla: Síntese Multi-Speaker (Locutor + Locutora em diálogo)  |
|  - Mixagem Web Audio: Vinheta Rádio FM + Locução + Trilha -> MP3 128kbps|
+-------------------------------------------------------------------------+
```

- **Geração e Ajuste de Roteiro com IA**:
  - Se o modo for **Interrupção da Programação**, tanto o prompt de IA quanto o gerador local garantem a abertura clássica de interrupção da música e o encerramento nominal devolvendo para a rádio da loja.
  - Se o modo for **Dupla de Locutores**, o texto é gerado em formato de diálogo natural de rádio (`Locutor:` e `Locutora:`), e os botões rápidos de ajuste (*Mais curto*, *Mais animado*, *Destacar preços*) preservam a estrutura do programa de rádio.
- **Exportação MP3 Direta**:
  - O codificador MP3 processa tanto locuções individuais quanto locuções em dupla com a vinheta de rádio e a música de fundo selecionada, mantendo o download imediato em um único clique.
