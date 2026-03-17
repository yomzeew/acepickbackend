import { Request, Response } from 'express'
import prisma from '../../config/prisma';
import { errorResponse, successResponse } from "../../utils/modules";

export const newUsersTodayCount = async (req: Request, res: Response) => {
  try {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const userCount = await prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return successResponse(res, 'success', userCount);
  } catch (error) {
    console.log(error);
    return errorResponse(res, 'error', 'Internal server error');
  }
};


export const cumulativeUsersByMonth = async (req: Request, res: Response) => {
  try {
    const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COUNT(*) AS users_in_month,
          SUM(COUNT(*)) OVER (ORDER BY TO_CHAR("createdAt", 'YYYY-MM')) AS cumulative_users
      FROM users
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month;
    `);

    return successResponse(res, 'success', results);
  } catch (error) {
    console.log(error);
    return errorResponse(res, 'error', 'Internal server error')
  }
};


export const getWeeklyUserGrowth = async (req: Request, res: Response) => {
  try {
    const results: any[] = await prisma.$queryRawUnsafe(`
     WITH weekly_users AS (
         SELECT
             EXTRACT(YEAR FROM "createdAt")::int AS year,
             EXTRACT(WEEK FROM "createdAt")::int AS week,
             COUNT(*) AS user_count
         FROM users
         GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(WEEK FROM "createdAt")
     ),
     weekly_growth AS (
         SELECT
             year,
             week,
             user_count,
             LAG(user_count) OVER (ORDER BY year, week) AS prev_user_count
         FROM weekly_users
     )
     SELECT
         year,
         week,
         user_count,
         prev_user_count,
         ROUND(
             CASE
                 WHEN prev_user_count = 0 OR prev_user_count IS NULL THEN NULL
                 ELSE ((user_count - prev_user_count) * 100.0 / prev_user_count)
             END, 2
         ) AS growth_rate_percent
     FROM weekly_growth
     ORDER BY year, week;
    `);

    return successResponse(res, 'success', results);
  } catch (error) {
    console.log(error);
    return errorResponse(res, 'error', 'Error fetching user analytics');
  }
};

export const getCurrentVsPreviousWeekGrowth = async (req: Request, res: Response) => {
  try {
    const results: any[] = await prisma.$queryRawUnsafe(`
      WITH weekly_users AS (
        SELECT
            EXTRACT(YEAR FROM "createdAt")::int AS year,
            EXTRACT(WEEK FROM "createdAt")::int AS week,
            COUNT(*) AS user_count
        FROM users
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '4 weeks'
        GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(WEEK FROM "createdAt")
      ),
      current_week AS (
          SELECT * FROM weekly_users
          WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::int
            AND week = EXTRACT(WEEK FROM CURRENT_DATE)::int
      ),
      previous_week AS (
          SELECT * FROM weekly_users
          WHERE year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 week')::int
            AND week = EXTRACT(WEEK FROM CURRENT_DATE - INTERVAL '1 week')::int
      )
      SELECT
          COALESCE((SELECT user_count FROM current_week), 0) AS current_week_users,
          COALESCE((SELECT user_count FROM previous_week), 0) AS prev_week_users,
          ROUND(
              CASE
                  WHEN COALESCE((SELECT user_count FROM previous_week), 0) = 0
                      THEN 0
                  ELSE (
                      ((COALESCE((SELECT user_count FROM current_week), 0)) -
                       (COALESCE((SELECT user_count FROM previous_week), 0)))
                      * 100.0 / (COALESCE((SELECT user_count FROM previous_week), 0))
                  )
              END, 2
          ) AS growth_rate_percent;
    `);

    console.log('Current vs Previous Week Growth:', results);

    return successResponse(res, 'success', results);
  } catch (error) {
    console.log(error);
    return errorResponse(res, 'error', 'Error fetching user analytics');
  }
};

