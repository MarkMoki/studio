
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCt6woSQjjpiFupLgNb_QvXg_FZc6tYwpI",
  authDomain: "tipkesho-b8e63.firebaseapp.com",
  projectId: "tipkesho-b8e63",
  storageBucket: "tipkesho-b8e63.appspot.com", // Corrected common pattern, user had .firebasestorage.app
  messagingSenderId: "714230357930",
  appId: "1:714230357930:web:1c5f2cafb9d6f0173355d3",
  measurementId: "G-GKDNVSLGTB"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Analytics if supported
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
