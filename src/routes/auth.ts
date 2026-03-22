// Import packages
import { Router } from 'express';
import {
    authorize,
    changePassword,
    deleteUsers,
    login,
    passwordChange,
    register,
    registerCorperate,
    registerProfessional,
    registerRider,
    sendOtp,
    // swithAccount,
    updateProfile,
    updatePushToken,
    updateRider,
    verifyBvnHook,
    verifyBvnMatch,
    verifyOtp
} from '../controllers/auth';
import { uploads } from '../services/upload';
import { uploadAvatar } from '../controllers/upload';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter';


const routes = Router();

/*************************************************************************
API CALL START
*************************************************************************/

// INDEX ROUTE TO SHOW API IS WORKING FINE.
// routes.get('/switch', swithAccount);
routes.post('/update-profile', updateProfile);
routes.post('/register', authLimiter, register);
routes.post('/register-professional', authLimiter, registerProfessional);
routes.post('/register-corperate', authLimiter, registerCorperate);
routes.post('/register-rider', authLimiter, registerRider);
routes.put('/update-rider', updateRider);
routes.post('/upload_avatar', uploads.single('avatar'), uploadAvatar);
routes.post('/login', authLimiter, login);
routes.post('/change-password-loggedin', passwordChange);
routes.post('/change-password-forgot', authLimiter, changePassword);
routes.post('/send-otp', otpLimiter, sendOtp);
routes.post('/verify-otp', otpLimiter, verifyOtp);
routes.post('/update-push-token', updatePushToken)
// routes.post("/verify-bvn", verifyBvnDetail)
routes.post('/verify/webhook', verifyBvnHook);
routes.post("/verify-bvn", verifyBvnMatch);
routes.get("/delete-users", deleteUsers)
routes.post('/verify-token', authorize)


export default routes;
