import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, LogOut, PlusCircle, Search, ArrowUp, ArrowDown, Edit, Package, FileDown, ChevronLeft, ChevronRight, GripVertical, Printer, History, Trash2, ShoppingCart, Settings, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Modal from './Modal.jsx';
import { useTheme } from './ThemeContext.jsx';

// ===================================================================
// DEFINIÇÃO DAS COLUNAS DA TABELA
// ===================================================================
const fallbackInitialColumns = [
  { id: 'imagem', label: 'Imagem', sortable: false, align: 'left', printable: false },
  { id: 'nome', label: 'Produto', sortable: true, align: 'left' },
  { id: 'categoria', label: 'Categoria', sortable: true, align: 'left' },
  { id: 'marca', label: 'Marca', sortable: true, align: 'left' },
  { id: 'fornecedor', label: 'Fornecedor', sortable: true, align: 'left' },
  { id: 'emEstoque', label: 'Em Estoque', sortable: true, align: 'left' },
  { id: 'qtdaMinima', label: 'Qtda. Mínima', sortable: true, align: 'left' },
  { id: 'tempoDeGarantia', label: 'Garantia (dias)', sortable: true, align: 'left' },
  { id: 'preco', label: 'Preço', sortable: true, align: 'left' },
  { id: 'precoFinal', label: 'Preço Final', sortable: true, align: 'left', printable: false },
  { id: 'acoes', label: 'Ações', sortable: false, align: 'right', printable: false },
];

const servicosFallbackColumns = [
  { id: 'imagem', label: 'Imagem', sortable: false, align: 'left' },
  { id: 'servico', label: 'Serviço', sortable: true, align: 'left' },
  { id: 'fornecedor', label: 'Fornecedor', sortable: true, align: 'left' },
  { id: 'marca', label: 'Marca', sortable: true, align: 'left' },
  { id: 'tipoReparo', label: 'Tipo de Reparo', sortable: true, align: 'left' },
  { id: 'tecnico', label: 'Técnico', sortable: true, align: 'left' },
  { id: 'tempoDeGarantia', label: 'Garantia (dias)', sortable: true, align: 'left' },
  { id: 'preco', label: 'Preço', sortable: true, align: 'left' },
  { id: 'precoFinal', label: 'Preço Final', sortable: true, align: 'left' },
  { id: 'acoes', label: 'Ações', sortable: false, align: 'right' },
];

