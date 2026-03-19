import { Server, Socket } from "socket.io";
import { Emit, Listen } from "../../utils/events";
import prisma from "../../config/prisma";
import { randomId } from "../../utils/modules";
import path from "path";
import fs from "fs";
import { decryptMessage, encryptMessage } from "../../utils/cryptography";
import { UserRole, NotificationType } from "../../utils/enum";
import { NotificationService } from "../../services/notification";
import { uploadFileToSupabase } from "../../services/supabaseStorage";
import { BUCKET, FOLDERS } from "../../config/supabase";

export interface ChatMessage {
    to: string;
    from: string;
    text: string;
    room: string;
}

/** Parse members string — handles both comma-separated and JSON array formats */
const parseMembers = (members: string): string[] => {
    try {
        const parsed = JSON.parse(members);
        if (Array.isArray(parsed)) return parsed.map((m: string) => m.trim());
    } catch {}
    return members.split(",").map(m => m.trim()).filter(Boolean);
};

export const sendMessage = async (io: Server, socket: Socket, data: ChatMessage) => {

    let room = await prisma.chatRoom.findFirst({ where: { name: data.room } })

    if (!room) {
        return
    }

    const message = await prisma.message.create({
        data: {
            text: encryptMessage(data.text),
            from: data.from,
            timestamp: new Date(),
            chatroomId: room.id
        }
    })

    const members = parseMembers(room.members);
    let to = members.filter((member: string) => member !== data.from)[0];

    if (!to) return;

    let otherUser = await prisma.user.findUnique({
        where: { id: to },
        include: { onlineUser: true }
    })

    if (otherUser && otherUser.onlineUser && !otherUser.onlineUser.isOnline) {
        let user = await prisma.user.findFirst({
            where: { id: data.from },
            include: { profile: true }
        })

        const senderName = `${user?.profile?.firstName} ${user?.profile?.lastName}`;
        await NotificationService.create({
            userId: to,
            type: NotificationType.CHAT,
            title: `${senderName} sent you a message`,
            message: data.text,
            data: { type: 'chat', roomName: room.name, senderId: data.from, senderName },
        });
    }

    io.to(room.name).emit(Emit.RECV_MSG, { ...data, timestamp: message.timestamp });
}

export const onConnect = async (socket: Socket) => {
    console.log('a user connected', socket.id);

    try {
        // Validate that user exists before creating online user record
        const user = await prisma.user.findUnique({ where: { id: socket.user.id } });
        
        if (!user) {
            console.warn('❌ User not found for socket connection:', socket.user.id);
            socket.disconnect();
            return;
        }

        const existing = await prisma.onlineUser.findFirst({ where: { userId: socket.user.id } });

        if (existing) {
            await prisma.onlineUser.update({
                where: { userId: existing.userId },
                data: { socketId: socket.id, lastActive: new Date(), isOnline: true }
            });
        } else {
            await prisma.onlineUser.create({
                data: { userId: socket.user.id, socketId: socket.id, lastActive: new Date(), isOnline: true }
            });
        }
    } catch (error) {
        console.error('❌ Socket connection error:', error);
        // Don't crash the server, just log the error
        socket.disconnect();
    }

    const chatrooms = await prisma.chatRoom.findMany({
        where: { members: { contains: socket.user.id } }
    })

    chatrooms.forEach(async (chatroom: any) => {
        socket.join(chatroom.name)
    })
}


export const onDisconnect = async (socket: Socket) => {
    console.log(`User disconnected: ${socket.id}`);

    const onlineUser = await prisma.onlineUser.findFirst({ where: { userId: socket.user.id } });
    if (onlineUser) {
        await prisma.onlineUser.update({
            where: { userId: onlineUser.userId },
            data: { isOnline: false, lastActive: new Date() }
        });
    }
}

