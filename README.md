# AI Career Copilot

AI Career Copilot is a secure, personalized career-coaching application for the Gen AI Academy APAC Edition Ideathon. It helps authenticated users capture a career profile, chat with Gemini over multiple turns, and generate a roadmap tailored to their education, career goal, and current skills.

## Features

- Firebase email/password authentication
- Profile data stored per user in Cloud Firestore
- Authenticated, multi-turn Gemini career chat
- Markdown-rendered responses and Firestore conversation persistence
- Personalized Gemini career roadmaps with roadmap persistence and reload
- User-isolated Firestore access rules
- Cloud Run-ready standalone Next.js container

## Tech stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Firebase Authentication and Cloud Firestore
- Firebase Admin SDK with Application Default Credentials
- Google Gen AI SDK (`@google/genai`) and `gemini-3.7-flash`
- Docker, Artifact Registry, Cloud Run, and Secret Manager

## Architecture

```text
Browser -> Firebase Authentication -> Next.js Route Handler
                                    -> Firebase Admin verifies ID token
                                    -> Firestore users/{uid}
                                    -> Gemini API (server-side only)
```

Roadmaps are stored in `users/{uid}/roadmaps/{roadmapId}`. Chat data remains in `users/{uid}/conversations/{conversationId}/messages/{messageId}`. The server derives identity from `adminAuth.verifyIdToken()`; it never accepts a client-provided UID.

## Local setup

1. Install Node.js 22 or later and authenticate local Application Default Credentials:

   ```bash
   gcloud auth application-default login
   ```

2. Install packages and create `.env.local`:

   ```bash
   npm ci
   ```

   ```dotenv
   GEMINI_API_KEY=your_server_side_gemini_key
   GOOGLE_CLOUD_PROJECT=ai-career-copilot-fbe05
   ```

3. Run the application:

   ```bash
   npm run dev
   ```

4. Deploy the included Firestore rules before use:

   ```bash
   firebase deploy --only firestore:rules --project ai-career-copilot-fbe05
   ```

## Validation

```bash
npm run lint
npm run build
```

The production build uses `.next-build/` as its Next.js output directory, which avoids OneDrive locks on the default `.next/trace` file.

## Cloud Run deployment

Set the project and region, enable required APIs, and store the Gemini key in Secret Manager (substitute your own secret value locally; never commit it):

```bash
gcloud config set project ai-career-copilot-fbe05
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud secrets create GEMINI_API_KEY --replication-policy=automatic
gcloud secrets versions add GEMINI_API_KEY --data-file=-
gcloud builds submit --tag asia-south2-docker.pkg.dev/ai-career-copilot-fbe05/career-copilot/app:latest
gcloud run deploy ai-career-copilot --image asia-south2-docker.pkg.dev/ai-career-copilot-fbe05/career-copilot/app:latest --region asia-south2 --allow-unauthenticated --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest --set-env-vars GOOGLE_CLOUD_PROJECT=ai-career-copilot-fbe05
```

Grant the Cloud Run runtime service account access to Firestore and Secret Manager:

```bash
gcloud projects add-iam-policy-binding ai-career-copilot-fbe05 --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" --role="roles/datastore.user"
gcloud secrets add-iam-policy-binding GEMINI_API_KEY --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" --role="roles/secretmanager.secretAccessor"
```

Use the service account shown by the Cloud Run service for `SERVICE_ACCOUNT_EMAIL`. Cloud Run supplies Application Default Credentials automatically, so no service-account JSON is needed.

## Security

- `GEMINI_API_KEY` is read only by server modules and `.env*` files are gitignored.
- Firebase web configuration is public application configuration; it is not an admin credential. Security is enforced by Firebase Auth and `firestore.rules`.
- API routes require a Firebase ID token and verify it through Firebase Admin.
- Firestore rules restrict each user to their own profile, roadmaps, and conversations.
- Do not commit service-account JSON, private keys, or real environment values.

## Future improvements

- Saved roadmap and conversation history browser
- Profile editing and onboarding progress indicators
- Automated route and end-to-end tests using Firebase emulators
- Rate limiting and structured observability for production traffic
