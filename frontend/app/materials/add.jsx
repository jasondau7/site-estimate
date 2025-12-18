import React, { useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { globalStyles, colors } from '../../components/styles';
import StyledTextInput from '../../components/StyledTextInput';
import AppButton from '../../components/AppButton';

export default function AddMaterial() {
  const [name, setName] = useState('');
  const [coverage, setCoverage] = useState('');
  const [image, setImage] = useState(null); // Stores Base64 string
  const [loading, setLoading] = useState(false);
  
  const { API_URL, userToken } = useContext(AuthContext);
  const router = useRouter();

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true, // IMPORTANT: We need this string for MongoDB
    });

    if (!result.canceled) {
      setImage(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].base64);
    }
  };

  const handleSave = async () => {
    if(!name || !coverage) {
        Alert.alert("Missing Info", "Please enter a name and coverage value.");
        return;
    }

    setLoading(true);
    try {
        const payload = {
            name: name,
            unit: "unit", 
            coverage: parseFloat(coverage),
            imageUrl: image // Sends null if no image selected
        };

        const response = await fetch(`${API_URL}/materials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(payload)
        });

        if(response.ok) {
            router.back(); // Go back to list
        } else {
            Alert.alert("Error", "Failed to save material.");
        }
    } catch (e) {
        Alert.alert("Network Error", "Check your connection.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.titleText}>New Material</Text>

      <StyledTextInput placeholder="Material Name (e.g., Blue Paint)" value={name} onChangeText={setName} />
      <StyledTextInput placeholder="Coverage per Unit (sq ft)" value={coverage} onChangeText={setCoverage} keyboardType="numeric" />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <AppButton title="Camera" onPress={takePhoto} style={{ flex: 1, marginRight: 5 }} />
          <AppButton title="Gallery" onPress={pickImage} style={{ flex: 1, marginLeft: 5 }} />
      </View>

      {image && (
        <Image 
            source={{ uri: `data:image/jpeg;base64,${image}` }} 
            style={{ width: 200, height: 200, alignSelf: 'center', borderRadius: 10, marginBottom: 20 }} 
        />
      )}

      <AppButton title={loading ? "Saving..." : "Save Material"} onPress={handleSave} />
    </ScrollView>
  );
}