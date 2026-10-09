# Textos novos — Contador de Histórias (v1.7.0 em diante)
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

---

# Textos novos — v1.11.0

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `voz.guardada.titulo` | ⚡ Voz guardada no aparelho | ⚡ Voice saved on this device |
| `voz.guardada.usar` | Com a voz do celular, usar a voz guardada | With the phone voice, use the saved voice |
| `voz.guardada.usar.ajuda` | Se a história já tem voz de internet inteira no aparelho, toca com ela — sem gastar cota e sem internet. Trocar para a voz do celular não apaga nada. | If the story already has a full online voice on this device, it plays with it — no quota used and no internet needed. Switching to the phone voice deletes nothing. |
| `voz.guardada.total` | Voz guardada ocupando {mb} neste aparelho ({n} trechos). | Saved voice taking up {mb} on this device ({n} parts). |
| `voz.guardada.cota` | O navegador libera até cerca de {mb} para este site. | The browser allows up to about {mb} for this site. |
| `voz.guardada.vazio` | Nenhuma voz guardada ainda. | No saved voice yet. |
| `voz.guardada.inteira` | ✅ inteira | ✅ complete |
| `voz.guardada.parte` | ◐ em parte | ◐ partial |
| `voz.guardada.selo` | ⚡ voz guardada | ⚡ voice saved |
| `voz.guardada.selo.parte` | ◐ voz em parte | ◐ voice partly saved |
| `voz.guardada.faixa.usando` | 🟢 Voz guardada ({voz}) — não gasta cota · toque para usar a voz do celular | 🟢 Saved voice ({voz}) — no quota used · tap to use the phone voice |
| `voz.guardada.faixa.oferta` | 🎙️ Esta história tem voz guardada ({voz}) — toque para ouvir com ela | 🎙️ This story has a saved voice ({voz}) — tap to listen with it |
| `voz.guardada.apagar.uma` | 🗑️ apagar a voz guardada desta história ({mb}) | 🗑️ delete this story's saved voice ({mb}) |
| `voz.guardada.apagar.sobras` | 🧹 Apagar a voz de histórias que não existem mais | 🧹 Delete voice of stories that no longer exist |
| `voz.guardada.apagar.tudo` | 🗑️ Apagar toda a voz guardada | 🗑️ Delete all saved voice |
| `publico.proteger` | 🛡️ Não mandar os nomes para a IA | 🛡️ Don't send the names to the AI |
| `publico.proteger.ajuda` | Antes de pedir uma história, os nomes viram códigos ([NOME1], [NOME2]…) e voltam ao normal aqui no aparelho. A IA nunca recebe os nomes das crianças. | Before a story is requested, names become codes ([NAME1], [NAME2]…) and are restored here on the device. The AI never receives the children's names. |
| `publico.outros` | Outros nomes para proteger (opcional — irmãos, pets, escola) | Other names to protect (optional — siblings, pets, school) |
| `publico.voz.aviso` | A voz de internet precisa receber o texto para ler — inclusive os nomes. Para nada sair do aparelho, use a voz do celular. | The online voice has to receive the text to read it — names included. To keep everything on the device, use the phone voice. |
| `mic.titulo` | 🎤 Comandos de voz (experimental) | 🎤 Voice commands (experimental) |
| `mic.mostrar` | Mostrar o botão 🎤 | Show the 🎤 button |
| `mic.mostrar.ajuda` | Toque no 🎤 e fale um comando. O microfone só abre com o toque. No Chrome, o que é falado vai ao Google para virar texto. | Tap 🎤 and say a command. The microphone only opens on tap. In Chrome, what is said goes to Google to be transcribed. |
| `mic.ia` | Entender frases livres com a IA | Understand free-form requests with AI |
| `mic.ia.ajuda` | Quando nenhum comando fixo servir, a IA que escreve as histórias tenta entender o pedido. Gasta um pouquinho da cota. | When no fixed command fits, the story-writing AI tries to understand the request. Uses a little quota. |
| `mic.falar` | 🎤 Pode falar… | 🎤 Go ahead… |
| `mic.naoentendi` | Ouvi: "{frase}" — não sei fazer isso ainda | I heard: "{frase}" — I can't do that yet |
| `mic.semsuporte` | Este navegador não reconhece fala. No Android, use o Chrome. | This browser doesn't recognise speech. On Android, use Chrome. |
| `aviso.criancas` | (parágrafo "Crianças" do Aviso de uso — texto jurídico, ver `index.html`) | Children. Content is meant to be heard by children, always on an adult's initiative and supervision. No feature requests children's data. Names entered in settings stay on the device and, by default, are replaced by codes before any AI request, being restored locally. Online voice services, when chosen, receive the text to be read, which may include names; the device voice sends nothing. Surnames, school, address, images or any identifying detail of a child should not be entered, nor stories containing real names published in the repository. Reference: the child's best interest and art. 14 of Brazil's LGPD. |
| `aviso.comandos` | (parágrafo "Comandos de voz" do Aviso de uso) | Voice commands. Off by default. When on, the browser's speech recognition may send captured audio to the browser vendor for transcription; the microphone opens only by tapping its button. |

