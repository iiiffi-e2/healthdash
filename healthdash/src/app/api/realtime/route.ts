import { subscribeRealtime } from "@/lib/realtime";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const practiceId = searchParams.get("practiceId") ?? "default";
  const channel = `practice:${practiceId}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: { event: string; data: unknown }) => {
        controller.enqueue(
          encoder.encode(
            `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`,
          ),
        );
      };

      const unsubscribe = subscribeRealtime(channel, send);
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
