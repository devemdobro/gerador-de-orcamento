# Gerador de orçamentos e propostas por link

## Contexto
Hoje o orçamento de serviços digitais é montado à mão. A ideia é uma aplicação web em que o Ricardo preenche um briefing do cliente, escolhe serviços, vê faixas de preço baseadas nas faixas de referência do Builders Club, ajusta e aprova o valor final, e envia uma página pública por link com botão "Pagar" (Stripe, modo teste). Sem PDF. O diretório do projeto está vazio, então é um projeto novo.

## Decisões já tomadas
- Stack: Next.js (App Router, TypeScript) + Supabase (Postgres) na Vercel.
- Pagamento: o botão "Pagar" cobra **30% do valor único do projeto** (checkout `mode: payment`). Mensalidades e custos repassados ficam só como condições na página.
- Admin: só o Ricardo, senha única em variável de ambiente (`ADMIN_PASSWORD`) + cookie assinado. Páginas públicas ficam abertas.
- Link público: token aleatório (~22 caracteres), proposta **congelada** após aprovação. Mudar valores = nova versão com novo link.
- Idioma pt-BR, moeda BRL.

## Faixas de referência (Builders Club)
Ficam em um único arquivo de dados, `src/config/servicos.ts`, com `min`, `max` (ou `null` para "+"), mensalidade e custos repassados por serviço.

**Valor único do projeto**
| Serviço | Faixa |
|---|---|
| Landing page | R$ 300 a 800 |
| Site simples sem CMS (institucional) | R$ 800 a 2.500 |
| Site com CMS (site + painel administrativo) | R$ 2.500 a 6.000 |
| Site ou sistema complexo | R$ 5.000+ |
| Agente de WhatsApp (setup) | R$ 500 a 1.500 |
| CRM | R$ 5.000+ (decidido: herda a faixa de sistema, pois a referência não traz CRM) |

**Mensalidades** (compromisso mínimo de 3 meses, exibido nas condições)
| Recorrência | Faixa | Vinculada a |
|---|---|---|
| Manutenção do site | R$ 50 a 200/mês | qualquer site e CRM |
| Manutenção do bot (inclui créditos de mensagem/IA) | R$ 100 a 400/mês | agente de WhatsApp |
| Hospedagem gerenciada | R$ 30 a 100/mês | opcional, qualquer serviço |

**Custos repassados** (não entram no preço do Ricardo, aparecem separados)
- Domínio: R$ 40 a 60/ano, quando o cliente não tiver um.
- Hospedagem: Vercel gratuita, então R$ 0. Só vira custo repassado se houver plano pago.
- Créditos de IA/bot: já dentro da mensalidade do bot, então não são uma linha à parte.

**Regras de cálculo derivadas**
- Faixa aberta (`max = null`): o combo exibe "R$ X+" e, para aprovar, o Ricardo precisa digitar um valor final.
- Preço ajustado fora da faixa (abaixo do mín ou acima do máx): aviso visível e justificativa opcional, sem bloquear.
- Valores das faixas usam o ponto médio apenas como sugestão inicial; as perguntas por serviço (páginas, login, integrações) empurram a sugestão entre o mín e o máx.

## Pendências
1. **Premissa a confirmar**: "30% do valor total" = 30% do valor **único** (sem mensalidades e custos repassados). Se for sobre tudo, muda uma linha na etapa 3.
2. **Condições padrão** (validade, o que acontece após o pagamento, multa, revisões): usar texto padrão editável no admin, a revisar pelo Ricardo.

## Modelo de dados (Supabase)
- `propostas`: `id`, `token` (único), `status` (`rascunho` | `aprovada` | `paga`), `versao`, `cliente`, `nicho`, `objetivo`, `descricao`, `prazo_desejado`, `prazo_entrega`, `condicoes`, `total_unico`, `total_mensal`, `total_repassado`, `entrada_valor`, `servicos` (jsonb congelado: itens com escopo, fora do escopo, respostas, entregáveis e preço final), `stripe_session_id`, `criado_em`, `aprovado_em`.
- Rascunho e aprovada ficam na mesma tabela. Ao aprovar, o snapshot em `servicos` é gravado e passa a ser a única fonte da página pública.
- RLS ligado e **sem policy pública**. Tudo passa por rotas do servidor com a service key. O token nunca é listável.

