
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

export const sendTipViaMpesa = functions.runWith({ secrets: ["FLUTTERWAVE_SECRET_KEY"] })
  .https.onCall(async (data: SendTipData, context) => {
  functions.logger.info("sendTipViaMpesa function invoked.", { data, authContext: context.auth !== null });

  try { // Top-level try-catch for the entire function body
    if (!context.auth) {
      functions.logger.warn("User is not authenticated.");
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to send a tip.");
    }
    functions.logger.info(`Authenticated user: ${context.auth.uid}`);

    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flutterwaveSecretKey) {
      const detailedErrorMessage = "CRITICAL: Flutterwave secret key is NOT configured. " +
        "This function cannot operate without it. " +
        "Ensure 'FLUTTERWAVE_SECRET_KEY' is set as a secret in Firebase Functions. " +
        "Use `firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY` and then redeploy the function. " +
        "If using emulators, ensure it's set in your .env file or functions config for emulation.";
      functions.logger.error(detailedErrorMessage);
      throw new functions.https.HttpsError("internal", "Payment provider configuration error. Please contact support. Ref: FSK_MISSING");
    }
    functions.logger.info("Flutterwave secret key is present.");

    const { toCreatorId, tipAmount, message, tipperPhoneNumber, tipperEmail, tipperName } = data;

    if (!toCreatorId || typeof toCreatorId !== "string") {
      functions.logger.warn("Invalid creator ID received.", { toCreatorId });
      throw new functions.https.HttpsError("invalid-argument", "Invalid creator ID.");
    }
    if (!tipAmount || typeof tipAmount !== "number" || tipAmount <= 0) {
      functions.logger.warn("Invalid tip amount.", { tipAmount });
      throw new functions.https.HttpsError("invalid-argument", "Invalid tip amount. Amount must be greater than 0.");
    }
    if (message && typeof message !== "string") {
      functions.logger.warn("Invalid message format.", { message });
      throw new functions.https.HttpsError("invalid-argument", "Invalid message format.");
    }
    if (!tipperPhoneNumber || typeof tipperPhoneNumber !== "string" || !/^\+254[17]\d{8}$/.test(tipperPhoneNumber)) {
      functions.logger.warn("Invalid tipper phone number.", { tipperPhoneNumber });
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid tipper phone number. Format: +2547XXXXXXXX or +2541XXXXXXXX."
      );
    }
    functions.logger.info("Input validation passed.");


    const fromUserId = context.auth.uid;
    const platformFeePercentage = 0.05;
    const platformFee = Math.round(tipAmount * platformFeePercentage * 100) / 100;
    const creatorAmount = Math.round((tipAmount - platformFee) * 100) / 100;
    const txRef = `TIPKESHO-${uuidv4()}`;

    let toCreatorHandle = `creator_${toCreatorId.substring(0, 5)}`; // Default handle
    try {
      const creatorDoc = await db.collection("creators").doc(toCreatorId).get();
      if (creatorDoc.exists) {
        toCreatorHandle = creatorDoc.data()?.tipHandle || toCreatorHandle;
        functions.logger.info(`Fetched creator handle: ${toCreatorHandle} for creator ID: ${toCreatorId}`);
      } else {
        functions.logger.warn(`Creator document not found for toCreatorId: ${toCreatorId}. Using default handle.`);
      }
    } catch (error) {
      functions.logger.error(`Error fetching creator handle for ${toCreatorId}:`, error);
      // Continue with default handle, log error
    }

    const tipDocRef = db.collection("tips").doc();
    functions.logger.info(`Generated Tip Document ID: ${tipDocRef.id}`);

    const tipInitialData = {
      fromUserId: fromUserId,
      fromUsername: context.auth.token?.name || tipperName || "Anonymous Supporter",
      toCreatorId: toCreatorId,
      toCreatorHandle: toCreatorHandle,
      amount: tipAmount,
      platformFee: platformFee,
      creatorAmount: creatorAmount,
      message: message || null,
      mpesaPhone: tipperPhoneNumber,
      platformReceivingMpesa: "+254791556369", // TODO: Make this configurable
      paymentRef: txRef,
      paymentProvider: "flutterwave",
      paymentStatus: "initiated" as const, // Ensure type safety
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await tipDocRef.set(tipInitialData);
      functions.logger.info(`Initial tip document created in Firestore for tip ID: ${tipDocRef.id}`);
    } catch (error) {
      functions.logger.error("Error creating initial tip document in Firestore:", { tipId: tipDocRef.id, error });
      throw new functions.https.HttpsError("internal", "Failed to record tip initiation. Please try again. Ref: FSTORE_INIT_FAIL");
    }

    const flutterwavePayload = {
      tx_ref: txRef,
      amount: tipAmount.toString(),
      currency: "KES",
      redirect_url: "https://tipkesho.com/payment-callback/flutterwave", // TODO: Make this dynamic or a placeholder
      payment_options: "mpesa",
      customer: {
        email: tipperEmail || context.auth.token?.email || `supporter_${fromUserId.substring(0,5)}@tipkesho.com`,
        phonenumber: tipperPhoneNumber,
        name: tipperName || context.auth.token?.name || "TipKesho Supporter",
      },
      customizations: {
        title: `Tip to ${toCreatorHandle} on TipKesho`,
        description: `Supporting creative talent. Tip Amount: KES ${tipAmount}`,
        logo: "https://tipkesho.com/logo.png", // TODO: Update placeholder
      },
      meta: {
        tip_id: tipDocRef.id,
        from_user_id: fromUserId,
        to_creator_id: toCreatorId,
      },
    };
    functions.logger.info("Prepared Flutterwave payload.", { txRef });

    try {
      const response = await axios.post(FLUTTERWAVE_API_URL, flutterwavePayload, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          "Content-Type": "application/json",
        },
      });
      functions.logger.info(`Flutterwave API response status: ${response.status}`, { txRef });


      if (response.data && response.data.status === "success") {
        functions.logger.info("Flutterwave payment initiation successful.", { txRef, responseData: response.data });
        await tipDocRef.update({
          flutterwaveResponse: response.data,
          // paymentStatus: "pending_confirmation" // Status remains 'initiated' until webhook confirms
        });
        return {
          success: true,
          message: "STK Push initiated. Please complete the payment on your phone.",
          data: response.data,
        };
      } else {
        functions.logger.error("Flutterwave payment initiation failed by API.", { txRef, responseData: response.data });
        await tipDocRef.update({
          paymentStatus: "failed_initiation" as const,
          flutterwaveResponse: response.data || { error: "No data in response" },
        });
        throw new functions.https.HttpsError("aborted",
          response.data?.message || "Payment initiation failed with provider. Ref: FW_API_FAIL"
        );
      }
    } catch (error: any) {
      functions.logger.error("Error during Flutterwave API call or updating tip document:", { txRef, error });
      const errorResponseData = axios.isAxiosError(error) ? error.response?.data : null;
      const errorMessage = axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : (error.message || "Unknown error");

      await tipDocRef.update({
        paymentStatus: "error_initiation" as const,
        flutterwaveError: errorResponseData || { message: error.message, stack: error.stack } || "Unknown error during API call",
      }).catch(updateError => {
        functions.logger.error("Critical: Failed to update tip document after Flutterwave error", { tipId: tipDocRef.id, updateError });
      });

      if (axios.isAxiosError(error) && error.response) {
        throw new functions.https.HttpsError("internal",
          `Payment provider error: ${errorMessage}. Ref: FW_AXIOS_ERR`
        );
      }
      throw new functions.https.HttpsError("internal", `An error occurred while processing the payment. ${errorMessage}. Ref: FW_GEN_ERR`);
    }
  } catch (error: any) {
    functions.logger.error("Unhandled error in sendTipViaMpesa function:", { error: error.message, stack: error.stack, details: error.details });
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError as is
    }
    // For other types of errors, wrap them in an HttpsError
    throw new functions.https.HttpsError("internal", `An unexpected error occurred. Please try again. Ref: TOP_LVL_CATCH - ${error.message}`);
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
