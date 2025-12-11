import React, { useRef } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Static libraries to load
const libraries = ["marker"];

// Dublin
const center = {
  lat: 53.3498,
  lng: -6.2603,
};

export default function MapView() {
  const mapRef = useRef(null);

  // script loading
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const onLoad = (map) => {
    mapRef.current = map;

    if (window.google && window.google.maps && window.google.maps.marker) {
      new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: center,
        title: "Dublin",
      });
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      options={{ mapId: process.env.REACT_APP_GOOGLE_MAP_ID }}
    />
  );
}
