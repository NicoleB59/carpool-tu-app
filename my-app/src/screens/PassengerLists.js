import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./css/Dashboard.css";
import "./css/PassengerList.css";

export default function PassengerList() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results || [];

  // SEND REQUEST TO BACKEND
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
    <div className="dashboard-page">
      {/* NAVBAR */}
      <nav className="dashboard-navbar">
        <button onClick={() => navigate("/passenger")} className="back-btn">
          ←
        </button>
        <h1 className="logo">TU Dublin</h1>
        <div />
      </nav>

      {/* DRIVER LIST */}
      <div className="passenger-list-container">
        <h2>Available Drivers</h2>

        {results.length === 0 ? (
          <p>No drivers found.</p>
        ) : (
          results.map((ride) => (
            <div key={ride._id} className="driver-card">
              <div>
                <strong>{ride.start}</strong> →{" "}
                <strong>{ride.destination}</strong>
              </div>
              <div>Time: {ride.time}</div>
              <div>Seats: {ride.seats}</div>
              <div>Driver: {ride.driverEmail}</div>

              <button
                className="small-action-btn request-btn"
                onClick={() => handleRequestRide(ride._id)}
              >
                Request Ride
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
