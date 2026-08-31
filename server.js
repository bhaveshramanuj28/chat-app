const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};
let users = {}; // socket.id -> user

io.on("connection", (socket) => {

  // JOIN
  socket.on("join", (data, cb) => {

    const { name, room } = data;

    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length >= 2) {
      return cb({ ok: false, error: "Room full" });
    }

    socket.name = name;
    socket.room = room;

    rooms[room].push(socket.id);

    users[socket.id] = {
      name,
      room,
      online: true
    };

    socket.join(room);

    cb({ ok: true });

    io.to(room).emit("presence", getUsers(room));
  });

  function getUsers(room) {
    return rooms[room]?.map(id => ({
      id,
      name: users[id]?.name,
      online: true
    })) || [];
  }

  // MESSAGE
  socket.on("msg", (msg) => {

    const id = Date.now();

    io.to(socket.room).emit("msg", {
      id,
      name: socket.name,
      msg,
      status: "sent"
    });

    socket.to(socket.room).emit("delivered", id);
  });

  // READ RECEIPT
  socket.on("read", (id) => {
    socket.to(socket.room).emit("read", id);
  });

  // FILE
  socket.on("file", (d) => {
    io.to(socket.room).emit("file", {
      name: socket.name,
      file: d.file,
      type: d.type
    });
  });

  // CALL SIGNALING (FIXED)
  socket.on("offer", d => socket.to(socket.room).emit("offer", d));
  socket.on("answer", d => socket.to(socket.room).emit("answer", d));
  socket.on("ice", d => socket.to(socket.room).emit("ice", d));

  // ONLINE STATUS
  socket.on("disconnect", () => {

    if (users[socket.id]) {
      users[socket.id].online = false;
    }

    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);
      io.to(r).emit("presence", getUsers(r));
    }
  });

});

http.listen(10000);
