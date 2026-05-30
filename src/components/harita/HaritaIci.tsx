'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface TarlaPin {
  id: string;
  tarlaAdi: string;
  ciftciAdi: string;
  koordinatLat: number;
  koordinatLng: number;
  donum: number;
  verimRengi: 'yesil' | 'sari' | 'kirmizi' | 'gri';
  sonHasatKg: number;
  hasatGirisAdet: number;
}

const renkMap: Record<string, string> = {
  yesil: '#22c55e',
  sari: '#eab308',
  kirmizi: '#ef4444',
  gri: '#9ca3af',
};

const verimEtiketi: Record<string, string> = {
  yesil: 'Verim Artışı',
  sari: 'Stabil',
  kirmizi: 'Verim Düşüşü',
  gri: 'Veri Yok',
};

interface Props {
  tarlalar: TarlaPin[];
}

export default function HaritaIci({ tarlalar }: Props) {
  return (
    <MapContainer
      center={[41.02, 40.52]}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap katkıcıları"
      />
      {tarlalar.map((tarla) => (
        <CircleMarker
          key={tarla.id}
          center={[tarla.koordinatLat, tarla.koordinatLng]}
          radius={12}
          fillColor={renkMap[tarla.verimRengi]}
          color="white"
          weight={2}
          fillOpacity={0.8}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{tarla.tarlaAdi}</p>
              <p><span className="text-gray-500">Çiftçi:</span> {tarla.ciftciAdi}</p>
              <p><span className="text-gray-500">Dönüm:</span> {tarla.donum} dönüm</p>
              <p><span className="text-gray-500">Son Hasat:</span> {tarla.sonHasatKg} kg</p>
              <p><span className="text-gray-500">Toplam Giriş:</span> {tarla.hasatGirisAdet} adet</p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: renkMap[tarla.verimRengi] }}
                />
                <span className="text-xs text-gray-600">{verimEtiketi[tarla.verimRengi]}</span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
