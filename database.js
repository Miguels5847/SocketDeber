const sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('chat.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear la tabla si no existe
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
        if (err) {
            console.error('Error al crear la tabla:', err.message);
        }
    });
 // Tabla de mensajes públicos
 db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    // Tabla de mensajes privados
    db.run(`
    CREATE TABLE IF NOT EXISTS private_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_username TEXT NOT NULL,
        receiver_username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);


});

//funciones para usuarios

const saveUser = (username, socket_id) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT OR REPLACE INTO users (username, socket_id, status) VALUES (?, ?, 'online')`,
            [username, socket_id],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
};

const updateUserStatus = (socket_id, status) => {
    return new Promise((resolve, reject) => {
        const timestamp = status === 'offline' ? new Date().toISOString() : null;
        db.run(
            `UPDATE users SET status = ?, last_seen = ? WHERE socket_id = ?`,
            [status, timestamp, socket_id],
            function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
};

// Exportar funciones para operaciones con la base de datos
const getMessages = (callback) => {
    db.all('SELECT * FROM messages ORDER BY timestamp ASC', [], (err, rows) => {
        if (err) {
            console.error('Error al recuperar mensajes:', err.message);
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
};

const saveMessage = (username, message, callback) => {
    db.run(
        `INSERT INTO messages (username, message) VALUES (?, ?)`,
        [username, message],
        function (err) {
            if (err) {
                console.error('Error al guardar el mensaje:', err.message);
                callback(err);
            } else {
                callback(null, {
                    id: this.lastID,
                    username,
                    message,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    );
};
// Funciones para mensajes privados
const savePrivateMessage = (sender_username, receiver_username, message) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO private_messages (sender_username, receiver_username, message) 
             VALUES (?, ?, ?)`,
            [sender_username, receiver_username, message],
            function(err) {
                if (err) reject(err);
                else resolve({
                    id: this.lastID,
                    sender_username,
                    receiver_username,
                    message,
                    timestamp: new Date().toISOString()
                });
            }
        );
    });
};

const getPrivateMessages = (username1, username2) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM private_messages 
             WHERE (sender_username = ? AND receiver_username = ?) 
             OR (sender_username = ? AND receiver_username = ?)
             ORDER BY timestamp DESC LIMIT 50`,
            [username1, username2, username2, username1],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};
module.exports = { getMessages, saveMessage, savePrivateMessage, getPrivateMessages, saveUser, updateUserStatus };
