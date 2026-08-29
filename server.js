const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("join", (room) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];

    // LIMIT 2 USERS
    if (rooms[room].length >= 2) {
      socket.emit("full");
      return;
    }

    rooms[room].push(socket.id);

    if (rooms[room].length === 2) {
      io.to(rooms[room][0]).emit("start");
    }
  });

  socket.on("offer", data => socket.to(data.room).emit("offer", data.offer));
  socket.on("answer", data => socket.to(data.room).emit("answer", data.answer));
  socket.on("ice", data => socket.to(data.room).emit("ice", data.candidate));

  socket.on("typing", room => socket.to(room).emit("typing"));

  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r] = rooms[r].filter(id => id !== socket.id);
    }
  });

});

http.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});