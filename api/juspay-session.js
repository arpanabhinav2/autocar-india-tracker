export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, email } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    // In a production environment with an approved Juspay Merchant Account,
    // you would construct a Basic Auth request to https://api.juspay.in/session
    // using process.env.JUSPAY_API_KEY and process.env.JUSPAY_MERCHANT_ID.

    // Because a live Juspay Merchant Account requires KYC business verification, 
    // we are returning a simulated successful SDK payload to allow the frontend 
    // architecture to render and function locally for demonstration.
    
    const mockOrderId = `ORD-${Date.now()}`;
    
    return res.status(200).json({
      order_id: mockOrderId,
      sdk_payload: {
        payload: {
          action: "paymentPage",
          merchantId: process.env.JUSPAY_MERCHANT_ID || "AUTOCAR_INDIA_MOCK",
          clientId: "autocar_client",
          orderId: mockOrderId,
          amount: "500.00",
          customerId: userId,
          customerEmail: email || "user@example.com",
          customerPhone: "9999999999",
          environment: "sandbox"
        }
      }
    });

  } catch (error) {
    console.error('Juspay Session Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
