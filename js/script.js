const DUR=3000,TK=50;
const ESP32='http://192.168.4.1';
let sState=[0,0,0,0],sTmr=[],sInt=[];
let strobeReady=false,strobeTmr=null,strobeInt=null;
let motionOn=true,mtTmr=null,mtInt=null;
let armed=false,panicMode=false;
let detections=[];
let darkMode=localStorage.getItem('darkMode')==='true';

// Initialize dark mode
if(darkMode)document.documentElement.classList.add('dark-mode');

// ===== LOGO DYNAMIC LOADING =====
function updateLogo(){
    let logo=localStorage.getItem('logoData');
    if(logo){
        const brandLogo=document.querySelector('.brand-logo');
        if(brandLogo){
            brandLogo.innerHTML='';
            let img=document.createElement('img');
            img.src=logo;
            img.style.cssText='width:100%;height:100%;border-radius:inherit;object-fit:cover';
            brandLogo.appendChild(img);
        }
    }
}

function updateDisplayName(){
    let displayName=localStorage.getItem('displayName');
    if(displayName&&document.getElementById('headerBrandName')){
        document.getElementById('headerBrandName').textContent=displayName;
    }
}

window.addEventListener('DOMContentLoaded',function(){
    updateLogo();
    updateDisplayName();
});

// ===== Account / Header Helpers (migrated from js/account.js) =====
function editDisplayName(){
    const input = document.getElementById('nameInput');
    if(input) input.value = localStorage.getItem('displayName')||'FarmGuard';
    const modal = document.getElementById('editNameModal');
    if(modal) modal.style.display = 'flex';
}
function closeEditNameModal(){
    const modal = document.getElementById('editNameModal');
    if(modal) modal.style.display = 'none';
}
function saveDisplayName(){
    const el = document.getElementById('nameInput');
    if(!el) return;
    const name = el.value.trim();
    if(!name) return;
    localStorage.setItem('displayName', name);
    const dn = document.getElementById('displayNameText'); if(dn) dn.textContent = name;
    if(document.getElementById('headerBrandName')) document.getElementById('headerBrandName').textContent = name;
    updateLogo();
    closeEditNameModal();
}

function triggerLogoUpload(){
    const inp = document.getElementById('logoUpload'); if(inp) inp.click();
}
function handleLogoUpload(event){
    const file = event.target && event.target.files && event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e){
        const data = e.target.result;
        const img = new Image();
        img.onload = function(){
            localStorage.setItem('logoData', data);
            updateLogo();
        };
        img.src = data;
    };
    reader.readAsDataURL(file);
}

function updateAllLogos(){ updateLogo(); }

