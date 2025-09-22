
//server.js
const express = require('express');
const cors = require('cors');
const db = require('./db.js');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
require('dotenv').config();
const { protect, hasPermission } = require('./authMiddleware.js');
const { getDefaultPermissions, PERMISSION_GROUPS } = require('./permissions.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permite requisições do nosso frontend React
app.use(express.json()); // Permite que o Express entenda JSON

// ==================
// HELPER FUNCTIONS
// ==================

// Converte um objeto de produto do formato do banco de dados para o formato da API (camelCase)
const formatProductForAPI = (p) => ({
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    marca: p.marca,
    fornecedor: p.fornecedor,
    emEstoque: p.em_estoque,
    qtdaMinima: p.qtda_minima,
    preco: parseFloat(p.preco),
    precoFinal: parseFloat(p.preco_final),
    markup: p.markup,
    imagem: p.imagem,
    destaque: !!p.destaque,
    tempoDeGarantia: p.tempo_de_garantia,
    historico: p.historico,
});

// Converte um objeto de serviço do formato do banco de dados para o formato da API (camelCase)
const formatServiceForAPI = (s) => ({
    id: s.id,
    servico: s.servico,
    fornecedor: s.fornecedor,
    marca: s.marca,
    tipoReparo: s.tipo_reparo,
    tecnico: s.tecnico,
    preco: parseFloat(s.preco),
    precoFinal: parseFloat(s.preco_final),
    markup: s.markup,
    imagem: s.imagem,
    destaque: !!s.destaque,
    tempoDeGarantia: s.tempo_de_garantia,
    historico: s.historico,
});

// Converte um objeto de cliente do formato do banco de dados para o formato da API (camelCase)
const formatClientForAPI = (c) => ({
    id: c.id,
    name: c.name,
    cpf: c.cpf,
    phone: c.phone,
    email: c.email,
    lastPurchase: c.last_purchase,
    isActive: c.is_active,
});

// Centraliza o tratamento de erros para as rotas
const handleRouteError = (res, err, contextMessage) => {
    console.error(`Erro ao ${contextMessage}:`, err);
    res.status(500).json({ message: `Erro no servidor ao ${contextMessage}.`, error: err.message });
};

// Rota de teste
app.get('/', (req, res) => {
  res.send('API Boycell está no ar!');
});

// Rota para buscar todos os produtos
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products ORDER BY nome ASC');
    res.json(rows.map(formatProductForAPI));
  } catch (err) {
    handleRouteError(res, err, 'buscar produtos');
  }
});

// Rota para buscar produtos por nome para a tela de vendas
app.get('/api/products/search', protect, async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.json([]);
    }
    try {
        const queryText = `
            SELECT * FROM products 
            WHERE nome ILIKE $1 
            AND em_estoque > qtda_minima 
            ORDER BY nome ASC 
            LIMIT 20;
        `;
        const { rows } = await db.query(queryText, [`%${q}%`]);
        
        res.json(rows.map(formatProductForAPI));
    } catch (err) {
        handleRouteError(res, err, 'buscar produtos');
    }
});

// ==================
// SERVICE MANAGEMENT ROUTES
// ==================

