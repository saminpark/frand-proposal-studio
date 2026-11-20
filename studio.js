const PAGE = ['고객 조건','모듈 라이브러리','품목 팩','조합 편집'];
const NAV = ['Building2','Layers3','PackageOpen','PanelsTopLeft'];
const packNames = {cheese:'치즈',tomato:'토마토·소스',meat:'육류',seafood:'수산',oil:'올리브유·유지',general:'준초콜릿'};
const packMeta = {
  tomato:['01','신고 품목 후보','855','행','tomato'],oil:['02','HS 1509 가중평균','$7.67','/kg','oil'],
  general:['03','준초콜릿 수입 중량','5,521','천 kg','cocoa']
};
let activeKey='M00', moduleFilter='전체', query='', grabbedKey=null;
let storageOk=true, tourOpen=false, returnTo=null;
const icon=n=>glyphs[n]||'';
const number=n=>String(n).padStart(2,'0');
const esc=h;
const allKeys=()=>['M00',...items(),'M13'];
const idFor=key=>fixedFrame(key)?key:moduleId(key);
const pk=key=>key.slice(2);
const client=()=>S.name.trim()||'고객사명';
const imgTag=(src,alt='')=>`<img src="${src}" alt="${esc(alt)}" draggable="false">`;
const iconButton=(glyph,label,handler,disabled=false)=>`<button class="icon-btn" aria-label="${esc(label)}" title="${esc(label)}" onclick="${handler}" ${disabled?'disabled':''}>${icon(glyph)}</button>`;
const btn=(label,glyph,action,style='btn')=>`<button class="${style}" onclick="${action}">${icon(glyph)}<span>${esc(label)}</span></button>`;

// The three supplied case slides are available even when opened with file://.
const builtFiles = Object.fromEntries(Object.values(PACK_SOURCES).map(p=>['base-'+p.id,{
  id:'base-'+p.id,pack:p.id,name:p.name,version:p.version,source:p.source,pages:p.pages,period:p.period,created:0,base:true}]));
const uploadedFiles=filesFor;
filesFor=function(id){
  const base=builtFiles['base-'+id];
  const list=uploadedFiles(id).filter(f=>!f.base);
  if(base && !(S.hiddenBases||[]).includes(id))list.unshift(base);
  const order=S.fileOrder?.[id]||[];
  const rank=f=>{const i=order.indexOf(f.id);return i<0?order.length:i};
  return list.sort((a,b)=>rank(a)-rank(b));
};
function initializePackLibrary(){assetsReady=true;render()}
function showBase(id,present){
  S.hiddenBases=(S.hiddenBases||[]).filter(k=>k!==id);
  if(!present) S.hiddenBases.push(id);
  save();render();
}
function fileMove(pack,id,dir){
  const list=filesFor(pack).map(f=>f.id),i=list.indexOf(id),j=i+dir;
  if(i<0||j<0||j>=list.length)return;
  [list[i],list[j]]=[list[j],list[i]];S.fileOrder={...S.fileOrder,[pack]:list};save();render();
}
function storeStatus(){
  try{localStorage.setItem('frand-design-studio-v1',JSON.stringify(S));storageOk=true}
  catch{storageOk=false}
}
save=storeStatus;

