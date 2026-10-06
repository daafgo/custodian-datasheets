const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const loaded=ArmyLists.load();let state=loaded.state,battle=false,pendingUnit=null,pendingAfterCreate=null,toastTimer,removed=null;
const requested=new URLSearchParams(location.search),requestedList=requested.get('list');
if(state.lists.some(list=>list.id===requestedList))state.activeListId=requestedList;
const active=()=>state.lists.find(list=>list.id===state.activeListId)||null;
const money=value=>value==null?'Coste pendiente':`${value} pts`;
function toast(message,undo=false){clearTimeout(toastTimer);$('#armyToast').innerHTML=esc(message)+(undo?' <button type="button" id="undoRemove">Deshacer</button>':'');$('#armyToast').hidden=false;toastTimer=setTimeout(()=>$('#armyToast').hidden=true,5500);}
function storageWarning(message){$('#storageWarning').textContent=message;$('#storageWarning').hidden=!message;}
function save(){try{ArmyLists.save(state);$('#saveStatus').textContent='Guardado en este navegador';storageWarning('');}catch{$('#saveStatus').textContent='Cambios sin guardar';storageWarning('No se ha podido guardar en este navegador. Descarga una copia JSON para conservar los cambios.');}}
function touch(){save();render();}
function updateURL(){const url=new URL(location.href);url.searchParams.delete('add');if(active())url.searchParams.set('list',active().id);else url.searchParams.delete('list');history.replaceState(null,'',url.pathname+url.search+url.hash);}
function setPane(pane){$('#builderLayout').dataset.pane=pane;document.querySelectorAll('[data-pane]').forEach(button=>{if(button.tagName==='BUTTON'){const selected=button.dataset.pane===pane;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',selected)}});if(pane==='catalog')$('#catalogSearch').focus();}
function createDialog(){if(state.lists.length>=100){toast('Puedes guardar hasta 100 listas.');return;}$('#newListDialog').showModal();$('#newListName').select();}
function summary(list,result){
  $('#pointsTotal').textContent=`${result.points}${result.complete?'':' + ?'} / ${list.pointsLimit}`;
  $('#pointsTotal').classList.toggle('over-budget',result.points>list.pointsLimit);
  $('#pointsProgress').style.width=`${Math.min(100,result.points/list.pointsLimit*100)}%`;
  $('#pointsProgress').classList.toggle('over-budget',result.points>list.pointsLimit);
  $('#dpTotal').textContent=`${result.dp}${result.dpComplete?'':' + ?'} / ${list.dpLimit} DP`;
  $('#dpTotal').classList.toggle('over-budget',result.dp>list.dpLimit);
  $('#armyCount').textContent=list.units.length;
  $('#reviewSummary').textContent=result.issues.length?`${result.issues.length} ${result.issues.length===1?'dato':'datos'} por revisar`:'Costes y datos calculados';
  $('#reviewIssues').innerHTML=result.issues.map(issue=>`<li>${esc(issue)}</li>`).join('');
}
function renderSettings(list){
  for(const [selector,value] of [['#listName',list.name],['#pointsLimit',list.pointsLimit],['#dpLimit',list.dpLimit],['#forceDisposition',list.forceDisposition]])if(document.activeElement!==$(selector))$(selector).value=value;
  $('#detachmentPicker').innerHTML=detachments.map(d=>`<label class="detachment-choice"><input type="checkbox" value="${esc(d.name)}" ${list.detachmentNames.includes(d.name)?'checked':''}><span><strong>${esc(d.name)}</strong><small>${esc(d.forceDispositions.join(' / ')||'Disposición por confirmar')}</small></span><b>${d.costDP==null?'? DP':`${d.costDP} DP`}</b></label>`).join('');
}
function enhancementSelect(row,list,available){
  const selected=row.enhancement?JSON.stringify(row.enhancement):'';
  let options='<option value="">Sin mejora / upgrade</option>';
  if(row.enhancement&&!available.some(e=>e.detachment===row.enhancement.detachment&&e.name===row.enhancement.name))options+=`<option value="${esc(selected)}" selected>${esc(row.enhancement.name)} · fuera de selección</option>`;
  for(const name of list.detachmentNames){const group=available.filter(e=>e.detachment===name);if(group.length)options+=`<optgroup label="${esc(name)}">${group.map(e=>{const value=JSON.stringify({detachment:e.detachment,name:e.name});return `<option value="${esc(value)}" ${selected===value?'selected':''}>${esc(e.name)} · ${e.points} pts</option>`}).join('')}</optgroup>`;}
  return `<label class="sr-only" for="enh-${esc(row.id)}">Mejora de ${esc(row.name)}</label><select id="enh-${esc(row.id)}" data-field="enhancement" data-row-id="${esc(row.id)}">${options}</select>`;
}
function attachmentLinks(row,result){
  const target=result.rows.find(u=>u.id===row.attachedTo),members=result.rows.filter(u=>u.attachedTo===row.id);
  const link=(entry,label)=>`<button type="button" class="attachment-link" data-action="profile" data-row-id="${esc(entry.id)}"><span>${esc(label)}</span><strong>${esc(ArmyLists.entryLabel(entry))} →</strong></button>`;
  return (target?link(target,`Unido como ${ArmyLists.attachmentRole(row.name)}`):'')+members.map(u=>link(u,ArmyLists.attachmentRole(u.name))).join('');
}
function attachmentSelect(row,list,result){
  const role=ArmyLists.attachmentRole(row.name);if(!role)return '';
  const targets=ArmyLists.attachmentTargets(list,row.id);
  return `<div class="attachment-picker"><label for="attach-${esc(row.id)}">${role==='Support'?'Support · Apoyar a una unidad':'Leader · Liderar una unidad'}</label><select id="attach-${esc(row.id)}" data-field="attachedTo" data-row-id="${esc(row.id)}"><option value="">${role==='Support'?'Elegir unidad de apoyo…':'Sin unidad · independiente'}</option>${targets.map(target=>{const evaluated=result.rows.find(u=>u.id===target.id);return `<option value="${esc(target.id)}" ${row.attachedTo===target.id?'selected':''}>${esc(ArmyLists.entryLabel(evaluated))}</option>`;}).join('')}</select><p>${targets.length?'Asignación manual: comprueba las unidades compatibles en el':'Añade una unidad con este puesto libre y comprueba su compatibilidad en el'} <a href="https://mfm.warhammer-community.com/en/adeptus-custodes" target="_blank" rel="noreferrer">Munitorum Field Manual</a>.</p></div>`;
}
function renderArmy(list,result){
  const available=ArmyLists.enhancements(list);
  $('#armyEmpty').hidden=!!result.rows.length;
  $('#armyUnits').innerHTML=result.rows.map(row=>{
    const options=UNIT_POINTS[row.name].options;
    const option=options.map((option,index)=>{const cost=ArmyLists.price(row.name,index,row.ordinal);return `<option value="${index}" ${row.optionIndex===index?'selected':''} ${cost==null?'disabled':''}>${esc(ArmyLists.optionLabel(option))} · ${money(cost)}</option>`}).join('');
    return `<article class="roster-unit"><div class="roster-unit-top"><button type="button" class="roster-profile" data-action="profile" data-row-id="${esc(row.id)}"><small>${row.ordinal}ª UNIDAD${row.warlord?' · WARLORD':''}</small><strong>${esc(row.name)}</strong><span>Ver perfil →</span></button><div class="roster-cost">${esc(money(row.total))}<button type="button" class="remove-unit" data-action="remove" data-row-id="${esc(row.id)}" aria-label="Quitar ${esc(row.name)}">×</button></div></div><div class="roster-fields"><label class="sr-only" for="size-${esc(row.id)}">Tamaño o equipo de ${esc(row.name)}</label><select id="size-${esc(row.id)}" data-field="optionIndex" data-row-id="${esc(row.id)}">${option}</select>${enhancementSelect(row,list,available)}</div>${ArmyLists.isCharacter(row.name)?`<label class="warlord-choice"><input type="radio" name="warlord" data-field="warlord" data-row-id="${esc(row.id)}" ${row.warlord?'checked':''}> Warlord</label>`:''}${attachmentSelect(row,list,result)}${attachmentLinks(row,result)}</article>`;
  }).join('');
}
function renderCatalog(){
  const list=active(),query=norm($('#catalogSearch').value),category=$('#catalogCategory').value;
  const filtered=ArmyLists.catalog().filter(unit=>(category==='all'||unit.category===category)&&(!query||norm(JSON.stringify(unit)).includes(query)));
  $('#catalogCount').textContent=`${filtered.length} unidades`;
  $('#unitCatalog').innerHTML=filtered.map(unit=>{
    const ordinal=list?ArmyLists.nextOrdinal(list,unit.name):1,costs=UNIT_POINTS[unit.name].options.map((_,i)=>ArmyLists.price(unit.name,i,ordinal)).filter(cost=>cost!=null);
    return `<article class="catalog-unit"><div><small>${esc(unit.category)}${unit.weapons?'':' · Solo puntos'}</small><h3>${esc(unit.name)}</h3><p>${ordinal}ª unidad · ${costs.length?`Desde ${Math.min(...costs)} pts`:'Sin coste en la tabla'}</p></div><div class="catalog-actions"><button type="button" class="army-button" data-action="catalog-profile" data-name="${esc(unit.name)}" aria-label="Ver perfil de ${esc(unit.name)}">Ficha</button><button type="button" class="army-button primary" data-action="add" data-name="${esc(unit.name)}" ${costs.length?'':'disabled'} aria-label="Añadir ${esc(unit.name)}">+</button></div></article>`;
  }).join('')||'<p class="army-empty">No hay unidades que coincidan con la búsqueda.</p>';
}
function renderBattle(list,result){
  $('#battleDetachments').innerHTML=list.detachmentNames.map(name=>`<button type="button" class="battle-detachment" data-action="detachment" data-name="${esc(name)}"><strong>${esc(name)}</strong><span>Reglas, mejoras y estratagemas →</span></button>`).join('')||'<p class="dialog-help">Selecciona tus destacamentos en la configuración de la lista.</p>';
  const query=norm($('#battleSearch').value);
  const rows=result.rows.filter(row=>!query||norm(JSON.stringify([row,...result.rows.filter(u=>u.id===row.attachedTo||u.attachedTo===row.id)])).includes(query));
  $('#battleUnits').innerHTML=rows.map(row=>{
    const target=result.rows.find(u=>u.id===row.attachedTo),members=result.rows.filter(u=>u.attachedTo===row.id);
    return `<button type="button" class="battle-unit" data-action="profile" data-row-id="${esc(row.id)}"><small>${row.ordinal}ª UNIDAD${row.warlord?' · WARLORD':''}</small><strong>${esc(row.name)}</strong><span>${esc(ArmyLists.optionLabel(row.option))} · ${esc(money(row.total))}</span>${row.enhancement?`<em>${esc(row.enhancement.name)}</em>`:''}${target?`<em>${esc(ArmyLists.attachmentRole(row.name))} de ${esc(ArmyLists.entryLabel(target))}</em>`:''}${members.map(u=>`<em>${esc(ArmyLists.attachmentRole(u.name))}: ${esc(ArmyLists.entryLabel(u))}</em>`).join('')}<b>ABRIR PERFIL →</b></button>`;
  }).join('')||'<p class="army-empty">No hay unidades para mostrar.</p>';
}
function render(){
  document.body.classList.toggle('is-battle',battle);
  const focus=document.activeElement?.id;
  const list=active();
  $('#listSelect').innerHTML=state.lists.map(list=>`<option value="${esc(list.id)}">${esc(list.name)}</option>`).join('')||'<option value="">Todavía no hay listas</option>';
  $('#listSelect').value=list?.id||'';
  $('#listWelcome').hidden=!!list;$('#listWorkspace').hidden=!list;
  ['duplicateList','deleteList','exportText','exportJSON'].forEach(id=>$('#'+id).disabled=!list);
  if(!list){updateURL();return;}
  const result=ArmyLists.evaluate(list);summary(list,result);renderSettings(list);renderArmy(list,result);renderCatalog();renderBattle(list,result);
  $('#builderLayout').hidden=battle;$('.builder-tabs').hidden=battle;$('#battleView').hidden=!battle;
  $('#battleToggle').textContent=battle?'← Editar lista':'Modo partida →';
  updateURL();
  if(focus)document.getElementById(focus)?.focus({preventScroll:true});
}
function openArmyProfile(rowId){
  const list=active();if(!list)return;
  const rows=ArmyLists.evaluate(list).rows,row=rows.find(row=>row.id===rowId);if(!row)return;
  Profiles.openUnit(row.name,{key:row.id,entries:rows.map(row=>({name:row.name,key:row.id,label:`${row.name} · ${row.ordinal}ª unidad`})),onAdd:showAdd,onRelated:openArmyProfile,contextFor:entry=>{
    const selected=rows.find(row=>row.id===entry.key);let enhancement=null;
    if(selected.enhancement){const d=detachments.find(d=>d.name===selected.enhancement.detachment);enhancement={...selected.enhancement,points:selected.enhancementPoints??'?',text:d?.enhancements.find(([name])=>name===selected.enhancement.name)?.[1]||''};}
    const target=rows.find(u=>u.id===selected.attachedTo),members=rows.filter(u=>u.attachedTo===selected.id);
    const related=[...(target?[{key:target.id,label:`${ArmyLists.attachmentRole(selected.name)} de ${ArmyLists.entryLabel(target)}`}]:[]),...members.map(u=>({key:u.id,label:`${ArmyLists.attachmentRole(u.name)}: ${ArmyLists.entryLabel(u)}`}))];
    return {title:`${list.name} · ${selected.ordinal}ª unidad · ${ArmyLists.optionLabel(selected.option)} · ${money(selected.total)}${selected.warlord?' · Warlord':''}`,enhancement,related};
  }});
}
function showAdd(name){
  const list=active();if(!list){pendingAfterCreate=name;createDialog();return;}
  const data=UNIT_POINTS[name];if(!data)return;
  pendingUnit=name;const ordinal=ArmyLists.nextOrdinal(list,name);
  $('#addUnitTitle').textContent=name;$('#addUnitCopy').textContent=`${ordinal}ª unidad de este perfil en ${list.name}`;
  $('#addUnitOption').innerHTML=data.options.map((option,index)=>{const cost=ArmyLists.price(name,index,ordinal);return `<option value="${index}" ${cost==null?'disabled':''}>${esc(ArmyLists.optionLabel(option))} · ${money(cost)}</option>`}).join('');
  const first=data.options.findIndex((_,index)=>ArmyLists.price(name,index,ordinal)!=null);
  $('#addUnitOption').value=String(Math.max(first,0));
  updateAddCost();$('#addUnitDialog').showModal();
}
function updateAddCost(){const list=active();if(!list||!pendingUnit)return;const price=ArmyLists.price(pendingUnit,Number($('#addUnitOption').value),ArmyLists.nextOrdinal(list,pendingUnit));$('#addUnitCost').textContent=money(price);$('#confirmAddUnit').disabled=price==null;$('#addUnitNote').textContent=price==null?'La tabla no indica un coste para esta copia.':'Los puntos se recalculan si cambias el tamaño o quitas otra copia de esta unidad.';}
function download(content,type,extension){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(active()?.name||'listas-custodes').replace(/[^a-z0-9-]+/gi,'-').slice(0,90)+extension;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

$('#forceDisposition').innerHTML+=ArmyLists.dispositions.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
if(loaded.error)storageWarning(loaded.error);
['#newList','#firstList'].forEach(selector=>$(selector).onclick=createDialog);
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>document.getElementById(button.dataset.close).close());
$('#newListForm').onsubmit=e=>{
  e.preventDefault();
  try{const list=ArmyLists.validateList(ArmyLists.newList($('#newListName').value,Number($('#newListPoints').value),Number($('#newListDP').value)));state.lists.push(list);state.activeListId=list.id;battle=false;$('#newListDialog').close();touch();setPane('army');if(pendingAfterCreate){const name=pendingAfterCreate;pendingAfterCreate=null;showAdd(name)}else toast('Lista creada. Elige sus destacamentos y añade unidades.');}catch(error){toast(error.message);}
};
$('#listSelect').onchange=e=>{state.activeListId=e.target.value;battle=false;touch();};
$('#duplicateList').onclick=()=>{if(!active())return;if(state.lists.length>=100){toast('Puedes guardar hasta 100 listas.');return;}const copy=ArmyLists.duplicate(active());state.lists.push(copy);state.activeListId=copy.id;battle=false;$('#listMenu').open=false;touch();toast('Lista duplicada.');};
let pendingDeleteId=null;
$('#deleteList').onclick=()=>{if(!active())return;pendingDeleteId=active().id;$('#deleteMessage').textContent=`¿Eliminar «${active().name}» de este navegador? Puedes descargar una copia JSON antes de borrarla.`;$('#listMenu').open=false;$('#deleteDialog').showModal();};
$('#confirmDelete').onclick=()=>{state.lists=state.lists.filter(list=>list.id!==pendingDeleteId);state.activeListId=state.lists[0]?.id||null;pendingDeleteId=null;battle=false;$('#deleteDialog').close();touch();toast('Lista eliminada.');};
$('#listName').oninput=e=>{const list=active();if(!list)return;const name=e.target.value.trim();if(name){list.name=name;save();const option=$('#listSelect').selectedOptions[0];if(option)option.textContent=name;}};
$('#listName').onchange=()=>{if(active())$('#listName').value=active().name;};
for(const [selector,key,min,max] of [['#pointsLimit','pointsLimit',100,10000],['#dpLimit','dpLimit',1,10]])$(selector).onchange=e=>{const list=active();if(!list)return;const value=Number(e.target.value);if(!Number.isInteger(value)||value<min||value>max){e.target.value=list[key];toast(`El límite debe ser un entero entre ${min} y ${max}.`);return;}list[key]=value;touch();};
$('#forceDisposition').onchange=e=>{if(active()){active().forceDisposition=e.target.value;touch();}};
$('#detachmentPicker').onchange=e=>{const list=active();if(!list||e.target.type!=='checkbox')return;const name=e.target.value;list.detachmentNames=e.target.checked?[...list.detachmentNames,name]:list.detachmentNames.filter(n=>n!==name);touch();};
$('#armyUnits').onchange=e=>{
  const list=active(),row=list?.units.find(u=>u.id===e.target.dataset.rowId);if(!row)return;
  const field=e.target.dataset.field;
  if(field==='optionIndex')row.optionIndex=Number(e.target.value);
  if(field==='enhancement')row.enhancement=e.target.value?JSON.parse(e.target.value):null;
  if(field==='warlord')list.units.forEach(u=>u.warlord=u.id===row.id);
  if(field==='attachedTo'){try{ArmyLists.assignAttachment(list,row.id,e.target.value);}catch(error){toast(error.message);render();return;}}
  touch();
};
function handleAction(e){
  const button=e.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action,name=button.dataset.name,rowId=button.dataset.rowId;
  if(action==='add')showAdd(name);
  if(action==='catalog-profile')Profiles.openUnit(name,{onAdd:showAdd});
  if(action==='profile')openArmyProfile(rowId);
  if(action==='detachment')Profiles.openDetachment(name,{entries:active().detachmentNames.map(name=>({name,key:name}))});
  if(action==='remove'){
    const list=active();if(!list)return;const removedUnit=ArmyLists.removeUnit(list,rowId);if(!removedUnit)return;
    removed={listId:list.id,...removedUnit};touch();toast(`${removed.unit.name} retirada.`,true);
  }
}
['#armyUnits','#unitCatalog','#battleUnits','#battleDetachments'].forEach(selector=>$(selector).onclick=handleAction);
$('#armyToast').onclick=e=>{if(e.target.id!=='undoRemove'||!removed)return;const list=state.lists.find(list=>list.id===removed.listId);if(list){ArmyLists.restoreUnit(list,removed);removed=null;touch();toast('Unidad restaurada.');}};
$('#addUnitOption').onchange=updateAddCost;
$('#addUnitForm').onsubmit=e=>{e.preventDefault();try{const name=pendingUnit;ArmyLists.addUnit(active(),name,Number($('#addUnitOption').value));$('#addUnitDialog').close();touch();toast(`${name} añadida a la lista.`);}catch(error){toast(error.message);}};
$('#addUnitProfile').onclick=()=>{const name=pendingUnit;$('#addUnitDialog').close();Profiles.openUnit(name,{onAdd:showAdd});};
$('#catalogSearch').addEventListener('input',renderCatalog);$('#catalogCategory').addEventListener('change',renderCatalog);
$('#battleSearch').addEventListener('input',()=>{if(active())renderBattle(active(),ArmyLists.evaluate(active()));});
$('#battleToggle').onclick=()=>{battle=!battle;render();window.scrollTo({top:0,behavior:'smooth'});};
document.querySelectorAll('button[data-pane]').forEach(button=>button.onclick=()=>setPane(button.dataset.pane));
['#addMobile','#addFirstUnit'].forEach(selector=>$(selector).onclick=()=>setPane('catalog'));
$('#exportText').onclick=()=>{if(!active())return;$('#exportContent').value=ArmyLists.exportText(active());$('#listMenu').open=false;$('#exportDialog').showModal();};
$('#downloadText').onclick=()=>download($('#exportContent').value,'text/plain;charset=utf-8','.txt');
$('#copyListText').onclick=async()=>{try{await navigator.clipboard.writeText($('#exportContent').value);toast('Lista copiada.');}catch{$('#exportContent').focus();$('#exportContent').select();toast('Seleccionado. Usa la opción Copiar de tu navegador.');}};
$('#exportJSON').onclick=()=>{download(JSON.stringify(state,null,2),'application/json','.json');$('#listMenu').open=false;};
$('#importJSON').onclick=()=>{$('#listMenu').open=false;$('#importFile').click();};
$('#importFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5_000_000)throw Error('La copia JSON debe ocupar menos de 5 MB.');const count=ArmyLists.importLists(state,await file.text());battle=false;touch();toast(`${count} ${count===1?'lista importada':'listas importadas'}. Se conservan tus listas anteriores.`);}catch(error){toast(`No se ha importado el archivo. ${error.message}`);}finally{e.target.value='';}};
window.addEventListener('storage',e=>{if(e.key!==ArmyLists.STORAGE_KEY)return;const loaded=ArmyLists.load();if(loaded.error){storageWarning(loaded.error);return;}state=loaded.state;$('#profileDialog').close();$('#addUnitDialog').close();render();toast('Listas actualizadas desde otra pestaña.');});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();if(battle)$('#battleSearch').focus();else if(active())setPane('catalog');}});
render();
const requestedUnit=requested.get('add');if(requestedUnit&&UNIT_POINTS[requestedUnit]){showAdd(requestedUnit);updateURL();}else Profiles.openFromHash();
