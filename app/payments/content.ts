export const pageContent = `
<style>
    :root{
      --bg:#000; --fg:#e9e9e9; --muted:#9ea0a3;
      --glass:rgba(255,255,255,.06); --line:rgba(255,255,255,.10);
      --blue:#0a84ff; --gold:#ffcf3f; --ok:#8ff0b1; --danger:#ff6b6b; --warn:#ffd18a;
      --radius:18px;
    }
    *{box-sizing:border-box}
    html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;}
    a,a:link,a:visited,a:hover,a:active,a:focus{color:#fff !important;text-decoration:none !important;-webkit-text-fill-color:#fff !important;}
    .sidebar .nav a,.sidebar .nav a *{color:#fff !important;-webkit-text-fill-color:#fff !important;}
    .sidebar .nav a svg,.sidebar .nav a svg *{fill:#fff !important;stroke:#fff !important;}
    .sidebar .nav a .label .s{color:rgba(255,255,255,.45) !important;-webkit-text-fill-color:rgba(255,255,255,.45) !important;}
    .sidebar .ico,.sidebar .ico *{color:#fff !important;-webkit-text-fill-color:#fff !important;}
    button,input,select{font-family:inherit}
    input,select,button{-webkit-tap-highlight-color:transparent;}

    .app{min-height:100vh;display:grid;grid-template-columns:1fr;}
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
    .pill.live{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.08);color:#c9ffe1;}

    .main{padding:18px 18px 28px;max-width:1600px;margin:0 auto;width:100%;}
    .topbar{position:sticky;top:0;z-index:20;padding:10px 0 12px;background:linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),rgba(0,0,0,0));backdrop-filter:blur(14px);}
    .topbar-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
    .burger{display:none;height:44px;width:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;}
    @media(max-width:980px){.burger{display:inline-flex;align-items:center;justify-content:center;}}
    .page-title{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:16px;}
    .sub{margin:6px 0 0;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}

    .controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
    .btn{height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-weight:900;letter-spacing:.02em;transition:all .18s ease;white-space:nowrap;}
    .btn:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
    .btn.primary{border-color:rgba(10,132,255,.80);box-shadow:0 0 0 1px rgba(10,132,255,.20) inset,0 0 18px rgba(10,132,255,.25);background:rgba(0,0,0,.75);}
    .btn.danger{border-color:rgba(255,107,107,.55);background:rgba(255,107,107,.10);color:#ffd0d0;}
    .btn.danger:hover{background:rgba(255,107,107,.18);}
    .btn.small{height:38px;font-size:12px;}
    .btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}

    .search{height:44px;width:min(260px,65vw);border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .search:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .select{height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .select:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}

    /* Grid */
    .grid{margin-top:14px;display:grid;grid-template-columns:1.7fr .8fr;gap:14px;align-items:start;}
    @media(max-width:1100px){.grid{grid-template-columns:1fr;}}

    .card{border-radius:var(--radius);border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);backdrop-filter:blur(16px);overflow:hidden;}
    .cardHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.12);}
    .cardHead .h{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.70);}
    .count{font-size:11px;letter-spacing:.10em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);}

    /* KPI strip */
    .kpi-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.06);}
    .kpi-strip .k{padding:12px 14px;background:rgba(0,0,0,.18);}
    .kpi-strip .k .t{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:4px;}
    .kpi-strip .k .v{font-weight:900;font-size:15px;}
    @media(max-width:640px){
      .kpi-strip{grid-template-columns:1fr 1fr;}
      th:nth-child(5),td:nth-child(5){display:none;} /* hide Tip on mobile */
      th,td{padding:8px 7px;font-size:11px;}
      .chip{font-size:8px;padding:3px 6px;letter-spacing:.04em;}
      .avatar{width:26px;height:26px;font-size:10px;}
      .nm .n{font-size:12px;}
      .nm .p{font-size:10px;}
    }
    @media(max-width:480px){
      th:nth-child(3),td:nth-child(3){display:none;} /* hide Method on very small */
    }

    table{width:100%;border-collapse:collapse;table-layout:fixed;}
    td:nth-child(2){overflow:hidden;max-width:0;}
    td:nth-child(1){overflow:hidden;}
    th,td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;vertical-align:middle;white-space:nowrap;}
    th{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.70);background:rgba(8,8,8,.95);position:sticky;top:0;z-index:2;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
    tr:hover td{background:rgba(255,255,255,.025);}
    tr.sel td{background:rgba(10,132,255,.08);}

    .clientCell{display:flex;align-items:center;gap:10px;min-width:0;}
    .avatar{width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex:0 0 auto;}
    .nm .n{font-weight:900;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .nm .p{font-size:11px;color:rgba(255,255,255,.45);}
    .muted{color:rgba(255,255,255,.45);}
    .chip{font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.12);color:rgba(255,255,255,.75);display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}
    .dot{width:4px;height:4px;border-radius:99px;background:currentColor;flex:0 0 auto;}
    .chip.paid{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .chip.refunded{border-color:rgba(255,107,107,.45);background:rgba(255,107,107,.10);color:#ffd0d0;}
    .chip.pending{border-color:rgba(255,209,138,.45);background:rgba(255,209,138,.10);color:#ffe7c8;}
    .chip.terminal{border-color:rgba(10,132,255,.45);background:rgba(10,132,255,.10);color:#d7ecff;}

    /* Details */
    .details{padding:14px;display:flex;flex-direction:column;gap:10px;}
    .block{padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.16);}
    .block .t{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.50);margin-bottom:6px;}
    .block .v{font-weight:900;letter-spacing:.02em;}
    .rows{display:flex;flex-direction:column;gap:6px;}
    .row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);}
    .row .l{color:rgba(255,255,255,.50);font-size:11px;letter-spacing:.10em;text-transform:uppercase;}
    .row .r{font-weight:700;font-size:13px;}
    .det-actions{display:flex;gap:8px;flex-wrap:wrap;}

    /* State */
    .state-msg{padding:40px;text-align:center;color:rgba(255,255,255,.40);font-size:13px;letter-spacing:.10em;text-transform:uppercase;}
    .spinner{display:inline-block;width:18px;height:18px;border-radius:999px;border:2px solid rgba(255,255,255,.18);border-top-color:#fff;animation:spin .8s linear infinite;vertical-align:middle;margin-right:8px;}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* Date picker modal */
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
    .calDay{height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);color:#fff;cursor:pointer;font-weight:900;font-size:13px;transition:all .18s ease;}
    .calDay:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
    .calDay.other{opacity:.3;}
    .calDay.today{border-color:rgba(255,207,63,.55);box-shadow:0 0 0 1px rgba(255,207,63,.18) inset;}
    .calDay.from{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 16px rgba(10,132,255,.20);background:rgba(10,132,255,.14);}
    .calDay.to{border-color:rgba(143,240,177,.65);box-shadow:0 0 0 1px rgba(143,240,177,.20) inset,0 0 16px rgba(143,240,177,.18);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .calDay.inrange{background:rgba(10,132,255,.07);border-color:rgba(10,132,255,.22);}
    .calDay.from.to{border-color:rgba(255,207,63,.75);background:rgba(255,207,63,.12);}
    .cal-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.10);}
    .cal-hint{font-size:11px;color:rgba(255,255,255,.40);letter-spacing:.08em;}
    .cal-selected{font-size:12px;font-weight:700;color:#d7ecff;}

    /* Refund confirm modal */
    .refund-win{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:min(380px,92vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04));backdrop-filter:blur(20px);box-shadow:0 24px 80px rgba(0,0,0,.6);padding:22px;z-index:201;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;}
    .refund-win.open{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1);}
    .rf-title{font-family:"Julius Sans One",sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:rgba(255,255,255,.65);margin:0 0 12px;}
    .rf-body{font-size:14px;font-weight:600;line-height:1.5;margin-bottom:18px;}
    .rf-actions{display:flex;gap:10px;justify-content:flex-end;}
    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;}
    .field label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);}
    .field input{height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 10px;outline:none;font-size:13px;}
    .field input:focus{border-color:rgba(10,132,255,.45);}
  
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
        <div style="min-width:0">
          <h2 class="page-title">Payments</h2>
          <p class="sub" id="subLine">Square + Terminal • Real data</p>
        </div>
        <div class="controls">
          <input class="search" id="q" placeholder="Search client / note…"/>
          <button class="btn" id="btnDateRange" style="min-width:190px;justify-content:flex-start;">
            <span id="dateRangeLabel">Last 14 days</span>
          </button>
          <select class="select" id="fBarber"><option value="">All barbers</option></select>
          <select class="select" id="fStatus">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <select class="select" id="fMethod">
            <option value="">All methods</option>
            <option value="card">Card</option>
            <option value="terminal">Terminal</option>
            <option value="applepay">Apple Pay</option>
            <option value="cash">Cash</option>
            <option value="zelle">Zelle</option>
            <option value="other">Other</option>
          </select>
          <button class="btn" id="btnRefresh">↻ Refresh</button>
          <button class="btn primary" id="btnExport">Export CSV</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <div class="cardHead">
          <div class="h">Transactions</div>
          <div class="count" id="countBadge">—</div>
        </div>
        <div class="kpi-strip" id="kpiStrip">
          <div class="k"><div class="t">Gross</div><div class="v" id="kGross">—</div></div>
          <div class="k"><div class="t">Tips</div><div class="v" id="kTips">—</div></div>
          <div class="k"><div class="t">Fees</div><div class="v" id="kFees">—</div></div>
          <div class="k"><div class="t">Net</div><div class="v" id="kNet">—</div></div>
        </div>
        <div style="overflow-y:auto;overflow-x:hidden;max-height:calc(100vh - 310px);">
          <table>
            <thead>
              <tr>
                <th style="width:70px">Date</th>
                <th>Client / Barber</th>
                <th style="width:70px">Method</th>
                <th style="width:80px">Amount</th>
                <th style="width:70px">Tip</th>
                <th style="width:90px">Status</th>
              </tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>
          <div id="tableState" style="display:none;"></div>
        </div>
      </section>

      <aside class="card">
        <div class="cardHead">
          <div class="h">Details</div>
          <div class="count" id="detHint" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Select a row</div>
        </div>
        <div class="details" id="details">
          <div class="muted" style="padding:6px;">Click any payment to view details.</div>
        </div>
      </aside>
    </div>
  </main>
</div>

<!-- Date range picker -->
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
  <div class="calWd"><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div></div>
  <div class="calGrid" id="calGrid"></div>
  <div class="cal-footer">
    <div class="cal-hint">Click start date, then end date</div>
    <div class="cal-selected" id="calSelectedLabel">—</div>
  </div>
</div>

<!-- Refund confirm -->
<div class="modal-overlay" id="refundOverlay"></div>
<div class="refund-win" id="refundWin">
  <div class="rf-title">Refund payment</div>
  <div class="rf-body" id="rfBody">—</div>
  <div class="field">
    <label>Reason</label>
    <input id="rfReason" value="Requested by customer"/>
  </div>
  <div class="field">
    <label>Amount (leave blank = full refund)</label>
    <input id="rfAmount" type="number" step="0.01" placeholder="Full refund"/>
  </div>
  <div class="rf-actions">
    <button class="btn small" id="rfCancel">Cancel</button>
    <button class="btn small danger" id="rfConfirm">Refund</button>
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
  if (!res.ok) throw new Error(json?.error || text || 'HTTP ' + res.status);
  return json;
}

// ── Helpers ───────────────────────────────────────────────────
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtMoney = n => '$' + (Math.round((Number(n)||0)*100)/100).toFixed(2);
function fmtDateShort(iso) {
  if (!iso) return '—';
  try { return new Date(iso+'T00:00:00').toLocaleDateString([],{month:'short',day:'numeric'}); } catch { return iso; }
}
function fmtDateFull(iso) {
  if (!iso) return '—';
  try { return new Date(iso+'T00:00:00').toLocaleDateString([],{month:'long',day:'numeric',year:'numeric'}); } catch { return iso; }
}
function methodLabel(m) {
  const map = {
    card:'Card', applepay:'Apple Pay', CARD:'Card',
    cash:'Cash', CASH:'Cash',
    zelle:'Zelle', ZELLE:'Zelle',
    terminal:'Terminal', TERMINAL:'Terminal',
    other:'Other', OTHER:'Other',
  };
  return map[m] || (m ? String(m).charAt(0).toUpperCase() + String(m).slice(1) : '—');
}
function statusChip(st) {
  const c = st === 'paid' ? 'paid' : st === 'refunded' ? 'refunded' : st === 'pending' ? 'pending' : '';
  return \`<span class="chip \${c}"><span class="dot"></span>\${esc(st||'—')}</span>\`;
}
function initials(name) { const p = String(name||'').split(' '); return (p[0]?.[0]||'')+(p[1]?.[0]||'?'); }
function isoToday() { return new Date().toISOString().slice(0,10); }
function iso14Ago() { const d=new Date(); d.setDate(d.getDate()-14); return d.toISOString().slice(0,10); }

// ── State ─────────────────────────────────────────────────────
const state = {
  payments: [],
  totals: null,
  selectedId: null,
  filter: { q:'', barber:'', status:'', method:'' },
  pickerFrom: iso14Ago(),
  pickerTo: isoToday(),
  pickerStep: 'from',
  calMonth: null,
};

// ── Sidebar ───────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
document.getElementById('burger')?.addEventListener('click', () => { sidebar.classList.add('open'); backdrop.classList.add('open'); });
backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('open'); });

// ── Date range picker ─────────────────────────────────────────
const dateOverlay  = document.getElementById('dateOverlay');
const dateModalEl  = document.getElementById('dateModal');
const calGridEl    = document.getElementById('calGrid');
const calMonthName = document.getElementById('calMonthName');
const calSelectedL = document.getElementById('calSelectedLabel');

function startOfMon(d) { const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function wd0(d) { return (new Date(d).getDay()+6)%7; }
function isoFromDate(d) { return d.toISOString().slice(0,10); }

function updateRangeLabel() {
  const el = document.getElementById('dateRangeLabel');
  if (!el) return;
  const from = state.pickerFrom, to = state.pickerTo;
  const todayStr = isoToday();
  if (from === to && from === todayStr) {
    el.textContent = 'Today';
  } else if (from === to) {
    el.textContent = fmtDateFull(from);
  } else if (to === todayStr && from === iso14Ago()) {
    el.textContent = 'Last 14 days';
  } else {
    el.textContent = fmtDateFull(from) + ' → ' + fmtDateFull(to);
  }
}

function openDatePicker() {
  state.pickerStep = 'from';
  state.calMonth = startOfMon(new Date(state.pickerFrom + 'T00:00:00'));
  renderCal();
  dateOverlay.classList.add('show');
  dateModalEl.classList.add('open');
}
function closeDatePicker() { dateOverlay.classList.remove('show'); dateModalEl.classList.remove('open'); }

function renderCal() {
  if (!calGridEl) return;
  calMonthName.textContent = state.calMonth.toLocaleDateString([],{month:'long',year:'numeric'});
  const first = startOfMon(state.calMonth), offset = wd0(first);
  const start = new Date(first); start.setDate(first.getDate()-offset);
  const todayStr = isoToday();
  calGridEl.innerHTML = '';
  for (let i=0; i<42; i++) {
    const d = new Date(start); d.setDate(start.getDate()+i);
    const iso = isoFromDate(d);
    const inMonth = d.getMonth() === state.calMonth.getMonth();
    const btn = document.createElement('button');
    btn.type = 'button';
    let cls = 'calDay';
    if (!inMonth) cls += ' other';
    if (iso === todayStr) cls += ' today';
    if (iso === state.pickerFrom) cls += ' from';
    if (iso === state.pickerTo) cls += ' to';
    if (state.pickerFrom && state.pickerTo && iso > state.pickerFrom && iso < state.pickerTo) cls += ' inrange';
    btn.className = cls;
    btn.textContent = String(d.getDate());
    btn.addEventListener('click', () => {
      if (state.pickerStep === 'from') {
        state.pickerFrom = iso; state.pickerTo = iso; state.pickerStep = 'to';
      } else {
        if (iso < state.pickerFrom) { state.pickerTo = state.pickerFrom; state.pickerFrom = iso; }
        else state.pickerTo = iso;
        state.pickerStep = 'from';
        closeDatePicker();
        updateRangeLabel();
        loadPayments();
      }
      updateCalLabel(); renderCal();
    });
    calGridEl.appendChild(btn);
  }
  updateCalLabel();
}

function updateCalLabel() {
  if (!calSelectedL) return;
  if (state.pickerStep === 'to' && state.pickerFrom)
    calSelectedL.textContent = 'From: ' + fmtDateFull(state.pickerFrom) + ' → pick end';
  else if (state.pickerFrom && state.pickerTo)
    calSelectedL.textContent = fmtDateFull(state.pickerFrom) + ' → ' + fmtDateFull(state.pickerTo);
  else calSelectedL.textContent = 'Pick start date';
}

document.getElementById('btnDateRange')?.addEventListener('click', openDatePicker);
document.getElementById('dateModalClose')?.addEventListener('click', closeDatePicker);
dateOverlay?.addEventListener('click', closeDatePicker);
document.getElementById('calPrev')?.addEventListener('click', () => { state.calMonth.setMonth(state.calMonth.getMonth()-1); renderCal(); });
document.getElementById('calNext')?.addEventListener('click', () => { state.calMonth.setMonth(state.calMonth.getMonth()+1); renderCal(); });
document.getElementById('calToday')?.addEventListener('click', () => { const t=new Date(); t.setHours(0,0,0,0); state.calMonth=startOfMon(t); renderCal(); });
updateRangeLabel();

// ── Load data ─────────────────────────────────────────────────

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

async function loadPayments() {
  const { pickerFrom: from, pickerTo: to } = state;
  showTableState('<span class="spinner"></span>Loading payments…');
  try {
    const data = await api('/api/payments?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to));
    const rawPayments = data?.payments || [];
    // Sort by date+time DESC on client side too
    rawPayments.sort((a, b) => {
      const da = String(a.created_at || a.date || '');
      const db2 = String(b.created_at || b.date || '');
      return db2.localeCompare(da);
    });
    state.payments = rawPayments;
    state.totals = data?.totals || null;
    populateBarberFilter();
    renderAll();
    document.getElementById('subLine').textContent =
      \`\${state.payments.length} transactions • \${fmtDateFull(from)} → \${fmtDateFull(to)}\`;
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
function hideTableState() { document.getElementById('tableState').style.display = 'none'; }

function populateBarberFilter() {
  const sel = document.getElementById('fBarber');
  const cur = sel.value;
  const names = [...new Set(state.payments.map(p => p.barber_name).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">All barbers</option>';
  names.forEach(n => { const opt = document.createElement('option'); opt.value = n; opt.textContent = n; sel.appendChild(opt); });
  if (cur) sel.value = cur;
}

// ── Filter + render ───────────────────────────────────────────
function filtered() {
  const { q, barber, status, method } = state.filter;
  const ql = q.toLowerCase();
  return state.payments.filter(p => {
    if (barber && p.barber_name !== barber && p.barber_id !== barber) return false;
    if (status && p.status !== status) return false;
    if (method && p.method !== method) return false;
    if (ql) {
      const hay = [p.client_name, p.note, p.id, p.square_id, p.barber_name].join(' ').toLowerCase();
      if (!hay.includes(ql)) return false;
    }
    return true;
  });
}

function renderAll() {
  hideTableState();
  const list = filtered();
  document.getElementById('countBadge').textContent = list.length + ' txn';

  // KPI strip from filtered
  const gross = list.reduce((s,p)=>(s + p.amount + (p.tip||0)), 0);
  const tips  = list.reduce((s,p)=>(s + (p.tip||0)), 0);
  const fees  = list.reduce((s,p)=>(s + (p.fee||0)), 0);
  const net   = list.reduce((s,p)=>(s + (p.net||0)), 0);
  document.getElementById('kGross').textContent = fmtMoney(gross);
  document.getElementById('kTips').textContent  = fmtMoney(tips);
  document.getElementById('kFees').textContent  = fmtMoney(fees);
  document.getElementById('kNet').textContent   = fmtMoney(net);

  if (!list.length) {
    document.getElementById('tbody').innerHTML = \`<tr><td colspan="8"><div class="state-msg">No transactions found.</div></td></tr>\`;
    return;
  }

  document.getElementById('tbody').innerHTML = list.map(p => {
    const sel = p.id === state.selectedId ? 'sel' : '';
    const termBadge = p.source === 'terminal'
      ? '<span class="chip terminal" style="margin-left:6px;font-size:9px;padding:2px 7px;vertical-align:middle;">Terminal</span>' : '';

    // Parse note: "ELEMENT • ClientName • Service • 10:00"
    const noteParts = String(p.note || '').split('•').map(s => s.trim());
    const noteClient  = noteParts[1] || '';
    const noteService = noteParts[2] || '';
    const noteTime    = noteParts[3] || '';

    // Best client name: booking > note > hide
    const rawName = String(p.client_name || '');
    const isSquareId = rawName.length > 14 && /^[A-Za-z0-9]{14,}$/.test(rawName.replace(/\\s/g,''));
    const clientDisplay = (!rawName || isSquareId)
      ? (noteClient || '') : rawName;

    // Avatar
    const av = clientDisplay ? initials(clientDisplay) : '–';

    // Sub-line: barber + service
    const barberPart  = p.barber_name || '';
    const servicePart = noteService || '';
    const sub = [barberPart, servicePart].filter(Boolean).join(' · ');

    return '<tr class="' + sel + '" data-id="' + esc(p.id) + '">' +
      '<td class="muted" style="font-size:12px;">' + esc(fmtDateShort(p.date)) + '</td>' +
      '<td style="max-width:0;"><div class="clientCell">' +
        '<div class="avatar" style="font-size:11px;flex:0 0 28px;width:28px;height:28px;">' + (clientDisplay ? esc(initials(clientDisplay)) : '–') + '</div>' +
        '<div class="nm" style="min-width:0;">' +
          '<div class="n" style="overflow:hidden;text-overflow:ellipsis;">' + (clientDisplay ? esc(clientDisplay) : '<span style="color:rgba(255,255,255,.3);">—</span>') + termBadge + '</div>' +
          (sub ? '<div class="p" style="overflow:hidden;text-overflow:ellipsis;">' + esc(sub) + '</div>' : '') +
        '</div>' +
      '</div></td>' +
      '<td style="font-size:11px;">' + esc(methodLabel(p.method)) + '</td>' +
      '<td><strong style="font-size:13px;">' + esc(fmtMoney(p.amount)) + '</strong></td>' +
      '<td class="muted" style="font-size:12px;">' + (p.tip > 0 ? esc(fmtMoney(p.tip)) : '—') + '</td>' +
      '<td>' + statusChip(p.status) + '</td>' +
      '</tr>';
  }).join('');

    document.querySelectorAll('#tbody tr').forEach(tr => {
    tr.addEventListener('click', () => { state.selectedId = tr.dataset.id; renderAll(); renderDetails(); });
  });

  renderDetails();
}

function renderDetails() {
  const p = state.payments.find(x => x.id === state.selectedId);
  const detEl = document.getElementById('details');
  const hintEl = document.getElementById('detHint');

  if (!p) {
    hintEl.textContent = 'Select a row';
    detEl.innerHTML = '<div class="muted" style="padding:6px;">Click any payment to view details.</div>';
    return;
  }

  // Parse note: "ELEMENT • ClientName • Service • 10:00"
  const noteParts = String(p.note || '').split('•').map(s => s.trim());
  const noteClient  = noteParts[1] || '';
  const noteService = noteParts[2] || '';
  const noteTime    = noteParts[3] || '';

  const rawName    = String(p.client_name || '');
  const isSquareId = rawName.length > 14 && /^[A-Za-z0-9]{14,}$/.test(rawName.replace(/\\s/g,''));
  const clientName  = (!rawName || isSquareId) ? (noteClient || '—') : rawName;
  const serviceName = noteService || '';
  const phoneDisplay = String(p.client_phone || '');

  hintEl.textContent = clientName !== '—' ? clientName : ((p.square_id || p.id).slice(0,16) + '…');

  const serviceShort = serviceName.length > 30 ? serviceName.slice(0,30) + '…' : serviceName;

  detEl.innerHTML =
    '<div class="block">' +
      '<div class="t">Client</div>' +
      '<div class="v" style="font-size:15px;font-weight:900;">' + esc(clientName) + '</div>' +
      (phoneDisplay ? '<div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,.65);">📞 ' + esc(phoneDisplay) + '</div>' : '') +
    '</div>' +
    '<div class="rows">' +
      '<div class="row"><div class="l">Barber</div><div class="r"><strong>' + esc(p.barber_name || '—') + '</strong></div></div>' +
      (serviceShort ? '<div class="row"><div class="l">Service</div><div class="r">' + esc(serviceShort) + '</div></div>' : '') +
      '<div class="row"><div class="l">Date</div><div class="r">' + esc(fmtDateFull(p.date)) + (noteTime ? ' · ' + esc(noteTime) : '') + '</div></div>' +
      '<div class="row"><div class="l">Method</div><div class="r">' + esc(methodLabel(p.method)) + '</div></div>' +
      '<div class="row"><div class="l">Status</div><div class="r">' + statusChip(p.status) + '</div></div>' +
    '</div>' +
    '<div class="rows">' +
      '<div class="row"><div class="l">Amount</div><div class="r">' + esc(fmtMoney(p.amount)) + '</div></div>' +
      '<div class="row"><div class="l">Tip</div><div class="r">' + esc(fmtMoney(p.tip || 0)) + '</div></div>' +
      '<div class="row"><div class="l">Square fee</div><div class="r">' + esc(fmtMoney(p.fee || 0)) + '</div></div>' +
      '<div class="row"><div class="l">Net</div><div class="r"><strong style="font-size:15px;">' + esc(fmtMoney(p.net)) + '</strong></div></div>' +
    '</div>' +
    '<div class="rows">' +
      '<div class="row" style="flex-direction:column;align-items:flex-start;gap:3px;">' +
        '<div class="l">Transaction ID</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,.35);word-break:break-all;font-family:monospace;line-height:1.4;">' + esc(p.square_id || p.id) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="det-actions">' +
      (p.status === 'paid' && p.square_id ? '<button class="btn small danger" id="btnRefund">Refund</button>' : '') +
      (p.receipt_url ? '<a href="' + esc(p.receipt_url) + '" target="_blank" rel="noopener" class="btn small">Receipt ↗</a>' : '') +
      (p.booking_id ? '<a href="/calendar" class="btn small">Open booking ↗</a>' : '') +
    '</div>';

  document.getElementById('btnRefund')?.addEventListener('click', () => openRefundModal(p));
}

// ── Refund modal ──────────────────────────────────────────────
const refundOverlay = document.getElementById('refundOverlay');
const refundWin     = document.getElementById('refundWin');
let _refundPayment  = null;

function openRefundModal(p) {
  _refundPayment = p;
  document.getElementById('rfBody').innerHTML =
    \`<strong>\${esc(p.client_name)}</strong><br/>\` +
    \`\${esc(methodLabel(p.method))} · \${esc(fmtMoney(p.amount))} + \${esc(fmtMoney(p.tip||0))} tip\`;
  document.getElementById('rfAmount').value = '';
  document.getElementById('rfReason').value = 'Requested by customer';
  refundOverlay.classList.add('show');
  refundWin.classList.add('open');
}
function closeRefundModal() {
  refundOverlay.classList.remove('show');
  refundWin.classList.remove('open');
  _refundPayment = null;
}

document.getElementById('rfCancel')?.addEventListener('click', closeRefundModal);
refundOverlay?.addEventListener('click', closeRefundModal);

document.getElementById('rfConfirm')?.addEventListener('click', async () => {
  if (!_refundPayment) return;
  const btn = document.getElementById('rfConfirm');
  btn.disabled = true; btn.textContent = 'Processing…';
  try {
    const amountRaw = document.getElementById('rfAmount').value;
    const amountCents = amountRaw ? Math.round(Number(amountRaw) * 100) : null;
    const reason = document.getElementById('rfReason').value || 'Requested by customer';
    await api(\`/api/payments/refund/\${encodeURIComponent(_refundPayment.square_id)}\`, {
      method: 'POST',
      body: { reason, ...(amountCents ? { amount_cents: amountCents } : {}) }
    });
    closeRefundModal();
    await loadPayments();
    alert('Refund processed successfully.');
  } catch(e) {
    alert('Refund error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Refund';
  }
});

// ── Filters ───────────────────────────────────────────────────
document.getElementById('q')?.addEventListener('input', e => { state.filter.q = e.target.value; renderAll(); });
document.getElementById('fBarber')?.addEventListener('change', e => { state.filter.barber = e.target.value; renderAll(); });
document.getElementById('fStatus')?.addEventListener('change', e => { state.filter.status = e.target.value; renderAll(); });
document.getElementById('fMethod')?.addEventListener('change', e => { state.filter.method = e.target.value; renderAll(); });
document.getElementById('btnRefresh')?.addEventListener('click', loadPayments);

// ── Export CSV ────────────────────────────────────────────────
document.getElementById('btnExport')?.addEventListener('click', () => {
  const list = filtered();
  const header = ['Date','Client','Barber','Method','Amount','Tip','Fee','Net','Status','Note','ID'];
  const lines = [header.join(',')];
  list.forEach(p => lines.push([
    p.date, \`"\${p.client_name}"\`, \`"\${p.barber_name||''}"\`,
    methodLabel(p.method), p.amount.toFixed(2), (p.tip||0).toFixed(2),
    (p.fee||0).toFixed(2), (p.net||0).toFixed(2), p.status,
    \`"\${(p.note||'').replace(/"/g,"'")}"\`, p.square_id||p.id
  ].join(',')));
  const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = \`payments_\${state.pickerFrom}_\${state.pickerTo}.csv\`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

// ── Init ──────────────────────────────────────────────────────
loadShopSettings().then(() => loadPayments());

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
