import React, { useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { globalStyles, colors } from '../../components/styles';

export default function MaterialsList() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { API_URL, userToken } = useContext(AuthContext);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/materials`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.log("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload list whenever user visits this screen
  useFocusEffect(
    useCallback(() => {
      fetchMaterials();
    }, [])
  );

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      // Remove from list locally to feel faster
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      Alert.alert("Error", "Could not delete material");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Show Image if available, otherwise show icon */}
      {item.imageUrl ? (
        <Image 
          source={{ uri: `data:image/jpeg;base64,${item.imageUrl}` }} 
          style={styles.image} 
        />
      ) : (
        <View style={[styles.image, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
           <Ionicons name="cube-outline" size={24} color="#888" />
        </View>
      )}
      
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{item.coverage} sq ft/unit</Text>
      </View>

      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={24} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      <Link href="/materials/add" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add New Material</Text>
        </TouchableOpacity>
      </Link>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={materials}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 20}}>No materials found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    alignItems: 'center',
    elevation: 2 
  },
  image: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  details: { color: colors.secondary },
  deleteBtn: { padding: 5 },
  addButton: { 
    backgroundColor: colors.primary, 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});