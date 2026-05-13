import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inAdmin = segments[0] === 'admin';
    const atRoot = segments.length === 0 || segments[0] === undefined;
    const isAdmin = user?.role === 'admin';

    if (!user && !inAuthGroup && !atRoot) {
      router.replace('/(auth)/welcome');
    } else if (user && (inAuthGroup || atRoot)) {
      router.replace(isAdmin ? '/admin' : '/(tabs)/dashboard');
    } else if (user && isAdmin && !inAdmin) {
      // If admin is somewhere non-admin (e.g., tabs), keep them on admin page
      // Only redirect on initial entry; skip if they're navigating intentionally
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="asset-edit" options={{ title: 'Asset', presentation: 'modal' }} />
              <Stack.Screen name="family-edit" options={{ title: 'Family Member', presentation: 'modal' }} />
              <Stack.Screen name="scenario-edit" options={{ title: 'Scenario', presentation: 'modal' }} />
              <Stack.Screen name="scenario/[id]" options={{ title: 'Scenario' }} />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
