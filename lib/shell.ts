// Shared CRM Shell - sidebar with content area
// Based on crm-shell.html but adapted for Next.js routing

export const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export function getShellStyles() {
  return `
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;background:#000;color:#e9e9e9;font-family:Inter,system-ui,-apple-system,sans-serif;}
a,a:link,a:visited,a:hover,a:active{color:#fff!important;text-decoration:none!important;-webkit-text-fill-color:#fff!important;}
button,input,select{font-family:inherit;-webkit-tap-highlight-color:transparent;}
.shell{display:flex;height:100vh;width:100vw;overflow:hidden;}
.sidebar{width:280px;flex:0 0 280px;border-right:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));backdrop-filter:blur(18px);display:flex;flex-direction:column;height:100vh;overflow:auto;z-index:40;transition:transform .25s ease;}
.brand{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 14px;border-bottom:1px solid rgba(255,255,255,.10);}
.brand h1{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;font-size:14px;text-transform:uppercase;}
.brand-tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12);padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.04);}
.nav{display:flex;flex-direction:column;gap:6px;padding:12px 8px;flex:1;}
.nav a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.10);transition:all .18s ease;color:#fff!important;-webkit-text-fill-color:#fff!important;text-decoration:none!important;cursor:pointer;}
.nav a:hover{background:rgba(255,255,255,.06);}
.nav a.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.12);}
.nav-left{display:flex;align-items:center;gap:10px;min-width:0;}
.ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;color:rgba(255,255,255,.80);}
.ico svg{display:block;}
.nav-label{min-width:0;}
.nav-t{font-weight:900;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;color:#fff!important;}
.nav-s{font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45)!important;display:block;}
.pill{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.65);flex:0 0 auto;white-space:nowrap;}
.pill.blue{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;}
.pill.live{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.08);color:#c9ffe1;}
.user-bar{padding:10px;border-top:1px solid rgba(255,255,255,.08);}
.user-card{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16);}
.user-info{min-width:0;overflow:hidden;}
.user-name{font-weight:900;font-size:13px;color:#e9e9e9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.user-role{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.40);margin-top:2px;}
.user-btns{display:flex;gap:6px;flex-shrink:0;}
.user-btns button{height:30px;padding:0 10px;border-radius:8px;cursor:pointer;font-size:11px;font-family:inherit;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;}
.user-btns .btn-out{border-color:rgba(255,107,107,.30);background:rgba(255,107,107,.06);color:#ffd0d0;}
.burger{display:none;position:fixed;top:14px;left:14px;z-index:200;width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.85);backdrop-filter:blur(12px);color:#fff;cursor:pointer;align-items:center;justify-content:center;flex-direction:column;gap:5px;}
.burger span{display:block;width:18px;height:2px;border-radius:2px;background:#fff;transition:all .25s;}
.burger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
.burger.open span:nth-child(2){opacity:0;}
.burger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
.sb-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:39;}
.sb-backdrop.open{display:block;}
.content{flex:1;min-width:0;height:100vh;overflow-y:auto;overflow-x:hidden;position:relative;background:#000;}
#pwOverlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9500;opacity:0;pointer-events:none;transition:opacity .22s;}
#pwModal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:min(360px,90vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98));box-shadow:0 24px 80px rgba(0,0,0,.7);padding:24px;z-index:9501;opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;}
#pwModal input{height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.30);color:#fff;padding:0 14px;font-family:inherit;font-size:14px;outline:none;width:100%;margin-bottom:10px;display:block;}
#pwModal input:focus{border-color:rgba(10,132,255,.55);}
#pwErr{font-size:12px;color:#ffd0d0;display:none;padding:8px 12px;border-radius:8px;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.25);margin-bottom:10px;}
.pw-footer{display:flex;gap:10px;justify-content:flex-end;}
.pw-footer button{height:40px;padding:0 18px;border-radius:999px;cursor:pointer;font-weight:700;font-family:inherit;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;}
.pw-footer .pw-save{border-color:rgba(10,132,255,.65);background:rgba(10,132,255,.16);color:#d7ecff;font-weight:900;}
@media(max-width:980px){
  .sidebar{position:fixed;inset:0 auto 0 0;transform:translateX(-110%);z-index:180;}
  .sidebar.open{transform:translateX(0);}
  .burger{display:flex;}
}
</style>
`
}