// Rota para criar um novo serviço
app.post('/api/services', protect, hasPermission('addService'), async (req, res) => {
    const {
        servico, fornecedor, marca, tipoReparo, tecnico,
        preco, precoFinal, markup, imagem, destaque, tempoDeGarantia
    } = req.body;

    if (!servico || !fornecedor || !marca || !tipoReparo || !tecnico || !preco || !precoFinal) {
        return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
    }

    try {
        const query = `
            INSERT INTO services (
                servico, fornecedor, marca, tipo_reparo, tecnico,
                preco, preco_final, markup, imagem, destaque, tempo_de_garantia, historico
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const historicoInicial = [{
            data: new Date(),
            acao: 'Serviço Criado',
            detalhes: `Serviço "${servico}" criado.`
        }];

        const values = [
            servico, fornecedor, marca, tipoReparo, tecnico,
            parseFloat(preco), parseFloat(precoFinal), markup, imagem, !!destaque, parseInt(tempoDeGarantia, 10) || 0,
            JSON.stringify(historicoInicial)
        ];

        const { rows } = await db.query(query, values);
        const newService = rows[0];
        
        res.status(201).json(formatServiceForAPI(newService));
    } catch (err) {
        handleRouteError(res, err, 'criar serviço');
    }
});

// Rota para atualizar um serviço
app.put('/api/services/:id', protect, hasPermission('editService'), async (req, res) => {
    const { id } = req.params;
    const {
        servico, fornecedor, marca, tipoReparo, tecnico,
        preco, precoFinal, markup, imagem, destaque, tempoDeGarantia, historico
    } = req.body;

    try {
        const query = `
            UPDATE services SET
                servico = $1, fornecedor = $2, marca = $3, tipo_reparo = $4, tecnico = $5,
                preco = $6, preco_final = $7, markup = $8, imagem = $9, destaque = $10, tempo_de_garantia = $11,
                historico = $12, updated_at = NOW()
            WHERE id = $13
            RETURNING *;
        `;
        const values = [
            servico, fornecedor, marca, tipoReparo, tecnico,
            parseFloat(preco), parseFloat(precoFinal), markup, imagem, !!destaque, parseInt(tempoDeGarantia, 10) || 0,
            JSON.stringify(historico),
            id
        ];

        const { rows } = await db.query(query, values);

        if (rows.length === 0) return res.status(404).json({ message: 'Serviço não encontrado.' });
        
        const updatedService = rows[0];
        res.json(formatServiceForAPI(updatedService));
    } catch (err) {
        handleRouteError(res, err, 'atualizar serviço');
    }
});

// Rota para excluir um serviço
app.delete('/api/services/:id', protect, hasPermission('deleteService'), async (req, res) => {
    const { id } = req.params;

    try {
        const salesCheck = await db.query('SELECT 1 FROM sale_items WHERE service_id = $1 LIMIT 1', [id]);
        if (salesCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Não é possível excluir o serviço pois ele possui vendas associadas.' });
        }

        const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING servico', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Serviço não encontrado.' });
        }

        res.status(200).json({ message: `Serviço "${result.rows[0].servico}" excluído com sucesso.` });

    } catch (err) {
        handleRouteError(res, err, 'excluir serviço');
    }
});

// Rota para buscar todos os serviços (mantida, mas agora com o bloco de rotas de gerenciamento)
app.get('/api/services', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM services ORDER BY servico ASC');
    res.json(rows.map(formatServiceForAPI));
  } catch (err) {
    handleRouteError(res, err, 'buscar serviços');
  }
});

// Rota para buscar serviços por nome para a tela de vendas
app.get('/api/services/search', protect, async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.json([]);
    }
    try {
        const queryText = `SELECT * FROM services WHERE servico ILIKE $1 ORDER BY servico ASC LIMIT 20;`;
        const { rows } = await db.query(queryText, [`%${q}%`]);
        res.json(rows.map(formatServiceForAPI));
    } catch (err) {
        handleRouteError(res, err, 'buscar serviços');
    }
});

// ==================
// BANNER MANAGEMENT ROUTES
// ==================

// Rota para buscar todos os banners ativos (público)
app.get('/api/banners', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC');
    res.json(rows);
  } catch (err) {
    handleRouteError(res, err, 'buscar banners');
  }
});

// Rota para buscar TODOS os banners (admin)
app.get('/api/banners/all', protect, hasPermission('manageBanners'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
    res.json(rows);
  } catch (err) {
    handleRouteError(res, err, 'buscar todos os banners');
  }
});

// Rota para criar um novo banner
app.post('/api/banners', protect, hasPermission('manageBanners'), async (req, res) => {
    const { title, text, image_url, link_url, is_active, sort_order } = req.body;

    if (!image_url) {
        return res.status(400).json({ message: 'A imagem do banner é obrigatória.' });
    }

    try {
        const query = `
            INSERT INTO banners (title, text, image_url, link_url, is_active, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [title, text, image_url, link_url, is_active, sort_order || 0];
        const { rows } = await db.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        handleRouteError(res, err, 'criar banner');
    }
});

// Rota para atualizar um banner
app.put('/api/banners/:id', protect, hasPermission('manageBanners'), async (req, res) => {
    const { id } = req.params;
    const { title, text, image_url, link_url, is_active, sort_order } = req.body;

    if (!image_url) {
        return res.status(400).json({ message: 'A imagem do banner é obrigatória.' });
    }

    try {
        const query = `
            UPDATE banners SET
                title = $1, text = $2, image_url = $3, link_url = $4, is_active = $5, sort_order = $6, updated_at = NOW()
            WHERE id = $7
            RETURNING *;
        `;
        const values = [title, text, image_url, link_url, is_active, sort_order || 0, id];
        const { rows } = await db.query(query, values);

        if (rows.length === 0) return res.status(404).json({ message: 'Banner não encontrado.' });
        
        res.json(rows[0]);
    } catch (err) {
        handleRouteError(res, err, 'atualizar banner');
    }
});

// Rota para excluir um banner
app.delete('/api/banners/:id', protect, hasPermission('manageBanners'), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM banners WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Banner não encontrado.' });
        }
        res.status(200).json({ message: 'Banner excluído com sucesso.' });
    } catch (err) {
        handleRouteError(res, err, 'excluir banner');
    }
});

