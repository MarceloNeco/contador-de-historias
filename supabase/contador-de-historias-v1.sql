-- =====================================================================================
-- UM Contador de Histórias — tabelas conta_* sobre a base comum da plataforma SolverONE
-- Contrato de dados v1 (03/Out/2026) — ver PLATAFORMA-DADOS.md e PLANO-SUPABASE-contador-de-historias.md
-- Projeto Supabase: solverone-app (São Paulo) · app em sol_apps: codigo 'contador-de-historias', prefixo 'conta'
--
-- !!! RASCUNHO — NÃO RODAR ANTES DA REVISÃO (regra C10) E DA AUTORIZAÇÃO DO DONO.
--     Depois de revisado e autorizado: rodar UMA vez no SQL Editor. É idempotente: rodar de novo
--     não estraga nada nem duplica. Não apaga conta nenhuma.
--
-- Depende da BASE COMUM (RootifyONE: entrega/solverone-app/supabase/2026-10-03-plataforma-dados-v1.sql, já aplicada
-- em 03/Out/2026): sol_apps (com a linha do Contador), sol_grupos, sol_grupo_membros, sol_sou_membro, sol_meu_papel,
-- assinaturas (status 'encerrada') e auth.uid(). Se faltar algo, o arquivo para no começo e NADA é criado.
--
-- O que este arquivo cria (5 tabelas):
--   conta_historias     histórias da pessoa (criadas pela IA, digitadas ou importadas). O conteúdo vai SEMPRE
--                       cifrado no aparelho (dados_cifrado): o texto tem nomes de crianças (LGPD art. 14, C7).
--                       Opcional: grupo_id = compartilhar com uma família da SolverONE (só leitura para os outros).
--   conta_progresso     onde a pessoa parou em cada história, favorita, lida, quantas leituras (sem nomes).
--   conta_preferencias  ajustes que valem em qualquer aparelho (dados, só valores simples e sem nomes) e os
--                       nomes das crianças / nomes protegidos / instruções da voz (dados_cifrado).
--   conta_estatisticas  leituras e minutos por aparelho (cada aparelho só soma o seu: sem conflito).
--   conta_chave         a "chave do acervo" da pessoa, embrulhada no aparelho pelo código de recuperação
--                       (PBKDF2-SHA256, 600 mil rodadas no mínimo). Só se acrescenta; nunca se troca uma versão.
--
-- O que NÃO vem para o banco (fica só no aparelho): chaves de IA e o token do GitHub, áudio guardado (IndexedDB
-- ch_audio), fila de voz, voz do aparelho escolhida, avisos, anúncios, AssistONE e sessões. Ver o plano, item 3.
--
-- Regras de escrita deste arquivo (C10): SECURITY DEFINER + SET search_path = '' + nomes qualificados;
-- GRANTs explícitos (inclusive service_role); nada de DELETE de contas; conferência no fim.
-- =====================================================================================

begin;
set local client_min_messages = warning;

-- -------------------------------------------------------------------------------------
-- 0) A base comum existe? (senão para tudo, sem criar nada)
-- -------------------------------------------------------------------------------------
do $$
declare v_falta text := ''; v_estranhas text;
begin
  if to_regclass('public.sol_apps') is null then v_falta := v_falta || ' sol_apps'; end if;
  if to_regclass('public.sol_grupos') is null then v_falta := v_falta || ' sol_grupos'; end if;
  if to_regclass('public.sol_grupo_membros') is null then v_falta := v_falta || ' sol_grupo_membros'; end if;
  if to_regclass('public.assinaturas') is null then v_falta := v_falta || ' assinaturas'; end if;
  if to_regprocedure('public.sol_sou_membro(uuid)') is null then v_falta := v_falta || ' sol_sou_membro(uuid)'; end if;
  if to_regprocedure('public.sol_meu_papel(uuid)') is null then v_falta := v_falta || ' sol_meu_papel(uuid)'; end if;
  if to_regprocedure('auth.uid()') is null then v_falta := v_falta || ' auth.uid()'; end if;
  if v_falta = '' then   -- separado: sem a tabela, a consulta nem compila
    if not exists (select 1 from public.sol_apps a where a.codigo = 'contador-de-historias' and a.prefixo = 'conta') then
      v_falta := v_falta || ' (sol_apps sem a linha contador-de-historias com prefixo conta)';
    end if;
  end if;
  -- o prefixo conta_ é do Contador: se já existir outra tabela conta_* que não é deste arquivo, para (evita mexer no que não é nosso)
  select string_agg(c.relname, ', ') into v_estranhas
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p') and c.relname like 'conta\_%'
     and c.relname not in ('conta_historias', 'conta_progresso', 'conta_preferencias', 'conta_estatisticas', 'conta_chave');
  if v_estranhas is not null then
    v_falta := v_falta || ' (já existem tabelas conta_* que não são deste arquivo: ' || v_estranhas || ')';
  end if;
  if v_falta <> '' then
    raise exception 'UM Contador de Histórias: falta a base comum da plataforma ou há conflito:%. Nada foi criado.', v_falta;
  end if;
