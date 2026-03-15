import { z } from 'zod';

// Widget config schemas
export const alertConfigSchema = z.object({
  title: z.string().optional(),
  alertDuration: z.number().min(2).max(15).optional(),
  minAmount: z.number().min(0).optional(),
  showMessage: z.boolean().optional(),
  ttsEnabled: z.boolean().optional(),
  soundUrl: z.string().url().optional().or(z.literal('')),
});

export const rankingConfigSchema = z.object({
  title: z.string().optional(),
  maxDisplay: z.number().min(1).max(20).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'all']).optional(),
});

// Integration config schema
export const integrationConfigSchema = z.object({
  alertbox_key: z.string().min(1, '키를 입력해주세요').optional(),
  socket_token: z.string().min(1, '토큰을 입력해주세요').optional(),
  username: z.string().min(1, '사용자명을 입력해주세요').optional(),
  channel_id: z.string().min(1, '채널 ID를 입력해주세요').optional(),
  bj_id: z.string().min(1, 'BJ ID를 입력해주세요').optional(),
});

// Generic positive amount validator
export const positiveAmount = z.number().min(0, '0 이상이어야 합니다');
export const positiveInteger = z.number().int().min(1);

// General widget config schema (loose validation for any widget type)
export const widgetConfigSchema = z.object({
  title: z.string().optional(),
  soundUrl: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  alertDuration: z.number().min(2, '최소 2초').max(15, '최대 15초').optional(),
  minAmount: z.number().min(0, '0 이상이어야 합니다').optional(),
  maxDisplay: z.number().min(1, '최소 1').max(20, '최대 20').optional(),
  volume: z.number().min(0, '0 이상').max(100, '100 이하').optional(),
}).passthrough(); // Allow other widget-specific fields
