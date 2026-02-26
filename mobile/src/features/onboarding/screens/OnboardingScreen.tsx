import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppSessionStore } from '../../../app/providers/useAppSessionStore';
import { colors, radius, spacing } from '../../../app/theme/tokens';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';

const allTopics = ['Math', 'Biology', 'Chemistry', 'English', 'Physics'];

export function OnboardingScreen() {
  const completeOnboarding = useAppSessionStore(state => state.completeOnboarding);
  const [goal, setGoal] = useState('Semester Exam');
  const [dailyHours, setDailyHours] = useState(2);
  const [focusTopics, setFocusTopics] = useState<string[]>(['Math', 'Biology']);

  const toggleTopic = (topic: string) => {
    setFocusTopics(prev =>
      prev.includes(topic) ? prev.filter(item => item !== topic) : [...prev, topic].slice(0, 3),
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.title}>Welcome to Schediora</Text>
        <Text style={styles.subtitle}>Set your learning preferences first. AI plans will adapt automatically.</Text>
      </View>

      <AppCard>
        <Text style={styles.sectionTitle}>Study Goal</Text>
        <View style={styles.chipsRow}>
          {['Semester Exam', 'UTBK', 'Certification'].map(item => (
            <Pressable
              key={item}
              onPress={() => setGoal(item)}
              style={[styles.chip, goal === item && styles.chipActive]}>
              <Text style={[styles.chipText, goal === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Study Hours Per Day</Text>
        <View style={styles.stepperRow}>
          <AppButton label="-" variant="secondary" onPress={() => setDailyHours(value => Math.max(1, value - 1))} />
          <Text style={styles.hoursText}>{dailyHours} hours</Text>
          <AppButton label="+" variant="secondary" onPress={() => setDailyHours(value => Math.min(8, value + 1))} />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Priority Topics (max 3)</Text>
        <View style={styles.chipsRow}>
          {allTopics.map(item => {
            const active = focusTopics.includes(item);
            return (
              <Pressable key={item} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleTopic(item)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppButton
        label="Continue to Login"
        onPress={() =>
          completeOnboarding({
            goal,
            dailyHours,
            focusTopics,
          })
        }
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#052B36',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  hoursText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
});
