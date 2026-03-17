import prisma from "../config/prisma";
import { CommissionType } from "../utils/enum";

export class CommissionService {
    static async calculateCommission(amount: number, type: string) {
        try {
            const now = new Date();

            const commission = await prisma.commission.findFirst({
                where: {
                    active: true,
                    type: { in: ['all', type] as any },
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
            })

            if (!commission) {
                return 0
            }

            if (commission.type === CommissionType.PERCENTAGE) {
                return amount * Number(commission.rate)
            }

            return Number(commission.fixedAmount)
        } catch (error) {
            console.log(error)
            return 0
        }
    }
}