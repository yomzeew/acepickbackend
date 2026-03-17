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
exports.getAllTransactions = exports.transactionStat = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const enum_1 = require("../../utils/enum");
const modules_1 = require("../../utils/modules");
const query_1 = require("../../validation/query");
const transactionStat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalTransactions = yield prisma_1.default.transaction.count();
        const successfulTransactions = yield prisma_1.default.transaction.count({ where: { status: enum_1.TransactionStatus.SUCCESS } });
        const failedTransactions = yield prisma_1.default.transaction.count({ where: { status: enum_1.TransactionStatus.FAILED } });
        const pendingTransactions = yield prisma_1.default.transaction.count({ where: { status: enum_1.TransactionStatus.PENDING } });
        const inboundAgg = yield prisma_1.default.transaction.aggregate({
            where: { type: enum_1.TransactionType.CREDIT, status: enum_1.TransactionStatus.SUCCESS },
            _sum: { amount: true }
        });
        const outboundAgg = yield prisma_1.default.transaction.aggregate({
            where: { type: enum_1.TransactionType.DEBIT, status: enum_1.TransactionStatus.SUCCESS },
            _sum: { amount: true }
        });
        return (0, modules_1.successResponse)(res, 'success', {
            totalTransactions,
            successfulTransactions,
            failedTransactions,
            pendingTransactions,
            inboundAmount: inboundAgg._sum.amount ? Number(inboundAgg._sum.amount) : 0,
            outboundAmount: outboundAgg._sum.amount ? Number(outboundAgg._sum.amount) : 0
        });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, "error", 'Internal Server Error');
    }
});
exports.transactionStat = transactionStat;
const getAllTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = query_1.getTransactionSchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid request data',
                errors: result.error.flatten()
            });
        }
        const { status, page, limit } = result.data;
        const transactions = yield prisma_1.default.transaction.findMany({
            where: status && status !== 'all' ? { status: status } : {},
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', { transactions });
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, "error", 'Internal Server Error');
    }
});
exports.getAllTransactions = getAllTransactions;
