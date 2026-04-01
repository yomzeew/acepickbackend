"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const authorize_1 = require("./middlewares/authorize");
const prisma_1 = __importDefault(require("./config/prisma"));
const configSetup_1 = __importDefault(require("./config/configSetup"));
const events_1 = require("./utils/events");
const chat_1 = require("./controllers/socket/chat");
const notification_1 = require("./services/notification");
const enum_1 = require("./utils/enum");
const cryptography_1 = require("./utils/cryptography");
const modules_1 = require("./utils/modules");
let io;
const RING_TIMEOUT_MS = 60000; // 1 minute
const ringingCalls = new Map();
const findOnlinePartner = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.onlineUser.findFirst({ where: { userId, isOnline: true } });
});
/** Find or create a chat room between two users and save a missed call message */
const saveMissedCallMessage = (callerId, receiverId, callType) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find existing chat room
        let room = yield prisma_1.default.chatRoom.findFirst({
            where: {
                AND: [
                    { members: { contains: callerId } },
                    { members: { contains: receiverId } }
                ]
            }
        });
        // Create room if it doesn't exist
        if (!room) {
            room = yield prisma_1.default.chatRoom.create({
                data: {
                    name: (0, modules_1.randomId)(12),
                    members: `${callerId},${receiverId}`
                }
            });
        }
        const msgText = `<missedcall>${callType}`;
        const message = yield prisma_1.default.message.create({
            data: {
                text: (0, cryptography_1.encryptMessage)(msgText),
                from: callerId,
                timestamp: new Date(),
                chatroomId: room.id
            }
        });
        // Emit to room so both parties see it in real-time
        io.to(room.name).emit(events_1.Emit.RECV_MSG, {
            from: callerId,
            to: receiverId,
            text: msgText,
            room: room.name,
            timestamp: message.timestamp,
        });
        console.log(`[missed-call] ${callType} call from ${callerId} to ${receiverId} saved to room ${room.name}`);
    }
    catch (error) {
        console.error('[missed-call] Error saving missed call message:', error);
    }
});
/** Start tracking a ringing call with 60s timeout */
const startRingTimeout = (callerId, receiverId, callType) => {
    // Clear any existing timeout for this caller
    clearRingTimeout(callerId);
    const timeout = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`[ring-timeout] ${callType} call from ${callerId} to ${receiverId} timed out after 60s`);
        ringingCalls.delete(callerId);
        // Notify caller
        const callerOnline = yield findOnlinePartner(callerId);
        if (callerOnline) {
            io.to(callerOnline.socketId).emit('call-timeout', { to: receiverId, callType });
        }
        // Notify receiver to stop ringing
        const receiverOnline = yield findOnlinePartner(receiverId);
        if (receiverOnline) {
            io.to(receiverOnline.socketId).emit(callType === 'video' ? 'video-call-ended' : 'call-ended', { from: callerId });
        }
        // Save missed call to chat
        yield saveMissedCallMessage(callerId, receiverId, callType);
    }), RING_TIMEOUT_MS);
    ringingCalls.set(callerId, { timeout, receiverId, callType });
};
/** Clear ringing timeout for a caller */
const clearRingTimeout = (callerId) => {
    const entry = ringingCalls.get(callerId);
    if (entry) {
        clearTimeout(entry.timeout);
        ringingCalls.delete(callerId);
    }
};
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        path: '/chat',
        cors: {
            origin: "*",
        }
    });
    // Attach Redis adapter for multi-instance Socket.IO scaling (only if Redis is configured)
    if (configSetup_1.default.REDIS_INSTANCE_URL || configSetup_1.default.REDIS_HOST) {
        try {
            let pubClient;
            if (configSetup_1.default.REDIS_INSTANCE_URL) {
                const useTls = configSetup_1.default.REDIS_INSTANCE_URL.startsWith('rediss://');
                pubClient = new ioredis_1.default(configSetup_1.default.REDIS_INSTANCE_URL, Object.assign({}, (useTls ? { tls: { rejectUnauthorized: false } } : {})));
            }
            else {
                pubClient = new ioredis_1.default(Object.assign({ host: configSetup_1.default.REDIS_HOST, port: configSetup_1.default.REDIS_PORT || 6379 }, (configSetup_1.default.REDIS_PASSWORD ? { password: configSetup_1.default.REDIS_PASSWORD } : {})));
            }
            const subClient = pubClient.duplicate();
            io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
            console.log('✅ Socket.IO Redis adapter attached');
        }
        catch (error) {
            console.warn('⚠️ Socket.IO Redis adapter failed, falling back to in-memory:', error);
        }
    }
    else {
        console.log('ℹ️ Socket.IO using in-memory adapter (no Redis configured)');
    }
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Attempting to connect...');
        yield (0, authorize_1.socketAuthorize)(socket, next);
    }));
    io.on("connection_error", (err) => {
        console.error("Connection error:", err);
    });
    io.on(events_1.Listen.CONNECTION, (socket) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, chat_1.onConnect)(socket);
        socket.emit(events_1.Emit.CONNECTED, socket.id);
        socket.on('call-user', (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log(`[call-user] from=${socket.user.id} to=${data.to}`);
                if (!data.to || typeof data.to !== 'string' || data.to.length === 0) {
                    console.log(`[call-user] REJECTED: invalid data.to = ${JSON.stringify(data.to)}`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'Invalid recipient' });
                    return;
                }
                const partner = yield findOnlinePartner(data.to);
                console.log(`[call-user] findOnlinePartner result:`, partner ? { socketId: partner.socketId, isOnline: partner.isOnline } : null);
                // Always send push — app may be backgrounded while socket is still alive
                const caller = yield prisma_1.default.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                const callerName = `${(_a = caller === null || caller === void 0 ? void 0 : caller.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = caller === null || caller === void 0 ? void 0 : caller.profile) === null || _b === void 0 ? void 0 : _b.lastName}`;
                yield notification_1.NotificationService.create({
                    userId: data.to,
                    type: enum_1.NotificationType.CHAT,
                    title: `${callerName} is calling you`,
                    message: 'Incoming voice call',
                    data: { type: 'call', callType: 'voice', callerId: socket.user.id, callerName },
                    channelId: 'calls',
                    priority: 'high',
                    categoryId: 'INCOMING_CALL',
                });
                if (partner) {
                    io.to(partner.socketId).emit('call-made', {
                        offer: data.offer,
                        from: socket.user.id,
                    });
                    // Start 60s ring timeout
                    startRingTimeout(socket.user.id, data.to, 'voice');
                }
                else {
                    socket.emit('call-unavailable', { to: data.to });
                    // User offline — save missed call immediately
                    yield saveMissedCallMessage(socket.user.id, data.to, 'voice');
                }
            }
            catch (error) {
                console.error('call-user error:', error);
                socket.emit('call-unavailable', { to: data.to });
            }
        }));
        socket.on('make-answer', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                // Call answered — clear the ring timeout
                clearRingTimeout(data.to);
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('answer-made', {
                    answer: data.answer,
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('make-answer error:', error);
            }
        }));
        socket.on('ice-candidate', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('ice-candidate', {
                    candidate: data.candidate,
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('ice-candidate error:', error);
            }
        }));
        socket.on('end-call', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                // Check if call was never answered (still ringing) — save missed call
                const ringing = ringingCalls.get(socket.user.id);
                if (ringing && ringing.receiverId === data.to) {
                    clearRingTimeout(socket.user.id);
                    yield saveMissedCallMessage(socket.user.id, data.to, 'voice');
                }
                else {
                    clearRingTimeout(socket.user.id);
                    clearRingTimeout(data.to);
                }
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('call-ended', {
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('end-call error:', error);
            }
        }));
        socket.on('reject-call', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                // Receiver rejected — clear timeout, save missed call
                clearRingTimeout(data.to);
                yield saveMissedCallMessage(data.to, socket.user.id, 'voice');
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('call-rejected', {
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('reject-call error:', error);
            }
        }));
        socket.on('video-call-user', (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log(`[video-call-user] from=${socket.user.id} to=${data.to}`);
                if (!data.to || typeof data.to !== 'string' || data.to.length === 0) {
                    console.log(`[video-call-user] REJECTED: invalid data.to = ${JSON.stringify(data.to)}`);
                    socket.emit('call-unavailable', { to: data.to, reason: 'Invalid recipient' });
                    return;
                }
                const partner = yield findOnlinePartner(data.to);
                console.log(`[video-call-user] findOnlinePartner result:`, partner ? { socketId: partner.socketId, isOnline: partner.isOnline } : null);
                // Always send push — app may be backgrounded while socket is still alive
                const videoCaller = yield prisma_1.default.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                const videoCallerName = `${(_a = videoCaller === null || videoCaller === void 0 ? void 0 : videoCaller.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = videoCaller === null || videoCaller === void 0 ? void 0 : videoCaller.profile) === null || _b === void 0 ? void 0 : _b.lastName}`;
                yield notification_1.NotificationService.create({
                    userId: data.to,
                    type: enum_1.NotificationType.CHAT,
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
                }
                else {
                    socket.emit('call-unavailable', { to: data.to });
                    // User offline — save missed call immediately
                    yield saveMissedCallMessage(socket.user.id, data.to, 'video');
                }
            }
            catch (error) {
                console.error('video-call-user error:', error);
                socket.emit('call-unavailable', { to: data.to });
            }
        }));
        socket.on('video-make-answer', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                // Video call answered — clear the ring timeout
                clearRingTimeout(data.to);
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('video-answer-made', {
                    answer: data.answer,
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('video-make-answer error:', error);
            }
        }));
        socket.on('video-ice-candidate', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('video-ice-candidate', {
                    candidate: data.candidate,
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('video-ice-candidate error:', error);
            }
        }));
        socket.on('video-end-call', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                // Check if video call was never answered — save missed call
                const ringing = ringingCalls.get(socket.user.id);
                if (ringing && ringing.receiverId === data.to) {
                    clearRingTimeout(socket.user.id);
                    yield saveMissedCallMessage(socket.user.id, data.to, 'video');
                }
                else {
                    clearRingTimeout(socket.user.id);
                    clearRingTimeout(data.to);
                }
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('video-call-ended', {
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('video-end-call error:', error);
            }
        }));
        socket.on('video-reject-call', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!data.to)
                    return;
                // Receiver rejected video — clear timeout, save missed call
                clearRingTimeout(data.to);
                yield saveMissedCallMessage(data.to, socket.user.id, 'video');
                const partner = yield findOnlinePartner(data.to);
                if (!partner)
                    return;
                io.to(partner.socketId).emit('video-call-rejected', {
                    from: socket.user.id,
                });
            }
            catch (error) {
                console.error('video-reject-call error:', error);
            }
        }));
        socket.on(events_1.Listen.UPLOAD_FILE, (data) => (0, chat_1.uploadFile)(io, socket, data));
        socket.on(events_1.Listen.SEND_MSG, (data) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, chat_1.sendMessage)(io, socket, data); }));
        socket.on(events_1.Listen.DISCONNECT, () => (0, chat_1.onDisconnect)(socket));
        socket.on(events_1.Listen.GET_CONTACTS, () => (0, chat_1.getContacts)(io, socket));
        socket.on(events_1.Listen.JOIN_ROOM, (data) => (0, chat_1.joinRoom)(io, socket, data));
        socket.on(events_1.Listen.LEAVE_ROOM, (data) => (0, chat_1.leaveRoom)(io, socket, data));
        socket.on(events_1.Listen.GET_MSGs, (data) => (0, chat_1.getMsgs)(io, socket, data));
        socket.on(events_1.Listen.PREV_CHATS, (data) => (0, chat_1.getPrevChats)(io, socket, data));
    }));
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
