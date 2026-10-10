# UM Contador de Histórias na conta e no banco SolverONE (Supabase) — plano

Versão do plano: 2 · 09/Out/2026 · app na v1.18.0 (Etapa 2a feita). A versão 2 acrescenta a **visão do dono** (item 0):
acervo no servidor com cópia no aparelho, família e **comunidade de histórias**, com as regras ligadas no RootifyONE.
Nada foi rodado no Supabase.

- Contrato da plataforma: `PLATAFORMA-DADOS.md` (C1 a C10, cópia fiel).
- Modelo seguido: OmniLifeONE 2.13 a 2.15 (`PLANO-SUPABASE-OmniLifeONE.md` e `supabase/omnilife-one-v1.sql` no repositório
  `omnilife-one`).
- Rascunho do SQL: `supabase/contador-de-historias-v1.sql` (**não rodar antes da revisão do Claude do manual e da sua
  autorização**). Teste local: `supabase/teste/`.
- Lista de pendências: `PENDENCIAS.md`.

## 0. A visão do dono (09/Out/2026)

1. **Um acervo de histórias que já vem com o app**, guardado no servidor **e** no aparelho (no app instalado ou no
   navegador), para ler e ouvir **sem internet**. Isso é muito importante: tudo o que vem do servidor tem cópia no aparelho.
2. **Compartilhar com a família** (pai, mãe, quem cuida) — é uma boa ideia.
3. **Comunidade de histórias:** quem cria uma história pode decidir torná-la **pública**; outras pessoas pesquisam e
   leem; fica num banco comum de livre acesso. A pessoa pode **revogar** — sabendo que quem já leu pode ter copiado.
4. **No RootifyONE, sim ou não:** a comunidade pode ser ligada ou desligada; **criar e publicar dependem do plano**. No
   começo, **liberado para todo mundo**; depois o dono refina quem tem direito por plano.

**Como o plano atende:**

| Visão | Como fica |
|---|---|
| 1. Acervo no servidor e no aparelho | As histórias oficiais saem do arquivo `historias.json` e vão para a tabela `conta_publicas` (tipo `oficial`), que **qualquer pessoa lê, até sem conta**. O app baixa tudo para o aparelho (IndexedDB) e, depois, só **o que mudou** (`conta_acervo_mudancas`). Sem internet, lê a cópia. O `historias.json` continua como reserva. |
| 2. Família | Igual ao plano 1 (etapa da família), depois da chave pessoal comum na base (item 8.1). |
| 3. Comunidade | A mesma tabela, tipo `comunidade`. **Publicar** (`conta_publicar`) faz uma **cópia em claro** da história, separada da cópia cifrada da pessoa: o que é público é público. Antes, o app confere os nomes das crianças (da lista "Para quem são as histórias" e dos nomes protegidos), oferece **trocar por nomes inventados** e pede a confirmação "não tem nome real de criança, escola nem endereço" (o banco recusa sem ela). Aparece com o nome que a pessoa escolher (ex.: "Família da Bia"), nunca o e-mail. **Pesquisar** (`conta_buscar`) por título, tema, personagens e texto. **Revogar** (`conta_revogar`): some da comunidade, o texto sai do banco e os aparelhos tiram da cópia deles na próxima conferência; o app avisa antes que quem já leu pode ter guardado. **Denunciar** (`conta_denunciar`): com 3 denúncias a história some sozinha até a equipe ver. **Revisão antes de publicar** (ligada no começo, por ser um app para crianças): a história só aparece depois que a equipe aprovar no RootifyONE (`admin_conta_moderar`). |
| 4. RootifyONE | Tabela `conta_regras`: `comunidade`, `publicar` (e quantas por dia), `criar`, `nuvem`, `familia`, `revisao_previa`, `ocultar_denuncias` — cada uma ligada ou não e para quais planos (`*` = todos). Começam **todas ligadas para todos**. O RootifyONE muda por `admin_conta_salvar_regra` (fica registrado). O app pergunta `conta_minhas_regras()` e esconde ou põe em cinza o que o plano não tem; **o banco recusa** publicar fora da regra. |

**Uma limitação honesta:** "criar história" com a **chave de IA da própria pessoa** acontece no aparelho, sem passar pelo
servidor; a regra `criar` decide o que a tela mostra, mas quem quiser burlar consegue. A IA paga da plataforma já é
conferida no servidor (`solverone-ia`).

## Em uma frase

