import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        const savedImage = localStorage.getItem("profileImage");
        if (savedImage) {
        setProfileImage(savedImage);
        }
    }, []);

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div></div>
        <h1 className="logo">TU Dublin</h1>

        <button
          className="profile-btn-circle"
          onClick={() => navigate("/profile")}
        >
          <img
            src={profileImage || "/profile.png"}
            alt="Profile"
          />
        </button>
      </nav>

      {/* Choice Section */}
      <div className="choice-container">
        <h2>What would you like to do?</h2>

        <div className="choice-buttons">
          <button onClick={() => navigate("/driver")}>
            Post a Ride
          </button>

          <button onClick={() => navigate("/passenger")}>
            Find a Ride
          </button>
        </div>
      </div>
    </div>
  );
}
