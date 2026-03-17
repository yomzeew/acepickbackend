import { Request, Response } from "express";
import prisma from "../../config/prisma";
import { errorResponse, successResponse } from "../../utils/modules";

export const getMonthlyRevenue = async (req: Request, res: Response) => {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`
            SELECT
                EXTRACT(YEAR FROM "createdAt") AS year,
                EXTRACT(MONTH FROM "createdAt") AS month,
                SUM(amount) AS monthly_revenue
            FROM ledger_entries
            WHERE account = 'platform_revenue'
            GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
            ORDER BY year, month;
        `);

        return successResponse(res, 'success', results);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
}


export const getMonthlyRevenueWithCumulative = async (req: Request, res: Response) => {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`
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

        return successResponse(res, 'success', results);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
};

export const getRevenueByCategory = async (req: Request, res: Response) => {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`
            SELECT category, SUM(amount) AS total_revenue
            FROM ledger_entries
            WHERE account = 'platform_revenue'
            GROUP BY category
            ORDER BY total_revenue DESC;
        `);

        return successResponse(res, 'success', results);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
};


export const getMonthlyRevenueByCategory = async (req: Request, res: Response) => {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`
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

        return successResponse(res, 'success', results);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
};

export const revenueOverview = async (req: Request, res: Response) => {
    try {
        const balances: any[] = await prisma.$queryRawUnsafe(`
            SELECT
                account,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) -
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS balance
            FROM ledger_entries
            GROUP BY account;
        `);

        return successResponse(res, 'success', balances);
    } catch (error) {
        console.log(error);
        return errorResponse(res, 'error', 'Internal server error');
    }
}

