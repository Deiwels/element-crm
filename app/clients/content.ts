export const pageContent = `
<style>
    :root{--bg:#000;--fg:#e9e9e9;--line:rgba(255,255,255,.10);--blue:#0a84ff;--ok:#8ff0b1;--danger:#ff6b6b;--warn:#ffd18a;--r:18px;}
    *{box-sizing:border-box}
    html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,sans-serif;}
    a,a:link,a:visited,a:hover,a:active{color:#fff!important;text-decoration:none!important;-webkit-text-fill-color:#fff!important;}
    .sidebar .nav a,.sidebar .nav a *{color:#fff!important;-webkit-text-fill-color:#fff!important;}
    .sidebar .nav a .label .s{color:rgba(255,255,255,.45)!important;-webkit-text-fill-color:rgba(255,255,255,.45)!important;}
    button,input,select,textarea{font-family:inherit;-webkit-tap-highlight-color:transparent;}

    .app{min-height:100vh;display:grid;grid-template-columns:1fr;}
    @media(max-width:980px){
      .app{grid-template-columns:1fr;}
      .sidebar{position:fixed;inset:0 auto 0 0;width:300px;transform:translateX(-110%);transition:transform .22s ease;z-index:60;}
      .sidebar.open{transform:translateX(0);}
      .backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50;}
      .backdrop.open{display:block;}
    }
    .sidebar{border-right:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));backdrop-filter:blur(18px);padding:18px 16px;position:sticky;top:0;height:100vh;overflow:auto;}
    .brand{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 10px 16px;border-bottom:1px solid var(--line);margin-bottom:14px;}
    .brand h1{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;font-size:14px;text-transform:uppercase;}
    .tag-badge{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12);padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.04);}
    .nav{display:flex;flex-direction:column;gap:8px;padding:8px;}
    .nav a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.10);transition:all .18s ease;}
    .nav a:hover{background:rgba(255,255,255,.06);}
    .nav a.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.12);}
    .left{display:flex;align-items:center;gap:10px;min-width:0;}
    .ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;}
    .label{min-width:0;display:flex;flex-direction:column;gap:2px;}
    .label .t{font-weight:900;letter-spacing:.02em;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .label .s{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);}
    .pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);flex:0 0 auto;}

    .main{padding:18px 18px 40px;max-width:1500px;margin:0 auto;width:100%;}
    .topbar{position:sticky;top:0;z-index:20;padding:10px 0 12px;background:linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),rgba(0,0,0,0));backdrop-filter:blur(14px);}
    .topbar-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
    .burger{display:none;height:44px;width:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;}
    @media(max-width:980px){.burger{display:inline-flex;align-items:center;justify-content:center;}}
    .page-title{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:16px;}
    .sub{margin:6px 0 0;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}
    .controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
    .btn{height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-weight:900;letter-spacing:.02em;transition:all .18s ease;white-space:nowrap;}
    .btn:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
    .btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
    .btn.primary{border-color:rgba(10,132,255,.80);box-shadow:0 0 0 1px rgba(10,132,255,.20) inset,0 0 18px rgba(10,132,255,.25);background:rgba(0,0,0,.75);}
    .btn.sm{height:38px;font-size:12px;padding:0 12px;}
    .btn.danger{border-color:rgba(255,107,107,.55);background:rgba(255,107,107,.08);color:#ffd0d0;}
    .search{height:44px;width:min(320px,60vw);border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .search:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .sel{height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .sel:focus{border-color:rgba(10,132,255,.55);}

    .grid{margin-top:14px;display:grid;grid-template-columns:1.6fr .9fr;gap:14px;align-items:start;}
    @media(max-width:1100px){.grid{grid-template-columns:1fr;}}

    .card{border-radius:var(--r);border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);backdrop-filter:blur(16px);overflow:hidden;}
    .cardHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.12);}
    .cardHead .h{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.70);}
    .count{font-size:11px;letter-spacing:.10em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);}

    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    th,td{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    th{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);background:rgba(8,8,8,.95);position:sticky;top:0;z-index:2;backdrop-filter:blur(12px);}
    tr:hover td{background:rgba(255,255,255,.025);}
    tr.sel td{background:rgba(10,132,255,.08);}
    .nameCell{display:flex;align-items:center;gap:10px;min-width:0;}
    .avatar{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex:0 0 auto;}
    .nm .n{font-weight:900;letter-spacing:.02em;font-size:13px;overflow:hidden;text-overflow:ellipsis;}
    .nm .p{font-size:11px;color:rgba(255,255,255,.45);overflow:hidden;text-overflow:ellipsis;}
    .chip{font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.12);color:rgba(255,255,255,.75);display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
    .dot{width:5px;height:5px;border-radius:99px;background:currentColor;flex:0 0 auto;}
    .chip.vip{border-color:rgba(255,207,63,.45);background:rgba(255,207,63,.10);color:#ffe9a3;}
    .chip.active{border-color:rgba(143,240,177,.40);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .chip.new{border-color:rgba(10,132,255,.45);background:rgba(10,132,255,.10);color:#d7ecff;}
    .chip.risk{border-color:rgba(255,107,107,.40);background:rgba(255,107,107,.10);color:#ffd0d0;}
    .tag-item{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.65);}
    .tags-wrap{display:flex;flex-wrap:wrap;gap:6px;}
    .muted{color:rgba(255,255,255,.45);}

    /* Profile */
    .profile{padding:14px;display:flex;flex-direction:column;gap:10px;}
    .prof-top{display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.16);}
    .avatar-big{width:50px;height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex:0 0 auto;}
    .prof-name .n{font-weight:900;font-size:15px;}
    .prof-name .s{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-top:3px;}
    .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
    .kpi{padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.14);}
    .kpi .v{font-weight:900;font-size:16px;}
    .kpi .l{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-top:4px;}
    .info-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);}
    .info-row .l{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);}
    .info-row .v{font-weight:700;font-size:13px;text-align:right;}
    .sec-title{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.40);}
    .sec-rows{display:flex;flex-direction:column;gap:6px;}
    textarea.notes-ta{width:100%;min-height:100px;resize:vertical;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:12px;outline:none;font-size:13px;line-height:1.5;}
    textarea.notes-ta:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .tag-input{height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 10px;outline:none;font-size:12px;width:100%;}
    .tag-input:focus{border-color:rgba(10,132,255,.45);}
    .recent-booking{padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.12);font-size:12px;}
    .recent-booking .rb-top{display:flex;justify-content:space-between;align-items:center;gap:8px;}
    .recent-booking .rb-svc{font-weight:700;}
    .recent-booking .rb-sub{color:rgba(255,255,255,.45);font-size:11px;margin-top:2px;}

    /* State */
    .state-msg{padding:30px;text-align:center;color:rgba(255,255,255,.35);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}
    .spinner{display:inline-block;width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.18);border-top-color:#fff;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px;}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* Dialog */
    #dlgOverlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9000;opacity:0;pointer-events:none;transition:opacity .22s ease;}
    #dlgWin{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:min(380px,90vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98));box-shadow:0 24px 80px rgba(0,0,0,.7);padding:24px 22px 18px;z-index:9001;opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;}
    #dlgTitle{font-family:"Julius Sans One",sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:rgba(255,255,255,.50);margin-bottom:10px;}
    #dlgMsg{font-size:14px;font-weight:600;line-height:1.55;color:#e9e9e9;margin-bottom:20px;}
    #dlgBtns{display:flex;gap:10px;justify-content:flex-end;}
  
    /* ── Unified sidebar ── */
    .app{min-height:100vh;display:grid;grid-template-columns:1fr;}
    .sidebar{border-right:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));backdrop-filter:blur(18px);padding:18px 16px;position:sticky;top:0;height:100vh;overflow:auto;z-index:40;transition:transform .25s ease;}
    .brand{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 10px 16px;border-bottom:1px solid rgba(255,255,255,.10);margin-bottom:14px;}
    .brand h1{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;font-size:14px;text-transform:uppercase;}
    .brand .brand-tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12);padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.04);}
    .nav{display:flex;flex-direction:column;gap:8px;padding:8px;}
    .nav a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.10);transition:all .18s ease;color:#fff!important;-webkit-text-fill-color:#fff!important;text-decoration:none!important;}
    .nav a *{color:#fff!important;-webkit-text-fill-color:#fff!important;}
    .nav a .nav-sub{color:rgba(255,255,255,.45)!important;-webkit-text-fill-color:rgba(255,255,255,.45)!important;}
    .nav a:hover{background:rgba(255,255,255,.06);}
    .nav a.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.12);}
    .nav-left{display:flex;align-items:center;gap:10px;min-width:0;}
    .nav-ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;}
    .nav-label{min-width:0;display:flex;flex-direction:column;gap:2px;}
    .nav-label .nav-t{font-weight:900;letter-spacing:.02em;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .nav-label .nav-sub{font-size:11px;letter-spacing:.10em;text-transform:uppercase;}
    .nav-pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);flex:0 0 auto;white-space:nowrap;}
    .nav-pill.live{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.08);color:#c9ffe1;}
    .nav-pill.blue{border-color:rgba(10,132,255,.45);background:rgba(10,132,255,.10);color:#d7ecff;}
    .burger{position:fixed;top:14px;left:14px;z-index:100;width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.75);backdrop-filter:blur(12px);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;transition:all .18s ease;padding:0;}
    .burger:hover{background:rgba(255,255,255,.10);}
    .burger span{display:block;width:18px;height:2px;border-radius:2px;background:#fff;transition:all .25s ease;}
    .burger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}
    .burger.open span:nth-child(2){opacity:0;transform:scaleX(0);}
    .burger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
    .sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.60);z-index:39;backdrop-filter:blur(2px);}
    .sidebar-backdrop.open{display:block;}
    @media(max-width:980px){
      .app{grid-template-columns:1fr;}
      .sidebar{position:fixed;inset:0 auto 0 0;width:280px;transform:translateX(-110%);z-index:60;}
      .sidebar.open{transform:translateX(0);}
      
    }
    @media(min-width:981px){
      .burger{display:none;}
      .sidebar-backdrop{display:none!important;}
    }
    
  
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
  // Auth — soft check (no redirect, just set role from localStorage)
  (function(){
    var USERRAW = localStorage.getItem('ELEMENT_USER');
    var TOKEN   = localStorage.getItem('ELEMENT_TOKEN') || '';
    var user = null;
    try { user = JSON.parse(USERRAW); } catch(e) {}

    // Default to owner so pages always open
    if (!user) user = { uid:'guest', username:'owner', name:'Owner', role:'owner', barber_id:'' };

    var ROLE = user.role || 'owner';
    var PERMS = {
      owner:  {payroll:true,settings:true,payments:true,allBookings:true,clients:true,users:true,dashboard:true},
      admin:  {payroll:false,settings:false,payments:true,allBookings:true,clients:true,users:false,dashboard:true},
      barber: {payroll:false,settings:false,payments:false,allBookings:false,clients:false,users:false,dashboard:false}
    };
    var perm = PERMS[ROLE] || PERMS.owner;

    window.ELEMENT_AUTH = {
      user: user, token: TOKEN, role: ROLE, perm: perm,
      canSee: function(k){ return !!perm[k]; },
      getHeaders: function(){
        return {
          'Authorization': 'Bearer ' + TOKEN,
          'X-API-KEY': 'R1403ss81fxrx*rx1403',
          'Accept': 'application/json'
        };
      },
      logout: function(){
        localStorage.removeItem('ELEMENT_TOKEN');
        localStorage.removeItem('ELEMENT_USER');
        window.location.href = '/signin';
      }
    };
  })();
</script>
<div class="app">
    

  <main class="main">
    <div class="topbar">
      <div class="topbar-row">
        <div>
          <h2 class="page-title">Clients</h2>
          <p class="sub" id="subLine">Loading…</p>
        </div>
        <div class="controls">
          <input class="search" id="q" placeholder="Search name / phone / notes / tags…"/>
          <select class="sel" id="fBarber"><option value="">All barbers</option></select>
          <select class="sel" id="fStatus">
            <option value="">All statuses</option>
            <option value="vip">VIP</option>
            <option value="active">Active</option>
            <option value="new">New</option>
            <option value="risk">At risk</option>
          </select>
          <button class="btn" id="btnRefresh">↻</button>
          <button class="btn primary" id="btnAdd">+ Add client</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <div class="cardHead">
          <div class="h">Client list</div>
          <div class="count" id="countBadge">—</div>
        </div>
        <div style="overflow-y:auto;overflow-x:hidden;max-height:calc(100vh - 230px);">
          <table>
            <thead>
              <tr>
                <th style="width:38%">Client</th>
                <th style="width:14%">Status</th>
                <th style="width:16%">Last visit</th>
                <th style="width:16%">Barber</th>
                <th style="width:16%">Tags</th>
              </tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>
          <div id="tableState"></div>
        </div>
      </section>

      <aside class="card">
        <div class="cardHead">
          <div class="h">Profile</div>
          <div class="count" id="profileHint">Select a client</div>
        </div>
        <div id="profile">
          <div class="muted" style="padding:16px;font-size:13px;">Click any client to view profile.</div>
        </div>
      </aside>
    </div>
  </main>
</div>

<div id="dlgOverlay"></div>
<div id="dlgWin"><div id="dlgTitle"></div><div id="dlgMsg"></div><div id="dlgBtns"></div></div>

<script>
// ── Config ─────────────────────────────────────────────────────
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

// ── Helpers ─────────────────────────────────────────────────────
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function initials(name) { const p = String(name||'').split(' '); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase() || '?'; }
function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso.includes('T') ? iso : iso+'T00:00:00').toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}); } catch { return iso; }
}
function statusChip(s) {
  const m = { vip:'vip', active:'active', new:'new', risk:'risk' };
  const labels = { vip:'VIP', active:'Active', new:'New', risk:'At risk' };
  return \`<span class="chip \${m[s]||''}"><span class="dot"></span>\${esc(labels[s]||s||'—')}</span>\`;
}

// ── Sidebar ─────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
document.getElementById('burger')?.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });

// ── Dialog ──────────────────────────────────────────────────────
const dlgOverlay = document.getElementById('dlgOverlay');
const dlgWin     = document.getElementById('dlgWin');
let _dlgResolve  = null;
function dlgOpen(opts) {
  document.getElementById('dlgTitle').textContent = opts.title || '';
  document.getElementById('dlgMsg').innerHTML = opts.msg || '';
  const btns = document.getElementById('dlgBtns'); btns.innerHTML = '';
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
function dlgAlert(msg, title, type) {
  return new Promise(r => { _dlgResolve = r; dlgOpen({ title: title||(type==='error'?'Error':'Notice'), msg, buttons:[{label:'OK',style:type==='error'?'danger':'primary',value:true}] }); });
}
function dlgConfirm(msg, title, dangerLabel) {
  return new Promise(r => { _dlgResolve = r; dlgOpen({ title: title||'Confirm', msg, buttons:[{label:'Cancel',style:'default',value:false},{label:dangerLabel||'OK',style:'danger',value:true}] }); });
}

// ── State ────────────────────────────────────────────────────────
let allClients = [], barbers = [];
let selectedId = null;
let filterQ = '', filterBarber = '', filterStatus = '';

// ── Load ─────────────────────────────────────────────────────────
async function loadAll() {
  showTableState('<span class="spinner"></span>Loading clients…');
  try {
    const [clientData, barberData] = await Promise.all([
      api('/api/clients'),
      api('/api/barbers').catch(() => [])
    ]);
    allClients = Array.isArray(clientData) ? clientData : [];
    barbers = Array.isArray(barberData) ? barberData : (Array.isArray(barberData?.barbers) ? barberData.barbers : []);

    // Populate barber filter
    const sel = document.getElementById('fBarber');
    const cur = sel.value;
    sel.innerHTML = '<option value="">All barbers</option>';
    barbers.filter(b => b.name).forEach(b => {
      const o = document.createElement('option'); o.value = b.name; o.textContent = b.name; sel.appendChild(o);
    });
    if (cur) sel.value = cur;

    document.getElementById('subLine').textContent = allClients.length + ' clients in database';
    renderAll();
  } catch(e) {
    showTableState(\`<span style="color:#ff6b6b;">Error: \${esc(e.message)}</span>\`);
  }
}

function showTableState(html) {
  document.getElementById('tbody').innerHTML = '';
  const s = document.getElementById('tableState');
  s.style.display = 'block';
  s.innerHTML = \`<div class="state-msg">\${html}</div>\`;
}
function hideTableState() {
  document.getElementById('tableState').style.display = 'none';
}

// ── Filter ────────────────────────────────────────────────────────
function filtered() {
  const q = filterQ.toLowerCase();
  return allClients.filter(c => {
    if (filterBarber && (c.preferred_barber || c.barber) !== filterBarber) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (q) {
      const hay = [c.name, c.phone, c.email, c.notes, (c.tags||[]).join(' ')].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ── Render list ───────────────────────────────────────────────────
function renderAll() {
  hideTableState();
  const list = filtered();
  document.getElementById('countBadge').textContent = list.length + ' clients';

  if (!list.length) {
    document.getElementById('tbody').innerHTML = \`<tr><td colspan="5"><div class="state-msg">No clients found.</div></td></tr>\`;
    return;
  }

  document.getElementById('tbody').innerHTML = list.map(c => {
    const name = String(c.name || '');
    const phone = String(c.phone || '—');
    const lastVisit = c.last_visit || c.lastVisit || '';
    const barber = c.preferred_barber || c.barber || '—';
    const tags = (c.tags || []).slice(0,2).map(t => \`<span class="tag-item">\${esc(t)}</span>\`).join('');
    const moreTags = (c.tags||[]).length > 2 ? \`<span class="tag-item">+\${(c.tags||[]).length-2}</span>\` : '';
    return \`<tr class="\${c.id === selectedId ? 'sel' : ''}" data-id="\${esc(c.id)}">
      <td style="max-width:0;overflow:hidden;">
        <div class="nameCell">
          <div class="avatar" style="font-size:11px;">\${esc(initials(name))}</div>
          <div class="nm" style="min-width:0;">
            <div class="n">\${esc(name)}</div>
            <div class="p">\${esc(phone)}</div>
          </div>
        </div>
      </td>
      <td>\${statusChip(c.status)}</td>
      <td class="muted" style="font-size:12px;">\${esc(fmtDate(lastVisit))}</td>
      <td style="font-size:12px;">\${esc(barber)}</td>
      <td><div style="display:flex;gap:4px;flex-wrap:wrap;">\${tags}\${moreTags}</div></td>
    </tr>\`;
  }).join('');

  document.querySelectorAll('#tbody tr').forEach(tr => {
    tr.addEventListener('click', () => {
      selectedId = tr.dataset.id;
      renderAll();
      openProfile(selectedId);
    });
  });
}

// ── Profile ───────────────────────────────────────────────────────
async function openProfile(id) {
  const profileEl = document.getElementById('profile');
  const hintEl    = document.getElementById('profileHint');
  const c = allClients.find(x => x.id === id);
  if (!c) return;

  hintEl.textContent = String(c.name || id);
  profileEl.innerHTML = \`<div class="state-msg"><span class="spinner"></span>Loading…</div>\`;

  // Load detailed profile with bookings
  let detailed = c;
  try {
    detailed = await api('/api/clients/' + encodeURIComponent(id));
    // Update local cache
    const idx = allClients.findIndex(x => x.id === id);
    if (idx >= 0) allClients[idx] = { ...allClients[idx], ...detailed };
  } catch(e) { /* use cached */ }

  const name     = String(detailed.name || '');
  const phone    = String(detailed.phone || '');
  const email    = String(detailed.email || '');
  const notes    = String(detailed.notes || '');
  const status   = String(detailed.status || 'active');
  const barber   = String(detailed.preferred_barber || detailed.barber || '—');
  const tags     = Array.isArray(detailed.tags) ? detailed.tags : [];
  const bookings = Array.isArray(detailed.bookings) ? detailed.bookings : [];

  // Compute stats from bookings
  const visits   = detailed.visits || bookings.length;
  const spend    = detailed.spend  || bookings.reduce((s,b) => s + (Number(b.service_price||b.price||0)), 0);
  const noShows  = detailed.no_shows || bookings.filter(b => b.status === 'noshow').length;
  const lastVisit = detailed.last_visit || detailed.lastVisit || (bookings[0]?.start_at || '');

  profileEl.innerHTML = \`
    <div class="profile">
      <div class="prof-top">
        <div class="avatar-big">\${esc(initials(name))}</div>
        <div class="prof-name" style="flex:1;min-width:0;">
          <div class="n">\${esc(name)}</div>
          <div class="s">\${statusChip(status)} <span style="margin-left:4px;">\${esc(barber)}</span></div>
        </div>
        <a href="/calendar" class="btn sm primary">Book</a>
      </div>

      <div class="kpis">
        <div class="kpi"><div class="v">\${visits}</div><div class="l">Visits</div></div>
        <div class="kpi"><div class="v">$\${Number(spend).toFixed(0)}</div><div class="l">Spend</div></div>
        <div class="kpi"><div class="v">\${noShows}</div><div class="l">No-shows</div></div>
      </div>

      <div class="sec-rows">
        \${phone ? \`<div class="info-row"><div class="l">Phone</div><div class="v"><a href="tel:\${esc(phone)}">\${esc(phone)}</a></div></div>\` : ''}
        \${email ? \`<div class="info-row"><div class="l">Email</div><div class="v"><a href="mailto:\${esc(email)}">\${esc(email)}</a></div></div>\` : ''}
        \${lastVisit ? \`<div class="info-row"><div class="l">Last visit</div><div class="v">\${esc(fmtDate(lastVisit))}</div></div>\` : ''}
      </div>

      <div>
        <div class="sec-title" style="margin-bottom:8px;">Status</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          \${['vip','active','new','risk'].map(s => \`<button class="btn sm\${status===s?' primary':''}" data-setstatus="\${s}">\${s==='vip'?'VIP':s==='risk'?'At risk':s.charAt(0).toUpperCase()+s.slice(1)}</button>\`).join('')}
        </div>
      </div>

      <div>
        <div class="sec-title" style="margin-bottom:8px;">Tags</div>
        <div class="tags-wrap" id="tagsWrap">
          \${tags.map(t => \`<span class="tag-item" style="cursor:pointer;" data-deltag="\${esc(t)}">\${esc(t)} ✕</span>\`).join('')}
        </div>
        <input class="tag-input" id="tagInput" placeholder="Type tag + Enter to add…" style="margin-top:8px;"/>
      </div>

      <div>
        <div class="sec-title" style="margin-bottom:8px;">Notes</div>
        <textarea class="notes-ta" id="notesArea">\${esc(notes)}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
          <button class="btn sm primary" id="btnSaveNotes">Save notes</button>
          <button class="btn sm" id="btnCall" \${!phone?'disabled':''}>📞 Call</button>
          <button class="btn sm" id="btnSms" \${!phone?'disabled':''}>✉ SMS</button>
        </div>
      </div>

      \${bookings.length ? \`
      <div>
        <div class="sec-title" style="margin-bottom:8px;">Recent visits (\${bookings.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          \${bookings.slice(0,5).map(b => \`
            <div class="recent-booking">
              <div class="rb-top">
                <span class="rb-svc">\${esc(b.service_name||b.service||'Service')}</span>
                <span class="chip \${b.paid||b.is_paid?'active':''}">\${b.paid||b.is_paid?'Paid':'Unpaid'}</span>
              </div>
              <div class="rb-sub">\${esc(b.barber_name||b.barber||'—')} · \${esc(fmtDate(b.start_at||b.date||''))}</div>
            </div>\`).join('')}
        </div>
      </div>\` : ''}
    </div>
  \`;

  // Status buttons
  profileEl.querySelectorAll('[data-setstatus]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.setstatus;
      try {
        await api('/api/clients/' + encodeURIComponent(id), { method: 'PATCH', body: { status: newStatus } });
        const idx = allClients.findIndex(x => x.id === id);
        if (idx >= 0) allClients[idx].status = newStatus;
        renderAll();
        openProfile(id);
      } catch(e) { dlgAlert(e.message, 'Error', 'error'); }
    });
  });

  // Delete tag
  profileEl.querySelectorAll('[data-deltag]').forEach(span => {
    span.addEventListener('click', async () => {
      const newTags = tags.filter(t => t !== span.dataset.deltag);
      try {
        await api('/api/clients/' + encodeURIComponent(id), { method: 'PATCH', body: { tags: newTags } });
        const idx = allClients.findIndex(x => x.id === id);
        if (idx >= 0) allClients[idx].tags = newTags;
        openProfile(id);
      } catch(e) { dlgAlert(e.message, 'Error', 'error'); }
    });
  });

  // Add tag
  document.getElementById('tagInput')?.addEventListener('keydown', async e => {
    if (e.key !== 'Enter') return;
    const val = (e.target.value || '').trim().toLowerCase();
    if (!val) return;
    const newTags = [...new Set([val, ...tags])];
    try {
      await api('/api/clients/' + encodeURIComponent(id), { method: 'PATCH', body: { tags: newTags } });
      const idx = allClients.findIndex(x => x.id === id);
      if (idx >= 0) allClients[idx].tags = newTags;
      e.target.value = '';
      openProfile(id);
    } catch(e2) { dlgAlert(e2.message, 'Error', 'error'); }
  });

  // Save notes
  document.getElementById('btnSaveNotes')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveNotes');
    const newNotes = document.getElementById('notesArea')?.value || '';
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await api('/api/clients/' + encodeURIComponent(id), { method: 'PATCH', body: { notes: newNotes } });
      const idx = allClients.findIndex(x => x.id === id);
      if (idx >= 0) allClients[idx].notes = newNotes;
      btn.textContent = 'Saved ✓';
      setTimeout(() => { btn.textContent = 'Save notes'; btn.disabled = false; }, 1500);
    } catch(e) {
      dlgAlert(e.message, 'Error', 'error');
      btn.disabled = false; btn.textContent = 'Save notes';
    }
  });

  // Call / SMS
  document.getElementById('btnCall')?.addEventListener('click', () => { if (phone) window.location.href = 'tel:' + phone; });
  document.getElementById('btnSms')?.addEventListener('click', () => { if (phone) window.location.href = 'sms:' + phone; });
}

// ── Add client ────────────────────────────────────────────────────
document.getElementById('btnAdd')?.addEventListener('click', async () => {
  const name = prompt('Client name:')?.trim();
  if (!name) return;
  const phone = prompt('Phone (optional):')?.trim() || '';
  try {
    const created = await api('/api/clients', { method: 'POST', body: { name, phone, status: 'new', tags: ['first-time'] } });
    allClients.unshift(created);
    selectedId = created.id;
    renderAll();
    openProfile(created.id);
  } catch(e) { dlgAlert(e.message, 'Error', 'error'); }
});

// ── Filters ───────────────────────────────────────────────────────
document.getElementById('q')?.addEventListener('input', e => { filterQ = e.target.value; renderAll(); });
document.getElementById('fBarber')?.addEventListener('change', e => { filterBarber = e.target.value; renderAll(); });
document.getElementById('fStatus')?.addEventListener('change', e => { filterStatus = e.target.value; renderAll(); });
document.getElementById('btnRefresh')?.addEventListener('click', loadAll);

// ── Init ──────────────────────────────────────────────────────────
loadAll();

  // ── Unified sidebar ────────────────────────────────────────
  (function(){
    const sidebar  = document.getElementById('sidebar');
    const burger   = document.getElementById('burger');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar || !burger) return;
    function openSB(v) {
      sidebar.classList.toggle('open', v);
      burger.classList.toggle('open', v);
      if (backdrop) backdrop.classList.toggle('open', v);
    }
    burger.addEventListener('click', () => openSB(!sidebar.classList.contains('open')));
    if (backdrop) backdrop.addEventListener('click', () => openSB(false));
    sidebar.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => openSB(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 980) openSB(false); });
  })();
</script>



</body>
`
