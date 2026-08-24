"use client";

import { useCallback, useMemo, useState } from "react";

import {
  AUTH_MODE_LABELS,
  AUTH_MODE_ORDER,
  AUTH_MODES,
  type AuthMode,
} from "@/constants/auth";
import type { SegmentedControlItem } from "@/shared/SegmentedControl";

export interface UseAuthModeResult {
  mode: AuthMode;
  isSignIn: boolean;
  isSignUp: boolean;
  /** Segment descriptors ready for `<SegmentedControl />`. */
  items: readonly SegmentedControlItem<AuthMode>[];
  setMode: (mode: AuthMode) => void;
  /** Flips to the mode the user is not currently on. */
  toggle: () => void;
}

/**
 * Owns which half of the auth panel is showing. Kept as a hook rather than
 * inline state so the sign-in/sign-up relationship stays named and testable —
 * the segmented toggle and the footer link both drive the same switch.
 */
export function useAuthMode(
  initialMode: AuthMode = AUTH_MODES.SIGN_IN,
): UseAuthModeResult {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const toggle = useCallback(() => {
    setMode((current) =>
      current === AUTH_MODES.SIGN_IN ? AUTH_MODES.SIGN_UP : AUTH_MODES.SIGN_IN,
    );
  }, []);

  const items = useMemo(
    () =>
      AUTH_MODE_ORDER.map((value) => ({
        value,
        label: AUTH_MODE_LABELS[value],
        controls: `${value}-panel`,
      })),
    [],
  );

  return {
    mode,
    isSignIn: mode === AUTH_MODES.SIGN_IN,
    isSignUp: mode === AUTH_MODES.SIGN_UP,
    items,
    setMode,
    toggle,
  };
}
