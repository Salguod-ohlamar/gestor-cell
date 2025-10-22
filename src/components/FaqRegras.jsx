import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqData = [
    {
        category: 'Vendas e Faturamento',
        questions: [
            {
                q: 'Como o total de uma venda é calculado?',
                a: 'O total da venda é calculado da seguinte forma: 1. Soma-se o "Preço Final" de cada item multiplicado pela sua quantidade para obter o Subtotal. 2. Aplica-se o percentual de desconto sobre o Subtotal. 3. O Total Final é o Subtotal menos o valor do desconto.'
            },
            {
                q: 'O que acontece se eu tentar vender um produto sem estoque?',
                a: 'O sistema não permite. Produtos com estoque zerado ou abaixo do estoque mínimo não podem ser adicionados ao carrinho. Se o estoque acabar durante a venda, o sistema avisará e ajustará a quantidade no carrinho para o máximo disponível.'
            },
            {
                q: 'O que é o "Estoque Mínimo" de um produto?',
                a: 'É uma quantidade de segurança. O sistema considera o "Estoque Vendável" como (Estoque Atual - Estoque Mínimo). Você só pode vender a quantidade de itens dentro do "Estoque Vendável". Isso evita que o estoque físico fique zerado.'
            },
            {
                q: 'O cadastro de cliente é obrigatório?',
                a: 'Não. Se nenhum CPF for informado, a venda é registrada para o "Cliente Balcão". Se um CPF for informado, o sistema busca o cliente. Se não encontrar, um novo cliente é criado automaticamente com os dados fornecidos.'
            }
        ]
    },
    {
        category: 'Relatórios (DRE)',
        questions: [
            {
                q: 'Como a "Receita Bruta" é calculada no DRE?',
                a: 'A Receita Bruta é a soma de todos os valores totais das vendas (já com desconto) mais a soma de todos os descontos concedidos no período. Essencialmente, é o valor total que teria sido vendido sem nenhum desconto.'
            },
            {
                q: 'O que é o "Custo das Vendas (CMV)"?',
                a: 'É a soma do "Preço de Custo" (o campo `preco` no cadastro) de todos os produtos e serviços vendidos no período. Ele representa o quanto você gastou para adquirir os itens que foram vendidos.'
            },
            {
                q: 'Como o "Lucro Bruto" é calculado?',
                a: 'O Lucro Bruto é o resultado da "Receita Líquida" (total vendido) menos o "Custo das Vendas (CMV)". Este valor não considera outras despesas como aluguel, salários, etc.'
            }
        ]
    },
    {
        category: 'Usuários e Permissões',
        questions: [
            {
                q: 'Quais são os níveis de usuário?',
                a: 'Existem 3 níveis principais: Vendedor, Admin e Root. Vendedores têm acesso à tela de vendas e ao seu próprio desempenho. Admins podem gerenciar produtos, serviços, clientes e ver relatórios. O Root tem acesso total, incluindo o gerenciamento de outros usuários.'
            },
            {
                q: 'Um vendedor pode ver as vendas de outro vendedor?',
                a: 'Não. No painel de desempenho da tela de vendas, cada vendedor vê apenas os seus próprios resultados. Apenas usuários Admin e Root podem ver os dados consolidados de todas as vendas.'
            }
        ]
    }
];

const FaqItem = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4 px-2"
            >
                <span className="font-semibold text-gray-200">{q}</span>
                {isOpen ? <ChevronUp className="text-green-400" /> : <ChevronDown className="text-gray-400" />}
            </button>
            {isOpen && (
                <div className="pb-4 px-2 text-gray-300 animate-fade-in-down">
                    <p>{a}</p>
                </div>
            )}
        </div>
    );
};

const FaqRegras = () => {
    return (
        <div className="p-6 bg-gray-900 rounded-lg shadow-lg text-white">
            <h2 className="text-3xl font-bold text-center mb-8 text-green-400">FAQ - Regras de Negócio</h2>
            <div className="space-y-8">
                {faqData.map(categoryItem => (
                    <div key={categoryItem.category}>
                        <h3 className="text-2xl font-semibold mb-4 text-blue-400 border-l-4 border-blue-400 pl-3">{categoryItem.category}</h3>
                        <div className="space-y-2">
                            {categoryItem.questions.map((item, index) => (
                                <FaqItem key={index} q={item.q} a={item.a} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             <div className="text-center mt-10 text-xs text-gray-500">
                <p>Relatorio gerado por GestorCell</p>
            </div>
        </div>
    );
};

export default FaqRegras;