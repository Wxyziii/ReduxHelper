import { useState } from "react";

export default function HelpBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="helpBlock">
      <button className="helpToggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Hide" : "Help"}: {title}</button>
      {open && <div className="helpContent">{children}</div>}
    </div>
  );
}
