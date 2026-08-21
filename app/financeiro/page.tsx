'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Trash2, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  Package, 
  Settings, 
  FileText,
  CreditCard,
  Eye,
  X,
  Percent,
  Clock,
  Gauge,
  Zap,
  Target,
  BarChart3,
  Check,
  Hash
} from 'lucide-react'

type FixedCost = {
  id: string
  description: string
  amount: number
  category?: string
  due_day?: number
  payment_method?: string
  status?: string
  created_at?: string
}

type Transaction = {
  id: string
  date: string
  type: string
  category?: string
  description: string
  amount: number
  status?: string
  payment_gateway_fee?: number
  payment_method?: string
  due_date?: string
  payment_status?: 'pending' | 'paid' | 'cancelled'
  sale_id?: string
  order_id?: string
  created_at?: string
}

type Product3D = {
  id: string
  name: string
  category: string
  suggested_price: number
  weight_g?: number
  print_time_hours?: number
}

type SaleItem = {
  nome: string
  qtd: number
  qtdEstoqueUtilizada?: number
  qtdIndoParaProducao?: number
}

const CATEGORIAS_RECEITA = [
  'Vendas',
  'Serviços de Impressão Sob Demanda',
  'Consultoria / Projetos 3D',
  'Outras Receitas'
]

const CATEGORIAS_DESPESA = [
  'Insumos / Filamentos (PLA, PETG, ABS)',
  'Manutenção de Impressoras 3D',
  'Energia Elétrica (Oficina)',
  'Embalagens e Envios',
  'Ferramentas e Peças de Reposição',
  'Marketing e Anúncios',
  'Outras Despesas'
]

const CATEGORIAS_CUSTO_FIXO = [
  'Aluguel / Infraestrutura da Oficina',
  'Energia Elétrica (Estimativa Oficina)',
  'Internet / Conectividade',
  'Softwares & Licenças (Fusion 360, Slicers PRO)',
  'Assinaturas & Ferramentas de Gestão',
  'Contabilidade / Manutenção Preventiva',
  'Outros Custos Fixos'
]

