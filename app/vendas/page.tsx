'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function VendasPage() {
  const [cliente, setCliente] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [valorUnitario, setValorUnitario] = useState(0)
  const [descontoPercentual, setDescontoPercentual] = useState(0)
  const [formaPagamento, setFormaPagamento] = useState('pix')
  
  const [itensPedido, setItensPedido] = useState<any[]>([])
  const [produtosCatalogo, setProdutosCatalogo] = useState<any[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [salvandoVenda, setSalvandoVenda] = useState(false)

  const [vendasRecentes, setVendasRecentes] = useState([
    { id: 1, numeroPedido: 'PED-202608-003', cliente: 'Mariana Costa', produto: 'Boneco crochê pokemon (+2 itens)', qtd: 40, total: 1170.00, pagamento: 'Boleto', status: 'Misto (3 modelos)', data: '19/08/2026', hora: '18:15', emProducao: true, filaIniciada: true },
    { id: 2, numeroPedido: 'PED-202608-002', cliente: 'Carlos Silva', produto: 'Miniatura Dragão Articulado', qtd: 2, total: 300.00, pagamento: 'Pix', status: 'Parcial (1 Pronta / 1 Prod)', data: '19/08/2026', hora: '14:30', emProducao: true, filaIniciada: false },
    { id: 3, numeroPedido: 'PED-202608-001', cliente: 'Ana Souza', produto: 'Suporte Headset 3D', qtd: 2, total: 90.00, pagamento: 'Pix', status: 'Concluído (Pronta Entrega)', data: '19/08/2026', hora: '10:00', emProducao: false, filaIniciada: true },
  ])

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    try {
      setLoadingProdutos(true)
      const { data, error } = await supabase
        .from('products_3d')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      if (data) {
        setProdutosCatalogo(data)
      }
    } catch (err) {
      console.error('Erro ao carregar produtos do estoque:', err)
    } finally {
      setLoadingProdutos(false)
    }
  }

  const produtoAtual = produtosCatalogo.find((p) => String(p.id) === produtoId)
  
  const estoqueProntoDisponivel = produtoAtual ? Number(produtoAtual.stock_ready || 0) : 0
  const qtdEstoqueUtilizada = Math.min(quantidade, estoqueProntoDisponivel)
  const qtdIndoParaProducao = Math.max(0, quantidade - estoqueProntoDisponivel)

  const handleAdicionarItem = () => {
    if (!produtoId || !produtoAtual) return

    let statusItem = 'Concluído (Pronta Entrega)'
    if (qtdIndoParaProducao > 0 && qtdEstoqueUtilizada > 0) {
      statusItem = `Parcial (${qtdEstoqueUtilizada} Pronta / ${qtdIndoParaProducao} Prod)`
    } else if (qtdIndoParaProducao > 0) {
      statusItem = `Em Produção (${qtdIndoParaProducao} un.)`
    }

    const novoItem = {
      id: Date.now(),
      produtoId,
      nomeProduto: produtoAtual.name,
      quantidade,
      valorUnitario,
      subtotal: quantidade * valorUnitario,
      qtdEstoqueUtilizada,
      qtdIndoParaProducao,
      statusItem
    }

    setItensPedido([...itensPedido, novoItem])
    setProdutoId('')
    setQuantidade(1)
    setValorUnitario(0)
  }

  const handleRemoverItem = (id: number) => {
    setItensPedido(itensPedido.filter(item => item.id !== id))
  }

  const valorBrutoTotalItens = itensPedido.reduce((acc, item) => acc + item.subtotal, 0)
  const percentualValido = Math.min(100, Math.max(0, Number(descontoPercentual) || 0))
  const valorDescontoTotal = valorBrutoTotalItens * (percentualValido / 100)
  const valorTotalFinal = Math.max(0, valorBrutoTotalItens - valorDescontoTotal)

  const handleFinalizarVendaGeral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente || itensPedido.length === 0) return

    try {
      setSalvandoVenda(true)

      let temItensEmProducao = false

      for (const item of itensPedido) {
        const prodOriginal = produtosCatalogo.find((p) => String(p.id) === String(item.produtoId))
        if (!prodOriginal) continue

        const estoqueAtual = Number(prodOriginal.stock_ready || 0)
        const filaAtual = Number(prodOriginal.production_queue || 0)

        if (item.qtdIndoParaProducao > 0) {
          temItensEmProducao = true
        }

        const novoEstoque = Math.max(0, estoqueAtual - item.qtdEstoqueUtilizada)
        const novaFila = filaAtual + item.qtdIndoParaProducao

        const { error: updateError } = await supabase
          .from('products_3d')
          .update({
            stock_ready: novoEstoque,
            production_queue: novaFila
          })
          .eq('id', item.produtoId)

        if (updateError) throw updateError
      }

      let nomeProdutoHistorico = ''
      let statusHistorico = ''

      if (itensPedido.length === 1) {
        nomeProdutoHistorico = itensPedido[0].nomeProduto
        statusHistorico = itensPedido[0].statusItem
      } else {
        nomeProdutoHistorico = `${itensPedido[0].nomeProduto} (+${itensPedido.length - 1} itens)`
        statusHistorico = `Misto (${itensPedido.length} modelos)`
      }

      const qtdTotalItens = itensPedido.reduce((acc, item) => acc + item.quantidade, 0)
      
      const proximoSequencial = String(vendasRecentes.length + 1).padStart(3, '0')
      const numeroPedidoGerado = `PED-202608-${proximoSequencial}`

      const agora = new Date()
      const dataFormatada = agora.toLocaleDateString('pt-BR')
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      // Gravação automatizada da Receita no Financeiro
      const yyyymmdd = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`
      const paymentMethodMap: Record<string, string> = {
        pix: 'Pix',
        cartao: 'Cartão de Crédito',
        boleto: 'Boleto',
        dinheiro: 'Dinheiro'
      }

      const { error: financialError } = await supabase
        .from('financial_transactions')
        .insert([{
          date: yyyymmdd,
          type: 'Receita',
          category: 'Vendas',
          description: `Venda ${numeroPedidoGerado} - ${cliente}`,
          amount: valorTotalFinal,
          status: 'Concluído',
          payment_method: paymentMethodMap[formaPagamento] || 'Pix',
          payment_status: 'paid',
          payment_gateway_fee: 0,
          due_date: yyyymmdd,
          payment_date: yyyymmdd
        }])

      if (financialError) throw financialError

      const novaVenda = {
        id: Date.now(),
        numeroPedido: numeroPedidoGerado,
        cliente,
        produto: nomeProdutoHistorico,
        qtd: qtdTotalItens,
        total: valorTotalFinal,
        pagamento: formaPagamento.toUpperCase(),
        status: statusHistorico,
        data: dataFormatada,
        hora: horaFormatada,
        emProducao: temItensEmProducao,
        filaIniciada: !temItensEmProducao // Se tem itens indo pra produção mas recém entrou, consideramos que ainda aguarda (vermelho) ou pode ajustar conforme regra de fila
      }

      setVendasRecentes([novaVenda, ...vendasRecentes])
      setCliente('')
      setItensPedido([])
      setDescontoPercentual(0)
      
      fetchProdutos()
      alert(`Pedido ${numeroPedidoGerado} finalizado com sucesso! Estoque atualizado e fila de produção incrementada.`)

    } catch (err: any) {
      alert(`Erro ao finalizar pedido e atualizar produção: ${err.message || err}`)
    } finally {
      setSalvandoVenda(false)
    }
  }

  const selectModernStyle = "w-full bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm cursor-pointer"
  const inputModernStyle = "w-full bg-slate-50/80 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition shadow-sm"
  const inputDisabledStyle = "w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed shadow-sm"

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto w-full">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Módulo de Vendas Inteligente
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">Gestão de Pedidos e Fabricação</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">O sistema verifica o estoque item por item e direciona faltas para a produção.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar Novo Pedido
          </h2>

          <form onSubmit={handleFinalizarVendaGeral} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Cliente</label>
                <select 
                  value={cliente} 
                  onChange={(e) => setCliente(e.target.value)}
                  className={selectModernStyle}
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  <option value="Ana Souza">Ana Souza</option>
                  <option value="Carlos Silva">Carlos Silva</option>
                  <option value="Mariana Costa">Mariana Costa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Forma de Pagamento</label>
                <select 
                  value={formaPagamento} 
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className={selectModernStyle}
                >
                  <option value="pix">Pix</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Adicionar Modelo ao Pedido</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Produto / Modelo 3D</label>
                  <select 
                    value={produtoId} 
                    onChange={(e) => {
                      const id = e.target.value
                      setProdutoId(id)
                      const prod = produtosCatalogo.find((p) => String(p.id) === id)
                      if (prod) {
                        const precoSugerido = Number(prod.suggested_price || 0)
                        setValorUnitario(precoSugerido)
                      } else {
                        setValorUnitario(0)
                      }
                    }}
                    className={selectModernStyle}
                  >
                    <option value="">{loadingProdutos ? 'Carregando estoque...' : 'Selecione o produto cadastrado...'}</option>
                    {produtosCatalogo.map((prod) => {
                      const precoExibicao = Number(prod.suggested_price || 0)
                      return (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (Pronta: {prod.stock_ready || 0} un. | R$ {precoExibicao.toFixed(2)})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Qtd</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={quantidade} 
                      onChange={(e) => setQuantidade(Number(e.target.value))}
                      className={inputModernStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Unit. (R$)</label>
                    <input 
                      type="text" 
                      value={`R$ ${valorUnitario.toFixed(2)}`} 
                      disabled
                      className={inputDisabledStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-2">Total</label>
                    <input 
                      type="text" 
                      value={`R$ ${(quantidade * valorUnitario).toFixed(2)}`} 
                      disabled
                      className={inputDisabledStyle}
                    />
                  </div>
                </div>
              </div>

              {produtoAtual && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-900 dark:text-orange-300">
                    <span>Análise de Estoque Pronto para este item:</span>
                    <span>Disponível na Prateleira: {estoqueProntoDisponivel} un.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-white/80 dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      ✅ Sai do Estoque: <span className="font-black">{qtdEstoqueUtilizada} un.</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400">
                      ⚙️ Vai para Produção: <span className="font-black">{qtdIndoParaProducao} un.</span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="button"
                onClick={handleAdicionarItem}
                disabled={!produtoId}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                ➕ Incluir este modelo na lista do pedido
              </button>
            </div>

            {itensPedido.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Itens Adicionados no Pedido Atual ({itensPedido.length})</label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3">Qtd</th>
                        <th className="py-2.5 px-3">Unitário</th>
                        <th className="py-2.5 px-3">Subtotal</th>
                        <th className="py-2.5 px-3">Destino / Status</th>
                        <th className="py-2.5 px-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {itensPedido.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{item.nomeProduto}</td>
                          <td className="py-3 px-3">{item.quantidade} un.</td>
                          <td className="py-3 px-3">R$ {item.valorUnitario.toFixed(2)}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">R$ {item.subtotal.toFixed(2)}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">
                              {item.statusItem}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button 
                              type="button"
                              onClick={() => handleRemoverItem(item.id)}
                              className="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-500/10 rounded-lg cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Desconto Global do Pedido (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={descontoPercentual} 
                  onChange={(e) => setDescontoPercentual(Number(e.target.value))}
                  className={inputModernStyle}
                  placeholder="0"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={itensPedido.length === 0 || !cliente || salvandoVenda}
              className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvandoVenda ? 'Processando Pedido...' : 'Finalizar Pedido Completo & Disparar Estoque/Produção'}
            </button>
          </form>
        </div>

        <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Resumo do Pedido</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cliente:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{cliente || 'Não definido'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Itens no Pedido:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{itensPedido.length} modelo(s)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal Bruto:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">R$ {valorBrutoTotalItens.toFixed(2)}</span>
              </div>
              {percentualValido > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-orange-600 dark:text-orange-400">
                  <span className="font-medium">Desconto ({percentualValido}%):</span>
                  <span className="font-bold">- R$ {valorDescontoTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Pagamento:</span>
                <span className="font-bold uppercase text-orange-600 dark:text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded-lg">{formaPagamento}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600 dark:text-slate-400 font-black">TOTAL:</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {valorTotalFinal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white/90 dark:bg-slate-900 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Histórico de Pedidos e Vendas</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase">
                <th className="py-3 px-4">Nº Pedido</th>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Qtd</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4">Status / Destino</th>
                <th className="py-3 px-4 text-center">Monitor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
              {vendasRecentes.map((v) => {
                // Lógica dos Indicadores (LEDs piscando) ao final da linha
                let dotColor = 'bg-emerald-500 shadow-emerald-500/50'
                let labelStatus = '100% Concluído'

                if (v.emProducao) {
                  if (v.filaIniciada) {
                    dotColor = 'bg-amber-500 shadow-amber-500/50' // Amarelo/Laranja: Em produção ativa nas máquinas
                    labelStatus = 'Em Produção'
                  } else {
                    dotColor = 'bg-rose-500 shadow-rose-500/50'   // Vermelho: Precisa produzir mas parado (não entrou na fila)
                    labelStatus = 'Aguardando Fila'
                  }
                }

                return (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-4 px-4 font-mono font-bold text-orange-600 dark:text-orange-400 text-xs">{v.numeroPedido}</td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      <div>{v.data}</div>
                      <div className="text-[10px] text-slate-400">{v.hora}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{v.cliente}</td>
                    <td className="py-4 px-4">{v.produto}</td>
                    <td className="py-4 px-4">{v.qtd}</td>
                    <td className="py-4 px-4 font-black text-slate-900 dark:text-white">R$ {v.total.toFixed(2)}</td>
                    <td className="py-4 px-4"><span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-bold">{v.pagamento}</span></td>
                    <td className="py-4 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2" title={labelStatus}>
                        <span className="relative flex h-3.5 w-3.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
                          <span className={`relative inline-flex rounded-full h-3.5 w-3.5 shadow-md ${dotColor}`}></span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 hidden xl:inline">{labelStatus}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}