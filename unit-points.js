// Fuente: tabla reenviada «Unit | Rumored Points | Notes», facilitada el 02/10/2026.
// Todos los valores son rumores. No se extrapolan tamaños ni costes no indicados.
const UNIT_POINTS = {
  'Shield-Captain (Allarus)': {options: [{points: 195}]},
  'Custodian Guard': {options: [{points: 250}]},
  'Custodian Wardens': {options: [{points: 200, models: 2}, {points: 290, models: 3}]},
  'Shield-Captain': {options: [{points: 185, label: 'Base'}, {points: 190, label: 'Escudo y espada'}]},
  'Aquilon Terminators · Gauntlets': {
    status: 'uncertain',
    options: [{points: 285, label: 'Valor comunicado'}, {points: 275, label: 'Alternativa atribuida a Talons'}],
    note: 'La tabla recoge 285 / 275 pts para Aquilon Custodians y atribuye provisionalmente 275 a Talons. No confirma el reparto entre las dos fichas.'
  },
  'Aquilon Terminators · Talons': {
    status: 'uncertain',
    options: [{points: 285, label: 'Valor comunicado'}, {points: 275, label: 'Alternativa atribuida a Talons'}],
    note: 'La tabla recoge 285 / 275 pts para Aquilon Custodians y atribuye provisionalmente 275 a Talons. No confirma el reparto entre las dos fichas.'
  },
  'Venatari · Kinetic Destroyers': {
    status: 'uncertain',
    options: [{points: 270}],
    note: 'Coste genérico de Venatari Custodians. La tabla no distingue Kinetic Destroyers de Verutum Lances; el coste de esta variante está por confirmar.'
  },
  'Venatari · Verutum Lances': {
    status: 'uncertain',
    options: [{points: 270}],
    note: 'Coste genérico de Venatari Custodians. La tabla no distingue Kinetic Destroyers de Verutum Lances; el coste de esta variante está por confirmar.'
  },
  'Telemon Heavy Dreadnought': {options: [{points: 280}]},
  'Contemptor-Galatus Dreadnought': {options: [{points: 220}]},
  'Contemptor-Achillus Dreadnought': {options: [{points: 230}]},
  'Allarus Custodians': {options: [{points: 180, models: 2}, {points: 270, models: 3}]},
  'Pallas Grav-Attack': {options: [{points: 125}]},
  'Coronus Grav-Carrier': {options: [{points: 225}]},
  'Caladius Grav-Tank': {options: [{points: 250}]},
  'Caladius Annihilator Grav-Tank': {
    status: 'missing',
    note: 'La tabla solo nombra Caladius Grav-Tank. No confirma el coste de la ficha Annihilator.'
  },
  'Knight-Centura': {
    status: 'increase', delta: 5,
    note: 'La tabla indica un incremento de +5 pts para otras unidades de Hermanas del Silencio, sin coste base ni desglose. El total de Knight-Centura está por confirmar.'
  },
  'Prosecutor Squad': {
    options: [{points: 50, models: 4}],
    note: 'Solo se indica el coste de 4 miniaturas. Los costes para otros tamaños de unidad están por confirmar.'
  },
  'Vigilator Squad': {
    status: 'increase', delta: 5,
    note: 'La tabla indica un incremento de +5 pts para otras unidades de Hermanas del Silencio, sin coste base ni desglose. El total de Vigilators está por confirmar.'
  }
};

function getUnitPoints(unit) {
  return UNIT_POINTS[unit.name] || {status: 'missing', note: 'Esta unidad no tiene coste indicado en la tabla facilitada.'};
}

function pointsSummary(points) {
  if (points.status === 'missing') return 'Puntos por confirmar';
  if (points.status === 'increase') return `+${points.delta} pts · incremento`;
  return `${points.options.map(option => option.points).join(' / ')} pts`;
}
