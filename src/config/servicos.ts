// Única fonte de dados de preços e perguntas (faixas de referência do Builders Club).
// `max: null` = faixa aberta ("R$ X+").

export type ServicoId = 'landing' | 'site_simples' | 'site_cms' | 'site_complexo' | 'whatsapp' | 'crm'
export type MensalId = 'manutencao_site' | 'manutencao_bot' | 'hospedagem'
export type RepassadoId = 'dominio'

export type Opcao = {
  valor: string
  label: string
  /** 0..1 — empurra a sugestão entre mín e máx (média dos pesos respondidos) */
  peso: number
  /** linha extra adicionada ao escopo quando esta opção é escolhida */
  escopo?: string
}
export type Pergunta = { id: string; label: string; opcoes: Opcao[] }

export type Servico = {
  id: ServicoId
  nome: string
  min: number
  max: number | null
  escopoBase: string
  entregaveis: string[]
  foraDoEscopo: string[]
  perguntas: Pergunta[]
}

export type Recorrente = {
  id: MensalId | RepassadoId
  nome: string
  min: number
  max: number
  /** repassado: R$/ano; mensal: R$/mês */
  periodo: 'mes' | 'ano'
}

const simNao = (id: string, label: string, pesoSim: number, escopoSim?: string): Pergunta => ({
  id,
  label,
  opcoes: [
    { valor: 'nao', label: 'Não', peso: 0 },
    { valor: 'sim', label: 'Sim', peso: pesoSim, escopo: escopoSim },
  ],
})

const faixa = (id: string, label: string, unidade: string, pesos: [number, number, number]): Pergunta => ({
  id,
  label,
  opcoes: [
    { valor: 'baixo', label: `Poucos ${unidade}`, peso: pesos[0] },
    { valor: 'medio', label: `Médio ${unidade}`, peso: pesos[1] },
    { valor: 'alto', label: `Muitos ${unidade}`, peso: pesos[2] },
  ],
})

const perguntasSite: Pergunta[] = [
  {
    id: 'paginas',
    label: 'Número de páginas',
    opcoes: [
      { valor: 'ate5', label: 'Até 5', peso: 0.2, escopo: 'Até 5 páginas' },
      { valor: '6a10', label: '6 a 10', peso: 0.5, escopo: '6 a 10 páginas' },
      { valor: 'mais10', label: 'Mais de 10', peso: 0.9, escopo: 'Mais de 10 páginas' },
    ],
  },
  simNao('login', 'Área com login?', 0.8, 'Área restrita com login de usuários'),
  {
    id: 'integracoes',
    label: 'Integrações (pagamento, CRM, APIs)',
    opcoes: [
      { valor: 'nenhuma', label: 'Nenhuma', peso: 0 },
      { valor: '1a2', label: '1 a 2', peso: 0.4, escopo: '1 a 2 integrações com serviços externos' },
      { valor: '3mais', label: '3 ou mais', peso: 0.9, escopo: '3 ou mais integrações com serviços externos' },
    ],
  },
  simNao('blog', 'Blog?', 0.5, 'Blog com listagem e páginas de artigo'),
  simNao('idiomas', 'Mais de um idioma?', 0.5, 'Site em mais de um idioma'),
]

const perguntasLanding: Pergunta[] = [
  {
    id: 'integracoes',
    label: 'Integrações (formulário, CRM, pixels)',
    opcoes: [
      { valor: 'nenhuma', label: 'Nenhuma', peso: 0 },
      { valor: '1a2', label: '1 a 2', peso: 0.5, escopo: '1 a 2 integrações (formulário, CRM ou pixels de rastreamento)' },
      { valor: '3mais', label: '3 ou mais', peso: 1, escopo: '3 ou mais integrações (formulário, CRM ou pixels de rastreamento)' },
    ],
  },
  simNao('idiomas', 'Mais de um idioma?', 0.5, 'Página em mais de um idioma'),
]

