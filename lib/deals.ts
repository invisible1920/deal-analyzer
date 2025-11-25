import path from "path";
import { promises as fs } from "fs";

const DEALS_DIR = path.join(process.cwd(), "data", "deals");

export type SavedDealInput = {
  input: {
    vehicleCost: number;
    reconCost: number;
    salePrice: number;
    downPayment: number;
    apr: number;
    termWeeks: number;
    paymentFrequency: "weekly" | "biweekly";
    monthlyIncome: number | null;
    monthsOnJob: number | null;
    pastRepo: boolean;
  };
  result: {
    payment: number;
    totalInterest: number;
    totalProfit: number;
    breakEvenWeek: number;
    paymentToIncome: number | null;
    ltv: number;
    riskScore: string;
    underwritingVerdict: string;
    underwritingReasons: string[];
  };
};

export type SavedDeal = SavedDealInput & {
  id: string;
  createdAt: string; // ISO string
};

async function ensureDealsDirExists() {
  try {
    await fs.mkdir(DEALS_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function saveDeal(payload: SavedDealInput): Promise<void> {
  await ensureDealsDirExists();

  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const createdAt = new Date().toISOString();

  const full: SavedDeal = {
    id,
    createdAt,
    ...payload
  };

  const filePath = path.join(DEALS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(full, null, 2), "utf8");
}

export async function listDeals(limit = 50): Promise<SavedDeal[]> {
  await ensureDealsDirExists();

  const files = await fs.readdir(DEALS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const deals: SavedDeal[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(DEALS_DIR, file);
    try {
      const content = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(content) as SavedDeal;
      deals.push(parsed);
    } catch {
      // ignore bad files
    }
  }

  deals.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return deals.slice(0, limit);
}
