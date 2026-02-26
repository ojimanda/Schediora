import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppSessionStore } from '../../../app/providers/useAppSessionStore';
import { colors, spacing } from '../../../app/theme/tokens';
import { AppButton } from '../../../shared/components/AppButton';
import { AppCard } from '../../../shared/components/AppCard';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';
import { SegmentedControl } from '../../../shared/components/SegmentedControl';
import { DashboardChartRange } from '../../../shared/types/dashboard';
import { useStudyTasks } from '../../planner/hooks/useStudyPlans';
import { FocusLineChart } from '../charts/FocusLineChart';
import { SubjectDonutChart } from '../charts/SubjectDonutChart';
import { WeeklyBarChart } from '../charts/WeeklyBarChart';
import { generateAiPlan, getAiJob, getWeeklyAiStatus } from '../api/aiApi';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const AI_POLL_INTERVAL_MS = 2000;
const AI_MAX_POLL_ATTEMPTS = 45;

export function DashboardScreen() {
  const queryClient = useQueryClient();
  const userName = useAppSessionStore(state => state.userName);
  const accessToken = useAppSessionStore(state => state.accessToken);
  const onboardingDraft = useAppSessionStore(state => state.onboardingDraft);

  const [range, setRange] = useState<DashboardChartRange>('7d');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const { data, isFetching } = useDashboardSummary(range, accessToken);
  const { data: tasks } = useStudyTasks(accessToken);
  const { data: aiWeeklyStatus } = useQuery({
    queryKey: ['ai-weekly-status', accessToken],
    queryFn: () => getWeeklyAiStatus(accessToken as string),
    enabled: Boolean(accessToken),
    refetchInterval: 15000,
  });

  const progressPercent = useMemo(() => {
    if (!data || data.todayTotal === 0) {
      return 0;
    }
    return Math.round((data.todayCompleted / data.todayTotal) * 100);
  }, [data]);

  const nextSession = useMemo(() => {
    if (!tasks?.length) {
      return null;
    }

    return (
      tasks.find(plan => plan.status === 'in_progress') ??
      tasks.find(plan => plan.status === 'pending') ??
      tasks[0]
    );
  }, [tasks]);

  const hasWeeklyPlanner = (tasks?.length ?? 0) > 0;

  const handleGeneratePlan = async () => {
    if (aiLoading) {
      return;
    }

    if (!accessToken) {
      setAiError('Session is invalid. Please sign in again.');
      return;
    }
    if (hasWeeklyPlanner) {
      setAiError('Weekly planner already set. You can generate a new AI plan next week.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiStatus('queued');

    try {
      const topic = onboardingDraft.focusTopics[0] ?? 'Biology';
      const generated = await generateAiPlan(accessToken, {
        goal: onboardingDraft.goal,
        topic,
      });
      console.info('AI job queued', generated.job_id);

      for (let attempt = 0; attempt < AI_MAX_POLL_ATTEMPTS; attempt += 1) {
        await sleep(AI_POLL_INTERVAL_MS);
        const job = await getAiJob(accessToken, generated.job_id);
        setAiStatus(job.status);
        console.info('AI job status', job.job_id, job.status);

        if (job.status === 'completed') {
          setAiStatus('completed');
          queryClient.invalidateQueries({ queryKey: ['study-sessions', accessToken] }).catch(() => undefined);
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }).catch(() => undefined);
          queryClient.invalidateQueries({ queryKey: ['ai-weekly-status', accessToken] }).catch(() => undefined);
          return;
        }

        if (job.status === 'failed') {
          setAiStatus('failed');
          setAiError('AI generation failed. Check worker/backend logs.');
          return;
        }
      }

      setAiError('AI job timeout. Please retry and verify worker/Ollama are running.');
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.title}>Hey, {userName}</Text>
          <Text style={styles.subtitle}>Stay consistent. You are close to today's target.</Text>
        </View>
        {isFetching ? <ActivityIndicator color={colors.accent} /> : null}
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Today Progress</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>

        <Text style={styles.caption}>
          {data?.todayCompleted ?? 0}/{data?.todayTotal ?? 0} sessions completed • {data?.streakDays ?? 0}-day streak
        </Text>

        {!hasWeeklyPlanner ? (
          <AppButton
            label={aiLoading ? 'Generating...' : 'Generate AI Plan'}
            onPress={() => {
              handleGeneratePlan().catch(() => undefined);
            }}
          />
        ) : (
          <Text style={styles.caption}>
            {aiWeeklyStatus?.has_generated_this_week
              ? 'AI plan already generated this week. Manage and update tasks from Planner tab.'
              : 'Weekly planner already set manually. You can generate AI plan again next week.'}
          </Text>
        )}

        {aiStatus ? <Text style={styles.caption}>AI status: {aiStatus}</Text> : null}
        {aiStatus === 'completed' ? (
          <Text style={styles.successText}>AI plan generated successfully. Check tasks in Planner tab.</Text>
        ) : null}
        {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
      </AppCard>

      <AppCard>
        <View style={styles.chartHeader}>
          <Text style={styles.cardTitle}>Insights</Text>
          <SegmentedControl
            options={[
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' },
            ]}
            value={range}
            onChange={setRange}
          />
        </View>

        <Text style={styles.sectionLabel}>Weekly Completion</Text>
        <WeeklyBarChart
          values={data?.weeklyProgress ?? [0, 0, 0, 0, 0, 0, 0]}
          mode={range === '7d' ? 'days' : 'weeks'}
        />

        <Text style={styles.sectionLabel}>Focus Time Trend</Text>
        <FocusLineChart
          points={
            data?.focusMinutesTrend ?? [
              { label: 'W1', minutes: 0 },
              { label: 'W2', minutes: 0 },
              { label: 'W3', minutes: 0 },
              { label: 'W4', minutes: 0 },
            ]
          }
        />

        <Text style={styles.sectionLabel}>Subject Distribution</Text>
        <SubjectDonutChart data={data?.subjectDistribution ?? []} />
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Next Session</Text>
        {nextSession ? (
          <View style={styles.nextSessionRow}>
            <Ionicons name="flash-outline" size={20} color={colors.accent} />
            <View style={styles.nextSessionTextWrap}>
              <Text style={styles.nextSessionTitle}>{nextSession.title}</Text>
              <Text style={styles.caption}>
                {nextSession.topic} • {nextSession.durationMinutes} minutes
                {nextSession.scheduledAt ? ` • ${formatShortTime(nextSession.scheduledAt)}` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.caption}>No upcoming session yet.</Text>
        )}
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 99,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },
  progressText: {
    color: colors.textPrimary,
    width: 42,
    fontWeight: '700',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  chartHeader: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  nextSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextSessionTextWrap: {
    flex: 1,
  },
  nextSessionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  successText: {
    color: colors.success,
    fontSize: 12,
  },
});

function formatShortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
