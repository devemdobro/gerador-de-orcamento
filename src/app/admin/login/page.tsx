'use client'

import { useActionState } from 'react'
import { entrar } from '../actions'

export default function Login() {
  const [erro, acao, pendente] = useActionState(entrar, null)
  return (
    <form action={acao}>
      <h1>Admin</h1>
      <label htmlFor="senha">Senha</label>
      <input id="senha" name="senha" type="password" autoFocus required />
      {erro && <p className="erro">{erro}</p>}
      <p><button disabled={pendente}>Entrar</button></p>
    </form>
  )
}
