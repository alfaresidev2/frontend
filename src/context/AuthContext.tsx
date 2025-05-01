"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  // Check for token on initial load
  useEffect(() => {
    const storedToken = Cookies.get('token') || localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading) {
      // If not authenticated and not on signin page, redirect to signin
      if (!token && pathname !== "/signin") {
        router.push("/signin");
      }
      
      // If authenticated and on signin page, redirect to home
      if (token && pathname === "/signin") {
        router.push("/");
      }
    }
  }, [token, pathname, loading, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("http://localhost:3001/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      // Save token to cookies (for server-side auth) and localStorage (for client-side auth)
      Cookies.set('token', data.token, { expires: 7, path: '/' }); // 7 days expiry
      localStorage.setItem("token", data.token);
      
      // Create user object from JWT payload
      // This is a simplified example - in a real app, you might decode the JWT
      // or make another API call to get user details
      const user = {
        id: "user-id", // Replace with actual user ID
        email,
      };
      
      localStorage.setItem("user", JSON.stringify(user));
      
      setToken(data.token);
      setUser(user);
      
      // Redirect to home page
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 