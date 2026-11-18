# DESIGN.md — Gerador de orçamentos (identidade Dobro Solutions)

Status: **aplicado** em `globals.css`, `layout.tsx`, `/admin`, `/admin/login`, `Formulario.tsx` e `/p/[token]`. Substitui a versão anterior (tema claro, Geist, azul `#1d4ed8`).

Fonte: medições do site dobrosolutions.com.br (estilos computados, nov/2026). Valores marcados com **(medido)** vêm direto do site. Os marcados com **(derivado)** não existem lá, porque o site não tem formulário nem estado de erro, e foram criados a partir dos tokens medidos.

Superfícies do produto:
- **Admin** (`/admin`, `/admin/nova`, `/admin/editar/[id]`, `/admin/login`): criar, revisar e aprovar orçamentos.
- **Proposta pública** (`/p/[token]`): o cliente lê, entende o valor e paga a entrada. É a peça que leva a marca até o cliente.

Stack mantida: CSS global único (`src/app/globals.css`) com tokens em `:root`, fontes via `next/font/google` (já vem no Next), nenhum pacote novo.

---

## 1. Princípios

1. **Escuro, profundo, com uma luz azul.** Fundo quase preto com um brilho índigo suave no topo, como no site. É a assinatura da marca e vale nas duas superfícies.
2. **Display para números e títulos, texto humano para leitura.** Space Grotesk em títulos, valores e rótulos; Plus Jakarta Sans em parágrafos, campos e botões.
3. **O número é o herói.** No site, as métricas aparecem em número grande com legenda pequena. Na proposta, o valor único segue esse padrão.
4. **Rótulo (kicker) antes do título.** Caixa alta, espaçado, índigo claro, com um traço antes (`—— A RESPOSTA`). No formulário vira `01 Briefing … 04 Condições`.
5. **Cards de vidro escuro.** Gradiente branco quase imperceptível, borda branca a 8%, sombra longa para baixo. Nada de cards sólidos cinza.
6. **Um botão com luz.** O primário é o único elemento com gradiente e brilho azul. Tudo o mais é neutro.
7. **Selecionado = fundo índigo 14% + barra à esquerda.** Mesmo padrão do item ativo no menu do Dobro OS.
8. **Cor semântica só em estado.** Verde para pago e sucesso, âmbar para aviso, vermelho para erro. A paleta de ícones do site (rosa, céu, âmbar) não entra.

O que **não** vem do site: animação ao rolar, grade de fundo do hero, mockups de chat e o header de vidro fixo com navegação (o app não tem menu).

---

## 2. Paleta (tokens)

Tema único escuro (`color-scheme: dark`), como o site. Os nomes seguem o padrão em português já usado no projeto.

| Token | Valor | Origem | Uso |
|---|---|---|---|
| `--fundo` | `#0a0a0f` | medido (`body`) | fundo da página |
| `--brilho` | `radial-gradient(ellipse 80% 60% at 50% -10%, rgb(79 107 255 / .12), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 20%, rgb(79 107 255 / .05), transparent 50%)` | medido (CSS do `body`) | `background-image` do `body`, com `background-attachment: fixed` (o brilho fica parado enquanto a página rola) |
| `--superficie` | `#0e0e15` | medido (pílula "Lead qualificado") | barra de ações fixa, campos, menus nativos |
| `--card` | `linear-gradient(rgb(255 255 255 / .024), rgb(255 255 255 / .01))` | medido (`.card`) | fundo de todos os cards |
| `--borda` | `rgb(255 255 255 / .08)` | medido (`.card`) | cards, divisórias |
| `--borda-forte` | `rgb(255 255 255 / .12)` | medido (pílulas) | campos, botão secundário, badges |
| `--texto` | `#fafafa` | medido (`body`) | títulos, valores, labels |
| `--texto-corpo` | `#cdd2da` | medido (`p`) | texto longo: escopo, condições, descrição |
| `--texto-suave` | `#9aa1ac` | medido (item inativo do Dobro OS) | ajuda, faixa de referência, legenda dos totais, rótulos pequenos |
| `--acao` | `#4f6bff` | medido (`--color-primary`) | anel de foco, borda do selecionado, barra do item ativo |
| `--acao-gradiente` | `linear-gradient(#5e78ff, #4253e0)` | medido (`.cta-btn-primary`) | fundo do botão primário |
| `--acao-texto` | `#8aa0ff` | medido (`.section-kicker`) | links, kicker, badge "aprovada" |
| `--acao-destaque` | `#b6c2ff` | medido (palavra destacada no `h1`) | palavra de destaque em título (máx. uma por tela) |
| `--acao-suave` | `rgb(79 107 255 / .14)` | medido (item ativo do Dobro OS) | fundo do serviço marcado, alerta informativo |
| `--sobre-acao` | `#ffffff` | medido | texto do botão primário |
| `--sucesso` | `#34d399` | medido (indicadores verdes) | pago, salvo, aprovado |
| `--aviso` | `#fcd34d` | medido (paleta do site) | fora da faixa, pagamento cancelado |
| `--erro` | `#f87171` | **derivado** (o site não tem erro) | erros de ação e de login |

