// Whether this counselor portal may show Attendance, Leave and Salary.
//
// The answer comes from the SERVER, once per page load, not from a flag compiled into the build.
// A build-time flag cannot be checked against the server that holds the data, and the two drifted
// apart exactly as you would expect: the server was returning attendance rows while the portal had
// no tab to show them on, and nothing anywhere said which of the two was wrong.
//
// Three states, not two. "unknown" is a question that could not be asked - a cold start, a dropped
// request - and it must not look like "HR is switched off". The tab stays hidden either way, because
// the server would refuse the routes, but the reason is said out loud in the console.
import { api } from "./api";

export type HrState = "unknown" | "on" | "off";

/** One request per page load, shared by the sidebar and the route guard. */
let asked: Promise<HrState> | null = null;

export function askServerAboutHr(): Promise<HrState> {
  if (!asked) {
    asked = (async () => {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const data = await api<{ hr: boolean }>("/me/features");
          return data.hr ? "on" : "off";
        } catch (error) {
          // One retry: this runs on first paint, and a container waking up answers the first
          // request badly.
          if (attempt === 2) {
            console.error(
              "[counselor] Could not read /api/counselor/me/features, so Attendance, Leave and Salary stay hidden. "
                + "This is NOT the same as HR being switched off: GET /api/version reports features.counselorHr "
                + "to settle which it is.",
              error,
            );
            return "unknown";
          }
          await new Promise((resolve) => { setTimeout(resolve, 1500); });
        }
      }
      return "unknown";
    })();
  }
  return asked;
}

/** Forgets the cached answer. For tests, and for a sign-out that changes who is asking. */
export function forgetHrAnswer() {
  asked = null;
}
