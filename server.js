const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {};

// CREATE ROOM
function genRoom() {
  return Math.random().toString(36).substring(2, 8);
}

io.on("connection", (socket) => {

  // join room
  socket.on("join", ({ name, room }) => {

    socket.name = name;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];

    rooms[room].push(socket.id);
    users[socket.id] = name;

    socket.join(room);

    io.to(room).emit("online",
      rooms[room].map(id => users[id])
    );
  });

  // CHAT MESSAGE
  socket.on("msg", ({ room, msg }) => {
    io.to(room).emit("msg", {
      name: socket.name,
      msg
    });
  });

  // FILE SHARING
  socket.on("file", ({ room, file }) => {
    io.to(room).emit("file", {
      name: socket.name,
      file
    });
  });

  // TYPING
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", socket.name);
  });

  // WEBRTC SIGNALING (CALL)
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  // DISCONNECT
  socket.on("disconnect", () => {

    delete users[socket.id];

    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);

      io.to(r).emit(
        "online",
        rooms[r].map(id => users[id])
      );
    }
  });

});

http.listen(10000, () => {
  console.log("Server running");
});
