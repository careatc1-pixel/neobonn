// The HelpDesk chat widget mounts once, globally, in App.jsx. Other
// pages (e.g. Account's "Help & Support" card) need to trigger it open
// without prop-drilling or a heavier global store — a plain window
// CustomEvent is the simplest thing that works everywhere.
const OPEN_EVENT = "neobonn:open-helpdesk";

export function openHelpDesk() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function onOpenHelpDesk(callback) {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}
