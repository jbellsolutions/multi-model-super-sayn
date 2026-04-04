import { NextRequest } from "next/server";
import { AGENTS, routeByKeyword } from "@/lib/agents";
import { AgentName } from "@/lib/contracts";
import { streamChat, Message } from "@/lib/stream";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { message, agentName, history } = (await req.json()) as {
    message: string;
    agentName?: AgentName;
    history: Message[];
  };

  // Route to best agent
  const selectedAgent = agentName ?? routeByKeyword(message);
  const agent = AGENTS[selectedAgent];

  const messages: Message[] = [
    ...history,
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Guard: check API key is present before streaming
        if (agent.provider === "gemini" && !process.env.GEMINI_API_KEY) {
          send({ type: "routing", agent: selectedAgent, model: agent.model, provider: agent.provider });
          send({ type: "error", message: `GEMINI_API_KEY is not set. Add it to Railway env vars or .env.local to use ${agent.displayName}.` });
          return;
        }
        if (agent.provider === "openai" && !process.env.OPENAI_API_KEY) {
          send({ type: "routing", agent: selectedAgent, model: agent.model, provider: agent.provider });
          send({ type: "error", message: `OPENAI_API_KEY is not set. Add it to Railway env vars or .env.local to use ${agent.displayName}.` });
          return;
        }
        if (agent.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
          send({ type: "routing", agent: selectedAgent, model: agent.model, provider: agent.provider });
          send({ type: "error", message: `ANTHROPIC_API_KEY is not set. Add it to Railway env vars or .env.local to use ${agent.displayName}.` });
          return;
        }

        // First event: which agent was selected
        send({ type: "routing", agent: selectedAgent, model: agent.model, provider: agent.provider });

        const gen = streamChat(agent.provider, agent.model, agent.systemPrompt, messages);
        for await (const token of gen) {
          send({ type: "token", text: token });
        }

        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
