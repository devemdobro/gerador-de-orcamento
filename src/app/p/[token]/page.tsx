import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MESES_MINIMOS } from '@/config/servicos'
import { brl, faixaBrl } from '@/lib/formato'
import type { ItemSnapshot } from '@/lib/proposta'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Proposta', robots: { index: false, follow: false } }

export default async function Proposta({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ pago?: string; cancelado?: string }> }) {
  const { token } = await params
  const { pago, cancelado } = await searchParams
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
      <h1>Proposta para {p.cliente}</h1>
      {p.prazo_entrega && <p>Prazo de entrega: {p.prazo_entrega}</p>}

      {de('unico').map((i) => (
        <section className="card" key={i.id}>
          <div className="linha"><h2 style={{ margin: 0 }}>{i.nome}</h2><strong>{brl(i.preco)}</strong></div>
          <h3>Escopo</h3><pre>{i.escopo}</pre>
          <h3>Entregáveis</h3><ul>{i.entregaveis.map((e) => <li key={e}>{e}</li>)}</ul>
          {i.fora && <><h3>Fica de fora</h3><pre>{i.fora}</pre></>}
        </section>
      ))}

      <h2>Valores</h2>
      <div className="card">
        <div className="linha"><span>Valor único do projeto</span><span className="total">{brl(Number(p.total_unico))}</span></div>
        {de('mensal').length > 0 && (
          <>
            {de('mensal').map((i) => <div className="linha" key={i.id}><span>{i.nome}</span><span>{brl(i.preco)}/mês</span></div>)}
            <p className="muted">Mensalidades com compromisso mínimo de {MESES_MINIMOS} meses.</p>
          </>
        )}
        {de('repassado').length > 0 && (
          <>
            {de('repassado').map((i) => <div className="linha" key={i.id}><span>{i.nome} (repassado, sem margem)</span><span>{brl(i.preco)}/ano</span></div>)}
          </>
        )}
        {p.servicos.repassados && (
          <div style={{ marginTop: '.75rem' }}>
            <strong>Custos repassados (detalhamento)</strong>
            <pre>{p.servicos.repassados}</pre>
          </div>
        )}
        <div className="linha" style={{ borderTop: '1px solid var(--borda)', marginTop: '.75rem', paddingTop: '.75rem' }}>
          <span>Entrada (30% do valor único)</span><strong>{brl(Number(p.entrada_valor))}</strong>
        </div>
      </div>

      <h2>Condições</h2>
      <pre>{p.condicoes}</pre>

      <h2>Pagamento</h2>
      {p.status === 'paga' || pago ? (
        <p className="total">{p.status === 'paga' ? '✔ Entrada paga. Obrigado!' : 'Pagamento recebido, aguardando confirmação…'}</p>
      ) : (
        <form method="post" action="/api/checkout">
          {cancelado && <p className="aviso">Pagamento cancelado. Você pode tentar novamente.</p>}
          <input type="hidden" name="token" value={p.token} />
          <p><button>Pagar entrada de {brl(Number(p.entrada_valor))}</button></p>
          <p className="muted">Entrada de 30% do valor único do projeto.</p>
        </form>
      )}
    </>
  )
}
