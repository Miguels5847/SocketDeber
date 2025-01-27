const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const emoji = require('node-emoji');
const {
    getMessages,
    saveMessage,
    saveUser,
    updateUserStatus,
    savePrivateMessage,
    getPrivateMessages
} = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Almacenar usuarios escribiendo
const typingUsers = new Map();

io.on('connection', (socket) => {
    console.log('Un usuario se conectó');

    // Manejar registro de usuario
    socket.on('register user', async (username) => {
        try {
            await saveUser(username, socket.id);
            socket.username = username;
            
            // Enviar historial de mensajes
            const messages = await getMessages();
            socket.emit('chat history', messages);
            
            // Notificar a todos que un nuevo usuario está en línea
            io.emit('user status', { username, status: 'online' });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
        }
    });

    // Mensajes públicos
    socket.on('chat message', async (data) => {
        const { message } = data;
        if (socket.username && message) {
            try {
                // Convertir emojis
                const messageWithEmojis = emoji.emojify(message);
                const savedMessage = await saveMessage(socket.username, messageWithEmojis);
                io.emit('chat message', savedMessage);
            } catch (error) {
                console.error('Error al guardar mensaje:', error);
            }
        }
    });

    // Mensajes privados
    socket.on('private message', async (data) => {
        const { to, message } = data;
        if (socket.username && to && message) {
            try {
                const messageWithEmojis = emoji.emojify(message);
                const savedMessage = await savePrivateMessage(socket.username, to, messageWithEmojis);
                
                // Encontrar el socket.id del destinatario
                const recipientSocket = Array.from(io.sockets.sockets.values())
                    .find(s => s.username === to);

                if (recipientSocket) {
                    // Enviar al destinatario y al remitente
                    recipientSocket.emit('private message', savedMessage);
                    socket.emit('private message', savedMessage);
                }
            } catch (error) {
                console.error('Error al enviar mensaje privado:', error);
            }
        }
    });

    // Indicador de escritura
    socket.on('typing', (isTyping) => {
        if (socket.username) {
            if (isTyping) {
                typingUsers.set(socket.username, true);
            } else {
                typingUsers.delete(socket.username);
            }
            
            // Notificar a todos los usuarios quién está escribiendo
            io.emit('typing users', Array.from(typingUsers.keys()));
        }
    });

    // Manejar desconexión
    socket.on('disconnect', async () => {
        if (socket.username) {
            try {
                await updateUserStatus(socket.id, 'offline');
                typingUsers.delete(socket.username);
                io.emit('user status', {
                    username: socket.username,
                    status: 'offline',
                    lastSeen: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error al actualizar estado del usuario:', error);
            }
        }
    });
});

// Usar el puerto proporcionado por Render o 3000 como fallback
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});