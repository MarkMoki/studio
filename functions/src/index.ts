import * as functions from "firebase-functions";
import *  as admin from "firebase-admin";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();
const db = admin.firestore();

// Ensure FLUTTERWAVE_SECRET_KEY is set in Firebase Functions environment configuration
// You can set this using the Firebase CLI:
// firebase functions:config:set flutterwave.secret_key="YOUR_FLUTTERWAVE_SECRET_KEY"
// For local testing, you might need to use a .env file and functions.config() will simulate this.

const FLUTTERWAVE_API_URL = "https://api.flutterwave.com/v3/payments";
const FLUTTERWAVE_SECRET_KEY = functions.config().flutterwave?.secret_key || process.env.FLUTTERWAVE_SECRET_KEY;


interface SendTipData {
  toCreatorId: string;
  tipAmount: number;
  message?: string | null;
  tipperPhoneNumber: string; // Tipper's M-Pesa phone number for STK push
  tipperEmail?: string | null;
  tipperName?: string | null;
}

export const sendTipViaMpesa = functions.https.onCall(async (data: SendTipData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to send a tip.");
  }
  if (!FLUTTERWAVE_SECRET_KEY) {
    console.error("Flutterwave secret key is not configured.");
    throw new functions.https.HttpsError("internal", "Payment provider configuration error.");
  }

  const { toCreatorId, tipAmount, message, tipperPhoneNumber, tipperEmail, tipperName } = data;

  if (!toCreatorId || typeof toCreatorId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Invalid creator ID.");
  }
  if (!tipAmount || typeof tipAmount !== "number" || tipAmount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid tip amount. Amount must be greater than 0.");
  }
  if (message && typeof message !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Invalid message format.");
  }
  if (!tipperPhoneNumber || typeof tipperPhoneNumber !== "string" || !/^\+254[17]\d{8}$/.test(tipperPhoneNumber)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid tipper phone number. Format: +2547XXXXXXXX or +2541XXXXXXXX."
    );
  }


  const fromUserId = context.auth.uid;
  const platformFeePercentage = 0.05; // 5%
  const platformFee = Math.round(tipAmount * platformFeePercentage * 100) / 100; // Round to 2 decimal places
  const creatorAmount = Math.round((tipAmount - platformFee) * 100) / 100;
  const txRef = `TIPKESHO-${uuidv4()}`;

  // Fetch creator details to get their handle
  let toCreatorHandle = null;
  try {
    const creatorDoc = await db.collection("creators").doc(toCreatorId).get();
    if (creatorDoc.exists) {
      toCreatorHandle = creatorDoc.data()?.tipHandle || `creator_${toCreatorId.substring(0, 5)}`;
    } else {
      functions.logger.warn(`Creator document not found for toCreatorId: ${toCreatorId}`);
      toCreatorHandle = `creator_${toCreatorId.substring(0, 5)}`; // Fallback handle
    }
  } catch (error) {
    functions.logger.error("Error fetching creator handle:", error);
    toCreatorHandle = `creator_${toCreatorId.substring(0, 5)}`; // Fallback handle
  }


  // Store initial tip record in Firestore
  const tipDocRef = db.collection("tips").doc();
  try {
    await tipDocRef.set({
      fromUserId: fromUserId,
      fromUsername: context.auth.token.name || tipperName || "Anonymous Supporter",
      toCreatorId: toCreatorId,
      toCreatorHandle: toCreatorHandle,
      amount: tipAmount,
      platformFee: platformFee,
      creatorAmount: creatorAmount,
      message: message || null,
      mpesaPhone: tipperPhoneNumber, // This is the tipper's phone for STK PUSH
      platformReceivingMpesa: "+254791556369", // Static platform M-Pesa as requested
      paymentRef: txRef,
      paymentProvider: "flutterwave",
      paymentStatus: "initiated", // Initial status
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    functions.logger.error("Error creating initial tip document in Firestore:", error);
    throw new functions.https.HttpsError("internal", "Failed to record tip initiation.");
  }

  // Flutterwave Payload
  const flutterwavePayload = {
    tx_ref: txRef,
    amount: tipAmount.toString(), // Amount should be a string for Flutterwave
    currency: "KES",
    redirect_url: "https://tipkesho.com/payment-callback/flutterwave", // Replace with your actual success/callback URL
    payment_options: "mpesa",
    customer: {
      email: tipperEmail || context.auth.token.email || "supporter@tipkesho.com", // Fallback email
      phonenumber: tipperPhoneNumber, // Tipper's phone number for STK push
      name: tipperName || context.auth.token.name || "TipKesho Supporter",
    },
    customizations: {
      title: `Tip to ${toCreatorHandle || "Creator"} on TipKesho`,
      description: `Supporting creative talent. Tip Amount: KES ${tipAmount}`,
      logo: "https://tipkesho.com/logo.png", // Replace with your actual logo URL
    },
    meta: {
      tip_id: tipDocRef.id,
      from_user_id: fromUserId,
      to_creator_id: toCreatorId,
    },
  };

  try {
    const response = await axios.post(FLUTTERWAVE_API_URL, flutterwavePayload, {
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.status === "success") {
      // STK Push initiated by Flutterwave.
      // Client should show a message to check their phone.
      // The actual payment confirmation will happen via webhook.
      // Update Firestore status if needed based on immediate Flutterwave response
      // (though "initiated" is usually fine until webhook confirms)
      await tipDocRef.update({
        flutterwaveResponse: response.data, // Store Flutterwave's initial response
      });
      return {
        success: true,
        message: "STK Push initiated. Please complete the payment on your phone.",
        data: response.data,
      };
    } else {
      functions.logger.error("Flutterwave payment initiation failed:", response.data);
      await tipDocRef.update({
        paymentStatus: "failed_initiation",
        flutterwaveResponse: response.data,
      });
      throw new functions.https.HttpsError("aborted",
        response.data.message || "Payment initiation failed with provider."
      );
    }
  } catch (error: any) {
    functions.logger.error("Error calling Flutterwave API or updating tip:", error);
    await tipDocRef.update({
      paymentStatus: "error_initiation",
      flutterwaveError: error.response?.data || error.message || "Unknown error",
    });
    if (axios.isAxiosError(error) && error.response) {
      throw new functions.https.HttpsError("internal",
        `Payment provider error: ${error.response.data?.message || error.message}`
      );
    }
    throw new functions.https.HttpsError("internal", "An error occurred while processing the payment.");
  }
});
