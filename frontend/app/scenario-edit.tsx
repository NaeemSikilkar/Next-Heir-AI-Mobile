import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../src/theme';
import { api } from '../src/api';

export default function ScenarioEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const s = await api.getScenario(id);
        setName(s.name);
        setDescription(s.description || '');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Scenario name required');
    setLoading(true);
    try {
      if (id) {
        const cur = await api.getScenario(id);
        await api.updateScenario(id, {
          name: name.trim(),
          description: description.trim(),
          allocations: cur.allocations || {},
        });
        router.back();
      } else {
        const res = await api.createScenario({ name: name.trim(), description: description.trim(), allocations: {} });
        router.replace({ pathname: '/scenario/[id]', params: { id: res.id } });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: id ? 'Edit Scenario' : 'New Scenario' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="git-network" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Create a scenario</Text>
              <Text style={styles.introSub}>Name your distribution plan. You&apos;ll allocate assets next.</Text>
            </View>
          </View>

          <Text style={styles.label}>Scenario name</Text>
          <View style={styles.field}>
            <TextInput
              testID="scenario-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Equal split, Need-based plan"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          <Text style={styles.label}>Description (optional)</Text>
          <View style={[styles.field, { minHeight: 100 }]}>
            <TextInput
              testID="scenario-desc-input"
              style={[styles.input, { textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's the thinking behind this plan?"
              placeholderTextColor={colors.textDisabled}
              multiline
            />
          </View>

          <Pressable
            testID="scenario-save-btn"
            onPress={onSave}
            disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            {loading ? <ActivityIndicator color={colors.textInverse} /> : (
              <Text style={styles.primaryBtnText}>{id ? 'Save Changes' : 'Continue to Allocations'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', marginBottom: spacing.md },
  introIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  introTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  introSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  label: { ...typography.overline, marginBottom: spacing.sm, marginTop: spacing.md },
  field: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, minHeight: 56, justifyContent: 'center' },
  input: { color: colors.textPrimary, fontSize: 16, paddingVertical: 14 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl, ...shadows.glow },
  primaryBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 16 },
});
