import { supabase } from "./supabase";

export async function createNotification({
  type = "info",
  title,
  message,
  userId = null,
}) {
  if (!title) {
    return null;
  }

  const { data, error } = await supabase.rpc(
    "create_notification",
    {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message || "",
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function getNotifications(limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      user_id,
      type,
      title,
      message,
      read,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function markNotificationAsRead(
  notificationId,
) {
  if (!notificationId) {
    return null;
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: true,
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function markAllNotificationsAsRead() {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: true,
    })
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .eq("read", false)
    .select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function emitNotification({
  type = "info",
  title,
  message,
}) {
  if (!title) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("jwandoon:notification", {
      detail: {
        type,
        title,
        message,
      },
    }),
  );
}