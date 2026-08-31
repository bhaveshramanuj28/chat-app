const socket = io();

let room, name;
let replyMsg = null;
let messages = {};

// SIMPLE ENCRYPT
function enc(text) {
  return btoa(text);
}
function dec(text) {
  return atob(text);
}

// JOIN
function join() {
  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room }, res => {
    if (!res.ok) return alert(res.error);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
}

// SEND
function send() {
  let msg = document.getElementById("msg").value;

  socket.emit("msg", {
    msg: enc(msg),
    reply: replyMsg
  });

  replyMsg = null;
  document.getElementById("replyPreview").innerHTML = "";
  document.getElementById("msg").value = "";
}

// RECEIVE
socket.on("msg", d => {

  let isMe = d.name === name;

  let div = document.createElement("div");
  div.className = "msg " + (isMe ? "me" : "other");

  let text = dec(d.msg);

  div.innerHTML = `
    ${d.reply ? `<div class="replyBox">${d.reply}</div>` : ""}
    ${text}
    <div class="tick" id="tick-${d.id}">
      ${isMe ? "✓" : ""}
    </div>
  `;

  // RIGHT CLICK = REPLY
  div.oncontextmenu = () => {
    replyMsg = text;
    document.getElementById("replyPreview").innerText = "Reply: " + text;
  };

  // DOUBLE CLICK = DELETE
  div.ondblclick = () => {
    socket.emit("delete", d.id);
  };

  document.getElementById("messages").appendChild(div);

  messages[d.id] = div;

  if (!isMe) socket.emit("read", d.id);
});

// DELIVERED
socket.on("delivered", id => {
  if (messages[id]) {
    messages[id].querySelector(".tick").innerText = "✓✓";
  }
});

// READ
socket.on("read", id => {
  if (messages[id]) {
    messages[id].querySelector(".tick").style.color = "skyblue";
  }
});

// DELETE
socket.on("delete", id => {
  if (messages[id]) {
    messages[id].innerText = "🚫 Message deleted";
  }
});
