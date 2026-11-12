import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { entradaCentavos } from '@/lib/calculo'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  // o cliente envia só o token; o valor vem sempre do banco
  const token = String((await req.formData()).get('token') ?? '')
  const db = supabase()
  const { data: p } = await db.from('propostas').select('id, cliente, total_unico, stripe_session_id').eq('token', token).eq('status', 'aprovada').maybeSingle()
  if (!p) return new NextResponse('Proposta não encontrada', { status: 404 })

  // sem fallback para o Host da requisição: ele é controlado por quem chama
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (!site) return new NextResponse('NEXT_PUBLIC_SITE_URL não configurada', { status: 500 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // evita cobrança em duplicidade: já pago (webhook ainda a caminho) vai ao obrigado; sessão aberta é reaproveitada
  if (p.stripe_session_id) {
    try {
      const s = await stripe.checkout.sessions.retrieve(p.stripe_session_id)
      if (s.payment_status === 'paid') return NextResponse.redirect(`${site}/p/${token}/obrigado`, 303)
      if (s.status === 'open' && s.url) return NextResponse.redirect(s.url, 303)
    } catch {
      // sessão inexistente: cria uma nova abaixo
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: { currency: 'brl', unit_amount: entradaCentavos(Number(p.total_unico)), product_data: { name: `Entrada (30%) — ${p.cliente}` } },
    }],
    metadata: { proposta_id: p.id },
    success_url: `${site}/p/${token}/obrigado`,
    cancel_url: `${site}/p/${token}?cancelado=1`,
  })
  await db.from('propostas').update({ stripe_session_id: session.id }).eq('id', p.id)
  return NextResponse.redirect(session.url!, 303)
}
