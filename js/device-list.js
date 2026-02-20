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

// Device data
const ladangs=[
    {name:'Ladang Gua Musang',loc:'Gua Musang, Kelantan',devices:[
        {no:1,id:'FG-001',name:'FG-Unit-001',on:true,batt:87,loc:'Zone A'},
        {no:2,id:'FG-002',name:'FG-Unit-002',on:true,batt:62,loc:'Zone B'},
        {no:3,id:'FG-003',name:'FG-Unit-003',on:false,batt:12,loc:'Zone C'},
    ]},
    {name:'Ladang Jeli',loc:'Jeli, Kelantan',devices:[
        {no:4,id:'FG-004',name:'FG-Unit-004',on:true,batt:95,loc:'Zone A'},
        {no:5,id:'FG-005',name:'FG-Unit-005',on:true,batt:78,loc:'Zone B'},
    ]}
];

// Render device list
function renderDeviceList(){
    document.getElementById('devList').innerHTML=ladangs.map(l=>`
        <div class="dev-group">
            <div class="section-top">
                <div class="dg-left">
                    <div class="dg-ic"><i class="bi bi-tree-fill"></i></div>
                    <div>
                        <div class="dg-name">${l.name}</div>
                        <div class="dg-loc"><i class="bi bi-geo-alt"></i> ${l.loc}</div>
                    </div>
                </div>
                <div class="dg-count">${l.devices.length} Unit</div>
            </div>
            <div class="dev-list">
                ${l.devices.map(d=>`
                    <div class="dev-item" onclick="goToDevice('${d.id}','${d.name}')">
                        <div class="dev-dot ${d.on?'d-on':'d-off'}"></div>
                        <div class="dev-info">
                            <div class="dev-no">#${String(d.no).padStart(2,'0')}</div>
                            <div class="dev-name">${d.name}</div>
                            <div class="dev-loc">${d.on?'Online':'Offline'} · ${d.loc}</div>
                        </div>
                        <div class="dev-right">
                            <div class="dev-batt ${d.batt<20?'low':''}">
                                <i class="bi ${d.batt<20?'bi-battery':'bi-battery-full'}"></i>${d.batt}%
                            </div>
                            <i class="bi bi-chevron-right dev-arrow"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Navigation
function goToDevice(id,name){
    localStorage.setItem('selectedDeviceId',id);
    localStorage.setItem('selectedDeviceName',name);
    window.location.href='devices.html';
}

function navHome(){window.location.href='index.html'}
function navDevice(){window.location.href='device-list.html'}
function navAccount(){window.location.href='account.html'}

// Dark mode: handled by js/script.js (toggleDarkMode)

// ===== NAV - Set active based on current page =====
function setActiveNav(){
    const navButtons=document.querySelectorAll('.ni');
    navButtons.forEach(btn=>btn.classList.remove('act'));
    navButtons[1].classList.add('act'); // Device is always active on this page
}

// Init
renderDeviceList();
setActiveNav();

// ---- Add Device modal logic ----
function openAddDeviceModal(){
    populateFarmOptions();
    const d = new Date();
    document.getElementById('deviceDate').value = d.toISOString().split('T')[0];
    document.getElementById('addDeviceModal').style.display = 'flex';
}
function closeAddDeviceModal(){
    document.getElementById('addDeviceModal').style.display = 'none';
    // clear inputs
    const n=document.getElementById('deviceName'); if(n) n.value='';
    const l=document.getElementById('deviceLoc'); if(l) l.value='';
    const a=document.getElementById('autoNo'); if(a) a.checked=false;
}
function populateFarmOptions(){
    const sel = document.getElementById('farmSelect');
    if(!sel) return;
    let farms = (typeof getLadangs === 'function') ? getLadangs() : ladangs.map(f=>({name:f.name, loc:f.loc}));
    sel.innerHTML = farms.map((f,i)=>`<option value="${i}">${f.name}</option>`).join('');
}
function addDevice(){
    const sel = document.getElementById('farmSelect');
    const idx = parseInt(sel.value||0,10);
    const nameEl = document.getElementById('deviceName');
    const locEl = document.getElementById('deviceLoc');
    const auto = document.getElementById('autoNo')?.checked;
    const devices = ladangs[idx].devices;
    const nextNo = devices.length ? Math.max(...devices.map(d=>d.no)) + 1 : 1;
    if(!nameEl.value && !auto){ alert('Sila isi nama device atau pilih auto running number.'); return }
    const id = 'FG-' + String(nextNo).padStart(3,'0');
    const name = nameEl.value || ('FG-Unit-' + String(nextNo).padStart(3,'0'));
    const date = document.getElementById('deviceDate').value || new Date().toISOString().split('T')[0];
    devices.push({no: nextNo, id: id, name: name, on:false, batt:100, loc: locEl.value||'', created: date});
    renderDeviceList();
    closeAddDeviceModal();
}

// wire button after DOM ready
document.addEventListener('DOMContentLoaded',function(){
    const btn = document.getElementById('openAddDevice');
    if(btn) btn.addEventListener('click',openAddDeviceModal);
});

// Device-list relies on ladang.js for add/close modal functions when adding ladang
