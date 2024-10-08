const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");
const path = require("path");

const server = http.createServer(app);
const io = new Server(server);
const job=require("./cron/cron.js")

app.use(express.static("build"));
// job.start();

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // console.log(clients);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    // io.to(roomId).emit(ACTIONS.CODE_CHANGE,{code})
    // console.log('recieving',code);
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    // console.log('recieving',code);
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.OUTPUT,({ roomId, details})=>{
    socket.in(roomId).emit(ACTIONS.SET_OUTPUT, { details: details });
});
socket.on(ACTIONS.LANGUAGE,({ roomId, language })=>{
  socket.in(roomId).emit(ACTIONS.SET_LANGUAGE,{ lang: language });
});
socket.on(ACTIONS.CUSTOM_INPUT,({ roomId, input})=>{
  socket.in(roomId).emit(ACTIONS.CUSTOM_INPUT,{input: input});
});

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`listening on port ${PORT}`));
