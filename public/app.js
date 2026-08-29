const socket = io();

let room;
let user;

// AUTO JOIN FROM LINK (🔥 IMPORTANT FIX)
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get("room");

  if (roomFromUrl) {
    document.getElementById("room").value = roomFromUrl;
  }
};

// CREATE ROOM + INVITE LINK
function createRoom() {
  let pass = document.getElementById("password").value;

  socket.emit("createRoom", pass, ({ roomId }) => {

    const link = `${window.location.origin}?room=${roomId}`;

    prompt("Share this invite link:", link);
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

// ERRORS
socket.on("wrongPassword", () => alert("Wrong password"));
socket.on("invalidRoom", () => alert("Room not found"));
socket.on("full", () => alert("Room full"));

// SEND MESSAGE
function send() {
  let msg = document.getElementById("msg").value;

  socket.emit("msg", {
    room,
    data: msg
  });

  add("You: " + msg);

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", (data) => {
  add(data.user + ": " + data.data);
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

socket.on("typing", (user) => {
  document.getElementById("typing").innerText =
    user + " is typing...";

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
