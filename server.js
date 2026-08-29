const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {};

io.on("connection", (socket) => {

  // CREATE ROOM
  socket.on("createRoom", (cb) => {
    const room = Math.random().toString(36).substring(2, 7);

    rooms[room] = {
      users: []
    };

    cb({ room });
  });

  // JOIN ROOM (FIXED + ACK SYSTEM)
  socket.on("join", ({ name, room }, cb) => {

    if (!room || room.trim() === "") {
      cb({ ok: false, error: "Room required" });
      return;
    }

    if (!name || name.trim() === "") {
      cb({ ok: false, error: "Name required" });
      return;
    }

    if (!rooms[room]) {
      cb({ ok: false, error: "Room not found" });
      return;
    }

    if (rooms[room].users.length >= 2) {
      cb({ ok: false, error: "Room full" });
      return;
    }

    socket.name = name;
    socket.room = room;

    rooms[room].users.push(socket.id);
    users[socket.id] = name;

    socket.join(room);

    cb({ ok: true });

    io.to(room).emit("online", rooms[room].users.map(id => users[id]));

    io.to(room).emit("userJoined", name);
  });

  // CHAT
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

  // CALL SIGNALING
  socket.on("offer", d => socket.to(d.room).emit("offer", d.offer));
  socket.on("answer", d => socket.to(d.room).emit("answer", d.answer));
  socket.on("ice", d => socket.to(d.room).emit("ice", d.candidate));

  // DISCONNECT
  socket.on("disconnect", () => {

    delete users[socket.id];

    for (let r in rooms) {
      rooms[r].users = rooms[r].users.filter(id => id !== socket.id);

      io.to(r).emit("online", rooms[r].users.map(id => users[id]));
    }
  });

});

http.listen(10000, () => console.log("WhatsApp v2 running"));
