export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

export const faixaBrl = (min: number, max: number | null) => (max === null ? `${brl(min)}+` : `${brl(min)} a ${brl(max)}`)
