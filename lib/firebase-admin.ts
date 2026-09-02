import {
  getApps,
  initializeApp,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    return initializeApp({
      credential: applicationDefault(),
      projectId: "ai-career-copilot-fbe05",
    });
  } catch {
    return initializeApp({
      projectId: "ai-career-copilot-fbe05",
    });
  }
};

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);