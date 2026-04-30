import React, { useEffect, useState } from "react";
import "./css/Sustainability.css";
import { calculateSustainabilityMetrics } from "../utils/sustainability";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Sustainability() {
  const [latestRecord, setLatestRecord] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    fetchLatestSustainability();
  }, []);

  const fetchLatestSustainability = async () => {
    try {
      const res = await fetch(`http://localhost:5000/sustainability/${user.email}`);
      const data = await res.json();

      if (res.ok && data.length > 0) {
        setLatestRecord(data[0]);
      }
    } catch (error) {
      console.error("Sustainability fetch error:", error);
    }
  };

  const completedTrip = latestRecord
    ? {
        driverBaseKm: latestRecord.driverBaseKm,
        sharedRouteKm: latestRecord.sharedRouteKm,
        passengerSoloKm: latestRecord.passengerSoloKm,
        passengersCount: 1,
      }
    : {
        driverBaseKm: 0,
        sharedRouteKm: 0,
        passengerSoloKm: 0,
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

        {latestRecord && (
          <p className="subtitle">
            Destination: <strong>{latestRecord.destination}</strong>
          </p>
        )}

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

        {!latestRecord && (
          <p className="subtitle">No completed rides yet.</p>
        )}

        <div className="explanation">
          <h3>How this is calculated</h3>
          <p>
            We estimate emissions from trip distance using an average emissions
            factor. We compare the shared trip against what would have happened
            if the driver and passenger had each driven separately.
          </p>
        </div>

        <button className="request-btn" onClick={() => navigate("/review")}>
          Leave a Review
        </button>
      </div>
    </div>
  );
}