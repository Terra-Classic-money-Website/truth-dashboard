import type { deriveAgoraActivity } from "./agoraActivity";

type AgoraView = ReturnType<typeof deriveAgoraActivity>;
type Insight = { id: string; text: string };
const percent = (value: number) => `${value.toFixed(1)}%`;

export function deriveAgoraInsights(view: AgoraView, includeCandidates = false): Insight[] {
  const total = view.rows.length;
  const active = view.activeRows.length;
  const topics = view.topicRows.length;
  const highlights: Insight[] = [];

  if (total > 0) {
    highlights.push({
      id: "participation",
      text: includeCandidates
        ? `Including unverified matches, an estimated ${active} of ${total} current validators wrote here (${percent(view.activePower)} of voting power).`
        : `${active < total / 2 ? "Only " : ""}${active} of ${total} current validators have identifiable writing here (${percent(view.activePower)} of voting power).`,
    });
  }

  if (topics > 0) {
    const missing = topics - view.topicsWithValidatorResponse;
    highlights.push({
      id: "validator-replies",
      text: `${missing > topics / 2 ? "Most topics got" : `${missing} of ${topics} topics got`} no ${includeCandidates ? "known or possible" : "known"} validator reply${missing > topics / 2 ? `: ${missing} of ${topics}` : ""}.`,
    });
    highlights.push({ id: "unanswered-topics", text: `${view.noReplies} of ${topics} topics got no human reply at all.` });
  } else {
    highlights.push({ id: "no-topics", text: "No new community topics in this period, so there is no topic response rate to report." });
  }

  if (view.validatorPosts > 0 && view.topThreeShare !== null) {
    const accounts = Math.min(view.writers.length, 3);
    highlights.push({
      id: "concentration",
      text: `${accounts} ${accounts === 1 ? "account wrote" : "accounts wrote"} ${percent(view.topThreeShare)} of ${includeCandidates ? "estimated" : "identified"} validator messages.`,
    });
  } else {
    highlights.push({ id: "concentration", text: "No writing from the validator accounts counted in this view." });
  }

  const unresolved = view.rows.filter(r => r.confidence !== "supported").length;
  if (unresolved > 0) {
    highlights.push({
      id: "identity-gap",
      text: `We cannot reliably identify Agora accounts for ${unresolved} of ${total} validators; this does not prove inactivity.`,
    });
  }
  return highlights;
}
