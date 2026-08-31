const socket = io();

let room, name;
let pc;

// JOIN
function join() {
  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { name, room }, res => {
    if (!res.ok) return alert(res.error);

    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "flex";
  });
}

// SEND TEXT
function send() {
  let msg = document.getElementById("msg").value;

  socket.emit("msg", { msg });

  document.getElementById("msg").value = "";
}

// RECEIVE TEXT
socket.on("msg", d => {
  addMsg(d.name, d.msg);
});

// UI MSG
function addMsg(sender, text) {

  let div = document.createElement("div");

  div.className = "msg " + (sender === name ? "me" : "other");

  div.innerText = sender + ": " + text;

  document.getElementById("messages").appendChild(div);
}

// FILE
function sendFile() {
  let file = document.getElementById("file").files[0];

  let reader = new FileReader();

  reader.onload = () => {
    socket.emit("file", {
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

// 🎤 VOICE
let recorder, chunks=[];

async function recordVoice() {

  let stream = await navigator.mediaDevices.getUserMedia({ audio:true });

  recorder = new MediaRecorder(stream);

  recorder.start();

  recorder.ondataavailable = e => chunks.push(e.data);

  recorder.onstop = () => {

    let blob = new Blob(chunks);

    let reader = new FileReader();

    reader.onload = () => {
      socket.emit("file", {
        file: reader.result,
        type: "audio"
      });
    };

    reader.readAsDataURL(blob);

    chunks=[];
  };

  setTimeout(()=>recorder.stop(),3000);
}

// 📞 CALL
async function call() {

  pc = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  let stream = await navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
  });

  document.getElementById("local").srcObject = stream;

  stream.getTracks().forEach(t=>pc.addTrack(t,stream));

  pc.ontrack = e=>{
    document.getElementById("remote").srcObject = e.streams[0];
  };

  pc.onicecandidate = e=>{
    if(e.candidate){
      socket.emit("ice",e.candidate);
    }
  };

  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer",offer);
}

// RECEIVE CALL
socket.on("offer", async offer => {

  pc = new RTCPeerConnection({
    iceServers:[{urls:"stun:stun.l.google.com:19302"}]
  });

  await pc.setRemoteDescription(offer);

  let ans = await pc.createAnswer();
  await pc.setLocalDescription(ans);

  socket.emit("answer",ans);

  pc.ontrack = e=>{
    document.getElementById("remote").srcObject = e.streams[0];
  };
});

socket.on("answer", ans => pc.setRemoteDescription(ans));
socket.on("ice", c => pc.addIceCandidate(c));
