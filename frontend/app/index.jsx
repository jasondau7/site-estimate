import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { globalStyles, colors } from "../components/styles";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import AppButton from "../components/AppButton";

export default function HomeScreen() {
  const { userToken, userInfo, logout } = useContext(AuthContext);
  const router = useRouter();

  // Redirect to Login if not authenticated
  useEffect(() => {
    if (!userToken) {
      router.replace("/login");
    }
  }, [userToken]);

  if (!userToken) return null;

  return (
    <ScrollView contentContainerStyle={[globalStyles.container, { paddingBottom: 40 }]}>
      
      {/* Header Section with Logout Button */}
      <View style={styles.headerContainer}>
        
        {/* LOGOUT BUTTON - Top Right */}
        <View style={styles.logoutContainer}>
           <AppButton 
              title="Logout" 
              onPress={logout} 
              style={styles.logoutButton} 
              textStyle={styles.logoutText}
           />
        </View>

        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
        />
        <Text style={globalStyles.titleText}>SiteEstimate</Text>
        <Text style={globalStyles.bodyText}>
          Welcome, {userInfo?.username || "Estimator"}
        </Text>
      </View>

      {/* Estimation Tools Section */}
      <Card>
        <Text style={styles.sectionTitle}>Estimation Tools</Text>
        
        <Link href="/calculator" asChild>
          <AppButton title="🎨 Paint Estimator" />
        </Link>
        
        <Link href="/drywall" asChild>
          <AppButton title="🧱 Drywall Estimator" />
        </Link>
        
        <Link href="/flooring" asChild>
          <AppButton title="🪵 Flooring Estimator" />
        </Link>
      </Card>

      {/* Management Section */}
      <Card style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>Management</Text>

        <Link href="/chat" asChild>
          <AppButton 
            title="💬 Team Chat" 
            style={{ backgroundColor: colors.secondary }} 
          />
        </Link>

        <Link href="/materials" asChild>
          <AppButton
            title="📦 Materials Manager"
            style={{ backgroundColor: colors.secondary, marginTop: 10 }}
          />
        </Link>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    width: '100%', // Ensure header takes full width to allow corner positioning
  },
  logoutContainer: {
    alignSelf: 'flex-end', // Pushes button to the right
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: colors.accent, 
    paddingVertical: 8, 
    paddingHorizontal: 15,
    minWidth: 80, // Keeps it small
  },
  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5
  }
});