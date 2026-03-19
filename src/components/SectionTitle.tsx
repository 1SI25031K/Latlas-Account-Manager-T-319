export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-heading-ja mb-4 text-xs font-semibold uppercase tracking-wider"
      style={{ color: "var(--dashboard-text-muted)" }}
    >
      {children}
    </h2>
  );
}
