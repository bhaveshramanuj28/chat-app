const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {};

// 🧠 CLEANUP HELPER
function removeUser(socket) {
  for (let r in rooms) {
    rooms[r] = rooms[r].filter(id => id !== socket.id);

    if (rooms[r].length === 0) {
      delete rooms[r];
    }
  }
  delete users[socket.id];
}

io.on("connection", (socket) => {

  // JOIN
  socket.on("join", ({ name, room }, cb) => {

    if (!rooms[room]) rooms[room] = [];

    // FIX: only active users count
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

    io.to(room).emit("online", rooms[room].map(id => users[id]));
  });

  // CHAT
  socket.on("msg", (d) => {
    io.to(d.room).emit("msg", {
      name: socket.name,
      msg: d.msg
    });
  });

  // FILE / IMAGE / VOICE
  socket.on("file", (d) => {
    io.to(d.room).emit("file", {
      name: socket.name,
      file: d.file,
      type: d.type
    });
  });

  // CALL SIGNALING
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  // 🔥 REAL FIX: DISCONNECT CLEANUP
  socket.on("disconnect", () => {

    removeUser(socket);

    // update all rooms
    for (let r in rooms) {
      io.to(r).emit(
        "online",
        rooms[r].map(id => users[id])
      );
    }
  });

});

http.listen(10000, () => console.log("WhatsApp v4 running"));
