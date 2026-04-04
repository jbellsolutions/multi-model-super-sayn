import { NextRequest } from "next/server";
import { executePlan } from "@/lib/runtime";
import { AgentName, ExecutionPlan } from "@/lib/contracts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { message, plan, enabledAgents } = (await req.json()) as {
    message: string;
    plan: ExecutionPlan;
    enabledAgents: AgentName[];
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const event of executePlan({
          message,
          plan,
          enabledAgents,
        })) {
          send(event);
        }
      } catch (error) {
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Unknown execution error.",
        });
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

