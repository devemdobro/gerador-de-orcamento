import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const NOME = 'admin'
const assinar = (v: string) => createHmac('sha256', process.env.SESSION_SECRET!).update(v).digest('hex')

export function senhaCorreta(senha: string) {
  const a = Buffer.from(senha)
  const b = Buffer.from(process.env.ADMIN_PASSWORD ?? '')
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b)
}

export async function criarSessao() {
  const exp = Date.now() + 7 * 864e5
  ;(await cookies()).set(NOME, `${exp}.${assinar(String(exp))}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400 })
}

export async function exigirAdmin() {
  const v = (await cookies()).get(NOME)?.value ?? ''
  const [exp, sig] = v.split('.')
  const ok = sig && Number(exp) > Date.now() && sig.length === 64 && timingSafeEqual(Buffer.from(sig), Buffer.from(assinar(exp)))
  if (!ok) redirect('/admin/login')
}
