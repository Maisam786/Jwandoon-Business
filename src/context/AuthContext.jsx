import {
  createContext,
  useContext,
  useEffect,
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
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [otpRequired, setOtpRequired] =
    useState(false);

  const [otpEmail, setOtpEmail] =
    useState("");

  /*
   * Password login.
   *
   * At this point the Supabase session exists,
   * but the user is NOT considered fully
   * authenticated by the application yet.
   */
  async function signIn(email, password) {
    const data = await authSignIn(
      email,
      password,
    );

    const signedInUser = data?.user;

    if (!signedInUser) {
      throw new Error(
        "Unable to establish login session.",
      );
    }

    setUser(signedInUser);
    setProfile(null);

    const normalizedEmail =
      String(
        signedInUser.email || email,
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
      await sendLoginOtp(
        normalizedEmail,
      );
    } catch (error) {
      /*
       * If OTP generation fails, don't leave
       * a partially authenticated application
       * session running.
       */
      await authSignOut();

      setUser(null);
      setProfile(null);
      setOtpRequired(false);
      setOtpEmail("");

      throw error;
    }

    return data;
  }

  /*
   * Verify the OTP entered by the user.
   */
  async function verifyOtp(otp) {
    if (!user || !otpEmail) {
      throw new Error(
        "No login verification is currently pending.",
      );
    }

    await verifyLoginOtp(
      otpEmail,
      otp,
    );

    /*
     * Ask Postgres to confirm that this exact
     * Supabase session has been OTP verified.
     */
    const verified =
      await isOtpVerified();

    if (!verified) {
      throw new Error(
        "OTP verification could not be confirmed.",
      );
    }

    /*
     * Only NOW do we load the business profile.
     */
    const userProfile =
      await getUserProfile(
        user.id,
      );

    if (!userProfile?.active) {
      await authSignOut();

      setUser(null);
      setProfile(null);
      setOtpRequired(false);
      setOtpEmail("");

      throw new Error(
        "This account is inactive.",
      );
    }

    setProfile(userProfile);
    setOtpRequired(false);

    return userProfile;
  }

  async function resendOtp() {
    if (!user || !otpEmail) {
      throw new Error(
        "No login verification is currently pending.",
      );
    }

    await sendLoginOtp(
      otpEmail,
    );
  }

  async function signOut() {
    await authSignOut();

    setUser(null);
    setProfile(null);
    setOtpRequired(false);
    setOtpEmail("");
  }

  /*
   * Load an existing Supabase session when
   * the application starts or the page reloads.
   */
  async function loadSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setOtpRequired(false);
        setOtpEmail("");
        return;
      }

      const sessionUser =
        session.user;

      setUser(sessionUser);

      const normalizedEmail =
        String(
          sessionUser.email || "",
        )
          .trim()
          .toLowerCase();

      setOtpEmail(
        normalizedEmail,
      );

      /*
       * Check the database rather than trusting
       * local React state.
       */
      const verified =
        await isOtpVerified();

      if (!verified) {
        setProfile(null);
        setOtpRequired(true);
        return;
      }

      /*
       * OTP is already verified for this
       * current Supabase session.
       */
      const userProfile =
        await getUserProfile(
          sessionUser.id,
        );

      if (!userProfile?.active) {
        await authSignOut();

        setUser(null);
        setProfile(null);
        setOtpRequired(false);
        setOtpEmail("");

        return;
      }

      setProfile(userProfile);
      setOtpRequired(false);
    } catch (error) {
      console.error(
        "Failed to load authentication session:",
        error,
      );

      /*
       * Don't automatically destroy the session
       * for every temporary error.
       */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session,
        ) => {
          /*
           * SIGNED_OUT is the only auth event
           * that should immediately clear the
           * application state.
           */
          if (
            event === "SIGNED_OUT" ||
            !session?.user
          ) {
            setUser(null);
            setProfile(null);
            setOtpRequired(false);
            setOtpEmail("");
            setLoading(false);
            return;
          }

          /*
           * We intentionally do NOT call
           * getUserProfile() here.
           *
           * A newly signed-in user must complete
           * OTP first.
           */
          setUser(
            session.user,
          );

          const normalizedEmail =
            String(
              session.user.email || "",
            )
              .trim()
              .toLowerCase();

          setOtpEmail(
            normalizedEmail,
          );

          /*
           * For SIGNED_IN, loadSession/OTP flow
           * handles the actual authorization.
           *
           * Avoid doing database work directly
           * inside this auth-state callback.
           */
          if (
            event === "SIGNED_IN"
          ) {
            setProfile(null);
            setOtpRequired(true);
          }

          setLoading(false);
        },
      );

    return () =>
      subscription.unsubscribe();
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}