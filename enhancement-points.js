// Fuente: tabla de puntos confirmados facilitada el 03/10/2026.
// Los nombres se resuelven dentro de su destacamento.
const ENHANCEMENT_POINTS = {
  'Guardians of the Throne': {
    'Bane of Abominations': 20,
    "Eagle's Eye": 30,
    "Castellan's Mark": 25,
    "Emperor's Light": 15
  },
  'Aquilan Shield': {
    'Not a Shell Wasted': 10,
    "Pareldor's Caduceatrix": 30
  },
  'Auric Champions': {
    'Inspirational Exemplar': 10,
    'Superior Creation': 30,
    'Shroud of the Hidden Blade': 20
  },
  'Dread Host': {'Auric Exemplar': 15, 'Flawless Bladework': 15},
  'Emissaries Imperatus': {'Auriferous Orb': 20, 'Edge of the Blade': 15},
  "Emperor's Chosen": {'From the Hall of Armouries': 15, 'Radiant Mantle': 40},
  'Grav-Assault Force': {'Anti-Gravitic Mobility': 15, 'Combat Deployment': 20},
  'Honoured Companions': {'Area-Shrike': 20, 'Celeritous Sentries': 15},
  'Lions of the Emperor': {'Fierce Conqueror': 20, 'Lightning Descent': 20},
  'Might of the Moritoi': {'Augury Uplink': 30, 'Memento Moritoi': 30},
  'Null Maiden Vigil': {"Huntress' Eye": 10, 'Oblivion Knight': 15},
  'Shadowkeepers': {'Genalchemic Warding': 30, 'Unstoppable Destroyer': 25},
  'Solar Watch': {'Auric Eagle': 15, 'Sally Forth': 30}
};

function normalizePointsName(name) {
  return name.replace(/[’‘]/g, "'").replace(/\s*\((?:upgrade|one per army)\)\s*$/i, '').trim().toLowerCase();
}

function getEnhancementPoints(detachment, enhancement) {
  const group = Object.entries(ENHANCEMENT_POINTS).find(([name]) => normalizePointsName(name) === normalizePointsName(detachment));
  const match = group && Object.entries(group[1]).find(([name]) => normalizePointsName(name) === normalizePointsName(enhancement));
  return match ? match[1] : null;
}
