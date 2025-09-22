import React from 'react';

// Mapeamento do tipo de serviço para a imagem de destaque (PNG transparente)
// Crie essas imagens e coloque-as na sua pasta `public/parts/`
const SERVICE_TO_IMAGE_MAP = {
    'tela': '/parts/screen.png',      // Ex: Imagem apenas da tela com fundo transparente
    'bateria': '/parts/battery.png',  // Ex: Imagem apenas da bateria com fundo transparente
    'câmera': '/parts/camera.png',    // Ex: Imagem apenas da câmera com fundo transparente
    'carcaça': '/parts/housing.png',  // etc.
};

const Phone2DViewer = ({ serviceType }) => {
    // Encontra a imagem de destaque correspondente ao tipo de serviço
    const highlightImage = SERVICE_TO_IMAGE_MAP[serviceType?.toLowerCase()] || null;

    return (
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-lg relative flex items-center justify-center overflow-hidden">
            {/* Imagem base do celular */}
            <img
                src="/phone-base.png" // <-- COLOQUE O CAMINHO PARA A IMAGEM BASE DO CELULAR AQUI (na pasta `public`)
                alt="Modelo de celular"
                className="max-w-full max-h-full object-contain opacity-50" // Deixa a base um pouco transparente
            />

            {/* Imagem de destaque (se houver) */}
            {highlightImage && (
                <img
                    src={highlightImage}
                    alt={`Destaque para ${serviceType}`}
                    className="absolute top-0 left-0 w-full h-full object-contain"
                    style={{ pointerEvents: 'none' }} // Garante que a imagem de destaque não interfira com eventos de mouse
                />
            )}

            {!highlightImage && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-500">Selecione um serviço para ver a peça</p>
                </div>
            )}
        </div>
    );
};

export default Phone2DViewer;