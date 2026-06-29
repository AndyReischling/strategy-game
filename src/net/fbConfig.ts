// Tiny, dependency-free config check so the rest of the app (and WS/practice
// users) never pull in the Firebase SDK. The SDK is dynamically imported only
// when these are present.
export const fbConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export function isFirebaseConfigured(): boolean {
  return !!fbConfig.apiKey && !!fbConfig.databaseURL;
}
