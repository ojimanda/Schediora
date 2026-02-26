import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, spacing } from '../../../app/theme/tokens';

type Point = {
  label: string;
  minutes: number;
};

type Props = {
  points: Point[];
};

export function FocusLineChart({ points }: Props) {
  const [active, setActive] = useState(0);
  const width = 280;
  const height = 120;

  const { path, mapped } = useMemo(() => {
    const max = Math.max(...points.map(p => p.minutes), 1);
    const min = Math.min(...points.map(p => p.minutes), 0);
    const range = Math.max(max - min, 1);
    const stepX = width / Math.max(points.length - 1, 1);

    const m = points.map((p, i) => {
      const x = stepX * i;
      const y = height - ((p.minutes - min) / range) * height;
      return { ...p, x, y };
    });

    const d = m.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return { path: d, mapped: m };
  }, [points]);

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={height}>
        <Path d={path} stroke={colors.chartMint} strokeWidth={3} fill="none" />
        {mapped.map((p, index) => (
          <Circle
            key={`${p.label}-${index}`}
            cx={p.x}
            cy={p.y}
            r={active === index ? 6 : 4}
            fill={active === index ? colors.accent : colors.chartBlue}
            onPress={() => setActive(index)}
          />
        ))}
      </Svg>
      <View style={styles.legendRow}>
        {mapped.map((p, index) => (
          <Text
            key={`${p.label}-legend`}
            onPress={() => setActive(index)}
            style={[styles.legendText, active === index && styles.legendTextActive]}>
            {p.label}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>
        {mapped[active]?.label}: {mapped[active]?.minutes} focus minutes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
