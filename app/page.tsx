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

const { result, optimized, analyzeDeal, optimizeDeal } = useDealAnalyzer();

<button
  onClick={() => analyzeDeal(form)}
  className="bg-sky-600 text-white px-4 py-2 rounded-md"
>
  Analyze Deal
</button>

<button
  onClick={() => optimizeDeal(form)}
  className="bg-emerald-600 text-white px-4 py-2 rounded-md ml-2"
>
  Optimize Deal
</button>

<OptimizedDeals
  deals={optimized}
  onApply={(d) => {
    setForm(d.input);
    analyzeDeal(d.input);
  }}
/>
