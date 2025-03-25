'use client';
import { useState } from 'react';

type GeneratedImageProps = {
  imageUrl: string | null;
  onEditImage?: () => void;
  onRegenerateImage?: () => void;
};

export default function GeneratedImage({ imageUrl, onEditImage, onRegenerateImage }: GeneratedImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!imageUrl) return null;

  const handleDownload = () => {
    try {
      // Crear un objeto de URL directamente
      const blobUrl = fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
          // Crear una URL para el blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear un enlace temporal
          const link = document.createElement('a');
          link.href = url;
          link.download = `imagen-generada-${new Date().getTime()}.jpg`;
          
          // Añadir al DOM, hacer clic y limpiar de manera segura
          document.body.appendChild(link);
          
          // Usar setTimeout para asegurar que el enlace está en el DOM
          setTimeout(() => {
            link.click();
            // Usar setTimeout para asegurar que ha iniciado la descarga antes de eliminar el enlace
            setTimeout(() => {
              // Verificar que el enlace todavía está en el DOM antes de eliminarlo
              if (document.body.contains(link)) {
                document.body.removeChild(link);
              }
              // Liberar la URL del objeto
              window.URL.revokeObjectURL(url);
            }, 100);
          }, 0);
        })
        .catch(err => {
          console.error('Error al descargar la imagen:', err);
          // Método de respaldo si falla el fetch
          fallbackDownload();
        });
    } catch (error) {
      console.warn('Error en el método principal de descarga:', error);
      // Si falla el método principal, usar método de respaldo
      fallbackDownload();
    }
  };
  
  // Método de respaldo para descargar usando el método anterior
  const fallbackDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `imagen-generada-${new Date().getTime()}.jpg`;
      // Usar la API moderna para descargar
      link.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    } catch (error) {
      console.error('Error completo al descargar la imagen:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Bloquear scroll cuando el modal está abierto
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="border rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50/30 relative group shadow-lg hover:shadow-indigo-200/40 transition-all duration-300">
        <div className="aspect-w-16">
          <img
            src={imageUrl}
            alt="Imagen generada"
            className="w-full object-contain max-h-[500px] cursor-pointer"
            onClick={toggleFullscreen}
          />
        </div>
        <button 
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-indigo-500/50 border border-white/30 backdrop-blur-sm opacity-100"
          aria-label="Ampliar imagen"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-5 h-5"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
            />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-3 mb-2 w-full sm:w-auto sm:mb-0">
          {onEditImage && (
            <button
              onClick={onEditImage}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-transform hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Editar
            </button>
          )}
          
          {onRegenerateImage && (
            <button
              onClick={onRegenerateImage}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-transform hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerar
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 flex-1 sm:flex-none">
          <button
            onClick={toggleFullscreen}
            className="flex-1 inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Ampliar
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-transform hover:scale-105"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Descargar
          </button>
        </div>
      </div>

      {/* Modal de imagen a pantalla completa */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-gray-900/95 to-black/98 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={toggleFullscreen}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            {/* Botón de cerrar más sutil */}
            <button 
              onClick={toggleFullscreen}
              className="fixed top-3 right-3 z-50 bg-black/40 hover:bg-red-500/80 text-white/80 hover:text-white p-2 rounded-full transition-all duration-300 shadow-sm transform hover:scale-105 border border-white/10 backdrop-blur-sm flex items-center gap-1.5"
              aria-label="Cerrar imagen"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className="w-4 h-4"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
              <span className="hidden sm:inline text-xs font-medium">Cerrar</span>
            </button>

            {/* Marco estético para la imagen */}
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl border border-white/20 w-full max-w-5xl mx-auto transform transition-all duration-500 scale-100">
              {/* Decoración del marco */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl opacity-50"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 blur-sm"></div>
              
              {/* Contenedor de la imagen con sombra interior */}
              <div className="relative rounded-xl overflow-hidden shadow-inner bg-black/30">
                <img
                  src={imageUrl}
                  alt="Imagen generada ampliada"
                  className="max-h-[85vh] w-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Botón de descargar integrado en el marco */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white/90 hover:text-white bg-black/40 hover:bg-indigo-500/80 rounded-full transition-all duration-300 shadow-sm backdrop-blur-sm border border-white/10 hover:border-white/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 