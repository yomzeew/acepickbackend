import { Router } from "express";
import { createSector, deleteSector, getSectors, getSectorsMetrics, updateSector } from "../controllers/sector";
import { createProfession, deleteProfession, getProfessionById, getProfessions, updateProfession } from "../controllers/professions";
import { getProfessionalById, getProfessionalByUserId, getProfessionals, updateProfessionalProfile } from "../controllers/professionals";
import { getCooperates } from "../controllers/cooperates";
import { createSkill, deleteSkill, getSkillById, getSkills, getSkillCategories, getPopularSkills, updateSkill } from "../controllers/skills";
import { addProfessionalSkills, getMySkills, getProfessionalSkills, removeProfessionalSkill, updateProfessionalSkill } from "../controllers/professionalSkills";
import { approveJob, cancelJob, completeJob, createJobOrder, disputeJob, generateInvoice, getJobById, getJobs, getLatestJob, resolveDispute as resolveJobDispute, respondToJob, updateInvoice, updateJob, viewInvoice } from "../controllers/Jobs";
import { UserRole } from "../utils/enum";
import { allowRoles } from "../middlewares/allowRoles";
import { findPersonsNearby, sendEmailTest, sendSMSTest, testGetProfessional, testNotification, testRedis } from "../controllers/test";
import { addLocation, deleteLocation, getLocationById, getMyLocations, updateLocation } from "../controllers/location";
import { getClient } from "../controllers/client";
import { addAccount, deleteAccount, getAccounts, getBanks, resolveAccount, updateAccount } from "../controllers/account";
import { createWallet, creditWallet, debitWallet, debitWalletForProductOrder, forgotPin, resetPin, setPin, viewWallet } from "../controllers/wallet";
import { getAllTransactions, getTransactionById } from "../controllers/transactions";
import { initiatePayment, initiateTransfer, finalizeTransfer, verifyPayment, verifyTransfer, handlePaystackWebhook } from "../controllers/payment";
import { addEducation, deleteEducation, getEducation, updateEducation } from "../controllers/education";
import { addCertificate, deleteCertificate, getCertificates, updateCertificate } from "../controllers/certification";
import { addExperience, deleteExperience, getExperiences, updateExperience } from "../controllers/experience";
import { addPortfolio, deletePortfolio, getPortfolios, updatePortfolio } from "../controllers/portfolio";
import { getUsers, MyAccountInfo, updateProfile, UserAccountInfo } from "../controllers/profiles";
import { addProduct, deleteProduct, getProducts, getMyProducts, updateProduct, selectProduct, restockProduct, soldProducts, boughtProducts, getProduct, getProductTransactionById } from "../controllers/product";
import { addCategory, deleteCategory, getCategories, updateCategory } from "../controllers/category";
import { uploads } from "../services/upload";
import { uploadFiles } from "../controllers/upload";
import { acceptOrder, cancelOrder, confirmDelivery, confirmPickup, createOrder, deliverOrder, disputeOrder, enRouteToPickup, arrivedAtPickup, arrivedAtDropoff, expireStaleOrders, retryRiderSearch, getOrderById, getNearestPaidOrders, getOrdersBuyer, getOrdersRider, getOrdersSeller, pickupOrder, resolveDispute, transportOrder, cleanupExpiredUnpaidOrders, retryExpiredOrder, sellerAcceptOrder, sellerRejectOrder, sellerMarkReady, sellerConfirmCompletion, requestReturn, resolveReturnRequest, autoReleasePayments } from "../controllers/order";
import { giveRating, isRated } from "../controllers/rating";
import { deleteReview, editReview, giveReview, getMyReviews, getReviewsForUser } from "../controllers/review";
import { getClientDashboard, getProfessionalDashboard, getDeliveryDashboard } from "../controllers/dashboard";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from "../controllers/notifications";
import { getTurnCredentials } from "../controllers/turn";
import { saveCallRecording, getCallRecordings, deleteCallRecording } from "../controllers/callRecording";
import { getAvailableRoles, switchRole } from "../controllers/switchRole";
import { paymentLimiter, heavyLimiter } from "../middlewares/rateLimiter";

