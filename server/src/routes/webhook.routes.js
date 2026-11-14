import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// Note: express.raw middleware is mounted in app.js before express.json()
router.post('/razorpay', handleRazorpayWebhook);

export default router;
