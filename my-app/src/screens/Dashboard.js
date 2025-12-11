import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Dashboard.css";
import MapView from "../components/MapView";


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
        <div className="dashboard-page">
        {/* Navbar */}
        <nav className="dashboard-navbar">
        <div></div>

        <h1 className="logo">TU Dublin</h1>

        <div className="navbar-right">
            {/* Inbox Button */}
            <button
            className="inbox-btn"
            onClick={() => navigate("/driver/requests")}
            title="Ride Requests"
            >
            ☰
            </button>

            {/* Profile Button */}
            <button
            className="profile-btn-circle"
            onClick={() => navigate("/profile")}
            >
            <img
                src={profileImage || "/profile.png"}
                alt="Profile"
            />
            </button>
        </div>
        </nav>


        {/* Fullscreen Map */}
        <div className="map-fullscreen">
        <MapView />
        </div>

        {/* Bottom Action Bar */}
        <div className="dashboard-bottom-bar">
        <button className="small-action-btn" onClick={() => navigate("/driver")}>
            Post Ride
        </button>

        <button className="small-action-btn" onClick={() => navigate("/passenger")}>
            Find Ride
        </button>
        </div>
    </div>
    );
}
