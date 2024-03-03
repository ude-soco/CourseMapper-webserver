const socketIO = require("socket.io");
import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "production";
let io;

let socketIOConfig = {
  cors: {
    origin:
      env !== "production"
        ? ["http://localhost:4200", process.env.WEBAPP_URL]
        : "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: env !== "production" ? true : false,
  },
};

if (env !== "production") {
  socketIOConfig = {
    ...socketIOConfig,
    path: "/api/socket.io",
  };
}

module.exports = {
  init: (server) => {
    io = socketIO(server, socketIOConfig);
    io.on("connection", (socket) => {
      // TODO THIS IS A TEMPORARY FIX
      // Users should not choose which room to join
      // They should only be able to join rooms that they are authorized to join
      // But that would require implementing authentication
      socket.on("join", (room) => {
        socket.join(room);
      });
      socket.on("leave", (room) => {
        socket.leave(room);
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
