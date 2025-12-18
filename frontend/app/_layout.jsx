import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { colors } from "../components/styles";

export default function AppLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
        
        {/* Main Screens */}
        <Stack.Screen name="index" options={{ title: "SiteEstimate Dashboard" }} />
        <Stack.Screen name="chat" options={{ title: "Team Chat" }} />
        
        {/* Calculators (You likely already have these from the template) */}
        <Stack.Screen name="calculator" options={{ title: "Paint Estimator" }} />
        <Stack.Screen name="drywall" options={{ title: "Drywall Estimator" }} />
        <Stack.Screen name="flooring" options={{ title: "Flooring Estimator" }} />
        
        {/* Materials CRUD */}
        <Stack.Screen name="materials/index" options={{ title: "Materials Manager" }} />
        <Stack.Screen name="materials/add" options={{ title: "Add Material" }} />
      </Stack>
    </AuthProvider>
  );
}