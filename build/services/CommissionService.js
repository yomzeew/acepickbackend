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
exports.CommissionService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const enum_1 = require("../utils/enum");
class CommissionService {
    static calculateCommission(amount, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const commission = yield prisma_1.default.commission.findFirst({
                    where: {
                        active: true,
                        type: { in: ['all', type] },
                        OR: [
                            { effectiveFrom: { lte: now } },
                            { effectiveFrom: null },
                        ],
                        AND: [
                            {
                                OR: [
                                    { effectiveTo: { gte: now } },
                                    { effectiveTo: null },
                                ],
                            },
                        ],
                        minAmount: { lte: amount },
                    }
                });
                if (!commission) {
                    return 0;
                }
                if (commission.type === enum_1.CommissionType.PERCENTAGE) {
                    return amount * Number(commission.rate);
                }
                return Number(commission.fixedAmount);
            }
            catch (error) {
                console.log(error);
                return 0;
            }
        });
    }
}
exports.CommissionService = CommissionService;
