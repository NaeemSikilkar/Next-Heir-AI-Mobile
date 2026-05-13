import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, ASSET_CATEGORIES } from '../src/theme';
import { api } from '../src/api';
import { useCurrency } from '../src/currency';

export default function AssetEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { symbol, code } = useCurrency();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('property');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const list = await api.listAssets();
        const found = list.find((a: any) => a.id === id);
        if (found) {
          setName(found.name);
          setCategory(found.category);
          setValue(String(found.value));
          setDescription(found.description || '');
        }
      } catch (e: any) {
        console.log(e.message);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Asset name required');
    const v = parseFloat(value);
    if (isNaN(v) || v < 0) return Alert.alert('Invalid value', 'Enter a valid amount');
    setLoading(true);
    try {
      const body = { name: name.trim(), category, value: v, description: description.trim() };
      if (id) await api.updateAsset(id, body);
      else await api.createAsset(body);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert('Delete asset?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await api.deleteAsset(id);
          router.back();
        },
      },
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
      <Stack.Screen options={{ title: id ? 'Edit Asset' : 'New Asset' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Asset name</Text>
          <View style={styles.field}>
            <TextInput
              testID="asset-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Mumbai Apartment"
              placeholderTextColor={colors.textDisabled}
            />
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categories}>
            {ASSET_CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                testID={`cat-${c.key}`}
                onPress={() => setCategory(c.key)}
                style={[styles.catBtn, category === c.key && styles.catBtnActive]}
              >
                <Ionicons name={c.icon as any} size={18} color={category === c.key ? colors.primary : colors.textSecondary} />
                <Text style={[styles.catText, category === c.key && { color: colors.primary }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Value ({symbol} {code})</Text>
          <View style={styles.field}>
            <TextInput
              testID="asset-value-input"
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={`${symbol} 0`}
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Description (optional)</Text>
          <View style={[styles.field, { minHeight: 100 }]}>
            <TextInput
              testID="asset-desc-input"
              style={[styles.input, { textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textDisabled}
              multiline
            />
          </View>

          <Pressable
            testID="asset-save-btn"
            onPress={onSave}
            disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          >
            {loading ? <ActivityIndicator color={colors.textInverse} /> : (
              <Text style={styles.primaryBtnText}>{id ? 'Save Changes' : 'Add Asset'}</Text>
            )}
          </Pressable>

          {id && (
            <Pressable testID="asset-delete-btn" onPress={onDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete asset</Text>
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
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 18, alignItems: 'center', marginTop: spacing.xl, ...shadows.glow },
  primaryBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 16, marginTop: spacing.sm },
  deleteText: { color: colors.error, fontWeight: '600' },
});
