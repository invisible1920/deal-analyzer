"use client";

import PageContainer from "@/components/PageContainer";
import { MarketPricingPage } from "@/components/market-pricing/MarketPricingPage";

export default function Page() {
  return (
    <div className="w-full">
      <PageContainer>
        <MarketPricingPage />
      </PageContainer>
    </div>
  );
}
