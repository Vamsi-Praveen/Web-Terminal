const express = require("express");
const socketio = require("socket.io");
const http = require("http");
// const pty = require("node-pty");
const os = require("os");
const { exec } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
  console.log(`New User Connected ${socket.id}`);

  //read the data from the terminal
  const shell = os.platform() == "win32" ? "powershell.exe" : "bash";

  const prompt = `${os.userInfo().username}@${os.hostname()}:~$ `;

  // Send the initial prompt when connected
  socket.emit("output", prompt);

  socket.on("prompt", () => socket.emit("output", prompt));

  //   const ptyProcess = pty.spawn(shell, [], {
  //     name: "xterm-color",
  //     cols: 80,
  //     rows: 30,
  //     cwd: process.env.HOME,
  //     env: process.env,
  //   });

  //   //sending data to terminal
  //   ptyProcess.on("data", (data) => {
  //     socket.emit("output", data);
  //   });

  //   //handle input from client and sent to tty
  socket.on("input", (input) => {
    if (input === "cls" || input === "clear") {
      socket.emit("output", prompt);
    } else {
      exec(input, (error, stdout, stderr) => {
        if (error) {
          socket.emit("output", `Error: ${stderr}`);
          socket.emit("output", prompt);
          return;
        } else {
          socket.emit("output", stdout);
        }
        socket.emit("output", prompt);
      });
    }
  });

  socket.on("clear", () => {
    socket.emit("output", prompt);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected ${socket.id}`);
    // ptyProcess.kill();
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on http://localhost:3000");
});
