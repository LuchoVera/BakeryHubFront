import React, { useState, ReactNode, useCallback, useEffect } from "react";
import { NotificationState, NotificationType } from "../types";
import { NotificationContext } from "./NotificationContext.definition";

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const hideNotification = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setNotification(null);
  }, [timeoutId]);

  const showNotification = useCallback(
    (message: string, type: NotificationType, duration: number = 5000) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newNotification = { message, type, duration };
      setNotification(newNotification);

      if (duration > 0) {
        const id = setTimeout(() => {
          hideNotification();
        }, duration);
        setTimeoutId(id);
      }
    },
    [hideNotification, timeoutId]
  );

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const value = { notification, showNotification, hideNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
