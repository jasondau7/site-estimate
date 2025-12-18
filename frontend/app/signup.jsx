import React, { useState, useContext } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import StyledTextInput from '../components/StyledTextInput';
import { globalStyles } from '../components/styles';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { API_URL } = useContext(AuthContext);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !username) {
        Alert.alert("Error", "All fields are required");
        return;
    }

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Account created! Please login.");
        router.back(); // Go back to Login screen
      } else {
        Alert.alert("Signup Failed", data.detail || "Something went wrong");
      }
    } catch (e) {
      console.log("Signup Error:", e); // Log the full error to console
      Alert.alert("Connection Error", "Could not connect to server.\nCheck API_URL in AuthContext.\nError: " + e.message);
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={[globalStyles.titleText, {marginTop: 50, marginBottom: 20}]}>Create Account</Text>
      
      <StyledTextInput 
        placeholder="Username" 
        value={username} 
        onChangeText={setUsername} 
      />
      <StyledTextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <StyledTextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <AppButton title="Sign Up" onPress={handleSignup} />
    </View>
  );
}