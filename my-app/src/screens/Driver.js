import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import "./css/Passenger.css";

export default function Driver() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [driverGender, setDriverGender] = useState("");
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
          setStart("Current Location");
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Please allow location access.");
        }
      );
    }
  }, []);

  const geocodeWithGoogle = (address) => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject("Google Maps not loaded");
        return;
      }

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;

          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else {
          reject("Failed to find location");
        }
      });
    });
  };

  // Simple straight-line sample points for demo purposes
  const buildRoutePoints = (startLat, startLng, endLat, endLng, steps = 12) => {
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        lat: startLat + (endLat - startLat) * t,
        lng: startLng + (endLng - startLng) * t,
      });
    }

    return points;
  };

  const handlePostRide = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!destination || !time || !seats) {
      alert("Please enter destination, time, and seats.");
      return;
    }

    if (coords.lat == null || coords.lng == null) {
      alert("Still getting your current location.");
      return;
    }

    try {
      const dropoff = await geocodeWithGoogle(destination);
      const routePoints = buildRoutePoints(
        coords.lat,
        coords.lng,
        dropoff.lat,
        dropoff.lng
      );

      const res = await fetch("http://localhost:5000/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start,
          destination,
          time,
          seats,
          driverEmail: user.email,
          driverGender,
          latitude: coords.lat,
          longitude: coords.lng,
          endLat: dropoff.lat,
          endLng: dropoff.lng,
          routePoints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to post ride");
        return;
      }

      alert("Ride posted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to post ride.");
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
          placeholder="Start"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        <input
          className="driver-input"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <input
          className="driver-input"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <input
          className="driver-input"
          type="number"
          min="1"
          max="6"
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
        />

        <select
          className="driver-input"
          value={driverGender}
          onChange={(e) => setDriverGender(e.target.value)}
          required
        >
          <option value="">Driver Gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>

        <button className="small-action-btn" onClick={handlePostRide}>
          Post Ride
        </button>
      </div>
    </div>
  );
}