end $$;

-- -------------------------------------------------------------------------------------
-- 1) Funções de apoio para as regras
-- -------------------------------------------------------------------------------------
-- conta logada e não encerrada (conta encerrada lê o que é dela, mas não grava mais nada)
create or replace function public.conta__ativa() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
     and not exists (select 1 from public.assinaturas a where a.user_id = (select auth.uid()) and a.status = 'encerrada');
$$;

-- posso pôr uma história minha neste grupo? (membro ativo, menos criança)
create or replace function public.conta__posso_compartilhar(p_grupo uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_grupo is null or coalesce(public.sol_meu_papel(p_grupo) in ('chefe', 'responsavel', 'membro'), false);
$$;

-- -------------------------------------------------------------------------------------
-- 2) Tabelas
-- -------------------------------------------------------------------------------------

-- 2.1 Chave do acervo (AES-GCM 256), embrulhada no aparelho com o código de recuperação da pessoa.
--     O servidor guarda só o pacote fechado: sem o código, ninguém abre (nem a equipe SolverONE).
create table if not exists public.conta_chave (
  user_id           uuid not null references auth.users(id) default auth.uid(),
  versao            integer not null check (versao between 1 and 1000),
  algoritmo         text not null default 'AES-GCM-256/PBKDF2-SHA256' check (length(algoritmo) <= 60),
  iteracoes         integer not null check (iteracoes between 600000 and 10000000),
  sal               text not null check (length(sal) between 16 and 200),
  chave_embrulhada  text not null check (length(chave_embrulhada) between 16 and 4000),
  criado_em         timestamptz not null default now(),
  primary key (user_id, versao)
);

-- 2.2 Histórias da pessoa. Só o dono grava; quem é do grupo (se houver) só lê.
--     O acervo público (historias.json do site) NÃO entra aqui: ele já está no site para todos.
create table if not exists public.conta_historias (
  user_id         uuid not null references auth.users(id) default auth.uid(),
  id              text not null check (id ~ '^[A-Za-z0-9_.:@-]{1,80}$'),      -- o MESMO id do aparelho (o áudio guardado usa este id)
  grupo_id        uuid references public.sol_grupos(id),                       -- null = só minha
  chave_versao    integer not null default 1 check (chave_versao >= 1),
  dados_cifrado   text check (dados_cifrado is null or length(dados_cifrado) <= 400000),
  -- impressão digital da história (HMAC-SHA256 do título + texto com a chave do acervo, feita no aparelho):
  -- deixa o banco recusar a MESMA história duas vezes sem conseguir ler o texto
  marca           text check (marca is null or marca ~ '^[0-9a-f]{64}$'),
  versao          bigint not null default 1,
  criado_por      uuid references auth.users(id),
  criado_em       timestamptz not null default now(),
  atualizado_por  uuid references auth.users(id),
  atualizado_em   timestamptz not null default now(),
  apagado_em      timestamptz,
  primary key (user_id, id),
  constraint conta_historias_tem_conteudo check (apagado_em is not null or dados_cifrado is not null)
);
create unique index if not exists conta_historias_sem_repetir on public.conta_historias (user_id, marca)
  where apagado_em is null and marca is not null;
create index if not exists conta_historias_sync on public.conta_historias (user_id, atualizado_em);
create index if not exists conta_historias_grupo_sync on public.conta_historias (grupo_id, atualizado_em) where grupo_id is not null;

