const socket = io();

let room;
let name;

// JOIN (100% SAFE)
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  document.getElementById("error").innerText = "";

  socket.emit("join", { name, room }, (res) => {

    if (!res.ok) {
      document.getElementById("error").innerText = res.error;
      return;
    }

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
}

// SEND
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { msg });

  document.getElementById("msg").value = "";
}

// RECEIVE
socket.on("msg", (d) => {
  add(d.name + ": " + d.msg);
});

// UI
function add(text) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = text;
  document.getElementById("messages").appendChild(div);
}
