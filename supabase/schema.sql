create table propostas (
  id uuid primary key default gen_random_uuid(),
  token text unique,
  status text not null default 'rascunho' check (status in ('rascunho','aprovada','paga')),
  versao int not null default 1,
  cliente text not null,
  nicho text,
  objetivo text,
  descricao text,
  prazo_desejado text,
  prazo_entrega text,
  condicoes text,
  total_unico numeric,
  total_mensal numeric,
  total_repassado numeric,
  entrada_valor numeric,
  servicos jsonb not null default '{}',
  stripe_session_id text,
  criado_em timestamptz not null default now(),
  aprovado_em timestamptz
);

-- RLS ligado e sem policy pública: tudo passa por rotas do servidor com a service key.
alter table propostas enable row level security;
-- reforço: nem a API pública (anon/authenticated) enxerga a tabela; só a service key.
revoke all on propostas from anon, authenticated;