**Contraste (sobre `--fundo`):** `--texto` 19:1, `--texto-corpo` 13:1, `--texto-suave` 7,4:1, `--acao-texto` 7,6:1, `--sucesso` 10:1, `--aviso` 14:1, `--erro` 7,4:1.

**Base do `body` (medido):** `background-color: var(--fundo)`, `background-image: var(--brilho)`, `background-attachment: fixed`, `min-height: 100dvh`, `-webkit-font-smoothing: antialiased`, `color: var(--texto)`.

**Variáveis do CSS do site que ficam de fora:** o `:root` do site também declara `--primary: #ea407f` (rosa), `--primary-light`, `--grayscale-*`, `--semantic-*`, `--success: #00CB49`, `--error: #FF3B30` e as escalas `--size-*` e `--font-size-*`. Nenhuma regra da página usa essas variáveis (conferido no navegador): são sobra de outro template e não fazem parte da identidade visível. `--color-primary-dark: #3d56e6` aparece em um único elemento e também não entra.

**Duas cores do site que não usamos em texto:**
- `#6b7280` (o `text-muted` do site): dá ~4,2:1 sobre o fundo, abaixo dos 4,5:1 exigidos para texto de 12–14px. Fica `--texto-suave` (`#9aa1ac`) no lugar dele.
- `#4f6bff` puro como cor de texto: ~4,6:1, no limite. Para texto usamos `--acao-texto`. O `#4f6bff` fica para bordas, foco e preenchimentos.

---

## 3. Tipografia

| Família | Origem | Variável | Onde |
|---|---|---|---|
| **Space Grotesk** (500, 600, 700) | medido (`h1`, `h2`, kicker, métricas) | `--fonte-display` | títulos, valores em R$, kickers, rótulos, numeração das etapas, badges |
| **Plus Jakarta Sans** (400, 600) | medido (`body`, botões, `p`) | `--fonte-texto` | corpo, campos, labels, botões |

Carregadas em `layout.tsx` com `next/font/google` e `variable` (`--fonte-display`, `--fonte-texto`). Todo valor em R$ usa `font-variant-numeric: tabular-nums`.

A escala do site é de marketing (h1 de 64px). Abaixo está a versão para app, mantendo pesos, tracking e proporções medidos:

| Token | Família / peso | Tamanho | Tracking | Uso real |
|---|---|---|---|---|
| `--t-kicker` | Display 600, caixa alta | 12px | `.14em` (medido 1,68px) | `—— Proposta comercial`, `01 Briefing` |
| `--t-rotulo` | Display 500, caixa alta | 11px | `.14em` (medido; o site usa 9px, subimos para 11 por legibilidade) | legendas: "Valor único do projeto", "Escopo", "Entregáveis" |
| `--t-pequeno` | Texto 400 | 14px | normal | ajuda, faixa de referência, `v1`, microcopy do pagamento |
| `--t-base` | Texto 400, `line-height: 1.6` | 16px | normal | corpo, campos (16px evita zoom no iOS) |
| `--t-botao` | Texto 600 | 15px | `-.01em` (medido −0,15px) | todos os botões |
| `--t-titulo-3` | Display 600 | 18px | `-.025em` (medido) | nome do serviço no card, nome do cliente na lista |
| `--t-titulo-2` | Display 700, `line-height: 1.1` | 24px | `-.03em` (medido) | `h2`: Briefing, Serviços, Condições, Pagamento |
| `--t-titulo-1` | Display 700, `line-height: 1` | `clamp(2rem, 1.4rem + 2.4vw, 2.75rem)` | `-.035em` (medido −2,24px/64px) | `h1`: "Propostas", "Nova proposta", "Proposta para {cliente}" |
| `--t-numero` | Display 700, tabular | `clamp(2.5rem, 1.8rem + 3vw, 3.5rem)` | `-.035em` | valor único na proposta |

