import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { entradaCentavos } from '@/lib/calculo'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  // o cliente envia só o token; o valor vem sempre do banco
  const token = String((await req.formData()).get('token') ?? '')
  const db = supabase()
  const { data: p } = await db.from('propostas').select('id, cliente, total_unico').eq('token', token).eq('status', 'aprovada').maybeSingle()
  if (!p) return new NextResponse('Proposta não encontrada', { status: 404 })

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: { currency: 'brl', unit_amount: entradaCentavos(Number(p.total_unico)), product_data: { name: `Entrada (30%) — ${p.cliente}` } },
    }],
    metadata: { proposta_id: p.id },
    success_url: `${site}/p/${token}?pago=1`,
    cancel_url: `${site}/p/${token}?cancelado=1`,
  })
  await db.from('propostas').update({ stripe_session_id: session.id }).eq('id', p.id)
  return NextResponse.redirect(session.url!, 303)
}
