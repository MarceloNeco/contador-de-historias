# Textos novos — Contador de Histórias v1.7.0
### Versões revisadas em português e inglês, para entrar no `diretrizes-config.js`

Todos os textos abaixo foram adicionados na aba **Criar**, na seção de geração com IA.

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `criar.ambiente.rotulo` | Onde a história acontece | Where the story takes place |
| `criar.ambiente.opcional` | (opcional) | (optional) |
| `criar.ambiente.dica` | Ex.: um sítio com rio e galinheiro | E.g.: a farm with a river and a chicken coop |
| `criar.ambiente.sortear` | 🎲 Sortear outros lugares | 🎲 Shuffle other places |
| `criar.tom.rotulo` | Clima da história | Mood of the story |
| `criar.inspiracao.rotulo` | Parecida com… | Similar to… |
| `criar.inspiracao.opcional` | (inspiração, opcional) | (inspiration, optional) |
| `criar.inspiracao.dica` | Ex.: parecida com Procurando Nemo | E.g.: similar to Finding Nemo |
| `criar.estilo.rotulo` | Ou no estilo de uma história que já temos | Or in the style of a story already here |
| `criar.estilo.nenhuma` | — nenhuma — | — none — |
| `criar.estilo.ajuda` | A IA lê um trecho da história escolhida e imita o jeito de contar: ritmo, humor, tamanho das frases. O enredo continua novo. | The AI reads an excerpt of the chosen story and mirrors how it is told: rhythm, humour, sentence length. The plot stays new. |

## Opções de clima (`TONS`)

| Português | English |
|---|---|
| engraçada | funny |
| misteriosa | mysterious |
| emocionante | moving |
| cheia de aventura | full of adventure |
| calminha para dormir | calm, for falling asleep |
| com uma reviravolta | with a twist |
| de fazer rir alto | laugh-out-loud |
| com um pouquinho de suspense | with a touch of suspense |

## Observação técnica

As listas de sugestão (`AMBIENTES`, `TONS`, `INSPIRACOES`, `TEMAS`, `PERSONAGENS`) estão no
`index.html`, dentro do bloco `/* ----- sugestões ----- */`. Para a versão em inglês, basta
o módulo de diretrizes trocar essas listas quando o idioma for `en`.

O texto do pedido enviado à IA (`montarPrompt`) segue sempre em português, independentemente
do idioma da interface, porque as histórias do acervo são em português. Caso o idioma da
interface passe a definir também o idioma da história, a linha a alterar é a primeira do
`montarPrompt`.
