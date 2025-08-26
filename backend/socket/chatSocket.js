const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Chat = require("../models/Chat");

const chatSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(
          new Error(
            "Authentication error: No token provided"
          )
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
      const user = await User.findById(
        decoded.id
      );

      if (!user) {
        return next(
          new Error(
            "Authentication error: User not found"
          )
        );
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      return next(
        new Error(
          "Authentication error: Invalid token"
        )
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `User ${socket.user.name} connected with socket ID: ${socket.id}`
    );

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join chat room
    socket.on("join_chat", async (data) => {
      try {
        const { chatId } = data;

        // Verify user is part of this chat
        const chat = await Chat.findById(chatId);
        if (
          !chat ||
          !chat.participants.includes(
            socket.userId
          )
        ) {
          socket.emit("error", {
            message:
              "Unauthorized to join this chat",
          });
          return;
        }

        socket.join(`chat_${chatId}`);
        socket.currentChatId = chatId;

        // Mark messages as read
        await Chat.findByIdAndUpdate(chatId, {
          $pull: { unreadBy: socket.userId },
        });

        socket.emit("joined_chat", { chatId });
        console.log(
          `User ${socket.user.name} joined chat ${chatId}`
        );
      } catch (error) {
        console.error(
          "Error joining chat:",
          error
        );
        socket.emit("error", {
          message: "Failed to join chat",
        });
      }
    });

    // Leave chat room
    socket.on("leave_chat", (data) => {
      const { chatId } = data;
      socket.leave(`chat_${chatId}`);
      socket.currentChatId = null;
      socket.emit("left_chat", { chatId });
      console.log(
        `User ${socket.user.name} left chat ${chatId}`
      );
    });

    // Send message
    socket.on("send_message", async (data) => {
      try {
        const {
          chatId,
          message,
          messageType = "text",
        } = data;

        // Verify user is part of this chat
        const chat = await Chat.findById(chatId);
        if (
          !chat ||
          !chat.participants.includes(
            socket.userId
          )
        ) {
          socket.emit("error", {
            message:
              "Unauthorized to send message in this chat",
          });
          return;
        }

        // Create message object
        const newMessage = {
          sender: socket.userId,
          message,
          messageType,
          timestamp: new Date(),
          status: "sent",
        };

        // Add message to chat
        chat.messages.push(newMessage);

        // Update unread status for other participants
        chat.unreadBy = chat.participants.filter(
          (p) => p.toString() !== socket.userId
        );

        // Update last message info
        chat.lastMessage = {
          content: message,
          sender: socket.userId,
          timestamp: new Date(),
        };

        await chat.save();

        // Get the saved message with populated sender info
        const savedChat = await Chat.findById(
          chatId
        ).populate({
          path: "messages.sender",
          select: "name profilePicture",
        });

        const savedMessage =
          savedChat.messages[
            savedChat.messages.length - 1
          ];

        // Emit message to all participants in the chat room
        io.to(`chat_${chatId}`).emit(
          "new_message",
          {
            chatId,
            message: savedMessage,
          }
        );

        // Send push notification to other participants (if they're not in the chat)
        const otherParticipants =
          chat.participants.filter(
            (p) => p.toString() !== socket.userId
          );
        otherParticipants.forEach(
          (participantId) => {
            io.to(`user_${participantId}`).emit(
              "message_notification",
              {
                chatId,
                sender: {
                  id: socket.userId,
                  name: socket.user.name,
                  profilePicture:
                    socket.user.profilePicture,
                },
                preview:
                  message.length > 50
                    ? message.substring(0, 50) +
                      "..."
                    : message,
                timestamp: new Date(),
              }
            );
          }
        );

        console.log(
          `Message sent in chat ${chatId} by ${socket.user.name}`
        );
      } catch (error) {
        console.error(
          "Error sending message:",
          error
        );
        socket.emit("error", {
          message: "Failed to send message",
        });
      }
    });

    // Mark messages as read
    socket.on("mark_as_read", async (data) => {
      try {
        const { chatId } = data;

        await Chat.findByIdAndUpdate(
          chatId,
          {
            $pull: { unreadBy: socket.userId },
            $set: {
              "messages.$[elem].readBy":
                socket.userId,
            },
          },
          {
            arrayFilters: [
              {
                "elem.sender": {
                  $ne: socket.userId,
                },
              },
            ],
          }
        );

        // Notify other participants that messages were read
        socket
          .to(`chat_${chatId}`)
          .emit("messages_read", {
            chatId,
            readBy: socket.userId,
          });

        console.log(
          `Messages marked as read in chat ${chatId} by ${socket.user.name}`
        );
      } catch (error) {
        console.error(
          "Error marking messages as read:",
          error
        );
        socket.emit("error", {
          message:
            "Failed to mark messages as read",
        });
      }
    });

    // Typing indicators
    socket.on("typing_start", (data) => {
      const { chatId } = data;
      socket
        .to(`chat_${chatId}`)
        .emit("user_typing", {
          chatId,
          userId: socket.userId,
          userName: socket.user.name,
        });
    });

    socket.on("typing_stop", (data) => {
      const { chatId } = data;
      socket
        .to(`chat_${chatId}`)
        .emit("user_stopped_typing", {
          chatId,
          userId: socket.userId,
        });
    });

    // Handle ride request notifications
    socket.on("send_ride_request", (data) => {
      const { driverId, rideId, passengerInfo } =
        data;

      io.to(`user_${driverId}`).emit(
        "ride_request_received",
        {
          rideId,
          passenger: {
            id: socket.userId,
            name: socket.user.name,
            profilePicture:
              socket.user.profilePicture,
            rating: socket.user.rating,
            ...passengerInfo,
          },
          timestamp: new Date(),
        }
      );

      console.log(
        `Ride request sent from ${socket.user.name} to driver ${driverId}`
      );
    });

    // Handle ride request responses
    socket.on("respond_ride_request", (data) => {
      const {
        passengerId,
        rideId,
        status,
        message,
      } = data;

      io.to(`user_${passengerId}`).emit(
        "ride_request_response",
        {
          rideId,
          status, // 'accepted' or 'rejected'
          message,
          driver: {
            id: socket.userId,
            name: socket.user.name,
            profilePicture:
              socket.user.profilePicture,
          },
          timestamp: new Date(),
        }
      );

      console.log(
        `Ride request ${status} by ${socket.user.name} for passenger ${passengerId}`
      );
    });

    // Handle location updates during ride
    socket.on("location_update", (data) => {
      const { rideId, location, passengers } =
        data;

      // Send location update to all passengers
      passengers.forEach((passengerId) => {
        io.to(`user_${passengerId}`).emit(
          "driver_location_update",
          {
            rideId,
            location,
            timestamp: new Date(),
          }
        );
      });
    });

    // Handle ride status updates
    socket.on("ride_status_update", (data) => {
      const {
        rideId,
        status,
        participants,
        message,
      } = data;

      // Notify all participants about ride status change
      participants.forEach((participantId) => {
        if (participantId !== socket.userId) {
          io.to(`user_${participantId}`).emit(
            "ride_status_changed",
            {
              rideId,
              status,
              message,
              updatedBy: {
                id: socket.userId,
                name: socket.user.name,
              },
              timestamp: new Date(),
            }
          );
        }
      });

      console.log(
        `Ride ${rideId} status updated to ${status} by ${socket.user.name}`
      );
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(
        `User ${socket.user.name} disconnected from socket ID: ${socket.id}`
      );

      // Notify all chat rooms that user went offline
      if (socket.currentChatId) {
        socket
          .to(`chat_${socket.currentChatId}`)
          .emit("user_offline", {
            userId: socket.userId,
            userName: socket.user.name,
          });
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(
        `Socket error for user ${socket.user.name}:`,
        error
      );
    });
  });

  // Handle connection errors
  io.on("connect_error", (error) => {
    console.error(
      "Socket.IO connection error:",
      error
    );
  });
};

module.exports = chatSocket;
