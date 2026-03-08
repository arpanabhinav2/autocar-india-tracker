export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { order_id } = req.body;
  
  if (!order_id) {
    return res.status(400).json({ message: 'Missing order_id' });
  }

  try {
    // In production, you would call https://api.juspay.in/orders/{order_id}
    // to verify the payment actually succeeded before unlocking the premium feature.
    
    // MOCK VERIFICATION
    return res.status(200).json({
      status: "CHARGED",
      message: "Payment successful"
    });

  } catch (error) {
    console.error('Juspay Verify Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
