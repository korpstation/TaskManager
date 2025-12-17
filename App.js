import "./src/polyfills";

import React from "react";
import { StyleSheet, StatusBar, View, Platform } from "react-native";
import { ApolloProvider } from "@apollo/client/react";

import { client } from "./src/Graphql/client";
import { AuthProvider, useAuth } from "./src/Context/AuthContext";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/Screen/HomeScreen";
import ListDetailScreen from "./src/Screen/ListDetailScreen";
import ProfileScreen from "./src/Screen/ProfileScreen";
import SignInScreen from "./src/Screen/SignInScreen";
import SignUpScreen from "./src/Screen/SignUpScreen";

import DemoTabNavigator from "./src/Screen/demoScreen/DemoTabNavigator";
import { isDemoUser } from "./src/dataMock";

import { Home, User } from "./src/components/Icons";
import Toast from "./src/components/Toast";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function HomeStackNavigator({ showToast, setAllLists }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain">
        {(props) => (
          <HomeScreen
            {...props}
            showToast={showToast}
            setAllLists={setAllLists}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="ListDetail" component={ListDetailScreen} />
    </HomeStack.Navigator>
  );
}

function AuthStackNavigator({ showToast }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn">
        {(props) => <SignInScreen {...props} showToast={showToast} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="SignUp">
        {(props) => <SignUpScreen {...props} showToast={showToast} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function RootSwitcher({ showToast }) {
  const { token, username } = useAuth();
  const [allLists, setAllLists] = React.useState([]);

  if (!token) {
    return (
      <NavigationContainer>
        <AuthStackNavigator showToast={showToast} />
      </NavigationContainer>
    );
  }

  // Mode DEMO → onglets démo
  if (isDemoUser(username)) {
    return (
      <NavigationContainer>
        <DemoTabNavigator showToast={showToast} />
      </NavigationContainer>
    );
  }

  // Mode normal → onglets normaux
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => {
            if (route.name === "Home") {
              return <Home size={24} color={focused ? "#21808D" : "#999"} />;
            }
            if (route.name === "Profile") {
              return <User size={24} color={focused ? "#21808D" : "#999"} />;
            }
            return null;
          },
          tabBarActiveTintColor: "#21808D",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E0E0E0",
            height: Platform.OS === "android" ? 72 : 64,
            paddingBottom: Platform.OS === "android" ? 30 : 12,
            paddingTop: 8,
          },
        })}
      >
        <Tab.Screen name="Home">
          {(props) => (
            <HomeStackNavigator
              {...props}
              showToast={showToast}
              setAllLists={setAllLists}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {(props) => (
            <ProfileScreen
              {...props}
              showToast={showToast}
              allLists={allLists}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [toast, setToast] = React.useState({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: "", type: "success" });
    }, 3000);
  };

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <View style={styles.container}>
          <StatusBar
            barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"}
            backgroundColor="#21808D"
            translucent={false}
          />
          <RootSwitcher showToast={showToast} />
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
          />
        </View>
      </AuthProvider>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
});
