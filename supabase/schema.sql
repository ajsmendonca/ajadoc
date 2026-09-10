-- ============================================================
-- SCHEMA DO SISTEMA DE PROTOCOLO
-- Rode este script inteiro no SQL Editor do Supabase
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================
-- SETORES (com hierarquia)
-- ============================================
create table setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sigla text unique,
  setor_pai_id uuid references setores(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- USUARIOS INTERNOS (vinculado ao auth.users)
-- ============================================
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  cargo text,
  setor_id uuid references setores(id),
  papel text check (papel in ('admin', 'gestor_setor', 'operador', 'consulta')),
  status text not null default 'pendente'
    check (status in ('pendente', 'ativo', 'recusado', 'inativo')),
  created_at timestamptz not null default now()
);

-- ============================================
-- SOLICITANTES EXTERNOS
-- ============================================
create table solicitantes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),
  tipo_pessoa text not null check (tipo_pessoa in ('fisica', 'juridica')),
  nome text not null,
  documento text not null unique,
  email text,
  telefone text,
  created_at timestamptz not null default now()
);

-- ============================================
-- TIPOS DE DOCUMENTO (classifica o protocolo)
-- ============================================
create table tipos_documento (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  prazo_padrao_dias integer,
  ativo boolean not null default true
);

-- ============================================
-- TIPOS DE ANEXO (classifica cada arquivo)
-- ============================================
create table tipos_anexo (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- PROTOCOLOS
-- ============================================
create table protocolos (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  assunto text not null,
  descricao text,
  tipo_documento_id uuid references tipos_documento(id),

  origem_tipo text not null check (origem_tipo in ('interno', 'externo')),
  solicitante_id uuid references solicitantes(id),
  usuario_criador_id uuid references usuarios(id),

  setor_atual_id uuid references setores(id) not null,
  responsavel_atual_id uuid references usuarios(id),

  status text not null default 'aberto'
    check (status in ('aberto', 'em_andamento', 'aguardando', 'concluido', 'arquivado', 'cancelado')),

  prazo_limite date,
  data_conclusao timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_protocolos_status on protocolos(status);
create index idx_protocolos_setor_atual on protocolos(setor_atual_id);
create index idx_protocolos_solicitante on protocolos(solicitante_id);

-- ============================================
-- TRAMITACOES (thread de despachos)
-- ============================================
create table tramitacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo_id uuid references protocolos(id) on delete cascade not null,
  numero_sequencial integer not null default 1,
  tipo_acao text not null default 'encaminhamento'
    check (tipo_acao in ('abertura', 'resposta', 'encaminhamento', 'conclusao')),

  setor_origem_id uuid references setores(id),
  setor_destino_id uuid references setores(id),
  destino_solicitante_id uuid references solicitantes(id),
  usuario_remetente_id uuid references usuarios(id),
  usuario_destinatario_id uuid references usuarios(id),

  despacho text,
  status_resultante text,
  visivel_externamente boolean not null default true,
  caminho_setor text,

  assinatura_tipo text check (assinatura_tipo in ('nenhuma', 'plataforma', 'icp_brasil')),
  assinatura_certificado text,

  created_at timestamptz not null default now()
);

create index idx_tramitacoes_protocolo on tramitacoes(protocolo_id);

-- ============================================
-- ANEXOS
-- ============================================
create table anexos (
  id uuid primary key default gen_random_uuid(),
  protocolo_id uuid references protocolos(id) on delete cascade not null,
  tramitacao_id uuid references tramitacoes(id),
  tipo_anexo_id uuid references tipos_anexo(id),
  nome_arquivo text not null,
  caminho_storage text not null,
  tipo_mime text,
  tamanho_bytes bigint,
  enviado_por_usuario_id uuid references usuarios(id),
  enviado_por_solicitante_id uuid references solicitantes(id),
  created_at timestamptz not null default now()
);

create index idx_anexos_protocolo on anexos(protocolo_id);

-- ============================================
-- COMENTARIOS INTERNOS
-- ============================================
create table protocolo_comentarios (
  id uuid primary key default gen_random_uuid(),
  protocolo_id uuid references protocolos(id) on delete cascade not null,
  usuario_id uuid references usuarios(id) not null,
  comentario text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- VISUALIZACOES (transparência)
-- ============================================
create table protocolo_visualizacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo_id uuid references protocolos(id) on delete cascade not null,
  usuario_id uuid references usuarios(id),
  solicitante_id uuid references solicitantes(id),
  caminho_setor text,
  visualizado_em timestamptz not null default now()
);

-- ============================================
-- FAVORITOS
-- ============================================
create table protocolo_favoritos (
  usuario_id uuid references usuarios(id) not null,
  protocolo_id uuid references protocolos(id) on delete cascade not null,
  primary key (usuario_id, protocolo_id)
);

-- ============================================
-- ASSINATURAS (visto interno + ICP-Brasil)
-- ============================================
create table assinaturas (
  id uuid primary key default gen_random_uuid(),
  anexo_id uuid references anexos(id),
  tramitacao_id uuid references tramitacoes(id),
  usuario_id uuid references usuarios(id),
  solicitante_id uuid references solicitantes(id),

  tipo text not null check (tipo in ('visto_interno', 'icp_brasil')),

  hash_documento text not null,
  provedor text,
  referencia_externa text,
  certificado_titular text,

  ip_address inet,
  geolocalizacao_lat numeric,
  geolocalizacao_lng numeric,
  user_agent text,
  selfie_storage_path text,
  selfie_consentimento_em timestamptz,

  assinado_em timestamptz not null default now()
);

-- ============================================
-- NUMERACAO AUTOMATICA DE PROTOCOLO (ex: 2026.000123)
-- ============================================
create or replace function gerar_numero_protocolo()
returns trigger as $$
declare
  ano text := to_char(now(), 'YYYY');
  seq_name text := 'protocolo_seq_' || ano;
  proximo_num bigint;
begin
  if not exists (select 1 from pg_sequences where sequencename = seq_name) then
    execute format('create sequence %I start 1', seq_name);
  end if;

  execute format('select nextval(%L)', seq_name) into proximo_num;
  new.numero := ano || '.' || lpad(proximo_num::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_gerar_numero_protocolo
before insert on protocolos
for each row
when (new.numero is null)
execute function gerar_numero_protocolo();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table setores enable row level security;
alter table usuarios enable row level security;
alter table solicitantes enable row level security;
alter table tipos_documento enable row level security;
alter table tipos_anexo enable row level security;
alter table protocolos enable row level security;
alter table tramitacoes enable row level security;
alter table anexos enable row level security;
alter table protocolo_comentarios enable row level security;
alter table protocolo_visualizacoes enable row level security;
alter table protocolo_favoritos enable row level security;
alter table assinaturas enable row level security;

-- usuarios: qualquer autenticado pode ler (necessário pra exibir nomes),
-- só o próprio (ou admin) pode alterar
create policy "usuarios leitura autenticada" on usuarios for select using (auth.role() = 'authenticated');
create policy "usuarios insert proprio" on usuarios for insert with check (auth.uid() = id);

-- solicitantes: o próprio solicitante gerencia seu cadastro
create policy "solicitantes select proprio" on solicitantes for select using (auth_user_id = auth.uid());
create policy "solicitantes insert proprio" on solicitantes for insert with check (auth_user_id = auth.uid());

-- setores e tipos: leitura livre para autenticados
create policy "setores leitura" on setores for select using (auth.role() = 'authenticated');
create policy "tipos_documento leitura" on tipos_documento for select using (auth.role() = 'authenticated');
create policy "tipos_anexo leitura" on tipos_anexo for select using (auth.role() = 'authenticated');

-- protocolos: admin vê tudo; interno vê do seu setor; externo vê os próprios
create policy "protocolos select" on protocolos for select using (
  (select papel from usuarios where id = auth.uid()) = 'admin'
  or setor_atual_id in (select setor_id from usuarios where id = auth.uid())
  or usuario_criador_id = auth.uid()
  or solicitante_id in (select id from solicitantes where auth_user_id = auth.uid())
);

create policy "protocolos insert" on protocolos for insert with check (
  usuario_criador_id = auth.uid()
  or solicitante_id in (select id from solicitantes where auth_user_id = auth.uid())
);

create policy "protocolos update" on protocolos for update using (
  (select papel from usuarios where id = auth.uid()) in ('admin', 'gestor_setor', 'operador')
  and setor_atual_id in (select setor_id from usuarios where id = auth.uid())
);

-- tramitacoes: interno vê tudo do protocolo que já pode ver;
-- externo só vê despachos marcados como visíveis
create policy "tramitacoes select interno" on tramitacoes for select using (
  exists (
    select 1 from usuarios where id = auth.uid()
  )
  and protocolo_id in (select id from protocolos)
);

create policy "tramitacoes select externo" on tramitacoes for select using (
  visivel_externamente = true
  and protocolo_id in (
    select p.id from protocolos p
    join solicitantes s on s.id = p.solicitante_id
    where s.auth_user_id = auth.uid()
  )
);

create policy "tramitacoes insert" on tramitacoes for insert with check (auth.role() = 'authenticated');

-- anexos: segue a mesma visibilidade do protocolo/tramitação
create policy "anexos select" on anexos for select using (auth.role() = 'authenticated');
create policy "anexos insert" on anexos for insert with check (auth.role() = 'authenticated');

-- favoritos: só o próprio usuário
create policy "favoritos crud proprio" on protocolo_favoritos for all using (usuario_id = auth.uid());

-- visualizacoes: qualquer autenticado pode registrar; leitura ligada ao protocolo
create policy "visualizacoes insert" on protocolo_visualizacoes for insert with check (auth.role() = 'authenticated');
create policy "visualizacoes select" on protocolo_visualizacoes for select using (auth.role() = 'authenticated');
