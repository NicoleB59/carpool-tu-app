import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import "./css/Dashboard.css";

export default function Driver() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);

  const [ride, setRide] = useState({
    start: "",
    destination: "",
    time: "",
    seats: "",
  });

  // NEW: store driver's coordinates
  const [coords, setCoords] = useState({ lat: null, lng: null });

  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);

    // GET USER'S CURRENT LOCATION
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
          alert("Could not get your location. Please allow location access.");
        }
      );
    } else {
      alert("Geolocation is not supported on this browser.");
    }
  }, []);

  // HANDLE INPUT CHANGES
  const handleChange = (e) => {
    setRide({ ...ride, [e.target.name]: e.target.value });
  };

  // SEND TO BACKEND WITH COORDS
  const handlePostRide = async () => {
    if (!ride.start || !ride.destination || !ride.time || !ride.seats) {
      alert("Please fill in all fields");
      return;
    }

    // Make sure we have GPS before posting ride
    if (coords.lat == null || coords.lng == null) {
      alert("Still getting your location. Please wait a moment and try again.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("You must be logged in to post a ride");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...ride,
          driverEmail: user.email,
          latitude: coords.lat,
          longitude: coords.lng, // send coords
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Ride posted successfully!");
        setRide({
          start: "",
          destination: "",
          time: "",
          seats: "",
        });
        navigate("/dashboard"); // go back to dashboard
      } else {
        alert(data.message || "Failed to post ride");
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Is your backend running?");
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
          name="start"
          placeholder="Start Location"
          value={ride.start}
          onChange={handleChange}
        />

        <input
          className="driver-input"
          name="destination"
          placeholder="Destination"
          value={ride.destination}
          onChange={handleChange}
        />

        <input
          className="driver-input"
          type="time"
          name="time"
          value={ride.time}
          onChange={handleChange}
        />

        <input
          className="driver-input"
          type="number"
          name="seats"
          placeholder="Seats"
          value={ride.seats}
          onChange={handleChange}
        />

        <button className="small-action-btn" onClick={handlePostRide}>
          Post Ride
        </button>
      </div>
    </div>
  );
}
