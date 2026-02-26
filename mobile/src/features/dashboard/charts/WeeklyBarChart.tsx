import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../app/theme/tokens';

type Props = {
  values: number[];
  mode?: 'days' | 'weeks';
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyBarChart({ values, mode = 'days' }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = useMemo(() => Math.max(...values, 1), [values]);
  const labels = useMemo(() => {
    if (mode === 'weeks') {
      return values.map((_, index) => `W${index + 1}`);
    }
    return dayLabels.slice(0, values.length);
  }, [mode, values]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.chartRow}>
        {values.map((value, index) => {
          const heightPercent = Math.max((value / max) * 100, 6);
          const active = index === activeIndex;
          return (
            <Pressable key={`${labels[index]}-${value}`} style={styles.barWrap} onPress={() => setActiveIndex(index)}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${heightPercent}%` },
                    active && { backgroundColor: colors.chartMint },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{labels[index]}</Text>
            </Pressable>
          );
        })}
      </View>
      {activeIndex !== null ? (
        <Text style={styles.caption}>
          {labels[activeIndex]}: {values[activeIndex]} sessions completed
        </Text>
      ) : (
        <Text style={styles.caption}>Tap a bar to view day details</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    gap: spacing.sm,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  barTrack: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.chartBlue,
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dayLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
