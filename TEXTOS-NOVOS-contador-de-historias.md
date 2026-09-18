# Textos novos — Contador de Histórias v1.7.0 e v1.8.0
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


---

# v1.8.0 — Para quem são as histórias (Ajustes)

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `publico.titulo` | 👧 Para quem são as histórias | 👧 Who the stories are for |
| `publico.ajuda` | Serve para o site cumprimentar do jeito certo e para a IA escrever falando com quem vai ouvir. Deixando em branco, nada disso aparece. | This lets the app greet correctly and lets the AI write speaking to whoever is listening. Left blank, none of it shows. |
| `publico.nomes.rotulo` | Primeiro nome de quem vai ouvir | First name of whoever is listening |
| `publico.nomes.dica` | Ex.: Lara, Julia — separe por vírgula | E.g.: Lara, Julia — separate with commas |
| `publico.tipo.rotulo` | Quem costuma ouvir | Who usually listens |
| `publico.tipo.vazio` | Prefiro não informar | Prefer not to say |
| `publico.tipo.menina` | Uma menina | One girl |
| `publico.tipo.meninas` | Duas ou mais meninas | Two or more girls |
| `publico.tipo.menino` | Um menino | One boy |
| `publico.tipo.meninos` | Dois ou mais meninos | Two or more boys |
| `publico.tipo.misto` | Meninas e meninos | Girls and boys |
| `publico.citar.titulo` | Cumprimentar pelo nome na história | Greet by name in the story |
| `publico.citar.ajuda` | A IA começa a história com uma saudação curta dirigida a quem vai ouvir. | The AI opens the story with a short greeting to whoever is listening. |
| `publico.previa` | No topo da tela vai aparecer: | The top of the screen will show: |

## Saudações do cabeçalho

| Situação | Português | English |
|---|---|---|
| Nada informado | bom dia! que tal uma história? | good morning! how about a story? |
| Nada informado (tarde) | boa tarde! que tal uma história? | good afternoon! how about a story? |
| Nada informado (noite) | boa noite! que tal uma história? | good evening! how about a story? |
| Com nomes | boa noite, Lara e Julia | good evening, Lara and Julia |
| Só "duas ou mais meninas" | boa noite, meninas | good evening, girls |
| Só "dois ou mais meninos" | boa noite, meninos | good evening, boys |
| Só "meninas e meninos" | boa noite, crianças | good evening, everyone |

**Regra de uma pessoa sem nome:** com "uma menina" ou "um menino" e nenhum nome informado, o
cabeçalho usa a saudação neutra. "Boa noite, menina" soa estranho em português; em inglês
("good evening, girl") o efeito é o mesmo. A lista de nomes, quando preenchida, sempre tem
prioridade sobre o coletivo.


---

# v1.8.0 — Efeitos sonoros novos

| Marcador | Português | English |
|---|---|---|
| `explosao` | Explosão | Explosion |
| `tiro` | Tiro | Gunshot |
| `galope` | Galope | Gallop |
| `latido` | Cachorro | Dog |
| `miado` | Gato | Cat |
| `mugido` | Vaca | Cow |
| `rugido` | Leão | Lion |
| `chiado` | Cobra | Snake |
| `coruja` | Coruja | Owl |
| `galo` | Galo | Rooster |
| `sapo` | Sapo | Frog |
| `elefante` | Elefante | Elephant |

Os nomes dos marcadores dentro do texto (`[som:latido]`) permanecem em português nos dois
idiomas, porque estão gravados nas histórias já existentes. Apenas o rótulo visível muda.
