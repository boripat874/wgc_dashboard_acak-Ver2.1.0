module.exports = {
  development: {
    client: 'mssql',
    connection: {
      server: process.env.DB_HOST!,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      // server: "localhost",
      // user: Number(process.env.DB_PORT),
      // password: process.env.DB_PASS,
      // database: process.env.DB_NAME,
      options: {
        trustServerCertificate: true,
        port: Number(process.env.DB_PORT), // Default SQL Server port
      },
    },
    // Other configurations like migrations and seeds
    migrations: {
      directory: './db/migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
  },
  // Add other environments here (staging, production)
};