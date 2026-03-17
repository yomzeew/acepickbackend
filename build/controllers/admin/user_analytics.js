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
exports.getCurrentVsPreviousWeekGrowth = exports.getWeeklyUserGrowth = exports.cumulativeUsersByMonth = exports.newUsersTodayCount = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const modules_1 = require("../../utils/modules");
const newUsersTodayCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const userCount = yield prisma_1.default.user.count({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
        });
        return (0, modules_1.successResponse)(res, 'success', userCount);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.newUsersTodayCount = newUsersTodayCount;
const cumulativeUsersByMonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
      SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COUNT(*) AS users_in_month,
          SUM(COUNT(*)) OVER (ORDER BY TO_CHAR("createdAt", 'YYYY-MM')) AS cumulative_users
      FROM users
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month;
    `);
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Internal server error');
    }
});
exports.cumulativeUsersByMonth = cumulativeUsersByMonth;
const getWeeklyUserGrowth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
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
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error fetching user analytics');
    }
});
exports.getWeeklyUserGrowth = getWeeklyUserGrowth;
const getCurrentVsPreviousWeekGrowth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.$queryRawUnsafe(`
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
        return (0, modules_1.successResponse)(res, 'success', results);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Error fetching user analytics');
    }
});
exports.getCurrentVsPreviousWeekGrowth = getCurrentVsPreviousWeekGrowth;
