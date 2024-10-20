const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const pty = require("node-pty");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  console.log(`New User Connected ${socket.id}`);

  // Determine the shell based on OS
  const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

  // Spawn a new terminal using node-pty
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Send the terminal output to the client
  ptyProcess.on("data", (data) => {
    socket.emit("output", data);
  });

  // Receive input from the client and send it to the terminal
  socket.on("input", (input) => {
    ptyProcess.write(input + "\r");
  });

  // Handle terminal clear command from client
  socket.on("clear", () => {
    ptyProcess.write("clear\r");
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected ${socket.id}`);
    ptyProcess.kill();
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on http://localhost:3000");
});
