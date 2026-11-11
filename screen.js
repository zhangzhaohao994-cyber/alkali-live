'use strict';
const words = {
 menu:['目录','Contents','目次','목차','विषयसूची'], full:['全屏','Full screen','全画面','전체 화면','पूर्ण स्क्रीन'], exit:['退出全屏','Exit full screen','全画面を終了','전체 화면 종료','पूर्ण स्क्रीन से बाहर'],
 speaker:['演讲者视图','Presenter view','発表者ビュー','발표자 보기','वक्ता दृश्य'], close:['关闭','Close','閉じる','닫기','बंद करें'],
 prev:['上一张','Previous','前へ','이전','पिछला'], next:['下一张','Next','次へ','다음','अगला'], source:['查阅原档 ↗','View archive ↗','資料を見る ↗','자료 보기 ↗','अभिलेख देखें ↗'],
 scene:['场','Scene','場面','장면','दृश्य'], end:['放映结束','End of show','上映終了','상영 종료','प्रस्तुति समाप्त'],
 language:['语言','Language','言語','언어','भाषा'], concurrent:['此窗口控制观众屏','Controlling audience screen','この画面で観客用スクリーンを操作','관객 화면 제어 중','इस विंडो से दर्शक स्क्रीन नियंत्रित करें'],
 blocked:['请允许此页弹出讲者窗口。','Allow this page to open the presenter window.','発表者ウィンドウのポップアップを許可してください。','발표자 창의 팝업을 허용해 주세요.','वक्ता विंडो खोलने के लिए पॉप-अप की अनुमति दें।']
};
const ids = Object.fromEntries(Array.from(document.querySelectorAll('[id]'), node=>[node.id,node]));
const slides = ARCHIVE.flatMap((s,i)=>s.frames.map((f,j)=>({scene:s,frame:f,chapter:i,part:j})));
const tags=['zh-CN','en','ja','ko','hi'];
const urlState=new URLSearchParams(location.hash.slice(1));
const presenter=new URLSearchParams(location.search).get('presenter')==='1';
let position=0,language=0,peer=null,touchStart=null;
const two=n=>String(n).padStart(2,'0');
const clip=(n,a,b)=>Math.min(b,Math.max(a,Math.round(n)));
function read(s){return s[language];}
function ui(k){return read(words[k]);}
function jump(ch,part=0){
 const chapter=clip(ch,0,ARCHIVE.length-1);
 const j=clip(part,0,ARCHIVE[chapter].frames.length-1);
 return slides.findIndex(x=>x.chapter===chapter&&x.part===j);
}
function syncTarget(){return presenter?window.opener:peer;}
function post(type){
 const t=syncTarget();if(t&&!t.closed)t.postMessage({app:'alkali-live-2026',type,position,language},'*');
}
function move(where,lang=language,sync=true){
 if(!Number.isFinite(where)||!Number.isFinite(lang))return;
 position=clip(where,0,slides.length-1);language=clip(lang,0,tags.length-1);
 render();if(sync)post('state');
}
function updateHref(){
 const s=slides[position];const hash='scene='+(s.chapter+1)+'&frame='+(s.part+1)+'&lang='+tags[language];
 if(location.hash!=='#'+hash){try{history.replaceState(null,'','#'+hash);}catch{}}
}
function setMedia(s){
 const {img,hero,text}=s.frame;
 ids.image.hidden=!img||img==='TANK';
 if(!ids.image.hidden){
  const url='media/'+img+'.jpg';if(ids.image.getAttribute('src')!==url)ids.image.src=url;
  ids.image.alt=read(text);
 }else ids.image.removeAttribute('src');
 ids.tank.hidden=img!=='TANK';ids.tank.textContent=TANK;ids.typeArt.hidden=!hero;ids.typeArt.textContent=hero?read(hero):'';
 ids.visual.classList.toggle('symbol',img==='TANK');
}
function render(){
 const s=slides[position],n=slides[position+1];document.documentElement.lang=tags[language];document.body.classList.toggle('first',position===0);document.body.classList.toggle('action',s.chapter===17);
 ids.language.value=language;ids.language.setAttribute('aria-label',ui('language'));ids.menuName.textContent=ids.tocTitle.textContent=ui('menu');ids.close.setAttribute('aria-label',ui('close'));ids.fsName.textContent=ui(document.fullscreenElement?'exit':'full');ids.fullscreen.setAttribute('aria-label',ids.fsName.textContent);
 ids.number.textContent=ui('scene')+' '+two(s.chapter+1)+' / '+two(ARCHIVE.length);ids.date.textContent=s.scene.date;ids.heading.textContent=read(s.scene.title);
 ids.caption.textContent=s.frame.img==='TANK'?'':read(s.frame.text);
 ids.source.hidden=!s.scene.source||s.frame.img==='TANK';ids.source.href=s.scene.source||'#';ids.source.textContent=ui('source');
 ids.prev.disabled=position===0;ids.next.disabled=!n;ids.prev.setAttribute('aria-label',ui('prev'));ids.next.setAttribute('aria-label',ui('next'));
 ids.pageCount.textContent=two(position+1)+' / '+two(slides.length);
 ids.track.firstElementChild.style.width=(100*(position+1)/slides.length)+'%';
 ids.present.textContent=ui('speaker');ids.present.hidden=presenter;
 setMedia(s);ids.preview.hidden=!presenter;
 if(presenter){
  ids.nextLabel.textContent=(n?ui('next'):ui('end'))+' · '+ui('concurrent');ids.nextHead.textContent=n?read(n.scene.title):'';ids.nextCap.textContent=n?read(n.frame.text):'';
  ids.nextThumb.hidden=!(n?.frame.img&&n.frame.img!=='TANK');if(!ids.nextThumb.hidden)ids.nextThumb.src='media/'+n.frame.img+'.jpg';
 }
 ids.list.replaceChildren(...ARCHIVE.map((sc,i)=>{const li=document.createElement('li'),b=document.createElement('button'),num=document.createElement('small');num.textContent=two(i+1);b.append(num,document.createTextNode(read(sc.title)));b.setAttribute('aria-current',String(i===s.chapter));b.onclick=()=>{ids.contents.close();move(jump(i));};li.append(b);return li;}));
 ids.status.textContent=ids.number.textContent+' · '+ids.heading.textContent;document.title=read(s.scene.title)+' · ALKALI LIVE';updateHref();
 if(n?.frame.img&&n.frame.img!=='TANK'){const pre=new Image();pre.src='media/'+n.frame.img+'.jpg';}
}
function toggleFull(){if(document.fullscreenElement){document.exitFullscreen().catch(()=>{});}else if(document.documentElement.requestFullscreen){document.documentElement.requestFullscreen().catch(()=>{});} }
function openConsole(){
 if(presenter)return;const u=new URL(location.href);u.searchParams.set('presenter','1');
 peer=window.open(u.href,'alkali_live_console','popup,width=1040,height=760,resizable=yes,scrollbars=yes');
 if(!peer){alert(ui('blocked'));} else peer.focus();
}
ids.brand.onclick=()=>move(0);ids.next.onclick=()=>move(position+1);ids.prev.onclick=()=>move(position-1);
ids.language.onchange=()=>move(position,Number(ids.language.value));ids.fullscreen.onclick=toggleFull;ids.present.onclick=openConsole;
ids.menu.onclick=()=>ids.contents.showModal();ids.close.onclick=()=>ids.contents.close();ids.contents.onclick=e=>{if(e.target===ids.contents){const b=ids.contents.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)ids.contents.close();}};
document.addEventListener('fullscreenchange',render);if(!document.documentElement.requestFullscreen)ids.fullscreen.hidden=true;
window.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||ids.contents.open||['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;
 if((e.key===' '||e.key==='Enter')&&e.target.closest('button,a'))return;
 const actions={ArrowRight:()=>move(position+1),PageDown:()=>move(position+1),' ':()=>move(position+1),ArrowLeft:()=>move(position-1),PageUp:()=>move(position-1),Home:()=>move(0),End:()=>move(slides.length-1),f:toggleFull,p:openConsole,m:()=>ids.contents.showModal()};
 if(actions[e.key]){e.preventDefault();actions[e.key]();}
});
ids.stage.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});
ids.stage.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart[0],dy=e.changedTouches[0].clientY-touchStart[1];if(Math.abs(dx)>54&&Math.abs(dx)>1.6*Math.abs(dy))move(position+(dx<0?1:-1));touchStart=null;},{passive:true});
window.addEventListener('message',e=>{if(e.source!==syncTarget()||e.data?.app!=='alkali-live-2026')return;if(e.data.type==='ready'&&!presenter)post('state');else if(e.data.type==='state')move(e.data.position,e.data.language,false);});
const h=(name)=>Math.max(1,parseInt(urlState.get(name),10)||1)-1;
move(jump(h('scene'),h('frame')),Math.max(0,tags.indexOf(urlState.get('lang'))),false);
if(presenter)post('ready');
