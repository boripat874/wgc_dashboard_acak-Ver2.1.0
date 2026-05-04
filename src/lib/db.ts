import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  options: { trustServerCertificate: true } // Crucial for self-signed certs or development
};

let poolPromise: Promise<sql.ConnectionPool>;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    // Only create a new pool if one doesn't exist
    console.log('Creating new SQL Server connection pool...');
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('SQL Server connected');
        return pool;
      })
      .catch(err => {
        console.error('Database Connection Failed! 😢', err);
        // Important: Reset poolPromise to allow retrying connection on next call
        poolPromise = undefined as any; // Cast to any to allow undefined assignment
        throw err;
      });
  }
  return poolPromise;
}

// Optional: Graceful shutdown for the pool
process.on('SIGTERM', async () => {
    if (poolPromise) {
        const pool = await poolPromise;
        if (pool.connected) {
            console.log('Closing SQL Server connection pool...');
            await pool.close();
            console.log('SQL Server connection pool closed.');
        }
    }
});