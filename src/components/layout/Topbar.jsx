import { useEffect, useRef, useState } from "react";
import {
  FiBell,
  FiSearch,
  FiUser,
  FiMail,
  FiShield,
  FiCheckCircle,
  FiChevronDown,
  FiPackage,
  FiShoppingBag,
  FiAlertTriangle,
  FiInfo,
  FiCheck,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";
import { supabase } from "../../services/supabase";

import "./Topbar.css";

export default function Topbar() {
  const { profile } = useAuth();

  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const accountRef = useRef(null);
  const notificationRef = useRef(null);

  const userName = profile?.full_name || "User";
  const userRole = profile?.role || "STAFF";
  const userEmail = profile?.email || "No email available";

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  /*
   * ---------------------------------------------------------
   * LOAD PERSISTED NOTIFICATIONS + REALTIME
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!profile?.id) {
      setNotifications([]);
      return undefined;
    }

    let mounted = true;

    async function loadNotifications() {
      try {
        const data = await getNotifications(50);

        if (!mounted) {
          return;
        }

        const formattedNotifications = data.map(
          (notification) => ({
            id: notification.id,
            type: notification.type || "info",
            title:
              notification.title ||
              "JWANDOON notification",
            message: notification.message || "",
            time:
              notification.created_at ||
              new Date().toISOString(),
            read: Boolean(notification.read),
          }),
        );

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error(
          "Unable to load notifications:",
          error,
        );
      }
    }

    loadNotifications();

    /*
     * Listen only for notifications belonging to
     * the currently authenticated user.
     */
    const channel = supabase
      .channel(`jwandoon-notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notification = payload.new;

          if (!notification) {
            return;
          }

          const newNotification = {
            id: notification.id,
            type: notification.type || "info",
            title:
              notification.title ||
              "JWANDOON notification",
            message: notification.message || "",
            time:
              notification.created_at ||
              new Date().toISOString(),
            read: Boolean(notification.read),
          };

          setNotifications((current) => {
            const alreadyExists = current.some(
              (item) => item.id === newNotification.id,
            );

            if (alreadyExists) {
              return current;
            }

            return [
              newNotification,
              ...current,
            ].slice(0, 50);
          });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Notification realtime channel error.",
          );
        }
      });

    return () => {
      mounted = false;

      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  /*
   * ---------------------------------------------------------
   * LOCAL NOTIFICATION BRIDGE
   * ---------------------------------------------------------
   *
   * This keeps compatibility with the existing
   * jwandoon:notification event while the services
   * are being migrated to persistent notifications.
   */
  useEffect(() => {
    function handleNotification(event) {
      const notification = event.detail;

      if (!notification) {
        return;
      }

      const newNotification = {
        id:
          notification.id ||
          `local-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
        type: notification.type || "info",
        title:
          notification.title ||
          "JWANDOON notification",
        message: notification.message || "",
        time:
          notification.time ||
          new Date().toISOString(),
        read: false,
      };

      setNotifications((current) => [
        newNotification,
        ...current,
      ].slice(0, 50));
    }

    window.addEventListener(
      "jwandoon:notification",
      handleNotification,
    );

    return () => {
      window.removeEventListener(
        "jwandoon:notification",
        handleNotification,
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * OUTSIDE CLICK
   * ---------------------------------------------------------
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * ESCAPE KEY
   * ---------------------------------------------------------
   */
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * NOTIFICATION ACTIONS
   * ---------------------------------------------------------
   */
  async function handleNotificationClick(id) {
    const notification = notifications.find(
      (item) => item.id === id,
    );

    if (!notification || notification.read) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item,
      ),
    );

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error,
      );

      /*
       * Restore unread state if the database update failed.
       */
      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, read: false }
            : item,
        ),
      );
    }
  }

  async function handleMarkAllRead() {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.read,
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error,
      );

      /*
       * Reload the authoritative state if the
       * database operation failed.
       */
      try {
        const data = await getNotifications(50);

        setNotifications(
          data.map((notification) => ({
            id: notification.id,
            type: notification.type || "info",
            title:
              notification.title ||
              "JWANDOON notification",
            message: notification.message || "",
            time:
              notification.created_at ||
              new Date().toISOString(),
            read: Boolean(notification.read),
          })),
        );
      } catch (reloadError) {
        console.error(
          "Unable to reload notifications:",
          reloadError,
        );
      }
    }
  }

  function handleToggleNotifications() {
    setNotificationsOpen((open) => !open);
    setAccountOpen(false);
  }

  function handleToggleAccount() {
    setAccountOpen((open) => !open);
    setNotificationsOpen(false);
  }

  /*
   * ---------------------------------------------------------
   * NOTIFICATION ICONS
   * ---------------------------------------------------------
   */
  function getNotificationIcon(type) {
    switch (type) {
      case "stock":
        return <FiPackage />;

      case "sale":
        return <FiShoppingBag />;

      case "warning":
        return <FiAlertTriangle />;

      case "success":
        return <FiCheck />;

      default:
        return <FiInfo />;
    }
  }

  /*
   * ---------------------------------------------------------
   * NOTIFICATION TIME
   * ---------------------------------------------------------
   */
  function formatNotificationTime(time) {
    const date = new Date(time);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const difference =
      Date.now() - date.getTime();

    const seconds = Math.floor(
      difference / 1000,
    );

    const minutes = Math.floor(
      seconds / 60,
    );

    const hours = Math.floor(
      minutes / 60,
    );

    const days = Math.floor(
      hours / 24,
    );

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  }

  return (
    <header className="topbar">
      <div className="topbar-search">
        <FiSearch />

        <input
          type="search"
          placeholder="Search products, invoices, sales..."
          aria-label="Search products, invoices, sales"
        />
      </div>

      <div className="topbar-actions">
        {/* =====================================================
            NOTIFICATIONS
            ===================================================== */}

        <div
          className="notification-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className={`topbar-icon ${
              notificationsOpen
                ? "topbar-icon-active"
                : ""
            }`}
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
            onClick={handleToggleNotifications}
          >
            <FiBell />

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>

                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread ${
                          unreadCount === 1
                            ? "notification"
                            : "notifications"
                        }`
                      : "You're all caught up"}
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-mark-read"
                    onClick={handleMarkAllRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <div className="notification-empty-icon">
                      <FiBell />
                    </div>

                    <strong>
                      No notifications
                    </strong>

                    <span>
                      New business activity will
                      appear here.
                    </span>
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className={`notification-item ${
                          !notification.read
                            ? "notification-item-unread"
                            : ""
                        }`}
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                          )
                        }
                      >
                        <div
                          className={`notification-item-icon notification-type-${notification.type}`}
                        >
                          {getNotificationIcon(
                            notification.type,
                          )}
                        </div>

                        <div className="notification-item-content">
                          <div className="notification-item-top">
                            <strong>
                              {notification.title}
                            </strong>

                            {!notification.read && (
                              <span className="notification-unread-dot" />
                            )}
                          </div>

                          <p>
                            {notification.message}
                          </p>

                          <span className="notification-time">
                            {formatNotificationTime(
                              notification.time,
                            )}
                          </span>
                        </div>
                      </button>
                    ),
                  )
                )}
              </div>

              <div className="notification-footer">
                <span>JWANDOON BUSINESS</span>
                <small>Business activity</small>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            ACCOUNT
            ===================================================== */}

        <div
          className="user-menu-wrapper"
          ref={accountRef}
        >
          <button
            type="button"
            className={`user-menu ${
              accountOpen
                ? "user-menu-active"
                : ""
            }`}
            onClick={handleToggleAccount}
            aria-expanded={accountOpen}
            aria-haspopup="true"
          >
            <div
              className="user-avatar"
              aria-hidden="true"
            >
              <FiUser />
            </div>

            <div className="user-info">
              <strong title={userName}>
                {userName}
              </strong>

              <span>{userRole}</span>
            </div>

            <FiChevronDown className="user-menu-chevron" />
          </button>

          {accountOpen && (
            <div className="account-dropdown">
              <div className="account-dropdown-header">
                <div className="account-large-avatar">
                  <FiUser />
                </div>

                <div className="account-header-info">
                  <strong>{userName}</strong>
                  <span>{userRole}</span>
                </div>
              </div>

              <div className="account-divider" />

              <div className="account-details">
                <div className="account-detail">
                  <div className="account-detail-icon">
                    <FiMail />
                  </div>

                  <div>
                    <span>Email</span>

                    <strong title={userEmail}>
                      {userEmail}
                    </strong>
                  </div>
                </div>

                <div className="account-detail">
                  <div className="account-detail-icon">
                    <FiShield />
                  </div>

                  <div>
                    <span>Access level</span>
                    <strong>{userRole}</strong>
                  </div>
                </div>

                <div className="account-detail">
                  <div className="account-detail-icon account-status-icon">
                    <FiCheckCircle />
                  </div>

                  <div>
                    <span>Account status</span>
                    <strong>Active</strong>
                  </div>
                </div>
              </div>

              <div className="account-dropdown-footer">
                <span>JWANDOON BUSINESS</span>
                <small>
                  Authorized account
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}