Comandos falados (PT → EN): tocar/continuar → play/continue · pausar → pause · voltar/repetir → back/repeat · avançar/pular → skip · próximo capítulo → next chapter · capítulo anterior → previous chapter · do início → from the start · mais rápido → faster · mais devagar → slower · favorita → favourite · já lida → already read · fechar → close · história da noite → tonight's story · acervo → library · criar uma história sobre … → create a story about … · ler a história do … → read the story of …
(O reconhecimento em inglês ainda não está ligado — os padrões são em português.)

---

# Textos novos — v1.11.1

| Chave sugerida | Português (pt-BR) | English (en-US) |
|---|---|---|
| `leitor.fechar` | Fechar a história | Close the story |
| `leitor.inicio` | Ir para o Início | Go to Home |
| `topo.marca` | Contador de Histórias — ir para o Início | Storyteller — go to Home |
| `midia.artista` | Contador de Histórias | Storyteller |


---

# v1.12.0 — Troca de IA, cofre, testar a chave e AssistONE

Os textos montados na hora (com nome da IA, tela atual etc.) já saem em PT e EN pelo próprio
`index.html` (`T(pt, en)`, seguindo o PT | EN do módulo). Os rótulos fixos estão no
`diretrizes-config.js`.

| Onde | Português (pt-BR) | English (en-US) |
|---|---|---|
| Aviso de troca (cota) | 🔁 <IA> está sem cota agora — usando <outra> | 🔁 <AI> is out of quota right now — using <other> |
| Aviso de troca (crédito) | 🔁 <IA> está sem crédito agora — usando <outra> | 🔁 <AI> is out of credit right now — using <other> |
| Aviso de troca (chave) | 🔁 <IA> recusou a chave — usando <outra> | 🔁 <AI> refused the key — using <other> |
| Aviso de troca (sem chave) | 🔁 <IA> está sem chave — usando <outra> | 🔁 <AI> has no key — using <other> |
| Cofre, selo | ✓ chave salva / sem chave | ✓ key saved / no key |
| Botão | 🔑 Testar a chave | 🔑 Test the key |
| Teste, ok | ✓ Chave válida | ✓ Key is valid |
| Teste, falta permissão | ✓ Chave válida — sem permissão para este teste, mas serve para gerar | ✓ Key is valid — no permission for this test, but it works for generating |
| Teste, recusada | Chave recusada — copie inteira ou crie outra | Key refused — copy it whole or create a new one |
| Teste, sem resposta | Sem resposta (rede ou bloqueio do navegador). A chave ficou salva — tente usar. | No answer (network or browser block). The key is saved — try using it. |
| ElevenLabs, vozes | A chave é válida, mas não tem a permissão voices_read para listar as vozes. Crie a chave com essa permissão. | The key is valid but lacks the voices_read permission to list voices. Create the key with that permission. |
| Ajustes | Saiba mais | Learn more |
| Ajustes, AssistONE | AssistONE ativado · Abrir o AssistONE · Recomeçar dicas | AssistONE on · Open AssistONE · Restart tips |
| AssistONE, balão | Olá! Eu sou o AssistONE 👋 · Você está em <tela> · Tour rápido · Procurar algo · Ajuda desta tela · Agora não · Desligar o AssistONE | Hi! I'm AssistONE 👋 · You are in <screen> · Quick tour · Find something · Help for this screen · Not now · Turn AssistONE off |
| AssistONE, busca | O que você procura? · Não achei. · Você quis dizer… | What are you looking for? · Nothing found. · Did you mean… |
| AssistONE, tour | Tour rápido · Próximo › · Sair · Fim do tour ✨ | Quick tour · Next › · Exit · Tour done ✨ |
| AssistONE, dica | Entendi · Mais ajuda | Got it · More help |
| AssistONE, telas | Início / Acervo / Criar / Ajustes, com a frase e a ajuda de cada uma (ver `TELAS` no `index.html`) | Home / Library / Create / Settings, each with its sentence and help (see `TELAS` in `index.html`) |


