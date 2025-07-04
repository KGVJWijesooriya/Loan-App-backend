const Logger = require("../utils/logger");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    Logger.info(`Client connected: ${socket.id}`);

    // Handle client joining a room (optional)
    socket.on("join-room", (room) => {
      socket.join(room);
      Logger.info(`Client ${socket.id} joined room: ${room}`);
    });

    // Handle client leaving a room (optional)
    socket.on("leave-room", (room) => {
      socket.leave(room);
      Logger.info(`Client ${socket.id} left room: ${room}`);
    });

    // Handle custom events
    socket.on("request-stats", async () => {
      try {
        // You can emit real-time statistics here
        const stats = {
          timestamp: new Date(),
          connectedClients: io.engine.clientsCount,
        };

        socket.emit("stats-update", stats);
      } catch (error) {
        Logger.error("Error handling stats request:", error);
      }
    });

    // Handle loan status updates
    socket.on("loan-status-change", (data) => {
      // Broadcast to all clients except sender
      socket.broadcast.emit("loan-status-updated", {
        message: "Loan status changed",
        data,
      });
    });

    // Handle payment notifications
    socket.on("payment-notification", (data) => {
      // Broadcast to all clients except sender
      socket.broadcast.emit("payment-received", {
        message: "Payment received",
        data,
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      Logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      Logger.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  // Middleware to attach io to request object
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = socketHandler;
