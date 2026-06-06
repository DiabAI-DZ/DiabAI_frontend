import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useData } from '../../../context/DataContext';
import { useUser } from '../../../context/UserContext';
import type { Message } from '../../../types/insights';

const ERROR_REPLY = "I'm sorry, I'm having trouble connecting to my AI model right now. Please try again in a moment.";

export interface UseInsightsChatResult {
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  send: () => void;
  clear: () => void;
}

/** Owns the "Ask DiabAI" assistant: message list, input, send + clear. */
export function useInsightsChat(): UseInsightsChatResult {
  const { getAIInsight } = useData();
  const { profile } = useUser();

  const makeInitial = useCallback((): Message => ({
    id: '1',
    text: `Hello ${profile?.name || 'there'}! I'm your DiabAI assistant. How can I help you manage your health today?`,
    sender: 'ai',
    timestamp: new Date(),
  }), [profile?.name]);

  const [messages, setMessages] = useState<Message[]>(() => [makeInitial()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { id: Date.now().toString(), text: trimmed, sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    (async () => {
      try {
        const insight = await getAIInsight(trimmed);
        setMessages((prev) => [...prev, { id: `${Date.now() + 1}`, text: insight, sender: 'ai', timestamp: new Date() }]);
      } catch {
        setMessages((prev) => [...prev, { id: `${Date.now() + 1}`, text: ERROR_REPLY, sender: 'ai', timestamp: new Date(), isError: true }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [input, loading, getAIInsight]);

  const clear = useCallback(() => {
    Alert.alert('Clear Chat', 'Are you sure you want to reset the conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setMessages([makeInitial()]) },
    ]);
  }, [makeInitial]);

  return { messages, input, setInput, loading, send, clear };
}
