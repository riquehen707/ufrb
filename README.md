# CAMPUS

Marketplace PWA para estudantes universitários comprarem, venderem e oferecerem serviços com a cara da vida no campus.

## O que esta pronto

- Home moderna e responsiva com UX mobile-first
- Cadastro real com Supabase Auth
- Sessao renovada via `proxy.ts` no Next 16
- Fallback local para feed de anuncios quando o banco ainda nao estiver populado
- Manifest, icones, service worker e tela offline
- Callback `/auth/callback` para confirmacao por e-mail
- `supabase/schema.sql` com `profiles`, `listings`, `donations`, trigger e RLS
- Projeto preparado para deploy na Vercel

## Rodando localmente

1. Instale dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
DONATION_WEBHOOK_SECRET=
PICPAY_CLIENT_ID=
PICPAY_CLIENT_SECRET=
PICPAY_WEBHOOK_TOKEN=
PICPAY_API_BASE_URL=https://checkout-api.picpay.com
```

3. Execute o projeto:

```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000).

## Setup do Supabase

1. Crie um projeto no Supabase.
2. Rode o SQL de `supabase/schema.sql` no SQL Editor.
3. Em `Authentication > URL Configuration`, adicione:
   - `http://localhost:3000/auth/callback`
   - `https://SEU-DOMINIO/auth/callback`
4. Copie a URL do projeto e a publishable/anon key para `.env.local` e para a Vercel.
5. Para confirmacao de doacoes, configure tambem:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DONATION_WEBHOOK_SECRET`
   - `PICPAY_CLIENT_ID`
   - `PICPAY_CLIENT_SECRET`
   - `PICPAY_WEBHOOK_TOKEN`

Observacao: o feed so exibe anuncios reais da tabela `listings`. Se ela estiver vazia, a interface mostra o estado vazio do catalogo.

## Doacoes confirmadas

- `POST /api/donations` registra um apoio em `pending` e gera uma referencia.
- `POST /api/donations/confirm` confirma ou cancela a doacao.
- `POST /api/donations/picpay/webhook` recebe a notificacao automatica do PicPay.
- Quando a doacao entra como `confirmed`, o trigger atualiza `support_balance` e `support_count` no perfil do apoiador.
- A rota de confirmacao espera o header `x-donation-webhook-secret`.

## PicPay

1. Gere `client_id` e `client_secret` no painel do PicPay.
2. Configure a URL de notificacao como:
   - `https://SEU-PROJETO.vercel.app/api/donations/picpay/webhook`
3. Salve o token de autenticacao exibido pelo PicPay em `PICPAY_WEBHOOK_TOKEN`.
4. Adicione `PICPAY_CLIENT_ID`, `PICPAY_CLIENT_SECRET` e `PICPAY_WEBHOOK_TOKEN` na Vercel.

Observacoes:
- O formulario pede `e-mail`, `CPF` e `celular` quando o Pix do PicPay estiver ativo.
- Sem dominio proprio, voce pode usar a URL `*.vercel.app` normalmente.

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure as variaveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DONATION_WEBHOOK_SECRET`
   - `PICPAY_CLIENT_ID`
   - `PICPAY_CLIENT_SECRET`
   - `PICPAY_WEBHOOK_TOKEN`
3. Faca o deploy.

Com HTTPS ativo, o navegador passa a habilitar instalacao PWA normalmente.
