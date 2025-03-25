'use client';

import { useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ImageUploader from './components/ImageUploader';
import PromptInput, { PromptInputRef } from './components/PromptInput';
import GeneratedImage from './components/GeneratedImage';
import { generateImageFromPrompt, generateHighQualityImage, clearModelCache } from './lib/gemini';

// Función para traducir el prompt a inglés de manera simple
const translateToEnglish = (prompt: string): string => {
  // Traducciones comunes en generación de imágenes
  const translations: Record<string, string> = {
    // Animales
    'gato': 'cat',
    'perro': 'dog',
    'caballo': 'horse',
    'pájaro': 'bird',
    'pez': 'fish',
    'conejo': 'rabbit',
    'león': 'lion',
    'tigre': 'tiger',
    'elefante': 'elephant',
    'jirafa': 'giraffe',
    'oso': 'bear',
    'lobo': 'wolf',
    'zorro': 'fox',
    'mono': 'monkey',
    
    // Colores
    'rojo': 'red',
    'azul': 'blue',
    'verde': 'green',
    'amarillo': 'yellow',
    'negro': 'black',
    'blanco': 'white',
    'naranja': 'orange',
    'púrpura': 'purple',
    'morado': 'purple',
    'violeta': 'violet',
    'marrón': 'brown',
    'gris': 'gray',
    'plateado': 'silver',
    'dorado': 'gold',
    'rosa': 'pink',
    'turquesa': 'turquoise',
    'cian': 'cyan',
    'magenta': 'magenta',
    
    // Adjetivos comunes
    'grande': 'big',
    'pequeño': 'small',
    'alto': 'tall',
    'bajo': 'short',
    'ancho': 'wide',
    'estrecho': 'narrow',
    'grueso': 'thick',
    'delgado': 'thin',
    'pesado': 'heavy',
    'ligero': 'light',
    'brillante': 'bright',
    'oscuro': 'dark',
    'claro': 'light',
    'más': 'more',
    'menos': 'less',
    'hermoso': 'beautiful',
    'feo': 'ugly',
    'fuerte': 'strong',
    'débil': 'weak',
    'nuevo': 'new',
    'viejo': 'old',
    'joven': 'young',
    'antiguo': 'ancient',
    'moderno': 'modern',
    'caliente': 'hot',
    'frío': 'cold',
    'triste': 'sad',
    'feliz': 'happy',
    'enojado': 'angry',
    'sorprendido': 'surprised',
    'asustado': 'scared',
    'asombrado': 'amazed',
    
    // Verbos de edición
    'añade': 'add',
    'añadir': 'add',
    'elimina': 'remove',
    'quita': 'remove',
    'quitar': 'remove',
    'eliminar': 'remove',
    'coloca': 'place',
    'colocar': 'place',
    'pon': 'put',
    'poner': 'put',
    'cambia': 'change',
    'cambiar': 'change',
    'modifica': 'modify',
    'modificar': 'modify',
    'transforma': 'transform',
    'transformar': 'transform',
    'convierte': 'convert',
    'convertir': 'convert',
    'reemplaza': 'replace',
    'reemplazar': 'replace',
    'sustituye': 'replace',
    'sustituir': 'replace',
    'ajusta': 'adjust',
    'ajustar': 'adjust',
    'redimensiona': 'resize',
    'redimensionar': 'resize',
    'rota': 'rotate',
    'rotar': 'rotate',
    'gira': 'rotate',
    'girar': 'rotate',
    'voltea': 'flip',
    'voltear': 'flip',
    'invierte': 'invert',
    'invertir': 'invert',
    'mezcla': 'blend',
    'mezclar': 'blend',
    'fusiona': 'merge',
    'fusionar': 'merge',
    'colorea': 'color',
    'colorear': 'color',
    'pinta': 'paint',
    'pintar': 'paint',
    'dibuja': 'draw',
    'dibujar': 'draw',
    'borra': 'erase',
    'borrar': 'erase',
    'desdibuja': 'blur',
    'desdibujar': 'blur',
    'enfoca': 'focus',
    'enfocar': 'focus',
    
    // Elementos comunes
    'color': 'color',
    'estilo': 'style',
    'fondo': 'background',
    'cielo': 'sky',
    'agua': 'water',
    'montaña': 'mountain',
    'árbol': 'tree',
    'flor': 'flower',
    'planta': 'plant',
    'casa': 'house',
    'edificio': 'building',
    'persona': 'person',
    'gente': 'people',
    'hombre': 'man',
    'mujer': 'woman',
    'niño': 'child',
    'niña': 'girl',
    'niños': 'children',
    'bebé': 'baby',
    'adulto': 'adult',
    'cabello': 'hair',
    'pelo': 'hair',
    'ojos': 'eyes',
    'boca': 'mouth',
    'nariz': 'nose',
    'orejas': 'ears',
    'cara': 'face',
    'rostro': 'face',
    'sombrero': 'hat',
    'gorro': 'cap',
    'gafas': 'glasses',
    'lentes': 'glasses',
    'ropa': 'clothes',
    'camisa': 'shirt',
    'pantalón': 'pants',
    'zapato': 'shoe',
    'zapatos': 'shoes',
    'vestido': 'dress',
    'falda': 'skirt',
    'traje': 'suit',
    'auto': 'car',
    'coche': 'car',
    'bicicleta': 'bicycle',
    'moto': 'motorcycle',
    'motocicleta': 'motorcycle',
    'avión': 'airplane',
    'barco': 'boat',
    'tren': 'train',
    'sol': 'sun',
    'luna': 'moon',
    'estrella': 'star',
    'estrellas': 'stars',
    'día': 'day',
    'noche': 'night',
    'lluvia': 'rain',
    'nieve': 'snow',
    'nube': 'cloud',
    'nubes': 'clouds',
    'fuego': 'fire',
    'hielo': 'ice',
    'tierra': 'earth',
    'suelo': 'ground',
    'arena': 'sand',
    'playa': 'beach',
    'mar': 'sea',
    'océano': 'ocean',
    'río': 'river',
    'lago': 'lake',
    'bosque': 'forest',
    'selva': 'jungle',
    'desierto': 'desert',
    'montañas': 'mountains',
    'ciudad': 'city',
    'pueblo': 'town',
    'campo': 'countryside',
    'barba': 'beard',
    'bigote': 'mustache',
    'sonrisa': 'smile',
    
    // Términos de efectos
    'borroso': 'blurry',
    'nítido': 'sharp',
    'desenfocado': 'unfocused',
    'transparente': 'transparent',
    'opaco': 'opaque',
    'brillo': 'brightness',
    'contraste': 'contrast',
    'saturación': 'saturation',
    'tono': 'hue',
    'sombra': 'shadow',
    'reflejo': 'reflection',
    'textura': 'texture',
    'patrón': 'pattern',
    'degradado': 'gradient',
    'efecto': 'effect',
    'filtro': 'filter',
    'marco': 'frame',
    'borde': 'border',
    'collage': 'collage',
    'mosaico': 'mosaic',
    'ilustración': 'illustration',
    'realista': 'realistic',
    'artístico': 'artistic',
    'abstracto': 'abstract',
    'cartoon': 'cartoon',
    'caricatura': 'cartoon',
    'cómic': 'comic',
    'dibujo': 'drawing',
    'acuarela': 'watercolor',
    'óleo': 'oil painting',
    'paisaje': 'landscape',
    'retrato': 'portrait',
    'silueta': 'silhouette',
    'miniatura': 'thumbnail',
    'panorámica': 'panoramic',
    'blanco y negro': 'black and white',
    'sepia': 'sepia',
    'vintage': 'vintage',
    'retro': 'retro',
    'futurista': 'futuristic',
    'hiperrealista': 'hyperrealistic',
    'surrealista': 'surrealistic',
    'minimalista': 'minimalist',
    'estilizado': 'stylized',
    'baja resolución': 'low resolution',
    'alta resolución': 'high resolution',
    'hdr': 'hdr',
    'baja calidad': 'low quality',
    'alta calidad': 'high quality',
  };
  
  // Convertir a minúsculas para la comparación
  let lowerPrompt = prompt.toLowerCase();
  
  // Reemplazar palabras conocidas
  for (const [spanish, english] of Object.entries(translations)) {
    // Usar regex para reemplazar palabras completas
    const regex = new RegExp(`\\b${spanish}\\b`, 'gi');
    lowerPrompt = lowerPrompt.replace(regex, english);
  }
  
  // Mantener mayúsculas/minúsculas originales mientras sea posible
  // pero asegurarnos de que la traducción se aplicó
  return `${lowerPrompt} (Original Spanish prompt: ${prompt})`;
};

export default function Home() {
  const [uploadedImages, setUploadedImages] = useState<string[] | null>(null);
  const [imageMasks, setImageMasks] = useState<Record<number, string>>({});
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const promptInputRef = useRef<PromptInputRef>(null);

  const handleImagesUpload = (images: string[], masks?: Record<number, string>) => {
    setUploadedImages(images);
    if (masks) {
      setImageMasks(masks);
    }
    setGeneratedImage(null);
  };

  const handleReset = () => {
    // Limpiar estados
    setUploadedImages(null);
    setImageMasks({});
    setGeneratedImage(null);
    
    // Limpiar el prompt
    if (promptInputRef.current) {
      promptInputRef.current.clearPrompt();
    }
    
    // Limpiar caché del modelo de Gemini
    clearModelCache();
    
    // Notificar al usuario que se está reiniciando
    toast.success('Reiniciando completamente la aplicación...');
    
    // Forzar la recarga de la página después de un breve retraso
    // Esto eliminará cualquier caché en memoria
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!uploadedImages || uploadedImages.length === 0) {
      toast.error('Por favor, sube al menos una imagen');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar que las imágenes estén en el orden correcto
      let processedImages = [...uploadedImages];
      
      // Comprobar si hay máscaras definidas
      const hasMasks = Object.keys(imageMasks).length > 0;
      
      // Si hay máscaras, mostrar un mensaje indicando que se están usando
      if (hasMasks) {
        toast.loading('Generando imagen con máscaras seleccionadas...', { id: 'generating-image' });
      } else {
        toast.loading('Generando imagen en alta calidad...', { id: 'generating-image' });
      }
      
      // Traducir el prompt a inglés para mejorar los resultados
      const translatedPrompt = translateToEnglish(prompt);
      console.log('Prompt original:', prompt);
      console.log('Prompt traducido:', translatedPrompt);
      
      // Intentar generar la imagen
      let result;
      try {
        result = await generateHighQualityImage(processedImages, translatedPrompt, hasMasks ? imageMasks : undefined);
      } catch (highQualityError) {
        console.warn('Error con el método de alta calidad:', highQualityError);
        
        // Mensaje más específico si hay máscaras
        if (hasMasks) {
          toast.loading('Error con las máscaras, intentando método alternativo...', { id: 'generating-image' });
        } else {
          toast.loading('Utilizando método alternativo...', { id: 'generating-image' });
        }
        
        // Si falla, usamos el método original como respaldo
        result = await generateImageFromPrompt(processedImages, translatedPrompt, hasMasks ? imageMasks : undefined);
      }
      
      // Cerrar el toast de carga
      toast.dismiss('generating-image');
      
      if (result) {
        // Verificar si la respuesta es una imagen en base64 o convertirla a URL de datos
        let imageUrl = result;
        if (!result.startsWith('data:image')) {
          // Si no es una URL de datos, intentamos tratarla como base64
          imageUrl = `data:image/jpeg;base64,${result}`;
        }
        
        setGeneratedImage(imageUrl);
        toast.success('¡Imagen generada exitosamente!');
        
        // Limpiar las máscaras ya que se han usado
        if (hasMasks) {
          setImageMasks({});
        }
      } else {
        toast.error('No se pudo generar la imagen, intenta con otro prompt');
      }
    } catch (error) {
      console.error('Error al generar la imagen:', error);
      
      // Mensajes de error específicos según el error
      if (error instanceof Error) {
        if (error.message.includes("timeout") || error.message.includes("timed out")) {
          toast.error('La generación tardó demasiado tiempo. Intenta con un prompt más simple o sin máscaras.');
        } else if (error.message.includes("rate limit") || error.message.includes("ratelimit")) {
          toast.error('Has excedido el límite de solicitudes. Espera un momento e intenta de nuevo.');
        } else if (error.message.includes("content filtered") || error.message.includes("safety")) {
          toast.error('Tu solicitud fue filtrada por políticas de contenido. Modifica tu prompt e intenta de nuevo.');
        } else {
          toast.error(`Error: ${error.message}`);
        }
      } else {
        toast.error('Ocurrió un error desconocido. Intenta de nuevo más tarde.');
      }
      
      // Cerrar el toast de carga si aún está activo
      toast.dismiss('generating-image');
    } finally {
      setIsLoading(false);
      
      // Limpiar el caché del modelo para evitar problemas en futuras generaciones
      try {
        // Una versión más segura que no intenta reasignar constantes
        if (typeof window !== 'undefined') {
          // Generar un nuevo ID de sesión para evitar caché en la próxima solicitud
          const newSessionId = `session_${Date.now()}`;
          sessionStorage.setItem('gemini_session_id', newSessionId);
          console.log('Nuevo ID de sesión generado para la próxima solicitud:', newSessionId);
          
          // Limpiar posibles datos persistentes
          sessionStorage.removeItem('gemini_last_prompt');
          sessionStorage.removeItem('gemini_last_response');
          sessionStorage.removeItem('gemini_context');
        }
      } catch (e) {
        console.warn('No se pudo actualizar el ID de sesión:', e);
      }
    }
  };

  const handleEditGeneratedImage = () => {
    if (!generatedImage) return;
    
    // Extraer el base64 de la URL de datos
    let base64Data = generatedImage;
    if (generatedImage.startsWith('data:')) {
      base64Data = generatedImage.split(',')[1];
    }
    
    // Usar la imagen generada como la nueva imagen principal
    setUploadedImages([base64Data]);
    
    // Limpiar máscaras
    setImageMasks({});
    
    // Notificar al usuario
    toast.success('Imagen lista para editar. Escribe un nuevo prompt para continuar.');
  };

  const handleRegenerateImage = async () => {
    if (!promptInputRef.current || !uploadedImages || uploadedImages.length === 0) return;
    
    const currentPrompt = promptInputRef.current.getCurrentPrompt();
    
    if (!currentPrompt.trim()) {
      toast.error('Por favor, escribe un prompt para regenerar la imagen');
      return;
    }
    
    // Mostrar mensaje de regeneración
    toast.loading('Regenerando imagen con el mismo prompt...', { id: 'regenerating' });
    
    setIsLoading(true);
    try {
      // Verificar que las imágenes estén en el orden correcto
      let processedImages = [...uploadedImages];
      
      // Comprobar si hay máscaras definidas
      const hasMasks = Object.keys(imageMasks).length > 0;
      
      // Primero intentamos con el método de alta calidad
      let result;
      try {
        result = await generateHighQualityImage(processedImages, currentPrompt, hasMasks ? imageMasks : undefined);
      } catch (highQualityError) {
        console.warn('Error con el método de alta calidad, utilizando método estándar:', highQualityError);
        // Si falla, usamos el método original como respaldo
        result = await generateImageFromPrompt(processedImages, currentPrompt, hasMasks ? imageMasks : undefined);
      }
      
      // Verificar si la respuesta es una imagen en base64 o convertirla a URL de datos
      let imageUrl = result;
      if (!result.startsWith('data:image')) {
        // Si no es una URL de datos, intentamos tratarla como base64
        imageUrl = `data:image/jpeg;base64,${result}`;
      }
      
      setGeneratedImage(imageUrl);
      toast.success('¡Imagen regenerada exitosamente!');
    } catch (error) {
      console.error('Error al regenerar la imagen:', error);
      toast.error('Error al regenerar la imagen. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
      // Cerrar el toast de regeneración
      toast.dismiss('regenerating');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <Toaster position="top-right" />
      
      {/* Fondo con formas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute top-1/4 -left-24 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto py-6 sm:py-10 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="relative text-4xl sm:text-5xl font-extrabold mb-4 md:mb-6 tracking-tight">
            <span className="title-gradient">Generador de Imágenes con IA</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-700 max-w-3xl mx-auto font-medium">
            Transforma tus imágenes utilizando inteligencia artificial. 
            Sube hasta 3 imágenes y describe los cambios que deseas aplicar.
          </p>
          <div className="mt-6">
            <button 
              onClick={handleReset}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform transition-transform hover:scale-105"
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
              Reiniciar todo
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-indigo-100/50 transform transition-all hover:shadow-indigo-200/40">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                  1
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Sube tus imágenes
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-5 ml-14">
                La <span className="font-bold text-indigo-600">primera imagen</span> es la que será modificada según tus instrucciones. Las demás imágenes servirán como referencia.
              </p>
              <ImageUploader 
                onImagesUpload={handleImagesUpload} 
                uploadedImages={uploadedImages}
              />
              
              {Object.keys(imageMasks).length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center text-green-700">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Máscaras de selección aplicadas: {Object.keys(imageMasks).length}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1 ml-7">
                    Las áreas seleccionadas en rojo serán las únicas modificadas o tomadas como referencia.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-indigo-100/50 transform transition-all hover:shadow-indigo-200/40">
              <div className="flex items-center mb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                  2
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Describe la transformación
                </h2>
              </div>
              <PromptInput 
                ref={promptInputRef}
                onSubmit={handlePromptSubmit} 
                isLoading={isLoading} 
              />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-indigo-100/50 transform transition-all hover:shadow-indigo-200/40">
            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-7 w-7 mr-2 text-indigo-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              Resultado
            </h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-200 opacity-25"></div>
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-t-4 border-l-4 border-indigo-600 animate-spin"></div>
                  </div>
                  <p className="mt-6 text-indigo-700 font-medium">Creando tu imagen mágica...</p>
                </div>
              </div>
            ) : generatedImage ? (
              <GeneratedImage 
                imageUrl={generatedImage} 
                onEditImage={handleEditGeneratedImage}
                onRegenerateImage={handleRegenerateImage}
              />
            ) : (
              <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border-2 border-dashed border-indigo-200">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-indigo-300 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p className="text-indigo-600 font-medium text-lg">
                  Tu imagen transformada aparecerá aquí
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Sube una imagen y describe cómo quieres transformarla
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="footer-text-subtle">
            Crea y edita imágenes fácilmente con inteligencia artificial.
            Esta aplicación utiliza la tecnología de Google y desarrollado por Luis GHS
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
          letter-spacing: 0.5px;
        }
        
        .title-text {
          -webkit-text-stroke: 0.7px rgba(79, 70, 229, 0.2); /* Indigo color with low opacity */
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          letter-spacing: -0.5px;
          padding-bottom: 4px; /* Space for the descenders like 'g' */
        }
        
        .title-gradient {
          background: linear-gradient(to right, #4f46e5, #9333ea); /* from-indigo-600 to-purple-600 */
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1));
          -webkit-text-fill-color: transparent;
          -webkit-box-decoration-break: clone;
          position: relative;
          padding: 0.05em 0;
          line-height: 1.2;
        }
        
        .footer-text-subtle {
          font-size: 0.9rem;
          font-weight: 500;
          position: relative;
          display: inline-block;
          padding: 0.5em 1.2em;
          letter-spacing: 0.5px;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 6px;
          border: 1px solid rgba(209, 213, 219, 0.5);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .footer-text-subtle span {
          font-weight: 600;
          color: #4f46e5;
        }
        
        @media (hover: hover) {
          .footer-text-subtle:hover {
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(79, 70, 229, 0.3);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
          }
        }
      `}</style>
    </div>
  );
}