Hoje tudo do Contador fica no navegador de cada aparelho. Depois das etapas abaixo, quem entra com a **conta SolverONE**
passa a ter as **suas histórias, onde parou e os ajustes em qualquer aparelho**, com o texto das histórias **embaralhado no
aparelho antes de sair** (nem a SolverONE consegue ler, porque o texto tem nomes de crianças). As **vozes guardadas
continuam no aparelho**. Quem não quiser conta continua como hoje, só no aparelho.

## 1. O que o app guarda hoje, e onde

🧒 = tem ou pode ter **dado de criança** (nome, apelido, idade, rotina de sono).

| O quê | Onde fica | Criança? | Observação |
|---|---|---|---|
| Histórias (título, texto, personagens, tema, série, idade, progresso, favorita, lida, leituras) | navegador: `localStorage` `ch_historias` | 🧒 sim | O texto e os personagens trazem os nomes das crianças (a IA recebe códigos `[NOME1]`, mas a história guardada tem os nomes de verdade). O `localStorage` tem limite de uns 5 MB. |
| Ajustes (`ch_config`): voz, velocidade, tema, efeitos, fonte… | navegador | 🧒 parte | Dentro estão **para quem é a história** (`publicoNomes`, `publicoTipo`) e os **nomes protegidos** (`nomesProtegidos`); as instruções da voz podem citar as crianças. |
| Chaves de IA (Gemini, ElevenLabs, OpenAI, Anthropic) e **token do GitHub** | navegador, dentro de `ch_config` | — | Segredos. Nunca vão para o banco. |
| Estatísticas (`ch_stats`): leituras, minutos, noites seguidas | navegador | 🧒 rotina | Sem nome, mas diz quando a criança dorme. |
| **Vozes guardadas** (áudio de cada trecho) | navegador: IndexedDB `ch_audio` | 🧒 sim | O áudio fala os nomes. Pode ocupar dezenas de MB. Sai do aparelho só pelo arquivo `.chvoz` que a pessoa baixa. |
| Fila de voz (`ch_fila_voz`) | navegador | — | Trabalho deste aparelho. |
| Conta SolverONE (`ch_solverone_sessao`) e serviços (`ch_solverone_servicos`) | navegador | — | Só a sessão (tokens); a conta mora no banco. |
| Módulo comum (`dgo:contador-de-historias:*`, `dgo:global:*`): conta "deste aparelho", idioma, perfil comum, avisos | navegador | — | Conta local com senha embaralhada (PBKDF2). |
| Mensagens lidas, AssistONE, anúncios, versão, topo (`ch_inbox`, `ch_assist`, `ch_anuncio*`, `ch_versao`, `ch_topo_desde`) | navegador | — | Só jeito de usar. |
| **Acervo público** `historias.json` | **arquivo público** do repositório (qualquer pessoa na internet lê) | ⚠️ | 36 histórias. Em 3 delas (uma série) os personagens são **duas meninas com nome e apelido** que parecem crianças reais, também no texto. Ver risco R1. |
| "☁️ Enviar acervo para o GitHub" (Configurações → avançado) | grava **todas** as histórias do aparelho no `historias.json` de um repositório | 🧒 sim | Se o repositório for o deste site, as histórias da família ficam públicas e **todos os aparelhos baixam** (está ligado por padrão). Ver risco R2. |
| "⬇️ Exportar" | arquivo `historias.json` **aberto** na pasta Downloads | 🧒 sim | Qualquer app ou pessoa com acesso ao aparelho lê. |
| "Levar a configuração" | um link `…#cfg=` com as **chaves de IA** dentro | — | O próprio app avisa para mandar só para si. |
| Google Drive | **não usa** | — | — |

## 2. Conta SolverONE: o que já tem e o que falta para a regra comum

**Já tem (módulo `Plataforma`, v1.16):** entrar com e-mail e senha, Google, criar conta, esqueci a senha e nova senha,
tudo por REST, sem biblioteca; só a URL e a publishable key no código; sessão em `ch_solverone_sessao` renovada sozinha;
recarregar não desloga; serviços pagos (`servicos_plataforma_app`) e a função `solverone-ia`.

**Falta (Etapa 2a):**

