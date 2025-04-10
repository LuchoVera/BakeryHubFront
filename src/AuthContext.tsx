import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  administeredTenantId?: string | null; 
  administeredTenantSubdomain?: string | null;}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null; 
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'bakery_auth_user';
const apiUrl = 'http://localhost:5176/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("AuthProvider: Restored user session", parsedUser);
      }
    } catch (error) {
       console.error("AuthProvider: Failed to parse stored user", error);
       localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
       setIsLoading(false);
    }
  }, []);

  const login = (userData: AuthUser) => { 
    console.log("AuthProvider: Logging in user", userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = useCallback(async () => {
    console.log("AuthProvider: Logging out user");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      await axios.post(`${apiUrl}/accounts/logout`);
      console.log("AuthProvider: Backend logout successful.");
    } catch (error) {
      console.error("AuthProvider: Backend logout failed.", error);
    }
     window.location.href = '/'; 
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {isLoading ? <div>Loading Session...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};