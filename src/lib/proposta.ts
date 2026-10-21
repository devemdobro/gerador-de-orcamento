import { SERVICOS } from '@/config/servicos'
import { calcular, type Categoria, type Entrada } from './calculo'

export type Textos = { escopo: string; fora: string; justificativa: string }

/** O que o formulário do admin envia. Preços e totais são sempre recalculados no servidor. */
export type Dados = {
  cliente: string
  nicho: string
  objetivo: string
  descricao: string
  prazo_desejado: string
  prazo_entrega: string
  condicoes: string
  /** texto livre: o que será repassado ao cliente e valores aproximados */
  repassados: string
  entrada: Entrada
  textos: Record<string, Textos>
}

export type ItemSnapshot = {
  id: string
  nome: string
  categoria: Categoria
  preco: number
  min: number
  max: number | null
  foraDaFaixa: boolean
  justificativa: string
  escopo: string
  fora: string
  entregaveis: string[]
}

/** Gravado em `propostas.servicos`: a página pública lê só isto. `form` permite reabrir o rascunho. */
export type Snapshot = {
  itens: ItemSnapshot[]
  repassados?: string
  form?: { entrada: Entrada; textos: Dados['textos']; repassados: string }
}

export function montarSnapshot(d: Dados): { snapshot: Snapshot; unico: number; mensal: number; repassado: number } | { erro: string } {
  const r = calcular(d.entrada)
  if (!r.itens.length) return { erro: 'Escolha ao menos um serviço.' }
  if (!r.completo) return { erro: 'Defina o valor final de todos os itens (faixas abertas exigem valor digitado).' }
  if (r.itens.some((i) => !(i.preco! > 0) || !Number.isFinite(i.preco!))) return { erro: 'Os valores precisam ser maiores que zero.' }
  const itens: ItemSnapshot[] = r.itens.map((i) => {
    const t = d.textos[i.id]
    const servico = SERVICOS.find((s) => s.id === i.id)
    return {
      id: i.id,
      nome: i.nome,
      categoria: i.categoria,
      preco: i.preco!,
      min: i.min,
      max: i.max,
      foraDaFaixa: i.foraDaFaixa,
      justificativa: t?.justificativa.trim() ?? '',
      escopo: t?.escopo.trim() ?? '',
      fora: t?.fora.trim() ?? '',
      entregaveis: servico?.entregaveis ?? [],
    }
  })
  return {
    snapshot: { itens, repassados: d.repassados.trim(), form: { entrada: d.entrada, textos: d.textos, repassados: d.repassados } },
    unico: r.unico.final!,
    mensal: r.mensal.final ?? 0,
    repassado: r.repassado.final ?? 0,
  }
}
