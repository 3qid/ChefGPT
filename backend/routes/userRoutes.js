import express from 'express';
import { signUp, signIn, googleAuth } from '../controllers/authcontroller.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/google-auth', googleAuth);

export default router;