## Etapa 1: Formulário, seleção de serviços e estimativa
- `/admin` (protegido por senha) → `/admin/nova`: campos nome do cliente, nicho, objetivo, descrição, prazo desejado.
- Seleção múltipla de serviços: landing page, site simples sem CMS, site com CMS, site/sistema complexo, agente de WhatsApp, CRM.
- Perguntas por serviço, definidas em `servicos.ts` como dados (tipo `pergunta`, opções, efeito no preço):
  - Sites: nº de páginas, login, integrações, blog, idiomas.
  - CMS: o que o cliente edita, nº de usuários.
  - WhatsApp: volume de atendimento, integração com CRM/agenda, handoff humano.
  - CRM: nº de usuários, funis, integrações.
  - Escopo e "o que fica de fora" por serviço: texto pré-preenchido a partir das respostas, editável.
- Cálculo em uma função pura `calcular(servicos, respostas)` em `src/lib/calculo.ts`: faixa por serviço (mín–máx), faixa do combo, separada em **valor único**, **mensalidades** e **custos repassados** (domínio, hospedagem, API do WhatsApp etc.).
- Ajuste manual do preço de cada item, com totais recalculados ao vivo, e botão "Aprovar valor final".
- Salva como rascunho (no banco), sem gerar link ainda.
- Verificação: teste unitário de `calcular` (combo com 2–3 serviços, ajuste manual, separação das três categorias) e uma passada manual preenchendo o formulário com dados de teste.

## Etapa 2: Salvar proposta aprovada e página pública
- Ação "Aprovar": valida (todos os preços definidos, mín ≤ preço ≤ máx ou justificativa se fora da faixa), congela o snapshot, gera o token, define `status = aprovada` e mostra o link para copiar.
- `/p/[token]` (server component, sem login, `noindex`): cliente, escopo por serviço, o que fica de fora, entregáveis, prazo, valores (único / mensal / repassado), condições e botão "Pagar". Responsivo, mobile primeiro. Token inválido retorna 404.
- Lista simples em `/admin` com as propostas e seus links.
- Verificação: abrir o link em aba anônima e no celular, sem sessão do admin e sem arquivos locais; confirmar que a página lê só do banco.

## Etapa 3: Stripe em modo teste
- Variáveis: `STRIPE_SECRET_KEY` (chave `sk_test_`), `STRIPE_WEBHOOK_SECRET`.
- `POST /api/checkout`: recebe só o token, busca a proposta no banco e cria a Checkout Session com **valor calculado no servidor** (`entrada_valor` = 30% de `total_unico`). O cliente nunca envia o valor. Redireciona para a URL do Stripe.
- `POST /api/stripe/webhook`: valida a assinatura, trata `checkout.session.completed`, marca a proposta como `paga`. Esse é o único caminho que altera o status.
- Páginas de retorno (sucesso e cancelamento) em `/p/[token]`.
- Verificação: pagar com o cartão `4242 4242 4242 4242` e confirmar a mudança de status via `stripe listen` local e via webhook publicado na Vercel; testar o cartão recusado `4000 0000 0000 0002`.

## Estrutura de arquivos prevista
```
src/config/servicos.ts      faixas, perguntas, entregáveis padrão
src/lib/calculo.ts          função pura de cálculo (+ calculo.test.ts)
src/lib/supabase.ts         cliente servidor
src/app/admin/...           login, lista, nova/editar proposta
src/app/p/[token]/page.tsx  página pública
src/app/api/checkout/route.ts
src/app/api/stripe/webhook/route.ts
```

## Deliberadamente fora do escopo
PDF, os 3 pacotes (essencial/completo/premium) da referência, múltiplos usuários, edição de proposta aprovada, assinatura recorrente no Stripe, e-mail automático, expiração de link. Entram depois se fizer falta.
