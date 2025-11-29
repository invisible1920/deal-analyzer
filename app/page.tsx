"use client";

import PageContainer from "@/components/PageContainer";
import { DealAnalyzerPage } from "@/components/deal-analyzer/DealAnalyzerPage";
import styles from "./page.module.css";

export default function Page() {
  return (
    <div className={styles.main}>
      <PageContainer>
        <DealAnalyzerPage />
      </PageContainer>
    </div>
  );
}
