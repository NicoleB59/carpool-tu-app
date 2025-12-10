import React from "react";
import "./css/Dashboard.css";

export default function Driver() {
  return (
    <div className="map-page">
      <div className="map-placeholder">🗺️ Google Map Here</div>

      <div className="search-bar">
        <input placeholder="Start Location" />
        <input placeholder="Destination" />
        <input type="time" />
        <input type="number" placeholder="Seats" />
        <button>Post Ride</button>
      </div>
    </div>
  );
}
