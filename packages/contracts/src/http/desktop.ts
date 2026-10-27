// The origin of the desktop app's pages (the `app://gameplay` protocol it serves its UI from). The API trusts
// it and answers its calls with CORS and credentials, so the session cookie (which the app makes cross-site)
// works there as on the web.
export const DESKTOP_APP_ORIGIN = 'app://gameplay'
