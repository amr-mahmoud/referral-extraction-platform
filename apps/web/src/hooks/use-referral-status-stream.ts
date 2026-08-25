"use client";

import * as React from "react";

import type { ReferralListItemDto } from "@/managers/referral-view.manager";

const REFERRAL_CHANGED_EVENT = "referral-changed";
const STREAM_PATH = "/api/referrals/stream";

/**
 * Subscribes to the clinic's referral-changes SSE stream for the lifetime of
 * the calling component. Wraps a native `EventSource` directly rather than
 * going through the `useServerAction`/mutation pattern — this is a
 * subscription, not a request/response, per
 * `frontend-workflow-architecture.md`.
 *
 * `onReferralChanged` is read through a ref so callers can pass an inline
 * closure without re-opening the connection on every render.
 */
export function useReferralStatusStream(
  onReferralChanged: (referral: ReferralListItemDto) => void,
): void {
  const handlerRef = React.useRef(onReferralChanged);

  React.useEffect(() => {
    handlerRef.current = onReferralChanged;
  }, [onReferralChanged]);

  React.useEffect(() => {
    const eventSource = new EventSource(STREAM_PATH);

    const handleReferralChanged = (event: MessageEvent<string>) => {
      try {
        const referral = JSON.parse(event.data) as ReferralListItemDto;
        handlerRef.current(referral);
      } catch {
        // Malformed payload — drop it, the next NOTIFY will carry a fresh one.
      }
    };

    eventSource.addEventListener(REFERRAL_CHANGED_EVENT, handleReferralChanged);

    return () => {
      eventSource.removeEventListener(
        REFERRAL_CHANGED_EVENT,
        handleReferralChanged,
      );
      eventSource.close();
    };
  }, []);
}
