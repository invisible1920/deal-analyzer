"use client";

import PageContainer from "@/components/PageContainer";
import { MarketPricingPage } from "@/components/market-pricing/MarketPricingPage";

export default function Page() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-8 w-full overflow-x-hidden">
      <PageContainer>
        <MarketPricingPage />
      </PageContainer>
    </div>
  );
}
