"use client";

import { useEffect } from "react";

export function useRealtime(onEvent: (event: string) => void) {
  useEffect(() => {
    const source = new EventSource("/api/realtime?practiceId=default");

    const handleEvent = (event: MessageEvent) => {
      onEvent(event.type);
    };

    const events = [
      "appointments.updated",
      "claims.updated",
      "payments.created",
      "dashboard.refresh",
    ];

    events.forEach((eventName) => {
      source.addEventListener(eventName, handleEvent);
    });

    source.addEventListener("error", () => {
      // Let the browser attempt automatic reconnect.
    });

    return () => {
      events.forEach((eventName) => source.removeEventListener(eventName, handleEvent));
      source.close();
    };
  }, [onEvent]);
}
