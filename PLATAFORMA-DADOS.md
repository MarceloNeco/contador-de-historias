# Contrato de dados da plataforma SolverONE — v1

Cópia fiel do contrato combinado em 03/Out/2026 (mesmo texto nos chats do RootifyONE e do
OmniLifeONE; copiado do repositório `omnilife-one` em 09/Out/2026). **Não edite este texto aqui:**
mudanças no contrato nascem numa versão nova (v2), combinada nos chats, e só depois são copiadas para cá.

- Como o UM Contador de Histórias aplica o contrato: `PLANO-SUPABASE-contador-de-historias.md`.
- SQL das tabelas `conta_*`: `supabase/contador-de-historias-v1.sql` (rascunho; roda depois da base comum do RootifyONE).

```text
CONTRATO DE DADOS DA PLATAFORMA SolverONE — v1 (03/Out/2026)
(texto idêntico nos chats do RootifyONE e do OmniLifeONE; os dois constroem em cima dele.
Guarde uma cópia como PLATAFORMA-DADOS.md no repositório.)

Decisão: todos os apps da SolverONE usam o MESMO projeto Supabase (solverone-app,
região São Paulo) e a MESMA conta SolverONE. O primeiro app a migrar é o OmniLifeONE.
Os apps vão se integrar entre si pelo banco (não mais pelo localStorage).

C1. Conta: auth.users + public.assinaturas (já existem). Contas NUNCA são apagadas
    (trigger lab_nunca_excluir_usuario); sair = encerrar; LGPD = anonimizar
    (admin_anonimizar_usuario / minha_solicitacao_exclusao, já existem, com travas).
C2. Grupos compartilhados (família/casa), genéricos para qualquer app:
    sol_grupos (id, tipo 'familia', nome, criado_por, criado_em, encerrado_em)
    sol_grupo_membros (grupo_id, user_id — NULL para criança sem conta própria —,
      perfil_id, apelido, papel 'chefe'|'responsavel'|'membro'|'crianca',
      status 'ativo'|'saiu', convidado_por, entrou_em, saiu_em)
    sol_grupo_convites (código, grupo_id, papel, expira_em, usos, max_usos, ativo)
    + funções de apoio para RLS: sol_sou_membro(grupo), sol_meu_papel(grupo),
      sol_sou_responsavel(grupo). Membros nunca são apagados: saem (status/saiu_em).
C3. Tabelas de cada app com prefixo do app: omni_*, money_*, rise_*, conta_* …
    Toda linha tem grupo_id e/ou user_id, criado_por, criado_em, atualizado_em e,
    quando couber, vis ('publico'|'restrito'). RLS em todas: só membros do grupo;
    'restrito' só responsáveis/chefes; um app nunca lê tabela de outro app direto.
C4. Uso por app: sol_app_uso (user_id, app, primeiro_uso, ultimo_uso), atualizado
    a cada entrada no app (função sol_registrar_uso(p_app)).
C5. Integração entre apps: sol_ponte (id, de_app, para_app, tipo, grupo_id, user_id,
    dados jsonb, criado_em, lido_em) — substitui a chave "ecossistema.ponte.v1" do
    localStorage. Só quem é dono/membro lê; o app destino marca lido_em, nunca apaga.
    Cada pessoa liga/desliga a integração entre dois apps nas Configurações.
C6. Arquivos (fotos, documentos, exames): Storage, bucket PRIVADO "sol-arquivos",
    caminho <app>/<grupo_id>/<arquivo>; políticas por membro do grupo; imagens
    reduzidas no aparelho antes de subir (plano grátis tem 1 GB no total).
C7. Dados sensíveis (cofre, documentos, saúde): cifrados NO APARELHO antes de subir
    (colunas *_cifrado). O servidor e a equipe não conseguem ler. Chave da família
    embrulhada por membro, para compartilhar sem expor.
C8. LGPD por app: tabela sol_apps (codigo, nome, funcao_anonimizar). Cada app entrega
    <app>_anonimizar(uid) e se registra; admin_anonimizar_usuario passa a chamar
    todas as registradas. Menores: dados de criança só via responsável (LGPD art. 14).
C9. Registro de acessos: registro_acessos ganha a coluna app; a Edge Function
    solverone-admin (ação registrar-acesso) aceita o campo app.
C10. Regras de entrega: SQL idempotente, SEM DELETE de contas, SECURITY DEFINER +
    SET search_path = '' + nomes qualificados (LEAST/GREATEST sem prefixo pg_catalog),
    GRANTs explícitos (inclusive service_role quando a Edge Function grava), conferência
    no fim de cada arquivo. NENHUM SQL roda antes da revisão do Claude (no chat do
    Cowork); eu levo o arquivo para revisão e rodo depois. Nenhuma chave no código.
```
