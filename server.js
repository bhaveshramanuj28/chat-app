const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join", (data, cb) => {

    const { name, room } = data;

    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length >= 2) {
      return cb({ ok: false, error: "Room full" });
    }

    socket.name = name;
    socket.room = room;

    rooms[room].push(socket.id);
    socket.join(room);

    cb({ ok: true });

    io.to(room).emit("system", name + " joined");
  });

  // MESSAGE
  socket.on("msg", (d) => {

    let message = {
      id: Date.now(),
      name: socket.name,
      msg: d.msg,
      reply: d.reply || null
    };

    io.to(socket.room).emit("msg", message);

    socket.to(socket.room).emit("delivered", message.id);
  });

  // READ
  socket.on("read", id => {
    socket.to(socket.room).emit("read", id);
  });

  // DELETE
  socket.on("delete", id => {
    io.to(socket.room).emit("delete", id);
  });

  // FILE
  socket.on("file", d => {
    io.to(socket.room).emit("file", d);
  });

  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);
      if (!rooms[r].length) delete rooms[r];
    }
  });

});

http.listen(10000);