// Rota para criar um novo produto
app.post('/api/products', protect, hasPermission('addProduct'), async (req, res) => {
    const {
        nome, categoria, marca, fornecedor, emEstoque, qtdaMinima,
        preco, precoFinal, markup, imagem, destaque, tempoDeGarantia
    } = req.body;

    if (!nome || !categoria || !emEstoque || !preco || !precoFinal) {
        return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
    }

    try {
        const query = `
            INSERT INTO products (
                nome, categoria, marca, fornecedor, em_estoque, qtda_minima,
                preco, preco_final, markup, imagem, destaque, tempo_de_garantia, historico
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
        const historicoInicial = [{
            data: new Date(),
            acao: 'Produto Criado',
            detalhes: `Produto "${nome}" criado com estoque inicial de ${emEstoque}.`
        }];

        const values = [
            nome, categoria, marca, fornecedor, parseInt(emEstoque, 10), parseInt(qtdaMinima, 10),
            parseFloat(preco), parseFloat(precoFinal), markup, imagem, !!destaque, parseInt(tempoDeGarantia, 10) || 0,
            JSON.stringify(historicoInicial)
        ];

        const { rows } = await db.query(query, values);
        const newProduct = rows[0];
        
        res.status(201).json(formatProductForAPI(newProduct));
    } catch (err) {
        handleRouteError(res, err, 'criar produto');
    }
});

// Rota para atualizar um produto
app.put('/api/products/:id', protect, hasPermission('editProduct'), async (req, res) => {
    const { id } = req.params;
    const {
        nome, categoria, marca, fornecedor, emEstoque, qtdaMinima,
        preco, precoFinal, markup, imagem, destaque, tempoDeGarantia, historico
    } = req.body;

    try {
        const query = `
            UPDATE products SET
                nome = $1, categoria = $2, marca = $3, fornecedor = $4, em_estoque = $5, qtda_minima = $6,
                preco = $7, preco_final = $8, markup = $9, imagem = $10, destaque = $11, tempo_de_garantia = $12,
                historico = $13, updated_at = NOW()
            WHERE id = $14
            RETURNING *;
        `;
        const values = [
            nome, categoria, marca, fornecedor, parseInt(emEstoque, 10), parseInt(qtdaMinima, 10),
            parseFloat(preco), parseFloat(precoFinal), markup, imagem, !!destaque, parseInt(tempoDeGarantia, 10) || 0,
            JSON.stringify(historico),
            id
        ];

        const { rows } = await db.query(query, values);

        if (rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
        
        const updatedProduct = rows[0];
        res.json(formatProductForAPI(updatedProduct));
    } catch (err) {
        handleRouteError(res, err, 'atualizar produto');
    }
});

// Rota para excluir um produto
app.delete('/api/products/:id', protect, hasPermission('deleteProduct'), async (req, res) => {
    const { id } = req.params;

    try {
        const salesCheck = await db.query('SELECT 1 FROM sale_items WHERE product_id = $1 LIMIT 1', [id]);
        if (salesCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Não é possível excluir o produto pois ele possui vendas associadas.' });
        }

        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING nome', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        res.status(200).json({ message: `Produto "${result.rows[0].nome}" excluído com sucesso.` });

    } catch (err) {
        handleRouteError(res, err, 'excluir produto');
    }
});

// ==================
// AUTH ROUTES
// ==================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    // Find user by email
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Compare password with the stored hash.
    // You must store hashed passwords in your database.
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Garante que o usuário tenha as permissões mais recentes para sua role
    const defaultPerms = getDefaultPermissions(user.role);
    const finalPermissions = { ...defaultPerms, ...(user.permissions || {}) };

    // Garante que o root sempre tenha todas as permissões
    if (user.role === 'root') {
        Object.keys(finalPermissions).forEach(key => {
            finalPermissions[key] = true;
        });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expires in 8 hours
    );

    const { password_hash, ...userWithoutPassword } = user;
    // Retorna o token e as informações do usuário com as permissões atualizadas
    res.json({ token, user: { ...userWithoutPassword, permissions: finalPermissions } });
  } catch (err) {
    handleRouteError(res, err, 'durante o login');
  }
});

// Rota para verificar o token e retornar os dados do usuário atualizado
app.get('/api/auth/me', protect, async (req, res) => {
    try {
        // req.user é populado pelo middleware 'protect' com os dados do token
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Re-calcula as permissões para garantir que estão sempre atualizadas
        const defaultPerms = getDefaultPermissions(user.role);
        const finalPermissions = { ...defaultPerms, ...(user.permissions || {}) };

        if (user.role === 'root') {
            Object.keys(finalPermissions).forEach(key => {
                finalPermissions[key] = true;
            });
        }

        const { password_hash, ...userWithoutPassword } = user;
        // Retorna o objeto do usuário com as permissões mais recentes
        res.json({ ...userWithoutPassword, permissions: finalPermissions });

    } catch (err) {
        handleRouteError(res, err, 'ao buscar dados do usuário');
    }
});

// Rota para recuperação de senha (simulada)
app.post('/api/auth/recover', async (req, res) => {
    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ message: 'Email e nome são obrigatórios.' });
    }

    try {
        const { rows } = await db.query('SELECT id FROM users WHERE lower(email) = $1 AND lower(name) = $2', [email.toLowerCase(), name.toLowerCase()]);
        
        // Em um app real, aqui você geraria um token de reset e enviaria um email.
        // Para segurança, sempre retornamos a mesma mensagem, evitando que um atacante
        // descubra quais emails estão ou não cadastrados.
        if (rows.length > 0) {
            console.log(`Solicitação de recuperação de senha para: ${email}`);
        } else {
            console.log(`Tentativa falha de recuperação de senha para: ${email}`);
        }
        res.json({ message: `Se um usuário com esse email e nome existir, um link de recuperação foi enviado.` });

    } catch (err) {
        handleRouteError(res, err, 'durante a recuperação de senha');
    }
});

// ==================
// USER MANAGEMENT ROUTES
// ==================

// Rota para criar um novo usuário (somente admin/root)
app.post('/api/users/register', protect, hasPermission('manageUsers'), async (req, res) => {
  const { name, email, password, role } = req.body;
  const requestingUser = req.user;
  const finalRole = role || 'vendedor';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  if (finalRole === 'admin' && requestingUser.role !== 'root') {
    return res.status(403).json({ message: 'Apenas o usuário root pode criar um administrador.' });
  }

  try {
    const { rows: existingUsers } = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Este email já está cadastrado.' });
    }

    // Criptografa a senha automaticamente
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, permissions',
      [name, email.toLowerCase(), password_hash, finalRole, JSON.stringify(getDefaultPermissions(finalRole))]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    handleRouteError(res, err, 'registrar usuário');
  }
});

// Rota para resetar a senha de um usuário
app.post('/api/users/:id/reset-password', protect, hasPermission('resetUserPassword'), async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user;

    try {
        const { rows: targetUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (targetUserRows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        const targetUser = targetUserRows[0];
        if (targetUser.role === 'root') return res.status(403).json({ message: 'Não é possível resetar a senha do usuário root.' });
        if (targetUser.role === 'admin' && requestingUser.role !== 'root') return res.status(403).json({ message: 'Apenas o usuário root pode resetar a senha de um administrador.' });

        // Gera nova senha aleatória e a criptografa
        const newPassword = crypto.randomBytes(6).toString('hex'); // Gera senha de 12 caracteres
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);

        // Retorna a nova senha em texto plano para o admin
        res.json({ message: `Senha de ${targetUser.name} resetada com sucesso.`, newPassword: newPassword });

    } catch (err) {
        handleRouteError(res, err, 'resetar a senha');
    }
});

// Rota para buscar todos os usuários (protegida)
app.get('/api/users', protect, hasPermission('manageUsers'), async (req, res) => {
  const requestingUser = req.user;
  try {
    let queryText = 'SELECT id, name, email, role, permissions FROM users';
    const queryParams = [];

    // Se o usuário for um admin (mas não root), não mostrar o usuário root.
    if (requestingUser.role === 'admin') {
        queryText += ' WHERE role != $1';
        queryParams.push('root');
    }

    queryText += ' ORDER BY name ASC';
    const { rows } = await db.query(queryText, queryParams);
    res.json(rows);
  } catch (err) {
    handleRouteError(res, err, 'buscar usuários');
  }
});

// Rota para atualizar um usuário
app.put('/api/users/:id', protect, hasPermission('manageUsers'), async (req, res) => {
    const { id } = req.params;
    const { name, email, password, permissions, role } = req.body;
    const requestingUser = req.user;

    try {
        const { rows: targetUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (targetUserRows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        const targetUser = targetUserRows[0];
        if (targetUser.role === 'root') return res.status(403).json({ message: 'O usuário root não pode ser editado.' });
        if (targetUser.role === 'admin' && requestingUser.role !== 'root') return res.status(403).json({ message: 'Apenas o usuário root pode editar um administrador.' });

        // Check for email collision
        if (email) {
            const { rows: existingEmail } = await db.query('SELECT id FROM users WHERE lower(email) = $1 AND id != $2', [email.toLowerCase(), id]);
            if (existingEmail.length > 0) return res.status(409).json({ message: 'Este email já está em uso por outro usuário.' });
        }

        const updateFields = [];
        const values = [];
        let valueCount = 1;

        if (name) { updateFields.push(`name = $${valueCount++}`); values.push(name); }
        if (email) { updateFields.push(`email = $${valueCount++}`); values.push(email.toLowerCase()); }
        if (role && ['admin', 'vendedor'].includes(role) && requestingUser.role === 'root') {
            updateFields.push(`role = $${valueCount++}`);
            values.push(role);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            updateFields.push(`password_hash = $${valueCount++}`);
            values.push(password_hash);
        }
        if (permissions && requestingUser.role === 'root') {
            updateFields.push(`permissions = $${valueCount++}`);
            values.push(JSON.stringify(permissions));
        }

        if (updateFields.length === 0) return res.status(400).json({ message: 'Nenhum dado para atualizar foi fornecido.' });

        values.push(id);
        const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${valueCount} RETURNING id, name, email, role, permissions`;
        
        const { rows } = await db.query(queryText, values);
        res.json(rows[0]);

    } catch (err) {
        handleRouteError(res, err, 'atualizar o usuário');
    }
});

