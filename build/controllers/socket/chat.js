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
exports.uploadFile = exports.leaveRoom = exports.getPrevChats = exports.getMsgs = exports.joinRoom = exports.getContacts = exports.onDisconnect = exports.onConnect = exports.sendMessage = void 0;
const events_1 = require("../../utils/events");
const prisma_1 = __importDefault(require("../../config/prisma"));
const modules_1 = require("../../utils/modules");
const path_1 = __importDefault(require("path"));
const cryptography_1 = require("../../utils/cryptography");
const enum_1 = require("../../utils/enum");
const notification_1 = require("../../services/notification");
/** Returns the roles a given user role is allowed to chat with */
const getAllowedChatRoles = (role) => {
    switch (role) {
        case enum_1.UserRole.CLIENT:
            return [enum_1.UserRole.PROFESSIONAL, enum_1.UserRole.DELIVERY];
        case enum_1.UserRole.PROFESSIONAL:
            return [enum_1.UserRole.CLIENT];
        case enum_1.UserRole.DELIVERY:
            return [enum_1.UserRole.CLIENT];
        default:
            // admins / superadmins can chat with anyone
            return [enum_1.UserRole.CLIENT, enum_1.UserRole.PROFESSIONAL, enum_1.UserRole.DELIVERY];
    }
};
const supabaseStorage_1 = require("../../services/supabaseStorage");
const supabase_1 = require("../../config/supabase");
/** Parse members string — handles both comma-separated and JSON array formats */
const parseMembers = (members) => {
    try {
        const parsed = JSON.parse(members);
        if (Array.isArray(parsed))
            return parsed.map((m) => m.trim());
    }
    catch (_a) { }
    return members.split(",").map(m => m.trim()).filter(Boolean);
};
const sendMessage = (io, socket, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Always use authenticated user id — never trust the client payload
        const senderId = socket.user.id;
        let room = yield prisma_1.default.chatRoom.findFirst({ where: { name: data.room } });
        if (!room) {
            return;
        }
        const message = yield prisma_1.default.message.create({
            data: {
                text: (0, cryptography_1.encryptMessage)(data.text),
                from: senderId,
                timestamp: new Date(),
                chatroomId: room.id
            }
        });
        const members = parseMembers(room.members);
        let to = members.filter((member) => member !== senderId)[0];
        if (!to)
            return;
        let otherUser = yield prisma_1.default.user.findUnique({
            where: { id: to },
            include: { onlineUser: true }
        });
        // Enforce chat role restrictions
        if (otherUser) {
            const allowedRoles = getAllowedChatRoles(socket.user.role);
            if (!allowedRoles.includes(otherUser.role)) {
                console.warn(`Chat blocked: ${socket.user.role} cannot message ${otherUser.role}`);
                return;
            }
        }
        // Always send push — on mobile the app may be backgrounded while socket is still alive
        if (otherUser) {
            let user = yield prisma_1.default.user.findFirst({
                where: { id: senderId },
                include: { profile: true }
            });
            const senderName = `${(_a = user === null || user === void 0 ? void 0 : user.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = user === null || user === void 0 ? void 0 : user.profile) === null || _b === void 0 ? void 0 : _b.lastName}`;
            yield notification_1.NotificationService.create({
                userId: to,
                type: enum_1.NotificationType.CHAT,
                title: `${senderName} sent you a message`,
                message: data.text,
                data: { type: 'chat', roomName: room.name, senderId, senderName },
            });
        }
        io.to(room.name).emit(events_1.Emit.RECV_MSG, {
            from: senderId,
            to,
            text: data.text,
            room: data.room,
            timestamp: message.timestamp,
        });
    }
    catch (error) {
        console.error("sendMessage error:", error);
    }
});
exports.sendMessage = sendMessage;
const onConnect = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('a user connected', socket.id);
    try {
        // Validate that user exists before creating online user record
        const user = yield prisma_1.default.user.findUnique({ where: { id: socket.user.id } });
        if (!user) {
            console.warn('❌ User not found for socket connection:', socket.user.id);
            socket.disconnect();
            return;
        }
        const existing = yield prisma_1.default.onlineUser.findFirst({ where: { userId: socket.user.id } });
        if (existing) {
            yield prisma_1.default.onlineUser.update({
                where: { userId: existing.userId },
                data: { socketId: socket.id, lastActive: new Date(), isOnline: true }
            });
        }
        else {
            yield prisma_1.default.onlineUser.create({
                data: { userId: socket.user.id, socketId: socket.id, lastActive: new Date(), isOnline: true }
            });
        }
    }
    catch (error) {
        console.error('❌ Socket connection error:', error);
        // Don't crash the server, just log the error
        socket.disconnect();
    }
    const chatrooms = yield prisma_1.default.chatRoom.findMany({
        where: { members: { contains: socket.user.id } }
    });
    chatrooms.forEach((chatroom) => __awaiter(void 0, void 0, void 0, function* () {
        socket.join(chatroom.name);
    }));
});
exports.onConnect = onConnect;
const onDisconnect = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`User disconnected: ${socket.id}`);
    const onlineUser = yield prisma_1.default.onlineUser.findFirst({ where: { userId: socket.user.id } });
    if (onlineUser) {
        yield prisma_1.default.onlineUser.update({
            where: { userId: onlineUser.userId },
            data: { isOnline: false, lastActive: new Date() }
        });
    }
});
exports.onDisconnect = onDisconnect;
const getContacts = (io, socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = socket.user;
        if (!user) {
            return;
        }
        const allowedRoles = getAllowedChatRoles(user.role);
        const contacts = yield prisma_1.default.user.findMany({
            where: {
                NOT: { id: user.id },
                role: { in: allowedRoles },
            },
            select: {
                id: true, email: true, phone: true, role: true, fcmToken: true, createdAt: true, updatedAt: true,
                profile: {
                    include: {
                        professional: { include: { profession: true } }
                    }
                },
                location: true,
            }
        });
        socket.emit(events_1.Emit.ALL_CONTACTS, contacts);
    }
    catch (error) {
        console.error("getContacts error:", error);
        socket.emit(events_1.Emit.ALL_CONTACTS, []);
    }
});
exports.getContacts = getContacts;
const joinRoom = (io, socket, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("join room", data);
        // Enforce chat role restrictions before joining/creating a room
        const otherUser = yield prisma_1.default.user.findUnique({ where: { id: data.contactId } });
        if (otherUser) {
            const allowedRoles = getAllowedChatRoles(socket.user.role);
            if (!allowedRoles.includes(otherUser.role)) {
                console.warn(`Room blocked: ${socket.user.role} cannot chat with ${otherUser.role}`);
                return;
            }
        }
        let room = yield prisma_1.default.chatRoom.findFirst({
            where: {
                AND: [
                    { members: { contains: socket.user.id } },
                    { members: { contains: data.contactId } }
                ]
            }
        });
        if (!room) {
            room = yield prisma_1.default.chatRoom.create({
                data: {
                    name: (0, modules_1.randomId)(12),
                    members: `${socket.user.id},${data.contactId}`
                }
            });
        }
        const existingRoom = io.of("/").adapter.rooms.get(room.name);
        if (!(existingRoom === null || existingRoom === void 0 ? void 0 : existingRoom.has(socket.id)))
            socket.join(room.name);
        const onlineUser = yield prisma_1.default.onlineUser.findFirst({
            where: { userId: data.contactId }
        });
        if (onlineUser) {
            const sid = onlineUser.socketId;
            if (sid && !(existingRoom === null || existingRoom === void 0 ? void 0 : existingRoom.has(sid))) {
                const userSocket = io.sockets.sockets.get(sid);
                userSocket === null || userSocket === void 0 ? void 0 : userSocket.join(room.name);
            }
        }
        socket.emit(events_1.Emit.JOINED_ROOM, room.name);
        console.log("joined room", room.name);
    }
    catch (error) {
        console.error("joinRoom error:", error);
    }
});
exports.joinRoom = joinRoom;
const getMsgs = (io, socket, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chatroom = yield prisma_1.default.chatRoom.findFirst({
            where: { name: data.room },
        });
        if (!chatroom)
            return;
        const members = parseMembers(chatroom.members);
        // Build a where clause — if client sends `since` timestamp, only fetch newer messages
        const messageWhere = { chatroomId: chatroom.id };
        if (data.since) {
            messageWhere.timestamp = { gt: new Date(data.since) };
        }
        const messages = yield prisma_1.default.message.findMany({
            where: messageWhere,
            orderBy: { timestamp: 'asc' },
            take: 500, // cap to avoid huge payloads
        });
        const normalizedMessages = messages.map((msg) => ({
            to: members.filter((member) => member !== msg.from)[0],
            from: msg.from,
            text: (0, cryptography_1.decryptMessage)(msg.text),
            room: data.room,
            timestamp: msg.timestamp,
        }));
        socket.emit(events_1.Emit.RECV_MSGs, normalizedMessages);
    }
    catch (error) {
        console.error("getMsgs error:", error);
        socket.emit(events_1.Emit.RECV_MSGs, []);
    }
});
exports.getMsgs = getMsgs;
const getPrevChats = (io, socket, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allowedRoles = getAllowedChatRoles(socket.user.role);
        const chatrooms = yield prisma_1.default.chatRoom.findMany({
            where: { members: { contains: socket.user.id } }
        });
        const partners = chatrooms.map((room) => {
            const members = parseMembers(room.members);
            return members.filter((member) => member !== socket.user.id)[0];
        }).filter(Boolean);
        const prevChats = yield prisma_1.default.user.findMany({
            where: {
                id: { in: partners },
                role: { in: allowedRoles },
            },
            select: {
                id: true, email: true, phone: true, role: true, fcmToken: true, createdAt: true, updatedAt: true,
                profile: {
                    include: {
                        professional: { include: { profession: true } }
                    }
                },
                location: true,
                onlineUser: true,
            }
        });
        socket.emit(events_1.Emit.GOT_PREV_CHATS, prevChats);
    }
    catch (error) {
        console.error("getPrevChats error:", error);
        socket.emit(events_1.Emit.GOT_PREV_CHATS, []);
    }
});
exports.getPrevChats = getPrevChats;
const leaveRoom = (io, socket, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (data === null || data === void 0 ? void 0 : data.room) {
        socket.leave(data.room);
        console.log(`User ${socket.user.id} left room ${data.room}`);
    }
});
exports.leaveRoom = leaveRoom;
const uploadFile = (io, socket, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Always use authenticated user id
    const senderId = socket.user.id;
    const { image, fileName } = data;
    const fileExt = path_1.default.extname(fileName).toLowerCase();
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const documentExtensions = [".pdf", ".doc", ".docx", ".txt", ".xlsx"];
    let tag = "";
    if (imageExtensions.includes(fileExt)) {
        tag = '<img>';
    }
    else if (documentExtensions.includes(fileExt)) {
        tag = '<doc>';
    }
    try {
        const mimeMap = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
            '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        const mimetype = mimeMap[fileExt] || 'application/octet-stream';
        const result = yield (0, supabaseStorage_1.uploadFileToSupabase)(supabase_1.BUCKET, Buffer.from(image), fileName, mimetype, supabase_1.FOLDERS.CHAT);
        const imageUrl = result.url;
        console.log(`File uploaded to Supabase and broadcasted: ${imageUrl}`);
        let room = yield prisma_1.default.chatRoom.findFirst({ where: { name: data.room } });
        if (!room) {
            return;
        }
        let url = `${tag}${imageUrl}`;
        const message = yield prisma_1.default.message.create({
            data: {
                text: (0, cryptography_1.encryptMessage)(url),
                from: senderId,
                timestamp: new Date(),
                chatroomId: room.id
            }
        });
        // Send push notification to offline recipient
        const fileMembers = parseMembers(room.members);
        let to = fileMembers.filter((member) => member !== senderId)[0];
        if (!to)
            return;
        let otherUser = yield prisma_1.default.user.findUnique({
            where: { id: to },
            include: { onlineUser: true }
        });
        if (otherUser && otherUser.onlineUser && !otherUser.onlineUser.isOnline) {
            let sender = yield prisma_1.default.user.findFirst({
                where: { id: senderId },
                include: { profile: true }
            });
            const fileLabel = tag === '<img>' ? 'an image' : 'a file';
            const senderName = `${(_a = sender === null || sender === void 0 ? void 0 : sender.profile) === null || _a === void 0 ? void 0 : _a.firstName} ${(_b = sender === null || sender === void 0 ? void 0 : sender.profile) === null || _b === void 0 ? void 0 : _b.lastName}`;
            yield notification_1.NotificationService.create({
                userId: to,
                type: enum_1.NotificationType.CHAT,
                title: `${senderName} sent ${fileLabel}`,
                message: `You received ${fileLabel} in chat`,
                data: { type: 'chat', roomName: room.name, senderId, senderName },
            });
        }
        io.to(room.name).emit(events_1.Emit.RECV_FILE, {
            from: senderId,
            to,
            text: url,
            room: room.name,
            timestamp: message.timestamp,
        });
    }
    catch (err) {
        console.error("Error uploading chat file to Supabase:", err);
    }
});
exports.uploadFile = uploadFile;
