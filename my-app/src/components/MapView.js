import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Center on Dublin
const center = {
  lat: 53.3498,
  lng: -6.2603,
};

export default function MapView() {
  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
        {/* Example marker in Dublin */}
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
}
