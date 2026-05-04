import knex from 'knex'; // Add this line
import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'mssql',
  connection: {
    server: process.env.DB_HOST as string,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    options: {
      trustServerCertificate: true,
      port: Number(process.env.DB_PORT) || 1433,
    } as any, 
  },
  migrations: {
    directory: './db/migrations',
  },
  seeds: {
    directory: './db/seeds',
  },
};

// Now 'knex' will be recognized
const db = knex(config); 
export default db;