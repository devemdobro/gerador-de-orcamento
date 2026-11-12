import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Stripe from 'stripe'
import { brl } from '@/lib/formato'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Obrigado', robots: { index: false, follow: false } }

const CORES = ['var(--acao)', 'var(--acao-destaque)', 'var(--sucesso)', 'var(--aviso)', 'var(--texto)']

// Confirma direto no Stripe para não depender da corrida com o webhook. Só exibe; quem grava "paga" continua sendo o webhook.
async function pagou(p: { status: string; stripe_session_id: string | null }) {
  if (p.status === 'paga') return true
  if (!p.stripe_session_id) return false
  try {
    const s = await new Stripe(process.env.STRIPE_SECRET_KEY!).checkout.sessions.retrieve(p.stripe_session_id)
    return s.payment_status === 'paid'
  } catch {
    return false
  }
}

export default async function Obrigado({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[\w-]{22}$/.test(token)) notFound()
  const { data: p } = await supabase()
    .from('propostas')
    .select('status, cliente, entrada_valor, stripe_session_id')
    .eq('token', token)
    .in('status', ['aprovada', 'paga'])
    .maybeSingle()
  if (!p) notFound()
  if (!(await pagou(p))) redirect(`/p/${token}`)

  return (
    <>
      <div className="confete" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <i
            key={i}
            style={{
              '--x': `${(i * 37 + 5) % 100}%`,
              '--dx': `${((i % 7) - 3) * 30}px`,
              '--d': `${(i % 9) * 0.15}s`,
              '--t': `${3 + (i % 5) * 0.6}s`,
              '--r': `${360 + ((i * 53) % 540)}deg`,
              '--c': CORES[i % CORES.length],
            } as React.CSSProperties}
          />
        ))}
      </div>

      <p className="marca">Dobro Solutions</p>
      <div className="obrigado">
        <svg className="check-ok" viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m8 12.5 2.8 2.8L16 9.5" />
        </svg>
        <p className="kicker">Pagamento confirmado</p>
        <h1>Obrigado pela confiança, <span style={{ color: 'var(--acao-destaque)' }}>{p.cliente}</span>!</h1>
        <p className="muted">Recebemos a entrada de {brl(Number(p.entrada_valor))}.</p>

        <div className="card">
          <p className="rotulo">Próximo passo</p>
          <p className="numero" style={{ marginBottom: 'var(--e-3)' }}>1 a 2 horas</p>
          <p style={{ margin: 0, color: 'var(--texto-corpo)' }}>É o prazo para a nossa equipe entrar em contato com você e dar início ao projeto.</p>
        </div>

        <p><a href={`/p/${token}`}>Ver a proposta</a></p>
      </div>
    </>
  )
}
