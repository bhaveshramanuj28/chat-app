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

// SEND TEXT
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE TEXT
socket.on("msg", d => {
  add(d.name + ": " + d.msg, "text");
});

// FILE SEND (IMAGE + FILE + PREVIEW)
function sendFile() {

  let file = document.getElementById("file").files[0];

  let reader = new FileReader();

  reader.onload = () => {

    socket.emit("file", {
      room,
      file: reader.result,
      fileType: file.type
    });

    // local preview
    showPreview(reader.result, file.type);
  };

  reader.readAsDataURL(file);
}

// RECEIVE FILE
socket.on("file", d => {

  if (d.fileType.startsWith("image")) {
    showPreview(d.file, d.fileType);
  } else if (d.fileType.startsWith("audio")) {
    let audio = new Audio(d.file);
    audio.controls = true;
    document.getElementById("messages").appendChild(audio);
  } else {
    let a = document.createElement("a");
    a.href = d.file;
    a.download = "file";
    a.innerText = "Download File";
    document.getElementById("messages").appendChild(a);
  }
});

// PREVIEW FUNCTION
function showPreview(file, type) {

  let div = document.createElement("div");

  if (type.startsWith("image")) {
    div.innerHTML = `<img src="${file}">`;
  } else {
    div.innerText = "File received";
  }

  document.getElementById("preview").appendChild(div);
}

// ONLINE
socket.on("online", users => {
  document.getElementById("online").innerText =
    "Online: " + users.join(", ");
});

// UI
function add(text) {
  let div = document.createElement("div");
  div.className = "msg";
  div.innerText = text;
  document.getElementById("messages").appendChild(div);
}
