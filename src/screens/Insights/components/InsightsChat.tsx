import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertCircle, Send, Sparkles, User } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { spacing } from '../../../theme/spacing';
import { borderRadius } from '../../../theme/borderRadius';
import type { UseInsightsChatResult } from '../hooks/useInsightsChat';

const USER_TIME_COLOR = 'rgba(255,255,255,0.7)';

export const InsightsChat: React.FC<{ chat: UseInsightsChatResult }> = ({ chat }) => {
  const { C, colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const { messages, input, setInput, loading, send } = chat;

  return (
    <View style={styles.chatContainer}>
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View key={msg.id} style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
              <View style={[styles.avatarContainer, { backgroundColor: isUser ? C.bg : C.redBg }]}>
                {isUser ? <User size={15} color={C.textSm} /> : <Sparkles size={15} color={C.red} />}
              </View>
              <View style={[
                styles.messageBubble,
                { backgroundColor: isUser ? C.red : msg.isError ? colors.criticalBg : C.white, shadowColor: colors.shadow },
                isUser ? styles.userBubble : styles.aiBubble,
                msg.isError && [styles.errorBubble, { borderColor: colors.border }],
              ]}>
                {msg.isError && (
                  <View style={styles.errorBadgeRow}>
                    <AlertCircle size={14} color={colors.criticalText} />
                    <Text style={[styles.errorBadgeText, { color: colors.criticalText }]}>ERROR</Text>
                  </View>
                )}
                <Text style={[styles.messageText, { color: isUser ? colors.textOnPrimary : msg.isError ? colors.criticalText : C.text }]}>
                  {msg.text}
                </Text>
                <Text style={[styles.messageTime, { color: isUser ? USER_TIME_COLOR : C.textXs }]}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        })}
        {loading && (
          <View style={styles.aiWrapper}>
            <View style={[styles.avatarContainer, { backgroundColor: C.redBg }]}>
              <Sparkles size={15} color={C.red} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: C.white, shadowColor: colors.shadow }]}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={C.red} />
                <Text style={[styles.messageText, styles.thinkingText, { color: C.textSm }]}>Thinking...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: C.white, borderTopColor: C.divider }]}>
        <TextInput
          style={[styles.input, { color: colors.inputText, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder }]}
          placeholder="Ask about your trends, sugar levels..."
          placeholderTextColor={colors.inputText}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          multiline
        />
        <TouchableOpacity
          onPress={send}
          disabled={!input.trim() || loading}
          style={[styles.sendBtn, { backgroundColor: input.trim() && !loading ? C.red : C.redBorder }]}
        >
          <Send size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: { flex: 1 },
  chatArea: { flex: 1 },
  chatContent: { padding: spacing.xl, gap: spacing.xl },
  messageWrapper: { flexDirection: 'row', gap: spacing.md, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiWrapper: { alignSelf: 'flex-start' },
  avatarContainer: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  messageBubble: {
    padding: spacing.md, borderRadius: 18, elevation: 1,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5,
  },
  userBubble: { borderTopRightRadius: 2 },
  aiBubble: { borderTopLeftRadius: 2 },
  errorBubble: { borderWidth: 1 },
  errorBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  errorBadgeText: { fontSize: 10, fontWeight: '900' },
  messageText: { fontSize: 13.5, lineHeight: 18, fontWeight: '500' },
  thinkingText: { marginLeft: spacing.sm },
  messageTime: { fontSize: 9, marginTop: spacing.xs, textAlign: 'right', fontWeight: 'bold' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center' },
  inputContainer: { padding: 14, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 48, maxHeight: 100, borderRadius: borderRadius.xxl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, fontSize: 14, fontWeight: '600' },
  sendBtn: { width: 48, height: 48, borderRadius: borderRadius.xxl, justifyContent: 'center', alignItems: 'center' },
});
