import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import {  useMutation, useLazyQuery } from '@apollo/client/react';

import { GET_USER_ID } from "../Graphql/queries";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SIGN_IN } from "../Graphql/mutations";
import { CheckSquare } from "../components/Icons";
import { isDemoUser, signInMock } from "../dataMock";

export default function SignInScreen({ navigation, showToast }) {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading: authLoading } = useAuth();
  const [signIn, { loading }] = useMutation(SIGN_IN);
  const [getUserId] = useLazyQuery(GET_USER_ID);

  const handleSubmit = async () => {
    if (!inputUsername || !password) {
      showToast && showToast("Please fill in all fields", "error");
      return;
    }

    // 1) Cas DEMO : usernames demo-*
    if (isDemoUser(inputUsername)) {
      try {
        const { token, userId } = await signInMock(inputUsername, password);

        await login({
          token,
          id: userId,
          username: inputUsername,
        });

        showToast && showToast("Welcome (demo profile)!");
        return;
      } catch (e) {
        showToast && showToast("Incorrect demo username or password", "error");
        return;
      }
    }

    // 2) Cas normal : GraphQL comme avant
    try {
      const res = await signIn({
        variables: { username: inputUsername, password },
      });

      // Handle invalid login (API returns null or missing token)
      if (!res.data?.signIn || res.data.signIn === null) {
        showToast && showToast("Incorrect username or password", "error");
        return;
      }

      const token = res.data.signIn;

      // Retrieve userId after successful sign in
      const userRes = await getUserId({ variables: { username: inputUsername } });
      const userId = userRes.data?.users?.[0]?.id;

      await login({
        token,
        id: userId,
        username: inputUsername,
      });

      showToast && showToast("Welcome!");
    } catch (error) {
      if (
        error?.message?.toLowerCase().includes("invalid") ||
        error?.message?.toLowerCase().includes("incorrect")
      ) {
        showToast && showToast("Incorrect username or password", "error");
      } else {
        showToast && showToast(error?.message || "Login error", "error");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CheckSquare size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>TaskManager</Text>
            <Text style={styles.subtitle}>Manage your tasks efficiently</Text>
          </View>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={inputUsername}
                onChangeText={setInputUsername}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading || authLoading}
            >
              <Text style={styles.buttonText}>
                {loading || authLoading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp")}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Don't have an account? Create Account
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                marginTop: 16,
                fontSize: 13,
                color: "#999",
                textAlign: "center",
              }}
            >
              Use normal username for real account, or demo-user/password1 for demo mode.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#21808D",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  button: {
    backgroundColor: "#21808D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#21808D",
    fontSize: 15,
  },
});
