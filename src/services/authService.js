import { supabase } from "./supabase";

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

/*
 * Ask the server to generate and send the OTP
 * to the protected JWANDOON business mailbox.
 */
export async function sendLoginOtp(email) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your login session is missing. Please sign in again.");
  }

  const { data, error } = await supabase.functions.invoke("send-login-otp", {
    body: {
      email,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || "Unable to send verification code.");
  }

  return data;
}

/*
 * Verify the OTP against the exact authenticated
 * Supabase session.
 */
export async function verifyLoginOtp(email, otp) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Your login session is missing. Please sign in again.",
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "verify-login-otp",
      {
        body: {
          email,
          otp,
        },
      },
    );

  if (error) {
    console.error("OTP verification error:", error);

    // Try to read the actual Edge Function response
    if (error.context) {
      try {
        const responseData = await error.context.json();

        console.error(
          "Edge Function response:",
          responseData,
        );

        throw new Error(
          responseData?.error ||
            "OTP verification failed.",
        );
      } catch (parseError) {
        console.error(
          "Could not parse Edge Function response:",
          parseError,
        );
      }
    }

    throw error;
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        "Unable to verify the code.",
    );
  }

  return data;
}

/*
 * This asks Postgres whether the current
 * authenticated session has completed OTP verification.
 */
export async function isOtpVerified() {
  const { data, error } = await supabase.rpc("is_otp_verified");

  if (error) {
    throw error;
  }

  return data === true;
}
