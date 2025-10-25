importimport React, 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { FaTrash, FaPrint, FaShareAlt, FaPlusCircle, FaSearch } from 'react-icons/fa';
import './Orcamento.css';

function Orcamento() {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [quoteItems, setQuoteItems] = useState([]);
    const [customerName, setCustomerName] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const searchItems = async () => {
            if (debouncedSearchTerm.length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            try {
                // Busca em paralelo produtos e serviços
                const [productsRes, servicesRes] = await Promise.all([
                    api.get(`/products/search?q=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }),
                    api.get(`/services/search?q=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                const products = productsRes.data.map(p => ({ ...p, type: 'produto' }));
                const services = servicesRes.data.map(s => ({ ...s, type: 'servico' }));

                setSearchResults([...products, ...services]);
            } catch (error) {
                console.error("Erro ao buscar itens:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        searchItems();
    }, [debouncedSearchTerm, token]);

    const addItemToQuote = (item) => {
        setQuoteItems(prevItems => {
            const existingItem = prevItems.find(i => i.id === item.id && i.type === item.type);
            if (existingItem) {
                return prevItems.map(i =>
                    i.id === item.id && i.type === item.type
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prevItems, { ...item, quantity: 1 }];
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeItemFromQuote = (itemId, itemType) => {
        setQuoteItems(prevItems => prevItems.filter(i => !(i.id === itemId && i.type === itemType)));
    };

    const calculateTotal = () => {
        return quoteItems.reduce((total, item) => total + (item.precoFinal * item.quantity), 0);
    };

    const total = calculateTotal();

    return (
        <div className="orcamento-container">
            <header className="orcamento-header">
                <h1>Gerar Orçamento</h1>
                <div className="orcamento-actions">
                    <button className="orcamento-action-btn"><FaPrint /> Imprimir</button>
                    <button className="orcamento-action-btn"><FaShareAlt /> Compartilhar</button>
                </div>
            </header>

            <div className="customer-section">
                <label htmlFor="customerName">Nome do Cliente:</label>
                <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Opcional"
                />
            </div>

            <div className="search-section">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produto ou serviço..."
                    />
                </div>
                {isSearching && <p>Buscando...</p>}
                {searchResults.length > 0 && (
                    <ul className="search-results">
                        {searchResults.map(item => (
                            <li key={`${item.type}-${item.id}`} onClick={() => addItemToQuote(item)}>
                                <span>{item.nome || item.servico}</span>
                                <span className="item-price">R$ {item.precoFinal.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="quote-items-section">
                <h2>Itens do Orçamento</h2>
                {quoteItems.length === 0 ? (
                    <p className="empty-quote">Nenhum item adicionado ao orçamento.</p>
                ) : (
                    <ul className="quote-items-list">
                        {quoteItems.map(item => (
                            <li key={`${item.type}-${item.id}`}>
                                <span className="item-name">{item.nome || item.servico} (x{item.quantity})</span>
                                <span className="item-total">R$ {(item.precoFinal * item.quantity).toFixed(2)}</span>
                                <button onClick={() => removeItemFromQuote(item.id, item.type)} className="remove-item-btn">
                                    <FaTrash />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <footer className="orcamento-footer">
                <div className="total-section">
                    <h2>Total do Orçamento:</h2>
                    <span className="total-amount">R$ {total.toFixed(2)}</span>
                </div>
            </footer>
        </div>
    );
}

export default Orcamento;

