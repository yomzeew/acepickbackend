import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { socketAuthorize } from './middlewares/authorize';
import prisma from './config/prisma';
import config from './config/configSetup';
import { Emit, Listen } from './utils/events';
import { ChatMessage, getContacts, getMsgs, getPrevChats, joinRoom, leaveRoom, onConnect, onDisconnect, sendMessage, uploadFile } from './controllers/socket/chat';
import { NotificationService } from './services/notification';
import { NotificationType } from './utils/enum';
import { encryptMessage } from './utils/cryptography';
import { randomId } from './utils/modules';

let io: Server;

const RING_TIMEOUT_MS = 60_000; // 1 minute

// Track ringing calls: key = callerId, value = { timeout, receiverId, callType, deviceId }
interface RingingCall { 
  timeout: NodeJS.Timeout; 
  receiverId: string; 
  callType: 'voice' | 'video';
  deviceId?: string;
}
const ringingCalls = new Map<string, RingingCall>();

// Track active calls by user and device: key = userId, value = Map<deviceId, socketId>
const activeCallsByUser = new Map<string, Map<string, string>>();

const findOnlinePartner = async (userId: string) => {
    return prisma.onlineUser.findFirst({ where: { userId, isOnline: true } });
};

/** Register a device for a user when they connect */
const registerDevice = (userId: string, deviceId: string, socketId: string) => {
    if (!activeCallsByUser.has(userId)) {
        activeCallsByUser.set(userId, new Map());
    }
    activeCallsByUser.get(userId)!.set(deviceId, socketId);
    console.log(`[device-register] User ${userId} device ${deviceId} socket ${socketId}`);
};

/** Unregister a device when they disconnect */
const unregisterDevice = (userId: string, deviceId: string) => {
    const userDevices = activeCallsByUser.get(userId);
    if (userDevices) {
        userDevices.delete(deviceId);
        if (userDevices.size === 0) {
            activeCallsByUser.delete(userId);
        }
    }
    console.log(`[device-unregister] User ${userId} device ${deviceId}`);
};

/** Get all active devices for a user */
const getUserDevices = (userId: string): Map<string, string> | null => {
    return activeCallsByUser.get(userId) || null;
};

/** Find specific device socket for a user */
const findUserDevice = (userId: string, deviceId: string): string | null => {
    const userDevices = activeCallsByUser.get(userId);
    return userDevices?.get(deviceId) || null;
};

/** Find or create a chat room between two users and save a missed call message */
const saveMissedCallMessage = async (callerId: string, receiverId: string, callType: 'voice' | 'video') => {
    try {
        // Find existing chat room
        let room = await prisma.chatRoom.findFirst({
            where: {
                AND: [
                    { members: { contains: callerId } },
                    { members: { contains: receiverId } }
                ]
            }
        });

        // Create room if it doesn't exist
        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    name: randomId(12),
                    members: `${callerId},${receiverId}`
                }
            });
        }

        const msgText = `<missedcall>${callType}`;

        const message = await prisma.message.create({
            data: {
                text: encryptMessage(msgText),
                from: callerId,
                timestamp: new Date(),
                chatroomId: room.id
            }
        });

        // Emit to room so both parties see it in real-time
        io.to(room.name).emit(Emit.RECV_MSG, {
            from: callerId,
            to: receiverId,
            text: msgText,
            room: room.name,
            timestamp: message.timestamp,
        });

        console.log(`[missed-call] ${callType} call from ${callerId} to ${receiverId} saved to room ${room.name}`);
    } catch (error) {
        console.error('[missed-call] Error saving missed call message:', error);
    }
};

/** Start tracking a ringing call with 60s timeout */
const startRingTimeout = (callerId: string, receiverId: string, callType: 'voice' | 'video') => {
    // Clear any existing timeout for this caller
    clearRingTimeout(callerId);

    const timeout = setTimeout(async () => {
        console.log(`[ring-timeout] ${callType} call from ${callerId} to ${receiverId} timed out after 60s`);
        ringingCalls.delete(callerId);

        // Notify caller
        const callerOnline = await findOnlinePartner(callerId);
        if (callerOnline) {
            io.to(callerOnline.socketId).emit('call-timeout', { to: receiverId, callType });
        }

        // Notify receiver to stop ringing
        const receiverOnline = await findOnlinePartner(receiverId);
        if (receiverOnline) {
            io.to(receiverOnline.socketId).emit(callType === 'video' ? 'video-call-ended' : 'call-ended', { from: callerId });
        }

        // Save missed call to chat
        await saveMissedCallMessage(callerId, receiverId, callType);
    }, RING_TIMEOUT_MS);

    ringingCalls.set(callerId, { timeout, receiverId, callType });
};

/** Clear ringing timeout for a caller */
const clearRingTimeout = (callerId: string) => {
    const entry = ringingCalls.get(callerId);
    if (entry) {
        clearTimeout(entry.timeout);
        ringingCalls.delete(callerId);
    }
};

