import { GoogleGenerativeAI, GenerateContentResult, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Usar variables de entorno para la API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyBcYsacd3Ml2wlduHZRzkFzHLtgOcylOhQ';

export const genAI = new GoogleGenerativeAI(API_KEY);

// Almacenar instancias de modelos para poder limpiarlas
let modelInstances: any[] = [];

// Función para limpiar la memoria y reiniciar las instancias de modelos
export function clearModelCache() {
  try {
    console.log('Limpiando caché de modelos de Gemini...');
    // Limpiar array de instancias
    modelInstances = [];
    
    // Ya no intentamos reasignar genAI (¡esto causaba el error!)
    // Marcamos en sessionStorage que necesitamos un nuevo contexto
    const timestamp = Date.now();
    
    // Si estamos en el navegador, limpiar cualquier dato almacenado
    if (typeof window !== 'undefined') {
      // Guardar un identificador de sesión único para forzar nuevas solicitudes
      sessionStorage.setItem('gemini_session_id', `session_${timestamp}`);
      
      // Limpiar sessionStorage y localStorage relacionados con contexto
      sessionStorage.removeItem('gemini_last_prompt');
      sessionStorage.removeItem('gemini_last_response');
      sessionStorage.removeItem('gemini_context');
      
      localStorage.removeItem('gemini_recent_prompts');
      localStorage.removeItem('gemini_image_cache');
      localStorage.removeItem('gemini_instructions');
      
      // Limpiar cualquier caché del navegador relacionada con API
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('gemini') || name.includes('generative')) {
              caches.delete(name);
            }
          });
        });
      }
      
      // También puedes agregar un método para limpiar desde window
      (window as any).clearGeminiCache = clearModelCache;
    }
    
    return true;
  } catch (error) {
    console.error('Error al limpiar caché de modelos:', error);
    return false;
  }
}

// Exponer la función de limpieza al objeto window si estamos en el navegador
if (typeof window !== 'undefined') {
  (window as any).genAI = genAI;
  (window as any).genAI.clearCache = clearModelCache;
}

// Función para obtener un modelo con un ID de sesión único si está disponible
function getSessionAwareModel(modelName: string) {
  // Obtener el ID de sesión si existe
  const timestamp = Date.now().toString();
  
  // Simplemente usar el modelo estándar, pero guardarlo en nuestro array para referencia
  const model = genAI.getGenerativeModel({ 
    model: modelName 
  });
  
  // Guardar la instancia para referencia futura
  modelInstances.push(model);
  
  // Forzar una nueva instancia cada vez agregando un timestamp al log
  console.log(`Creando nueva instancia de modelo ${modelName} [${timestamp}]`);
  
  return model;
}

