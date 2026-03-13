import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./css/PassengerList.css";

function getMatchLabel(score) {
  if (score >= 85) return "Best Match";
  if (score >= 70) return "Strong Match";
  if (score >= 55) return "Good Match";
  return "Possible Match";
}

export default function PassengerLists() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results || [];
  const searchInfo = state?.searchInfo || {};

  const handleRequestRide = async (rideId) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("You must be logged in to request a ride");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/rides/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId,
          passengerEmail: user.email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Ride request sent!");
      } else {
        alert(data.message || "Request failed");
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("Server error while requesting ride");
    }
  };

  return (
    <div className="passenger-list-container">
      <h2>Top Driver Matches</h2>

      <p>
        Destination: <strong>{searchInfo.destination}</strong> | Time:{" "}
        <strong>{searchInfo.time}</strong>
      </p>

      {results.length === 0 ? (
        <p>No drivers found.</p>
      ) : (
        results.map((ride) => (
          <div key={ride._id} className="driver-card">
            <div className="trip-line">
              {ride.start} → {ride.destination}
            </div>

            <div className="info-row">
              <strong>Driver:</strong> {ride.driverEmail}
            </div>
            <div className="info-row">
              <strong>Gender:</strong> {ride.driverGender || "Not set"}
            </div>
            <div className="info-row">
              <strong>Seats:</strong> {ride.seats}
            </div>
            <div className="info-row">
              <strong>Time:</strong> {ride.time}
            </div>

            <hr />

            <div className="info-row">
              <strong>Score:</strong> {ride.matchScore}/100 (
              {getMatchLabel(ride.matchScore)})
            </div>
            <div className="info-row">
              <strong>Pickup Distance:</strong> {ride.pickupDistanceKm} km
            </div>
            <div className="info-row">
              <strong>Dropoff Distance:</strong> {ride.dropoffDistanceKm} km
            </div>
            <div className="info-row">
              <strong>Time Difference:</strong> {ride.timeDifferenceMin} mins
            </div>
            <div className="info-row">
              <strong>Detour:</strong> {ride.estimatedDetourDistanceKm} km
            </div>
            <div className="info-row">
              <strong>Detour Time:</strong> {ride.estimatedDetourTimeMin} mins
            </div>

            <button
              className="request-btn"
              onClick={() => handleRequestRide(ride._id)}
            >
              Request Ride
            </button>
          </div>
        ))
      )}

      <button className="small-action-btn" onClick={() => navigate("/passenger")}>
        Back
      </button>
    </div>
  );
}