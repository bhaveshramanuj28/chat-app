const socket = io();

let room, name;
let pc;
let messagesMap = {};

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

// SEND MESSAGE
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", d => {

  let isMe = d.name === name;

  let div = document.createElement("div");

  div.className = "msg " + (isMe ? "me" : "other");

  div.innerHTML = `
    ${d.msg}
    <div class="tick" id="tick-${d.id}">
      ${isMe ? "✓" : ""}
    </div>
  `;

  document.getElementById("messages").appendChild(div);

  messagesMap[d.id] = div;

  // send read receipt
  if (!isMe) socket.emit("read", d.id);
});

// DELIVERED
socket.on("delivered", id => {
  if (messagesMap[id]) {
    messagesMap[id].querySelector(".tick").innerText = "✓✓";
  }
});

// READ
socket.on("read", id => {
  if (messagesMap[id]) {
    messagesMap[id].querySelector(".tick").style.color = "skyblue";
  }
});

// TYPING
function typing() {
  socket.emit("typing");
}

socket.on("typing", n => {
  document.getElementById("typing").innerText = n + " typing...";
  setTimeout(() => {
    document.getElementById("typing").innerText = "";
  }, 1000);
});

// FILE
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

socket.on("file", d => {
  showFile(d.file, d.type);
});

function showFile(file, type) {

  let div = document.createElement("div");

  if (type.startsWith("image")) {
    div.innerHTML = `<img src="${file}">`;
  } else if (type.startsWith("audio")) {
    div.innerHTML = `<audio controls src="${file}"></audio>`;
  } else {
    div.innerHTML = `<a href="${file}" download>Download</a>`;
  }

  document.getElementById("messages").appendChild(div);
}