export async function generateImageFromPrompt(
  imageData: string[] | string,
  prompt: string,
  masks?: Record<number, string>
): Promise<string> {
  try {
    // Verificar si el prompt contiene referencias a águilas o aves
    // y solo proceder si el usuario lo ha solicitado explícitamente
    const eagleRelatedTerms = ['aguila', 'águila', 'eagle', 'hawk', 'ave', 'bird', 'pájaro', 'pajaro'];
    const promptLowerCase = prompt.toLowerCase();
    
    const containsEagleTerms = eagleRelatedTerms.some(term => promptLowerCase.includes(term));
    
    // Si el prompt NO contiene referencias a águilas, asegurarse de que no se generen
    if (!containsEagleTerms) {
      prompt = `${prompt} (NO incluir ni añadir águilas, aves, ni pájaros de ningún tipo, a menos que yo lo pida explícitamente)`;
    }
    
    // Forzar que cada solicitud sea única añadiendo un timestamp
    const uniquePrompt = `${prompt} (UID: ${Date.now()})`;
    console.log('Enviando prompt único:', uniquePrompt);
    
    // Obtener el modelo específico para generación de imágenes con conciencia de sesión
    const model = getSessionAwareModel('gemini-2.0-flash-exp-image-generation');
    
    // Comprobar si hay máscaras definidas para ajustar los parámetros
    const hasMasks = masks && Object.keys(masks).length > 0;
    
    // Crear la configuración con responseModalities - OPTIMIZADA PARA CALIDAD
    const generationConfig = {
      responseModalities: ['Text', 'Image'],
      temperature: hasMasks ? 0.1 : 0.2,  // Temperatura más baja con máscaras para mayor precisión
      topP: hasMasks ? 0.7 : 0.8,         // Ajustado para máscaras
      topK: hasMasks ? 20 : 35,           // Reducido para máscaras para mayor fidelidad
      maxOutputTokens: 8192
    };
    
    // Configuración de seguridad
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    
    // Preparar las solicitudes basadas en la cantidad de imágenes
    let contents = [];
    
    if (Array.isArray(imageData) && imageData.length > 1) {
      // Tener múltiples imágenes - usamos un enfoque basado en roles similar al ejemplo en Python
      
      // Primera solicitud: Usuario enviando la imagen principal a modificar
      let mainImageText = `This is the main image I want to modify according to the following instructions: ${uniquePrompt}. 
IMPORTANT - QUALITY AND PRECISION REQUIREMENTS:
1. Maintain the original quality throughout the ENTIRE image.
2. Preserve with extreme precision facial features if there are people. Eyes, nose, mouth, and facial proportions must remain exactly as in the original.
3. Avoid any deformation, especially in features like eyes.
4. Preserve the sharpness, definition, texture, and resolution of the original image.
5. DO NOT apply smoothing or compression to the image.
6. Maintain EXACTLY the same color values, brightness, contrast, and saturation as the original.
7. CRITICAL: Ensure that each added element maintains its natural and original color in ALL generations, without variation between attempts.`;
      
      // Si hay una máscara para la imagen principal, mencionarla en el texto
      if (masks && masks[0]) {
        mainImageText += " IMPORTANT: I have selected specific areas in red in this image that I want you to modify. Please apply your changes ONLY to these selected areas and keep the rest of the image intact. CRITICAL: Maintain the same quality and sharpness throughout the ENTIRE image, including in unmodified areas.";
      }
      
      contents.push({
        role: 'user',
        parts: [
          { text: mainImageText },
          {
            inlineData: {
              data: imageData[0],
              mimeType: 'image/jpeg',
            }
          }
        ]
      });
      
      // Si hay una máscara para la imagen principal, la enviamos también
      if (masks && masks[0]) {
        contents.push({
          role: 'user',
          parts: [
            {
              text: `Esta es la máscara para la imagen principal. Las áreas en rojo indican dónde debes aplicar los cambios solicitados. Mantén intactas las áreas que no están marcadas en rojo.`
            },
            {
              inlineData: {
                data: masks[0].split(',')[1], // Eliminar el prefijo data:image/png;base64,
                mimeType: 'image/png',
              }
            }
          ]
        });
      }
      
      // Segundo contenido: Para cada imagen de referencia
      for (let i = 1; i < imageData.length; i++) {
        let refImageText = `Esta es una imagen de referencia #${i}. Puedes usarla como inspiración para la modificación.`;
        
        // Si hay una máscara para esta imagen de referencia, mencionarla en el texto
        if (masks && masks[i]) {
          refImageText += ` He seleccionado áreas específicas en rojo en esta imagen de referencia. Por favor, toma SOLO estas áreas seleccionadas como referencia para aplicarlas a la imagen principal.`;
        }
        
        contents.push({
          role: 'user',
          parts: [
            { text: refImageText },
            {
              inlineData: {
                data: imageData[i],
                mimeType: 'image/jpeg',
              }
            }
          ]
        });
        
        // Si hay una máscara para esta imagen de referencia, la enviamos también
        if (masks && masks[i]) {
          contents.push({
            role: 'user',
            parts: [
              {
                text: `Esta es la máscara para la imagen de referencia #${i}. Las áreas en rojo indican las partes que quiero que tomes como referencia para aplicar a la imagen principal.`
              },
              {
                inlineData: {
                  data: masks[i].split(',')[1], // Eliminar el prefijo data:image/png;base64,
                  mimeType: 'image/png',
                }
              }
            ]
          });
        }
      }
      
      // Solicitud final con instrucciones específicas
      let finalInstructions = `Instrucciones finales: ${uniquePrompt}. IMPORTANTE: Modifica ÚNICAMENTE la PRIMERA imagen que te mostré, aplicando los cambios solicitados. NO modifiques las imágenes de referencia. Las imágenes de referencia son solo para inspiración o fuente de elementos si el prompt lo requiere.`;
      
      // Si hay máscaras, enfatizar su uso
      if (masks && Object.keys(masks).length > 0) {
        finalInstructions += ` Recuerda respetar las máscaras proporcionadas. Solo modifica las áreas marcadas en rojo en la imagen principal, y solo toma como referencia las áreas marcadas en rojo en las imágenes de referencia. IMPORTANTE: Mantén la misma calidad, nitidez y resolución en TODA la imagen, tanto en áreas modificadas como en el resto de la imagen.`;
      }
      
      contents.push({
        role: 'user',
        parts: [
          { text: finalInstructions }
        ]
      });
    } else {
      // Solo una imagen - enfoque simple
      const singleImage = Array.isArray(imageData) ? imageData[0] : imageData;
      
      let mainImageText = `Modify this image according to the following instructions exactly: ${uniquePrompt}. 
IMPORTANT - QUALITY AND PRECISION REQUIREMENTS:
1. Maintain the original quality throughout the ENTIRE image.
2. Preserve with extreme precision facial features if there are people. Eyes, nose, mouth, and facial proportions must remain exactly as in the original.
3. Avoid any deformation, especially in features like eyes.
4. Preserve the sharpness, definition, texture, and resolution of the original image.
5. DO NOT apply smoothing or compression to the image.
6. Maintain EXACTLY the same color values, brightness, contrast, and saturation as the original.
7. CRITICAL: Ensure that each added element maintains its natural and original color in ALL generations, without variation between attempts.`;
      
      // Si hay una máscara para la imagen, mencionarla en el texto
      if (masks && masks[0]) {
        mainImageText += ` IMPORTANT: I have selected specific areas in red in this image that I want you to modify. Please apply your changes ONLY to these selected areas and keep the rest of the image intact. CRITICAL: Maintain the same quality and sharpness throughout the ENTIRE image, including in unmodified areas.`;
      }
      
      contents.push({
        role: 'user',
        parts: [
          { text: mainImageText },
          {
            inlineData: {
              data: singleImage,
              mimeType: 'image/jpeg',
            }
          }
        ]
      });
      
      // Si hay una máscara para la imagen, la enviamos también
      if (masks && masks[0]) {
        console.log("Procesando máscara para la imagen principal...");
        
        try {
          // Verificar si la máscara es válida
          const maskData = masks[0].split(',')[1]; // Eliminar el prefijo data:image/png;base64,
          if (!maskData || maskData.trim() === '') {
            console.warn("La máscara parece estar vacía o no válida");
          } else {
            console.log("Máscara válida encontrada, longitud:", maskData.length);
            
            contents.push({
              role: 'user',
              parts: [
                {
                  text: `MASK INSTRUCTIONS:
This image is a MASK that indicates EXACTLY where to apply changes.
1. ONLY modify the areas marked in RED
2. The RED color in the mask SHOULD NOT appear in the final image
3. RED only indicates where to apply the requested changes, NOT a color to include
4. Any area NOT in RED must remain EXACTLY the same as the original image
5. This mask is ONLY a guide, it should not influence the final colors
6. Within the masked areas, apply ONLY the change: "${prompt}"
7. Respect 100% the areas outside the mask, keeping them identical to the original
8. CRITICAL: Maintain the SAME QUALITY, RESOLUTION and SHARPNESS in the ENTIRE image, both in the modified areas and outside them
9. DO NOT reduce the quality of any part of the image, either inside or outside the masked areas
10. DO NOT apply blur, defocus or smoothing effects to any part of the image`
                },
                {
                  inlineData: {
                    data: maskData,
                    mimeType: 'image/png',
                  }
                }
              ]
            });
          }
        } catch (maskError) {
          console.error("Error al procesar la máscara:", maskError);
        }
      }
    }
    
    console.log(`Enviando solicitud con ${contents.length} contenidos a Gemini`);
    
    // Instrucción final para preservar calidad
    contents.push({
      role: 'user',
      parts: [
        { 
          text: `FINAL INSTRUCTIONS:
1. Generate a modified version of the image EXACTLY like the original but applying the requested changes: "${uniquePrompt}"
2. Maintain the complete original resolution (same dimensions, no reduction)
3. Preserve all fine details, textures and sharpness of the original image
4. Do not introduce compression artifacts, blur or smoothing${masks && masks[0] ? `
5. ONLY modify the areas marked in RED in the mask
6. The RED color from the mask MUST NOT appear in the final image
7. Areas outside the red mask must remain IDENTICAL to the original 
8. CRITICAL - HIGH QUALITY: Maintain exactly the same quality, sharpness and texture in both the modified areas and the rest of the image
9. DO NOT apply any kind of blur or quality reduction to any part of the image` : ''}
10. CRITICAL - COLOR CONSISTENCY: The RGB values, hue, saturation and brightness of each element must be EXACTLY the same between generations
11. If you add elements, make sure they maintain their natural colors with consistent and realistic RGB values
12. APPLY EXACTLY what the prompt asks for, no more, no less.
13. IMPORTANT NOTE ABOUT LANGUAGE: If you see "(Original Spanish prompt: [text])" at the end of the prompt, make sure to understand that the user's original request was in Spanish. Make sure to fulfill the intent of both the Spanish text and its English translation.`
        }
      ]
    });
    
    // Generar contenido con la nueva estructura
    const result = await model.generateContent({
      contents: contents,
      generationConfig,
      safetySettings
    });
    
    const response = await result.response;
    
    // Verificar si hay partes en la respuesta
    if (response.candidates && 
        response.candidates[0] && 
        response.candidates[0].content && 
        response.candidates[0].content.parts) {
      
      // Buscar la parte que contiene la imagen
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          // Estandarizar colores antes de devolver el resultado final
          const generatedImageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log("Gemini devolvió una imagen modificada, estandarizando colores");
          
          try {
            // Aplicar estandarización de colores para asegurar consistencia
            return await standardizeColors(generatedImageData);
          } catch (colorError) {
            console.error("Error al estandarizar colores:", colorError);
            // Si hay error en la estandarización, devolver la imagen original de Gemini
            return generatedImageData;
          }
        }
      }
    }
    
    // Si llegamos aquí, Gemini no devolvió una imagen, usar procesamiento local
    console.log("Gemini no devolvió una imagen, usando procesamiento local");
    
    // Procesar la imagen localmente basado en palabras clave en el prompt
    const promptLower = prompt.toLowerCase();
    
    // Extraer la imagen principal para aplicar efectos locales
    const mainImage = Array.isArray(imageData) ? imageData[0] : imageData;
    const mainMask = masks && masks[0] ? masks[0] : null;
    
    // Blanco y Negro
    if (promptLower.includes('blanco y negro') || 
        promptLower.includes('blanquinegro') || 
        promptLower.includes('b&n') ||
        promptLower.includes('blanco negro') ||
        promptLower.includes('escala de grises')) {
      return await convertToBlackAndWhite(mainImage, mainMask);
    }
    
    // Invertir colores
    if (promptLower.includes('invertir') || 
        promptLower.includes('negativo') || 
        promptLower.includes('invert')) {
      return await invertColors(mainImage, mainMask);
    }
    
    // Sepia
    if (promptLower.includes('sepia') || 
        promptLower.includes('vintage') || 
        promptLower.includes('retro')) {
      return await applySepia(mainImage, mainMask);
    }
    
    // Aumentar saturación
    if (promptLower.includes('saturar') || 
        promptLower.includes('saturación') || 
        promptLower.includes('colorido') ||
        promptLower.includes('vívido')) {
      return await adjustSaturation(mainImage, 1.5, mainMask); // Aumentar saturación
    }
    
    // Reducir saturación
    if (promptLower.includes('desaturar') || 
        promptLower.includes('apagado') || 
        promptLower.includes('menos color')) {
      return await adjustSaturation(mainImage, 0.5, mainMask); // Reducir saturación
    }
    
    // Si no identificamos el efecto específico, devolvemos la imagen original
    console.log("No se pudo identificar un efecto específico en el prompt:", prompt);
    return `data:image/jpeg;base64,${mainImage}`;
  } catch (error) {
    console.error('Error al generar la imagen:', error);
    throw error;
  }
}

