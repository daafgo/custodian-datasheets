// Fuente: tabla de puntos confirmados facilitada el 03/10/2026.
// points: [First, Second, Third]. null conserva N/A; no se extrapolan tamaños.
const UNIT_POINTS = {
  'Trajann Valoris': {options: [{points: [265, null, null]}]},
  'Shield-Captain': {options: [
    {label: 'Base', points: [180, 200, 200]},
    {label: 'Con escudo', points: [205, 225, 225]}
  ]},
  'Shield-Captain (Allarus)': {options: [{points: [185, 205, 205]}]},
  'Shield-Captain (Dawneagle Jetbike)': {options: [{points: [205, 225, 225]}]},
  'Blade Champion': {options: [{points: [175, 175, 195]}]},
  'Sentinel Guard Sodality': {options: [{models: 3, label: 'Escudos', points: [240, 240, 270]}]},
  'Custodian Guard': {options: [{models: 3, label: 'Lanzas', points: [240, 240, 270]}]},
  'Custodian Wardens': {options: [
    {models: 2, points: [200, 230, 230]},
    {models: 3, points: [295, 325, 325]}
  ]},
  'Allarus Custodians': {options: [
    {models: 2, points: [180, 180, 210]},
    {models: 3, points: [270, 270, 300]}
  ]},
  'Aquilon Terminators · Gauntlets': {options: [{models: 3, points: [285, 285, 315]}]},
  'Aquilon Terminators · Talons': {options: [{models: 3, points: [275, 275, 305]}]},
  'Venatari · Kinetic Destroyers': {options: [{models: 3, label: 'Pistolas', points: [255, 255, 280]}]},
  'Venatari · Verutum Lances': {options: [{models: 3, label: 'Lanzas', points: [270, 270, 300]}]},
  'Telemon Heavy Dreadnought': {options: [{points: [280, 310, 310]}]},
  'Contemptor-Galatus Dreadnought': {options: [{points: [220, 220, 250]}]},
  'Contemptor-Achillus Dreadnought': {options: [{points: [230, 230, 260]}]},
  'Vertus Praetors': {options: [
    {models: 2, points: [220, 240, 240]},
    {models: 3, points: [330, 350, 350]}
  ]},
  'Gyrfalcon Jetbike Sodality': {options: [{models: 2, points: [260, 280, 280]}]},
  'Pallas Grav-Attack': {options: [{points: [135, 135, 135]}]},
  'Coronus Grav-Carrier': {options: [{points: [225, 225, 245]}]},
  'Caladius Grav-Tank': {options: [{points: [230, 230, 260]}]},
  'Caladius Annihilator Grav-Tank': {options: [{points: [250, 250, 280]}]},
  'Knight-Centura': {options: [{points: [55, 55, 55]}]},
  'Prosecutor Squad': {options: [
    {models: 4, points: [45, 45, 45]},
    {models: 5, points: [50, 50, 50]},
    {models: 9, points: [80, 80, 80]},
    {models: 10, points: [90, 90, 90]}
  ]},
  'Vigilator Squad': {options: [
    {models: 4, points: [50, 50, 50]},
    {models: 5, points: [55, 55, 55]},
    {models: 9, points: [90, 90, 90]},
    {models: 10, points: [100, 100, 100]}
  ]},
  'Witchseekers': {options: [
    {models: 4, points: [55, 55, 55]},
    {models: 5, points: [60, 60, 60]},
    {models: 9, points: [100, 100, 100]},
    {models: 10, points: [110, 110, 110]}
  ]},
  'Psykana Rhino': {options: [{points: [70, 70, 70], fourthPlus: 80}]}
};

// Costes de unidades presentes en la tabla que aún no tienen ficha de reglas.
const ADDITIONAL_POINT_UNITS = [
  {name: 'Vertus Praetors', category: 'Montada'},
  {name: 'Gyrfalcon Jetbike Sodality', category: 'Montada'},
  {name: 'Witchseekers', category: 'Hermanas del Silencio'},
  {name: 'Psykana Rhino', category: 'Hermanas del Silencio'}
];

function getUnitPoints(unit) {
  return UNIT_POINTS[unit.name] || {status: 'missing', note: 'Esta unidad no tiene coste indicado en la tabla facilitada.'};
}

function pointsSummary(points) {
  if (!points.options?.length) return 'Puntos por confirmar';
  return `${points.options.map(option => option.points[0] == null ? 'N/A' : option.points[0]).join(' / ')} pts`;
}