const routes = Router();

routes.get("/sectors", getSectors);
routes.get("/sectors/details", getSectorsMetrics);
routes.post("/sectors", createSector);
routes.put("/sectors/:id", updateSector);
routes.delete("/sectors/:id", deleteSector);

// Skills routes
routes.get("/skills", getSkills);
routes.get("/skills/popular", getPopularSkills);
routes.get("/skills/categories", getSkillCategories);
routes.get("/skills/:id", getSkillById);
routes.post("/skills", createSkill);
routes.put("/skills/:id", updateSkill);
routes.delete("/skills/:id", deleteSkill);

// Professional skills routes
routes.get("/professionals/:professionalId/skills", getProfessionalSkills);
routes.get("/my-skills", allowRoles(UserRole.PROFESSIONAL), getMySkills);
routes.post("/professionals/skills", allowRoles(UserRole.PROFESSIONAL), addProfessionalSkills);
routes.put("/professionals/skills/:skillId", allowRoles(UserRole.PROFESSIONAL), updateProfessionalSkill);
routes.delete("/professionals/skills/:skillId", allowRoles(UserRole.PROFESSIONAL), removeProfessionalSkill);

routes.get("/clients/:id", allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), getClient);

routes.get('/profile', MyAccountInfo);
routes.get('/profile/:userId', UserAccountInfo);
routes.post('/profile', updateProfile);
routes.get('/contacts', getUsers);

routes.get("/education", getEducation);
routes.post("/education", addEducation);
routes.put("/education/:id", updateEducation);
routes.delete("/education/:id", deleteEducation);

routes.get("/certificates", getCertificates);
routes.post("/certificates", addCertificate);
routes.put("/certificates/:id", updateCertificate);
routes.delete("/certificates/:id", deleteCertificate);

routes.get("/experiences", getExperiences);
routes.post("/experiences", addExperience);
routes.put("/experiences/:id", updateExperience);
routes.delete("/experiences/:id", deleteExperience);

routes.get("/portfolios", getPortfolios);
routes.post("/portfolios", addPortfolio);
routes.put("/portfolios/:id", updatePortfolio);
routes.delete("/portfolios/:id", deletePortfolio);

routes.get("/professions", getProfessions);
routes.get("/professions/:id", getProfessionById);
routes.post("/professions", createProfession);
routes.put("/professions/:id", updateProfession);
routes.delete("/professions/:id", deleteProfession);

routes.get("/professionals", getProfessionals);
routes.get("/professionals/:professionalId", getProfessionalById);
routes.get('/professionals/user/:userId', getProfessionalByUserId); // Allow any role to get professional by userId
routes.put('/professionals/profile', allowRoles(UserRole.PROFESSIONAL), updateProfessionalProfile);

routes.get("/cooperates", getCooperates);

routes.get('/jobs/latest', getLatestJob);
routes.get('/jobs', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), getJobs);
routes.get('/jobs/:id', allowRoles('*'), getJobById);
routes.post('/jobs', allowRoles(UserRole.CLIENT), createJobOrder);

routes.put('/jobs/response/:jobId', allowRoles(UserRole.PROFESSIONAL), respondToJob);
routes.post('/jobs/invoice', allowRoles(UserRole.PROFESSIONAL), generateInvoice);
routes.put('/jobs/invoice/:jobId', allowRoles(UserRole.PROFESSIONAL), updateInvoice);
routes.get('/jobs/invoice/:jobId', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT), viewInvoice);
//routes.post('/jobs/payment', allowRoles(UserRole.CLIENT), payforJob);
routes.post('/jobs/complete/:jobId', allowRoles(UserRole.PROFESSIONAL), completeJob);
routes.post('/jobs/approve/:jobId', allowRoles(UserRole.CLIENT), approveJob);
routes.post('/jobs/dispute/:jobId', allowRoles(UserRole.CLIENT), disputeJob);
routes.post('/jobs/dispute/resolve/:jobId', allowRoles(UserRole.ADMIN), resolveJobDispute);
routes.post('/jobs/cancel/:jobId', allowRoles(UserRole.CLIENT), cancelJob);
routes.put('/jobs/update/:jobId', allowRoles(UserRole.CLIENT), updateJob);

