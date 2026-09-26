export interface MeetingTemplateDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  color: string;
  bgLight: string;
  borderLight: string;
  iconName: string;
  focusAreas: string[];
}

export const MEETING_TEMPLATES: Record<string, MeetingTemplateDefinition> = {
  general: {
    id: 'general',
    name: 'General Discussion',
    badge: 'General',
    description: 'Standard executive summary, core takeaways, action items, and key decisions.',
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    iconName: 'Sparkles',
    focusAreas: ['Executive Summary', 'Key Takeaways', 'Action Items', 'Decisions', 'Highlights'],
  },
  one_on_one: {
    id: 'one_on_one',
    name: '1:1 Growth & Feedback',
    badge: '1:1 Catchup',
    description: 'Workload check-in, performance feedback, blockers, and career development milestones.',
    color: 'text-purple-700',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    iconName: 'UserCheck',
    focusAreas: ['Workload & Morale', 'Feedback & Coaching', 'Career Goals', 'Next Commitments'],
  },
  sales: {
    id: 'sales',
    name: 'Sales & Customer Discovery',
    badge: 'Sales Discovery',
    description: 'Customer pain points, stakeholder authority, budget & timeline, and commercial next steps.',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    iconName: 'TrendingUp',
    focusAreas: ['Pain Points', 'Decision Makers', 'Budget & Timeline', 'Security Prerequisites', 'Proposal Next Steps'],
  },
  interview: {
    id: 'interview',
    name: 'Candidate Interview',
    badge: 'Interview',
    description: 'Candidate technical competency, architectural depth, culture alignment, and leveling scorecard.',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    iconName: 'UserPlus',
    focusAreas: ['Technical Competence', 'System Design', 'Communication', 'Hiring Recommendation'],
  },
  project: {
    id: 'project',
    name: 'Project Sync & Kickoff',
    badge: 'Project Sync',
    description: 'Sprint milestones, technical dependencies, blocker resolutions, and release timelines.',
    color: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    iconName: 'Target',
    focusAreas: ['Sprint Milestones', 'Technical Architecture', 'Blockers & Dependencies', 'Release Readiness'],
  },
};

export function getTemplateDefinition(templateId?: string): MeetingTemplateDefinition {
  if (!templateId || !MEETING_TEMPLATES[templateId]) {
    return MEETING_TEMPLATES.general;
  }
  return MEETING_TEMPLATES[templateId];
}
