import express from "express";
import Stripe from "stripe";
import admin from "firebase-admin";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();


admin.initializeApp({
  credential: admin.credential.cert('C:/Users/Dell/Desktop/config/move-5a913-firebase-adminsdk-fbsvc-763f0bde32.json')
});
const stripe = new Stripe(process.env.sk_test_51QvwiCIbt0wZa9gHUPWe7eRw8W0WUTeD49Q88L1Dr3ziiBvBBpUqK9ORApkr4WhMAhH8JpazHoWyWl7V4FZ3vTsr00UFZaFK2Z);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Stripe Webhook Endpoint
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_email; // Get user email from Stripe

      if (email) {
        // Update Firebase Firestore
        await admin.firestore().collection("users").doc(email).set(
          { paid: true, subscriptionEnd: Date.now() + 7 * 24 * 60 * 60 * 1000 },
          { merge: true }
        );
        console.log(`User ${email} marked as paid.`);
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Start Server
app.listen(3000, () => console.log("Webhook server running on port 3000"));