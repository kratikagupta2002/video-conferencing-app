//Create express and scoket.io servers
require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { v4: uuidv4 } = require("uuid");

//import firebase and sweetlaert2 library
var firebase = require("firebase/app");
require("firebase/auth")
const Swal = require('sweetalert2')

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true
  
});
app.use("/peerjs", peerServer);

app.set("view engine", "ejs"); //tell express that we are using EJS
app.use(express.static("public"));//tell express to pull static files from public folder

//generate random UUID if the user joins the base link and then redirect him to that room with the said UUID
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

//If the user joins that room, render that room
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

//send the respective filse when the user visits the below URLs
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





//When someone connects to the server, 
io.on("connection", (socket) => {
  //When someone joins the room
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);    
    socket.broadcast.to(roomId).emit("user-connected", userId);//tell everyone in the room that the user joined
    
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);//send message to everyone in the room 
    });
    socket.on("user-disconnected", () => {
      console.log("disconnected");
      socket.broadcast.to(roomId).emit("user-disconnected",userId);//tell everyone in the room that the user disconnected
    });
    
  });
});

server.listen(process.env.PORT || 3030); //server runs on 3030 port
