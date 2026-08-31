const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join", (data, cb) => {
    const { name, room } = data || {};

    if (!name || !room) {
      return cb({ ok: false, error: "Invalid data" });
    }

    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length >= 2) {
      return cb({ ok: false, error: "Room full" });
    }

    socket.name = name;
    socket.room = room;

    rooms[room].push(socket.id);
    socket.join(room);

    cb({ ok: true });

    io.to(room).emit("system", `${name} joined`);
  });

  // CHAT
  socket.on("msg", (msg) => {
    io.to(socket.room).emit("msg", {
      name: socket.name,
      msg
    });
  });

  // FILE / AUDIO / IMAGE
  socket.on("file", (data) => {
    io.to(socket.room).emit("file", {
      name: socket.name,
      file: data.file,
      type: data.type
    });
  });

  // CALL SIGNALING
  socket.on("offer", (d) => socket.to(socket.room).emit("offer", d));
  socket.on("answer", (d) => socket.to(socket.room).emit("answer", d));
  socket.on("ice", (d) => socket.to(socket.room).emit("ice", d));

  // TYPING
  socket.on("typing", () => {
    socket.to(socket.room).emit("typing", socket.name);
  });

  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);
      if (rooms[r].length === 0) delete rooms[r];
    }
  });

});

http.listen(10000, () => console.log("Server running"));
