# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# SolverONE — regras do projeto para o Claude Code

Antes de qualquer alteração neste repositório, leia e siga **inteira** a diretriz geral da plataforma em
`.claude/skills/diretrizes-gerais-apps/SKILL.md` (ela também é carregada como skill `diretrizes-gerais-apps`).

Resumo do que nunca pode ser esquecido (o detalhe está na diretriz):

- **Regra zero**: antes de implementar no app um requisito da diretriz que ainda não existe aqui, liste o que
  falta e confirme com o dono. Não crie repositórios sem permissão explícita.
  **Publicar é sempre autorizado** (dono, 02/Nov/2026): ao terminar e testar, faça o pull request e o merge sem
  perguntar e conte o que mudou.
- **Segurança**: nenhuma senha, chave de API, token ou segredo entra no código, no repositório, no chat ou em
  arquivo. Chaves de IA ficam só no cofre do navegador da pessoa. Se uma chave aparecer no chat, peça para revogar.
- **Idioma** (dono, 14/Nov/2026): textos para o usuário em **PT (Brasil), EN (EUA) e ES (Espanha)**, tradução
  humanizada; **um seletor só em todo lugar**, bandeira + sigla (🇧🇷 PT · 🇺🇸 EN · 🇪🇸 ES), componente do módulo comum,
  nunca toggle ou dropdown próprio; ES só aparece num app quando ele está 100 % traduzido (até lá, PT|EN). Detalhe na
  diretriz, "Idioma e datas". Instruções para o dono em português, passo a passo, como para iniciante (ele não é
  desenvolvedor).
- **Entrega**: um `.zip` por app, nome `<NOME APP> <VERSAO> <dd-Mmm-aaaa> <HHhMMm>.zip`, arquivos soltos na
  raiz; atualizar `versoes.json`, a versão no código, o `sw.js` e `ARQUITETURA.md`/`PENDENCIAS.md`.
- **Trabalho demorado** (foto, OCR, IA, importação, áudio) roda no módulo `Fundo`: nunca morre ao sair da tela,
  Wake Lock, aviso antes de fechar, pílula de andamento, resultado entregue onde a pessoa estiver.
- **Feedback dos usuários**: pergunta do dia, 💬 em toda tela e no AssistONE, tudo estruturado no RootifyONE.

## Aviso do dono (13/Nov/2026): Definition of done com 12 pontos — vale até sair a diretriz nova

A Definition of done da plataforma passa a ter 12 pontos: manual e orientações, AssistONE, Novidades da versão, termos,
comunicações e e-mails, RootifyONE, ArchONE, EaglePlanONE (roadmap), retrocompatibilidade, segurança e LGPD, qualidade
verificável e registro. Vai nascer também uma teia de integrações entre os apps, o RootifyONE, o ArchONE e o EaglePlanONE
(eventos e comandos com aprovação). Quando a diretriz nova sair, siga-a.

- **Aplicabilidade:** cada ponto vale quando for aplicável ao estágio atual deste app (com ou sem banco, só no GitHub, site
  aberto sem login). NÃO crie login, não migre para banco e não crie integração por causa deste aviso. O que não se aplica
  hoje: diga "não aplicável hoje" e o motivo em uma linha. Quando o app ganhar login, banco ou integração nova, já nasce
  cumprindo os pontos que passaram a valer.
- **Em cada entrega**, o resumo diz o que o RootifyONE, o ArchONE ou o EaglePlanONE precisariam saber (integração nova ou
  removida, recurso novo, item do roadmap concluído).
- **Nada de integração nova sem a regra zero.**

## AssistONE: quem cuida (decisão do dono, 26/Nov/2026)

- O **AssistONE** (personagem, balão, tour, busca, passo a passo e "Perguntar ao assistente") é desenvolvido, melhorado e
  controlado pela **conta nova do Claude (marceloneco@gmail.com), conversa ASSISTONE**. Registrado na `01-PONTE-GERAL`
  (Drive "0-Orchestration": índice, "Quem escreve onde" e "Pedidos e conflitos").
- O **master** mora no repositório privado **`MarceloNeco/assist-one`**: `balao/assistone.js` (o balão), `balao/visual/` (o
  visual novo: personagem, menu, conversa, cores, fontes), `servidor/` (cópia sem segredos do leitor da fila e do Hermes da
  VPS) e os testes. O **visual novo**, aprovado no Claude Design em 26/Nov/2026, é o padrão para todos os apps; a
  especificação está em `assist-one/docs/desenho-pacote/ESPECIFICACAO.md`.
- São da conversa ASSISTONE, além do master: as cópias nos apps (`assistone.js` e a pasta `assistone/`, sempre idênticas ao
  master; **nunca editar a cópia**); no MoneyTRIO, o objeto `AssistOne` do `index.html` e `modulos/assist-hermes.js`; no
  `solverone-app`, a fila e as funções `assist_*` e `admin_assist_*` (SQL 2026-11-26b a 26g) e o medidor de uso de IA
  (`ia_consumo` / `admin_ia_uso`); no RootifyONE, a tela Atendimento → AssistONE (`rootify-assistone-adm.js`); na VPS, o
  leitor da fila e o Hermes (com a conversa HOSTINGER).
- **Qualquer sessão desta conta que precise mexer num desses itens pede antes na Ponte**, em "Pedidos e conflitos", para a
  ASSISTONE, e **não mexe sozinha**.
- Continua igual: os interruptores e as regras por app, plano, conta e família ficam no **RootifyONE**, e o AssistONE obedece a
  eles; a **diretriz master** continua com a conversa de diretrizes (conta antiga).
- **Toda IA da plataforma mede tokens e custo no porteiro `solverone-ia`** (decisão D-A17, 26/Nov/2026); nenhum app fala
  direto com provedor de IA.
