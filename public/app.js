const socket = io();

let room, name;

// CONNECT DEBUG
socket.on("connect", () => {
  console.log("🟢 SOCKET CONNECTED");
});

// JOIN
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  console.log("➡️ SENDING JOIN:", { name, room });

  socket.emit("join", { name, room }, (res) => {

    console.log("⬅️ JOIN RESPONSE:", res);

    if (!res || !res.ok) {
      document.getElementById("error").innerText = res?.error || "Unknown error";
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
socket.on("msg", d => {

  let div = document.createElement("div");

  div.className = "msg";
  div.innerText = `${d.name}: ${d.msg}`;

  document.getElementById("messages").appendChild(div);
});
