import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { useAuth } from '../../src/auth';
import { FadeInUp, Floating } from '../../src/anim';
import { api } from '../../src/api';

export default function Register() {
  const router = useRouter();
  const { signUpEmail, signInMobile } = useAuth();
  const [mode, setMode] = useState<'email' | 'mobile'>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onEmail = async () => {
    if (!fullName || !email || !password) return Alert.alert('Missing fields', 'Please fill all fields.');
    if (password.length < 6) return Alert.alert('Weak password', 'Use at least 6 characters.');
    setLoading(true);
    try {
      await signUpEmail(fullName.trim(), email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async () => {
    if (!fullName.trim()) return Alert.alert('Missing name', 'Please enter your full name');
    if (mobile.length < 6) return Alert.alert('Invalid mobile', 'Enter a valid mobile number');
    setLoading(true);
    try {
      const res = await api.requestOtp(mobile.trim());
      setOtpSent(true);
      Alert.alert('OTP sent', `Demo OTP: ${res.otp_mock}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length !== 6) return Alert.alert('Invalid OTP', 'Enter the 6-digit OTP');
    setLoading(true);
    try {
      await signInMobile(mobile.trim(), otp.trim(), fullName.trim());
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12} testID="back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>

          <FadeInUp>
            <Floating range={4}>
              <View style={styles.logoBadge}>
                <Ionicons name="diamond" size={28} color={colors.primary} />
              </View>
            </Floating>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Start planning your family&apos;s future</Text>
          </FadeInUp>

          <View style={styles.tabSwitch}>
            <Pressable
              testID="tab-email"
              style={[styles.tab, mode === 'email' && styles.tabActive]}
              onPress={() => setMode('email')}
            >
              <Text style={[styles.tabText, mode === 'email' && styles.tabTextActive]}>Email</Text>
            </Pressable>
            <Pressable
              testID="tab-mobile"
              style={[styles.tab, mode === 'mobile' && styles.tabActive]}
              onPress={() => setMode('mobile')}
            >
              <Text style={[styles.tabText, mode === 'mobile' && styles.tabTextActive]}>Mobile</Text>
            </Pressable>
          </View>

          <FadeInUp delay={100}>
            <View style={styles.field}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                testID="register-name-input"
                placeholder="Full name"
                placeholderTextColor={colors.textDisabled}
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {mode === 'email' ? (
              <>
                <View style={styles.field}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    testID="register-email-input"
                    placeholder="Email"
                    placeholderTextColor={colors.textDisabled}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <View style={styles.field}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    testID="register-password-input"
                    placeholder="Password (min 6 chars)"
                    placeholderTextColor={colors.textDisabled}
                    style={styles.input}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <Pressable
                  testID="register-submit"
                  onPress={onEmail}
                  disabled={loading}
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create Account</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.field}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    testID="register-mobile-input"
                    placeholder="Mobile number"
                    placeholderTextColor={colors.textDisabled}
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={mobile}
                    onChangeText={setMobile}
                    editable={!otpSent}
                  />
                </View>
                {otpSent && (
                  <View style={styles.field}>
                    <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
                    <TextInput
                      testID="register-otp-input"
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={colors.textDisabled}
                      style={styles.input}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                )}
                <Pressable
                  testID={otpSent ? 'register-verify-otp' : 'register-send-otp'}
                  onPress={otpSent ? onVerifyOtp : onSendOtp}
                  disabled={loading}
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{otpSent ? 'Verify & Create' : 'Send OTP'}</Text>
                  )}
                </Pressable>
              </>
            )}
          </FadeInUp>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable testID="goto-login">
                <Text style={styles.linkText}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: spacing.md },
  logoBadge: {
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderGold, marginBottom: spacing.md,
  },
  title: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.bodyMuted, marginBottom: spacing.xl },
  tabSwitch: {
    flexDirection: 'row', backgroundColor: colors.paper, borderRadius: radius.pill,
    padding: 4, marginBottom: spacing.lg,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGold },
  tabText: { color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.paper, borderRadius: radius.md, paddingHorizontal: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, minHeight: 56,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16, paddingVertical: 16 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 18,
    alignItems: 'center', marginTop: spacing.sm, ...shadows.glow,
  },
  primaryBtnText: { color: colors.textInverse, fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textSecondary },
  linkText: { color: colors.primary, fontWeight: '700' },
});
