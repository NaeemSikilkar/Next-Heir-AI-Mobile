import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, ASSET_CATEGORIES } from '../../src/theme';
import { FadeInUp, Floating, Pulse } from '../../src/anim';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { useCurrency, CurrencyPickerButton } from '../../src/currency';

const HOW_IT_WORKS = [
  { title: 'Add Assets', desc: 'Property, businesses, investments, precious metals', icon: 'briefcase-outline' },
  { title: 'Define Family', desc: 'Map relationships, needs, and circumstances', icon: 'people-outline' },
  { title: 'Simulate Outcomes', desc: 'AI-powered fairness analysis and conflict detection', icon: 'bar-chart-outline' },
];

const TIPS = [
  { title: 'Start simple', desc: 'Begin by adding your major assets and family members. You don\u2019t need perfect data \u2014 just enough to create a basic structure.' },
  { title: 'Use approximate values', desc: 'It is not necessary to enter actual property or asset values. You can use rough or hypothetical numbers to explore different scenarios safely.' },
  { title: 'Create multiple scenarios', desc: 'Don\u2019t rely on just one distribution. Try different combinations to compare outcomes and understand trade-offs.' },
  { title: 'Think beyond equality', desc: 'Equal distribution may not always be practical. Use the tool to explore what is fair based on contribution, needs, and future stability.' },
  { title: 'Leverage AI insights', desc: 'Use the AI chat to ask questions around emotional balance, conflict risks, and fairness. This is where deeper insights emerge.' },
  { title: 'Focus on risk signals', desc: 'Pay attention to fairness scores and risk alerts. These highlight potential issues that may not be obvious in discussions.' },
  { title: 'Iterate and refine', desc: 'Adjust allocations based on insights and re-run simulations to gradually move toward a more balanced outcome.' },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { format } = useCurrency();
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CurrencyPickerButton testID="header-currency-btn" compact />
            <Pressable testID="signout-btn" onPress={onSignOut} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <FadeInUp delay={50}>
          <View style={styles.heroCard}>
            <Floating range={3} duration={3500} style={{ position: 'absolute', top: 16, right: 16 }}>
              <Ionicons name="diamond" size={28} color={colors.primary} />
            </Floating>
            <Text style={styles.overline}>Total Estate Value</Text>
            <Text style={styles.heroValue}>{format(total)}</Text>
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
                        <Text style={styles.breakdownValue}>{format(v)}</Text>
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

        {/* How it Works */}
        <FadeInUp delay={460}>
          <View style={styles.sectionHeader}>
            <Text style={styles.overline}>The Process</Text>
            <Text style={styles.sectionTitle}>How it Works</Text>
          </View>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={step.title} style={styles.stepCard} testID={`step-${i + 1}`}>
              <Floating range={3} duration={2800 + i * 300}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon as any} size={22} color={colors.primary} />
                </View>
              </Floating>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepLabel}>STEP {i + 1}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </FadeInUp>

        {/* Tips */}
        <FadeInUp delay={510}>
          <View style={styles.sectionHeader}>
            <Text style={styles.overline}>Getting Started</Text>
            <Text style={styles.sectionTitle}>Tips on How to Use NextHeir</Text>
          </View>
          {TIPS.map((tip, i) => (
            <View key={tip.title} style={styles.tipCard} testID={`tip-${i + 1}`}>
              <View style={styles.tipNum}>
                <Text style={styles.tipNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}

          <View style={styles.disclaimerCard} testID="dashboard-disclaimer">
            <View style={styles.disclaimerHead}>
              <Ionicons name="warning-outline" size={18} color={colors.warning} />
              <Text style={styles.disclaimerTitle}>Disclaimer</Text>
            </View>
            <Text style={styles.disclaimerText}>
              The outputs provided by NextHeir are AI-generated and based solely on the limited inputs you provide.
              They are indicative in nature and should not be considered as financial or legal advice. Please consult
              your Chartered Accountant (CA), lawyer, or wealth manager before making any final decisions.
            </Text>
          </View>
        </FadeInUp>

        {/* Developed By */}
        <FadeInUp delay={560}>
          <View style={styles.sectionHeader}>
            <Text style={styles.overline}>Developed By</Text>
          </View>
          <View style={styles.devCard} testID="developed-by-card">
            <View style={styles.devTop}>
              <Image
                source={{ uri: 'https://customer-assets.emergentagent.com/job_heir-mobile/artifacts/l0n3k7u9_Untitled%20design%20%282%29.jpg' }}
                style={styles.devAvatar}
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.devName}>Naeem Sikilkar</Text>
                <Pressable
                  testID="linkedin-link"
                  onPress={() => Linking.openURL('https://www.linkedin.com/in/naeem-sikilkar-64238395/')}
                  style={styles.linkedinBtn}
                >
                  <Ionicons name="logo-linkedin" size={14} color={colors.primary} />
                  <Text style={styles.linkedinText}>LinkedIn Profile</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.devBio}>
              NextHeir was built by Naeem Sikilkar, an aspiring AI Product Manager, using structured product
              thinking frameworks like CIRCLES combined with modern vibe-coding platforms to rapidly prototype
              and validate ideas.{'\n\n'}
              The inspiration behind NextHeir comes from a deeply personal experience — observing challenges
              within his own family around wealth distribution due to the absence of a formal will. This
              highlighted a common yet unspoken problem: decisions involving inheritance are often driven by
              emotions, assumptions, and lack of clarity, which can unintentionally strain relationships.{'\n\n'}
              NextHeir was envisioned as a solution to bring clarity, structure, and foresight into such
              sensitive decisions. While not a replacement for human judgment or legal advice, the platform
              aims to provide scenario-based insights, helping families explore different allocation
              possibilities, anticipate potential conflicts, and make more informed, balanced decisions —
              without compromising the bonds that matter most.
            </Text>
          </View>
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
  sectionHeader: { marginTop: spacing.xl, marginBottom: spacing.md },
  stepCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.paper, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  stepIcon: {
    width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold,
  },
  stepLabel: { ...typography.overline, color: colors.textSecondary, marginBottom: 4 },
  stepTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  stepDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  tipCard: {
    flexDirection: 'row', gap: spacing.md, backgroundColor: colors.paper,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  tipNum: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  tipNumText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  tipTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tipDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  disclaimerCard: {
    backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,152,0,0.3)',
    padding: spacing.lg, borderRadius: radius.lg, marginTop: spacing.md,
  },
  disclaimerHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  disclaimerTitle: { color: colors.warning, fontWeight: '700', fontSize: 14 },
  disclaimerText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  devCard: {
    backgroundColor: colors.paper, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderGold,
  },
  devTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  devAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface },
  devName: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  linkedinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderGold,
  },
  linkedinText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  devBio: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
