-- ⚠ SÓ PARA UM POSTGRES LOCAL DE TESTE. NUNCA RODE NO SUPABASE (cria pessoas e dados de mentira).
-- Testa supabase/contador-de-historias-v1.sql por cima da base comum. Como rodar: supabase/teste/LEIA-ME.md
-- Cada linha "ok: …" é uma verificação; qualquer "FALHOU" para o script.
\set ON_ERROR_STOP 1
\set QUIET 1

insert into auth.users (id, email) values
 ('d1000000-0000-0000-0000-000000000001', 'dono-equipe@x.com'), ('a1000000-0000-0000-0000-000000000001', 'ana@x.com'),
 ('b1000000-0000-0000-0000-000000000001', 'bia@x.com'),         ('c1000000-0000-0000-0000-000000000001', 'caio@x.com'),
 ('e1000000-0000-0000-0000-000000000001', 'zeca@x.com'),        ('f1000000-0000-0000-0000-000000000001', 'dani@x.com'),
 ('d2000000-0000-0000-0000-000000000001', 'dona2-equipe@x.com')
on conflict do nothing;
insert into public.equipe (user_id, papel) values ('d1000000-0000-0000-0000-000000000001', 'dono'), ('d2000000-0000-0000-0000-000000000001', 'dono')
on conflict do nothing;
insert into public.assinaturas (user_id, plano, status) values
 ('a1000000-0000-0000-0000-000000000001', 'membro', 'ativa'), ('b1000000-0000-0000-0000-000000000001', 'membro', 'ativa'),
 ('c1000000-0000-0000-0000-000000000001', 'membro', 'ativa'), ('e1000000-0000-0000-0000-000000000001', 'membro', 'ativa'),
 ('f1000000-0000-0000-0000-000000000001', 'membro', 'encerrada')
on conflict (user_id) do update set status = excluded.status;

create temp table t (k text primary key, v text);
grant all on t to authenticated, anon;
create or replace function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(cond, false) then raise exception 'FALHOU: %', msg; end if; raise notice 'ok: %', msg; end $$;
-- espera um erro: roda o comando e confere que falhou
create or replace function pg_temp.erro(cmd text, msg text) returns void language plpgsql as $$
begin
  begin execute cmd; exception when others then raise notice 'ok: % (%)', msg, left(sqlerrm, 90); return; end;
  raise exception 'FALHOU: % — o comando passou: %', msg, cmd;
end $$;
-- conta quantas linhas um update mudou
create or replace function pg_temp.mudou(cmd text) returns integer language plpgsql as $$
declare n integer; begin execute cmd; get diagnostics n = row_count; return n; end $$;

-- ===== visitante =====
select set_config('request.jwt.claim.sub', '', false); set role anon;
select pg_temp.erro('select * from public.conta_historias', 'visitante não lê histórias');
select pg_temp.erro('select * from public.conta_preferencias', 'visitante não lê ajustes');
reset role;

-- ===== grupo: Ana (chefe), Bia (membro), Zeca (criança com conta); Caio tem um grupo só dele =====
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false); set role authenticated;
insert into t values ('g', public.sol_criar_grupo('Família Ana', 'familia', 'Ana'));
insert into t values ('cv_b', public.sol_criar_convite((select v::uuid from t where k = 'g'), 'membro', 7, 1));
insert into t values ('cv_z', public.sol_criar_convite((select v::uuid from t where k = 'g'), 'crianca', 7, 1));
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select public.sol_aceitar_convite((select v from t where k = 'cv_b'), 'Bia');
select set_config('request.jwt.claim.sub', 'e1000000-0000-0000-0000-000000000001', false);
select public.sol_aceitar_convite((select v from t where k = 'cv_z'), 'Zeca');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000001', false);
insert into t values ('gc', public.sol_criar_grupo('Casa do Caio', 'familia', 'Caio'));