export default function FinanceiroPage() {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null)
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products3D, setProducts3D] = useState<Product3D[]>([])
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // Filtro por Mês/Ano (padrão: mês atual YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })

  // States para Custos Fixos
  const [costDescription, setCostDescription] = useState('')
  const [costAmount, setCostAmount] = useState<number>(0)
  const [costCategory, setCostCategory] = useState('')
  const [costDueDay, setCostDueDay] = useState<number>(10)
  const [costPaymentMethod, setCostPaymentMethod] = useState('Boleto / Pix')
  const [loadingCost, setLoadingCost] = useState(false)

  // States para Transações Financeiras
  const [tDate, setTDate] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const [tType, setTType] = useState('Receita')
  const [tCategory, setTCategory] = useState('')
  const [tDescription, setTDescription] = useState('')
  const [tAmount, setTAmount] = useState<number>(0)
  const [tQuantity, setTQuantity] = useState<number>(1)
  const [tPaymentMethod, setTPaymentMethod] = useState('Pix')
  const [tDueDate, setTDueDate] = useState('')
  const [tPaymentStatus, setTPaymentsStatus] = useState<'pending' | 'paid' | 'cancelled'>('paid')
  const [tPaymentGatewayFee, setTPaymentGatewayFee] = useState<number>(0)
  const [selectedProductModel, setSelectedProductModel] = useState('')
  const [loadingTrans, setLoadingTrans] = useState(false)

  // States para Filtros e Busca
  const [searchTrans, setSearchTrans] = useState('')
  const [filterType, setFilterType] = useState('Todos')
  const [searchCost, setSearchCost] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      setFetching(true)
      const { data: costsData } = await supabase.from('fixed_costs').select('*').order('due_day', { ascending: true })
      if (costsData) setFixedCosts(costsData)

      const { data: transData } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false })
      if (transData) setTransactions(transData)

      const { data: productsData } = await supabase.from('products_3d').select('id, name, category, suggested_price, weight_g, print_time_hours').order('name', { ascending: true })
      if (productsData) setProducts3D(productsData)

    } catch (error: any) {
      console.error('Erro ao buscar dados financeiros:', error.message)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // FILTRAGEM DE CUSTOS FIXOS PELO MÊS SELECIONADO
  const monthFilteredFixedCosts = useMemo(() => {
    if (!selectedMonth) return fixedCosts
    return fixedCosts.filter(cost => {
      if (!cost.created_at) return true
      const createdMonth = cost.created_at.substring(0, 7)
      return createdMonth <= selectedMonth
    })
  }, [fixedCosts, selectedMonth])

  // FILTRAGEM DE TRANSAÇÕES PELO MÊS SELECIONADO
  const monthFilteredTransactions = useMemo(() => {
    if (!selectedMonth) return transactions
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth))
  }, [transactions, selectedMonth])

  // CÁLCULOS FINANCEIROS
  const totalFixedCosts = useMemo(() => {
    return monthFilteredFixedCosts.reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [monthFilteredFixedCosts])
  
  const totalReceitas = useMemo(() => {
    return monthFilteredTransactions
      .filter(t => t.type === 'Receita' && t.payment_status !== 'cancelled')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [monthFilteredTransactions])

  const totalDespesas = useMemo(() => {
    return monthFilteredTransactions
      .filter(t => t.type === 'Despesa' && t.payment_status !== 'cancelled')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0)
  }, [monthFilteredTransactions])

  const balancoLiquido = totalReceitas - (totalDespesas + totalFixedCosts)

  // KPI'S DE VENDAS
  const vendasTrans = useMemo(() => monthFilteredTransactions.filter(t => t.type === 'Receita' && (t.category === 'Vendas' || /PED-/i.test(t.description))), [monthFilteredTransactions])
  const ticketMedio = useMemo(() => vendasTrans.length > 0 ? totalReceitas / vendasTrans.length : 0, [vendasTrans, totalReceitas])
  const margemLiquidaPct = useMemo(() => totalReceitas > 0 ? (balancoLiquido / totalReceitas) * 100 : 0, [balancoLiquido, totalReceitas])

  // METRICAS DE BREAK-EVEN
  const breakEvenReais = totalFixedCosts
  const avgHourlyRate = 25 
  const avgFilamentPriceGram = 0.12 
  const breakEvenHours = totalFixedCosts > 0 ? totalFixedCosts / avgHourlyRate : 0
  const breakEvenGrams = totalFixedCosts > 0 ? totalFixedCosts / avgFilamentPriceGram : 0
  const breakEvenProgress = breakEvenReais > 0 ? Math.min(100, (totalReceitas / breakEvenReais) * 100) : 0
  const realPercentage = breakEvenReais > 0 ? (totalReceitas / breakEvenReais) * 100 : 0

  const handleViewSaleDetail = async (tr: Transaction) => {
    try {
      setLoadingSaleDetail(true)
      setShowSaleModal(true)
      setSelectedSaleDetail(null)

      let saleId = tr.sale_id || tr.order_id || ''
      let orderNumber = ''

      const matchPed = tr.description.match(/(PED-\d{6}-\d{3})/i)
      if (matchPed && matchPed[1]) {
        orderNumber = matchPed[1]
      }

      let saleData: any = null

      if (saleId) {
        const { data, error } = await supabase.from('sales').select('*').eq('id', saleId).maybeSingle()
        if (data && !error) saleData = data
      }

      if (!saleData && orderNumber) {
        const { data, error } = await supabase.from('sales').select('*').eq('numero_pedido', orderNumber).maybeSingle()
        if (data && !error) {
          saleData = data
        }
      }

      if (!saleData) {
        let rawDesc = tr.description
        const qtyMatch = rawDesc.match(/\(Qtd:\s*(\d+)\)/i)
        const qtyMock = qtyMatch ? Number(qtyMatch[1]) : 1

        let clienteMock = ''
        let produtoMock = ''

        if (rawDesc.includes('-')) {
          const parts = rawDesc.split('-').map(p => p.trim())
          if (parts.length >= 2) {
            clienteMock = parts[parts.length - 1].replace(/\(Qtd:\s*\d+\)/i, '').trim()
            produtoMock = parts.slice(0, parts.length - 1).join(' - ')
              .replace(/^Venda:\s*/i, '')
              .replace(/^Venda\s+/i, '')
              .replace(/PED-\d{6}-\d{3}/i, '')
              .trim()
          }
        }

        if (!clienteMock) clienteMock = 'Cliente Geral'
        
        if (!produtoMock) {
          produtoMock = rawDesc
            .replace(/^Venda:\s*/i, '')
            .replace(/PED-\d{6}-\d{3}\s*-?\s*/i, '')
            .replace(/\(Qtd:\s*\d+\)/i, '')
            .trim()
        }

        saleData = {
          id: tr.id,
          numero_pedido: orderNumber || `PED-OFFLINE`,
          cliente: clienteMock,
          produto: produtoMock || 'Modelo 3D Selecionado',
          qtd: qtyMock,
          subtotal: tr.amount,
          total: tr.amount,
          pagamento: tr.payment_method || 'PIX',
          status: 'Concluído',
          created_at: tr.date,
          is_mock: true
        }
      }

      const numeroPedidoFinal = saleData.numero_pedido || saleData.numeroPedido || orderNumber || 'PED-S/N'
      const clienteFinal = saleData.cliente || saleData.client || 'Cliente Geral'
      const totalFinal = Number(saleData.total || tr.amount || 0)
      const subtotalFinal = Number(saleData.subtotal || totalFinal)
      const pagamentoFinal = saleData.pagamento || tr.payment_method || 'PIX'

      // Normalizar lista de itens comprados
      let itemsList: SaleItem[] = []

      if (Array.isArray(saleData.itens) && saleData.itens.length > 0) {
        itemsList = saleData.itens.map((it: any) => ({
          nome: it.nome || it.produto || it.name || 'Modelo 3D',
          qtd: Number(it.qtd || it.quantidade || 1),
          qtdEstoqueUtilizada: Number(it.qtdEstoqueUtilizada || 0),
          qtdIndoParaProducao: Number(it.qtdIndoParaProducao || 0)
        }))
      } else if (Array.isArray(saleData.items) && saleData.items.length > 0) {
        itemsList = saleData.items.map((it: any) => ({
          nome: it.nome || it.produto || it.name || 'Modelo 3D',
          qtd: Number(it.qtd || it.quantidade || 1),
          qtdEstoqueUtilizada: Number(it.qtdEstoqueUtilizada || 0),
          qtdIndoParaProducao: Number(it.qtdIndoParaProducao || 0)
        }))
      } else {
        const rawProdStr = saleData.produto || saleData.modelo_comprado || saleData.modelo_selecionado || saleData.nome_modelo || tr.description
        
        // Remove sufixos como (+X itens) se existirem para evitar poluição no texto
        const cleanProdStr = rawProdStr.replace(/\(\+\d+\s*itens\)/gi, '').trim()

        if (cleanProdStr.includes(',') || cleanProdStr.includes('+')) {
          const parts = cleanProdStr.split(/,|\+/).map((p: string) => p.trim()).filter(Boolean)
          itemsList = parts.map((part: string) => {
            const matchQtd = part.match(/\(Qtd:\s*(\d+)\)/i) || part.match(/x\s*(\d+)/i) || part.match(/^(\d+)x/i)
            const q = matchQtd ? Number(matchQtd[1]) : Number(saleData.qtd || 1)
            const n = part.replace(/\(Qtd:\s*\d+\)/i, '').replace(/x\s*\d+/i, '').replace(/^\d+x/i, '').trim()
            
            const isProd = saleData.em_producao || saleData.emProducao || false
            return { 
              nome: n || 'Modelo 3D Selecionado', 
              qtd: q,
              qtdEstoqueUtilizada: isProd ? 0 : q,
              qtdIndoParaProducao: isProd ? q : 0
            }
          })
        } else {
          const quantidadeFinal = Number(saleData.qtd || saleData.quantidade || 1)
          const nomeLimpo = cleanProdStr.replace(/^Venda:\s*/i, '').replace(/\(Qtd:\s*\d+\)/i, '').trim()
          
          const isProd = saleData.em_producao || saleData.emProducao || false
          itemsList = [{ 
            nome: nomeLimpo || 'Modelo 3D Selecionado', 
            qtd: quantidadeFinal,
            qtdEstoqueUtilizada: isProd ? 0 : quantidadeFinal,
            qtdIndoParaProducao: isProd ? quantidadeFinal : 0
          }]
        }
      }

      let weightG = 0
      let printTimeHours = 0
      let lifetimePrintTimeHours = 0

      itemsList.forEach((item) => {
        // Encontra as especificações reais de peso e tempo de máquina cadastrados
        const spec = products3D.find(p => p.name.toLowerCase() === item.nome.toLowerCase())
        const itemWeight = spec?.weight_g ? Number(spec.weight_g) : 45 // fallback de 45g
        const itemPrintTime = spec?.print_time_hours ? Number(spec.print_time_hours) : 3 // fallback de 3h

        // Peso total engloba tudo que foi vendido
        weightG += itemWeight * item.qtd

        // Tempo operacional de máquina (para as impressoras trabalharem agora)
        const qtyToPrint = item.qtdIndoParaProducao !== undefined ? item.qtdIndoParaProducao : item.qtd
        printTimeHours += itemPrintTime * qtyToPrint

        // Tempo total acumulado de fabricação (para custos reais de energia e depreciação)
        lifetimePrintTimeHours += itemPrintTime * item.qtd
      })

      const gatewayFee = tr.payment_gateway_fee || 0
      const taxes = totalFinal * 0.06
      const materialCost = weightG * 0.09 
      // O custo de máquina (energia e desgaste) contabiliza todas as peças vendidas, mantendo o lucro líquido real e realista
      const machineCost = lifetimePrintTimeHours * 1.20 
      const netProfit = totalFinal - gatewayFee - taxes - materialCost - machineCost

      setSelectedSaleDetail({
        ...saleData,
        numero_pedido: numeroPedidoFinal,
        cliente: clienteFinal,
        items: itemsList,
        total: totalFinal,
        subtotal: subtotalFinal,
        pagamento: pagamentoFinal,
        desconto_pct: saleData.desconto_pct || saleData.descontoPercentual || 0,
        desconto_valor: saleData.desconto_valor || (subtotalFinal - totalFinal),
        weight_g: weightG,
        print_time_hours: printTimeHours,
        gateway_fee: gatewayFee,
        taxes: taxes,
        net_profit: netProfit,
        material_cost: materialCost,
        machine_cost: machineCost
      })
    } catch (err: any) {
      console.error('Erro ao processar detalhes do pedido:', err)
    } finally {
      setLoadingSaleDetail(false)
    }
  }

  const handleSelectProductModel = (productId: string) => {
    setSelectedProductModel(productId)
    if (!productId) {
      setTQuantity(1)
      setTDescription('')
      return
    }

    const product = products3D.find(p => p.id === productId)
    if (product) {
      const qty = tQuantity > 0 ? tQuantity : 1
      setTDescription(`Venda: ${product.name} (Qtd: ${qty})`)
      setTAmount(product.suggested_price * qty)
      setTCategory('Vendas')
      setTType('Receita')
    }
  }

  const handleQuantityChange = (qty: number) => {
    const newQty = qty < 1 ? 1 : qty
    setTQuantity(newQty)

    if (selectedProductModel) {
      const product = products3D.find(p => p.id === selectedProductModel)
      if (product) {
        setTDescription(`Venda: ${product.name} (Qtd: ${newQty})`)
        setTAmount(product.suggested_price * newQty)
      }
    }
  }

  const handleAddFixedCost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!costDescription) return

    setLoadingCost(true)
    setSucessoMsg('')
    
    const createdDate = `${selectedMonth}-01T00:00:00`

    try {
      const { error } = await supabase.from('fixed_costs').insert([{ 
        description: costDescription, 
        amount: costAmount, 
        category: costCategory,
        due_day: costDueDay,
        payment_method: costPaymentMethod,
        status: 'Ativo',
        created_at: createdDate
      }])
      if (error) throw error

      setCostDescription('')
      setCostAmount(0)
      setCostCategory('')
      setCostDueDay(10)
      setCostPaymentMethod('Boleto / Pix')
      setSucessoMsg('Custo fixo cadastrado com sucesso!')
      fetchData()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      alert('Erro ao salvar custo fixo: ' + error.message)
    } finally {
      setLoadingCost(false)
    }
  }

  const handlePayFixedCostNow = async (cost: FixedCost) => {
    if (!confirm(`Deseja lançar a despesa "${cost.description}" de ${formatCurrency(cost.amount)} no caixa do mês selecionado (${selectedMonth})?`)) return

    const payDate = `${selectedMonth}-10`
    try {
      const { error } = await supabase.from('financial_transactions').insert([{
        date: payDate,
        type: 'Despesa',
        category: cost.category || 'Outras Despesas',
        description: `Custo Fixo: ${cost.description}`,
        amount: cost.amount,
        status: 'Concluído',
        payment_method: cost.payment_method || 'Boleto / Pix',
        payment_status: 'paid'
      }])

      if (error) throw error
      setSucessoMsg(`Custo fixo "${cost.description}" registrado nas despesas!`)
      fetchData()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (err: any) {
      alert('Erro ao lançar custo fixo no caixa: ' + err.message)
    }
  }

  const handleDeleteFixedCost = async (id: string) => {
    if (!confirm('Deseja realmente excluir este custo fixo?')) return
    try {
      const { error } = await supabase.from('fixed_costs').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tDescription || !tDate) return

    let finalDescription = tDescription
    if (tType === 'Receita' && selectedProductModel) {
      const product = products3D.find(p => p.id === selectedProductModel)
      if (product) {
        finalDescription = `Venda: ${product.name} (Qtd: ${tQuantity})`
      }
    }

    setLoadingTrans(true)
    setSucessoMsg('')
    try {
      const { error } = await supabase.from('financial_transactions').insert([{
        date: tDate,
        type: tType,
        category: tCategory || 'Geral',
        description: finalDescription,
        amount: tAmount,
        status: tPaymentStatus === 'paid' ? 'Concluído' : tPaymentStatus === 'cancelled' ? 'Cancelado' : 'Pendente',
        payment_method: tPaymentMethod,
        due_date: tDueDate || null,
        payment_status: tPaymentStatus,
        payment_gateway_fee: tPaymentGatewayFee || 0
      }])

      if (error) throw error

      setTDate('')
      setTType('Receita')
      setTCategory('')
      setTDescription('')
      setTAmount(0)
      setTQuantity(1)
      setTPaymentMethod('Pix')
      setTDueDate('')
      setTPaymentsStatus('paid')
      setTPaymentGatewayFee(0)
      setSelectedProductModel('')
      setSucessoMsg('Transação registrada com sucesso!')
      fetchData()
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      alert('Erro ao salvar transação: ' + error.message)
    } finally {
      setLoadingTrans(false)
    }
  }

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Selecione a data...'
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length < 3) return dateStr
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  const handleDateChange = (value: any) => {
    const d = new Date(value)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setTDate(`${year}-${month}-${day}`)
    setShowCalendar(false)
  }

  const filteredTransactions = monthFilteredTransactions.filter(tr => {
    const matchesSearch = tr.description.toLowerCase().includes(searchTrans.toLowerCase()) || 
                          (tr.category && tr.category.toLowerCase().includes(searchTrans.toLowerCase()))
    const matchesType = filterType === 'Todos' || tr.type === filterType
    return matchesSearch && matchesType
  })

  const filteredFixedCosts = monthFilteredFixedCosts.filter(cost => {
    return cost.description.toLowerCase().includes(searchCost.toLowerCase()) || 
           (cost.category && cost.category.toLowerCase().includes(searchCost.toLowerCase()))
  })

  const currentCategories = tType === 'Receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 max-w-[1600px] mx-auto w-full pb-16 px-4 sm:px-6 lg:px-8"
    >
      
      {/* HEADER EXECUTIVO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Financeiro & Caixa 3D
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Controle Financeiro & Fluxo de Caixa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Gestão de faturamento, engenharia de custos e ponto de equilíbrio da sua Print Farm.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* SELETOR DE MÊS / ANO */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <CalendarIcon className="w-4 h-4 text-orange-500 ml-2" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer pr-2"
            />
          </div>

          <Link 
            href="/dashboard" 
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {sucessoMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> <span>{sucessoMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: `Receitas (${selectedMonth})`, value: formatCurrency(totalReceitas), color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
          { title: `Despesas Variáveis`, value: formatCurrency(totalDespesas), color: 'text-amber-600 dark:text-amber-400', icon: TrendingDown },
          { title: `Custos Fixos (${selectedMonth})`, value: formatCurrency(totalFixedCosts), color: 'text-rose-600 dark:text-rose-400', icon: Settings },
          { title: `Balanço Líquido`, value: formatCurrency(balancoLiquido), color: balancoLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', icon: Wallet }
        ].map((card, idx) => {
          const IconComponent = card.icon
          return (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</p>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black ${card.color}`}>{card.value}</h2>
            </motion.div>
          )
        })}
      </div>

      {/* PAINEL DE METRICAS DE ENGENHARIA 3D & BREAK-EVEN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD BREAK-EVEN DE IMPRESSÃO */}
        <div className="bg-slate-900 dark:bg-[#0f1420] p-6 rounded-3xl border border-slate-800 text-white space-y-5 shadow-2xl relative overflow-hidden group hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-orange-500/10 blur-[40px] pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Break-Even</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-slate-400">
              {selectedMonth}
            </span>
          </div>

          <div className="space-y-1.5 relative z-10">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block">Faturamento Mínimo</span>
            <div className="text-3xl font-black text-white tracking-tight">{formatCurrency(breakEvenReais)}</div>

            {/* PROGRESS / LOADING BAR */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Progresso Real: <strong className="text-orange-400">{breakEvenProgress.toFixed(1)}%</strong></span>
                <span className="font-mono text-[9px]">{formatCurrency(totalReceitas)} faturados</span>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10 relative p-0.5">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]" 
                  style={{ width: `${breakEvenProgress}%` }}
                />
              </div>
              
              {/* CONDITIONAL badge when faturamento exceeds 100% (superávit / lucro) */}
              {realPercentage > 100 && (
                <div className="flex items-center gap-1.5 pt-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-max animate-pulse">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Superávit: {realPercentage.toFixed(0)}% do Custo Fixo (+{(realPercentage - 100).toFixed(0)}%)</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 relative z-10">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <Clock className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Horas Mínimas</span>
                <span className="text-xs font-black text-white">{breakEvenHours.toFixed(0)}h / mês</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
              <Gauge className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-black block tracking-wider">Material</span>
                <span className="text-xs font-black text-white">{(breakEvenGrams / 1000).toFixed(1)} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD DE METRICAS DE VENDAS */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 space-y-5 shadow-2xl relative overflow-hidden group hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-emerald-500/5 blur-[40px] pointer-events-none" />
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Indicadores de Venda</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider">
              {vendasTrans.length} Pedidos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ticket Médio</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(ticketMedio)}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Margem Líquida</span>
              <span className={`text-2xl font-black tracking-tight ${margemLiquidaPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {margemLiquidaPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-2 relative z-10 pt-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-slate-700/40">
              <div 
                className={`h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] ${margemLiquidaPct >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`} 
                style={{ width: `${Math.min(Math.max(margemLiquidaPct, 5), 100)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block">
              {margemLiquidaPct >= 0 
                ? 'Operação lucrativa após deduzir custos fixos e taxas.' 
                : 'Margem negativa: faturamento atual abaixo do ponto de equilíbrio geral.'}
            </span>
          </div>
        </div>

        {/* CARD DE SAÚDE FINANCEIRA */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 shadow-2xl flex flex-col justify-between group hover:-translate-y-1 hover:border-amber-500/30 transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Zap className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Eficiência</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${balancoLiquido >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {balancoLiquido >= 0 ? 'Positivo' : 'Alerta'}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Comprometimento Fixo:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {totalReceitas > 0 ? ((totalFixedCosts / totalReceitas) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Custo Operacional Var.:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/50">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 leading-relaxed font-medium">
              {balancoLiquido >= 0 
                ? `🟢 Em ${selectedMonth}, sua operação está cobrindo a estrutura e gerando caixa positivo.` 
                : `🔴 Em ${selectedMonth}, a receita do mês não cobre totalmente os custos fixos da oficina.`}
            </p>
          </div>
        </div>

      </div>

      {/* SEÇÃO DE CUSTOS FIXOS */}
      <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        {/* FORMULÁRIO DE CUSTOS FIXOS */}
        <form onSubmit={handleAddFixedCost} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" /> Novo Custo Fixo Mensal (A partir de {selectedMonth})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Descrição do Custo</label>
              <input 
                type="text" 
                value={costDescription} 
                onChange={(e) => setCostDescription(e.target.value)} 
                placeholder="Ex: Aluguel da Oficina / Fusion 360"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Categoria</label>
              <select 
                value={costCategory} 
                onChange={(e) => setCostCategory(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="">Selecione...</option>
                {CATEGORIAS_CUSTO_FIXO.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Dia de Vencimento</label>
              <input 
                type="number" 
                min="1" 
                max="31"
                value={costDueDay || ''} 
                onChange={(e) => setCostDueDay(Number(e.target.value))} 
                placeholder="Ex: 10"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Forma de Pagamento</label>
              <select 
                value={costPaymentMethod} 
                onChange={(e) => setCostPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="Boleto / Pix">Boleto / Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Débito Automático">Débito Automático</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Valor Mensal (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={costAmount || ''} 
                onChange={(e) => setCostAmount(Number(e.target.value))} 
                placeholder="900.00"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loadingCost}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> {loadingCost ? 'Salvando...' : 'Adicionar Custo Fixo'}
            </button>
          </div>
        </form>

        {/* TABELA DE CUSTOS FIXOS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Custos Fixos em Atividade ({selectedMonth})
              </h2>
              <span className="text-xs text-slate-400">Exibindo apenas custos vigentes até o mês selecionado</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Pesquisar custo fixo..."
                value={searchCost}
                onChange={(e) => setSearchCost(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Forma de Pagamento</th>
                  <th className="p-4">Ativo Desde</th>
                  <th className="p-4">Valor Mensal</th>
                  <th className="p-4 pr-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                {fetching ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Carregando custos fixos...
                    </td>
                  </tr>
                ) : filteredFixedCosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhum custo fixo vigente encontrado para {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  filteredFixedCosts.map((cost) => (
                    <tr key={cost.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">{cost.description}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{cost.category || 'Geral'}</td>
                      <td className="p-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-orange-500" /> Todo dia {cost.due_day || 10}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 w-max">
                          <CreditCard className="w-3 h-3 text-slate-400" /> {cost.payment_method || 'Boleto / Pix'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px] font-medium whitespace-nowrap">
                        {cost.created_at ? formatDateDisplay(cost.created_at.substring(0, 10)) : 'Início'}
                      </td>
                      <td className="p-4 font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatCurrency(cost.amount)}</td>
                      <td className="p-4 pr-6 text-center whitespace-nowrap flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handlePayFixedCostNow(cost)}
                          title={`Lançar como despesa no caixa de ${selectedMonth}`}
                          className="text-slate-400 hover:text-emerald-500 transition p-2 rounded-xl hover:bg-emerald-500/10 inline-flex items-center justify-center cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFixedCost(cost.id)}
                          title="Excluir Custo Fixo"
                          className="text-slate-400 hover:text-rose-500 transition p-2 rounded-xl hover:bg-rose-500/10 inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE TRANSAÇÕES FINANCEIRAS */}
      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        
        {/* FORMULÁRIO DE TRANSAÇÃO */}
        <form onSubmit={handleAddTransaction} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 relative">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-500" /> Nova Transação (Fluxo de Caixa)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="relative" ref={calendarRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Data</label>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white cursor-pointer flex justify-between items-center hover:border-orange-500 transition font-medium"
              >
                <span>{formatDateDisplay(tDate)}</span>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
              </div>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 mt-2 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl"
                  >
                    <Calendar 
                      onChange={handleDateChange} 
                      value={tDate ? new Date(tDate + 'T00:00:00') : new Date()}
                      locale="pt-BR"
                      className="text-slate-900 dark:text-white border-none rounded-xl text-xs"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tipo</label>
              <select 
                value={tType} 
                onChange={(e) => {
                  setTType(e.target.value)
                  setTCategory('')
                  if (e.target.value !== 'Receita') {
                    setSelectedProductModel('')
                    setTQuantity(1)
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Categoria</label>
              <select 
                value={tCategory} 
                onChange={(e) => {
                  setTCategory(e.target.value)
                  if (e.target.value !== 'Vendas') {
                    setSelectedProductModel('')
                    setTQuantity(1)
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="">Selecione a categoria...</option>
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {tCategory === 'Vendas' && (
              <div className="md:col-span-3 bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                      <Package className="w-4 h-4" /> Puxar Modelo do Catálogo (Projetos / Produtos 3D)
                    </label>
                    <select
                      value={selectedProductModel}
                      onChange={(e) => handleSelectProductModel(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-orange-500/30 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none font-medium"
                    >
                      <option value="">Selecione um modelo cadastrado...</option>
                      {products3D.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} — {formatCurrency(prod.suggested_price)} (Unitário)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Quantidade
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={tQuantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-950 border border-orange-500/30 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Descrição</label>
              <input 
                type="text" 
                value={tDescription} 
                onChange={(e) => setTDescription(e.target.value)} 
                placeholder="Ex: Compra de Filamento PLA"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={tAmount || ''} 
                onChange={(e) => setTAmount(Number(e.target.value))} 
                placeholder="50.00"
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Método de Pagamento</label>
              <select 
                value={tPaymentMethod} 
                onChange={(e) => setTPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Data de Vencimento</label>
              <input 
                type="date" 
                value={tDueDate} 
                onChange={(e) => setTDueDate(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status de Pagamento</label>
              <select 
                value={tPaymentStatus} 
                onChange={(e) => setTPaymentsStatus(e.target.value as 'pending' | 'paid' | 'cancelled')}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Taxa de Gateway (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={tPaymentGatewayFee || ''} 
                onChange={(e) => setTPaymentGatewayFee(Number(e.target.value))} 
                placeholder="Ex: 1.50"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loadingTrans}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> {loadingTrans ? 'Salvando...' : 'Adicionar Transação'}
            </button>
          </div>
        </form>

        {/* TABELA DE TRANSAÇÕES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" /> Histórico de Transações
              </h2>
              <span className="text-xs text-slate-400">Exibindo registros de {selectedMonth}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Pesquisar transação..."
                  value={searchTrans}
                  onChange={(e) => setSearchTrans(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 w-full sm:w-64"
                />
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {['Todos', 'Receita', 'Despesa'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFilterType(tipo)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                      filterType === tipo 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Data</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Taxa Gateway</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4 pr-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                {fetching ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Carregando transações...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhuma transação encontrada para {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 pl-6 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">{formatDateDisplay(tr.date)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tr.type === 'Receita' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                          {tr.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{tr.description}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{tr.category || 'Geral'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{tr.payment_method || '-'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{tr.due_date ? formatDateDisplay(tr.due_date) : '-'}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tr.payment_status === 'paid' || tr.status === 'Concluído'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : tr.payment_status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {tr.payment_status === 'paid' || tr.status === 'Concluído' ? 'Pago' : tr.payment_status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-rose-500 dark:text-rose-400/80 whitespace-nowrap">
                        {tr.payment_gateway_fee ? formatCurrency(tr.payment_gateway_fee) : '-'}
                      </td>
                      <td className={`p-4 font-extrabold whitespace-nowrap ${tr.type === 'Receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {formatCurrency(tr.amount)}
                      </td>
                      <td className="p-4 pr-6 text-center whitespace-nowrap flex items-center justify-center gap-1.5">
                        {(tr.type === 'Receita' && (tr.sale_id || tr.order_id || tr.category === 'Vendas' || /PED-/i.test(tr.description))) ? (
                          <button 
                            type="button"
                            onClick={() => handleViewSaleDetail(tr)}
                            title="Visualizar Detalhes do Pedido"
                            className="text-slate-400 hover:text-orange-500 transition p-2 rounded-xl hover:bg-orange-500/10 inline-flex items-center justify-center cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO PEDIDO / VENDA */}
      <AnimatePresence>
        {showSaleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaleModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* CABEÇALHO DO MODAL */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider">
                      Resumo da Venda
                    </span>
                    {selectedSaleDetail?.is_mock && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Detalhes Calculados
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-500" />
                    {loadingSaleDetail ? 'Carregando detalhes...' : selectedSaleDetail?.numero_pedido}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowSaleModal(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CORPO DO MODAL */}
              <div className="p-6 overflow-y-auto space-y-6">
                {loadingSaleDetail ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin"></div>
                    <span className="text-xs text-slate-400 font-bold">Buscando dados no Supabase...</span>
                  </div>
                ) : selectedSaleDetail ? (
                  <>
                    {/* CÓDIGO DO PEDIDO, CLIENTE E PAGAMENTO */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                          <Hash className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Código do Pedido</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{selectedSaleDetail.numero_pedido}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cliente</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{selectedSaleDetail.cliente}</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Método de Pagamento</span>
                        <span className="text-xs font-black text-orange-500 uppercase">{selectedSaleDetail.pagamento || 'PIX'}</span>
                      </div>
                    </div>

                    {/* MODELO COMPRADO SELECIONADO DA LISTA (EXIBIÇÃO EM LINHA DE MÚLTIPLOS ITENS) */}
                      <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Modelos Comprados e Fila de Fabricação
                        </span>
                        
                        <div className="space-y-2">
                          {selectedSaleDetail.items && selectedSaleDetail.items.length > 0 ? (
                            selectedSaleDetail.items.map((item: SaleItem, idx: number) => (
                              <div 
                                key={idx} 
                                className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 py-2.5 bg-white dark:bg-slate-900 px-4 rounded-xl border border-slate-200 dark:border-slate-800"
                              >
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 animate-pulse"></span>
                                  {item.nome}
                                </span>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {item.qtdEstoqueUtilizada !== undefined && item.qtdEstoqueUtilizada > 0 && (
                                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                                      Pronta Entrega: {item.qtdEstoqueUtilizada} un.
                                    </span>
                                  )}
                                  {item.qtdIndoParaProducao !== undefined && item.qtdIndoParaProducao > 0 && (
                                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 whitespace-nowrap">
                                      Fila Produção: {item.qtdIndoParaProducao} un.
                                    </span>
                                  )}
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
                                    Qtd: {item.qtd}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex justify-between items-center py-2.5 bg-white dark:bg-slate-900 px-4 rounded-xl border border-slate-200 dark:border-slate-800">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 animate-pulse"></span>
                                Modelo 3D Selecionado
                              </span>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
                                Qtd: 1
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                          <Gauge className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peso Total Estimado</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{selectedSaleDetail.weight_g.toFixed(0)}g</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tempo de Máquina</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{selectedSaleDetail.print_time_hours.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resumo Financeiro & Margens</span>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Subtotal Bruto</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(selectedSaleDetail.subtotal || selectedSaleDetail.total)}</span>
                        </div>

                        {selectedSaleDetail.desconto_pct > 0 && (
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Desconto Global ({selectedSaleDetail.desconto_pct}%)</span>
                            <span className="font-bold text-emerald-500">-{formatCurrency(selectedSaleDetail.desconto_valor)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-500 dark:text-slate-400 font-extrabold border-t border-slate-200 dark:border-slate-800/60 pt-1">
                          <span>Faturamento Bruto Final</span>
                          <span className="text-slate-900 dark:text-white">{formatCurrency(selectedSaleDetail.total)}</span>
                        </div>
                        
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Taxa de Gateway / Maquininha</span>
                          <span className="font-bold text-rose-500">-{formatCurrency(selectedSaleDetail.gateway_fee)}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Impostos Estimados (6% Simples)</span>
                          <span className="font-bold text-rose-500">-{formatCurrency(selectedSaleDetail.taxes)}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                          <span>Custo de Material Estimado</span>
                          <span className="font-bold text-amber-500">-{formatCurrency(selectedSaleDetail.material_cost)}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Depreciação & Energia Estimada</span>
                          <span className="font-bold text-amber-500">-{formatCurrency(selectedSaleDetail.machine_cost)}</span>
                        </div>

                        <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-3">
                          <span className="flex items-center gap-1.5">
                            <Percent className="w-4 h-4 text-emerald-500" /> Lucro Líquido Real
                          </span>
                          <span className="text-emerald-500">{formatCurrency(selectedSaleDetail.net_profit)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">Não foi possível carregar os detalhes desta venda.</div>
                )}
              </div>

              {/* RODAPÉ DO MODAL */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-end">
                <button 
                  onClick={() => setShowSaleModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}