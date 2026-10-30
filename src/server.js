const http = require('node:http');
const { Server } = require('socket.io');
const { abrirDb } = require('./db');
const { crearApp } = require('./app');
const { crearSesion } = require('./middleware/sesion');

const PORT = process.env.PORT || 3000;
const db = abrirDb();
const sesion = crearSesion();

let io;
const emitir = (sala, evento, datos) => io?.to(sala).emit(evento, datos);

const app = crearApp({ db, sesion, emitir });
const servidor = http.createServer(app);

io = new Server(servidor);
io.engine.use(sesion); // el socket reutiliza la sesión de Express

io.on('connection', (socket) => {
  const usuarioId = socket.request.session?.usuarioId;
  if (!usuarioId) return socket.disconnect(true);
  socket.join(`usuario:${usuarioId}`);
});

servidor.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));