export const getContacts = async (io: Server, socket: Socket) => {
    const user = socket.user;

    if (!user) {
        return
    }

    const contacts = await prisma.user.findMany({
        where: {
            NOT: { id: user.id },
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
    })

    socket.emit(Emit.ALL_CONTACTS, contacts);
}

export const joinRoom = async (io: Server, socket: Socket, data: any) => {

    console.log("join room", data);

    let room = await prisma.chatRoom.findFirst({
        where: {
            AND: [
                { members: { contains: socket.user.id } },
                { members: { contains: data.contactId } }
            ]
        }
    })

    if (!room) {
        room = await prisma.chatRoom.create({
            data: {
                name: randomId(12),
                members: `${socket.user.id},${data.contactId}`
            }
        })
    }

    const existingRoom = io.of("/").adapter.rooms.get(room.name);

    if (!existingRoom?.has(socket.id))
        socket.join(room.name);

    const onlineUser = await prisma.onlineUser.findFirst({
        where: { userId: data.contactId }
    })

    if (onlineUser) {
        const sid = onlineUser.socketId;

        if (sid && !existingRoom?.has(sid)) {
            const userSocket = io.sockets.sockets.get(sid);
            userSocket?.join(room.name);
        }
    }

    socket.emit(Emit.JOINED_ROOM, room.name);

    console.log("joined room", room.name);
}

export const getMsgs = async (io: Server, socket: Socket, data: any) => {
    const chatroom = await prisma.chatRoom.findFirst({
        where: { name: data.room },
        include: { messages: true }
    })

    if (!chatroom) return;

    const members = parseMembers(chatroom.members);

    const normalizedMessages: any[] = []

    chatroom.messages.forEach((msg: any) => {
        normalizedMessages.push({
            to: members.filter((member: string) => member !== msg.from)[0],
            from: msg.from,
            text: decryptMessage(msg.text),
            room: data.room,
            timestamp: msg.timestamp,
        })
    })

    socket.emit(Emit.RECV_MSGs, normalizedMessages);
}

export const getPrevChats = async (io: Server, socket: Socket, data: any) => {

    const chatrooms = await prisma.chatRoom.findMany({
        where: { members: { contains: socket.user.id } }
    });

    const partners = chatrooms.map((room: any) => {
        const members = parseMembers(room.members);
        return members.filter((member: string) => member !== socket.user.id)[0];
    }).filter(Boolean)

    const prevChats = await prisma.user.findMany({
        where: { id: { in: partners } },
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
    })

    socket.emit(Emit.GOT_PREV_CHATS, prevChats);
}


export const uploadFile = async (io: Server, socket: Socket, data: any) => {
    const { image, fileName } = data;

    const fileExt = path.extname(fileName).toLowerCase();

    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const documentExtensions = [".pdf", ".doc", ".docx", ".txt", ".xlsx"];

    let tag = ""
    if (imageExtensions.includes(fileExt)) {
        tag = '<img>'
    } else if (documentExtensions.includes(fileExt)) {
        tag = '<doc>'
    }

    try {
        const mimeMap: Record<string, string> = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
            '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        const mimetype = mimeMap[fileExt] || 'application/octet-stream';

        const result = await uploadFileToSupabase(
            BUCKET,
            Buffer.from(image),
            fileName,
            mimetype,
            FOLDERS.CHAT,
        );

        const imageUrl = result.url;
        console.log(`File uploaded to Supabase and broadcasted: ${imageUrl}`);

        let room = await prisma.chatRoom.findFirst({ where: { name: data.room } })

        if (!room) {
            return
        }

        let url = `${tag}${imageUrl}`

        const message = await prisma.message.create({
            data: {
                text: encryptMessage(url),
                from: data.from,
                timestamp: new Date(),
                chatroomId: room.id
            }
        })

        // Send push notification to offline recipient
        const fileMembers = parseMembers(room.members);
        let to = fileMembers.filter((member: string) => member !== data.from)[0];

        if (!to) return;

        let otherUser = await prisma.user.findUnique({
            where: { id: to },
            include: { onlineUser: true }
        })

        if (otherUser && otherUser.onlineUser && !otherUser.onlineUser.isOnline) {
            let sender = await prisma.user.findFirst({
                where: { id: data.from },
                include: { profile: true }
            })

            const fileLabel = tag === '<img>' ? 'an image' : 'a file';
            const senderName = `${sender?.profile?.firstName} ${sender?.profile?.lastName}`;

            await NotificationService.create({
                userId: to,
                type: NotificationType.CHAT,
                title: `${senderName} sent ${fileLabel}`,
                message: `You received ${fileLabel} in chat`,
                data: { type: 'chat', roomName: room.name, senderId: data.from, senderName },
            });
        }

        io.to(room.name).emit(Emit.RECV_FILE, { ...message, text: url });
    } catch (err) {
        console.error("Error uploading chat file to Supabase:", err);
    }
}