// Collapse/Expand panels on Account/Settings pages
function toggleNotifications(){
    const panel = document.getElementById('notificationsPanel');
    const arrow = document.getElementById('notifArrow');
    if(panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if(arrow) arrow.classList.toggle('open');
}
function toggleAbout(){
    const panel = document.getElementById('aboutPanel');
    const arrow = document.getElementById('aboutArrow');
    if(panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if(arrow) arrow.classList.toggle('open');
}
function toggleContacts(){
    const panel = document.getElementById('contactsPanel');
    const arrow = document.getElementById('contactsArrow');
    if(panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if(arrow) arrow.classList.toggle('open');
}

// Load selected device from localStorage
function loadSelectedDevice(){
    const devName=localStorage.getItem('selectedDeviceName');
    if(devName){
        document.querySelector('.dev-nm').textContent=devName;
        localStorage.removeItem('selectedDeviceId');
        localStorage.removeItem('selectedDeviceName');
    }
}

// Navigation
function navHome(){window.location.href='index.html'}
function navDevice(){window.location.href='device-list.html'}
function navAccount(){window.location.href='account.html'}
function navSettings(){window.location.href='settings.html'}

function toggleDarkMode(){
    darkMode=!darkMode;
    if(darkMode){
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('darkMode','true');
        toast('Dark Mode ON','#fbbf24');
    }else{
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode','false');
        toast('Light Mode ON','var(--green)');
    }
}

async function cmd(d,s){try{console.log(`[ESP32] ${d}→${s?'ON':'OFF'}`)}catch(e){toast('Sambungan terputus!','var(--red)')}}

function fdt(d){const p=n=>String(n).padStart(2,'0');return`${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`}

// ===== SIREN =====
function toggleSiren(n){
    const i=n-1;
    if(sState[i]) sirenOff(n); else sirenOnPerm(n);
    syncAllTog();
}

function sirenOnPerm(n){
    const i=n-1;if(sState[i])return;
    sState[i]=1;
    document.getElementById('sc'+n).classList.add('on');
    cmd('siren'+n,true);
    updateSirenGlow();
}

function sirenOff(n){
    const i=n-1;
    clearTimeout(sTmr[i]);clearInterval(sInt[i]);
    sState[i]=0;
    document.getElementById('sc'+n).classList.remove('on');
    const tm=document.getElementById('st'+n);tm.classList.remove('show');
    const tl=document.getElementById('tl'+n);tl.textContent='TEST';tl.classList.remove('testing');
    cmd('siren'+n,false);
    updateSirenGlow();syncAllTog();
}

function testSiren(n){
    const i=n-1;
    if(sState[i]){sirenOff(n);return;}
    sState[i]=1;
    const cell=document.getElementById('sc'+n);cell.classList.add('on');
    const tm=document.getElementById('st'+n);tm.classList.add('show');
    const tl=document.getElementById('tl'+n);tl.textContent='3s';tl.classList.add('testing');
    cmd('siren'+n,true);updateSirenGlow();

    let rem=DUR;
    tm.textContent='⏱ '+(rem/1000).toFixed(1)+'s';
    sInt[i]=setInterval(()=>{rem-=TK;if(rem<0)rem=0;tm.textContent='⏱ '+(rem/1000).toFixed(1)+'s';tl.textContent=(rem/1000).toFixed(1)+'s'},TK);
    sTmr[i]=setTimeout(()=>sirenOff(n),DUR);
    toast(`Siren ${n} test (3s)`,'var(--red)');
}

function toggleAllSirens(on){
    for(let n=1;n<=4;n++){if(on)sirenOnPerm(n);else sirenOff(n);}
    toast(on?'Semua siren ON':'Semua siren OFF','var(--red)');
}

function syncAllTog(){document.getElementById('allSirTog').checked=sState.every(s=>s)}
function updateSirenGlow(){document.getElementById('sirenCard').classList.toggle('gl-red',sState.some(s=>s))}

// ===== STROBE =====
function toggleStrobe(on){
    strobeReady=on;
    document.getElementById('strobeCard').classList.toggle('gl-amb',on);
    document.getElementById('strobeDesc').textContent=on?'Ready — Sedia untuk trigger':'Standby — Sedia untuk trigger';
    cmd('strobe',on);
    toast(on?'Strobe ON — Ready':'Strobe OFF','var(--amber)');
}

function testStrobe(){
    if(!strobeReady){document.getElementById('strobeTog').checked=true;toggleStrobe(true);}
    const tm=document.getElementById('strobeTm');
    const tl=document.getElementById('strobeTest');
    tm.classList.add('show');
    tl.textContent='3s';tl.classList.add('testing');
    document.getElementById('strobeDesc').textContent='⚡ Flashing...';
    cmd('strobeFlash',true);
    toast('Strobe test (3s)','var(--amber)');

    let rem=DUR;
    tm.textContent='⏱ '+(rem/1000).toFixed(1)+'s';
    clearInterval(strobeInt);clearTimeout(strobeTmr);
    strobeInt=setInterval(()=>{rem-=TK;if(rem<0)rem=0;tm.textContent='⏱ '+(rem/1000).toFixed(1)+'s';tl.textContent=(rem/1000).toFixed(1)+'s'},TK);
    strobeTmr=setTimeout(()=>{
        clearInterval(strobeInt);
        tm.classList.remove('show');
        tl.textContent='TEST';tl.classList.remove('testing');
        document.getElementById('strobeDesc').textContent=strobeReady?'Ready — Sedia untuk trigger':'Standby — Sedia untuk trigger';
        cmd('strobeFlash',false);
    },DUR);
}

// ===== MOTION =====
function toggleMotion(on){
    motionOn=on;
    document.getElementById('motionCard').classList.toggle('gl-blue',on);
    document.getElementById('motionDesc').textContent=on?'Monitoring — Tiada gerakan':'Sensor dimatikan';
    cmd('motion',on);toast(on?'Motion sensor aktif':'Motion sensor off','var(--blue)');
}

function testMotion(){
    if(!motionOn){document.getElementById('motionTog').checked=true;toggleMotion(true);}
    const tm=document.getElementById('motionTm');
    const tl=document.getElementById('motionTest');
    tm.classList.add('show');
    tl.textContent='3s';tl.classList.add('testing');
    document.getElementById('motionDesc').textContent='Testing — Simulating detection...';
    addLog('info','Test mode activated');

    let rem=DUR;
    tm.textContent='⏱ '+(rem/1000).toFixed(1)+'s';
    clearInterval(mtInt);clearTimeout(mtTmr);
    mtInt=setInterval(()=>{rem-=TK;if(rem<0)rem=0;tm.textContent='⏱ '+(rem/1000).toFixed(1)+'s';tl.textContent=(rem/1000).toFixed(1)+'s'},TK);
    mtTmr=setTimeout(()=>{
        clearInterval(mtInt);
        tm.classList.remove('show');
        tl.textContent='TEST';tl.classList.remove('testing');
        document.getElementById('motionDesc').textContent='Monitoring — Tiada gerakan';
        addLog('ok','Test completed — sensor OK');
    },DUR);
    toast('Motion test (3s)','var(--blue)');
}

// ===== LOGS (show only 2 latest) =====
function addLog(type,msg,date){
    const d=date||new Date();
    detections.unshift({type,msg,date:d});
    renderMiniLog();
}

function renderMiniLog(){
    const log=document.getElementById('motionLog');
    const show=detections.slice(0,2);
    log.innerHTML=show.map(d=>`<div class="log-r"><div class="log-d ${d.type}"></div><span class="log-ts">${fdt(d.date)}</span><span>${d.msg}</span></div>`).join('');
}

function initLogs(){
    const n=new Date();
    detections=[
        {type:'ok',msg:'All clear',date:new Date(n-30000)},
        {type:'warn',msg:'Motion detected — Zone A',date:new Date(n-60000)},
        {type:'ok',msg:'All clear',date:new Date(n-120000)},
        {type:'warn',msg:'Motion detected — Zone B',date:new Date(n-180000)},
        {type:'ok',msg:'Sensor initialized',date:new Date(n-300000)},
    ];
    renderMiniLog();
}

// ===== MODAL =====
function openModal(){
    const body=document.getElementById('modalBody');
    const last10=detections.slice(0,10);
    body.innerHTML=last10.length?last10.map(d=>{
        const cls=d.type==='warn'?'dw':d.type==='ok'?'dok':'dinf';
        const ic=d.type==='warn'?'bi-exclamation-triangle-fill':d.type==='ok'?'bi-check-circle-fill':'bi-info-circle-fill';
        return`<div class="dt-r"><div class="dt-ic ${cls}"><i class="bi ${ic}"></i></div><div class="dt-inf"><div class="dt-msg">${d.msg}</div><div class="dt-ts">${fdt(d.date)}</div></div></div>`;
    }).join(''):'<p style="text-align:center;color:var(--txt3);padding:30px">Tiada rekod</p>';
    document.getElementById('detModal').classList.add('show');
}
function closeModal(){document.getElementById('detModal').classList.remove('show')}

// ===== ARM =====
function toggleArm(){
    armed=!armed;
    const b=document.getElementById('armBtn');
    b.classList.toggle('armed',armed);
    b.innerHTML=armed?'<i class="bi bi-shield-fill-check"></i> ARMED':'<i class="bi bi-shield-lock-fill"></i> ARM SYSTEM';
    if(armed&&!motionOn){document.getElementById('motionTog').checked=true;toggleMotion(true)}
    if(armed&&!strobeReady){document.getElementById('strobeTog').checked=true;toggleStrobe(true)}
    toast(armed?'Sistem ARMED':'Sistem disarmed','var(--green)');cmd('arm',armed);
}

// ===== PANIC =====
function togglePanic(){
    panicMode=!panicMode;
    document.getElementById('panicBtn').classList.toggle('panic-on',panicMode);
    if(panicMode){
        for(let n=1;n<=4;n++){sirenOnPerm(n);clearTimeout(sTmr[n-1]);clearInterval(sInt[n-1]);document.getElementById('st'+n).textContent='⏱ PANIC';document.getElementById('st'+n).classList.add('show');document.getElementById('tl'+n).textContent='ON';document.getElementById('tl'+n).classList.add('testing')}
        document.getElementById('allSirTog').checked=true;
        if(!strobeReady){document.getElementById('strobeTog').checked=true;toggleStrobe(true)}
        document.getElementById('strobeTm').textContent='⏱ PANIC';document.getElementById('strobeTm').classList.add('show');
        document.getElementById('strobeTest').textContent='ON';document.getElementById('strobeTest').classList.add('testing');
        document.getElementById('strobeDesc').textContent='⚡ PANIC — Flashing';
        cmd('panic',true);toast('🚨 PANIC MODE!','var(--red)');
    } else {
        for(let n=1;n<=4;n++)sirenOff(n);
        document.getElementById('allSirTog').checked=false;
        clearTimeout(strobeTmr);clearInterval(strobeInt);
        document.getElementById('strobeTm').classList.remove('show');
        document.getElementById('strobeTest').textContent='TEST';document.getElementById('strobeTest').classList.remove('testing');
        document.getElementById('strobeDesc').textContent=strobeReady?'Ready — Sedia untuk trigger':'Standby — Sedia untuk trigger';
        cmd('panic',false);toast('Panic dimatikan','var(--red)');
    }
}

// ===== TOAST =====
function toast(m,c='var(--green)'){
    const a=document.getElementById('toastArea'),t=document.createElement('div');
    t.className='fg-t';t.innerHTML=`<i class="bi bi-circle-fill" style="font-size:8px;color:${c}"></i> ${m}`;
    a.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},2200);
}

// ===== SIM =====
setInterval(()=>{
    document.getElementById('pvV').textContent=(17+Math.random()*3).toFixed(1)+'V';
    document.getElementById('pvA').textContent=(.8+Math.random()*.8).toFixed(1)+'A';
    const bv=(12.2+Math.random()).toFixed(1);
    document.getElementById('bvV').textContent=bv+'V';
    const bp=Math.min(100,Math.max(0,Math.round((bv-11)/2.2*100)));
    document.getElementById('btPc').textContent=bp+'%';
    document.getElementById('btFl').style.width=bp+'%';
    document.getElementById('ldW').textContent=(6+Math.random()*5).toFixed(1)+'W';
},5000);

let upM=272;setInterval(()=>{upM++;document.getElementById('uptime').textContent=String(Math.floor(upM/60)).padStart(2,'0')+':'+String(upM%60).padStart(2,'0')},60000);

setInterval(()=>{
    if(motionOn&&Math.random()>.6){
        const z=['Zone A','Zone B','Zone C'][Math.floor(Math.random()*3)];
        addLog('warn','Motion detected — '+z);
        document.getElementById('motionDesc').textContent='⚠️ Motion — '+z;
        setTimeout(()=>{addLog('ok','All clear');if(motionOn)document.getElementById('motionDesc').textContent='Monitoring — Tiada gerakan'},3000+Math.random()*2000);
    }
},15000);

document.querySelectorAll('.ni').forEach(n=>n.addEventListener('click',()=>{document.querySelectorAll('.ni').forEach(x=>x.classList.remove('act'));n.classList.add('act')}));

// ===== Set active nav on devices page =====
function setActiveNav(){
    const navButtons=document.querySelectorAll('.ni');
    navButtons.forEach(btn=>btn.classList.remove('act'));
    const path = window.location.pathname.split('/').pop();
    if(path === '' || path === 'index.html') navButtons[0].classList.add('act');
    else if(path.includes('device')) navButtons[1].classList.add('act');
    else if(path === 'settings.html') navButtons[3].classList.add('act');
    else if(path === 'account.html') navButtons[4].classList.add('act');
    else navButtons[0].classList.add('act');
}

loadSelectedDevice();
setActiveNav();
initLogs();
