import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Share, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, typography, shadows, ASSET_CATEGORIES } from '../../src/theme';
import { FadeInUp, Pulse, Floating } from '../../src/anim';
import { api, API_BASE, getToken } from '../../src/api';
import { useCurrency } from '../../src/currency';

export default function ScenarioDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formatFull } = useCurrency();
  const [scenario, setScenario] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeAsset, setActiveAsset] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [s, a, f] = await Promise.all([api.getScenario(id), api.listAssets(), api.listFamily()]);
      setScenario(s);
      setAssets(a);
      setFamily(f);
      setAllocations(s.allocations || {});
      if (a.length > 0 && !activeAsset) setActiveAsset(a[0].id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  useFocusEffect(useCallback(() => { loadAll(); }, [id]));

  if (!scenario) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalEstate = assets.reduce((s, a) => s + (a.value || 0), 0);

  const getAllocPct = (assetId: string, memberId: string) =>
    allocations[assetId]?.[memberId] || 0;

  const assetTotalPct = (assetId: string) => {
    const m = allocations[assetId] || {};
    return Object.values(m).reduce((a, b) => a + (b || 0), 0);
  };

  const setAlloc = (assetId: string, memberId: string, pct: number) => {
    const p = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));
    setAllocations((prev) => {
      const next = { ...prev };
      next[assetId] = { ...(next[assetId] || {}), [memberId]: p };
      return next;
    });
  };

  const equalSplit = (assetId: string) => {
    if (family.length === 0) return;
    const per = Math.floor(100 / family.length);
    const rem = 100 - per * family.length;
    const next: Record<string, number> = {};
    family.forEach((m, i) => { next[m.id] = per + (i === 0 ? rem : 0); });
    setAllocations((prev) => ({ ...prev, [assetId]: next }));
  };

  const clearAlloc = (assetId: string) => {
    setAllocations((prev) => ({ ...prev, [assetId]: {} }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await api.updateScenario(id, {
        name: scenario.name,
        description: scenario.description || '',
        allocations,
      });
      Alert.alert('Saved', 'Scenario allocations updated.');
      await loadAll();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const onAnalyze = async () => {
    if (assets.length === 0 || family.length === 0) {
      return Alert.alert('Not enough data', 'Add at least one asset and one family member.');
    }
    // First save
    setAnalyzing(true);
    try {
      await api.updateScenario(id, {
        name: scenario.name,
        description: scenario.description || '',
        allocations,
      });
      await api.analyzeScenario(id);
      await loadAll();
    } catch (e: any) {
      Alert.alert('AI Analysis failed', e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const onShare = async () => {
    try {
      const res = await api.shareScenario(id);
      const url = `${process.env.EXPO_PUBLIC_BACKEND_URL || ''}/api/shared/${res.share_token}`;
      await Share.share({
        message: `View my NextHeir distribution scenario "${scenario.name}": ${url}`,
        url,
      });
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    }
  };

  const onExportPdf = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      const url = `${API_BASE}/scenarios/${id}/pdf`;
      const filename = `${FileSystem.cacheDirectory}nextheir-${scenario.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      const dl = await FileSystem.downloadAsync(url, filename, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dl.uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' });
      } else if (Platform.OS === 'web') {
        window.open(dl.uri, '_blank');
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  const analysis = scenario.analysis;
  const score = analysis?.fairness_score;
  const scoreColor = score == null ? colors.textSecondary : score >= 70 ? colors.fairnessHigh : score >= 40 ? colors.fairnessMid : colors.fairnessLow;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: scenario.name,
          headerRight: () => (
            <Pressable
              testID="scenario-edit-meta"
              onPress={() => router.push({ pathname: '/scenario-edit', params: { id } })}
              hitSlop={10}
            >
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero with fairness */}
        <FadeInUp>
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.overline}>Total Estate</Text>
              <Text style={styles.heroValue}>{formatFull(totalEstate)}</Text>
              {scenario.description ? (
                <Text style={styles.heroDesc}>{scenario.description}</Text>
              ) : null}
            </View>
            <Pulse>
              <View style={[styles.scoreDial, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreNum, { color: scoreColor }]}>{score != null ? score : '—'}</Text>
                <Text style={styles.scoreLabel}>fairness</Text>
              </View>
            </Pulse>
          </View>
        </FadeInUp>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <Pressable
            testID="analyze-btn"
            onPress={onAnalyze}
            disabled={analyzing}
            style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.85 }, analyzing && { opacity: 0.7 }]}
          >
            {analyzing ? <ActivityIndicator color={colors.textInverse} /> : (
              <>
                <Ionicons name="sparkles" size={18} color={colors.textInverse} />
                <Text style={styles.primaryActionText}>{analysis ? 'Re-analyze' : 'Analyze with AI'}</Text>
              </>
            )}
          </Pressable>
          <Pressable testID="share-btn" onPress={onShare} style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable testID="pdf-btn" onPress={onExportPdf} disabled={exporting} style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]}>
            {exporting ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="document-text-outline" size={20} color={colors.primary} />}
          </Pressable>
        </View>

        {/* Asset chips selector */}
        {assets.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Allocations</Text>
            <Text style={styles.sectionSub}>Choose an asset and assign percentages to family members.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
              {assets.map((a) => {
                const cat = ASSET_CATEGORIES.find((c) => c.key === a.category) || ASSET_CATEGORIES[4];
                const isActive = a.id === activeAsset;
                const sum = assetTotalPct(a.id);
                return (
                  <Pressable
                    key={a.id}
                    testID={`asset-chip-${a.id}`}
                    onPress={() => setActiveAsset(a.id)}
                    style={[styles.assetChip, isActive && styles.assetChipActive]}
                  >
                    <Ionicons name={cat.icon as any} size={16} color={isActive ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.assetChipText, isActive && { color: colors.primary }]}>{a.name}</Text>
                    <View style={[styles.pctBadge, sum === 100 ? styles.pctOk : sum > 100 ? styles.pctErr : styles.pctWarn]}>
                      <Text style={styles.pctBadgeText}>{sum}%</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {activeAsset && (
              <View style={styles.allocCard}>
                <View style={styles.allocHead}>
                  <Text style={styles.allocAssetName}>
                    {assets.find((a) => a.id === activeAsset)?.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Pressable testID="equal-split-btn" onPress={() => equalSplit(activeAsset)} style={styles.miniBtn}>
                      <Text style={styles.miniBtnText}>Equal split</Text>
                    </Pressable>
                    <Pressable testID="clear-alloc-btn" onPress={() => clearAlloc(activeAsset)} style={styles.miniBtn}>
                      <Text style={styles.miniBtnText}>Clear</Text>
                    </Pressable>
                  </View>
                </View>

                {family.length === 0 ? (
                  <Text style={styles.muted}>Add family members first to allocate.</Text>
                ) : (
                  family.map((m) => {
                    const pct = getAllocPct(activeAsset, m.id);
                    const amt = ((assets.find((a) => a.id === activeAsset)?.value || 0) * pct) / 100;
                    return (
                      <View key={m.id} style={styles.allocRow}>
                        <View style={styles.memberCircle}>
                          <Text style={styles.memberInitials}>
                            {m.name.split(' ').slice(0, 2).map((p: string) => p[0]?.toUpperCase() || '').join('')}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberRel}>{m.relationship} · {formatFull(amt)}</Text>
                        </View>
                        <View style={styles.pctInputWrap}>
                          <TextInput
                            testID={`alloc-${activeAsset}-${m.id}`}
                            style={styles.pctInput}
                            value={pct ? String(pct) : ''}
                            onChangeText={(t) => setAlloc(activeAsset, m.id, parseFloat(t))}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textDisabled}
                            maxLength={3}
                          />
                          <Text style={styles.pctSign}>%</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            <Pressable
              testID="save-alloc-btn"
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            >
              {saving ? <ActivityIndicator color={colors.textInverse} /> : (
                <Text style={styles.saveBtnText}>Save Allocations</Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Floating range={5}>
              <View style={styles.emptyIcon}>
                <Ionicons name="briefcase-outline" size={28} color={colors.primary} />
              </View>
            </Floating>
            <Text style={styles.emptyTitle}>No assets yet</Text>
            <Text style={styles.emptySub}>Add assets first to allocate them in this scenario.</Text>
            <Pressable onPress={() => router.push('/asset-edit')} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>+ Add asset</Text>
            </Pressable>
          </View>
        )}

        {/* AI Analysis */}
        {analysis && (
          <FadeInUp>
            <View style={styles.analysisCard}>
              <View style={styles.analysisHead}>
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={styles.aiBadgeText}>AI ANALYSIS</Text>
                </View>
                <View style={[styles.fairnessChip, { backgroundColor: scoreColor + '22', borderColor: scoreColor }]}>
                  <Text style={[styles.fairnessChipText, { color: scoreColor }]}>{analysis.fairness_label}</Text>
                </View>
              </View>
              <Text style={styles.analysisSummary}>{analysis.summary}</Text>

              {analysis.totals_by_member && (
                <View style={styles.totalsBox}>
                  <Text style={styles.totalsTitle}>Distribution Summary</Text>
                  {Object.entries(analysis.totals_by_member).map(([mid, info]: any) => (
                    <View key={mid} style={styles.totalsRow}>
                      <Text style={styles.totalsName}>{info.name}</Text>
                      <Text style={styles.totalsAmount}>
                        {formatFull(info.amount)} · {info.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {analysis.strengths?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subHead}>✓ Strengths</Text>
                  {analysis.strengths.map((s: string, i: number) => (
                    <View key={i} style={styles.bullet}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.bulletText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {analysis.risks?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subHead}>⚠ Risks</Text>
                  {analysis.risks.map((r: any, i: number) => {
                    const c = r.level === 'high' ? colors.fairnessLow : r.level === 'medium' ? colors.fairnessMid : colors.fairnessHigh;
                    return (
                      <View key={i} style={[styles.riskBox, { borderLeftColor: c }]}>
                        <Text style={[styles.riskTitle, { color: c }]}>{r.title}</Text>
                        <Text style={styles.riskDetail}>{r.detail}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {analysis.recommendations?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.subHead}>💡 Recommendations</Text>
                  {analysis.recommendations.map((r: string, i: number) => (
                    <View key={i} style={styles.bullet}>
                      <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                      <Text style={styles.bulletText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </FadeInUp>
        )}

        <Text style={styles.disclaimer}>
          AI-generated insights are indicative only. Consult your CA, lawyer, or wealth manager before final decisions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.paper, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderGold, ...shadows.ambient, marginBottom: spacing.md,
  },
  overline: { ...typography.overline },
  heroValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.xs, letterSpacing: -0.5 },
  heroDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  scoreDial: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 22, fontWeight: '800' },
  scoreLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  primaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.pill, ...shadows.glow,
  },
  primaryActionText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  iconAction: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  sectionSub: { ...typography.caption, marginBottom: spacing.sm },
  assetChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.paper, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  assetChipActive: { borderColor: colors.borderGold, backgroundColor: colors.primarySoft },
  assetChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', maxWidth: 120 },
  pctBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 4 },
  pctOk: { backgroundColor: 'rgba(76,175,80,0.2)' },
  pctWarn: { backgroundColor: 'rgba(255,179,0,0.2)' },
  pctErr: { backgroundColor: 'rgba(244,67,54,0.2)' },
  pctBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
  allocCard: { backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm, gap: spacing.sm },
  allocHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs, flexWrap: 'wrap', gap: spacing.sm },
  allocAssetName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  miniBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  memberCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  memberInitials: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  memberName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  memberRel: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
  pctInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, minWidth: 70 },
  pctInput: { color: colors.textPrimary, fontSize: 16, paddingVertical: 8, width: 40, textAlign: 'right', fontWeight: '700' },
  pctSign: { color: colors.textSecondary, fontSize: 13, marginLeft: 2 },
  muted: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', marginTop: spacing.md, ...shadows.glow },
  saveBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.lg },
  linkBtn: { marginTop: spacing.md },
  linkBtnText: { color: colors.primary, fontWeight: '700' },
  analysisCard: { backgroundColor: colors.paper, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderGold, marginTop: spacing.xl, ...shadows.ambient },
  analysisHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  aiBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  fairnessChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  fairnessChipText: { fontSize: 12, fontWeight: '700' },
  analysisSummary: { color: colors.textPrimary, fontSize: 15, lineHeight: 22 },
  totalsBox: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md, gap: spacing.xs },
  totalsTitle: { ...typography.overline, marginBottom: spacing.xs },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalsName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  totalsAmount: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  section: { marginTop: spacing.md },
  subHead: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs, paddingRight: spacing.md },
  bulletText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
  riskBox: { backgroundColor: colors.surface, borderLeftWidth: 3, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 6, marginBottom: spacing.sm },
  riskTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  riskDetail: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  disclaimer: { color: colors.textDisabled, fontSize: 11, textAlign: 'center', marginTop: spacing.lg, fontStyle: 'italic', lineHeight: 18 },
});