---

## 4. Espaçamento

Base 4. Só os passos com uso:

| Token | Valor | Uso |
|---|---|---|
| `--e-1` | 4px | label → campo, legenda → número |
| `--e-2` | 8px | gap do checkbox, ponto do badge, traço do kicker |
| `--e-3` | 12px | gap de `.linha`, entre campos, padding vertical do campo |
| `--e-4` | 16px | margem lateral no celular, padding do alerta |
| `--e-6` | 24px | padding do card (celular), padding horizontal do botão (medido), entre cards |
| `--e-8` | 32px | padding do card (≥640px, medido `lg:p-8`), entre etapas (celular) |
| `--e-16` | 64px | entre etapas (≥640px), topo da página |

Largura de conteúdo: `--largura: 760px` (a mesma de hoje).

---

## 5. Raios, bordas e sombras

| Token | Valor | Origem | Uso |
|---|---|---|---|
| `--r-botao` | 10px | medido | botões |
| `--r-campo` | 12px | medido (FAQ, cards internos) | inputs, selects, textareas |
| `--r-compacto` | 14px | medido (cards de métrica) | itens da lista, opções de serviço, itens de valor, alertas |
| `--r-card` | 24px | medido (`.card`) | resumo de totais, serviço na proposta, card de login |
| `--r-pilula` | 999px | medido | badges |
| `--sombra-card` | `inset 0 1px 0 rgb(255 255 255 / .04), 0 30px 60px -30px rgb(0 0 0 / .5)` | medido | todos os cards |
| `--sombra-botao` | `inset 0 1px 0 rgb(255 255 255 / .18), 0 0 0 1px rgb(79 107 255 / .4), 0 10px 24px -10px rgb(79 107 255 / .55)` | medido | botão primário |
| `--ease` | `cubic-bezier(.16, 1, .3, 1)` | medido (`--ease-premium`) | todas as transições, 200ms |

Bordas sempre de 1px. Foco: `outline: 2px solid var(--acao); outline-offset: 2px`.

---

## 6. Botões e campos

### Botões

| Variação | Classe | Aparência | Uso real |
|---|---|---|---|
| Primário | `button`, `.btn` | `--acao-gradiente` + `--sombra-botao`, texto branco | Nova proposta, Entrar, Aprovar valor final, Copiar link, Pagar entrada |
| Secundário (derivado) | `button.sec` | fundo `rgb(255 255 255 / .04)`, borda `--borda-forte`, texto `--texto` | Salvar rascunho |
| Link | `a` | `--acao-texto`, sublinhado no hover | Editar rascunho, Voltar à lista, link da proposta |

```css
button, .btn {
  min-height: 44px; padding: var(--e-3) var(--e-6);
  border: 0; border-radius: var(--r-botao);
  background: var(--acao-gradiente); box-shadow: var(--sombra-botao); color: var(--sobre-acao);
  font: 600 var(--t-botao)/1.2 var(--fonte-texto); letter-spacing: -.01em;
  transition: filter 200ms var(--ease), transform 200ms var(--ease);
}
button:hover, .btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
button:active, .btn:active { transform: translateY(0); filter: brightness(.96); }
button.sec { background: rgb(255 255 255 / .04); box-shadow: inset 0 0 0 1px var(--borda-forte); color: var(--texto); }
button:disabled { opacity: .45; filter: none; transform: none; cursor: not-allowed; }
```

### Campos (derivados: o site não tem formulário)

```css
label { display: block; margin: var(--e-3) 0 var(--e-1); font: 600 var(--t-pequeno)/1.4 var(--fonte-texto); color: var(--texto); }
input, select, textarea {
  width: 100%; min-height: 44px; padding: var(--e-3);
  background: var(--superficie); color: var(--texto);
  border: 1px solid var(--borda-forte); border-radius: var(--r-campo);
  font: var(--t-base)/1.5 var(--fonte-texto);
}
input::placeholder, textarea::placeholder { color: var(--texto-suave); }
input:hover, select:hover, textarea:hover { border-color: rgb(255 255 255 / .2); }
input:focus-visible, select:focus-visible, textarea:focus-visible { border-color: var(--acao); outline: 2px solid var(--acao-suave); outline-offset: 0; }
input[type=number] { font-variant-numeric: tabular-nums; }
input[type=date] { color-scheme: dark; }
```

