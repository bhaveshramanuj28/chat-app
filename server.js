const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

// Rooms with password
let rooms = {
  "room1": { password: "1234", users: [] },
  "room2": { password: "abcd", users: [] }
};

io.on("connection", (socket) => {

  socket.on("join", ({ room, password }) => {

    if (!rooms[room]) {
      socket.emit("invalidRoom");
      return;
    }

    if (rooms[room].password !== password) {
      socket.emit("wrongPassword");
      return;
    }

    if (rooms[room].users.length >= 2) {
      socket.emit("full");
      return;
    }

    rooms[room].users.push(socket.id);
    socket.join(room);

    if (rooms[room].users.length === 2) {
      io.to(room).emit("start");
    }
  });

  socket.on("offer", data =>
    socket.to(data.room).emit("offer", data.offer)
  );

  socket.on("answer", data =>
    socket.to(data.room).emit("answer", data.answer)
  );

  socket.on("ice", data =>
    socket.to(data.room).emit("ice", data.candidate)
  );

  socket.on("typing", room =>
    socket.to(room).emit("typing")
  );

  socket.on("disconnect", () => {
    for (let r in rooms) {
      rooms[r].users = rooms[r].users.filter(id => id !== socket.id);
    }
  });

});

http.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});
