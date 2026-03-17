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
exports.LedgerService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class LedgerService {
    static createEntry(entries) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.default.ledgerEntry.createMany({
                data: entries.map(entry => {
                    var _a, _b;
                    return ({
                        transactionId: Number(entry.transactionId),
                        userId: (_a = entry.userId) !== null && _a !== void 0 ? _a : null,
                        account: entry.account,
                        type: entry.type,
                        amount: Number(entry.amount),
                        category: ((_b = entry.category) !== null && _b !== void 0 ? _b : null),
                    });
                })
            });
        });
    }
}
exports.LedgerService = LedgerService;
