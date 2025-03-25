# Generador de Imágenes con IA

Una aplicación para crear y editar imágenes fácilmente utilizando inteligencia artificial.

## Características

- Generación de imágenes basada en prompts en español
- Soporte para múltiples imágenes de entrada
- Capacidad para usar máscaras para ediciones selectivas
- Traducción automática de prompts al inglés para mejorar resultados
- Alta calidad de generación con preservación de detalles

## Tecnologías utilizadas

- Next.js 15
- React 19
- Tailwind CSS
- Google Gemini API
- TypeScript

## Requisitos previos

- Node.js 18.17.0 o superior
- NPM o Yarn
- Una API key de Google Gemini

## Configuración local

1. Clona este repositorio
   ```bash
   git clone https://tu-repositorio.git
   cd generador-de-imagenes
   ```

2. Instala las dependencias
   ```bash
   npm install
   # o
   yarn install
   ```

3. Crea un archivo `.env.local` en la raíz del proyecto con tu API key de Google Gemini
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui
   ```

4. Inicia el servidor de desarrollo
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Despliegue en Vercel

Esta aplicación está optimizada para ser desplegada en la plataforma Vercel. 

### Pasos para desplegar:

1. Crea una cuenta en [Vercel](https://vercel.com) si aún no tienes una

2. Instala la CLI de Vercel (opcional)
   ```bash
   npm install -g vercel
   ```

3. Configura las variables de entorno en Vercel:
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Tu API key de Google Gemini

4. Despliega usando Git:
   - Conecta tu repositorio GitHub/GitLab/Bitbucket en el dashboard de Vercel
   - Configura tu proyecto y las variables de entorno
   - Haz clic en "Deploy"

   O usando la CLI de Vercel:
   ```bash
   vercel
   ```

5. Para producción:
   ```bash
   vercel --prod
   ```

## Uso

1. Sube una o más imágenes (hasta 3)
2. Opcionalmente, marca áreas específicas usando el pincel rojo
3. Escribe un prompt en español describiendo la transformación deseada
4. Haz clic en "Generar" y espera el resultado
5. Puedes regenerar o editar la imagen resultante

## Desarrollado por

Luis GHS

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
