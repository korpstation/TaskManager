import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DemoHomeScreen from "./DemoHomeScreen";
import { Platform } from "react-native";
import DemoListDetailScreen from "./DemoListDetailScreen";
import DemoProfileScreen from "./DemoProfileScreen";
import { Home, User } from "../../components/Icons";

const Tab = createBottomTabNavigator();
const DemoHomeStack = createNativeStackNavigator();

// Stack interne pour Home + ListDetail (comme HomeStackNavigator)
function DemoHomeStackNavigator({ showToast }) {
  return (
    <DemoHomeStack.Navigator screenOptions={{ headerShown: false }}>
      <DemoHomeStack.Screen name="DemoHomeMain">
        {(props) => <DemoHomeScreen {...props} showToast={showToast} />}
      </DemoHomeStack.Screen>
      <DemoHomeStack.Screen
        name="DemoListDetail"
        component={DemoListDetailScreen}
      />
    </DemoHomeStack.Navigator>
  );
}

// Tab Navigator pour le mode démo (Home + Profile)
export default function DemoTabNavigator({ showToast }) {
  return (
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
          height: Platform.OS === "android" ? 90 : 64,
          paddingBottom: Platform.OS === "android" ? 40: 12,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <DemoHomeStackNavigator {...props} showToast={showToast} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <DemoProfileScreen {...props} showToast={showToast} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
