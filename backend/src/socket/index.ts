import { Server, Socket } from 'socket.io';
// import { Message } from '../models/message';

export const initializeSocket = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.info(`User connected: ${socket.id}`);

    // Join user to their own room based on Clerk userId
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.info(`User ${userId} joined room`);
    });

    // Handle sending a message
    // socket.on('sendMessage', async (data: { senderId: string; receiverId: string; text: string }) => {
    //   try {
    //     const { senderId, receiverId, text } = data;
    //     const message = await Message.create({ senderId, receiverId, text });
    //     io.to(receiverId).emit('receiveMessage', message);
    //     io.to(senderId).emit('receiveMessage', message); // Echo back to sender
    //     console.info(`Message sent from ${senderId} to ${receiverId}: ${message._id}`);
    //   } catch (error) {
    //     console.error('Socket send message error:', error);
    //   }
    // });
    

    socket.on('disconnect', () => {
      console.info(`User disconnected: ${socket.id}`);
    });
  });
};
