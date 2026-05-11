import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows, typography } from '../../src/theme';
import { Floating, FadeInUp } from '../../src/anim';

const HERO = 'https://images.unsplash.com/photo-1761437855598-011cf89b2ad4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxnb2xkJTIwYW5kJTIwYmxhY2slMjBhYnN0cmFjdCUyMHRleHR1cmV8ZW58MHx8fHwxNzc4NDgwMDkyfDA&ixlib=rb-4.1.0&q=85';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: HERO }} style={styles.bg} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10,10,14,0.4)', 'rgba(10,10,14,0.8)', 'rgba(10,10,14,1)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <Floating range={6} duration={3200}>
              <View style={styles.logoBadge}>
                <Ionicons name="diamond" size={20} color={colors.primary} />
              </View>
            </Floating>
            <Text style={styles.brand}>NextHeir</Text>
          </View>

          <View style={styles.bottomContent}>
            <FadeInUp delay={150}>
              <Text style={styles.overline}>AI-Powered Wealth Distribution</Text>
            </FadeInUp>
            <FadeInUp delay={250}>
              <Text style={styles.headline}>Simulate your inheritance.</Text>
              <Text style={[styles.headline, { color: colors.primary }]}>Protect family harmony.</Text>
            </FadeInUp>
            <FadeInUp delay={400}>
              <Text style={styles.sub}>
                Make informed decisions with AI clarity. Avoid future conflicts before they begin.
              </Text>
            </FadeInUp>

            <FadeInUp delay={550} style={{ marginTop: spacing.xl }}>
              <Pressable
                testID="welcome-get-started"
                onPress={() => router.push('/(auth)/register')}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
              </Pressable>

              <Pressable
                testID="welcome-signin"
                onPress={() => router.push('/(auth)/login')}
                style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.ghostBtnText}>I already have an account</Text>
              </Pressable>
            </FadeInUp>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bg: { flex: 1 },
  gradient: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, gap: spacing.sm },
  logoBadge: {
    width: 40, height: 40, borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderGold,
  },
  brand: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  bottomContent: { paddingBottom: spacing.lg },
  overline: { ...typography.overline, color: colors.primary, marginBottom: spacing.md },
  headline: { fontSize: 36, fontWeight: '800', color: colors.textPrimary, lineHeight: 42, letterSpacing: -0.8 },
  sub: { ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 24 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 18, borderRadius: radius.pill,
    ...shadows.glow,
  },
  primaryBtnText: { color: colors.textInverse, fontSize: 17, fontWeight: '700' },
  ghostBtn: { paddingVertical: 18, alignItems: 'center', marginTop: spacing.sm },
  ghostBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
});
