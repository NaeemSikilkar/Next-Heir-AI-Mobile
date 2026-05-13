import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, CURRENCIES, formatCurrency, formatCurrencyFull } from './theme';
import { useAuth } from './auth';

export const useCurrency = () => {
  const { user } = useAuth();
  const code = user?.currency || 'INR';
  const meta = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
  return {
    code,
    symbol: meta.symbol,
    name: meta.name,
    flag: meta.flag,
    format: (n: number) => formatCurrency(n, code),
    formatFull: (n: number) => formatCurrencyFull(n, code),
  };
};

export const CurrencyPickerButton: React.FC<{ compact?: boolean; testID?: string }> = ({ compact, testID }) => {
  const { code, symbol, flag } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        testID={testID || 'currency-picker-btn'}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.btn, compact && styles.btnCompact, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.btnText}>{symbol} {code}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </Pressable>
      <CurrencyPickerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export const CurrencyPickerModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, setCurrency } = useAuth();
  const current = user?.currency || 'INR';

  const handlePick = async (code: string) => {
    try {
      await setCurrency(code);
      onClose();
    } catch (e: any) {
      Alert.alert('Could not update currency', e.message);
    }
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Select Currency</Text>
              <Text style={styles.sub}>All values across the app will update instantly.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} testID="currency-close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
            {CURRENCIES.map((c) => {
              const active = c.code === current;
              return (
                <Pressable
                  key={c.code}
                  testID={`currency-${c.code}`}
                  onPress={() => handlePick(c.code)}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <Text style={styles.rowFlag}>{c.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{c.name}</Text>
                    <Text style={styles.rowCode}>{c.code}</Text>
                  </View>
                  <Text style={[styles.rowSymbol, active && { color: colors.primary }]}>{c.symbol}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 8 }} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.borderGold,
  },
  btnCompact: { paddingHorizontal: 10, paddingVertical: 6 },
  flag: { fontSize: 14 },
  btnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
    maxHeight: '80%', borderWidth: 1, borderColor: colors.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  title: { ...typography.h3 },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.md, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.borderGold, backgroundColor: colors.primarySoft },
  rowFlag: { fontSize: 24 },
  rowName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  rowCode: { color: colors.textSecondary, fontSize: 12, marginTop: 2, letterSpacing: 0.5 },
  rowSymbol: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'right' },
});