// Rota para excluir um usuário
app.delete('/api/users/:id', protect, hasPermission('manageUsers'), async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user;

    try {
        const { rows: targetUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (targetUserRows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        
        const targetUser = targetUserRows[0];
        if (targetUser.role === 'root') return res.status(403).json({ message: 'O usuário root não pode ser excluído.' });
        if (targetUser.role === 'admin' && requestingUser.role !== 'root') return res.status(403).json({ message: 'Apenas o usuário root pode excluir um administrador.' });

        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(200).json({ message: `Usuário "${targetUser.name}" excluído com sucesso.` });

    } catch (err) {
        handleRouteError(res, err, 'excluir o usuário');
    }
});

// ==================
// CLIENT MANAGEMENT ROUTES
// ==================

// Rota para buscar todos os clientes
app.get('/api/clients', protect, async (req, res) => {
    try {
        const query = 'SELECT * FROM clients ORDER BY name ASC';
        const { rows } = await db.query(query);
        res.json(rows.map(formatClientForAPI));
    } catch (err) {
        handleRouteError(res, err, 'buscar clientes');
    }
});

// Rota para criar um novo cliente (pela tela de gerenciamento)
app.post('/api/clients', protect, hasPermission('manageClients'), async (req, res) => {
    const { name, cpf, phone, email } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ message: 'Nome e Telefone são obrigatórios.' });
    }

    try {
        // Só verifica a unicidade do CPF se ele for fornecido e não estiver em branco
        if (cpf && cpf.trim() !== '') {
            const { rows: existingClient } = await db.query('SELECT id FROM clients WHERE cpf = $1', [cpf]);
            if (existingClient.length > 0) {
                return res.status(409).json({ message: 'Este CPF/CNPJ já está cadastrado.' });
            }
        }

        const finalCpf = (cpf && cpf.trim() !== '') ? cpf.trim() : null;

        const { rows } = await db.query(
            'INSERT INTO clients (name, cpf, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, finalCpf, phone, email]
        );
        res.status(201).json(formatClientForAPI(rows[0]));
    } catch (err) {
        handleRouteError(res, err, 'criar cliente');
    }
});

