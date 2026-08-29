const socket = io();

let room;
let name;

// JOIN
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room });

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

// SEND MESSAGE
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  add("You: " + msg);

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", data => {
  add(data.name + ": " + data.msg);
});

// FILE SEND
function sendFile() {

  let file = document.getElementById("file").files[0];
  let reader = new FileReader();

  reader.onload = () => {
    socket.emit("file", {
      room,
      file: reader.result
    });
  };

  reader.readAsDataURL(file);
}

// RECEIVE FILE
socket.on("file", data => {

  let a = document.createElement("a");
  a.href = data.file;
  a.download = "file";
  a.innerText = data.name + " sent a file";

  document.getElementById("messages").appendChild(a);
});

// ONLINE USERS
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
    name + " is typing...";

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
