# ARQUITETURA — Contador de Histórias

Leia isto **antes** de mexer no código (vale para pessoas e para qualquer IA).
Site estático no GitHub Pages, sem servidor, sem framework e sem passo de build: HTML, CSS e JavaScript puros.

## Arquivos

| Arquivo | Papel | Pode editar? |
|---|---|---|
| `index.html` | O app inteiro: estilos, telas e todo o JavaScript num bloco só. | Sim — com cuidado (ver abaixo). |
| `historias.json` | Acervo público que todo aparelho baixa. | Sim, mas **é público**: nada de nome real de criança. |
| `sw.js` | Service worker (offline + instalar como app). Vem do pacote das diretrizes. | Só subir o número `VERSAO` a cada versão publicada. |
| `diretrizes.js` | Módulo comum a todos os apps (`DGO`). | **Não.** É igual em todos os sites. |
| `diretrizes-config.js` | Configuração do módulo para este app. | Sim, é o único arquivo do módulo que muda por app. |
| `TESTE-VOZ-contador-de-historias.html` | Teste das vozes do aparelho, independente do app. | Sim. |
| `capa.jpg`, `fundo-historia.jpg`, `icone-180.png` | Imagens. | Trocar por outra com o mesmo nome. |

## Dentro do `index.html` (ordem em que aparecem no script)

1. **Estado** — `configPadrao`, `cfg`, `historias`, `stats`. Guardados no `localStorage` com as chaves `ch_config`, `ch_historias`, `ch_stats`, `ch_versao`. O prefixo `ch_` evita colisão com os outros apps, que dividem a mesma origem (`marceloneco.github.io`).
2. **Som** — efeitos sintetizados com Web Audio (nenhum arquivo de áudio).
3. **Voz do aparelho** — `carregarVozesNativas`, `falarNativo`, opção `__padrao__` (Padrão do aparelho).
4. **Guarda** — cache de voz no IndexedDB (banco `ch_audio`, loja `audio`).
   Chave: `id | índice | motor | voz | modelo | hash do texto` (a "marca" é `motor|voz|modelo`).
   Cumprimento: `saudacao | marca | texto`. Funções: `pegar`, `guardar`, `existe`, `limpar`, `limparHistoria(id)`, `resumo()`.
   `VOZ_GUARDADA` (mapa id → trechos/bytes/vozes) alimenta os selos e a lista em Ajustes; `h.audioCompleto[marca] = nº de trechos` diz quando uma voz está inteira.
5. **Motores de voz** — `gerarAudio` escolhe Gemini, ElevenLabs ou OpenAI e devolve um `Blob`.
6. **Leitor** — fila de passos (fala/som), pedaços progressivos, esteira de download, faixa 🔴🟡🟢, posição salva por frase. `marcaUso` = tocar a voz guardada de outro motor sem gerar nada.
7. **IA de texto** — `chamarIA` (ponto único): aplica `mascararNomes` antes de enviar e `desmascararNomes` na volta. Os adaptadores Gemini/Anthropic/OpenAI ficam em `chamarIASemFiltro`. Trocar de provedor = trocar a chave, não o código.
8. **Criar** — prompts (`montarPrompt`, `montarPromptSerie`), geração em capítulos com `parcial`.
9. **Telas** — `irTela`, `pintarInicio`, `pintarAcervo`, `cartaoHistoria`, Ajustes.
10. **Comandos de voz** — módulo `Comandos`: reconhecimento do navegador → lista `FIXOS` → (opcional) IA. Para trocar o reconhecimento (Whisper, Gemini Live), mudar só `ouvirUmaVez()`.
11. **Versão** — `HISTORICO` (a primeira linha é a versão atual), `telaNovidades`, `telaAviso`.

## Regras que não se quebram

- **Nenhuma chave no código.** O repositório é público. Chaves só no navegador de quem usa.
- **Nomes de criança não saem do aparelho para a IA** (`chamarIA` mascara). Não criar outra chamada de IA que fuja de `chamarIA`.
- **Nada pesado baixa sozinho.** Voz de internet só baixa ao tocar ou no botão de baixar.
- **Largura:** texto corrido na coluna de leitura (`--coluna: 760px`); listas e grades escapam para a largura toda no computador (`body.larga`).
- **Cada versão publicada:** nova linha no topo do `HISTORICO`, `VERSAO` do `sw.js` +1, textos novos em PT e EN no `TEXTOS-NOVOS-contador-de-historias.md`.
- Não reescrever o arquivo inteiro: editar trechos. O que já funciona (cache, retomar, séries) é fácil de perder numa reescrita.
