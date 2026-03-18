export const pageContent = `
<style>
    :root{
      --bg:#000; --fg:#e9e9e9; --muted:#9ea0a3;
      --glass:rgba(255,255,255,.06); --line:rgba(255,255,255,.10);
      --blue:#0a84ff; --ok:#8ff0b1; --danger:#ff6b6b; --warn:#ffd18a;
      --radius:18px;
    }
    *{box-sizing:border-box}
    html,body{height:100%; margin:0; background:var(--bg); color:var(--fg); font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;}
    a,a:link,a:visited,a:hover,a:active,a:focus{color:#fff !important;text-decoration:none !important;-webkit-text-fill-color:#fff !important;}
    .sidebar .nav a,.sidebar .nav a *{color:#fff !important;-webkit-text-fill-color:#fff !important;}
    .sidebar .nav a svg,.sidebar .nav a svg *{fill:#fff !important;stroke:#fff !important;}
    .sidebar .nav a .label .s{color:rgba(255,255,255,.45) !important;-webkit-text-fill-color:rgba(255,255,255,.45) !important;}
    .sidebar .ico,.sidebar .ico *{color:#fff !important;-webkit-text-fill-color:#fff !important;}
    button,input,select{font-family:inherit}
    input,select,button{-webkit-tap-highlight-color:transparent;}

    .app{min-height:100vh; display:grid; grid-template-columns:1fr;}
    @media(max-width:980px){
      .app{grid-template-columns:1fr;}
      .sidebar{position:fixed;inset:0 auto 0 0;width:300px;transform:translateX(-110%);transition:transform .22s ease;z-index:60;display:block;}
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
    .ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;}
    .label{min-width:0;display:flex;flex-direction:column;gap:2px;}
    .label .t{font-weight:900;letter-spacing:.02em;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .label .s{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);}
    .pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);flex:0 0 auto;}

    .main{padding:18px 18px 28px;max-width:1600px;margin:0 auto;width:100%;}
    .topbar{position:sticky;top:0;z-index:20;padding:10px 0 12px;background:linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),rgba(0,0,0,0));backdrop-filter:blur(14px);}
    .rowTop{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
    .burger{display:none;height:44px;width:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;}
    @media(max-width:980px){.burger{display:inline-flex;align-items:center;justify-content:center;}}
    .page-title{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:16px;}
    .sub{margin:6px 0 0;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}

    .controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
    .date,.select{height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .date:focus,.select:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .btn{height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-weight:900;letter-spacing:.02em;transition:all .18s ease;white-space:nowrap;}
    .btn:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
    .btn.primary{border-color:rgba(10,132,255,.80);box-shadow:0 0 0 1px rgba(10,132,255,.20) inset,0 0 18px rgba(10,132,255,.25);background:rgba(0,0,0,.75);}
    .btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}

    .layout{margin-top:14px;display:grid;grid-template-columns:1fr 340px;gap:14px;align-items:start;}
    @media(max-width:1200px){.layout{grid-template-columns:1fr;}}

    .card{border-radius:var(--radius);border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);backdrop-filter:blur(16px);overflow:hidden;}
    .cardHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.12);}
    .cardHead .h{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.70);}
    .badge{font-size:11px;letter-spacing:.10em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);}

    table{width:100%;border-collapse:collapse;}
    th,td{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;vertical-align:middle;}
    th{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55);background:rgba(0,0,0,.10);}
    tr:hover td{background:rgba(255,255,255,.025);}
    tr.expanded td{background:rgba(10,132,255,.06);}

    .avatar{width:36px;height:36px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;flex:0 0 auto;overflow:hidden;}
    .avatar img{width:100%;height:100%;object-fit:cover;border-radius:inherit;}
    .barberCell{display:flex;align-items:center;gap:10px;min-width:0;}
    .nm .n{font-weight:900;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .nm .p{font-size:12px;color:rgba(255,255,255,.50);}
    .muted{color:rgba(255,255,255,.45);}
    .pct-badge{display:inline-block;font-size:10px;letter-spacing:.10em;padding:3px 8px;border-radius:999px;border:1px solid rgba(10,132,255,.45);background:rgba(10,132,255,.10);color:#d7ecff;}
    .pct-badge.boosted{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.10);color:#c9ffe1;}

    /* Expandable bookings row */
    .expand-row{display:none;background:rgba(0,0,0,.20);}
    .expand-row.open{display:table-row;}
    .expand-inner{padding:10px 14px 14px;}
    .bk-list{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow:auto;}
    .bk-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.18);font-size:13px;}
    .bk-item .bk-l{display:flex;flex-direction:column;gap:2px;}
    .bk-item .bk-client{font-weight:700;}
    .bk-item .bk-meta{font-size:11px;color:rgba(255,255,255,.50);letter-spacing:.08em;text-transform:uppercase;}
    .bk-item .bk-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
    .bk-item .bk-svc{font-weight:700;}
    .bk-item .bk-tip{font-size:12px;color:#8ff0b1;}
    .expand-btn{background:none;border:none;color:rgba(255,255,255,.45);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;border-radius:8px;transition:color .15s;}
    .expand-btn:hover{color:#fff;}

    /* Right panel */
    .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 14px;}
    .k{padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.16);}
    .k .t{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.50);margin-bottom:4px;}
    .k .v{font-weight:900;font-size:17px;letter-spacing:.02em;}
    .k.wide{grid-column:1/-1;}

    /* Settings panel */
    .settings-list{display:flex;flex-direction:column;gap:10px;padding:12px 14px;}
    .settings-barber{border:1px solid rgba(255,255,255,.10);border-radius:14px;overflow:hidden;}
    .sb-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:rgba(0,0,0,.18);cursor:pointer;}
    .sb-head:hover{background:rgba(255,255,255,.04);}
    .sb-body{display:none;padding:12px;border-top:1px solid rgba(255,255,255,.08);}
    .sb-body.open{display:block;}
    .field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px;}
    .field label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.50);}
    .field input,.field select{height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 10px;outline:none;font-size:13px;}
    .field input:focus,.field select:focus{border-color:rgba(10,132,255,.55);}
    .tiers-list{display:flex;flex-direction:column;gap:6px;margin-bottom:8px;}
    .tier-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;align-items:center;}
    .tier-row select,.tier-row input{height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.22);color:#fff;padding:0 8px;outline:none;font-size:12px;}
    .tier-row .del-tier{height:34px;width:34px;border-radius:10px;border:1px solid rgba(255,107,107,.35);background:rgba(255,107,107,.08);color:#ff6b6b;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .add-tier-btn{height:34px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:rgba(255,255,255,.75);cursor:pointer;font-size:12px;letter-spacing:.08em;}
    .add-tier-btn:hover{background:rgba(255,255,255,.08);}
    .save-rule-btn{height:38px;width:100%;border-radius:12px;border:1px solid rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;cursor:pointer;font-weight:900;font-size:12px;letter-spacing:.08em;margin-top:4px;}
    .save-rule-btn:hover{background:rgba(10,132,255,.20);}

    /* Loading/error */
    .state-msg{padding:40px;text-align:center;color:rgba(255,255,255,.45);font-size:13px;letter-spacing:.10em;text-transform:uppercase;}
    .spinner{display:inline-block;width:20px;height:20px;border-radius:999px;border:2px solid rgba(255,255,255,.18);border-top-color:#fff;animation:spin .8s linear infinite;vertical-align:middle;margin-right:8px;}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* ── Date range picker modal (same as CRM calendar) ── */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:200;opacity:0;pointer-events:none;transition:opacity .28s ease;}
    .modal-overlay.show{opacity:1;pointer-events:auto;}
    .modal-win{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.88);width:min(520px,94vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));backdrop-filter:blur(18px);box-shadow:0 20px 80px rgba(0,0,0,.6);padding:18px;z-index:201;opacity:0;pointer-events:none;transition:opacity .28s ease,transform .28s ease;}
    .modal-win.open{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1);}
    .calHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 2px 12px;border-bottom:1px solid rgba(255,255,255,.10);margin-bottom:10px;}
    .calTitle{font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:13px;margin:0;}
    .calMonthBar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0 10px;}
    .calMonthName{font-weight:900;letter-spacing:.02em;font-size:14px;}
    .calWd{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:0 2px 8px;}
    .calWd div{font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.40);text-align:center;}
    .calGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:0 2px;}
    .calDay{height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);color:#fff;cursor:pointer;font-weight:900;font-size:13px;letter-spacing:.02em;transition:all .18s ease;}
    .calDay:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
    .calDay.other{opacity:.3;}
    .calDay.today{border-color:rgba(255,207,63,.55);box-shadow:0 0 0 1px rgba(255,207,63,.18) inset;}
    .calDay.from{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 16px rgba(10,132,255,.20);background:rgba(10,132,255,.14);}
    .calDay.to{border-color:rgba(143,240,177,.65);box-shadow:0 0 0 1px rgba(143,240,177,.20) inset,0 0 16px rgba(143,240,177,.18);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .calDay.inrange{background:rgba(10,132,255,.07);border-color:rgba(10,132,255,.22);}
    .calDay.from.to{border-color:rgba(255,207,63,.75);background:rgba(255,207,63,.12);color:#fff8c9;}
    .cal-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.10);}
    .cal-hint{font-size:11px;color:rgba(255,255,255,.40);letter-spacing:.08em;}
    .cal-selected{font-size:12px;font-weight:700;color:#d7ecff;}

    /* tier UI */
    .tier-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:6px;align-items:center;margin-bottom:6px;}
    .tier-row select,.tier-row input{height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.22);color:#fff;padding:0 8px;outline:none;font-size:12px;}
    .tier-row select:focus,.tier-row input:focus{border-color:rgba(10,132,255,.45);}
    .tier-row .del-tier{height:34px;width:34px;border-radius:10px;border:1px solid rgba(255,107,107,.35);background:rgba(255,107,107,.08);color:#ff6b6b;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;}
    .tier-labels{display:grid;grid-template-columns:1fr 1fr 1fr 34px;gap:6px;margin-bottom:4px;}
    .tier-labels span{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.35);}

    /* Tabs */
    .tabs{display:flex;gap:8px;padding:12px 14px 0;}
    .tab-btn{height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.75);cursor:pointer;font-weight:900;font-size:12px;letter-spacing:.06em;}
    .tab-btn.active{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;}
    .tab-panel{display:none;}.tab-panel.open{display:block;}
  
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
        <div style="min-width:0">
          <h2 class="page-title">Payroll</h2>
          <p class="sub" id="subLine">Commission + tips • Real data</p>
        </div>
        <div class="controls">
          <button class="btn" id="btnDateRange" style="min-width:200px;justify-content:flex-start;">
            <span id="dateRangeLabel">Last 14 days</span>
          </button>
          <select class="select" id="fBarber"><option value="">All barbers</option></select>
          <button class="btn" id="btnRefresh">↻ Refresh</button>
          <button class="btn primary" id="btnExport">Export CSV</button>
        </div>
      </div>
    </div>

    <div class="layout">
      <!-- Left: table -->
      <div style="display:flex;flex-direction:column;gap:14px;">
        <section class="card">
          <div class="cardHead">
            <div class="h">Barbers payout summary</div>
            <div class="badge" id="countBadge">—</div>
          </div>
          <div id="tableWrap" style="overflow:auto;max-height:calc(100vh - 230px);">
            <div class="state-msg"><span class="spinner"></span>Loading…</div>
          </div>
        </section>
      </div>

      <!-- Right: totals + settings -->
      <div style="display:flex;flex-direction:column;gap:14px;">
        <!-- Totals -->
        <section class="card">
          <div class="cardHead">
            <div class="h">Totals</div>
            <div class="badge" id="rangeLabel">—</div>
          </div>
          <div class="tabs">
            <button class="tab-btn active" data-tab="totals">Summary</button>
            <button class="tab-btn" data-tab="settings">Commission rules</button>
          </div>
          <div class="tab-panel open" id="tabTotals">
            <div class="kpi-grid" id="kpis">
              <div class="state-msg" style="grid-column:1/-1;">—</div>
            </div>
            <div style="padding:0 14px 14px;font-size:12px;color:rgba(255,255,255,.45);line-height:1.6;">
              <strong style="color:rgba(255,255,255,.75);">Formula:</strong><br/>
              • Barber payout = services × commission% + tips × tips%<br/>
              • Owner share = services × (100 − commission%)<br/>
              • Tiers override base % when threshold is reached
            </div>
          </div>
          <div class="tab-panel" id="tabSettings">
            <div class="settings-list" id="settingsList">
              <div class="state-msg">Load data first</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</div>

<!-- Date range picker modal -->
<div class="modal-overlay" id="dateOverlay"></div>
<div class="modal-win" id="dateModal">
  <div class="calHead">
    <h3 class="calTitle">Select date range</h3>
    <button class="btn" id="dateModalClose" style="height:34px;padding:0 12px;font-size:12px;">Close</button>
  </div>
  <div class="calMonthBar">
    <div style="display:flex;gap:8px;">
      <button class="btn" id="calPrev" style="height:36px;width:36px;padding:0;">←</button>
      <button class="btn" id="calNext" style="height:36px;width:36px;padding:0;">→</button>
    </div>
    <div class="calMonthName" id="calMonthName">—</div>
    <button class="btn" id="calToday" style="height:36px;padding:0 12px;font-size:12px;">Today</button>
  </div>
  <div class="calWd">
    <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
  </div>
  <div class="calGrid" id="calGrid"></div>
  <div class="cal-footer">
    <div class="cal-hint">Click start date, then end date</div>
    <div class="cal-selected" id="calSelectedLabel">—</div>
  </div>
</div>

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
  if (!res.ok) throw new Error(json?.error || json?.message || text || 'HTTP ' + res.status);
  return json;
}

// ── State ─────────────────────────────────────────────────────
const state = {
  data: null,        // last payroll response
  rules: {},         // { barberId: rule }
  barbers: [],       // from payroll response
  filter: { barber: '' }
};

// ── Sidebar ───────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
document.getElementById('burger')?.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });

// ── Date helpers ──────────────────────────────────────────────
function isoToday() { return new Date().toISOString().slice(0, 10); }
function iso14DaysAgo() { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().slice(0, 10); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtMoney(n) { return '$' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); }
function initials(name) { const p = String(name || '').split(' '); return (p[0]?.[0] || '') + (p[1]?.[0] || ''); }
function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Date range state ─────────────────────────────────────────
let pickerFrom = iso14DaysAgo();
let pickerTo   = isoToday();
let pickerStep = 'from'; // 'from' | 'to'
let calMonth   = null;   // current month displayed

function updateDateRangeLabel() {
  const label = document.getElementById('dateRangeLabel');
  if (!label) return;
  label.textContent = fmtDate(pickerFrom) + ' → ' + fmtDate(pickerTo);
}

// ── Calendar modal ────────────────────────────────────────────
const dateOverlay  = document.getElementById('dateOverlay');
const dateModal    = document.getElementById('dateModal');
const calGridEl    = document.getElementById('calGrid');
const calMonthName = document.getElementById('calMonthName');
const calSelectedL = document.getElementById('calSelectedLabel');

function isoFromDate(d) { return d.toISOString().slice(0,10); }
function dateFromIso(s) { const d = new Date(s + 'T00:00:00'); return isNaN(+d) ? new Date() : d; }
function startOfMonthD(d) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function wd0(d) { const w = new Date(d).getDay(); return (w + 6) % 7; } // Mon=0

function openDatePicker() {
  pickerStep = 'from';
  calMonth = startOfMonthD(dateFromIso(pickerFrom));
  renderCalendar();
  dateOverlay.classList.add('show');
  dateModal.classList.add('open');
}
function closeDatePicker() {
  dateOverlay.classList.remove('show');
  dateModal.classList.remove('open');
}

function renderCalendar() {
  if (!calGridEl || !calMonthName) return;
  calMonthName.textContent = calMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const first = startOfMonthD(calMonth);
  const offset = wd0(first);
  const start = new Date(first); start.setDate(first.getDate() - offset);
  const todayStr = isoToday();
  calGridEl.innerHTML = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const iso = isoFromDate(d);
    const inMonth = d.getMonth() === calMonth.getMonth();
    const btn = document.createElement('button');
    btn.type = 'button';
    let cls = 'calDay';
    if (!inMonth) cls += ' other';
    if (iso === todayStr) cls += ' today';
    if (iso === pickerFrom) cls += ' from';
    if (iso === pickerTo) cls += ' to';
    if (pickerFrom && pickerTo && iso > pickerFrom && iso < pickerTo) cls += ' inrange';
    btn.className = cls;
    btn.textContent = String(d.getDate());
    btn.addEventListener('click', () => {
      if (pickerStep === 'from') {
        pickerFrom = iso; pickerTo = iso; pickerStep = 'to';
      } else {
        if (iso < pickerFrom) { pickerTo = pickerFrom; pickerFrom = iso; }
        else pickerTo = iso;
        pickerStep = 'from';
        closeDatePicker();
        updateDateRangeLabel();
        loadPayroll();
      }
      updateCalSelectedLabel();
      renderCalendar();
    });
    calGridEl.appendChild(btn);
  }
  updateCalSelectedLabel();
}

function updateCalSelectedLabel() {
  if (!calSelectedL) return;
  if (pickerStep === 'to' && pickerFrom) {
    calSelectedL.textContent = 'From: ' + fmtDate(pickerFrom) + ' → pick end';
  } else if (pickerFrom && pickerTo) {
    calSelectedL.textContent = fmtDate(pickerFrom) + ' → ' + fmtDate(pickerTo);
  } else {
    calSelectedL.textContent = 'Pick start date';
  }
}

document.getElementById('btnDateRange')?.addEventListener('click', openDatePicker);
document.getElementById('dateModalClose')?.addEventListener('click', closeDatePicker);
dateOverlay?.addEventListener('click', closeDatePicker);
document.getElementById('calPrev')?.addEventListener('click', () => {
  calMonth.setMonth(calMonth.getMonth() - 1); renderCalendar();
});
document.getElementById('calNext')?.addEventListener('click', () => {
  calMonth.setMonth(calMonth.getMonth() + 1); renderCalendar();
});
document.getElementById('calToday')?.addEventListener('click', () => {
  const t = new Date(); t.setHours(0,0,0,0);
  calMonth = startOfMonthD(t); renderCalendar();
});

updateDateRangeLabel();

// ── Tabs ──────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('open'));
    btn.classList.add('active');
    document.getElementById('tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1))?.classList.add('open');
  });
});

// ── Load payroll ──────────────────────────────────────────────

// ── Shop settings loader ───────────────────────────────────────
let shopSettings = null;
async function loadShopSettings() {
  try {
    shopSettings = await api('/api/settings');
  } catch(e) { console.warn('settings:', e.message); shopSettings = {}; }
}

function applyTaxToAmount(amount) {
  const tax = shopSettings?.tax;
  if (!tax?.enabled || !tax?.rate) return { base: amount, tax: 0, total: amount };
  const rate = Number(tax.rate) / 100;
  if (tax.included_in_price) {
    const base = amount / (1 + rate);
    return { base: Math.round(base*100)/100, tax: Math.round((amount-base)*100)/100, total: amount };
  }
  const taxAmt = Math.round(amount * rate * 100) / 100;
  return { base: amount, tax: taxAmt, total: amount + taxAmt };
}

function getActiveFees() {
  return (shopSettings?.fees || []).filter(f => f.enabled !== false);
}

function calcFeesOnAmount(amount) {
  return getActiveFees().reduce((sum, f) => {
    if (f.type === 'percent') return sum + Math.round(amount * (Number(f.value||0)/100) * 100)/100;
    if (f.type === 'fixed') return sum + Number(f.value||0);
    return sum;
  }, 0);
}

async function loadPayroll() {
  const from = pickerFrom, to = pickerTo;
  if (!from || !to) { alert('Select date range'); return; }
  document.getElementById('tableWrap').innerHTML = '<div class="state-msg"><span class="spinner"></span>Loading…</div>';
  document.getElementById('kpis').innerHTML = '<div class="state-msg" style="grid-column:1/-1;"><span class="spinner"></span></div>';
  try {
    const [data, rulesData] = await Promise.all([
      api(\`/api/payroll?from=\${encodeURIComponent(from + 'T00:00:00.000Z')}&to=\${encodeURIComponent(to + 'T23:59:59.999Z')}\`),
      api('/api/payroll/rules').catch(() => ({ rules: {} }))
    ]);
    state.data = data;
    state.rules = rulesData?.rules || {};
    state.barbers = data?.barbers || [];
    renderBarberSelect(state.barbers);
    renderTable();
    renderKpis(data?.totals);
    renderSettings();
    document.getElementById('rangeLabel').textContent = \`\${fmtDate(from)} → \${fmtDate(to)}\`;
    document.getElementById('subLine').textContent = \`\${state.barbers.length} barbers • \${state.barbers.reduce((s,b) => s + b.bookings_count, 0)} bookings\`;
  } catch(e) {
    document.getElementById('tableWrap').innerHTML = \`<div class="state-msg" style="color:#ff6b6b;">Error: \${escHtml(e.message)}</div>\`;
  }
}

function renderBarberSelect(barbers) {
  const sel = document.getElementById('fBarber');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All barbers</option>';
  barbers.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.barber_id;
    opt.textContent = b.barber_name;
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
}

function visibleBarbers() {
  const f = state.filter.barber;
  return f ? state.barbers.filter(b => b.barber_id === f) : state.barbers;
}

function renderTable() {
  const list = visibleBarbers();
  document.getElementById('countBadge').textContent = list.length + ' barbers';
  if (!list.length) {
    document.getElementById('tableWrap').innerHTML = '<div class="state-msg">No data for selected filters.</div>';
    return;
  }

  const rows = list.map(b => {
    const isDefault = b.effective_pct === b.base_pct;
    const pctHtml = isDefault
      ? \`<span class="pct-badge">\${b.effective_pct}%</span>\`
      : \`<span class="pct-badge boosted">\${b.effective_pct}% ↑</span>\`;
    const avatarInner = b.barber_photo
      ? \`<img src="\${escHtml(b.barber_photo)}" alt="\${escHtml(b.barber_name)}" onerror="this.style.display='none'"/>\`
      : escHtml(initials(b.barber_name));

    return \`
      <tr class="barber-main-row" data-id="\${escHtml(b.barber_id)}">
        <td>
          <div class="barberCell">
            <div class="avatar">\${avatarInner}</div>
            <div class="nm">
              <div class="n">\${escHtml(b.barber_name)}</div>
              <div class="p">\${b.client_count} clients · \${b.bookings_count} bookings</div>
            </div>
          </div>
        </td>
        <td>\${pctHtml}</td>
        <td><strong>\${fmtMoney(b.service_total)}</strong></td>
        <td>\${fmtMoney(b.barber_service_share)}</td>
        <td class="muted">\${fmtMoney(b.owner_service_share)}</td>
        <td>\${fmtMoney(b.tips_total)}</td>
        <td><strong>\${fmtMoney(b.barber_total)}</strong></td>
        <td>
          <button class="expand-btn" data-id="\${escHtml(b.barber_id)}" title="Show bookings">▾</button>
        </td>
      </tr>
      <tr class="expand-row" id="expand-\${escHtml(b.barber_id)}">
        <td colspan="8">
          <div class="expand-inner">
            <div class="bk-list">
              \${b.bookings.length === 0 ? '<div class="state-msg" style="padding:10px;">No bookings</div>' :
                b.bookings.map(bk => \`
                  <div class="bk-item">
                    <div class="bk-l">
                      <div class="bk-client">\${escHtml(bk.client)}</div>
                      <div class="bk-meta">\${escHtml(bk.date)} · \${escHtml(bk.service)} · \${escHtml(bk.status)}\${bk.paid ? ' · Paid' : ''}</div>
                    </div>
                    <div class="bk-r">
                      <div class="bk-svc">\${fmtMoney(bk.service_amount)}</div>
                      \${bk.tip > 0 ? \`<div class="bk-tip">+\${fmtMoney(bk.tip)} tip</div>\` : ''}
                    </div>
                  </div>
                \`).join('')}
            </div>
          </div>
        </td>
      </tr>
    \`;
  }).join('');

  document.getElementById('tableWrap').innerHTML = \`
    <table>
      <thead>
        <tr>
          <th>Barber</th>
          <th>Rate</th>
          <th>Services gross</th>
          <th>Barber share</th>
          <th>Owner share</th>
          <th>Tips</th>
          <th>Total payout</th>
          <th style="width:44px;"></th>
        </tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>\`;

  // Expand toggle
  document.querySelectorAll('.expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const row = document.getElementById('expand-' + id);
      const open = row.classList.toggle('open');
      btn.textContent = open ? '▴' : '▾';
    });
  });
}

function renderKpis(totals) {
  if (!totals) { document.getElementById('kpis').innerHTML = '<div class="state-msg" style="grid-column:1/-1;">No totals</div>'; return; }
  document.getElementById('kpis').innerHTML = \`
    <div class="k wide"><div class="t">Services gross</div><div class="v">\${fmtMoney(totals.service_total)}</div></div>
    <div class="k"><div class="t">Barbers total</div><div class="v">\${fmtMoney(totals.barber_service_share)}</div></div>
    <div class="k"><div class="t">Owner share</div><div class="v">\${fmtMoney(totals.owner_service_share)}</div></div>
    <div class="k"><div class="t">Tips</div><div class="v">\${fmtMoney(totals.tips_total)}</div></div>
    <div class="k wide"><div class="t">Barbers total payout</div><div class="v" style="font-size:22px;">\${fmtMoney(totals.barber_total)}</div></div>
  \`;
}

// ── Commission settings UI ────────────────────────────────────
function renderSettings() {
  const barbers = state.barbers;
  if (!barbers.length) { document.getElementById('settingsList').innerHTML = '<div class="state-msg">No barbers loaded</div>'; return; }

  const html = barbers.map(b => {
    const rule = state.rules[b.barber_id] || b.rule || { base_pct: 60, tips_pct: 100, tiers: [] };
    const tiers = Array.isArray(rule.tiers) ? rule.tiers : [];
    return \`
      <div class="settings-barber" id="sb-\${escHtml(b.barber_id)}">
        <div class="sb-head" onclick="toggleSB('\${escHtml(b.barber_id)}')">
          <div style="font-weight:900;font-size:13px;">\${escHtml(b.barber_name)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.45);">\${rule.base_pct ?? 60}% base · \${rule.tips_pct ?? 100}% tips</div>
        </div>
        <div class="sb-body" id="sb-body-\${escHtml(b.barber_id)}">
          <div class="field">
            <label>Base commission %</label>
            <input type="number" min="0" max="100" step="1" id="base-\${escHtml(b.barber_id)}" value="\${rule.base_pct ?? 60}"/>
          </div>
          <div class="field">
            <label>Tips % (100 = barber keeps all)</label>
            <input type="number" min="0" max="100" step="1" id="tips-\${escHtml(b.barber_id)}" value="\${rule.tips_pct ?? 100}"/>
          </div>
          <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:6px;">
            Bonus tiers — override base % when threshold reached
          </div>
          <div class="tier-labels"><span>Type</span><span>Threshold</span><span>Rate %</span><span></span></div>
          <div class="tiers-list" id="tiers-\${escHtml(b.barber_id)}">
            \${tiers.map((t, i) => tierRowHtml(b.barber_id, i, t)).join('')}
          </div>
          <button class="add-tier-btn" onclick="addTier('\${escHtml(b.barber_id)}')">+ Add tier</button>
          <button class="save-rule-btn" onclick="saveRule('\${escHtml(b.barber_id)}')">Save rules</button>
        </div>
      </div>
    \`;
  }).join('');

  document.getElementById('settingsList').innerHTML = html;
}

function tierRowHtml(barberId, idx, tier) {
  return \`
    <div class="tier-row" id="tier-\${escHtml(barberId)}-\${idx}">
      <select id="tier-type-\${escHtml(barberId)}-\${idx}">
        <option value="revenue" \${tier.type === 'revenue' ? 'selected' : ''}>Revenue ≥</option>
        <option value="clients" \${tier.type === 'clients' ? 'selected' : ''}>Clients ≥</option>
      </select>
      <input type="number" min="0" step="1" placeholder="Threshold" id="tier-thresh-\${escHtml(barberId)}-\${idx}" value="\${tier.threshold || 0}"/>
      <input type="number" min="0" max="100" step="1" placeholder="%" id="tier-pct-\${escHtml(barberId)}-\${idx}" value="\${tier.pct || 65}"/>
      <button class="del-tier" onclick="removeTier('\${escHtml(barberId)}', \${idx})">✕</button>
    </div>\`;
}

function toggleSB(barberId) {
  const body = document.getElementById('sb-body-' + barberId);
  if (body) body.classList.toggle('open');
}

function getTierCount(barberId) {
  let i = 0;
  while (document.getElementById(\`tier-\${barberId}-\${i}\`)) i++;
  return i;
}

function addTier(barberId) {
  const count = getTierCount(barberId);
  const container = document.getElementById('tiers-' + barberId);
  if (!container) return;
  const div = document.createElement('div');
  div.innerHTML = tierRowHtml(barberId, count, { type: 'revenue', threshold: 0, pct: 65 });
  container.appendChild(div.firstElementChild);
}

function removeTier(barberId, idx) {
  const el = document.getElementById(\`tier-\${barberId}-\${idx}\`);
  if (el) el.remove();
}

async function saveRule(barberId) {
  const base_pct = Number(document.getElementById('base-' + barberId)?.value || 60);
  const tips_pct = Number(document.getElementById('tips-' + barberId)?.value || 100);
  const tiers = [];
  let i = 0;
  while (true) {
    const typeEl = document.getElementById(\`tier-type-\${barberId}-\${i}\`);
    if (!typeEl) break;
    const threshold = Number(document.getElementById(\`tier-thresh-\${barberId}-\${i}\`)?.value || 0);
    const pct = Number(document.getElementById(\`tier-pct-\${barberId}-\${i}\`)?.value || 65);
    if (threshold > 0) tiers.push({ type: typeEl.value, threshold, pct });
    i++;
  }
  const btn = document.querySelector(\`#sb-\${barberId} .save-rule-btn\`);
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    await api(\`/api/payroll/rules/\${encodeURIComponent(barberId)}\`, { method: 'POST', body: { base_pct, tips_pct, tiers } });
    state.rules[barberId] = { base_pct, tips_pct, tiers };
    if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => { if(btn) { btn.textContent = 'Save rules'; btn.disabled = false; } }, 1500); }
    // Reload data to reflect new rates
    await loadPayroll();
  } catch(e) {
    alert('Save failed: ' + e.message);
    if (btn) { btn.textContent = 'Save rules'; btn.disabled = false; }
  }
}

// ── Export CSV ────────────────────────────────────────────────
function exportCSV() {
  const list = visibleBarbers();
  const header = ['Barber', 'Rate%', 'Services Gross', 'Barber Share', 'Owner Share', 'Tips', 'Total Payout', 'Clients', 'Bookings'];
  const lines = [header.join(',')];
  list.forEach(b => {
    lines.push([
      b.barber_name,
      b.effective_pct,
      b.service_total.toFixed(2),
      b.barber_service_share.toFixed(2),
      b.owner_service_share.toFixed(2),
      b.tips_total.toFixed(2),
      b.barber_total.toFixed(2),
      b.client_count,
      b.bookings_count
    ].join(','));
  });
  const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = \`payroll_\${pickerFrom}_\${pickerTo}.csv\`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ── Events ────────────────────────────────────────────────────
document.getElementById('btnRefresh').addEventListener('click', loadPayroll);
document.getElementById('btnExport').addEventListener('click', exportCSV);
document.getElementById('fBarber').addEventListener('change', e => {
  state.filter.barber = e.target.value;
  if (state.data) renderTable();
});

// ── Init ──────────────────────────────────────────────────────
loadShopSettings().then(() => loadPayroll());

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
