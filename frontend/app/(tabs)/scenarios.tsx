import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { FadeInUp, Floating } from '../../src/anim';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';

export default function Scenarios() {
  const router = useRouter();
  const { formatFull } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.listScenarios();
      setItems(data);
    } catch (e: any) {
      console.log(e.message);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const onDelete = (id: string) => {
    Alert.alert('Delete scenario?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteScenario(id); load(); } },
    ]);
  };

  const fairnessColor = (s?: number) =>
    s == null ? colors.textSecondary : s >= 70 ? colors.fairnessHigh : s >= 40 ? colors.fairnessMid : colors.fairnessLow;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Scenarios</Text>
        <Text style={styles.subtitle}>Compare distribution outcomes</Text>
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
                  <Ionicons name="git-network-outline" size={36} color={colors.primary} />
                </View>
              </Floating>
              <Text style={styles.emptyTitle}>No scenarios yet</Text>
              <Text style={styles.emptySub}>Build a scenario to allocate your estate and get AI insights.</Text>
            </View>
          </FadeInUp>
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const analysis = item.analysis;
          const score = analysis?.fairness_score;
          const color = fairnessColor(score);
          const totalEstate = analysis?.total_estate_value;
          return (
            <FadeInUp delay={index * 80}>
              <Pressable
                testID={`scenario-${item.id}`}
                onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: item.id } })}
                onLongPress={() => onDelete(item.id)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
                  </View>
                  <View style={[styles.scoreCircle, { borderColor: color }]}>
                    <Text style={[styles.scoreText, { color }]}>{score != null ? score : '—'}</Text>
                    <Text style={styles.scoreLabel}>fairness</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {totalEstate != null ? formatFull(totalEstate) : 'Run analysis'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {item.analysis ? 'Analyzed' : 'Pending analysis'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </FadeInUp>
          );
        }}
      />

      <Pressable
        testID="add-scenario-fab"
        onPress={() => router.push('/scenario-edit')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
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
    backgroundColor: colors.paper, padding: spacing.lg, borderRadius: radius.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  cardDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  scoreCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { color: colors.textSecondary, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textSecondary, fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySub: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: 100, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.glow,
  },
});
