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
exports.revenueOverview = exports.getMonthlyRevenueByCategory = exports.getRevenueByCategory = exports.getMonthlyRevenueWithCumulative = exports.getMonthlyRevenue = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const modules_1 = require("../../utils/modules");
const getMonthlyRevenue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
            SELECT
                EXTRACT(YEAR FROM "createdAt") AS year,
                EXTRACT(MONTH FROM "createdAt") AS month,
                SUM(amount) AS monthly_revenue
            FROM ledger_entries
            WHERE account = 'platform_revenue'
            GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
            ORDER BY year, month;
        `);
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.getMonthlyRevenue = getMonthlyRevenue;
const getMonthlyRevenueWithCumulative = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
            SELECT
                EXTRACT(YEAR FROM "createdAt") AS year,
                EXTRACT(MONTH FROM "createdAt") AS month,
                SUM(amount) AS monthly_revenue,
                SUM(SUM(amount)) OVER (
                    ORDER BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
                ) AS cumulative_revenue
            FROM ledger_entries
            WHERE account = 'platform_revenue'
            GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
            ORDER BY year, month;
        `);
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.getMonthlyRevenueWithCumulative = getMonthlyRevenueWithCumulative;
const getRevenueByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
            SELECT category, SUM(amount) AS total_revenue
            FROM ledger_entries
            WHERE account = 'platform_revenue'
            GROUP BY category
            ORDER BY total_revenue DESC;
        `);
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.getRevenueByCategory = getRevenueByCategory;
const getMonthlyRevenueByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
            SELECT
                EXTRACT(YEAR FROM "createdAt") AS year,
                EXTRACT(MONTH FROM "createdAt") AS month,
                category,
                SUM(amount) AS monthly_revenue
            FROM ledger_entries
            WHERE account = 'platform_revenue'
            GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt"), category
            ORDER BY year ASC, month ASC, category ASC;
        `);
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.getMonthlyRevenueByCategory = getMonthlyRevenueByCategory;
const revenueOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const balances = yield prisma_1.default.$queryRawUnsafe(`
            SELECT
                account,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) -
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS balance
            FROM ledger_entries
            GROUP BY account;
        `);
        return (0, modules_1.successResponse)(res, 'success', balances);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.revenueOverview = revenueOverview;