-- 2.3 Onde parei, favorita, lida, leituras — por pessoa e por história (vale também para as do acervo público).
create table if not exists public.conta_progresso (
  user_id       uuid not null references auth.users(id) default auth.uid(),
  historia_id   text not null check (historia_id ~ '^[A-Za-z0-9_.:@-]{1,80}$'),
  favorita      boolean not null default false,
  lida          boolean not null default false,
  pos_frase     integer not null default 0 check (pos_frase between 0 and 100000),
  frases_total  integer not null default 0 check (frases_total between 0 and 100000),
  leituras      integer not null default 0 check (leituras between 0 and 1000000),
  ouvida_em     timestamptz,
  versao        bigint not null default 1,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, historia_id)
);
create index if not exists conta_progresso_sync on public.conta_progresso (user_id, atualizado_em);

-- 2.4 Ajustes da pessoa. "dados" só aceita valores simples e nenhum campo de chave, senha, token ou nome
--     (isso vai cifrado em dados_cifrado ou fica no aparelho) — o banco confere no gatilho.
create table if not exists public.conta_preferencias (
  user_id               uuid primary key references auth.users(id) default auth.uid(),
  dados                 jsonb not null default '{}'::jsonb check (jsonb_typeof(dados) = 'object' and pg_column_size(dados) <= 20000),
  dados_cifrado         text check (dados_cifrado is null or length(dados_cifrado) <= 100000),
  chave_versao          integer check (chave_versao is null or chave_versao >= 1),
  -- consentimento do responsável para guardar histórias com nomes de crianças (LGPD art. 14 §1º)
  consentimento_em      timestamptz,
  consentimento_versao  text check (consentimento_versao is null or length(consentimento_versao) <= 40),
  versao                bigint not null default 1,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

-- 2.5 Estatísticas (leituras, minutos ouvidos, noites seguidas) — uma linha por aparelho; o app soma.
create table if not exists public.conta_estatisticas (
  user_id        uuid not null references auth.users(id) default auth.uid(),
  aparelho       text not null check (aparelho ~ '^[A-Za-z0-9_-]{8,64}$'),
  leituras       integer not null default 0 check (leituras between 0 and 10000000),
  segundos       bigint  not null default 0 check (segundos between 0 and 100000000000),
  ultima_noite   date,
  sequencia      integer not null default 0 check (sequencia between 0 and 100000),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  primary key (user_id, aparelho)
);

-- -------------------------------------------------------------------------------------
-- 3) Gatilhos: carimbos de quem/quando, versão (trava otimista) e o que não pode mudar
--    As regras valem para o app (papéis authenticated/anon). Funções internas da plataforma (LGPD chamada por
--    admin_anonimizar_usuario) rodam como dono do banco e passam direto.
-- -------------------------------------------------------------------------------------

-- carimbo simples (progresso, preferências, estatísticas): dono fixo, criado_em fixo, versão + 1
create or replace function public.conta_tg_carimbo() returns trigger
language plpgsql set search_path = '' as $$
declare v_app boolean := current_user in ('authenticated', 'anon');
begin
  if tg_op = 'INSERT' then
    if v_app then new.user_id := (select auth.uid()); end if;
    new.criado_em := now();
  else
    if new.user_id <> old.user_id then raise exception 'Não dá para passar o registro para outra pessoa.'; end if;
    new.criado_em := old.criado_em;
  end if;
  new.atualizado_em := now();
  if tg_table_name in ('conta_progresso', 'conta_preferencias') then
    new.versao := case when tg_op = 'INSERT' then 1 else old.versao + 1 end;
  end if;
  return new;
end $$;

-- preferências: além do carimbo, nada de segredo nem nome em claro
create or replace function public.conta_tg_preferencias() returns trigger
language plpgsql set search_path = '' as $$
declare k text; v jsonb;
begin
  if current_user in ('authenticated', 'anon') then
    for k, v in select * from jsonb_each(new.dados) loop
      if k ~* '(key|token|senha|password|secret|segredo|nome|name|instr)' then
        raise exception 'O ajuste "%" não pode ir em claro: chaves e senhas ficam no aparelho; nomes vão cifrados.', k
          using errcode = 'check_violation';
      end if;
      if jsonb_typeof(v) in ('object', 'array') then
        raise exception 'O ajuste "%" precisa ser um valor simples.', k using errcode = 'check_violation';
      end if;
    end loop;
    -- o consentimento só anda para a frente pelo app (não se apaga um consentimento dado)
    if tg_op = 'UPDATE' and old.consentimento_em is not null and new.consentimento_em is null then
      new.consentimento_em := old.consentimento_em; new.consentimento_versao := old.consentimento_versao;
    end if;
  end if;
  return new;