// Rota para atualizar um cliente
app.put('/api/clients/:id', protect, hasPermission('manageClients'), async (req, res) => {
    const { id } = req.params;
    const { name, cpf, phone, email } = req.body;

    if (!name || !cpf || !phone) {
        return res.status(400).json({ message: 'Nome, CPF/CNPJ e Telefone são obrigatórios.' });
    }

    try {
        // Check for CPF collision
        const { rows: existingClient } = await db.query('SELECT id FROM clients WHERE cpf = $1 AND id != $2', [cpf, id]);
        if (existingClient.length > 0) {
            return res.status(409).json({ message: 'Este CPF/CNPJ já está em uso por outro cliente.' });
        }

        const { rows } = await db.query(
            'UPDATE clients SET name = $1, cpf = $2, phone = $3, email = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [name, cpf, phone, email, id]
        );

        if (rows.length === 0) return res.status(404).json({ message: 'Cliente não encontrado.' });

        const updatedClient = rows[0];
        res.json(formatClientForAPI(updatedClient));
    } catch (err) {
        handleRouteError(res, err, 'atualizar o cliente');
    }
});

// Rota para excluir um cliente
app.delete('/api/clients/:id', protect, hasPermission('manageClients'), async (req, res) => {
    const { id } = req.params;
    let dbClient; // Declare outside to be accessible in finally

    try {
        dbClient = await db.getClient(); // Connect inside the try block
        await dbClient.query('BEGIN');

        // Get client name for the response message
        const clientResult = await dbClient.query('SELECT name FROM clients WHERE id = $1', [id]);
        if (clientResult.rowCount === 0) {
            await dbClient.query('ROLLBACK');
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        const clientName = clientResult.rows[0].name;

        // Delete associated sales. This will cascade to sale_items because of ON DELETE CASCADE on sale_items.
        await dbClient.query('DELETE FROM sales WHERE client_id = $1', [id]);

        // Finally, delete the client itself.
        await dbClient.query('DELETE FROM clients WHERE id = $1', [id]);

        await dbClient.query('COMMIT');
        res.status(200).json({ message: `Cliente "${clientName}" e todo o seu histórico foram excluídos com sucesso.` });

    } catch (err) {
        if (dbClient) {
            try {
                await dbClient.query('ROLLBACK');
            } catch (rbErr) {
                console.error('Error during transaction rollback on client deletion:', rbErr);
            }
        }
        handleRouteError(res, err, 'excluir o cliente e seu histórico');
    } finally {
        if (dbClient) {
            try { dbClient.release(); } catch (relErr) { console.error('Error releasing client on client deletion:', relErr); }
        }
    }
});

// Rota para buscar um cliente pelo CPF/CNPJ
app.get('/api/clients/search', protect, async (req, res) => {
    const { cpf } = req.query;
    if (!cpf) {
        return res.status(400).json({ message: 'CPF/CNPJ é obrigatório para a busca.' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM clients WHERE cpf = $1 AND is_active = TRUE', [cpf]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        res.json(formatClientForAPI(rows[0]));
    } catch (err) {
        handleRouteError(res, err, 'buscar cliente');
    }
});

// ==================
// APPOINTMENT MANAGEMENT ROUTES
// ==================

// Rota para buscar todos os agendamentos (com filtro de data)
app.get('/api/appointments', protect, async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let queryText = `
            SELECT
                a.id,
                a.scheduled_for AS "scheduledFor",
                a.status,
                a.notes,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt",
                c.id AS "clientId",
                c.name AS "clientName",
                c.phone AS "clientPhone",
                s.id AS "serviceId",
                s.servico AS "serviceName",
                u.id AS "userId",
                u.name AS "userName"
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users u ON a.user_id = u.id
        `;
        const values = [];
        const conditions = [];

        if (startDate) {
            values.push(startDate);
            conditions.push(`a.scheduled_for >= $${values.length}`);
        }
        if (endDate) {
            values.push(endDate);
            conditions.push(`a.scheduled_for <= $${values.length}`);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        queryText += ' ORDER BY a.scheduled_for ASC;';

        const { rows } = await db.query(queryText, values);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).send('Erro no servidor ao buscar agendamentos.');
    }
});

// Rota para criar um novo agendamento
app.post('/api/appointments', protect, adminOnly(['root', 'admin', 'vendedor']), async (req, res) => {
    const { clientId, serviceId, userId, scheduledFor, notes } = req.body;

    if (!clientId || !serviceId || !scheduledFor) {
        return res.status(400).json({ message: 'Cliente, serviço e data/hora do agendamento são obrigatórios.' });
    }

    try {
        const insertQuery = `
            INSERT INTO appointments (client_id, service_id, user_id, scheduled_for, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
        const insertValues = [clientId, serviceId, userId || null, scheduledFor, notes];

        const { rows: newAppointmentRows } = await db.query(insertQuery, insertValues);
        const newAppointmentId = newAppointmentRows[0].id;

        // Para consistência, vamos buscar os dados completos para retornar
        const resultQuery = `
            SELECT
                a.id,
                a.scheduled_for AS "scheduledFor",
                a.status,
                a.notes,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt",
                c.id AS "clientId",
                c.name AS "clientName",
                c.phone AS "clientPhone",
                s.id AS "serviceId",
                s.servico AS "serviceName",
                u.id AS "userId",
                u.name AS "userName"
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = $1;
        `;
        const { rows: resultRows } = await db.query(resultQuery, [newAppointmentId]);

        res.status(201).json(resultRows[0]);
    } catch (err) {
        console.error('Create appointment error:', err);
        // Checar se o erro é de chave estrangeira
        if (err.code === '23503') { // Foreign key violation
             return res.status(404).json({ message: 'Cliente, serviço ou técnico não encontrado.' });
        }
        res.status(500).send('Erro no servidor ao criar agendamento.');
    }
});

// Rota para atualizar um agendamento
app.put('/api/appointments/:id', protect, adminOnly(['root', 'admin', 'vendedor']), async (req, res) => {
    const { id } = req.params;
    const { serviceId, userId, scheduledFor, status, notes } = req.body;

    try {
        const { rows: existingAppointment } = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (existingAppointment.length === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        const updateFields = [];
        const values = [];
        let valueCount = 1;

        if (serviceId !== undefined) { updateFields.push(`service_id = $${valueCount++}`); values.push(serviceId); }
        if (userId !== undefined) { updateFields.push(`user_id = $${valueCount++}`); values.push(userId); }
        if (scheduledFor !== undefined) { updateFields.push(`scheduled_for = $${valueCount++}`); values.push(scheduledFor); }
        if (status !== undefined) { updateFields.push(`status = $${valueCount++}`); values.push(status); }
        if (notes !== undefined) { updateFields.push(`notes = $${valueCount++}`); values.push(notes); }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Nenhum dado para atualizar foi fornecido.' });
        }

        values.push(id);
        const queryText = `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = $${valueCount} RETURNING id`;
        
        await db.query(queryText, values);

        const resultQuery = `
            SELECT a.id, a.scheduled_for AS "scheduledFor", a.status, a.notes, a.created_at AS "createdAt", a.updated_at AS "updatedAt", c.id AS "clientId", c.name AS "clientName", c.phone AS "clientPhone", s.id AS "serviceId", s.servico AS "serviceName", u.id AS "userId", u.name AS "userName"
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN services s ON a.service_id = s.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = $1;
        `;
        const { rows: resultRows } = await db.query(resultQuery, [id]);

        res.json(resultRows[0]);
    } catch (err) {
        console.error('Update appointment error:', err);
        if (err.code === '23503') { // Foreign key violation
             return res.status(404).json({ message: 'Serviço ou técnico não encontrado.' });
        }
        res.status(500).send('Erro no servidor ao atualizar agendamento.');
    }
});

// Rota para excluir (cancelar) um agendamento
app.delete('/api/appointments/:id', protect, adminOnly(['root', 'admin', 'vendedor']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM appointments WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        res.status(200).json({ message: `Agendamento ID ${id} excluído com sucesso.` });
    } catch (err) {
        console.error('Delete appointment error:', err);
        res.status(500).send('Erro no servidor ao excluir agendamento.');
    }
});

// ==================
// SALES ROUTES
// ==================

// Rota para buscar o histórico de vendas
app.get('/api/sales', protect, async (req, res) => {
    try {
        // Esta query foi otimizada para ser mais performática.
        // 1. Primeiro, agregamos os itens de venda em um JSON por cada ID de venda (usando um CTE).
        // 2. Depois, juntamos a tabela de vendas principal com os itens já agregados.
        // Isso evita que o banco de dados precise processar a agregação JSON em um join gigante, melhorando a velocidade.
        const query = `
            WITH aggregated_items AS (
                SELECT
                    si.sale_id,
                    json_agg(json_build_object(
                        'id', COALESCE(si.product_id, si.service_id),
                        'type', si.item_type,
                        'nome', si.item_name,
                        'servico', si.item_name,
                        'quantity', si.quantity,
                        'precoFinal', si.unit_price,
                        'tempoDeGarantia', COALESCE(p.tempo_de_garantia, sv.tempo_de_garantia, 0)
                    )) AS items
                FROM sale_items si
                LEFT JOIN products p ON si.product_id = p.id AND si.item_type = 'produto'
                LEFT JOIN services sv ON si.service_id = sv.id AND si.item_type = 'servico'
                GROUP BY si.sale_id
            )
            SELECT
                s.id,
                s.receipt_code AS "receiptCode",
                s.client_id AS "clienteId",
                c.name AS "customer",
                c.cpf AS "customerCpf",
                c.phone AS "customerPhone",
                c.email AS "customerEmail",
                s.user_id AS "userId",
                s.vendedor_name AS "vendedor",
                s.subtotal,
                s.discount_percentage AS "discountPercentage",
                s.discount_value AS "discountValue",
                s.total,
                s.payment_method AS "paymentMethod",
                s.sale_date AS "date",
                ai.items
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN clients c ON s.client_id = c.id
            JOIN aggregated_items ai ON s.id = ai.sale_id
            WHERE u.role != 'root'
            ORDER BY s.sale_date DESC;
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        handleRouteError(res, err, 'buscar histórico de vendas');
    }
});

// Rota para criar uma nova venda
app.post('/api/sales', protect, async (req, res) => {
    const {
        items, subtotal, discountPercentage, discountValue, total,
        customer, customerCpf, customerPhone, customerEmail,
        paymentMethod, vendedor
    } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'O carrinho não pode estar vazio.' });
    }

    let client; // Declare outside to be accessible in finally

    try {
        client = await db.connect(); // Connect inside the try block
        await client.query('BEGIN');

        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const randomPart = nanoid(6).toUpperCase();
        const receiptCode = `BC-${datePart}-${randomPart}`;
        const saleQuery = `
            INSERT INTO sales (receipt_code, client_id, user_id, vendedor_name, subtotal, discount_percentage, discount_value, total, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, sale_date;
        `;
        // Insere a venda inicialmente sem client_id, que será atualizado depois.
        const saleValues = [receiptCode, null, userId, vendedor, subtotal, discountPercentage, discountValue, total, paymentMethod];
        const { rows: newSale } = await client.query(saleQuery, saleValues);
        const saleId = newSale[0].id;
        const saleDate = newSale[0].sale_date;

        let clientId;
        
        // Lógica de criar/encontrar cliente para a venda.
        const finalCustomerName = (customer && customer.trim()) ? customer.trim() : 'Consumidor Final';
        const sanitizedCpf = (customerCpf && customerCpf.trim()) ? customerCpf.trim() : null;
        if (sanitizedCpf) {
            const { rows: existingClients } = await client.query('SELECT id FROM clients WHERE cpf = $1', [sanitizedCpf]);
            if (existingClients.length > 0) {
                clientId = existingClients[0].id;
            }
        }
        if (!clientId) {
            const { rows: newClient } = await client.query('INSERT INTO clients (name, cpf, phone, email, last_purchase) VALUES ($1, $2, $3, $4, NOW()) RETURNING id', [finalCustomerName, sanitizedCpf, customerPhone, customerEmail]);
            clientId = newClient[0].id;
        }

        // Se um cliente foi identificado ou criado, atualiza o registro da venda.
        if (clientId) {
            await client.query('UPDATE sales SET client_id = $1 WHERE id = $2', [clientId, saleId]);
        }

        // Ordena os itens pelo ID para garantir uma ordem de bloqueio consistente no banco de dados.
        // Isso previne deadlocks quando múltiplas vendas com os mesmos produtos são processadas simultaneamente.
        const sortedItems = [...items].sort((a, b) => {
            // Garante que a ordenação funcione para IDs numéricos e strings (offline_...)
            const idA = String(a.id);
            const idB = String(b.id);
            return idA.localeCompare(idB);
        });

        for (const item of sortedItems) {
            const saleItemQuery = `
                INSERT INTO sale_items (sale_id, product_id, service_id, item_type, quantity, item_name, unit_price)
                VALUES ($1, $2, $3, $4, $5, $6, $7);
            `;
            const saleItemValues = [
                saleId,
                item.type === 'produto' ? item.id : null,
                item.type === 'servico' ? item.id : null,
                item.type,
                item.quantity,
                item.nome || item.servico,
                item.precoFinal
            ];
            await client.query(saleItemQuery, saleItemValues);

            if (item.type === 'produto') {
                const productInDb = await client.query('SELECT em_estoque FROM products WHERE id = $1 FOR UPDATE', [item.id]);
                if (productInDb.rows[0].em_estoque < item.quantity) {
                    throw new Error(`Estoque insuficiente para o produto "${item.nome || item.servico}".`);
                }
                const updateStockQuery = `
                    UPDATE products SET em_estoque = em_estoque - $1, historico = historico || $2::jsonb WHERE id = $3;
                `;
                const historyEntry = {
                    data: new Date(),
                    acao: 'Venda Realizada',
                    detalhes: `Venda de ${item.quantity} unidade(s). Venda Cód: ${receiptCode}.`
                };
                await client.query(updateStockQuery, [item.quantity, JSON.stringify(historyEntry), item.id]);
            }
        }

        await client.query('COMMIT');

        // Otimização: Cria uma versão "enxuta" dos itens para a resposta da API.
        // Remove campos grandes e desnecessários para o recibo (como imagem e histórico),
        // o que torna a resposta muito mais rápida e leve.
        const leanItems = items.map(({ imagem, historico, ...item }) => item);

        res.status(201).json({
            id: saleId,
            receiptCode,
            clienteId: clientId,
            date: saleDate,
            // Re-constrói o corpo da resposta com os dados essenciais
            items: leanItems, // Usa a versão enxuta dos itens
            subtotal,
            discountPercentage,
            discountValue,
            total,
            customer,
            customerCpf,
            customerPhone,
            customerEmail,
            paymentMethod,
            vendedor
        });

    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rbErr) {
                console.error('Error during transaction rollback on sale creation:', rbErr);
            }
        }
        console.error('Sale creation error:', err);
        // Use o manipulador de erros centralizado para consistência
        handleRouteError(res, err, 'finalizar a venda');
    } finally {
        if (client) {
            try { client.release(); } catch (relErr) { console.error('Error releasing client on sale creation:', relErr); }
        }
    }
});

