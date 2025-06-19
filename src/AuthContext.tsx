import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { AuthUser, ApiErrorResponse } from "./types";
import { getCurrentUser, logout as apiLogout } from "./services/apiService";
import { AxiosError } from "axios";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkUserSession = async () => {
      setIsLoading(true);
      try {
        const userData = await getCurrentUser();
        if (isMounted) {
          login(userData);
        }
      } catch (err) {
        if (isMounted) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          if (axiosError.response?.status !== 401) {
            console.error(
              "Error checking user session:",
              axiosError.response?.status,
              axiosError.response?.data?.detail || axiosError.message
            );
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkUserSession();

    return () => {
      isMounted = false;
    };
  }, [login]);

  const logoutContext = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    try {
      await apiLogout();
    } catch (error) {
      console.error(
        "Backend logout failed, but client session is cleared.",
        error
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isLoading, login, logout: logoutContext }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
