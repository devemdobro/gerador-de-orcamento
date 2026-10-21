import Link from 'next/link'
import { exigirAdmin } from '@/lib/auth'
import { brl } from '@/lib/formato'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  await exigirAdmin()
  const { data } = await supabase().from('propostas').select('id, token, status, versao, cliente, total_unico, criado_em').order('criado_em', { ascending: false })
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return (
    <>
      <div className="linha"><h1>Propostas</h1><Link className="btn" href="/admin/nova">Nova proposta</Link></div>
      {!data?.length && <p className="muted">Nenhuma proposta ainda.</p>}
      {data?.map((p) => (
        <div className="card" key={p.id}>
          <div className="linha">
            <strong>{p.cliente} <span className="muted">v{p.versao} · {p.status}</span></strong>
            {p.total_unico != null && <span>{brl(Number(p.total_unico))}</span>}
          </div>
          {p.status === 'rascunho' ? <Link href={`/admin/editar/${p.id}`}>Editar rascunho</Link> : <a href={`${site}/p/${p.token}`}>{site}/p/{p.token}</a>}
        </div>
      ))}
    </>
  )
}
