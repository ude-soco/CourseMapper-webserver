const socketIO = require("socket.io");
import dotenv from "dotenv";
dotenv.config();
const env = process.env.NODE_ENV || "production";

let io;

module.exports = {
  init: (server) => {
    env !== "production"
      ? (io = socketIO(server, {
          path: "/api/socket.io",
          cors: {
            origin: ["http://localhost:4200", process.env.WEBAPP_URL],
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
          },
        }))
      : (io = socketIO(server, {
          path: "/api/socket.io",
        }));

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