---

## 7. Componentes

### 7.1 Kicker + título
```tsx
<p className="kicker">Proposta comercial</p>
<h1>Proposta para {p.cliente}</h1>
```
```css
.kicker { display: flex; align-items: center; gap: var(--e-2); margin: 0 0 var(--e-3);
  font: 600 var(--t-kicker)/1 var(--fonte-display); letter-spacing: .14em; text-transform: uppercase; color: var(--acao-texto); }
.kicker::before { content: ''; width: 24px; height: 1px; background: currentColor; }
```
Usado: topo da proposta, login ("Admin"), lista ("Painel").

### 7.2 Etapa numerada (formulário)
O número segue o `num-marker` do site: Display 600, 12px, índigo a 60%.
```tsx
<section className="etapa"><span className="num">01</span><h2>Briefing</h2>…</section>
```
```css
.etapa { margin-top: var(--entre-etapas); }
.num { display: block; margin-bottom: var(--e-1); font: 600 12px/1 var(--fonte-display); color: rgb(79 107 255 / .6); }
```
O número é decorativo: o `h2` ao lado carrega o significado. Por isso o contraste baixo é aceitável.

### 7.3 Card
```css
.card { background: var(--card); border: 1px solid var(--borda); border-radius: var(--r-card); box-shadow: var(--sombra-card); padding: var(--e-6); }
@media (min-width: 640px) { .card { padding: var(--e-8); } }
.card.compacto { border-radius: var(--r-compacto); padding: var(--e-4) var(--e-6); }
```
- `--r-card` (24px): resumo de totais, serviço na proposta, login.
- `.compacto` (14px): itens da lista, opções de serviço, itens de valor. Eles se repetem em coluna, e 24px em bloco empilhado fica pesado.

### 7.4 Opção de serviço (selecionável)
Padrão do item ativo do Dobro OS: fundo índigo 14% e barra de 2px à esquerda.
```css
.card:has(> .check input:checked) { background: var(--acao-suave); border-color: rgb(79 107 255 / .6); box-shadow: inset 2px 0 0 var(--acao), var(--sombra-card); }
.check input { accent-color: var(--acao); }
```

### 7.5 Linha de valor
```css
.linha { display: flex; gap: var(--e-3); flex-wrap: wrap; align-items: baseline; justify-content: space-between; }
.valor { font-family: var(--fonte-display); font-weight: 600; font-variant-numeric: tabular-nums; color: var(--texto); }
```

### 7.6 Resumo de totais (proposta)
O padrão número + legenda das métricas do site, em escala de destaque.
```tsx
<div className="card resumo">
  <p className="rotulo">Valor único do projeto</p>
  <p className="numero">{brl(total_unico)}</p>
  <div className="linha"><span>Entrada (30%)</span><span className="valor">{brl(entrada_valor)}</span></div>
</div>
```
```css
.rotulo { margin: 0; font: 500 var(--t-rotulo)/1.4 var(--fonte-display); letter-spacing: .14em; text-transform: uppercase; color: var(--texto-suave); }
.numero { margin: var(--e-2) 0 var(--e-6); font: 700 var(--t-numero)/1 var(--fonte-display); letter-spacing: -.035em; font-variant-numeric: tabular-nums; }
.resumo .linha + .linha { border-top: 1px solid var(--borda); padding-top: var(--e-3); margin-top: var(--e-3); }
```

### 7.7 Barra de ações fixa (formulário)
Mesma função de hoje. O header do site é de vidro translúcido (`rgba(10,10,15,.78)` + desfoque), mas aqui o fundo é opaco (`--fundo`): com vidro, o texto dos campos que passam por baixo vazava pela barra (testado com `.78` e `.94`).
```css
.acoes { position: sticky; bottom: 0; background: var(--fundo); border-top: 1px solid var(--borda); }
.acoes .valor { font-size: var(--t-titulo-2); }
```

