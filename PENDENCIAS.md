# UM Contador de Histórias — pendências (lista oficial e viva)

Criada a pedido do dono do projeto em 09/Out/2026, no mesmo formato do OmniLifeONE: esta é **a** lista de pendências do
app. A cada entrega, a situação de cada item é atualizada aqui e o resumo da entrega diz o que fechou. Item novo entra no
fim, com o próximo número (números não mudam nem são reaproveitados).

**Situações:** 🟡 aberta · 🔵 em andamento · ⏸ aguardando decisão do dono · ✅ feita (com a versão)

**Prioridade atual (09/Out/2026):** levar o Contador para a conta e o banco SolverONE com cuidado redobrado com os dados
das crianças. Plano: `PLANO-SUPABASE-contador-de-historias.md`.

| # | Pendência | Origem | Situação |
|---|---|---|---|
| 1 | Plano da ida para a conta e o banco SolverONE (o que fica onde, tabelas `conta_*`, etapas, riscos) | Pedido do dono, 09/Out/2026 | ⏸ entregue em 09/Out/2026 (`PLANO-SUPABASE-contador-de-historias.md`) — aguardando o dono aprovar as etapas |
| 2 | Revisar e rodar `supabase/contador-de-historias-v1.sql` no Supabase | idem | ⏸ rascunho testado num Postgres local (56 verificações) — aguardando a revisão do Claude do manual e a autorização do dono |
| 3 | `historias.json` (público) tem, em 3 histórias de uma série, nomes e apelidos que parecem de crianças reais — e o histórico do repositório guarda as versões antigas | Levantamento do plano, 09/Out/2026 (risco R1) | ⏸ o dono confirma se são reais; se forem, trocar por nomes fictícios e decidir sobre o histórico |
| 4 | Botão "☁️ Enviar acervo para o GitHub" grava **todas** as histórias do aparelho (com nomes) num arquivo público, e todos os aparelhos baixam | idem (risco R2) | ⏸ recomendação: tirar o botão (a nuvem da Etapa 2c substitui); alternativa: só histórias marcadas como públicas |
| 5 | "Sair" da conta SolverONE desconecta a conta em **todos** os aparelhos (logout sem `scope=local`) | idem | 🟡 aberta — Etapa 2a |
| 6 | Sessão em chave própria (`ch_solverone_sessao`) e renovação sem reler: pode derrubar a sessão do OmniLifeONE; passar para `solverone.sessao.v1` | idem | 🟡 aberta — Etapa 2a |
| 7 | Link de volta com `#access_token` aceito sem saber se este aparelho pediu ("Foi você?") | idem | 🟡 aberta — Etapa 2a |
| 8 | Registrar uso e acesso do app (`sol_registrar_uso`, `solverone-admin` → `registrar-acesso` com `app`) | idem | 🟡 aberta — Etapa 2a |
| 9 | Conta encerrada (`minha_conta_encerrada`) e "Encerrar minha conta / pedir exclusão dos meus dados" | idem | 🟡 aberta — Etapa 2a |
| 10 | Arquivo `pglast-…whl` esquecido na raiz do repositório (entrou junto num commit meu da v1.16) | idem | 🟡 aberta — sai na Etapa 2a |
| 11 | "⬇️ Exportar" baixa as histórias **abertas** (com nomes) na pasta Downloads; trocar por cópia protegida (senha + código) que restaura sem repetir história | idem | 🟡 aberta — Etapa 2b |
| 12 | "Apagar tudo" apaga histórias e ajustes sem oferecer a cópia antes, e deixa as vozes guardadas para trás | idem | 🟡 aberta — Etapa 2b |
| 13 | Histórias no `localStorage` (limite de uns 5 MB); passar para o IndexedDB sem perder nada | idem | 🟡 aberta — Etapa 2b |
| 14 | Minhas histórias, onde parei, ajustes e estatísticas na nuvem, cifrados no aparelho, com código de recuperação e consentimento do responsável | idem | 🟡 aberta — Etapa 2c (depende do #2) |
| 15 | Cifrar as histórias inteiras (recomendado) ou só trocar os nomes por códigos antes de subir | idem | ⏸ decisão do dono |
| 16 | Compartilhar histórias com a família (pai e mãe) | idem | ⏸ Etapa 2d — depende da chave pessoal comum na base (`sol_chave_privada`, combinar com o chat do RootifyONE) |
| 17 | Vozes guardadas na nuvem (Storage) | idem | 🟡 aberta — fora deste plano (peso e cota do plano grátis); hoje o arquivo `.chvoz` leva para outro aparelho |
| 18 | Política de privacidade do Contador: dados de crianças, provedores de voz e de IA, consentimento do responsável (LGPD art. 14), validada com advogado | idem | ⏸ texto legal antes de abrir a nuvem para o público |
| 19 | Link "Levar a configuração" leva as chaves de IA no endereço (`#cfg=`); avaliar trocar pelo cofre comum de chaves (`DGO.ia`) | idem | 🟡 aberta (observação) |

## Histórico das entregas

- **Plano da nuvem (09/Out/2026, app na v1.17.0, sem mudança no app):** criados o plano, o rascunho do SQL `conta_*` com
  o teste local, a cópia do contrato (`PLATAFORMA-DADOS.md`) e esta lista (#1 a #19).
