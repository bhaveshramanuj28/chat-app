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

  // TEXT
  socket.on("msg", (d) => {

    const message = {
      id: Date.now(),
      name: socket.name,
      msg: d.msg
    };

    io.to(socket.room).emit("msg", message);

    // delivered tick
    socket.to(socket.room).emit("delivered", message.id);
  });

  // READ TICK
  socket.on("read", (id) => {
    socket.to(socket.room).emit("read", id);
  });

  // TYPING
  socket.on("typing", () => {
    socket.to(socket.room).emit("typing", socket.name);
  });

  // FILE
  socket.on("file", (d) => {
    io.to(socket.room).emit("file", {
      name: socket.name,
      file: d.file,
      type: d.type
    });
  });

  // CALL
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);
      if (rooms[r].length === 0) delete rooms[r];
    }
  });

});

http.listen(10000, () => console.log("WhatsApp v7 running"));
