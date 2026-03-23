import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Authenticates a user with email and password via Firebase Auth.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function loginUser(email, password) {
  const processedEmail = email.trim();
  try {
    // Log the action (safely) to confirm what is being sent
    console.log(`Attempting login for: [${processedEmail}]`);
    await signInWithEmailAndPassword(auth, processedEmail, password);
    return { success: true };
  } catch (error) {
    // Log error to console for debugging (user will see this in browser)
    console.error("Firebase Login Error Code:", error.code);
    console.error("Firebase Login Error Message:", error.message);

    const errorMessages = {
      "auth/invalid-credential": "Invalid email or password. Please try again.",
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled. Contact your administrator.",
      "auth/too-many-requests": "Too many failed attempts. Please try again later.",
      "auth/operation-not-allowed": "Email/Password login is not enabled in Firebase Console.",
      "auth/network-request-failed": "Network error. Please check your connection.",
    };

    const message =
      errorMessages[error.code] || `Authentication error: ${error.code || "unknown"}`;

    return { success: false, message };
  }
}