| Regra comum (diretrizes, "Conta SolverONE") | Hoje no Contador | O que muda |
|---|---|---|
| Sessão na chave comum `solverone.sessao.v1` | chave própria `ch_solverone_sessao` | Ler a comum primeiro; se não houver, aproveitar a antiga; gravar as duas iguais por um tempo (o OmniLifeONE ainda lê a antiga). |
| Antes de renovar, ler a chave de novo; uma renovação por vez | renova sozinho, sem reler | **Risco real:** se o Contador e o OmniLifeONE renovarem com o mesmo token, o servidor derruba os dois. Reler antes, trava entre abas. |
| Sair = `logout?scope=local` | `logout` **sem** `scope=local` | Hoje "Sair" no Contador **desconecta a conta em todos os aparelhos**. Passa a sair só deste. |
| Volta com `#access_token` só se este aparelho pediu | aceita qualquer link | Marcador `ch_conta_pedido` (2 dias) ao tocar em Google, criar conta ou esqueci a senha; sem ele: "Este link quer conectar a conta x@y neste aparelho. Foi você?". |
| Registrar uso (C4): `sol_registrar_uso('contador-de-historias')` | não chama | Ao entrar e ao abrir já conectado, uma vez por abertura e por conta. |
| Registrar acesso (C9): Edge Function `solverone-admin`, `{acao:'registrar-acesso', evento, app:'contador-de-historias'}` | não chama | `login` ao entrar, `refresh` ao abrir, `logout` ao sair; fila no aparelho (`ch_acessos_pendentes`) antes de enviar, `keepalive`, reenviar ao abrir, ao voltar a internet e em 1 min; recusa na saída da página não conta como falha (não duplica). |
| Conta encerrada: `minha_conta_encerrada` | não confere | Ao entrar e ao abrir: se encerrada, avisa e desconecta (as histórias do aparelho continuam no aparelho). |
| "Encerrar minha conta / pedir exclusão dos meus dados" (`minha_solicitacao_exclusao`) | não tem | Cartão na conta, motivo opcional e duas confirmações; lembra que histórias e vozes deste aparelho só saem dele com "Apagar tudo deste aparelho". |

Nenhuma dessas mudanças precisa de SQL novo: tudo já existe no banco (base aplicada em 03/Out/2026).

## 3. O que vai para a nuvem e o que fica no aparelho

### Vai para a nuvem (tabelas `conta_*`, só com a conta SolverONE)

| No banco | O que guarda | Em claro ou cifrado | Por quê |
|---|---|---|---|
| `conta_historias` | as histórias **da pessoa** (feitas pela IA, digitadas ou importadas), com o **mesmo id** do aparelho | **cifrado** no aparelho (AES-GCM 256), inclusive título e personagens | O texto tem nomes de crianças (LGPD art. 14; diretriz: dado de criança cifrado sempre). O mesmo id faz as vozes guardadas continuarem valendo. |
| `conta_progresso` | onde parou, favorita, lida, quantas leituras — por história (também as do acervo público) | em claro (sem nomes) | Para continuar de onde parou em outro aparelho; o banco precisa juntar sem ler texto. |
| `conta_preferencias` | ajustes que valem em qualquer aparelho (tema, velocidade, efeitos, fonte, motor de voz e de texto escolhidos…) **+** nomes das crianças, nomes protegidos e instruções da voz | ajustes simples em claro; **nomes e instruções cifrados** | O banco **recusa** qualquer ajuste em claro com nome, chave, senha ou token (confere no gatilho). Guarda também a data e a versão do **consentimento do responsável**. |
| `conta_estatisticas` | leituras, minutos e noites seguidas, **uma linha por aparelho** | em claro (sem nomes) | Cada aparelho só soma o seu: nunca dá conflito. |
| `conta_chave` | a "chave do acervo", **embrulhada pelo código de recuperação** da pessoa (PBKDF2-SHA256, 600 mil rodadas) | pacote fechado | Para abrir as histórias num aparelho novo. Só se acrescenta: dois aparelhos não conseguem criar chaves diferentes. |

**Família/grupo:** faz sentido para **pai e mãe dividirem o acervo**. A tabela já nasce com `grupo_id` (opcional): o
dono compartilha uma história com uma família da SolverONE (inclusive a do OmniLifeONE); os outros membros **só leem**;
criança só lê e não compartilha. Mas abrir a história cifrada na família precisa da chave pessoal comum entre os apps
(ponto 8.1) — por isso a família fica para a Etapa 2d.

### Fica só no aparelho

