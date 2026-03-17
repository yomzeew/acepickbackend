import { Router } from "express";
import { emailUser, getAllUsers, toggleSuspension } from "../controllers/admin/user";
import { UserAccountInfo } from "../controllers/profiles";
import { approveProducts, deliveryOversight, getProducts, marketOversight } from "../controllers/admin/product";
import { getActivities, getTopPerformers, overviewStat } from "../controllers/admin/dashboard";
import { newUsersTodayCount, cumulativeUsersByMonth, getWeeklyUserGrowth, getCurrentVsPreviousWeekGrowth } from "../controllers/admin/user_analytics";
import { createCommission, deleteCommission, getCommissionById, getCommissions, toggleCommission, updateCommission } from "../controllers/admin/commision";
import { getMonthlyRevenue, getMonthlyRevenueByCategory, getMonthlyRevenueWithCumulative, getRevenueByCategory, revenueOverview } from "../controllers/admin/revenue_analytics";
import { avgRating, getJobStats, getOrderStats } from "../controllers/admin/service_analytics";
import { getAllTransactions, transactionStat } from "../controllers/admin/transaction";
import { deactivateUser, reactivateUser, suspendUser } from "../controllers/admin/professional";
import { getDeliveryPricingList, getDeliveryPricingById, createDeliveryPricing, updateDeliveryPricing, deleteDeliveryPricing } from "../controllers/admin/deliveryPricing";

const routes = Router();

routes.get('/:role/all', getAllUsers);
routes.get('/user/:userId', UserAccountInfo);
routes.post('/user/togggle-suspend/:userId', toggleSuspension);
routes.post('/email/message', emailUser);

routes.post('/user/deactivate/:userId', deactivateUser);
routes.post('/user/suspend/:userId', suspendUser);
routes.post('/user/reactivate/:userId', reactivateUser);

routes.get('/products', getProducts);
routes.post('/products/approve/:productId', approveProducts);
routes.get('/dashboard/overview', overviewStat);
routes.get('/dashboard/activities', getActivities);
routes.get('/dashboard/top-performers', getTopPerformers);
routes.get('/dashboard/new-users-today', newUsersTodayCount);
routes.get('/dashboard/cummulative-users', cumulativeUsersByMonth);
routes.get('/dashboard/weekly-user-growth', getWeeklyUserGrowth);
routes.get('/dashboard/curr-vs-prev-week-growth', getCurrentVsPreviousWeekGrowth);

routes.get('/revenue/monthly', getMonthlyRevenue);
routes.get('/revenue/monthly-cummulative', getMonthlyRevenueWithCumulative);
routes.get('/revenue/by-category', getRevenueByCategory);
routes.get('/revenue/monthly-by-category', getMonthlyRevenueByCategory);
routes.get('/revenue/overview', revenueOverview);
routes.get('/transactions/stats', transactionStat);
routes.get('/transactions', getAllTransactions);

routes.get('/service/job-stats', getJobStats);
routes.get('/service/order-stats', getOrderStats);
routes.get('/service/avg-rating', avgRating);
routes.get('/service/delivery-stats', deliveryOversight)
routes.get('/service/product-stats', marketOversight);

routes.get('/commission', getCommissions);
routes.get('/commission/:id', getCommissionById);
routes.post('/commission', createCommission);
routes.put('/commission/:id', updateCommission);
routes.delete('/commission/:id', deleteCommission);
routes.post('/toggle-commission/:id', toggleCommission);

routes.get('/delivery-pricing', getDeliveryPricingList);
routes.get('/delivery-pricing/:id', getDeliveryPricingById);
routes.post('/delivery-pricing', createDeliveryPricing);
routes.put('/delivery-pricing/:id', updateDeliveryPricing);
routes.delete('/delivery-pricing/:id', deleteDeliveryPricing);

export default routes;