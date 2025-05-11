
import * as functions from "firebase-functions";
import *  as admin from "firebase-admin";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import corsLib from "cors";

// Initialize cors middleware
// This allows all origins. For `onRequest` functions, this middleware should be used.
const cors = corsLib({ origin: true });

admin.initializeApp();
const db = admin.firestore();

const FLUTTERWAVE_API_URL = "https://api.flutterwave.com/v3/payments";
const FLUTTERWAVE_API_TIMEOUT_MS = 30000; // 30 seconds
const MAX_FLUTTERWAVE_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds


interface SendTipData {
  toCreatorId: string;
  tipAmount: number;
  message?: string | null;
  tipperPhoneNumber: string;
  tipperEmail?: string | null;
  tipperName?: string | null;
}

export const sendTipViaMpesa = functions
  .runWith({ timeoutSeconds: 300, secrets: ["FLUTTERWAVE_SECRET_KEY"] })
  .https.onRequest(async (req, res) => {
  // Apply CORS middleware
  cors(req, res, async () => {
    const invocationTime = Date.now();
    const errorRefBase = `CF_TIPKESHO_${invocationTime}`;

    functions.logger.info("sendTipViaMpesa (onRequest) function invoked.", {
      requestBody: req.body,
      requestHeaders: req.headers,
      requestOrigin: req.headers.origin,
      invocationTime,
    });

    if (req.method !== "POST") {
      functions.logger.warn("Invalid request method.", { method: req.method });
      res.status(405).json({ error: "Method Not Allowed", message: "Only POST requests are accepted." });
      return;
    }

    let authContext: { uid: string; token: admin.auth.DecodedIdToken } | null = null;
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      functions.logger.warn("User is not authenticated. Missing or invalid Authorization header.");
      // Allow anonymous tips if no token, but log it. Some features might depend on auth.
      // If strict auth is required, uncomment the res.status(401) block.
      // res.status(401).json({ error: "unauthenticated", message: "User must be authenticated to send a tip." });
      // return;
    } else {
      const idToken = authorizationHeader.split("Bearer ")[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        authContext = { uid: decodedToken.uid, token: decodedToken };
        functions.logger.info(`Authenticated user: ${authContext.uid}`);
      } catch (error) {
        functions.logger.error("Error verifying ID token:", error);
        res.status(401).json({ error: "unauthenticated", message: "Invalid authentication token." });
        return;
      }
    }
    
    // If auth is strictly required and authContext is null, uncomment this block
    if (!authContext) {
       functions.logger.warn("Proceeding with unauthenticated/anonymous tip due to missing/invalid auth token.");
       // If you decide anonymous tips are not allowed:
       // res.status(401).json({ error: "unauthenticated", message: "User must be authenticated to send a tip." });
       // return;
    }


    try {
      const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

      if (!flutterwaveSecretKey) {
        const detailedErrorMessage = "CRITICAL: Flutterwave secret key is NOT configured. " +
          "This function cannot operate without it. " +
          "Ensure 'FLUTTERWAVE_SECRET_KEY' is set as a secret in Firebase Functions. " +
          "Use `firebase functions:secrets:set FLUTTERWAVE_SECRET_KEY` and then redeploy the function. " +
          "If using emulators, ensure it's set in your .env file or functions config for emulation.";
        functions.logger.error(detailedErrorMessage);
        res.status(500).json({ error: "internal", message: `Payment provider configuration error. Please contact support. Ref: FSK_MISSING_${errorRefBase}` });
        return;
      }
      functions.logger.info("Flutterwave secret key is present.");

      const data: SendTipData = req.body;
      const { toCreatorId, tipAmount, message, tipperPhoneNumber, tipperEmail, tipperName } = data;

      if (!toCreatorId || typeof toCreatorId !== "string") {
        functions.logger.warn("Invalid creator ID received.", { toCreatorId });
        res.status(400).json({ error: "invalid-argument", message: "Invalid creator ID." });
        return;
      }
      if (!tipAmount || typeof tipAmount !== "number" || tipAmount <= 0) {
        functions.logger.warn("Invalid tip amount.", { tipAmount });
        res.status(400).json({ error: "invalid-argument", message: "Invalid tip amount. Amount must be greater than 0." });
        return;
      }
      if (message && typeof message !== "string") {
        functions.logger.warn("Invalid message format.", { message });
        res.status(400).json({ error: "invalid-argument", message: "Invalid message format." });
        return;
      }
      if (!tipperPhoneNumber || typeof tipperPhoneNumber !== "string" || !/^\+254[17]\d{8}$/.test(tipperPhoneNumber)) {
        functions.logger.warn("Invalid tipper phone number.", { tipperPhoneNumber });
        res.status(400).json({ error: "invalid-argument", message: "Invalid tipper phone number. Format: +2547XXXXXXXX or +2541XXXXXXXX." });
        return;
      }
      functions.logger.info("Input validation passed.");

      const fromUserId = authContext ? authContext.uid : "anonymous"; // Handle anonymous if authContext is null
      const fromUsername = authContext?.token?.name || tipperName || "Anonymous Supporter";

      const platformFeePercentage = 0.05;
      const platformFee = Math.round(tipAmount * platformFeePercentage * 100) / 100;
      const creatorAmount = Math.round((tipAmount - platformFee) * 100) / 100;
      const txRef = `TIPKESHO-${uuidv4()}`;

      let toCreatorHandle = `creator_${toCreatorId.substring(0, 5)}`;
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
      }

      const tipDocRef = db.collection("tips").doc();
      functions.logger.info(`Generated Tip Document ID: ${tipDocRef.id}`);

      const tipInitialData = {
        fromUserId: fromUserId,
        fromUsername: fromUsername,
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
        paymentStatus: "initiated" as const,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await tipDocRef.set(tipInitialData);
        functions.logger.info(`Initial tip document created in Firestore for tip ID: ${tipDocRef.id}`);
      } catch (error: any) {
        functions.logger.error("Error creating initial tip document in Firestore:", { tipId: tipDocRef.id, error, errorMessage: error.message });
        res.status(500).json({ error: "internal", message: `Failed to record tip initiation. Please try again. Ref: FSTORE_INIT_FAIL_${errorRefBase}` });
        return;
      }

      const flutterwavePayload = {
        tx_ref: txRef,
        amount: tipAmount.toString(),
        currency: "KES",
        redirect_url: "https://tipkesho.com/payment-callback/flutterwave", 
        payment_options: "mpesa",
        customer: {
          email: tipperEmail || authContext?.token?.email || `supporter_${fromUserId.substring(0,5)}@tipkesho.com`,
          phonenumber: tipperPhoneNumber,
          name: fromUsername,
        },
        customizations: {
          title: `Tip to ${toCreatorHandle} on TipKesho`,
          description: `Supporting creative talent. Tip Amount: KES ${tipAmount}`,
          logo: "https://tipkesho.com/logo.png", 
        },
        meta: {
          tip_id: tipDocRef.id,
          from_user_id: fromUserId,
          to_creator_id: toCreatorId,
        },
      };
      functions.logger.info("Prepared Flutterwave payload.", { txRef, payload: flutterwavePayload });
      
      let attempt = 0;
      let flutterwaveResponseData;
      let lastError: any;

      while (attempt < MAX_FLUTTERWAVE_RETRIES) {
        attempt++;
        functions.logger.info(`Attempt ${attempt} to call Flutterwave API.`, { txRef });
        try {
          const response = await axios.post(FLUTTERWAVE_API_URL, flutterwavePayload, {
            headers: {
              Authorization: `Bearer ${flutterwaveSecretKey}`,
              "Content-Type": "application/json",
            },
            timeout: FLUTTERWAVE_API_TIMEOUT_MS,
          });
          functions.logger.info(`Flutterwave API attempt ${attempt} response status: ${response.status}`, { txRef, responseStatus: response.status, responseData: response.data });
          flutterwaveResponseData = response.data;

          if (response.data && response.data.status === "success") {
            functions.logger.info("Flutterwave payment initiation successful.", { txRef, responseData: response.data });
            await tipDocRef.update({
              flutterwaveResponse: response.data,
            });
            res.status(200).json({
              success: true,
              message: "STK Push initiated. Please complete the payment on your phone.",
              data: response.data,
            });
            return;
          } else {
            functions.logger.warn(`Flutterwave payment initiation attempt ${attempt} failed by API.`, { txRef, responseData: response.data });
            lastError = new Error(response.data?.message || `Payment initiation failed with provider on attempt ${attempt}.`);
            if (attempt < MAX_FLUTTERWAVE_RETRIES) {
              functions.logger.info(`Will retry after ${RETRY_DELAY_MS}ms.`, { txRef });
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              continue;
            } else {
               await tipDocRef.update({
                paymentStatus: "failed_initiation" as const,
                flutterwaveResponse: response.data || { error: "No data in response after retries" },
                lastError: lastError.message,
              });
              res.status(500).json({ error: "aborted",
                message: lastError.message || `Payment initiation failed after ${MAX_FLUTTERWAVE_RETRIES} attempts. Ref: FW_API_RETRY_FAIL_${errorRefBase}`
              });
              return;
            }
          }
        } catch (error: any) {
          lastError = error;
          functions.logger.error(`Error during Flutterwave API call attempt ${attempt}:`, {
            txRef,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            isAxiosError: axios.isAxiosError(error),
            axiosErrorDetails: axios.isAxiosError(error) ? {
              status: error.response?.status,
              data: error.response?.data,
              isTimeout: error.code === 'ECONNABORTED',
            } : "Not an Axios error",
            errorRef: `FW_CATCH_ATTEMPT_${attempt}_${errorRefBase}`
          });

          if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || !error.response) && attempt < MAX_FLUTTERWAVE_RETRIES) {
            functions.logger.info(`Network error or timeout on attempt ${attempt}. Will retry after ${RETRY_DELAY_MS}ms.`, { txRef });
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }
          break;
        }
      } 

      functions.logger.error("Flutterwave API call failed after all retries or due to unretryable error.", { txRef, lastError });
      try {
        await tipDocRef.update({
          paymentStatus: "error_initiation" as const,
          flutterwaveError: axios.isAxiosError(lastError) ?
            (lastError.response?.data || { message: lastError.message, code: lastError.code, isTimeout: lastError.code === 'ECONNABORTED' }) :
            { message: lastError?.message, name: lastError?.name, code: lastError?.code, stack: lastError?.stack } || "Unknown error during API call",
        });
      } catch (updateError: any) {
        functions.logger.error("CRITICAL: Failed to update tip document after Flutterwave final error", { tipId: tipDocRef.id, updateError, updateErrorMessage: updateError.message, errorRef: `FW_FINAL_UPDATE_FAIL_${errorRefBase}` });
      }

      const clientErrorMessage = axios.isAxiosError(lastError) ? (lastError.response?.data?.message || lastError.message) : (lastError?.message || "Unknown error");
      if (axios.isAxiosError(lastError) && lastError.response) {
        res.status(500).json({ error: "internal",
          message: `Payment provider error: ${clientErrorMessage}. Ref: FW_AXIOS_FINAL_ERR_${lastError.response.status || 'NO_STATUS'}_${errorRefBase}`
        });
      } else {
        res.status(500).json({ error: "internal", message: `An error occurred while processing the payment. ${clientErrorMessage}. Ref: FW_GEN_FINAL_ERR_${errorRefBase}` });
      }
      return;

    } catch (error: any) {
      let detailedClientErrorMessage = "An unexpected error occurred. Please try again.";
      if (error.message) {
        detailedClientErrorMessage += ` Message: ${error.message}.`;
      }
      if (error.code) {
          detailedClientErrorMessage += ` Code: ${error.code}.`;
      }
      const finalErrorRef = `CF_UNHANDLED_FINAL_${errorRefBase}`;
      detailedClientErrorMessage += ` ${finalErrorRef}`;

      functions.logger.error("Unhandled error in sendTipViaMpesa (onRequest) function:", {
          errorMessage: error.message,
          errorCode: error.code,
          errorStack: error.stack,
          errorDetails: error.details, 
          fullErrorObject: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          errorRef: finalErrorRef
      });
      
      // Check if it's an HttpsError-like structure from previous logic if any part was missed in refactor
      if (error.httpErrorCode && error.httpErrorCode.canonicalName) {
         const statusCode = (error.httpErrorCode.canonicalName === 'UNAUTHENTICATED') ? 401 :
                           (error.httpErrorCode.canonicalName === 'INVALID_ARGUMENT') ? 400 : 500;
        res.status(statusCode).json({ error: error.code || 'internal', message: detailedClientErrorMessage });
      } else {
        res.status(500).json({ error: "internal", message: detailedClientErrorMessage });
      }
    }
  });
});


export const exampleHttpRequestWithCors = functions.https.onRequest((req, res) => {
  // Apply CORS middleware
  cors(req, res, async () => {
    // Your function logic here
    res.json({ message: "CORS enabled for this HTTP request!" });
  });
});

