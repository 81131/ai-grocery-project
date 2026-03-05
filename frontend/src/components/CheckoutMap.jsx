import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// Store Location (e.g., Central Colombo)
const STORE_LOCATION = { lat: 6.9271, lng: 79.8612 }; 

const libraries = ['places'];

export default function CheckoutMap({ onLocationSelect, onDistanceCalculated }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [map, setMap] = useState(null);
  const [markerPos, setMarkerPos] = useState(STORE_LOCATION);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const calculateDistance = (customerLatLng) => {
    // Make sure the Distance Matrix Service is available
    if (!window.google) return;

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [STORE_LOCATION],
        destinations: [customerLatLng],
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          // Get distance in meters and convert to km
          const distanceMeters = response.rows[0].elements[0].distance.value;
          const distanceKm = distanceMeters / 1000;
          
          // Pass the distance up to the Cart/Checkout component
          onDistanceCalculated(distanceKm);
        } else {
          console.error("Distance Matrix failed:", status);
        }
      }
    );
  };

  const handleMapClick = (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    const newPos = { lat: newLat, lng: newLng };
    
    setMarkerPos(newPos);
    
    // Reverse Geocode to get the text address (optional but highly recommended)
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: newPos }, (results, status) => {
      if (status === 'OK' && results[0]) {
        onLocationSelect(results[0].formatted_address, newPos);
      } else {
        onLocationSelect(`${newLat}, ${newLng}`, newPos);
      }
    });

    calculateDistance(newPos);
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ width: '100%', height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={STORE_LOCATION}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        <Marker position={STORE_LOCATION} label="Store" />
        {markerPos !== STORE_LOCATION && (
           <Marker position={markerPos} icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" />
        )}
      </GoogleMap>
    </div>
  );
}