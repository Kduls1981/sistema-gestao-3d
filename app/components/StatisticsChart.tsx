'use client'

import { useState } from 'react'

export default function StatisticsChart() {
  const [filter, setFilter] = useState<'Dia' | 'Semana' | 'Mês' | 'Ano'>('Mês')
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)

  // Dados simulados baseados no filtro selecionado
  const dataMap = {
    Dia: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      income: [1200, 800, 3500, 7200, 9100, 6400, 4200],
      expense: [900, 600, 2100, 4800, 5500, 3800, 2900],
      totalIncome: 'R$ 32.400,00',
      totalExpense: 'R$ 20.600,00'
    },
    Semana: {
      labels: ['Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Seg'],
      income: [28000, 48000, 24000, 65000, 45000, 78000, 68000],
      expense: [35000, 18000, 38000, 30000, 54000, 35000, 22000],
      totalIncome: 'Rs 3,45,026.00',
      totalExpense: 'R$ 2,32,026.00'
    },
    Mês: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      income: [120000, 180000, 150000, 210000],
      expense: [90000, 110000, 95000, 130000],
      totalIncome: 'R$ 660.000,00',
      totalExpense: 'R$ 425.000,00'
    },
    Ano: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      income: [450, 520, 610, 580, 720, 810, 790, 850, 910, 960, 1020, 1150],
      expense: [320, 380, 410, 390, 480, 520, 500, 540, 590, 610, 650, 720],
      totalIncome: 'R$ 8.910.000,00',
      totalExpense: 'R$ 5.710.000,00'
    }
  }

  const currentData = dataMap[filter]

  // Normalização para coordenadas SVG (Largura: 600, Altura: 180)
  const maxVal = Math.max(...currentData.income, ...currentData.expense, 100)
  const pointsIncome = currentData.income.map((val, index) => {
    const x = (index / (currentData.income.length - 1)) * 560 + 20
    const y = 160 - (val / maxVal) * 130
    return { x, y, val }
  })

  const pointsExpense = currentData.expense.map((val, index) => {
    const x = (index / (currentData.expense.length - 1)) * 560 + 20
    const y = 160 - (val / maxVal) * 130
    return { x, y, val }
  })

  // Gerador de caminho SVG suave (Curvas Bézier)
  const makePath = (pts: { x: number; y: number }[]) => {
    return pts.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x},${pt.y}`
      const prev = arr[idx - 1]
      const cpX = (prev.x + pt.x) / 2
      return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`
    }, '')
  }

  return (
    <div className="w-full bg-white dark:bg-[#1f212a]/80 backdrop-blur-xl border border-slate-200 dark:border-gray-800/80 rounded-3xl p-6 shadow-xl transition-all duration-300">
      
      {/* Cabeçalho do Card e Filtros de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-black tracking-wide text-slate-900 dark:text-white">Statistics</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">Comparativo de fluxo de receitas e despesas</p>
        </div>

        {/* Botões de Filtro: Dia, Semana, Mês, Ano */}
        <div className="flex items-center bg-slate-100 dark:bg-[#16171d] p-1 rounded-xl border border-slate-200 dark:border-gray-800 self-start sm:self-auto">
          {(['Dia', 'Semana', 'Mês', 'Ano'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === item
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Indicadores de Legenda e Totais */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 mb-6">
        {/* Income (Receitas) */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#16171d]/60 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-gray-800/50">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            ▲
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold block">Income</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{currentData.totalIncome}</span>
          </div>
        </div>

        {/* Expenses (Despesas) */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#16171d]/60 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-gray-800/50">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 dark:bg-orange-500/30 text-orange-500 flex items-center justify-center font-bold">
            ▼
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold block">Expenses</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{currentData.totalExpense}</span>
          </div>
        </div>
      </div>

      {/* Área do Gráfico SVG */}
      <div className="relative w-full h-52 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
          {/* Linhas de Grade de Fundo */}
          {[20, 65, 110, 155].map((y, idx) => (
            <line
              key={idx}
              x1="0"
              y1={y}
              x2="600"
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-gray-800/40"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ))}

          {/* Caminho de Despesas (Laranja da paleta) */}
          <path
            d={makePath(pointsExpense)}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Caminho de Receitas (Roxo elegante) */}
          <path
            d={makePath(pointsIncome)}
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Pontos Interativos e Tooltips */}
          {pointsIncome.map((pt, idx) => (
            <g key={idx} className="cursor-pointer" onClick={() => setActiveTooltip(idx === activeTooltip ? null : idx)}>
              {/* Ponto de Receita */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={activeTooltip === idx ? "6" : "4"}
                className="fill-purple-500 transition-all"
              />
              {/* Ponto de Despesa */}
              <circle
                cx={pt.x}
                cy={pointsExpense[idx].y}
                r={activeTooltip === idx ? "6" : "4"}
                className="fill-orange-500 transition-all"
              />
            </g>
          ))}
        </svg>

        {/* Tooltip Dinâmico */}
        {activeTooltip !== null && (
          <div 
            className="absolute z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-gray-700 shadow-2xl rounded-xl p-3 text-xs pointer-events-none transition-all"
            style={{
              left: `${(activeTooltip / (currentData.labels.length - 1)) * 85 + 5}%`,
              top: '20%'
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-bold text-slate-700 dark:text-gray-300">{currentData.labels[activeTooltip]}</span>
              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">▲ Ativo</span>
            </div>
            <div className="text-purple-600 dark:text-purple-400 font-bold">Receita: R$ {currentData.income[activeTooltip].toLocaleString()}</div>
            <div className="text-orange-500 font-bold">Despesa: R$ {currentData.expense[activeTooltip].toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Rótulos do Eixo X (Dias/Semanas/Meses) */}
      <div className="flex justify-between items-center px-2 mt-4 text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
        {currentData.labels.map((label, idx) => (
          <span key={idx}>{label}</span>
        ))}
      </div>

    </div>
  )
}