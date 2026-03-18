export const pageContent = `
<style>
    :root{
      --bg:#000;--fg:#e9e9e9;--muted:#9ea0a3;
      --glass:rgba(255,255,255,.06);--line:rgba(255,255,255,.10);
      --blue:#0a84ff;--ok:#8ff0b1;--danger:#ff6b6b;--warn:#ffd18a;
      --radius:18px;
    }
    *{box-sizing:border-box}
    html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;}
    a,a:link,a:visited,a:hover,a:active{color:#fff!important;text-decoration:none!important;-webkit-text-fill-color:#fff!important;}
    .sidebar .nav a,.sidebar .nav a *{color:#fff!important;-webkit-text-fill-color:#fff!important;}
    .sidebar .nav a .label .s{color:rgba(255,255,255,.45)!important;-webkit-text-fill-color:rgba(255,255,255,.45)!important;}
    button,input,select,textarea{font-family:inherit}
    input,select,button,textarea{-webkit-tap-highlight-color:transparent;}

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
    .brand .tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12);padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.04);}
    .nav{display:flex;flex-direction:column;gap:8px;padding:8px;}
    .nav a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.10);transition:all .18s ease;}
    .nav a:hover{background:rgba(255,255,255,.06);}
    .nav a.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.12);}
    .left{display:flex;align-items:center;gap:10px;min-width:0;}
    .ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;color:#fff!important;}
    .label{min-width:0;display:flex;flex-direction:column;gap:2px;}
    .label .t{font-weight:900;letter-spacing:.02em;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .label .s{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);}
    .pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);flex:0 0 auto;}
    .pill.saved{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.08);color:#c9ffe1;}
    .pill.dirty{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff;font-weight:900;}

    .main{padding:18px 18px 40px;max-width:1400px;margin:0 auto;width:100%;}
    .topbar{position:sticky;top:0;z-index:20;padding:10px 0 12px;background:linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),rgba(0,0,0,0));backdrop-filter:blur(14px);}
    .rowTop{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
    .burger{display:none;height:44px;width:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;}
    @media(max-width:980px){.burger{display:inline-flex;align-items:center;justify-content:center;}}
    .page-title{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:16px;}
    .sub-line{margin:6px 0 0;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}
    .top-actions{display:flex;gap:8px;flex-wrap:wrap;}
    .btn{height:44px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-weight:900;letter-spacing:.02em;transition:all .18s ease;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;}
    .btn:hover{background:rgba(255,255,255,.09);transform:translateY(-1px);}
    .btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
    .btn.primary{border-color:rgba(10,132,255,.80);box-shadow:0 0 0 1px rgba(10,132,255,.20) inset,0 0 18px rgba(10,132,255,.25);background:rgba(0,0,0,.75);}
    .btn.danger{border-color:rgba(255,107,107,.55);background:rgba(255,107,107,.08);color:#ffd0d0;}
    .btn.sm{height:36px;font-size:12px;padding:0 12px;}

    /* Layout */
    .settings-grid{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    @media(max-width:1100px){.settings-grid{grid-template-columns:1fr;}}

    .card{border-radius:var(--radius);border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);backdrop-filter:blur(16px);overflow:hidden;}
    .card.full{grid-column:1/-1;}
    .cardHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.12);}
    .cardHead .h{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.70);}
    .card-body{padding:16px;display:flex;flex-direction:column;gap:12px;}

    /* Fields */
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    @media(max-width:640px){.field-row{grid-template-columns:1fr;}}
    .field{display:flex;flex-direction:column;gap:6px;}
    .field.full{grid-column:1/-1;}
    .field label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.50);}
    .inp,.sel{height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 12px;outline:none;font-size:13px;width:100%;}
    .inp:focus,.sel:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .inp-sm{height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.22);color:#fff;padding:0 10px;outline:none;font-size:12px;}
    .inp-sm:focus{border-color:rgba(10,132,255,.45);}

    /* Toggle */
    .toggle-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);}
    .toggle-label{display:flex;flex-direction:column;gap:2px;}
    .toggle-label .tl{font-size:13px;font-weight:600;}
    .toggle-label .ts{font-size:11px;color:rgba(255,255,255,.45);}
    .toggle{position:relative;width:44px;height:26px;flex:0 0 auto;}
    .toggle input{opacity:0;width:0;height:0;position:absolute;}
    .toggle-track{position:absolute;inset:0;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);transition:background .2s,border-color .2s;cursor:pointer;}
    .toggle input:checked ~ .toggle-track{background:rgba(10,132,255,.65);border-color:rgba(10,132,255,.8);}
    .toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:999px;background:#fff;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.4);pointer-events:none;}
    .toggle input:checked ~ .toggle-track ~ .toggle-thumb{transform:translateX(18px);}

    /* Fee rows */
    .fee-item{display:grid;grid-template-columns:1fr 90px 90px 90px auto;gap:8px;align-items:center;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);}
    @media(max-width:640px){.fee-item{grid-template-columns:1fr 1fr auto;}}
    .fee-item .fee-label{font-size:13px;font-weight:600;}
    .del-btn{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,107,107,.35);background:rgba(255,107,107,.08);color:#ff6b6b;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;}
    .del-btn:hover{background:rgba(255,107,107,.16);}

    /* State */
    .state-msg{padding:30px;text-align:center;color:rgba(255,255,255,.40);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}
    .spinner{display:inline-block;width:16px;height:16px;border-radius:999px;border:2px solid rgba(255,255,255,.18);border-top-color:#fff;animation:spin .8s linear infinite;vertical-align:middle;margin-right:6px;}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* Toast */
    .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(8,8,8,.92);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:10px 18px;box-shadow:0 20px 60px rgba(0,0,0,.55);display:none;align-items:center;gap:10px;backdrop-filter:blur(18px);font-size:13px;z-index:5000;white-space:nowrap;}
    .toast.show{display:inline-flex;}
    .tdot{width:8px;height:8px;border-radius:999px;background:var(--ok);}
    .tdot.warn{background:var(--warn);}
    .tdot.bad{background:var(--danger);}

    /* Section divider */
    .sec-divider{height:1px;background:rgba(255,255,255,.06);margin:4px 0;}

    /* Info hint */
    .info{font-size:11px;color:rgba(255,255,255,.40);line-height:1.5;margin-top:4px;}
  
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
      <div class="rowTop">
        <div>
          <h2 class="page-title">Settings</h2>
          <p class="sub-line" id="subLine">Loading…</p>
        </div>
        <div class="top-actions">
          <div class="pill" id="statusPill">Not saved</div>
          <button class="btn primary" id="btnSave">Save all</button>
          <button class="btn sm" id="btnReload">↻ Reload</button>
        </div>
      </div>
    </div>

    <div id="loadingState" class="state-msg"><span class="spinner"></span>Loading settings…</div>

    <div class="settings-grid" id="settingsGrid" style="display:none;">

      <!-- SHOP INFO -->
      <div class="card">
        <div class="cardHead"><div class="h">Shop info</div></div>
        <div class="card-body">
          <div class="field-row">
            <div class="field">
              <label>Shop name</label>
              <input class="inp" id="shopName" placeholder="ELEMENT Barbershop"/>
            </div>
            <div class="field">
              <label>Timezone</label>
              <select class="sel" id="timezone">
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="America/Denver">America/Denver (MST/MDT)</option>
                <option value="America/Phoenix">America/Phoenix (MST)</option>
              </select>
            </div>
            <div class="field">
              <label>Currency</label>
              <select class="sel" id="currency">
                <option value="USD">USD — US Dollar</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div class="field">
              <label>Shop status override</label>
              <select class="sel" id="shopStatusMode">
                <option value="auto">Auto (schedule)</option>
                <option value="open">Force Open</option>
                <option value="closed">Force Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- TAX -->
      <div class="card">
        <div class="cardHead"><div class="h">Tax</div><div class="pill" id="taxPill">Off</div></div>
        <div class="card-body">
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Enable tax on services</div>
              <div class="ts">Added to invoice total</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="taxEnabled"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div id="taxFields" style="display:none;">
            <div class="field-row" style="margin-top:8px;">
              <div class="field">
                <label>Tax label</label>
                <input class="inp" id="taxLabel" placeholder="Sales Tax"/>
              </div>
              <div class="field">
                <label>Tax rate %</label>
                <input class="inp" id="taxRate" type="number" min="0" max="50" step="0.01" placeholder="8.75"/>
              </div>
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <div class="toggle-label">
                <div class="tl">Price includes tax</div>
                <div class="ts">Tax already built into service price</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="taxIncluded"/>
                <span class="toggle-track"></span>
                <span class="toggle-thumb"></span>
              </label>
            </div>
            <div class="info" style="margin-top:6px;">Example: $59.99 service with 8.75% tax → client pays $65.24 (tax added on top)</div>
          </div>
        </div>
      </div>

      <!-- FEES -->
      <div class="card full">
        <div class="cardHead">
          <div class="h">Fees & surcharges</div>
          <button class="btn sm" id="btnAddFee">+ Add fee</button>
        </div>
        <div class="card-body">
          <div class="info">Processing fees, booking fees, credit card surcharges. Each fee can be a fixed $ amount or a % of the total.</div>
          <div id="feesList"></div>
          <div id="feesEmpty" class="state-msg" style="padding:16px;">No fees configured — services charged at face value.</div>
        </div>
      </div>

      <!-- CUSTOM CHARGES / CATEGORIES -->
      <div class="card full">
        <div class="cardHead">
          <div class="h">Custom charges & categories</div>
          <button class="btn sm" id="btnAddCharge">+ Add charge</button>
        </div>
        <div class="card-body">
          <div class="info">Create your own named charges — promotions, membership discounts, product sales, etc. Each item has a name, type (%, fixed $, or label-only), and optional color tag.</div>
          <div id="chargesList"></div>
          <div id="chargesEmpty" class="state-msg" style="padding:16px;">No custom charges yet.</div>
        </div>
      </div>

      <!-- PAYROLL DEFAULTS -->
      <div class="card">
        <div class="cardHead"><div class="h">Payroll defaults</div></div>
        <div class="card-body">
          <div class="info">Default rates for new barbers. Individual overrides in Payroll page.</div>
          <div class="field-row">
            <div class="field">
              <label>Default barber commission %</label>
              <input class="inp" id="defaultBarberPct" type="number" min="0" max="100" step="1" placeholder="60"/>
            </div>
            <div class="field">
              <label>Owner share % (auto)</label>
              <input class="inp" id="ownerPct" type="number" min="0" max="100" step="1" placeholder="40" readonly style="opacity:.55;cursor:not-allowed;"/>
            </div>
            <div class="field">
              <label>Tips go to</label>
              <select class="sel" id="tipsPct">
                <option value="100">100% to barber</option>
                <option value="50">50/50 split</option>
                <option value="0">100% to owner</option>
              </select>
            </div>
            <div class="field">
              <label>Pay period</label>
              <select class="sel" id="payPeriod">
                <option value="daily">Daily closeout</option>
                <option value="weekly">Weekly (Mon–Sun)</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- BOOKING SETTINGS -->
      <div class="card">
        <div class="cardHead"><div class="h">Booking & SMS</div></div>
        <div class="card-body">
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">SMS confirmation</div>
              <div class="ts">Send SMS when booking is created</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="smsConfirm" checked/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">24h reminder SMS</div>
              <div class="ts">Sent day before appointment</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="sms24h"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">2h reminder SMS</div>
              <div class="ts">Sent 2 hours before</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="sms2h"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Reschedule SMS</div>
              <div class="ts">Notify client when time changes</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="smsReschedule"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Cancel SMS</div>
              <div class="ts">Notify client on cancellation</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="smsCancel"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="field-row" style="margin-top:4px;">
            <div class="field">
              <label>Cancellation window (hours)</label>
              <input class="inp" id="cancelHours" type="number" min="0" max="72" step="1" placeholder="2"/>
              <div class="info">Clients can cancel up to X hours before appointment</div>
            </div>
          </div>
        </div>
      </div>

      <!-- DISPLAY -->
      <div class="card">
        <div class="cardHead"><div class="h">Booking page display</div></div>
        <div class="card-body">
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Show service prices</div>
              <div class="ts">Displayed on public booking page</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="showPrices"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Require phone number</div>
              <div class="ts">Mandatory for SMS confirmations</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="requirePhone"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Allow booking notes</div>
              <div class="ts">Client can add note / reference photo</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="allowNotes"/>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- SQUARE / INTEGRATIONS -->
      <div class="card">
        <div class="cardHead"><div class="h">Square & integrations</div></div>
        <div class="card-body">
          <div class="field-row">
            <div class="field full">
              <label>Square Proxy URL</label>
              <input class="inp" id="squareProxy" placeholder="https://square-proxy-…run.app"/>
            </div>
            <div class="field">
              <label>Square Location ID</label>
              <input class="inp" id="squareLocation" placeholder="L08HP7JSW9WNR"/>
            </div>
            <div class="field">
              <label>Square Terminal Device ID</label>
              <input class="inp" id="squareDevice" placeholder="device:438CS149B…"/>
            </div>
          </div>
          <button class="btn sm" id="btnTestSquare" style="margin-top:4px;">Test connection</button>
          <div id="squareTestResult" class="info" style="margin-top:6px;"></div>
        </div>
      </div>

      <!-- DANGER ZONE -->
      <div class="card">
        <div class="cardHead"><div class="h" style="color:rgba(255,107,107,.8);">Danger zone</div></div>
        <div class="card-body">
          <div class="toggle-row">
            <div class="toggle-label">
              <div class="tl">Clear abandoned Terminal requests</div>
              <div class="ts">Remove pending/test payment requests older than 4h</div>
            </div>
            <button class="btn sm danger" id="btnCleanup">Clean up</button>
          </div>
        </div>
      </div>

    </div><!-- /settings-grid -->
  </main>
</div>

<div class="toast" id="toast"><span class="tdot" id="tdot"></span><span id="toastText">Saved</span></div>

<script>
// ── Config ────────────────────────────────────────────────────
const API_BASE = (window.ELEMENT_CRM_API || localStorage.getItem('ELEMENT_CRM_API') || 'https://element-crm-api-431945333485.us-central1.run.app').replace(/\\/+$/, '');
const API_KEY  = localStorage.getItem('ELEMENT_CRM_API_KEY') || 'R1403ss81fxrx*rx1403';

async function api(path, opts = {}) {
  const { method = 'GET', body } = opts;
  const headers = { Accept: 'application/json' };
  if (body != null) headers['Content-Type'] = 'application/json';
  if (API_KEY) headers['X-API-KEY'] = API_KEY;
  const res = await fetch(API_BASE + path, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(json?.error || text || 'HTTP ' + res.status);
  return json;
}

// ── Sidebar ───────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
document.getElementById('burger')?.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer = null;
function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  const dot = document.getElementById('tdot');
  const txt = document.getElementById('toastText');
  txt.textContent = msg;
  dot.className = 'tdot' + (type === 'warn' ? ' warn' : type === 'bad' ? ' bad' : '');
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── State ─────────────────────────────────────────────────────
let S = {}; // current settings from server
let fees = []; // local fee array
let dirty = false;

function markDirty() {
  dirty = true;
  const p = document.getElementById('statusPill');
  p.textContent = 'Unsaved changes'; p.className = 'pill dirty';
}
function markClean() {
  dirty = false;
  const p = document.getElementById('statusPill');
  p.textContent = 'Saved'; p.className = 'pill saved';
}

// ── Load ──────────────────────────────────────────────────────
async function loadSettings() {
  document.getElementById('loadingState').style.display = 'block';
  document.getElementById('settingsGrid').style.display = 'none';
  try {
    S = await api('/api/settings');
    fees = Array.isArray(S.fees) ? [...S.fees] : [];
    populateForm(S);
    renderFees();
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('settingsGrid').style.display = 'grid';
    document.getElementById('subLine').textContent = 'Connected to server • Last saved: ' + (S.updated_at ? new Date(S.updated_at).toLocaleString() : 'never');
    markClean();
  } catch(e) {
    document.getElementById('loadingState').innerHTML = '<span style="color:#ff6b6b;">Error: ' + e.message + '</span>';
  }
}

function populateForm(s) {
  const g = (id) => document.getElementById(id);
  g('shopName').value   = s.shop_name || 'ELEMENT Barbershop';
  g('timezone').value   = s.timezone || 'America/Chicago';
  g('currency').value   = s.currency || 'USD';
  g('shopStatusMode').value = s.shop_status_mode || s.shopStatusMode || 'auto';

  // Tax
  const tax = s.tax || {};
  g('taxEnabled').checked   = !!tax.enabled;
  g('taxLabel').value        = tax.label || 'Sales Tax';
  g('taxRate').value         = tax.rate || '';
  g('taxIncluded').checked   = !!tax.included_in_price;
  g('taxFields').style.display = tax.enabled ? 'block' : 'none';
  g('taxPill').textContent   = tax.enabled ? (tax.rate ? tax.rate + '%' : 'On') : 'Off';

  // Payroll
  const pr = s.payroll || {};
  const bPct = Number(pr.default_barber_pct ?? 60);
  g('defaultBarberPct').value = bPct;
  g('ownerPct').value         = 100 - bPct;
  g('tipsPct').value          = String(pr.tips_pct ?? 100);
  g('payPeriod').value        = pr.period || 'weekly';

  // Booking
  const bk = s.booking || {};
  g('smsConfirm').checked    = bk.sms_confirm !== false;
  g('sms24h').checked        = !!bk.reminder_hours_24;
  g('sms2h').checked         = !!bk.reminder_hours_2;
  g('smsReschedule').checked = !!bk.sms_on_reschedule;
  g('smsCancel').checked     = !!bk.sms_on_cancel;
  g('cancelHours').value     = bk.cancellation_hours ?? 2;

  // Display
  const dp = s.display || {};
  g('showPrices').checked  = dp.show_prices !== false;
  g('requirePhone').checked= !!dp.require_phone;
  g('allowNotes').checked  = dp.allow_notes !== false;

  // Custom charges
  charges = Array.isArray(s.charges) ? [...s.charges] : [];
  renderCharges();

  // Square
  const sq = s.square || {};
  g('squareProxy').value   = sq.proxy_url || 'https://square-proxy-431945333485.us-central1.run.app';
  g('squareLocation').value= sq.location_id || 'L08HP7JSW9WNR';
  g('squareDevice').value  = sq.device_id || 'device:438CS149B8003825';
}

function readForm() {
  const g = (id) => document.getElementById(id);
  const bPct = Math.max(0, Math.min(100, Number(g('defaultBarberPct').value || 60)));
  return {
    shop_name: g('shopName').value.trim(),
    timezone: g('timezone').value,
    currency: g('currency').value,
    shopStatusMode: g('shopStatusMode').value,
    tax: {
      enabled: g('taxEnabled').checked,
      label: g('taxLabel').value.trim() || 'Sales Tax',
      rate: Number(g('taxRate').value || 0),
      included_in_price: g('taxIncluded').checked
    },
    payroll: {
      default_barber_pct: bPct,
      tips_pct: Number(g('tipsPct').value || 100),
      period: g('payPeriod').value
    },
    booking: {
      sms_confirm: g('smsConfirm').checked,
      reminder_hours_24: g('sms24h').checked,
      reminder_hours_2: g('sms2h').checked,
      sms_on_reschedule: g('smsReschedule').checked,
      sms_on_cancel: g('smsCancel').checked,
      cancellation_hours: Number(g('cancelHours').value || 2),
      require_phone: g('requirePhone').checked
    },
    display: {
      show_prices: g('showPrices').checked,
      require_phone: g('requirePhone').checked,
      allow_notes: g('allowNotes').checked
    },
    square: {
      proxy_url: g('squareProxy').value.trim(),
      location_id: g('squareLocation').value.trim(),
      device_id: g('squareDevice').value.trim()
    },
    charges,
    fees
  };
}

// ── Fees ──────────────────────────────────────────────────────
function renderFees() {
  const list = document.getElementById('feesList');
  const empty = document.getElementById('feesEmpty');
  if (!fees.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  list.innerHTML = fees.map((f, i) => \`
    <div class="fee-item" style="margin-bottom:8px;">
      <div>
        <input class="inp-sm" style="width:100%;" placeholder="Label (e.g. Card surcharge)" value="\${esc(f.label)}" data-fi="\${i}" data-fk="label"/>
      </div>
      <select class="inp-sm" data-fi="\${i}" data-fk="type">
        <option value="percent" \${f.type==='percent'?'selected':''}>%</option>
        <option value="fixed" \${f.type==='fixed'?'selected':''}>Fixed $</option>
      </select>
      <input class="inp-sm" type="number" min="0" step="0.01" placeholder="Value" value="\${f.value||''}" data-fi="\${i}" data-fk="value"/>
      <select class="inp-sm" data-fi="\${i}" data-fk="applies_to">
        <option value="all" \${f.applies_to==='all'?'selected':''}>All</option>
        <option value="services" \${f.applies_to==='services'?'selected':''}>Services</option>
        <option value="tips" \${f.applies_to==='tips'?'selected':''}>Tips only</option>
      </select>
      <button class="del-btn" data-del="\${i}">✕</button>
    </div>
  \`).join('');

  list.querySelectorAll('[data-fi]').forEach(el => {
    el.addEventListener('change', () => {
      const i = Number(el.dataset.fi), k = el.dataset.fk;
      fees[i][k] = k === 'value' ? Number(el.value || 0) : el.value;
      markDirty();
    });
    el.addEventListener('input', () => {
      const i = Number(el.dataset.fi), k = el.dataset.fk;
      fees[i][k] = k === 'value' ? Number(el.value || 0) : el.value;
      markDirty();
    });
  });
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      fees.splice(Number(btn.dataset.del), 1);
      renderFees(); markDirty();
    });
  });
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

// ── Custom charges ────────────────────────────────────────────
let charges = [];

function renderCharges() {
  const list = document.getElementById('chargesList');
  const empty = document.getElementById('chargesEmpty');
  if (!list) return;
  if (!charges.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  const colors = ['#0a84ff','#8ff0b1','#ff6b6b','#ffd18a','#a78bfa','#f472b6','#38bdf8'];
  list.innerHTML = charges.map((c, i) => \`
    <div style="display:grid;grid-template-columns:1fr 110px 110px 110px 36px;gap:8px;align-items:center;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);margin-bottom:8px;">
      <input class="inp-sm" style="width:100%;" placeholder="Name (e.g. Member discount, Product sale…)" value="\${esc(c.name||'')}" data-ci="\${i}" data-ck="name"/>
      <select class="inp-sm" data-ci="\${i}" data-ck="type">
        <option value="percent" \${c.type==='percent'?'selected':''}>%</option>
        <option value="fixed" \${c.type==='fixed'?'selected':''}>Fixed $</option>
        <option value="label" \${c.type==='label'?'selected':''}>Label only</option>
      </select>
      <input class="inp-sm" type="number" min="0" step="0.01" placeholder="Value" value="\${c.value||''}" data-ci="\${i}" data-ck="value" \${c.type==='label'?'disabled style="opacity:.4"':''}/>
      <select class="inp-sm" data-ci="\${i}" data-ck="color" style="background:\${c.color||colors[i%colors.length]}22;border-color:\${c.color||colors[i%colors.length]}55;">
        \${colors.map(col => \`<option value="\${col}" \${c.color===col?'selected':''} style="background:#111;">\${col}</option>\`).join('')}
      </select>
      <button class="del-btn" data-cdel="\${i}">✕</button>
    </div>
  \`).join('');

  list.querySelectorAll('[data-ci]').forEach(el => {
    el.addEventListener('change', () => {
      const i = Number(el.dataset.ci), k = el.dataset.ck;
      charges[i][k] = k === 'value' ? Number(el.value || 0) : el.value;
      if (k === 'type') renderCharges();
      markDirty();
    });
    el.addEventListener('input', () => {
      const i = Number(el.dataset.ci), k = el.dataset.ck;
      charges[i][k] = k === 'value' ? Number(el.value || 0) : el.value;
      markDirty();
    });
  });
  list.querySelectorAll('[data-cdel]').forEach(btn => {
    btn.addEventListener('click', () => {
      charges.splice(Number(btn.dataset.cdel), 1);
      renderCharges(); markDirty();
    });
  });
}

document.getElementById('btnAddCharge')?.addEventListener('click', () => {
  charges.push({ id: 'charge_'+Date.now(), name: '', type: 'percent', value: 0, color: '#0a84ff', enabled: true });
  renderCharges(); markDirty();
});

// ── Fees ──────────────────────────────────────────────────────
document.getElementById('btnAddFee')?.addEventListener('click', () => {
  fees.push({ id: 'fee_'+Date.now(), label: '', type: 'percent', value: 0, applies_to: 'all', enabled: true });
  renderFees(); markDirty();
});

// ── Save ──────────────────────────────────────────────────────
document.getElementById('btnSave')?.addEventListener('click', async () => {
  const btn = document.getElementById('btnSave');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const data = readForm();
    await api('/api/settings', { method: 'POST', body: data });
    S = data; markClean();
    toast('Settings saved ✓', 'ok');
    document.getElementById('subLine').textContent = 'Saved at ' + new Date().toLocaleTimeString();
  } catch(e) {
    toast('Save failed: ' + e.message, 'bad');
  } finally {
    btn.disabled = false; btn.textContent = 'Save all';
  }
});

// ── Reload ────────────────────────────────────────────────────
document.getElementById('btnReload')?.addEventListener('click', loadSettings);

// ── Tax toggle ────────────────────────────────────────────────
document.getElementById('taxEnabled')?.addEventListener('change', function() {
  document.getElementById('taxFields').style.display = this.checked ? 'block' : 'none';
  document.getElementById('taxPill').textContent = this.checked ? 'On' : 'Off';
  markDirty();
});
document.getElementById('taxRate')?.addEventListener('input', function() {
  if (document.getElementById('taxEnabled').checked)
    document.getElementById('taxPill').textContent = (this.value || '0') + '%';
  markDirty();
});

// ── Auto owner% ───────────────────────────────────────────────
document.getElementById('defaultBarberPct')?.addEventListener('input', function() {
  const v = Math.max(0, Math.min(100, Number(this.value || 60)));
  document.getElementById('ownerPct').value = 100 - v;
  markDirty();
});

// ── Dirty on any change ───────────────────────────────────────
['shopName','timezone','currency','shopStatusMode','taxLabel','taxIncluded',
 'tipsPct','payPeriod','cancelHours','showPrices','requirePhone','allowNotes',
 'squareProxy','squareLocation','squareDevice',
 'smsConfirm','sms24h','sms2h','smsReschedule','smsCancel'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', markDirty);
  el.addEventListener('input', markDirty);
});

// ── Test Square ───────────────────────────────────────────────
document.getElementById('btnTestSquare')?.addEventListener('click', async () => {
  const btn = document.getElementById('btnTestSquare');
  const res = document.getElementById('squareTestResult');
  btn.disabled = true; btn.textContent = 'Testing…';
  res.textContent = '';
  try {
    const data = await api('/api/payments/terminal/devices');
    const devices = data?.devices || [];
    if (devices.length) {
      res.textContent = '✅ Connected — ' + devices.length + ' device(s): ' + devices.map(d => d.name + ' (' + d.status + ')').join(', ');
      res.style.color = '#8ff0b1';
    } else {
      res.textContent = '⚠️ Connected but no devices found';
      res.style.color = '#ffd18a';
    }
  } catch(e) {
    res.textContent = '❌ Failed: ' + e.message;
    res.style.color = '#ff6b6b';
  } finally {
    btn.disabled = false; btn.textContent = 'Test connection';
  }
});

// ── Cleanup ───────────────────────────────────────────────────
document.getElementById('btnCleanup')?.addEventListener('click', async () => {
  const btn = document.getElementById('btnCleanup');
  btn.disabled = true; btn.textContent = 'Cleaning…';
  try {
    const r = await api('/api/admin/cleanup-test-payments', { method: 'DELETE' });
    toast('Cleaned ' + (r?.deleted || 0) + ' records', 'ok');
  } catch(e) {
    toast('Error: ' + e.message, 'bad');
  } finally {
    btn.disabled = false; btn.textContent = 'Clean up';
  }
});

// ── Init ──────────────────────────────────────────────────────
loadSettings();

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

  // ── Users management ────────────────────────────────────────
  (function(){
    // Only owner can see/use this
    var tabUsers = document.getElementById('tabUsers');
    var panelUsers = document.getElementById('panelUsers');
    if (!tabUsers) return;

    // Hide tab if not owner
    if (!window.ELEMENT_AUTH || window.ELEMENT_AUTH.role !== 'owner') {
      if (tabUsers) tabUsers.style.display = 'none';
      return;
    }

    tabUsers.addEventListener('click', function(){ showUsersPanel(); });

    function showUsersPanel() {
      // Hide all panels, show users
      document.querySelectorAll('.tabPanel').forEach(function(p){ p.classList.remove('open'); });
      document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
      if (panelUsers) panelUsers.classList.add('open');
      tabUsers.classList.add('active');
      loadUsers();
      loadBarbersForUserForm();
    }

    function loadBarbersForUserForm() {
      var sel = document.getElementById('uBarberId');
      if (!sel) return;
      api('/api/barbers').then(function(data){
        var barbers = Array.isArray(data) ? data : (data && data.barbers ? data.barbers : []);
        sel.innerHTML = '<option value="">— None —</option>';
        barbers.forEach(function(b){
          var o = document.createElement('option');
          o.value = b.id; o.textContent = b.name;
          sel.appendChild(o);
        });
      }).catch(function(){});
    }

    function loadUsers() {
      var list = document.getElementById('usersList');
      if (!list) return;
      list.innerHTML = '<div style="color:rgba(255,255,255,.35);font-size:12px;padding:12px;">Loading...</div>';
      api('/api/users').then(function(data){
        var users = data && data.users ? data.users : [];
        if (!users.length) { list.innerHTML = '<div style="color:rgba(255,255,255,.35);font-size:12px;padding:12px;">No users yet.</div>'; return; }
        list.innerHTML = users.map(function(u){
          var roleColor = u.role==='owner' ? '#ffe9a3' : u.role==='admin' ? '#c9ffe1' : '#d7ecff';
          var roleBorder = u.role==='owner' ? 'rgba(255,207,63,.35)' : u.role==='admin' ? 'rgba(143,240,177,.35)' : 'rgba(10,132,255,.35)';
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);margin-bottom:8px;">'
            + '<div style="min-width:0;flex:1;">'
            + '<div style="font-weight:900;font-size:14px;">' + (u.name||u.username||'—') + '</div>'
            + '<div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:3px;">@' + (u.username||'') + (u.barber_id ? ' · barber linked' : '') + (u.last_login ? ' · last login: '+u.last_login.slice(0,10) : '') + '</div>'
            + '</div>'
            + '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">'
            + '<span style="font-size:10px;letter-spacing:.10em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid '+roleBorder+';background:rgba(0,0,0,.12);color:'+roleColor+';">'+u.role+'</span>'
            + (u.active ? '' : '<span style="font-size:10px;color:rgba(255,107,107,.70);">disabled</span>')
            + '<button onclick="resetUserPassword(\\''+u.id+'\\')" style="height:30px;padding:0 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-size:11px;font-family:inherit;">Reset PW</button>'
            + '<button onclick="toggleUser(\\''+u.id+'\\','+(!u.active)+')" style="height:30px;padding:0 10px;border-radius:8px;border:1px solid rgba(255,107,107,.30);background:rgba(255,107,107,.06);color:#ffd0d0;cursor:pointer;font-size:11px;font-family:inherit;">'+(u.active?'Disable':'Enable')+'</button>'
            + '</div>'
            + '</div>';
        }).join('');
      }).catch(function(e){ list.innerHTML = '<div style="color:#ffd0d0;font-size:12px;padding:12px;">Error: '+e.message+'</div>'; });
    }

    window.resetUserPassword = function(uid) {
      var pw = prompt('New password for user:');
      if (!pw || pw.length < 4) { alert('Password must be at least 4 characters'); return; }
      api('/api/users/' + encodeURIComponent(uid), {method:'PATCH', body:{password: pw}})
        .then(function(){ loadUsers(); if(typeof dlgAlert==='function') dlgAlert('Password reset.','Done'); else alert('Password reset!'); })
        .catch(function(e){ if(typeof dlgAlert==='function') dlgAlert(e.message,'Error','error'); else alert(e.message); });
    };

    window.toggleUser = function(uid, active) {
      api('/api/users/' + encodeURIComponent(uid), {method:'PATCH', body:{active: active}})
        .then(function(){ loadUsers(); })
        .catch(function(e){ alert(e.message); });
    };

    // Add user
    var addBtn = document.getElementById('uAddBtn');
    if (addBtn) addBtn.addEventListener('click', function(){
      var name     = (document.getElementById('uName')||{}).value||'';
      var username = (document.getElementById('uUsername')||{}).value||'';
      var password = (document.getElementById('uPassword')||{}).value||'';
      var role     = (document.getElementById('uRole')||{}).value||'barber';
      var barberId = (document.getElementById('uBarberId')||{}).value||'';
      if (!name||!username||!password) { if(typeof dlgAlert==='function') dlgAlert('Name, username and password are required.','Required'); else alert('Fill all fields'); return; }
      addBtn.disabled=true; addBtn.textContent='Creating...';
      api('/api/users', {method:'POST', body:{name:name.trim(), username:username.trim(), password, role, barber_id: barberId}})
        .then(function(){
          ['uName','uUsername','uPassword'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
          loadUsers();
          if(typeof dlgAlert==='function') dlgAlert('Account created! Username: @'+username.trim(),'Done');
          else alert('Account created!');
        })
        .catch(function(e){ if(typeof dlgAlert==='function') dlgAlert(e.message,'Error','error'); else alert(e.message); })
        .finally(function(){ addBtn.disabled=false; addBtn.textContent='+ Create account'; });
    });
  })();

</script>



</body>
`
