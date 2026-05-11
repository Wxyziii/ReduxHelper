import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="pageHeader">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="buttonRow">{actions}</div>}
    </div>
  );
}
