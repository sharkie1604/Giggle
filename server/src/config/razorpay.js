import Razorpay from 'razorpay';
import { env } from './env.js';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export const razorpayInstance = razorpay;
export default razorpay;
