const socket = io();

let room;
let name;

// JOIN (FIXED CALLBACK SAFE)
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

// SEND MESSAGE
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", (d) => {
  add(d.name + ": " + d.msg);
});

// SYSTEM
socket.on("system", (m) => {
  document.getElementById("system").innerText = m;
});

// UI
function add(text) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = text;
  document.getElementById("messages").appendChild(div);
}