-- ===== chave do acervo =====
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
insert into public.conta_chave (versao, iteracoes, sal, chave_embrulhada) values (1, 600000, 'c2FsLWFsZWF0b3Jpby0xMjM0', 'pacote-fechado-da-ana-0001');
select pg_temp.ok((select user_id from public.conta_chave) = 'a1000000-0000-0000-0000-000000000001', 'a chave fica com quem gravou');
select pg_temp.erro($$insert into public.conta_chave (versao, iteracoes, sal, chave_embrulhada) values (1, 600000, 'c2FsLWFsZWF0b3Jpby05OTk5', 'outro-pacote-0002')$$,
  'segundo aparelho não cria outra chave na mesma versão');
select pg_temp.erro($$update public.conta_chave set chave_embrulhada = 'trocada-000000000' where versao = 1$$, 'a chave não se troca');
select pg_temp.erro($$delete from public.conta_chave$$, 'a chave não se apaga pelo app');
select pg_temp.erro($$insert into public.conta_chave (versao, iteracoes, sal, chave_embrulhada) values (2, 1000, 'c2FsLWFsZWF0b3Jpby0xMjM0', 'fraca-00000000000')$$,
  'menos de 600 mil rodadas é recusado');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_chave) = 0, 'Bia não vê a chave da Ana');

-- ===== histórias =====
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
insert into public.conta_historias (id, dados_cifrado, marca) values ('h1', 'cifrado-h1', repeat('a', 64));
-- tenta gravar em nome da Bia: o banco põe no nome de quem está logado
insert into public.conta_historias (user_id, id, dados_cifrado) values ('b1000000-0000-0000-0000-000000000001', 'h2', 'cifrado-h2');
select pg_temp.ok((select count(*) from public.conta_historias where user_id = 'a1000000-0000-0000-0000-000000000001') = 2,
  'história gravada fica sempre no nome de quem está logado');
select pg_temp.erro($$insert into public.conta_historias (id, dados_cifrado, marca) values ('h3', 'cifrado-h3', repeat('a', 64))$$,
  'a mesma história (mesma marca) não entra duas vezes');
select pg_temp.erro($$insert into public.conta_historias (id) values ('h4')$$, 'história sem conteúdo cifrado é recusada');
select pg_temp.erro($$insert into public.conta_historias (id, dados_cifrado) values ('id com espaço', 'x')$$, 'id fora do formato é recusado');
select pg_temp.ok((select versao from public.conta_historias where id = 'h1') = 1, 'história nova começa na versão 1');
-- trava otimista: grava em cima da versão certa; em cima da antiga não muda nada
select pg_temp.ok(pg_temp.mudou($$update public.conta_historias set dados_cifrado = 'cifrado-h1-b' where id = 'h1' and versao = 1$$) = 1, 'gravar em cima da versão certa');
select pg_temp.ok(pg_temp.mudou($$update public.conta_historias set dados_cifrado = 'cifrado-h1-c' where id = 'h1' and versao = 1$$) = 0,
  'gravar em cima de versão antiga não muda nada (o app junta e tenta de novo)');
select pg_temp.ok((select versao from public.conta_historias where id = 'h1') = 2, 'versão subiu para 2');
select pg_temp.erro($$update public.conta_historias set id = 'h9' where id = 'h1'$$, 'não dá para mudar o id (o áudio guardado depende dele)');
select pg_temp.erro($$delete from public.conta_historias where id = 'h2'$$, 'apagar de verdade não é permitido pelo app');

-- sem grupo: só a dona vê
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_historias) = 0, 'Bia não vê histórias da Ana que não foram compartilhadas');

-- compartilhar com a família
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok(pg_temp.mudou(format($$update public.conta_historias set grupo_id = %L where id = 'h1'$$, (select v from t where k = 'g'))) = 1,
  'Ana compartilha h1 com a família dela');
select pg_temp.erro(format($$update public.conta_historias set grupo_id = %L where id = 'h2'$$, (select v from t where k = 'gc')),
  'Ana não põe história num grupo de que não faz parte');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_historias) = 1, 'Bia vê só a história compartilhada');