---

# v1.13.0 — Faixa de anúncios em carrossel

| Onde | Português (pt-BR) | English (en-US) |
|---|---|---|
| Etiqueta da faixa | ANÚNCIO | AD |
| Botão × | Fechar anúncios | Close ads |
| Região (leitor de tela) | Anúncios | Ads |

Os textos de cada anúncio vêm do `anuncios.json` central (campo `frase` com `pt` e `en`).


---

# v1.14.0 — Fila de voz e voz guardada preservada

| Onde | Português (pt-BR) | English (en-US) |
|---|---|---|
| Ajustes, título | 📥 Fila de voz | 📥 Voice queue |
| Ajustes, explicação | Baixa a voz de várias histórias, uma por vez, e tenta de novo sozinha quando a cota acaba. | Downloads the voice of several stories, one at a time, and retries on its own when the quota runs out. |
| Botões | ➕ Escolher histórias · ▶️ Continuar · ⏸ Pausar · Esvaziar a fila | ➕ Choose stories · ▶️ Resume · ⏸ Pause · Empty the queue |
| Estado | N na fila · trabalhando… · N na fila, pausada · Nenhuma história na fila. | N queued · working… · N queued, paused · No stories in the queue. |
| Andamento | gerando o trecho X de Y · cota cheia — tento de novo às HH:MM (tentativa N) · não respondeu — … · sem internet — continuo quando voltar · esperando você fechar a história aberta… | generating clip X of Y · quota full — retrying at HH:MM (attempt N) · no answer — … · offline — resuming when it is back · waiting for you to close the open story… |
| Avisos | ✅ Voz pronta: <título> · 🎉 Fila de voz terminada · 📥 Continuando a fila de voz… · Fila de voz pausada: <motivo> | ✅ Voice ready: <title> · 🎉 Voice queue finished · 📥 Resuming the voice queue… · Voice queue paused: <reason> |
| Escolher | Marque as histórias. A fila baixa uma por vez e insiste sozinha quando a cota acaba. · Marcar as que faltam · Desmarcar · Pôr na fila (N) · ✅ inteira · ◐ em parte · ○ sem voz · 📥 na fila | Tick the stories. The queue downloads one at a time and keeps retrying when the quota runs out. · Tick the missing ones · Untick all · Add to queue (N) · ✅ complete · ◐ partial · ○ no voice · 📥 queued |
| Início | 📥 Baixando vozes: N na fila · … | 📥 Downloading voices: N queued · … |
| Menu ⋯ da história | 📥 Pôr na fila de voz | 📥 Add to the voice queue |
| Proteção | 🔒 Protegida: o navegador não apaga a voz sozinho. Atualizar o app também não apaga. | 🔒 Protected: the browser will not delete the voice on its own. Updating the app does not delete it either. |
| Proteção (sem garantia) | ⚠️ Se o aparelho ficar sem espaço, o navegador pode apagar a voz. Instalar o app na tela inicial ajuda; para garantir, guarde num arquivo. | ⚠️ If the device runs out of space, the browser may delete the voice. Installing the app on the home screen helps; to be safe, save it to a file. |
| Arquivo | 💾 Guardar num arquivo · 📂 Trazer de um arquivo · Arquivo com X pronto — guarde num lugar seguro · ✅ N trechos trazidos · N já estavam aqui · Este arquivo não é uma voz guardada do Contador de Histórias. | 💾 Save to a file · 📂 Bring from a file · File with X ready — keep it somewhere safe · ✅ N clips brought in · N were already here · This file is not a Storyteller saved voice. |