function item(key) {
  const id=idFor(key);
  if(id){const m=LIBRARY[id];return {name:m.name,title:m.title,code:id,status:m.status,pic:SLIDES[id],pages:1}}
  const idP=pk(key), pack=PACK_SOURCES[idP], files=filesFor(idP);
  const pageCounts=files.map(f=>f.pages || (/\.(png|jpe?g|webp)$/i.test(f.name)?1:0));
  const basePresent=files.some(f=>f.base);
  return {name:packNames[idP]+' 팩',title:basePresent?pack.title:packNames[idP]+' 자료 묶음',code:'PACK',status:'품목 팩',
    pic:files[0]?.base?SLIDES['pack-'+idP]:null,pages:files.length && pageCounts.every(Boolean)?pageCounts.reduce((a,b)=>a+b,0):null};
}
function countInfo(){
  const keys=allKeys(), counts=keys.map(k=>item(k).pages);
  return counts.every(Boolean)?counts.reduce((a,b)=>a+b,0)+'장':keys.length+'개 묶음';
}
function cover(){
  return `<div class="cover-face">${imgTag(SLIDES.M00,'Fran:D 제안서 표지')}<div class="cover-name"><span>${esc(client())}</span></div></div>`;
}
function slideFace(src,title,kind,page=null){
  if(kind==='M00')return imgTag(src,title);
  const variant=kind==='M13'?' dark':kind==='pack'?' case-slide':'';
  return `<span class="slide-face${variant}">${imgTag(src,title)}<span class="footer-rule" aria-hidden="true"></span>${page?`<span class="sheet-page" aria-label="${page}쪽">${page}</span>`:''}</span>`;
}
function pageVisual(key){
  if(key==='M00')return cover();
  const m=item(key);
  const page=assemblyPages(allKeys()).ranges.get(key)?.first;
  if(m.pic)return slideFace(m.pic,m.title,idFor(key)||'pack',page);
  const f=filesFor(pk(key))[0];
  if(f?.blob && /^image\//.test(f.blob.type))return slideFace(urlFor(f),f.name,'upload',page);
  return `<div class="no-slide">${icon(f?'FileText':'FolderOpen')}<strong>${esc(f?.name||'등록된 자료가 없습니다')}</strong><small>${esc(f?'원본 파일에서 내용을 확인할 수 있습니다.':'품목 팩에서 자료를 등록하세요.')}</small></div>`;
}
const fileUrls=new Map();
function urlFor(f){if(!fileUrls.has(f.id))fileUrls.set(f.id,URL.createObjectURL(f.blob));return fileUrls.get(f.id)}
function fitLabels(){
  document.querySelectorAll('.cover-name span').forEach(el=>{
    const box=el.parentElement;
    el.style.fontSize=box.closest('.cover-face').clientWidth*.052+'px';
    if(el.scrollWidth>box.clientWidth) el.style.fontSize=parseFloat(el.style.fontSize)*box.clientWidth/el.scrollWidth+'px';
  });
}
function navigate(i){closeModal();S.page=i;save();render();window.scrollTo({top:0,behavior:'instant'})}
function onCustomer(value){S.name=value;save();document.querySelectorAll('[data-client]').forEach(el=>el.textContent=client());}
function focusSlide(key){activeKey=key;render()}
function turnPage(amount){const keys=allKeys(),i=keys.indexOf(activeKey);if(keys[i+amount])focusSlide(keys[i+amount])}
function reorder(fromKey,toIndex){
  const keys=items(),from=keys.indexOf(fromKey);
  if(from<0||toIndex<0||toIndex>=keys.length||from===toIndex)return;
  const old=new Map([...document.querySelectorAll('.qrow')].map(row=>[row.dataset.key,row.getBoundingClientRect().top]));
  const focus=document.activeElement?.getAttribute('aria-label');
  keys.splice(from,1);keys.splice(toIndex,0,fromKey);
  update('order',keys);
  for(const row of document.querySelectorAll('.qrow')){
    const offset=old.get(row.dataset.key)-row.getBoundingClientRect().top;
    if(offset&&!matchMedia('(prefers-reduced-motion: reduce)').matches)
      row.animate([{transform:'translateY('+offset+'px)'},{transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.2,.7,.25,1)'});
    if(focus && row.dataset.key===fromKey){
      const control=[...row.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===focus && !b.disabled);
      (control||row.querySelector('.qselect')).focus({preventScroll:true});
    }
  }
}
move=function(key,delta){reorder(key,items().indexOf(key)+delta)};
function rail(){
  return `<div class="identity"><div>Fran<span>:</span>D</div><small>PROPOSAL STUDIO</small></div>
    <div class="rail-label">워크스페이스</div><nav>${[3,0,1,2].map(i=>`<button aria-label="${PAGE[i]}" aria-current="${i===S.page?'page':'false'}" class="navitem ${i===S.page?'current':''}" onclick="navigate(${i})">${icon(NAV[i])}<span>${i===1?'모듈<span class="desktop-word"> 라이브러리</span>':PAGE[i]}</span>${i===1?'<i>17</i>':i===2?'<i>6</i>':''}</button>`).join('')}</nav>
    <div class="rail-end"><button class="show-guide" onclick="showTour()">${icon('MonitorPlay')}<span>순서 변경 시연</span>${icon('ChevronRight')}</button>
    <div class="organization"><div class="org-icon">${icon('Layers3')}</div><div><b>FOODTECH AX</b><small>제안서 작업공간</small></div></div></div>`;
}
function topbar(){
  return `<div class="crumb">${icon('Folder')}<span>워크스페이스</span><i>/</i><b>${PAGE[S.page]}</b></div>
    <div class="top-actions"><span class="local">${icon('CircleCheck')}${storageOk?'이 브라우저에 저장':'세션에서 편집 중'}</span></div>`;
}
function header(title,sub,action=''){
  return `<div class="page-head"><div><h1>${title}</h1><div class="subtitle">${sub}</div></div>${action}</div>`;
}
function tags(){return `<span class="industry">${icon('Building2')}${esc(S.type)}</span><span class="sep"></span>${esc(S.procure)}<span class="sep"></span>${franchise()?'심화형':'간결형'}`;}
function canvas(){
  const keys=allKeys(), i=keys.indexOf(activeKey),m=item(activeKey);
  const pages=assemblyPages(keys);
  return `<section class="canvas-card"><div class="canvas-chrome"><b>${icon('Presentation')} 슬라이드 미리보기</b><button class="textbtn" onclick="openSlide()">${icon('Expand')} 확대</button></div>
    <div class="drawing-board"><div class="board-mark">16 : 9</div><div class="paper">${pageVisual(activeKey)}</div></div>
    <div class="canvas-foot"><div><small>${m.code} <i>·</i> ${m.status}</small><strong>${esc(m.name)}</strong></div>
    <div class="stepper">${iconButton('ChevronLeft','이전 슬라이드','turnPage(-1)',i===0)}<span>${pageLabel(pages.ranges.get(activeKey))} <em>/</em> ${pages.total?number(pages.total):'…'}</span>${iconButton('ChevronRight','다음 슬라이드','turnPage(1)',i===keys.length-1)}</div></div></section>`;
}
function queue(){
  const keys=allKeys();
  const pages=assemblyPages(keys);
  return `<section class="queue"><div class="queue-head"><div><h2>편성 순서</h2><small>표지부터 마무리까지</small></div><span class="total">${esc(countInfo())}</span></div>
    <div class="queue-list">${keys.map((key,i)=>{
      const m=item(key), fixed=fixedFrame(key), active=activeKey===key;
      return `<div class="qrow ${active?'active':''}" data-key="${key}" ${!fixed?'draggable="true"':''}>
      <button class="qselect" onclick="focusSlide('${key}')" aria-pressed="${active}"><span class="ord">${pageLabel(pages.ranges.get(key))}</span><span class="qthumb">${m.pic?slideFace(m.pic,'',idFor(key)||'pack',pages.ranges.get(key).first):icon('Folder')}</span>
      <span class="qtext"><b>${esc(m.name)}</b><small>${m.code} · ${m.status}</small></span></button>
      ${fixed?`<span class="qlock" title="고정">${icon('LockKeyhole')}</span>`:
      `<div class="handle"><span class="grip" draggable="true" title="끌어서 순서 변경">${icon('GripVertical')}</span><div class="arrows">${iconButton('MoveUp',m.name+' 위로',`move('${key}',-1)`,i===1)}${iconButton('MoveDown',m.name+' 아래로',`move('${key}',1)`,i===keys.length-2)}</div></div>`}</div>`;
    }).join('')}</div><div class="queue-foot">${btn('모듈 추가·편집','Plus','navigate(1)','queue-add')}</div></section>`;
}
function packCard(id){
  const data=packMeta[id], info=PACK_SOURCES[id], picked=S.chosen.includes(id);
  return `<article class="case-card ${data[4]}"><button class="case-cover" onclick="casePeek('${id}')" aria-label="${esc(info.title)} 미리보기">
    <span class="case-stat"><small>${data[1]}</small><strong>${data[2]}<em>${data[3]}</em></strong></span>
    <span class="case-symbol">${icon(id==='tomato'?'ShoppingBasket':id==='oil'?'Sprout':'Boxes')}</span></button>
    <div class="case-bottom"><div><strong>${packNames[id]} 팩</strong><small>${id==='general'?'범용 예시':info.period.split(' · ')[0]}</small></div>
    <button class="pick ${picked?'picked':''}" aria-pressed="${picked}" aria-label="${packNames[id]} 팩 ${picked?'제외':'추가'}" onclick="togglePack('${id}')">${icon(picked?'Check':'Plus')}</button></div></article>`;
}
function studio(){
  return header(`<span data-client>${esc(client())}</span> 미팅 제안서`,tags(),btn('고객 조건 수정','SlidersHorizontal','navigate(0)'))+
    `<div class="editor-grid">${canvas()}${queue()}</div>
    <section class="cases"><div class="sect-head"><h2>기분석 품목 팩</h2><button class="textbtn" onclick="navigate(2)">전체 보기 ${icon('ArrowRight')}</button></div>
    <div class="case-grid">${['tomato','oil','general'].map(packCard).join('')}</div></section>
    <div class="mail-row"><div>${icon('Mail')}<b>미팅 제안 이메일</b></div>${btn('초안 보기','ArrowUpRight','showMail()','textbtn')}</div>`;
}
function choices(k,values){
  return `<div class="pills">${values.map(v=>`<button class="choice ${S[k]===v?'on':''}" aria-pressed="${S[k]===v}" onclick="update('${k}','${v}')">${S[k]===v?icon('Check'):''}${v}</button>`).join('')}</div>`;
}
function field(name,content,hint=''){return `<div class="field"><b>${name}</b>${content}${hint?`<small>${hint}</small>`:''}</div>`;}
function conditions(){
  return header('고객 조건','고객의 사업과 조달 방식에 따라 제안 모듈을 추천합니다.')+
    `<div class="form-layout"><div class="form-card"><h2>사업 정보</h2>
    ${field('<label for="customer">고객사명</label>',`<input id="customer" maxlength="100" value="${esc(S.name)}" placeholder="고객사명 입력" oninput="onCustomer(this.value)">`,'표지와 이메일 초안에 적용됩니다.')}
    ${field('주요 사업 유형',choices('type',typeNames))}${field('조달 방식',choices('procure',procurement),S.procure==='미확인'?'미팅에서 직수입 품목과 국내 매입 품목을 확인하세요.':'')}
    ${franchise()?`<h2 class="subhead">프랜차이즈 운영</h2><div class="field-grid">${[['factory','자체공장 운영'],['oem','OEM 전용상품'],['mate','MATE POS 사용'],['frand','Fran:D 사용']].map(([k,v])=>field(v,choices(k,['factory','oem'].includes(k)?yn:usage))).join('')}</div>`:''}
    </div><aside class="detail-panel"><div class="panel-icon">${icon('ListTree')}</div><h2>추천 구성</h2><p><span data-client>${esc(client())}</span> · ${esc(S.type)}</p>
    ${Object.entries(recom()).map(([id,why])=>`<div class="detail-line"><code>${id}</code><div><b>${LIBRARY[id].name}</b><small>${why}</small></div></div>`).join('')}
    ${franchise()?`<div class="detail-line"><code>${intro()[0]}</code><div><b>${intro()[1]}</b><small>MATE ${S.mate} · Fran:D ${S.frand}</small></div></div>`:''}
    ${btn('모듈 선택으로','ArrowRight','navigate(1)','btn forest wide')}</aside></div>`;
}
function moduleCard(id){
  const m=LIBRARY[id], on=selected().includes(id), why=recom()[id];
  return `<article class="module-card" data-filter="${esc(m.name+' '+id+' '+m.title)}"><button class="module-image" onclick="modulePeek('${id}')" aria-label="${m.name} 미리보기">${slideFace(SLIDES[id],m.name,id)}</button>
    <div class="module-info"><div class="line"><span class="module-code">${id} · ${m.status}</span><button class="pick ${on?'picked':''}" aria-label="${m.name} ${on?'제외':'추가'}" aria-pressed="${on}" onclick="toggleModule('${id}')">${icon(on?'Check':'Plus')}</button></div>
    <h3>${m.name}</h3><p>${esc(why||m.title)}</p></div></article>`;
}
function filterCards(value){
  query=value;const term=query.trim().toLowerCase();
  const cards=[...document.querySelectorAll('.module-card')];
  cards.forEach(el=>el.hidden=!el.dataset.filter.toLowerCase().includes(term));
  const empty=$('none');if(empty)empty.hidden=cards.some(el=>!el.hidden);
}
function modules(){
  const sel=selected(), rec=recom(),sourceIds=Object.keys(moduleData);
  const ids=sourceIds.filter(k=>moduleFilter==='전체'||(moduleFilter==='추천'?!!rec[k]:sel.includes(k)));
  return header('모듈 라이브러리','추천 이유를 확인하고 제안서에 담을 본문을 선택하세요.',btn('편집 화면','ArrowRight','navigate(3)'))+
    `${franchise()?`<div class="intro-strip"><div>${icon('PanelTop')}<b>프랜차이즈 인트로</b></div><select aria-label="프랜차이즈 인트로" onchange="update('introOverride',this.value)">
    ${[['auto','추천 적용 · '+intro()[0]],...introIds.map(k=>[k,k+' · '+LIBRARY[k].name]),['off','제외']].map(([v,t])=>`<option value="${v}" ${(S.introOverride||'auto')===v?'selected':''}>${t}</option>`).join('')}</select></div>`:''}
    <div class="library-bar"><div class="tabs">${['전체','추천','선택됨'].map(t=>`<button class="${moduleFilter===t?'on':''}" onclick="moduleFilter='${t}';render()">${t} <i>${t==='전체'?sourceIds.length:t==='추천'?Object.keys(rec).length:sel.length}</i></button>`).join('')}</div>
    <label class="search">${icon('Search')}<input type="search" value="${esc(query)}" placeholder="모듈 검색" aria-label="모듈 검색" oninput="filterCards(this.value)"></label></div>
    <div class="module-grid">${ids.map(moduleCard).join('')}</div><p id="none" class="empty-text" hidden>조건에 맞는 모듈이 없습니다.</p>
    <div class="frame-strip"><b>공통 프레임</b>${['M00','M13'].map(id=>btn(LIBRARY[id].name,'Presentation',`modulePeek('${id}')`,'btn')).join('')}</div>`;
}
function packList(){
  return header('품목 팩','기분석 사례를 선택하거나 품목별 완성 자료를 등록하세요.',btn('편집 화면','ArrowRight','navigate(3)'))+
    `<div class="case-grid">${['tomato','oil','general'].map(packCard).join('')}</div>
    <div class="sect-head manage-head"><h2>팩별 자료</h2><small>6개 팩</small></div><section class="pack-files">${packs.map(p=>{
      const f=filesFor(p.id),chosen=S.chosen.includes(p.id);
      return `<div class="pack-section"><div class="pack-title"><div><b>${p.name}</b><small>${f.length?'등록 자료 '+f.length+'개':'자료 미등록'}</small></div>
        <div class="pack-actions"><label class="btn file-label">${icon('FileUp')}자료 등록<input type="file" accept=".pptx,.pdf,.jpg,.jpeg,.png,.webp" multiple aria-label="${p.name} 자료 등록" onchange="addFiles('${p.id}',this)"></label>
        <button class="btn ${chosen?'selected-btn':''}" aria-pressed="${chosen}" onclick="togglePack('${p.id}')">${icon(chosen?'Check':'Plus')}${chosen?'선택됨':'선택'}</button></div></div>
        ${f.map((v,i)=>`<div class="asset-row">${icon('FileText')}<span title="${esc(v.name)}">${esc(v.name)}</span>${iconButton('MoveUp','자료 위로',`fileMove('${p.id}','${v.id}',-1)`,i===0)}${iconButton('MoveDown','자료 아래로',`fileMove('${p.id}','${v.id}',1)`,i===f.length-1)}
        ${v.base?iconButton('Expand','기본 자료 미리보기',`casePeek('${p.id}')`):iconButton('Download','등록 파일 저장',`downloadAsset('${v.id}')`)}${iconButton('X','팩에서 제외',v.base?`showBase('${p.id}',false)`:`deleteAsset('${v.id}')`)}</div>`).join('')}
        ${PACK_SOURCES[p.id]&&!f.some(x=>x.base)?btn('기본 사례 복원','Redo2',`showBase('${p.id}',true)`,'textbtn'):''}</div>`;
    }).join('')}</section>`;
}
function render(){
  if(!allKeys().includes(activeKey))activeKey='M00';
  $('rail').innerHTML=rail();$('top').innerHTML=topbar();$('view').innerHTML=[conditions,modules,packList,studio][S.page]();
  if(S.page===1)filterCards(query);
  fitLabels();
}
function dialog(title,body,skin=''){
  const d=$('modal');returnTo=d.open?returnTo:document.activeElement;
  if(tourOpen&&window.unmountScene)unmountScene();tourOpen=false;
  d.className=skin; d.setAttribute('aria-label',title);
  d.innerHTML=`<div class="dialog-title"><h2>${esc(title)}</h2>${iconButton('X','닫기','closeModal()')}</div>${body}`;
  if(!d.open)d.showModal();fitLabels();
}
function closeModal(){if($('modal').open)$('modal').close()}
$('modal').addEventListener('close',()=>{if(tourOpen)window.unmountScene?.();tourOpen=false;$('modal').replaceChildren();returnTo?.focus?.();});
$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});
function openSlide(){const m=item(activeKey);dialog(m.name,`<div class="large-slide">${pageVisual(activeKey)}</div>`)}
function modulePeek(id){dialog(LIBRARY[id].name,`<div class="large-slide">${id==='M00'?cover():slideFace(SLIDES[id],LIBRARY[id].title,id)}</div>`)}
function casePeek(id){const p=PACK_SOURCES[id];dialog(p.title,`<div class="large-slide">${slideFace(SLIDES['pack-'+id],p.title,'pack')}</div><p class="source">${esc(p.source)}</p>`)}
function showMail(){
  const name=client();dialog('미팅 제안 이메일',`<div class="mail-draft"><small>제목</small><b>${esc(name)} 미팅 제안 | Fran:D</b><hr><p>${esc(name)} 담당자님, 안녕하세요.</p>
  <p>Fran:D에서 ${franchise()?'메뉴·매장 운영과 원재료 구매 조건':'주요 구매 품목의 수입 시세와 공급 경로'}을 함께 살펴보는 미팅을 제안드립니다. 관심 있는 품목이나 논의를 원하시는 주제를 알려 주시면 관련 자료를 준비하겠습니다.</p><p>감사합니다.</p></div>`,'small-modal');
}
function showTour(){
  dialog('편성 순서 바꾸기','<div id="demo"></div><div class="demo-end"><span>행의 손잡이를 끌어 본문 순서를 바꿉니다.</span>'+btn('다시 보기','Redo2','showTour()','textbtn')+'</div>','tour-modal');tourOpen=true;window.mountScene($('demo'));
}
$('view').addEventListener('dragstart',e=>{
  const row=e.target.closest('.qrow[draggable]');if(!row)return;
  grabbedKey=row.dataset.key;e.dataTransfer.setData('text/plain',grabbedKey);e.dataTransfer.effectAllowed='move';row.classList.add('dragging');
});
$('view').addEventListener('dragover',e=>{const row=e.target.closest('.qrow[draggable]');if(!row||!grabbedKey)return;e.preventDefault();document.querySelectorAll('.drag-over').forEach(n=>n.classList.remove('drag-over'));row.classList.add('drag-over')});
$('view').addEventListener('drop',e=>{const row=e.target.closest('.qrow[draggable]');if(!row||!grabbedKey)return;e.preventDefault();reorder(grabbedKey,items().indexOf(row.dataset.key));grabbedKey=null});
document.addEventListener('dragend',()=>{grabbedKey=null;document.querySelectorAll('.dragging,.drag-over').forEach(n=>n.classList.remove('dragging','drag-over'))});
window.addEventListener('resize',fitLabels);
render();initDB();
if(location.hash==='#demonstration')showTour();
