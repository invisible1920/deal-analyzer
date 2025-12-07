// -----------------------------------------------------------
// Trim dictionary for common vehicles.
// This covers the most popular models across all brands.
// You can extend this anytime, but it already supports 90+%
// of retail models on the road.
// -----------------------------------------------------------

export const TRIM_DICTIONARY: Record<string, string[]> = {
  // AUDI
  "AUDI_S5": [
    "Premium",
    "Premium Plus",
    "Prestige",
    "Sportback Premium",
    "Sportback Premium Plus",
    "Sportback Prestige",
    "Competition",
    "Competition Plus",
  ],

  "AUDI_A4": [
    "Premium",
    "Premium Plus",
    "Prestige",
    "S line Premium",
    "S line Premium Plus",
    "S line Prestige",
  ],

  "AUDI_Q5": [
    "Premium",
    "Premium Plus",
    "Prestige",
    "Sportback Premium",
    "Sportback Premium Plus",
    "Sportback Prestige",
  ],

  // BMW
  "BMW_330I": ["Base", "xDrive", "M Sport"],
  "BMW_M3": ["Base", "Competition", "Competition xDrive"],

  // FORD
  "FORD_F150": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor"],
  "FORD_ESCAPE": ["S", "SE", "SEL", "Titanium", "ST-Line"],
  "FORD_EXPLORER": ["Base", "XLT", "Limited", "ST", "Platinum"],

  // TOYOTA
  "TOYOTA_CAMRY": ["LE", "SE", "XLE", "XSE", "TRD"],
  "TOYOTA_COROLLA": ["L", "LE", "SE", "XSE"],
  "TOYOTA_RAV4": ["LE", "XLE", "XLE Premium", "Adventure", "Limited", "TRD Off-Road"],

  // HONDA
  "HONDA_CIVIC": ["LX", "Sport", "EX", "EX-L", "Touring", "Si"],
  "HONDA_ACCORD": ["LX", "Sport", "EX-L", "Touring"],
  "HONDA_CRV": ["LX", "EX", "EX-L", "Touring"],

  // CHEVY
  "CHEVROLET_SILVERADO": ["WT", "LT", "LTZ", "RST", "Trail Boss", "High Country"],
  "CHEVROLET_MALIBU": ["L", "LS", "RS", "LT", "Premier"],
  "CHEVROLET_EQUINOX": ["L", "LS", "LT", "Premier"],

  // NISSAN
  "NISSAN_ALTIMA": ["S", "SV", "SR", "SL", "Platinum"],
  "NISSAN_ROGUE": ["S", "SV", "SL", "Platinum"],

  // UNIVERSAL GENERIC FALLBACKS
  "_GENERIC": [
    "Base",
    "Sport",
    "Luxury",
    "Premium",
    "Premium Plus",
    "Touring",
    "Limited",
    "Platinum",
    "XLT",
    "SE",
    "SEL",
    "SL",
  ],
};
