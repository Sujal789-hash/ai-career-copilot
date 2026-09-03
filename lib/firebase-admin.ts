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

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "ai-career-copilot-fbe05";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  const privateKey = rawPrivateKey
    ? rawPrivateKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n")
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
      console.warn("FIREBASE ADMIN: cert initialization failed:", e instanceof Error ? e.message : e);
    }
  } else {
    console.warn(
      "FIREBASE ADMIN: FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY environment variable is not set. Falling back to applicationDefault credentials."
    );
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