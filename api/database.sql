-- Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Armazenaremos o hash da senha
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    marca VARCHAR(100),
    fornecedor VARCHAR(100),
    em_estoque INT NOT NULL DEFAULT 0,
    qtda_minima INT NOT NULL DEFAULT 0,
    preco NUMERIC(10, 2) NOT NULL,
    preco_final NUMERIC(10, 2) NOT NULL,
    markup VARCHAR(20),
    imagem TEXT,
    destaque BOOLEAN DEFAULT FALSE,
    tempo_de_garantia INT DEFAULT 0, -- em dias
    historico JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Serviços
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    servico VARCHAR(255) NOT NULL,
    fornecedor VARCHAR(100),
    marca VARCHAR(100),
    tipo_reparo VARCHAR(100),
    tecnico VARCHAR(100),
    preco NUMERIC(10, 2) NOT NULL,
    preco_final NUMERIC(10, 2) NOT NULL,
    markup VARCHAR(20),
    imagem TEXT,
    destaque BOOLEAN DEFAULT FALSE,
    tempo_de_garantia INT DEFAULT 0, -- em dias
    historico JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(255),
    last_purchase TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vendas
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    receipt_code VARCHAR(50) UNIQUE,
    client_id INT REFERENCES clients(id),
    user_id INT REFERENCES users(id),
    vendedor_name VARCHAR(255),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2),
    discount_value NUMERIC(10, 2),
    total NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    sale_date TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Itens da Venda (tabela de junção)
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    service_id INT REFERENCES services(id),
    item_type VARCHAR(10) NOT NULL, -- 'produto' ou 'servico'
    quantity INT NOT NULL,
    item_name VARCHAR(255), -- Denormalizado para facilitar a geração de recibos
    unit_price NUMERIC(10, 2) NOT NULL,
    CONSTRAINT chk_item_link CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
);

-- Tabela de Log de Atividades
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    admin_name VARCHAR(255),
    action VARCHAR(255),
    details TEXT,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Orçamentos
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL, -- Ligação opcional com um cliente existente
    status VARCHAR(50) DEFAULT 'Pendente', -- Pendente, Aprovado, Rejeitado, Concluído
    customer_name VARCHAR(255),
    customer_cpf VARCHAR(20),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    device_brand_model VARCHAR(255),
    device_serial_number VARCHAR(255),
    reported_defect TEXT,
    observations TEXT,
    items JSONB, -- Itens do orçamento (peças e serviços)
    total NUMERIC(10, 2),
    expected_delivery_date DATE,
    warranty_period VARCHAR(100),
    user_id INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função e Triggers para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();