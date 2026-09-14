"use client";

import { useEffect, useRef } from "react";
import type { Session } from "@/core/auth/entities";
import { hasPermission } from "@/core/auth/permissions";

const POLL_INTERVAL_MS = 15_000;

/**
 * Polls for the most recently placed order and plays a short chime the
 * moment a new one appears — lets staff notice an incoming order without
 * needing the admin tab focused or the orders page open. Mounted once in
 * the protected admin layout, so it keeps running across every admin page
 * navigation, not just the orders list.
 *
 * Renders nothing (`null`) — this is a background side effect, not UI.
 *
 * Synthesizes the chime with the Web Audio API instead of shipping an
 * audio file asset. Browsers only allow audio playback after a user
 * gesture on the page; staff will always have interacted with the page at
 * least once (logging in) before any order can arrive, so by the time this
 * needs to actually play, the `AudioContext` is already unlocked.
 *
 * A background/unfocused browser tab is still enough for this to work —
 * browsers throttle `setInterval` timers in inactive tabs (commonly to
 * once a minute) but don't stop them outright, and don't block audio
 * playback from an already-unlocked `AudioContext`. A fully locked phone
 * screen or a closed tab cannot run any of this — that would need a native
 * app or push notifications, well beyond an in-page poll.
 */
export function NewOrderAlert({ session }: { session: Session }) {
  const lastSeenOrderId = useRef<string | null | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!hasPermission(session, "orders:view")) return;

    function playChime() {
      audioContextRef.current ??= new AudioContext();
      const context = audioContextRef.current;
      if (context.state === "suspended") void context.resume();

      const now = context.currentTime;
      // Two short rising tones read as a distinct "new order" chime rather
      // than a generic beep, without needing an audio file asset.
      [660, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        const start = now + index * 0.15;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.35);
      });
    }

    async function checkForNewOrder() {
      try {
        const response = await fetch("/api/admin/orders/latest", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { latestOrderId: string | null };

        if (lastSeenOrderId.current === undefined) {
          // The first check after mount/reload establishes the baseline —
          // never chimes for an order that already existed before this
          // page load.
          lastSeenOrderId.current = data.latestOrderId;
          return;
        }

        if (data.latestOrderId && data.latestOrderId !== lastSeenOrderId.current) {
          lastSeenOrderId.current = data.latestOrderId;
          playChime();
        }
      } catch {
        // A transient network hiccup shouldn't stop future polls — the
        // next interval tick just tries again.
      }
    }

    void checkForNewOrder();
    const interval = setInterval(() => void checkForNewOrder(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session]);

  return null;
}
