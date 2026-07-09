import React, { useState, useEffect, useRef } from 'react';
import { 
  Bike, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  X, 
  Map as MapIcon, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Activity, 
  Users, 
  Navigation, 
  UserCheck, 
  Compass, 
  User as UserIcon 
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Driver, Ride, User } from '../types';
import { PageContainer } from '../components/PageContainer';

// Read API Key from environment variables
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

interface LiveMapProps {
  drivers: Driver[];
  rides: Ride[];
  users?: User[];
}

// Custom Polyline Component using Google Maps JS SDK via useMap hook
interface PolylineProps {
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
}

const MapPolyline: React.FC<PolylineProps> = ({ 
  path, 
  strokeColor = '#fbbf24', 
  strokeWeight = 4, 
  strokeOpacity = 0.8 
}) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      map
    });

    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, path, strokeColor, strokeWeight, strokeOpacity]);

  return null;
};

// Inline CSS for custom pulsing animations for map markers
const StyleInjection = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes map-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }
    @keyframes passenger-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
      }
    }
    .animate-map-pulse {
      animation: map-pulse 2s infinite;
    }
    .animate-passenger-pulse {
      animation: passenger-pulse 2s infinite;
    }
  `}} />
);

export const LiveMap: React.FC<LiveMapProps> = ({ drivers, rides, users = [] }) => {
  // Filters & State
  const [mapFilter, setMapFilter] = useState<'all' | 'drivers' | 'users' | 'active' | 'finished' | 'canceled'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'drivers' | 'users' | 'rides'>('drivers');
  const [mapZoom, setMapZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: -23.561524, lng: -46.655881 }); // Avenida Paulista, SP
  
  // Real-time position tracking of the logged-in admin user
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Filtered collections
  const onlineDrivers = drivers.filter(d => d.isOnline);
  const onlineUsers = users.filter(u => u.isOnline);
  const activeRides = rides.filter(r => ['waiting', 'accepted', 'in_progress'].includes(r.status));
  const finishedRides = rides.filter(r => r.status === 'finished');
  const canceledRides = rides.filter(r => r.status === 'canceled');

  // Filter data to display on the map
  const shouldShowDrivers = mapFilter === 'all' || mapFilter === 'drivers';
  const shouldShowUsers = mapFilter === 'all' || mapFilter === 'users';
  const shouldShowActiveRides = mapFilter === 'all' || mapFilter === 'active';
  const shouldShowFinishedRides = mapFilter === 'finished';
  const shouldShowCanceledRides = mapFilter === 'canceled';

  // Stats calculation based on live Firestore database arrays
  const busyDriversCount = onlineDrivers.filter(driver => 
    rides.some(r => r.driverId === driver.id && ['accepted', 'in_progress'].includes(r.status))
  ).length;
  const availableDriversCount = onlineDrivers.length - busyDriversCount;

  // Retrieve user's current browser georeferenced location and track in real-time
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setMapCenter(prev => {
            // Only center initially
            if (prev.lat === -23.561524 && prev.lng === -46.655881) {
              if (leafletMapInstanceRef.current) {
                leafletMapInstanceRef.current.setView([loc.lat, loc.lng], 13);
              }
              return loc;
            }
            return prev;
          });
        },
        (error) => {
          console.warn('Geolocation warning:', error.message);
          setTrackingError('Permissão de localização não concedida. Centralizando no padrão.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setTrackingError('Geolocalização não suportada por este navegador.');
    }
  }, []);

  // Helper to center and zoom map on an entity
  const focusOnLocation = (lat: number, lng: number, zoom = 15) => {
    setMapCenter({ lat, lng });
    setMapZoom(zoom);
    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.setView([lat, lng], zoom, { animate: true });
    }
  };

  // --- LEAFLET OPENSTREETMAP FALLBACK INTEGRATION ---
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const leafletMapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapInstanceRef = useRef<any>(null);
  const leafletMarkersRef = useRef<{ [key: string]: any }>({});
  const leafletPolylinesRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (hasValidKey) return;

    // Dynamically load Leaflet CSS
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const scriptId = 'leaflet-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else if ((window as any).L) {
      setLeafletLoaded(true);
    }

    return () => {
      // Map cleanup on unmount
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
    };
  }, [hasValidKey]);

  // Handle Leaflet map instance creation and central updates
  useEffect(() => {
    if (hasValidKey || !leafletLoaded || !leafletMapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapInstanceRef.current) {
      const map = L.map(leafletMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([mapCenter.lat, mapCenter.lng], mapZoom);

      // Dark theme map tile provider (CARTO Dark Matter - very modern and stylish)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      leafletMapInstanceRef.current = map;
    }
  }, [leafletLoaded, hasValidKey]);

  // Invalidate Leaflet map size on container rendering or change of view/tab
  useEffect(() => {
    if (!hasValidKey && leafletLoaded && leafletMapInstanceRef.current) {
      const timer = setTimeout(() => {
        leafletMapInstanceRef.current.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [leafletLoaded, mapFilter, sidebarTab, hasValidKey]);

  // Handle Leaflet markers and polyline drawing updates in real-time
  useEffect(() => {
    if (hasValidKey || !leafletLoaded) return;
    const L = (window as any).L;
    const map = leafletMapInstanceRef.current;
    if (!L || !map) return;

    // Clear previous markers
    Object.values(leafletMarkersRef.current).forEach((m: any) => m.remove());
    leafletMarkersRef.current = {};

    Object.values(leafletPolylinesRef.current).forEach((p: any) => p.remove());
    leafletPolylinesRef.current = {};

    // 0. Render logged-in user position
    if (userLocation) {
      const userHtml = `
        <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; position: relative;">
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.4); transition: all 0.2s;" class="animate-map-pulse" />
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'custom-user-location-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindTooltip("Sua Localização (Admin)", { permanent: false, direction: 'top' });
      leafletMarkersRef.current['user-current-location'] = userMarker;
    }

    // 1. Render all drivers (online in green, offline in gray)
    if (shouldShowDrivers) {
      drivers.forEach(driver => {
        if (!driver.currentLocation) return;
        const isSelected = selectedDriver?.id === driver.id;
        const isOnline = driver.isOnline;

        const iconHtml = `
          <div style="width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${isSelected ? '#fbbf24' : isOnline ? '#10b981' : '#94a3b8'}; background: #0f172a; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); transition: all 0.2s ease;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fbbf24' : isOnline ? '#10b981' : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 4-3 3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>
            </div>
            <span style="position: absolute; bottom: 4px; right: 4px; width: 10px; height: 10px; border-radius: 50%; background-color: ${isOnline ? '#10b981' : '#94a3b8'}; border: 2px solid #0f172a;" />
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-driver-icon',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });

        const marker = L.marker([driver.currentLocation.lat, driver.currentLocation.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedDriver(driver);
            setSelectedRide(null);
          })
          .bindTooltip(`Piloto: ${driver.name} (${isOnline ? 'Online' : 'Offline'})`, { direction: 'top', offset: [0, -10] });

        leafletMarkersRef.current[`driver-${driver.id}`] = marker;
      });
    }

    // 1.2. Render online passengers (users)
    if (shouldShowUsers) {
      onlineUsers.forEach(u => {
        if (!u.currentLocation) return;
        const isSelected = selectedRide?.userId === u.id;

        const userHtml = `
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid ${isSelected ? '#fbbf24' : '#3b82f6'}; background: #020617; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); overflow: hidden;" class="animate-map-pulse">
              <img src="${u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}" style="width: 100%; height: 100%; object-fit: cover;" referrerPolicy="no-referrer" />
            </div>
            <span style="position: absolute; bottom: 4px; right: 4px; width: 10px; height: 10px; border-radius: 50%; background-color: #3b82f6; border: 2px solid #0f172a;" />
          </div>
        `;

        const customIcon = L.divIcon({
          html: userHtml,
          className: 'custom-passenger-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const passengerMarker = L.marker([u.currentLocation.lat, u.currentLocation.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            const userRide = rides.find(r => r.userId === u.id && ['waiting', 'accepted', 'in_progress'].includes(r.status));
            if (userRide) {
              setSelectedRide(userRide);
            } else {
              setSelectedRide({
                id: `usr_info_${u.id}`,
                userId: u.id,
                userName: u.name,
                userPhone: u.phone,
                originAddress: 'Disponível / Online',
                destAddress: 'Sem corrida ativa no momento',
                originLatLng: u.currentLocation!,
                destLatLng: u.currentLocation!,
                distance: 0,
                duration: 0,
                price: 0,
                fee: 0,
                status: 'waiting',
                type: 'ride',
                createdAt: u.createdAt,
                updatedAt: u.createdAt
              });
            }
            setSelectedDriver(null);
          })
          .bindTooltip(`Passageiro Online: ${u.name}`, { direction: 'top', offset: [0, -10] });

        leafletMarkersRef.current[`user-${u.id}`] = passengerMarker;
      });
    }

    // 1.5. Render active passengers (users) at ride origins (only those with active rides and not already shown as online user)
    if (shouldShowActiveRides) {
      activeRides.forEach(ride => {
        // If already rendered as online user, don't duplicate
        if (onlineUsers.some(u => u.id === ride.userId) && shouldShowUsers) return;

        const passengerUser = users.find(u => u.id === ride.userId);
        const isSelected = selectedRide?.id === ride.id;

        const passengerHtml = `
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid ${isSelected ? '#fbbf24' : '#f59e0b'}; background: #020617; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); overflow: hidden;" class="animate-passenger-pulse">
              <img src="${passengerUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${ride.userName}`}" style="width: 100%; height: 100%; object-fit: cover;" referrerPolicy="no-referrer" />
            </div>
            <span style="position: absolute; bottom: 4px; right: 4px; width: 10px; height: 10px; border-radius: 50%; background-color: #f59e0b; border: 2px solid #0f172a;" />
          </div>
        `;

        const customIcon = L.divIcon({
          html: passengerHtml,
          className: 'custom-passenger-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const passengerMarker = L.marker([ride.originLatLng.lat, ride.originLatLng.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedRide(ride);
            setSelectedDriver(null);
          })
          .bindTooltip(`Passageiro: ${ride.userName}`, { direction: 'top', offset: [0, -10] });

        leafletMarkersRef.current[`passenger-${ride.id}`] = passengerMarker;
      });
    }

    // 2. Render active rides (destination & polyline connecting origin/dest)
    if (shouldShowActiveRides) {
      activeRides.forEach(ride => {
        const isSelected = selectedRide?.id === ride.id;

        // Destination marker
        const destHtml = `
          <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #f59e0b; background: #020617; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3); font-family: monospace; font-size: 8px; font-weight: bold; color: #f59e0b; text-align: center; line-height: 28px;">
            DEST
          </div>
        `;
        const destIcon = L.divIcon({
          html: destHtml,
          className: 'custom-dest-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const destMarker = L.marker([ride.destLatLng.lat, ride.destLatLng.lng], { icon: destIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedRide(ride);
            setSelectedDriver(null);
          });
        leafletMarkersRef.current[`ride-dest-${ride.id}`] = destMarker;

        // Polyline connecting origin and dest
        const polyline = L.polyline(
          [[ride.originLatLng.lat, ride.originLatLng.lng], [ride.destLatLng.lat, ride.destLatLng.lng]],
          {
            color: isSelected ? '#fbbf24' : '#475569',
            weight: isSelected ? 4 : 2.5,
            opacity: isSelected ? 1.0 : 0.6,
            dashArray: isSelected ? undefined : '5, 5'
          }
        ).addTo(map);
        leafletPolylinesRef.current[`ride-poly-${ride.id}`] = polyline;
      });
    }

    // 3. Render finished rides
    if (shouldShowFinishedRides) {
      finishedRides.slice(0, 15).forEach(ride => {
        const polyline = L.polyline(
          [[ride.originLatLng.lat, ride.originLatLng.lng], [ride.destLatLng.lat, ride.destLatLng.lng]],
          { color: '#10b981', weight: 2, opacity: 0.3 }
        ).addTo(map);
        leafletPolylinesRef.current[`ride-finished-${ride.id}`] = polyline;
      });
    }

    // 4. Render canceled rides
    if (shouldShowCanceledRides) {
      canceledRides.slice(0, 15).forEach(ride => {
        const polyline = L.polyline(
          [[ride.originLatLng.lat, ride.originLatLng.lng], [ride.destLatLng.lat, ride.destLatLng.lng]],
          { color: '#ef4444', weight: 2, opacity: 0.3 }
        ).addTo(map);
        leafletPolylinesRef.current[`ride-canceled-${ride.id}`] = polyline;
      });
    }

  }, [
    leafletLoaded,
    hasValidKey,
    drivers,
    onlineDrivers,
    onlineUsers,
    activeRides,
    finishedRides,
    canceledRides,
    shouldShowDrivers,
    shouldShowUsers,
    shouldShowActiveRides,
    shouldShowFinishedRides,
    shouldShowCanceledRides,
    selectedDriver,
    selectedRide,
    userLocation,
    users
  ]);

  return (
    <PageContainer 
      title="Mapa Operacional Real" 
      subtitle="Monitoramento georreferenciado e telemetria ao vivo da frota ativa"
    >
      <StyleInjection />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
        
        {/* Real-time Dispatch Map Panel (3/4 cols on desktop) */}
        {/* Dynamic viewport-responsive adaptive heights */}
        <div className="xl:col-span-3 bg-slate-950 border border-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px] md:h-[650px] lg:h-[calc(100vh-220px)] lg:min-h-[600px] relative">
          
          {/* Map Header Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/95 border border-slate-800 p-3 rounded-xl flex items-center gap-3 text-slate-100 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div>
              <h4 className="text-xs font-bold leading-none flex items-center gap-1.5">
                Console de Monitoramento Real-Time
              </h4>
              <span className="text-[8px] font-mono font-bold text-slate-400 mt-1 block">
                SÃO PAULO / CONEXÃO ATIVA FIRESTORE
              </span>
            </div>
          </div>

          {/* Map Filters Overlay */}
          <div className="absolute top-4 right-4 z-10 flex gap-1 bg-slate-900/95 border border-slate-800 p-1 rounded-xl shadow-lg overflow-x-auto max-w-[calc(100%-120px)]">
            {(['all', 'drivers', 'users', 'active', 'finished', 'canceled'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setMapFilter(filter);
                  setSelectedDriver(null);
                  setSelectedRide(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap capitalize transition-all cursor-pointer ${
                  mapFilter === filter 
                    ? 'bg-amber-400 text-slate-950' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'Ver Todos' :
                 filter === 'drivers' ? 'Pilotos' :
                 filter === 'users' ? 'Usuários' :
                 filter === 'active' ? 'Ativas' :
                 filter === 'finished' ? 'Concluídas' : 'Canceladas'}
              </button>
            ))}
          </div>

          {/* Zoom and Geolocation Tracking Controls Overlay */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
            {/* Geolocation target button */}
            <button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                      setUserLocation(loc);
                      focusOnLocation(loc.lat, loc.lng, 15);
                    },
                    (error) => {
                      console.error("Erro ao obter geolocalização:", error);
                      alert("Permissão de localização negada ou não disponível. Verifique as configurações do navegador.");
                    }
                  );
                }
              }}
              title="Centralizar em Mim (Admin)"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <Navigation size={16} className="text-amber-400 fill-amber-400/20" />
            </button>

            <button 
              onClick={() => {
                const nextZoom = Math.min(mapZoom + 1, 20);
                setMapZoom(nextZoom);
                if (leafletMapInstanceRef.current) leafletMapInstanceRef.current.setZoom(nextZoom);
              }}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              onClick={() => {
                const nextZoom = Math.max(mapZoom - 1, 1);
                setMapZoom(nextZoom);
                if (leafletMapInstanceRef.current) leafletMapInstanceRef.current.setZoom(nextZoom);
              }}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <ZoomOut size={16} />
            </button>
          </div>

          {/* Map View Port */}
          <div className="flex-1 w-full bg-[#0a0f1d] relative overflow-hidden select-none">
            {hasValidKey ? (
              // Option A: Google Maps (When API Key is Provided)
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  center={mapCenter}
                  zoom={mapZoom}
                  onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
                  onZoomChanged={(ev) => setMapZoom(ev.detail.zoom)}
                  mapId="DEMO_MAP_ID"
                  disableDefaultUI={true}
                  gestureHandling="cooperative"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* 0. RENDER LOGGED-IN ADMIN LOCATION */}
                  {userLocation && (
                    <AdvancedMarker
                      position={userLocation}
                    >
                      <div 
                        style={{ width: '24px', height: '24px' }}
                        className="rounded-full bg-blue-500 border-4 border-white shadow-xl animate-map-pulse"
                      />
                    </AdvancedMarker>
                  )}

                  {/* 1. RENDER ALL DRIVERS */}
                  {shouldShowDrivers && drivers.map((driver) => {
                    if (!driver.currentLocation) return null;
                    const isSelected = selectedDriver?.id === driver.id;
                    const isOnline = driver.isOnline;

                    return (
                      <AdvancedMarker
                        key={driver.id}
                        position={{ lat: driver.currentLocation.lat, lng: driver.currentLocation.lng }}
                        onClick={() => {
                          setSelectedDriver(driver);
                          setSelectedRide(null);
                        }}
                      >
                        <div 
                          style={{ width: '42px', height: '42px' }}
                          className={`rounded-full border-2 bg-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer ${
                            isSelected ? 'border-amber-400 ring-4 ring-amber-400/25' : isOnline ? 'border-emerald-500' : 'border-slate-400'
                          }`}
                        >
                          <Bike className={`${isSelected ? 'text-amber-400' : isOnline ? 'text-emerald-400' : 'text-slate-400'} shrink-0`} size={20} />
                          <span className={`absolute bottom-[-4px] right-[-2px] w-3 h-3 rounded-full border-2 border-slate-900 shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* 1.2. RENDER ONLINE PASSENGERS (USERS) */}
                  {shouldShowUsers && onlineUsers.map((u) => {
                    if (!u.currentLocation) return null;
                    const isSelected = selectedRide?.userId === u.id;

                    return (
                      <AdvancedMarker
                        key={`online-user-g-${u.id}`}
                        position={{ lat: u.currentLocation.lat, lng: u.currentLocation.lng }}
                        onClick={() => {
                          const userRide = rides.find(r => r.userId === u.id && ['waiting', 'accepted', 'in_progress'].includes(r.status));
                          if (userRide) {
                            setSelectedRide(userRide);
                          } else {
                            setSelectedRide({
                              id: `usr_info_${u.id}`,
                              userId: u.id,
                              userName: u.name,
                              userPhone: u.phone,
                              originAddress: 'Disponível / Online',
                              destAddress: 'Sem corrida ativa no momento',
                              originLatLng: u.currentLocation!,
                              destLatLng: u.currentLocation!,
                              distance: 0,
                              duration: 0,
                              price: 0,
                              fee: 0,
                              status: 'waiting',
                              type: 'ride',
                              createdAt: u.createdAt,
                              updatedAt: u.createdAt
                            });
                          }
                          setSelectedDriver(null);
                        }}
                      >
                        <div 
                          style={{ width: '40px', height: '40px' }}
                          className={`rounded-full border-2 bg-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer animate-map-pulse ${
                            isSelected ? 'border-amber-400 ring-4 ring-amber-400/25' : 'border-blue-500'
                          }`}
                        >
                          <img 
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                            alt={u.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-full object-cover" 
                          />
                          <span className="absolute bottom-[-2px] right-[-2px] w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 shrink-0" />
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* 1.5. RENDER ACTIVE PASSENGERS (USERS) AT RIDE ORIGIN (ONLY IF NOT RENDERED ONLINE) */}
                  {shouldShowActiveRides && activeRides.map((ride) => {
                    // Avoid duplicate rendering
                    if (onlineUsers.some(u => u.id === ride.userId) && shouldShowUsers) return null;

                    const passengerUser = users.find(u => u.id === ride.userId);
                    const isSelected = selectedRide?.id === ride.id;
                    
                    return (
                      <AdvancedMarker
                        key={`passenger-g-${ride.id}`}
                        position={ride.originLatLng}
                        onClick={() => {
                          setSelectedRide(ride);
                          setSelectedDriver(null);
                        }}
                      >
                        <div 
                          style={{ width: '40px', height: '40px' }}
                          className={`rounded-full border-2 bg-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer animate-passenger-pulse ${
                            isSelected ? 'border-amber-400 ring-4 ring-amber-400/25' : 'border-amber-500'
                          }`}
                        >
                          <img 
                            src={passengerUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${ride.userName}`} 
                            alt={ride.userName} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-full object-cover" 
                          />
                          <span className="absolute bottom-[-2px] right-[-2px] w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900 shrink-0" />
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* 2. RENDER ACTIVE RIDES (DESTINATION) */}
                  {shouldShowActiveRides && activeRides.map((ride) => {
                    const isSelected = selectedRide?.id === ride.id;
                    
                    return (
                      <React.Fragment key={ride.id}>
                        {/* Destination Marker */}
                        <AdvancedMarker
                          position={ride.destLatLng}
                          onClick={() => {
                            setSelectedRide(ride);
                            setSelectedDriver(null);
                          }}
                        >
                          <div 
                            style={{ width: '36px', height: '36px' }}
                            className={`rounded-full border-2 bg-slate-950 flex items-center justify-center shadow-lg cursor-pointer ${
                              isSelected ? 'border-amber-400 scale-110 ring-4 ring-amber-400/25' : 'border-amber-500'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-amber-400">DEST</span>
                          </div>
                        </AdvancedMarker>

                        {/* Route Polyline */}
                        <MapPolyline 
                          path={[ride.originLatLng, ride.destLatLng]}
                          strokeColor={isSelected ? '#fbbf24' : '#64748b'}
                          strokeWeight={isSelected ? 5 : 3}
                          strokeOpacity={isSelected ? 1.0 : 0.6}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* 3. RENDER FINISHED RIDES (If filtered) */}
                  {shouldShowFinishedRides && finishedRides.slice(0, 15).map((ride) => (
                    <React.Fragment key={ride.id}>
                      <AdvancedMarker position={ride.originLatLng}>
                        <div style={{ width: '28px', height: '28px' }} className="rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center opacity-70">
                          <span className="text-[8px] font-bold text-slate-400">A</span>
                        </div>
                      </AdvancedMarker>
                      <AdvancedMarker position={ride.destLatLng}>
                        <div style={{ width: '28px', height: '28px' }} className="rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center opacity-70">
                          <span className="text-[8px] font-bold text-slate-400">B</span>
                        </div>
                      </AdvancedMarker>
                      <MapPolyline 
                        path={[ride.originLatLng, ride.destLatLng]}
                        strokeColor="#10b981"
                        strokeWeight={2}
                        strokeOpacity={0.4}
                      />
                    </React.Fragment>
                  ))}

                  {/* 4. RENDER CANCELED RIDES (If filtered) */}
                  {shouldShowCanceledRides && canceledRides.slice(0, 15).map((ride) => (
                    <React.Fragment key={ride.id}>
                      <AdvancedMarker position={ride.originLatLng}>
                        <div style={{ width: '28px', height: '28px' }} className="rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center opacity-70">
                          <span className="text-[8px] font-bold text-slate-400">A</span>
                        </div>
                      </AdvancedMarker>
                      <AdvancedMarker position={ride.destLatLng}>
                        <div style={{ width: '28px', height: '28px' }} className="rounded-full border border-slate-600 bg-slate-950 flex items-center justify-center opacity-70">
                          <span className="text-[8px] font-bold text-slate-400">B</span>
                        </div>
                      </AdvancedMarker>
                      <MapPolyline 
                        path={[ride.originLatLng, ride.destLatLng]}
                        strokeColor="#f43f5e"
                        strokeWeight={2}
                        strokeOpacity={0.4}
                      />
                    </React.Fragment>
                  ))}

                  {/* INFOWINDOWS FOR SELECTION */}
                  {selectedDriver && (
                    <InfoWindow
                      position={{ lat: selectedDriver.currentLocation!.lat, lng: selectedDriver.currentLocation!.lng }}
                      onCloseClick={() => setSelectedDriver(null)}
                    >
                      <div className="p-1 max-w-[200px] text-slate-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <img 
                            src={selectedDriver.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedDriver.name}`} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full shrink-0" 
                          />
                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-bold leading-tight truncate">{selectedDriver.name}</h4>
                            <span className="text-[9px] text-emerald-600 font-bold block">Online</span>
                          </div>
                        </div>
                        <p className="text-[9px] font-semibold text-slate-500 mb-1">
                          Veículo: <span className="font-bold text-slate-700">{selectedDriver.vehicle.model}</span>
                        </p>
                        <p className="text-[9px] font-semibold text-slate-500">
                          Placa: <span className="font-bold text-slate-700 font-mono">{selectedDriver.vehicle.licensePlate}</span>
                        </p>
                      </div>
                    </InfoWindow>
                  )}

                  {selectedRide && (
                    <InfoWindow
                      position={selectedRide.originLatLng}
                      onCloseClick={() => setSelectedRide(null)}
                    >
                      <div className="p-1 max-w-[220px] text-slate-800">
                        <div className="flex items-center justify-between gap-1 mb-1 border-b border-slate-100 pb-1">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">ID: #{selectedRide.id.slice(-5)}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 uppercase">
                            {selectedRide.status === 'waiting' ? 'Aguardando' : selectedRide.status === 'in_progress' ? 'Em curso' : 'Aceita'}
                          </span>
                        </div>
                        <p className="text-[9px] font-semibold text-slate-500 mb-1">
                          Passageiro: <span className="font-bold text-slate-700">{selectedRide.userName}</span>
                        </p>
                        {selectedRide.driverName && (
                          <p className="text-[9px] font-semibold text-slate-500 mb-1">
                            Motorista: <span className="font-bold text-slate-700">{selectedRide.driverName}</span>
                          </p>
                        )}
                        <p className="text-[9px] font-semibold text-slate-500 mb-1 truncate">
                          Destino: <span className="font-bold text-slate-700">{selectedRide.destAddress}</span>
                        </p>
                        <p className="text-[9px] font-mono font-bold text-emerald-600 mt-1">
                          Preço: R$ {selectedRide.price.toFixed(2)} ({selectedRide.distance.toFixed(1)} km)
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              // Option B: Leaflet Map (Free / Self-Sustained Fallback for Instant Access)
              <div ref={leafletMapContainerRef} className="w-full h-full z-0" id="leaflet-map-id">
                {!leafletLoaded && (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                    <MapIcon size={32} className="animate-spin mb-3 text-amber-400" />
                    <p className="text-xs font-mono">Carregando mapa operacional ao vivo...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating entities detail card */}
          {(selectedDriver || selectedRide) && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 z-20 bg-slate-900/95 border border-slate-800 p-4 rounded-xl text-slate-200 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                    {selectedDriver ? 'PIL' : 'COR'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold leading-none">
                      {selectedDriver ? selectedDriver.name : selectedRide?.userName}
                    </h5>
                    <span className="text-[8px] font-mono text-amber-400 block mt-1 uppercase">
                      {selectedDriver 
                        ? `${selectedDriver.vehicle.model} (${selectedDriver.vehicle.licensePlate})`
                        : selectedRide?.id.startsWith('usr_info_')
                          ? `Passageiro Online`
                          : `Corrida #${selectedRide?.id.slice(-6)}`}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDriver(null);
                    setSelectedRide(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1.5 text-[10px] font-medium text-slate-400">
                {selectedDriver ? (
                  <>
                    <div className="flex justify-between">
                      <span>Rating Piloto:</span>
                      <span className="text-slate-100 font-bold">{selectedDriver.rating} ★</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-bold font-mono ${selectedDriver.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {selectedDriver.isOnline ? 'ATIVO E ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    {selectedDriver.currentLocation && (
                      <div className="flex justify-between">
                        <span>Coordenadas:</span>
                        <span className="text-slate-300 font-mono">
                          {selectedDriver.currentLocation.lat.toFixed(5)}, {selectedDriver.currentLocation.lng.toFixed(5)}
                        </span>
                      </div>
                    )}
                  </>
                ) : selectedRide ? (
                  <>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-amber-400 font-bold font-mono uppercase">
                        {selectedRide.id.startsWith('usr_info_') ? 'ONLINE / DISPONÍVEL' : selectedRide.status}
                      </span>
                    </div>
                    {selectedRide.id.startsWith('usr_info_') ? (
                      <div className="flex justify-between">
                        <span>Telefone:</span>
                        <span className="text-slate-200 font-bold">{selectedRide.userPhone}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Origem:</span>
                          <span className="text-slate-200 font-bold truncate max-w-[150px]">{selectedRide.originAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Destino:</span>
                          <span className="text-slate-200 font-bold truncate max-w-[150px]">{selectedRide.destAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Preço / Distância:</span>
                          <span className="text-emerald-400 font-bold font-mono">R$ {selectedRide.price.toFixed(2)} ({selectedRide.distance}km)</span>
                        </div>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Control Console Sidebar (1/4 col on desktop) */}
        {/* Sized dynamically with the same adaptive height and scrollable container layout */}
        <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 flex flex-col justify-between h-[500px] md:h-[650px] lg:h-[calc(100vh-220px)] lg:min-h-[600px] overflow-hidden">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            
            {/* Live Metrics Header */}
            <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 text-slate-100 space-y-2.5 shrink-0">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Activity size={14} className="text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold tracking-wide uppercase">Painel da Frota (Live)</span>
              </div>
              
              {/* Quick info banner clarifying the user tracking query */}
              <div className="bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded p-1.5 text-[9px] font-semibold leading-normal">
                ✨ Passageiros e Pilotos sincronizados em tempo real via Firestore.
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 p-1.5 rounded border border-slate-800 text-center">
                  <span className="text-[8px] text-slate-400 font-semibold block uppercase">Disponíveis</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono leading-none">{availableDriversCount}</span>
                </div>
                <div className="bg-slate-800/50 p-1.5 rounded border border-slate-800 text-center">
                  <span className="text-[8px] text-slate-400 font-semibold block uppercase">Em Corrida</span>
                  <span className="text-sm font-bold text-amber-400 font-mono leading-none">{busyDriversCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] font-semibold text-slate-300 pt-0.5">
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-slate-400" />
                  Pilotos Conectados:
                </span>
                <span className="font-mono font-bold text-white">{onlineDrivers.length}</span>
              </div>
            </div>

            {/* Premium 3-Tab Navigator */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setSidebarTab('drivers')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer ${
                  sidebarTab === 'drivers' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Condutores ({onlineDrivers.length})
              </button>
              <button
                onClick={() => setSidebarTab('users')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer ${
                  sidebarTab === 'users' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Passageiros ({onlineUsers.length})
              </button>
              <button
                onClick={() => setSidebarTab('rides')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer ${
                  sidebarTab === 'rides' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Corridas ({activeRides.length})
              </button>
            </div>
            
            {/* Scrollable list section utilizing all available remaining vertical space */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {sidebarTab === 'drivers' ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider block mb-1">Transmissões de Pilotos</span>
                  {onlineDrivers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <AlertTriangle size={16} className="mx-auto text-slate-350 mb-1" />
                      <p className="text-[10px] font-semibold leading-relaxed">Nenhum condutor online.</p>
                    </div>
                  ) : (
                    onlineDrivers.map((driver) => {
                      const hasActiveRide = rides.some(r => r.driverId === driver.id && ['accepted', 'in_progress'].includes(r.status));
                      return (
                        <button
                          key={driver.id}
                          onClick={() => {
                            setSelectedDriver(driver);
                            setSelectedRide(null);
                            if (driver.currentLocation) {
                              focusOnLocation(driver.currentLocation.lat, driver.currentLocation.lng, 15);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs font-bold ${
                            selectedDriver?.id === driver.id 
                              ? 'bg-amber-50 border-amber-300 text-slate-900 shadow-sm' 
                              : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img 
                              src={driver.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${driver.name}`} 
                              alt="" 
                              referrerPolicy="no-referrer"
                              className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100" 
                            />
                            <div className="truncate">
                              <span className="block truncate leading-tight">{driver.name}</span>
                              <span className="text-[8px] text-slate-450 font-normal">
                                {hasActiveRide ? '🚚 Em Viagem' : '🟢 Livre / Espera'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-sm text-white text-[7.5px] font-mono font-bold uppercase shrink-0 ${hasActiveRide ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                            {hasActiveRide ? 'CORRIDA' : 'GPS'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : sidebarTab === 'users' ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-wider block mb-1">Passageiros Online</span>
                  {onlineUsers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <AlertTriangle size={16} className="mx-auto text-slate-350 mb-1" />
                      <p className="text-[10px] font-semibold leading-relaxed">Nenhum passageiro online.</p>
                    </div>
                  ) : (
                    onlineUsers.map((u) => {
                      const userRide = rides.find(r => r.userId === u.id && ['waiting', 'accepted', 'in_progress'].includes(r.status));
                      const isSelected = selectedRide?.userId === u.id;
                      return (
                        <button
                          key={`side-passenger-${u.id}`}
                          onClick={() => {
                            if (userRide) {
                              setSelectedRide(userRide);
                            } else {
                              setSelectedRide({
                                id: `usr_info_${u.id}`,
                                userId: u.id,
                                userName: u.name,
                                userPhone: u.phone,
                                originAddress: 'Disponível / Online',
                                destAddress: 'Sem corrida ativa no momento',
                                originLatLng: u.currentLocation!,
                                destLatLng: u.currentLocation!,
                                distance: 0,
                                duration: 0,
                                price: 0,
                                fee: 0,
                                status: 'waiting',
                                type: 'ride',
                                createdAt: u.createdAt,
                                updatedAt: u.createdAt
                              });
                            }
                            setSelectedDriver(null);
                            if (u.currentLocation) {
                              focusOnLocation(u.currentLocation.lat, u.currentLocation.lng, 15);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all text-xs font-bold ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300 text-slate-900 shadow-sm' 
                              : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img 
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} 
                              alt="" 
                              referrerPolicy="no-referrer"
                              className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100" 
                            />
                            <div className="truncate">
                              <span className="block truncate leading-tight">{u.name}</span>
                              <span className="text-[8px] text-slate-400 font-normal truncate max-w-[110px] block">
                                {userRide ? `🚚 Viagem #${userRide.id.slice(-5)}` : '🟢 Disponível'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-sm text-white text-[7.5px] font-mono font-bold uppercase shrink-0 ${userRide ? 'bg-amber-500' : 'bg-blue-500'}`}>
                            {userRide ? 'Viagem' : 'Online'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block mb-1">Status de Solicitações</span>
                  {activeRides.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <AlertTriangle size={16} className="mx-auto text-slate-350 mb-1" />
                      <p className="text-[10px] font-semibold leading-relaxed">Nenhuma corrida ativa no radar.</p>
                    </div>
                  ) : (
                    activeRides.map((ride) => {
                      const isSelected = selectedRide?.id === ride.id;
                      return (
                        <button
                          key={ride.id}
                          onClick={() => {
                            setSelectedRide(ride);
                            setSelectedDriver(null);
                            focusOnLocation(ride.originLatLng.lat, ride.originLatLng.lng, 14);
                          }}
                          className={`w-full flex flex-col p-2 rounded-xl text-left border transition-all text-xs font-bold ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-300 text-slate-900 shadow-sm' 
                              : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="truncate text-slate-700 font-bold text-[11px]">{ride.userName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-amber-400 text-[7.5px] font-mono uppercase font-bold shrink-0">
                              {ride.status === 'waiting' ? 'Aguardando' : ride.status === 'in_progress' ? 'Em curso' : 'Aceita'}
                            </span>
                          </div>
                          <span className="text-[9px] font-semibold text-slate-400 block truncate font-normal">Origem: {ride.originAddress}</span>
                          <span className="text-[9px] font-semibold text-slate-400 block truncate font-normal">Destino: {ride.destAddress}</span>
                          <div className="flex justify-between items-center w-full mt-1.5 pt-1.5 border-t border-slate-100/60 font-mono text-[8.5px] font-bold text-emerald-600">
                            <span>R$ {ride.price.toFixed(2)}</span>
                            <span className="text-slate-450 font-semibold">{ride.distance.toFixed(1)} km</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Footer update ticker */}
          <div className="mt-4 pt-3 border-t border-slate-150 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-slate-400 uppercase shrink-0">
            <Sparkles size={11} className="text-amber-500 animate-pulse shrink-0" />
            <span>Transmissão Real Ativa</span>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};
