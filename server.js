const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {};

function genRoom() {
  return Math.random().toString(36).substring(2, 8);
}

io.on("connection", (socket) => {

  // create room
  socket.on("createRoom", (password, cb) => {

    let roomId = genRoom();

    rooms[roomId] = {
      password,
      users: []
    };

    cb({ roomId });
  });

  // join room
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

    socket.user = user;
    socket.room = room;

    rooms[room].users.push(socket.id);
    socket.join(room);

    users[socket.id] = user;

    io.to(room).emit("online", rooms[room].users.map(id => users[id]));

    if (rooms[room].users.length === 2) {
      io.to(room).emit("ready");
    }
  });

  // CHAT
  socket.on("msg", ({ room, data }) => {
    socket.to(room).emit("msg", {
      user: socket.user,
      data
    });
  });

  // FILE
  socket.on("file", ({ room, file }) => {
    socket.to(room).emit("file", file);
  });

  // TYPING
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", socket.user);
  });

  // WEBRTC SIGNALING
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  // DISCONNECT
  socket.on("disconnect", () => {

    delete users[socket.id];

    for (let r in rooms) {
      rooms[r].users = rooms[r].users.filter(id => id !== socket.id);

      io.to(r).emit(
        "online",
        rooms[r].users.map(id => users[id])
      );
    }
  });

});

http.listen(10000, () => console.log("Server running"));
