// Read-only JDoodle messaging boundary.
// JDoodle documents ready/code/output notifications but not their payload schema
// in its public embed reference. This module DOES NOT interpret or grade events.
import {validateEmbedUrl} from "./checks.js";

export const JDOODLE_ORIGIN = "https://www.jdoodle.com";

// Strictly accept the frame instantiated from the configured course embed.
// Checking only event.origin is not sufficient: any JDoodle tab or iframe
// could otherwise send messages to the host page.
export function inspectEmbedMessage(event, frame, configuredUrl) {
  if (!validateEmbedUrl(configuredUrl)) return null;
  if (!frame || frame.tagName !== "IFRAME" || !frame.isConnected) return null;
  if (event?.origin !== JDOODLE_ORIGIN || event.source !== frame.contentWindow) return null;
  let configured, actual;
  try {
    configured = new URL(configuredUrl);
    actual = new URL(frame.getAttribute("src") || "", configured.origin);
  } catch { return null; }
  if (actual.origin !== JDOODLE_ORIGIN || actual.pathname !== configured.pathname) return null;
  const data = event.data;
  // Never read/store/echo code or output. Record a structural diagnostic only.
  const format = data === null ? "null" : Array.isArray(data) ? "array" : typeof data;
  let marker = "unspecified";
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const key of ["type","event","action"]) {
      // Marker values are never accepted as proof of status or execution.
      if (typeof data[key] === "string" && /^[a-zA-Z0-9:._/-]{1,48}$/.test(data[key])) {
        marker = data[key];
        break;
      }
    }
  }
  return Object.freeze({format, marker, verifiedOrigin:true, executionVerified:false});
}
