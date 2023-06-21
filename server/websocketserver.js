const WebSocket = require("ws");
const redis = require("redis");

const clients = [];
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

    ws.on("close", () => onClose(ws));
    ws.on("message", (message) => onClientMessage(ws, message));
    ws.send("Hello Client!");

    const user = getClientUser(ws); // Get the user associated with the WebSocket connection

    clients.push({
      socket: ws,
      user: user,
    });

    // Add user to active users set
    activeUsers.add(user);

    // Broadcast updated active users list
    broadcastActiveUsers();
  });

  await subscriber.subscribe("newMessage", onRedisMessage);
  await publisher.publish("newMessage", "Hello from Redis!");
};

const onClientMessage = (ws, message) => {
  console.log("Message received: " + message);

  if (message.startsWith("getActiveUsers")) {
    // Send active users list to the client
    sendActiveUsers(ws);
  } else {
    // Broadcast message to users in the same chat room
    broadcastMessage(ws, message);
  }
};

const onRedisMessage = (channel, message) => {
  console.log("Message received from Redis: " + message);
  clients.forEach((client) => client.socket.send(message));
};

const onClose = (ws) => {
  console.log("Websocket connection closed");
  const index = clients.findIndex((client) => client.socket === ws);
  if (index !== -1) {
    const user = clients[index].user;
    clients.splice(index, 1);

    // Remove user from active users set
    activeUsers.delete(user);

    // Broadcast updated active users list
    broadcastActiveUsers();
  }
};

function getClientUser(ws) {
  // Replace this logic with your own implementation to determine the user associated with the WebSocket connection
  if (ws === Don) {
    return "Don";
  } else if (ws === Corina) {
    return "Corina";
  } else {
    return "Unknown";
  }
}

function broadcastMessage(sender, message) {
  const senderUser = getClientUser(sender);
  clients.forEach((client) => {
    if (client.user !== senderUser) {
      client.socket.send(`${senderUser}: ${message}`);
    }
  });
}

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