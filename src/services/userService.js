import { supabase } from "./supabase";

export async function getUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createUser({
  fullName,
  email,
  role,
}) {
  const { data, error } = await supabase.functions.invoke(
    "create-user",
    {
      body: {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
      },
    },
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function manageUser({
  userId,
  action,
  role,
}) {
  const { data, error } = await supabase.functions.invoke(
    "manage-user",
    {
      body: {
        userId,
        action,
        ...(role ? { role } : {}),
      },
    },
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}