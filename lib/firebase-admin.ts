import {
  getApps,
  initializeApp,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-career-copilot-fbe05";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (e) {
      console.warn("FIREBASE ADMIN: cert initialization skipped or failed", e);
    }
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  } catch {
    return initializeApp({
      projectId,
    });
  }
};

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);