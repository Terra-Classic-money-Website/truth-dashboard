import Card from "./Card";
import type { deriveAgoraActivity } from "../data/selectors/agoraActivity";
import { deriveAgoraInsights } from "../data/selectors/agoraInsights";

export default function AgoraActivityInsights({ view, includeCandidates }: {
  view: ReturnType<typeof deriveAgoraActivity>;
  includeCandidates: boolean;
}) {
  const insights = deriveAgoraInsights(view, includeCandidates);
  return (
    <section aria-labelledby="agora-insights-title">
      <Card>
        <h2 id="agora-insights-title" className="text-lg font-semibold text-white">What the data tells us</h2>
        <ul className="agora-insights-list text-sm leading-6 text-slate-300">
          {insights.map(insight => <li key={insight.id}>{insight.text}</li>)}
        </ul>
      </Card>
    </section>
  );
}
