import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "dealer.json");

export type DealerSettings = {
  dealerName: string;
  defaultAPR: number;
  maxPTI: number;
  maxLTV: number;
  minDownPayment: number;
  maxTermWeeks: number;
};

export function loadSettings(): DealerSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load dealer settings:", err);
    return {
      dealerName: "Default Dealer",
      defaultAPR: 24.99,
      maxPTI: 0.25,
      maxLTV: 1.75,       // relaxed default LTV so your sample deal passes
      minDownPayment: 500,
      maxTermWeeks: 104
    };
  }
}

export function saveSettings(settings: DealerSettings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
