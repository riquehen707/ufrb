# CAMPUS

Rede universitaria para estudantes comprarem, venderem, oferecerem servicos e resolverem a vida no campus com anuncios reais.

## O que esta pronto

- Catalogo mobile-first com trilhos por categoria
- Cadastro real com Supabase Auth
- Sessao renovada via `proxy.ts` no Next 16
- Perfis publicos, chat e reputacao
- Manifest, icones, service worker e tela offline
- Callback `/auth/callback` para login e criacao de conta
- `supabase/schema.sql` com `profiles`, `listings`, `marketplace_orders`, `marketplace_reviews`, `housing_reviews`, `marketplace_conversations` e `token_transactions`
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
NEXT_PUBLIC_SUPABASE_LISTING_BUCKET=listing-media
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
PICPAY_CLIENT_ID=
PICPAY_CLIENT_SECRET=
PICPAY_WEBHOOK_TOKEN=
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
4. Copie a URL do projeto e a anon/publishable key para `.env.local` e para a Vercel.
5. Defina `SUPABASE_SERVICE_ROLE_KEY` apenas nos ambientes de servidor.

Observacao: o catalogo so exibe anuncios reais da tabela `listings`. Se ela estiver vazia, a interface mostra o estado vazio.

## Tokens

- Usuario novo recebe `5` tokens iniciais no trigger de criacao de conta.
- Plano `free` recebe `3` tokens por mes e plano `pro` recebe `40` tokens por mes.
- `token_transactions` guarda todo credito e debito.
- Criacao, renovacao e destaque de anuncio passam por RPCs transacionais no banco.
- `subscriptions` e `payments` deixaram a base pronta para plugar checkout do plano Pro.
- `POST /api/payments/create` cria cobranca avulsa de pacote de tokens via PicPay.
- `POST /api/subscriptions/create` cria assinatura Pro.
- `POST /api/webhooks/picpay` confirma pagamento e credita tokens.

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure as variaveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `NEXT_PUBLIC_SUPABASE_LISTING_BUCKET`
   - `NEXT_PUBLIC_SITE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PICPAY_CLIENT_ID`
   - `PICPAY_CLIENT_SECRET`
   - `PICPAY_WEBHOOK_TOKEN`
3. Faca o deploy.

Com HTTPS ativo, o navegador passa a habilitar instalacao PWA normalmente.

## PicPay

- Pacotes avulsos:
  - `5` tokens = `R$ 4,90`
  - `15` tokens = `R$ 9,90`
  - `40` tokens = `R$ 19,90`
- Plano `Pro`:
  - `R$ 19,90/mes`
  - `40` tokens por ciclo pago
  - selo visual no perfil
  - prioridade moderada nos anuncios

Webhook recomendado no painel do PicPay:

```txt
https://SEU-DOMINIO/api/webhooks/picpay
```
