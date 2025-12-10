import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import "./css/Dashboard.css";

export default function Passenger() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [results, setResults] = useState([]);

  // Get profile image + passenger GPS
  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Please allow location access to find nearby drivers.");
        }
      );
    }
  }, []);

  // SEARCH DRIVERS (GEO QUERY)
    const handleSearchDrivers = async () => {
    if (!destination || !time) {
        alert("Please enter destination and time");
        return;
    }

    if (coords.lat == null || coords.lng == null) {
        alert("Still getting your location. Please try again.");
        return;
    }

    try {
        const res = await fetch(
        `http://localhost:5000/rides/search?lat=${coords.lat}&lng=${coords.lng}&destination=${destination}&time=${time}`
        );

        const data = await res.json();

        if (res.ok) {
            if (data.length === 0) {
                alert("No drivers found nearby at this time.");
                return;
            }

        // Navigate to results page with the drivers
        navigate("/passenger/results", {
            state: { results: data },
        });
        } else {
            alert(data.message || "Search failed");
        }
    } catch (error) {
        console.error(error);
        alert("Server error while searching");
    }
    };


  return (
    <div className="dashboard-page">
      {/* NAVBAR */}
      <nav className="dashboard-navbar">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ←
        </button>

        <h1 className="logo">TU Dublin</h1>

        <button
          className="profile-btn-circle"
          onClick={() => navigate("/profile")}
        >
          <img src={profileImage || "/profile.png"} alt="Profile" />
        </button>
      </nav>

      {/* MAP */}
      <div className="map-fullscreen">
        <MapView />
      </div>

      {/* SEARCH BAR */}
      <div className="dashboard-bottom-bar">
        <input
          className="driver-input"
          placeholder="Where are you going?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <input
          className="driver-input"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <button className="small-action-btn" onClick={handleSearchDrivers}>
          Search Drivers
        </button>
      </div>
    </div>
    );
}
