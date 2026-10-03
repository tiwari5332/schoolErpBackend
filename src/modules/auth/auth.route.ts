import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', AuthController.registerSchool);
router.post('/admin/login', AuthController.adminLogin);
router.post('/teacher/login', AuthController.teacherLogin);
router.post('/parent/login', AuthController.parentLogin);
router.get('/parent/schools', AuthController.getParentSchools);
router.post('/signup', AuthController.userSignup);
router.post('/create-password', AuthController.createPassword);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/otp/send', AuthController.sendOtp);
router.post('/otp/resend', AuthController.sendOtp);
router.post('/otp/verify', AuthController.verifyOtp);

export default router;