routes.post('/notification-test', testNotification);
routes.post('/send-sms', sendSMSTest);
routes.post('/send-email', sendEmailTest);
routes.post('/nearest-person', findPersonsNearby);
routes.get('/redis-test', testRedis);
routes.get('/get-professional-test/:professionalId', testGetProfessional)

routes.put('/location/:locationId', updateLocation);
routes.get('/my-locations', getMyLocations);
routes.get('/locations/:id', getLocationById);
routes.post('/locations', addLocation);
routes.delete('/locations/:id', deleteLocation);


routes.get('/accounts/banks', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT, UserRole.DELIVERY), getBanks);
routes.post('/accounts', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT, UserRole.DELIVERY), addAccount);
routes.get('/accounts', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT, UserRole.DELIVERY), getAccounts);
routes.post('/accounts/resolve', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT, UserRole.DELIVERY), resolveAccount)
routes.put('/accounts/:recipientCode', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT, UserRole.DELIVERY), updateAccount);
routes.delete('/accounts/:recipientCode', allowRoles(UserRole.PROFESSIONAL, UserRole.CLIENT, UserRole.DELIVERY), deleteAccount);

routes.post('/create-wallet', /*allowRoles(UserRole.SEEKER),*/ createWallet);
routes.get('/view-wallet', /*allowRoles(UserRole.SEEKER),*/ viewWallet);
routes.post('/debit-wallet', paymentLimiter, /*allowRoles(UserRole.SEEKER),*/ debitWallet);
routes.post('/debit-wallet/product', paymentLimiter, /*allowRoles(UserRole.SEEKER),*/ debitWalletForProductOrder);
routes.post('/credit-wallet', paymentLimiter, /*allowRoles(UserRole.SEEKER),*/ creditWallet);
routes.post('/set-pin', /*allowRoles(UserRole.SEEKER),*/ setPin);
routes.post('/reset-pin', resetPin);
routes.post('/forgot-pin', forgotPin);

routes.get('/transactions', /*allowRoles(UserRole.SEEKER, UserRole.PROVIDER),*/ getAllTransactions);
routes.get('/transactions/:id', /*allowRoles(UserRole.SEEKER, UserRole.PROVIDER),*/ getTransactionById);

routes.post('/paystack/webhook', handlePaystackWebhook);
routes.post('/payments/initiate', paymentLimiter, /*allowRoles(UserRole.SEEKER),*/ initiatePayment);
routes.post('/payments/verify/:ref', /*allowRoles(UserRole.SEEKER),*/ verifyPayment);
routes.post('/transfer/initiate', paymentLimiter, /*allowRoles(UserRole.PROVIDER),*/ initiateTransfer);
routes.post('/transfer/finalize', finalizeTransfer);
routes.post('/transfer/verify/:ref', verifyTransfer);


routes.get('/products', getProducts);
routes.get('/products/mine', getMyProducts);
routes.get('/products/:id', getProduct);
routes.post('/products', addProduct);
routes.put('/products/:id', updateProduct);
routes.delete('/products/:id', deleteProduct);
routes.post('/products/upload', uploads.array('product', 5), uploadFiles);
routes.post('/products/select', selectProduct);
routes.post('/products/restock', restockProduct);
routes.get('/products/transactions/sold', soldProducts);
routes.get('/products/transactions/bought', boughtProducts);
routes.get('/products/transactions/:id', getProductTransactionById);
//routes.post('/products/transactions/accept', acceptProduct);

routes.get('/categories', getCategories);
routes.post('/categories', addCategory);
routes.put('/categories/:id', updateCategory);
routes.delete('/categories/:id', deleteCategory);

