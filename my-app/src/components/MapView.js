// import React, { useRef } from "react";
// import { GoogleMap, useLoadScript } from "@react-google-maps/api";

// const containerStyle = {
//   width: "100%",
//   height: "100%",
// };

// // Static libraries to load
// const libraries = ["marker"];

// // Dublin
// const center = {
//   lat: 53.3498,
//   lng: -6.2603,
// };

// export default function MapView() {
//   const mapRef = useRef(null);

//   // script loading
//   const { isLoaded } = useLoadScript({
//     googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
//     libraries,
//   });

//   const onLoad = (map) => {
//     mapRef.current = map;

//     if (window.google && window.google.maps && window.google.maps.marker) {
//       new window.google.maps.marker.AdvancedMarkerElement({
//         map,
//         position: center,
//         title: "Dublin",
//       });
//     }
//   };

import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const libraries = ["marker"];

// fallback if location fails
const defaultCenter = {
  lat: 53.3498,
  lng: -6.2603,
};

export default function MapView() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(userLocation);

        if (mapRef.current) {
          mapRef.current.panTo(userLocation);
          mapRef.current.setZoom(15);
        }

        if (markerRef.current) {
          markerRef.current.position = userLocation;
        }
      },
      (error) => {
        console.error("Location error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const onLoad = (map) => {
    mapRef.current = map;

    if (window.google && window.google.maps && window.google.maps.marker) {
      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: currentLocation,
        title: "Your current location",
      });
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation}
        zoom={15}
        onLoad={onLoad}
        options={{ mapId: process.env.REACT_APP_GOOGLE_MAP_ID }}
      />
    );
  }
