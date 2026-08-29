const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  console.log("USER CONNECTED:", socket.id);

  socket.on("join", (data, cb) => {

    try {
      console.log("JOIN REQUEST:", data);

      if (!data || !data.name || !data.room) {
        return cb({ ok: false, error: "Invalid data" });
      }

      const { name, room } = data;

      if (!rooms[room]) rooms[room] = [];

      if (rooms[room].length >= 2) {
        return cb({ ok: false, error: "Room full" });
      }

      socket.name = name;
      socket.room = room;

      rooms[room].push(socket.id);

      socket.join(room);

      console.log("JOINED:", name, room);

      cb({ ok: true });

      io.to(room).emit("msg", {
        name: "SYSTEM",
        msg: name + " joined"
      });

    } catch (err) {
      console.log("ERROR:", err);
      cb({ ok: false, error: "Server crash fixed" });
    }
  });

  // CHAT
  socket.on("msg", (data) => {
    if (!socket.room) return;

    io.to(socket.room).emit("msg", {
      name: socket.name,
      msg: data.msg
    });
  });

  // CLEAN DISCONNECT FIX
  socket.on("disconnect", () => {

    console.log("DISCONNECTED:", socket.id);

    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);

      if (rooms[r].length === 0) {
        delete rooms[r];
      }
    }
  });

});

http.listen(10000, () => {
  console.log("SERVER RUNNING ON 10000");
});