// Función para convertir una imagen a blanco y negro
function convertToBlackAndWhite(base64Image: string, maskData?: string | null): Promise<string> {
  return processImageWithCanvas(base64Image, async (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Si tenemos una máscara, la cargamos
    let maskImageData: ImageData | null = null;
    if (maskData) {
      maskImageData = await getMaskImageData(maskData, width, height);
    }
    
    // Convertir a escala de grises
    for (let i = 0; i < data.length; i += 4) {
      // Si hay una máscara, verificamos si debemos procesar este píxel
      if (maskImageData) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const maskIndex = (y * width + x) * 4;
        
        // Solo procesamos píxeles dentro de la máscara (áreas rojas)
        // Usando el mismo criterio mejorado para detectar rojo
        if (maskImageData.data[maskIndex] > 180 && 
            maskImageData.data[maskIndex+1] < 80 && 
            maskImageData.data[maskIndex+2] < 80 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+1] * 2 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+2] * 2) {
          const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
          data[i] = gray;     // Rojo
          data[i + 1] = gray; // Verde
          data[i + 2] = gray; // Azul
        }
      } else {
        // Sin máscara, procesamos toda la imagen
        const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        data[i] = gray;     // Rojo
        data[i + 1] = gray; // Verde
        data[i + 2] = gray; // Azul
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  });
}