select pg_temp.ok(pg_temp.mudou($$update public.conta_historias set dados_cifrado = 'mexido' where id = 'h1'$$) = 0, 'Bia não muda história da Ana');
select set_config('request.jwt.claim.sub', 'e1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_historias) = 1, 'Zeca (criança da família) vê a história compartilhada');
select pg_temp.erro(format($$insert into public.conta_historias (id, dados_cifrado, grupo_id) values ('z1', 'cifrado-z1', %L)$$, (select v from t where k = 'g')),
  'criança não compartilha história com o grupo');
insert into public.conta_historias (id, dados_cifrado) values ('z1', 'cifrado-z1');
select pg_temp.ok((select count(*) from public.conta_historias where id = 'z1') = 1, 'criança com conta guarda a própria história');
select set_config('request.jwt.claim.sub', 'c1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_historias) = 0, 'Caio (fora da família) não vê nada');

-- apagar = marcar; o conteúdo sai junto, e a marca também (a história pode voltar a entrar)
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
update public.conta_historias set apagado_em = now() where id = 'h1';
select pg_temp.ok((select dados_cifrado is null and marca is null and apagado_em is not null from public.conta_historias where id = 'h1'),
  'apagar tira o conteúdo e a marca');
insert into public.conta_historias (id, dados_cifrado, marca) values ('h5', 'cifrado-h5', repeat('a', 64));
select pg_temp.ok(true, 'depois de apagada, a mesma história pode entrar de novo');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select apagado_em is not null from public.conta_historias where id = 'h1'), 'Bia fica sabendo que h1 foi apagada (para sumir no aparelho dela)');

-- ===== preferências =====
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
select pg_temp.erro($$insert into public.conta_preferencias (dados) values ('{"geminiKey":"AIza-segredo"}')$$, 'chave de IA não vai para o banco');
select pg_temp.erro($$insert into public.conta_preferencias (dados) values ('{"ghToken":"github_pat_x"}')$$, 'token do GitHub não vai para o banco');
select pg_temp.erro($$insert into public.conta_preferencias (dados) values ('{"publicoNomes":"Fulana e Beltrana"}')$$, 'nomes das crianças não vão em claro');
select pg_temp.erro($$insert into public.conta_preferencias (dados) values ('{"geminiInstr":"para a Fulana"}')$$, 'instrução da voz não vai em claro');
select pg_temp.erro($$insert into public.conta_preferencias (dados) values ('{"tema":{"a":1}}')$$, 'só valores simples em claro');
insert into public.conta_preferencias (dados, dados_cifrado, chave_versao, consentimento_em, consentimento_versao)
values ('{"tema":"claro","vel":0.95,"efeitos":true}', 'cifrado-nomes', 1, now(), 'v1-2026-10');
select pg_temp.ok((select versao from public.conta_preferencias) = 1, 'ajustes gravados (versão 1)');
update public.conta_preferencias set consentimento_em = null, consentimento_versao = null, dados = '{"tema":"escuro"}';
select pg_temp.ok((select consentimento_em is not null and versao = 2 from public.conta_preferencias), 'o consentimento dado não se apaga pelo app');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_preferencias) = 0, 'Bia não vê os ajustes da Ana');

-- ===== progresso e estatísticas =====
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
insert into public.conta_progresso (historia_id, favorita, pos_frase, frases_total, leituras) values ('h1', true, 12, 80, 3);
insert into public.conta_progresso (historia_id, leituras) values ('acervo-0007', 1);   -- história do acervo público também guarda progresso
update public.conta_progresso set pos_frase = 20 where historia_id = 'h1';
select pg_temp.ok((select versao = 2 and pos_frase = 20 from public.conta_progresso where historia_id = 'h1'), 'progresso sobe a versão');
insert into public.conta_estatisticas (aparelho, leituras, segundos) values ('celular-ana-0001', 5, 1800), ('computador-ana-01', 2, 600);
select pg_temp.ok((select sum(leituras) from public.conta_estatisticas) = 7, 'cada aparelho guarda as suas contas; o app soma');
select set_config('request.jwt.claim.sub', 'b1000000-0000-0000-0000-000000000001', false);
select pg_temp.ok((select count(*) from public.conta_progresso) + (select count(*) from public.conta_estatisticas) = 0, 'Bia não vê progresso nem estatísticas da Ana');

