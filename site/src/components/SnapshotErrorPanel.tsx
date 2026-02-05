import { SnapshotValidationError } from "../data/loadSnapshot";

type SnapshotErrorPanelProps = {
  error: unknown;
};

function renderIssue(issue: SnapshotValidationError["issues"][number]) {
  return `${issue.path.join(".")}: ${issue.message}`;
}

export default function SnapshotErrorPanel({ error }: SnapshotErrorPanelProps) {
  if (!(error instanceof SnapshotValidationError)) {
    return (
      <div className="rounded-xl border border-rose-300/70 bg-slate-950/70 p-4 text-sm text-rose-200">
        Snapshot error: {String(error)}
      </div>
    );
  }

  const issueList = error.issues.slice(0, 10).map(renderIssue);

  return (
    <div className="rounded-xl border border-rose-300/70 bg-slate-950/70 p-4 text-sm text-rose-200">
      <p className="text-sm font-semibold text-rose-200">
        Snapshot invalid: {error.dashboardId}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-200">
        {issueList.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      {error.issues.length > issueList.length ? (
        <p className="mt-2 text-xs text-rose-200">
          ...and {error.issues.length - issueList.length} more
        </p>
      ) : null}
    </div>
  );
}