| O quê | Por quê |
|---|---|
| Chaves de IA e token do GitHub | São senhas da pessoa (diretriz: nunca na nuvem nem no RootifyONE). O banco recusa se tentarem subir. |
| **Vozes guardadas** (`ch_audio`) | Pesadas (o plano grátis tem 1 GB de arquivos para **todos** os apps), falam os nomes das crianças e cada aparelho gera as suas. Levar para outro aparelho continua pelo arquivo `.chvoz`. |
| Voz do aparelho escolhida (`vozNativa`) | Cada celular tem vozes diferentes. |
| Fila de voz, Wake Lock | Trabalho deste aparelho. |
| Sessões, conta "deste aparelho" do módulo comum, cache dos serviços | Ficam por aparelho, como no OmniLifeONE. |
| Mensagens lidas, AssistONE, anúncios, versão, topo | Jeito de usar o aparelho. |
| Acervo público e comunidade | Não vão para a conta de ninguém: ficam em `conta_publicas` (público, item 0) e o aparelho guarda uma cópia para ler sem internet. |
| Visitante (sem conta) | Tudo continua no aparelho, como hoje. |

## 4. Rascunho do SQL

`supabase/contador-de-historias-v1.sql` — 8 tabelas `conta_*` (5 da pessoa + acervo público, denúncias e regras), regras
de acesso (RLS) em todas, gatilhos (quem/quando, versão para conflito, apagar = marcar), funções do acervo e da
comunidade, funções da equipe para o RootifyONE, `conta_anonimizar(uid)` registrada em `sol_apps` e conferência no fim.

**O que o banco garante (não só a tela):**

- Visitante não lê nem grava nada do Contador; o app **não apaga** linha de verdade (apagar = marcar, e o conteúdo sai).
- Cada um grava só no próprio nome; história compartilhada: os outros só leem; criança não compartilha.
- A mesma história não entra duas vezes (impressão digital feita no aparelho, sem o banco ler o texto).
- O id da história não muda (o áudio guardado depende dele).
- Conta encerrada não grava mais nada.
- Ajuste com chave, senha, token, nome ou instrução em claro é recusado; consentimento dado não some.
- A chave do acervo não se troca nem se apaga pelo app; menos de 600 mil rodadas é recusado.
- LGPD: só a plataforma (`admin_anonimizar_usuario`) anonimiza; apaga a chave (o que sobrar cifrado não abre), tira o
  conteúdo das histórias, zera ajustes, apaga progresso e estatísticas e revoga o que a pessoa publicou na comunidade;
  fica só a data do consentimento, como prova.
- Acervo público: qualquer pessoa lê e pesquisa o que está publicado; **ninguém grava direto** (só pelas funções);
  publicar exige conta ativa, a regra ligada para o plano, o limite do dia e a confirmação de que não há nome real;
  com a revisão ligada, só aparece depois da equipe; a autora não aprova a própria história; só a autora revoga, e o
  texto revogado sai do banco; 3 denúncias escondem até a equipe ver; quem denunciou não aparece para a autora;
  os aparelhos ficam sabendo do que saiu sem receber o texto.
- Regras: só dono ou admin da equipe muda (fica no registro da plataforma); visitante e app leem.

**Como foi testado (sem tocar no seu Supabase):** num PostgreSQL 16 descartável, com o ambiente de teste do RootifyONE
(`teste/sql/stub-supabase.sql`) e os SQLs reais da base na ordem do LEIA-ME deles. O arquivo do Contador rodou **duas
vezes** sem erro; **97 verificações** (`supabase/teste/teste-contador-de-historias.sql`) passaram; o teste da base (87
verificações) continua passando com o Contador junto; e rodou também junto com o `omnilife-one-v1.sql`, com a
anonimização chamando as funções dos dois apps. O porteiro para sem criar nada quando falta a base ou quando já existe
outra tabela `conta_*`.

**Para rodar (só depois da revisão e da sua autorização):** Supabase → projeto **solverone-app** → **SQL Editor** →
**New query** → colar o arquivo inteiro → **Run** → aparece uma tabela com **8 linhas** (`conta_chave` …
`conta_regras`), todas com `rls_ligado = true` e `regras` maior que zero. Nada no app muda até a etapa que usar.

## 5. Etapas

Cada etapa é uma versão, com PR e merge; o app funciona entre uma e outra.

