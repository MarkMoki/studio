import * as functions from "firebase-functions";
import *  as admin from "firebase-admin";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import corsLib from "cors";

// Initialize cors middleware
const cors = corsLib({ origin: true });

admin.initializeApp();
const db = admin.firestore();

const FLUTTERWAVE_API_URL = "https://api.flutterwave.com/v3/payments";


interface SendTipData {
  toCreatorId: string;
  tipAmount: number;
  message?: string | null;
  tipperPhoneNumber: string; 
  tipperEmail?: string | null;
  tipperName?: string | null;
}

export const sendTipViaMpesa = functions.runWith({ secrets: ["FLUTTERWAVE_SECRET_KEY"] }).https.onCall(async (data: SendTipData, context) => {
  // Wrap the function logic with cors handler
  // Note: onCall functions don't typically need manual CORS handling like onRequest.
  // However, if client-side SDK calls are still being blocked, this explicit setup (though usually for onRequest)
  // or ensuring the client origin is whitelisted in GCP/Firebase settings might be necessary.
  // For onCall, Firebase handles CORS. If issues persist, it might be a configuration elsewhere or network.
  // Let's keep the core logic as is, since onCall should manage CORS.
  // If specific CORS errors persist for onCall, it's an advanced setup or Firebase project config issue.

  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to send a tip.");
  }

  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!flutterwaveSecretKey) {
    const detailedErrorMessage = "CRITICAL: Flutterwave secret key is NOT configured. " +
      "This function cannot operate without it. " +
      "Ensure 'FLUTTERWAVE_SECRET_KEY' is set as a secret in Firebase Functions. " +
      "Use `firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY` and then redeploy the function. " +
      "If using emulators, ensure it's set in your .env file or functions config for emulation.";
    console.error(detailedErrorMessage);
    functions.logger.error(detailedErrorMessage); 
    throw new functions.https.HttpsError("internal", "Payment provider configuration error. Administrator: Please check function logs and ensure FLUTTERWAVE_SECRET_KEY is correctly set and accessible.");
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
  const platformFeePercentage = 0.05; 
  const platformFee = Math.round(tipAmount * platformFeePercentage * 100) / 100; 
  const creatorAmount = Math.round((tipAmount - platformFee) * 100) / 100;
  const txRef = `TIPKESHO-${uuidv4()}`;

  let toCreatorHandle = null;
  try {
    const creatorDoc = await db.collection("creators").doc(toCreatorId).get();
    if (creatorDoc.exists) {
      toCreatorHandle = creatorDoc.data()?.tipHandle || `creator_${toCreatorId.substring(0, 5)}`;
    } else {
      functions.logger.warn(`Creator document not found for toCreatorId: ${toCreatorId}`);
      toCreatorHandle = `creator_${toCreatorId.substring(0, 5)}`; 
    }
  } catch (error) {
    functions.logger.error("Error fetching creator handle:", error);
    toCreatorHandle = `creator_${toCreatorId.substring(0, 5)}`; 
  }

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
      mpesaPhone: tipperPhoneNumber, 
      platformReceivingMpesa: "+254791556369", 
      paymentRef: txRef,
      paymentProvider: "flutterwave",
      paymentStatus: "initiated", 
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    functions.logger.error("Error creating initial tip document in Firestore:", error);
    throw new functions.https.HttpsError("internal", "Failed to record tip initiation.");
  }

  const flutterwavePayload = {
    tx_ref: txRef,
    amount: tipAmount.toString(), 
    currency: "KES",
    redirect_url: "https://tipkesho.com/payment-callback/flutterwave", 
    payment_options: "mpesa",
    customer: {
      email: tipperEmail || context.auth.token.email || "supporter@tipkesho.com", 
      phonenumber: tipperPhoneNumber, 
      name: tipperName || context.auth.token.name || "TipKesho Supporter",
    },
    customizations: {
      title: `Tip to ${toCreatorHandle || "Creator"} on TipKesho`,
      description: `Supporting creative talent. Tip Amount: KES ${tipAmount}`,
      logo: "https://tipkesho.com/logo.png", 
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
        Authorization: `Bearer ${flutterwaveSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.status === "success") {
      await tipDocRef.update({
        flutterwaveResponse: response.data, 
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

// This is an example of how you might add CORS to an HTTP onRequest function.
// For onCall functions, Firebase SDKs typically handle this.
// If CORS issues persist with onCall, it often means the invoking client origin
// (e.g., your web app's domain) is not authorized in the Google Cloud Console
// for the specific API (`cloudfunctions.googleapis.com`).
export const exampleHttpRequestWithCors = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Your function logic here
    res.json({ message: "CORS enabled for this HTTP request!" });
  });
});
