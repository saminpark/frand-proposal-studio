async function countAssetPages(file) {
  if (/\.(png|jpe?g|webp)$/i.test(file.name)) return 1;
  try {
    if (/\.pdf$/i.test(file.name)) {
      const document = await PDFLib.PDFDocument.load(await file.blob.arrayBuffer(), {updateMetadata:false});
      return document.getPageCount() || null;
    }
    if (/\.pptx$/i.test(file.name)) {
      const archive = await JSZip.loadAsync(await file.blob.arrayBuffer());
      const xml = await archive.file('ppt/presentation.xml').async('string');
      const root = new DOMParser().parseFromString(xml, 'application/xml').documentElement;
      const list = Array.from(root.children).find(el=>el.localName==='sldIdLst' && el.namespaceURI===root.namespaceURI);
      return list && Array.from(list.children).filter(el=>el.localName==='sldId' && el.namespaceURI===root.namespaceURI).length || null;
    }
  } catch { /* The export service validates unreadable or locked source files. */ }
  return null;
}

async function refreshPageCounts() {
  const pending = Object.values(assets).filter(f=>f.blob && !Object.hasOwn(f,'pages'));
  if (!pending.length) return;
  const updated = [];
  for (const file of pending) updated.push({...file, pages:await countAssetPages(file)});
  const tx = db.transaction('assets','readwrite');
  for (const file of updated) {
    if (assets[file.id]) {
      tx.objectStore('assets').put(file);
      assets[file.id] = file;
    }
  }
}

function assemblyPages(order) {
  const ranges = new Map();
  let next = 1;
  for (const key of order) {
    let count = 1;
    if (key.startsWith('p:')) {
      const files = filesFor(key.slice(2));
      count = files.length && files.every(f=>f.pages>0) ? files.reduce((sum,f)=>sum+f.pages,0) : null;
    }
    const last = next && count ? next+count-1 : null;
    ranges.set(key,{first:next,last});
    next = last ? last+1 : null;
  }
  return {ranges,total:next ? next-1 : null};
}

function pageLabel(range) {
  if (!range.first) return '…';
  const first = String(range.first).padStart(2,'0');
  if (range.last===range.first) return first;
  return first+'–'+(range.last ? String(range.last).padStart(2,'0') : '…');
}
