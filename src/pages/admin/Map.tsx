import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Store } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { useSimCard } from '@/contexts/SimCardContext';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { shops, getShopSalesStats } = useShop();
  const { simCards } = useSimCard();

  // Mapbox token - avtomatik ishlatish
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiaHVtb3l1bjEzMTIiLCJhIjoiY21hYmIwMzBuMjRmbDJtczh2cDFsZmNobSJ9.isj-iGJnRKTpVraIoy2bKQ';

  // Jizzax viloyati markaziga fokus
  const jizzaxCenter: [number, number] = [67.8420, 40.1158];

  // Magazinlar uchun default koordinatalar (agar latitude/longitude bo'lmasa)
  const getShopCoordinates = (shop: any): [number, number] => {
    if (shop.latitude && shop.longitude) {
      return [shop.longitude, shop.latitude];
    }
    
    // Default koordinatalar har xil tumanlar uchun
    const defaultCoordinates: { [key: string]: [number, number] } = {
      'Jizzax shahri': [67.8420, 40.1158],
      'Dostlik tumani': [67.7500, 40.0800],
      'Zafarobod tumani': [67.9200, 40.2000],
      'Forish tumani': [67.6800, 40.0500]
    };
    
    return defaultCoordinates[shop.region] || jizzaxCenter;
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: jizzaxCenter, // Jizzax viloyati markazi
      zoom: 9
    });

    // Navigation controls qo'shish
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Magazinlarni markerlar sifatida qo'shish
    shops.forEach((shop) => {
      const coordinates = getShopCoordinates(shop);
      const stats = getShopSalesStats(shop.id, simCards);
      const markerColor = shop.status === 'active' ? '#10b981' : '#ef4444';
      
      // Custom HTML marker yaratish
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 50px;
        height: 50px;
        position: relative;
        cursor: pointer;
        transform: translate(-50%, -100%);
      `;
      
      markerElement.innerHTML = `
        <div style="
          width: 50px;
          height: 50px;
          background: ${markerColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            line-height: 1;
          ">
            <div style="font-size: 11px; font-weight: 600;">${stats.total}</div>
            <div style="font-size: 7px; opacity: 0.9;">SIM</div>
          </div>
        </div>
        ${stats.total > 0 ? `
          <div style="
            position: absolute;
            top: -12px;
            right: -12px;
            display: flex;
            gap: 2px;
            flex-direction: column;
          ">
            ${stats.sold > 0 ? `
              <div style="
                background: #22c55e;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                position: relative;
              ">
                ${stats.sold}
                <div style="
                  position: absolute;
                  bottom: -16px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #16a34a;
                  color: white;
                  font-size: 8px;
                  padding: 1px 4px;
                  border-radius: 2px;
                  white-space: nowrap;
                  font-weight: 500;
                ">Sotilgan</div>
              </div>
            ` : ''}
            ${stats.available > 0 ? `
              <div style="
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                position: relative;
                margin-top: ${stats.sold > 0 ? '22px' : '0px'};
              ">
                ${stats.available}
              </div>
            ` : ''}
          </div>
        ` : ''}
      `;
      
      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coordinates)
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 25,
            maxWidth: '320px',
            className: 'custom-popup'
          })
            .setHTML(`
              <div style="
                padding: 16px;
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.4;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
              ">
                <div style="
                  border-bottom: 2px solid #f1f5f9;
                  padding-bottom: 12px;
                  margin-bottom: 12px;
                ">
                  <h3 style="
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                  ">${shop.name}</h3>
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 4px;
                  ">
                    <span style="
                      font-size: 12px;
                      color: #64748b;
                      font-weight: 500;
                    ">👤 ${shop.ownerName}</span>
                  </div>
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 4px;
                  ">
                    <span style="
                      font-size: 12px;
                      color: #64748b;
                      font-weight: 500;
                    ">📞 ${shop.ownerPhone}</span>
                  </div>
                  <div style="
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  ">
                    <span style="
                      font-size: 12px;
                      color: #64748b;
                      font-weight: 500;
                    ">📍 ${shop.region}</span>
                  </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <h4 style="
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    margin: 0 0 8px 0;
                  ">📊 Simkarta holati:</h4>
                  <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 6px;
                  ">
                    <div style="
                      text-align: center;
                      padding: 8px 4px;
                      background: #eff6ff;
                      border-radius: 6px;
                      border: 1px solid #dbeafe;
                    ">
                      <div style="
                        font-weight: 700;
                        color: #2563eb;
                        font-size: 14px;
                        margin-bottom: 2px;
                      ">${stats.total}</div>
                      <div style="
                        font-size: 10px;
                        color: #2563eb;
                        font-weight: 500;
                      ">Jami</div>
                    </div>
                    <div style="
                      text-align: center;
                      padding: 8px 4px;
                      background: #f0fdf4;
                      border-radius: 6px;
                      border: 1px solid #dcfce7;
                    ">
                      <div style="
                        font-weight: 700;
                        color: #16a34a;
                        font-size: 14px;
                        margin-bottom: 2px;
                      ">${stats.sold}</div>
                      <div style="
                        font-size: 10px;
                        color: #16a34a;
                        font-weight: 500;
                      ">Sotilgan</div>
                    </div>
                    <div style="
                      text-align: center;
                      padding: 8px 4px;
                      background: #fff7ed;
                      border-radius: 6px;
                      border: 1px solid #fed7aa;
                    ">
                      <div style="
                        font-weight: 700;
                        color: #ea580c;
                        font-size: 14px;
                        margin-bottom: 2px;
                      ">${stats.available}</div>
                      <div style="
                        font-size: 10px;
                        color: #ea580c;
                        font-weight: 500;
                      ">Sotilmagan</div>
                    </div>
                  </div>
                </div>
                
                <div style="
                  padding-top: 8px;
                  border-top: 1px solid #f1f5f9;
                ">
                  <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    ${shop.status === 'active' 
                      ? 'background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;' 
                      : 'background: #fecaca; color: #dc2626; border: 1px solid #fca5a5;'
                    }
                  ">
                    ${shop.status === 'active' ? '✅ Faol' : '❌ Nofaol'}
                  </div>
                </div>
              </div>
            `)
        )
        .addTo(map.current!);
    });

    // Map yuklangandan so'ng
    map.current.on('load', () => {
      console.log('Map loaded successfully');
    });
  };

  useEffect(() => {
    // Xaritani avtomatik yuklash
    initializeMap();
    
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Jizzax viloyati xaritasi</h1>
        <p className="text-muted-foreground">
          Jami {shops.length} ta magazin ({shops.filter(s => s.status === 'active').length} faol)
        </p>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-0">
          <div ref={mapContainer} className="w-full h-[600px] rounded-lg" />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Belgilar va statistika</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Magazin holati:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Faol magazinlar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Nofaol magazinlar</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Simkarta holati:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  <span className="text-sm">Sotilgan simkartalar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                  <span className="text-sm">Sotilmagan simkartalar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="text-sm">Markerga bosing - batafsil ma'lumot</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Map;