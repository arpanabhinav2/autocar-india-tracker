export interface CarSpecs {
  engine: string | null;         // e.g. "1.5L Turbo Petrol"
  power: string | null;          // e.g. "150 bhp"
  torque: string | null;         // e.g. "320 Nm"
  transmission: string | null;   // e.g. "7-speed DCT"
  efficiency: string | null;     // Mileage (kmpl) or EV Range (km)
  groundClearance: string | null; // e.g. "190 mm"
  bootSpace: string | null;      // e.g. "430 L"
  airbags: number | null;
  hasADAS: boolean;
  features: string[];            // ["Ventilated Seats", "Panoramic Sunroof", ...]
  verdict: string | null;        // Reviewer's one-line verdict
}

export interface Car {
  id: string;
  title: string;
  videoId: string;
  publishedAt: string;
  thumbnail: string;
  brand: string;
  model: string;
  segment: string;
  price: string;
  confidence_score?: number;     // 1.0 = transcript+LLM, 0.5 = desc+LLM, 0.3 = heuristics
  source?: string;               // "transcript+description" | "description_only"
  specs: CarSpecs;
}
