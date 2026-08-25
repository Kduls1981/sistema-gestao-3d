'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { formatCurrency } from '@/lib/formatters'
import {
  Calculator,
  ArrowLeft,
  Plus,
  Trash2,
  Settings,
  BarChart3,
  CheckCircle2,
  Save,
  Layers,
  Cpu,
  Scale,
  Clock,
  Percent,
  Sparkles,
  Package,
  Wrench,
  AlertTriangle,
  X
} from 'lucide-react'

type InputItem = {
  id: string
  name: string
  price_per_kg?: number
  price_per_unit?: number
}

type Machine = {
  id: string
  name: string
  cost_per_hour?: number
  depreciation_per_hour?: number
  power_consumption_kwh?: number
}

type SelectedFilament = {
  inputId: string
  weightGrams: number
}

function CalculadoraContent() {
  // Parâmetros principais
  const [selectedMachineId, setSelectedMachineId] = useState<string>('')
  const [tempoHoras, setTempoHoras] = useState<number>(1.5)
  const [margemLucro, setMargemLucro] = useState<number>(200)

  // Custos adicionais
  const [acabamentoMin, setAcabamentoMin] = useState<number>(5)
  const [custoEmbalagem, setCustoEmbalagem] = useState<number>(2.5)
  const [custoExtras, setCustoExtras] = useState<number>(0)

  // Lista de Filamentos Selecionados com peso individual em gramas
  const [filamentosSelecionados, setFilamentosSelecionados] = useState<SelectedFilament[]>([
    { inputId: '', weightGrams: 40 }
  ])

  const [inputs, setInputs] = useState<InputItem[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  
  const [custoHoraMaquina, setCustoHoraMaquina] = useState<number>(3.00)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')

  // ESTADOS DO MODAL PERSONALIZADO
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nomeProdutoModal, setNomeProdutoModal] = useState('Peça 3D Personalizada')
  const [erroModal, setErroModal] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const { data: inputsData } = await supabase.from('inputs').select('*')
        if (inputsData) setInputs(inputsData)

        const { data: machinesData } = await supabase.from('machines').select('*')
        if (machinesData) setMachines(machinesData)
      } catch (error) {
        console.error('Erro ao buscar dados do Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Atualizar custo da máquina quando selecionada
  const handleMachineChange = (id: string) => {
    setSelectedMachineId(id)
    const found = machines.find((item) => item.id === id)
    if (found) {
      const dep = found.depreciation_per_hour || 0
      const power = found.power_consumption_kwh || 0
      const energyCost = power * 0.85 
      const calculatedCost = dep + energyCost
      
      const price = found.cost_per_hour !== undefined ? found.cost_per_hour : (calculatedCost || 3.00)
      setCustoHoraMaquina(price)
    } else {
      setCustoHoraMaquina(3.00)
    }
  }

  // Manipulação da lista de filamentos
  const addFilamento = () => {
    setFilamentosSelecionados(prev => [...prev, { inputId: '', weightGrams: 0 }])
  }

  const removeFilamento = (index: number) => {
    if (filamentosSelecionados.length > 1) {
      setFilamentosSelecionados(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateFilamento = (index: number, field: 'inputId' | 'weightGrams', value: any) => {
    setFilamentosSelecionados(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Soma automática do Peso Total a partir das gramaturas de cada cor
  const pesoTotalCalculado = filamentosSelecionados.reduce((acc, f) => acc + (Number(f.weightGrams) || 0), 0)

  // CÁLCULOS FINANCEIROS
  const custoMaterialBruto = filamentosSelecionados.reduce((acc, item) => {
    const found = inputs.find(i => i.id === item.inputId)
    const pricePerKg = found ? (found.price_per_kg ?? found.price_per_unit ?? 100) : 100
    const itemWeight = Number(item.weightGrams) || 0
    return acc + ((itemWeight / 1000) * pricePerKg)
  }, 0)

  // 5% de taxa de perda operando exclusivamente sobre a matéria-prima
  const custoMaterialComPerda = custoMaterialBruto * 1.05 
  const custoOperacaoMaquina = (Number(tempoHoras) || 0) * custoHoraMaquina
  
  // Taxa de acabamento (R$ 0,25 por minuto)
  const custoAcabamento = (Number(acabamentoMin) || 0) * 0.25

  const custoTotalProducao = custoMaterialComPerda + custoOperacaoMaquina + custoAcabamento + Number(custoEmbalagem || 0) + Number(custoExtras || 0)
  
  // Cálculo do preço com arredondamento para o próximo múltiplo de R$ 0,50 para cima
  const roundUpTo50Cents = (val: number) => Math.ceil(val * 2) / 2
  const precoSugeridoBruto = custoTotalProducao * (1 + (Number(margemLucro) || 0) / 100)
  const precoSugerido = roundUpTo50Cents(precoSugeridoBruto)
  const lucroEstimado = precoSugerido - custoTotalProducao

  // Abrir Modal de Salvar
  const handleOpenSaveModal = () => {
    setErroModal('')
    setIsModalOpen(true)
  }

  // Confirmar salvamento via Modal
  const handleConfirmarSalvar = async () => {
    if (!nomeProdutoModal.trim()) {
      setErroModal('Por favor, informe o nome do produto.')
      return
    }

    try {
      setSalvando(true)
      setSucessoMsg('')

      const primaryInputId = filamentosSelecionados[0]?.inputId || null
      const inputsListFormatted = filamentosSelecionados.map(f => ({
        input_id: f.inputId,
        weight_g: Number(f.weightGrams) || 0
      }))

      const { error } = await supabase.from('products_3d').insert([
        {
          name: nomeProdutoModal,
          category: 'Geral',
          machine_id: selectedMachineId || null,
          input_id: primaryInputId,
          inputs_list: inputsListFormatted,
          weight_g: Number(pesoTotalCalculado) || 0,
          print_time_hours: Number(tempoHoras) || 0,
          handling_time_min: Number(acabamentoMin) || 0,
          profit_margin_pct: Number(margemLucro) || 0,
          marketplace_fee_pct: 0,
          packaging_cost: Number(custoEmbalagem) || 0,
          extra_costs: Number(custoExtras) || 0,
          suggested_price: Number(precoSugerido.toFixed(2))
        }
      ])

      if (error) throw error
      setIsModalOpen(false)
      setSucessoMsg('Produto salvo com sucesso no catálogo!')
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      setErroModal(`Erro ao salvar: ${error.message || error}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto w-full pb-16 px-4 sm:px-6 relative">
      
      {/* HEADER EXECUTIVO GLASSMORPHISM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 dark:bg-[#0c162b]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              Enterprise OS • Precificação 3D
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Calculator className="w-7 h-7 text-cyan-500" />
            Calculadora de Rentabilidade 3D
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Insira os parâmetros e selecione os insumos sincronizados para validar a viabilidade e o preço ideal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200/50 dark:border-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" /> {sucessoMsg}
        </div>
      )}

      {/* GRID DE FORMULÁRIO E RESULTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA DE PARÂMETROS */}
        <div className="bg-white/90 dark:bg-[#0c162b]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-500" />
            Parâmetros de Impressão
          </h2>

          {/* IMPRESSORA */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              Impressora / Máquina
            </label>
            <select 
              value={selectedMachineId} 
              onChange={(e) => handleMachineChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-medium cursor-pointer"
            >
              <option value="">Padrão ({formatCurrency(custoHoraMaquina)}/h)</option>
              {machines.map((mac) => {
                const dep = mac.depreciation_per_hour || 0
                const power = mac.power_consumption_kwh || 0
                const calculated = dep + (power * 0.85)
                const price = mac.cost_per_hour !== undefined ? mac.cost_per_hour : (calculated || 3.00)
                return (
                  <option key={mac.id} value={mac.id}>
                    {mac.name} ({formatCurrency(price)}/h)
                  </option>
                )
              })}
            </select>
          </div>

          {/* FILAMENTOS / MULTI-CORES COM CAMPO DE GRAMAS */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                Filamento(s) / Multi-Cores
              </label>
              <button
                type="button"
                onClick={addFilamento}
                className="text-xs font-extrabold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Cor / Filamento
              </button>
            </div>

            {filamentosSelecionados.map((filamento, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select 
                  value={filamento.inputId} 
                  onChange={(e) => updateFilamento(index, 'inputId', e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-medium cursor-pointer"
                >
                  <option value="">Padrão (R$ 100/kg - R$ 0,10/g)</option>
                  {inputs.map((item) => {
                    const price = item.price_per_kg !== undefined ? item.price_per_kg : (item.price_per_unit || 100)
                    return (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatCurrency(price)}/kg)
                      </option>
                    )
                  })}
                </select>

                <div className="w-24 shrink-0 relative">
                  <input
                    type="number"
                    value={filamento.weightGrams || ''}
                    onChange={(e) => updateFilamento(index, 'weightGrams', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-bold pr-7"
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">g</span>
                </div>

                {filamentosSelecionados.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFilamento(index)}
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition cursor-pointer"
                    title="Remover cor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* PESO TOTAL (AUTOMÁTICO), TEMPO E MARGEM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Scale className="w-3 h-3 text-cyan-500" />
                Peso Total (g)
              </label>
              <input 
                type="number" 
                value={pesoTotalCalculado} 
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none font-black cursor-not-allowed opacity-90"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-500" />
                Tempo (h)
              </label>
              <input 
                type="number" 
                step="0.1"
                value={tempoHoras || ''} 
                onChange={(e) => setTempoHoras(Number(e.target.value))}
                placeholder="Ex: 1.5"
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Percent className="w-3 h-3 text-cyan-500" />
                Margem (%)
              </label>
              <input 
                type="number" 
                value={margemLucro} 
                onChange={(e) => setMargemLucro(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-bold"
              />
            </div>
          </div>

          {/* ACABAMENTO, EMBALAGEM E EXTRAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-cyan-500" />
                Acabamento (min)
              </label>
              <input 
                type="number" 
                value={acabamentoMin || ''} 
                onChange={(e) => setAcabamentoMin(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Package className="w-3 h-3 text-cyan-500" />
                Embalagem (R$)
              </label>
              <input 
                type="number" 
                step="0.1"
                value={custoEmbalagem || ''} 
                onChange={(e) => setCustoEmbalagem(Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-500" />
                Extras (R$)
              </label>
              <input 
                type="number" 
                step="0.1"
                value={custoExtras || ''} 
                onChange={(e) => setCustoExtras(Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition font-bold"
              />
            </div>
          </div>
        </div>

        {/* COLUNA DE RESULTADOS E VIABILIDADE */}
        <div className="bg-white/90 dark:bg-[#0c162b]/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-500" />
              Análise de Viabilidade
            </h2>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Custo do Material (inclui 5% perda):</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(custoMaterialComPerda)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Custo de Operação/Máquina:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(custoOperacaoMaquina)}</span>
              </div>

              {(acabamentoMin > 0 || custoEmbalagem > 0 || custoExtras > 0) && (
                <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">Acabamento & Extras:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(custoAcabamento + Number(custoEmbalagem || 0) + Number(custoExtras || 0))}</span>
                </div>
              )}

              <div className="flex justify-between items-center p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">Custo Total de Produção:</span>
                <span className="font-black text-base text-cyan-600 dark:text-cyan-400">{formatCurrency(custoTotalProducao)}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Lucro Estimado:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(lucroEstimado)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 dark:bg-[#070c14] p-6 rounded-3xl border border-cyan-500/20 text-center shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="block text-[10px] text-cyan-400 uppercase tracking-widest font-extrabold mb-1">Preço de Venda Sugerido</span>
              <span className="text-3xl sm:text-4xl font-black text-white">
                {formatCurrency(precoSugerido)}
              </span>
            </div>
            
            <button
              onClick={handleOpenSaveModal}
              disabled={salvando || pesoTotalCalculado <= 0}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar no Catálogo
            </button>
          </div>
        </div>

      </div>

      {/* MODAL PADRÃO SISTEMA ENTERPRISE OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0f172a] border border-cyan-500/20 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-center relative">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ÍCONE DE ALERTA NO MESMO FORMATO DO SISTEMA */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Salvar Produto 3D</h3>
              <p className="text-xs text-slate-400 mt-1">
                Digite o nome da peça para registrar a precificação no catálogo.
              </p>
            </div>

            <div className="text-left">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Nome do Produto
              </label>
              <input
                type="text"
                value={nomeProdutoModal}
                onChange={(e) => setNomeProdutoModal(e.target.value)}
                placeholder="Ex: Peça 3D Personalizada"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-cyan-500 transition font-bold"
                autoFocus
              />
            </div>

            {erroModal && (
              <p className="text-xs font-bold text-rose-400">{erroModal}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-extrabold transition border border-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleConfirmarSalvar}
                disabled={salvando}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-extrabold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default function CalculadoraRentabilidade3D() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center text-slate-400 text-xs font-bold animate-pulse">
        Carregando Calculadora 3D...
      </div>
    }>
      <CalculadoraContent />
    </Suspense>
  )
}