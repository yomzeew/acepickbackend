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
const authorize_1 = require("./middlewares/authorize");
const prisma_1 = __importDefault(require("./config/prisma"));
const events_1 = require("./utils/events");
const chat_1 = require("./controllers/socket/chat");
const notification_1 = require("./services/notification");
const enum_1 = require("./utils/enum");
let io;
const findOnlinePartner = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.onlineUser.findFirst({ where: { userId, isOnline: true } });
});
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        path: '/chat',
        cors: {
            origin: "*",
        }
    });
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
                const partner = yield findOnlinePartner(data.to);
                if (partner) {
                    io.to(partner.socketId).emit('call-made', {
                        offer: data.offer,
                        from: socket.user.id,
                    });
                }
                else {
                    // Tell caller the partner is unavailable
                    socket.emit('call-unavailable', { to: data.to });
                    // Recipient is offline — store + push notification
                    const caller = yield prisma_1.default.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                    const callerName = `${(_a = caller === null || caller === void 0 ? void 0 : caller.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = caller === null || caller === void 0 ? void 0 : caller.profile) === null || _b === void 0 ? void 0 : _b.lastName}`;
                    yield notification_1.NotificationService.create({
                        userId: data.to,
                        type: enum_1.NotificationType.CHAT,
                        title: `${callerName} is calling you`,
                        message: 'You have a missed voice call',
                        data: { type: 'call', callType: 'voice', callerId: socket.user.id, callerName },
                    });
                }
            }
            catch (error) {
                console.error('call-user error:', error);
                socket.emit('call-unavailable', { to: data.to });
            }
        }));
        socket.on('make-answer', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
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
                const partner = yield findOnlinePartner(data.to);
                if (partner) {
                    io.to(partner.socketId).emit('video-call-made', {
                        offer: data.offer,
                        from: socket.user.id,
                    });
                }
                else {
                    socket.emit('call-unavailable', { to: data.to });
                    const caller = yield prisma_1.default.user.findFirst({ where: { id: socket.user.id }, include: { profile: true } });
                    const callerName = `${(_a = caller === null || caller === void 0 ? void 0 : caller.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = caller === null || caller === void 0 ? void 0 : caller.profile) === null || _b === void 0 ? void 0 : _b.lastName}`;
                    yield notification_1.NotificationService.create({
                        userId: data.to,
                        type: enum_1.NotificationType.CHAT,
                        title: `${callerName} is video calling you`,
                        message: 'You have a missed video call',
                        data: { type: 'call', callType: 'video', callerId: socket.user.id, callerName },
                    });
                }
            }
            catch (error) {
                console.error('video-call-user error:', error);
                socket.emit('call-unavailable', { to: data.to });
            }
        }));
        socket.on('video-make-answer', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
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
