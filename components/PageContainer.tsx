"use client";

import { type CSSProperties } from "react";

export default function PageContainer({ children }: { children: React.ReactNode }) {
  const wrapper: CSSProperties = {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    padding: "32px 16px",
  };

  const inner: CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
  };

  return (
    <div style={wrapper}>
      <div style={inner}>{children}</div>
    </div>
  );
}