-- ===== conta encerrada =====
select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000001', false);
select pg_temp.erro($$insert into public.conta_historias (id, dados_cifrado) values ('d1', 'cifrado-d1')$$, 'conta encerrada não grava história');
select pg_temp.erro($$insert into public.conta_preferencias (dados) values ('{"tema":"claro"}')$$, 'conta encerrada não grava ajustes');
select pg_temp.erro($$insert into public.conta_chave (versao, iteracoes, sal, chave_embrulhada) values (1, 600000, 'c2FsLWFsZWF0b3Jpby0xMjM0', 'pacote-dani-00001')$$,
  'conta encerrada não cria chave');

-- ===== LGPD =====
select set_config('request.jwt.claim.sub', 'a1000000-0000-0000-0000-000000000001', false);
select pg_temp.erro($$select public.conta_anonimizar('a1000000-0000-0000-0000-000000000001')$$, 'o app não chama a anonimização');
reset role;
select set_config('request.jwt.claim.sub', 'd1000000-0000-0000-0000-000000000001', false); set role authenticated;
insert into t values ('anon', public.admin_anonimizar_usuario('a1000000-0000-0000-0000-000000000001', 'teste')::text);
reset role;
select pg_temp.ok((select v::jsonb -> 'apps' ? 'contador-de-historias' from t where k = 'anon'), 'a anonimização da plataforma chama a do Contador');
select pg_temp.ok((select count(*) from public.conta_historias where user_id = 'a1000000-0000-0000-0000-000000000001' and (dados_cifrado is not null or apagado_em is null or grupo_id is not null)) = 0,
  'histórias da Ana: sem conteúdo, apagadas e fora do grupo');
select pg_temp.ok((select count(*) from public.conta_chave where user_id = 'a1000000-0000-0000-0000-000000000001') = 0, 'a chave do acervo da Ana some (o que sobrar não abre)');
select pg_temp.ok((select count(*) from public.conta_progresso where user_id = 'a1000000-0000-0000-0000-000000000001')
                + (select count(*) from public.conta_estatisticas where user_id = 'a1000000-0000-0000-0000-000000000001') = 0, 'progresso e estatísticas da Ana saem');
select pg_temp.ok((select dados = '{}'::jsonb and dados_cifrado is null and consentimento_em is not null from public.conta_preferencias
                    where user_id = 'a1000000-0000-0000-0000-000000000001'), 'ajustes da Ana zerados; fica só a data do consentimento');
select pg_temp.ok((select count(*) from public.conta_historias where user_id = 'e1000000-0000-0000-0000-000000000001' and dados_cifrado is not null) = 1,
  'a história do Zeca não é tocada');

-- ===== catálogo =====
select pg_temp.ok(not has_table_privilege('anon', 'public.conta_historias', 'select'), 'anon sem SELECT em conta_historias');
select pg_temp.ok(not has_table_privilege('authenticated', 'public.conta_historias', 'delete'), 'app sem DELETE em conta_historias');
select pg_temp.ok(not has_function_privilege('anon', 'public.conta__ativa()', 'execute'), 'anon não executa funções do Contador');
select pg_temp.ok((select bool_and(p.proconfig @> array['search_path=""'])
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname like 'conta\_%'), 'todas as funções conta_* com search_path vazio');
select pg_temp.ok((select bool_and(p.prosecdef) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname in ('conta__ativa', 'conta__posso_compartilhar', 'conta_anonimizar')),
  'funções de regra e de LGPD com SECURITY DEFINER');
\echo 'FIM: todas as verificações do Contador passaram'
