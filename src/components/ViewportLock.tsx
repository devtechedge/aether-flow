/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useEffect } from "react";

/**
 * Keep browser page-zoom from hijacking the IDE. Wheel / pinch / ctrl+/-
 * must never scale the chrome — only the canvas handles zoom.
 */
export default function ViewportLock() {
  useEffect(() => {
    const blockWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const blockKeys = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key === "+" || event.key === "-" || event.key === "=" || event.key === "0") {
        event.preventDefault();
      }
    };

    const blockGesture = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    window.addEventListener("keydown", blockKeys, { capture: true });
    document.addEventListener("gesturestart", blockGesture, { capture: true });
    document.addEventListener("gesturechange", blockGesture, { capture: true });
    document.addEventListener("gestureend", blockGesture, { capture: true });

    return () => {
      window.removeEventListener("wheel", blockWheel, true);
      window.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("gesturestart", blockGesture, true);
      document.removeEventListener("gesturechange", blockGesture, true);
      document.removeEventListener("gestureend", blockGesture, true);
    };
  }, []);

  return null;
}
