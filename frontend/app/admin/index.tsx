import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { FadeInUp, Floating } from '../../src/anim';
import { useAuth } from '../../src/auth';
import { api, API_BASE, getToken } from '../../src/api';

type AdminUser = {
  id: string;
  full_name?: string;
  email?: string | null;
  mobile?: string | null;
  auth_method?: string;
  currency?: string;
  role?: string;
  created_at?: string;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function AdminScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const [u, s] = await Promise.all([api.adminListUsers(), api.adminStats()]);
      setUsers(u);
      setStats(s);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const onExport = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      const url = `${API_BASE}/admin/users/export`;
      const filename = `${FileSystem.cacheDirectory}nextheir-users-${Date.now()}.xlsx`;
      const dl = await FileSystem.downloadAsync(url, filename, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Platform.OS === 'web') {
        // On web, open the file URL
        // @ts-ignore
        if (typeof window !== 'undefined') window.open(dl.uri, '_blank');
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dl.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'NextHeir Users Export',
        });
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Exit admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.mobile || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Floating range={3} duration={2800}>
            <View style={styles.logo}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
          </Floating>
          <View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>{user?.full_name || 'Administrator'}</Text>
          </View>
        </View>
        <Pressable testID="admin-signout" onPress={onSignOut} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stat cards */}
        <FadeInUp>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.statVal}>{stats?.total_users ?? '—'}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={20} color={colors.primary} />
              <Text style={styles.statVal}>{stats?.total_assets ?? '—'}</Text>
              <Text style={styles.statLabel}>Assets</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="git-network" size={20} color={colors.primary} />
              <Text style={styles.statVal}>{stats?.total_scenarios ?? '—'}</Text>
              <Text style={styles.statLabel}>Scenarios</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={20} color={colors.primary} />
              <Text style={styles.statVal}>{stats?.total_chats ?? '—'}</Text>
              <Text style={styles.statLabel}>Chats</Text>
            </View>
          </View>
        </FadeInUp>

        {/* Export */}
        <FadeInUp delay={100}>
          <Pressable
            testID="admin-export-btn"
            onPress={onExport}
            disabled={exporting}
            style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }, exporting && { opacity: 0.6 }]}
          >
            {exporting ? <ActivityIndicator color={colors.textInverse} /> : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.textInverse} />
                <Text style={styles.exportText}>Export Users to Excel</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{users.length}</Text>
                </View>
              </>
            )}
          </Pressable>
        </FadeInUp>

        {/* Users table */}
        <FadeInUp delay={150}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>All Users</Text>
            <Text style={styles.sectionMeta}>{filtered.length} shown</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            filtered.map((u, i) => (
              <View key={u.id} style={styles.userCard} testID={`user-row-${i}`}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(u.full_name || u.email || u.mobile || '?').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName} numberOfLines={1}>{u.full_name || 'Unnamed'}</Text>
                    {u.role === 'admin' && (
                      <View style={styles.adminTag}>
                        <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                        <Text style={styles.adminTagText}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="mail-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>{u.email || '—'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="call-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{u.mobile || '—'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{formatDate(u.created_at)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold,
  },
  title: { ...typography.h3 },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: '22%', backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.lg,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border,
  },
  statVal: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 2 },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: radius.pill,
    marginBottom: spacing.lg, ...shadows.glow,
  },
  exportText: { color: colors.textInverse, fontWeight: '700', fontSize: 15 },
  countBadge: { backgroundColor: colors.textInverse, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3 },
  sectionMeta: { color: colors.textSecondary, fontSize: 12 },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textSecondary },
  userCard: {
    flexDirection: 'row', gap: spacing.md, backgroundColor: colors.paper,
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  userName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  adminTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderGold,
  },
  adminTagText: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaText: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
});
