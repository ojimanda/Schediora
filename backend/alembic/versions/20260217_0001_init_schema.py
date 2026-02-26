"""initial schema

Revision ID: 20260217_0001
Revises:
Create Date: 2026-02-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '20260217_0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'], unique=False)
    op.create_index('ix_refresh_tokens_token', 'refresh_tokens', ['token'], unique=True)

    op.create_table(
        'onboarding_preferences',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('goal', sa.String(length=120), nullable=False),
        sa.Column('daily_hours', sa.Integer(), nullable=False),
        sa.Column('focus_topics', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id'),
    )

    op.create_table(
        'study_plans',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('topic', sa.String(length=120), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=24), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_study_plans_user_id', 'study_plans', ['user_id'], unique=False)
    op.create_index('ix_study_plans_topic', 'study_plans', ['topic'], unique=False)
    op.create_index('ix_study_plans_status', 'study_plans', ['status'], unique=False)

    op.create_table(
        'study_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('plan_id', sa.String(length=36), nullable=True),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('topic', sa.String(length=120), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=24), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['plan_id'], ['study_plans.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_study_sessions_user_id', 'study_sessions', ['user_id'], unique=False)
    op.create_index('ix_study_sessions_topic', 'study_sessions', ['topic'], unique=False)
    op.create_index('ix_study_sessions_status', 'study_sessions', ['status'], unique=False)

    op.create_table(
        'ai_jobs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('goal', sa.String(length=180), nullable=False),
        sa.Column('topic', sa.String(length=120), nullable=False),
        sa.Column('status', sa.String(length=24), nullable=False),
        sa.Column('result_text', sa.Text(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_jobs_user_id', 'ai_jobs', ['user_id'], unique=False)
    op.create_index('ix_ai_jobs_status', 'ai_jobs', ['status'], unique=False)

    op.create_table(
        'dashboard_daily_metrics',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('metric_date', sa.Date(), nullable=False),
        sa.Column('completed_sessions', sa.Integer(), nullable=False),
        sa.Column('total_sessions', sa.Integer(), nullable=False),
        sa.Column('focus_minutes', sa.Integer(), nullable=False),
        sa.Column('subject_distribution', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'metric_date', name='uq_metrics_user_day'),
    )
    op.create_index('ix_dashboard_daily_metrics_user_id', 'dashboard_daily_metrics', ['user_id'], unique=False)
    op.create_index('ix_dashboard_daily_metrics_metric_date', 'dashboard_daily_metrics', ['metric_date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_dashboard_daily_metrics_metric_date', table_name='dashboard_daily_metrics')
    op.drop_index('ix_dashboard_daily_metrics_user_id', table_name='dashboard_daily_metrics')
    op.drop_table('dashboard_daily_metrics')

    op.drop_index('ix_ai_jobs_status', table_name='ai_jobs')
    op.drop_index('ix_ai_jobs_user_id', table_name='ai_jobs')
    op.drop_table('ai_jobs')

    op.drop_index('ix_study_sessions_status', table_name='study_sessions')
    op.drop_index('ix_study_sessions_topic', table_name='study_sessions')
    op.drop_index('ix_study_sessions_user_id', table_name='study_sessions')
    op.drop_table('study_sessions')

    op.drop_index('ix_study_plans_status', table_name='study_plans')
    op.drop_index('ix_study_plans_topic', table_name='study_plans')
    op.drop_index('ix_study_plans_user_id', table_name='study_plans')
    op.drop_table('study_plans')

    op.drop_table('onboarding_preferences')

    op.drop_index('ix_refresh_tokens_token', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