const foraSite = ['Redação de textos e criação de logotipo/identidade visual', 'Tráfego pago e SEO avançado', 'Conteúdo além do combinado']

export const SERVICOS: Servico[] = [
  {
    id: 'landing',
    nome: 'Landing page',
    min: 300,
    max: 800,
    escopoBase: 'Página única focada em conversão, responsiva e publicada no ar.',
    entregaveis: ['Landing page publicada', 'Formulário de contato/captura', 'Versão mobile'],
    foraDoEscopo: foraSite,
    perguntas: perguntasLanding,
  },
  {
    id: 'site_simples',
    nome: 'Site simples sem CMS (institucional)',
    min: 800,
    max: 2500,
    escopoBase: 'Site institucional com páginas fixas, responsivo e publicado no ar.',
    entregaveis: ['Site publicado', 'Formulário de contato', 'Versão mobile'],
    foraDoEscopo: [...foraSite, 'Painel para o cliente editar conteúdo'],
    perguntas: perguntasSite,
  },
  {
    id: 'site_cms',
    nome: 'Site com CMS (site + painel administrativo)',
    min: 2500,
    max: 6000,
    escopoBase: 'Site com painel administrativo para o cliente editar o conteúdo sozinho.',
    entregaveis: ['Site publicado', 'Painel administrativo', 'Treinamento de uso do painel', 'Versão mobile'],
    foraDoEscopo: foraSite,
    perguntas: [
      ...perguntasSite,
      {
        id: 'edita',
        label: 'O que o cliente edita no painel',
        opcoes: [
          { valor: 'textos', label: 'Textos e imagens', peso: 0.2, escopo: 'Painel para editar textos e imagens' },
          { valor: 'blogprodutos', label: 'Blog e/ou produtos', peso: 0.6, escopo: 'Painel para gerir blog e/ou catálogo de produtos' },
          { valor: 'tudo', label: 'Praticamente tudo', peso: 0.9, escopo: 'Painel completo com edição de todo o conteúdo' },
        ],
      },
      {
        id: 'usuarios',
        label: 'Usuários do painel',
        opcoes: [
          { valor: '1', label: '1 usuário', peso: 0 },
          { valor: '2a5', label: '2 a 5', peso: 0.4, escopo: 'Painel com 2 a 5 usuários e permissões' },
          { valor: '6mais', label: '6 ou mais', peso: 0.9, escopo: 'Painel com 6 ou mais usuários e permissões' },
        ],
      },
    ],
  },
  {
    id: 'site_complexo',
    nome: 'Site ou sistema complexo',
    min: 5000,
    max: null,
    escopoBase: 'Site ou sistema sob medida, com regras de negócio próprias.',
    entregaveis: ['Sistema publicado', 'Documentação básica de uso'],
    foraDoEscopo: [...foraSite, 'Funcionalidades não listadas no escopo'],
    perguntas: perguntasSite,
  },
  {
    id: 'whatsapp',
    nome: 'Agente de WhatsApp (setup)',
    min: 500,
    max: 1500,
    escopoBase: 'Agente de IA para atendimento no WhatsApp, configurado e treinado com as informações do negócio.',
    entregaveis: ['Agente configurado e em produção', 'Base de conhecimento do negócio', 'Fluxos de atendimento'],
    foraDoEscopo: ['Custo da API oficial do WhatsApp', 'Gestão de campanhas e disparos em massa'],
    perguntas: [
      faixa('volume', 'Volume de atendimento', 'atendimentos/dia', [0.1, 0.5, 0.9]),
      {
        id: 'integracao',
        label: 'Integração com CRM/agenda',
        opcoes: [
          { valor: 'nenhuma', label: 'Nenhuma', peso: 0 },
          { valor: 'agenda', label: 'Agenda', peso: 0.5, escopo: 'Integração com agenda para marcação de horários' },
          { valor: 'crm', label: 'CRM', peso: 0.8, escopo: 'Integração com CRM para registrar contatos e conversas' },
        ],
      },
      simNao('handoff', 'Transferência para atendente humano?', 0.4, 'Transferência da conversa para atendente humano'),
    ],
  },
  {
    id: 'crm',
    nome: 'CRM',
    min: 5000,
    max: null,
    escopoBase: 'CRM sob medida para gerir contatos, negociações e funis de venda.',
    entregaveis: ['CRM publicado', 'Cadastro de usuários', 'Funis configurados'],
    foraDoEscopo: ['Migração de dados de outros sistemas', 'Funcionalidades não listadas no escopo'],
    perguntas: [
      {
        id: 'usuarios',
        label: 'Usuários',
        opcoes: [
          { valor: 'ate5', label: 'Até 5', peso: 0.1, escopo: 'Até 5 usuários' },
          { valor: '6a20', label: '6 a 20', peso: 0.5, escopo: '6 a 20 usuários' },
          { valor: 'mais20', label: 'Mais de 20', peso: 0.9, escopo: 'Mais de 20 usuários' },
        ],
      },
      {
        id: 'funis',
        label: 'Funis de venda',
        opcoes: [
          { valor: '1', label: '1 funil', peso: 0 },
          { valor: '2a3', label: '2 a 3', peso: 0.4, escopo: '2 a 3 funis de venda' },
          { valor: '4mais', label: '4 ou mais', peso: 0.9, escopo: '4 ou mais funis de venda' },
        ],
      },
      {
        id: 'integracoes',
        label: 'Integrações',
        opcoes: [
          { valor: 'nenhuma', label: 'Nenhuma', peso: 0 },
          { valor: '1a2', label: '1 a 2', peso: 0.4, escopo: '1 a 2 integrações externas' },
          { valor: '3mais', label: '3 ou mais', peso: 0.9, escopo: '3 ou mais integrações externas' },
        ],
      },
    ],
  },
]

