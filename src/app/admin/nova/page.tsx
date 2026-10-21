import { exigirAdmin } from '@/lib/auth'
import Formulario from '../Formulario'

export default async function Nova() {
  await exigirAdmin()
  return <Formulario />
}
