import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Dashboard.css";
import "./css/PassengerList.css";
import logo2 from "../assets/carpool-log.png";

export default function DriverRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);

    if (!user) {
      alert("You must be logged in as a driver");
      navigate("/");
      return;
    }

    fetchRequests();
    // eslint-disable-next-line
  }, []);

  // FETCH DRIVER REQUESTS
  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/rides/requests/${user.email}`
      );

      const data = await res.json();

      if (res.ok) {
        setRequests(data);
      } else {
        alert(data.message || "Failed to load requests");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while loading requests");
    } finally {
      setLoading(false);
    }
  };

  // ACCEPT / REJECT REQUEST
  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await fetch(
        `http://localhost:5000/rides/request/${requestId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(`Request ${status}`);
        fetchRequests(); // refresh inbox
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while updating request");
    }
  };

  return (
    <div className="dashboard-page">
      {/* Navbar */}
        <nav className="dashboard-navbar">
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            ←
          </button>

          <div className="dashboard-logo-wrap">
            <img src={logo2} alt="Carpool Logo" className="dashboard-logo-img" />
          </div>

          <div className="navbar-right">
            <button
              className="profile-btn-circle"
              onClick={() => navigate("/profile")}
            >
              <img src={profileImage || "/profile.png"} alt="Profile" />
            </button>
          </div>
        </nav>

      {/* REQUEST LIST */}
      <div className="passenger-list-container">
        <h2>Ride Requests</h2>

        {loading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>No ride requests yet.</p>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="driver-card">
              <div><strong>Passenger:</strong> {req.passengerEmail}</div>
              <div><strong>Status:</strong> {req.status}</div>
              <div>
                <strong>Requested:</strong>{" "}
                {new Date(req.requestedAt).toLocaleString()}
              </div>

              {req.status === "pending" && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    className="small-action-btn"
                    onClick={() => handleUpdateStatus(req._id, "accepted")}
                  >
                    Accept
                  </button>

                  <button
                    className="small-action-btn"
                    style={{ background: "#999" }}
                    onClick={() => handleUpdateStatus(req._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
              
              {req.status === "accepted" && (
                  <button
                    className="request-btn"
                    style={{ marginTop: "10px" }}
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
      </div>
    </div>
  );
}