// Función para invertir los colores de una imagen
function invertColors(base64Image: string, maskData?: string | null): Promise<string> {
  return processImageWithCanvas(base64Image, async (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Si tenemos una máscara, la cargamos
    let maskImageData: ImageData | null = null;
    if (maskData) {
      maskImageData = await getMaskImageData(maskData, width, height);
    }
    
    // Invertir colores (255 - valor)
    for (let i = 0; i < data.length; i += 4) {
      // Si hay una máscara, verificamos si debemos procesar este píxel
      if (maskImageData) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const maskIndex = (y * width + x) * 4;
        
        // Solo procesamos píxeles dentro de la máscara (áreas rojas)
        // Usando el mismo criterio mejorado para detectar rojo
        if (maskImageData.data[maskIndex] > 180 && 
            maskImageData.data[maskIndex+1] < 80 && 
            maskImageData.data[maskIndex+2] < 80 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+1] * 2 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+2] * 2) {
          data[i] = 255 - data[i];         // Rojo
          data[i + 1] = 255 - data[i + 1]; // Verde
          data[i + 2] = 255 - data[i + 2]; // Azul
        }
      } else {
        // Sin máscara, procesamos toda la imagen
        data[i] = 255 - data[i];         // Rojo
        data[i + 1] = 255 - data[i + 1]; // Verde
        data[i + 2] = 255 - data[i + 2]; // Azul
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  });
}

