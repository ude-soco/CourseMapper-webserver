const socketIO = require("socket.io");
import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "production";
let io;

module.exports = {
  init: (server) => {
    io = socketIO(server, {
      cors: {
        origin:
          env !== "production"
            ? ["http://localhost:4200", process.env.WEBAPP_URL]
            : "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: env !== "production" ? true : false,
      },
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
