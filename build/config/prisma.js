"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: process.env.ENV === 'dev' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
// Fix BigInt serialization
BigInt.prototype.toJSON = function () {
    return this.toString();
};
exports.default = prisma;
