import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  Keyboard 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../components/styles';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { userInfo, API_URL } = useContext(AuthContext);
  const ws = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Convert HTTP to WS (e.g. https://... -> wss://...)
    const wsUrl = API_URL.replace('http', 'ws').replace('https', 'wss') + `/ws/${userInfo?.username || 'Guest'}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
        setMessages(prev => [...prev, { id: Date.now(), text: "🔵 Connected to Chat", system: true }]);
    };

    ws.current.onmessage = (e) => {
        // Simple check to see if it's a user message "User: Message"
        const parts = e.data.split(': ');
        if(parts.length >= 2) {
            const sender = parts[0];
            const msgText = parts.slice(1).join(': ');
            const isMe = sender === userInfo?.username;
            setMessages(prev => [...prev, { id: Date.now(), text: msgText, sender, isMe }]);
        } else {
            setMessages(prev => [...prev, { id: Date.now(), text: e.data, system: true }]);
        }
    };

    ws.current.onerror = (e) => console.log("WS Error");

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
      if (item.system) {
          return (
            <View style={styles.systemBubble}>
                <Text style={styles.systemText}>{item.text}</Text>
            </View>
          );
      }
      return (
        <View style={[styles.msgBubble, item.isMe ? styles.myBubble : styles.theirBubble]}>
            {!item.isMe && <Text style={styles.senderName}>{item.sender}</Text>}
            <Text style={item.isMe ? styles.myText : styles.theirText}>{item.text}</Text>
        </View>
      );
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
            <Ionicons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    
    // Chat Bubbles
    msgBubble: { 
        padding: 12, 
        borderRadius: 18, 
        marginBottom: 8, 
        maxWidth: '80%' 
    },
    myBubble: { 
        backgroundColor: colors.primary, 
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2
    },
    theirBubble: { 
        backgroundColor: 'white', 
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#e5e5ea'
    },
    systemBubble: { 
        alignSelf: 'center', 
        marginBottom: 10, 
        backgroundColor: '#e5e5ea', 
        paddingVertical: 4, 
        paddingHorizontal: 12, 
        borderRadius: 12 
    },

    // Text Styles
    myText: { color: 'white', fontSize: 16 },
    theirText: { color: 'black', fontSize: 16 },
    senderName: { fontSize: 12, color: '#888', marginBottom: 4 },
    systemText: { color: '#666', fontSize: 12 },

    // Input Area
    inputContainer: { 
        flexDirection: 'row', 
        padding: 10, 
        backgroundColor: 'white', 
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    input: { 
        flex: 1, 
        backgroundColor: '#f2f2f7', 
        borderRadius: 20, 
        paddingHorizontal: 15, 
        height: 40, 
        marginRight: 10,
        fontSize: 16
    },
    sendBtn: { 
        backgroundColor: colors.primary, 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center' 
    }
});