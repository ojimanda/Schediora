import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { useAppSessionStore } from '../../../app/providers/useAppSessionStore';
import { colors, radius, spacing } from '../../../app/theme/tokens';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';

export function LoginScreen() {
  const loginWithPassword = useAppSessionStore(state => state.loginWithPassword);
  const registerWithPassword = useAppSessionStore(state => state.registerWithPassword);
  const isAuthLoading = useAppSessionStore(state => state.isAuthLoading);
  const authError = useAppSessionStore(state => state.authError);
  const clearAuthError = useAppSessionStore(state => state.clearAuthError);

  const [email, setEmail] = useState('yozi@schediora.dev');
  const [password, setPassword] = useState('12345678');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const submitLabel = useMemo(
    () => (mode === 'login' ? 'Sign In with Email' : 'Create Account'),
    [mode],
  );

  const handleSubmit = async () => {
    clearAuthError();
    if (mode === 'login') {
      await loginWithPassword(email.trim(), password);
      return;
    }
    await registerWithPassword(email.trim(), password);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Sign in to Schediora</Text>
        <Text style={styles.subtitle}>Authentication is connected to the FastAPI backend.</Text>
      </View>

      <AppCard>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('login')}
            style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}>
            <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Login</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('register')}
            style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}>
            <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>Register</Text>
          </Pressable>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholder="minimum 6 chars"
              placeholderTextColor={colors.textSecondary}
              style={styles.passwordInput}
            />
            <Pressable
              onPress={() => setShowPassword(value => !value)}
              hitSlop={10}
              style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.oauthButton}>
          <Ionicons name="logo-google" size={20} color={colors.textSecondary} />
          <Text style={styles.oauthText}>Google/Apple OAuth will be added next</Text>
        </View>

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        {isAuthLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Connecting to backend...</Text>
          </View>
        ) : null}
      </AppCard>

      <AppButton label={submitLabel} onPress={handleSubmit} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  modeButton: {
    flex: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
  },
  modeText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  modeTextActive: {
    color: '#052B36',
  },
  inputWrap: {
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    paddingRight: spacing.sm,
  },
  passwordInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  oauthButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  oauthText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
