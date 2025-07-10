import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  const BASE_URL = 'http://192.168.195.46/RecordViolation_Working/php-backend';
  const FLASK_URL = 'http://192.168.195.46:5000';

  const apiRequest = async (endpoint, data) => {
    try {
      const response = await axios.post(`${BASE_URL}/${endpoint}`, data, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const register = async (username, email, password, confirmPassword) => {
    setIsLoading(true);
    try {
      if (password !== confirmPassword) throw new Error("Passwords don't match");

      const data = await apiRequest('register.php', { username, email, password });
      if (data.success) {
        const user = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email
        };
        setUserInfo(user);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        setIsLoggedIn(true);
        Alert.alert("Success", "Registration successful");
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const data = await apiRequest('login.php', { username, password });
      if (data.success) {
        const user = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email
        };
        setUserInfo(user);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        setIsLoggedIn(true);
      } else {
        throw new Error(data.message || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userInfo');
      setUserInfo({});
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userInfo');
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auto-login error:', error);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userInfo,
        isLoggedIn,
        BASE_URL,
        FLASK_URL,
        register,
        login,
        logout,
        forgotPassword: async (email) => {
          setIsLoading(true);
          try {
            await apiRequest('forgot_password.php', { email });
            Alert.alert("Success", "Password reset instructions sent to email");
          } catch (error) {
            Alert.alert("Error", error.message || "Could not process request");
          } finally {
            setIsLoading(false);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};