const socket = io();

let room;
let user;

// SIMPLE "ENCRYPTION" (basic demo XOR)
function encrypt(text) {
  return btoa(text); // simple encoding (demo)
}

function decrypt(text) {
  return atob(text);
}

// CREATE ROOM
function createRoom() {
  let pass = document.getElementById("password").value;

  socket.emit("createRoom", pass, ({ roomId }) => {
    alert("Invite Link: " + window.location.href + "?room=" + roomId);
  });
}

// JOIN ROOM
function join() {
  room = document.getElementById("room").value;
  let password = document.getElementById("password").value;
  user = document.getElementById("user").value;

  socket.emit("join", { room, password, user });

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
}

// SEND MESSAGE (ENCRYPTED)
function send() {
  let msg = document.getElementById("msg").value;

  let encrypted = encrypt(msg);

  socket.emit("msg", {
    room,
    data: encrypted
  });

  add("You: " + msg);
  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", (data) => {
  add(data.user + ": " + decrypt(data.data));
});

// ONLINE USERS
socket.on("onlineUsers", (users) => {
  document.getElementById("users").innerHTML =
    "Online: " + users.join(", ");
});

// TYPING
function typing() {
  socket.emit("typing", room);
}

socket.on("typing", (u) => {
  document.getElementById("status").innerText = u + " is typing...";
  setTimeout(() => {
    document.getElementById("status").innerText = "";
  }, 1000);
});

// UI
function add(msg) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = msg;
  document.getElementById("messages").appendChild(div);
}
