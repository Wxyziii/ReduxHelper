import { Component, type ReactNode } from "react";
import { toAppError } from "../lib/errorUtils";
import ErrorPanel from "./ErrorPanel";
import type { AppErrorInfo } from "../types/errors";

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error?: AppErrorInfo }> {
  state: { error?: AppErrorInfo } = {};

  static getDerivedStateFromError(error: unknown) {
    return { error: toAppError(error, { code: "REACT_RENDER_ERROR", title: "Page crashed", severity: "critical", recoverable: true }) };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <ErrorPanel error={this.state.error} onDashboard={() => this.setState({ error: undefined })} onReload={() => window.location.reload()} />
        </div>
      );
    }
    return this.props.children;
  }
}
