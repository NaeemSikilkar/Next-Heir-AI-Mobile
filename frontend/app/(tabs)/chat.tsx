import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { FadeInUp, Floating } from '../../src/anim';
import { api } from '../../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Msg = { id?: string; role: 'user' | 'assistant'; content: string; created_at?: string };

const SUGGESTIONS = [
  'Is dividing equally always fair?',
  'How can I prevent sibling conflicts?',
  'What should I consider for a dependent child?',
  'Should business and property be split differently?',
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(useCallback(() => { (async () => {
    let sid = await AsyncStorage.getItem('nh_chat_session');
    if (!sid) {
      sid = `s_${Date.now()}`;
      await AsyncStorage.setItem('nh_chat_session', sid);
    }
    setSessionId(sid);
    try {
      const hist = await api.chatHistory(sid);
      setMessages(hist);
    } catch (e: any) {
      console.log(e.message);
    }
  })(); }, []));

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await api.chat(text.trim(), sessionId || undefined);
      if (!sessionId) {
        setSessionId(res.session_id);
        await AsyncStorage.setItem('nh_chat_session', res.session_id);
      }
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  const clearAll = () => {
    Alert.alert('Clear chat?', 'All messages in this session will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          if (sessionId) await api.clearChat(sessionId);
          setMessages([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Floating range={3} duration={2800}>
            <View style={styles.logo}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
          </Floating>
          <View>
            <Text style={styles.title}>NextHeir AI</Text>
            <Text style={styles.subtitle}>Your inheritance advisor</Text>
          </View>
        </View>
        <Pressable testID="clear-chat-btn" onPress={clearAll} style={styles.clearBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <FadeInUp>
              <Floating range={6}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
              </Floating>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySub}>Ask anything about inheritance, fairness, and family harmony.</Text>
            </FadeInUp>
            <View style={styles.suggestionWrap}>
              {SUGGESTIONS.map((s, i) => (
                <FadeInUp key={s} delay={150 + i * 80}>
                  <Pressable
                    testID={`suggestion-${i}`}
                    onPress={() => send(s)}
                    style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                </FadeInUp>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => `m_${i}`}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md }}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
                {item.role === 'assistant' && (
                  <View style={styles.botHead}>
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                    <Text style={styles.botName}>NextHeir AI</Text>
                  </View>
                )}
                <Text style={item.role === 'user' ? styles.userText : styles.botText}>{item.content}</Text>
              </View>
            )}
            ListFooterComponent={sending ? (
              <View style={[styles.bubble, styles.botBubble]}>
                <View style={styles.botHead}>
                  <Ionicons name="sparkles" size={12} color={colors.primary} />
                  <Text style={styles.botName}>NextHeir AI</Text>
                </View>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            testID="chat-input"
            style={styles.input}
            placeholder="Ask anything..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <Pressable
            testID="chat-send"
            onPress={() => send(input)}
            disabled={!input.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              (!input.trim() || sending) && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 12 },
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold, alignSelf: 'center' },
  emptyTitle: { ...typography.h3, marginTop: spacing.md, textAlign: 'center' },
  emptySub: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm },
  suggestionWrap: { marginTop: spacing.xl, gap: spacing.sm, width: '100%' },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  suggestionText: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  bubble: { padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm, maxWidth: '90%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: colors.paper, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderLeftWidth: 3, borderLeftColor: colors.primary },
  botHead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  botName: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  userText: { color: colors.textInverse, fontSize: 15, lineHeight: 22 },
  botText: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.paper, borderRadius: radius.lg, paddingHorizontal: spacing.md,
    paddingVertical: 12, color: colors.textPrimary, fontSize: 15, minHeight: 48, maxHeight: 120,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...shadows.glow,
  },
});
