import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestRelationships() {
    console.log('🔗 Creating test relationships for call and chat testing...\n');

    // Get the test users with their profiles
    const client = await prisma.user.findUnique({ 
        where: { email: 'john.client@test.com' },
        include: { profile: true }
    });
    const professional = await prisma.user.findUnique({ 
        where: { email: 'emeka.pro@test.com' },
        include: { profile: true }
    });
    const rider = await prisma.user.findUnique({ 
        where: { email: 'kola.rider@test.com' },
        include: { profile: true }
    });

    if (!client || !professional || !rider) {
        console.error('❌ Test users not found. Please run the main seed first.');
        return;
    }

    console.log(`✅ Found test users:`);
    console.log(`   Client: ${client.profile?.firstName || 'Unknown'} ${client.profile?.lastName || ''} (${client.email})`);
    console.log(`   Professional: ${professional.profile?.firstName || 'Unknown'} ${professional.profile?.lastName || ''} (${professional.email})`);
    console.log(`   Rider: ${rider.profile?.firstName || 'Unknown'} ${rider.profile?.lastName || ''} (${rider.email})`);

    // Clean existing chat rooms and messages between these users
    await prisma.message.deleteMany({
        where: {
            OR: [
                { from: client.id },
                { from: professional.id },
                { from: rider.id }
            ]
        }
    });

    await prisma.chatRoom.deleteMany({
        where: {
            OR: [
                { members: { contains: client.id } },
                { members: { contains: professional.id } },
                { members: { contains: rider.id } }
            ]
        }
    });

    console.log('✅ Cleaned existing chat rooms and messages');

    // Create chat rooms for testing
    const chatRooms = [
        {
            name: 'Client-Professional Chat',
            members: JSON.stringify([client.id, professional.id])
        },
        {
            name: 'Client-Rider Chat',
            members: JSON.stringify([client.id, rider.id])
        },
        {
            name: 'Professional-Rider Chat',
            members: JSON.stringify([professional.id, rider.id])
        },
        {
            name: 'Group Chat - All Three',
            members: JSON.stringify([client.id, professional.id, rider.id])
        }
    ];

    const createdRooms = [];
    for (const roomData of chatRooms) {
        const room = await prisma.chatRoom.create({
            data: roomData
        });
        createdRooms.push(room);
        console.log(`✅ Created chat room: ${room.name}`);
    }

    // Create sample messages for each chat room
    const messages = [
        // Client-Professional messages
        {
            chatroomId: createdRooms[0].id,
            from: client.id,
            text: 'Hello! I need help with a web development project.',
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
            chatroomId: createdRooms[0].id,
            from: professional.id,
            text: 'Hi! I\'d be happy to help. What kind of web development do you need?',
            timestamp: new Date(Date.now() - 3000000) // 50 minutes ago
        },
        {
            chatroomId: createdRooms[0].id,
            from: client.id,
            text: 'I need a responsive e-commerce website with payment integration.',
            timestamp: new Date(Date.now() - 2400000) // 40 minutes ago
        },
        {
            chatroomId: createdRooms[0].id,
            from: professional.id,
            text: 'Perfect! I have experience with e-commerce sites. Can we schedule a call to discuss details?',
            timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
        },

        // Client-Rider messages
        {
            chatroomId: createdRooms[1].id,
            from: client.id,
            text: 'Hi, I have a package that needs to be delivered.',
            timestamp: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
            chatroomId: createdRooms[1].id,
            from: rider.id,
            text: 'Hello! I\'m available for deliveries. Where is the pickup location?',
            timestamp: new Date(Date.now() - 6600000) // 1 hour 50 minutes ago
        },

        // Professional-Rider messages
        {
            chatroomId: createdRooms[2].id,
            from: professional.id,
            text: 'Hey! Do you deliver equipment for work?',
            timestamp: new Date(Date.now() - 10800000) // 3 hours ago
        },
        {
            chatroomId: createdRooms[2].id,
            from: rider.id,
            text: 'Yes! I deliver various items. What do you need transported?',
            timestamp: new Date(Date.now() - 10200000) // 2 hours 50 minutes ago
        },

        // Group chat messages
        {
            chatroomId: createdRooms[3].id,
            from: client.id,
            text: 'Hello everyone! 👋',
            timestamp: new Date(Date.now() - 14400000) // 4 hours ago
        },
        {
            chatroomId: createdRooms[3].id,
            from: professional.id,
            text: 'Hi! Nice to meet you all.',
            timestamp: new Date(Date.now() - 13800000) // 3 hours 50 minutes ago
        },
        {
            chatroomId: createdRooms[3].id,
            from: rider.id,
            text: 'Hello! Ready to help with deliveries and logistics.',
            timestamp: new Date(Date.now() - 13200000) // 3 hours 40 minutes ago
        }
    ];

    for (const messageData of messages) {
        await prisma.message.create({
            data: messageData
        });
    }

    console.log(`✅ Created ${messages.length} sample messages`);

    // Create online user entries to simulate active users
    await prisma.onlineUser.deleteMany({
        where: {
            userId: {
                in: [client.id, professional.id, rider.id]
            }
        }
    });

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

    console.log('✅ Set up online user status for all test accounts');

    // Create a sample job between client and professional for testing
    const existingJob = await prisma.job.findFirst({
        where: {
            clientId: client.id,
            professionalId: professional.id
        }
    });

    if (!existingJob) {
        const sampleJob = await prisma.job.create({
            data: {
                clientId: client.id,
                professionalId: professional.id,
                title: 'E-commerce Website Development',
                description: 'Build a responsive e-commerce website with payment integration',
                budgetMin: 100000,
                budgetMax: 200000,
                status: 'PENDING',
                mode: 'VIRTUAL',
                createdAt: new Date(Date.now() - 86400000), // 1 day ago
                updatedAt: new Date()
            }
        });

        console.log(`✅ Created sample job: ${sampleJob.title}`);
    }

    console.log('\n🎉 Test relationships created successfully!\n');
    console.log('📋 Chat Rooms for Testing:');
    console.log('─'.repeat(60));
    console.log(`1. Client ↔ Professional: ${createdRooms[0].name}`);
    console.log(`2. Client ↔ Rider: ${createdRooms[1].name}`);
    console.log(`3. Professional ↔ Rider: ${createdRooms[2].name}`);
    console.log(`4. Group Chat: ${createdRooms[3].name}`);
    console.log('─'.repeat(60));
    
    console.log('\n📞 Call Testing Instructions:');
    console.log('─'.repeat(60));
    console.log('1. All users are marked as online');
    console.log('2. Chat rooms are ready with sample messages');
}

createTestRelationships()
    .catch((e) => {
        console.error('❌ Error creating test relationships:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
