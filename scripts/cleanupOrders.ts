import { cleanupExpiredUnpaidOrders } from '../src/controllers/order';
import { expireStaleOrders } from '../src/controllers/order';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runCleanup() {
  console.log('🧹 Starting order cleanup job...');
  
  try {
    // Clean up expired unpaid orders (orders that were never paid)
    console.log('\n📦 Cleaning up expired unpaid orders...');
    // Create a mock request/response for cleanupExpiredUnpaidOrders
    const mockReq = {} as any;
    const mockRes = {
      status: () => mockRes,
      json: (data: any) => {
        console.log(`✅ Cleaned up ${data.data.cleaned} expired unpaid orders`);
        return mockRes;
      }
    } as any;
    
    await cleanupExpiredUnpaidOrders(mockReq, mockRes);
    
    // Clean up stale paid orders (paid orders that never got riders)
    console.log('\n🏍️ Cleaning up stale paid orders...');
    await expireStaleOrders(mockReq, mockRes);
    
    console.log('\n✨ Order cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  runCleanup();
}

export { runCleanup };