| Etapa | Versão | O que entrega | O que você testa |
|---|---|---|---|
| **2a — Conta comum** ✅ | 1.18.0 | Sessão em `solverone.sessao.v1` (aproveitando a antiga, sem pedir login de novo); renovação sem derrubar o OmniLifeONE; Sair só neste aparelho; "Foi você?" para link de fora; uso e acessos (C4, C9); conta encerrada; "Encerrar minha conta". Riscos imediatos: R2 conforme a sua decisão e tirar o arquivo `.whl` perdido. **Sem SQL novo.** | 1) Entrar no Contador e abrir o OmniLifeONE no mesmo navegador: já entra. 2) RootifyONE → uso por app e registro de acessos mostram o Contador. 3) Sair no celular **não** desconecta o computador. 4) Recarregar não pede login. |
| **2b — Cópia protegida e "antes de apagar"** | 1.19.0 | "Exportar" vira **cópia protegida** (senha + código de recuperação, como no OmniLifeONE); restaurar **sem repetir história** (pelo id e pelo título + texto); a cópia aberta antiga continua sendo aceita; "Apagar tudo" oferece a cópia antes e diz o que acontece com as vozes; histórias saem do `localStorage` (5 MB) para o IndexedDB **sem perder nada** (copiar, conferir, só então apagar a antiga). **Sem SQL.** | Fazer a cópia, apagar tudo num aparelho de teste, restaurar: mesmas histórias, nenhuma repetida, vozes tocando, posição de leitura igual. |
| **2c — Minhas histórias na nuvem** | 1.20.0 | **Precisa do SQL rodado.** Primeiro uso guiado (4 telas: o que vai, quem vê, o papel com o código, consentimento do responsável); chave do acervo e código de recuperação; "Levar minhas histórias para a nuvem" com prévia e cópia oferecida antes; cópia no aparelho + fila + versão (junta campo a campo, só pergunta o que bateu); selo "⏳ aguardando" e "✓ Tudo sincronizado"; progresso, ajustes e estatísticas. | 1) Criar uma história no celular **sem internet** → aparece no computador depois. 2) Mesma história mudada nos dois → só pergunta o campo que bateu. 3) Computador novo **com** o papel do código → abre tudo; **sem** o papel → explica e não perde o aparelho. 4) Vozes guardadas continuam tocando. 5) No RootifyONE ninguém lê o texto. |
| **2d — Acervo no servidor e comunidade** | 1.21.0 | **Precisa do SQL rodado.** Acervo oficial no banco (a equipe traz o `historias.json` pelo RootifyONE) com cópia completa no aparelho e "só o que mudou"; aba **Comunidade** no Acervo: pesquisar, ler, ouvir, guardar para ler sem internet, denunciar; **"Publicar na comunidade"** numa história minha (conferência de nomes, trocar por nomes inventados, nome que aparece, confirmação), "Minhas publicadas" com a situação (em revisão, publicada, escondida) e **Revogar** (com o aviso das cópias); tudo conforme `conta_minhas_regras()`. No **RootifyONE** (repositório `rootify-one`): tela das regras do Contador (ligar, planos, limites) e **fila de revisão** (publicar, esconder, recusar). | 1) Sem internet, o acervo abre inteiro. 2) Publicar uma história com o nome da criança: o app avisa e troca. 3) Aprovar no RootifyONE: aparece para outra conta. 4) Revogar: some no outro aparelho na próxima vez que abrir. 5) Desligar a comunidade no RootifyONE: some do app. 6) Pôr "publicar" só para Premium: o botão fica em cinza para Membro. |
| **2e — Compartilhar com a família** (a combinar) | 1.22.0 | Depende do ponto 8.1. Escolher a família (a do OmniLifeONE aparece) ou criar uma simples; compartilhar história; membros só leem; criança só lê. | O pai compartilha; a mãe vê e ouve no celular dela; a criança vê; quem saiu da família deixa de ver as novas. |

## 6. Riscos e como evitar

