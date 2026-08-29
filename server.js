const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {};

io.on("connection", (socket) => {

  socket.on("join", ({ name, room }, cb) => {

    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length >= 2) {
      cb({ ok: false, error: "Room full" });
      return;
    }

    socket.name = name;
    socket.room = room;

    rooms[room].push(socket.id);
    users[socket.id] = name;

    socket.join(room);

    cb({ ok: true });

    io.to(room).emit("online",
      rooms[room].map(id => users[id])
    );
  });

  // TEXT
  socket.on("msg", (d) => {
    io.to(d.room).emit("msg", {
      name: socket.name,
      msg: d.msg,
      type: "text"
    });
  });

  // FILE / IMAGE / VOICE
  socket.on("file", (d) => {
    io.to(d.room).emit("file", {
      name: socket.name,
      file: d.file,
      fileType: d.fileType
    });
  });

  // CALL SIGNALING
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

});

http.listen(10000, () => console.log("WhatsApp v3.5 running"));
