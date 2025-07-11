const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const server = createServer(app);

// Create uploads folder if not exists
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// CORS Middleware
app.use(cors({
  origin: [
    'https://talknest-1.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use('/uploads', express.static(uploadPath));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
  res.json({ url: fileUrl, type: file.mimetype });
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'https://talknest-1.onrender.com',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('set username', (username) => {
    socket.username = username;
    io.emit('system message', `${username} joined the chat`);
  });

  socket.on('chat message', (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    io.emit('chat message', {
      user: socket.username || 'Anonymous',
      msg,
      time: timestamp,
    });
  });

  socket.on('media message', (data) => {
    const timestamp = new Date().toLocaleTimeString();
    io.emit('media message', {
      user: socket.username || 'Anonymous',
      url: data.url,
      type: data.type,
      time: timestamp,
    });
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('system message', `${socket.username} left the chat`);
    }
  });
});

// Server listener
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
