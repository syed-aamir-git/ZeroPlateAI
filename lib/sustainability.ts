/**
 * Sustainability & ESG Conversion Factors Engine (ZeroPlate.ai)
 * Strictly following Functional PRD Sections 12.7 and 22.
 * 
 * ACADEMIC & REGULATORY CITATIONS:
 * 1. Meal Equivalent Conversion:
 *    - Factor: 2.5 meals per kg (or 0.40 kg / 400g edible portion per meal).
 *    - Source: FAO & Global FoodBanking Network (GFN) standard nutritional portioning metrics.
 * 
 * 2. CO2e Avoidance (Landfill Diversion & Production Emissions):
 *    - Factor: 1.90 kg CO2e avoided per 1.0 kg food diverted from anaerobic landfill decomposition.
 *    - Source: UNEP Food Wastage Footprint Model & IPCC Waste Sector Methodology (incorporates
 *      avoided methane emissions GWP-28 plus embedded agricultural lifecycle emissions).
 * 
 * 3. Methane (CH4) Direct Landfill Avoidance:
 *    - Factor: 0.07 kg CH4 per 1.0 kg organic waste diverted.
 *    - Source: US EPA Waste Reduction Model (WARM) for commercial food scraps.
 * 
 * 4. Economic / Kitchen Procurement Value:
 *    - Factor: ₹120.00 per kg average prepared institutional food value.
 *    - Source: Institutional Catering & Hospitality Federation benchmarks (raw materials + energy + preparation labor).
 * 
 * 5. Embedded Agricultural Fresh Water Preserved:
 *    - Factor: 250.0 Liters per kg.
 *    - Source: Water Footprint Network (Mekonnen & Hoekstra) weighted average for mixed institutional cooked diets.
 */

export const SUSTAINABILITY_FACTORS = {
  MEALS_PER_KG: 2.5,
  CO2E_PER_KG: 1.9,
  METHANE_CH4_PER_KG: 0.07,
  COST_SAVED_INR_PER_KG: 120,
  WATER_LITERS_PER_KG: 250,
} as const;

export interface SustainabilityImpact {
  wastePreventedKg: number;
  mealsGiven: number;
  co2eAvoidedKg: number;
  methaneAvoidedKg: number;
  waterPreservedLiters: number;
  costSavedInr: number;
}

/**
 * Computes official sustainability and ESG impact numbers from verified redistributed food weight.
 * @param wastePreventedKg Total delivered/confirmed surplus food weight in kg.
 */
export function calculateSustainabilityImpact(wastePreventedKg: number): SustainabilityImpact {
  const kg = Math.max(0, Number(wastePreventedKg) || 0);

  return {
    wastePreventedKg: Math.round(kg * 10) / 10,
    mealsGiven: Math.round(kg * SUSTAINABILITY_FACTORS.MEALS_PER_KG),
    co2eAvoidedKg: Math.round(kg * SUSTAINABILITY_FACTORS.CO2E_PER_KG * 10) / 10,
    methaneAvoidedKg: Math.round(kg * SUSTAINABILITY_FACTORS.METHANE_CH4_PER_KG * 100) / 100,
    waterPreservedLiters: Math.round(kg * SUSTAINABILITY_FACTORS.WATER_LITERS_PER_KG),
    costSavedInr: Math.round(kg * SUSTAINABILITY_FACTORS.COST_SAVED_INR_PER_KG),
  };
}
