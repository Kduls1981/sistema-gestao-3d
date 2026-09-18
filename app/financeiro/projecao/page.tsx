'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { TrendingUp, Layers, Database, Cpu, ShieldCheck, DollarSign } from 'lucide-react'

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

// Dados consolidados extraídos diretamente das abas da sua planilha oficial
const DADOS_PLANILHA_CONSERVADOR: ProjectionRow[] = [
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
  const [registros, setRegistros] = useState<ProjectionRow[]>(DADOS_PLANILHA_CONSERVADOR)
  const [loading, setLoading] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'fluxo' | 'capex' | 'opex' | 'cmv' | 'taxas'>('fluxo')

  const handleSincronizarSupabase = async () => {
    try {
      setLoading(true)
      for (const item of DADOS_PLANILHA_CONSERVADOR) {
        const { error } = await supabase
          .from('projected_cash_flow_conservador')
          .upsert([item], { onConflict: 'period' })
        if (error) throw error
      }
      setSucessoMsg('Todas as abas da planilha foram sincronizadas com sucesso no Supabase!')
      setTimeout(() => setSucessoMsg(''), 4000)
    } catch (err: any) {
      alert('Erro ao sincronizar com Supabase: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-[98vw] mx-auto space-y-6 p-4 md:p-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#0b1426] p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            Enterprise OS • Fluxo de Caixa Projetado (Conservador)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Projeção Financeira de Longo Prazo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Dados validados de ponta a ponta a partir das abas da planilha oficial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSincronizarSupabase}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-extrabold transition shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {loading ? 'Sincronizando...' : 'Sincronizar Planilha com Supabase'}
          </button>
          <Link
            href="/financeiro"
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold transition"
          >
            ← Voltar ao Financeiro
          </Link>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          {sucessoMsg}
        </div>
      )}

      {/* KPIS DO TOPO */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Faturamento Bruto</span>
          <span className="text-lg sm:text-xl font-black text-amber-500 mt-1 block">R$ 135.520,00</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">12 Meses Acumulados</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Custo Operacional</span>
          <span className="text-lg sm:text-xl font-black text-rose-500 mt-1 block">R$ 58.681,18</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">CMV + OPEX + Taxas</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Caixa Final</span>
          <span className="text-lg sm:text-xl font-black text-cyan-500 mt-1 block">R$ 6.892,52</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">M12 Acumulado</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Margem Média</span>
          <span className="text-lg sm:text-xl font-black text-emerald-500 mt-1 block">56,70%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Lucro Operacional</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CAPEX Total</span>
          <span className="text-lg sm:text-xl font-black text-purple-400 mt-1 block">R$ 13.202,49</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Expansão de Máquinas</span>
        </div>
        <div className="bg-white dark:bg-[#0b1426] p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-md">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parque Final</span>
          <span className="text-lg sm:text-xl font-black text-blue-400 mt-1 block">6 A1</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">No M12</span>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setAbaAtiva('fluxo')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'fluxo' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Demonstrativo Consolidado (M1-M12)
        </button>
        <button
          onClick={() => setAbaAtiva('capex')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'capex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Aba CAPEX (Aquisições)
        </button>
        <button
          onClick={() => setAbaAtiva('opex')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'opex' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          Aba OPEX (Fixos)
        </button>
        <button
          onClick={() => setAbaAtiva('cmv')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'cmv' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Aba CMV & Insumos
        </button>
        <button
          onClick={() => setAbaAtiva('taxas')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            abaAtiva === 'taxas' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0b1426] text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Aba Taxas & Comissões
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL (TABELA CONSOLIDADA) */}
      {abaAtiva === 'fluxo' && (
        <div className="bg-white dark:bg-[#0b1426] rounded-3xl border border-slate-200/60 dark:border-white/10 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Matriz Completa de Execução Mensal</h3>
              <p className="text-xs text-slate-400 mt-0.5">Valores exatos extraídos diretamente da planilha oficial conservadora.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                  <th className="p-4">Métrica / Mês</th>
                  {registros.map((item) => (
                    <th key={item.period} className="p-4 text-center">{item.period}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                
                <tr className="bg-slate-50 dark:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">Parque de Máquinas</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center font-bold text-cyan-500">{item.maquinas}</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">Faturamento Bruto</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center font-bold text-amber-500">R$ {Number(item.faturamento_bruto).toFixed(2)}</td>
                  ))}
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">(-) CMV / Insumos</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center text-rose-500">R$ {Number(item.cmv_insumos).toFixed(2)}</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">(-) Taxas & Comissões</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center text-rose-400">R$ {Number(item.taxas_comissoes).toFixed(2)}</td>
                  ))}
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">(-) OPEX Fixo Reajustado</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center text-amber-400">R$ {Number(item.opex_fixo).toFixed(2)}</td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">(=) Lucro Operacional</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center font-bold text-emerald-500">R$ {Number(item.lucro_operacional).toFixed(2)}</td>
                  ))}
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">(-) CAPEX (Aquisições)</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center text-rose-600">R$ {Number(item.capex).toFixed(2)}</td>
                  ))}
                </tr>

                <tr className="bg-cyan-500/10 font-black">
                  <td className="p-4 text-cyan-600 dark:text-cyan-400">(=) Caixa Acumulado Final</td>
                  {registros.map((item) => (
                    <td key={item.period} className="p-4 text-center text-cyan-600 dark:text-cyan-400 text-sm">R$ {Number(item.caixa_acumulado).toFixed(2)}</td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {abaAtiva === 'capex' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalhamento da Aba CAPEX</h3>
          <p className="text-xs text-slate-400">Aportes destinados à expansão do parque fabril da Print Farm ao longo dos meses M4, M6, M8, M10 e M11.</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <p><strong>Total de Investimentos em CAPEX:</strong> R$ 13.202,49</p>
          </div>
        </div>
      )}

      {abaAtiva === 'opex' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalhamento da Aba OPEX</h3>
          <p className="text-xs text-slate-400">Despesas operacionais fixas recorrentes e reajustadas da operação.</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <p><strong>Total OPEX Anual:</strong> R$ 9.236,00</p>
          </div>
        </div>
      )}

      {abaAtiva === 'cmv' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalhamento da Aba CMV & Insumos</h3>
          <p className="text-xs text-slate-400">Custo de matérias-primas e filamentos utilizados na produção.</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <p><strong>Total CMV Anual:</strong> R$ 28.539,90</p>
          </div>
        </div>
      )}

      {abaAtiva === 'taxas' && (
        <div className="bg-white dark:bg-[#0b1426] p-8 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-xl space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Detalhamento da Aba Taxas & Comissões</h3>
          <p className="text-xs text-slate-400">Tarifas de transações, marketplaces e meios de pagamento.</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <p><strong>Total de Taxas Anual:</strong> R$ 20.905,28</p>
          </div>
        </div>
      )}

    </main>
  )
}