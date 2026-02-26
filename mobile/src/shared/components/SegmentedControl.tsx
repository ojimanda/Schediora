import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../app/theme/tokens';

type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map(option => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.item, isActive && styles.itemActive]}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  labelActive: {
    color: '#06273A',
  },
});
