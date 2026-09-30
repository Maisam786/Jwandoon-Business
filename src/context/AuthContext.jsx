import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../services/supabase";

import {
  getUserProfile,
  isOtpVerified,
  sendLoginOtp,
  signIn as authSignIn,
  signOut as authSignOut,
  verifyLoginOtp,
  sendPasswordResetEmail,
  changePassword,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  /*
   * Prevent the Supabase auth listener from
   * interfering while the initial session is
   * being restored.
   */
  const initializingRef = useRef(true);

  /*
   * Prevent multiple session restoration
   * requests from running at the same time.
   */
  const sessionCheckRef = useRef(false);

  /* =========================================================
     PASSWORD RESET
     ========================================================= */

  async function requestPasswordReset(email) {
    await sendPasswordResetEmail(email);
  }

  async function updateUserPassword(newPassword) {
    await changePassword(newPassword);
  }

  /* =========================================================
     PASSWORD LOGIN
     ========================================================= */

  async function signIn(email, password) {
    const data = await authSignIn(email, password);

    const signedInUser = data?.user;

    if (!signedInUser) {
      throw new Error("Unable to establish login session.");
    }

    setUser(signedInUser);
    setProfile(null);

    const normalizedEmail = String(
      signedInUser.email || email
    )
      .trim()
      .toLowerCase();

    setOtpEmail(normalizedEmail);
    setOtpRequired(true);

    /*
     * Generate a fresh OTP for this exact
     * authenticated session.
     */
    try {
      await sendLoginOtp(normalizedEmail);
    } catch (error) {
      /*
       * If OTP generation fails, completely
       * clear the partially authenticated state.
       */
      try {
        await authSignOut();
      } catch (signOutError) {
        console.error(
          "Failed to sign out after OTP error:",
          signOutError
        );
      }

      setUser(null);
      setProfile(null);
      setOtpRequired(false);
      setOtpEmail("");

      throw error;
    }

    return data;
  }

  /* =========================================================
     OTP VERIFICATION
     ========================================================= */

  async function verifyOtp(otp) {
    if (!user || !otpEmail) {
      throw new Error(
        "No login verification is currently pending."
      );
    }

    await verifyLoginOtp(otpEmail, otp);

    /*
     * Confirm OTP verification at the database level.
     */
    const verified = await isOtpVerified();

    if (!verified) {
      throw new Error(
        "OTP verification could not be confirmed."
      );
    }

    /*
     * Only after OTP verification do we load
     * the user's business profile.
     */
    const userProfile = await getUserProfile(user.id);

    if (!userProfile?.active) {
      await authSignOut();

      setUser(null);
      setProfile(null);
      setOtpRequired(false);
      setOtpEmail("");

      throw new Error("This account is inactive.");
    }

    setProfile(userProfile);
    setOtpRequired(false);

    return userProfile;
  }

  /* =========================================================
     RESEND OTP
     ========================================================= */

  async function resendOtp() {
    if (!user || !otpEmail) {
      throw new Error(
        "No login verification is currently pending."
      );
    }

    await sendLoginOtp(otpEmail);
  }

  /* =========================================================
     SIGN OUT
     ========================================================= */

  async function signOut() {
    try {
      await authSignOut();
    } finally {
      setUser(null);
      setProfile(null);
      setOtpRequired(false);
      setOtpEmail("");
    }
  }

  /* =========================================================
     RESTORE EXISTING SESSION
     ========================================================= */

  async function loadSession() {
    /*
     * Don't allow multiple restoration checks
     * to run simultaneously.
     */
    if (sessionCheckRef.current) {
      return;
    }

    sessionCheckRef.current = true;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      /*
       * No Supabase session.
       */
      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setOtpRequired(false);
        setOtpEmail("");

        return;
      }

      const sessionUser = session.user;

      const normalizedEmail = String(
        sessionUser.email || ""
      )
        .trim()
        .toLowerCase();

      /*
       * Restore the user first.
       */
      setUser(sessionUser);
      setOtpEmail(normalizedEmail);

      /*
       * IMPORTANT:
       *
       * Check whether THIS existing session has
       * already completed OTP verification.
       */
      const verified = await isOtpVerified();

      if (!verified) {
        /*
         * The session exists but OTP has not been
         * verified for this session.
         */
        setProfile(null);
        setOtpRequired(true);

        return;
      }

      /*
       * OTP is already verified.
       *
       * Restore the business profile.
       */
      const userProfile = await getUserProfile(
        sessionUser.id
      );

      /*
       * Account has been deactivated.
       */
      if (!userProfile?.active) {
        try {
          await authSignOut();
        } catch (signOutError) {
          console.error(
            "Failed to sign out inactive user:",
            signOutError
          );
        }

        setUser(null);
        setProfile(null);
        setOtpRequired(false);
        setOtpEmail("");

        return;
      }

      /*
       * Everything is valid.
       *
       * Restore the dashboard directly.
       */
      setProfile(userProfile);
      setOtpRequired(false);
    } catch (error) {
      console.error(
        "Failed to restore authentication session:",
        error
      );

      /*
       * IMPORTANT:
       *
       * Do NOT automatically sign the user out
       * just because a temporary request failed.
       *
       * This prevents temporary network/browser
       * issues from destroying a valid session.
       */
    } finally {
      sessionCheckRef.current = false;

      /*
       * The initial authentication restoration
       * is now complete.
       */
      initializingRef.current = false;

      setLoading(false);
    }
  }

  /* =========================================================
     AUTH INITIALIZATION + AUTH STATE LISTENER
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    /*
     * First restore the existing session.
     */
    loadSession();

    /*
     * Listen for future Supabase authentication
     * events.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        /*
         * CRITICAL FIX
         *
         * During the initial application startup,
         * loadSession() is responsible for deciding
         * whether OTP is required.
         *
         * Therefore the auth listener must NOT
         * overwrite that state.
         */
        if (initializingRef.current) {
          /*
           * Only handle an immediate SIGNED_OUT
           * event if there is genuinely no session.
           */
          if (
            event === "SIGNED_OUT" &&
            !session?.user
          ) {
            setUser(null);
            setProfile(null);
            setOtpRequired(false);
            setOtpEmail("");
          }

          return;
        }

        /*
         * User explicitly signed out.
         */
        if (
          event === "SIGNED_OUT" ||
          !session?.user
        ) {
          setUser(null);
          setProfile(null);
          setOtpRequired(false);
          setOtpEmail("");

          return;
        }

        /*
         * A NEW password login occurred.
         *
         * The signIn() function itself will also
         * establish the OTP state and send the OTP.
         *
         * We keep the listener lightweight and
         * do not perform database calls here.
         */
        if (event === "SIGNED_IN") {
          const signedInUser = session.user;

          const normalizedEmail = String(
            signedInUser.email || ""
          )
            .trim()
            .toLowerCase();

          setUser(signedInUser);
          setProfile(null);
          setOtpEmail(normalizedEmail);
          setOtpRequired(true);

          return;
        }

        /*
         * TOKEN_REFRESHED
         *
         * Do NOT reset profile or OTP state here.
         *
         * A token refresh is not a new login and
         * should not send the user back to OTP.
         */
        if (event === "TOKEN_REFRESHED") {
          setUser(session.user);

          return;
        }

        /*
         * Other auth events such as USER_UPDATED
         * should not reset the authenticated UI.
         */
        if (event === "USER_UPDATED") {
          setUser(session.user);
        }
      }
    );

    /*
     * Browser/tab visibility handling.
     *
     * When the user returns to the application after
     * switching tabs or minimizing the browser, quietly
     * verify that the existing session is still valid.
     *
     * We deliberately do NOT display the OTP screen
     * during this check.
     */
    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        !initializingRef.current
      ) {
        loadSession();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mounted = false;

      subscription.unsubscribe();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /* =========================================================
     AUTHENTICATION STATE
     ========================================================= */

  const isAuthenticated =
    !!user &&
    !!profile &&
    !otpRequired;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,

        loading,

        otpRequired,
        otpEmail,

        isAuthenticated,

        signIn,
        verifyOtp,
        resendOtp,
        signOut,

        requestPasswordReset,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   HOOK
   ========================================================= */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}