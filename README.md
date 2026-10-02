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

## Costes en puntos

Las tarjetas y las fichas muestran los costes de la tabla reenviada «Unit | Rumored Points | Notes», facilitada el 2 de octubre de 2026. Son **rumores sin confirmación oficial**. Los datos se mantienen en `unit-points.js`, separados de los perfiles transcritos de las fotos.

- Wardens y Allarus muestran los costes para 2 y 3 miniaturas; Shield-Captain distingue base de escudo y espada.
- Aquilon conserva ambos valores (285 / 275), con la atribución provisional de 275 a Talons. Venatari conserva el coste genérico con una nota por variante.
- Prosecutors solo tiene coste para 4 miniaturas. No se extrapolan otros tamaños.
- Knight-Centura y Vigilators muestran el incremento genérico de +5 pts; su total permanece pendiente porque no se proporciona una base.
- Las unidades ausentes de la tabla muestran «Puntos por confirmar». No se añaden fichas nuevas para unidades que no están en el catálogo.