---

# v1.15.0 — Voz premium e IA de histórias da SolverONE

| Onde | Português (pt-BR) | English (en-US) |
|---|---|---|
| Botão de motor | ✨ SolverONE · premium, sem chave | ✨ SolverONE · premium, no key |
| Sem login | Voz e histórias com a qualidade da SolverONE, sem precisar de chave. Entre com a sua conta para usar. · Entrar com a conta SolverONE | SolverONE-quality voice and stories, no key needed. Sign in with your account to use them. · Sign in with a SolverONE account |
| Conectado | Conectado como <e-mail> · plano <plano> · Usado este mês: X de Y caracteres (≈ N min de história) · Sem limite no seu plano · Sair da conta SolverONE | Signed in as <e-mail> · plan <plan> · Used this month: X of Y characters (≈ N min of story) · No limit on your plan · Sign out of SolverONE |
| Sem acesso | A sua conta ainda não está liberada. · Disponível nos planos pagos da SolverONE. · Você usou todo o saldo deste mês (X de Y). Renova no dia 1. | Your account is not approved yet. · Available on SolverONE paid plans. · You used all of this month's allowance (X of Y). It renews on the 1st. |
| Janela de conta | Conta SolverONE · A mesma conta vale em todos os apps da SolverONE… · Entrar · Entrar com Google · Criar conta · Esqueci a senha · Nova senha · Salvar a senha | SolverONE account · The same account works in every SolverONE app… · Sign in · Sign in with Google · Create account · Forgot password · New password · Save password |
| Erros | E-mail ou senha incorretos. · Confirme o e-mail primeiro… · Este e-mail já tem conta… · Senha fraca… · Acabou o saldo deste mês na SolverONE (renova no dia 1). · A SolverONE está ocupada agora… · A IA não aceitou escrever este pedido… | Wrong e-mail or password. · Confirm your e-mail first… · This e-mail already has an account… · Weak password… · This month's SolverONE allowance is used up (renews on the 1st). · SolverONE is busy right now… · The AI would not write this request… |
| Avisos | ✨ Conta SolverONE conectada · Conta SolverONE desconectada · Senha trocada ✓ | ✨ SolverONE account connected · SolverONE account disconnected · Password changed ✓ |

A mensagem para quem não tem o plano pode ser trocada no RootifyONE (PT e EN).


---

# v1.16.0 — Convite da voz premium e da IA da SolverONE

| Onde | Português (pt-BR) | English (en-US) |
|---|---|---|
| Botão | ✨ SolverONE ⓘ · premium, sem chave | ✨ SolverONE ⓘ · premium, no key |
| Leitor de tela | Voz premium SolverONE — saiba mais · IA de histórias SolverONE — saiba mais | SolverONE premium voice — learn more · SolverONE story AI — learn more |
| Convite, voz | Uma voz que conta a história como gente: calma, expressiva, do jeito que se conta na hora de dormir. · 🎭 Emoção, pausas e sussurros de contador de histórias de verdade · 🔑 Sem chave e sem configurar nada · 📱 Fica guardada no aparelho: ouvir de novo não gasta nada e funciona sem internet | A voice that tells the story like a person: calm, expressive, the way stories are told at bedtime. · 🎭 Emotion, pauses and whispers like a real storyteller · 🔑 No key and nothing to set up · 📱 Stays on the device: listening again costs nothing and works offline |
| Convite, IA | A IA da SolverONE escreve as histórias por você, com mais capricho, dentro do seu plano. · 🖋️ Enredo, ritmo e final de dormir mais caprichados · 🛡️ Os nomes das crianças continuam protegidos | SolverONE AI writes the stories for you, with more care, within your plan. · 🖋️ Richer plots, rhythm and bedtime endings · 🛡️ Children's names stay protected |
| Situação | Chega em breve nos planos pagos da SolverONE. · Faz parte dos planos pagos da SolverONE. Já é assinante? Entre com a sua conta. · Você já usou todo o saldo deste mês. Renova no dia 1. | Coming soon to SolverONE paid plans. · Part of SolverONE paid plans. Already a subscriber? Sign in with your account. · You have used all of this month's allowance. It renews on the 1st. |
| Botões | ▶️ Ouvir uma amostra · ⏸ Parar · Entendi | ▶️ Hear a sample · ⏸ Stop · Got it |
| Frase da amostra | ver `AMOSTRA-VOZ-PREMIUM-contador-de-historias.md` | see `AMOSTRA-VOZ-PREMIUM-contador-de-historias.md` |


