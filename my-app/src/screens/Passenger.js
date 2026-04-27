import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import "./css/Passenger.css";

export default function Passenger() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [preferredGender, setPreferredGender] = useState("any");
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [coords, setCoords] = useState({ lat: null, lng: null });

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

  const geocodeDestination = async (destinationText) => {
    const res = await fetch(
      `http://localhost:5000/geocode?text=${encodeURIComponent(destinationText)}`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to geocode destination");
    }

    return data;
  };

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
      const dropoff = await geocodeDestination(destination);

      const url =
        `http://localhost:5000/rides/match` +
        `?pickupLat=${coords.lat}` +
        `&pickupLng=${coords.lng}` +
        `&dropoffLat=${dropoff.lat}` +
        `&dropoffLng=${dropoff.lng}` +
        `&time=${encodeURIComponent(time)}` +
        `&preferredGender=${encodeURIComponent(preferredGender)}` +
        `&seatsNeeded=${seatsNeeded}` +
        `&topN=5`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Search failed");
        return;
      }

      navigate("/passenger/results", {
        state: {
          results: data,
          searchInfo: {
            destination,
            time,
            preferredGender,
            seatsNeeded,
          },
        },
      });
    } catch (error) {
      console.error(error);
      alert("Could not find that destination or search failed.");
    }
  };

  return (
    <div className="dashboard-page">
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

      <div className="map-fullscreen">
        <MapView />
      </div>

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

        <select
          className="driver-input"
          value={preferredGender}
          onChange={(e) => setPreferredGender(e.target.value)}
        >
          <option value="any">Any gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>

        <input
          className="driver-input"
          type="number"
          min="1"
          max="6"
          value={seatsNeeded}
          onChange={(e) => setSeatsNeeded(e.target.value)}
        />

        <button className="small-action-btn" onClick={handleSearchDrivers}>
          Search Drivers
        </button>
      </div>
    </div>
  );
}