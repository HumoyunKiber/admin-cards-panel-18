import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MapLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiaHVtb3l1bjEzMTIiLCJhIjoiY21hYmIwMzBuMjRmbDJtczh2cDFsZmNobSJ9.isj-iGJnRKTpVraIoy2bKQ';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [69.2401, 41.2995], // Tashkent center
      zoom: 12,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add click event to map
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lat, lng });
      
      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }
      
      // Add new marker
      marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([lng, lat])
        .addTo(map.current!);
      
      // Reverse geocoding to get address
      reverseGeocode(lng, lat);
    });

    // Add initial marker if location is provided
    if (initialLocation) {
      marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([initialLocation.lng, initialLocation.lat])
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [initialLocation]);

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=uz`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        setAddress(place.place_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&country=UZ&language=uz`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const [lng, lat] = place.center;
        
        setSelectedLocation({ lat, lng });
        setAddress(place.place_name);
        
        // Fly to location
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 2000
        });
        
        // Remove existing marker
        if (marker.current) {
          marker.current.remove();
        }
        
        // Add new marker
        marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('GPS bu brauzerda qo\'llab-quvvatlanmaydi');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setSelectedLocation({ lat: latitude, lng: longitude });
        
        // Fly to current location
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 2000
        });
        
        // Remove existing marker
        if (marker.current) {
          marker.current.remove();
        }
        
        // Add new marker
        marker.current = new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
        
        // Get address for current location
        reverseGeocode(longitude, latitude);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('GPS xatosi:', error);
        alert('Joriy lokatsiyani olishda xatolik yuz berdi. GPS yoqilganligini tekshiring.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && address) {
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: address
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Lokatsiyani tanlang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Manzilni qidiruv (masalan: Toshkent, Amir Temur)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
          />
          <Button onClick={searchLocation} variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            onClick={getCurrentLocation} 
            variant="outline" 
            size="sm"
            disabled={isGettingLocation}
          >
            <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Map Container */}
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-lg border"
          style={{ minHeight: '300px' }}
        />
        
        {/* Selected Address Display */}
        {selectedLocation && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tanlangan manzil:</p>
            <p className="text-sm font-medium bg-accent/20 p-2 rounded border">
              {address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
            </p>
            <Button 
              onClick={handleConfirmLocation}
              className="w-full bg-primary hover:bg-primary-glow"
            >
              Bu lokatsiyani tanlash
            </Button>
          </div>
        )}
        
        {!selectedLocation && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Magazin lokatsiyasini tanlash uchun xaritada istalgan joyni bosing
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;