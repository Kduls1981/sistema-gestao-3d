'use client'

import { useState, useEffect, useRef } from 'react'
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
  AlertCircle
} from 'lucide-react'

type FixedCost = {
  id: string
  description: string
  amount: number
  category?: string
  due_day?: number
  payment_method?: string
  status?: string
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
}

type Product3D = {
  id: string
  name: string
  category: string
  suggested_price: number
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
  'Contนนidade / Manutenção Preventiva',
  'Outros Custos Fixos'
]

export default function FinanceiroPage() {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products3D, setProducts3D] = useState<Product3D[]>([])
  const [fetching, setFetching] = useState(true)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // States para Custos Fixos Aprimorados
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
  const [tStatus, setTStatus] = useState('Concluído')
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

      const { data: productsData } = await supabase.from('products_3d').select('id, name, category, suggested_price').order('name', { ascending: true })
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
    try {
      const { error } = await supabase.from('fixed_costs').insert([{ 
        description: costDescription, 
        amount: costAmount, 
        category: costCategory,
        due_day: costDueDay,
        payment_method: costPaymentMethod,
        status: 'Ativo'
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
      setTStatus('Concluído')
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

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return
    try {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Selecione a data...'
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const handleDateChange = (value: any) => {
    const d = new Date(value)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setTDate(`${year}-${month}-${day}`)
    setShowCalendar(false)
  }

  const filteredTransactions = transactions.filter(tr => {
    const matchesSearch = tr.description.toLowerCase().includes(searchTrans.toLowerCase()) || 
                          (tr.category && tr.category.toLowerCase().includes(searchTrans.toLowerCase()))
    const matchesType = filterType === 'Todos' || tr.type === filterType
    return matchesSearch && matchesType
  })

  const filteredFixedCosts = fixedCosts.filter(cost => {
    return cost.description.toLowerCase().includes(searchCost.toLowerCase()) || 
           (cost.category && cost.category.toLowerCase().includes(searchCost.toLowerCase()))
  })

  const totalFixedCosts = fixedCosts.reduce((acc, item) => acc + Number(item.amount), 0)
  const totalReceitas = transactions.filter(t => t.type === 'Receita').reduce((acc, item) => acc + Number(item.amount), 0)
  const totalDespesas = transactions.filter(t => t.type === 'Despesa').reduce((acc, item) => acc + Number(item.amount), 0)
  const balancoLiquido = totalReceitas - (totalDespesas + totalFixedCosts)

  const currentCategories = tType === 'Receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 w-full pb-16 px-4 sm:px-6 lg:px-8"
    >
      
      {/* HEADER EXECUTIVO REFINADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Enterprise OS • Financeiro & Caixa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Controle Financeiro & Fluxo de Caixa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Gerencie seus custos fixos estruturados e transações integradas ao Supabase com precisão profissional.
          </p>
        </div>

        <div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
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

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total de Receitas', value: formatCurrency(totalReceitas), color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
          { title: 'Total de Despesas', value: formatCurrency(totalDespesas), color: 'text-amber-600 dark:text-amber-400', icon: TrendingDown },
          { title: 'Custos Fixos Mensais', value: formatCurrency(totalFixedCosts), color: 'text-rose-600 dark:text-rose-400', icon: Settings },
          { title: 'Balanço Líquido', value: formatCurrency(balancoLiquido), color: balancoLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400', icon: Wallet }
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

      {/* SEÇÃO DE CUSTOS FIXOS APRIMORADA */}
      <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        {/* FORMULÁRIO DE CUSTOS FIXOS */}
        <form onSubmit={handleAddFixedCost} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" /> Novo Custo Fixo Mensal (Estrutura 3D)
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
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> {loadingCost ? 'Salvando...' : 'Adicionar Custo Fixo'}
            </button>
          </div>
        </form>

        {/* TABELA DE CUSTOS FIXOS APRIMORADA */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" /> Custos Fixos Cadastrados
            </h2>
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 pl-6">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Forma de Pagamento</th>
                  <th className="p-4">Valor Mensal</th>
                  <th className="p-4 pr-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                {fetching ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Carregando custos fixos...
                    </td>
                  </tr>
                ) : filteredFixedCosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhum custo fixo encontrado.
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
                      <td className="p-4 font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatCurrency(cost.amount)}</td>
                      <td className="p-4 pr-6 text-center whitespace-nowrap">
                        <button 
                          onClick={() => handleDeleteFixedCost(cost.id)}
                          title="Excluir Custo Fixo"
                          className="text-slate-400 hover:text-rose-500 transition p-2 rounded-xl hover:bg-rose-500/10 inline-flex items-center justify-center"
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
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> {loadingTrans ? 'Salvando...' : 'Adicionar Transação'}
            </button>
          </div>
        </form>

        {/* TABELA DE TRANSAÇÕES */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" /> Histórico de Transações
            </h2>
            
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
            <table className="w-full text-left border-collapse">
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
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Carregando transações...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhuma transação encontrada com os filtros atuais.
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
                      <td className="p-4 pr-6 text-center whitespace-nowrap">
                        <button 
                          onClick={() => handleDeleteTransaction(tr.id)}
                          title="Excluir Transação"
                          className="text-slate-400 hover:text-rose-500 transition p-2 rounded-xl hover:bg-rose-500/10 inline-flex items-center justify-center"
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

    </motion.div>
  )
}