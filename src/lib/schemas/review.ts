import { z } from 'zod';

export const UnresolvedQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  context: z.string().optional(),
  raisedBy: z.string().optional(),
  severity: z.enum(['high', 'medium', 'low']).default('medium'),
});

export const UnassignedResponsibilitySchema = z.object({
  id: z.string(),
  task: z.string(),
  context: z.string().optional(),
  suggestedRole: z.string().optional(),
});

export const MissingDeadlineSchema = z.object({
  id: z.string(),
  task: z.string(),
  assignee: z.string().optional(),
  urgency: z.enum(['high', 'medium', 'low']).default('medium'),
});

export const MissingDependencySchema = z.object({
  id: z.string(),
  blocker: z.string(),
  impactedArea: z.string(),
  description: z.string().optional(),
});

export const ContradictionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  statements: z.array(z.string()),
  participantsInvolved: z.array(z.string()).optional(),
});

export const PotentialRiskSchema = z.object({
  id: z.string(),
  risk: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  mitigation: z.string().optional(),
});

export const AIReviewSchema = z.object({
  overallScore: z.number().min(0).max(100).default(85),
  summary: z.string(),
  unresolvedQuestions: z.array(UnresolvedQuestionSchema).default([]),
  unassignedResponsibilities: z.array(UnassignedResponsibilitySchema).default([]),
  missingDeadlines: z.array(MissingDeadlineSchema).default([]),
  missingDependencies: z.array(MissingDependencySchema).default([]),
  contradictions: z.array(ContradictionSchema).default([]),
  potentialRisks: z.array(PotentialRiskSchema).default([]),
  reviewedAt: z.string().optional(),
});

export type UnresolvedQuestion = z.infer<typeof UnresolvedQuestionSchema>;
export type UnassignedResponsibility = z.infer<typeof UnassignedResponsibilitySchema>;
export type MissingDeadline = z.infer<typeof MissingDeadlineSchema>;
export type MissingDependency = z.infer<typeof MissingDependencySchema>;
export type Contradiction = z.infer<typeof ContradictionSchema>;
export type PotentialRisk = z.infer<typeof PotentialRiskSchema>;
export type AIReview = z.infer<typeof AIReviewSchema>;
