'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/formatters'
import Link from 'next/link'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, DollarSign, Rocket, 
  Cpu, Package, Activity, BarChart3, 
  Zap, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Clock, Thermometer 
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts'

type InputItem = {
  id: string
  name: string
  type: string
  brand: string
  stock_quantity_g: number
  price_per_kg: number
}

type Product3DItem = {
  id: string
  name: string
  production_queue: number
  stock_ready: number
  print_time_hours?: number
}

type FailureItem = {
  id: string
  product_name: string
  filament_wasted_g: number
  created_at: string
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState('Mes') 
  const [mesFiltro, setMesFiltro] = useState('Ago') 
  const [anoFiltro, setAnoFiltro] = useState('2026') 
  const [subFiltro, setSubFiltro] = useState('1') 
  const [loading, setLoading] = useState(true)
  
  const [showTooltipCapacidade, setShowTooltipCapacidade] = useState(false)
  
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalSaidas, setTotalSaidas] = useState(0)
  const [custosFixosMes, setCustosFixosMes] = useState(0)
  const [quantidadeVendasPeriodo, setQuantidadeVendasPeriodo] = useState(0)
  const [totalProdutosVendidosPeriodo, setTotalProdutosVendidosPeriodo] = useState(0)
  const [pecas3dCount, setPecas3dCount] = useState(0)
  const [transacoes, setTransacoes] = useState<any[]>([])
  
  const [chartData, setChartData] = useState<any[]>([])

  const [estoqueItens, setEstoqueItens] = useState<InputItem[]>([])
  const [produtos3DList, setProdutos3DList] = useState<Product3DItem[]>([])
  const [falhasProducao, setFalhasProducao] = useState<FailureItem[]>([])

  const mapMesNumero: { [key: string]: { num: string; dias: number; index: number } } = {
    'Jan': { num: '01', dias: 31, index: 1 },
    'Fev': { num: '02', dias: 28, index: 2 },
    'Mar': { num: '03', dias: 31, index: 3 },
    'Abr': { num: '04', dias: 30, index: 4 },
    'Mai': { num: '05', dias: 31, index: 5 },
    'Jun': { num: '06', dias: 30, index: 6 },
    'Jul': { num: '07', dias: 31, index: 7 },
    'Ago': { num: '08', dias: 31, index: 8 },
    'Set': { num: '09', dias: 30, index: 9 },
    'Out': { num: '10', dias: 31, index: 10 },
    'Nov': { num: '11', dias: 30, index: 11 },
    'Dez': { num: '12', dias: 31, index: 12 }
  }

  const EMPRESA_ANO_INICIO = 2026
  const EMPRESA_MES_INICIO_IND = 8

  useEffect(() => {
    if (periodo === 'Dia') {
      setSubFiltro('01')
    } else if (periodo === 'Semana') {
      setSubFiltro('Sem 1')
    } else if (periodo === 'Mes') {
      setSubFiltro(mesFiltro)
    } else if (periodo === 'Ano') {
      setSubFiltro(anoFiltro)
    }
  }, [periodo, mesFiltro, anoFiltro])

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        setLoading(true)

        const { data: todasTransacoes } = await supabase.from('financial_transactions').select('*')
        const { data: todosCustosFixos } = await supabase.from('fixed_costs').select('*')
        const { count: countPecas } = await supabase.from('machines').select('*', { count: 'exact', head: true })
        const { data: dataProdutos3D } = await supabase.from('products_3d').select('*')
        const { data: dataFalhas } = await supabase.from('production_failures').select('*')

        const transacoesValidas = todasTransacoes || []
        const custosFixosValidos = todosCustosFixos || []
        const mesInfo = mapMesNumero[mesFiltro] || mapMesNumero['Ago']
        const qtdDiasMesAtual = mesInfo.dias

        setProdutos3DList(dataProdutos3D || [])
        setFalhasProducao(dataFalhas || [])
        setPecas3dCount(countPecas || 0)

        const anoNum = parseInt(anoFiltro, 10)
        const mesNumInd = mesInfo.index
        const isPeriodoAntesDaFundacao = (anoNum < EMPRESA_ANO_INICIO) || (anoNum === EMPRESA_ANO_INICIO && mesNumInd < EMPRESA_MES_INICIO_IND)

        let somaCustosFixosBase = 0
        if (!isPeriodoAntesDaFundacao) {
          custosFixosValidos.forEach(cf => {
            somaCustosFixosBase += Number(cf.amount || cf.valor || cf.valor_mensal || 0)
          })
        }
        
        let somaCustosFixosPeriodo = somaCustosFixosBase
        if (periodo === 'Ano') {
          const mesesAtivosNoAno = anoNum === EMPRESA_ANO_INICIO ? (12 - EMPRESA_MES_INICIO_IND + 1) : 12
          somaCustosFixosPeriodo = somaCustosFixosBase * mesesAtivosNoAno
        } else if (periodo === 'Dia') {
          somaCustosFixosPeriodo = somaCustosFixosBase / qtdDiasMesAtual
        } else if (periodo === 'Semana') {
          somaCustosFixosPeriodo = (somaCustosFixosBase / qtdDiasMesAtual) * 7
        }
        
        setCustosFixosMes(isPeriodoAntesDaFundacao ? 0 : somaCustosFixosPeriodo)

        const transacoesFiltradas = transacoesValidas.filter(t => {
          if (isPeriodoAntesDaFundacao) return false
          const dataStr = t.date || t.data || t.created_at || ''
          if (!dataStr) return true
          if (dataStr.includes('-')) {
            const partes = dataStr.split('T')[0].split('-')
            if (partes.length === 3) {
              const [anoT, mesT, diaT] = partes
              if (anoT !== anoFiltro) return false
              if (periodo === 'Ano') return true
              if (mesT !== mesInfo.num) return false
              if (periodo === 'Dia') return diaT === subFiltro
              if (periodo === 'Semana') {
                const diaNum = parseInt(diaT, 10)
                if (subFiltro === 'Sem 1' && (diaNum < 1 || diaNum > 7)) return false
                if (subFiltro === 'Sem 2' && (diaNum < 8 || diaNum > 14)) return false
                if (subFiltro === 'Sem 3' && (diaNum < 15 || diaNum > 21)) return false
                if (subFiltro === 'Sem 4' && (diaNum < 22 || diaNum > qtdDiasMesAtual)) return false
              }
            }
          }
          return true
        })

        const custosFixosComoTransacoes: any[] = []
        if (!isPeriodoAntesDaFundacao) {
          if (periodo === 'Ano') {
            const mesesParaGerar = anoNum === EMPRESA_ANO_INICIO 
              ? ['08', '09', '10', '11', '12'] 
              : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
            
            mesesParaGerar.forEach(mNum => {
              custosFixosValidos.forEach(cf => {
                custosFixosComoTransacoes.push({
                  id: `fixo-${mNum}-${cf.id}`,
                  description: `[Custo Fixo] ${cf.description || cf.descricao || 'Operacional'}`,
                  category: cf.category || 'Operacional',
                  amount: Number(cf.amount || cf.valor || 0),
                  type: 'saida',
                  date: `${anoFiltro}-${mNum}-01`
                })
              })
            })
          } else {
            custosFixosValidos.forEach(cf => {
              custosFixosComoTransacoes.push({
                id: `fixo-${mesInfo.num}-${cf.id}`,
                description: `[Custo Fixo] ${cf.description || cf.descricao || 'Operacional'}`,
                category: cf.category || 'Operacional',
                amount: Number(cf.amount || cf.valor || 0),
                type: 'saida',
                date: `${anoFiltro}-${mesInfo.num}-01`
              })
            })
          }
        }

        const listaCompletaTransacoes = isPeriodoAntesDaFundacao ? [] : [...transacoesFiltradas, ...custosFixosComoTransacoes]

        const receitasFiltered = listaCompletaTransacoes.filter(t => {
          const type = (t.type || t.tipo || '').toLowerCase()
          return type === 'receita' || type === 'entrada' || type === 'income'
        })
        
        const saidasVariaveisFiltered = transacoesFiltradas.filter(t => {
          const type = (t.type || t.tipo || '').toLowerCase()
          return type === 'saida' || type === 'despesa' || type === 'expense' || type === 'custo'
        })

        const totalRec = receitasFiltered.reduce((acc, curr) => acc + (Number(curr.amount || curr.valor) || 0), 0)
        const totalSaiVar = saidasVariaveisFiltered.reduce((acc, curr) => acc + (Number(curr.amount || curr.valor) || 0), 0)
        const totalFixosCalc = isPeriodoAntesDaFundacao ? 0 : somaCustosFixosPeriodo

        setTotalReceitas(totalRec)
        setTotalSaidas(totalSaiVar)
        setTransacoes(listaCompletaTransacoes.slice(0, 6))
        setQuantidadeVendasPeriodo(receitasFiltered.length)

        let somaProdutos = 0
        receitasFiltered.forEach(t => {
          let qtdItem = Number(t.quantity || t.qtd || 1)
          somaProdutos += qtdItem
        })
        setTotalProdutosVendidosPeriodo(somaProdutos)

        if (periodo === 'Ano') {
          const mesesGrafico = anoNum === EMPRESA_ANO_INICIO 
            ? [{ m: '08', name: 'Ago' }, { m: '09', name: 'Set' }, { m: '10', name: 'Out' }, { m: '11', name: 'Nov' }, { m: '12', name: 'Dez' }]
            : [{ m: '01', name: 'Jan' }, { m: '02', name: 'Fev' }, { m: '03', name: 'Mar' }, { m: '04', name: 'Abr' }, { m: '05', name: 'Mai' }, { m: '06', name: 'Jun' }, { m: '07', name: 'Jul' }, { m: '08', name: 'Ago' }, { m: '09', name: 'Set' }, { m: '10', name: 'Out' }, { m: '11', name: 'Nov' }, { m: '12', name: 'Dez' }]

          const dinamicoAno = mesesGrafico.map(itemMes => {
            const recMes = receitasFiltered
              .filter(t => (t.date || t.data || '').startsWith(`${anoFiltro}-${itemMes.m}`))
              .reduce((acc, c) => acc + Number(c.amount || c.valor || 0), 0)
            
            const saiMes = saidasVariaveisFiltered
              .filter(t => (t.date || t.data || '').startsWith(`${anoFiltro}-${itemMes.m}`))
              .reduce((acc, c) => acc + Number(c.amount || c.valor || 0), 0) + (somaCustosFixosBase)

            return { name: itemMes.name, receita: recMes, despesa: saiMes }
          })
          setChartData(dinamicoAno)
        } else if (periodo === 'Mes') {
          const dinamicoMes = [
            { name: 'Sem 1', maxDia: 7 },
            { name: 'Sem 2', maxDia: 14 },
            { name: 'Sem 3', maxDia: 21 },
            { name: 'Sem 4', maxDia: qtdDiasMesAtual },
          ].map((semana, idx, arr) => {
            const minD = idx === 0 ? 1 : arr[idx - 1].maxDia + 1
            const maxD = semana.maxDia

            const recSem = receitasFiltered.filter(t => {
              const dStr = t.date || t.data || ''
              if (!dStr.includes('-')) return false
              const diaPart = parseInt(dStr.split('T')[0].split('-')[2], 10)
              return diaPart >= minD && diaPart <= maxD
            }).reduce((acc, c) => acc + Number(c.amount || c.valor || 0), 0)

            const saiSem = saidasVariaveisFiltered.filter(t => {
              const dStr = t.date || t.data || ''
              if (!dStr.includes('-')) return false
              const diaPart = parseInt(dStr.split('T')[0].split('-')[2], 10)
              return diaPart >= minD && diaPart <= maxD
            }).reduce((acc, c) => acc + Number(c.amount || c.valor || 0), 0) + (somaCustosFixosBase / 4)

            return { name: semana.name, receita: recSem, despesa: saiSem }
          })
          setChartData(dinamicoMes)
        } else if (periodo === 'Semana') {
          let minD = 1, maxD = 7
          if (subFiltro === 'Sem 2') { minD = 8; maxD = 14; }
          else if (subFiltro === 'Sem 3') { minD = 15; maxD = 21; }
          else if (subFiltro === 'Sem 4') { minD = 22; maxD = qtdDiasMesAtual; }

          const diasSemanaArr = []
          for (let d = minD; d <= maxD; d++) {
            const dStrNum = d < 10 ? `0${d}` : `${d}`
            const recDia = receitasFiltered.filter(t => (t.date || t.data || '').startsWith(`${anoFiltro}-${mesInfo.num}-${dStrNum}`)).reduce((acc, c) => acc + Number(c.amount || c.valor || 0), 0)
            const saiDia = saidasVariaveisFiltered.filter(t => (t.date || t.data || '').startsWith(`${anoFiltro}-${mesInfo.num}-${dStrNum}`)).reduce((acc, c) => acc + Number(c.amount || c.valor || 0), 0) + (somaCustosFixosBase / qtdDiasMesAtual)
            diasSemanaArr.push({ name: `Dia ${d}`, receita: recDia, despesa: saiDia })
          }
          setChartData(diasSemanaArr)
        } else {
          setChartData([
            { name: `Dia ${subFiltro}/${mesFiltro}`, receita: totalRec, despesa: totalSaiVar + totalFixosCalc }
          ])
        }

      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDadosDashboard()
  }, [periodo, mesFiltro, anoFiltro, subFiltro])

  useEffect(() => {
    async function fetchEstoque() {
      const { data } = await supabase.from('inputs').select('*').order('stock_quantity_g', { ascending: true })
      if (data) setEstoqueItens(data)
    }
    fetchEstoque()

    const channel = supabase.channel('realtime-dashboard-pro')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => { fetchEstoque() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Carregamento inteligente e cruzamento de dados sem inconsistências
  // 1. Filtrar as transações de receita do período atual
  const transacoesReceitaPeriodo = transacoes.filter(t => {
    const type = (t.type || t.tipo || '').toLowerCase()
    return type === 'receita' || type === 'entrada' || type === 'income'
  })

  // 2. Totalizar as taxas de gateway reais pagas no período
  const totalTaxasGateway = transacoesReceitaPeriodo.reduce((acc, curr) => acc + (Number(curr.payment_gateway_fee) || 0), 0)

  // 3. Lucro Líquido Real deduzindo Custos Fixos, Despesas Variáveis e Taxas de Gateway
  const saldoLiquido = totalReceitas - (totalSaidas + custosFixosMes + totalTaxasGateway)
  const margemLucro = totalReceitas > 0 ? ((saldoLiquido / totalReceitas) * 100).toFixed(1) : '0'
  const maxStockValue = 10000 // Capacidade total de 10.000g (10kg)
  const totalDesperdicioFalhas = falhasProducao.reduce((acc, f) => acc + (f.filament_wasted_g || 0), 0)
  
  const totalItensFila = produtos3DList.reduce((acc, curr) => acc + (Number(curr.production_queue) || 0), 0)
  const totalEstoqueG = estoqueItens.reduce((acc, item) => acc + (item.stock_quantity_g || 0), 0)

  const totalHorasFila = produtos3DList.reduce((acc, curr) => {
    const qtdNaFila = Number(curr.production_queue) || 0
    const tempoUnitario = Number(curr.print_time_hours) || 3.5 
    return acc + (qtdNaFila * tempoUnitario)
  }, 0)

  const capacidadeHorasMaquinas = Math.max(pecas3dCount, 1) * 720
  const percentualOcupacaoCapacidade = Math.min(Math.round((totalHorasFila / capacidadeHorasMaquinas) * 100), 100)

  // 4. Detalhamento comercial adicional para os novos KPIs
  const ticketMedio = quantidadeVendasPeriodo > 0 ? (totalReceitas / quantidadeVendasPeriodo) : 0

  // Meio de pagamento líder no período
  const contagemPagamentos: Record<string, number> = {}
  transacoesReceitaPeriodo.forEach(t => {
    const metodo = t.payment_method || t.pagamento || 'Pix'
    const cleanMetodo = metodo.toUpperCase().trim()
    contagemPagamentos[cleanMetodo] = (contagemPagamentos[cleanMetodo] || 0) + 1
  })
  let meioPagamentoLider = 'Nenhum'
  let maxVezes = 0
  Object.entries(contagemPagamentos).forEach(([metodo, qtd]) => {
    if (metodo && qtd > maxVezes) {
      maxVezes = qtd
      meioPagamentoLider = metodo
    }
  })

  // 5. KPIs de Estoque: Valoração e Níveis Críticos
  const valorTotalEstoque = estoqueItens.reduce((acc, item) => {
    const precoKg = Number(item.price_per_kg) || 95
    const pesoG = Number(item.stock_quantity_g) || 0
    return acc + ((pesoG / 1000) * precoKg)
  }, 0)
  const bobinasCriticasCount = estoqueItens.filter(item => (item.stock_quantity_g || 0) <= 1000).length

  // 6. KPIs de Qualidade: Taxa de falhas e prejuízo de insumo desperdiçado
  // Custo médio de filamento por grama é R$ 0.10
  const custoPerdaFalhas = totalDesperdicioFalhas * 0.095 
  // Taxa de desperdício em relação ao estoque global em prateleira
  const taxaFalhaPercentual = totalEstoqueG > 0 
    ? Number(((totalDesperdicioFalhas / (totalEstoqueG + totalDesperdicioFalhas)) * 100).toFixed(1))
    : 0

  const pieData = [
    { name: 'Lucro Líquido Real', value: Math.max(saldoLiquido, 0), color: '#10b981' },
    { name: 'Custos Fixos', value: custosFixosMes, color: '#f59e0b' },
    { name: 'Saídas Variáveis', value: totalSaidas, color: '#f43f5e' },
    { name: 'Taxas de Gateway', value: totalTaxasGateway, color: '#8b5cf6' },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  }

  const qtdDiasAtualNum = (mapMesNumero[mesFiltro] || mapMesNumero['Ago']).dias

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="p-6 lg:p-10 space-y-8 text-slate-800 dark:text-slate-100 min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/40 dark:from-[#121619] dark:via-[#181d22] dark:to-[#101316]"
    >
      {/* 🚀 Top Header / Comando Corporativo */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/90 dark:bg-[#1f262c]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-2xl shadow-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25">
            <Rocket className="w-7 h-7 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Central Executiva 3D</h1>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-extrabold border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Gestão de alta performance: finanças, parque fabril e suprimentos em tempo real.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <div className="flex bg-slate-100 dark:bg-[#171c20] border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
            {['Dia', 'Semana', 'Mes', 'Ano'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                  periodo === p ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Link href="/calculadora-3d" className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs px-5 py-3.5 rounded-2xl font-black shadow-xl shadow-orange-600/25 transition-all transform hover:-translate-y-0.5">
            <Zap className="w-4 h-4 fill-white" /> Nova Precificação
          </Link>
        </div>
      </motion.div>

      {/* 📅 Barra de Filtros Temporal Dinâmica */}
      <motion.div variants={itemVariants} className="bg-white/70 dark:bg-[#1f262c]/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4 overflow-x-auto shadow-sm">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
          <Activity className="w-4 h-4 text-orange-500" /> SELEÇÃO ({periodo.toUpperCase()}):
        </div>
        
        <div className="flex gap-2 items-center">
          {periodo === 'Mes' && ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mes) => (
            <button
              key={mes}
              onClick={() => { setMesFiltro(mes); setSubFiltro(mes); }}
              className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition-all ${
                mesFiltro === mes ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-slate-100 dark:bg-[#171c20] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {mes}
            </button>
          ))}

          {periodo === 'Ano' && ['2026', '2027', '2028', '2029'].map((ano) => (
            <button
              key={ano}
              onClick={() => { setAnoFiltro(ano); setSubFiltro(ano); }}
              className={`px-4 py-1.5 text-xs rounded-xl font-bold transition-all ${
                anoFiltro === ano ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-slate-100 dark:bg-[#171c20] text-slate-600 dark:text-slate-400'
              }`}
            >
              {ano}
            </button>
          ))}

          {periodo === 'Semana' && ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((sem) => (
            <button
              key={sem}
              onClick={() => setSubFiltro(sem)}
              className={`px-4 py-1.5 text-xs rounded-xl font-bold transition-all ${
                subFiltro === sem ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-slate-100 dark:bg-[#171c20] text-slate-600 dark:text-slate-400'
              }`}
            >
              {sem}
            </button>
          ))}

          {periodo === 'Dia' && Array.from({ length: qtdDiasAtualNum }, (_, i) => {
            const diaNum = i + 1
            const diaStr = diaNum < 10 ? `0${diaNum}` : `${diaNum}`
            return (
              <button
                key={diaStr}
                onClick={() => setSubFiltro(diaStr)}
                className={`px-2.5 py-1.5 text-xs rounded-xl font-bold transition-all ${
                  subFiltro === diaStr ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-slate-100 dark:bg-[#171c20] text-slate-600 dark:text-slate-400'
                }`}
              >
                {diaNum}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 📊 Grid de KPIs Executivos */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Receitas */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1f262c] border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-emerald-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-36 h-36 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Entrada
              </span>
            </div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Receitas Totais</span>
            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">{formatCurrency(totalReceitas)}</h2>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{quantidadeVendasPeriodo} vendas realizadas</span>
            <span className="text-emerald-600">{mesFiltro}/{anoFiltro}</span>
          </div>
        </motion.div>

        {/* Saídas & Custos */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1f262c] border border-rose-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-rose-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown className="w-36 h-36 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> Saída
              </span>
            </div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Custos & Despesas</span>
            <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 tracking-tight">{formatCurrency(totalSaidas + custosFixosMes)}</h2>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Fixos + Variáveis</span>
            <span className="text-rose-500">Rateio Proporcional</span>
          </div>
        </motion.div>

        {/* Lucro Líquido & Margem */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1f262c] border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-amber-500/5 relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                Margem: {margemLucro}%
              </span>
            </div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Lucro Líquido</span>
            <h2 className={`text-3xl font-black mt-1 tracking-tight ${saldoLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(saldoLiquido)}
            </h2>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Balanço Caixa</span>
            <span className={saldoLiquido >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{saldoLiquido >= 0 ? 'Saudável 🟢' : 'Negativo 🔴'}</span>
          </div>
        </motion.div>

        {/* Fila & Parque Fabril */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-orange-600/25 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-2xl bg-white/20 text-white">
                <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                {pecas3dCount} MÁQUINAS
              </span>
            </div>
            <span className="block text-xs font-bold text-orange-100 uppercase tracking-wider mt-4">FILA DE PRODUÇÃO</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-3xl font-black">{totalItensFila}</h2>
              <span className="text-xs text-orange-200 font-bold">itens ativos</span>
            </div>

            <div className="mt-3 space-y-2 relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-100 bg-black/20 px-3 py-1.5 rounded-xl w-full justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-200" />
                  <span>{totalHorasFila.toFixed(1)}h ativas</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-orange-200 font-extrabold">
                  <Thermometer className="w-3.5 h-3.5 text-amber-200" />
                  <span>Máx: {capacidadeHorasMaquinas}h</span>
                </div>
              </div>

              <div className="relative">
                <div 
                  onMouseEnter={() => setShowTooltipCapacidade(true)}
                  onMouseLeave={() => setShowTooltipCapacidade(false)}
                  className="w-full bg-black/30 h-3 rounded-full overflow-hidden p-0.5 border border-white/20 cursor-pointer shadow-inner transition-all hover:border-white/40"
                >
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-200 to-white transition-all duration-700 shadow-sm"
                    style={{ width: `${percentualOcupacaoCapacidade}%` }}
                  ></div>
                </div>

                <AnimatePresence>
                  {showTooltipCapacidade && (
                    <motion.div 
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 pointer-events-none"
                    >
                      <div className="bg-slate-900/95 dark:bg-[#121619]/95 backdrop-blur-xl border border-white/15 text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-2xl shadow-black/50 whitespace-nowrap flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        <span>Capacidade Utilizada: <strong className="text-orange-300">{percentualOcupacaoCapacidade}%</strong> ({totalHorasFila.toFixed(1)}h / {capacidadeHorasMaquinas}h)</span>
                      </div>
                      <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-white/15 rotate-45 mx-auto -mt-1.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-orange-100">
            <span>Perdas: {totalDesperdicioFalhas}g filamento</span>
            <Link href="/projetos" className="underline hover:text-white">Gerenciar ➔</Link>
          </div>
        </motion.div>

      </motion.div>

      {/* 📊 Seção de KPI's Setoriais (Informações em Tempo Real) */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
          <h2 className="text-base font-black text-slate-900 dark:text-white">Desempenho por Setor (Cockpit Gerencial)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Comercial */}
          <div className="bg-white/80 dark:bg-[#1f262c]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden group">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">Comercial & Vendas</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Ticket Médio</span>
                <span className="font-extrabold text-white">{formatCurrency(ticketMedio)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Gateway Pago</span>
                <span className="font-bold text-rose-400">-{formatCurrency(totalTaxasGateway)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Pagamento Líder</span>
                <span className="font-black text-emerald-400 text-[10px] uppercase tracking-wider">{meioPagamentoLider}</span>
              </div>
            </div>
          </div>

          {/* Produção */}
          <div className="bg-white/80 dark:bg-[#1f262c]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden group">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">Produção & Operações</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Horas em Fila</span>
                <span className="font-extrabold text-white">{totalHorasFila.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Fator Ocupação</span>
                <span className="font-bold text-blue-400">{percentualOcupacaoCapacidade}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Itens na Fila</span>
                <span className="font-black text-white">{totalItensFila} un.</span>
              </div>
            </div>
          </div>

          {/* Estoque */}
          <div className="bg-white/80 dark:bg-[#1f262c]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden group">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Estoque & Insumos</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Valoração total</span>
                <span className="font-extrabold text-white">{formatCurrency(valorTotalEstoque)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Volume Global</span>
                <span className="font-bold text-white">{(totalEstoqueG / 1000).toFixed(2)}kg</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Nível Crítico (≤1kg)</span>
                <span className={`font-black text-xs ${bobinasCriticasCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                  {bobinasCriticasCount} bobinas
                </span>
              </div>
            </div>
          </div>

          {/* Qualidade */}
          <div className="bg-white/80 dark:bg-[#1f262c]/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden group">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">Controle de Qualidade (QA)</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Taxa de Desperdício</span>
                <span className="font-extrabold text-white">{taxaFalhaPercentual}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Massa Desperdiçada</span>
                <span className="font-bold text-white">{totalDesperdicioFalhas}g</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Prejuízo Acumulado</span>
                <span className="font-black text-rose-400">{formatCurrency(custoPerdaFalhas)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 📈 Seção de Gráficos Dinâmicos (Área vs Barras) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#1f262c] border border-slate-200 dark:border-slate-800 p-7 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Dinâmica Financeira (Receitas vs Saídas)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Comportamento de fluxo de caixa segmentado por {periodo.toLowerCase()}.</p>
            </div>
            <span className="p-2 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <BarChart3 className="w-5 h-5" />
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {periodo === 'Dia' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#181d22', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Bar dataKey="receita" name="Receitas" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="despesa" name="Saídas" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$ ${v}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#181d22', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), '']}
                  />
                  <Area type="monotone" dataKey="receita" name="Receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
                  <Area type="monotone" dataKey="despesa" name="Saídas" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesa)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1f262c] border border-slate-200 dark:border-slate-800 p-7 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Composição de Caixa</h2>
              <PieIcon className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs text-slate-400">Proporção entre Lucro, Custos Fixos e Variáveis.</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#181d22', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            {pieData.map((item, idx) => (
              <div key={idx}>
                <span className="block w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-400 truncate block">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* 🧵 Monitor de Estoque com Termômetro Geral e Termômetros Individuais Responsivos */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#1f262c] border border-slate-200 dark:border-slate-800 p-7 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Monitor de Filamentos & Termômetro de Insumos</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Sincronização instantânea via Supabase Realtime[cite: 5].</p>
          </div>
          
          {/* Termômetro Geral Global com Capacidade de 10kg (10.000g) */}
          <div className="flex items-center gap-4 bg-white dark:bg-[#1f262c] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-10 h-28 flex flex-col items-center">
              <div className="w-5 h-20 bg-slate-100 dark:bg-slate-800 rounded-t-full border-2 border-slate-300 dark:border-slate-600 relative overflow-hidden flex flex-col justify-end p-0.5">
                <motion.div 
                  className="w-full bg-gradient-to-t from-rose-600 via-amber-500 to-emerald-500 rounded-t-sm"
                  style={{ height: `${Math.min(Math.max((totalEstoqueG / 10000) * 100, 5), 100)}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(Math.max((totalEstoqueG / 10000) * 100, 5), 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="w-8 h-8 -mt-1 bg-rose-600 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-lg shadow-rose-600/50 flex items-center justify-center relative z-10">
                <div className="w-2.5 h-2.5 bg-orange-300 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Termômetro Global (Máx: 10kg)</span>
              <div className="text-lg font-black text-slate-900 dark:text-white">{totalEstoqueG}g</div>
              <p className="text-[11px] text-slate-400">
                {totalEstoqueG > 1000 ? '🟢 Nível acima do crítico' : '🔴 Estoque geral baixo'}
              </p>
            </div>
          </div>
        </div>

        {/* Container Global com Fundo de Degradê Suave */}
        <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#171c20]/60 dark:via-[#171c20]/80 dark:to-[#171c20] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {estoqueItens.length > 0 ? (
              estoqueItens.map((item) => {
                const currentStock = item.stock_quantity_g || 0
                const maxCap = 10000 // Capacidade total de 10kg
                const totalPercentage = Math.min(Math.max((currentStock / maxCap) * 100, 4), 100)
                const isCritical = currentStock <= 1000

                return (
                  /* Card Individual com Degradê Invertido para Alto Contraste */
                  <div key={item.id} className="flex flex-col items-center bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-[#242b33] dark:via-[#1f262c] dark:to-[#181d22] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md group hover:border-orange-500/50 transition-all relative">
                    <span className={`text-xs font-black mb-2 transition-transform group-hover:-translate-y-1 ${
                      isCritical ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {currentStock}g
                    </span>

                    {/* Mini Termômetro Individual com Linha de 1k Acima da Bolinha Inferior */}
                    <div className="relative w-10 h-32 flex flex-col items-center my-1">
                      
                      {/* Corpo do Tubo e Bolinha */}
                      <div className="w-4 h-24 bg-slate-100 dark:bg-slate-800 rounded-t-full border-2 border-slate-300 dark:border-slate-600 relative overflow-hidden flex flex-col justify-end p-0.5">
                        <div 
                          className="w-full rounded-t-sm transition-all duration-500" 
                          style={{ 
                            height: `${totalPercentage}%`,
                            background: isCritical 
                              ? 'linear-gradient(to top, #b91c1c, #ef4444)' 
                              : 'linear-gradient(to top, #f87171 0%, #facc15 35%, #4ade80 70%, #22c55e 100%)' 
                          }}
                        />
                      </div>
                      
                      {/* Bolinha do Termômetro */}
                      <div className={`w-7 h-7 -mt-1 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center relative z-10 ${isCritical ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                        <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                      </div>

                      {/* Linha indicadora de 1000g posicionada logo ACIMA da bolinha do termômetro */}
                      <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style={{ bottom: '26px' }}>
                        <div className="w-full border-t border-dashed border-rose-500"></div>
                        <span className="absolute -right-7 text-[8px] font-bold text-white bg-rose-600 px-1 rounded shadow">1k</span>
                      </div>

                    </div>

                    <div className="mt-3 text-center w-full">
                      <span className="block text-xs font-bold text-slate-800 dark:text-white truncate w-full" title={item.name}>
                        {item.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                        {item.type || 'PLA'}
                      </span>
                      {isCritical ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[9px] font-black mt-1.5">
                          ⚠️ Baixo (Zona Vermelha)
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold mt-1.5">
                          Estável (Verde/Amarelo)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs font-medium">
                Nenhum filamento cadastrado no estoque.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 📋 Transações Recentes */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#1f262c] border border-slate-200 dark:border-slate-800 p-7 rounded-3xl space-y-5 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Últimas Transações Registradas</h2>
            <p className="text-xs text-slate-400">Movimentações financeiras do período atual.</p>
          </div>
          <Link href="/financeiro" className="text-xs font-bold text-orange-600 hover:underline">Ver todas ➔</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="pb-3.5 w-32">Data</th>
                <th className="pb-3.5">Descrição</th>
                <th className="pb-3.5">Categoria</th>
                <th className="pb-3.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {transacoes.length > 0 ? (
                transacoes.map((t, index) => {
                  const type = (t.type || t.tipo || '').toLowerCase()
                  const isReceita = type === 'receita' || type === 'entrada' || type === 'income'
                  const dataOcorrido = (t.date || t.data || t.created_at || '').split('T')[0].split('-').reverse().join('/')

                  return (
                    <tr key={t.id || index} className="hover:bg-slate-50 dark:hover:bg-[#171c20]/50 transition-colors">
                      <td className="py-4 text-slate-400 font-bold text-xs">{dataOcorrido}</td>
                      <td className="py-4 text-slate-800 dark:text-slate-200 font-bold">{t.description || t.descricao}</td>
                      <td className="py-4 text-slate-400 text-xs font-semibold">{t.category || t.categoria || 'Geral'}</td>
                      <td className={`py-4 text-right font-black ${isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isReceita ? '+ ' : '- '}{formatCurrency(t.amount || t.valor || 0)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-xs">
                    Nenhum registro encontrado para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}