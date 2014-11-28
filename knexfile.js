// Update with your config settings.

var connection = {
  host: process.env.APP_DB_HOST || '127.0.0.1',
  user: process.env.APP_DB_USER || '',
  password: process.env.APP_DB_PASSWORD || '',
  database: process.env.APP_DB_NAME || 'portfolio'
};

module.exports = {

  development: {
    client: 'postgres',
    connection: connection
  },

  test: {
    client: 'postgres',
    connection: {
      database: 'portfolio_test'
    }
  },

  staging: {
    client: 'postgres',
    connection: process.env.DATABASE_URL
  },

  production: {
    client: 'postgres',
    connection: process.env.DATABASE_URL
  }
};
