import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const MODEL = 'claude-sonnet-4-6';

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!env.anthropicApiKey) return null;
  if (!client) client = new Anthropic({ apiKey: env.anthropicApiKey });
  return client;
}

export const aiEnabled = () => Boolean(env.anthropicApiKey);

async function complete(prompt: string, system?: string): Promise<string> {
  const c = getClient();
  if (!c) throw new Error('AI_DISABLED');
  const resp = await c.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  const first = resp.content[0];
  return first.type === 'text' ? first.text : '';
}

// ---------- Public API (each returns a mock if no key) ----------

export interface BreakdownItem {
  title: string;
  estimatedMinutes: number;
}

export async function taskBreakdown(taskTitle: string, context?: string): Promise<BreakdownItem[]> {
  if (!aiEnabled()) {
    return [
      { title: `Research requirements for: ${taskTitle}`, estimatedMinutes: 30 },
      { title: 'Draft initial implementation', estimatedMinutes: 90 },
      { title: 'Write tests and edge cases', estimatedMinutes: 45 },
      { title: 'Code review and polish', estimatedMinutes: 30 },
      { title: 'Deploy and verify', estimatedMinutes: 20 },
    ];
  }
  const text = await complete(
    `Break this task into 4-7 subtasks. Return ONLY valid JSON array of objects with keys "title" (string) and "estimatedMinutes" (number). No prose, no markdown fences.\n\nTask: ${taskTitle}\n${context ? `Context: ${context}` : ''}`,
    'You are a senior engineering manager who breaks down work into actionable subtasks. Always respond with valid JSON only.'
  );
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return [{ title: taskTitle, estimatedMinutes: 60 }];
}

export async function smartDescription(title: string): Promise<{ description: string; acceptanceCriteria: string[] }> {
  if (!aiEnabled()) {
    return {
      description: `**Overview**\nFlesh out the work for "${title}". This is a mock response — add ANTHROPIC_API_KEY to .env for real output.\n\n**Context**\nDescribe why this matters to the product or user.`,
      acceptanceCriteria: [
        'The feature works end-to-end on the happy path',
        'Error states are handled gracefully',
        'Tests cover the main scenarios',
      ],
    };
  }
  const text = await complete(
    `Write a rich description and acceptance criteria for this task. Return ONLY JSON with keys "description" (markdown string, 2-3 short paragraphs) and "acceptanceCriteria" (array of 3-6 strings).\n\nTitle: ${title}`,
    'You are a product manager who writes clear, actionable task descriptions. Respond with JSON only.'
  );
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { description: text, acceptanceCriteria: [] };
  }
}

export async function sprintSummary(tasks: { title: string; status: string }[]): Promise<string> {
  if (!aiEnabled()) {
    return `# Weekly Sprint Summary (mock)\n\n**Completed:** ${tasks.filter((t) => t.status === 'Done').length}\n**In progress:** ${tasks.filter((t) => t.status === 'In Progress').length}\n**Highlights:** Mock response — add ANTHROPIC_API_KEY to enable AI summaries.`;
  }
  return complete(
    `Write a crisp weekly sprint summary (markdown, max 250 words) given these tasks:\n${tasks.map((t) => `- [${t.status}] ${t.title}`).join('\n')}`,
    'You write executive-ready sprint summaries. Be concise, positive but honest.'
  );
}

export async function prioritySuggestion(input: {
  title: string;
  description?: string;
  dueDate?: string;
}): Promise<{ priority: 'low' | 'medium' | 'high' | 'urgent'; reason: string }> {
  if (!aiEnabled()) {
    return { priority: 'medium', reason: 'Mock response — no API key set.' };
  }
  const text = await complete(
    `Suggest priority for this task. Return ONLY JSON with keys "priority" (one of: low, medium, high, urgent) and "reason" (1-2 sentences).\n\nTitle: ${input.title}\nDescription: ${input.description ?? ''}\nDue: ${input.dueDate ?? 'none'}`,
    'You help engineering teams prioritize work. Respond with JSON only.'
  );
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { priority: 'medium', reason: 'Could not parse AI response.' };
  }
}

export async function standupGenerator(userTasks: { title: string; status: string }[]): Promise<string> {
  if (!aiEnabled()) {
    return `**Yesterday:** Worked on ${userTasks.slice(0, 2).map((t) => t.title).join(', ') || 'nothing yet'}\n**Today:** Continue current tasks\n**Blockers:** None\n\n_(mock — add API key for real AI)_`;
  }
  return complete(
    `Write a daily standup note (Yesterday / Today / Blockers format) for these tasks:\n${userTasks.map((t) => `- [${t.status}] ${t.title}`).join('\n')}`,
    'You write concise daily standup notes in first person.'
  );
}
