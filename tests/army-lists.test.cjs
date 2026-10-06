const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(){
  const storage=new Map();let failSave=false;
  const context=vm.createContext({crypto:require('node:crypto').webcrypto,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>{if(failSave)throw Error('QuotaExceededError');storage.set(key,value)}}});
  for(const name of ['units-data.js','detachments-data.js','unit-points.js','enhancement-points.js','army-lists.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
  const run=code=>vm.runInContext(code,context),json=code=>JSON.parse(run(`JSON.stringify(${code})`));
  run("const list=ArmyLists.newList('Golden Host'); list.detachmentNames=['Guardians of the Throne'];list.forceDisposition='Priority Assets';");
  return {context,storage,run,json,failSave:()=>failSave=true};
}

test('prices follow datasheet copies across sizes and recalculate after removal',()=>{
  const {run,json}=setup();
  run("ArmyLists.addUnit(list,'Custodian Wardens',0);ArmyLists.addUnit(list,'Custodian Wardens',1);ArmyLists.addUnit(list,'Custodian Wardens',0)");
  assert.deepEqual(json('ArmyLists.evaluate(list).rows.map(row=>row.basePoints)'),[200,325,230]);
  assert.equal(run('ArmyLists.evaluate(list).points'),755);
  run('list.units.splice(0,1)');
  assert.deepEqual(json('ArmyLists.evaluate(list).rows.map(row=>row.basePoints)'),[295,230]);
  assert.equal(run('ArmyLists.evaluate(list).points'),525);
});
test('shield variants share copy counter, Rhino includes fourth and later cost',()=>{
  const {run,json}=setup();
  run("ArmyLists.addUnit(list,'Shield-Captain',0);ArmyLists.addUnit(list,'Shield-Captain',1)");
  assert.deepEqual(json('ArmyLists.evaluate(list).rows.map(row=>row.basePoints)'),[180,225]);
  run("for(let i=0;i<5;i++)ArmyLists.addUnit(list,'Psykana Rhino')");
  assert.deepEqual(json("ArmyLists.evaluate(list).rows.filter(row=>row.name==='Psykana Rhino').map(row=>row.basePoints)"),[70,70,70,80,80]);
});
test('N/A and unspecified fourth copy are rejected without mutating army',()=>{
  const {run}=setup();run("ArmyLists.addUnit(list,'Trajann Valoris')");
  assert.throws(()=>run("ArmyLists.addUnit(list,'Trajann Valoris')"),/no incluye coste/);
  assert.equal(run('list.units.length'),1);
  run("for(let i=0;i<3;i++)ArmyLists.addUnit(list,'Custodian Wardens')");
  assert.throws(()=>run("ArmyLists.addUnit(list,'Custodian Wardens')"),/no incluye coste/);
  assert.equal(run('list.units.length'),4);
  assert.throws(()=>run("ArmyLists.addUnit(list,'Custodian Wardens',50)"),/tamaño o equipo/);
});
test('imported rows with unknown cost retain an incomplete subtotal',()=>{
  const {run,json}=setup();run("ArmyLists.addUnit(list,'Trajann Valoris');list.units.push({...list.units[0],id:'second-trajann',warlord:false})");
  const result=json('ArmyLists.evaluate(list)');
  assert.equal(result.points,265);assert.equal(result.complete,false);assert.equal(result.rows[1].total,null);
  assert.ok(result.issues.some(issue=>issue.includes('Falta el coste')));
  assert.match(run('ArmyLists.exportText(list)'),/265 \+ pendientes puntos/);
});
test('enhancements are charged and duplicate/orphan upgrades are flagged',()=>{
  const {run,json}=setup();run("ArmyLists.addUnit(list,'Shield-Captain');ArmyLists.addUnit(list,'Blade Champion');list.units.forEach(u=>u.enhancement={detachment:'Guardians of the Throne',name:'Eagle’s Eye'})");
  let result=json('ArmyLists.evaluate(list)');
  assert.equal(result.points,415);assert.ok(result.issues.some(issue=>issue.includes('está repetida')));
  run('list.detachmentNames=[]');result=json('ArmyLists.evaluate(list)');
  assert.ok(result.issues.some(issue=>issue.includes('no está seleccionado')));
  assert.equal(result.points,415);
});
test('DP, force dispositions, budget and missing Warlord are reported',()=>{
  const {run,json}=setup();run("list.detachmentNames=['Guardians of the Throne','Aquilan Shield'];list.forceDisposition='Reconnaissance';list.pointsLimit=100;ArmyLists.addUnit(list,'Custodian Guard')");
  let result=json('ArmyLists.evaluate(list)');assert.equal(result.dp,4);
  assert.ok(result.issues.some(issue=>issue.includes('140 puntos')));assert.ok(result.issues.some(issue=>issue.includes('1 DP')));assert.ok(result.issues.some(issue=>issue.includes('Warlord')));assert.ok(result.issues.some(issue=>issue.includes('no incluye Reconnaissance')));
  run("list.detachmentNames=['Lions of the Emperor']");result=json('ArmyLists.evaluate(list)');
  assert.equal(result.dpComplete,false);assert.ok(result.issues.some(issue=>issue.includes('DP de Lions')));
});
test('auto Warlord moves to Trajann and clones are independent',()=>{
  const {run,json}=setup();run("ArmyLists.addUnit(list,'Shield-Captain');ArmyLists.addUnit(list,'Trajann Valoris');const copy=ArmyLists.duplicate(list);copy.units[0].optionIndex=1");
  assert.deepEqual(json('list.units.map(u=>u.warlord)'),[false,true]);assert.equal(run('list.units[0].optionIndex'),0);
  assert.notEqual(run('copy.id'),run('list.id'));assert.notEqual(run('copy.units[0].id'),run('list.units[0].id'));
});
test('save, reload, JSON portability and import do not overwrite previous lists',()=>{
  const {run,json}=setup();run("ArmyLists.addUnit(list,'Shield-Captain');const state={version:1,activeListId:list.id,lists:[list]};ArmyLists.save(state);const reloaded=ArmyLists.load();");
  assert.deepEqual(json('reloaded.state'),json('state'));assert.equal(run('reloaded.error'),null);
  assert.equal(run('ArmyLists.importLists(state,JSON.stringify(state))'),1);assert.equal(run('state.lists.length'),2);
  assert.notEqual(run('state.lists[0].id'),run('state.lists[1].id'));assert.notEqual(run('state.lists[0].units[0].id'),run('state.lists[1].units[0].id'));
  run('state.lists[1].name="Imported"');assert.equal(run('state.lists[0].name'),'Golden Host');
});
test('corrupt, unsupported or unknown imports fail atomically; storage failures surface',()=>{
  const env=setup(),{run}=env;run('const state={version:1,activeListId:list.id,lists:[list]}');
  for(const raw of ['{bad','{"version":2,"lists":[]}','{"version":1,"lists":[{"name":"Bad","pointsLimit":2000,"dpLimit":3,"detachmentNames":[],"units":[{"name":"Unknown","optionIndex":0}]}]}'])assert.throws(()=>run(`ArmyLists.importLists(state,${JSON.stringify(raw)})`));
  assert.equal(run('state.lists.length'),1);
  env.storage.set(run('ArmyLists.STORAGE_KEY'),'broken');assert.ok(run('ArmyLists.load().error'));
  env.failSave();assert.throws(()=>run('ArmyLists.save(state)'),/Quota/);
});
test('export text includes sizes, copy order, enhancements, Warlord and force settings',()=>{
  const {run}=setup();run("ArmyLists.addUnit(list,'Shield-Captain',1);list.units[0].enhancement={detachment:'Guardians of the Throne',name:'Eagle’s Eye'}");
  const text=run('ArmyLists.exportText(list)');
  for(const expected of ['Golden Host (235 puntos)','Shield-Captain (235 puntos)','1ª unidad · Con escudo','Warlord','Eagle’s Eye (30 pts)','3 / 3 DP','Priority Assets'])assert.ok(text.includes(expected),expected);
});

test('attachment roles follow photographed profiles, including Support and a solo jetbike captain',()=>{
  const {run}=setup();
  for(const name of ['Trajann Valoris','Shield-Captain','Shield-Captain (Allarus)','Blade Champion'])assert.equal(run(`ArmyLists.attachmentRole(${JSON.stringify(name)})`),'Leader');
  assert.equal(run("ArmyLists.attachmentRole('Knight-Centura')"),'Support');
  assert.equal(run("ArmyLists.attachmentRole('Shield-Captain (Dawneagle Jetbike)')"),null);
  assert.equal(run("ArmyLists.attachmentRole('Custodian Wardens')"),null);
});
test('manual attachments use entry IDs, enforce slots and never change the point total',()=>{
  const {run,json}=setup();
  run("const captain=ArmyLists.addUnit(list,'Shield-Captain'),champion=ArmyLists.addUnit(list,'Blade Champion'),first=ArmyLists.addUnit(list,'Custodian Wardens'),second=ArmyLists.addUnit(list,'Custodian Wardens');const before=ArmyLists.evaluate(list).points;ArmyLists.assignAttachment(list,captain.id,second.id)");
  assert.equal(run('ArmyLists.evaluate(list).points'),run('before'));
  assert.deepEqual(json('ArmyLists.attachmentTargets(list,champion.id).map(u=>u.id)'),[run('first.id')]);
  assert.throws(()=>run('ArmyLists.assignAttachment(list,champion.id,second.id)'),/puesto libre/);
  assert.equal(run('champion.attachedTo'),null);
  assert.throws(()=>run('ArmyLists.assignAttachment(list,captain.id,captain.id)'),/puesto libre/);
  assert.throws(()=>run('ArmyLists.assignAttachment(list,captain.id,champion.id)'),/puesto libre/);
  assert.throws(()=>run('ArmyLists.assignAttachment(list,first.id,second.id)'),/no tiene Leader/);
  run('ArmyLists.assignAttachment(list,captain.id,first.id);ArmyLists.assignAttachment(list,champion.id,second.id)');
  assert.equal(run('captain.attachedTo'),run('first.id'));
  assert.equal(run('champion.attachedTo'),run('second.id'));
  run('ArmyLists.assignAttachment(list,captain.id,null)');assert.equal(run('captain.attachedTo'),null);
});
test('Support needs a bodyguard and has an independent slot from Leader',()=>{
  const {run,json}=setup();run("const support=ArmyLists.addUnit(list,'Knight-Centura'),leader=ArmyLists.addUnit(list,'Shield-Captain'),bodyguard=ArmyLists.addUnit(list,'Prosecutor Squad')");
  assert.ok(json('ArmyLists.evaluate(list).issues').some(issue=>issue.includes('debe unirse')));
  // Structural slots only: unit compatibility remains a manual rules check.
  run('ArmyLists.assignAttachment(list,support.id,bodyguard.id);ArmyLists.assignAttachment(list,leader.id,bodyguard.id)');
  assert.ok(!json('ArmyLists.evaluate(list).issues').some(issue=>issue.includes('debe unirse')||issue.includes('más de un')));
  run("const other=ArmyLists.addUnit(list,'Knight-Centura')");assert.throws(()=>run('ArmyLists.assignAttachment(list,other.id,bodyguard.id)'),/puesto libre/);
});
test('remove and undo restore attachments without overwriting intervening assignments',()=>{
  const {run,json}=setup();run("const captain=ArmyLists.addUnit(list,'Shield-Captain'),champion=ArmyLists.addUnit(list,'Blade Champion'),first=ArmyLists.addUnit(list,'Custodian Wardens'),second=ArmyLists.addUnit(list,'Custodian Wardens');ArmyLists.assignAttachment(list,captain.id,first.id);const removed=ArmyLists.removeUnit(list,first.id)");
  assert.equal(run('captain.attachedTo'),null);assert.equal(run('ArmyLists.validateList(list).units.length'),3);
  run('ArmyLists.restoreUnit(list,removed)');assert.equal(run('captain.attachedTo'),run('first.id'));
  assert.deepEqual(json('list.units.map(u=>u.id)'),[run('captain.id'),run('champion.id'),run('first.id'),run('second.id')]);
  run('const removedCaptain=ArmyLists.removeUnit(list,captain.id);ArmyLists.assignAttachment(list,champion.id,first.id);ArmyLists.restoreUnit(list,removedCaptain)');
  assert.equal(run('captain.attachedTo'),run('first.id')); // Original object was removed; the restored entry is a fresh object.
  assert.equal(run('list.units.find(u=>u.id===captain.id).attachedTo'),null);
  assert.equal(run('champion.attachedTo'),run('first.id'));
});
test('save, duplicate and JSON import preserve internal attachments with new IDs',()=>{
  const {run,json}=setup();run("const captain=ArmyLists.addUnit(list,'Shield-Captain'),wardens=ArmyLists.addUnit(list,'Custodian Wardens');ArmyLists.assignAttachment(list,captain.id,wardens.id);const state={version:1,activeListId:list.id,lists:[list]};ArmyLists.save(state);const reloaded=ArmyLists.load().state;const copy=ArmyLists.duplicate(list);ArmyLists.importLists(state,JSON.stringify(state))");
  assert.deepEqual(json('reloaded'),json('{version:1,activeListId:list.id,lists:[list]}'));
  assert.equal(run('copy.units[0].attachedTo'),run('copy.units[1].id'));
  assert.notEqual(run('copy.units[0].attachedTo'),run('wardens.id'));
  assert.equal(run('state.lists[1].units[0].attachedTo'),run('state.lists[1].units[1].id'));
  run('copy.units[0].attachedTo=null');assert.equal(run('captain.attachedTo'),run('wardens.id'));
});
test('old backups load with empty attachments and invalid links fail import atomically',()=>{
  const {run}=setup();run("ArmyLists.addUnit(list,'Shield-Captain');ArmyLists.addUnit(list,'Custodian Wardens');list.units.forEach(u=>delete u.attachedTo);const state={version:1,activeListId:list.id,lists:[list]};const old=ArmyLists.parse(JSON.stringify(state))");
  assert.equal(run('old.lists[0].units[0].attachedTo'),null);
  for(const target of ['missing',42,{}]){
    run(`list.units[0].attachedTo=${JSON.stringify(target)}`);
    assert.throws(()=>run('ArmyLists.importLists(state,JSON.stringify(state))'),/asignación/);
    assert.equal(run('state.lists.length'),1);
  }
  run("list.units[0].attachedTo=null;const other=ArmyLists.addUnit(list,'Blade Champion');list.units[0].attachedTo=list.units[1].id;other.attachedTo=list.units[1].id");
  assert.throws(()=>run('ArmyLists.validateList(list)'),/más de un Leader/);
});
test('text export identifies both ends of attachment and exact copy/size without double charging',()=>{
  const {run}=setup();run("const captain=ArmyLists.addUnit(list,'Shield-Captain');ArmyLists.addUnit(list,'Custodian Wardens');const second=ArmyLists.addUnit(list,'Custodian Wardens',1);ArmyLists.assignAttachment(list,captain.id,second.id)");
  const text=run('ArmyLists.exportText(list)');
  assert.ok(text.includes('Golden Host (705 puntos)'));
  assert.ok(text.includes('Unido como Leader a: Custodian Wardens · 2ª unidad · 3 miniaturas'));
  assert.ok(text.includes('Leader: Shield-Captain · 1ª unidad · Base'));
  assert.ok(text.includes('compatibilidad de Leader/Support'));
});
