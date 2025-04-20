import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import axios, { AxiosError } from "axios";
import { AuthUser } from "./types";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiUrl = "/api";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkUserSession = async () => {
      try {
        const response = await axios.get<AuthUser>(`${apiUrl}/accounts/me`);

        if (isMounted) {
          const userData = response.data;
          login(userData);
        }
      } catch (err) {
        if (isMounted) {
          const axiosError = err as AxiosError;
          if (axiosError.response?.status !== 401) {
            console.error(
              "API Error:",
              axiosError.response?.status,
              axiosError.message
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

  const logout = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);

    try {
      await axios.post(`${apiUrl}/accounts/logout`, {});
    } catch (error) {
      console.error("Backend logout failed.", error);
    } finally {
      window.location.href = "/";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isLoading, login, logout }}
    >
      {isLoading ? <div>Loading Session...</div> : children}
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
