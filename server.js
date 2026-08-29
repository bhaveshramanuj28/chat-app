const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  console.log("🔵 CONNECTED:", socket.id);

  socket.on("join", (data, cb) => {

    console.log("📩 JOIN REQUEST:", data);

    try {

      if (!data) {
        console.log("❌ NO DATA");
        return cb({ ok: false, error: "No data received" });
      }

      const { name, room } = data;

      if (!name || !room) {
        console.log("❌ INVALID NAME/ROOM");
        return cb({ ok: false, error: "Name/Room required" });
      }

      if (!rooms[room]) rooms[room] = [];

      console.log("ROOM BEFORE:", rooms[room]);

      if (rooms[room].length >= 2) {
        console.log("❌ ROOM FULL");
        return cb({ ok: false, error: "Room full" });
      }

      socket.name = name;
      socket.room = room;

      rooms[room].push(socket.id);

      socket.join(room);

      console.log("✅ JOINED:", name, room);

      console.log("ROOM AFTER:", rooms[room]);

      cb({ ok: true });

      io.to(room).emit("msg", {
        name: "SYSTEM",
        msg: `${name} joined room`
      });

    } catch (err) {

      console.log("🔥 SERVER ERROR:", err);

      cb({ ok: false, error: "Server crashed (check console)" });
    }
  });

  socket.on("msg", (d) => {

    if (!socket.room) return;

    io.to(socket.room).emit("msg", {
      name: socket.name,
      msg: d.msg
    });
  });

  socket.on("disconnect", () => {

    console.log("🔴 DISCONNECT:", socket.id);

    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);

      if (rooms[r].length === 0) delete rooms[r];
    }
  });

});

http.listen(10000, () => {
  console.log("🚀 SERVER RUNNING ON 10000");
});
