import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "알 수 없는 화면 오류가 발생했습니다.",
    };
  }

  componentDidCatch(error, info) {
    console.error("GreenQ ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-error">
          <div className="fatal-card">
            <h1>화면을 표시하지 못했습니다.</h1>
            <p>{this.state.message}</p>
            <button type="button" onClick={() => window.location.replace("/dashboard")}>
              대시보드로 이동
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
