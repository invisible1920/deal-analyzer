"use client";

import PageContainer from "@/components/PageContainer";
import { DealAnalyzerPage } from "@/components/deal-analyzer/DealAnalyzerPage";

export default function Page() {
  return (
    <main style={{ padding: "32px 16px" }}>
      <PageContainer>
        <DealAnalyzerPage />
      </PageContainer>
    </main>
  );
}
