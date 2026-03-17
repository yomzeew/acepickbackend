import prisma from "../config/prisma";
import { Accounts, TransactionType } from "../utils/enum";

type LedgerSide = {
    transactionId: number | bigint;
    userId?: string | null;
    account: Accounts;
    type: TransactionType;
    amount: number | { toNumber?: () => number };
    category?: string | null;
};

export class LedgerService {
    static async createEntry(entries: LedgerSide[]) {
        await prisma.ledgerEntry.createMany({
            data: entries.map(entry => ({
                transactionId: Number(entry.transactionId),
                userId: entry.userId ?? null,
                account: entry.account as any,
                type: entry.type as any,
                amount: Number(entry.amount),
                category: (entry.category ?? null) as any,
            }))
        })
    }
}