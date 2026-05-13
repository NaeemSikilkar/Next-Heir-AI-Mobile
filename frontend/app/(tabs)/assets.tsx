import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, ASSET_CATEGORIES } from '../../src/theme';
import { FadeInUp, Floating } from '../../src/anim';
import { api } from '../../src/api';
import { useCurrency } from '../../src/currency';

export default function Assets() {
  const router = useRouter();
  const { formatFull } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.listAssets();
      setItems(data);
    } catch (e: any) {
      console.log(e.message);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const total = items.reduce((s, a) => s + (a.value || 0), 0);

  const onDelete = (id: string) => {
    Alert.alert('Delete asset?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await api.deleteAsset(id);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Assets</Text>
          <Text style={styles.subtitle}>Total: {formatFull(total)}</Text>
        </View>
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
                  <Ionicons name="briefcase-outline" size={36} color={colors.primary} />
                </View>
              </Floating>
              <Text style={styles.emptyTitle}>No assets yet</Text>
              <Text style={styles.emptySub}>Add property, businesses, investments, or precious metals to begin.</Text>
            </View>
          </FadeInUp>
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const cat = ASSET_CATEGORIES.find((c) => c.key === item.category) || ASSET_CATEGORIES[4];
          return (
            <FadeInUp delay={index * 60}>
              <Pressable
                testID={`asset-${item.id}`}
                onPress={() => router.push({ pathname: '/asset-edit', params: { id: item.id } })}
                onLongPress={() => onDelete(item.id)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name={cat.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>{cat.label}</Text>
                  {item.description ? <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text> : null}
                </View>
                <Text style={styles.cardValue}>{formatFull(item.value)}</Text>
              </Pressable>
            </FadeInUp>
          );
        }}
      />

      <Pressable
        testID="add-asset-fab"
        onPress={() => router.push('/asset-edit')}
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
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.paper,
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  cardIcon: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  cardSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  cardDesc: { color: colors.textDisabled, fontSize: 12, marginTop: 2 },
  cardValue: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginTop: spacing.md },
  emptySub: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: 100, width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.glow,
  },
});
