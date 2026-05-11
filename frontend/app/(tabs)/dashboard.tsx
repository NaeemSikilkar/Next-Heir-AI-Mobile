import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, formatCurrency, ASSET_CATEGORIES } from '../../src/theme';
import { FadeInUp, Floating, Pulse } from '../../src/anim';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

export default function Dashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const d = await api.dashboard();
      setData(d);
    } catch (e: any) {
      console.log('dashboard err', e.message);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const total = data?.total_value || 0;
  const score = data?.avg_fairness_score;
  const scoreColor = score == null
    ? colors.textSecondary
    : score >= 70 ? colors.fairnessHigh : score >= 40 ? colors.fairnessMid : colors.fairnessLow;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          </View>
          <Pressable testID="signout-btn" onPress={onSignOut} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <FadeInUp delay={50}>
          <View style={styles.heroCard}>
            <Floating range={3} duration={3500} style={{ position: 'absolute', top: 16, right: 16 }}>
              <Ionicons name="diamond" size={28} color={colors.primary} />
            </Floating>
            <Text style={styles.overline}>Total Estate Value</Text>
            <Text style={styles.heroValue}>{formatCurrency(total)}</Text>
            <Text style={styles.heroSub}>
              {data?.asset_count || 0} assets · {data?.family_count || 0} family · {data?.scenario_count || 0} scenarios
            </Text>
          </View>
        </FadeInUp>

        <View style={styles.quickActions}>
          <FadeInUp delay={120}>
            <Pressable testID="qa-asset" onPress={() => router.push('/asset-edit')} style={styles.qaBtn}>
              <View style={[styles.qaIcon, { backgroundColor: 'rgba(212,175,55,0.12)' }]}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.qaText}>Add Asset</Text>
            </Pressable>
          </FadeInUp>
          <FadeInUp delay={170}>
            <Pressable testID="qa-family" onPress={() => router.push('/family-edit')} style={styles.qaBtn}>
              <View style={[styles.qaIcon, { backgroundColor: 'rgba(140,146,172,0.15)' }]}>
                <Ionicons name="person-add-outline" size={20} color={colors.secondary} />
              </View>
              <Text style={styles.qaText}>Add Member</Text>
            </Pressable>
          </FadeInUp>
          <FadeInUp delay={220}>
            <Pressable testID="qa-scenario" onPress={() => router.push('/scenario-edit')} style={styles.qaBtn}>
              <View style={[styles.qaIcon, { backgroundColor: 'rgba(76,175,80,0.15)' }]}>
                <Ionicons name="git-network-outline" size={20} color={colors.success} />
              </View>
              <Text style={styles.qaText}>New Scenario</Text>
            </Pressable>
          </FadeInUp>
        </View>

        <FadeInUp delay={260}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{data?.asset_count || 0}</Text>
              <Text style={styles.statLabel}>Assets</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{data?.family_count || 0}</Text>
              <Text style={styles.statLabel}>Family</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="git-network-outline" size={18} color={colors.primary} />
              <Text style={styles.statValue}>{data?.scenario_count || 0}</Text>
              <Text style={styles.statLabel}>Scenarios</Text>
            </View>
          </View>
        </FadeInUp>

        <FadeInUp delay={310}>
          <View style={styles.scoreCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>Average Fairness Score</Text>
              <Text style={[styles.scoreVal, { color: scoreColor }]}>
                {score != null ? `${Math.round(score)}/100` : '—'}
              </Text>
              <Text style={styles.caption}>
                {score == null
                  ? 'Create a scenario and run AI analysis to see your fairness score.'
                  : score >= 70
                  ? 'Excellent balance across allocations.'
                  : score >= 40
                  ? 'Some imbalance detected. Review your scenarios.'
                  : 'High conflict risk. Reconsider allocations.'}
              </Text>
            </View>
            <Pulse>
              <View style={[styles.scoreDial, { borderColor: scoreColor }]}>
                <Ionicons name="shield-checkmark-outline" size={28} color={scoreColor} />
              </View>
            </Pulse>
          </View>
        </FadeInUp>

        {data?.by_category && Object.keys(data.by_category).length > 0 && (
          <FadeInUp delay={360}>
            <Text style={styles.sectionTitle}>Asset Breakdown</Text>
            <View style={styles.breakdownCard}>
              {ASSET_CATEGORIES.map((c) => {
                const v = data.by_category[c.key] || 0;
                if (v === 0) return null;
                const pct = total ? (v / total) * 100 : 0;
                return (
                  <View key={c.key} style={styles.breakdownRow}>
                    <View style={styles.breakdownIcon}>
                      <Ionicons name={c.icon as any} size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.breakdownTop}>
                        <Text style={styles.breakdownLabel}>{c.label}</Text>
                        <Text style={styles.breakdownValue}>{formatCurrency(v)}</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </FadeInUp>
        )}

        <FadeInUp delay={410}>
          <Pressable testID="open-chat-cta" onPress={() => router.push('/(tabs)/chat')} style={styles.aiCta}>
            <Floating range={4} duration={2800}>
              <View style={styles.aiIconBox}>
                <Ionicons name="sparkles" size={22} color={colors.primary} />
              </View>
            </Floating>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.aiTitle}>Ask NextHeir AI</Text>
              <Text style={styles.aiSub}>Get clarity on fairness, conflicts, and family harmony.</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
          </Pressable>
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  userName: { ...typography.h2, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    backgroundColor: colors.paper, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.borderGold, ...shadows.ambient, marginBottom: spacing.md,
  },
  overline: { ...typography.overline },
  heroValue: { fontSize: 38, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm, letterSpacing: -0.5 },
  heroSub: { ...typography.bodyMuted, marginTop: spacing.xs },
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  qaBtn: {
    flex: 1, backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: spacing.xs, minHeight: 90, justifyContent: 'center',
  },
  qaIcon: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  qaText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { ...typography.h2, marginTop: spacing.xs },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper, padding: spacing.lg,
    borderRadius: radius.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  scoreVal: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  caption: { ...typography.caption, marginTop: 4 },
  scoreDial: {
    width: 72, height: 72, borderRadius: radius.pill, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  breakdownCard: { backgroundColor: colors.paper, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md, marginBottom: spacing.lg },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  breakdownIcon: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  breakdownLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  breakdownValue: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  barTrack: { height: 6, backgroundColor: colors.surface, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  aiCta: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper,
    padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderGold,
    ...shadows.glow,
  },
  aiIconBox: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  aiSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
