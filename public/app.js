const socket = io();

let room;
let name;
let pc;

// JOIN (FIXED CALLBACK SYSTEM)
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

// SEND MESSAGE (NO DUPLICATE BUG)
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE MESSAGE
socket.on("msg", d => {

  if (d.name === name) {
    add("You: " + d.msg, true);
  } else {
    add(d.name + ": " + d.msg, false);
  }
});

// SYSTEM MESSAGE
socket.on("system", msg => {
  document.getElementById("system").innerText = msg;
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

socket.on("typing", n => {
  document.getElementById("typing").innerText = n + " typing...";

  setTimeout(() => {
    document.getElementById("typing").innerText = "";
  }, 1000);
});

// UI ADD
function add(text, me) {

  let div = document.createElement("div");

  div.className = "msg " + (me ? "me" : "other");

  div.innerText = text;

  document.getElementById("messages").appendChild(div);
}

// FILE + VOICE (SAME SYSTEM)
function sendFile() {

  let file = document.getElementById("file").files[0];

  let reader = new FileReader();

  reader.onload = () => {
    socket.emit("file", {
      room,
      file: reader.result,
      type: file.type
    });
  };

  reader.readAsDataURL(file);
}

// RECEIVE FILE
socket.on("file", d => {

  if (d.type.startsWith("audio")) {

    let audio = new Audio(d.file);
    audio.controls = true;

    document.getElementById("messages").appendChild(audio);

  } else {

    let a = document.createElement("a");
    a.href = d.file;
    a.download = "file";
    a.innerText = d.name + " sent file";

    document.getElementById("messages").appendChild(a);
  }
});

---

# 📞 CALL (STABLE WEBRTC)

async function call() {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  let stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("local").srcObject = stream;

  stream.getTracks().forEach(t => pc.addTrack(t, stream));

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("ice", { room, candidate: e.candidate });
    }
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", { room, offer });
}

// RECEIVE CALL
socket.on("offer", async offer => {

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.ontrack = e => {
    document.getElementById("remote").srcObject = e.streams[0];
  };

  await pc.setRemoteDescription(offer);

  let ans = await pc.createAnswer();
  await pc.setLocalDescription(ans);

  socket.emit("answer", { room, answer: ans });
});

socket.on("answer", ans => pc.setRemoteDescription(ans));
socket.on("ice", c => pc.addIceCandidate(c));
