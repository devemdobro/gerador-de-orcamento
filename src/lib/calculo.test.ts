import { describe, expect, it } from 'vitest'
import { calcular, entradaCentavos, escopoPadrao, type Entrada } from './calculo'

const base: Entrada = { servicos: [], respostas: {}, ajustes: {}, extras: { hospedagem: false, dominio: false } }

describe('calcular', () => {
  it('combo landing + whatsapp separa único, mensal e repassado', () => {
    const r = calcular({ ...base, servicos: ['landing', 'whatsapp'], extras: { hospedagem: true, dominio: true } })
    expect(r.unico).toEqual({ min: 800, max: 2300, final: 1550 }) // pontos médios 550 + 1000
    expect(r.mensal.min).toBe(180) // manutenção site 50 + bot 100 + hospedagem 30
    expect(r.mensal.max).toBe(700)
    expect(r.repassado).toEqual({ min: 40, max: 60, final: 50 })
    expect(r.completo).toBe(true)
  })

  it('respostas empurram a sugestão entre mín e máx', () => {
    const leve = calcular({ ...base, servicos: ['site_simples'], respostas: { site_simples: { paginas: 'ate5', login: 'nao' } } })
    const pesado = calcular({ ...base, servicos: ['site_simples'], respostas: { site_simples: { paginas: 'mais10', login: 'sim' } } })
    expect(leve.unico.final).toBeLessThan(1650)
    expect(pesado.unico.final).toBeGreaterThan(1650)
    expect(pesado.unico.final).toBeLessThanOrEqual(2500)
  })

  it('ajuste manual recalcula o total e marca fora da faixa', () => {
    const r = calcular({ ...base, servicos: ['landing', 'site_simples'], ajustes: { landing: 900, site_simples: 1000 } })
    expect(r.unico.final).toBe(1900)
    expect(r.itens.find((i) => i.id === 'landing')!.foraDaFaixa).toBe(true)
    expect(r.itens.find((i) => i.id === 'site_simples')!.foraDaFaixa).toBe(false)
  })

  it('faixa aberta: sem sugestão, combo "+" e incompleto até digitar valor', () => {
    const aberto = calcular({ ...base, servicos: ['landing', 'crm'] })
    expect(aberto.unico.max).toBeNull()
    expect(aberto.unico.final).toBeNull()
    expect(aberto.completo).toBe(false)
    const ok = calcular({ ...base, servicos: ['landing', 'crm'], ajustes: { crm: 7000 } })
    expect(ok.unico.final).toBe(7550)
    expect(ok.completo).toBe(true)
  })

  it('mensalidades só aparecem quando vinculadas', () => {
    const r = calcular({ ...base, servicos: ['whatsapp'] })
    expect(r.itens.map((i) => i.id)).toEqual(['whatsapp', 'manutencao_bot'])
  })
})

describe('escopo e entrada', () => {
  it('escopo inclui linhas das respostas', () => {
    expect(escopoPadrao('site_simples', { site_simples: { login: 'sim' } })).toContain('login')
  })
  it('entrada é 30% do valor único em centavos', () => {
    expect(entradaCentavos(1550)).toBe(46500)
  })
})