// Función para aplicar efecto sepia
function applySepia(base64Image: string, maskData?: string | null): Promise<string> {
  return processImageWithCanvas(base64Image, async (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Si tenemos una máscara, la cargamos
    let maskImageData: ImageData | null = null;
    if (maskData) {
      maskImageData = await getMaskImageData(maskData, width, height);
    }
    
    // Aplicar efecto sepia
    for (let i = 0; i < data.length; i += 4) {
      // Si hay una máscara, verificamos si debemos procesar este píxel
      if (maskImageData) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const maskIndex = (y * width + x) * 4;
        
        // Solo procesamos píxeles dentro de la máscara (áreas rojas)
        // Usando el mismo criterio mejorado para detectar rojo
        if (maskImageData.data[maskIndex] > 180 && 
            maskImageData.data[maskIndex+1] < 80 && 
            maskImageData.data[maskIndex+2] < 80 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+1] * 2 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+2] * 2) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Rojo
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Verde
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Azul
        }
      } else {
        // Sin máscara, procesamos toda la imagen
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Rojo
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Verde
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Azul
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  });
}

// Función para ajustar la saturación de una imagen
function adjustSaturation(base64Image: string, saturationFactor: number, maskData?: string | null): Promise<string> {
  return processImageWithCanvas(base64Image, async (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Si tenemos una máscara, la cargamos
    let maskImageData: ImageData | null = null;
    if (maskData) {
      maskImageData = await getMaskImageData(maskData, width, height);
    }
    
    for (let i = 0; i < data.length; i += 4) {
      // Si hay una máscara, verificamos si debemos procesar este píxel
      if (maskImageData) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const maskIndex = (y * width + x) * 4;
        
        // Solo procesamos píxeles dentro de la máscara (áreas rojas)
        // Usando el mismo criterio mejorado para detectar rojo
        if (maskImageData.data[maskIndex] > 180 && 
            maskImageData.data[maskIndex+1] < 80 && 
            maskImageData.data[maskIndex+2] < 80 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+1] * 2 &&
            maskImageData.data[maskIndex] > maskImageData.data[maskIndex+2] * 2) {
          // Convertir RGB a HSL
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h, s, l = (max + min) / 2;
          
          if (max === min) {
            h = s = 0; // Acromático
          } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
              default: h = 0;
            }
            
            h /= 6;
          }
          
          // Ajustar saturación
          s = Math.max(0, Math.min(1, s * saturationFactor));
          
          // Convertir HSL a RGB
          let r1, g1, b1;
          
          if (s === 0) {
            r1 = g1 = b1 = l; // Acromático
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r1 = hueToRgb(p, q, h + 1/3);
            g1 = hueToRgb(p, q, h);
            b1 = hueToRgb(p, q, h - 1/3);
          }
          
          // Guardar valores RGB
          data[i] = r1 * 255;
          data[i + 1] = g1 * 255;
          data[i + 2] = b1 * 255;
        }
      } else {
        // Procesamiento sin máscara, mantener como está
        // Convertir RGB a HSL
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
          h = s = 0; // Acromático
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0;
          }
          
          h /= 6;
        }
        
        // Ajustar saturación
        s = Math.max(0, Math.min(1, s * saturationFactor));
        
        // Convertir HSL a RGB
        let r1, g1, b1;
        
        if (s === 0) {
          r1 = g1 = b1 = l; // Acromático
        } else {
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          
          r1 = hueToRgb(p, q, h + 1/3);
          g1 = hueToRgb(p, q, h);
          b1 = hueToRgb(p, q, h - 1/3);
        }
        
        // Guardar valores RGB
        data[i] = r1 * 255;
        data[i + 1] = g1 * 255;
        data[i + 2] = b1 * 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  });
}

