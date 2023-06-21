const WebSocket = require("ws");
const redis = require("redis");

const activeUsers = new Set();

const initializeWebsocketServer = async (server) => {
  const client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    },
  });

  const subscriber = client.duplicate();
  await subscriber.connect();

  const publisher = client.duplicate();
  await publisher.connect();

  const websocketServer = new WebSocket.Server({ server });

  websocketServer.on("connection", (ws) => {
    console.log("New websocket connection");

    let username = null;

    // Send active users list to the client
    sendActiveUsers(ws);

    // Save username
    ws.on("message", (message) => {
      if (message.startsWith("setUsername:")) {
        const newUsername = message.slice(12);
        if (!activeUsers.has(newUsername)) {
          username = newUsername;
          activeUsers.add(username);
          broadcastActiveUsers();
          console.log(`Username set: ${username}`);
        } else {
          ws.send("Username already taken");
        }
      }
    });

    // Send welcome message
    if (username) {
      ws.send(`Welcome, ${username}!`);
    }

    // Broadcast new message to all users
    ws.on("message", (message) => {
      if (username) {
        const broadcastMessage = `${username}:${message}`;
        clients.forEach((client) => {
          if (client.username !== username) {
            client.socket.send(broadcastMessage);
          }
        });
      }
    });

    // Remove user from active users set
    ws.on("close", () => {
      if (username) {
        activeUsers.delete(username);
        broadcastActiveUsers();
        console.log(`User left: ${username}`);
      }
    });
  });

  await subscriber.subscribe("newMessage");
  await publisher.publish("newMessage", "Hello from Redis!");
};

function broadcastActiveUsers() {
  const activeUsersList = Array.from(activeUsers).join(",");
  clients.forEach((client) => {
    client.socket.send(`activeUsers:${activeUsersList}`);
  });
}

function sendActiveUsers(socket) {
  const activeUsersList = Array.from(activeUsers).join(",");
  socket.send(`activeUsers:${activeUsersList}`);
}

module.exports = { initializeWebsocketServer };