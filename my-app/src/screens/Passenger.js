import React from "react";
import "./css/Dashboard.css";

export default function Passenger() {
  return (
    <div className="map-page">
      <div className="map-placeholder">🗺️ Google Map Here</div>

      <div className="search-bar">
        <input placeholder="Where are you going?" />
        <input type="time" />
        <button>Search Drivers</button>
      </div>
    </div>
  );
}