---

# v1.16.1 — Amostra toca sozinha

Sem texto novo na tela: a amostra toca ao abrir o convite e aceita MP3 ou WAV.


---

# v1.16.2 — Nome novo

| Onde | PT | EN |
|---|---|---|
| Nome do app (topo, aba do navegador, ícone instalado, Sobre) | UM Contador de Histórias | ONE Storyteller (nome do app em inglês, usado pelo módulo comum) |
| Novidades | O app agora se chama UM Contador de Histórias · A amostra da voz premium já vem com o app | — |


# v1.17.0 — Topo padrão, menus e AssistONE (02/Out/2026)

| Onde | Português (pt-BR) | English (en-US) |
|---|---|---|
| Topo | Menu · Buscar · Mensagens · Perfil | Menu · Search · Messages · Profile |
| Barra de baixo | Início · Acervo · Criar · Configurações | Home · Library · Create · Settings |
| Gaveta ☰ | Buscar · Mensagens · AssistONE · Novidades · Aviso de uso · versão | Search · Messages · AssistONE · What's new · Terms of use · version |
| Gaveta ☰ | Fechar o menu | Close the menu |
| Menu 👤 | Visitante · Sem conta: nada sai deste aparelho. | Guest · No account: nothing leaves this device. |
| Menu 👤 | Conta neste aparelho: nenhuma · Entrar · Sair | Account on this device: none · Sign in · Sign out |
| Menu 👤 | SolverONE: não conectado | SolverONE: not signed in |
| Menu 👤 | Membro · Anunciante · via senha / digital / Google · desde | Member · Advertiser · via password / fingerprint / Google · since |
| Menu 👤 | São duas contas diferentes: a deste aparelho guarda histórias e chaves só aqui; a SolverONE dá a voz premium e a IA da plataforma. | They are two different accounts: this device's one keeps stories and keys here only; SolverONE gives the premium voice and the platform AI. |
| Menu 👤 | Configurações · Tema claro · Efeitos sonoros · AssistONE · Sair | Settings · Light theme · Sound effects · AssistONE · Sign out |
| Menu 👤 | Você saiu · Você saiu da conta deste aparelho | Signed out · Signed out of this device's account |
| Configurações | Idioma e aparência | Language and appearance |
| Configurações | Idioma — Português ou inglês, em todo o app. | Language — Portuguese or English, across the app. |
| Configurações | Tema claro — Fundo claro para o dia. O escuro é o padrão, feito para a hora de dormir. | Light theme — Light background for daytime. Dark is the default, made for bedtime. |
| Configurações | Reduzir animações — Para o balanço do AssistONE e as transições do app. | Reduce animations — Stops the AssistONE bounce and the app transitions. |
| Configurações | Notificações, instalação e nuvem | Notifications, install and cloud |
| Mensagens | Mensagens · Caixa de entrada · Arquivadas · Ver · Marcar como lida · Arquivar · Desarquivar · Fechar | Messages · Inbox · Archived · Open · Mark as read · Archive · Unarchive · Close |
| Mensagens | Aviso do app · Aviso da SolverONE · Novidades da versão … · n mensagens novas · não lidas | App notice · SolverONE notice · What's new in version … · n new messages · unread |
| Mensagens | Nada por aqui. Os avisos do app e da SolverONE chegam nesta caixa. | Nothing here. App and SolverONE notices arrive in this box. |
| Busca | Buscar · História, tela ou função · Histórias · Telas e funções · você quis dizer… · Não achei nada com esse nome. | Search · Story, screen or function · Stories · Screens and functions · did you mean… · Nothing found with that name. |
| AssistONE | AssistONE — ajuda e assistente (aria-label) | AssistONE — help and assistant |
| Tour | O ☰ abre o menu com todas as telas, a busca e as mensagens. | The ☰ opens the menu with every screen, search and messages. |
| Tour | O perfil mostra quem está conectado e abre Configurações, tema, som e Sair. | The profile shows who is signed in and opens Settings, theme, sound and Sign out. |
| Tour | A barra de baixo leva ao Início, ao Acervo, a Criar e às Configurações. | The bottom bar takes you Home, to the Library, Create and Settings. |


