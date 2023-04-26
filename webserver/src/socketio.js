const socketIO = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = socketIO(httpServer, {
      cors: {
        origin: ["http://localhost:4200", process.env.WEBAPP_URL],
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true,
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