// ===================================================================
// PÁGINA DE CONTROLE DE ESTOQUE
// ===================================================================
const StockControl = ({ 
  onLogout, 
  currentUser,
  paginatedEstoque,
  sortConfig,
  handleSort,
  handleExcluirProduto,
  searchTerm,
  setSearchTerm,
  showLowStockOnly,
  setShowLowStockOnly,
  currentPage,
  setCurrentPage,
  totalPages,
  isAddModalOpen,
  handleOpenAddModal,
  handleCloseAddModal,
  newProduct,
  handleInputChange,
  handleAddProduct,
  isEditModalOpen,
  handleOpenEditModal,
  handleCloseEditModal,
  editingProduct,
  handleEditInputChange,
  handleUpdateProduct,
  handleExportCSV,
  lowStockItems,
  paginatedServicos,
  servicoSortConfig,
  handleServicoSort,
  handleExcluirServico,
  servicoSearchTerm,
  setServicoSearchTerm,
  servicoCurrentPage,
  setServicoCurrentPage,
  totalServicoPages,
  isAddServicoModalOpen,
  handleOpenAddServicoModal,
  handleCloseAddServicoModal,
  newServico,
  isEditServicoModalOpen,
  handleOpenEditServicoModal,
  handleCloseEditServicoModal,
  editingServico,
  handleServicoInputChange,
  handleAddServico,
  handleUpdateServico,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  // ===================================================================
  // STATE & REFS
  // ===================================================================
  // Modal States
  const [isServiceHistoryModalOpen, setIsServiceHistoryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Data States
  const [viewingServiceHistory, setViewingServiceHistory] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);

  // UI, Filter & Config States
  const [columns, setColumns] = useState(() => {
    try {
      const savedColumns = localStorage.getItem('boycell-columns');
      return savedColumns ? JSON.parse(savedColumns) : fallbackInitialColumns;
    } catch (error) {
      console.error("Failed to parse columns from localStorage", error);
      return fallbackInitialColumns;
    }
  });
  const [servicosColumns, setServicosColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('boycell-servicos-columns');
      return saved ? JSON.parse(saved) : servicosFallbackColumns;
    } catch (error) {
      console.error("Failed to parse servicos columns from localStorage", error);
      return servicosFallbackColumns;
    }
  });

  // Refs
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // ===================================================================
  // EFFECTS
  // ===================================================================
  useEffect(() => {
    localStorage.setItem('boycell-columns', JSON.stringify(columns));
  }, [columns]);
  useEffect(() => {
    localStorage.setItem('boycell-servicos-columns', JSON.stringify(servicosColumns));
  }, [servicosColumns]);
  useEffect(() => {
    const afterPrint = () => {
      document.body.classList.remove('print-mode-recibo');
      document.body.classList.remove('print-mode-compra-imediata');
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  // ===================================================================
  // HANDLERS & HELPER FUNCTIONS
  // ===================================================================
  const handleOpenServiceHistoryModal = (service) => {
    setViewingServiceHistory(service);
    setIsServiceHistoryModalOpen(true);
  };

  const handleCloseServiceHistoryModal = () => {
    setIsServiceHistoryModalOpen(false);
    setViewingServiceHistory(null);
  };

  const handleAddNewProduct = async (e) => {
    await handleAddProduct(e, currentUser.name);
  };

  const handleUpdateExistingProduct = async (e) => {
    await handleUpdateProduct(e, currentUser.name);
  };

  const handleAddNewServico = async (e) => {
    e.preventDefault();
    if (!newServico.servico || !newServico.fornecedor || !newServico.marca || !newServico.tipoReparo || !newServico.tecnico || !newServico.preco || !newServico.precoFinal) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }
    await handleAddServico(e, currentUser.name); // Pass event and adminName
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.currentTarget.classList.add('bg-gray-700');
  };
  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('bg-gray-700');
    const newColumns = [...columns];
    const draggedItem = newColumns.splice(dragItem.current, 1)[0];
    newColumns.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null;
    dragOverItem.current = null;
    setColumns(newColumns);
  };
  const handlePrintCompraImediata = () => {
    document.body.classList.add('print-mode-compra-imediata');
    window.print();
  };
  const handleOpenHistoryModal = (product) => {
    setViewingHistory(product);
    setIsHistoryModalOpen(true);
  };
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setViewingHistory(null);
  };

  const actionButtonClasses = "w-full inline-flex items-center justify-start gap-3 px-4 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-300 text-sm";

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans leading-relaxed">
      <Toaster position="top-right" toastOptions={{ className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white', style: { background: 'transparent', boxShadow: 'none' } }} />
      <div id="compra-imediata-printable" className="p-8 bg-white text-black hidden">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-bold">COMPRA IMEDIATA</h1>
          <div className="w-48 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500">
            <p className="text-sm">Espaço para Logo</p>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-black">
            <tr>
              {columns.filter(c => c.printable !== false && c.id !== 'precoFinal').map(col => (
                <th key={col.id} className="p-2 font-bold">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map(item => (
              <tr key={item.id} className="border-b border-gray-200">
                {columns.filter(c => c.printable !== false && c.id !== 'precoFinal').map(col => <td key={col.id} className="p-2">{item[col.id]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <main id="estoque-non-printable-area" className="container mx-auto px-4 py-8 md:py-16">
        {/* Cabeçalho da página com título e botões de navegação */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Controle de Estoque</h1>
          <div>
            <button onClick={() => navigate('/vendas')} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mr-4" title="Página de Vendas">
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Página de Vendas</span>
            </button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mr-4" title="Ver Site">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Ver Site</span>
            </a>
            {(currentUser.role === 'admin' || currentUser.role === 'root') && (
              <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mr-4" title="Painel de Administração">
                <Settings size={20} />
                <span className="hidden sm:inline">Administração</span>
              </button>
            )}
            <button onClick={onLogout} className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors ml-2" title="Sair">
              <LogOut size={20} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Painéis de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Painel de Produtos */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Produtos</h3>
                <div className="flex flex-col gap-3">
                    {currentUser.permissions?.addProduct && (
                        <button onClick={handleOpenAddModal} className={actionButtonClasses}>
                            <PlusCircle size={18} /> Adicionar Produto
                        </button>
                    )}
                    {currentUser.permissions?.exportCsv && (
                        <button onClick={handleExportCSV} className={actionButtonClasses}>
                            <FileDown size={18} /> Exportar CSV de Produtos
                        </button>
                    )}
                    <button onClick={handlePrintCompraImediata} className={actionButtonClasses}>
                        <Printer size={18} /> Imprimir Lista de Compra
                    </button>
                </div>
            </div>

            {/* Painel de Serviços */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border-t-4 border-blue-500">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Serviços</h3>
                <div className="flex flex-col gap-3">
                    {currentUser.permissions?.addService && (
                        <button onClick={handleOpenAddServicoModal} className={actionButtonClasses}>
                            <PlusCircle size={18} /> Adicionar Serviço
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Card principal que contém a tabela */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-green-600 dark:text-green-400">Produtos Cadastrados</h2>
          </div>

          {/* Barra de Busca */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={20} className="text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Buscar produto..."
                className="w-full p-3 pl-10 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-500 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-green-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Mostrar apenas estoque baixo</span>
            </label>
          </div>

          {/* Tabela de produtos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {columns.map((col, index) => (
                    <th 
                      key={col.id} 
                      className={`p-4 font-semibold text-${col.align} ${col.sortable ? 'cursor-pointer' : 'cursor-move'} group ${col.printable === false ? 'printable-hidden' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {col.sortable ? (
                          <button onClick={() => handleSort(col.id)} className="flex items-center hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            {col.label}
                            {sortConfig.key === col.id && (sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />)}
                          </button>
                        ) : (
                          <span>{col.label}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEstoque.length > 0 ? paginatedEstoque.map((item) => {
                  const isLowStock = item.emEstoque <= item.qtdaMinima;
                  return (
                  <tr 
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800 transition-colors ${isLowStock ? 'bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-950/60' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
                  >
                    {columns.map(col => {
                      switch (col.id) {
                        case 'imagem':
                          return <td key={col.id} className="p-2 printable-hidden"><img src={item.imagem || 'https://via.placeholder.com/40'} alt={item.nome} className="w-12 h-12 object-cover rounded-md bg-gray-200 dark:bg-gray-700" /></td>;
                        case 'nome':
                          return <td key={col.id} className="p-4 font-medium">{item.nome}</td>;
                        case 'emEstoque':
                          return <td key={col.id} className={`p-4 font-semibold ${isLowStock ? 'text-red-500 dark:text-red-400' : ''}`}>{item.emEstoque}</td>;
                        case 'preco':
                          return <td key={col.id} className="p-4">{item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                        case 'precoFinal':
                          return <td key={col.id} className={`p-4 ${col.printable === false ? 'printable-hidden' : ''}`}>{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                        case 'acoes':
                          return (
                            <td key={col.id} className="p-4 text-right printable-hidden">
                              <div className="flex items-center justify-end gap-4">
                                <button onClick={() => handleOpenHistoryModal(item)} className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors" title="Ver Histórico">
                                  <History size={18} />
                                </button>
                                {currentUser.permissions?.editProduct && (
                                  <button onClick={() => handleOpenEditModal(item)} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors" title="Editar Produto">
                                    <Edit size={18} />
                                  </button>
                                )}
                                {currentUser.permissions?.deleteProduct && (
                                  <button onClick={() => handleExcluirProduto(item.id, currentUser.name)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors" title="Excluir Produto">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        default:
                          return <td key={col.id} className={`p-4 ${col.printable === false ? 'printable-hidden' : ''}`}>{item[col.id]}</td>;
                      }
                    })}
                  </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center no-print text-sm text-gray-500 dark:text-gray-400">
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Seção de Serviços */}
      <main className="container mx-auto px-4 py-8 md:py-16 pt-0">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">Serviços Cadastrados</h2>
            </div>

            {/* Barra de Busca para Serviços */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search size={20} className="text-gray-500" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar serviço..."
                        className="w-full p-3 pl-10 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={servicoSearchTerm}
                        onChange={(e) => setServicoSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabela de Serviços */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            {servicosColumns.map((col) => (
                                <th key={col.id} className={`p-4 font-semibold text-${col.align}`}>
                                    <div className="flex items-center gap-2">
                                        {col.sortable ? (
                                            <button onClick={() => handleServicoSort(col.id)} className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                {col.label}
                                                {servicoSortConfig.key === col.id && (servicoSortConfig.direction === 'ascending' ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />)}
                                            </button>
                                        ) : (
                                            <span>{col.label}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedServicos.length > 0 ? paginatedServicos.map((item) => (
                            <tr key={item.id} className="border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                {servicosColumns.map(col => {
                                    switch (col.id) {
                                        case 'imagem':
                                            return <td key={col.id} className="p-2"><img src={item.imagem || 'https://via.placeholder.com/40'} alt={item.servico} className="w-12 h-12 object-cover rounded-md bg-gray-200 dark:bg-gray-700" /></td>;
                                        case 'preco':
                                            return <td key={col.id} className="p-4">{item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                                        case 'precoFinal':
                                            return <td key={col.id} className="p-4">{item.precoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>;
                                        case 'servico':
                                            return <td key={col.id} className="p-4 font-medium">{item.servico}</td>;
                                        case 'acoes':
                                            return (
                                                <td key={col.id} className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button onClick={() => handleOpenServiceHistoryModal(item)} className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors" title="Ver Histórico">
                                                            <History size={18} />
                                                        </button>
                                                        {currentUser.permissions?.editService && (
                                                          <button onClick={() => handleOpenEditServicoModal(item)} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors" title="Editar Serviço">
                                                              <Edit size={18} />
                                                          </button>
                                                        )}
                                                        {currentUser.permissions?.deleteService && (
                                                          <button onClick={() => handleExcluirServico(item.id, currentUser.name)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors" title="Excluir Serviço">
                                                              <Trash2 size={18} />
                                                          </button>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        default:
                                            return <td key={col.id} className="p-4">{item[col.id]}</td>;
                                    }
                                })}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={servicosColumns.length} className="p-8 text-center text-gray-500">Nenhum serviço encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Controles de Paginação para Serviços */}
            {totalServicoPages > 1 && (
                <div className="mt-6 flex justify-between items-center no-print text-sm text-gray-500 dark:text-gray-400">
                    <span>
                        Página {servicoCurrentPage} de {totalServicoPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setServicoCurrentPage(prev => Math.max(prev - 1, 1))} disabled={servicoCurrentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeft size={20} /></button>
                        <button onClick={() => setServicoCurrentPage(prev => Math.min(prev + 1, totalServicoPages))} disabled={servicoCurrentPage === totalServicoPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}
      {/* Modal para Histórico do Produto */}
      <Modal isOpen={isHistoryModalOpen} onClose={handleCloseHistoryModal}>
        {viewingHistory && (
          <>
            <h2 className="text-2xl font-bold text-center text-purple-600 dark:text-purple-400 mb-2">Histórico de Alterações</h2>
            <p className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-6">{viewingHistory.nome}</p>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
              {viewingHistory.historico && viewingHistory.historico.length > 0 ? (
                [...viewingHistory.historico].reverse().map((entry, index) => (
                  <div key={index} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-md font-bold text-purple-600 dark:text-purple-300">{entry.acao}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.data).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{entry.detalhes.replaceAll('; ', '\n')}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum histórico encontrado para este produto.</p>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal para Adicionar Novo Produto */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
        <h2 className="text-2xl font-bold text-center text-green-600 dark:text-green-400 mb-6">Adicionar Novo Produto</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={handleAddNewProduct}>
            <div className="md:col-span-2">
                <label htmlFor="add-nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
                <input id="add-nome" name="nome" type="text" value={newProduct.nome} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="add-categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <input id="add-categoria" name="categoria" type="text" value={newProduct.categoria} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="add-marca" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                <input id="add-marca" name="marca" type="text" value={newProduct.marca} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="add-fornecedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor</label>
                <input id="add-fornecedor" name="fornecedor" type="text" value={newProduct.fornecedor} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="add-emEstoque" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Em Estoque</label>
                <input id="add-emEstoque" name="emEstoque" type="number" value={newProduct.emEstoque} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="add-qtdaMinima" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qtda. Mínima</label>
                <input id="add-qtdaMinima" name="qtdaMinima" type="number" value={newProduct.qtdaMinima} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
                <label htmlFor="add-tempoDeGarantia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Garantia (dias)</label>
                <input id="add-tempoDeGarantia" name="tempoDeGarantia" type="number" value={newProduct.tempoDeGarantia} onChange={handleInputChange} placeholder="Ex: 30" className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="add-imagem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagem</label>
                <input id="add-imagem" name="imagem" type="file" accept="image/*" onChange={handleInputChange} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer" />
                {newProduct.imagem && <img src={newProduct.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />}
            </div>
            <div className="md:col-span-2 flex items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <label htmlFor="add-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input id="add-destaque" name="destaque" type="checkbox" checked={newProduct.destaque} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-green-500 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-green-500" />
                    Mostrar produto na página inicial
                </label>
            </div>
            <hr className="md:col-span-2 border-gray-700 my-2" />
            <div>
                <label htmlFor="add-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
                <input id="add-preco" name="preco" type="number" step="0.01" value={newProduct.preco} onChange={handleInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 50.00" />
            </div>
            <div>
                <label htmlFor="add-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
                <input id="add-markup" name="markup" type="number" step="0.01" placeholder="Ex: 25" value={newProduct.markup} onChange={handleInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="add-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final (Venda)</label>
                <input id="add-precoFinal" name="precoFinal" type="number" step="0.01" value={newProduct.precoFinal} onChange={handleInputChange} required disabled={!!newProduct.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
            </div>
            <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-300">
                Salvar Produto
            </button>
        </form>
      </Modal>

      {/* Modal para Editar Produto */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
        <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Editar Produto</h2>
        {editingProduct && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={handleUpdateExistingProduct}>
                <div className="md:col-span-2">
                    <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-300">Nome do Produto</label>
                    <input id="edit-nome" name="nome" type="text" value={editingProduct.nome} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label htmlFor="edit-categoria" className="block text-sm font-medium text-gray-300">Categoria</label>
                    <input id="edit-categoria" name="categoria" type="text" value={editingProduct.categoria} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label htmlFor="edit-marca" className="block text-sm font-medium text-gray-300">Marca</label>
                    <input id="edit-marca" name="marca" type="text" value={editingProduct.marca} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label htmlFor="edit-fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor</label>
                    <input id="edit-fornecedor" name="fornecedor" type="text" value={editingProduct.fornecedor} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label htmlFor="edit-emEstoque" className="block text-sm font-medium text-gray-300">Em Estoque</label>
                    <input id="edit-emEstoque" name="emEstoque" type="number" value={editingProduct.emEstoque} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label htmlFor="edit-qtdaMinima" className="block text-sm font-medium text-gray-300">Qtda. Mínima</label>
                    <input id="edit-qtdaMinima" name="qtdaMinima" type="number" value={editingProduct.qtdaMinima} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                    <label htmlFor="edit-tempoDeGarantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
                    <input id="edit-tempoDeGarantia" name="tempoDeGarantia" type="number" value={editingProduct.tempoDeGarantia} onChange={handleEditInputChange} placeholder="Ex: 30" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="edit-imagem" className="block text-sm font-medium text-gray-300">Imagem</label>
                    <input id="edit-imagem" name="imagem" type="file" accept="image/*" onChange={handleEditInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer" />
                    {editingProduct.imagem && <img src={editingProduct.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />}
                </div>
                <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
                    <label htmlFor="edit-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
                        <input id="edit-destaque" name="destaque" type="checkbox" checked={editingProduct.destaque} onChange={handleEditInputChange} className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-700 rounded focus:ring-green-500" />
                        Mostrar produto na página inicial
                    </label>
                </div>
                <hr className="md:col-span-2 border-gray-700 my-2" />
                <div>
                    <label htmlFor="edit-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
                    <input id="edit-preco" name="preco" type="number" step="0.01" value={editingProduct.preco} onChange={handleEditInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 50.00" />
                </div>
                <div>
                    <label htmlFor="edit-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
                    <input id="edit-markup" name="markup" type="number" step="0.01" placeholder="Ex: 25" value={editingProduct.markup} onChange={handleEditInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="edit-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final (Venda)</label>
                    <input id="edit-precoFinal" name="precoFinal" type="number" step="0.01" value={editingProduct.precoFinal} onChange={handleEditInputChange} required disabled={!!editingProduct.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
                </div>
                <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-300">
                    Salvar Alterações
                </button>
            </form>
        )}
      </Modal>

      {/* Modal para Adicionar Novo Serviço */}
      <Modal isOpen={isAddServicoModalOpen} onClose={handleCloseAddServicoModal}>
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Adicionar Novo Serviço</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={handleAddNewServico}>
          <div className="md:col-span-2">
            <label htmlFor="servico-add-servico" className="block text-sm font-medium text-gray-300">Nome do Serviço</label>
            <input id="servico-add-servico" name="servico" type="text" value={newServico.servico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor (Peças)</label>
            <input id="servico-add-fornecedor" name="fornecedor" type="text" value={newServico.fornecedor} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-marca" className="block text-sm font-medium text-gray-300">Marca do Aparelho</label>
            <input id="servico-add-marca" name="marca" type="text" value={newServico.marca} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-tipoReparo" className="block text-sm font-medium text-gray-300">Tipo de Reparo</label>
            <input id="servico-add-tipoReparo" name="tipoReparo" type="text" value={newServico.tipoReparo} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-tecnico" className="block text-sm font-medium text-gray-300">Técnico Responsável</label>
            <input id="servico-add-tecnico" name="tecnico" type="text" value={newServico.tecnico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="servico-add-garantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
            <input id="servico-add-garantia" name="tempoDeGarantia" type="number" value={newServico.tempoDeGarantia} onChange={handleServicoInputChange} placeholder="Ex: 90" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="servico-add-imagem" className="block text-sm font-medium text-gray-300">Imagem</label>
            <input id="servico-add-imagem" name="imagem" type="file" accept="image/*" onChange={handleServicoInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
            {newServico.imagem && <img src={newServico.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />}
          </div>
          <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
            <label htmlFor="servico-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
              <input id="servico-destaque" name="destaque" type="checkbox" checked={newServico.destaque} onChange={handleServicoInputChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500" />
              Mostrar serviço na página inicial
            </label>
          </div>
          <hr className="md:col-span-2 border-gray-700 my-2" />
          <div>
            <label htmlFor="servico-add-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
            <input id="servico-add-preco" name="preco" type="number" step="0.01" value={newServico.preco} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 300.00" />
          </div>
          <div>
            <label htmlFor="servico-add-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
            <input id="servico-add-markup" name="markup" type="number" step="0.01" placeholder="Ex: 100" value={newServico.markup} onChange={handleServicoInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="servico-add-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final (Cobrado)</label>
            <input id="servico-add-precoFinal" name="precoFinal" type="number" step="0.01" value={newServico.precoFinal} onChange={handleServicoInputChange} required disabled={!!newServico.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
          </div>
          <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
            Salvar Serviço
          </button>
        </form>
      </Modal>

      {/* Modal para Editar Serviço */}
      <Modal isOpen={isEditServicoModalOpen} onClose={handleCloseEditServicoModal}>
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Editar Serviço</h2>
        {editingServico && ( // Ensure editingServico is not null
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={(e) => handleUpdateServico(e, currentUser.name)}>
            <div className="md:col-span-2">
              <label htmlFor="servico-edit-servico" className="block text-sm font-medium text-gray-300">Nome do Serviço</label>
              <input id="servico-edit-servico" name="servico" type="text" value={editingServico.servico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-fornecedor" className="block text-sm font-medium text-gray-300">Fornecedor (Peças)</label>
              <input id="servico-edit-fornecedor" name="fornecedor" type="text" value={editingServico.fornecedor} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-marca" className="block text-sm font-medium text-gray-300">Marca do Aparelho</label>
              <input id="servico-edit-marca" name="marca" type="text" value={editingServico.marca} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-tipoReparo" className="block text-sm font-medium text-gray-300">Tipo de Reparo</label>
              <input id="servico-edit-tipoReparo" name="tipoReparo" type="text" value={editingServico.tipoReparo} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-tecnico" className="block text-sm font-medium text-gray-300">Técnico Responsável</label>
              <input id="servico-edit-tecnico" name="tecnico" type="text" value={editingServico.tecnico} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="servico-edit-garantia" className="block text-sm font-medium text-gray-300">Garantia (dias)</label>
              <input id="servico-edit-garantia" name="tempoDeGarantia" type="number" value={editingServico.tempoDeGarantia} onChange={handleServicoInputChange} placeholder="Ex: 90" className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="servico-edit-imagem" className="block text-sm font-medium text-gray-300">Imagem</label>
              <input id="servico-edit-imagem" name="imagem" type="file" accept="image/*" onChange={handleServicoInputChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
              {editingServico.imagem && <img src={editingServico.imagem} alt="Pré-visualização" className="mt-4 w-24 h-24 object-cover rounded-lg shadow-md" />}
            </div>
            <div className="md:col-span-2 flex items-center p-3 bg-gray-800/50 rounded-lg">
              <label htmlFor="servico-edit-destaque" className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
                <input id="servico-edit-destaque" name="destaque" type="checkbox" checked={editingServico.destaque} onChange={handleServicoInputChange} className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500" />
                Mostrar serviço na página inicial
              </label>
            </div>
            <hr className="md:col-span-2 border-gray-700 my-2" />
            <div>
              <label htmlFor="servico-edit-preco" className="block text-sm font-medium text-gray-300">Preço de Custo</label>
              <input id="servico-edit-preco" name="preco" type="number" step="0.01" value={editingServico.preco} onChange={handleServicoInputChange} required className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 300.00" />
            </div>
            <div>
              <label htmlFor="servico-edit-markup" className="block text-sm font-medium text-gray-300">Markup (%)</label>
              <input id="servico-edit-markup" name="markup" type="number" step="0.01" placeholder="Ex: 100" value={editingServico.markup} onChange={handleServicoInputChange} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="servico-edit-precoFinal" className="block text-sm font-medium text-gray-300">Preço Final (Cobrado)</label>
              <input id="servico-edit-precoFinal" name="precoFinal" type="number" step="0.01" value={editingServico.precoFinal} onChange={handleServicoInputChange} required disabled={!!editingServico.markup} className="mt-1 block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed" />
            </div>
            <button type="submit" className="w-full md:col-span-2 mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
              Salvar Alterações
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StockControl;
