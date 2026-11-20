const views=['고객 조건','모듈 선택','품목 팩 선택','조합 확인'];const typeNames=['수입·유통','식품 제조','급식·식자재','프랜차이즈 본사'];const procurement=['직수입','내자구매','둘 다','미확인'];const yn=['미확인','예','아니요'];const usage=['미확인','사용','미사용'];
const moduleData=Object.fromEntries(Object.values(LIBRARY).filter(m=>/^M(0[1-9]|1[0-2])$/.test(m.id)).map(m=>[m.id,[m.name,m.title,m.status]]));
const packs=[{id:'cheese',name:'치즈 분석 팩',icon:'🧀',example:'수입량 추이 · 국가별 시세 · Sankey'},{id:'tomato',name:'토마토·소스 팩',icon:'🍅',example:'수입 동향 · 공급국 · 공급망'},{id:'meat',name:'육류 분석 팩',icon:'🥩',example:'수입 동향 · 부위별 시세 · 공급망'},{id:'seafood',name:'수산 분석 팩',icon:'🐟',example:'수입 물량 · 국가별 시세 · Sankey'},{id:'oil',name:'올리브유·유지 팩',icon:'🫒',example:'수입 동향 · 주요 수출국 · 공급망'},{id:'general',name:'범용 예시 팩',icon:'◈',example:'공급망 · 수입 추이 · 가격 비교'}];
function fresh(){return {page:3,name:'',type:'프랜차이즈 본사',procure:'내자구매',factory:'미확인',oem:'미확인',mate:'사용',frand:'미확인',manual:{},chosen:['tomato'],order:[],email:false}}let S;try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem('frand-design-studio-v1')||'{}'))}catch(e){S=fresh()}delete S.ck;delete S.owned;delete S.need;let assets={},db=null;const $=id=>document.getElementById(id);function h(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function save(){try{localStorage.setItem('frand-design-studio-v1',JSON.stringify(S))}catch(e){notify('브라우저 저장을 사용할 수 없습니다.')}}function update(k,v){S[k]=v;save();render()}function typetext(v){S.name=v;save();let a=$('summaryName');if(a)a.textContent=v||'입력 전'}function jump(i){S.page=i;save();render();window.scrollTo(0,0)}function reset(){if(confirm('고객 조건과 선택한 구성을 초기화할까요? 등록된 품목 팩 파일은 유지됩니다.')){S=fresh();save();render()}}let timer;function notify(t){$('toast').textContent=t;$('toast').classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.add('hidden'),2700)}
function recom(){let r={M01:'공통 수입 데이터 소개'};if(S.type==='수입·유통')r.M05='수입·유통 기본 모듈';if(S.type==='식품 제조')r.M06='제조사 기본 모듈';if(S.type==='급식·식자재')r.M07='급식·식자재 기본 모듈';if(S.type==='프랜차이즈 본사')r.M08='프랜차이즈 기본 모듈';if(['직수입','둘 다'].includes(S.procure)){r.M02='직수입 조달 선택';if(S.type==='프랜차이즈 본사')r.M09='프랜차이즈 직수입 선택'}if(['내자구매','둘 다'].includes(S.procure))r.M03='수입품 국내 구매 여부 확인 후 활용';if(S.type==='프랜차이즈 본사'){if(S.factory==='예')r.M10='자체공장 운영 선택';if(S.oem==='예')r.M11='OEM 전용상품 운영 선택'}return r}function selected(){let r=recom();return Object.keys(moduleData).filter(k=>S.manual[k]===undefined?!!r[k]:S.manual[k])}function toggleModule(id){S.manual[id]=!selected().includes(id);save();render()}function togglePack(id){S.chosen=S.chosen.includes(id)?S.chosen.filter(x=>x!==id):[...S.chosen,id];save();render()}function intro(){if(S.frand==='사용')return ['F-3','Fran:D 이용 맥락'];if(S.mate==='사용')return ['F-2','MATE 이용 맥락'];return ['F-1','공통 소개']}function filesFor(id){return Object.values(assets).filter(x=>x.pack===id).sort((a,b)=>(a.order??a.created)-(b.order??b.created) || a.id.localeCompare(b.id))}function fileSize(b){return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB'}let assetsReady=false;function initDB(){if(!window.indexedDB){notify('이 브라우저에서는 파일 보관을 사용할 수 없습니다.');return}let q=indexedDB.open('frand-design-studio-assets-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('assets',{keyPath:'id'});q.onerror=()=>notify('파일 보관을 열 수 없습니다.');q.onsuccess=()=>{db=q.result;let tx=db.transaction('assets','readonly');let req=tx.objectStore('assets').getAll();req.onsuccess=()=>{assets=Object.fromEntries(req.result.map(x=>[x.id,x]));refreshPageCounts().finally(initializePackLibrary)}}}
async function addFiles(pack,input){let files=Array.from(input.files);if(!files.length)return;if(!db){notify('파일 보관을 사용할 수 없습니다.');input.value='';return}const counts=await Promise.all(files.map(blob=>countAssetPages({name:blob.name,blob})));let tx=db.transaction('assets','readwrite');let store=tx.objectStore('assets');let entries=files.map((f,i)=>({id:(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random()),pack,pages:counts[i],name:f.name,size:f.size,created:Date.now()+i,blob:f}));entries.forEach(e=>store.put(e));tx.oncomplete=()=>{entries.forEach(e=>assets[e.id]=e);render();notify(entries.length+'개 자료를 등록했습니다.')};tx.onerror=()=>notify('파일 저장에 실패했습니다. 저장 공간을 확인해 주세요.');input.value=''}
function downloadAsset(id){let x=assets[id];if(!x)return;let a=document.createElement('a');a.href=URL.createObjectURL(x.blob);a.download=x.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}function deleteAsset(id){let x=assets[id];if(!x||!confirm(x.name+' 자료를 팩에서 삭제할까요?'))return;let tx=db.transaction('assets','readwrite');tx.objectStore('assets').delete(id);tx.oncomplete=()=>{delete assets[id];render();notify('자료를 삭제했습니다.')}}
const franchise = () => S.type === '프랜차이즈 본사';
const fixedFrame = id => id === 'M00' || id === 'M13';
const introIds = ['F-1', 'F-2', 'F-3'];
let building = false;
let resultStatus = '';

