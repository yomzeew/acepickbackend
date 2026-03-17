import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('🌱 Starting notification seeding for client1.joseph.ibrahim@test.com...\n');

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: 'client1.joseph.ibrahim@test.com' }
    });

    if (!user) {
      console.error('❌ User client1.joseph.ibrahim@test.com not found in database');
      console.log('Please make sure this user exists before running this seed script');
      return;
    }

    console.log(`✅ Found user: ${user.id} (${user.email})`);

    // Clean existing notifications for this user
    await prisma.notification.deleteMany({
      where: { userId: user.id }
    });
    console.log('✅ Cleaned existing notifications for this user');

    // Create sample notifications
    const notifications = [
      {
        type: 'JOB',
        title: 'New Job Posted',
        message: 'Your job "Website Development for E-commerce" has been posted successfully and is now visible to professionals.',
        data: { jobId: 1, action: 'job_created' },
        read: false,
        pushSent: true
      },
      {
        type: 'JOB',
        title: 'Professional Accepted Your Job',
        message: 'John Doe has accepted your job "Website Development for E-commerce". You can now start chatting with them.',
        data: { jobId: 1, professionalId: 'uuid-here', action: 'job_accepted' },
        read: false,
        pushSent: true
      },
      {
        type: 'PAYMENT',
        title: 'Payment Processed',
        message: 'Your payment of ₦50,000 for job "Website Development for E-commerce" has been processed successfully.',
        data: { jobId: 1, amount: 50000, action: 'payment_successful' },
        read: true,
        pushSent: true
      },
      {
        type: 'CHAT',
        title: 'New Message',
        message: 'John Doe sent you a new message about your job.',
        data: { chatroomId: 1, action: 'new_message' },
        read: false,
        pushSent: true
      },
      {
        type: 'SYSTEM',
        title: 'Profile Update Reminder',
        message: 'Please complete your profile to increase your chances of getting hired by top professionals.',
        data: { action: 'profile_reminder' },
        read: true,
        pushSent: false
      },
      {
        type: 'JOB',
        title: 'Job Completed',
        message: 'Your job "Website Development for E-commerce" has been marked as completed by John Doe. Please review and approve.',
        data: { jobId: 1, action: 'job_completed' },
        read: false,
        pushSent: true
      },
      {
        type: 'PROFILE',
        title: 'Profile Verified',
        message: 'Congratulations! Your profile has been verified. You now have access to all platform features.',
        data: { action: 'profile_verified' },
        read: true,
        pushSent: true
      },
      {
        type: 'ORDER',
        title: 'Order Delivered',
        message: 'Your order #12345 has been delivered successfully. Please confirm receipt.',
        data: { orderId: 12345, action: 'order_delivered' },
        read: false,
        pushSent: true
      },
      {
        type: 'PAYMENT',
        title: 'Wallet Refunded',
        message: 'A refund of ₦5,000 has been processed to your wallet for the cancelled order.',
        data: { amount: 5000, action: 'wallet_refund' },
        read: true,
        pushSent: true
      },
      {
        type: 'JOB',
        title: 'Invoice Generated',
        message: 'John Doe has generated an invoice for your job. Please review and proceed with payment.',
        data: { jobId: 1, invoiceId: 1, action: 'invoice_generated' },
        read: false,
        pushSent: true
      }
    ];

    // Insert notifications with staggered timestamps for realism
    const now = new Date();
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const createdAt = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Stagger by days
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: notification.read,
          pushSent: notification.pushSent,
          createdAt: createdAt,
          updatedAt: createdAt
        }
      });
    }

    console.log(`✅ Created ${notifications.length} notifications for user ${user.email}`);

    // Verify the notifications were created
    const count = await prisma.notification.count({
      where: { userId: user.id }
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    });

    console.log(`📊 Total notifications: ${count}`);
    console.log(`📊 Unread notifications: ${unreadCount}`);
    console.log(`📊 Read notifications: ${count - unreadCount}`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedNotifications()
  .then(() => {
    console.log('\n🎉 Notification seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Notification seeding failed:', error);
    process.exit(1);
  });
