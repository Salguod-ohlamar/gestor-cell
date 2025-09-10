// api/hash_generator.js
const bcrypt = require('bcryptjs');
const password = 'root'; // Coloque a senha que deseja hashear aqui
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(`Senha: ${password}`);
console.log(`Hash: ${hash}`);
