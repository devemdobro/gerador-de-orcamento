'use client'

import { useMemo, useState, useTransition } from 'react'
import { CONDICOES_PADRAO, MESES_MINIMOS, SERVICOS, type ServicoId } from '@/config/servicos'
import { calcular, escopoPadrao, type Entrada } from '@/lib/calculo'
import { brl, faixaBrl } from '@/lib/formato'
import type { Dados, Textos } from '@/lib/proposta'
import { aprovar, salvarRascunho } from './actions'

type Inicial = Partial<Omit<Dados, 'entrada' | 'textos'>> & { entrada?: Entrada; textos?: Dados['textos'] }

export default function Formulario({ idInicial = null, inicial = {} }: { idInicial?: string | null; inicial?: Inicial }) {
  const [id, setId] = useState(idInicial)
  const [cab, setCab] = useState({
    cliente: inicial.cliente ?? '',
    nicho: inicial.nicho ?? '',
    objetivo: inicial.objetivo ?? '',
    descricao: inicial.descricao ?? '',
    prazo_desejado: inicial.prazo_desejado ?? '',
    prazo_entrega: inicial.prazo_entrega ?? '',
    condicoes: inicial.condicoes ?? CONDICOES_PADRAO,
    repassados: inicial.repassados ?? '',
  })
  const [entrada, setEntrada] = useState<Entrada>(inicial.entrada ?? { servicos: [], respostas: {}, ajustes: {}, extras: { hospedagem: false, dominio: false } })
  // textos editados à mão; o que não foi editado vem dos padrões (escopo muda com as respostas)
  const [editados, setEditados] = useState<Record<string, Partial<Textos>>>(inicial.textos ?? {})
  const [msg, setMsg] = useState<{ erro?: string; ok?: string; link?: string }>({})
  const [pendente, iniciar] = useTransition()

  const r = useMemo(() => calcular(entrada), [entrada])
  const texto = (itemId: string): Textos => {
    const s = SERVICOS.find((x) => x.id === itemId)
    return {
      escopo: s ? escopoPadrao(s.id, entrada.respostas) : '',
      fora: s ? s.foraDoEscopo.join('\n') : '',
      justificativa: '',
      ...editados[itemId],
    }
  }
  const dados = (): Dados => ({
    ...cab,
    entrada,
    textos: Object.fromEntries(r.itens.map((i) => [i.id, texto(i.id)])),
  })

  const alternaServico = (sid: ServicoId) =>
    setEntrada((e) => ({ ...e, servicos: e.servicos.includes(sid) ? e.servicos.filter((x) => x !== sid) : [...e.servicos, sid] }))
  const responde = (sid: ServicoId, pid: string, valor: string) =>
    setEntrada((e) => ({ ...e, respostas: { ...e.respostas, [sid]: { ...e.respostas[sid], [pid]: valor } } }))
  const ajusta = (iid: string, v: string) =>
    setEntrada((e) => ({ ...e, ajustes: { ...e.ajustes, [iid]: v === '' ? undefined : Number(v) } }))
  const edita = (iid: string, campo: keyof Textos, v: string) => setEditados((t) => ({ ...t, [iid]: { ...t[iid], [campo]: v } }))

  const executar = (acao: typeof salvarRascunho) =>
    iniciar(async () => {
      setMsg({})
      const res = await acao(id, dados())
      if ('erro' in res) return setMsg({ erro: res.erro })
      setId(res.id)
      setMsg(res.token ? { ok: 'Proposta aprovada e congelada.', link: `${location.origin}/p/${res.token}` } : { ok: 'Rascunho salvo.' })
    })

  const aprovada = !!msg.link
  const site = (iid: string) => iid === 'manutencao_site' || iid === 'manutencao_bot' || iid === 'hospedagem'

  return (
    <>
    <fieldset disabled={aprovada || pendente} style={{ border: 0, padding: 0, margin: 0 }}>
      <h1>{id ? 'Editar proposta' : 'Nova proposta'}</h1>

      <h2>Briefing</h2>
      {([['cliente', 'Nome do cliente'], ['nicho', 'Nicho'], ['objetivo', 'Objetivo'], ['prazo_desejado', 'Prazo desejado pelo cliente'], ['prazo_entrega', 'Prazo de entrega proposto']] as const).map(([k, l]) => (
        <div key={k}><label htmlFor={k}>{l}</label><input id={k} value={cab[k]} onChange={(e) => setCab({ ...cab, [k]: e.target.value })} /></div>
      ))}
      <label htmlFor="descricao">Descrição</label>
      <textarea id="descricao" value={cab.descricao} onChange={(e) => setCab({ ...cab, descricao: e.target.value })} />

      <h2>Serviços</h2>
      {SERVICOS.map((s) => {
        const marcado = entrada.servicos.includes(s.id)
        return (
          <div className="card" key={s.id}>
            <label className="check"><input type="checkbox" checked={marcado} onChange={() => alternaServico(s.id)} />{s.nome} <span className="muted">{faixaBrl(s.min, s.max)}</span></label>
            {marcado && s.perguntas.map((p) => (
              <div key={p.id}>
                <label htmlFor={`${s.id}-${p.id}`}>{p.label}</label>
                <select id={`${s.id}-${p.id}`} value={entrada.respostas[s.id]?.[p.id] ?? ''} onChange={(e) => responde(s.id, p.id, e.target.value)}>
                  <option value="">—</option>
                  {p.opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )
      })}
      <label className="check"><input type="checkbox" checked={entrada.extras.hospedagem} onChange={(e) => setEntrada({ ...entrada, extras: { ...entrada.extras, hospedagem: e.target.checked } })} />Incluir hospedagem gerenciada (mensal)</label>
      <label className="check"><input type="checkbox" checked={entrada.extras.dominio} onChange={(e) => setEntrada({ ...entrada, extras: { ...entrada.extras, dominio: e.target.checked } })} />Cliente não tem domínio (custo repassado)</label>

      <label htmlFor="repassados">Custos repassados ao cliente (texto livre)</label>
      <textarea id="repassados" value={cab.repassados} placeholder="Ex.: Domínio .com.br: cerca de R$ 40/ano, registrado no nome do cliente." onChange={(e) => setCab({ ...cab, repassados: e.target.value })} />

      {r.itens.length > 0 && <h2>Valores</h2>}
      {r.itens.map((i) => (
        <div className="card" key={i.id}>
          <div className="linha">
            <strong>{i.nome}</strong>
            <span className="muted">referência {faixaBrl(i.min, i.max)}{i.categoria === 'mensal' ? '/mês' : i.categoria === 'repassado' ? '/ano' : ''}</span>
          </div>
          <label htmlFor={`p-${i.id}`}>Valor final (R$){i.sugestao === null && ' — digite o valor'}</label>
          <input id={`p-${i.id}`} type="number" min="0" step="10" value={entrada.ajustes[i.id] ?? ''} placeholder={i.sugestao === null ? 'obrigatório' : String(i.sugestao)} onChange={(e) => ajusta(i.id, e.target.value)} />
          {i.foraDaFaixa && (
            <>
              <p className="aviso">⚠ Fora da faixa de referência.</p>
              <input placeholder="Justificativa (opcional)" value={texto(i.id).justificativa} onChange={(e) => edita(i.id, 'justificativa', e.target.value)} />
            </>
          )}
          {i.categoria === 'unico' && (
            <>
              <label htmlFor={`e-${i.id}`}>Escopo</label>
              <textarea id={`e-${i.id}`} value={texto(i.id).escopo} onChange={(e) => edita(i.id, 'escopo', e.target.value)} />
              <label htmlFor={`f-${i.id}`}>O que fica de fora</label>
              <textarea id={`f-${i.id}`} value={texto(i.id).fora} onChange={(e) => edita(i.id, 'fora', e.target.value)} />
            </>
          )}
          {site(i.id) && <p className="muted">Compromisso mínimo de {MESES_MINIMOS} meses.</p>}
        </div>
      ))}

      {r.itens.length > 0 && (
        <div className="card">
          <div className="linha"><span>Valor único</span><span className="total">{r.unico.final === null ? `${faixaBrl(r.unico.min, r.unico.max)} (defina os valores)` : brl(r.unico.final)}</span></div>
          <div className="linha"><span>Mensalidades</span><span>{r.mensal.final === null ? '—' : `${brl(r.mensal.final)}/mês`}</span></div>
          <div className="linha"><span>Custos repassados</span><span>{r.repassado.final === null ? '—' : brl(r.repassado.final)}</span></div>
        </div>
      )}

      <h2>Condições</h2>
      <textarea style={{ minHeight: '10rem' }} value={cab.condicoes} onChange={(e) => setCab({ ...cab, condicoes: e.target.value })} />

      <p className="linha" style={{ justifyContent: 'flex-start' }}>
        <button type="button" className="sec" onClick={() => executar(salvarRascunho)}>Salvar rascunho</button>
        <button type="button" disabled={!r.completo} onClick={() => executar(aprovar)}>Aprovar valor final</button>
      </p>
      {msg.erro && <p className="erro">{msg.erro}</p>}
      {msg.ok && <p>{msg.ok}</p>}
    </fieldset>
      {msg.link && (
        <p>
          <input readOnly value={msg.link} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={() => navigator.clipboard.writeText(msg.link!)}>Copiar link</button>{' '}
          <a href="/admin">Voltar à lista</a>
        </p>
      )}
    </>
  )
}
