import {
  getApps,
  initializeApp,
  applicationDefault,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;
let _initError: string | null = null;

function ensureInitialized() {
  if (_adminApp) return;

  if (getApps().length > 0) {
    _adminApp = getApps()[0];
    _adminAuth = getAuth(_adminApp);
    _adminDb = getFirestore(_adminApp);
    return;
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

  // Strategy 1: Use explicit service account credentials (Vercel production)
  if (clientEmail && privateKey) {
    try {
      _adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log("FIREBASE ADMIN: Initialized with service account credentials");
      _adminAuth = getAuth(_adminApp);
      _adminDb = getFirestore(_adminApp);
      return;
    } catch (e) {
      console.warn("FIREBASE ADMIN: cert initialization failed:", e instanceof Error ? e.message : e);
    }
  } else {
    console.warn(
      "FIREBASE ADMIN: FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY not set."
    );
  }

  // Strategy 2: Use Application Default Credentials (local dev with gcloud)
  try {
    _adminApp = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    console.log("FIREBASE ADMIN: Initialized with applicationDefault credentials");
    _adminAuth = getAuth(_adminApp);
    _adminDb = getFirestore(_adminApp);
    return;
  } catch (e) {
    console.warn("FIREBASE ADMIN: applicationDefault failed:", e instanceof Error ? e.message : e);
  }

  // Strategy 3: Initialize without credentials (will fail on auth operations but won't crash)
  try {
    _adminApp = initializeApp({ projectId });
    _adminAuth = getAuth(_adminApp);
    _adminDb = getFirestore(_adminApp);
    _initError = "Firebase Admin initialized WITHOUT credentials. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel environment variables.";
    console.error("FIREBASE ADMIN:", _initError);
  } catch (e) {
    _initError = `Firebase Admin failed to initialize: ${e instanceof Error ? e.message : String(e)}`;
    console.error("FIREBASE ADMIN:", _initError);
  }
}

// Initialize on first import
ensureInitialized();

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    throw new Error(_initError || "Firebase Admin Auth is not initialized. Check server logs.");
  }
  return _adminAuth;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    throw new Error(_initError || "Firebase Admin Firestore is not initialized. Check server logs.");
  }
  return _adminDb;
}

export function getFirebaseInitError(): string | null {
  return _initError;
}

// Backward-compatible exports
export const adminAuth = (() => { ensureInitialized(); return _adminAuth!; })();
export const adminDb = (() => { ensureInitialized(); return _adminDb!; })();