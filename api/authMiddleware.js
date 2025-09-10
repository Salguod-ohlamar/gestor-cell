const jwt = require('jsonwebtoken');
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

module.exports = { protect, adminOnly };
