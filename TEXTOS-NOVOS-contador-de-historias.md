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


---

# v1.8.1 — Cumprimento falado

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `publico.falar.titulo` | Falar o cumprimento antes da história | Say the greeting before the story |
| `publico.falar.ajuda` | Antes de começar a leitura, a voz diz o cumprimento abaixo. | Before the reading starts, the voice says the greeting below. |
| `publico.previa.tela` | No topo da tela: | At the top of the screen: |
| `publico.previa.voz` | Em voz alta: | Out loud: |
| `publico.ouvir` | 🔈 Ouvir o cumprimento | 🔈 Hear the greeting |
| `publico.ouvir.carregando` | preparando a voz… | preparing the voice… |

## A frase falada

| Situação | Português | English |
|---|---|---|
| Com nomes | Olá Lara e Julia, vamos ouvir uma historinha? | Hi Lara and Julia, shall we listen to a little story? |
| Só "duas ou mais meninas" | Olá meninas, vamos ouvir uma historinha? | Hi girls, shall we listen to a little story? |
| Só "dois ou mais meninos" | Olá meninos, vamos ouvir uma historinha? | Hi boys, shall we listen to a little story? |
| Só "meninas e meninos" | Olá crianças, vamos ouvir uma historinha? | Hi everyone, shall we listen to a little story? |
| Nada informado | Olá, vamos ouvir uma historinha? | Hi there, shall we listen to a little story? |

A junção dos nomes segue a regra do idioma: em português, vírgulas e um "e" antes do último
("Ana, Bia e Caio"); em inglês, "and" no mesmo lugar ("Ana, Bia and Caio").


---

# v1.9.0 — Capítulos, duração e desfecho

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `criar.capitulos.rotulo` | Quantos capítulos | How many chapters |
| `criar.capitulos.um` | 1 — história única | 1 — single story |
| `criar.capitulos.varios` | {n} capítulos | {n} chapters |
| `criar.capitulos.aviso` | A IA vai escrever {n} capítulos em sequência, um lendo o anterior. Leva alguns minutos e usa {n} pedidos da cota. | The AI will write {n} chapters in sequence, each reading the previous one. It takes a few minutes and uses {n} requests from the quota. |
| `criar.serie.rotulo` | Nome da série | Series name |
| `criar.serie.dica` | Em branco, uso o título do capítulo 1 | Left blank, the title of chapter 1 is used |
| `criar.duracao.historia` | Duração da história | Length of the story |
| `criar.duracao.capitulo` | Duração de cada capítulo | Length of each chapter |
| `criar.duracao.escolher` | Escolher minutos | Pick minutes |
| `criar.duracao.minutos` | Minutos de leitura: | Minutes of reading: |
| `criar.desfecho.rotulo` | Como a história deve terminar | How the story should end |
| `criar.desfecho.ia` | Deixe a IA decidir | Let the AI decide |
| `criar.desfecho.feliz` | Final feliz e calminho, de dormir | Happy, calm ending, for falling asleep |
| `criar.desfecho.reviravolta` | Com uma reviravolta surpreendente | With a surprising twist |
| `criar.desfecho.licao` | Com uma pequena lição, sem moralismo | With a gentle lesson, never preachy |
| `criar.desfecho.engracado` | Final engraçado, de fazer rir | Funny ending, laugh-out-loud |
| `criar.desfecho.circular` | Fecha voltando à primeira cena | Closes by returning to the first scene |
| `criar.desfecho.reencontro` | Todos se reencontram no fim | Everyone reunites at the end |
| `criar.desfecho.revelacao` | A revelação só vem na última frase | The reveal lands only in the final sentence |
| `criar.desfecho.aberto` | Final aberto, com gancho para continuar | Open ending, with a hook to continue |
| `criar.gerar.um` | ✨ Gerar história | ✨ Generate story |
| `criar.gerar.varios` | ✨ Gerar os {n} capítulos | ✨ Generate the {n} chapters |
| `criar.gerando` | escrevendo o capítulo {k} de {n}… | writing chapter {k} of {n}… |
| `criar.aprovar.serie` | 💾 Aprovar e guardar os {n} capítulos | 💾 Approve and save the {n} chapters |
| `modelos.listar` | 🔄 Ver os modelos que a minha chave aceita | 🔄 See which models my key accepts |
| `modelos.aviso` | O Google troca os modelos de tempos em tempos. Se aparecer erro dizendo que o modelo saiu de linha, toque no botão acima e escolha um da lista. | Google retires models from time to time. If an error says the model is gone, tap the button above and pick one from the list. |