export const initSocket = (httpServer: any) => {
    io = new Server(httpServer, {
        path: '/chat',
        cors: {
            origin: "*",
        }
    });

    // Attach Redis adapter for multi-instance Socket.IO scaling (only if Redis is configured)
    if (config.REDIS_INSTANCE_URL || config.REDIS_HOST) {
        try {
            let pubClient: Redis;
            if (config.REDIS_INSTANCE_URL) {
                const useTls = config.REDIS_INSTANCE_URL.startsWith('rediss://');
                pubClient = new Redis(config.REDIS_INSTANCE_URL, {
                    ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
                });
            } else {
                pubClient = new Redis({
                    host: config.REDIS_HOST,
                    port: config.REDIS_PORT || 6379,
                    ...(config.REDIS_PASSWORD ? { password: config.REDIS_PASSWORD } : {}),
                });
            }
            const subClient = pubClient.duplicate();
            io.adapter(createAdapter(pubClient, subClient));
            console.log('✅ Socket.IO Redis adapter attached');
        } catch (error) {
            console.warn('⚠️ Socket.IO Redis adapter failed, falling back to in-memory:', error);
        }
    } else {
        console.log('ℹ️ Socket.IO using in-memory adapter (no Redis configured)');
    }

    io.use(async (socket, next) => {
        console.log('Attempting to connect...')
        await socketAuthorize(socket, next);
    });

    io.on("connection_error", (err) => {
        console.error("Connection error:", err);
    });

    io.on(Listen.CONNECTION, async (socket) => {
        await onConnect(socket)

        // Register device if device ID is available
        const userId = (socket as any).user?.id;
        const deviceId = (socket as any).deviceId;
        
        if (userId && deviceId) {
            registerDevice(userId, deviceId, socket.id);
        }

        socket.emit(Emit.CONNECTED, socket.id)

        socket.on('call-user', async (data: any) => {
            try {
                console.log(`[call-user] from=${socket.user.id} device=${socket.deviceId} to=${data.to}`);
                if (!data.to || typeof data.to !== 'string' || data.to.length === 0) {
                    console.log(`[call-user] REJECTED: invalid data.to = ${JSON.stringify(data.to)}`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'Invalid recipient' });
                    return;
                }
                
                const callerId = socket.user.id;
                const callerDeviceId = socket.deviceId;
                const partner = await findOnlinePartner(data.to);
                
                console.log(`[call-user] findOnlinePartner result:`, partner ? { socketId: partner.socketId, isOnline: partner.isOnline } : null);
                
                // Always send push — app may be backgrounded while socket is still alive
                const caller = await prisma.user.findFirst({ where: { id: callerId }, include: { profile: true } });
                const callerName = `${caller?.profile?.firstName} ${caller?.profile?.lastName}`;

                // Start ring timeout with device tracking
                startRingTimeout(callerId, data.to, 'voice');

                // Send push notification
                await NotificationService.create({
                    userId: data.to,
                    type: NotificationType.CHAT,
                    title: 'Incoming Voice Call',
                    message: `${callerName} is calling you`,
                    data: { callerId, callType: 'voice', deviceId: callerDeviceId }
                });

                if (partner) {
                    // Route to specific device or all devices if no device specified
                    const targetDeviceId = data.targetDeviceId;
                    let targetSocketId: string | null = null;
                    
                    if (targetDeviceId) {
                        // Route to specific device
                        targetSocketId = findUserDevice(data.to, targetDeviceId);
                        console.log(`[call-user] Routing to specific device ${targetDeviceId}:`, targetSocketId);
                    } else {
                        // Route to first available device
                        const userDevices = getUserDevices(data.to);
                        if (userDevices && userDevices.size > 0) {
                            targetSocketId = userDevices.values().next().value;
                            console.log(`[call-user] Routing to first available device:`, targetSocketId);
                        }
                    }
                    
                    if (targetSocketId) {
                        io.to(targetSocketId).emit('call-made', {
                            offer: data.offer,
                            from: callerId,
                            deviceId: callerDeviceId,
                        });
                        console.log(`[call-user] Voice call routed to socket ${targetSocketId}`);
                    } else {
                        console.log(`[call-user] No active device found for user ${data.to}`);
                        socket.emit('call-unavailable', { to: data.to, reason: 'User offline' });
                    }
                } else {
                    console.log(`[call-user] Partner ${data.to} not online`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'User offline' });
                    // Save missed call to chat
                    await saveMissedCallMessage(callerId, data.to, 'voice');
                }
            } catch (error) {
                console.error('call-user error:', error);
                socket.emit('call-unavailable', { to: data.to });
            }
        });

        socket.on('make-answer', async (data: any) => {
            try {
                if (!data.to) return;
                // Call answered — clear the ring timeout
                clearRingTimeout(data.to);
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('answer-made', {
                    answer: data.answer,
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('make-answer error:', error);
            }
        });

        socket.on('ice-candidate', async (data: any) => {
            try {
                if (!data.to) return;
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('ice-candidate', {
                    candidate: data.candidate,
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('ice-candidate error:', error);
            }
        });

        socket.on('end-call', async (data: any) => {
            try {
                if (!data.to) return;
                // Check if call was never answered (still ringing) — save missed call
                const ringing = ringingCalls.get(socket.user.id);
                if (ringing && ringing.receiverId === data.to) {
                    clearRingTimeout(socket.user.id);
                    await saveMissedCallMessage(socket.user.id, data.to, 'voice');
                } else {
                    clearRingTimeout(socket.user.id);
                    clearRingTimeout(data.to);
                }
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('call-ended', {
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('end-call error:', error);
            }
        });

        socket.on('reject-call', async (data: any) => {
            try {
                if (!data.to) return;
                // Receiver rejected — clear timeout, save missed call
                clearRingTimeout(data.to);
                await saveMissedCallMessage(data.to, socket.user.id, 'voice');
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('call-rejected', {
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('reject-call error:', error);
            }
        });

        socket.on('video-call-user', async (data: any) => {
            try {
                console.log(`[video-call-user] from=${socket.user.id} to=${data.to}`);
                if (!data.to || typeof data.to !== 'string' || data.to.length === 0) {
                    console.log(`[video-call-user] REJECTED: invalid data.to = ${JSON.stringify(data.to)}`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'Invalid recipient' });
                    return;
                }
                const partner = await findOnlinePartner(data.to);
                console.log(`[video-call-user] findOnlinePartner result:`, partner ? { socketId: partner.socketId, isOnline: partner.isOnline } : null);
                // Always send push — app may be backgrounded while socket is still alive
                const videoCaller = await prisma.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                const videoCallerName = `${videoCaller?.profile?.firstName} ${videoCaller?.profile?.lastName}`;
                await NotificationService.create({
                    userId: data.to,
                    type: NotificationType.CHAT,
                    title: `${videoCallerName} is video calling you`,
                    message: 'Incoming video call',
                    data: { type: 'call', callType: 'video', callerId: socket.user.id, callerName: videoCallerName },
                    channelId: 'calls',
                    priority: 'high',
                    categoryId: 'INCOMING_CALL',
                });

                if (partner) {
                    io.to(partner.socketId).emit('video-call-made', {
                        offer: data.offer,
                        from: socket.user.id,
                    });
                    // Start 60s ring timeout
                    startRingTimeout(socket.user.id, data.to, 'video');
                } else {
                    socket.emit('call-unavailable', { to: data.to });
                    // User offline — save missed call immediately
                    await saveMissedCallMessage(socket.user.id, data.to, 'video');
                }
            } catch (error) {
                console.error('video-call-user error:', error);
                socket.emit('call-unavailable', { to: data.to });
            }
        });

        socket.on('video-make-answer', async (data: any) => {
            try {
                if (!data.to) return;
                // Video call answered — clear the ring timeout
                clearRingTimeout(data.to);
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('video-answer-made', {
                    answer: data.answer,
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('video-make-answer error:', error);
            }
        });

        socket.on('video-ice-candidate', async (data: any) => {
            try {
                if (!data.to) return;
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('video-ice-candidate', {
                    candidate: data.candidate,
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('video-ice-candidate error:', error);
            }
        });

        socket.on('video-end-call', async (data: any) => {
            try {
                if (!data.to) return;
                // Check if video call was never answered — save missed call
                const ringing = ringingCalls.get(socket.user.id);
                if (ringing && ringing.receiverId === data.to) {
                    clearRingTimeout(socket.user.id);
                    await saveMissedCallMessage(socket.user.id, data.to, 'video');
                } else {
                    clearRingTimeout(socket.user.id);
                    clearRingTimeout(data.to);
                }
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('video-call-ended', {
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('video-end-call error:', error);
            }
        });

        socket.on('video-reject-call', async (data: any) => {
            try {
                if (!data.to) return;
                // Receiver rejected video — clear timeout, save missed call
                clearRingTimeout(data.to);
                await saveMissedCallMessage(data.to, socket.user.id, 'video');
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('video-call-rejected', {
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('video-reject-call error:', error);
            }
        });

        socket.on(Listen.UPLOAD_FILE, (data: any) => uploadFile(io, socket, data));

        socket.on(Listen.SEND_MSG, async (data: ChatMessage) => await sendMessage(io, socket, data));

        socket.on(Listen.DISCONNECT, () => onDisconnect(socket));

        socket.on(Listen.GET_CONTACTS, () => getContacts(io, socket));

        socket.on(Listen.JOIN_ROOM, (data: any) => joinRoom(io, socket, data))

        socket.on(Listen.LEAVE_ROOM, (data: any) => leaveRoom(io, socket, data))

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

