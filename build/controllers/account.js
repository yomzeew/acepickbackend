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
exports.deleteAccount = exports.updateAccount = exports.resolveAccount = exports.getAccounts = exports.addAccount = exports.getBanks = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const configSetup_1 = __importDefault(require("../config/configSetup"));
const axios_1 = __importDefault(require("axios"));
const modules_1 = require("../utils/modules");
const body_1 = require("../validation/body");
const getBanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get("https://api.paystack.co/bank?currency=NGN", {
            headers: {
                Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`
            }
        });
        return (0, modules_1.successResponse)(res, "success", response.data.data);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, "error", error.message);
    }
});
exports.getBanks = getBanks;
const addAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = body_1.bankDetailsSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
    }
    const { accountName, bank, bankCode, accountNumber } = result.data;
    const existingAccount = yield prisma_1.default.account.findFirst({ where: { number: accountNumber } });
    if (existingAccount) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Account already exists');
    }
    const response = yield axios_1.default.post('https://api.paystack.co/transferrecipient', {
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
    }, {
        headers: {
            Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    const { data } = response.data;
    const account = yield prisma_1.default.account.create({
        data: {
            userId: id,
            name: accountName,
            bank: bank,
            number: accountNumber,
            recipientCode: data.recipient_code,
            currency: data.currency,
        }
    });
    return (0, modules_1.successResponse)(res, 'success', account);
});
exports.addAccount = addAccount;
const getAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const accounts = yield prisma_1.default.account.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', accounts);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.getAccounts = getAccounts;
const resolveAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = body_1.resolveBankSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { accountNumber, bankCode } = result.data;
    const response = yield axios_1.default.get(` https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: {
            Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    return (0, modules_1.successResponse)(res, 'success', response.data);
});
exports.resolveAccount = resolveAccount;
const updateAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const recipientCode = req.params.recipientCode;
    const { name } = req.body;
    try {
        const account = yield prisma_1.default.account.findFirst({ where: { recipientCode } });
        if (!account) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Account not found');
        }
        const response = yield axios_1.default.put(`https://api.paystack.co/transferrecipient/${recipientCode}`, { name }, {
            headers: {
                Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.data.status) {
            const updated = yield prisma_1.default.account.update({
                where: { id: account.id },
                data: { name }
            });
            return (0, modules_1.successResponse)(res, 'success', updated);
        }
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.updateAccount = updateAccount;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { recipientCode } = req.params;
    const account = yield prisma_1.default.account.findFirst({ where: { userId: id, recipientCode } });
    try {
        if (!account) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Account not found');
        }
        let response = yield axios_1.default.delete(`https://api.paystack.co/transferrecipient/${recipientCode}`, {
            headers: {
                Authorization: `Bearer ${configSetup_1.default.PAYSTACK_SECRET_KEY}`
            }
        });
        if (response.data.status) {
            yield prisma_1.default.account.delete({ where: { id: account.id } });
            return (0, modules_1.successResponse)(res, 'success', response.data);
        }
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.deleteAccount = deleteAccount;
