/* List storage and point calculations shared by the builder and profile catalog. */
const ArmyLists = (() => {
  const STORAGE_KEY='custodes.army-lists.v1';
  const dispositions=['Priority Assets','Purge the Foe','Take and Hold','Reconnaissance','Disruption'];
  const id=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const empty=()=>({version:1,activeListId:null,lists:[]});
  const catalog=()=>[...units,...ADDITIONAL_POINT_UNITS];
  const isCharacter=name=>/\bCHARACTER\b/.test(units.find(u=>u.name===name)?.keywords||'');
  const attachmentRole=name=>{const core=units.find(u=>u.name===name)?.core||'';return /\bSupport\b/.test(core)?'Support':/\bLeader\b/.test(core)?'Leader':null;};
  const optionLabel=option=>[option.models?`${option.models} miniaturas`:'',option.label||''].filter(Boolean).join(' · ')||'Unidad';
  const entryLabel=row=>`${row.name} · ${row.ordinal}ª unidad · ${optionLabel(row.option)}`;
  function attachmentTargets(list,entryId){
    const entry=list.units.find(u=>u.id===entryId),role=attachmentRole(entry?.name);
    if(!role)return [];
    return list.units.filter(target=>target.id!==entryId&&!isCharacter(target.name)&&!list.units.some(other=>other.id!==entryId&&other.attachedTo===target.id&&attachmentRole(other.name)===role));
  }
  function assignAttachment(list,entryId,targetId){
    const entry=list.units.find(u=>u.id===entryId);
    if(!entry)throw Error('El personaje no está en esta lista.');
    if(!targetId){entry.attachedTo=null;return;}
    if(!attachmentRole(entry.name))throw Error('Este perfil no tiene Leader ni Support.');
    if(!attachmentTargets(list,entryId).some(u=>u.id===targetId))throw Error('Elige una unidad de esta lista con ese puesto libre.');
    entry.attachedTo=targetId;
  }
  function removeUnit(list,entryId){
    const index=list.units.findIndex(u=>u.id===entryId);if(index<0)return null;
    const attachments=list.units.filter(u=>u.attachedTo===entryId).map(u=>u.id);
    const unit=list.units.splice(index,1)[0];list.units.filter(u=>attachments.includes(u.id)).forEach(u=>u.attachedTo=null);
    return {index,unit,attachments};
  }
  function restoreUnit(list,removed){
    if(list.units.some(u=>u.id===removed.unit.id))return;
    const unit={...removed.unit};
    if(unit.attachedTo&&!attachmentTargets({...list,units:[...list.units,unit]},unit.id).some(u=>u.id===unit.attachedTo))unit.attachedTo=null;
    list.units.splice(removed.index,0,unit);
    removed.attachments.forEach(entryId=>{if(attachmentTargets(list,entryId).some(u=>u.id===unit.id))assignAttachment(list,entryId,unit.id);});
  }
  function newList(name='Mi lista Custodes',pointsLimit=2000,dpLimit=3){return {id:id(),name,pointsLimit,dpLimit,forceDisposition:'',detachmentNames:[],units:[]};}
  function price(name,optionIndex,ordinal){const option=UNIT_POINTS[name]?.options[optionIndex];return ordinal<=3?option?.points[ordinal-1]??null:option?.fourthPlus??null;}
  function nextOrdinal(list,name){return list.units.filter(u=>u.name===name).length+1;}
  function addUnit(list,name,optionIndex=0){
    if(list.units.length>=300)throw Error('Esta lista ya contiene 300 unidades.');
    if(!UNIT_POINTS[name]?.options[optionIndex])throw Error('Selecciona un tamaño o equipo de la tabla.');
    const ordinal=nextOrdinal(list,name);
    if(price(name,optionIndex,ordinal)==null)throw Error(`La tabla no incluye coste para la ${ordinal}ª unidad de ${name}.`);
    const warlord=name==='Trajann Valoris'||(isCharacter(name)&&!list.units.some(u=>u.warlord));
    if(warlord)list.units.forEach(u=>u.warlord=false);
    const entry={id:id(),name,optionIndex,enhancement:null,warlord,attachedTo:null};list.units.push(entry);return entry;
  }
  function enhancements(list){return list.detachmentNames.flatMap(name=>{const d=detachments.find(d=>d.name===name);return (d?.enhancements||[]).map(([name,text])=>({detachment:d.name,name,text,points:getEnhancementPoints(d.name,name)})).filter(e=>e.points!=null);});}
  function evaluate(list){
    const copies=new Map(),seenEnhancements=new Set(),occupiedSlots=new Set(),issues=[];
    const rows=list.units.map(entry=>{
      const ordinal=(copies.get(entry.name)||0)+1;copies.set(entry.name,ordinal);
      const basePoints=price(entry.name,entry.optionIndex,ordinal),option=UNIT_POINTS[entry.name]?.options[entry.optionIndex];
      const enhancementPoints=entry.enhancement?getEnhancementPoints(entry.enhancement.detachment,entry.enhancement.name):0;
      if(basePoints==null)issues.push(`Falta el coste de la ${ordinal}ª unidad de ${entry.name}.`);
      if(entry.enhancement){
        const key=normalizePointsName(entry.enhancement.detachment)+'|'+normalizePointsName(entry.enhancement.name);
        if(enhancementPoints==null)issues.push(`Falta el coste de ${entry.enhancement.name}.`);
        if(seenEnhancements.has(key))issues.push(`La mejora ${entry.enhancement.name} está repetida.`);
        seenEnhancements.add(key);
        if(!list.detachmentNames.includes(entry.enhancement.detachment))issues.push(`${entry.enhancement.name} pertenece a un destacamento que no está seleccionado.`);
      }
      const role=attachmentRole(entry.name),target=list.units.find(u=>u.id===entry.attachedTo);
      if(role==='Support'&&!entry.attachedTo)issues.push(`${entry.name} debe unirse a una unidad como Support.`);
      if(entry.attachedTo){
        if(!role)issues.push(`${entry.name} no tiene Leader ni Support.`);
        if(!target||target.id===entry.id||isCharacter(target.name))issues.push(`La unidad asignada a ${entry.name} no es válida.`);
        const slot=entry.attachedTo+'|'+role;
        if(occupiedSlots.has(slot))issues.push(`Hay más de un ${role} asignado a ${target?.name||'la misma unidad'}.`);
        occupiedSlots.add(slot);
      }
      return {...entry,ordinal,option,basePoints,enhancementPoints,total:basePoints==null||enhancementPoints==null?null:basePoints+enhancementPoints};
    });
    const points=rows.reduce((sum,row)=>sum+(row.basePoints??0)+(row.enhancementPoints??0),0),complete=rows.every(row=>row.total!=null);
    const selected=detachments.filter(d=>list.detachmentNames.includes(d.name));
    const dp=selected.reduce((sum,d)=>sum+(d.costDP??0),0),dpComplete=selected.every(d=>d.costDP!=null);
    if(points>list.pointsLimit)issues.push(`Superas el límite en ${points-list.pointsLimit} puntos.`);
    if(dp>list.dpLimit)issues.push(`Superas el límite en ${dp-list.dpLimit} DP.`);
    selected.filter(d=>d.costDP==null).forEach(d=>issues.push(`El coste en DP de ${d.name} está por confirmar.`));
    if(!selected.length)issues.push('Selecciona al menos un destacamento.');
    if(!list.forceDisposition)issues.push('Elige una disposición de fuerza.');
    else selected.filter(d=>d.forceDispositions.length&&!d.forceDispositions.includes(list.forceDisposition)).forEach(d=>issues.push(`${d.name} no incluye ${list.forceDisposition} entre sus disposiciones.`));
    if(list.units.length&&!list.units.some(u=>u.warlord))issues.push('Selecciona un Warlord.');
    if(list.units.filter(u=>u.warlord).length>1)issues.push('Hay más de un Warlord.');
    if(list.units.some(u=>u.name==='Trajann Valoris'&&!u.warlord))issues.push('Trajann Valoris debe ser el Warlord de tu lista.');
    return {rows,points,complete,dp,dpComplete,issues};
  }
  function boundedNumber(value,min,max,label){if(!Number.isInteger(value)||value<min||value>max)throw Error(`${label} no es válido.`);return value;}
  function validateList(raw){
    if(!raw||typeof raw!=='object'||typeof raw.name!=='string'||!raw.name.trim())throw Error('La lista no tiene un nombre válido.');
    if(!Array.isArray(raw.units)||raw.units.length>300||!Array.isArray(raw.detachmentNames))throw Error('Las unidades o los destacamentos no son válidos.');
    if(raw.detachmentNames.some(name=>!detachments.some(d=>d.name===name)))throw Error('El archivo contiene un destacamento desconocido.');
    const forceDisposition=raw.forceDisposition||'';
    if(forceDisposition&&!dispositions.includes(forceDisposition))throw Error('La disposición de fuerza no es válida.');
    const entries=raw.units.map(entry=>{
      if(!entry||!UNIT_POINTS[entry.name])throw Error('El archivo contiene una unidad desconocida.');
      const optionIndex=boundedNumber(entry.optionIndex,0,UNIT_POINTS[entry.name].options.length-1,'El tamaño/equipo');
      let enhancement=null;
      if(entry.enhancement){const e=entry.enhancement,d=detachments.find(d=>d.name===e.detachment);if(!d?.enhancements.some(([name])=>name===e.name))throw Error('El archivo contiene una mejora desconocida.');enhancement={detachment:e.detachment,name:e.name};}
      if(entry.attachedTo!=null&&(typeof entry.attachedTo!=='string'||!entry.attachedTo||entry.attachedTo.length>=100))throw Error('La asignación del personaje no es válida.');
      return {id:typeof entry.id==='string'&&entry.id&&entry.id.length<100?entry.id:id(),name:entry.name,optionIndex,enhancement,warlord:!!entry.warlord&&isCharacter(entry.name),attachedTo:entry.attachedTo||null};
    });
    if(new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('El archivo contiene identificadores de unidad repetidos.');
    const slots=new Set();
    for(const entry of entries){
      if(!entry.attachedTo)continue;
      const role=attachmentRole(entry.name),target=entries.find(u=>u.id===entry.attachedTo),slot=entry.attachedTo+'|'+role;
      if(!role||!target||target.id===entry.id||isCharacter(target.name))throw Error('El archivo contiene una asignación de personaje no válida.');
      if(slots.has(slot))throw Error(`El archivo asigna más de un ${role} a la misma unidad.`);
      slots.add(slot);
    }
    return {id:typeof raw.id==='string'&&raw.id.length<100?raw.id:id(),name:raw.name.trim().slice(0,120),pointsLimit:boundedNumber(raw.pointsLimit,100,10000,'El límite de puntos'),dpLimit:boundedNumber(raw.dpLimit,1,10,'El límite de DP'),forceDisposition,detachmentNames:[...new Set(raw.detachmentNames)],units:entries};
  }
  function parse(raw){
    const data=typeof raw==='string'?JSON.parse(raw):raw;
    if(data?.version!==1||!Array.isArray(data.lists)||data.lists.length>100)throw Error('El archivo no es una copia de listas compatible.');
    const lists=data.lists.map(validateList);
    if(new Set(lists.map(list=>list.id)).size!==lists.length)throw Error('El archivo contiene identificadores de lista repetidos.');
    return {version:1,activeListId:lists.some(l=>l.id===data.activeListId)?data.activeListId:lists[0]?.id||null,lists};
  }
  function load(){try{const raw=localStorage.getItem(STORAGE_KEY);return {state:raw?parse(raw):empty(),error:null};}catch(error){return {state:empty(),error:'No se han podido cargar las listas de este navegador. Puedes importar una copia JSON.'};}}
  function save(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function duplicate(list){const copy=validateList(list);copy.id=id();copy.name=`${list.name.slice(0,110)} (copia)`;const ids=new Map(copy.units.map(u=>[u.id,id()]));copy.units.forEach(u=>{u.id=ids.get(u.id);u.attachedTo=u.attachedTo?ids.get(u.attachedTo):null;});return copy;}
  function importLists(state,raw){const imported=parse(raw);if(!imported.lists.length)throw Error('El archivo no contiene listas.');if(state.lists.length+imported.lists.length>100)throw Error('Puedes guardar hasta 100 listas.');const lists=imported.lists.map(list=>{const copy=duplicate(list);copy.name=list.name;return copy;});state.lists.push(...lists);state.activeListId=lists[0].id;return lists.length;}
  function exportText(list){
    const result=evaluate(list),lines=[`${list.name} (${result.points}${result.complete?'':' + pendientes'} puntos)`,'Adeptus Custodes',`${list.detachmentNames.join(' + ')||'Sin destacamento'} (${result.dp}${result.dpComplete?'':' + pendientes'} / ${list.dpLimit} DP)`,list.forceDisposition||'Sin disposición de fuerza',`Límite: ${list.pointsLimit} puntos`,''];
    result.rows.forEach(row=>{lines.push(`${row.name} (${row.total??'por confirmar'} puntos)`,`• ${row.ordinal}ª unidad · ${optionLabel(row.option)}`);if(row.warlord)lines.push('• Warlord');if(row.enhancement)lines.push(`• Mejora: ${row.enhancement.name} (${row.enhancementPoints??'por confirmar'} pts) · ${row.enhancement.detachment}`);if(row.attachedTo){const target=result.rows.find(u=>u.id===row.attachedTo);lines.push(`• Unido como ${attachmentRole(row.name)||'personaje'} a: ${target?entryLabel(target):'unidad pendiente'}`);}result.rows.filter(u=>u.attachedTo===row.id).forEach(u=>lines.push(`• ${attachmentRole(u.name)||'Personaje'}: ${entryLabel(u)}`));lines.push('');});
    if(result.issues.length)lines.push('Pendiente de revisar:',...result.issues.map(issue=>'• '+issue),'');
    lines.push('Costes según la tabla confirmada del 03/10/2026. Revisa las restricciones de composición, equipo y compatibilidad de Leader/Support con las reglas.');return lines.join('\n');
  }
  return {STORAGE_KEY,dispositions,empty,newList,catalog,isCharacter,attachmentRole,entryLabel,attachmentTargets,assignAttachment,removeUnit,restoreUnit,optionLabel,price,nextOrdinal,addUnit,enhancements,evaluate,load,save,parse,validateList,duplicate,importLists,exportText};
})();
