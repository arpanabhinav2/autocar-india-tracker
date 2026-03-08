// api/razorpay-order.js
// Vercel Serverless Function to generate a secure Razorpay Order ID

import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    // Harness native fs to instantly read .env bypassing Vite and NPM completely
    if (!process.env.RAZORPAY_KEY_ID) {
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

    // Initialize Razorpay SDK dynamically per request
    const razorpay = new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 50000, // Razorpay works in paise (Rs 500 = 50000 paise)
      currency: "INR",
      receipt: `rcpt_${userId.slice(0, 8)}_${Date.now().toString(36)}`,
      notes: {
        userId: userId,
        tier: "Premium+"
      }
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);

  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
