const jwt = require('jsonwebtoken');
const db = require('./db.js');
require('dotenv').config();

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Pega o token do cabeçalho (formato: "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];

      // Verifica e decodifica o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Anexa os dados do usuário (do token) à requisição para uso posterior
      req.user = decoded;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Não autorizado, sem token.' });
  }
};

const adminOnly = (roles) => (req, res, next) => {
    // O usuário 'root' tem acesso a tudo. Para outros, verifica se a role está na lista.
    if (req.user.role !== 'root' && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
};

const hasPermission = (permission) => async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }

    // O usuário root tem acesso a tudo
    if (req.user.role === 'root') {
        return next();
    }

    try {
        const { rows } = await db.query('SELECT permissions FROM users WHERE id = $1', [req.user.id]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        const userPermissions = rows[0].permissions;
        if (userPermissions && userPermissions[permission]) {
            next();
        } else {
            res.status(403).json({ message: 'Acesso negado. Permissão específica insuficiente.' });
        }
    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        res.status(500).send('Erro no servidor ao verificar permissão.');
    }
};

module.exports = { protect, adminOnly, hasPermission };
