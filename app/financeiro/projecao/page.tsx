'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { TrendingUp, Layers, Database, Cpu, ShieldCheck, DollarSign, Save, RefreshCw, PlusCircle } from 'lucide-react'

type ProjectionRow = {
  id: string
  period: string
  maquinas: string
  faturamento_bruto: number
  cmv_insumos: number
  taxas_comissoes: number
  opex_fixo: number
  lucro_operacional: number
  capex: number
  caixa_acumulado: number
}

const DADOS_INICIAIS: ProjectionRow[] = [
  { id: '1', period: 'M1', maquinas: '1 A1', faturamento_bruto: 1650.00, cmv_insumos: 347.48, taxas_comissoes: 33.00, opex_fixo: 0.00, lucro_operacional: 1269.52, capex: 0.00, caixa_acumulado: 1269.52 },
  { id: '2', period: 'M2', maquinas: '1 A1', faturamento_bruto: 3300.00, cmv_insumos: 694.97, taxas_comissoes: 264.00, opex_fixo: 0.00, lucro_operacional: 2341.04, capex: 0.00, caixa_acumulado: 3610.55 },
  { id: '3', period: 'M3', maquinas: '1 A1', faturamento_bruto: 4950.00, cmv_insumos: 1042.45, taxas_comissoes: 574.20, opex_fixo: 0.00, lucro_operacional: 3333.35, capex: 0.00, caixa_acumulado: 3941.91 },
  { id: '4', period: 'M4', maquinas: '1 A1', faturamento_bruto: 5005.00, cmv_insumos: 1054.03, taxas_comissoes: 640.64, opex_fixo: 954.00, lucro_operacional: 2356.33, capex: 1784.94, caixa_acumulado: 4513.29 },
  { id: '5', period: 'M5', maquinas: '1 A1', faturamento_bruto: 5005.00, cmv_insumos: 1054.03, taxas_comissoes: 700.70, opex_fixo: 1024.00, lucro_operacional: 2226.27, capex: 1784.94, caixa_acumulado: 4814.81 },
  { id: '6', period: 'M6', maquinas: '2 A1', faturamento_bruto: 9900.00, cmv_insumos: 2084.90, taxas_comissoes: 1504.80, opex_fixo: 1024.00, lucro_operacional: 5286.31, capex: 4675.00, caixa_acumulado: 3641.17 },
  { id: '7', period: 'M7', maquinas: '2 A1', faturamento_bruto: 10010.00, cmv_insumos: 2108.06, taxas_comissoes: 1641.64, opex_fixo: 1024.00, lucro_operacional: 5236.30, capex: 1784.94, caixa_acumulado: 7092.53 },
  { id: '8', period: 'M8', maquinas: '3 A1', faturamento_bruto: 14300.00, cmv_insumos: 3011.52, taxas_comissoes: 2345.20, opex_fixo: 1024.00, lucro_operacional: 7919.29, capex: 4675.00, caixa_acumulado: 5883.76 },
  { id: '9', period: 'M9', maquinas: '4 A1', faturamento_bruto: 16500.00, cmv_insumos: 3474.83, taxas_comissoes: 2706.00, opex_fixo: 1024.00, lucro_operacional: 9295.18, capex: 1784.94, caixa_acumulado: 4422.14 },
  { id: '10', period: 'M10', maquinas: '4 A1', faturamento_bruto: 18700.00, cmv_insumos: 3938.14, taxas_comissoes: 3066.80, opex_fixo: 1054.00, lucro_operacional: 10641.07, capex: 1784.94, caixa_acumulado: 8976.63 },
  { id: '11', period: 'M11', maquinas: '5 A1', faturamento_bruto: 21450.00, cmv_insumos: 4517.27, taxas_comissoes: 3517.80, opex_fixo: 1054.00, lucro_operacional: 12360.93, capex: 3552.04, caixa_acumulado: 7438.81 },
  { id: '12', period: 'M12', maquinas: '6 A1', faturamento_bruto: 24750.00, cmv_insumos: 5212.24, taxas_comissoes: 3910.50, opex_fixo: 1054.00, lucro_operacional: 14573.26, capex: 0.00, caixa_acumulado: 6892.52 }
]

