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

Los costes proceden de la tabla de puntos confirmados facilitada el 3 de octubre de 2026, que sustituye a la tabla de rumores anterior. Los datos se mantienen separados de las reglas: `unit-points.js` contiene las unidades y `enhancement-points.js` las mejoras por destacamento.

- Las tarjetas muestran el coste de la primera unidad. Cada ficha incluye una tabla con los costes de la primera, segunda y tercera unidad, separados por tamaño y equipo. N/A se muestra como «No disponible».
- Psykana Rhino incluye también 80 puntos para la cuarta unidad y siguientes. No se extrapolan costes ni tamaños ausentes de la fuente.
- Vertus Praetors, Gyrfalcon Jetbike Sodality, Witchseekers y Psykana Rhino tienen tablas de costes al final de Fichas, con los mismos filtros de búsqueda y categoría; aún no tienen perfiles de reglas en el catálogo.
- Las 29 mejoras de la tabla muestran su coste en puntos dentro del destacamento correspondiente, separado de los CP de las estratagemas y los DP del destacamento.
- Fierce Conqueror aparece en la tabla con 20 puntos, pero su regla está pendiente de transcripción. Se conserva Leonine Ferocity con su regla previa y «Puntos por confirmar» porque no figura en la tabla; no se presupone que ambas mejoras sean equivalentes.