// Función auxiliar para convertir de HSL a RGB
function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

// Función auxiliar para cargar una máscara y obtener sus datos de imagen
function getMaskImageData(maskData: string, width: number, height: number): Promise<ImageData | null> {
  if (typeof document === 'undefined') {
    console.error('No se puede cargar la máscara en un entorno sin DOM');
    return Promise.resolve(null);
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('No se pudo obtener el contexto de renderizado 2D');
      return Promise.resolve(null);
    }
    
    const img = new Image();
    img.src = maskData;
    
    // Crear función de carga síncrona para garantizar que la imagen está cargada
    return new Promise<ImageData>((resolve, reject) => {
      img.onload = () => {
        // Dibujar la máscara en un canvas temporal
        ctx.drawImage(img, 0, 0, width, height);
        
        // Obtener los datos de la imagen de la máscara
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Mejorar la visibilidad de las máscaras rojas
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Si es un píxel rojizo, aumentar su intensidad para mejor detección
          if (data[i] > 180 && data[i+1] < 80 && data[i+2] < 80 && 
              data[i] > data[i+1] * 2 && data[i] > data[i+2] * 2) {
            data[i] = 255;      // Rojo al máximo
            data[i+1] = 0;      // Verde al mínimo
            data[i+2] = 0;      // Azul al mínimo
            data[i+3] = 255;    // Opacidad completa
          } else if (data[i+3] > 0) { // Para los no-rojos con transparencia
            // Hacer más blancos los píxeles no-rojos
            data[i] = Math.min(255, data[i] + 50);
            data[i+1] = Math.min(255, data[i+1] + 50);
            data[i+2] = Math.min(255, data[i+2] + 50);
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(imageData);
      };
      
      img.onerror = () => {
        reject(null);
      };
    });
  } catch (error) {
    console.error('Error al procesar la máscara:', error);
    return Promise.resolve(null);
  }
}

// Función para procesar una imagen con canvas
function processImageWithCanvas(
  base64Image: string, 
  processingFunction: (ctx: CanvasRenderingContext2D, width: number, height: number) => void | Promise<void>
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      console.error('No se puede procesar la imagen en un entorno sin DOM');
      reject(new Error('No se puede procesar la imagen en un entorno sin DOM'));
      return;
    }
    
    try {
      // Obtener datos base64 sin el prefijo
      let imageData = base64Image;
      if (base64Image.includes(',')) {
        imageData = base64Image.split(',')[1];
      }
      
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto de renderizado 2D'));
          return;
        }
        
        // Dibujar la imagen original en el canvas
        ctx.drawImage(img, 0, 0);
        
        // Aplicar la función de procesamiento (ahora puede ser async)
        try {
          await processingFunction(ctx, img.width, img.height);
          // Devolver la imagen procesada como URL de datos
          resolve(canvas.toDataURL('image/jpeg', 0.98));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      // Establecer la fuente de la imagen
      img.src = base64Image.startsWith('data:') 
        ? base64Image 
        : `data:image/jpeg;base64,${base64Image}`;
    } catch (error) {
      console.error('Error en processImageWithCanvas:', error);
      reject(error);
    }
  });
}

// Nueva función para normalizar y estandarizar los valores de color RGB
function standardizeColors(base64Image: string, colorMap?: Map<string, number[]>): Promise<string> {
  return processImageWithCanvas(base64Image, async (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Si no hay un mapa de colores proporcionado, analizar la imagen para crear uno
    if (!colorMap) {
      // Este paso es opcional - ajusta los colores para mayor consistencia
      // en futuras generaciones de imágenes similares
      for (let i = 0; i < data.length; i += 4) {
        // Solo procedemos si el píxel tiene opacidad
        if (data[i+3] > 200) {
          // Mejorar contraste general de la imagen
          if (data[i] > 230 && data[i+1] > 230 && data[i+2] > 230) {
            // Mejorar blancos
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
          }
          
          // Mejorar oscuros
          else if (data[i] < 80 && data[i] > 40 && 
                  data[i+1] < 60 && data[i+1] > 20 && 
                  data[i+2] < 40 && data[i+2] > 10) {
            // Tonos oscuros más definidos
            data[i] = Math.max(30, data[i] - 10);
            data[i+1] = Math.max(20, data[i+1] - 10); 
            data[i+2] = Math.max(10, data[i+2] - 10);
          }
          
          // Mejorar colores vivos
          else if (data[i] > 200 && data[i+1] > 150 && data[i+2] < 100) {
            // Amarillos y dorados más vibrantes
            data[i] = Math.min(255, data[i] + 5);
            data[i+1] = Math.min(255, data[i+1] + 5);
          }
        }
      }
    } else {
      // Si se proporciona un mapa de colores, úsalo para aplicar colores consistentes
      // (Implementación futura para casos de uso más complejos)
    }
    
    ctx.putImageData(imageData, 0, 0);
  });
}