---

# v1.10.0 — Voz do aparelho (Android)

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `voz.padrao` | 🔧 Padrão do aparelho (o mecanismo escolhido nas Configurações) | 🔧 Device default (the engine chosen in Settings) |
| `voz.recarregar` | 🔄 Recarregar vozes | 🔄 Reload voices |
| `voz.ajuda.botao` | ❓ Instalei uma voz e ela não aparece | ❓ I installed a voice and it does not show |
| `voz.diag` | O navegador enxerga {n} voz(es), {pt} em português · mecanismos: {motores}. | The browser sees {n} voice(s), {pt} in Portuguese · engines: {engines}. |
| `voz.diag.vazio` | O navegador ainda não devolveu nenhuma voz. Toque em Recarregar; se continuar vazio, feche o navegador de vez e abra de novo. | The browser has not returned any voice yet. Tap Reload; if still empty, force-stop the browser and open it again. |
| `voz.legenda` | ⭐ = voz que parece natural. ✅ = em português. A opção Padrão do aparelho usa o mecanismo que estiver escolhido nas Configurações do celular, seja ele qual for. | ⭐ = voice that sounds natural. ✅ = Portuguese. Device default uses whatever engine is chosen in the phone Settings. |
| `voz.ajuda.titulo` | Voz instalada e o site não vê | Voice installed but the site cannot see it |
| `voz.ajuda.p0` | O site só consegue usar as vozes que o navegador entrega. No Android, o navegador só enxerga o mecanismo padrão escolhido nas Configurações — e guarda essa lista até ser fechado de vez. | The site can only use the voices the browser exposes. On Android the browser only sees the default engine chosen in Settings — and keeps that list until it is fully closed. |
| `voz.ajuda.p1` | Configurações → 🔍 "conversão de texto em voz" (na Samsung pode aparecer como Configurações de Leitura de texto Samsung; não é o TalkBack). | Settings → 🔍 "text-to-speech" (on Samsung it may show as Samsung Text-to-speech settings; not TalkBack). |
| `voz.ajuda.p2` | Em Mecanismo preferido, escolha o motor novo (SherpaTTS, Google, Samsung ou Acapela). Toque em Reproduzir e confira que a amostra sai com a voz nova. | Under Preferred engine, choose the new engine (SherpaTTS, Google, Samsung or Acapela). Tap Play and confirm the sample uses the new voice. |
| `voz.ajuda.p3` | Feche o navegador de vez: Configurações → Aplicativos → Chrome (ou Edge) → Forçar parada. Só recarregar a página não basta. | Close the browser for real: Settings → Apps → Chrome (or Edge) → Force stop. Reloading the page is not enough. |
| `voz.ajuda.p4` | Abra o site de novo → Ajustes → toque em 🔄 Recarregar vozes. | Open the site again → Settings → tap 🔄 Reload voices. |
| `voz.ajuda.p5` | Se a voz nova aparecer na lista, escolha-a. Se não aparecer, deixe em 🔧 Padrão do aparelho: o site pede "português do Brasil" sem escolher voz, e o Android responde com o mecanismo padrão — que agora é o novo. | If the new voice shows in the list, pick it. If not, keep 🔧 Device default: the site asks for "Brazilian Portuguese" without naming a voice, and Android answers with the default engine — now the new one. |
| `voz.ajuda.p6` | Toque em ▶️ Testar a voz. Se ainda sair a voz antiga, reinicie o celular uma vez. | Tap ▶️ Test the voice. If the old voice still plays, restart the phone once. |
| `voz.ajuda.edge` | As vozes "Naturais" do Edge de computador não existem no Android — a Microsoft não as libera para sites no celular. O caminho no Android é o mecanismo do sistema. | Desktop Edge "Natural" voices do not exist on Android — Microsoft does not expose them to websites on mobile. On Android the way is the system engine. |