end $$;

-- histórias: dono fixo, id fixo, versão + 1, apagar = marcar (e o conteúdo cifrado sai junto)
create or replace function public.conta_tg_historias() returns trigger
language plpgsql set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_app boolean := current_user in ('authenticated', 'anon');
begin
  if tg_op = 'INSERT' then
    if v_app then new.user_id := v_uid; end if;
    new.criado_por := coalesce(v_uid, new.criado_por);
    new.criado_em := now(); new.atualizado_por := v_uid; new.atualizado_em := now(); new.versao := 1;
    if new.apagado_em is not null then new.apagado_em := now(); new.dados_cifrado := null; new.marca := null; end if;
    return new;
  end if;
  if new.user_id <> old.user_id or new.id <> old.id then
    raise exception 'Não dá para mudar o dono nem o id de uma história.';
  end if;
  new.criado_por := old.criado_por; new.criado_em := old.criado_em;
  new.versao := old.versao + 1; new.atualizado_por := v_uid; new.atualizado_em := now();
  if new.apagado_em is not null then
    if old.apagado_em is null then new.apagado_em := now(); else new.apagado_em := old.apagado_em; end if;
    new.dados_cifrado := null; new.marca := null;     -- apagada não guarda conteúdo, nem cifrado
  end if;
  return new;
end $$;

-- chave do acervo: só se acrescenta (uma versão nunca é trocada nem apagada pelo app)
create or replace function public.conta_tg_chave() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if current_user in ('authenticated', 'anon') then new.user_id := (select auth.uid()); end if;
    new.criado_em := now();
    return new;
  end if;
  if current_user in ('authenticated', 'anon') then
    raise exception 'A chave do acervo não se troca nem se apaga: crie uma versão nova.';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists conta_carimbo on public.conta_progresso;
create trigger conta_carimbo before insert or update on public.conta_progresso
  for each row execute function public.conta_tg_carimbo();
drop trigger if exists conta_carimbo on public.conta_preferencias;
create trigger conta_carimbo before insert or update on public.conta_preferencias
  for each row execute function public.conta_tg_carimbo();
drop trigger if exists conta_sem_segredo on public.conta_preferencias;
create trigger conta_sem_segredo before insert or update on public.conta_preferencias
  for each row execute function public.conta_tg_preferencias();
drop trigger if exists conta_carimbo on public.conta_estatisticas;
create trigger conta_carimbo before insert or update on public.conta_estatisticas
  for each row execute function public.conta_tg_carimbo();
drop trigger if exists conta_historias_regras on public.conta_historias;
create trigger conta_historias_regras before insert or update on public.conta_historias
  for each row execute function public.conta_tg_historias();
drop trigger if exists conta_chave_so_inclusao on public.conta_chave;
create trigger conta_chave_so_inclusao before insert or update or delete on public.conta_chave
  for each row execute function public.conta_tg_chave();

-- -------------------------------------------------------------------------------------
-- 4) Regras de acesso (RLS) — o banco garante, não só a tela
-- -------------------------------------------------------------------------------------
alter table public.conta_chave        enable row level security;
alter table public.conta_historias    enable row level security;
alter table public.conta_progresso    enable row level security;
alter table public.conta_preferencias enable row level security;
alter table public.conta_estatisticas enable row level security;

-- 4.1 chave do acervo: só a própria pessoa lê e acrescenta
drop policy if exists conta_chave_ler on public.conta_chave;
create policy conta_chave_ler on public.conta_chave for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists conta_chave_criar on public.conta_chave;
create policy conta_chave_criar on public.conta_chave for insert to authenticated
  with check (user_id = (select auth.uid()) and public.conta__ativa());

-- 4.2 histórias: o dono lê e grava; quem é do grupo da história só lê (inclusive as apagadas, para sumirem
--     também no aparelho dele). Pôr num grupo: só quem é membro ativo (não criança) desse grupo.
drop policy if exists conta_historias_ler on public.conta_historias;
create policy conta_historias_ler on public.conta_historias for select to authenticated
  using (user_id = (select auth.uid()) or (grupo_id is not null and public.sol_sou_membro(grupo_id)));
