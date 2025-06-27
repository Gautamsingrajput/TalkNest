const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    url: `http://localhost:3000/uploads/${file.filename}`,
    type: file.mimetype,
  });
});

// Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
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

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
