const socket = new WebSocket("ws://localhost:3000");
let username = "";

// Save username
document.getElementById("username-button").addEventListener("click", function () {
  const usernameInput = document.getElementById("username-input");
  username = usernameInput.value.trim();
  if (username) {
    usernameInput.disabled = true;
    document.getElementById("username-button").disabled = true;
  }
});

// Send message
const sendMessage = () => {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (message) {
    socket.send(message);
    appendMessage("You", message); // Display your own message
    messageInput.value = "";
  }
};

document.getElementById("send-button").addEventListener("click", sendMessage);

document.getElementById("message-input").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Display received message
socket.onmessage = function (event) {
  const message = event.data;
  appendMessage("Other User", message); // Display messages from other users
};

// Update active users list
socket.addEventListener("open", function () {
  setInterval(function () {
    socket.send("getActiveUsers");
  }, 5000);
});

socket.addEventListener("message", function (event) {
  const message = event.data;
  if (message.startsWith("activeUsers:")) {
    const activeUsers = message.slice(12).split(",");
    const activeUsersList = document.getElementById("active-users-list");
    activeUsersList.innerHTML = "";
    activeUsers.forEach(function (user) {
      const userElement = document.createElement("li");
      userElement.textContent = user;
      activeUsersList.appendChild(userElement);
    });
  }
});

// Helper function to append a message to the message container
const appendMessage = (sender, message) => {
  const messageContainer = document.getElementById("message-container");
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
};