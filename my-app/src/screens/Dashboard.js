import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Dashboard.css";
import MapView from "../components/MapView";
import logo2 from "../assets/carpool-log.png";


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
            
            {/* LEFT (empty or back button later) */}
            <div></div>

            {/* CENTER LOGO */}
            <div className="dashboard-logo-wrap">
                <img src={logo2} alt="Carpool Logo" className="dashboard-logo-img" />
            </div>

            {/* RIGHT SIDE */}
            <div className="navbar-right">
                <button
                className="inbox-btn"
                onClick={() => navigate("/driver/requests")}
                title="Ride Requests"
                >
                ☰
                </button>

                <button
                className="profile-btn-circle"
                onClick={() => navigate("/profile")}
                >
                <img src={profileImage || "/profile.png"} alt="Profile" />
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

        <button className="small-action-btn" onClick={() => navigate("/passenger/requests")}>
            My Requests
        </button>
        </div>
    </div>
    );
}
