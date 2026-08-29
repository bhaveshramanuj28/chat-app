const socket = io();

let room, name;
let pc;

// JOIN SAFE
function join() {

  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room }, (res) => {
    if (!res.ok) return alert(res.error);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
  });
}

// TEXT
function send() {

  let msg = document.getElementById("msg").value;

  socket.emit("msg", { room, msg });

  document.getElementById("msg").value = "";
}

// RECEIVE TEXT
socket.on("msg", d => add(d.name + ": " + d.msg));

// SYSTEM
socket.on("system", m => {
  document.getElementById("system").innerText = m;
});

// FILE + IMAGE + AUDIO
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

// FILE PREVIEW
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

---

# 📞 CALL (STABLE)

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
