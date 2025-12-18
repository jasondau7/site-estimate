import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // CHANGE THIS TO YOUR RENDER URL ONCE DEPLOYED
  const API_URL = 'https://site-estimate-api.onrender.com'; 

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserToken(data.access_token);
        await SecureStore.setItemAsync('userToken', data.access_token);
        // Fetch user details
        getUserDetails(data.access_token);
        router.replace('/'); // Go to dashboard
      } else {
        alert("Login failed");
      }
    } catch (e) {
      alert("Network Error: " + e);
    }
  };

  const getUserDetails = async (token) => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUserInfo(data);
    } catch (e) { console.log(e); }
  }

  const logout = async () => {
    setUserToken(null);
    setUserInfo(null);
    await SecureStore.deleteItemAsync('userToken');
    router.replace('/');
  };

  // Check login status on app start
  const isLoggedIn = async () => {
    try {
      let token = await SecureStore.getItemAsync('userToken');
      if (token) {
        setUserToken(token);
        getUserDetails(token);
        router.replace('/');
      }
      setIsLoading(false);
    } catch (e) {
        console.log("Login error " + e);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, userToken, userInfo, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};