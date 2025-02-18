require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// User and Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

const onlineUsers = new Map(); // Store online users

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When user joins chat, store their ID
  socket.on("userJoined", (userName) => {
    onlineUsers.set(userName, socket.id);
    console.log(`${userName} is online`);
    io.emit("userOnline", { userName });
  });

  // Fetch chat history between two users
  socket.on("getChatHistory", async ({ sender, receiver }) => {
    const chatHistory = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ timestamp: 1 });

    socket.emit("loadMessages", chatHistory);
  });

  // Send a message
  socket.on("sendMessage", async ({ sender, receiver, message }) => {
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    // Emit only to the receiver if they are online
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", newMessage);
    }

    // Also send message back to the sender
    socket.emit("receiveMessage", newMessage);
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    let disconnectedUser;
    for (let [user, id] of onlineUsers) {
      if (id === socket.id) {
        disconnectedUser = user;
        onlineUsers.delete(user);
        break;
      }
    }
    if (disconnectedUser) {
      io.emit("userOffline", { userName: disconnectedUser });
      console.log(`${disconnectedUser} is offline`);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
