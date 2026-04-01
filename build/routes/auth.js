"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import packages
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const upload_1 = require("../services/upload");
const upload_2 = require("../controllers/upload");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const routes = (0, express_1.Router)();
/*************************************************************************
API CALL START
*************************************************************************/
// INDEX ROUTE TO SHOW API IS WORKING FINE.
// routes.get('/switch', swithAccount);
routes.post('/update-profile', auth_1.updateProfile);
routes.post('/register', rateLimiter_1.authLimiter, auth_1.register);
routes.post('/register-professional', rateLimiter_1.authLimiter, auth_1.registerProfessional);
routes.post('/register-corperate', rateLimiter_1.authLimiter, auth_1.registerCorperate);
routes.post('/register-rider', rateLimiter_1.authLimiter, auth_1.registerRider);
routes.put('/update-rider', auth_1.updateRider);
routes.post('/upload_avatar', upload_1.uploads.single('avatar'), upload_2.uploadAvatar);
routes.post('/login', rateLimiter_1.authLimiter, auth_1.login);
routes.post('/change-password-loggedin', auth_1.passwordChange);
routes.post('/change-password-forgot', rateLimiter_1.authLimiter, auth_1.changePassword);
routes.post('/send-otp', rateLimiter_1.otpLimiter, auth_1.sendOtp);
routes.post('/verify-otp', rateLimiter_1.otpLimiter, auth_1.verifyOtp);
routes.post('/update-push-token', auth_1.updatePushToken);
// routes.post("/verify-bvn", verifyBvnDetail)
routes.post('/verify/webhook', auth_1.verifyBvnHook);
routes.post("/verify-bvn", auth_1.verifyBvnMatch);
routes.get("/delete-users", auth_1.deleteUsers);
routes.post('/verify-token', auth_1.authorize);
exports.default = routes;
