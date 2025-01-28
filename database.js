require('dotenv').config();
const { Pool } = require('pg');

// Verificar que la variable de entorno existe
if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL no está definida en las variables de entorno');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Prueba de conexión inicial
pool.connect()
    .then(client => {
        console.log('Conexión exitosa a PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('Error al conectar con PostgreSQL:', err);
    });

// Probar la conexión
pool.connect()
    .then(() => console.log('Conectado exitosamente a PostgreSQL'))
    .catch(err => console.error('Error conectando a PostgreSQL:', err));
// Función para inicializar las tablas
const initDatabase = async () => {
    const client = await pool.connect();
    try {
        // Crear tabla de usuarios
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                socket_id VARCHAR(100),
                status VARCHAR(20) DEFAULT 'offline',
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla de mensajes públicos
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla de mensajes privados
        await client.query(`
            CREATE TABLE IF NOT EXISTS private_messages (
                id SERIAL PRIMARY KEY,
                sender_username VARCHAR(50) NOT NULL,
                receiver_username VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Tablas creadas/verificadas correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Inicializar la base de datos al arrancar
initDatabase().catch(console.error);

// El resto de tus funciones...
const saveUser = async (username, socket_id) => {
    const query = `
        INSERT INTO users (username, socket_id, status)
        VALUES ($1, $2, 'online')
        ON CONFLICT (username)
        DO UPDATE SET socket_id = $2, status = 'online'
        RETURNING *
    `;
    const result = await pool.query(query, [username, socket_id]);
    return result.rows[0];
};

const updateUserStatus = async (socket_id, status) => {
    const timestamp = status === 'offline' ? 'CURRENT_TIMESTAMP' : null;
    const query = `
        UPDATE users
        SET status = $1, last_seen = ${timestamp}
        WHERE socket_id = $2
    `;
    return await pool.query(query, [status, socket_id]);
};

const getMessages = async () => {
    const query = 'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50';
    const result = await pool.query(query);
    return result.rows;
};

const saveMessage = async (username, message) => {
    const query = `
        INSERT INTO messages (username, message)
        VALUES ($1, $2)
        RETURNING *
    `;
    const result = await pool.query(query, [username, message]);
    return result.rows[0];
};

const savePrivateMessage = async (sender_username, receiver_username, message) => {
    const query = `
        INSERT INTO private_messages (sender_username, receiver_username, message)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const result = await pool.query(query, [sender_username, receiver_username, message]);
    return result.rows[0];
};

const getPrivateMessages = async (username1, username2) => {
    const query = `
        SELECT * FROM private_messages
        WHERE (sender_username = $1 AND receiver_username = $2)
        OR (sender_username = $2 AND receiver_username = $1)
        ORDER BY timestamp DESC LIMIT 50
    `;
    const result = await pool.query(query, [username1, username2]);
    return result.rows;
};

const getOnlineUsers = async () => {
    const query = `
        SELECT username, status, last_seen
        FROM users
        WHERE status = 'online'
    `;
    const result = await pool.query(query);
    return result.rows;
};

module.exports = {
    initDatabase,
    getMessages,
    saveMessage,
    saveUser,
    updateUserStatus,
    savePrivateMessage,
    getPrivateMessages,
    getOnlineUsers
};