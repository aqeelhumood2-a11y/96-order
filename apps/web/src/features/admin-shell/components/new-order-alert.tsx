"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@/core/auth/entities";
import { hasPermission } from "@/core/auth/permissions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

const POLL_INTERVAL_MS = 15_000;

/**
 * Polls for any order still sitting `confirmed` (placed and paid, but not
 * yet accepted by staff) and plays a short chime on every tick one exists —
 * a repeating alarm, not a one-shot chime, so it can't be missed by a
 * single distracted moment and keeps going until someone actually accepts
 * or declines the order from its detail page. Mounted once in the
 * protected admin layout, so it keeps running across every admin page
 * navigation, not just the orders list.
 *
 * Synthesizes the chime with the Web Audio API instead of shipping an
 * audio file asset. Browsers only allow an `AudioContext` to actually make
 * sound after it's created/resumed *synchronously inside* a real user
 * gesture handler (click/tap) — not from an `async` callback like
 * `setInterval`. iOS Safari enforces this strictly and, critically, does
 * NOT carry an unlock over from a previous page load — a staff member who
 * opens the orders page and then just watches it, without ever tapping
 * anything on the page itself, gets total silence forever, since no
 * incidental gesture ever arrives to unlock a fresh `AudioContext`. Rather
 * than gambling on an incidental tap (the old approach — a plain
 * `pointerdown` listener that could go unfired all shift), this renders a
 * visible, explicit "enable sound" control so staff always has one deliberate
 * tap to confirm it's on, with a persistent label reflecting the real state.
 *
 * A background/unfocused browser tab is still enough for this to work once
 * enabled — browsers throttle `setInterval` timers in inactive tabs
 * (commonly to once a minute) but don't stop them outright, and don't block
 * audio playback from an already-unlocked `AudioContext`. A fully locked
 * phone screen or a closed tab cannot run any of this — that would need a
 * native app or push notifications, well beyond an in-page poll.
 */
export function NewOrderAlert({ session, locale = DEFAULT_LOCALE }: { session: Session; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderAlert;
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  function unlockAudio() {
    audioContextRef.current ??= new AudioContext();
    if (audioContextRef.current.state === "suspended") void audioContextRef.current.resume();
    setAudioEnabled(true);
  }

  useEffect(() => {
    if (!hasPermission(session, "orders:view")) return;

    // Kept as a fallback in addition to the explicit button below — any
    // real tap anywhere on the page unlocks audio too, so staff who happen
    // to click something before noticing the button still get sound.
    document.addEventListener("pointerdown", unlockAudio, { once: true });

    function playChime() {
      const context = audioContextRef.current;
      // Not unlocked yet — nothing can play until staff taps the enable
      // button (or anywhere else on the page) once, same as before any
      // browser lets audio through.
      if (!context) return;
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

    async function checkForOrdersNeedingAcceptance() {
      try {
        const response = await fetch("/api/admin/orders/latest", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { hasOrdersAwaitingAcceptance: boolean };
        if (data.hasOrdersAwaitingAcceptance) playChime();
      } catch {
        // A transient network hiccup shouldn't stop future polls — the
        // next interval tick just tries again.
      }
    }

    void checkForOrdersNeedingAcceptance();
    const interval = setInterval(() => void checkForOrdersNeedingAcceptance(), POLL_INTERVAL_MS);
    return () => {
      document.removeEventListener("pointerdown", unlockAudio);
      clearInterval(interval);
    };
  }, [session]);

  if (!hasPermission(session, "orders:view")) return null;

  return (
    <button
      type="button"
      onClick={unlockAudio}
      disabled={audioEnabled}
      className="fixed bottom-4 end-4 z-50 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-950 shadow-lg disabled:cursor-default disabled:border-success-200 disabled:bg-success-50 disabled:text-success-700"
    >
      {audioEnabled ? dict.enabled : dict.enable}
    </button>
  );
}
