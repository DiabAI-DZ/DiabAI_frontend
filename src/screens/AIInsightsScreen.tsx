import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Send, Sparkles, User, Trash2, AlertCircle } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
}

const AIInsightsScreen: React.FC = () => {
  const { C, isDark } = useTheme();
  const { getAIInsight } = useData();
  const { profile } = useUser();
  
  const initialMessage: Message = {
    id: '1',
    text: `Hello ${profile?.name || 'there'}! I'm your DiabAI assistant. How can I help you manage your health today?`,
    sender: 'ai',
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const insight = await getAIInsight(input);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: insight,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to my AI model right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChat = useCallback(() => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to reset the conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: () => setMessages([initialMessage]) 
        }
      ]
    );
  }, [profile]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: C.bg }]}
    >
      <View style={[styles.header, { borderBottomColor: C.divider }]}>
        <View style={styles.titleRow}>
          <Sparkles size={24} color={C.red} fill={C.red} />
          <View>
            <Text style={[styles.title, { color: C.text }]}>AI Insights</Text>
            <Text style={[styles.subtitle, { color: C.textSm }]}>Personalized advice by Gemini</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={[styles.clearBtn, { backgroundColor: C.redBg }]}>
          <Trash2 size={20} color={C.red} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper
            ]}
          >
            <View style={[
              styles.avatarContainer,
              { backgroundColor: msg.sender === 'user' ? C.bg : C.redBg }
            ]}>
              {msg.sender === 'user' ? <User size={16} color={C.textSm} /> : <Sparkles size={16} color={C.red} />}
            </View>
            <View style={[
              styles.messageBubble,
              { backgroundColor: msg.sender === 'user' ? C.red : (msg.isError ? '#FEF2F2' : C.white) },
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
              msg.isError && { borderColor: '#FECACA', borderWidth: 1 }
            ]}>
              {msg.isError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertCircle size={14} color="#EF4444" />
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#EF4444' }}>ERROR</Text>
                </View>
              )}
              <Text style={[
                styles.messageText,
                { color: msg.sender === 'user' ? '#FFF' : (msg.isError ? '#B91C1C' : C.text) }
              ]}>
                {msg.text}
              </Text>
              <Text style={[
                styles.messageTime,
                { color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : C.textXs }
              ]}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.aiWrapper}>
             <View style={[styles.avatarContainer, { backgroundColor: C.redBg }]}>
                <Sparkles size={16} color={C.red} />
             </View>
             <View style={[styles.messageBubble, { backgroundColor: C.white }, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={C.red} />
                  <Text style={[styles.messageText, { color: C.textSm, marginLeft: 8 }]}>Thinking...</Text>
                </View>
             </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: C.white, borderTopColor: C.divider }]}>
        <TextInput
          style={[styles.input, { color: C.text, backgroundColor: isDark ? '#222' : '#F5F5F5' }]}
          placeholder="Ask about your trends, sugar levels..."
          placeholderTextColor={C.textXs}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || loading}
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !loading ? C.red : C.redBorder }
          ]}
        >
          <Send size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 11, fontWeight: '700' },
  clearBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chatArea: { flex: 1 },
  chatContent: { padding: 20, gap: 20 },
  messageWrapper: { flexDirection: 'row', gap: 12, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiWrapper: { alignSelf: 'flex-start' },
  avatarContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  messageBubble: { 
    padding: 12, 
    borderRadius: 18, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  userBubble: { borderTopRightRadius: 2 },
  aiBubble: { borderTopLeftRadius: 2 },
  messageText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: 'right', fontWeight: '700' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center' },
  inputContainer: { padding: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 12, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 48, maxHeight: 100, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 14, fontWeight: '600' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});

export default AIInsightsScreen;
