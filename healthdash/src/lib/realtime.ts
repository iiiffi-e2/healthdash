import { EventEmitter } from "events";

type RealtimePayload = {
  event: string;
  data: unknown;
};

const globalForRealtime = globalThis as unknown as {
  realtime?: EventEmitter;
};

const emitter =
  globalForRealtime.realtime ??
  (() => {
    const instance = new EventEmitter();
    instance.setMaxListeners(50);
    return instance;
  })();

if (process.env.NODE_ENV !== "production") {
  globalForRealtime.realtime = emitter;
}

export function emitRealtime(channel: string, event: string, data: unknown) {
  emitter.emit(channel, { event, data } satisfies RealtimePayload);
}

export function subscribeRealtime(
  channel: string,
  callback: (payload: RealtimePayload) => void,
) {
  emitter.on(channel, callback);
  return () => emitter.off(channel, callback);
}
