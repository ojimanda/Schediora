import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppSessionStore } from '../../../app/providers/useAppSessionStore';
import { colors, spacing } from '../../../app/theme/tokens';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';
import { SegmentedControl } from '../../../shared/components/SegmentedControl';
import { StudyTaskStatus, StudyTaskVM, addTaskToCurrentPlan, createManualPlan, updateStudyTaskStatus } from '../api/plansApi';
import { useStudyTasks } from '../hooks/useStudyPlans';

type PlannerView = 'timeline' | 'board';

export function PlannerScreen() {
  const queryClient = useQueryClient();
  const accessToken = useAppSessionStore(state => state.accessToken);
  const [view, setView] = useState<PlannerView>('timeline');
  const [manualTitle, setManualTitle] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualDuration, setManualDuration] = useState('45');
  const [manualError, setManualError] = useState<string | null>(null);

  const { data: tasks = [], isLoading, isFetching, error } = useStudyTasks(accessToken);

  const mutation = useMutation({
    mutationFn: async (params: { sessionId: string; status: StudyTaskStatus }) => {
      if (!accessToken) {
        throw new Error('Missing session token');
      }
      return updateStudyTaskStatus(accessToken, params.sessionId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions', accessToken] }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }).catch(() => undefined);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        throw new Error('Missing session token');
      }
      const title = manualTitle.trim();
      const topic = manualTopic.trim();
      const duration = Number(manualDuration);
      if (!title || !topic) {
        throw new Error('Please fill title and topic.');
      }
      if (!Number.isFinite(duration) || duration < 15) {
        throw new Error('Duration must be at least 15 minutes.');
      }
      const payload = {
        title,
        topic,
        duration_minutes: Math.round(duration),
      };

      if (hasCurrentPlan) {
        return addTaskToCurrentPlan(accessToken, payload);
      }

      return createManualPlan(accessToken, payload);
    },
    onSuccess: () => {
      setManualTitle('');
      setManualTopic('');
      setManualDuration('45');
      setManualError(null);
      queryClient.invalidateQueries({ queryKey: ['study-sessions', accessToken] }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }).catch(() => undefined);
    },
    onError: createError => {
      setManualError(createError instanceof Error ? createError.message : 'Failed to add manual task.');
    },
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(task => task.status === 'done').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, pending, completionRate };
  }, [tasks]);

  const timelineItems = useMemo(() => buildTimeline(tasks), [tasks]);

  const pendingTasks = useMemo(() => tasks.filter(item => item.status === 'pending'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(item => item.status === 'in_progress'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter(item => item.status === 'done'), [tasks]);
  const hasCurrentPlan = useMemo(() => tasks.some(item => Boolean(item.planId)), [tasks]);

  return (
    <ScreenContainer>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Planner</Text>
        <Text style={styles.subtitle}>Weekly task plan from AI. Update task status here and dashboard updates automatically.</Text>
      </View>

      <AppCard>
        <View style={styles.statsTopRow}>
          <Text style={styles.cardTitle}>Progress</Text>
          {isFetching ? <ActivityIndicator color={colors.accent} size="small" /> : null}
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${stats.completionRate}%` }]} />
        </View>

        <Text style={styles.caption}>{stats.completionRate}% completed • {stats.done}/{stats.total} tasks done</Text>

        <View style={styles.statPillsRow}>
          <StatusPill label="Pending" value={stats.pending} tone="pending" />
          <StatusPill label="In Progress" value={stats.inProgress} tone="active" />
          <StatusPill label="Done" value={stats.done} tone="done" />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Add Manual Task</Text>
        <Text style={styles.caption}>
          {hasCurrentPlan
            ? 'Task will be added into your current weekly plan.'
            : 'No weekly plan yet. First manual task will create this week plan.'}
        </Text>
        <TextInput
          placeholder="Task title"
          placeholderTextColor={colors.textSecondary}
          value={manualTitle}
          onChangeText={setManualTitle}
          style={styles.input}
        />
        <View style={styles.inlineInputs}>
          <TextInput
            placeholder="Topic"
            placeholderTextColor={colors.textSecondary}
            value={manualTopic}
            onChangeText={setManualTopic}
            style={[styles.input, styles.inlineInput]}
          />
          <TextInput
            placeholder="Minutes"
            placeholderTextColor={colors.textSecondary}
            value={manualDuration}
            onChangeText={setManualDuration}
            keyboardType="numeric"
            style={[styles.input, styles.inlineInput]}
          />
        </View>
        {manualError ? <Text style={styles.errorText}>{manualError}</Text> : null}
        <AppButton
          label={createMutation.isPending ? 'Saving...' : 'Add To Planner'}
          onPress={() => createMutation.mutate()}
        />
      </AppCard>

      <AppCard>
        <View style={styles.viewHeader}>
          <Text style={styles.cardTitle}>Plan View</Text>
          <SegmentedControl
            options={[
              { label: 'Timeline', value: 'timeline' },
              { label: 'Board', value: 'board' },
            ]}
            value={view}
            onChange={value => setView(value as PlannerView)}
          />
        </View>

        {isLoading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.caption}>Loading tasks...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error instanceof Error ? error.message : 'Failed to load tasks.'}</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-clear-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.caption}>No weekly tasks yet. Generate AI plan from dashboard.</Text>
          </View>
        ) : view === 'timeline' ? (
          <View style={styles.timelineWrap}>
            {timelineItems.map(item => (
              <View key={item.rowKey} style={styles.timelineRow}>
                <View style={styles.timelineTimeWrap}>
                  <Text style={styles.timelineTime}>{item.startLabel}</Text>
                  <Text style={styles.timelineDuration}>{item.durationMinutes}m</Text>
                </View>

                <View style={[styles.timelineDot, toneToDotStyle(item.status)]} />

                <View style={styles.timelineCard}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.caption}>{item.topic}</Text>
                  <TaskStatusActions
                    currentStatus={item.status}
                    loading={mutation.isPending}
                    onChange={nextStatus => {
                      mutation.mutate({ sessionId: item.id, status: nextStatus });
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boardScrollContent}>
            <BoardColumn
              title="Pending"
              icon="time-outline"
              tasks={pendingTasks}
              tone="pending"
              loading={mutation.isPending}
              onChange={(id, status) => mutation.mutate({ sessionId: id, status })}
            />
            <BoardColumn
              title="In Progress"
              icon="play-circle-outline"
              tasks={inProgressTasks}
              tone="active"
              loading={mutation.isPending}
              onChange={(id, status) => mutation.mutate({ sessionId: id, status })}
            />
            <BoardColumn
              title="Done"
              icon="checkmark-done-circle-outline"
              tasks={doneTasks}
              tone="done"
              loading={mutation.isPending}
              onChange={(id, status) => mutation.mutate({ sessionId: id, status })}
            />
          </ScrollView>
        )}
      </AppCard>
    </ScreenContainer>
  );
}

type TimelineItem = StudyTaskVM & {
  rowKey: string;
  startLabel: string;
};

function buildTimeline(tasks: StudyTaskVM[]): TimelineItem[] {
  let cursorMinutes = 8 * 60;

  return tasks.map((item, index) => {
    const startLabel = item.scheduledAt ? formatFromIso(item.scheduledAt) : formatClock(cursorMinutes);
    cursorMinutes += Math.max(30, item.durationMinutes) + 15;

    return {
      ...item,
      rowKey: `${item.id}-${index}`,
      startLabel,
    };
  });
}

function formatClock(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatFromIso(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type BoardColumnProps = {
  title: string;
  icon: string;
  tasks: StudyTaskVM[];
  tone: 'pending' | 'active' | 'done';
  loading: boolean;
  onChange: (sessionId: string, status: StudyTaskStatus) => void;
};

function BoardColumn({ title, icon, tasks, tone, loading, onChange }: BoardColumnProps) {
  return (
    <View style={styles.boardColumn}>
      <View style={styles.boardColumnHeader}>
        <Ionicons name={icon as never} size={16} color={toneToColor(tone)} />
        <Text style={styles.boardTitle}>{title}</Text>
        <Text style={styles.boardCount}>{tasks.length}</Text>
      </View>

      {tasks.length === 0 ? (
        <Text style={styles.caption}>No items</Text>
      ) : (
        tasks.map(task => (
          <View key={task.id} style={styles.boardCard}>
            <Text style={styles.itemTitle}>{task.title}</Text>
            <Text style={styles.caption}>
              {task.topic} • {task.durationMinutes} min
            </Text>
            <TaskStatusActions
              currentStatus={task.status}
              loading={loading}
              onChange={nextStatus => onChange(task.id, nextStatus)}
            />
          </View>
        ))
      )}
    </View>
  );
}

type TaskStatusActionsProps = {
  currentStatus: StudyTaskStatus;
  loading: boolean;
  onChange: (status: StudyTaskStatus) => void;
};

function TaskStatusActions({ currentStatus, loading, onChange }: TaskStatusActionsProps) {
  return (
    <View style={styles.statusActionsRow}>
      {[
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Done', value: 'done' },
      ].map(option => {
        const active = currentStatus === option.value;
        return (
          <Pressable
            key={option.value}
            disabled={loading || active}
            onPress={() => onChange(option.value as StudyTaskStatus)}
            style={[styles.statusAction, active && styles.statusActionActive]}>
            <Text style={[styles.statusActionLabel, active && styles.statusActionLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type StatusPillProps = {
  label: string;
  value: number;
  tone: 'pending' | 'active' | 'done';
};

function StatusPill({ label, value, tone }: StatusPillProps) {
  return (
    <View style={[styles.statusPill, { borderColor: toneToColor(tone), backgroundColor: toneToBg(tone) }]}>
      <Text style={styles.statusPillLabel}>{label}</Text>
      <Text style={[styles.statusPillValue, { color: toneToColor(tone) }]}>{value}</Text>
    </View>
  );
}

function toneToColor(tone: StatusPillProps['tone']) {
  if (tone === 'done') {
    return colors.success;
  }
  if (tone === 'active') {
    return colors.accent;
  }
  return colors.warning;
}

function toneToBg(tone: StatusPillProps['tone']) {
  if (tone === 'done') {
    return '#0F2A1B';
  }
  if (tone === 'active') {
    return colors.accentSoft;
  }
  return '#2D230B';
}

function toneToDotStyle(status: StudyTaskVM['status']) {
  if (status === 'done') {
    return { backgroundColor: colors.success };
  }
  if (status === 'in_progress') {
    return { backgroundColor: colors.accent };
  }
  return { backgroundColor: colors.warning };
}

const styles = StyleSheet.create({
  headerWrap: {
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
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  statsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.bgSurface,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
  },
  statusPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  statusPillLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  statusPillValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewHeader: {
    gap: spacing.sm,
  },
  timelineWrap: {
    gap: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineTimeWrap: {
    width: 62,
  },
  timelineTime: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineDuration: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.bgElevated,
    gap: spacing.xs,
  },
  statusActionsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusAction: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgSurface,
  },
  statusActionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  statusActionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  statusActionLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  boardScrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  boardColumn: {
    width: 260,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
  },
  boardColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  boardTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  boardCount: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  boardCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
});
