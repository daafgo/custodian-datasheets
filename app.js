const photos = [
  ['01','Shield-Captains','Unidades','p. 107','Allarus Terminator Armour · Dawneagle Jetbike','shield captain; allarus; terminator; jetbike; guardian spear; salvo launcher'],
  ['02','Blade Champion · Sentinel Guard','Unidades','p. 108','Vaultswords · Sentinel Blade · Vexilla','blade champion; sentinel guard; sodality; vaultswords; vexilla; stand vigil'],
  ['03','Custodian Guard · Wardens','Unidades','p. 109','Guardian Spear · Castellan Axe · Living Fortress','custodian guard; wardens; guardian spear; castellan axe; vexilla'],
  ['04','Trajann Valoris · Shield-Captain','Unidades','p. 106','Moment Shackle · Watcher’s Axe · Praesidium Shield','trajann valoris; shield captain; moment shackle; watcher axe; captain-general'],
  ['05','Aquilon Terminators','Unidades','p. 111','Solarite Power Gauntlets · Solarite Power Talons','aquilon terminators; adrat(h)ic combi-destructor; solarite power gauntlet; infernus firepike'],
  ['06','Venatari','Unidades','p. 112','Kinetic Destroyers · Verutum Lances','venatari; kinetic destroyer; tarsus buckler; verutum lance; swift ruin'],
  ['07','Telemon Heavy Dreadnought','Vehículos','p. 113','Arachnus Storm Cannon · Iliastus Accelerator Culverin','telemon; dreadnought; caestus fist; arachnus storm cannon; spiculus bolt launcher'],
  ['08','Contemptor-Galatus · Achilles','Vehículos','p. 114','Warblade · Dreadspear · Twin Infernus Incinerator','galatus; achillus; contemptor dreadnought; warblade; dreadspear'],
  ['09','Allarus Custodians','Unidades','p. 110','Slayer of Tyrants · Vexilla · Ballistus Grenade Launcher','allarus custodians; castellan axe; guardian spear; slayer of tyrants; vexilla'],
  ['10','Estratagemas · Guardians of the Throne','Destacamentos','—','Superhuman Focus · Shield of Honour · Prime Target','superhuman focus; unlimited endurance; shield of honour; prime target; swift as the eagle'],
  ['11','Aquilan Shield','Destacamentos','p. 94','Gilded Guardians · Salvo Ka’tah · Pareldor’s Caducatrix','aquilan shield; gilded guardians; manoeuvre and fire; tip of the talon; rapid reactions'],
  ['12','Guardians of the Throne','Destacamentos','p. 92','Martial Mastery · Enhancements','guardians of the throne; martial mastery; bane of abominations; emperor’s light; castellan’s mark; eagle’s eye'],
  ['13','Emperor’s Chosen','Destacamentos','—','Magna Imperator · Rendax · Radiant Mantle','emperor chosen; magna imperator; rendax; superhuman focus; in auramite clad; impenetrable bastion'],
  ['14','Emissaries Imperatus','Destacamentos','p. 96','Heralds of the Throne · Conservai · Bearers of His Light','emissaries imperatus; heralds of the throne; conservai; auriferous orb; slayers of nightmares; selfless service'],
  ['15','Shadowkeepers','Destacamentos','p. 98','Wardens of the Dark Cells · Kaptaris · Grim Responsibility','shadowkeepers; wardens of the dark cells; kaptaris; no escape; indomitable guardians; unstoppable destroyer'],
  ['16','Dread Host','Destacamentos','—','Instruments of the Emperor’s Wrath · Dacatarai','dread host; lightning wrath; golden light of the moiraides; preternatural rapidity; auric exemplar'],
  ['17','Honoured Companions','Destacamentos','p. 101','Companion’s Watch · Trusted Sentinel','honoured companions; companions watch; trusted sentinel; emperor’s domain; avenge the fallen; swift as the eagle'],
  ['18','Auric Champions','Destacamentos','p. 100','Assemblage of Might · Gilded Champion','auric champions; dreadful foe; shroud of the hidden blade; duty unto death; superior creation'],
  ['19','Lions of the Emperor','Destacamentos','p. 102','On Gilded Wings · Lightning Descent · Leonine Ferocity','lions of the emperor; terminator; lightning descent; vigil unending; unleash the lions; fury of the emperor'],
  ['20','Solar Watch','Destacamentos','p. 99','Talon Sortie · Calistus · Sally Forth','solar watch; talon sortie; calistus; inexorable; at spear’s length; gravimetric grenade'],
  ['21','Null Maiden Vigil','Hermanas del Silencio','p. 105','Silent Sisterhood · Anathema Psykana','null maiden vigil; silent sisterhood; anathema psykana; prosecutor squad; vigilator squad; psy-chaff volley'],
  ['22','Grav-Assault Force','Destacamentos','p. 104','Flare Shields · Combat Deployment · Victory Before Death','grav-assault force; grav-assault; flare shields; advanced stabilisers; inevitable annihilation'],
  ['23','Might of the Moritoi','Destacamentos','p. 103','Moritoi Ancients · Memento Moritoi · Augury Uplink','might of the moritoi; dreadnought; memento moritoi; honoured interred; unceasing onslaught; unstoppable momentum'],
  ['24','Pallas · Coronus','Vehículos','p. 116','Pallas Grav-Attack · Coronus Grav-Carrier','pallas grav-attack; coronus grav-carrier; twin arachnus blaze cannon; transport; mobile hunter'],
  ['25','Caladius Grav-Tanks','Vehículos','p. 117','Caladius · Caladius Annihilator','caladius grav-tank; annihilator; illiastus accelerator cannon; arachnus blaze carronade; advanced firepower'],
  ['26','Knight-Centura · Prosecutors','Hermanas del Silencio','—','Anathema Psykana · Daughters of the Abyss','knight-centura; prosecutor squad; daughters of the abyss; executioner greatblade; purity of execution'],
  ['27','Vigilator Squad','Hermanas del Silencio','—','Executioner Greatblade · Deft Parry','vigilator squad; anathema psykana; executioner greatblade; deft parry; silent sisterhood']
].map(([id,title,category,page,summary,tags])=>({id,title,category,page,summary,tags,image:`images/${id}.jpeg`}));

