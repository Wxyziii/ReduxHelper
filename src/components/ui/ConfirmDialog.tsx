export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <section className="modalCard">
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="buttonRow">
          <button className="smallBtn" onClick={onCancel}>Cancel</button>
          <button className="smallBtn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
