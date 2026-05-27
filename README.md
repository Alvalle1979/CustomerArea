# Twitter Bikes — My Account

App em Next.js da área de conta dos clientes Twitter Bikes. Autentica usuários via **Customer Account API** da Shopify (OAuth 2.0 + PKCE) e mostra os pedidos do cliente.

## Pré-requisitos no Shopify Admin

1. **Ativar as novas Customer Accounts**
   - Em `Settings → Customer accounts`, escolha **New customer accounts**.

2. **Instalar o app gratuito "Headless"** (da própria Shopify)
   - Em `Apps → Shopify App Store`, busque por **Headless** e instale.

3. **Criar uma storefront e configurar a Customer Account API**
   - Dentro do app Headless, crie uma storefront.
   - Abra a aba **Customer Account API**.
   - Em **Application setup**, configure:
     - **Callback URI(s):** `http://localhost:3000/api/auth/callback`
     - **Javascript origin(s):** `http://localhost:3000`
     - **Logout URI:** `http://localhost:3000`
   - Anote o **Shop ID** (número) e o **Client ID** que aparecem na tela.

## Setup local

```bash
cd shopify-login-app
npm install
cp .env.local.example .env.local
```

Edite `.env.local` e preencha:

```env
SHOPIFY_SHOP_ID=seu-shop-id
SHOPIFY_CLIENT_ID=seu-client-id
APP_URL=http://localhost:3000
SESSION_SECRET=uma-string-aleatoria-bem-longa
```

Inicie o dev server:

```bash
npm run dev
```

Abra `http://localhost:3000` e clique em **Entrar com Shopify**.

## Como funciona

- `GET /api/auth/login` → gera PKCE (verifier/challenge), state, nonce, salva em cookies httpOnly e redireciona para o Shopify.
- O usuário faz login na tela da Shopify.
- Shopify redireciona para `GET /api/auth/callback` com `code` e `state`.
- O callback valida o `state`, troca o `code` pelo `access_token` e grava uma sessão assinada em cookie.
- `/dashboard` lê o cookie, chama a Customer Account API (GraphQL) e mostra o nome do customer.
- `GET /api/auth/logout` apaga o cookie de sessão.

## Estrutura

```
shopify-login-app/
├── app/
│   ├── api/auth/
│   │   ├── login/route.ts        # inicia OAuth
│   │   ├── callback/route.ts     # callback Shopify
│   │   └── logout/route.ts       # logout
│   ├── api/me/route.ts           # endpoint que retorna o customer
│   ├── dashboard/page.tsx        # página protegida
│   ├── page.tsx                  # landing com botão de login
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── shopify-auth.ts           # PKCE, token exchange, GraphQL
│   └── session.ts                # cookie de sessão assinado (HMAC)
└── .env.local.example
```
