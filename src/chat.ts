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

// Track active calls with start time: key = "callerId-receiverId", value = { startTime, callType }
interface ActiveCall {
  startTime: number;
  callType: 'voice' | 'video';
  callerId: string;
  receiverId: string;
}
const activeCalls = new Map<string, ActiveCall>();

// Helper to create call key
const getCallKey = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('-');
};

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
    console.log(`[device-register] User ${userId} now has ${activeCallsByUser.get(userId)!.size} devices`);
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

/** Save a completed call with duration to chat history */
const saveCompletedCallMessage = async (callerId: string, receiverId: string, callType: 'voice' | 'video', durationSeconds: number) => {
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

        const msgText = `<completedcall>${callType}:${durationSeconds}`;

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

        console.log(`[completed-call] ${callType} call from ${callerId} to ${receiverId} with duration ${durationSeconds}s saved to room ${room.name}`);
    } catch (error) {
        console.error('[completed-call] Error saving completed call message:', error);
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
        
        console.log(`[socket-connect] User ${userId} device ${deviceId} socket ${socket.id}`);
        
        if (userId && deviceId) {
            registerDevice(userId, deviceId, socket.id);
        } else {
            console.log(`[socket-connect] Missing device registration - userId: ${!!userId}, deviceId: ${!!deviceId}`);
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
                
                // Check device map FIRST (most current state)
                const userDevices = getUserDevices(data.to);
                console.log(`[call-user] Device map for user ${data.to}:`, userDevices ? `Found ${userDevices.size} devices` : 'No devices found');
                
                // Fallback to database if device map is empty
                const partner = await findOnlinePartner(data.to);
                console.log(`[call-user] Database lookup for user ${data.to}:`, partner ? { socketId: partner.socketId, isOnline: partner.isOnline } : 'Not found');
                
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

                // Try device map first, then database fallback
                let targetSocketId: string | null = null;
                let foundVia = '';
                
                if (userDevices && userDevices.size > 0) {
                    // Route to first available device from device map
                    targetSocketId = userDevices.values().next().value;
                    foundVia = 'device-map';
                    console.log(`[call-user] Found via device map, socket: ${targetSocketId}`);
                } else if (partner) {
                    // Fallback to database socket
                    targetSocketId = partner.socketId;
                    foundVia = 'database';
                    console.log(`[call-user] Found via database, socket: ${targetSocketId}`);
                }
                
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call-made', {
                        offer: data.offer,
                        from: callerId,
                        deviceId: callerDeviceId,
                    });
                    console.log(`[call-user] Voice call routed via ${foundVia} to socket ${targetSocketId}`);
                } else {
                    console.log(`[call-user] No active device found for user ${data.to} via device map or database`);
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

                // Track call start time
                const callKey = getCallKey(socket.user.id, data.to);
                activeCalls.set(callKey, {
                    startTime: Date.now(),
                    callType: 'voice',
                    callerId: data.to,
                    receiverId: socket.user.id
                });
                console.log(`[call-started] Voice call between ${data.to} and ${socket.user.id}`);

                // Try device map first (most current socket)
                const callerDevices = getUserDevices(data.to);
                const targetDeviceId = data.deviceId;
                let targetSocketId: string | null = null;

                if (targetDeviceId && callerDevices) {
                    targetSocketId = callerDevices.get(targetDeviceId) || null;
                    console.log(`[make-answer] Routing to specific device ${targetDeviceId}:`, targetSocketId);
                }
                
                if (!targetSocketId && callerDevices && callerDevices.size > 0) {
                    targetSocketId = callerDevices.values().next().value;
                    console.log(`[make-answer] Routing to first available device:`, targetSocketId);
                }

                // Fallback to DB if device map is empty (reconnect edge case)
                if (!targetSocketId) {
                    const partner = await findOnlinePartner(data.to);
                    targetSocketId = partner?.socketId || null;
                    console.log(`[make-answer] Fallback to DB socket:`, targetSocketId);
                }

                if (targetSocketId) {
                    io.to(targetSocketId).emit('answer-made', {
                        answer: data.answer,
                        to: socket.user.id,
                        deviceId: socket.deviceId,
                    });
                    console.log(`[make-answer] Answer routed to socket ${targetSocketId}`);
                } else {
                    console.log(`[make-answer] No active device found for user ${data.to}`);
                }
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
                
                // Calculate call duration if call was active
                const callKey = getCallKey(socket.user.id, data.to);
                const activeCall = activeCalls.get(callKey);
                
                if (activeCall) {
                    // Call was answered and is now ending - save with duration
                    const durationSeconds = Math.floor((Date.now() - activeCall.startTime) / 1000);
                    activeCalls.delete(callKey);
                    
                    // Save completed call with duration
                    await saveCompletedCallMessage(socket.user.id, data.to, 'voice', durationSeconds);
                    console.log(`[call-ended] Voice call between ${socket.user.id} and ${data.to} lasted ${durationSeconds}s`);
                } else {
                    // Check if call was never answered (still ringing) — save missed call
                    const ringing = ringingCalls.get(socket.user.id);
                    if (ringing && ringing.receiverId === data.to) {
                        clearRingTimeout(socket.user.id);
                        await saveMissedCallMessage(socket.user.id, data.to, 'voice');
                    } else {
                        clearRingTimeout(socket.user.id);
                        clearRingTimeout(data.to);
                    }
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

        socket.on('call-busy', async (data: any) => {
            try {
                if (!data.to) return;
                console.log(`[call-busy] User ${socket.user.id} is busy, rejecting call from ${data.to}`);
                // Clear timeout for the incoming caller
                clearRingTimeout(data.to);
                // Notify the caller that the user is busy
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('call-busy', {
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('call-busy error:', error);
            }
        });

        socket.on('video-call-user', async (data: any) => {
            try {
                console.log(`[video-call-user] from=${socket.user.id} device=${socket.deviceId} to=${data.to}`);
                if (!data.to || typeof data.to !== 'string' || data.to.length === 0) {
                    console.log(`[video-call-user] REJECTED: invalid data.to = ${JSON.stringify(data.to)}`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'Invalid recipient' });
                    return;
                }
                
                const callerId = socket.user.id;
                const callerDeviceId = socket.deviceId;
                
                // Check device map FIRST (most current state)
                const userDevices = getUserDevices(data.to);
                console.log(`[video-call-user] Device map for user ${data.to}:`, userDevices ? `Found ${userDevices.size} devices` : 'No devices found');
                
                // Fallback to database if device map is empty
                const partner = await findOnlinePartner(data.to);
                console.log(`[video-call-user] Database lookup for user ${data.to}:`, partner ? { socketId: partner.socketId, isOnline: partner.isOnline } : 'Not found');
                
                // Always send push — app may be backgrounded while socket is still alive
                const videoCaller = await prisma.user.findFirst({ where: { id: callerId }, include: { profile: true } });
                const videoCallerName = `${videoCaller?.profile?.firstName} ${videoCaller?.profile?.lastName}`;
                
                // Start ring timeout with device tracking
                startRingTimeout(callerId, data.to, 'video');
                
                await NotificationService.create({
                    userId: data.to,
                    type: NotificationType.CHAT,
                    title: 'Incoming Video Call',
                    message: `${videoCallerName} is video calling you`,
                    data: { type: 'call', callType: 'video', callerId, callerName: videoCallerName, deviceId: callerDeviceId },
                    channelId: 'calls',
                    priority: 'high',
                    categoryId: 'INCOMING_CALL',
                });

                // Try device map first, then database fallback
                let targetSocketId: string | null = null;
                let foundVia = '';
                
                if (userDevices && userDevices.size > 0) {
                    // Route to first available device from device map
                    targetSocketId = userDevices.values().next().value;
                    foundVia = 'device-map';
                    console.log(`[video-call-user] Found via device map, socket: ${targetSocketId}`);
                } else if (partner) {
                    // Fallback to database socket
                    targetSocketId = partner.socketId;
                    foundVia = 'database';
                    console.log(`[video-call-user] Found via database, socket: ${targetSocketId}`);
                }
                
                if (targetSocketId) {
                    io.to(targetSocketId).emit('video-call-made', {
                        offer: data.offer,
                        from: callerId,
                        deviceId: callerDeviceId,
                    });
                    console.log(`[video-call-user] Video call routed via ${foundVia} to socket ${targetSocketId}`);
                } else {
                    console.log(`[video-call-user] No active device found for user ${data.to} via device map or database`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'User offline' });
                    // Save missed call to chat
                    await saveMissedCallMessage(callerId, data.to, 'video');
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

                // Track video call start time
                const callKey = getCallKey(socket.user.id, data.to);
                activeCalls.set(callKey, {
                    startTime: Date.now(),
                    callType: 'video',
                    callerId: data.to,
                    receiverId: socket.user.id
                });
                console.log(`[video-call-started] Video call between ${data.to} and ${socket.user.id}`);

                // Try device map first (most current socket)
                const callerDevices = getUserDevices(data.to);
                const targetDeviceId = data.deviceId;
                let targetSocketId: string | null = null;

                if (targetDeviceId && callerDevices) {
                    targetSocketId = callerDevices.get(targetDeviceId) || null;
                    console.log(`[video-make-answer] Routing to specific device ${targetDeviceId}:`, targetSocketId);
                }
                
                if (!targetSocketId && callerDevices && callerDevices.size > 0) {
                    targetSocketId = callerDevices.values().next().value;
                    console.log(`[video-make-answer] Routing to first available device:`, targetSocketId);
                }

                // Fallback to DB if device map is empty (reconnect edge case)
                if (!targetSocketId) {
                    const partner = await findOnlinePartner(data.to);
                    targetSocketId = partner?.socketId || null;
                    console.log(`[video-make-answer] Fallback to DB socket:`, targetSocketId);
                }

                if (targetSocketId) {
                    io.to(targetSocketId).emit('video-answer-made', {
                        answer: data.answer,
                        to: socket.user.id,
                        deviceId: socket.deviceId,
                    });
                    console.log(`[video-make-answer] Video answer routed to socket ${targetSocketId}`);
                } else {
                    console.log(`[video-make-answer] No active device found for user ${data.to}`);
                }
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
                
                // Calculate video call duration if call was active
                const callKey = getCallKey(socket.user.id, data.to);
                const activeCall = activeCalls.get(callKey);
                
                if (activeCall) {
                    // Call was answered and is now ending - save with duration
                    const durationSeconds = Math.floor((Date.now() - activeCall.startTime) / 1000);
                    activeCalls.delete(callKey);
                    
                    // Save completed video call with duration
                    await saveCompletedCallMessage(socket.user.id, data.to, 'video', durationSeconds);
                    console.log(`[video-call-ended] Video call between ${socket.user.id} and ${data.to} lasted ${durationSeconds}s`);
                } else {
                    // Check if video call was never answered — save missed call
                    const ringing = ringingCalls.get(socket.user.id);
                    if (ringing && ringing.receiverId === data.to) {
                        clearRingTimeout(socket.user.id);
                        await saveMissedCallMessage(socket.user.id, data.to, 'video');
                    } else {
                        clearRingTimeout(socket.user.id);
                        clearRingTimeout(data.to);
                    }
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

        socket.on('video-call-busy', async (data: any) => {
            try {
                if (!data.to) return;
                console.log(`[video-call-busy] User ${socket.user.id} is busy, rejecting video call from ${data.to}`);
                // Clear timeout for the incoming caller
                clearRingTimeout(data.to);
                // Notify the caller that the user is busy
                const partner = await findOnlinePartner(data.to);
                if (!partner) return;
                io.to(partner.socketId).emit('video-call-busy', {
                    from: socket.user.id,
                });
            } catch (error) {
                console.error('video-call-busy error:', error);
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

