# Archivo Custodes

Biblioteca local para consultar las 27 fotos facilitadas, sus transcripciones OCR y fichas resumidas de unidades y destacamentos.

## Abrir la web

Necesitas Node.js instalado. Desde esta carpeta, ejecuta:

```powershell
node server.js
```

Abre después <http://127.0.0.1:8765>.

- `index.html`: galería de fotos y búsqueda en OCR.
- `fichas.html`: fichas de unidad con perfiles, armas y habilidades.
- `destacamentos.html`: reglas, mejoras y estratagemas de los 13 destacamentos fotografiados.

El OCR se reconoce en el navegador con Tesseract.js. La primera carga de la biblioteca OCR requiere conexión a Internet. Las imágenes permanecen en esta carpeta; el texto reconocido se guarda en `ocr-data.json` cuando se usa el servidor local.

Los resúmenes y transcripciones sirven como índice de consulta. Comprueba las reglas y cifras con las imágenes originales, ya que la perspectiva y el OCR pueden introducir errores.
