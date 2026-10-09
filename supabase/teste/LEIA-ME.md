# Teste local do SQL do UM Contador de Histórias (Postgres no computador)

**Nunca rode o arquivo de teste no Supabase.** Ele cria pessoas e dados de mentira. Serve para conferir, num Postgres
local e descartável, que `supabase/contador-de-historias-v1.sql` roda, pode ser repetido e faz o que o plano diz,
antes da revisão.

Precisa da pasta `teste/sql` e da pasta `entrega/solverone-app/supabase` do repositório `rootify-one` (o mesmo
ambiente de teste da base comum). Em `ROOTIFY`, o caminho da cópia do `rootify-one`:

```
createdb conta
psql -d conta -v ON_ERROR_STOP=1 -f $ROOTIFY/teste/sql/stub-supabase.sql
for f in 2026-09-28a-nunca-excluir-e-encerrar-conta 2026-09-28b-lgpd-solicitacoes-e-anonimizacao \
         2026-09-28c-registro-de-acessos 2026-10-02b-reativar-estado-anterior-e-travas 2026-10-03-plataforma-dados-v1; do
  psql -d conta -v ON_ERROR_STOP=1 -f $ROOTIFY/entrega/solverone-app/supabase/$f.sql > /dev/null
done
psql -d conta -v ON_ERROR_STOP=1 -f supabase/contador-de-historias-v1.sql
psql -d conta -v ON_ERROR_STOP=1 -f supabase/contador-de-historias-v1.sql      # de novo: tem que rodar sem erro
psql -d conta -f supabase/teste/teste-contador-de-historias.sql | grep -E "ok:|FALHOU|FIM"
```

Resultado em 09/Out/2026 (Postgres 16): o SQL rodou duas vezes sem erro; **56 verificações "ok"**, nenhuma falha, e
"FIM: todas as verificações do Contador passaram". Também conferido: o teste da base (`teste-plataforma.sql`, 87
verificações) continua passando com o Contador junto; o arquivo roda junto com o `omnilife-one-v1.sql` e a anonimização
chama as funções dos dois apps; sem a base, ou com outra tabela `conta_*` já existente, o arquivo para sem criar nada.
