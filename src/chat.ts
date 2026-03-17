import { Server } from 'socket.io';
import { socketAuthorize } from './middlewares/authorize';
import prisma from './config/prisma';
import { Emit, Listen } from './utils/events';
import { ChatMessage, getContacts, getMsgs, getPrevChats, joinRoom, onConnect, onDisconnect, sendMessage, uploadFile } from './controllers/socket/chat';
import { NotificationService } from './services/notification';
import { NotificationType } from './utils/enum';

let io: Server;

const findOnlinePartner = async (userId: string) => {
    return prisma.onlineUser.findFirst({ where: { userId } });
};

export const initSocket = (httpServer: any) => {
    io = new Server(httpServer, {
        path: '/chat',
        cors: {
            origin: "*",
        }
    });

    io.use(async (socket, next) => {
        console.log('Attempting to connect...')
        await socketAuthorize(socket, next);
    });

    io.on("connection_error", (err) => {
        console.error("Connection error:", err);
    });

    io.on(Listen.CONNECTION, async (socket) => {
        await onConnect(socket)

        socket.emit(Emit.CONNECTED, socket.id)

        socket.on('call-user', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (partner) {
                io.to(partner.socketId).emit('call-made', {
                    offer: data.offer,
                    from: socket.user.id,
                });
            } else {
                // Recipient is offline — store + push notification
                const caller = await prisma.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                const callerName = `${caller?.profile?.firstName} ${caller?.profile?.lastName}`;
                await NotificationService.create({
                    userId: data.to,
                    type: NotificationType.CHAT,
                    title: `${callerName} is calling you`,
                    message: 'You have a missed voice call',
                    data: { type: 'call', callType: 'voice', callerId: socket.user.id, callerName },
                });
            }
        });

        socket.on('make-answer', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('answer-made', {
                answer: data.answer,
                from: socket.user.id,
            });
        });

        socket.on('ice-candidate', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('ice-candidate', {
                candidate: data.candidate,
                from: socket.user.id,
            });
        });

        socket.on('end-call', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('call-ended', {
                from: socket.user.id,
            });
        })

        socket.on('reject-call', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('call-rejected', {
                from: socket.user.id,
            })
        })

        socket.on('video-call-user', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (partner) {
                io.to(partner.socketId).emit('video-call-made', {
                    offer: data.offer,
                    from: socket.user.id,
                });
            } else {
                // Recipient is offline — store + push notification
                const caller = await prisma.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                const callerName = `${caller?.profile?.firstName} ${caller?.profile?.lastName}`;
                await NotificationService.create({
                    userId: data.to,
                    type: NotificationType.CHAT,
                    title: `${callerName} is video calling you`,
                    message: 'You have a missed video call',
                    data: { type: 'call', callType: 'video', callerId: socket.user.id, callerName },
                });
            }
        });

        socket.on('video-make-answer', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('video-answer-made', {
                answer: data.answer,
                from: socket.user.id,
            });
        });

        socket.on('video-ice-candidate', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('video-ice-candidate', {
                candidate: data.candidate,
                from: socket.user.id,
            });
        });

        socket.on('video-end-call', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('video-call-ended', {
                from: socket.user.id,
            });
        })

        socket.on('video-reject-call', async (data: any) => {
            const partner = await findOnlinePartner(data.to);
            if (!partner) return
            io.to(partner.socketId).emit('video-call-rejected', {
                from: socket.user.id,
            })
        })

        socket.on(Listen.UPLOAD_FILE, (data: any) => uploadFile(io, socket, data));

        socket.on(Listen.SEND_MSG, async (data: ChatMessage) => await sendMessage(io, socket, data));

        socket.on(Listen.DISCONNECT, () => onDisconnect(socket));

        socket.on(Listen.GET_CONTACTS, () => getContacts(io, socket));

        socket.on(Listen.JOIN_ROOM, (data: any) => joinRoom(io, socket, data))

        socket.on(Listen.GET_MSGs, (data: any) => getMsgs(io, socket, data))

        socket.on(Listen.PREV_CHATS, (data: any) => getPrevChats(io, socket, data))
    });

    return io;
}

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

