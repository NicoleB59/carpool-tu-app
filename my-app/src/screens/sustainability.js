import React from "react";
import { useLocation } from "react-router-dom";
import "./css/Sustainability.css";
import { calculateSustainabilityMetrics } from "../utils/sustainability";

export default function Sustainability() {
  const location = useLocation();

  // Use live trip data if passed from previous screen
  // Otherwise fall back to demo data
  const completedTrip = location.state?.completedTrip || {
    driverBaseKm: 18.4,
    sharedRouteKm: 21.1,
    passengerSoloKm: 11.8,
    passengersCount: 1,
  };

  const metrics = calculateSustainabilityMetrics(completedTrip);

  return (
    <div className="sustainability-page">
      <div className="sustainability-card">
        <h1>Sustainability Summary</h1>
        <p className="subtitle">
          Estimated carbon impact for a completed shared ride
        </p>

        <div className="metrics-grid">
          <div className="metric-box">
            <h3>Driver Base Route</h3>
            <p>{metrics.driverBaseKm} km</p>
          </div>

          <div className="metric-box">
            <h3>Shared Route</h3>
            <p>{metrics.sharedRouteKm} km</p>
          </div>

          <div className="metric-box">
            <h3>Detour Added</h3>
            <p>{metrics.detourKm} km</p>
          </div>

          <div className="metric-box">
            <h3>Trip Emissions</h3>
            <p>{metrics.tripEmissionsKg} kg CO2e</p>
          </div>

          <div className="metric-box">
            <h3>Separate Cars Emissions</h3>
            <p>{metrics.separateCarsEmissionsKg} kg CO2e</p>
          </div>

          <div className="metric-box highlight">
            <h3>Estimated CO2 Saved</h3>
            <p>{metrics.emissionsSavedKg} kg CO2e</p>
          </div>

          <div className="metric-box">
            <h3>Per Person Share</h3>
            <p>{metrics.perPersonEmissionKg} kg CO2e</p>
          </div>
        </div>

        <div className="explanation">
          <h3>How this is calculated</h3>
          <p>
            We estimate emissions from trip distance using an average emissions
            factor. We compare the shared trip against what would have happened
            if the driver and passenger had each driven separately.
          </p>
        </div>
      </div>
    </div>
  );
}