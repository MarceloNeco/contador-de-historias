# UM Contador de Histórias — pendências (lista oficial e viva)

Criada a pedido do dono do projeto em 09/Out/2026, no mesmo formato do OmniLifeONE: esta é **a** lista de pendências do
app. A cada entrega, a situação de cada item é atualizada aqui e o resumo da entrega diz o que fechou. Item novo entra no
fim, com o próximo número (números não mudam nem são reaproveitados).

**Situações:** 🟡 aberta · 🔵 em andamento · ⏸ aguardando decisão do dono · ✅ feita (com a versão)

**Prioridade atual (09/Out/2026):** levar o Contador para a conta e o banco SolverONE com cuidado redobrado com os dados
das crianças. Plano: `PLANO-SUPABASE-contador-de-historias.md`.

| # | Pendência | Origem | Situação |
|---|---|---|---|
| 1 | Plano da ida para a conta e o banco SolverONE (o que fica onde, tabelas `conta_*`, etapas, riscos) | Pedido do dono, 09/Out/2026 | ✅ aprovado em 09/Out/2026 ("pode seguir com as recomendações"); versão 2 do plano com a visão do dono (acervo no servidor, comunidade, regras no RootifyONE) |
| 2 | Revisar e rodar `supabase/contador-de-historias-v1.sql` no Supabase | idem | ⏸ rascunho com 8 tabelas (inclui acervo público, comunidade e regras), testado num Postgres local (97 verificações) — aguardando a revisão do Claude do manual e a autorização do dono |
| 3 | `historias.json` (público) tem, em 3 histórias de uma série, nomes e apelidos que parecem de crianças reais — e o histórico do repositório guarda as versões antigas | Levantamento do plano, 09/Out/2026 (risco R1) | 🔵 1.18.0: trocados por nomes inventados no arquivo (mesmo id: quem já tinha a história continua com a dele). ⏸ falta o dono decidir sobre o histórico do repositório |
| 4 | Botão "☁️ Enviar acervo para o GitHub" grava **todas** as histórias do aparelho (com nomes) num arquivo público, e todos os aparelhos baixam | idem (risco R2) | ✅ 1.18.0 — o botão saiu e o token do GitHub guardado foi apagado dos aparelhos; a comunidade (Etapa 2d) publica uma história por vez, com conferência |
| 5 | "Sair" da conta SolverONE desconecta a conta em **todos** os aparelhos (logout sem `scope=local`) | idem | ✅ 1.18.0 |
| 6 | Sessão em chave própria (`ch_solverone_sessao`) e renovação sem reler: pode derrubar a sessão do OmniLifeONE; passar para `solverone.sessao.v1` | idem | ✅ 1.18.0 |
| 7 | Link de volta com `#access_token` aceito sem saber se este aparelho pediu ("Foi você?") | idem | ✅ 1.18.0 |
| 8 | Registrar uso e acesso do app (`sol_registrar_uso`, `solverone-admin` → `registrar-acesso` com `app`) | idem | ✅ 1.18.0 |
| 9 | Conta encerrada (`minha_conta_encerrada`) e "Encerrar minha conta / pedir exclusão dos meus dados" | idem | ✅ 1.18.0 |
| 10 | Arquivo `pglast-…whl` esquecido na raiz do repositório (entrou junto num commit meu da v1.16) | idem | ✅ 1.18.0 |
| 11 | "⬇️ Exportar" baixa as histórias **abertas** (com nomes) na pasta Downloads; trocar por cópia protegida (senha + código) que restaura sem repetir história | idem | ✅ 1.19.0 |
| 12 | "Apagar tudo" apaga histórias e ajustes sem oferecer a cópia antes, e deixa as vozes guardadas para trás | idem | ✅ 1.19.0 |
| 13 | Histórias no `localStorage` (limite de uns 5 MB); passar para o IndexedDB sem perder nada | idem | ✅ 1.19.0 |
| 14 | Minhas histórias, onde parei, ajustes e estatísticas na nuvem, cifrados no aparelho, com código de recuperação e consentimento do responsável | idem | 🔵 1.20.0: pronto no app e testado num banco local; aparece "em preparação" até o SQL rodar (#2) — fecha quando o dono testar com o banco de verdade |
| 15 | Cifrar as histórias inteiras (recomendado) ou só trocar os nomes por códigos antes de subir | idem | ✅ decidido em 09/Out/2026: cifrar inteiras (vale na Etapa 2c) |
| 16 | Compartilhar histórias com a família (pai e mãe) | idem | ⏸ Etapa 2e — depende da chave pessoal comum na base (`sol_chave_privada`, combinar com o chat do RootifyONE) |
| 17 | Vozes guardadas na nuvem (Storage) | idem | 🟡 aberta — fora deste plano (peso e cota do plano grátis); hoje o arquivo `.chvoz` leva para outro aparelho |
| 18 | Política de privacidade do Contador: dados de crianças, provedores de voz e de IA, consentimento do responsável (LGPD art. 14), validada com advogado | idem | ⏸ texto legal antes de abrir a nuvem para o público |
| 19 | Link "Levar a configuração" leva as chaves de IA no endereço (`#cfg=`); avaliar trocar pelo cofre comum de chaves (`DGO.ia`) | idem | 🟡 aberta (observação) |
| 20 | Acervo do app no servidor com cópia completa no aparelho (sem internet) e **comunidade de histórias**: publicar, pesquisar, revogar, denunciar | Visão do dono, 09/Out/2026 | 🟡 aberta — Etapa 2d (tabelas já no rascunho do SQL, #2) |
| 21 | RootifyONE: ligar/desligar a comunidade e escolher os planos de criar e publicar (no começo, liberado para todos) + fila de revisão da comunidade | idem | 🟡 aberta — Etapa 2d, no repositório `rootify-one` (funções `admin_conta_*` já no rascunho) |
| 22 | Revisão da equipe antes de a história aparecer na comunidade: começa ligada? | idem (app para crianças) | ⏸ recomendação: ligada no começo (`revisao_previa`); dá para desligar no RootifyONE |
| 23 | Termos de uso da comunidade (o que pode publicar, direitos sobre a história, personagens de filmes, denúncias) | idem | ⏸ texto legal antes de abrir a comunidade |
| 24 | Outros nomes do acervo público para o dono conferir se são de gente de verdade (ex.: personagens de outras séries com nome e sobrenome ou "seu"/"vovó") | Revisão da 1.18.0 | ⏸ o dono confere a lista de personagens; o que for real vira nome inventado |
| 25 | Trabalho demorado das etapas da nuvem (cópia protegida, levar e trazer histórias, baixar o acervo) pelo `tarefas.js`: tela acesa, pílula, aviso ao fechar, continuar de onde parou | Diretriz de trabalho demorado, 10/Out/2026 | 🔵 em andamento — 2b na 1.19.0 (cópia pela pílula); 2c na 1.20.0 (ligar e trazer da conta pela pílula); falta a 2d |
| 26 | Obedecer aos interruptores do RootifyONE ("Controle dos apps", como o OmniLifeONE 2.16) e combinar com `conta_regras` para o dono mexer num lugar só | OmniLifeONE 2.16, 10/Out/2026 | 🟡 aberta — junto com a etapa 2d (ou antes, se o dono pedir); combinar com o chat do RootifyONE |
| 27 | Perdeu o código de recuperação: hoje um aparelho que ainda está ligado continua funcionando, mas não dá para gerar um código novo nem recomeçar a nuvem da conta | Etapa 2c, 10/Out/2026 | 🟡 aberta — precisa de uma versão nova da chave (`conta_chave` versão 2) e de decidir o que acontece com as histórias cifradas com a antiga |
| 28 | Testar a nuvem com o banco de verdade, depois de o SQL rodar: dois aparelhos, sem internet, o código num aparelho novo, a escolha quando muda nos dois | Etapa 2c, 10/Out/2026 | ⏸ depende do #2 |

## Histórico das entregas

- **Plano da nuvem (09/Out/2026, app na v1.17.0, sem mudança no app):** criados o plano, o rascunho do SQL `conta_*` com
  o teste local, a cópia do contrato (`PLATAFORMA-DADOS.md`) e esta lista (#1 a #19).
- **1.18.0 (09/Out/2026) — Etapa 2a, conta comum:** fecharam #1, #4, #5, #6, #7, #8, #9, #10 e #15; #3 avançou (nomes trocados;
  falta o histórico). Plano v2 com a visão do dono e SQL com acervo público, comunidade e regras (#2 continua aguardando
  revisão); novos #20 a #24.
- **Plano, complemento (10/Out/2026, sem mudança no app):** item 7b do plano (trabalho demorado e interruptores do
  RootifyONE); novos #25 e #26.
- **1.19.0 (10/Out/2026) — Etapa 2b:** fecharam #11 (cópia protegida que restaura sem repetir), #12 (apagar tudo oferece a
  cópia antes e pergunta pelas vozes) e #13 (histórias no IndexedDB); #25 avançou.
- **1.20.0 (10/Out/2026) — Etapa 2c:** minhas histórias na conta pronta no app (cifrada, código de recuperação,
  consentimento do responsável, sem internet, juntar e escolher), em "em preparação" até o SQL rodar; #14 e #25 avançaram;
  novos #27 e #28.