const KEY='custodes-ocr-v1';
const cached=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
let ocrStore=cached(), workerPromise=null, current=null, selectedId=null, syncTimer=null;
const cards=document.querySelector('#cards'), search=document.querySelector('#search'), category=document.querySelector('#category');
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function render(){
 const q=norm(search.value.trim()), cat=category.value;
 const list=photos.filter(p=>(cat==='all'||p.category===cat)&&(!q||norm(`${p.title} ${p.category} ${p.page} ${p.summary} ${p.tags} ${ocrStore[p.id]||''}`).includes(q)));
 document.querySelector('#resultCount').textContent=`${list.length} ${list.length===1?'resultado':'resultados'}`;
 document.querySelector('#ocrCount').textContent=Object.keys(ocrStore).filter(k=>photos.some(p=>p.id===k)&&ocrStore[k]?.trim()).length;
 document.querySelector('#empty').hidden=list.length!==0;
 cards.innerHTML=list.map(p=>`<article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="Abrir ${p.title}"><div class="thumb"><img src="${p.image}" alt="${p.title}" loading="lazy"><span class="category-tag">${p.category}</span><span class="ocr-badge ${ocrStore[p.id]?.trim()?'done':''}" title="${ocrStore[p.id]?.trim()?'OCR guardado':'OCR pendiente'}">${ocrStore[p.id]?.trim()?'✓':'◎'}</span></div><div class="card-info"><span class="page">${p.page} · FOTO ${p.id}</span><h2>${p.title}</h2><p>${p.summary}</p><div class="card-bottom"><span>${ocrStore[p.id]?.trim()?'Texto disponible':'Texto pendiente'}</span><b>CONSULTAR</b></div></div></article>`).join('');
 cards.querySelectorAll('.card').forEach(c=>{c.addEventListener('click',()=>openPhoto(c.dataset.id));c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPhoto(c.dataset.id)}})});
}
async function getWorker(){
 if(!workerPromise)workerPromise=(async()=>{await new Promise((resolve,reject)=>{if(window.Tesseract)return resolve();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('No se pudo cargar Tesseract.js. Comprueba la conexión a Internet.'));document.head.append(s)});return await Tesseract.createWorker('eng',1,{logger:m=>{if(current?.onProgress&&m.status==='recognizing text')current.onProgress(m.progress)}})})();
 return workerPromise;
}
function saveText(id,text){ocrStore[id]=text;localStorage.setItem(KEY,JSON.stringify(ocrStore));render();if(selectedId===id)document.querySelector('#ocrText').value=text;clearTimeout(syncTimer);syncTimer=setTimeout(()=>fetch('/api/ocr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ocrStore)}).catch(()=>{}),350)}
async function recognize(id,onProgress){current={id,onProgress};const btn=document.querySelector('#runOne');if(btn){btn.disabled=true;btn.textContent='Reconociendo…'}
 try{const worker=await getWorker();const {data}=await worker.recognize(photos.find(p=>p.id===id).image);saveText(id,data.text||'');return data.text||''}
 catch(e){alert(`No se pudo completar el OCR: ${e.message}`);throw e}
 finally{current=null;if(btn){btn.disabled=false;btn.textContent='Pasar OCR'}}
}
function openPhoto(id){const p=photos.find(x=>x.id===id);selectedId=id;document.querySelector('#viewerTitle').textContent=p.title;document.querySelector('#viewerCategory').textContent=`${p.category} · ${p.page} · FOTO ${p.id}`;const img=document.querySelector('#viewerImage');img.src=p.image;img.alt=p.title;document.querySelector('#openOriginal').href=p.image;document.querySelector('#ocrText').value=ocrStore[id]||'';document.querySelector('#viewer').showModal();current={id};}
search.addEventListener('input',render);category.addEventListener('change',render);
document.querySelector('#closeViewer').onclick=()=>document.querySelector('#viewer').close();
document.querySelector('#viewer').addEventListener('click',e=>{if(e.target.id==='viewer')e.target.close()});
document.querySelector('#ocrText').addEventListener('input',e=>{if(selectedId)saveText(selectedId,e.target.value)});
document.querySelector('#runOne').onclick=async()=>{if(selectedId)await recognize(selectedId)};
document.querySelector('#copyText').onclick=async()=>{await navigator.clipboard.writeText(document.querySelector('#ocrText').value);document.querySelector('#copyText').textContent='Copiado';setTimeout(()=>document.querySelector('#copyText').textContent='Copiar',1300)};
document.querySelector('#ocrAll').onclick=async()=>{
 const button=document.querySelector('#ocrAll'),wrap=document.querySelector('#progressWrap'),bar=document.querySelector('#progressBar'),label=document.querySelector('#progressText'),pct=document.querySelector('#progressPct');
 button.disabled=true;wrap.hidden=false;
 try{const worker=await getWorker();const pending=photos.filter(p=>!ocrStore[p.id]?.trim());for(let i=0;i<pending.length;i++){const p=pending[i];label.textContent=`Reconociendo foto ${i+1} de ${pending.length}: ${p.title}`;current={id:p.id,onProgress:v=>{const n=((i+v)/pending.length)*100;bar.style.width=`${n}%`;pct.textContent=`${Math.round(n)}%`}};const {data}=await worker.recognize(p.image);ocrStore[p.id]=data.text||'';localStorage.setItem(KEY,JSON.stringify(ocrStore));const n=((i+1)/pending.length)*100;bar.style.width=`${n}%`;pct.textContent=`${Math.round(n)}%`;render()}label.textContent='OCR completado';button.innerHTML='<span>✓</span> Texto reconocido';}
 catch(e){label.textContent=e.message;button.disabled=false}finally{current=null;button.disabled=false}
};
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement.tagName!=='TEXTAREA'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();search.focus()}if(e.key==='Escape')document.querySelector('#viewer').close()});
render();
fetch('/api/ocr').then(r=>r.ok?r.json():{}).then(saved=>{ocrStore={...saved,...ocrStore};localStorage.setItem(KEY,JSON.stringify(ocrStore));render();return fetch('/api/ocr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ocrStore)})}).catch(()=>{});
