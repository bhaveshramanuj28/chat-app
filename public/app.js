const socket = io();

let room, name;
let pc;

// JOIN
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room }, (res) => {
    if (!res.ok) return alert(res.error);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
}

// TEXT MESSAGE
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE TEXT
socket.on("msg", d => {
  add(`${d.name}: ${d.msg}`);
});

// SYSTEM
socket.on("system", m => {
  add("🔔 " + m);
});

// FILE SENDING
function sendFile() {

  let file = document.getElementById("file").files[0];

  let reader = new FileReader();

  reader.onload = () => {

    socket.emit("file", {
      room,
      file: reader.result,
      type: file.type
    });

    showFile(reader.result, file.type);
  };

  reader.readAsDataURL(file);
}

// RECEIVE FILE
socket.on("file", d => {
  showFile(d.file, d.type);
});

// FILE PREVIEW SYSTEM
function showFile(file, type) {

  let div = document.createElement("div");

  if (type.startsWith("image")) {
    div.innerHTML = `<img src="${file}">`;
  }

  else if (type.startsWith("audio")) {
    div.innerHTML = `<audio controls src="${file}"></audio>`;
  }

  else {
    div.innerHTML = `<a href="${file}" download>Download File</a>`;
  }

  document.getElementById("messages").appendChild(div);
}

// UI
function add(text) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = text;
  document.getElementById("messages").appendChild(div);
}
