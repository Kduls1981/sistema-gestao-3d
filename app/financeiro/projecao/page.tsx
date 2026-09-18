'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { TrendingUp, Layers, Cpu, ShieldCheck, DollarSign, Save, RefreshCw } from 'lucide-react'

type ProjectionRow = {
  id?: string
  period: string
  // Parâmetros de Estrutura
  parque_maquinas: string
  dias_uteis: number
  horas_mes_maquina: number
  // Receitas
  faturamento_bruto: number
  vendas_marketplaces: number
  vendas_diretas_b2c: number
  vendas_b2b_contratos: number
  // Deduções e Custos
  impostos_faturamento: number
  taxas_comissoes: number
  cmv_insumos_pla: number
  energia_eletrica: number
  manutencao_maquinas: number
  // Custos Fixos / OPEX
  opex_aluguel: number
  opex_softwares_assinaturas: number
  opex_pro_labore: number
  opex_marketing_anuncios: number
  opex_contabilidade_administrativo: number
  total_opex: number
  // Resultados
  lucro_operacional: number
  capex_aquisicao_maquinas: number
  fluxo_caixa_livre: number
  caixa_acumulado: number
}

const DADOS_INICIAIS: ProjectionRow[] = [
  { period: 'M1', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 300, faturamento_bruto: 1650.00, vendas_marketplaces: 825.00, vendas_diretas_b2c: 825.00, vendas_b2b_contratos: 0.00, impostos_faturamento: 0.00, taxas_comissoes: 33.00, cmv_insumos_pla: 300.00, energia_eletrica: 35.48, manutencao_maquinas: 12.00, opex_aluguel: 0.00, opex_softwares_assinaturas: 0.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 0.00, opex_contabilidade_administrativo: 0.00, total_opex: 0.00, lucro_operacional: 1269.52, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 1269.52, caixa_acumulado: 1269.52 },
  { period: 'M2', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 350, faturamento_bruto: 3300.00, vendas_marketplaces: 1650.00, vendas_diretas_b2c: 1155.00, vendas_b2b_contratos: 495.00, impostos_faturamento: 0.00, taxas_comissoes: 264.00, cmv_insumos_pla: 600.00, energia_eletrica: 70.97, manutencao_maquinas: 24.00, opex_aluguel: 0.00, opex_softwares_assinaturas: 0.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 0.00, opex_contabilidade_administrativo: 0.00, total_opex: 0.00, lucro_operacional: 2341.04, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 2341.04, caixa_acumulado: 3610.55 },
  { period: 'M3', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 400, faturamento_bruto: 4950.00, vendas_marketplaces: 2475.00, vendas_diretas_b2c: 1485.00, vendas_b2b_contratos: 990.00, impostos_faturamento: 0.00, taxas_comissoes: 574.20, cmv_insumos_pla: 900.00, energia_eletrica: 106.45, manutencao_maquinas: 36.00, opex_aluguel: 0.00, opex_softwares_assinaturas: 0.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 0.00, opex_contabilidade_administrativo: 0.00, total_opex: 0.00, lucro_operacional: 3333.35, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 3333.35, caixa_acumulado: 3941.91 },
  { period: 'M4', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 400, faturamento_bruto: 5005.00, vendas_marketplaces: 2502.50, vendas_diretas_b2c: 1501.50, vendas_b2b_contratos: 1001.00, impostos_faturamento: 200.00, taxas_comissoes: 640.64, cmv_insumos_pla: 900.00, energia_eletrica: 106.45, manutencao_maquinas: 47.58, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 0.00, total_opex: 954.00, lucro_operacional: 2356.33, capex_aquisicao_maquinas: 1784.94, fluxo_caixa_livre: 571.39, caixa_acumulado: 4513.29 },
  { period: 'M5', parque_maquinas: '1 A1', dias_uteis: 22, horas_mes_maquina: 400, faturamento_bruto: 5005.00, vendas_marketplaces: 2502.50, vendas_diretas_b2c: 1501.50, vendas_b2b_contratos: 1001.00, impostos_faturamento: 200.00, taxas_comissoes: 700.70, cmv_insumos_pla: 900.00, energia_eletrica: 106.45, manutencao_maquinas: 47.58, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 2226.27, capex_aquisicao_maquinas: 1784.94, fluxo_caixa_livre: 441.33, caixa_acumulado: 4814.81 },
  { period: 'M6', parque_maquinas: '2 A1', dias_uteis: 22, horas_mes_maquina: 700, faturamento_bruto: 9900.00, vendas_marketplaces: 4950.00, vendas_diretas_b2c: 2970.00, vendas_b2b_contratos: 1980.00, impostos_faturamento: 396.00, taxas_comissoes: 1504.80, cmv_insumos_pla: 1750.00, energia_eletrica: 210.00, manutencao_maquinas: 124.90, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 5286.31, capex_aquisicao_maquinas: 4675.00, fluxo_caixa_livre: 611.31, caixa_acumulado: 3641.17 },
  { period: 'M7', parque_maquinas: '2 A1', dias_uteis: 22, horas_mes_maquina: 700, faturamento_bruto: 10010.00, vendas_marketplaces: 5005.00, vendas_diretas_b2c: 3003.00, vendas_b2b_contratos: 2002.00, impostos_faturamento: 400.40, taxas_comissoes: 1641.64, cmv_insumos_pla: 1750.00, energia_eletrica: 210.00, manutencao_maquinas: 148.06, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 5236.30, capex_aquisicao_maquinas: 1784.94, fluxo_caixa_livre: 3451.36, caixa_acumulado: 7092.53 },
  { period: 'M8', parque_maquinas: '3 A1', dias_uteis: 22, horas_mes_maquina: 1050, faturamento_bruto: 14300.00, vendas_marketplaces: 7150.00, vendas_diretas_b2c: 4290.00, vendas_b2b_contratos: 2860.00, impostos_faturamento: 572.00, taxas_comissoes: 2345.20, cmv_insumos_pla: 2500.00, energia_eletrica: 315.00, manutencao_maquinas: 196.52, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 7919.29, capex_aquisicao_maquinas: 4675.00, fluxo_caixa_livre: 3244.29, caixa_acumulado: 5883.76 },
  { period: 'M9', parque_maquinas: '4 A1', dias_uteis: 22, horas_mes_maquina: 1300, faturamento_bruto: 16500.00, vendas_marketplaces: 8250.00, vendas_diretas_b2c: 4950.00, vendas_b2b_contratos: 3300.00, impostos_faturamento: 660.00, taxas_comissoes: 2706.00, cmv_insumos_pla: 2900.00, energia_eletrica: 390.00, manutencao_maquinas: 184.83, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 70.00, total_opex: 1024.00, lucro_operacional: 9295.18, capex_aquisicao_maquinas: 1784.94, fluxo_caixa_livre: 7510.24, caixa_acumulado: 4422.14 },
  { period: 'M10', parque_maquinas: '4 A1', dias_uteis: 22, horas_mes_maquina: 1350, faturamento_bruto: 18700.00, vendas_marketplaces: 9350.00, vendas_diretas_b2c: 5610.00, vendas_b2b_contratos: 3740.00, impostos_faturamento: 748.00, taxas_comissoes: 3066.80, cmv_insumos_pla: 3200.00, energia_eletrica: 405.00, manutencao_maquinas: 333.14, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 100.00, total_opex: 1054.00, lucro_operacional: 10641.07, capex_aquisicao_maquinas: 1784.94, fluxo_caixa_livre: 8856.13, caixa_acumulado: 8976.63 },
  { period: 'M11', parque_maquinas: '5 A1', dias_uteis: 22, horas_mes_maquina: 1600, faturamento_bruto: 21450.00, vendas_marketplaces: 10725.00, vendas_diretas_b2c: 6435.00, vendas_b2b_contratos: 4290.00, impostos_faturamento: 858.00, taxas_comissoes: 3517.80, cmv_insumos_pla: 3800.00, energia_eletrica: 480.00, manutencao_maquinas: 237.27, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 100.00, total_opex: 1054.00, lucro_operacional: 12360.93, capex_aquisicao_maquinas: 3552.04, fluxo_caixa_livre: 8808.89, caixa_acumulado: 7438.81 },
  { period: 'M12', parque_maquinas: '6 A1', dias_uteis: 22, horas_mes_maquina: 1800, faturamento_bruto: 24750.00, vendas_marketplaces: 12375.00, vendas_diretas_b2c: 7425.00, vendas_b2b_contratos: 4950.00, impostos_faturamento: 990.00, taxas_comissoes: 3910.50, cmv_insumos_pla: 4300.00, energia_eletrica: 540.00, manutencao_maquinas: 372.24, opex_aluguel: 600.00, opex_softwares_assinaturas: 154.00, opex_pro_labore: 0.00, opex_marketing_anuncios: 200.00, opex_contabilidade_administrativo: 100.00, total_opex: 1054.00, lucro_operacional: 14573.26, capex_aquisicao_maquinas: 0.00, fluxo_caixa_livre: 14573.26, caixa_acumulado: 6892.52 }
]

