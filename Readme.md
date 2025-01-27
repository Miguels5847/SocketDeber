# **Práctica: Extensión de un Chat en Tiempo Real con Socket.IO, Node.js y Persistencia Relacional**

## **Descripción**

En esta práctica, trabajarás con un chat en tiempo real ya implementado usando Socket.IO y Node.js. Extenderás su funcionalidad agregando características avanzadas para mejorar la experiencia del usuario y agregarás persistencia de datos con una base de datos relacional.

Repositorio base: [https://github.com/yanditv/socket.git](https://github.com/yanditv/socket.git)

---

## **Objetivos**

1. Comprender cómo funciona la comunicación en tiempo real con Socket.IO.
2. Ampliar funcionalidades existentes en una aplicación de chat.
3. Manejar eventos personalizados de Socket.IO.
4. Persistir datos en una base de datos relacional para consultas posteriores.

---

## **Tareas de la Práctica**

### **1. Agregar Mensajes Privados**

- Permite que los usuarios se envíen mensajes privados.
- Identifica a los usuarios por sus `socket.id` o utiliza un sistema de autenticación con un identificador único.
- Implementa un evento `private_message` que acepte un `receiverId`, un `senderId` y el mensaje.
- Persiste los mensajes privados en la base de datos.

**Esquema de la tabla `private_messages`:**

```sql
CREATE TABLE private_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

---

### **2. Indicador de Escribiendo**

- Implementa un evento `typing` que notifique a los usuarios de una sala cuando alguien está escribiendo.
- Muestra un mensaje como "Usuario X está escribiendo..." para todos los usuarios en la misma sala.

---

### **3. Emojis en el Chat**

- Convierte atajos de texto como `:)` en emojis visuales.
- Usa la librería `node-emoji` para transformar los atajos en emojis antes de enviarlos a los usuarios.

**Instalación de `node-emoji`:**

```bash
npm install node-emoji
```

**Ejemplo de uso:**

```js
const emoji = require("node-emoji");
const messageWithEmojis = emoji.emojify("Hola :smile:");
console.log(messageWithEmojis); // Hola 😄
```

---

### **4. Indicador de Estado (En línea o Última Conexión)**

- Agrega un indicador para mostrar si un usuario está en línea o cuándo fue la última vez que estuvo conectado.
- Al conectarse, actualiza el estado del usuario a `online`.
- Al desconectarse, registra el tiempo en el campo `last_seen`.

**Esquema de la tabla `users`:**

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('online', 'offline') DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### **Persistencia de Datos**

#### **Base de Datos Relacional**

- **Tablas Principales:**
  - `users`: Almacena los datos de los usuarios.
  - `rooms`: Almacena las salas disponibles en el chat.
  - `messages`: Almacena los mensajes de chat público.
  - `private_messages`: Almacena los mensajes privados.

#### **Configuración de Node.js con la Base de Datos**

1. Instala un ORM como Sequelize:

   ```bash
   npm install sequelize mysql2
   ```

2. Configura la conexión a la base de datos:

   ```js
   const { Sequelize } = require("sequelize");

   const sequelize = new Sequelize("chat_db", "root", "password", {
     host: "localhost",
     dialect: "mysql",
   });

   sequelize
     .authenticate()
     .then(() => console.log("Conexión exitosa a la base de datos."))
     .catch((err) =>
       console.error("Error conectando a la base de datos:", err)
     );
   ```

3. Persiste los mensajes y usuarios en las tablas correspondientes durante los eventos de Socket.IO.

---

### **Extras Opcionales**

- **Historial de Mensajes:**

  - Carga y muestra los últimos 20 mensajes desde la tabla `messages` al unirse a una sala.

- **Notificaciones Push:**
  - Usa una librería como `web-push` para enviar notificaciones en tiempo real cuando lleguen nuevos mensajes privados.

---

## **Evaluación**

1. Los mensajes (públicos y privados) se guardan correctamente en la base de datos.
2. El indicador de estado (`en línea` o `última conexión`) se actualiza adecuadamente.
3. Los emojis se procesan correctamente en los mensajes.
4. El indicador de "escribiendo" funciona en tiempo real.

---

¡Buena suerte con la práctica! Si tienes dudas, revisa la documentación de [Socket.IO](https://socket.io/) y el [repositorio base](https://github.com/yanditv/socket.git).
