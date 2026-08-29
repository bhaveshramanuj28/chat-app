const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {};

io.on("connection", (socket) => {

  // JOIN ROOM
  socket.on("join", ({ name, room }, cb) => {

    if (!name || !room) {
      cb({ ok: false, error: "Name & Room required" });
      return;
    }

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

    io.to(room).emit("system", name + " joined");
  });

  // CHAT MESSAGE
  socket.on("msg", ({ room, msg }) => {
    io.to(room).emit("msg", {
      name: socket.name,
      msg
    });
  });

  // FILE / VOICE
  socket.on("file", ({ room, file, type }) => {
    io.to(room).emit("file", {
      name: socket.name,
      file,
      type
    });
  });

  // TYPING
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", socket.name);
  });

  // CALL SIGNALING
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

http.listen(10000, () => console.log("WhatsApp v3 running"));
