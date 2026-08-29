const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  console.log("user connected");

  // JOIN (FIXED)
  socket.on("join", (data, cb) => {

    try {
      const { name, room } = data;

      if (!name || !room) {
        cb({ ok: false, error: "Name or room missing" });
        return;
      }

      if (!rooms[room]) {
        rooms[room] = [];
      }

      if (rooms[room].length >= 2) {
        cb({ ok: false, error: "Room full" });
        return;
      }

      socket.name = name;
      socket.room = room;

      rooms[room].push(socket.id);

      socket.join(room);

      cb({ ok: true });

      io.to(room).emit("system", name + " joined");

      io.to(room).emit("online", rooms[room].length);

    } catch (e) {
      cb({ ok: false, error: "Server error" });
    }
  });

  // MESSAGE
  socket.on("msg", (data) => {
    io.to(data.room).emit("msg", {
      name: socket.name,
      msg: data.msg
    });
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);
    }
  });

});

http.listen(10000, () => console.log("Server running"));
