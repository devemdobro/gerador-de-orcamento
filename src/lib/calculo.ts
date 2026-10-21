import { ENTRADA_PERCENTUAL, MENSAIS, REPASSADOS, SERVICOS, type ServicoId } from '@/config/servicos'

export type Categoria = 'unico' | 'mensal' | 'repassado'

export type Entrada = {
  servicos: ServicoId[]
  /** respostas[servico][pergunta] = valor da opção */
  respostas: Partial<Record<ServicoId, Record<string, string>>>
  /** preço final ajustado à mão, por id de item (serviço, mensalidade ou custo repassado) */
  ajustes: Record<string, number | undefined>
  extras: { hospedagem: boolean; dominio: boolean }
}

export type Item = {
  id: string
  nome: string
  categoria: Categoria
  min: number
  max: number | null
  /** ponto de partida (ajustado pelas respostas); null em faixa aberta */
  sugestao: number | null
  /** ajuste manual, senão a sugestão; null = ainda precisa ser digitado */
  preco: number | null
  foraDaFaixa: boolean
}

export type Total = { min: number; max: number | null; final: number | null }

export type Resultado = {
  itens: Item[]
  unico: Total
  mensal: Total
  repassado: Total
  /** todos os itens têm preço definido */
  completo: boolean
}

const arredonda10 = (n: number) => Math.round(n / 10) * 10

function sugerir(min: number, max: number | null, pesos: number[]): number | null {
  if (max === null) return null
  const peso = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : 0.5
  return arredonda10(min + (max - min) * peso)
}

function pesosRespondidos(id: ServicoId, respostas: Entrada['respostas']): number[] {
  const servico = SERVICOS.find((s) => s.id === id)!
  const r = respostas[id] ?? {}
  return servico.perguntas.flatMap((p) => {
    const opcao = p.opcoes.find((o) => o.valor === r[p.id])
    return opcao ? [opcao.peso] : []
  })
}

function montarItem(
  base: { id: string; nome: string; min: number; max: number | null },
  categoria: Categoria,
  sugestao: number | null,
  ajuste: number | undefined,
): Item {
  const preco = ajuste ?? sugestao
  const foraDaFaixa = preco !== null && (preco < base.min || (base.max !== null && preco > base.max))
  return { ...base, categoria, sugestao, preco, foraDaFaixa }
}

function total(itens: Item[]): Total {
  const precos = itens.map((i) => i.preco)
  return {
    min: itens.reduce((a, i) => a + i.min, 0),
    max: itens.some((i) => i.max === null) ? null : itens.reduce((a, i) => a + (i.max as number), 0),
    final: precos.some((p) => p === null) ? null : (precos as number[]).reduce((a, p) => a + p, 0),
  }
}

export function calcular({ servicos, respostas, ajustes, extras }: Entrada): Resultado {
  const escolhidos = SERVICOS.filter((s) => servicos.includes(s.id))
  const itens: Item[] = [
    ...escolhidos.map((s) =>
      montarItem(s, 'unico', sugerir(s.min, s.max, pesosRespondidos(s.id, respostas)), ajustes[s.id]),
    ),
    ...MENSAIS.filter((m) =>
      m.vinculo === 'opcional' ? extras.hospedagem : escolhidos.some((s) => m.vinculo.includes(s.id)),
    ).map((m) => montarItem(m, 'mensal', sugerir(m.min, m.max, []), ajustes[m.id])),
    ...REPASSADOS.filter((r) => r.id === 'dominio' && extras.dominio).map((r) =>
      montarItem(r, 'repassado', sugerir(r.min, r.max, []), ajustes[r.id]),
    ),
  ]
  const por = (c: Categoria) => itens.filter((i) => i.categoria === c)
  return {
    itens,
    unico: total(por('unico')),
    mensal: total(por('mensal')),
    repassado: total(por('repassado')),
    completo: itens.length > 0 && itens.every((i) => i.preco !== null),
  }
}

/** Texto de escopo pré-preenchido a partir das respostas (editável no admin). */
export function escopoPadrao(id: ServicoId, respostas: Entrada['respostas']): string {
  const servico = SERVICOS.find((s) => s.id === id)!
  const r = respostas[id] ?? {}
  const linhas = servico.perguntas.flatMap((p) => {
    const escopo = p.opcoes.find((o) => o.valor === r[p.id])?.escopo
    return escopo ? [`- ${escopo}`] : []
  })
  return [servico.escopoBase, ...linhas].join('\n')
}

/** Entrada em centavos: 30% do valor único, calculado sempre no servidor. */
export const entradaCentavos = (totalUnico: number) => Math.round(totalUnico * 100 * ENTRADA_PERCENTUAL)
