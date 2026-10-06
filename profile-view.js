const Profiles = (() => {
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function renderPointsBadge(u){
  const points=getUnitPoints(u), models=points.options?.filter(option=>option.models).map(option=>option.models);
  const context=points.status==='missing'?'Sin coste en la tabla':`1ª unidad${models?.length?` · ${models.join(' / ')} miniaturas`:''}`;
  return `<div class="unit-points ${points.status==='missing'?'is-missing':''}"><b>${esc(pointsSummary(points))}</b><span>${esc(context)}</span></div>`;
}
function renderPointsTable(points){
  if(!points.options?.length)return `<p class="points-pending">${esc(pointsSummary(points))}</p>`;
  const fourth=points.options.some(option=>option.fourthPlus!=null);
  const value=cost=>cost==null?'<span class="points-na">No disponible</span>':`${esc(cost)} <span class="points-unit">pts</span>`;
  return `<div class="points-table-wrap"><table class="points-table"><caption>Coste por orden de unidad</caption><thead><tr><th scope="col">Tamaño / equipo</th><th scope="col">1ª</th><th scope="col">2ª</th><th scope="col">3ª</th>${fourth?'<th scope="col">4ª+</th>':''}</tr></thead><tbody>${points.options.map(option=>`<tr><th scope="row">${esc([option.models?`${option.models} miniaturas`:'',option.label||''].filter(Boolean).join(' · ')||'Unidad')}</th>${option.points.map(cost=>`<td>${value(cost)}</td>`).join('')}${fourth?`<td>${value(option.fourthPlus)}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function renderPointsDetail(u, title='Coste en puntos'){
  const points=getUnitPoints(u);
  return `<section class="sheet-points" aria-label="${esc(title)}"><div class="points-heading"><h3>${esc(title)}</h3><span>${points.status==='missing'?'Por confirmar':'Confirmado'}</span></div>${renderPointsTable(points)}${points.note?`<p class="points-note">${esc(points.note)}</p>`:''}<p class="points-source">Fuente: tabla de puntos confirmados facilitada el 03/10/2026. Columnas: primera, segunda y tercera unidad${points.options?.some(option=>option.fourthPlus!=null)?'; cuarta y siguientes donde se indica':''}. Solo se muestran los tamaños y equipos indicados.</p></section>`;
}
function renderDetachmentCommand(d){
  const cost=d.costDP==null?'Por confirmar':`${d.costDP} DP`;
  const dispositions=d.forceDispositions?.length?d.forceDispositions.join(' + '):'Por confirmar';
  return `<dl class="det-command"><div><dt>Coste</dt><dd>${esc(cost)}</dd></div><div><dt>Disposición de fuerza</dt><dd>${esc(dispositions)}</dd></div></dl>`;
}
function renderEnhancement(d, name, text){
  const points=getEnhancementPoints(d.name,name);
  return `<article class="det-entry"><div class="det-entry-top"><strong>${esc(name)}</strong><span class="enhancement-points ${points==null?'is-pending':''}">${points==null?'Puntos por confirmar':`${esc(points)} pts`}</span></div><p>${esc(text)}</p>${points==null?'<p class="enhancement-note">Esta mejora no figura en la tabla de puntos facilitada.</p>':''}</article>`;
}
function unitMarkup(u){const img=`images/${u.photo}.jpeg`;return `<div class="sheet-top"><div><div class="eyebrow">ADEPTUS CUSTODES · FOTO ${u.photo} · PÁG. ${esc(u.page)}</div><h2>${esc(u.name)}</h2></div><button class="icon-button" id="closeProfile" aria-label="Cerrar">×</button></div><div id="profile-points">${renderPointsDetail(u)}</div><div class="sheet-hero"><img src="${img}" alt="Foto de referencia de ${esc(u.name)}"><div class="stats-grid">${['M','T','SV','W','LD','OC','Invulnerable'].map((k,i)=>`<div><span>${k}</span><b>${esc(u.stats[i])}</b></div>`).join('')}</div></div><div class="sheet-two"><section id="profile-weapons"><h3>Armas a distancia y cuerpo a cuerpo</h3><div class="weapon-table"><div class="weapon-row weapon-head"><span>Arma</span><span>Rango</span><span>A</span><span>HA/HP</span><span>F</span><span>AP</span><span>D</span></div>${u.weapons.map(w=>`<div class="weapon-row"><strong>${esc(w[0])}</strong><span>${esc(w[1])}</span><span>${esc(w[2])}</span><span>${esc(w[3])}</span><span>${esc(w[4])}</span><span>${esc(w[5])}</span><span>${esc(w[6])}</span></div>`).join('')}</div><h3>Composición de la unidad</h3><p class="sheet-copy">${esc(u.composition)}</p></section><section id="profile-rules"><h3>Habilidades</h3><div class="ability-box"><b>Habilidades básicas</b><p>${esc(u.core)}</p></div>${u.rules.map((r,i)=>`<div class="ability-box"><b>${i===0?'Regla de unidad':'Habilidad'}</b><p>${esc(r)}</p></div>`).join('')}<h3>Palabras clave</h3><p class="keywords">${esc(u.keywords)}</p><h3>Fuente</h3><a class="source-photo" href="${img}" target="_blank" rel="noreferrer">Abrir foto original · ${u.photo}.jpeg</a></section></div><details class="ocr-source"><summary>Ver OCR completo de esta página</summary><pre id="pageOcr">Cargando transcripción OCR…</pre></details>`;}
function detachmentMarkup(d){const image=d.photos[0];return `<div class="det-top"><div><div class="eyebrow">ADEPTUS CUSTODES · ${esc(d.group.toUpperCase())} · PÁG. ${esc(d.page)}</div><h2>${esc(d.name)}</h2></div><button class="icon-button" id="closeProfile" aria-label="Cerrar">×</button></div>${renderDetachmentCommand(d)}<div class="det-hero"><img src="images/${image}.jpeg" alt="Página de ${esc(d.name)}"><div><p class="det-intro">${esc(d.theme)}</p><div class="det-rule-box"><b>Regla de destacamento · ${esc(d.rule)}</b><p>${esc(d.ruleText)}</p></div><div class="source-chips">${d.photos.map(p=>`<a href="images/${p}.jpeg" target="_blank" rel="noreferrer">Abrir foto ${p}.jpeg</a>`).join('')}</div></div></div><div class="det-detail-grid"><section class="det-section"><h3>Mejoras</h3>${d.enhancements.map(([n,t])=>renderEnhancement(d,n,t)).join('')}<p class="det-source-note">Costes: tabla de puntos confirmados facilitada el 03/10/2026.</p></section><section class="det-section"><h3>Estratagemas</h3>${d.stratagems.map(([n,cp,t])=>`<article class="det-entry"><div class="det-entry-top"><strong>${esc(n)}</strong><span class="cp">${esc(cp)}</span></div><p>${esc(t)}</p></article>`).join('')}</section></div><p class="det-source-note">Resumen de consulta basado en la transcripción de las fotos; usa el OCR y la imagen original para validar el texto exacto.</p><div class="det-ocr">${d.photos.map(p=>`<details><summary>Ver OCR de foto ${p}.jpeg</summary><pre id="ocr-${p}">Cargando transcripción…</pre></details>`).join('')}</div>`;}
let current=null, generation=0;
const catalog=()=>[...units,...ADDITIONAL_POINT_UNITS];
function costOnlyMarkup(u){return `<div class="sheet-top"><div><div class="eyebrow">ADEPTUS CUSTODES · ${esc(u.category)}</div><h2>${esc(u.name)}</h2></div><button class="icon-button" id="closeProfile" aria-label="Cerrar">×</button></div><p class="sheet-copy">La tabla incluye sus puntos. La ficha de armas y habilidades aún no está transcrita.</p><div id="profile-points">${renderPointsDetail(u)}</div>`;}
function show(kind,name,options={}){
  const data=(kind==='unit'?catalog():detachments).find(u=>u.name===name);
  if(!data)return;
  const entries=options.entries?.length?options.entries:(kind==='unit'?catalog():detachments).map(u=>({name:u.name,key:u.name}));
  const index=Math.max(0,entries.findIndex(u=>u.key===(options.key||name)));
  current={kind,name,options:{...options,entries,key:entries[index].key},index};
  const context=options.contextFor?.(entries[index]);
  const extra=context?`<div class="profile-context"><strong>${esc(context.title)}</strong>${context.enhancement?`<p><b>${esc(context.enhancement.name)}</b> · ${esc(context.enhancement.points)} pts<br>${esc(context.enhancement.text)}</p>`:''}</div>`:'';
  const nav=`<div class="profile-nav"><button type="button" id="profilePrev" aria-label="Perfil anterior" ${index===0?'disabled':''}>‹</button><label class="sr-only" for="profileJump">Cambiar perfil</label><select id="profileJump">${entries.map((entry,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(entry.label||entry.name)}</option>`).join('')}</select><button type="button" id="profileNext" aria-label="Perfil siguiente" ${index===entries.length-1?'disabled':''}>›</button><button type="button" id="profileDismiss" aria-label="Cerrar perfil">×</button></div>`;
  const sections=kind==='unit'?`<div class="profile-shortcuts"><button type="button" data-profile-section="profile-points">Puntos</button>${data.weapons?'<button type="button" data-profile-section="profile-weapons">Armas</button><button type="button" data-profile-section="profile-rules">Habilidades</button>':''}<a class="profile-add" href="listas.html?add=${encodeURIComponent(name)}${options.listId?`&amp;list=${encodeURIComponent(options.listId)}`:''}">+ Añadir a lista</a></div>`:'';
  let html=kind==='unit'?(data.weapons?unitMarkup(data):costOnlyMarkup(data)):detachmentMarkup(data);
  if(context&&kind==='unit'&&data.weapons)html=html.replace(`<div id="profile-points">${renderPointsDetail(data)}</div>`,`<details id="profile-points" class="profile-points-toggle"><summary>Costes por copia y tamaño</summary>${renderPointsDetail(data)}</details>`);
  const content=$('#profileContent'),dialog=$('#profileDialog');
  content.classList.toggle('profile-for-army',!!context);
  content.innerHTML=nav+extra+sections+html;
  content.scrollTop=0;
  $('#closeProfile').onclick=()=>dialog.close();$('#profileDismiss').onclick=()=>dialog.close();
  $('#profilePrev').onclick=()=>move(-1);$('#profileNext').onclick=()=>move(1);
  $('#profileJump').onchange=e=>move(Number(e.target.value)-current.index);
  content.querySelectorAll('[data-profile-section]').forEach(button=>button.onclick=()=>{const section=document.getElementById(button.dataset.profileSection);if(section?.tagName==='DETAILS')section.open=true;section?.scrollIntoView({block:'start',behavior:'smooth'})});
  if(options.onAdd){const add=content.querySelector('.profile-add');if(add){add.textContent='+ Añadir otra unidad';add.onclick=e=>{e.preventDefault();dialog.close();options.onAdd(name)}}}
  if(!dialog.open)dialog.showModal();
  history.replaceState(null,'',`${location.pathname}${location.search}#${kind}=${encodeURIComponent(name)}`);
  const token=++generation;
  fetch('/api/ocr').then(r=>r.json()).then(data=>{
    if(token!==generation)return;
    if(kind==='unit'){const el=$('#pageOcr');if(el)el.textContent=data[currentPhoto()]||'No hay transcripción guardada para esta foto.'}
    else currentPhotos().forEach(p=>{const el=$(`#ocr-${p}`);if(el)el.textContent=data[p]||'No hay transcripción guardada para esta foto.'});
  }).catch(()=>{if(token!==generation)return;content.querySelectorAll('.ocr-source pre,.det-ocr pre').forEach(el=>el.textContent='No se pudo cargar el OCR guardado. Puedes consultar la foto original.');});
}
function currentPhoto(){return units.find(u=>u.name===current?.name)?.photo;}
function currentPhotos(){return detachments.find(d=>d.name===current?.name)?.photos||[];}
function move(delta){if(!current)return;const i=current.index+delta,entry=current.options.entries[i];if(entry)show(current.kind,entry.name,{...current.options,key:entry.key});}
function openFromHash(){const hash=location.hash.slice(1),at=hash.indexOf('=');if(at<0)return;try{const kind=hash.slice(0,at),name=decodeURIComponent(hash.slice(at+1));if(kind==='unit'||kind==='detachment')show(kind,name);}catch{}}
const dialog=$('#profileDialog');
dialog?.addEventListener('close',()=>{generation++;current=null;if(/^#(?:unit|detachment)=/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);});
document.addEventListener('keydown',e=>{if(!dialog?.open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='ArrowRight'){e.preventDefault();move(1)}});
return {openUnit:(name,options)=>show('unit',name,options),openDetachment:(name,options)=>show('detachment',name,options),openFromHash,renderPointsBadge,renderPointsDetail,renderDetachmentCommand};
})();
