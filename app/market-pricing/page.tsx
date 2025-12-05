"use client";

import PageContainer from "@/components/PageContainer";
import { MarketPricingPage } from "@/components/market-pricing/MarketPricingPage";
import styles from "./page.module.css";

export default function Page() {
  return (
    <div className={styles.main}>
      <PageContainer>
        <MarketPricingPage />
      </PageContainer>
    </div>
  );
}
