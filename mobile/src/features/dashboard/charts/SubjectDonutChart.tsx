import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, spacing } from '../../../app/theme/tokens';

type Slice = {
  subject: string;
  minutes: number;
  color: string;
};

type Props = {
  data: Slice[];
};

export function SubjectDonutChart({ data }: Props) {
  const [active, setActive] = useState(0);
  const radius = 50;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const total = useMemo(() => data.reduce((acc, item) => acc + item.minutes, 0), [data]);
  let cumulative = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap}>
        <Svg width={140} height={140}>
          {data.map((item, index) => {
            const fraction = item.minutes / Math.max(total, 1);
            const dash = circumference * fraction;
            const offset = circumference - cumulative;
            cumulative += dash;
            return (
              <Circle
                key={item.subject}
                cx={70}
                cy={70}
                r={radius}
                stroke={item.color}
                strokeWidth={index === active ? strokeWidth + 3 : strokeWidth}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                rotation={-90}
                origin="70,70"
                onPress={() => setActive(index)}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.legendWrap}>
        {data.map((item, index) => (
          <Pressable key={item.subject} style={styles.legendItem} onPress={() => setActive(index)}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, index === active && styles.legendTextActive]}>
              {item.subject} - {item.minutes}m
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.caption}>
        Top focus: {data[active]?.subject} ({Math.round((data[active]?.minutes / Math.max(total, 1)) * 100)}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  chartWrap: {
    alignItems: 'center',
  },
  legendWrap: {
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  legendTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
