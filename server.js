const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

function makeRoom() {
  return Math.random().toString(36).substring(2, 8);
}

io.on("connection", (socket) => {

  // CREATE ROOM
  socket.on("createRoom", (password, cb) => {
    const roomId = makeRoom();

    rooms[roomId] = {
      password,
      users: []
    };

    cb({ roomId });
  });

  // JOIN ROOM
  socket.on("join", ({ room, password, user }) => {

    if (!rooms[room]) {
      socket.emit("invalidRoom");
      return;
    }

    if (rooms[room].password !== password) {
      socket.emit("wrongPassword");
      return;
    }

    if (rooms[room].users.length >= 2) {
      socket.emit("full");
      return;
    }

    socket.room = room;
    socket.user = user;

    rooms[room].users.push(socket.id);
    socket.join(room);

    // 👇 important: initiator decide
    const initiator = rooms[room].users[0] === socket.id;

    io.to(room).emit("start", { initiator });
  });

  // SIGNALING
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  // DISCONNECT CLEANUP
  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r].users = rooms[r].users.filter(id => id !== socket.id);
    }
  });

});

http.listen(10000, () => console.log("Server running"));
