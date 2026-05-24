"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "@/lib/errors";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void logError("ErrorBoundary", error, {
      componentStack: info.componentStack ?? "",
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-md px-4 py-16 text-center">
            <h2 className="font-serif text-xl text-stamp-ink">
              잠시 문제가 발생했어요
            </h2>
            <p className="mt-3 text-sm text-stamp-ink/60">
              페이지를 새로고침해 주세요. 데이터는 안전합니다.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
