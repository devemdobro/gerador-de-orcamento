'use client'

import { useActionState } from 'react'
import { entrar } from '../actions'

export default function Login() {
  const [erro, acao, pendente] = useActionState(entrar, null)
  return (
    <form action={acao} className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
      <p className="kicker">Gerador de propostas</p>
      <h1>Admin</h1>
      <label htmlFor="senha">Senha</label>
      <input id="senha" name="senha" type="password" autoFocus required />
      {erro && <p className="alerta" data-tipo="erro" role="alert">{erro}</p>}
      <p><button disabled={pendente} aria-busy={pendente} style={{ width: '100%' }}>{pendente ? 'Entrando…' : 'Entrar'}</button></p>
    </form>
  )
}