### 7.8 Badge de status
Mesmo desenho da pílula "3 agentes ativos": borda clara, fundo escuro, ponto colorido.
```tsx
<span className="badge" data-status={p.status}>{p.status}</span>
```
```css
.badge { display: inline-flex; align-items: center; gap: var(--e-2); padding: 2px 10px; border: 1px solid var(--borda-forte); border-radius: var(--r-pilula); background: var(--superficie);
  font: 500 12px/1.6 var(--fonte-display); color: var(--texto-corpo); }
.badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--texto-suave); }
.badge[data-status=aprovada]::before { background: var(--acao-texto); }
.badge[data-status=paga]::before { background: var(--sucesso); }
```

### 7.9 Alerta
```css
.alerta { --c: var(--acao); padding: var(--e-3) var(--e-4); border-radius: var(--r-compacto);
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); background: color-mix(in srgb, var(--c) 12%, transparent); color: var(--texto); }
.alerta[data-tipo=sucesso] { --c: var(--sucesso); }
.alerta[data-tipo=aviso] { --c: var(--aviso); }
.alerta[data-tipo=erro] { --c: var(--erro); }
.aviso { color: var(--aviso); font-size: var(--t-pequeno); }
```

### 7.10 Marca na proposta (novo, a confirmar)
Wordmark "Dobro Solutions" em texto (Space Grotesk 700, 18px, `--texto`) no topo da proposta pública, como no header do site. Sem imagem de logo: o site também usa só texto. Mostra ao cliente quem enviou.

---

## 8. Estados

Os mesmos da versão atual. Só muda a aparência:

| Estado | Onde | Como aparece |
|---|---|---|
| Carregando | Login, salvar, aprovar | botão desabilitado (`opacity .45`) com "Entrando…", "Salvando…" ou "Aprovando…"; formulário com `fieldset` desabilitado |
| Vazio | Lista sem propostas | card com "Nenhuma proposta ainda." + botão primário "Criar primeira proposta" |
| | Etapa 03 sem serviço | texto `--texto-suave`: "Marque um serviço em 02 para ver os valores." |
| Erro | Login, salvar, aprovar | `.alerta[data-tipo=erro]`, `role="alert"` |
| | Pagamento cancelado | `.alerta[data-tipo=aviso]` |
| | Fora da faixa | `.aviso` inline + justificativa opcional |
| Sucesso | Rascunho salvo, aprovada (com link e "Copiar link" → "Link copiado") | `.alerta[data-tipo=sucesso]` |
| | Aguardando confirmação | `.alerta` (índigo) |
| | Entrada paga | `.alerta[data-tipo=sucesso]` no lugar do botão |

---

## 9. Movimento

- 200ms com `--ease` (curva medida do site) em `filter`, `transform`, `border-color` e `background`.
- Botão: sobe 1px e clareia no hover, volta ao pressionar. Card de serviço: a borda acende ao marcar.
- Nada anima ao rolar. O site anima seções na entrada; num app de trabalho isso só atrasa a leitura.
- `@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`

---

## 10. Responsivo

Um breakpoint: **640px**.

| | < 640px | ≥ 640px |
|---|---|---|
| Margem lateral | 16px | 24px |
| Padding do card | 24px | 32px |
| Entre etapas | 32px | 64px |
| Barra de ações | total em cima, botões de largura total empilhados | uma linha |
| `h1` / número | limite inferior do `clamp` (32px / 40px) | até 44px / 56px |

Regras fixas: alvos de toque ≥ 44px, campos de 16px, links longos com `word-break: break-all`, `env(safe-area-inset-bottom)` na barra fixa, `backdrop-filter` com fundo de fallback já opaco o suficiente (`.78`).

---

## 11. Plano de aplicação

1. `layout.tsx`: trocar Geist por Space Grotesk + Plus Jakarta Sans (`next/font/google`, com `variable`).
2. `globals.css`: trocar os valores dos tokens e acrescentar `--card`, `--sombra-*`, `--acao-gradiente`, `--acao-texto`, `--acao-suave`, `--texto-corpo` e `--ease`. A maioria das classes atuais continua; entram `.kicker`, `.num`, `.compacto` e o ponto do `.badge`.
3. Telas: aplicar `.kicker`, `.num`, `.compacto` e `.rotulo` onde a seção 7 indica. A lógica não muda.
4. Opcional: wordmark na proposta (7.10).
5. Verificação: `npm test`, `next build`, capturas em 390 e 1440 das quatro telas.
