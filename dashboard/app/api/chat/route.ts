import { NextRequest } from "next/server";
import { AGENTS, routeByKeyword, AgentName } from "@/lib/agents";
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
