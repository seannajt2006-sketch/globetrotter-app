import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapComponent({ items = [], center = [3.8480, 11.5021], zoom = 13, showRoute = false }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    // Clear previous markers & polylines
    layerGroup.clearLayers();

    const validItems = items.filter(item => typeof item.lat === 'number' && typeof item.lng === 'number');
    const routeCoords = [];

    // Custom Icon Generator
    const createCustomIcon = (category) => {
      let iconColor = '#06b6d4'; // default primary cyan
      if (category === 'restaurant') iconColor = '#f59e0b';
      else if (category === 'market') iconColor = '#10b981';
      else if (category === 'accommodation') iconColor = '#8b5cf6';
      else if (category === 'cultural') iconColor = '#ec4899';

      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background-color: ${iconColor};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });
    };

    validItems.forEach((item, index) => {
      const latLng = [item.lat, item.lng];
      routeCoords.push(latLng);

      const marker = L.marker(latLng, { icon: createCustomIcon(item.category) });

      const popupHtml = `
        <div style="min-width: 180px;">
          <div class="map-popup-title">${index + 1}. ${item.name}</div>
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px;">📍 ${item.address || 'Yaoundé'}</div>
          ${item.category ? `<span style="background: rgba(6,182,212,0.2); color: #06b6d4; padding: 2px 6px; border-radius: 10px; font-size: 0.75rem; text-transform: uppercase;">${item.category}</span>` : ''}
          ${item.cost_per_day !== undefined ? `<div style="font-size: 0.8rem; font-weight: 600; color: #f59e0b; margin-top: 4px;">💰 ${item.cost_per_day.toLocaleString()} XAF / day</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      layerGroup.addLayer(marker);
    });

    // Draw connecting route polyline if showRoute is enabled
    if (showRoute && routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: '#06b6d4',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      });
      layerGroup.addLayer(polyline);
    }

    // Fit map bounds to show all markers if any exist
    if (validItems.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(center, zoom);
    }

  }, [items, center, zoom, showRoute]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
