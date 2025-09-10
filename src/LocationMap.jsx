import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';

const LocationMap = () => {
    // Coordenadas de exemplo (Avenida Paulista, São Paulo)
    // 1. SUBSTITUA AQUI pelas suas coordenadas reais!
    const position = [-23.4839692, -46.413188]; // Exemplo: Rua Augusta, 101

    return (
        <div className="relative z-0 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-800">
            <MapContainer center={position} zoom={16} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Tooltip permanent>
                        <b>Boycell</b><br />
                        Venha nos visitar! <br /> Rua erva do sereno 291 , São Paulo - SP.
                    </Tooltip>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default LocationMap;