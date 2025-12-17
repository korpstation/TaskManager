// src/Screen/SignUpScreen.js
import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
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

import {  useMutation } from '@apollo/client/react';

import { SIGN_UP } from "../Graphql/mutations";
import { CheckSquare, ArrowLeft } from "../components/Icons";
import { isDemoUser, createDemoUser } from "../dataMock";

export default function SignUpScreen({ navigation, showToast }) {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { signup, loading: authLoading } = useAuth();

  const [signUp, { loading }] = useMutation(SIGN_UP);

  const handleSubmit = async () => {
    if (!inputUsername || !password || !confirmPassword) {
      showToast && showToast("Please fill in all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast && showToast("Passwords do not match", "error");
      return;
    }

    // 1) Cas DEMO : usernames qui commencent par demo-
    if (isDemoUser(inputUsername)) {
      try {
        // Créer dynamiquement le user demo dans la base mock
        const newUser = await createDemoUser(inputUsername, password);

        // Auto-login immédiat en mode demo
        await signup({
          token: "mock-token-" + inputUsername,
          username: inputUsername,
          id: newUser.id,
        });

        showToast && showToast("Demo account created (local mock)!");
        // RootSwitcher t'enverra sur la DemoStack grâce à isDemoUser(username)
        return;
      } catch (e) {
        if (e.message.includes("already exists")) {
          showToast && showToast("Demo username already exists", "error");
        } else {
          showToast && showToast(e?.message || "Demo signup error", "error");
        }
        return;
      }
    }

    // 2) Cas normal : on utilise l'API GraphQL SIGN_UP
    try {
      const res = await signUp({
        variables: { username: inputUsername, password },
      });

      if (!res.data?.signUp || res.data.signUp === null) {
        showToast &&
          showToast("Sign up failed. Username may already exist.", "error");
        return;
      }

      const token = res.data.signUp;

      await signup({
        token,
        username: inputUsername,
        id: null, // tu pourras récupérer l'id plus tard si besoin
      });

      showToast && showToast("Account created successfully!");
    } catch (error) {
      if (error?.message?.toLowerCase().includes("exists")) {
        showToast && showToast("Username already exists", "error");
      } else {
        showToast && showToast(error?.message || "Sign up error", "error");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("SignIn")}
      >
        <ArrowLeft size={20} color="#FFFFFF" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CheckSquare size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start managing your tasks today</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={inputUsername}
                onChangeText={setInputUsername}
                placeholder="Choose a username"
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
                placeholder="Create a password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
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
                {loading || authLoading ? "Registering..." : "Register"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignIn")}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>

            {/* Info demo facultative */}
            <Text
              style={{
                marginTop: 16,
                fontSize: 13,
                color: "#999",
                textAlign: "center",
              }}
            >
              Tip: use a username starting with "demo-" to create a local demo
              account (no server).
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
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
