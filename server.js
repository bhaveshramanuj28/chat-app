const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join", ({ room, password }) => {

    if (!rooms[room]) {
      rooms[room] = { password, users: [] };
    }

    if (rooms[room].password !== password) {
      socket.emit("wrongPassword");
      return;
    }

    if (rooms[room].users.length >= 2) {
      socket.emit("full");
      return;
    }

    rooms[room].users.push(socket.id);
    socket.join(room);

    socket.room = room;

    if (rooms[room].users.length === 2) {
      io.to(room).emit("start");
    }
  });

  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r].users = rooms[r].users.filter(id => id !== socket.id);
    }
  });

});

http.listen(10000, () => console.log("Running"));