drop policy if exists conta_historias_criar on public.conta_historias;
create policy conta_historias_criar on public.conta_historias for insert to authenticated
  with check (user_id = (select auth.uid()) and public.conta__ativa() and public.conta__posso_compartilhar(grupo_id));
drop policy if exists conta_historias_mudar on public.conta_historias;
create policy conta_historias_mudar on public.conta_historias for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.conta__ativa() and public.conta__posso_compartilhar(grupo_id));
--   apagar de verdade: ninguém pelo app (apaga marcando apagado_em)

-- 4.3 progresso, preferências e estatísticas: só a própria pessoa
drop policy if exists conta_progresso_meu on public.conta_progresso;
create policy conta_progresso_meu on public.conta_progresso for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists conta_progresso_criar on public.conta_progresso;
create policy conta_progresso_criar on public.conta_progresso for insert to authenticated
  with check (user_id = (select auth.uid()) and public.conta__ativa());
drop policy if exists conta_progresso_mudar on public.conta_progresso;
create policy conta_progresso_mudar on public.conta_progresso for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.conta__ativa());

drop policy if exists conta_preferencias_minhas on public.conta_preferencias;
create policy conta_preferencias_minhas on public.conta_preferencias for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists conta_preferencias_criar on public.conta_preferencias;
create policy conta_preferencias_criar on public.conta_preferencias for insert to authenticated
  with check (user_id = (select auth.uid()) and public.conta__ativa());
drop policy if exists conta_preferencias_mudar on public.conta_preferencias;
create policy conta_preferencias_mudar on public.conta_preferencias for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.conta__ativa());

drop policy if exists conta_estatisticas_minhas on public.conta_estatisticas;
create policy conta_estatisticas_minhas on public.conta_estatisticas for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists conta_estatisticas_criar on public.conta_estatisticas;
create policy conta_estatisticas_criar on public.conta_estatisticas for insert to authenticated
  with check (user_id = (select auth.uid()) and public.conta__ativa());
drop policy if exists conta_estatisticas_mudar on public.conta_estatisticas;
create policy conta_estatisticas_mudar on public.conta_estatisticas for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.conta__ativa());

-- -------------------------------------------------------------------------------------
-- 5) LGPD (C8): anonimizar uma pessoa no Contador. Chamada por admin_anonimizar_usuario (nunca pelo app).
--    Apagar a chave do acervo deixa o que sobrar cifrado impossível de abrir; mesmo assim o conteúdo sai.
--    O registro do consentimento (data e versão do texto, sem nome) fica, como prova do que foi aceito.
-- -------------------------------------------------------------------------------------
create or replace function public.conta_anonimizar(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_hist integer; v_prog integer; v_est integer; v_chave integer; v_pref integer;
begin
  if p_uid is null then raise exception 'uid obrigatório'; end if;
  update public.conta_historias h
     set dados_cifrado = null, marca = null, grupo_id = null, apagado_em = coalesce(h.apagado_em, now())
   where h.user_id = p_uid and (h.dados_cifrado is not null or h.grupo_id is not null or h.apagado_em is null);
  get diagnostics v_hist = row_count;
  delete from public.conta_progresso p where p.user_id = p_uid;
  get diagnostics v_prog = row_count;
  delete from public.conta_estatisticas e where e.user_id = p_uid;
  get diagnostics v_est = row_count;
  update public.conta_preferencias p set dados = '{}'::jsonb, dados_cifrado = null, chave_versao = null where p.user_id = p_uid;
  get diagnostics v_pref = row_count;
  delete from public.conta_chave c where c.user_id = p_uid;
  get diagnostics v_chave = row_count;
  return jsonb_build_object('app', 'contador-de-historias', 'historias', v_hist, 'progresso', v_prog,
                            'estatisticas', v_est, 'preferencias', v_pref, 'chaves', v_chave);
end $$;

-- -------------------------------------------------------------------------------------
-- 6) Registro do app na LGPD da plataforma (C8). A linha do app já existe (base); aqui só a função.
-- -------------------------------------------------------------------------------------
insert into public.sol_apps (codigo, nome, prefixo, repo, funcao_anonimizar)
values ('contador-de-historias', 'UM Contador de Histórias', 'conta', 'contador-de-historias', 'conta_anonimizar')
on conflict (codigo) do update set funcao_anonimizar = excluded.funcao_anonimizar, atualizado_em = now();