// Função auxiliar para formatar números no formato exato: 0.000,00
const formatarMoeda = (valor: number) => {
  if (isNaN(valor)) return '0,00'
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ProjecaoCaixaPage() {
  const [registros, setRegistros] = useState<ProjectionRow[]>(DADOS_INICIAIS)
  const [loading, setLoading] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'fluxo' | 'capex' | 'opex' | 'cmv' | 'taxas'>('fluxo')

  useEffect(() => {
    carregarDadosSupabase()
  }, [])

  const carregarDadosSupabase = async () => {
    try {
      const { data, error } = await supabase.from('projected_cash_flow_conservador').select('*')
      if (data && data.length > 0) {
        const ordenado = data.sort((a, b) => parseInt(a.period.replace('M', '')) - parseInt(b.period.replace('M', '')))
        setRegistros(ordenado)
      }
    } catch (err) {
      console.error('Erro ao buscar do Supabase:', err)
    }
  }

  const handleCellChange = (period: string, field: keyof ProjectionRow, value: string) => {
    const numValue = (field === 'parque_maquinas') ? value : parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
    
    setRegistros(prev => {
      const updated = prev.map(item => {
        if (item.period === period) {
          const newItem = { ...item, [field]: numValue }
          // Recalcula total OPEX se algum campo OPEX mudar
          newItem.total_opex = Number((newItem.opex_aluguel + newItem.opex_softwares_assinaturas + newItem.opex_pro_labore + newItem.opex_marketing_anuncios + newItem.opex_contabilidade_administrativo).toFixed(2))
          
          // Recalcula Lucro Operacional: Faturamento - (Impostos + Taxas + CMV + Energia + Manutenção + Total OPEX)
          const deducoesECustos = newItem.impostos_faturamento + newItem.taxas_comissoes + newItem.cmv_insumos_pla + newItem.energia_eletrica + newItem.manutencao_maquinas + newItem.total_opex
          newItem.lucro_operacional = Number((newItem.faturamento_bruto - deducoesECustos).toFixed(2))
          
          // Fluxo de Caixa Livre: Lucro Operacional - CAPEX
          newItem.fluxo_caixa_livre = Number((newItem.lucro_operacional - newItem.capex_aquisicao_maquinas).toFixed(2))
          return newItem
        }
        return item
      })

      // Recalcula Caixa Acumulado em cadeia
      return updated.map((item, idx) => {
        const realAcumulado = idx === 0 
          ? item.fluxo_caixa_livre 
          : updated.slice(0, idx + 1).reduce((acc, curr) => acc + curr.fluxo_caixa_livre, 0)
        return { ...item, caixa_acumulado: Number(realAcumulado.toFixed(2)) }
      })
    })
  }

  const handleSalvarNoSupabase = async () => {
    try {
      setLoading(true)
      for (const item of registros) {
        const dadosParaSalvar = { ...item }
        if (dadosParaSalvar.id && !dadosParaSalvar.id.includes('-')) {
          delete dadosParaSalvar.id
        }

        const { error } = await supabase
          .from('projected_cash_flow_conservador')
          .upsert([dadosParaSalvar], { onConflict: 'period' })
        
        if (error) throw error
      }
      setSucessoMsg('Todas as linhas foram salvas e sincronizadas com sucesso no Supabase!')
      setTimeout(() => setSucessoMsg(''), 4000)
      carregarDadosSupabase()
    } catch (err: any) {
      alert('Erro ao salvar no Supabase: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalFaturamento = registros.reduce((acc, curr) => acc + Number(curr.faturamento_bruto), 0)
  const totalCustoOp = registros.reduce((acc, curr) => acc + Number(curr.cmv_insumos_pla) + Number(curr.total_opex) + Number(curr.taxas_comissoes) + Number(curr.impostos_faturamento), 0)
  const caixaFinal = registros[registros.length - 1]?.caixa_acumulado || 0
  const totalCapex = registros.reduce((acc, curr) => acc + Number(curr.capex_aquisicao_maquinas), 0)
  const margemMedia = totalFaturamento > 0 ? ((registros.reduce((acc, curr) => acc + curr.lucro_operacional, 0) / totalFaturamento) * 100).toFixed(2) : '0'

  return (
    <main className="max-w-[98vw] mx-auto space-y-6 p-4 md:p-6 pb-20 text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0b1426] p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-wider">
            Enterprise OS • Matriz Completa Consolidada (Conservador)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Projeção Financeira de Longo Prazo (M1 - M12)
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Todas as linhas e subcontas do fluxo de caixa com edição direta e formato 0.000,00.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSalvarNoSupabase}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Sincronizando...' : 'Salvar no Supabase'}
          </button>
          <Link
            href="/financeiro"
            className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-extrabold transition border border-slate-700"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-fade-in">
          {sucessoMsg}
        </div>
      )}

      {/* KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Faturamento Anual</span>
          <span className="text-lg sm:text-xl font-black text-amber-400 mt-1 block">R$ {formatarMoeda(totalFaturamento)}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">12 Meses Projetados</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Custos e Despesas</span>
          <span className="text-lg sm:text-xl font-black text-rose-400 mt-1 block">R$ {formatarMoeda(totalCustoOp)}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">CMV + OPEX + Impostos</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Caixa Final Acumulado</span>
          <span className="text-lg sm:text-xl font-black text-cyan-400 mt-1 block">R$ {formatarMoeda(caixaFinal)}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Saldo Líquido M12</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Margem Operacional</span>
          <span className="text-lg sm:text-xl font-black text-emerald-400 mt-1 block">{margemMedia}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Média Anual</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CAPEX Total</span>
          <span className="text-lg sm:text-xl font-black text-purple-400 mt-1 block">R$ {formatarMoeda(totalCapex)}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Expansão de Máquinas</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parque Final</span>
          <span className="text-lg sm:text-xl font-black text-blue-400 mt-1 block">{registros[registros.length - 1]?.parque_maquinas || '6 A1'}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">No M12</span>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button onClick={() => setAbaAtiva('fluxo')} className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'fluxo' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'}`}>
          <TrendingUp className="w-4 h-4" /> Matriz Completa de Execução Mensal (M1-M12)
        </button>
        <button onClick={() => setAbaAtiva('capex')} className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'capex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'}`}>
          <Cpu className="w-4 h-4" /> Aba CAPEX
        </button>
        <button onClick={() => setAbaAtiva('opex')} className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'opex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'}`}>
          <Layers className="w-4 h-4" /> Aba OPEX
        </button>
        <button onClick={() => setAbaAtiva('cmv')} className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'cmv' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'}`}>
          <DollarSign className="w-4 h-4" /> Aba CMV & Insumos
        </button>
        <button onClick={() => setAbaAtiva('taxas')} className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${abaAtiva === 'taxas' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'}`}>
          <ShieldCheck className="w-4 h-4" /> Aba Taxas & Impostos
        </button>
      </div>

      {/* TABELA PAISAGEM COMPLETA */}
      {abaAtiva === 'fluxo' && (
        <div className="bg-[#0b1426] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
            <div>
              <h3 className="font-extrabold text-white text-base">Demonstrativo Financeiro Consolidado Completo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Todos os campos editáveis em tempo real. Valores exibidos no formato 0.000,00.</p>
            </div>
            <button onClick={carregarDadosSupabase} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 min-w-[220px]">Métrica / Mês</th>
                  {registros.map(item => <th key={item.period} className="p-4 text-center min-w-[120px]">{item.period}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                
                {/* ESTRUTURA */}
                <tr className="bg-slate-900/40 text-cyan-400 font-bold"><td colSpan={13} className="p-3 uppercase text-[10px] tracking-wider">1. Parâmetros de Operação & Capacidade</td></tr>
                <tr>
                  <td className="p-4 text-slate-300">Parque de Máquinas</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={item.parque_maquinas} onChange={e => handleCellChange(item.period, 'parque_maquinas', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-slate-300">Dias Úteis</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="number" value={item.dias_uteis} onChange={e => handleCellChange(item.period, 'dias_uteis', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-cyan-500" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-slate-300">Horas / Mês Máquina</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="number" value={item.horas_mes_maquina} onChange={e => handleCellChange(item.period, 'horas_mes_maquina', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-cyan-500" />
                    </td>
                  ))}
                </tr>

                {/* RECEITAS */}
                <tr className="bg-slate-900/40 text-amber-400 font-bold"><td colSpan={13} className="p-3 uppercase text-[10px] tracking-wider">2. Receitas & Faturamento Bruto</td></tr>
                <tr className="bg-amber-500/5 font-extrabold text-amber-300">
                  <td className="p-4">(=) Faturamento Bruto (R$)</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.faturamento_bruto)} onChange={e => handleCellChange(item.period, 'faturamento_bruto', e.target.value)} className="w-full text-center bg-slate-800/80 border border-amber-500/50 rounded-lg p-1.5 text-amber-300 font-bold focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-slate-400 pl-6">↳ Vendas Marketplaces</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.vendas_marketplaces)} onChange={e => handleCellChange(item.period, 'vendas_marketplaces', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-slate-400 pl-6">↳ Vendas Diretas B2C</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.vendas_diretas_b2c)} onChange={e => handleCellChange(item.period, 'vendas_diretas_b2c', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-slate-400 pl-6">↳ Vendas B2B / Contratos</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.vendas_b2b_contratos)} onChange={e => handleCellChange(item.period, 'vendas_b2b_contratos', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>

                {/* DEDUÇÕES E CMV */}
                <tr className="bg-slate-900/40 text-rose-400 font-bold"><td colSpan={13} className="p-3 uppercase text-[10px] tracking-wider">3. Deduções, Impostos, CMV & Insumos</td></tr>
                <tr>
                  <td className="p-4 text-rose-300">(-) Impostos s/ Faturamento</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.impostos_faturamento)} onChange={e => handleCellChange(item.period, 'impostos_faturamento', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-rose-300">(-) Taxas & Comissões de Venda</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.taxas_comissoes)} onChange={e => handleCellChange(item.period, 'taxas_comissoes', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-rose-300">(-) CMV / Insumos PLA</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.cmv_insumos_pla)} onChange={e => handleCellChange(item.period, 'cmv_insumos_pla', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-rose-300">(-) Energia Elétrica (Máquinas)</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.energia_eletrica)} onChange={e => handleCellChange(item.period, 'energia_eletrica', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-rose-300">(-) Manutenção Preventiva / Desgaste</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.manutencao_maquinas)} onChange={e => handleCellChange(item.period, 'manutencao_maquinas', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none" />
                    </td>
                  ))}
                </tr>

                {/* OPEX */}
                <tr className="bg-slate-900/40 text-amber-300 font-bold"><td colSpan={13} className="p-3 uppercase text-[10px] tracking-wider">4. Custos Fixos Operacionais (OPEX)</td></tr>
                <tr><td className="p-4 text-slate-400 pl-6">↳ Aluguel / Espaço Físico</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_aluguel)} onChange={e => handleCellChange(item.period, 'opex_aluguel', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300" /></td>)}</tr>
                <tr><td className="p-4 text-slate-400 pl-6">↳ Softwares & Assinaturas</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_softwares_assinaturas)} onChange={e => handleCellChange(item.period, 'opex_softwares_assinaturas', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300" /></td>)}</tr>
                <tr><td className="p-4 text-slate-400 pl-6">↳ Pró-Labore Gestão</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_pro_labore)} onChange={e => handleCellChange(item.period, 'opex_pro_labore', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300" /></td>)}</tr>
                <tr><td className="p-4 text-slate-400 pl-6">↳ Marketing & Anúncios</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_marketing_anuncios)} onChange={e => handleCellChange(item.period, 'opex_marketing_anuncios', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300" /></td>)}</tr>
                <tr><td className="p-4 text-slate-400 pl-6">↳ Contabilidade & Admin</td>{registros.map(item => <td key={item.period} className="p-2 text-center"><input type="text" value={formatarMoeda(item.opex_contabilidade_administrativo)} onChange={e => handleCellChange(item.period, 'opex_contabilidade_administrativo', e.target.value)} className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-slate-300" /></td>)}</tr>
                <tr className="bg-slate-800/45 font-bold text-amber-200">
                  <td className="p-4">(=) Total OPEX Fixo</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.total_opex)}</td>)}
                </tr>

                {/* RESULTADOS */}
                <tr className="bg-slate-900/40 text-emerald-400 font-bold"><td colSpan={13} className="p-3 uppercase text-[10px] tracking-wider">5. Resultados, CAPEX & Caixa Acumulado</td></tr>
                <tr className="bg-emerald-500/10 font-black text-emerald-400 text-sm">
                  <td className="p-4">(=) Lucro Operacional</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.lucro_operacional)}</td>)}
                </tr>
                <tr>
                  <td className="p-4 text-purple-400 font-bold">(-) CAPEX / Aquisição de Máquinas</td>
                  {registros.map(item => (
                    <td key={item.period} className="p-2 text-center">
                      <input type="text" value={formatarMoeda(item.capex_aquisicao_maquinas)} onChange={e => handleCellChange(item.period, 'capex_aquisicao_maquinas', e.target.value)} className="w-full text-center bg-slate-800/80 border border-purple-500/40 rounded-lg p-1.5 text-purple-300 font-bold" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-blue-500/10 font-bold text-blue-300">
                  <td className="p-4">(=) Fluxo de Caixa Livre</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.fluxo_caixa_livre)}</td>)}
                </tr>
                <tr className="bg-cyan-500/20 font-black text-cyan-300 text-base">
                  <td className="p-4">(=) Caixa Acumulado Final</td>
                  {registros.map(item => <td key={item.period} className="p-4 text-center">R$ {formatarMoeda(item.caixa_acumulado)}</td>)}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'capex' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba CAPEX - Aquisição de Máquinas & Expansão</h3>
          <p className="text-xs text-slate-400">Total investido em ampliação do parque de impressoras 3D no período: R$ {formatarMoeda(totalCapex)}</p>
        </div>
      )}
      {abaAtiva === 'opex' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba OPEX - Custos Fixos Operacionais Detalhados</h3>
          <p className="text-xs text-slate-400">Controle completo de aluguel, pro-labore, assinaturas e marketing.</p>
        </div>
      )}
      {abaAtiva === 'cmv' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba CMV & Insumos - Matéria-prima e Energia</h3>
          <p className="text-xs text-slate-400">Acompanhamento do consumo de filamento PLA e gasto energético por hora trabalhada.</p>
        </div>
      )}
      {abaAtiva === 'taxas' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba Taxas & Impostos s/ Faturamento</h3>
          <p className="text-xs text-slate-400">Gestão das retenções de tributos, taxas de gateway e comissões de marketplace.</p>
        </div>
      )}

    </main>
  )
}