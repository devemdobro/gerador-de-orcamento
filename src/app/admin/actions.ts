'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { criarSessao, encerrarSessao, exigirAdmin, senhaCorreta } from '@/lib/auth'
import { entradaCentavos } from '@/lib/calculo'
import { montarSnapshot, type Dados } from '@/lib/proposta'
import { supabase } from '@/lib/supabase'

// shortcut: contador em memória por instância serverless (não é global entre instâncias), upgrade: tabela no Supabase se houver ataque real
const falhas = new Map<string, { n: number; ate: number }>()
const MAX_FALHAS = 5
const JANELA_MS = 15 * 60e3

export async function entrar(_: unknown, form: FormData) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || 'desconhecido'
  const agora = Date.now()
  const f = falhas.get(ip)
  const atual = f && f.ate > agora ? f : { n: 0, ate: agora + JANELA_MS }
  if (atual.n >= MAX_FALHAS) return 'Muitas tentativas. Aguarde 15 minutos.'

  if (!senhaCorreta(String(form.get('senha') ?? ''))) {
    if (falhas.size > 1000) falhas.clear()
    falhas.set(ip, { ...atual, n: atual.n + 1 })
    await new Promise((r) => setTimeout(r, 1000)) // atrasa cada erro
    return 'Senha incorreta.'
  }
  falhas.delete(ip)
  await criarSessao()
  redirect('/admin')
}

export async function sair() {
  await encerrarSessao()
  redirect('/admin/login')
}

const campos = (d: Dados) => ({
  cliente: d.cliente.trim(),
  nicho: d.nicho,
  objetivo: d.objetivo,
  descricao: d.descricao,
  prazo_desejado: d.prazo_desejado,
  prazo_entrega: d.prazo_entrega,
  condicoes: d.condicoes,
})

type Retorno = { erro: string } | { id: string; token?: string }

async function gravar(id: string | null, dados: Partial<Record<string, unknown>>): Promise<Retorno> {
  const db = supabase()
  // só rascunhos podem ser alterados: aprovada/paga é congelada
  const q = id
    ? db.from('propostas').update(dados).eq('id', id).eq('status', 'rascunho')
    : db.from('propostas').insert(dados)
  const { data, error } = await q.select('id').maybeSingle()
  if (error) return { erro: error.message }
  if (!data) return { erro: 'Proposta não encontrada ou já aprovada (congelada).' }
  return { id: data.id }
}

export async function salvarRascunho(id: string | null, d: Dados): Promise<Retorno> {
  await exigirAdmin()
  if (!d.cliente.trim()) return { erro: 'Informe o nome do cliente.' }
  return gravar(id, { ...campos(d), servicos: { itens: [], form: { entrada: d.entrada, textos: d.textos, repassados: d.repassados } } })
}

export async function aprovar(id: string | null, d: Dados): Promise<Retorno> {
  await exigirAdmin()
  if (!d.cliente.trim()) return { erro: 'Informe o nome do cliente.' }
  const m = montarSnapshot(d)
  if ('erro' in m) return m
  const token = randomBytes(16).toString('base64url') // 22 caracteres
  const r = await gravar(id, {
    ...campos(d),
    token,
    status: 'aprovada',
    servicos: m.snapshot,
    total_unico: m.unico,
    total_mensal: m.mensal,
    total_repassado: m.repassado,
    entrada_valor: entradaCentavos(m.unico) / 100,
    aprovado_em: new Date().toISOString(),
  })
  return 'erro' in r ? r : { ...r, token }
}