-- -------------------------------------------------------------------------------------
-- 7) Permissões (GRANTs explícitos). Visitante (anon) não toca em nada do Contador.
--    Sem tempo real: o app pergunta "o que mudou desde a última vez" ao abrir, ao voltar e a cada minuto.
-- -------------------------------------------------------------------------------------
revoke all on public.conta_chave, public.conta_historias, public.conta_progresso, public.conta_preferencias,
              public.conta_estatisticas from public, anon, authenticated;
grant select, insert         on public.conta_chave        to authenticated;
grant select, insert, update on public.conta_historias    to authenticated;
grant select, insert, update on public.conta_progresso    to authenticated;
grant select, insert, update on public.conta_preferencias to authenticated;
grant select, insert, update on public.conta_estatisticas to authenticated;
-- service_role (Edge Function / painel) passa por cima do RLS; fica explícito aqui (C10)
grant select, insert, update, delete on public.conta_chave, public.conta_historias, public.conta_progresso,
  public.conta_preferencias, public.conta_estatisticas to service_role;

do $$
declare f text;
begin
  -- nenhuma função do Contador fica aberta para "public"/visitante
  for f in select format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
             from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'conta\_%' loop
    execute format('revoke all on function %s from public, anon', f);
  end loop;
end $$;
-- usadas pelas regras de acesso
grant execute on function public.conta__ativa(), public.conta__posso_compartilhar(uuid) to authenticated;
-- gatilhos: só o banco usa
revoke all on function public.conta_tg_carimbo(), public.conta_tg_preferencias(), public.conta_tg_historias(),
  public.conta_tg_chave() from authenticated;
-- LGPD: só a plataforma (admin_anonimizar_usuario / service_role), nunca o app
revoke all on function public.conta_anonimizar(uuid) from authenticated;
grant execute on function public.conta_anonimizar(uuid) to service_role;

-- -------------------------------------------------------------------------------------
-- 8) Conferência: toda tabela conta_* com RLS ligado e com regra; nada aberto para anon
-- -------------------------------------------------------------------------------------
do $$
declare r record; v_erros text := '';
begin
  for r in select c.relname, c.relrowsecurity,
                  (select count(*) from pg_catalog.pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as pol
             from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'conta\_%' loop
    if not r.relrowsecurity then v_erros := v_erros || ' ' || r.relname || '(sem RLS)'; end if;
    if r.pol = 0 then v_erros := v_erros || ' ' || r.relname || '(sem regra)'; end if;
  end loop;
  if exists (select 1 from information_schema.role_table_grants g
              where g.table_schema = 'public' and g.table_name like 'conta\_%' and g.grantee in ('anon', 'PUBLIC')) then
    v_erros := v_erros || ' anon tem acesso a tabela conta_*';
  end if;
  if exists (select 1 from information_schema.role_table_grants g
              where g.table_schema = 'public' and g.table_name like 'conta\_%' and g.grantee = 'authenticated'
                and g.privilege_type in ('DELETE', 'TRUNCATE')) then
    v_erros := v_erros || ' o app consegue apagar linhas de conta_*';
  end if;
  if (select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'conta\_%') <> 5 then
    v_erros := v_erros || ' esperava 5 tabelas conta_*';
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.conta_anonimizar(uuid)', 'EXECUTE') then
    v_erros := v_erros || ' o app consegue chamar conta_anonimizar';
  end if;
  if not exists (select 1 from public.sol_apps a where a.codigo = 'contador-de-historias' and a.funcao_anonimizar = 'conta_anonimizar') then
    v_erros := v_erros || ' sol_apps sem conta_anonimizar';
  end if;
  if v_erros <> '' then raise exception 'Conferência do UM Contador de Histórias falhou:%', v_erros; end if;
  raise notice 'UM Contador de Histórias v1: 5 tabelas conta_* com RLS e regras, permissões conferidas, registro em sol_apps ok.';
end $$;

commit;

-- Resultado da conferência (só leitura): uma linha por tabela, com RLS ligado e quantas regras tem
select c.relname as tabela, c.relrowsecurity as rls_ligado,
       (select count(*) from pg_catalog.pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as regras
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'conta\_%'
 order by 1;
