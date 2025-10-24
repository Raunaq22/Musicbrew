const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MusicBrew Server');
});

server.listen(5001, () => {
  console.log('Server running on port 5001');
});