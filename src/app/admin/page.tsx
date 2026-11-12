import Link from 'next/link'
import { exigirAdmin } from '@/lib/auth'
import { brl } from '@/lib/formato'
import { supabase } from '@/lib/supabase'
import { sair } from './actions'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  await exigirAdmin()
  const { data } = await supabase().from('propostas').select('id, token, status, versao, cliente, total_unico, criado_em').order('criado_em', { ascending: false })
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return (
    <>
      <p className="kicker">Painel</p>
      <div className="linha" style={{ alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Propostas</h1>
        <span className="linha" style={{ gap: 'var(--e-2)' }}>
          <Link className="btn" href="/admin/nova">Nova proposta</Link>
          <form action={sair}><button className="sec">Sair</button></form>
        </span>
      </div>
      {!data?.length && (
        <div className="card" style={{ marginTop: 'var(--e-6)' }}>
          <p style={{ marginTop: 0 }}>Nenhuma proposta ainda.</p>
          <Link className="btn" href="/admin/nova">Criar primeira proposta</Link>
        </div>
      )}
      <div style={{ marginTop: 'var(--e-6)' }}>
        {data?.map((p) => (
          <div className="card compacto" key={p.id}>
            <div className="linha">
              <span className="linha" style={{ justifyContent: 'flex-start', gap: 'var(--e-2)' }}>
                <strong>{p.cliente}</strong>
                <span className="badge" data-status={p.status}>{p.status}</span>
                <span className="muted">v{p.versao}</span>
              </span>
              {p.total_unico != null && <span className="valor">{brl(Number(p.total_unico))}</span>}
            </div>
            <p className="muted quebra" style={{ margin: 'var(--e-2) 0 0' }}>
              {p.status === 'rascunho' ? <Link href={`/admin/editar/${p.id}`}>Editar rascunho</Link> : <a href={`${site}/p/${p.token}`}>{site}/p/{p.token}</a>}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
