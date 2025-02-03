const { Pool } = require('pg');

const pool = new Pool({
    user: 'jorgesarmiento',
    host: 'localhost',
    database: 'licorera_db',
    password: '',
    port: 5432,
});

module.exports = pool;