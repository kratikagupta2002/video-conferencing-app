require("dotenv").config();
const express = require("express");
const app = express();
var cors = require('cors')
var firebase = require("firebase/app");
require("firebase/auth");

const server = require("http").Server(app);

const Swal = require('sweetalert2')

const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
/*const io = require('socket.io')(server, {
  cors: {
      origin: "http://localhost:3030",
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling'],
      credentials: true
  },
  allowEIO3: true
});*/
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true
  
});


app.use("/peerjs", peerServer);
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});
app.get("/views/end.html", (req, res) => {
  res.setHeader('Content-type','text/html');
  res.sendFile('views/end.html', {root: __dirname })
});
app.get("/public/rating.css", (req, res) => {
  res.setHeader('Content-type','text/css');
  res.sendFile('public/rating.css', {root: __dirname })
});
app.get("/public/rating.js", (req, res) => {
  res.setHeader('Content-type','text/javascript');
  res.sendFile('public/rating.js', {root: __dirname })
});



app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on("user-disconnected", () => {
      console.log("disconnected");
      socket.broadcast.to(roomId).emit("user-disconnected",userId);
    });
    
  });
});

server.listen(process.env.PORT || 3030);
