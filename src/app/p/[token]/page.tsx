import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MESES_MINIMOS } from '@/config/servicos'
import { brl, dataBr } from '@/lib/formato'
import type { ItemSnapshot } from '@/lib/proposta'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Proposta', robots: { index: false, follow: false } }

export default async function Proposta({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ cancelado?: string }> }) {
  const { token } = await params
  const { cancelado } = await searchParams
  if (!/^[\w-]{22}$/.test(token)) notFound()
  const { data: p } = await supabase()
    .from('propostas')
    .select('token, status, cliente, prazo_entrega, condicoes, total_unico, total_mensal, total_repassado, entrada_valor, servicos')
    .eq('token', token)
    .in('status', ['aprovada', 'paga'])
    .maybeSingle()
  if (!p) notFound()

  const itens: ItemSnapshot[] = p.servicos.itens
  const de = (c: ItemSnapshot['categoria']) => itens.filter((i) => i.categoria === c)

  return (
    <>
      <p className="marca">Dobro Solutions</p>
      <p className="kicker">Proposta comercial</p>
      <h1>Proposta para <span style={{ color: 'var(--acao-destaque)' }}>{p.cliente}</span></h1>
      {p.prazo_entrega && <p className="muted">Prazo de entrega: {dataBr(p.prazo_entrega)}</p>}

      <div className="card resumo">
        <p className="rotulo">Valor único do projeto</p>
        <p className="numero">{brl(Number(p.total_unico))}</p>
        <div className="linha"><span>Entrada (30% do valor único)</span><span className="valor">{brl(Number(p.entrada_valor))}</span></div>
        {de('mensal').map((i) => <div className="linha" key={i.id}><span>{i.nome}</span><span className="valor">{brl(i.preco)}/mês</span></div>)}
        {de('repassado').map((i) => <div className="linha" key={i.id}><span>{i.nome} (repassado, sem margem)</span><span className="valor">{brl(i.preco)}/ano</span></div>)}
        {de('mensal').length > 0 && <p className="muted" style={{ marginBottom: 0 }}>Mensalidades com compromisso mínimo de {MESES_MINIMOS} meses.</p>}
      </div>

      {de('unico').map((i) => (
        <section className="card" key={i.id}>
          <div className="linha"><h2 style={{ margin: 0 }}>{i.nome}</h2><span className="valor">{brl(i.preco)}</span></div>
          <h3 className="rotulo" style={{ marginTop: 'var(--e-6)' }}>Escopo</h3><pre>{i.escopo}</pre>
          <h3 className="rotulo" style={{ marginTop: 'var(--e-6)' }}>Entregáveis</h3><ul style={{ margin: 0 }}>{i.entregaveis.map((e) => <li key={e}>{e}</li>)}</ul>
          {i.fora && <><h3 className="rotulo" style={{ marginTop: 'var(--e-6)' }}>Fica de fora</h3><pre>{i.fora}</pre></>}
        </section>
      ))}

      {p.servicos.repassados && (
        <section className="etapa">
          <h2>Custos repassados</h2>
          <pre>{p.servicos.repassados}</pre>
        </section>
      )}

      <section className="etapa">
        <h2>Condições</h2>
        <pre>{p.condicoes}</pre>
      </section>

      <section className="etapa">
        <h2>Pagamento</h2>
        {p.status === 'paga' ? (
          <p className="alerta" data-tipo="sucesso" role="status">Entrada paga. Obrigado!</p>
        ) : (
          <form method="post" action="/api/checkout">
            {cancelado && <p className="alerta" data-tipo="aviso" role="alert">Pagamento cancelado. Você pode tentar novamente.</p>}
            <input type="hidden" name="token" value={p.token} />
            <button style={{ width: '100%' }}>Pagar entrada de {brl(Number(p.entrada_valor))}</button>
            <p className="muted">Entrada de 30% do valor único do projeto.</p>
          </form>
        )}
      </section>
    </>
  )
}
