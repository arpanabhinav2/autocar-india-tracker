// api/razorpay-verify.js
// Vercel Serverless Function to verify the Razorpay payment signature

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ message: 'Missing payment details' });
  }

  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
       const fs = await import('fs');
       const envFile = fs.readFileSync('.env', 'utf-8');
       envFile.split('\n').forEach(line => {
          const [key, ...valParts] = line.split('=');
          if (key && valParts.length > 0) {
              const val = valParts.join('=').trim().replace(/^"|"$/g, '');
              process.env[key.trim()] = val;
          }
       });
    }
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
        return res.status(500).json({ message: 'Razorpay secret key is not configured' });
    }

    // Official Razorpay Signature Verification Algorithm
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
      return res.status(200).json({ 
         status: 'verified', 
         message: 'Payment verified successfully' 
      });
    } else {
      return res.status(400).json({ 
         status: 'failed', 
         message: 'Invalid signature' 
      });
    }

  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
