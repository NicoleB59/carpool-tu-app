import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useLocation, useNavigate } from "react-router-dom";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const libraries = ["marker", "places"];

const defaultCenter = {
  lat: 53.3498,
  lng: -6.2603,
};

export default function DriveTracking() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const destination = state?.destination;

  const mapRef = useRef(null);
  const carMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routePathRef = useRef([]);
  const simulationIndex = useRef(0);
  const rideRequestId = state?.rideRequestId;

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

        if (carMarkerRef.current) {
          carMarkerRef.current.position = userLocation;
        }

        if (mapRef.current) {
          mapRef.current.panTo(userLocation);
        }
      },
      (error) => console.error(error),
      {
        enableHighAccuracy: true,
      }
    );
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeWeight: 6,
      },
    });

    directionsService.route(
      {
        origin: currentLocation,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);

          const route = result.routes[0].overview_path;

          routePathRef.current = route.map((point) => ({
            lat: point.lat(),
            lng: point.lng(),
          }));
        } else {
          alert("Could not draw route");
        }
      }
    );
  }, [isLoaded, currentLocation, destination]);

  const simulateDrive = () => {
    if (!routePathRef.current.length || !carMarkerRef.current) {
      alert("Route not ready yet");
      return;
    }

    simulationIndex.current = 0;

    const interval = setInterval(async () => {
      if (simulationIndex.current >= routePathRef.current.length) {
        clearInterval(interval);
        await fetch(`http://localhost:5000/rides/request/${rideRequestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
        alert("Arrived at destination!");
        navigate("/sustainability");
        return;
      }

      const nextPosition = routePathRef.current[simulationIndex.current];

      carMarkerRef.current.position = nextPosition;

      if (mapRef.current) {
        mapRef.current.panTo(nextPosition);
      }

      simulationIndex.current += 1;
    }, 500);
  };

  const onLoad = (map) => {
    mapRef.current = map;

    if (window.google?.maps?.marker) {
      carMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: currentLocation,
        title: "Driver car",
        content: (() => {
          const div = document.createElement("div");
          div.innerHTML = "🚗";
          div.style.fontSize = "32px";
          return div;
        })(),
      });
    }
  };

  if (!isLoaded) return <p>Loading drive map...</p>;

  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation}
        zoom={14}
        onLoad={onLoad}
        options={{ mapId: process.env.REACT_APP_GOOGLE_MAP_ID }}
      />

      <button
        style={{
          position: "fixed",
          bottom: "75px",
          left: "20px",
          zIndex: 99,
          padding: "12px 18px",
          borderRadius: "20px",
          border: "none",
          background: "#f9b233",
          color: "black",
          fontWeight: "bold",
        }}
        onClick={simulateDrive}
      >
        Simulate Drive
      </button>

      <button
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 99,
          padding: "12px 18px",
          borderRadius: "20px",
          border: "none",
          background: "#133a94",
          color: "white",
          fontWeight: "bold",
        }}
        onClick={() => navigate("/dashboard")}
      >
        Back
      </button>
    </div>
  );
}