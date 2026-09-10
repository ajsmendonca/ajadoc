# Protocolo — Sistema próprio de tramitação online

Projeto Next.js 14 (App Router) + Supabase, com login/cadastro interno e
externo, inbox, abertura de solicitação e tramitação por despachos.

## Como colocar no ar

### 1. Banco de dados (Supabase)
1. Crie um projeto em [supabase.com](https://supabase.com)
2. Abra o **SQL Editor** e rode todo o conteúdo de `supabase/schema.sql`
3. Em **Storage**, crie um bucket privado chamado `anexos-protocolos`

### 2. Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha com a **URL** e a
**chave anon/public** do seu projeto (em Project Settings → API no Supabase —
essas duas são públicas, diferente da senha do banco).

### 3. Rodar localmente (opcional, pra testar antes de subir)
```
npm install
npm run dev
```

### 4. Subir para o GitHub
Crie um repositório vazio no GitHub pela interface web e suba todos esses
arquivos por lá (sem precisar de Git local).

### 5. Deploy no Vercel
1. Importe o repositório no Vercel
2. Em **Environment Variables**, adicione as mesmas duas variáveis do `.env.local`
3. Deploy — a cada novo upload no GitHub, o Vercel atualiza automaticamente

### 6. Primeiro acesso
1. Acesse `/login` → "Criar conta — sou funcionário interno"
2. Seu cadastro fica com `status = 'pendente'`
3. No painel do Supabase (Table Editor → `usuarios`), edite seu próprio
   registro manualmente: defina `papel = 'admin'` e `status = 'ativo'`
   (só dessa primeira vez — depois disso, aprovações podem ser feitas
   por uma tela de administração a construir)
4. Cadastre pelo menos um setor na tabela `setores` (também manual, por ora)
5. Faça login novamente — agora com acesso liberado

## O que já está implementado
- Login / cadastro (interno com aprovação, externo imediato)
- Middleware protegendo `/dashboard/*`
- Nova solicitação (abre protocolo com numeração automática)
- Inbox (lista de protocolos conforme RLS)
- Detalhe do protocolo com thread de despachos
- Formulário de interação com variante interna (escolhe destino + visibilidade)
  e externa (só responde)

## O que falta construir (próximos passos sugeridos)
- Upload de anexos com tipo (hoje só o banco está pronto — falta a tela)
- Tela de administração (setores, tipos, aprovação de cadastros pendentes)
- Fluxo de assinatura eletrônica (visto interno + integração ICP-Brasil)
- Filtros e busca no inbox, abas de favoritos/arquivados
- Bloco de transparência (quem visualizou) na tela de detalhe