| # | Risco | Como evitar |
|---|---|---|
| R1 | **Nomes que parecem de crianças reais no `historias.json` público** (3 histórias de uma série, duas meninas com nome e apelido) — e o histórico do repositório guarda as versões antigas | ✅ 1.18.0: trocados por nomes inventados no arquivo público (o id das histórias não mudou: quem já tinha continua com a versão dele). Falta decidir sobre o histórico do repositório (limpar exige reescrever o histórico; o GitHub também guarda cópias). Outros nomes do acervo (de outras séries) para você conferir: ver `PENDENCIAS.md`. |
| R2 | "Enviar acervo para o GitHub" publicava **todas** as histórias do aparelho, com nomes, e todos os aparelhos baixavam | ✅ 1.18.0: o botão saiu e o token guardado foi apagado dos aparelhos. A comunidade (2d) faz isso do jeito certo, uma história por vez, com conferência. |
| R3 | Dado de criança na nuvem | Texto, título, personagens, nomes e instruções **cifrados no aparelho**; consentimento do responsável registrado (art. 14 §1º); política de privacidade atualizada e validada com advogado antes de abrir para o público; anonimização pela plataforma. |
| R4 | Perder o código de recuperação | A cópia do aparelho continua; a cópia protegida (2b) continua; o app pede o papel antes de usar outro aparelho ("Pegue o papel com o código", como no OmniLifeONE 2.15.3). Sem código e sem aparelho antigo, a cópia da nuvem não abre — dito com todas as letras na tela. |
| R5 | **Áudio guardado perdido** ao levar para a nuvem ou restaurar | O id da história nunca muda (o banco não deixa); a chave do áudio (`id|índice|motor|voz|modelo|hash`) não é tocada; ao juntar duas cópias da mesma história, fica o id que tem voz guardada; nada apaga `ch_audio` sem oferecer o `.chvoz` antes. |
| R6 | **Duplicar** ao levar dados para a nuvem (dois aparelhos levando as mesmas histórias; restaurar cópia) | Mesmo id = mesmo registro; mesma impressão digital (título + texto) = o banco recusa a segunda; dois aparelhos não criam duas chaves (versão 1 só uma vez); no Contador não há "pessoas" para duplicar — a pessoa é a conta. O acervo público não sobe. |
| R7 | Sessão derrubada entre apps (renovação dupla) e "Sair" que desconecta tudo | Etapa 2a (ler antes de renovar, uma por vez, `scope=local`). |
| R8 | Link com a sessão de outra pessoa | Marcador `ch_conta_pedido` + "Foi você?" (2a). |
| R9 | Conflito entre aparelhos | Versão (trava otimista) + junta campo a campo; listas somam; estatísticas por aparelho; só pergunta quando o mesmo campo mudou nos dois. |
| R10 | Espaço do plano grátis (500 MB de banco para todos os apps) | Só texto cifrado (≈ 7 KB por história); áudio não sobe; limite de 400 KB por história; RootifyONE mostra o uso (`admin_armazenamento`). |
| R11 | O Contador trocar a chave pública que o OmniLifeONE usa (`sol_chave_publica` é uma por pessoa e é sobrescrita) | O Contador **não** publica chave pública nas etapas 2a a 2c (a chave do acervo é embrulhada pelo código, sem a base). Para a família (2d), combinar o ponto 8.1. |
| R12 | Chaves de IA no link "Levar a configuração" | Continuam só no aparelho e nunca vão para o banco; avaliar trocar o link pelo cofre comum (pendência). |
| R13 | **Nome real de criança publicado na comunidade** | Conferência no aparelho com a lista de nomes da família, troca por nomes inventados, confirmação obrigatória (o banco recusa sem), revisão da equipe antes de aparecer (ligada no começo), denúncia "tem nome real" e revogar. |
| R14 | **Conteúdo impróprio para crianças** na comunidade | Revisão antes de publicar, denúncias que escondem sozinhas, a equipe esconde ou recusa com motivo, registro no log; Termos de uso da comunidade (o que pode e o que não pode) antes de abrir. |
| R15 | Cópia depois de revogar | Não tem como impedir quem já leu de guardar (nenhum sistema evita). O app avisa isso antes de publicar e antes de revogar; os aparelhos tiram da cópia na próxima conferência. |
| R16 | Direitos sobre a história publicada | Termos da comunidade: a pessoa continua dona e dá licença para a SolverONE mostrar e para outros lerem e ouvirem no app; não vale publicar personagem protegido de terceiros para fins comerciais (muitas histórias usam personagens de filmes) — validar com advogado. |
| R17 | Espaço do acervo público no plano grátis | Texto ≈ 7 KB por história; limite por dia (`publicar.por_dia`); o aparelho baixa o acervo oficial inteiro, mas da comunidade só o que a pessoa abrir ou guardar. |

## 7. Regra zero — o que é novo para o Contador e precisa do seu "sim" antes de cada etapa

