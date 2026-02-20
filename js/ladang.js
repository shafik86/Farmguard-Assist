// Simple ladang manager using localStorage
const LADANG_KEY = 'ladangs_v1';

function getLadangs(){
    const raw = localStorage.getItem(LADANG_KEY);
    if(raw) return JSON.parse(raw);
    // fallback default
    const defaultL = [
        {name:'Ladang Gua Musang', loc:'Gua Musang, Kelantan'},
        {name:'Ladang Jeli', loc:'Jeli, Kelantan'}
    ];
    localStorage.setItem(LADANG_KEY, JSON.stringify(defaultL));
    return defaultL;
}

function renderLadangList(){
    const area = document.getElementById('ladangListArea');
    const ladangs = getLadangs();
    if(!area) return;
    area.innerHTML = ladangs.map((l,i)=>`
        <div class="lg-group">
            <div class="lg-hd">
                <div class="lg-left">
                    <div class="lg-ic"><i class="bi bi-tree-fill"></i></div>
                    <div>
                        <div class="lg-name">${l.name}</div>
                        <div class="lg-loc">${l.loc||''}</div>
                    </div>
                </div>
                <div class="lg-badges"><button class="dn-edit-btn" onclick="editLadang(${i})">Edit</button></div>
            </div>
            <div class="u-list">
                <div class="u-item"><div class="u-info">No devices yet</div></div>
            </div>
        </div>
    `).join('');
}

function openAddLadangModal(){
    document.getElementById('addLadangModal').style.display='flex';
}
function closeAddLadangModal(){
    document.getElementById('addLadangModal').style.display='none';
    document.getElementById('ladangName').value='';
    document.getElementById('ladangLoc').value='';
}

function saveLadang(){
    const name = document.getElementById('ladangName').value.trim();
    const loc = document.getElementById('ladangLoc').value.trim();
    if(!name){ alert('Sila masukkan nama ladang'); return }
    const ladangs = getLadangs();
    ladangs.push({name, loc});
    localStorage.setItem(LADANG_KEY, JSON.stringify(ladangs));
    closeAddLadangModal();
    renderLadangList();
    if(typeof populateFarmOptions === 'function') populateFarmOptions();
}

function editLadang(i){
    alert('Edit not implemented yet: ' + i);
}

function navBack(){
    window.history.back();
}

// init
window.addEventListener('DOMContentLoaded', function(){
    renderLadangList();
    const btn = document.getElementById('openAddLadang');
    if(btn) btn.addEventListener('click', openAddLadangModal);
});