export function getShellNav(activePage: string) {
  const NAV = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', sub: 'Today overview', pill: '', pillClass: '',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>` },
    { id: 'calendar', href: '/calendar', label: 'Calendar', sub: 'Bookings grid', pill: 'Day', pillClass: 'blue',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>` },
    { id: 'clients', href: '/clients', label: 'Clients', sub: 'Search / notes', pill: '', pillClass: '',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { id: 'payments', href: '/payments', label: 'Payments', sub: 'Square + Terminal', pill: 'Live', pillClass: 'live', ownerAdmin: true,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>` },
    { id: 'payroll', href: '/payroll', label: 'Payroll', sub: 'Commission + tips', pill: '', pillClass: '', ownerOnly: true,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
    { id: 'settings', href: '/settings', label: 'Settings', sub: 'Config & sync', pill: '', pillClass: '', ownerAdmin: true,
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
  ]

  return NAV.map(item => `
    <a href="${item.href}" class="${item.id === activePage ? 'active' : ''}" id="nav-${item.id}">
      <div class="nav-left">
        <div class="ico">${item.icon}</div>
        <div class="nav-label">
          <span class="nav-t">${item.label}</span>
          <span class="nav-s">${item.sub}</span>
        </div>
      </div>
      ${item.pill ? `<span class="pill ${item.pillClass}">${item.pill}</span>` : ''}
    </a>
  `).join('')
}

export function getShellScript() {
  return `
<script>
const API = 'https://element-crm-api-431945333485.us-central1.run.app';
const TOKEN = localStorage.getItem('ELEMENT_TOKEN') || '';
const USER = (() => { try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null'); } catch { return null; } })();
const ROLE = USER?.role || 'owner';
const PERMS = {
  owner:{payroll:true,settings:true,payments:true,allBookings:true},
  admin:{payroll:false,settings:false,payments:true,allBookings:true},
  barber:{payroll:false,settings:false,payments:false,allBookings:false}
};

// Auth guard
if (!TOKEN || !USER) {
  window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.pathname);
}

// Set user info
if (USER) {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  if (nameEl) nameEl.textContent = USER.name || USER.username || 'Owner';
  if (roleEl) roleEl.textContent = (USER.role||'owner').charAt(0).toUpperCase()+(USER.role||'owner').slice(1);
}

// RBAC — hide nav items based on role
const perm = PERMS[ROLE] || PERMS.owner;
if (!perm.payroll) {
  const el = document.getElementById('nav-payroll');
  if (el) el.style.display = 'none';
}
if (!perm.settings) {
  const el = document.getElementById('nav-settings');
  if (el) el.style.display = 'none';
}
if (!perm.payments) {
  const el = document.getElementById('nav-payments');
  if (el) el.style.display = 'none';
}

// Verify token in background
if (TOKEN) {
  fetch(API + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + TOKEN } })
    .then(r => { if (r.status === 401) { localStorage.removeItem('ELEMENT_TOKEN'); localStorage.removeItem('ELEMENT_USER'); window.location.href = '/signin'; } })
    .catch(() => {});
}

// Burger
const sidebar = document.getElementById('sidebar');
const burger = document.getElementById('burger');
const sbBackdrop = document.getElementById('sbBackdrop');
function openSB() { sidebar.classList.add('open'); burger.classList.add('open'); sbBackdrop.classList.add('open'); }
function closeSB() { sidebar.classList.remove('open'); burger.classList.remove('open'); sbBackdrop.classList.remove('open'); }
burger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSB() : openSB());
sbBackdrop.addEventListener('click', closeSB);
document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => closeSB()));
window.addEventListener('resize', () => { if (window.innerWidth > 980) closeSB(); });

// PW Modal
function openPwModal() {
  document.getElementById('pwOverlay').style.cssText = 'opacity:1;pointer-events:auto;';
  const m = document.getElementById('pwModal');
  m.style.opacity='1';m.style.pointerEvents='auto';m.style.transform='translate(-50%,-50%) scale(1)';
  ['pwCurrent','pwNew','pwConfirm'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('pwErr').style.display='none';
  setTimeout(() => document.getElementById('pwCurrent').focus(), 100);
}
function closePwModal() {
  document.getElementById('pwOverlay').style.cssText = 'opacity:0;pointer-events:none;';
  const m = document.getElementById('pwModal');
  m.style.opacity='0';m.style.pointerEvents='none';m.style.transform='translate(-50%,-50%) scale(.9)';
}
async function savePw() {
  const cur=document.getElementById('pwCurrent').value;
  const nw=document.getElementById('pwNew').value;
  const cfm=document.getElementById('pwConfirm').value;
  const err=document.getElementById('pwErr');
  const btn=document.getElementById('pwSaveBtn');
  err.style.display='none';
  function showErr(msg){err.textContent=msg;err.style.display='block';}
  if(!cur||!nw){showErr('Fill all fields');return;}
  if(nw.length<4){showErr('Min 4 characters');return;}
  if(nw!==cfm){showErr('Passwords do not match');return;}
  btn.disabled=true;btn.textContent='Saving...';
  try{
    const r=await fetch(API+'/api/auth/change-password',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN},body:JSON.stringify({current_password:cur,new_password:nw})});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||'Error');
    closePwModal();alert('Password updated!');
  }catch(e){showErr(e.message);}
  finally{btn.disabled=false;btn.textContent='Save';}
}
function doLogout(){
  localStorage.removeItem('ELEMENT_TOKEN');localStorage.removeItem('ELEMENT_USER');
  window.location.href='/signin';
}
<\/script>
`
}

export function wrapInShell(activePage: string, content: string) {
  return `
${getShellStyles()}
<button class="burger" id="burger"><span></span><span></span><span></span></button>
<div class="sb-backdrop" id="sbBackdrop"></div>
<div class="shell">
  <aside class="sidebar" id="sidebar">
    <div class="brand">
      <div>
        <h1>Element CRM</h1>
        <div style="font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.40);margin-top:3px;" id="pageLabel">${activePage.toUpperCase()}</div>
      </div>
      <div class="brand-tag">v3</div>
    </div>
    <nav class="nav">
      ${getShellNav(activePage)}
    </nav>
    <div class="user-bar">
      <div class="user-card">
        <div class="user-info">
          <div class="user-name" id="userName">—</div>
          <div class="user-role" id="userRole">—</div>
        </div>
        <div class="user-btns">
          <button onclick="openPwModal()">PW</button>
          <button class="btn-out" onclick="doLogout()">Out</button>
        </div>
      </div>
    </div>
  </aside>
  <div class="content">
    ${content}
  </div>
</div>
<div id="pwOverlay" onclick="closePwModal()"></div>
<div id="pwModal">
  <div style="font-family:'Julius Sans One',sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:rgba(255,255,255,.45);margin-bottom:14px;">Change password</div>
  <input id="pwCurrent" type="password" placeholder="Current password"/>
  <input id="pwNew" type="password" placeholder="New password"/>
  <input id="pwConfirm" type="password" placeholder="Confirm new password"/>
  <div id="pwErr"></div>
  <div class="pw-footer">
    <button onclick="closePwModal()">Cancel</button>
    <button class="pw-save" id="pwSaveBtn" onclick="savePw()">Save</button>
  </div>
</div>
${getShellScript()}
`
}
