import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// Único caminho que marca uma proposta como paga.
export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Assinatura inválida', { status: 400 })
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object
    const id = s.metadata?.proposta_id
    if (id && s.payment_status === 'paid') {
      const { error } = await supabase().from('propostas').update({ status: 'paga' }).eq('id', id).eq('status', 'aprovada')
      if (error) return new Response(error.message, { status: 500 }) // Stripe tenta de novo
    }
  }
  return new Response('ok')
}