app.get('/api/reports/sales-by-user', protect, hasPermission('viewUserSalesReport'), async (req, res) => {
    const { userId, startDate, endDate } = req.query;

    if (!userId || !startDate || !endDate) {
        return res.status(400).json({ message: 'ID do usuário, data de início e fim são obrigatórios.' });
    }

    try {
        const salesResult = await db.query(`
            SELECT
                s.id,
                s.receipt_code AS "receiptCode",
                s.client_id AS "clienteId",
                c.name AS "customer",
                s.total,
                s.payment_method AS "paymentMethod",
                s.sale_date AS "date",
                json_agg(json_build_object(
                    'id', COALESCE(si.product_id, si.service_id),
                    'type', si.item_type,
                    'nome', si.item_name,
                    'servico', si.item_name,
                    'quantity', si.quantity,
                    'precoFinal', si.unit_price
                )) AS items
            FROM sales s
            JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN clients c ON s.client_id = c.id
            WHERE s.user_id = $1 AND s.sale_date >= $2 AND s.sale_date <= $3
            GROUP BY s.id, c.id
            ORDER BY s.sale_date ASC;
        `, [userId, startDate, endDate]);

        const sales = salesResult.rows.map(sale => ({
            ...sale,
            total: parseFloat(sale.total)
        }));

        if (sales.length === 0) {
            return res.json({ sales: [], totalVendido: 0, totalVendas: 0, totalsByPaymentMethod: {} });
        }

        const totalVendido = sales.reduce((acc, sale) => acc + sale.total, 0);
        const totalVendas = sales.length;

        res.json({
            sales,
            totalVendido,
            totalVendas,
        });

    } catch (err) {
        handleRouteError(res, err, 'gerar o relatório de vendas por vendedor');
    }
});

