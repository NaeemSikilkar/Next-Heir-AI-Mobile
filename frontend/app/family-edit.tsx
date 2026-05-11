import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, NEED_LEVELS } from '../src/theme';
import { api } from '../src/api';

const RELATIONSHIPS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Grandchild', 'Other'];

export default function FamilyEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Son');
  const [age, setAge] = useState('');
  const [needs, setNeeds] = useState('medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const list = await api.listFamily();
        const found = list.find((m: any) => m.id === id);
        if (found) {
          setName(found.name);
          setRelationship(found.relationship);
          setAge(found.age ? String(found.age) : '');
          setNeeds(found.financial_needs || 'medium');
          setNotes(found.notes || '');
        }
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Name is required');
    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        relationship,
        age: age ? parseInt(age, 10) : null,
        financial_needs: needs,
        notes: notes.trim(),
      };
      if (id) await api.updateFamily(id, body);
      else await api.createFamily(body);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert('Remove member?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await api.deleteFamily(id); router.back(); } },
    ]);
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
      <Stack.Screen options={{ title: id ? 'Edit Member' : 'New Family Member' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Full name</Text>
          <View style={styles.field}>
            <TextInput
              testID="family-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Aarav Sharma"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          <Text style={styles.label}>Relationship</Text>
          <View style={styles.categories}>
            {RELATIONSHIPS.map((r) => (
              <Pressable
                key={r}
                testID={`rel-${r}`}
                onPress={() => setRelationship(r)}
                style={[styles.catBtn, relationship === r && styles.catBtnActive]}
              >
                <Text style={[styles.catText, relationship === r && { color: colors.primary }]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Age (optional)</Text>
          <View style={styles.field}>
            <TextInput
              testID="family-age-input"
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="0"
              placeholderTextColor={colors.textDisabled}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.label}>Financial needs</Text>
          <View style={styles.categories}>
            {NEED_LEVELS.map((n) => (
              <Pressable
                key={n.key}
                testID={`need-${n.key}`}
                onPress={() => setNeeds(n.key)}
                style={[styles.catBtn, needs === n.key && { borderColor: n.color, backgroundColor: 'rgba(255,255,255,0.04)' }]}
              >
                <View style={[styles.dot, { backgroundColor: n.color }]} />
                <Text style={[styles.catText, needs === n.key && { color: n.color }]}>{n.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Notes / circumstances</Text>
          <View style={[styles.field, { minHeight: 100 }]}>
            <TextInput
              testID="family-notes-input"
              style={[styles.input, { textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Special needs, in education, primary caretaker..."
              placeholderTextColor={colors.textDisabled}
              multiline
            />
          </View>

          <Pressable
            testID="family-save-btn"
            onPress={onSave}
            disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            {loading ? <ActivityIndicator color={colors.textInverse} /> : (
              <Text style={styles.primaryBtnText}>{id ? 'Save Changes' : 'Add Member'}</Text>
            )}
          </Pressable>

          {id && (
            <Pressable testID="family-delete-btn" onPress={onDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Remove member</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { ...typography.overline, marginBottom: spacing.sm, marginTop: spacing.md },
  field: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, minHeight: 56, justifyContent: 'center' },
  input: { color: colors.textPrimary, fontSize: 16, paddingVertical: 14 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.paper, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  catBtnActive: { borderColor: colors.borderGold, backgroundColor: colors.primarySoft },
  catText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl, ...shadows.glow },
  primaryBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 16, marginTop: spacing.sm },
  deleteText: { color: colors.error, fontWeight: '600' },
});
