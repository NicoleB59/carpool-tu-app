import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/PassengerList.css";

export default function PassengerRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      alert("Please log in first.");
      navigate("/");
      return;
    }

    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/rides/requests/passenger/${user.email}`
      );

      const data = await res.json();

      if (res.ok) {
        setRequests(data);
      } else {
        alert(data.message || "Failed to load your requests");
      }
    } catch (error) {
      console.error("Passenger requests error:", error);
      alert("Server error while loading your requests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="passenger-list-container">
      <h2>My Ride Requests</h2>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>You have not requested any rides yet.</p>
      ) : (
        requests.map((req) => (
          <div key={req._id} className="driver-card">
            <div className="trip-line">
              {req.start || "Start"} → {req.destination || "Destination"}
            </div>

            <div className="info-row">
              <strong>Driver:</strong> {req.driverEmail || "Unknown driver"}
            </div>

            <div className="info-row">
              <strong>Destination:</strong> {req.destination || "Unknown destination"}
            </div>

            <div className="info-row">
              <strong>Time:</strong> {req.time || "Unknown time"}
            </div>

            <div className="info-row">
              <strong>Status:</strong> {req.status}
            </div>

            {req.status === "accepted" && (
              <button
                className="request-btn"
                onClick={() =>
                  navigate("/chat", {
                    state: {
                        rideRequestId: req._id,
                        destination: req.destination,
                        start: req.start,
                    },
                    })
                }
              >
                Open Chat
              </button>
            )}
          </div>
        ))
      )}

      <button className="small-action-btn" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}