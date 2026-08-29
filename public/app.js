const socket = io();

let room;
let name;
let pc;
let channel;

// CREATE ROOM
function createRoom() {

  socket.emit("createRoom", ({ room: r }) => {
    document.getElementById("room").value = r;
    alert("Room created: " + r);
  });
}

// JOIN (FIXED WITH CALLBACK)
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room }, (res) => {

    if (!res.ok) {
      document.getElementById("error").innerText = res.error;
      return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
}

// SEND MSG (NO DUPLICATE)
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE MSG
socket.on("msg", d => {

  if (d.name === name) {
    add("You: " + d.msg);
  } else {
    add(d.name + ": " + d.msg);
  }
});

// FILE
function sendFile() {

  let file = document.getElementById("file").files[0];
  let reader = new FileReader();

  reader.onload = () => {
    socket.emit("file", { room, file: reader.result });
  };

  reader.readAsDataURL(file);
}

// RECEIVE FILE
socket.on("file", d => {
  let a = document.createElement("a");
  a.href = d.file;
  a.download = "file";
  a.innerText = d.name + " sent file";
  document.getElementById("messages").appendChild(a);
});

// ONLINE
socket.on("online", users => {
  document.getElementById("online").innerText =
    "Online: " + users.join(", ");
});

// TYPING
function typing() {
  socket.emit("typing", room);
}

socket.on("typing", name => {
  document.getElementById("typing").innerText =
    name + " typing...";

  setTimeout(() => {
    document.getElementById("typing").innerText = "";
  }, 1000);
});

// UI
function add(msg) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = msg;
  document.getElementById("messages").appendChild(div);
}