routes.post('/create-order', allowRoles('*'), createOrder);
routes.get('/paid-orders', allowRoles(UserRole.DELIVERY), getNearestPaidOrders);
routes.get('/rider-orders', allowRoles(UserRole.DELIVERY), getOrdersRider);
routes.get('/buyer-orders', allowRoles(UserRole.CLIENT), getOrdersBuyer);
routes.get('/seller-orders', allowRoles(UserRole.CLIENT), getOrdersSeller);
routes.get('/orders/:orderId', allowRoles('*'), getOrderById);
routes.put('/orders/accept/:orderId', allowRoles(UserRole.DELIVERY), acceptOrder);
routes.put('/orders/en_route_to_pickup/:orderId', allowRoles(UserRole.DELIVERY), enRouteToPickup);
routes.put('/orders/arrived_at_pickup/:orderId', allowRoles(UserRole.DELIVERY), arrivedAtPickup);
routes.put('/orders/pickup/:orderId', allowRoles(UserRole.DELIVERY), pickupOrder);
routes.put('/orders/confirm_pickup/:orderId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), confirmPickup);
routes.put('/orders/arrived_at_dropoff/:orderId', allowRoles(UserRole.DELIVERY), arrivedAtDropoff);
routes.put('/orders/deliver/:orderId', allowRoles(UserRole.DELIVERY), deliverOrder);
routes.put('/orders/confirm_delivery/:productTransactionId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), confirmDelivery);
routes.put('/orders/cancel/:orderId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), cancelOrder);
routes.post('/orders/retry-rider/:orderId', allowRoles(UserRole.CLIENT), retryRiderSearch);
routes.post('/orders/retry/:orderId', allowRoles(UserRole.CLIENT), retryExpiredOrder);
routes.post('/orders/expire-stale', allowRoles(UserRole.ADMIN), expireStaleOrders);
routes.post('/orders/dispute', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), disputeOrder);
routes.post('/orders/dispute/resolve/:disputeId', resolveDispute);

// Seller order management
routes.put('/orders/seller-accept/:productTransactionId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), sellerAcceptOrder);
routes.put('/orders/seller-reject/:productTransactionId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), sellerRejectOrder);
routes.put('/orders/seller-mark-ready/:productTransactionId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), sellerMarkReady);
routes.put('/orders/seller-confirm/:productTransactionId', allowRoles(UserRole.CLIENT, UserRole.PROFESSIONAL), sellerConfirmCompletion);

// Return requests
routes.post('/orders/return-request', allowRoles(UserRole.CLIENT), requestReturn);
routes.post('/orders/return-request/resolve/:returnRequestId', allowRoles(UserRole.ADMIN), resolveReturnRequest);

// Auto-release payments (cron / admin)
routes.post('/orders/auto-release-payments', allowRoles(UserRole.ADMIN), autoReleasePayments);

routes.post('/ratings', giveRating);
routes.get('/is-rated', isRated);
routes.get('/reviews/my', getMyReviews);
routes.get('/reviews/user/:userId', getReviewsForUser);
routes.post('/reviews', giveReview);
routes.put('/reviews/:reviewId', editReview);
routes.delete('/reviews/:reviewId', deleteReview);

routes.get('/dashboard/client', allowRoles(UserRole.CLIENT), getClientDashboard);
routes.get('/dashboard/professional', allowRoles(UserRole.PROFESSIONAL), getProfessionalDashboard);
routes.get('/dashboard/delivery', allowRoles(UserRole.DELIVERY), getDeliveryDashboard);

// Notification routes
routes.get('/notifications', getNotifications);
routes.get('/notifications/unread-count', getUnreadCount);
routes.put('/notifications/read-all', markAllAsRead);
routes.put('/notifications/:notificationId/read', markAsRead);
routes.delete('/notifications/:notificationId', deleteNotification);
routes.delete('/notifications', deleteAllNotifications);

// Order cleanup route (admin only or cron job)
routes.post('/orders/cleanup-expired', allowRoles(UserRole.ADMIN), cleanupExpiredUnpaidOrders);

// Cloudflare TURN credentials for WebRTC calls
routes.get('/turn-credentials', getTurnCredentials);

// Call recordings
routes.post('/call-recordings', saveCallRecording);
routes.get('/call-recordings', getCallRecordings);
routes.delete('/call-recordings/:id', deleteCallRecording);

// Role switching
routes.get('/available-roles', getAvailableRoles);
routes.put('/switch-role', switchRole);

export default routes;