const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB schema
mongoose.connect('mongodb://localhost/chatroom', { useNewUrlParser: true, useUnifiedTopology: true });

const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Send all messages to the user when they connect
  Message.find({}, (err, messages) => {
    if (err) console.error(err);
    socket.emit('chat history', messages);
  });

  // Listen for new messages
  socket.on('new message', (msg) => {
    const newMessage = new Message({ username: msg.username, message: msg.message });
    newMessage.save().then(() => {
      io.emit('new message', newMessage);
    });
  });

  // Listen for delete message requests
  socket.on('delete message', (messageId) => {
    Message.findByIdAndDelete(messageId, (err) => {
      if (err) console.error(err);
      io.emit('message deleted', messageId);
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
