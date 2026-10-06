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
