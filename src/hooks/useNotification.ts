import { useContext } from "react";

import { NotificationContextType } from "../types";
import { NotificationContext } from "../contexts/NotificationContext.definition";

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