export default function ProjecaoCaixaPage() {
  const [registros, setRegistros] = useState<ProjectionRow[]>(DADOS_INICIAIS)
  const [loading, setLoading] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'fluxo' | 'capex' | 'opex' | 'cmv' | 'taxas'>('fluxo')

  // Carregar dados salvos do Supabase ao iniciar
  useEffect(() => {
    carregarDadosSupabase()
  }, [])

  const carregarDadosSupabase = async () => {
    try {
      const { data, error } = await supabase.from('projected_cash_flow_conservador').select('*').order('period', { ascending: true })
      if (data && data.length > 0) {
        // Ordena corretamente M1, M2... M12
        const ordenado = data.sort((a, b) => parseInt(a.period.replace('M', '')) - parseInt(b.period.replace('M', '')))
        setRegistros(ordenado)
      }
    } catch (err) {
      console.error('Erro ao buscar do Supabase:', err)
    }
  }

  // Atualizar valor de célula localmente e recalcular
  const handleCellChange = (period: string, field: keyof ProjectionRow, value: string) => {
    const numValue = field === 'maquinas' ? value : parseFloat(value) || 0
    
    setRegistros(prev => {
      const updated = prev.map(item => {
        if (item.period === period) {
          const newItem = { ...item, [field]: numValue }
          // Recalcula Lucro Operacional e Caixa Acumulado automaticamente
          newItem.lucro_operacional = Number((newItem.faturamento_bruto - newItem.cmv_insumos - newItem.taxas_comissoes - newItem.opex_fixo).toFixed(2))
          return newItem
        }
        return item
      })

      // Recalcula o Caixa Acumulado em cadeia (Mês anterior + Lucro - Capex)
      let acumuladoAnterior = 0
      return updated.map((item, idx) => {
        const caixaCalc = Number((acumuladoAnterior + item.lucro_operacional - item.capex).toFixed(2))
        acumuladoAnterior = idx === 0 ? item.lucro_operacional - item.capex : caixaCalc // Ajuste conforme regra de negócio inicial
        // Simplificado para recálculo exato acumulado:
        const realAcumulado = idx === 0 ? item.lucro_operacional - item.capex : updated.slice(0, idx + 1).reduce((acc, curr) => acc + curr.lucro_operacional - curr.capex, 0)
        return { ...item, caixa_acumulado: Number(realAcumulado.toFixed(2)) }
      })
    })
  }

  const handleSalvarNoSupabase = async () => {
    try {
      setLoading(true)
      for (const item of registros) {
        const { error } = await supabase
          .from('projected_cash_flow_conservador')
          .upsert([item], { onConflict: 'period' })
        if (error) throw error
      }
      setSucessoMsg('Alterações salvas e sincronizadas com sucesso no Supabase!')
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (err: any) {
      alert('Erro ao salvar no Supabase: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Totais consolidados para os KPIs
  const totalFaturamento = registros.reduce((acc, curr) => acc + Number(curr.faturamento_bruto), 0)
  const totalCustoOp = registros.reduce((acc, curr) => acc + Number(curr.cmv_insumos) + Number(curr.opex_fixo) + Number(curr.taxas_comissoes), 0)
  const caixaFinal = registros[registros.length - 1]?.caixa_acumulado || 0
  const totalCapex = registros.reduce((acc, curr) => acc + Number(curr.capex), 0)
  const margemMedia = totalFaturamento > 0 ? ((registros.reduce((acc, curr) => acc + curr.lucro_operacional, 0) / totalFaturamento) * 100).toFixed(2) : '0'

  return (
    <main className="max-w-[98vw] mx-auto space-y-6 p-4 md:p-6 pb-20 text-slate-100">
      
      {/* HEADER DA DASHBOARD */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0b1426] p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-wider">
            Enterprise OS • Anexo A1: Demonstrativo Consolidado (Conservador)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Projeção Financeira de Longo Prazo
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Gerenciamento completo em modo paisagem com campos editáveis em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSalvarNoSupabase}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Alterações no Supabase'}
          </button>
          <Link
            href="/financeiro"
            className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-extrabold transition border border-slate-700"
          >
            ← Voltar ao Financeiro
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-fade-in">
          {sucessoMsg}
        </div>
      )}

      {/* KPIS DO TOPO */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Faturamento Anual</span>
          <span className="text-lg sm:text-xl font-black text-amber-400 mt-1 block">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">12 Meses Projetados</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Custo Operacional</span>
          <span className="text-lg sm:text-xl font-black text-rose-400 mt-1 block">R$ {totalCustoOp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">OPEX + CMV + Taxas</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Caixa Final Acumulado</span>
          <span className="text-lg sm:text-xl font-black text-cyan-400 mt-1 block">R$ {caixaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Saldo Líquido M12</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Margem Operacional</span>
          <span className="text-lg sm:text-xl font-black text-emerald-400 mt-1 block">{margemMedia}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Média Anual</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CAPEX Total</span>
          <span className="text-lg sm:text-xl font-black text-purple-400 mt-1 block">R$ {totalCapex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Expansão de Máquinas</span>
        </div>
        <div className="bg-[#0b1426] p-5 rounded-3xl border border-white/10 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parque Final</span>
          <span className="text-lg sm:text-xl font-black text-blue-400 mt-1 block">{registros[registros.length - 1]?.maquinas || '6 A1'}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">No M12</span>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setAbaAtiva('fluxo')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'fluxo' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Fluxo de Caixa Projetado (Paisagem M1-M12)
        </button>
        <button
          onClick={() => setAbaAtiva('capex')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'capex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Aba CAPEX (Aquisição de Máquinas)
        </button>
        <button
          onClick={() => setAbaAtiva('opex')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'opex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Aba OPEX (Custos Fixos)
        </button>
        <button
          onClick={() => setAbaAtiva('cmv')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'cmv' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Aba CMV & Insumos
        </button>
        <button
          onClick={() => setAbaAtiva('taxas')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'taxas' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-[#0b1426] text-slate-400 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Aba Taxas & Comissões
        </button>
      </div>

      {/* CONTEÚDO DA ABA ATIVA: PAISAGEM EDITÁVEL */}
      {abaAtiva === 'fluxo' && (
        <div className="bg-[#0b1426] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
            <div>
              <h3 className="font-extrabold text-white text-base">Matriz Financeira Consolidada (Edição Direta por Célula)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Altere qualquer valor abaixo. O lucro operacional e o caixa acumulado recalculam automaticamente.</p>
            </div>
            <button 
              onClick={carregarDadosSupabase}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar Dados
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-300 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 min-w-[180px]">Métrica / Mês</th>
                  {registros.map((item) => (
                    <th key={item.period} className="p-4 text-center min-w-[110px]">{item.period}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                
                {/* Parque de Máquinas */}
                <tr className="bg-slate-900/20">
                  <td className="p-4 font-bold text-cyan-400">Parque de Máquinas</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-2 text-center">
                      <input
                        type="text"
                        value={item.maquinas}
                        onChange={(e) => handleCellChange(item.period, 'maquinas', e.target.value)}
                        className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* Faturamento Bruto */}
                <tr>
                  <td className="p-4 font-bold text-amber-400">Faturamento Bruto (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={item.faturamento_bruto}
                        onChange={(e) => handleCellChange(item.period, 'faturamento_bruto', e.target.value)}
                        className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* CMV / Insumos */}
                <tr className="bg-slate-900/20">
                  <td className="p-4 font-bold text-rose-400">(-) CMV / Insumos (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={item.cmv_insumos}
                        onChange={(e) => handleCellChange(item.period, 'cmv_insumos', e.target.value)}
                        className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none focus:border-rose-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* Taxas & Comissões */}
                <tr>
                  <td className="p-4 font-bold text-rose-400">(-) Taxas & Comissões (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={item.taxas_comissoes}
                        onChange={(e) => handleCellChange(item.period, 'taxas_comissoes', e.target.value)}
                        className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-rose-300 focus:outline-none focus:border-rose-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* OPEX Fixo */}
                <tr className="bg-slate-900/20">
                  <td className="p-4 font-bold text-amber-300">(-) OPEX Fixo (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={item.opex_fixo}
                        onChange={(e) => handleCellChange(item.period, 'opex_fixo', e.target.value)}
                        className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-amber-200 focus:outline-none focus:border-amber-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* Lucro Operacional (Calculado) */}
                <tr className="bg-emerald-500/5">
                  <td className="p-4 font-extrabold text-emerald-400">(=) Lucro Operacional (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center font-extrabold text-emerald-400">
                      R$ {Number(item.lucro_operacional).toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* CAPEX */}
                <tr>
                  <td className="p-4 font-bold text-purple-400">(-) CAPEX / Máquinas (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={item.capex}
                        onChange={(e) => handleCellChange(item.period, 'capex', e.target.value)}
                        className="w-full text-center bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-purple-300 focus:outline-none focus:border-purple-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* Caixa Acumulado Final */}
                <tr className="bg-cyan-500/10 font-black">
                  <td className="p-4 text-cyan-300 text-sm">(=) Caixa Acumulado Final (R$)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center text-cyan-300 text-sm">
                      R$ {Number(item.caixa_acumulado).toFixed(2)}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'capex' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba CAPEX - Aquisição de Máquinas & Investimento Inicial</h3>
          <p className="text-xs text-slate-400">Gerenciamento dos aportes em maquinário (Ex: Impressoras 3D A1 nos meses M4, M6, M8, M10 e M11 conforme sua planilha).</p>
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 space-y-1">
            <p><strong>Total Investido em CAPEX (12 Meses):</strong> R$ {totalCapex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-slate-400">Aquisições programadas e editáveis diretamente na matriz principal de fluxo de caixa.</p>
          </div>
        </div>
      )}

      {abaAtiva === 'opex' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba OPEX - Custos Operacionais Fixos Reajustados</h3>
          <p className="text-xs text-slate-400">Controle das despesas fixas recorrentes da Print Farm (aluguel, internet, sistemas, manutenção geral).</p>
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 space-y-1">
            <p><strong>OPEX Fixo Anual Consolidado:</strong> R$ {registros.reduce((acc, curr) => acc + curr.opex_fixo, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-slate-400">Média Mensal ajustada conforme expansão da operação.</p>
          </div>
        </div>
      )}

      {abaAtiva === 'cmv' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba CMV & Insumos (~22%)</h3>
          <p className="text-xs text-slate-400">Custo de Mercadoria Vendida voltado ao consumo de filamentos PLA/ABS, energia elétrica por hora de impressão e desgaste de bicos.</p>
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 space-y-1">
            <p><strong>Total CMV Anual:</strong> R$ {registros.reduce((acc, curr) => acc + curr.cmv_insumos, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-slate-400">Escala diretamente conforme o aumento do volume de filamento consumido e horas de máquina do parque.</p>
          </div>
        </div>
      )}

      {abaAtiva === 'taxas' && (
        <div className="bg-[#0b1426] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <h3 className="text-lg font-black text-white">Aba Taxas & Comissões de Venda</h3>
          <p className="text-xs text-slate-400">Descontos de gateways de pagamento, taxas de marketplaces (Shopee/ML) e comissões de canais de venda.</p>
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 space-y-1">
            <p><strong>Total de Taxas Anual:</strong> R$ {registros.reduce((acc, curr) => acc + curr.taxas_comissoes, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-slate-400">Variável conforme o mix de vendas (Marketplace vs Vendas Diretas B2C/B2B).</p>
          </div>
        </div>
      )}

    </main>
  )
}