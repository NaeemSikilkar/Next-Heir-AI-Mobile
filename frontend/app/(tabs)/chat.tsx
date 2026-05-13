import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Modal, ScrollView,
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
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(useCallback(() => { (async () => {
    let sid = await AsyncStorage.getItem('nh_chat_session');
    if (!sid) {
      sid = `s_${Date.now()}`;
      await AsyncStorage.setItem('nh_chat_session', sid);
    }
    setSessionId(sid);
    try {
      const [hist, scs] = await Promise.all([api.chatHistory(sid), api.listScenarios()]);
      setMessages(hist);
      setScenarios(scs);
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
      const res = await api.chat(text.trim(), sessionId || undefined, selectedIds.length ? selectedIds : undefined);
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

  const toggleScenario = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const compareNow = () => {
    if (selectedIds.length < 2) {
      Alert.alert('Select at least 2 scenarios', 'Pick two or more scenarios to compare.');
      return;
    }
    setPickerOpen(false);
    const names = scenarios.filter((s) => selectedIds.includes(s.id)).map((s) => `"${s.name}"`).join(', ');
    send(`Compare scenarios ${names}. Which is fairer, where do they differ, and which would you recommend? Explain trade-offs.`);
  };

  const selectedScenarios = scenarios.filter((s) => selectedIds.includes(s.id));

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
        <View style={styles.headerActions}>
          <Pressable
            testID="open-compare-btn"
            onPress={() => setPickerOpen(true)}
            style={[styles.compareBtn, selectedIds.length > 0 && styles.compareBtnActive]}
            hitSlop={6}
          >
            <Ionicons name="git-compare-outline" size={16} color={selectedIds.length > 0 ? colors.primary : colors.textSecondary} />
            <Text style={[styles.compareBtnText, selectedIds.length > 0 && { color: colors.primary }]}>
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Compare'}
            </Text>
          </Pressable>
          <Pressable testID="clear-chat-btn" onPress={clearAll} style={styles.clearBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Selected scenarios chip strip */}
      {selectedScenarios.length > 0 && (
        <View style={styles.chipStrip}>
          <Ionicons name="git-compare" size={14} color={colors.primary} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {selectedScenarios.map((s) => (
              <View key={s.id} style={styles.activeChip} testID={`active-chip-${s.id}`}>
                <Text style={styles.activeChipText} numberOfLines={1}>{s.name}</Text>
                <Pressable onPress={() => toggleScenario(s.id)} hitSlop={6} testID={`remove-chip-${s.id}`}>
                  <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {selectedIds.length >= 2 && (
            <Pressable onPress={compareNow} style={styles.compareNowBtn} testID="compare-now-btn">
              <Text style={styles.compareNowText}>Compare</Text>
            </Pressable>
          )}
        </View>
      )}

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
              {scenarios.length >= 2 && (
                <FadeInUp delay={500}>
                  <Pressable
                    testID="cta-open-compare"
                    onPress={() => setPickerOpen(true)}
                    style={({ pressed }) => [styles.compareCta, pressed && { opacity: 0.85 }]}
                  >
                    <Ionicons name="git-compare-outline" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compareCtaTitle}>Compare scenarios</Text>
                      <Text style={styles.compareCtaSub}>Pick 2+ scenarios and ask AI which is better.</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </Pressable>
                </FadeInUp>
              )}
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
            placeholder={selectedIds.length > 0 ? 'Ask anything about selected scenarios...' : 'Ask anything...'}
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <Pressable
            testID="chat-fullscreen-btn"
            onPress={() => setFullscreen(true)}
            style={({ pressed }) => [styles.fsBtn, pressed && { opacity: 0.7 }]}
            hitSlop={6}
          >
            <Ionicons name="expand-outline" size={20} color={colors.primary} />
          </Pressable>
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

      {/* Fullscreen compose modal */}
      <Modal visible={fullscreen} animationType="slide" onRequestClose={() => setFullscreen(false)}>
        <SafeAreaView style={styles.fsRoot} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.fsHeader}>
              <Pressable onPress={() => setFullscreen(false)} hitSlop={10} testID="fs-close-btn" style={styles.fsClose}>
                <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.fsTitle}>Compose Message</Text>
                <Text style={styles.fsCount}>{input.length}/1000</Text>
              </View>
              <Pressable
                testID="fs-send-btn"
                disabled={!input.trim() || sending}
                onPress={async () => {
                  const text = input;
                  setFullscreen(false);
                  await new Promise((r) => setTimeout(r, 50));
                  send(text);
                }}
                style={({ pressed }) => [
                  styles.fsSend,
                  (!input.trim() || sending) && { opacity: 0.4 },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Ionicons name="arrow-up" size={18} color={colors.textInverse} />
                <Text style={styles.fsSendText}>Send</Text>
              </Pressable>
            </View>

            <TextInput
              testID="fs-input"
              style={styles.fsInput}
              placeholder="Type your full question or thoughts here..."
              placeholderTextColor={colors.textDisabled}
              value={input}
              onChangeText={setInput}
              multiline
              autoFocus
              maxLength={1000}
              textAlignVertical="top"
            />

            <View style={styles.fsFooter}>
              <View style={styles.fsHint}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.fsHintText}>
                  {selectedIds.length > 0
                    ? `${selectedIds.length} scenario(s) attached for comparison`
                    : 'Tip: Pick "Compare" in the chat header to attach scenarios.'}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Scenario picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Compare Scenarios</Text>
                <Text style={styles.sheetSub}>Select 2 or more scenarios. AI will compare them side-by-side.</Text>
              </View>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8} testID="close-picker-btn">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {scenarios.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Ionicons name="git-network-outline" size={32} color={colors.primary} />
                <Text style={styles.sheetEmptyText}>No scenarios yet. Create scenarios first.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
                {scenarios.map((s) => {
                  const checked = selectedIds.includes(s.id);
                  const score = s.analysis?.fairness_score;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggleScenario(s.id)}
                      testID={`scenario-pick-${s.id}`}
                      style={[styles.pickRow, checked && styles.pickRowChecked]}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickTitle}>{s.name}</Text>
                        {s.description ? (
                          <Text style={styles.pickDesc} numberOfLines={1}>{s.description}</Text>
                        ) : null}
                      </View>
                      {score != null ? (
                        <View style={styles.pickScore}>
                          <Text style={styles.pickScoreText}>{score}</Text>
                          <Text style={styles.pickScoreLabel}>score</Text>
                        </View>
                      ) : (
                        <Text style={styles.pickPending}>Not analyzed</Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.sheetActions}>
              {selectedIds.length > 0 && (
                <Pressable testID="clear-selection-btn" onPress={() => setSelectedIds([])} style={styles.clearSel}>
                  <Text style={styles.clearSelText}>Clear</Text>
                </Pressable>
              )}
              <Pressable
                testID="confirm-compare-btn"
                onPress={compareNow}
                disabled={selectedIds.length < 2}
                style={[styles.confirmBtn, selectedIds.length < 2 && { opacity: 0.4 }]}
              >
                <Ionicons name="sparkles" size={16} color={colors.textInverse} />
                <Text style={styles.confirmText}>Compare with AI ({selectedIds.length})</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  title: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  compareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper,
  },
  compareBtnActive: { borderColor: colors.borderGold, backgroundColor: colors.primarySoft },
  compareBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  chipStrip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.paper,
  },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderGold, maxWidth: 140 },
  activeChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  compareNowBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  compareNowText: { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
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
  compareCta: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderGold, ...shadows.glow, marginTop: spacing.sm,
  },
  compareCtaTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  compareCtaSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
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
  fsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderGold,
  },
  fsRoot: { flex: 1, backgroundColor: colors.bg },
  fsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  fsClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  fsTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  fsCount: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  fsSend: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill,
    backgroundColor: colors.primary, ...shadows.glow,
  },
  fsSendText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  fsInput: {
    flex: 1, color: colors.textPrimary, fontSize: 18, lineHeight: 26,
    padding: spacing.lg, backgroundColor: colors.bg,
  },
  fsFooter: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  fsHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fsHintText: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
    maxHeight: '85%', borderWidth: 1, borderColor: colors.border,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.md },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  sheetTitle: { ...typography.h3 },
  sheetSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  sheetEmpty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  sheetEmptyText: { color: colors.textSecondary, textAlign: 'center' },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pickRowChecked: { borderColor: colors.borderGold, backgroundColor: colors.primarySoft },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  pickDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  pickScore: { alignItems: 'center', minWidth: 50 },
  pickScoreText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  pickScoreLabel: { color: colors.textSecondary, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickPending: { color: colors.textDisabled, fontSize: 11, fontStyle: 'italic' },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  clearSel: { paddingHorizontal: spacing.md, justifyContent: 'center' },
  clearSelText: { color: colors.textSecondary, fontWeight: '700' },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.pill, ...shadows.glow,
  },
  confirmText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
});
