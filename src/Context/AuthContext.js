import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token, userId et username au début
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUsername = await AsyncStorage.getItem('username');
      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);
      setLoading(false);
    };
    loadAuth();
  }, []);

  // login: stocke token, userId, username
  const login = async ({ token, id, username }) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userId', id);
    await AsyncStorage.setItem('username', username);
    setToken(token);
    setUserId(id);
    setUsername(username);
  };

  // signup: identique à login (selon retour API)
  const signup = async ({ token, id, username }) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userId', id);
    await AsyncStorage.setItem('username', username);
    setToken(token);
    setUserId(id);
    setUsername(username);
  };

  // logout: supprime tout
  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('username');
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      userId,
      username,
      loading,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook d’accès pratique
export const useAuth = () => useContext(AuthContext);
