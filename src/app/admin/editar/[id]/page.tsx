import { notFound } from 'next/navigation'
import { exigirAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Formulario from '../../Formulario'

export const dynamic = 'force-dynamic'

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin()
  const { id } = await params
  const { data: p } = await supabase().from('propostas').select('*').eq('id', id).eq('status', 'rascunho').maybeSingle()
  if (!p) notFound()
  return (
    <Formulario
      idInicial={p.id}
      inicial={{
        cliente: p.cliente, nicho: p.nicho ?? '', objetivo: p.objetivo ?? '', descricao: p.descricao ?? '',
        prazo_desejado: p.prazo_desejado ?? '', prazo_entrega: p.prazo_entrega ?? '', condicoes: p.condicoes ?? undefined,
        repassados: p.servicos?.form?.repassados ?? '',
        entrada: p.servicos?.form?.entrada, textos: p.servicos?.form?.textos,
      }}
    />
  )
}
