import { Component } from "react";
import OopsScreen from "./OopsScreen";
import { reportError } from "../lib/errorReporting";

// Catches render-time crashes anywhere below it in the tree. The
// customer never sees the raw error/stack — only OopsScreen + a trial
// ID. The real detail is sent to reportError() so it can be looked up
// later in Admin -> Error Logs.
//
// Usage:
//   <ErrorBoundary>...</ErrorBoundary>                     (full-screen, e.g. around <App/>)
//   <ErrorBoundary fullScreen={false} context="Cart page">  (inline, inside a page)
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, trialId: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const trialId = reportError({
      message: error?.message || String(error),
      stack: error?.stack || info?.componentStack,
      context: this.props.context || "React render error",
      fatal: true,
    });
    this.setState({ trialId });
  }

  handleRetry = () => {
    this.setState({ hasError: false, trialId: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <OopsScreen
          trialId={this.state.trialId}
          onRetry={this.handleRetry}
          fullScreen={this.props.fullScreen !== false}
        />
      );
    }
    return this.props.children;
  }
}
