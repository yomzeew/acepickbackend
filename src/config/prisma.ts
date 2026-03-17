import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.ENV === 'dev' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Fix BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export default prisma;