---

# v1.18.0 — Conta SolverONE no padrão comum

| Onde | PT | EN |
|---|---|---|
| Configurações, título | ✨ Conta SolverONE | ✨ SolverONE account |
| Conta, sem conta | A mesma conta de todos os apps da SolverONE. Dá a voz premium e a IA da plataforma, conforme o seu plano. Sem conta, tudo continua só neste aparelho. · Entrar ou criar conta | The same account for every SolverONE app. It gives the premium voice and the platform AI, depending on your plan. Without an account, everything stays on this device only. · Sign in or create account |
| Conta, conectado | Conectado como … · desde … · Vale em todos os apps da SolverONE neste aparelho (OmniLifeONE, MoneyTRIO…). · Sair da conta neste aparelho · Encerrar minha conta / pedir exclusão dos meus dados | Signed in as … · since … · Works in every SolverONE app on this device (OmniLifeONE, MoneyTRIO…). · Sign out on this device · Close my account / ask to erase my data |
| Sair | Conta SolverONE desconectada neste aparelho | SolverONE account disconnected on this device |
| Link de fora | Conectar uma conta? · Este link quer conectar a conta SolverONE … neste aparelho (vale para todos os apps da SolverONE). Foi você que pediu? · Sim, sou eu · Não fui eu · Tudo bem: nenhuma conta foi conectada. | Connect an account? · This link wants to connect the SolverONE account … on this device (it applies to every SolverONE app). Did you request it? · Yes, it's me · It wasn't me · OK: no account was connected. |
| Encerrar | Encerrar minha conta SolverONE · Você perde o acesso na hora, em todos os apps da SolverONE, e pede a exclusão dos seus dados pessoais. · Quer contar o motivo? (opcional) · As histórias e as vozes guardadas neste aparelho continuam aqui. Para apagar: Configurações → Zona de perigo → Apagar tudo deste celular. · Continuar · Cancelar | Close my SolverONE account · You lose access right away, in every SolverONE app, and ask for your personal data to be erased. · Would you like to tell us why? (optional) · The stories and saved voices on this device stay here. To erase them: Settings → Danger zone → Erase everything on this phone. · Continue · Cancel |
| Encerrar, 2ª tela | Última confirmação · Seus dados pessoais serão anonimizados em até 15 dias e isso não dá para desfazer. · Encerrar minha conta · Não deu para registrar o pedido: … Escreva para … | Last confirmation · Your personal data will be anonymised within 15 days and this cannot be undone. · Close my account · Could not register the request: … Write to … |
| Encerrada | Sua conta SolverONE foi encerrada · Ela não foi excluída: fica encerrada para auditoria e obrigações legais, e os seus dados pessoais são anonimizados quando você pede a exclusão. · As histórias e as vozes deste aparelho continuam aqui. · Dúvidas ou reativação: … | Your SolverONE account has been closed · It was not deleted: it stays closed for audit and legal duties, and your personal data is anonymised when you request erasure. · The stories and voices on this device stay here. · Questions or reactivation: … |
| Bloqueada | ⛔ Esta conta SolverONE está bloqueada. | ⛔ This SolverONE account is blocked. |
| Histórias e backup | Trazer as histórias que vêm com o app · Ao abrir, buscar as histórias novas do acervo do app. · Exportar baixa um arquivo com as suas histórias, para guardar ou levar para outro aparelho (lá, use Importar). Ele tem os nomes das crianças: guarde só para você e não publique. | Bring the stories that come with the app · On opening, fetch new stories from the app's library. · Export downloads a file with your stories, to keep or take to another device (there, use Import). It has the children's names: keep it to yourself and do not publish it. |
