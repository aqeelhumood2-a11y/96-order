"use client";

import { useEffect, useRef } from "react";
import type { Session } from "@/core/auth/entities";
import { hasPermission } from "@/core/auth/permissions";

const POLL_INTERVAL_MS = 4_000;
const RINGS_PER_BURST = 3;
const RING_SPACING_SECONDS = 0.5;

/**
 * Polls for any order still sitting `confirmed` (placed and paid, but not
 * yet accepted by staff) and plays a burst of rings on every tick one
 * exists — repeated ring-ring-ring, back to back, like a delivery app's
 * incoming-order alert, not a single soft chime — so it keeps going until
 * someone actually accepts or declines the order from its detail page.
 * Mounted once in the protected admin layout, so it keeps running across
 * every admin page navigation, not just the orders list.
 *
 * Renders nothing (`null`) — this is a background side effect, not UI.
 *
 * Synthesizes the ring with the Web Audio API instead of shipping an audio
 * file asset. Browsers only allow an `AudioContext` to actually make sound
 * after it's created/resumed *synchronously inside* a real user gesture
 * handler (click/tap) — not from an `async` callback like `setInterval`.
 * iOS Safari enforces this strictly, so the context is unlocked here on the
 * first tap anywhere in the admin section and kept in a ref; once unlocked,
 * that same instance can keep playing later from the polling loop below
 * without needing another gesture.
 *
 * A background/unfocused browser tab is still enough for this to work —
 * browsers throttle `setInterval` timers in inactive tabs (commonly to
 * once a minute) but don't stop them outright, and don't block audio
 * playback from an already-unlocked `AudioContext`. A fully locked phone
 * screen or a closed tab cannot run any of this — that would need a native
 * app or push notifications, well beyond an in-page poll.
 */
export function NewOrderAlert({ session }: { session: Session }) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!hasPermission(session, "orders:view")) return;

    function unlockAudio() {
      audioContextRef.current ??= new AudioContext();
      if (audioContextRef.current.state === "suspended") void audioContextRef.current.resume();
    }

    // Several event types, not just one, to catch whatever the first real
    // interaction on the page happens to be.
    const unlockEvents = ["pointerdown", "click", "keydown"] as const;
    unlockEvents.forEach((eventName) => document.addEventListener(eventName, unlockAudio, { once: true }));

    function playRingBurst() {
      const context = audioContextRef.current;
      // Not unlocked by a tap yet — nothing can play until staff interacts
      // with the page once, same as before any browser lets audio through.
      if (!context) return;
      if (context.state === "suspended") void context.resume();

      const now = context.currentTime;
      for (let ring = 0; ring < RINGS_PER_BURST; ring++) {
        const ringStart = now + ring * RING_SPACING_SECONDS;
        // Two short rising tones read as a distinct "ring" rather than a
        // generic beep, without needing an audio file asset.
        [660, 880].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          const start = ringStart + index * 0.12;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.22);
        });
      }
    }

    async function checkForOrdersNeedingAcceptance() {
      try {
        const response = await fetch("/api/admin/orders/latest", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { hasOrdersAwaitingAcceptance: boolean };
        if (data.hasOrdersAwaitingAcceptance) playRingBurst();
      } catch {
        // A transient network hiccup shouldn't stop future polls — the
        // next interval tick just tries again.
      }
    }

    void checkForOrdersNeedingAcceptance();
    const interval = setInterval(() => void checkForOrdersNeedingAcceptance(), POLL_INTERVAL_MS);
    return () => {
      unlockEvents.forEach((eventName) => document.removeEventListener(eventName, unlockAudio));
      clearInterval(interval);
    };
  }, [session]);

  return null;
}
