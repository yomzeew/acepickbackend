import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUUIDData() {
    console.log('🔧 Fixing UUID data inconsistencies...\n');

    try {
        // Check for problematic data in chat rooms
        console.log('📋 Checking ChatRoom data...');
        const chatRooms = await prisma.chatRoom.findMany();
        
        for (const room of chatRooms) {
            console.log(`Chat Room ID: ${room.id}, Members: ${room.members}`);
            
            // Fix members field if it contains invalid data
            if (room.members && room.members.includes('[')) {
                try {
                    // Try to parse as JSON array
                    const members = JSON.parse(room.members);
                    console.log(`  ✅ Valid JSON members: ${JSON.stringify(members)}`);
                } catch (error) {
                    console.log(`  ❌ Invalid JSON in members field: ${room.members}`);
                    
                    // Fix the members field by replacing with valid UUID array
                    const validMembers = JSON.stringify([
                        '87d84f10-83f8-4071-8516-691ce13545dc', // John Client
                        'professional-uuid-placeholder',     // Will be updated
                        'rider-uuid-placeholder'             // Will be updated
                    ]);
                    
                    await prisma.chatRoom.update({
                        where: { id: room.id },
                        data: { members: validMembers }
                    });
                    
                    console.log(`  ✅ Fixed members field for room ${room.id}`);
                }
            }
        }

        // Check for problematic data in messages
        console.log('\n📋 Checking Message data...');
        const messages = await prisma.message.findMany({
            take: 10 // Just check first 10 for now
        });
        
        for (const message of messages) {
            console.log(`Message ID: ${message.id}, From: ${message.from}, ChatRoom: ${message.chatroomId}`);
            
            // Check if 'from' field contains invalid UUID
            if (message.from && !isValidUUID(message.from)) {
                console.log(`  ❌ Invalid UUID in 'from' field: ${message.from}`);
                
                // Update with a valid UUID
                await prisma.message.update({
                    where: { id: message.id },
                    data: { from: '87d84f10-83f8-4071-8516-691ce13545dc' }
                });
                
                console.log(`  ✅ Fixed 'from' field for message ${message.id}`);
            }
        }

        // Check online users table
        console.log('\n📋 Checking OnlineUser data...');
        const onlineUsers = await prisma.onlineUser.findMany();
        
        for (const user of onlineUsers) {
            console.log(`Online User ID: ${user.userId}`);
            
            if (!isValidUUID(user.userId)) {
                console.log(`  ❌ Invalid UUID: ${user.userId}`);
                
                // Delete invalid entries
                await prisma.onlineUser.delete({
                    where: { userId: user.userId }
                });
                
                console.log(`  ✅ Deleted invalid online user entry`);
            }
        }

        console.log('\n🎉 UUID data fix completed!');
        
    } catch (error) {
        console.error('❌ Error fixing UUID data:', error);
    }
}

// Helper function to validate UUID
function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Get actual user UUIDs and update chat rooms with correct data
async function updateChatRoomsWithRealUUIDs() {
    console.log('\n🔄 Updating chat rooms with real user UUIDs...');
    
    try {
        // Get real test users
        const client = await prisma.user.findUnique({ where: { email: 'john.client@test.com' } });
        const professional = await prisma.user.findUnique({ where: { email: 'emeka.pro@test.com' } });
        const rider = await prisma.user.findUnique({ where: { email: 'kola.rider@test.com' } });

        if (!client || !professional || !rider) {
            console.error('❌ Test users not found');
            return;
        }

        console.log(`✅ Found users:`);
        console.log(`  Client: ${client.id}`);
        console.log(`  Professional: ${professional.id}`);
        console.log(`  Rider: ${rider.id}`);

        // Update chat rooms with correct UUIDs
        const chatRooms = await prisma.chatRoom.findMany();
        
        for (const room of chatRooms) {
            let updatedMembers = '';
            
            if (room.name.includes('Client-Professional')) {
                updatedMembers = JSON.stringify([client.id, professional.id]);
            } else if (room.name.includes('Client-Rider')) {
                updatedMembers = JSON.stringify([client.id, rider.id]);
            } else if (room.name.includes('Professional-Rider')) {
                updatedMembers = JSON.stringify([professional.id, rider.id]);
            } else if (room.name.includes('Group Chat')) {
                updatedMembers = JSON.stringify([client.id, professional.id, rider.id]);
            } else {
                continue; // Skip unknown rooms
            }
            
            await prisma.chatRoom.update({
                where: { id: room.id },
                data: { members: updatedMembers }
            });
            
            console.log(`✅ Updated ${room.name} with correct UUIDs`);
        }

        // Update messages with correct sender UUIDs
        const messages = await prisma.message.findMany();
        
        for (const message of messages) {
            let senderId = '';
            
            // Determine sender based on chat room and message content
            const chatRoom = await prisma.chatRoom.findUnique({ where: { id: message.chatroomId } });
            if (chatRoom) {
                if (chatRoom.name.includes('Client-Professional')) {
                    // Alternate between client and professional
                    senderId = message.text.includes('Hello!') || message.text.includes('I need') ? client.id : professional.id;
                } else if (chatRoom.name.includes('Client-Rider')) {
                    senderId = message.text.includes('Hi, I have') ? client.id : rider.id;
                } else if (chatRoom.name.includes('Professional-Rider')) {
                    senderId = message.text.includes('Hey!') ? professional.id : rider.id;
                } else if (chatRoom.name.includes('Group Chat')) {
                    // Assign based on message content
                    if (message.text.includes('Hello everyone')) senderId = client.id;
                    else if (message.text.includes('Nice to meet')) senderId = professional.id;
                    else if (message.text.includes('Ready to help')) senderId = rider.id;
                }
                
                if (senderId) {
                    await prisma.message.update({
                        where: { id: message.id },
                        data: { from: senderId }
                    });
                }
            }
        }

        // Recreate online users with correct UUIDs
        await prisma.onlineUser.deleteMany();
        
        const onlineUsers = [
            {
                userId: client.id,
                socketId: 'socket-client-123',
                lastActive: new Date(),
                isOnline: true
            },
            {
                userId: professional.id,
                socketId: 'socket-pro-456',
                lastActive: new Date(),
                isOnline: true
            },
            {
                userId: rider.id,
                socketId: 'socket-rider-789',
                lastActive: new Date(),
                isOnline: true
            }
        ];

        for (const onlineUserData of onlineUsers) {
            await prisma.onlineUser.create({
                data: onlineUserData
            });
        }

        console.log('✅ Updated all chat rooms, messages, and online users with correct UUIDs');
        
    } catch (error) {
        console.error('❌ Error updating with real UUIDs:', error);
    }
}

async function main() {
    await fixUUIDData();
    await updateChatRoomsWithRealUUIDs();
    await prisma.$disconnect();
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
