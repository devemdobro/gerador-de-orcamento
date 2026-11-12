export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

// '2026-12-15' → '15/12/2026' sem passar por Date (evita cair no dia anterior no fuso de Brasília); texto antigo passa direto
export const dataBr = (s: string) => s.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1')

export const faixaBrl = (min: number, max: number | null) => (max === null ? `${brl(min)}+` : `${brl(min)} a ${brl(max)}`)
