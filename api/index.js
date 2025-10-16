
//server.js
const express = require('express');
const cors = require('cors');
const db = require('./db.js');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { protect, hasPermission } = require('./authMiddleware.js');
const { getDefaultPermissions, PERMISSION_GROUPS } = require('./permissions.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Permite requisições do nosso frontend React
app.use(express.json()); // Permite que o Express entenda JSON

// Rota de teste
app.get('/', (req, res) => {
  res.send('API Boycell está no ar!');
});

// Rota para buscar todos os produtos
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products ORDER BY nome ASC');
    // Converte o padrão snake_case do DB para camelCase do JS
    const products = rows.map(p => ({
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
    }));
    res.json(products);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).send('Erro no servidor ao buscar produtos.');
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
            AND em_estoque > 0 
            ORDER BY nome ASC 
            LIMIT 20;
        `;
        const { rows } = await db.query(queryText, [`%${q}%`]);
        
        const products = rows.map(p => ({
            id: p.id, nome: p.nome, categoria: p.categoria, marca: p.marca,
            fornecedor: p.fornecedor, emEstoque: p.em_estoque, qtdaMinima: p.qtda_minima,
            preco: parseFloat(p.preco), precoFinal: parseFloat(p.preco_final),
            markup: p.markup, imagem: p.imagem, destaque: !!p.destaque,
            tempoDeGarantia: p.tempo_de_garantia, historico: p.historico,
        }));
        res.json(products);
    } catch (err) {
        console.error('Product search error:', err);
        res.status(500).send('Erro no servidor ao buscar produtos.');
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
        
        // Converte de volta para camelCase para a resposta
        res.status(201).json({
            id: newService.id,
            servico: newService.servico,
            fornecedor: newService.fornecedor,
            marca: newService.marca,
            tipoReparo: newService.tipo_reparo,
            tecnico: newService.tecnico,
            preco: parseFloat(newService.preco),
            precoFinal: parseFloat(newService.preco_final),
            markup: newService.markup,
            imagem: newService.imagem,
            destaque: !!newService.destaque,
            tempoDeGarantia: newService.tempo_de_garantia,
            historico: newService.historico,
        });

    } catch (err) {
        console.error('Create service error:', err);
        res.status(500).send('Erro no servidor ao criar serviço.');
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
        res.json({
            id: updatedService.id, servico: updatedService.servico, fornecedor: updatedService.fornecedor,
            marca: updatedService.marca, tipoReparo: updatedService.tipo_reparo, tecnico: updatedService.tecnico,
            preco: parseFloat(updatedService.preco), precoFinal: parseFloat(updatedService.preco_final),
            markup: updatedService.markup, imagem: updatedService.imagem, destaque: !!updatedService.destaque,
            tempoDeGarantia: updatedService.tempo_de_garantia, historico: updatedService.historico,
        });

    } catch (err) {
        console.error('Update service error:', err);
        res.status(500).send('Erro no servidor ao atualizar serviço.');
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
        console.error('Delete service error:', err);
        res.status(500).send('Erro no servidor ao excluir serviço.');
    }
});

// Rota para buscar todos os serviços (mantida, mas agora com o bloco de rotas de gerenciamento)
app.get('/api/services', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM services ORDER BY servico ASC');
    const services = rows.map(s => ({
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
        destaque: s.destaque,
        tempoDeGarantia: s.tempo_de_garantia,
        historico: s.historico,
    }));
    res.json(services);
  } catch (err) {
    console.error('Erro ao buscar serviços:', err);
    res.status(500).send('Erro no servidor ao buscar serviços.');
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
        const services = rows.map(s => ({
            id: s.id, servico: s.servico, fornecedor: s.fornecedor, marca: s.marca,
            tipoReparo: s.tipo_reparo, tecnico: s.tecnico, preco: parseFloat(s.preco),
            precoFinal: parseFloat(s.preco_final), markup: s.markup, imagem: s.imagem,
            destaque: !!s.destaque, tempoDeGarantia: s.tempo_de_garantia, historico: s.historico,
        }));
        res.json(services);
    } catch (err) {
        console.error('Service search error:', err);
        res.status(500).send('Erro no servidor ao buscar serviços.');
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
    console.error('Erro ao buscar banners:', err);
    res.status(500).send('Erro no servidor ao buscar banners.');
  }
});

// Rota para buscar TODOS os banners (admin)
app.get('/api/banners/all', protect, hasPermission('manageBanners'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar todos os banners:', err);
    res.status(500).send('Erro no servidor ao buscar banners.');
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
        console.error('Create banner error:', err);
        res.status(500).send('Erro no servidor ao criar banner.');
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
        console.error('Update banner error:', err);
        res.status(500).send('Erro no servidor ao atualizar banner.');
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
        console.error('Delete banner error:', err);
        res.status(500).send('Erro no servidor ao excluir banner.');
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
        
        // Converte de volta para camelCase para a resposta
        res.status(201).json({
            id: newProduct.id,
            nome: newProduct.nome,
            categoria: newProduct.categoria,
            marca: newProduct.marca,
            fornecedor: newProduct.fornecedor,
            emEstoque: newProduct.em_estoque,
            qtdaMinima: newProduct.qtda_minima,
            preco: parseFloat(newProduct.preco),
            precoFinal: parseFloat(newProduct.preco_final),
            markup: newProduct.markup,
            imagem: newProduct.imagem,
            destaque: newProduct.destaque,
            tempoDeGarantia: newProduct.tempo_de_garantia,
            historico: newProduct.historico,
        });

    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).send('Erro no servidor ao criar produto.');
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
        res.json({
            id: updatedProduct.id,
            nome: updatedProduct.nome,
            categoria: updatedProduct.categoria,
            marca: updatedProduct.marca,
            fornecedor: updatedProduct.fornecedor,
            emEstoque: updatedProduct.em_estoque,
            qtdaMinima: updatedProduct.qtda_minima,
            preco: parseFloat(updatedProduct.preco),
            precoFinal: parseFloat(updatedProduct.preco_final),
            markup: updatedProduct.markup,
            imagem: updatedProduct.imagem,
            destaque: !!updatedProduct.destaque,
            tempoDeGarantia: updatedProduct.tempo_de_garantia,
            historico: updatedProduct.historico,
        });

    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).send('Erro no servidor ao atualizar produto.');
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
        console.error('Delete product error:', err);
        res.status(500).send('Erro no servidor ao excluir produto.');
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
        for (const group in PERMISSION_GROUPS) {
            for (const perm in PERMISSION_GROUPS[group].permissions) {
                finalPermissions[perm] = true;
            }
        }
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, permissions: finalPermissions },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expires in 8 hours
    );

    const { password_hash, ...userWithoutPassword } = user;
    // Retorna o token e as informações do usuário com as permissões atualizadas
    res.json({ token, user: { ...userWithoutPassword, permissions: finalPermissions } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Erro no servidor durante o login.');
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
        console.error('Password recovery error:', err);
        res.status(500).send('Erro no servidor durante a recuperação de senha.');
    }
});

// ==================
// USER MANAGEMENT ROUTES
// ==================

// Rota para criar um novo usuário (somente admin/root)
app.post('/api/users/register', protect, hasPermission('manageUsers'), async (req, res) => {
  const { name, email, password, role } = req.body;
  const requestingUser = req.user;
  const finalRole = 'admin'; // Novos usuários são sempre 'admin'

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
    console.error('Registration error:', err);
    res.status(500).send('Erro no servidor ao registrar usuário.');
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
        const newPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);

        // Retorna a nova senha em texto plano para o admin
        res.json({ message: `Senha de ${targetUser.name} resetada com sucesso.`, newPassword: newPassword });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).send('Erro no servidor ao resetar a senha.');
    }
});

// Rota para buscar todos os usuários (protegida)
app.get('/api/users', protect, hasPermission('manageUsers'), async (req, res) => {
  const requestingUser = req.user;
  let queryText;
  const queryParams = [];

  if (requestingUser.role === 'root') {
    queryText = 'SELECT id, name, email, role, permissions FROM users ORDER BY name ASC';
  } else {
    queryText = 'SELECT id, name, email, role, permissions FROM users WHERE role != $1 ORDER BY name ASC';
    queryParams.push('root');
  }

  try {
    const { rows } = await db.query(queryText, queryParams);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Erro no servidor ao buscar usuários.');
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
        // Apenas o root pode editar outros administradores.
        if (targetUser.role === 'admin' && requestingUser.role !== 'root') {
            return res.status(403).json({ message: 'Apenas o usuário root pode editar outros usuários.' });
        }

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
        if (role && role === 'admin' && requestingUser.role === 'root') {
            updateFields.push(`role = $${valueCount++}`);
            values.push(role);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            updateFields.push(`password_hash = $${valueCount++}`);
            values.push(password_hash);
        }
        // Apenas o root pode editar permissões.
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
        console.error('Update user error:', err);
        res.status(500).send('Erro no servidor ao atualizar o usuário.');
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
        console.error('Delete user error:', err);
        res.status(500).send('Erro no servidor ao excluir o usuário.');
    }
});

// ==================
// CLIENT MANAGEMENT ROUTES
// ==================

// Rota para buscar todos os clientes
app.get('/api/clients', protect, async (req, res) => {
    const { includeInactive = 'false' } = req.query;
    // A coluna `is_active` não existe na tabela `clients`, causando o erro 500.
    // A query foi simplificada para buscar todos os clientes, ignorando o filtro.
    try {
        const query = 'SELECT * FROM clients ORDER BY name ASC';
        const { rows } = await db.query(query);
        // Converte o padrão snake_case do DB para camelCase do JS para consistência
        const clients = rows.map(c => ({
            id: c.id,
            name: c.name,
            cpf: c.cpf,
            phone: c.phone,
            email: c.email,
            lastPurchase: c.last_purchase || null,
        }));
        res.json(clients);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).send('Erro no servidor ao buscar clientes.');
    }
});

// Rota para criar um novo cliente (pela tela de gerenciamento)
app.post('/api/clients', protect, hasPermission('manageClients'), async (req, res) => {
    const { name, cpf, phone, email } = req.body;

    if (!name || !cpf || !phone) {
        return res.status(400).json({ message: 'Nome, CPF/CNPJ e Telefone são obrigatórios.' });
    }

    try {
        const { rows: existingClient } = await db.query('SELECT id FROM clients WHERE cpf = $1', [cpf]);
        if (existingClient.length > 0) {
            return res.status(409).json({ message: 'Este CPF/CNPJ já está cadastrado.' });
        }

        const { rows } = await db.query(
            'INSERT INTO clients (name, cpf, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, cpf, phone, email]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Create client error:', err);
        res.status(500).send('Erro no servidor ao criar cliente.');
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
        res.json({
            id: updatedClient.id,
            name: updatedClient.name,
            cpf: updatedClient.cpf,
            phone: updatedClient.phone,
            email: updatedClient.email,
            lastPurchase: updatedClient.last_purchase,
            // Não precisamos enviar created_at ou updated_at para a interface
        });
    } catch (err) {
        console.error('Update client error:', err);
        res.status(500).send('Erro no servidor ao atualizar o cliente.');
    }
});

// Rota para excluir um cliente
app.delete('/api/clients/:id', protect, hasPermission('manageClients'), async (req, res) => {
    const { id } = req.params;
    const dbClient = await db.getClient();

    try {
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
        await dbClient.query('ROLLBACK');
        console.error('Hard delete client error:', err);
        res.status(500).send('Erro no servidor ao excluir o cliente e seu histórico.');
    } finally {
        dbClient.release();
    }
});

// Rota para buscar um cliente pelo CPF/CNPJ
app.get('/api/clients/search', protect, async (req, res) => {
    const { cpf } = req.query;
    if (!cpf) {
        return res.status(400).json({ message: 'CPF/CNPJ é obrigatório para a busca.' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM clients WHERE cpf = $1', [cpf]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Search client error:', err);
        res.status(500).send('Erro no servidor ao buscar cliente.');
    }
});

// ==================
// SALES ROUTES
// ==================

// Rota para buscar o histórico de vendas
app.get('/api/sales', protect, async (req, res) => {
    try {
        const { role, name } = req.user;
        let query = `
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
                json_agg(json_build_object(
                    'id', COALESCE(si.product_id, si.service_id),
                    'type', si.item_type,
                    'nome', si.item_name,
                    'servico', si.item_name,
                    'quantity', si.quantity,
                    'precoFinal', si.unit_price,
                    'tempoDeGarantia', COALESCE(p.tempo_de_garantia, sv.tempo_de_garantia, 0)
                )) AS items
            FROM sales s
            JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN clients c ON s.client_id = c.id
            LEFT JOIN products p ON si.product_id = p.id
            LEFT JOIN services sv ON si.service_id = sv.id
        `;
        const queryParams = [];

        if (role === 'admin' || role === 'root') {
            // Nenhuma condição extra para admin/root
            // Se for admin, não mostra as vendas do root. Se for root, mostra tudo.
            if (role === 'admin') {
                query += ` WHERE s.vendedor_name NOT IN (SELECT name FROM users WHERE role = 'root')`;
            }
        } else {
            query += ' WHERE s.vendedor_name = $1';
            queryParams.push(name);
        }

        query += ' GROUP BY s.id, c.id ORDER BY s.sale_date DESC;';

        const { rows } = await db.query(query, queryParams);
        // Garante que o total seja um número para evitar problemas de concatenação no frontend
        const salesWithNumericTotal = rows.map(sale => ({
            ...sale,
            total: parseFloat(sale.total)
        }));
        res.json(salesWithNumericTotal);
    } catch (err) {
        console.error('Error fetching sales history:', err);
        res.status(500).send('Erro no servidor ao buscar histórico de vendas.');
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

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        let clientId;
        // Só cria ou atualiza cliente se um CPF for fornecido
        if (customerCpf) {
            const { rows: existingClients } = await client.query('SELECT id FROM clients WHERE cpf = $1', [customerCpf]);
            if (existingClients.length > 0) {
                clientId = existingClients[0].id;
                await client.query('UPDATE clients SET last_purchase = NOW(), phone = $1, email = $2, name = $3 WHERE id = $4', [customerPhone, customerEmail, customer, clientId]);
            } else {
                const { rows: newClient } = await client.query(
                    'INSERT INTO clients (name, cpf, phone, email, last_purchase) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
                    [customer, customerCpf, customerPhone, customerEmail]
                );
                clientId = newClient[0].id;
            }
        } else {
            clientId = null; // Venda sem cliente associado
        }

        const receiptCode = `BC-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const saleQuery = `
            INSERT INTO sales (receipt_code, client_id, user_id, vendedor_name, subtotal, discount_percentage, discount_value, total, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, sale_date;
        `;
        const saleValues = [receiptCode, clientId, userId, vendedor, subtotal, discountPercentage, discountValue, total, paymentMethod];
        const { rows: newSale } = await client.query(saleQuery, saleValues);
        const saleId = newSale[0].id;
        const saleDate = newSale[0].sale_date;

        for (const item of items) {
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

        res.status(201).json({
            id: saleId,
            receiptCode,
            clienteId: clientId,
            date: saleDate,
            ...req.body
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Sale creation error:', err);
        res.status(500).json({ message: err.message || 'Erro no servidor ao finalizar a venda.' });
    } finally {
        client.release();
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
        console.error('Sales by user report error:', err);
        res.status(500).send('Erro no servidor ao gerar o relatório de vendas por vendedor.');
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
        console.error('DRE report error:', err);
        res.status(500).send('Erro no servidor ao gerar o DRE.');
    }
});

// Exporta o app para ser usado pela Vercel como uma Serverless Function
module.exports = app;
