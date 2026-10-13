import type { deriveAgoraActivity } from "./agoraActivity";

type AgoraView = ReturnType<typeof deriveAgoraActivity>;
type Insight = { id: string; text: string };

export function deriveAgoraInsights(view: AgoraView, includeCandidates = false): Insight[] {
  const total = view.rows.length;
  const topics = view.topicRows.length;
  const highlights: Insight[] = [];

  if (total > 0) {
    const minorityWriting = view.activeRows.length < total / 2;
    highlights.push({
      id: "accountability",
      text: minorityWriting
        ? `${includeCandidates ? "Even with unverified matches included, " : ""}Agora gives delegators little public evidence of most validators’ views, making it harder to hold them accountable.`
        : `${includeCandidates ? "If the unverified matches are correct, public" : "Public"} discussion gives delegators a record of many validators’ views that they can question and compare.`,
    });
  }

  if (topics > 0) {
    const missing = topics - view.topicsWithValidatorResponse;
    if (missing > topics / 2) {
      highlights.push({
        id: "validator-feedback",
        text: `Agora often gives authors no visible feedback from ${includeCandidates ? "known or possible" : "known"} validators, weakening its role as a place to question and improve ideas.`,
      });
    } else if (missing > 0) {
      highlights.push({ id: "validator-feedback", text: "Some discussions still lack visible validator feedback, leaving authors without a public response from the people who hold voting power." });
    }
    if (view.noReplies > 0) {
      highlights.push({ id: "public-debate", text: "Threads without replies give readers little opportunity to compare arguments or see whether objections were resolved." });
    }
  } else {
    highlights.push({ id: "no-topics", text: "No new topics were captured in this period, so we cannot assess how authors’ ideas were received." });
  }

  if (view.validatorPosts > 0 && view.topThreeShare !== null) {
    highlights.push({
      id: "representation",
      text: view.topThreeShare > 50
        ? "A small circle cannot speak for the validator set. The visible discussion should not be mistaken for broad validator agreement."
        : "Public discussion shows the participating accounts’ views; it does not establish agreement across the validator set.",
    });
  } else {
    highlights.push({ id: "representation", text: "With no writing from the accounts counted here, this period offers no public record of their views." });
  }

  if (view.rows.some(r => r.confidence !== "supported")) {
    highlights.push({
      id: "transparency",
      text: "The identity gap is itself a transparency problem. Validators should link their Agora accounts so delegators can assess their engagement fairly.",
    });
  }
  return highlights;
}
