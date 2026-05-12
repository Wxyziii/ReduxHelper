export default function StatusPill({ status, tone = "count" }: { status: string; tone?: "success" | "warning" | "danger" | "count" | "ai" }) {
  return <span className={`badge ${tone}`}>{status}</span>;
}