const SITES_E_CRM: ServicoId[] = ['landing', 'site_simples', 'site_cms', 'site_complexo', 'crm']

export const MENSAIS: (Recorrente & { vinculo: ServicoId[] | 'opcional' })[] = [
  { id: 'manutencao_site', nome: 'Manutenção do site', min: 50, max: 200, periodo: 'mes', vinculo: SITES_E_CRM },
  { id: 'manutencao_bot', nome: 'Manutenção do bot (inclui créditos de mensagem/IA)', min: 100, max: 400, periodo: 'mes', vinculo: ['whatsapp'] },
  { id: 'hospedagem', nome: 'Hospedagem gerenciada', min: 30, max: 100, periodo: 'mes', vinculo: 'opcional' },
]

// Hospedagem Vercel gratuita = R$ 0, então não vira linha. Créditos de IA/bot já estão na mensalidade do bot.
export const REPASSADOS: Recorrente[] = [
  { id: 'dominio', nome: 'Domínio (cliente sem domínio)', min: 40, max: 60, periodo: 'ano' },
]

export const MESES_MINIMOS = 3
export const ENTRADA_PERCENTUAL = 0.3 // 30% do valor ÚNICO do projeto (pendência 1 do plano)

// Texto padrão — pendência 2: revisar antes de usar com cliente real.
export const CONDICOES_PADRAO = `Validade da proposta: 15 dias a partir da data de aprovação.
Entrada: 30% do valor único do projeto, paga pelo botão "Pagar" desta página; o início do trabalho ocorre após a confirmação do pagamento. O restante é combinado na entrega.
Mensalidades: compromisso mínimo de ${MESES_MINIMOS} meses, cobradas após a entrega.
Custos repassados (domínio, planos pagos de terceiros) são cobrados à parte, sem margem.
Revisões: até 2 rodadas de ajustes dentro do escopo descrito. Itens fora do escopo são orçados separadamente.
Cancelamento: o valor da entrada não é reembolsável após o início do trabalho.`