1. Conta no padrão comum (tudo da 2a).
2. Cópia protegida e "antes de apagar" (2b) e mudar as histórias para o IndexedDB.
3. Histórias, progresso, ajustes e estatísticas na nuvem, cifrados, com código de recuperação e consentimento (2c).
4. Família (2d), depois do ponto 8.1.
5. Decidido em 09/Out/2026 ("pode seguir com as recomendações"): R1 e R2 feitos na 1.18.0; cifrar as histórias inteiras.
6. Acervo no servidor e comunidade (2d), com as regras e a fila de revisão no RootifyONE. A decidir: revisão antes de
   publicar começa ligada (recomendado) e o texto dos Termos da comunidade.

## 7b. Complementos de 10/Out/2026 (diretriz de trabalho demorado e interruptores do RootifyONE)

**Trabalho demorado nas etapas da nuvem** (skill `trabalho-em-fundo-solverone`). O app já tem o `tarefas.js` (desde a
leitura de foto: tela acesa, pílula "não feche o app", dá para usar outras telas, "✅ Pronto · toque para ver"). Nas
etapas abaixo, tudo o que pode passar de 2 segundos vai por ele (`DGO.tarefa.iniciar`), nunca por uma barra própria da tela:

| Etapa | Trabalho demorado | Como fica |
|---|---|---|
| 2b | Fazer e restaurar a cópia protegida; mudar as histórias para o IndexedDB | Pílula com andamento; a mudança só apaga a cópia antiga depois de conferir tudo; se a página fechar no meio, ao abrir avisa "foi interrompido" e refaz do começo (nada se perde, porque a antiga ainda está lá). |
| 2c | "Levar minhas histórias para a nuvem" (embaralhar e enviar uma por uma) e "trazer tudo" num aparelho novo | Retomável: cada história é um item da fila de envio; fechar no meio só para o envio, e ao abrir continua de onde parou ("Continuar de onde parou?"). Sem internet, a pílula diz "esperando a internet". |
| 2d | Baixar o acervo inteiro na primeira vez; publicar (conferência de nomes) | Pílula com "Baixando o acervo… 12 de 36"; publicar é rápido, mas a conferência de nomes de uma história longa também vai pela pílula. |

A fila de voz (`FilaVoz`) já trabalha sozinha com tela acesa; continua como está.

**Interruptores do RootifyONE** (o OmniLifeONE 2.16 passou a obedecer ao "Controle dos apps": `recursos.js`, arquivos
`recursos/global.json` e `recursos/<app>.json` no `solverone-dados`, e `recursos-do-app.json` na raiz do app). Para não ter
dois lugares mandando na mesma coisa:

- **O que é só mostrar ou esconder na tela** (AssistONE, anúncios, a aba Comunidade, o botão Publicar, a seção Nuvem) obedece
  aos interruptores do RootifyONE, como no OmniLifeONE.
- **O que o banco precisa garantir** (publicar só para os planos certos, limite por dia, revisão antes de aparecer,
  esconder por denúncias) fica em `conta_regras`, porque o arquivo de interruptores é público e não protege nada.
- Para combinar com o chat do RootifyONE: a tela de "Controle dos apps" do Contador grava as duas coisas (o interruptor e,
  quando for de banco, a `conta_regras` por `admin_conta_salvar_regra`), para o dono mexer num lugar só.
- Ligar os interruptores no Contador é uma mudança no app (regra zero): entra junto com a etapa 2d, ou antes, se você pedir.

## 8. Para combinar com o chat do RootifyONE (contrato)

1. **Chave pessoal comum entre os apps.** `sol_chave_publica` guarda **uma** chave por pessoa e
   `sol_publicar_minha_chave` sobrescreve. A parte privada fica em `omni_chave_privada`, que o Contador não pode ler
   (C3). Para o Contador usar família (2d) sem estragar o OmniLifeONE, a base precisa de uma `sol_chave_privada`
   (cópia cifrada da chave privada, só a própria pessoa lê) usada por todos os apps — o próprio plano do OmniLifeONE já
   sugere isso (item 9.4).
2. **Áudio na nuvem** (Storage `sol-arquivos`): fora deste plano; se um dia entrar, só cifrado e com cota por plano.
3. **Interruptores × `conta_regras`** (item 7b): a tela "Controle dos apps" grava as duas, para o dono mexer num lugar só.
4. Nada mais: `sol_apps` já tem o Contador (`conta`), e o registro de acessos já aceita `app`.