// Función adicional inspirada en el código Python compartido
// Esta función utiliza un enfoque alternativo para preservar mejor la calidad
export async function generateHighQualityImage(
  imageData: string[] | string,
  prompt: string,
  masks?: Record<number, string>
): Promise<string> {
  // Guardamos una copia del prompt original para uso en el catch
  let uniquePrompt = `${prompt} (UID: ${Date.now()})`;
  
  try {
    // Verificar si el prompt contiene referencias a águilas o aves
    // y solo proceder si el usuario lo ha solicitado explícitamente
    const eagleRelatedTerms = ['aguila', 'águila', 'eagle', 'hawk', 'ave', 'bird', 'pájaro', 'pajaro'];
    const promptLowerCase = prompt.toLowerCase();
    
    const containsEagleTerms = eagleRelatedTerms.some(term => promptLowerCase.includes(term));
    
    // Si el prompt NO contiene referencias a águilas, asegurarse de que no se generen
    if (!containsEagleTerms) {
      prompt = `${prompt} (NO incluir ni añadir águilas, aves, ni pájaros de ningún tipo, a menos que yo lo pida explícitamente)`;
      // Actualizar el prompt único también
      uniquePrompt = `${prompt} (UID: ${Date.now()})`;
    }
    
    console.log('Enviando prompt de alta calidad único:', uniquePrompt);
    
    // Obtener el modelo específico para generación de imágenes
    const model = getSessionAwareModel('gemini-2.0-flash-exp-image-generation');
    
    // Comprobar si hay máscaras definidas para ajustar los parámetros
    const hasMasks = masks && Object.keys(masks).length > 0;
    
    // Crear la configuración optimizada para alta calidad
    const generationConfig = {
      responseModalities: ['Image', 'Text'],  // Cambiar el orden para priorizar imagen
      temperature: hasMasks ? 0.1 : 0.2,      // Menor temperatura con máscaras para exactitud
      topP: hasMasks ? 0.7 : 0.8,             // Ajustado para mejor precisión con máscaras
      topK: hasMasks ? 20 : 32,               // Reducir para máscaras para mayor fidelidad
      maxOutputTokens: 2048,                  // Más que suficiente para generación de imágenes
    };
    
    // Configuración de seguridad
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    
    // Preparar la solicitud con un formato optimizado
    let contents = [];
    
    // Procesar la imagen principal
    const singleImage = Array.isArray(imageData) ? imageData[0] : imageData;
    
    // Separar la instrucción de la calidad para hacer mayor énfasis
    let promptText = `Mi instrucción: ${uniquePrompt}`;
    
    // Instrucciones de calidad extremadamente específicas
    const qualityInstructions = `
CRITICAL QUALITY INSTRUCTIONS:
1. PRESERVE THE ORIGINAL RESOLUTION of the image - DO NOT reduce quality under any circumstances
2. DO NOT apply blur, compression, or reduction of details
3. Keep edges sharp and well-defined
4. Preserve the texture and fine details exactly as in the original
5. If there are faces, preserve with EXTREME PRECISION the facial proportions, eyes, nose, and mouth
6. CRITICAL: Maintain EXACTLY the same color palette, RGB values, saturation, and brightness of all elements
7. For any new added element, ALWAYS use the same color palette, RGB values, and tones for that element
8. DO NOT allow variations in color or tone between different generations of the same element
9. Use consistent RGB values to represent specific colors in a natural and realistic way`;
    
    // Primera parte: enviar solo la imagen original con instrucciones generales
    contents.push({
      role: 'user',
      parts: [
        { text: `${promptText}\n\n${qualityInstructions}` },
        {
          inlineData: {
            data: singleImage,
            mimeType: 'image/jpeg',
          }
        }
      ]
    });
    
    // Segunda parte: si hay máscara, enviarla en un mensaje separado con instrucciones MUY específicas
    if (masks && masks[0]) {
      console.log("Procesando máscara para la imagen principal...");
      
      try {
        // Verificar si la máscara es válida
        const maskData = masks[0].split(',')[1]; // Eliminar el prefijo data:image/png;base64,
        if (!maskData || maskData.trim() === '') {
          console.warn("La máscara parece estar vacía o no válida");
        } else {
          console.log("Máscara válida encontrada, longitud:", maskData.length);
          
          contents.push({
            role: 'user',
            parts: [
              {
                text: `MASK INSTRUCTIONS:
This image is a MASK that indicates EXACTLY where to apply changes.
1. ONLY modify the areas marked in RED
2. The RED color in the mask SHOULD NOT appear in the final image
3. RED only indicates where to apply the requested changes, NOT a color to include
4. Any area NOT in RED must remain EXACTLY the same as the original image
5. This mask is ONLY a guide, it should not influence the final colors
6. Within the masked areas, apply ONLY the change: "${prompt}"
7. Respect 100% the areas outside the mask, keeping them identical to the original
8. CRITICAL: Maintain the SAME QUALITY, RESOLUTION and SHARPNESS in the ENTIRE image, both in the modified areas and outside them
9. DO NOT reduce the quality of any part of the image, either inside or outside the masked areas
10. DO NOT apply blur, defocus or smoothing effects to any part of the image`
              },
              {
                inlineData: {
                  data: maskData,
                  mimeType: 'image/png',
                }
              }
            ]
          });
        }
      } catch (maskError) {
        console.error("Error al procesar la máscara:", maskError);
      }
    }
    
    // Instrucción final más específica para preservar calidad y manejar la máscara correctamente
    contents.push({
      role: 'user',
      parts: [
        {
          text: `FINAL INSTRUCTIONS:
1. Generate a modified version of the image EXACTLY like the original but applying the requested changes: "${uniquePrompt}"
2. Maintain the complete original resolution (same dimensions, no reduction)
3. Preserve all fine details, textures and sharpness of the original image
4. Do not introduce compression artifacts, blur or smoothing${masks && masks[0] ? `
5. ONLY modify the areas marked in RED in the mask
6. The RED color from the mask MUST NOT appear in the final image
7. Areas outside the red mask must remain IDENTICAL to the original 
8. CRITICAL - HIGH QUALITY: Maintain exactly the same quality, sharpness and texture in both the modified areas and the rest of the image
9. DO NOT apply any kind of blur or quality reduction to any part of the image` : ''}
10. CRITICAL - COLOR CONSISTENCY: The RGB values, hue, saturation and brightness of each element must be EXACTLY the same between generations
11. If you add elements, make sure they maintain their natural colors with consistent and realistic RGB values
12. APPLY EXACTLY what the prompt asks for, no more, no less.
13. IMPORTANT NOTE ABOUT LANGUAGE: If you see "(Original Spanish prompt: [text])" at the end of the prompt, make sure to understand that the user's original request was in Spanish. Make sure to fulfill the intent of both the Spanish text and its English translation.`
        }
      ]
    });
    
    console.log(`Enviando solicitud de alta calidad con ${contents.length} contenidos a Gemini`);
    
    // Generar contenido
    const result = await model.generateContent({
      contents: contents,
      generationConfig,
      safetySettings
    });
    
    const response = await result.response;
    
    // Verificar si hay partes en la respuesta
    if (response.candidates && 
        response.candidates[0] && 
        response.candidates[0].content && 
        response.candidates[0].content.parts) {
      
      // Buscar la parte que contiene la imagen
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          // Estandarizar colores antes de devolver el resultado final
          const generatedImageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log("Gemini devolvió una imagen de alta calidad, estandarizando colores");
          
          try {
            // Aplicar estandarización de colores para asegurar consistencia
            return await standardizeColors(generatedImageData);
          } catch (colorError) {
            console.error("Error al estandarizar colores:", colorError);
            // Si hay error en la estandarización, devolver la imagen original de Gemini
            return generatedImageData;
          }
        }
      }
    }
    
    // Si no se pudo generar con este método, usar el método estándar
    console.log("Método de alta calidad falló, usando método estándar");
    return generateImageFromPrompt(imageData, uniquePrompt, masks);
    
  } catch (error) {
    console.error("Error en el método de alta calidad:", error);
    // En caso de error, intentar con el método estándar
    return generateImageFromPrompt(imageData, uniquePrompt, masks);
  }
} 