# Archivo Custodes

Biblioteca local para consultar las 27 fotos facilitadas, sus transcripciones OCR y fichas resumidas de unidades y destacamentos.

## Abrir la web

Necesitas Node.js instalado. Desde esta carpeta, ejecuta:

```powershell
node server.js
```

Abre después <http://127.0.0.1:8765>.

- `index.html`: galería de fotos y búsqueda en OCR.
- `listas.html`: creador de listas guardadas y modo partida.
- `fichas.html`: fichas de unidad con búsqueda, vista compacta y filtro por lista.
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

## Listas y modo partida

Abre `listas.html` desde la pestaña **Listas**. Puedes crear varias listas, duplicarlas, elegir límites de puntos y DP, disposiciones de fuerza y destacamentos, y añadir unidades con los tamaños/equipos de la tabla. Cada entrada puede llevar una mejora/upgrade del destacamento seleccionado; los personajes pueden marcarse como Warlord.

El cálculo cuenta las copias de cada perfil en el orden de la lista, compartiendo contador entre tamaños y variantes de un mismo perfil. Al quitar una copia se recalculan las siguientes. No permite añadir copias sin coste en la tabla; las copias importadas con un coste pendiente mantienen el total como subtotal. Psykana Rhino aplica 80 puntos desde la cuarta copia. Se muestran excesos de puntos/DP, costes desconocidos, mejoras repetidas o ajenas a la selección y datos pendientes. Esta revisión no sustituye las restricciones completas de composición, equipo o elegibilidad de mejoras.

Las listas se guardan automáticamente en `localStorage` en este navegador y origen. **Opciones de lista → Descargar copia JSON / Importar JSON** permite copiarlas entre dispositivos sin sobrescribir las existentes. Si el navegador impide guardar, aparece un aviso y sigue disponible la exportación. También puedes copiar o descargar la lista en texto.

**Leader / Support:** en los personajes con estas habilidades puedes elegir una entrada concreta de tu lista. La selección es manual: las fotos no incluyen la tabla actual de unidades compatibles, por lo que debes comprobarla en el [Munitorum Field Manual](https://mfm.warhammer-community.com/en/adeptus-custodes). La app comprueba los vínculos dentro de la lista y permite como máximo un Leader y un Support por unidad, pero no valida la compatibilidad de los perfiles. Support sin unidad aparece como dato pendiente. Las habilidades se toman de las fotos: Knight-Centura tiene Support; el Shield-Captain en Dawneagle Jetbike fotografiado no tiene Leader, por lo que conserva su perfil independiente.

Las tarjetas y fichas enlazan al personaje y a su unidad. Las asignaciones se conservan al guardar, duplicar e importar JSON. Quitar la unidad elimina sus vínculos, y Deshacer los recupera si el puesto sigue libre. Los puntos de cada entrada se suman una sola vez.

**Texto para BCP:** abre **Opciones de lista → Copiar / exportar texto**, pulsa **Copiar texto** y pégalo en el campo Army List de tu evento. También puedes descargar un `.txt`. Incluye unidades, tamaños/variantes de la tabla, puntos, mejoras, Warlord, destacamentos, disposición y asignaciones de Leader/Support. No genera una selección completa de armas por miniatura: revisa el equipo y los requisitos del torneo antes de enviarla.

**Modo partida** reúne las unidades y destacamentos de tu ejército. Abre una ficha y cambia de perfil con las flechas, el selector o las teclas izquierda/derecha. La ficha muestra el tamaño, coste, mejora y Warlord de la entrada seleccionada. En Perfiles puedes filtrar por cualquiera de tus listas guardadas, alternar tarjetas/vista compacta y añadir unidades a la lista activa. Los enlaces `fichas.html#unit=...` y `destacamentos.html#detachment=...` abren una ficha concreta.

Los datos de reglas se comparten en `units-data.js` y `detachments-data.js`; el visor está en `profile-view.js` y el cálculo/guardado de listas en `army-lists.js`.

### Verificación

```sh
node --test tests/*.test.cjs
```