function effectiveIntro() {
  if (!franchise() || S.introOverride === 'off') return null;
  return introIds.includes(S.introOverride) ? S.introOverride : intro()[0];
}

function effectiveIntroLabel() {
  const id = effectiveIntro();
  return id ? id + ' · ' + LIBRARY[id].name : '인트로 제외';
}

function items() {
  const selectedIds = selected();
  const base = { '수입·유통':'M05', '식품 제조':'M06', '급식·식자재':'M07', '프랜차이즈 본사':'M08' }[S.type];
  const priorities = ['M01', base, ...selectedIds];
  const body = [...new Set(priorities)].filter(id => selectedIds.includes(id));
  const intro = effectiveIntro();
  const keys = [...(intro ? ['intro'] : []), ...body.map(id=>'m:'+id), ...S.chosen.map(id=>'p:'+id)];
  const order = S.order.filter(key=>keys.includes(key));
  if (intro && !order.includes('intro')) order.unshift('intro');
  return [...new Set([...order,...keys])];
}

function move(key, offset) {
  const order = items(), i = order.indexOf(key), j = i + offset;
  if (i < 0 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  update('order', order);
}

function shiftAsset(pack, id, direction) {
  const rows = filesFor(pack), i = rows.findIndex(r=>r.id===id), j=i+direction;
  if (!db || i<0 || j<0 || j>=rows.length) return;
  [rows[i],rows[j]]=[rows[j],rows[i]];
  const changed = rows.map((r,index)=>({...r,order:index}));
  const tx=db.transaction('assets','readwrite');
  changed.forEach(r=>tx.objectStore('assets').put(r));
  tx.oncomplete=()=>{changed.forEach(r=>assets[r.id]=r);render()};
  tx.onerror=()=>notify('파일 순서를 저장하지 못했습니다.');
}

function moduleId(key) {
  if (key==='intro') return effectiveIntro();
  return key.startsWith('m:') ? key.slice(2) : null;
}

