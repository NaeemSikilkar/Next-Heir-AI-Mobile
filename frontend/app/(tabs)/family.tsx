import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, NEED_LEVELS } from '../../src/theme';
import { FadeInUp, Floating } from '../../src/anim';
import { api } from '../../src/api';

export default function Family() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.listFamily();
      setItems(data);
    } catch (e: any) {
      console.log(e.message);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const onDelete = (id: string) => {
    Alert.alert('Remove member?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await api.deleteFamily(id); load(); } },
    ]);
  };

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() || '').join('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Family</Text>
        <Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'member' : 'members'}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <FadeInUp>
            <View style={styles.empty}>
              <Floating range={6}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={36} color={colors.primary} />
                </View>
              </Floating>
              <Text style={styles.emptyTitle}>No family members yet</Text>
              <Text style={styles.emptySub}>Add family members and their circumstances to plan thoughtfully.</Text>
            </View>
          </FadeInUp>
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const need = NEED_LEVELS.find((n) => n.key === item.financial_needs);
          return (
            <FadeInUp delay={index * 60}>
              <Pressable
                testID={`family-${item.id}`}
                onPress={() => router.push({ pathname: '/family-edit', params: { id: item.id } })}
                onLongPress={() => onDelete(item.id)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(item.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>
                    {item.relationship}{item.age ? ` · ${item.age} yrs` : ''}
                  </Text>
                  {item.notes ? <Text style={styles.cardDesc} numberOfLines={1}>{item.notes}</Text> : null}
                </View>
                {need && (
                  <View style={[styles.chip, { borderColor: need.color }]}>
                    <View style={[styles.dot, { backgroundColor: need.color }]} />
                    <Text style={[styles.chipText, { color: need.color }]}>{need.label}</Text>
                  </View>
                )}
              </Pressable>
            </FadeInUp>
          );
        }}
      />

      <Pressable
        testID="add-family-fab"
        onPress={() => router.push('/family-edit')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <Ionicons name="person-add" size={24} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.h1 },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.paper,
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  cardDesc: { color: colors.textDisabled, fontSize: 12, marginTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySub: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: 100, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.glow,
  },
});