// ==================
// REPORTS ROUTES
// ==================

app.get('/api/reports/dre', protect, hasPermission('viewDreReport'), async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'As datas de início e fim são obrigatórias.' });
    }

    try {
        // 1. Calcular Receita Bruta de Vendas (total vendido + descontos)
        const salesResult = await db.query(
            'SELECT SUM(total) as total_revenue, SUM(discount_value) as total_discount FROM sales WHERE sale_date >= $1 AND sale_date <= $2',
            [startDate, endDate]
        );
        const totalRevenue = parseFloat(salesResult.rows[0].total_revenue) || 0;
        const totalDiscount = parseFloat(salesResult.rows[0].total_discount) || 0;

        // 2. Calcular Custo dos Produtos Vendidos (CMV) e Serviços Prestados
        const costsResult = await db.query(`
            SELECT 
                SUM(
                    CASE 
                        WHEN si.item_type = 'produto' THEN si.quantity * p.preco
                        WHEN si.item_type = 'servico' THEN si.quantity * s.preco
                        ELSE 0 
                    END
                ) as total_cost
            FROM sale_items si
            JOIN sales ON si.sale_id = sales.id
            LEFT JOIN products p ON si.product_id = p.id AND si.item_type = 'produto'
            LEFT JOIN services s ON si.service_id = s.id AND si.item_type = 'servico'
            WHERE sales.sale_date >= $1 AND sales.sale_date <= $2;
        `, [startDate, endDate]);
        const totalCost = parseFloat(costsResult.rows[0].total_cost) || 0;

        res.json({
            period: { start: startDate, end: endDate },
            receitaBruta: totalRevenue + totalDiscount,
            deducoes: totalDiscount,
            receitaLiquida: totalRevenue,
            custoVendas: totalCost,
            lucroBruto: totalRevenue - totalCost,
        });

    } catch (err) {
        handleRouteError(res, err, 'gerar o DRE');
    }
});

// Exporta o app para ser usado pela Vercel como uma Serverless Function
module.exports = app;
