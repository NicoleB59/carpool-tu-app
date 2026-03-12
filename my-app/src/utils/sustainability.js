// src/utils/sustainability.js

export const DEFAULT_EMISSION_FACTOR_KG_PER_KM = 0.12; 
// 0.12 kg = 120g CO2e per km (simple demo default)

export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateTripEmissions(distanceKm, factorKgPerKm = DEFAULT_EMISSION_FACTOR_KG_PER_KM) {
  if (!distanceKm || distanceKm < 0) return 0;
  return round2(distanceKm * factorKgPerKm);
}

export function calculateSustainabilityMetrics({
  driverBaseKm = 0,
  sharedRouteKm = 0,
  passengerSoloKm = 0,
  passengersCount = 1,
  factorKgPerKm = DEFAULT_EMISSION_FACTOR_KG_PER_KM,
}) {
  const detourKm = Math.max(sharedRouteKm - driverBaseKm, 0);

  const tripEmissionsKg = calculateTripEmissions(sharedRouteKm, factorKgPerKm);

  // If nobody shared, driver alone baseline
  const driverSoloEmissionsKg = calculateTripEmissions(driverBaseKm, factorKgPerKm);

  // If everyone drove separately:
  // driver's normal trip + passenger's solo trip
  const separateCarsEmissionsKg = calculateTripEmissions(
    driverBaseKm + passengerSoloKm,
    factorKgPerKm
  );

  const emissionsSavedKg = round2(
    Math.max(separateCarsEmissionsKg - tripEmissionsKg, 0)
  );

  const perPersonEmissionKg =
    passengersCount > 0 ? round2(tripEmissionsKg / (passengersCount + 1)) : tripEmissionsKg;
  // +1 includes the driver

  return {
    driverBaseKm: round2(driverBaseKm),
    sharedRouteKm: round2(sharedRouteKm),
    passengerSoloKm: round2(passengerSoloKm),
    detourKm: round2(detourKm),
    tripEmissionsKg,
    driverSoloEmissionsKg,
    separateCarsEmissionsKg,
    emissionsSavedKg,
    perPersonEmissionKg,
    factorKgPerKm,
  };
}