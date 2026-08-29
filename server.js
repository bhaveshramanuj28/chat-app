const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let users = {};
let rooms = {};

io.on("connection", (socket) => {

  // JOIN ROOM
  socket.on("join", ({ name, room }) => {

    socket.name = name;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];

    rooms[room].push(socket.id);
    users[socket.id] = name;

    socket.join(room);

    io.to(room).emit("online", rooms[room].map(id => users[id]));
  });

  // MESSAGE
  socket.on("msg", ({ room, msg }) => {
    io.to(room).emit("msg", {
      name: socket.name,
      msg
    });
  });

  // FILE
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

  // DISCONNECT
  socket.on("disconnect", () => {

    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);

      io.to(r).emit("online", rooms[r].map(id => users[id]));
    }

    delete users[socket.id];
  });

});

http.listen(10000, () => console.log("Server running"));
