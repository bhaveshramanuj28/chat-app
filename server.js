const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let onlineUsers = {};

function createRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

io.on("connection", (socket) => {

  // CREATE ROOM
  socket.on("createRoom", (password, cb) => {

    const roomId = createRoomId();

    rooms[roomId] = {
      password,
      users: []
    };

    cb({ roomId });
  });

  // JOIN ROOM (IMPORTANT FIX)
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

    onlineUsers[socket.id] = user;

    // send online list
    io.to(room).emit(
      "onlineUsers",
      rooms[room].users.map(id => onlineUsers[id])
    );

    if (rooms[room].users.length === 2) {
      io.to(room).emit("start");
    }
  });

  // CHAT MESSAGE
  socket.on("msg", ({ room, data }) => {
    socket.to(room).emit("msg", {
      user: socket.user,
      data
    });
  });

  // TYPING
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", socket.user);
  });

  // DISCONNECT
  socket.on("disconnect", () => {

    delete onlineUsers[socket.id];

    for (let r in rooms) {
      rooms[r].users = rooms[r].users.filter(id => id !== socket.id);

      io.to(r).emit(
        "onlineUsers",
        rooms[r].users.map(id => onlineUsers[id])
      );
    }
  });

});

http.listen(10000, () => console.log("Server running"));
