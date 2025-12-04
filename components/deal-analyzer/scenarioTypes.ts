import type { FormState } from "@/hooks/useDealAnalyzer";

export type AnalyzerResult = any; // optional: tighten later

export type SavedScenario = {
  id: string;
  label: string;
  result: AnalyzerResult;
  form: FormState;
  createdAt: string;
  isBase?: boolean;
};
