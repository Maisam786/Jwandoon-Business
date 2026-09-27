import { supabase } from "./supabase";
import { emitNotification } from "./notificationService";

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

export async function createUser({ fullName, email, role }) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: {
      fullName: fullName.trim(),
      email: email.trim(),
      role,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  emitNotification({
    type: "info",
    title: "User invitation created",
    message: `An invitation was created for ${email.trim()}.`,
  });

  return data;
}

export async function manageUser({ userId, action, role }) {
  const { data, error } = await supabase.functions.invoke("manage-user", {
    body: {
      userId,
      action,
      ...(role ? { role } : {}),
    },
  });

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const actionMessages = {
    activate: "User account activated.",
    deactivate: "User account deactivated.",
    change_role: role ? `User role changed to ${role}.` : "User role updated.",
  };

  emitNotification({
    type: action === "deactivate" ? "warning" : "success",
    title: "User account updated",
    message: actionMessages[action] || "A user account was updated.",
  });

  return data;
}
