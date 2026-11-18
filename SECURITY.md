# Segurança: pendências

Auditoria `/cso` de 2026-11-04: nenhuma vulnerabilidade confirmada. Os itens abaixo são endurecimento, em ordem de prioridade.

## Para corrigir

### 1. Limitar tentativas de login no admin
`entrar` em [src/app/admin/actions.ts](src/app/admin/actions.ts) aceita tentativas ilimitadas. Com senha fraca, dá para adivinhar por força bruta.
- Agora: `ADMIN_PASSWORD` longa e aleatória (20+ caracteres) na Vercel.
- Depois: limitar por IP (ex.: 5 tentativas a cada 15 min) ou atrasar cada senha errada.

### 2. Logout e revogação de sessão
O cookie `admin` vale 7 dias e não há como encerrar a sessão. Se ele vazar, a única saída é trocar `SESSION_SECRET` na Vercel, o que derruba todas as sessões.
- Criar uma action `sair` que apaga o cookie, com um botão no `/admin`.

### 3. Headers de segurança
O [next.config.js](next.config.js) está vazio. Adicionar via `headers()`:
- `X-Frame-Options: DENY` (impede que a página de pagamento seja embutida em outro site)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` básica (testar se não quebra o checkout do Stripe)

### 4. URL do site sem depender do Host da requisição
Em [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts), se `NEXT_PUBLIC_SITE_URL` faltar, as URLs de retorno do Stripe usam o Host da requisição.
- Confirmar que `NEXT_PUBLIC_SITE_URL` está definida em produção na Vercel.
- Melhor ainda: retornar erro em vez de usar o fallback quando a variável faltar.

## Não é segurança, mas é pagamento
O webhook só marca como paga quando o evento `checkout.session.completed` chega com `payment_status === 'paid'`. Se boleto ou Pix assíncrono forem ativados no Stripe, também é preciso tratar `checkout.session.async_payment_succeeded`, ou essas propostas nunca ficam como pagas.

## Ainda não verificado
- Variáveis de ambiente nos deploys de preview da Vercel: os previews não devem usar as chaves de produção do Stripe nem do Supabase.
- No painel do Supabase: confirmar que o RLS está ligado e que `anon` não tem acesso à tabela `propostas`.
- No painel do Stripe: o webhook aponta para a URL de produção e o `STRIPE_WEBHOOK_SECRET` bate com ele.
