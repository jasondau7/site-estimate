import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import StyledTextInput from '../components/StyledTextInput';
import { globalStyles, colors } from '../components/styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    await login(email, password);
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={globalStyles.titleText}>Welcome Back!</Text>
        <Text style={globalStyles.bodyText}>Login to access your estimates.</Text>
      </View>

      <View style={styles.form}>
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

        <AppButton title="Login" onPress={handleLogin} />

        <View style={styles.footer}>
          <Text>Don't have an account? </Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 30, marginTop: 50 },
  form: { width: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 }
}); 