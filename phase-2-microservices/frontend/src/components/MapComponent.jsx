import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapComponent({
  items = [],
  center = [3.8480, 11.5021],
  zoom = 13,
  showRoute = false,
  userLocation = null,
  routePath = null,
  highlightId = null,
  fullHeight = false
}) {
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
    const boundsCoords = [];

    // Custom Icon Generator
    const createCustomIcon = (category, isHighlighted) => {
      let iconColor = '#06b6d4'; // default primary cyan
      if (category === 'restaurant') iconColor = '#f59e0b';
      else if (category === 'market') iconColor = '#10b981';
      else if (category === 'accommodation') iconColor = '#8b5cf6';
      else if (category === 'cultural') iconColor = '#ec4899';

      const size = isHighlighted ? 36 : 28;

      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background-color: ${iconColor};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${isHighlighted ? 3 : 2}px solid white;
          box-shadow: 0 0 ${isHighlighted ? 16 : 10}px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isHighlighted ? 14 : 12}px;
        ">📍</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
      });
    };

    const userLocationIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="user-location-marker"><div class="user-location-pulse"></div></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -11]
    });

    validItems.forEach((item, index) => {
      const latLng = [item.lat, item.lng];
      routeCoords.push(latLng);
      boundsCoords.push(latLng);

      const marker = L.marker(latLng, { icon: createCustomIcon(item.category, item.id === highlightId) });

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

    // Draw connecting route polyline across all items if showRoute is enabled
    if (showRoute && routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: '#06b6d4',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      });
      layerGroup.addLayer(polyline);
    }

    // User's current location marker
    if (userLocation) {
      const userLatLng = [userLocation.lat, userLocation.lng];
      boundsCoords.push(userLatLng);
      const marker = L.marker(userLatLng, { icon: userLocationIcon, zIndexOffset: 1000 });
      marker.bindPopup('<div class="map-popup-title">You are here</div>');
      layerGroup.addLayer(marker);
    }

    // Actual routed path from user's location to a selected destination
    if (routePath && routePath.length > 1) {
      routePath.forEach((coord) => boundsCoords.push(coord));
      const routeLine = L.polyline(routePath, {
        color: '#10b981',
        weight: 5,
        opacity: 0.9
      });
      layerGroup.addLayer(routeLine);
    }

    // Prioritize showing the route when present; otherwise zoom close on the
    // user's own location rather than zooming out to fit every destination.
    if (routePath && routePath.length > 1) {
      map.fitBounds(L.latLngBounds(boundsCoords), { padding: [40, 40] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], Math.max(zoom, 15));
    } else if (validItems.length > 1) {
      map.fitBounds(L.latLngBounds(routeCoords), { padding: [40, 40] });
    } else if (validItems.length === 1) {
      map.setView(routeCoords[0], zoom);
    } else {
      map.setView(center, zoom);
    }

  }, [items, center, zoom, showRoute, userLocation, routePath, highlightId]);

  return (
    <div className={fullHeight ? 'map-wrapper map-wrapper-full' : 'map-wrapper'}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
