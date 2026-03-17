import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNotifications() {
  console.log('🔍 Verifying notifications for client1.joseph.ibrahim@test.com...\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'client1.joseph.ibrahim@test.com' },
      include: {
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User: ${user.email} (${user.id})`);
    console.log(`📊 Total notifications: ${user.notifications.length}`);

    const unread = user.notifications.filter(n => !n.read);
    const read = user.notifications.filter(n => n.read);

    console.log(`📊 Unread: ${unread.length}`);
    console.log(`📊 Read: ${read.length}\n`);

    console.log('📋 Recent Notifications:');
    user.notifications.slice(0, 5).forEach((notification, index) => {
      console.log(`${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`   ${notification.message}`);
      console.log(`   Status: ${notification.read ? '✅ Read' : '🔴 Unread'}`);
      console.log(`   Created: ${notification.createdAt.toLocaleString()}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNotifications();
