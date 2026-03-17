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
exports.getTransactionById = exports.getAllTransactions = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const getAllTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    try {
        const transactions = yield prisma_1.default.transaction.findMany({
            where: { userId: id },
            include: { job: true },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', transactions);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getAllTransactions = getAllTransactions;
const getTransactionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const transaction = yield prisma_1.default.transaction.findUnique({ where: { id: Number(id) } });
        if (!transaction) {
            return (0, modules_1.errorResponse)(res, 'error', 'Transaction not found');
        }
        return (0, modules_1.successResponse)(res, 'success', transaction);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getTransactionById = getTransactionById;
