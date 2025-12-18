import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../components/styles';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { userInfo, API_URL } = useContext(AuthContext);
  const ws = useRef(null);

  useEffect(() => {
    // Convert HTTP URL to WS URL (e.g., http://192.168.1.5 -> ws://192.168.1.5)
    const wsUrl = API_URL.replace('http', 'ws') + `/ws/${userInfo?.username || 'Guest'}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
        setMessages(prev => [...prev, { id: Date.now(), text: "🔵 Connected to Chat!", system: true }]);
    };

    ws.current.onmessage = (e) => {
        setMessages(prev => [...prev, { id: Date.now(), text: e.data, system: false }]);
    };

    ws.current.onclose = () => {
        setMessages(prev => [...prev, { id: Date.now(), text: "🔴 Disconnected", system: true }]);
    };

    return () => {
        if (ws.current) ws.current.close();
    };
  }, []);

  const sendMessage = () => {
      if(text.trim()) {
          ws.current.send(text);
          setText('');
      }
  };

  const renderItem = ({ item }) => {
      const isSystem = item.system;
      return (
        <View style={[styles.msgBubble, isSystem ? styles.systemBubble : styles.userBubble]}>
            <Text style={isSystem ? styles.systemText : styles.userText}>{item.text}</Text>
        </View>
      );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
      
      <View style={styles.inputContainer}>
        <TextInput 
            style={styles.input} 
            value={text} 
            onChangeText={setText} 
            placeholder="Type a message..." 
            placeholderTextColor="#888"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    msgBubble: { padding: 10, borderRadius: 8, marginBottom: 8, maxWidth: '80%' },
    userBubble: { backgroundColor: 'white', alignSelf: 'flex-start' },
    systemBubble: { backgroundColor: '#e0e0e0', alignSelf: 'center' },
    userText: { color: '#333' },
    systemText: { color: '#666', fontStyle: 'italic', fontSize: 12 },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 20, paddingHorizontal: 15, height: 40, borderWidth: 1, borderColor: '#ddd', marginRight: 10 },
    sendBtn: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});