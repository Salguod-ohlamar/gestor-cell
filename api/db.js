import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Conectado ao banco de dados com sucesso!');
  release();
});

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
