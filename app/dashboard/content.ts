export const pageContent = `
<style>
    :root{
      --bg:#000;--fg:#e9e9e9;--muted:#9ea0a3;
      --line:rgba(255,255,255,.10);--glass:rgba(255,255,255,.06);
      --blue:#0a84ff;--gold:#ffcf3f;--ok:#8ff0b1;--danger:#ff6b6b;--warn:#ffd18a;
      --r:18px;
    }
    *{box-sizing:border-box}
    html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,sans-serif;}
    a,a:link,a:visited,a:hover,a:active{color:#fff!important;text-decoration:none!important;-webkit-text-fill-color:#fff!important;}
    button,input,select{font-family:inherit;-webkit-tap-highlight-color:transparent;}

    .app{min-height:100vh;width:100%;}

    /* —— Main —— */
    .main{padding:18px 18px 40px;max-width:1400px;margin:0 auto;width:100%;}
    .topbar{position:sticky;top:0;z-index:20;padding:10px 0 12px;background:linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),rgba(0,0,0,0));backdrop-filter:blur(14px);}
    .topbar-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
    .page-title{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:16px;}
    .sub{margin:5px 0 0;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}
    .btn{height:44px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-weight:900;font-size:13px;letter-spacing:.02em;transition:all .18s ease;white-space:nowrap;line-height:44px;display:inline-flex;align-items:center;justify-content:center;}
    .btn:hover{background:rgba(255,255,255,.09);transform:translateY(-1px);}
    .btn.primary{border-color:rgba(10,132,255,.80);box-shadow:0 0 0 1px rgba(10,132,255,.20) inset,0 0 18px rgba(10,132,255,.25);background:rgba(0,0,0,.75);}
    .btn.sm{height:36px;font-size:12px;padding:0 12px;}
    .search{height:44px;width:min(300px,55vw);border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .search:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .search::placeholder{color:rgba(255,255,255,.30);}

    /* —— Grid —— */
    .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px;margin-top:16px;}
    .c3{grid-column:span 3;} .c4{grid-column:span 4;} .c5{grid-column:span 5;}
    .c6{grid-column:span 6;} .c7{grid-column:span 7;} .c8{grid-column:span 8;} .c12{grid-column:span 12;}
    @media(max-width:1100px){.c3,.c4,.c5,.c6,.c7,.c8{grid-column:span 6;}}
    @media(max-width:640px){.c3,.c4,.c5,.c6,.c7,.c8,.c12{grid-column:span 12;}}

    /* —— Cards —— */
    .card{border-radius:var(--r);border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);backdrop-filter:blur(16px);padding:14px;overflow:hidden;}
    .card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
    .card-head h3{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.60);}

    /* —— KPI —— */
    .kpi-val{font-size:28px;font-weight:900;letter-spacing:.02em;line-height:1;}
    .kpi-sub{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-top:4px;}
    .kpi-trend{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.50);}
    .dot{width:7px;height:7px;border-radius:999px;background:rgba(255,255,255,.25);flex:0 0 auto;}
    .dot.ok{background:var(--ok);} .dot.bad{background:var(--danger);} .dot.blue{background:var(--blue);} .dot.gold{background:var(--gold);}

    /* —— Appointment rows —— */
    .appt-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);cursor:pointer;transition:background .15s;}
    .appt-row:hover{background:rgba(255,255,255,.04);}
    .appt-row + .appt-row{margin-top:8px;}
    .appt-time{width:48px;font-weight:900;font-size:13px;flex:0 0 auto;}
    .appt-info{min-width:0;flex:1;}
    .appt-name{font-weight:900;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .appt-desc{font-size:11px;color:rgba(255,255,255,.50);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
    .appt-right{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
    .chip{font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.12);color:rgba(255,255,255,.70);white-space:nowrap;}
    .chip.paid{border-color:rgba(143,240,177,.40);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .chip.booked{border-color:rgba(10,132,255,.40);background:rgba(10,132,255,.10);color:#d7ecff;}
    .chip.arrived{border-color:rgba(143,240,177,.40);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .chip.done{border-color:rgba(255,207,63,.40);background:rgba(255,207,63,.08);color:#ffe9a3;}
    .chip.noshow{border-color:rgba(255,107,107,.40);background:rgba(255,107,107,.10);color:#ffd0d0;}
    .chip.cancelled{border-color:rgba(255,107,107,.30);background:rgba(255,107,107,.07);color:#ffd0d0;}
    .pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);flex:0 0 auto;white-space:nowrap;}
    .pill.blue{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;}
    .pill.live{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.08);color:#c9ffe1;}

    /* —— Quick actions —— */
    .qa-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    @media(max-width:480px){.qa-grid{grid-template-columns:1fr;}}
    .qa-btn{padding:14px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.14);cursor:pointer;text-align:left;transition:all .18s ease;color:#fff;}
    .qa-btn:hover{background:rgba(255,255,255,.05);transform:translateY(-1px);}
    .qa-btn .qa-title{font-weight:900;font-size:13px;margin-bottom:4px;}
    .qa-btn .qa-desc{font-size:11px;color:rgba(255,255,255,.50);line-height:1.4;}
    .qa-btn .qa-icon{display:block;margin-bottom:8px;color:rgba(255,255,255,.70);}
    .qa-btn .qa-icon svg{display:block;}

    /* —— Revenue bar —— */
    .barber-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);}
    .barber-row:last-child{border-bottom:none;}
    .barber-row .br-name{width:60px;font-weight:700;font-size:12px;flex:0 0 auto;}
    .barber-row .br-bar-wrap{flex:1;height:6px;border-radius:999px;background:rgba(255,255,255,.08);}
    .barber-row .br-bar{height:6px;border-radius:999px;background:linear-gradient(90deg,var(--blue),rgba(10,132,255,.5));transition:width .6s ease;}
    .barber-row .br-val{width:55px;text-align:right;font-size:12px;color:rgba(255,255,255,.65);}

    /* —— Activity feed —— */
    .activity-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);}
    .activity-item:last-child{border-bottom:none;}
    .act-dot{width:8px;height:8px;border-radius:999px;flex:0 0 auto;margin-top:5px;}
    .act-text{font-size:12px;line-height:1.4;flex:1;}
    .act-time{font-size:10px;color:rgba(255,255,255,.35);white-space:nowrap;}

    /* —— Dialog —— */
    #dlgOverlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9000;opacity:0;pointer-events:none;transition:opacity .22s ease;}
    #dlgWin{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:min(380px,90vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98));box-shadow:0 24px 80px rgba(0,0,0,.7);padding:24px 22px 18px;z-index:9001;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .22s ease;}
    #dlgTitle{font-family:"Julius Sans One",sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:rgba(255,255,255,.50);margin-bottom:10px;}
    #dlgMsg{font-size:14px;font-weight:600;line-height:1.55;color:#e9e9e9;margin-bottom:20px;}
    #dlgBtns{display:flex;gap:10px;justify-content:flex-end;}
  </style>

<script>
(function(){
  var TOKEN = localStorage.getItem('ELEMENT_TOKEN');
  var USERRAW = localStorage.getItem('ELEMENT_USER');
  var user = null;
  try { user = JSON.parse(USERRAW); } catch(e) {}

  if (!TOKEN || !user) {
    window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.href);
    return;
  }

  // Verify token with API
  fetch('https://element-crm-api-431945333485.us-central1.run.app/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  }).then(function(r) {
    if (r.status === 401) {
      localStorage.removeItem('ELEMENT_TOKEN');
      localStorage.removeItem('ELEMENT_USER');
      window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.href);
    }
  }).catch(function() {});

  var ROLE = user.role || 'owner';
  var PERMS = {
    owner:  {payroll:true,settings:true,payments:true,allBookings:true,clients:true,users:true,dashboard:true},
    admin:  {payroll:false,settings:false,payments:true,allBookings:true,clients:true,users:false,dashboard:true},
    barber: {payroll:false,settings:false,payments:false,allBookings:false,clients:false,users:false,dashboard:false}
  };
  var perm = PERMS[ROLE] || PERMS.barber;

  window.ELEMENT_AUTH = {
    user:user, token:TOKEN, role:ROLE, perm:perm,
    canSee:function(k){ return !!perm[k]; },
    getHeaders:function(){
      return {'Authorization':'Bearer '+TOKEN,'X-API-KEY':'R1403ss81fxrx*rx1403','Accept':'application/json'};
    },
    logout:function(){
      localStorage.removeItem('ELEMENT_TOKEN');
      localStorage.removeItem('ELEMENT_USER');
      window.location.href='/signin';
    }
  };
})();
</script>
<script>
(function(){
  var USERRAW = localStorage.getItem('ELEMENT_USER');
  var TOKEN   = localStorage.getItem('ELEMENT_TOKEN') || '';
  var user = null;
  try { user = JSON.parse(USERRAW); } catch(e) {}
  if (!user) user = { uid:'guest', username:'owner', name:'Owner', role:'owner', barber_id:'' };
  var ROLE = user.role || 'owner';
  var PERMS = {
    owner:  {payroll:true,settings:true,payments:true,allBookings:true,clients:true,users:true,dashboard:true},
    admin:  {payroll:false,settings:false,payments:true,allBookings:true,clients:true,users:false,dashboard:true},
    barber: {payroll:false,settings:false,payments:false,allBookings:false,clients:false,users:false,dashboard:false}
  };
  var perm = PERMS[ROLE] || PERMS.owner;
  window.ELEMENT_AUTH = {
    user:user, token:TOKEN, role:ROLE, perm:perm,
    canSee:function(k){ return !!perm[k]; },
    getHeaders:function(){
      return {'Authorization':'Bearer '+TOKEN,'X-API-KEY':'R1403ss81fxrx*rx1403','Accept':'application/json'};
    },
    logout:function(){
      localStorage.removeItem('ELEMENT_TOKEN');
      localStorage.removeItem('ELEMENT_USER');
      window.location.href='/signin';
    }
  };
})();
</script>

<div class="app">
  <main class="main">
    <div class="topbar">
      <div class="topbar-row">
        <div>
          <h2 class="page-title">Dashboard</h2>
          <p class="sub" id="todayLine">Loading…</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input class="search" id="searchInput" placeholder="Search client / booking…"/>
          <a href="/calendar" class="btn primary">+ New booking</a>
          <button class="btn" id="btnRefresh">↻</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card c3">
        <div class="card-head"><h3>Bookings today</h3></div>
        <div class="kpi-val" id="kpiBookings">—</div>
        <div class="kpi-sub">appointments</div>
        <div class="kpi-trend"><span class="dot blue"></span><span id="kpiBookingsSub">loading</span></div>
      </div>
      <div class="card c3">
        <div class="card-head"><h3>Revenue today</h3></div>
        <div class="kpi-val" id="kpiRevenue">—</div>
        <div class="kpi-sub">gross collected</div>
        <div class="kpi-trend"><span class="dot ok"></span><span id="kpiRevenueSub">—</span></div>
      </div>
      <div class="card c3">
        <div class="card-head"><h3>Paid / Unpaid</h3></div>
        <div class="kpi-val" id="kpiPaid">—</div>
        <div class="kpi-sub">paid bookings</div>
        <div class="kpi-trend"><span class="dot" id="kpiPaidDot"></span><span id="kpiPaidSub">—</span></div>
      </div>
      <div class="card c3">
        <div class="card-head"><h3>No-shows</h3></div>
        <div class="kpi-val" id="kpiNoShow">—</div>
        <div class="kpi-sub">today</div>
        <div class="kpi-trend"><span class="dot bad"></span><span id="kpiNoShowSub">—</span></div>
      </div>

      <div class="card c7">
        <div class="card-head">
          <h3>Today's appointments</h3>
          <select id="filterBarber" style="height:30px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 8px;font-size:11px;outline:none;">
            <option value="">All barbers</option>
          </select>
        </div>
        <div id="todayList" style="display:flex;flex-direction:column;gap:8px;max-height:480px;overflow-y:auto;"></div>
      </div>

      <div style="grid-column:span 5;display:flex;flex-direction:column;gap:14px;">
        <div class="card">
          <div class="card-head"><h3>Quick actions</h3></div>
          <div class="qa-grid">
            <button class="qa-btn" onclick="window.location='/calendar'">
              <span class="qa-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
              <div class="qa-title">Calendar</div>
              <div class="qa-desc">View & manage bookings</div>
            </button>
            <button class="qa-btn" onclick="window.location='/payments'">
              <span class="qa-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg></span>
              <div class="qa-title">Payments</div>
              <div class="qa-desc">Transactions & Square</div>
            </button>
            <button class="qa-btn" onclick="window.location='/payroll'">
              <span class="qa-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
              <div class="qa-title">Payroll</div>
              <div class="qa-desc">Commission + tips report</div>
            </button>
            <button class="qa-btn" onclick="window.location='/settings'">
              <span class="qa-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
              <div class="qa-title">Settings</div>
              <div class="qa-desc">Tax, fees, barbers</div>
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Today by barber</h3><span class="pill" id="barberPeriodPill">Today</span></div>
          <div id="barberBars"></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Recent activity</h3></div>
          <div id="activityFeed"></div>
        </div>
      </div>
    </div>
  </main>
</div>

<div id="dlgOverlay"></div>
<div id="dlgWin">
  <div id="dlgTitle"></div>
  <div id="dlgMsg"></div>
  <div id="dlgBtns"></div>
</div>

<script>
const API_BASE = (window.ELEMENT_CRM_API || localStorage.getItem('ELEMENT_CRM_API') || 'https://element-crm-api-431945333485.us-central1.run.app').replace(/\\/+$/, '');
const API_KEY  = localStorage.getItem('ELEMENT_CRM_API_KEY') || 'R1403ss81fxrx*rx1403';

async function api(path, opts = {}) {
  const { method = 'GET', body } = opts;
  const headers = { Accept: 'application/json' };
  if (body != null) headers['Content-Type'] = 'application/json';
  if (API_KEY) headers['X-API-KEY'] = API_KEY;
  const res = await fetch(API_BASE + path, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(json?.error || text || 'HTTP ' + res.status);
  return json;
}

const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
const money = n => '$' + Number(n||0).toFixed(2);
function isoToday() { return new Date().toISOString().slice(0,10); }
function fmtStartAt(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12: false }); }
  catch { return '—'; }
}
function fmtDateLong(d) {
  return d.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}

const dlgOverlay = document.getElementById('dlgOverlay');
const dlgWin     = document.getElementById('dlgWin');
let _dlgResolve  = null;
function dlgOpen(opts) {
  document.getElementById('dlgTitle').textContent = opts.title || '';
  document.getElementById('dlgMsg').innerHTML = opts.msg || '';
  const btns = document.getElementById('dlgBtns');
  btns.innerHTML = '';
  (opts.buttons || [{label:'OK',value:true,style:'primary'}]).forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    const s = { primary:'height:40px;padding:0 20px;border-radius:999px;border:1px solid rgba(10,132,255,.75);background:rgba(10,132,255,.18);color:#d7ecff;font-weight:900;font-size:13px;cursor:pointer;', default:'height:40px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-weight:700;font-size:13px;cursor:pointer;', danger:'height:40px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,107,107,.55);background:rgba(255,107,107,.12);color:#ffd0d0;font-weight:900;font-size:13px;cursor:pointer;' };
    btn.style.cssText = s[b.style||'default'];
    btn.addEventListener('click', () => { dlgClose(); if (_dlgResolve) _dlgResolve(b.value); });
    btns.appendChild(btn);
  });
  dlgOverlay.style.cssText = 'opacity:1;pointer-events:auto;';
  dlgWin.style.cssText = 'opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1);';
}
function dlgClose() {
  dlgOverlay.style.cssText = 'opacity:0;pointer-events:none;';
  dlgWin.style.cssText = 'opacity:0;pointer-events:none;transform:translate(-50%,-50%) scale(.9);';
}
dlgOverlay.addEventListener('click', () => { dlgClose(); if (_dlgResolve) _dlgResolve(false); });

let bookings = [], paymentsToday = [];
let filterBarber = '';

async function loadAll() {
  const today = isoToday();
  try {
    const [bkData, pmData, stData] = await Promise.all([
      api('/api/bookings?from=' + today + 'T00:00:00.000Z&to=' + today + 'T23:59:59.999Z').catch(() => ({ bookings: [] })),
      api('/api/payments?from=' + today + '&to=' + today).catch(() => ({ payments: [], totals: null })),
      api('/api/settings').catch(() => ({}))
    ]);
    bookings = Array.isArray(bkData?.bookings) ? bkData.bookings : Array.isArray(bkData) ? bkData : [];
    paymentsToday = Array.isArray(pmData?.payments) ? pmData.payments : [];
    renderAll(pmData?.totals);
  } catch(e) {
    renderAll(null);
  }
}

function renderAll(totals) {
  document.getElementById('todayLine').textContent = fmtDateLong(new Date()) + ' · ELEMENT BARBERSHOP';
  const barbers = [...new Set(bookings.map(b => b.barber_name || b.barber).filter(Boolean))].sort();
  const sel = document.getElementById('filterBarber');
  const curVal = sel.value;
  sel.innerHTML = '<option value="">All barbers</option>';
  barbers.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  if (curVal) sel.value = curVal;
  const filtered = filterBarber ? bookings.filter(b => (b.barber_name||b.barber) === filterBarber) : bookings;
  const total = filtered.length;
  const paid  = filtered.filter(b => b.paid || b.is_paid || b.payment_status === 'paid').length;
  const unpaid = total - paid;
  const noshow = filtered.filter(b => b.status === 'noshow' || b.status === 'no_show').length;
  const gross  = totals?.gross ?? paymentsToday.reduce((s,p) => s + (p.amount||0) + (p.tip||0), 0);
  const tips   = totals?.tips  ?? paymentsToday.reduce((s,p) => s + (p.tip||0), 0);
  document.getElementById('kpiBookings').textContent = total;
  document.getElementById('kpiBookingsSub').textContent = filtered.filter(b => b.status === 'booked' || b.status === 'arrived').length + ' upcoming';
  document.getElementById('kpiRevenue').textContent = money(gross);
  document.getElementById('kpiRevenueSub').textContent = tips > 0 ? 'incl. $' + tips.toFixed(2) + ' tips' : 'from bookings';
  document.getElementById('kpiPaid').textContent = paid + '/' + total;
  document.getElementById('kpiPaidSub').textContent = unpaid > 0 ? unpaid + ' unpaid' : 'all paid ✓';
  document.getElementById('kpiPaidDot').className = 'dot ' + (unpaid === 0 && total > 0 ? 'ok' : unpaid > 0 ? 'gold' : '');
  document.getElementById('kpiNoShow').textContent = noshow;
  document.getElementById('kpiNoShowSub').textContent = noshow > 0 ? 'needs attention' : 'all good';
  renderTodayList(filtered);
  renderBarberBars(bookings);
  renderActivity();
}

function renderTodayList(list) {
  const el = document.getElementById('todayList');
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  let rows = [...list].sort((a, b) => String(a.start_at||'').localeCompare(String(b.start_at||'')));
  if (q) rows = rows.filter(b => [b.client_name,b.barber_name,b.service_name,b.client_phone].join(' ').toLowerCase().includes(q));
  if (!rows.length) { el.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(255,255,255,.30);font-size:12px;letter-spacing:.10em;text-transform:uppercase;">' + (q ? 'No results' : 'No bookings today') + '</div>'; return; }
  el.innerHTML = rows.map(b => {
    const time = fmtStartAt(b.start_at);
    const client = esc(b.client_name || 'Client');
    const barber = esc(b.barber_name || b.barber || '—');
    const svc = esc(b.service_name || b.service || '—');
    const status = String(b.status || 'booked').toLowerCase();
    const isPaid = b.paid || b.is_paid || b.payment_status === 'paid';
    return \`<div class="appt-row"><div class="appt-time">\${time}</div><div class="appt-info"><div class="appt-name">\${client}</div><div class="appt-desc">\${barber} · \${svc}</div></div><div class="appt-right">\${isPaid ? '<span class="chip paid">Paid</span>' : ''}<span class="chip \${status}">\${status}</span></div></div>\`;
  }).join('');
  el.querySelectorAll('.appt-row').forEach(row => { row.addEventListener('click', () => { window.location = '/calendar'; }); });
}

function renderBarberBars(list) {
  const el = document.getElementById('barberBars');
  const byBarber = {};
  list.forEach(b => { const name = b.barber_name || b.barber || '?'; if (!byBarber[name]) byBarber[name] = { count: 0 }; byBarber[name].count++; });
  const entries = Object.entries(byBarber).sort((a,b) => b[1].count - a[1].count);
  if (!entries.length) { el.innerHTML = '<div style="color:rgba(255,255,255,.30);font-size:12px;padding:8px 0;">No data yet</div>'; return; }
  const maxCount = Math.max(...entries.map(e => e[1].count), 1);
  el.innerHTML = entries.map(([name, d]) => \`<div class="barber-row"><div class="br-name">\${esc(name)}</div><div class="br-bar-wrap"><div class="br-bar" style="width:\${Math.round(d.count/maxCount*100)}%"></div></div><div class="br-val">\${d.count} bk</div></div>\`).join('');
}

function renderActivity() {
  const el = document.getElementById('activityFeed');
  const recent = [...bookings].sort((a,b) => String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||''))).slice(0, 8);
  if (!recent.length) { el.innerHTML = '<div style="color:rgba(255,255,255,.30);font-size:12px;padding:8px 0;">No activity yet</div>'; return; }
  el.innerHTML = recent.map(b => {
    const client = esc(b.client_name || 'Client');
    const time = fmtStartAt(b.start_at);
    const status = String(b.status || 'booked');
    const dotColors = { booked:'blue', arrived:'ok', done:'gold', noshow:'bad', cancelled:'bad' };
    const dotColor = b.paid ? 'ok' : (dotColors[status] || '');
    return \`<div class="activity-item"><span class="act-dot dot \${dotColor}"></span><span class="act-text"><strong>\${client}</strong> — \${esc(b.service_name||'service')} · <em style="color:rgba(255,255,255,.45);">\${b.paid ? 'paid' : status}</em></span><span class="act-time">\${time}</span></div>\`;
  }).join('');
}

document.getElementById('searchInput')?.addEventListener('input', () => { filterBarber = document.getElementById('filterBarber').value; renderTodayList(filterBarber ? bookings.filter(b => (b.barber_name||b.barber) === filterBarber) : bookings); });
document.getElementById('filterBarber')?.addEventListener('change', e => { filterBarber = e.target.value; renderAll(null); });
document.getElementById('btnRefresh')?.addEventListener('click', loadAll);
setInterval(loadAll, 120000);
loadAll();
</script>
</body>
`
