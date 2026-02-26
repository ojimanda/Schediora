import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import { useAppSessionStore } from '../../../app/providers/useAppSessionStore';
import { colors, spacing } from '../../../app/theme/tokens';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';

export function ProfileScreen() {
  const userName = useAppSessionStore(state => state.userName);
  const signOut = useAppSessionStore(state => state.signOut);
  const isNotificationsEnabled = useAppSessionStore(state => state.isNotificationsEnabled);

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Preferences and account settings.</Text>
      </View>

      <AppCard>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={20} color={colors.accent} />
          <View>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Reminder Notifications</Text>
          <Switch value={isNotificationsEnabled} 
          onValueChange={value => {
            useAppSessionStore.setState({ isNotificationsEnabled: value });
          }} trackColor={{ true: colors.accent }} />
        </View>
      </AppCard>

      <AppButton
        label="Logout"
        variant="secondary"
        onPress={() => {
          signOut().catch(() => undefined);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing.sm,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
