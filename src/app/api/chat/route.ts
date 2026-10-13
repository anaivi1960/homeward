import { streamText } from 'ai';
import { model, system, tools } from '@/lib/agent';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages } = await request.json();
  const result = streamText({ model, system, messages, tools, maxSteps: 6 });
  return result.toDataStreamResponse({
    getErrorMessage: (error) => (error instanceof Error ? error.message : 'Something went wrong.'),
  });
}
