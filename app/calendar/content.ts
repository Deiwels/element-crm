export const pageContent = `
<style>
    :root{
      --bg:#000; --fg:#e9e9e9; --muted:#9ea0a3;
      --glass:rgba(255,255,255,.06); --glass2:rgba(255,255,255,.10);
      --line:rgba(255,255,255,.10);
      --gold:#ffcf3f;
      --blue:#0a84ff;
      --ok:#8ff0b1;
      --danger:#ff6b6b;
      --radius:18px;

      --slotH: 44px;
      --startHour: 0;
      --endHour: 24;

      --c0:#99d100; --c1:#a86bff; --c2:#0a84ff; --c3:#ffb000; --c4:#ff5aa5; --c5:#35d6c7; --c6:#ff6b6b;
    }

    *{box-sizing:border-box}
    html,body{height:100%; margin:0; background:var(--bg); color:var(--fg); font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;}

    a,a:link,a:visited,a:hover,a:active,a:focus{
      color:#fff !important;
      text-decoration:none !important;
      -webkit-text-fill-color:#fff !important;
    }
    .sidebar .nav a,.sidebar .nav a *{color:#fff !important;-webkit-text-fill-color:#fff !important;}
    .sidebar .nav a svg,.sidebar .nav a svg *{fill:#fff !important;stroke:#fff !important;}
    .sidebar .nav a .label .s{color:rgba(255,255,255,.45) !important;-webkit-text-fill-color:rgba(255,255,255,.45) !important;}

    button,input,select{font-family:inherit}
    input,select,button{-webkit-tap-highlight-color:transparent;}

    .app{min-height:100vh;display:grid;grid-template-columns:280px 1fr;}
    @media (max-width:980px){.app{grid-template-columns:1fr;}}

    .sidebar{
      border-right:1px solid var(--line);
      background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
      backdrop-filter:blur(18px);
      padding:18px 16px;
      position:sticky;top:0;height:100vh;overflow:auto;
    }
    @media (max-width:980px){.sidebar{display:none;}}

    .brand{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 10px 16px;border-bottom:1px solid var(--line);margin-bottom:14px;}
    .brand h1{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;font-size:14px;text-transform:uppercase;}
    .brand .tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12);padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.04);}

    .nav{display:flex;flex-direction:column;gap:8px;padding:8px;}
    .nav a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.10);transition:all .18s ease;}
    .nav a:hover{background:rgba(255,255,255,.06);}
    .nav a.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.12);}
    .left{display:flex;align-items:center;gap:10px;min-width:0;}
    .ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;}
    .label{min-width:0;display:flex;flex-direction:column;gap:2px;}
    .label .t{font-weight:900;letter-spacing:.02em;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .label .s{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .pill{font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.70);flex:0 0 auto;}
    .pill.blue{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;}

    .main{padding:18px 18px 28px;max-width:1600px;margin:0 auto;width:100%;}
    @media (max-width:560px){.main{padding:12px 12px 24px;}}

    .topbar{position:sticky;top:0;z-index:20;padding:10px 0 12px;background:linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.70),rgba(0,0,0,0));backdrop-filter:blur(14px);}
    .topbar-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
    .page-title{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:16px;}
    .sub{margin:6px 0 0;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}

    .controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
    .btn{height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-weight:900;letter-spacing:.02em;transition:all .18s ease;white-space:nowrap;}
    .btn:hover{background:rgba(255,255,255,.08);transform:translateY(-1px);}
    .btn.primary{border-color:rgba(10,132,255,.80);box-shadow:0 0 0 1px rgba(10,132,255,.20) inset,0 0 18px rgba(10,132,255,.25);background:rgba(0,0,0,.75);}

    .search{height:44px;width:min(360px,72vw);border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 14px;outline:none;}
    .search:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}

    .shell{margin-top:14px;border-radius:var(--radius);border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 10px 40px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);backdrop-filter:blur(16px);overflow:auto;-webkit-overflow-scrolling:touch;}

    :root{--colMin:190px;}
    @media (max-width:560px){:root{--colMin:168px;}}

    .cal-head{display:grid;grid-template-columns:90px 1fr;border-bottom:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);min-width:calc(90px + (var(--dayCols) * var(--colMin)));}
    .cal-head .left{padding:12px 12px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);font-size:12px;letter-spacing:.10em;text-transform:uppercase;border-right:1px solid rgba(255,255,255,.10);position:sticky;left:0;z-index:5;background:rgba(0,0,0,.22);backdrop-filter:blur(12px);}

    .days{display:grid;grid-template-columns:repeat(var(--dayCols),minmax(var(--colMin),1fr));}
    .daycell{padding:10px 10px;border-right:1px solid rgba(255,255,255,.08);display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-height:56px;min-width:var(--colMin);}
    .daycell:last-child{border-right:none;}

    .barberTop{display:flex;gap:10px;align-items:flex-start;min-width:0;}
    .barberDot{width:10px;height:10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);box-shadow:0 0 0 1px rgba(0,0,0,.35) inset;flex:0 0 auto;margin-top:3px;}
    .barberPhoto{width:32px;height:32px;border-radius:12px;object-fit:cover;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);flex:0 0 auto;}
    .barberName{font-weight:900;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .barberSub{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

    .cal-body{display:grid;grid-template-columns:90px 1fr;height:calc((var(--endHour) - var(--startHour)) * 2 * var(--slotH));position:relative;min-width:calc(90px + (var(--dayCols) * var(--colMin)));}
    .times{border-right:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.12);position:relative;position:sticky;left:0;z-index:4;backdrop-filter:blur(12px);}
    .times .t{position:absolute;left:0;right:0;height:calc(var(--slotH) * 2);display:flex;align-items:flex-start;justify-content:center;padding-top:10px;color:rgba(255,255,255,.55);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}

    .grid{position:relative;display:grid;grid-template-columns:repeat(var(--dayCols),minmax(var(--colMin),1fr));background:rgba(0,0,0,.06);min-height:100%;}
    .col{position:relative;border-right:1px solid rgba(255,255,255,.08);overflow:hidden;min-width:var(--colMin);}
    .col:last-child{border-right:none;}
    .offHours{position:absolute;left:0;right:0;background:rgba(255,255,255,.04);pointer-events:none;z-index:2;}
    .offHours.top{top:0;}
    .offHours.bottom{bottom:0;}

    .slotline{position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,.06);pointer-events:none;}
    .slotline.strong{background:rgba(255,255,255,.10);}

    .nowLine{position:absolute;left:0;right:0;height:2px;background:rgba(10,132,255,.95);box-shadow:0 0 0 1px rgba(10,132,255,.35),0 0 22px rgba(10,132,255,.35);pointer-events:none;z-index:30;}
    .nowDot{position:absolute;left:8px;width:10px;height:10px;border-radius:999px;background:rgba(10,132,255,.95);top:-4px;box-shadow:0 0 0 3px rgba(10,132,255,.18),0 0 18px rgba(10,132,255,.35);}
    .nowLabel{position:absolute;right:10px;top:-16px;font-size:11px;letter-spacing:.10em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(10,132,255,.45);background:rgba(10,132,255,.14);color:#d7ecff;backdrop-filter:blur(10px);}

    .event{position:absolute;left:8px;right:8px;border-radius:16px;border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 24px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.03);padding:10px 10px 8px;cursor:grab;user-select:none;touch-action:none;overflow:hidden;}
    .event:active{cursor:grabbing;}
    .event .top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
    .event .name{font-weight:900;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .event .meta{margin-top:6px;font-size:12px;color:rgba(255,255,255,.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

    .event[data-color="c0"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c0) 32%,transparent),color-mix(in oklab,var(--c0) 16%,transparent));}
    .event[data-color="c1"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c1) 32%,transparent),color-mix(in oklab,var(--c1) 16%,transparent));}
    .event[data-color="c2"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c2) 32%,transparent),color-mix(in oklab,var(--c2) 16%,transparent));}
    .event[data-color="c3"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c3) 32%,transparent),color-mix(in oklab,var(--c3) 16%,transparent));}
    .event[data-color="c4"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c4) 32%,transparent),color-mix(in oklab,var(--c4) 16%,transparent));}
    .event[data-color="c5"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c5) 32%,transparent),color-mix(in oklab,var(--c5) 16%,transparent));}
    .event[data-color="c6"]{background:linear-gradient(180deg,color-mix(in oklab,var(--c6) 32%,transparent),color-mix(in oklab,var(--c6) 16%,transparent));}

    .chip{font-size:10px;letter-spacing:.10em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.15);color:rgba(255,255,255,.80);flex:0 0 auto;}
    .chip.ok{border-color:rgba(143,240,177,.35);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .chip.done{border-color:rgba(255,207,63,.35);background:rgba(255,207,63,.08);color:#ffe9a3;}
    .chip.noshow{border-color:rgba(255,107,107,.35);background:rgba(255,107,107,.10);color:#ffd0d0;}
    .chip.paid{border-color:rgba(143,240,177,.40);background:rgba(143,240,177,.12);color:#d6ffe8;}

    .resize{position:absolute;left:10px;right:10px;bottom:6px;height:10px;border-radius:999px;background:rgba(255,255,255,.18);cursor:ns-resize;}
    .col.drop-ok{outline:2px solid rgba(10,132,255,.35);outline-offset:-2px;}

    .modalWrap{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:18px;z-index:80;overflow:auto;-webkit-overflow-scrolling:touch;}
    .modalWrap.open{display:flex;}
    .modal{width:min(760px,95vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));backdrop-filter:blur(18px);box-shadow:0 20px 80px rgba(0,0,0,.6);padding:14px;max-height:calc(100vh - 48px);overflow:auto;}

    #settingsWrap .modal{width:min(920px,96vw);max-height:calc(100vh - 48px);overflow:auto;padding:12px;}
    .modal h3{margin:6px 6px 10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.70);}
    .hint{font-size:12px;color:rgba(255,255,255,.55);padding:0 6px 6px;}
    .form{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:6px;}
    .field{display:flex;flex-direction:column;gap:6px;}
    .field label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);}
    .field input,.field select{height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 12px;outline:none;}
    .field input:focus,.field select:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
    .modalFooter{display:flex;gap:10px;justify-content:flex-end;padding:10px 6px 6px;flex-wrap:wrap;}
    @media (max-width:760px){.form{grid-template-columns:1fr;}}

    .payBlock{margin:10px 6px 0;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);}
    .pay-method-btn{height:40px;font-size:12px;letter-spacing:.04em;transition:all .18s ease;}
    .pay-method-btn.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 14px rgba(10,132,255,.25);background:rgba(10,132,255,.14);color:#d7ecff;}
    .pay-method-btn.active[data-method="cash"]{border-color:rgba(143,240,177,.65);background:rgba(143,240,177,.10);color:#c9ffe1;box-shadow:0 0 14px rgba(143,240,177,.18);}
    .pay-method-btn.active[data-method="zelle"]{border-color:rgba(106,0,255,.75);background:rgba(106,0,255,.14);color:#d8b4fe;box-shadow:0 0 14px rgba(106,0,255,.25);}
    .pay-method-btn.active[data-method="other"]{border-color:rgba(255,207,63,.65);background:rgba(255,207,63,.10);color:#fff3b0;box-shadow:0 0 14px rgba(255,207,63,.18);}
    .pay-tip-btn{transition:all .18s ease;}
    .pay-tip-btn.active{border-color:rgba(10,132,255,.65);background:rgba(10,132,255,.14);color:#d7ecff;}
    .pay-tip-btn[data-tip="yes"].active{border-color:rgba(143,240,177,.65);background:rgba(143,240,177,.10);color:#c9ffe1;}
    .pay-tip-btn[data-tip="no"].active{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;}
    .payRow{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;}
    .payTitle{font-weight:900;letter-spacing:.02em;}
    .payMeta{font-size:12px;color:rgba(255,255,255,.60);letter-spacing:.08em;text-transform:uppercase;}
    .payStatus{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}

    .tabs{display:flex;gap:8px;padding:6px;flex-wrap:wrap;}
    .tabs button{height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.85);cursor:pointer;font-weight:900;letter-spacing:.02em;}
    .tabs button.active{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;}
    .panel{display:none;}
    .panel.open{display:block;}
    .sList{display:flex;flex-direction:column;gap:8px;padding:6px;}
    .row{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);border-radius:14px;}
    .rowLeft{display:flex;flex-direction:column;gap:2px;min-width:0;}
    .rowName{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .rowMeta{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .rowActions{display:flex;gap:8px;flex-wrap:wrap;}
    .danger{border-color:rgba(255,107,107,.35)!important;background:rgba(255,107,107,.10)!important;}

    .authWrap{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:18px;z-index:120;}
    .authWrap.open{display:flex;}
    .authCard{width:min(560px,95vw);border-radius:22px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));backdrop-filter:blur(18px);box-shadow:0 20px 80px rgba(0,0,0,.65);padding:16px;}
    .authHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:6px 6px 12px;border-bottom:1px solid rgba(255,255,255,.10);}
    .authTitle{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:14px;}
    .authSub{margin-top:6px;color:rgba(255,255,255,.45);font-size:12px;letter-spacing:.10em;text-transform:uppercase;}
    .authGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 6px 6px;}
    @media (max-width:560px){.authGrid{grid-template-columns:1fr;}}
    .authActions{display:flex;gap:10px;justify-content:flex-end;padding:10px 6px 6px;flex-wrap:wrap;}
    .authErr{display:none;padding:8px 10px;margin:10px 6px 0;border-radius:14px;border:1px solid rgba(255,107,107,.35);background:rgba(255,107,107,.10);color:#ffd0d0;font-size:13px;}

    /* Per-day schedule grid */
    .sched-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:8px 0;}
    .sched-day{display:flex;flex-direction:column;gap:4px;border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:8px 6px;background:rgba(0,0,0,.18);transition:border-color .18s,background .18s;}
    .sched-day.on{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.08);}
    .sched-day.off{opacity:.45;}
    .sched-day-name{font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center;font-weight:900;color:rgba(255,255,255,.65);}
    .sched-toggle{height:28px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;transition:all .18s;width:100%;}
    .sched-day.on .sched-toggle{border-color:rgba(10,132,255,.65);background:rgba(10,132,255,.16);color:#d7ecff;}
    .sched-time{display:flex;flex-direction:column;gap:3px;}
    .sched-time label{font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.40);}
    .sched-time input[type=time]{height:30px;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.22);color:#fff;padding:0 6px;font-size:11px;outline:none;width:100%;color-scheme:dark;}
    .sched-time input[type=time]:focus{border-color:rgba(10,132,255,.45);}
    .sched-day.off .sched-time{opacity:.3;pointer-events:none;}
    @media(max-width:640px){.sched-grid{grid-template-columns:repeat(4,1fr);}}
    .topUserPill{font-size:11px;letter-spacing:.10em;text-transform:uppercase;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:rgba(255,255,255,.75);}

    .calModalHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0 10px;border-bottom:1px solid rgba(255,255,255,.10);margin-bottom:10px;}
    .calModalTitle{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;text-transform:uppercase;font-size:13px;}
    .calMonthBar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0 10px;}
    .calMonthName{font-weight:900;letter-spacing:.02em;}
    .calMonthActions{display:flex;gap:8px;align-items:center;}
    .calWeekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;padding:0 2px 8px;}
    .calWeekdays div{font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);text-align:center;}
    .calGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;padding:0 2px 8px;}
    .calDayBtn{height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);color:#fff;cursor:pointer;font-weight:900;letter-spacing:.02em;transition:all .18s ease;}
    .calDayBtn:hover{background:rgba(255,255,255,.06);transform:translateY(-1px);}
    .calDayBtn.muted{opacity:.35;}
    .calDayBtn.today{border-color:rgba(255,207,63,.55);box-shadow:0 0 0 1px rgba(255,207,63,.18) inset;}
    .calDayBtn.selected{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.18);background:rgba(10,132,255,.12);}

    @media (max-width:980px){
      .app{grid-template-columns:1fr;}
      .sidebar{position:fixed;inset:0 auto 0 0;width:300px;transform:translateX(-110%);transition:transform .22s ease;z-index:130;}
      .sidebar.open{transform:translateX(0);}
      .backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:125;}
      .backdrop.open{display:block;}
      .burger{display:inline-flex;align-items:center;justify-content:center;}
    }
    .burger{display:none;height:44px;width:44px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;}

    /* Lightbox */
    #photoLightbox{position:fixed;inset:0;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out;backdrop-filter:blur(12px);}
    #photoLightbox.open{display:flex;}
    #photoLightbox img{max-width:90vw;max-height:88vh;border-radius:18px;border:1px solid rgba(255,255,255,.12);object-fit:contain;box-shadow:0 30px 80px rgba(0,0,0,.6);}
    #photoLightbox .close-btn{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;}

    /* Drag Confirm Modal */
    #dragConfirm{position:fixed;inset:0;background:rgba(0,0,0,.65);display:none;align-items:center;justify-content:center;z-index:9000;backdrop-filter:blur(12px);}
    #dragConfirm.open{display:flex;}
    #dragConfirmCard{width:min(380px,92vw);border-radius:22px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04));backdrop-filter:blur(20px);box-shadow:0 24px 80px rgba(0,0,0,.55);padding:20px;}
    #dragConfirmTitle{font-family:"Julius Sans One",sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:13px;color:rgba(255,255,255,.75);margin:0 0 14px;}
    #dragConfirmBody{font-size:15px;font-weight:600;color:#fff;line-height:1.5;margin-bottom:20px;}
    #dragConfirmBody .time{color:#0a84ff;font-size:22px;font-weight:800;letter-spacing:.02em;display:block;margin:8px 0 4px;}
    #dragConfirmBody .barber-tag{font-size:12px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.55);}
    .dragConfirmBtns{display:flex;gap:10px;justify-content:flex-end;}
  
    /* ── Unified sidebar ── */
    .app{min-height:100vh;display:grid;grid-template-columns:280px 1fr;}
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
      .main{padding-top:72px!important;}
    }
    @media(min-width:981px){
      .burger{display:none;}
      .sidebar-backdrop{display:none!important;}
    }
  </style>

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
      <button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>
  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
  <aside class="sidebar" id="sidebar">
    <div class="brand">
      <div><h1>Element CRM</h1><div style="font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-top:4px;">CALENDAR</div></div>
      <div class="brand-tag">v2</div>
    </div>
    <nav class="nav">
      <a  href="/dashboard">
        <div class="nav-left"><div class="nav-ico">⌂</div><div class="nav-label"><div class="nav-t">Dashboard</div><div class="nav-sub">Today overview</div></div></div>
        <span class="nav-pill ">—</span>
      </a>
      <a class="active" href="/calendar">
        <div class="nav-left"><div class="nav-ico">⌁</div><div class="nav-label"><div class="nav-t">Calendar</div><div class="nav-sub">Bookings grid</div></div></div>
        <span class="nav-pill blue">Day</span>
      </a>
      <a  href="/clients">
        <div class="nav-left"><div class="nav-ico">⟡</div><div class="nav-label"><div class="nav-t">Clients</div><div class="nav-sub">Search / notes</div></div></div>
        <span class="nav-pill ">—</span>
      </a>
      <a  href="/payments">
        <div class="nav-left"><div class="nav-ico">$</div><div class="nav-label"><div class="nav-t">Payments</div><div class="nav-sub">Square + Terminal</div></div></div>
        <span class="nav-pill live">Live</span>
      </a>
      <a  href="/payroll">
        <div class="nav-left"><div class="nav-ico">%</div><div class="nav-label"><div class="nav-t">Payroll</div><div class="nav-sub">Commission + tips</div></div></div>
        <span class="nav-pill ">—</span>
      </a>
      <a  href="/settings">
        <div class="nav-left"><div class="nav-ico">⚙</div><div class="nav-label"><div class="nav-t">Settings</div><div class="nav-sub">Config & sync</div></div></div>
        <span class="nav-pill ">—</span>
      </a>
    </nav>
  <div id="authUserBar" style="padding:8px;border-top:1px solid rgba(255,255,255,.08);margin-top:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16);">
      <div style="min-width:0;">
        <div id="authUserName" style="font-weight:900;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e9e9e9;">—</div>
        <div id="authUserRole" style="font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.40);margin-top:2px;">—</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button onclick="openChangePassword()" title="Change password" style="height:32px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-size:12px;font-family:inherit;">PW</button>
        <button onclick="window.ELEMENT_AUTH&&window.ELEMENT_AUTH.logout()" style="height:32px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,107,107,.30);background:rgba(255,107,107,.06);color:#ffd0d0;cursor:pointer;font-size:11px;font-family:inherit;">Out</button>
      </div>
    </div>
  </div>
  <div id="pwModalOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9500;opacity:0;pointer-events:none;transition:opacity .22s;"></div>
  <div id="pwModal" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:min(360px,90vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98));box-shadow:0 24px 80px rgba(0,0,0,.7);padding:24px;z-index:9501;opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;">
    <div style="font-family:'Julius Sans One',sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:rgba(255,255,255,.45);margin-bottom:14px;">Change password</div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <input id="pwCurrent" type="password" placeholder="Current password" style="height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.30);color:#fff;padding:0 14px;font-family:inherit;font-size:14px;outline:none;"/>
      <input id="pwNew" type="password" placeholder="New password" style="height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.30);color:#fff;padding:0 14px;font-family:inherit;font-size:14px;outline:none;"/>
      <input id="pwConfirm" type="password" placeholder="Confirm new password" style="height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.30);color:#fff;padding:0 14px;font-family:inherit;font-size:14px;outline:none;"/>
      <div id="pwError" style="font-size:12px;color:#ffd0d0;display:none;padding:8px 12px;border-radius:8px;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.25);"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
        <button onclick="closePwModal()" style="height:40px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-weight:700;font-family:inherit;">Cancel</button>
        <button id="pwSaveBtn" onclick="doChangePassword()" style="height:40px;padding:0 20px;border-radius:999px;border:1px solid rgba(10,132,255,.65);background:rgba(10,132,255,.16);color:#d7ecff;cursor:pointer;font-weight:900;font-family:inherit;">Save</button>
      </div>
    </div>
  </div>
  </aside>

    <main class="main">
      <div class="topbar">
        <div class="topbar-row">
          <div style="min-width:0">
            <h2 class="page-title">Calendar</h2>
            <p class="sub" id="rangeLine">—</p>
          </div>
          <div class="controls">
            <button class="btn" id="dateBtn">Date</button>
            <button class="btn" id="prev">←</button>
            <button class="btn" id="today">Today</button>
            <button class="btn" id="next">→</button>
            <input class="search" id="search" placeholder="Search (client / barber / service) …" />
            <button class="btn" id="settingsBtn">Settings</button>
            <button class="btn primary" id="new">+ New booking</button>
            <span class="topUserPill" id="whoami">Guest</span>
          </div>
        </div>
      </div>

      <section class="shell" aria-label="Calendar">
        <div class="cal-head">
          <div class="left">Time</div>
          <div class="days" id="daysHead"></div>
        </div>
        <div class="cal-body">
          <div class="times" id="times"></div>
          <div class="grid" id="grid"></div>
        </div>
      </section>
    </main>
  </div>

  <!-- Booking Modal -->
  <div class="modalWrap" id="modalWrap" role="dialog" aria-modal="true" aria-label="Booking">
    <div class="modal">
      <h3>Appointment</h3>
      <div class="hint" id="mHint">—</div>
      <div class="form">
        <div class="field" style="grid-column:1 / -1;">
          <label>Client (search or type new)</label>
          <input id="mClient" list="clientList" placeholder="Client name" autocomplete="off"/>
          <datalist id="clientList"></datalist>
        </div>
        <div class="field">
          <label>Barber</label>
          <select id="mBarber"></select>
        </div>
        <div class="field">
          <label>Service</label>
          <select id="mService"></select>
        </div>
        <div class="field" id="statusWrap" style="display:none;">
          <label>Status</label>
          <select id="mStatus">
            <option value="booked">Booked</option>
            <option value="arrived">Arrived</option>
            <option value="done">Done</option>
            <option value="noshow">No-show</option>
          </select>
        </div>
        <div class="field">
          <label>Date</label>
          <input id="mDate" type="date"/>
        </div>
        <div class="field">
          <label>Time</label>
          <select id="mStart"></select>
        </div>
        <div class="field">
          <label>Duration</label>
          <select id="mDur" disabled></select>
        </div>
        <div class="field">
          <label>Phone (optional)</label>
          <input id="mPhone" placeholder="+1 (___) ___-____"/>
        </div>
        <div class="field" style="grid-column:1 / -1;">
          <label>Notes (optional)</label>
          <input id="mNotes" placeholder="Any notes…"/>
        </div>
      </div>
      <div class="payBlock" id="payBlock" style="display:none;">
        <div class="payRow">
          <div>
            <div class="payTitle">Accept payment</div>
            <div class="payMeta" id="payMeta">Choose method</div>
          </div>
          <div class="payStatus" id="payStatus"></div>
        </div>
        <div style="height:8px"></div>
        <!-- Price summary row -->
        <div id="paySummary" style="display:none;padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.18);font-size:13px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(255,255,255,.55);">Service</span>
            <span id="paySvcAmt">—</span>
          </div>
          <div id="payTaxRow" style="display:none;margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(255,255,255,.45);font-size:12px;" id="payTaxLabel">Tax</span>
            <span style="color:rgba(255,255,255,.65);font-size:12px;" id="payTaxAmt">—</span>
          </div>
          <div id="payTotalRow" style="display:none;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:900;">Total</span>
            <span style="font-weight:900;" id="payTotalAmt">—</span>
          </div>
        </div>
        <!-- Method buttons -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;" id="payMethodBtns">
          <button class="btn pay-method-btn" data-method="terminal" id="payBtn" style="flex:1;min-width:110px;">Terminal</button>
          <button class="btn pay-method-btn" data-method="cash" style="flex:1;min-width:70px;">Cash</button>
          <button class="btn pay-method-btn" data-method="zelle" style="flex:1;min-width:70px;">Zelle</button>
          <button class="btn pay-method-btn" data-method="other" style="flex:1;min-width:70px;">Other</button>
        </div>
        <!-- Tip section (Zelle/Other only) -->
        <div id="payTipSection" style="display:none;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.14);margin-bottom:8px;">
          <div style="font-size:12px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.50);margin-bottom:8px;">Did client leave a tip?</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button class="btn pay-tip-btn" data-tip="no" style="height:34px;font-size:12px;padding:0 14px;flex:1;" id="tipBtnNo">No tip</button>
            <button class="btn pay-tip-btn" data-tip="yes" style="height:34px;font-size:12px;padding:0 14px;flex:1;" id="tipBtnYes">Yes, tip</button>
            <div id="payTipInputWrap" style="display:none;flex:1;min-width:100px;">
              <input id="payTipInput" type="number" min="0" step="0.01" placeholder="Tip amount $"
                style="height:34px;width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.22);color:#fff;padding:0 10px;outline:none;font-size:13px;"/>
            </div>
          </div>
        </div>
        <!-- Cash note -->
        <div id="payCashNote" style="display:none;padding:8px 12px;border-radius:10px;background:rgba(143,240,177,.07);border:1px solid rgba(143,240,177,.20);font-size:12px;color:rgba(143,240,177,.9);margin-bottom:8px;">
          Cash collected by barber directly. No tip tracking needed.
        </div>
        <!-- Confirm button — appears after method selected -->
        <button id="payConfirmBtn" style="display:none;width:100%;height:42px;margin-top:6px;border-radius:14px;border:1px solid rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.14);color:#d7ecff;font-weight:900;font-size:13px;letter-spacing:.04em;cursor:pointer;transition:all .18s ease;">
          Confirm payment
        </button>
        <span class="hint" id="payHint" style="padding:4px 0;display:block;">—</span>
      </div>
      <div class="modalFooter">
        <button class="btn danger" id="mDelete">Delete</button>
        <button class="btn" id="mClose">Close</button>
        <button class="btn primary" id="mSave">Save</button>
      </div>
    </div>
  </div>

  <!-- Date Picker Modal -->
  <div class="modalWrap" id="dateWrap" role="dialog" aria-modal="true" aria-label="Choose date">
    <div class="modal">
      <div class="calModalHead">
        <div>
          <h3 class="calModalTitle">Choose date</h3>
          <div class="hint" style="padding:0;margin:6px 0 0;">Select a day to open CRM calendar.</div>
        </div>
        <button class="btn" id="dateClose">Close</button>
      </div>
      <div class="calMonthBar">
        <div class="calMonthActions">
          <button class="btn" id="datePrev">←</button>
          <button class="btn" id="dateNext">→</button>
        </div>
        <div class="calMonthName" id="dateMonthName">—</div>
        <button class="btn" id="dateToday">Today</button>
      </div>
      <div class="calWeekdays" aria-hidden="true">
        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
      </div>
      <div class="calGrid" id="dateGrid"></div>
      <div class="modalFooter">
        <div class="hint" style="padding:0;margin:0;">Click any day — it opens instantly.</div>
        <div style="flex:1"></div>
      </div>
    </div>
  </div>

  <!-- Settings Modal -->
  <div class="modalWrap" id="settingsWrap" role="dialog" aria-modal="true" aria-label="Settings">
    <div class="modal">
      <h3>Settings</h3>
      <div class="hint">Services + Clients + Barbers + Account.</div>
      <div class="tabs">
        <button id="tabBarbers" class="active">Barbers</button>
        <button id="tabServices">Services</button>
        <button id="tabClients">Clients</button>
        <button id="tabPins">PINs</button>
        <button id="tabAccount">Account</button>
      </div>

      <div class="panel open" id="panelBarbers">
        <div class="hint">Add new barber with CRM login, password/PIN, public profile, price, off days, radar stats, and photo.</div>
        <div class="form" id="addBarberForm" style="padding:6px;">
          <div class="field"><label>Barber name</label><input id="bName" placeholder="Nazar"/></div>
          <div class="field"><label>Level</label><input id="bLevel" placeholder="Senior / Expert / Ambassador"/></div>
          <div class="field"><label>Login</label><input id="bUsername" placeholder="nazar"/></div>
          <div class="field"><label>Password / PIN</label><input id="bPassword" placeholder="1234"/></div>
          <div class="field"><label>Public role</label><input id="bRolePublic" placeholder="Ambassador"/></div>
          <div class="field"><label>Base price</label><input id="bPrice" placeholder="55.99" inputmode="decimal"/></div>
          <div class="field" style="grid-column:1 / -1;"><label>About</label><input id="bAbout" placeholder="Strong detail work…"/></div>
          <div class="field"><label>Off days (comma separated)</label><input id="bOffDays" placeholder="Thu"/></div>
          <div class="field"><label>Public enabled</label><select id="bPublicEnabled"><option value="true" selected>Yes</option><option value="false">No</option></select></div>
          <div class="field"><label>Radar labels</label><input id="bRadarLabels" value="FADE,LONG,BEARD,STYLE,DETAIL"/></div>
          <div class="field"><label>Radar values</label><input id="bRadarValues" value="4.5,4.5,4.5,4.5,4.5"/></div>
          <div class="field" style="grid-column:1 / -1;"><label>Photo</label><input id="bPhoto" type="file" accept="image/*"/></div>
          <div class="field" style="grid-column:1 / -1;"><button class="btn primary" id="bAdd">+ Add barber</button></div>
        </div>
        <div class="sList" id="barbersList"></div>
      </div>

      <div class="panel" id="panelServices">
        <div class="hint">Create services, then assign them to barbers.</div>
        <div class="form" style="padding:6px;">
          <div class="field"><label>Service name</label><input id="sName" placeholder="Men's Haircut"/></div>
          <div class="field"><label>Duration (min)</label><select id="sDur"><option value="30">30</option><option value="40">40</option><option value="45">45</option><option value="60">60</option><option value="75">75</option><option value="90">90</option></select></div>
          <div class="field"><label>Price (optional)</label><input id="sPrice" placeholder="45" inputmode="numeric"/></div>
          <div class="field"><label>Assign to barber</label><select id="sBarber"></select></div>
          <div class="field" style="grid-column:1 / -1;"><button class="btn primary" id="sAdd">+ Add / Assign service</button></div>
        </div>
        <div class="sList" id="servicesList"></div>
      </div>

      <div class="panel" id="panelClients">
        <div class="hint">Client database (local).</div>
        <div class="form" style="padding:6px;">
          <div class="field"><label>Client name</label><input id="cName" placeholder="Client name"/></div>
          <div class="field"><label>Phone</label><input id="cPhone" placeholder="+1 (___) ___-____"/></div>
          <div class="field" style="grid-column:1 / -1;"><label>Notes</label><input id="cNotes" placeholder="Notes…"/></div>
          <div class="field" style="grid-column:1 / -1;"><button class="btn primary" id="cAdd">+ Add client</button></div>
        </div>
        <div class="sList" id="clientsList"></div>
      </div>

      <div class="panel" id="panelPins">
        <div class="hint">Demo PINs (local).</div>
        <div class="form" style="padding:6px;">
          <div class="field"><label>Owner PIN</label><input id="pOwner" inputmode="numeric"/></div>
          <div class="field"><label>Reception PIN</label><input id="pReception" inputmode="numeric"/></div>
          <div class="field"><label>Barber PIN</label><input id="pBarber" inputmode="numeric"/></div>
          <div class="field" style="grid-column:1 / -1;"><button class="btn primary" id="pSave">Save PINs</button></div>
        </div>
      </div>

      <div class="panel" id="panelAccount">
        <div class="hint">Owner / Logout + API config.</div>
        <div class="sList">
          <div class="row">
            <div class="rowLeft"><div class="rowName">Current session</div><div class="rowMeta" id="accountWho">—</div></div>
            <div class="rowActions"><button class="btn danger" id="logoutBtn2">Logout</button></div>
          </div>
          <div class="row" style="align-items:flex-start;">
            <div class="rowLeft" style="flex:1;min-width:0;">
              <div class="rowName">API configuration</div>
              <div class="rowMeta">Paste your working backend URL here.</div>
              <div style="height:8px"></div>
              <div class="field" style="margin:0;"><label>API Base URL</label><input id="apiBaseInput" placeholder="https://…"/></div>
              <div style="height:8px"></div>
              <div class="field" style="margin:0;"><label>API Key (optional)</label><input id="apiKeyInput" placeholder=""/></div>
            </div>
            <div class="rowActions" style="align-items:flex-start;">
              <button class="btn" id="apiTestBtn">Test</button>
              <button class="btn primary" id="apiSaveBtn">Save</button>
            </div>
          </div>
          <div class="row" id="apiStatusRow" style="display:none;">
            <div class="rowLeft"><div class="rowName">API status</div><div class="rowMeta" id="apiStatusText">—</div></div>
            <div class="rowActions"><button class="btn" id="apiStatusClose">Close</button></div>
          </div>
        </div>
      </div>

      <div class="modalFooter"><button class="btn" id="settingsClose">Close</button></div>
    </div>
  </div>

  <!-- Auth Overlay -->
  <div class="authWrap" id="authWrap" role="dialog" aria-modal="true" aria-label="Login" style="display:none!important;">
    <div class="authCard">
      <div class="authHead">
        <div><h3 class="authTitle">Element CRM</h3><div class="authSub">Login</div></div>
        <div class="tag">v4</div>
      </div>
      <div class="authGrid">
        <div class="field"><label>Role</label><select id="aRole"><option value="owner">Owner</option><option value="reception">Reception</option><option value="barber">Barber</option></select></div>
        <div class="field" id="aBarberWrap" style="display:none;"><label>Barber</label><select id="aBarber"></select></div>
        <div class="field" style="grid-column:1 / -1;"><label>PIN</label><input id="aPin" placeholder="Enter PIN" inputmode="numeric"/></div>
      </div>
      <div class="authActions">
        <button class="btn" id="aClear">Clear</button>
        <button class="btn primary" id="aLogin">Login</button>
      </div>
      <div class="authErr" id="authErr">Error</div>
    </div>
  </div>

  <script>
let API_BASE = String(
      window.ELEMENT_CRM_API ||
      localStorage.getItem('ELEMENT_CRM_API') ||
      'https://element-crm-api-431945333485.us-central1.run.app'
    ).replace(/\\/+$/, '');

    let API_KEY = String(localStorage.getItem('ELEMENT_CRM_API_KEY') || '').trim();

    function setApiConfig(base, key){
      API_BASE = String(base || '').trim().replace(/\\/+$/, '');
      API_KEY = String(key || '').trim();
      if(API_BASE) localStorage.setItem('ELEMENT_CRM_API', API_BASE);
      else localStorage.removeItem('ELEMENT_CRM_API');
      if(API_KEY) localStorage.setItem('ELEMENT_CRM_API_KEY', API_KEY);
      else localStorage.removeItem('ELEMENT_CRM_API_KEY');
    }

    async function api(path, { method='GET', body } = {}){
      const url = API_BASE + path;
      const headers = { Accept:'application/json' };
      if(body != null) headers['Content-Type'] = 'application/json';
      if(API_KEY) headers['X-API-KEY'] = API_KEY;
      const resp = await fetch(url, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
      const text = await resp.text();
      let json = null;
      try{ json = text ? JSON.parse(text) : null; }catch{}
      if(!resp.ok){
        const msg = json?.error || json?.message || text || ('HTTP ' + resp.status);
        throw new Error(msg);
      }
      return json;
    }

    /* ========= Availability Report ========= */
    function startOfDayLocal(dateIso){
      const d = new Date(String(dateIso||'') + 'T00:00:00');
      if(isNaN(+d)) return null;
      d.setHours(0,0,0,0);
      return d;
    }
    function minutesToDate(dateIso, minutes){
      const d0 = startOfDayLocal(dateIso);
      if(!d0) return null;
      const d = new Date(d0.getTime() + Number(minutes||0)*60000);
      return isNaN(+d) ? null : d;
    }
    function eventsForBarberOnDate(barberId, dateIso){
      const bid = String(barberId||'');
      return (state.events || []).filter(ev => String(ev.barberId||'') === bid && String(ev.date||'') === String(dateIso||''));
    }
    function buildBusyIntervals(barberId, dateIso){
      const items = eventsForBarberOnDate(barberId, dateIso);
      const out = [];
      for(const ev of items){
        const s = minutesToDate(dateIso, ev.startMin);
        const e = minutesToDate(dateIso, ev.startMin + ev.durMin);
        if(!s || !e) continue;
        out.push({
          start_at: toIsoLocal(s), end_at: toIsoLocal(e),
          booking_id: String(ev._raw?.id || ev._raw?.booking_id || ev._raw?.uuid || ev.id || ''),
          client_name: String(ev.clientName||''), service_id: String(ev.serviceId||''),
          service_name: String(ev.serviceName||''), status: String(ev.status||'booked'), paid: !!ev.paid
        });
      }
      out.sort((a,b)=> String(a.start_at).localeCompare(String(b.start_at)));
      return out;
    }
    function slotOverlapsAny(slotStartIso, slotEndIso, busy){
      const aStart = new Date(slotStartIso), aEnd = new Date(slotEndIso);
      if(isNaN(+aStart) || isNaN(+aEnd)) return false;
      for(const b of busy){
        const bStart = new Date(b.start_at), bEnd = new Date(b.end_at);
        if(isNaN(+bStart) || isNaN(+bEnd)) continue;
        if(aStart < bEnd && bStart < aEnd) return true;
      }
      return false;
    }
    function buildFreeSlots(barberId, dateIso, stepMin=30){
      const perDayFs = getPerDaySchedule(barberId);
      const dow = dateIsoToDow(dateIso);
      const dayInfoFs = perDayFs[dow] || DAY_DEFAULTS_PERDIEM[dow];
      const worksToday = dayInfoFs.enabled;
      const startMin = Math.max(0, Math.min(1440, dayInfoFs.startMin));
      const endMin = Math.max(0, Math.min(1440, dayInfoFs.endMin));
      if(!worksToday) return { startMin, endMin, stepMin, slots: [] };
      const busy = buildBusyIntervals(barberId, dateIso);
      const slots = [];
      for(let m = startMin; m + stepMin <= endMin; m += stepMin){
        const s = minutesToDate(dateIso, m), e = minutesToDate(dateIso, m + stepMin);
        if(!s || !e) continue;
        if(!slotOverlapsAny(toIsoLocal(s), toIsoLocal(e), busy)) slots.push(toIsoLocal(s));
      }
      return { startMin, endMin, stepMin, slots };
    }
    function buildAvailabilityReportForDay(dateIso){
      const day = String(dateIso || isoDate(state.anchor));
      const barbers = (state.barbers || []).map(b=>{
        const perDayRep = getPerDaySchedule(b.id);
        const dowRep = dateIsoToDow(day);
        const dayInfoRep = perDayRep[dowRep] || DAY_DEFAULTS_PERDIEM[dowRep];
        const worksToday = dayInfoRep.enabled;
        const busy = buildBusyIntervals(b.id, day);
        const free = buildFreeSlots(b.id, day, 30);
        const publicStatus = !worksToday ? 'DAY OFF' : (!Array.isArray(free.slots) || !free.slots.length ? 'BUSY' : 'AVAILABLE');
        return {
          barber_id: String(b.serverId || b.id || ''), barber_name: String(b.name||''),
          team_member_id: String(b.teamMemberId || ''), date: day, works_today: worksToday,
          public_status: publicStatus,
          schedule: { startMin: free.startMin, endMin: free.endMin, stepMin: free.stepMin, days: Array.isArray(sched.days) ? sched.days : [] },
          busy, free_slots: free.slots
        };
      }).filter(x => x.barber_id);
      return { source: "crm", date: day, generated_at: new Date().toISOString(), barbers };
    }
    let __availabilityReportTimer = null;
    async function sendAvailabilityReportToServer(){
      if(__availabilityReportTimer) clearTimeout(__availabilityReportTimer);
      return new Promise((resolve)=>{
        __availabilityReportTimer = setTimeout(async ()=>{
          try{
            const report = buildAvailabilityReportForDay(isoDate(state.anchor));
            await api('/api/availability/report', { method:'POST', body: report });
            resolve(true);
          }catch(e){ console.warn('sendAvailabilityReportToServer:', e?.message || e); resolve(false); }
        }, 350);
      });
    }

    /* ========= Local DB ========= */
    const LS_CLIENTS = 'ELEMENT_CRM_CLIENTS_V1';
    const LS_PINS = 'ELEMENT_CRM_PINS_V1';
    const LS_SCHEDULES = 'ELEMENT_CRM_BARBER_SCHEDULES_V1';

    function loadSchedules(){ try{ return JSON.parse(localStorage.getItem(LS_SCHEDULES) || '{}'); }catch{ return {}; } }
    function saveSchedules(obj){ localStorage.setItem(LS_SCHEDULES, JSON.stringify(obj || {})); }

    function getBarberSchedule(barberId){
      const all = loadSchedules();
      const x = all && barberId ? all[String(barberId)] : null;
      const def = { startMin:0, endMin:1440, days:[0,1,2,3,4,5,6] };
      if(!x || typeof x !== 'object') return def;
      const startMin = Math.max(0, Math.min(1440, Number(x.startMin ?? def.startMin)));
      const endMin0 = Math.max(0, Math.min(1440, Number(x.endMin ?? def.endMin)));
      const days = Array.isArray(x.days) ? x.days.map(n=>Number(n)).filter(n=>n>=0 && n<=6) : def.days;
      const endMin = Math.max(startMin + 30, endMin0);
      return { startMin, endMin, days: days.length ? days : def.days };
    }
    function setBarberSchedule(barberId, patch){
      if(!barberId) return;
      const all = loadSchedules();
      const cur = getBarberSchedule(barberId);
      const next = { ...cur, ...(patch || {}) };
      next.startMin = Math.max(0, Math.min(1440, Number(next.startMin)));
      next.endMin = Math.max(0, Math.min(1440, Number(next.endMin)));
      if(next.endMin < next.startMin + 30) next.endMin = Math.min(1440, next.startMin + 30);
      if(!Array.isArray(next.days)) next.days = [0,1,2,3,4,5,6];
      next.days = next.days.map(n=>Number(n)).filter(n=>n>=0 && n<=6);
      all[String(barberId)] = next;
      saveSchedules(all);
    }
    function dateIsoToDow(dateIso){
      const d = new Date(String(dateIso||'') + 'T00:00:00');
      const w = d.getDay();
      return isNaN(+d) ? 0 : w;
    }
    function clampToSchedule(min, sched){
      const start = Number(sched?.startMin ?? 0), end = Number(sched?.endMin ?? 1440);
      return Math.max(start, Math.min(min, Math.max(start, end - 30)));
    }
    function uid(prefix='id'){ return prefix + '_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16); }
    function loadClients(){ try{ return JSON.parse(localStorage.getItem(LS_CLIENTS) || '[]'); }catch{ return []; } }
    function saveClients(list){ localStorage.setItem(LS_CLIENTS, JSON.stringify(list)); }

    /* ========= Services API ========= */
    let SERVICES_CACHE = [];

    async function loadServicesServer(){
      let data = null;
      try{ data = await api('/api/services'); }
      catch(e){ data = await api('/public/services', { method:'POST', body:{} }); }
      const arr = Array.isArray(data?.services) ? data.services : (Array.isArray(data) ? data : []);
      SERVICES_CACHE = arr.map(s=>{
        const durMs = (s.durationMs != null) ? Number(s.durationMs) : (s.duration_minutes != null) ? Number(s.duration_minutes)*60000 : (s.durationMin != null) ? Number(s.durationMin)*60000 : 0;
        const durMin = Math.max(1, Math.round((Number.isFinite(durMs) ? durMs : 0)/60000) || 30);
        let priceStr = '';
        if(s.price != null && String(s.price).trim() !== ''){ priceStr = String(s.price); }
        else{ const cents = (s.priceCents != null) ? Number(s.priceCents) : (s.price_cents != null) ? Number(s.price_cents) : 0; const c = Number.isFinite(cents) ? cents : 0; priceStr = c > 0 ? (c/100).toFixed(2) : ''; }
        const id = (s.id != null) ? String(s.id) : (s.service_id != null) ? String(s.service_id) : (s.docId != null) ? String(s.docId) : '';
        const rawBarberIds = Array.isArray(s.barberIds) ? s.barberIds : Array.isArray(s.barber_ids) ? s.barber_ids : Array.isArray(s.assigned_barbers) ? s.assigned_barbers : Array.isArray(s.barbers) ? s.barbers : [];
        return { id, name: String(s.name||''), durationMin: durMin, price: priceStr, version: String(s.version ?? '1'), barberIds: rawBarberIds.map(String).filter(Boolean) };
      }).filter(s=>s.name);
      try{ renderServiceSelectForBarber(mBarber?.value || state?.barbers?.[0]?.id || ''); }catch(e){}
      return SERVICES_CACHE;
    }
    function getServicesCached(){ return Array.isArray(SERVICES_CACHE) ? SERVICES_CACHE : []; }
    function servicesForBarberId(barberId){
      const bid = String(barberId || '');
      return getServicesCached().filter(s=>{ const ids = Array.isArray(s.barberIds) ? s.barberIds.map(String) : []; return !ids.length || ids.includes(bid); });
    }
    function renderServiceSelectForBarber(barberId){
      const list = servicesForBarberId(barberId);
      mService.innerHTML = '';
      if(!list.length){
        const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No services for this barber';
        mService.appendChild(opt); mService.disabled = true; return;
      }
      mService.disabled = false;
      list.forEach(s=>{ const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; mService.appendChild(opt); });
    }
    async function upsertServiceServer(service){
      const payload = { ...(service || {}) };
      if(Array.isArray(payload.barberIds)) payload.barber_ids = payload.barberIds.map(String);
      const res = await api('/api/services', { method:'POST', body: payload });
      return res?.service || null;
    }
    async function patchServiceServer(id, patch){
      const payload = { ...(patch || {}) };
      if(Array.isArray(payload.barberIds)) payload.barber_ids = payload.barberIds.map(String);
      const res = await api(\`/api/services/\${encodeURIComponent(id)}\`, { method:'PATCH', body: payload });
      return res?.service || null;
    }
    async function deleteServiceServer(id){ await api(\`/api/services/\${encodeURIComponent(id)}\`, { method:'DELETE' }); }

    function loadPins(){
      const def = { owner:'1403', reception:'2222', barber:'1111' };
      try{ const x = JSON.parse(localStorage.getItem(LS_PINS) || 'null'); return x && typeof x === 'object' ? { ...def, ...x } : def; }catch{ return def; }
    }
    function savePins(p){ localStorage.setItem(LS_PINS, JSON.stringify(p)); }
    function normalizeName(s){ return String(s||'').trim().replace(/\\s+/g,' '); }

    function upsertClientByName(name, { phone='', notes='' } = {}){
      const n = normalizeName(name); if(!n) return null;
      const list = loadClients();
      const idx = list.findIndex(c => normalizeName(c.name).toLowerCase() === n.toLowerCase());
      if(idx >= 0){ list[idx] = { ...list[idx], name:n, phone: phone || list[idx].phone || '', notes: notes || list[idx].notes || '' }; saveClients(list); return list[idx]; }
      const c = { id: uid('c'), name:n, phone: phone || '', notes: notes || '' };
      list.unshift(c); saveClients(list); return c;
    }
    function getClientByName(name){
      const n = normalizeName(name).toLowerCase();
      return loadClients().find(c => normalizeName(c.name).toLowerCase() === n) || null;
    }

    /* ========= Calendar Core ========= */
    let slotH = 44, startHour = 0, endHour = 24;
    const CSS = getComputedStyle(document.documentElement);
    slotH = parseInt(CSS.getPropertyValue('--slotH')) || 44;
    startHour = parseInt(CSS.getPropertyValue('--startHour')) || 0;
    endHour = parseInt(CSS.getPropertyValue('--endHour')) || 24;
    startHour = Math.max(0, Math.min(23, startHour));
    endHour = Math.max(startHour + 1, Math.min(24, endHour));

    const state = { anchor: new Date(), query: '', barbers: [], events: [], selectedId: null };

    function pad2(n){ return String(n).padStart(2,'0'); }
    function minutesToHHMM(min){ const h = Math.floor(min/60), m = min%60; return pad2(h)+':'+pad2(m); }
    function clampToWorkHours(min){ return Math.max(startHour*60, Math.min(min, endHour*60-30)); }
    function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
    function isoDate(d){ const x = new Date(d); x.setHours(0,0,0,0); return \`\${x.getFullYear()}-\${pad2(x.getMonth()+1)}-\${pad2(x.getDate())}\`; }
    function toIsoLocal(d){ return new Date(d).toISOString(); }
    function parseIsoMaybe(s){ const x = new Date(s); return isNaN(+x) ? null : x; }
    function barberColorKey(index){ return ['c0','c1','c2','c3','c4','c5','c6'][index % 7]; }
    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }


    function openLightbox(src){ 
      const lb = document.getElementById('photoLightbox');
      const img = document.getElementById('lightboxImg');
      if(!lb || !img) return;
      img.src = src;
      lb.classList.add('open');
    }
    function closeLightbox(){
      const lb = document.getElementById('photoLightbox');
      if(lb){ lb.classList.remove('open'); }
    }
    document.getElementById('photoLightbox')?.addEventListener('click', (e)=>{
      if(e.target === document.getElementById('photoLightbox') || e.target === document.getElementById('lightboxImg')) closeLightbox();
    });

    function normalizePhotoUrl(v){
      const s = String(v || '').trim();
      if(!s) return '';
      if(/^data:image\\//i.test(s)) return s;
      if(/^https?:\\/\\//i.test(s)) return s;
      if(/^\\/\\//.test(s)) return window.location.protocol + s;
      return s;
    }
    function extractPhotoFromText(v){
      const s = String(v || '');
      if(!s) return '';
      const dataMatch = s.match(/data:image\\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\\s]+/i);
      if(dataMatch && dataMatch[0]) return normalizePhotoUrl(dataMatch[0].replace(/\\s+/g, ''));
      const urlMatch = s.match(/https?:\\/\\/[^\\s)]+/i);
      if(urlMatch && urlMatch[0]) return normalizePhotoUrl(urlMatch[0]);
      return '';
    }

    /* =====================================================
       ВИПРАВЛЕНА ФУНКЦІЯ bookingPhotoUrl
       Тепер правильно зчитує reference_photo.url
       з вкладеного об'єкта (саме там зберігає бекенд)
       ===================================================== */
    function bookingPhotoUrl(raw){
      if(!raw) return '';
      if(typeof raw === 'string') return normalizePhotoUrl(raw) || extractPhotoFromText(raw);
      if(typeof raw !== 'object') return '';

      /* ✅ ВИПРАВЛЕННЯ: витягуємо URL з вкладеного об'єкта reference_photo */
      const ref = raw.reference_photo;
      const refUrl = ref && typeof ref === 'object'
        ? (ref.url || ref.signed_url || ref.signedUrl || ref.public_url || ref.publicUrl ||
           ref.download_url || ref.downloadUrl || ref.file_url || ref.fileUrl ||
           ref.secure_url || ref.secureUrl || ref.data_url || ref.dataUrl || '')
        : (typeof ref === 'string' ? ref : '');

      const client = raw.client_photo;
      const clientUrl = client && typeof client === 'object'
        ? (client.url || client.signed_url || client.signedUrl || client.public_url || client.publicUrl || '')
        : (typeof client === 'string' ? client : '');

      return normalizePhotoUrl(
        raw.reference_photo_url ||
        raw.referencePhotoUrl ||
        refUrl ||                  /* ✅ тепер перевіряється до client_photo_url */
        raw.client_photo_url ||
        raw.clientPhotoUrl ||
        clientUrl ||
        raw.photo_url ||
        raw.photoUrl ||
        raw.image_url ||
        raw.imageUrl ||
        extractPhotoFromText(raw.notes || raw.customer_note || '')
      );
    }

    function bookingPhotoName(raw){
      if(!raw || typeof raw !== 'object') return '';
      const ref = raw.reference_photo, client = raw.client_photo;
      const nestedRefName = ref && typeof ref === 'object' ? (ref.file_name || ref.filename || ref.name || ref.original_name || '') : '';
      const nestedClientName = client && typeof client === 'object' ? (client.file_name || client.filename || client.name || client.original_name || '') : '';
      return String(raw.client_photo_name || raw.clientPhotoName || raw.reference_photo_name || raw.referencePhotoName || raw.haircut_photo_name || raw.haircutPhotoName || raw.photo_name || raw.photoName || raw.image_name || raw.imageName || nestedRefName || nestedClientName || '').trim();
    }

    function bookingHasPhoto(ev){ return !!normalizePhotoUrl(ev?.photoUrl || bookingPhotoUrl(ev?._raw)); }
    function bookingHasNotes(ev){ return !!String(ev?.notes || '').trim(); }

    function ensureBookingPreviewBox(){
      let box = document.getElementById('bookingPreviewBox');
      if(box) return box;
      if(!mNotes || !mNotes.parentElement) return null;
      box = document.createElement('div');
      box.id = 'bookingPreviewBox';
      box.style.cssText = 'display:none;margin-top:10px;padding:12px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.03);';
      mNotes.parentElement.appendChild(box);
      return box;
    }

    function renderBookingPreview(ev){
      const box = ensureBookingPreviewBox();
      if(!box) return;
      const raw = ev?._raw || null;
      const photoUrl = normalizePhotoUrl(ev?.photoUrl || bookingPhotoUrl(raw) || bookingPhotoUrl(ev?.notes) || bookingPhotoUrl(raw?.notes || raw?.customer_note || ''));
      const photoName = String(ev?.photoName || bookingPhotoName(raw) || 'Reference photo').trim();
      const rawNotes = String(ev?.notes || raw?.notes || raw?.customer_note || '').trim();
      const notes = rawNotes.replace(/^Reference photo attached on website(?::[^\\n]*)?\\s*$/gim, '').replace(/^Reference photo attached on website(?::[^\\n]*)?\\s*\\n?/gim, '').trim();

      if(!photoUrl && !notes){
        /* ✅ Якщо URL немає, але є назва файлу — показуємо її */
        const photoName2 = String(ev?.photoName || bookingPhotoName(ev?._raw) || '').trim();
        if(!photoName2){ box.style.display = 'none'; box.innerHTML = ''; return; }
        box.style.display = 'block';
        box.innerHTML = \`<div style="display:flex;flex-direction:column;gap:6px;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.72;">Attached photo</div>
          <div style="color:rgba(255,255,255,.65);font-size:13px;">📎 \${escapeHtml(photoName2)} (preview unavailable)</div>
        </div>\`;
        return;
      }

      box.style.display = 'block';
      box.innerHTML = \`<div style="display:flex;flex-direction:column;gap:12px;">
        \${photoUrl ? \`<div style="display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.72;">Attached photo</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="\${escapeHtml(photoUrl)}" alt="\${escapeHtml(photoName)}"
              style="width:120px;height:120px;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);display:block;flex:0 0 auto;cursor:pointer;"
              onclick="openLightbox(this.src)"
              onerror="this.style.display='none';if(this.nextElementSibling){this.nextElementSibling.style.display='flex';}"/>
            <div style="display:none;width:120px;height:120px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);align-items:center;justify-content:center;font-size:12px;opacity:.72;flex:0 0 auto;">Photo unavailable</div>
            <div style="display:flex;flex-direction:column;gap:4px;min-width:0;">
              <div style="font-weight:600;word-break:break-word;">\${escapeHtml(photoName)}</div>
              <div style="font-size:12px;opacity:.72;">Preview only</div>
            </div>
          </div>
        </div>\` : ''}
        \${notes ? \`<div style="display:flex;flex-direction:column;gap:6px;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.72;">Haircut notes</div>
          <div style="white-space:pre-wrap;line-height:1.45;">\${escapeHtml(notes)}</div>
        </div>\` : ''}
      </div>\`;
    }

    function isAnchorToday(){ const a = new Date(state.anchor); a.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return +a === +t; }

    /* ===== Date modal calendar ===== */
    const dateModal = { month: null, selected: null };
    function startOfMonth(d){ const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
    function weekdayMon0(d){ const w = new Date(d).getDay(); return (w + 6) % 7; }
    function sameDay(a,b){ if(!a || !b) return false; const x = new Date(a); x.setHours(0,0,0,0); const y = new Date(b); y.setHours(0,0,0,0); return +x === +y; }
    function setAnchorFromDate(d){ const x = new Date(d); x.setHours(0,0,0,0); state.anchor = x; refresh(); }

    function renderDateModal(){
      if(!dateMonthName || !dateGrid) return;
      const m = dateModal.month || startOfMonth(state.anchor);
      dateMonthName.textContent = m.toLocaleDateString([], { month:'long', year:'numeric' });
      const first = startOfMonth(m), offset = weekdayMon0(first), start = new Date(first);
      start.setDate(first.getDate() - offset);
      const today = new Date(); today.setHours(0,0,0,0);
      const selected = dateModal.selected || new Date(state.anchor);
      dateGrid.innerHTML = '';
      for(let i=0;i<42;i++){
        const d = new Date(start); d.setDate(start.getDate() + i);
        const inMonth = d.getMonth() === m.getMonth();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calDayBtn' + (inMonth ? '' : ' muted') + (sameDay(d, today) ? ' today' : '') + (sameDay(d, selected) ? ' selected' : '');
        btn.textContent = String(d.getDate());
        btn.addEventListener('click', ()=>{ dateModal.selected = d; setAnchorFromDate(d); dateWrap.classList.remove('open'); });
        dateGrid.appendChild(btn);
      }
    }
    function openDateModal(){ const anchor = new Date(state.anchor); anchor.setHours(0,0,0,0); dateModal.selected = anchor; dateModal.month = startOfMonth(anchor); renderDateModal(); dateWrap.classList.add('open'); }
    function closeDateModal(){ dateWrap.classList.remove('open'); }

    /* ========= DOM ========= */
    const daysHead = document.getElementById('daysHead');
    const timesEl = document.getElementById('times');
    const gridEl = document.getElementById('grid');
    const rangeLine = document.getElementById('rangeLine');
    const btnPrev = document.getElementById('prev');
    const btnNext = document.getElementById('next');
    const btnToday = document.getElementById('today');
    const btnNew = document.getElementById('new');
    const search = document.getElementById('search');
    const settingsBtn = document.getElementById('settingsBtn');
    const dateBtn = document.getElementById('dateBtn');
    const dateWrap = document.getElementById('dateWrap');
    const dateClose = document.getElementById('dateClose');
    const datePrev = document.getElementById('datePrev');
    const dateNext = document.getElementById('dateNext');
    const dateTodayBtn = document.getElementById('dateToday');
    const dateMonthName = document.getElementById('dateMonthName');
    const dateGrid = document.getElementById('dateGrid');
    const sidebar = document.querySelector('.sidebar');
    const burger = document.getElementById('burger');
    const backdrop = document.getElementById('backdrop');

    function openSidebar(on){ if(!sidebar || !backdrop) return; sidebar.classList.toggle('open', !!on); backdrop.classList.toggle('open', !!on); }
    burger?.addEventListener('click', ()=> openSidebar(true));
    backdrop?.addEventListener('click', ()=> openSidebar(false));
    document.querySelectorAll('.sidebar .nav a').forEach(a=>{ a.addEventListener('click', ()=> openSidebar(false)); });
    window.addEventListener('resize', ()=>{ if(window.innerWidth > 980) openSidebar(false); });

    const modalWrap = document.getElementById('modalWrap');
    const mHint = document.getElementById('mHint');
    const mClient = document.getElementById('mClient');
    const clientList = document.getElementById('clientList');
    const mBarber = document.getElementById('mBarber');
    const mService = document.getElementById('mService');
    const statusWrap = document.getElementById('statusWrap');
    const mStatus = document.getElementById('mStatus');
    const mDate = document.getElementById('mDate');
    const mStart = document.getElementById('mStart');
    const mDur = document.getElementById('mDur');
    const mPhone = document.getElementById('mPhone');
    const mNotes = document.getElementById('mNotes');
    const mClose = document.getElementById('mClose');
    const mSave = document.getElementById('mSave');
    const mDelete = document.getElementById('mDelete');
    const payBlock = document.getElementById('payBlock');
    const payBtn = document.getElementById('payBtn');
    const payHint = document.getElementById('payHint');
    const payStatus = document.getElementById('payStatus');
    const settingsWrap = document.getElementById('settingsWrap');
    const settingsClose = document.getElementById('settingsClose');
    const tabBarbers = document.getElementById('tabBarbers');
    const tabServices = document.getElementById('tabServices');
    const tabClients = document.getElementById('tabClients');
    const tabPins = document.getElementById('tabPins');
    const tabAccount = document.getElementById('tabAccount');
    const panelBarbers = document.getElementById('panelBarbers');
    const panelServices = document.getElementById('panelServices');
    const panelClients = document.getElementById('panelClients');
    const panelPins = document.getElementById('panelPins');
    const panelAccount = document.getElementById('panelAccount');
    const accountWho = document.getElementById('accountWho');
    const logoutBtn2 = document.getElementById('logoutBtn2');
    const apiBaseInput = document.getElementById('apiBaseInput');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiSaveBtn = document.getElementById('apiSaveBtn');
    const apiTestBtn = document.getElementById('apiTestBtn');
    const apiStatusRow = document.getElementById('apiStatusRow');
    const apiStatusText = document.getElementById('apiStatusText');
    const apiStatusClose = document.getElementById('apiStatusClose');

    function showApiStatus(msg){ if(!apiStatusRow || !apiStatusText) return; apiStatusText.textContent = msg; apiStatusRow.style.display = 'flex'; }
    function hideApiStatus(){ if(!apiStatusRow) return; apiStatusRow.style.display = 'none'; }

    const bName = document.getElementById('bName');
    const bLevel = document.getElementById('bLevel');
    const bPhoto = document.getElementById('bPhoto');
    const bAdd = document.getElementById('bAdd');
    const barbersList = document.getElementById('barbersList');
    const bAbout = document.getElementById('bAbout');
    const bUsername = document.getElementById('bUsername');
    const bPassword = document.getElementById('bPassword');
    const bPrice = document.getElementById('bPrice');
    const bRolePublic = document.getElementById('bRolePublic');
    const bOffDays = document.getElementById('bOffDays');
    const bRadarLabels = document.getElementById('bRadarLabels');
    const bRadarValues = document.getElementById('bRadarValues');
    const bPublicEnabled = document.getElementById('bPublicEnabled');
    const sName = document.getElementById('sName');
    const sDur = document.getElementById('sDur');
    const sPrice = document.getElementById('sPrice');
    const sBarber = document.getElementById('sBarber');
    const sAdd = document.getElementById('sAdd');
    const servicesList = document.getElementById('servicesList');
    const cName = document.getElementById('cName');
    const cPhone = document.getElementById('cPhone');
    const cNotes = document.getElementById('cNotes');
    const cAdd = document.getElementById('cAdd');
    const clientsList = document.getElementById('clientsList');
    const pOwner = document.getElementById('pOwner');
    const pReception = document.getElementById('pReception');
    const pBarber = document.getElementById('pBarber');
    const pSave = document.getElementById('pSave');

    /* Auth */
    const CRM_AUTH_KEY = "element_crm_auth_v1";
    const ROLES = { OWNER:"owner", RECEPTION:"reception", BARBER:"barber" };
    const authWrap = document.getElementById('authWrap');
    const aRole = document.getElementById('aRole');
    const aBarberWrap = document.getElementById('aBarberWrap');
    const aBarber = document.getElementById('aBarber');
    const aPin = document.getElementById('aPin');
    const aLogin = document.getElementById('aLogin');
    const aClear = document.getElementById('aClear');
    const authErr = document.getElementById('authErr');
    const whoami = document.getElementById('whoami');

    function getSession(){ try{ return JSON.parse(localStorage.getItem(CRM_AUTH_KEY) || "null"); }catch{ return null; } }
    function setSession(s){ localStorage.setItem(CRM_AUTH_KEY, JSON.stringify(s)); }
    function clearSession(){ localStorage.removeItem(CRM_AUTH_KEY); }
    function showAuth(msg){ authWrap.classList.add('open'); if(msg){ authErr.textContent = msg; authErr.style.display = 'block'; }else{ authErr.style.display = 'none'; } }
    function hideAuth(){ authWrap.classList.remove('open'); authErr.style.display = 'none'; }
    function requireAuth(){ hideAuth(); return true; } // Auth disabled
    function updateWhoAmI(){
      const s = getSession();
      if(!s?.role){ whoami.textContent = 'Guest'; accountWho.textContent = 'Guest'; return; }
      const label = s.role === ROLES.OWNER ? 'Owner' : s.role === ROLES.RECEPTION ? 'Reception' : \`Barber: \${s.barberName || s.barberId || '—'}\`;
      whoami.textContent = label; accountWho.textContent = label;
    }

    /* ========= Load Barbers ========= */
    async function loadBarbers(){
      const json = await api('/api/barbers');
      const list = Array.isArray(json) ? json : (json?.barbers || []);
      const mapped = list.map((b, i)=>{
        const id = String(b.id || '').trim();
        if(!id) return null;
        return {
          id, name: String(b.name ?? b.full_name ?? b.title ?? id).trim(),
          level: String(b.level ?? b.rank ?? b.role ?? '').trim(),
          photo: String(b.photo_url ?? b.photoUrl ?? b.photo ?? '').trim(),
          about: String(b.about ?? b.description ?? b.bio ?? '').trim(),
          username: String(b.username ?? b.login ?? '').trim(),
          password: String(b.password ?? b.pin ?? b.barber_pin ?? '').trim(),
          basePrice: String(b.base_price ?? b.price ?? '').trim(),
          publicRole: String(b.public_role ?? b.level ?? '').trim(),
          publicEnabled: b.public_enabled !== false,
          offDays: Array.isArray(b.public_off_days) ? b.public_off_days.map(String).filter(Boolean) : (Array.isArray(b.off_days) ? b.off_days.map(String).filter(Boolean) : []),
          radarLabels: Array.isArray(b.radar_labels) ? b.radar_labels.map(String) : ['FADE','LONG','BEARD','STYLE','DETAIL'],
          radarValues: Array.isArray(b.radar_values) ? b.radar_values.map(v=>Number(v)||0) : [4.5,4.5,4.5,4.5,4.5],
          teamMemberId: String(b.team_member_id ?? b.teamMemberId ?? '').trim(),
          active: b.active !== false,
          sortOrder: Number(b.sort_order ?? b.public_sort_order ?? b.role_order ?? b.rank_order ?? 999) || 999,
          schedule: (b.schedule && typeof b.schedule === 'object') ? b.schedule : ((b.work_schedule && typeof b.work_schedule === 'object') ? b.work_schedule : null),
          workDays: Array.isArray((b.schedule && b.schedule.days) || (b.work_schedule && b.work_schedule.days)) ? ((b.schedule && b.schedule.days) || (b.work_schedule && b.work_schedule.days)).map(n=>Number(n)).filter(n=>n>=0 && n<=6) : [0,1,2,3,4,5,6],
          serverId: id, publicCard: b.public_card || null, color: barberColorKey(i)
        };
      }).filter(Boolean).filter(b=>b.name);

      state.barbers = mapped.filter(b=>b.active !== false).sort((a,b)=>{ const ao = Number(a.sortOrder??999), bo = Number(b.sortOrder??999); if(ao!==bo) return ao-bo; return String(a.name||'').localeCompare(String(b.name||'')); });
      if(!state.barbers.length) throw new Error('No active barbers returned from server');

      document.documentElement.style.setProperty('--dayCols', String(Math.max(1, state.barbers.length)));

      mBarber.innerHTML = '';
      state.barbers.forEach(b=>{ const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; mBarber.appendChild(opt); });
      mBarber.onchange = ()=>{ renderServiceSelectForBarber(mBarber.value); recomputeTimeSlotsForModal(); };

      sBarber.innerHTML = '';
      state.barbers.forEach(b=>{ const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; sBarber.appendChild(opt); });

      aBarber.innerHTML = '<option value="">— Select —</option>';
      state.barbers.forEach(b=>{ const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; aBarber.appendChild(opt); });

      renderBarbersList();
      state.barbers.forEach(b=>{ const sched = (b.schedule && typeof b.schedule === 'object') ? b.schedule : null; if(sched){ setBarberSchedule(b.id, { startMin: Number(sched.startMin ?? 8*60), endMin: Number(sched.endMin ?? 20*60), days: Array.isArray(sched.days) ? sched.days.map(n=>Number(n)).filter(n=>n>=0 && n<=6) : [0,1,2,3,4,5,6] }); } });
    }

    async function addBarberToAPI({ name, level, photoBase64, about, username, password, basePrice, publicRole, offDays, radarLabels, radarValues, publicEnabled, schedule, workDays }){
      const cleanWorkDays = Array.isArray(workDays) && workDays.length ? workDays.map(n=>Number(n)).filter(n=>n>=0 && n<=6) : [1,2,3,4,5,6];
      const cleanSchedule = (schedule && typeof schedule === 'object') ? { startMin: Number(schedule.startMin ?? 8*60), endMin: Number(schedule.endMin ?? 20*60), days: Array.isArray(schedule.days) && schedule.days.length ? schedule.days.map(n=>Number(n)).filter(n=>n>=0 && n<=6) : cleanWorkDays } : { startMin: 8*60, endMin: 20*60, days: cleanWorkDays };
      const payload = {
        name: String(name||'').trim(), level: String(level||'').trim(), photo_url: String(photoBase64||'').trim(),
        username: String(username||'').trim(), password: String(password||'').trim(), barber_pin: String(password||'').trim(),
        about: String(about||'').trim(), description: String(about||'').trim(), bio: String(about||'').trim(),
        base_price: String(basePrice||'').trim(), public_role: String(publicRole||level||'').trim(),
        public_enabled: publicEnabled !== false,
        public_off_days: Array.isArray(offDays) && offDays.length ? offDays.map(String).filter(Boolean) : scheduleToPublicOffDays(cleanSchedule.days),
        radar_labels: Array.isArray(radarLabels) ? radarLabels.map(String) : ['FADE','LONG','BEARD','STYLE','DETAIL'],
        radar_values: Array.isArray(radarValues) ? radarValues.map(v=>Number(v)||0) : [4.5,4.5,4.5,4.5,4.5],
        active: true, schedule: cleanSchedule, work_schedule: cleanSchedule
      };
      return await api('/api/barbers', { method:'POST', body: payload });
    }

    function fileToDataURL(file){
      return new Promise((resolve, reject)=>{
        if(!file) return resolve('');
        const r = new FileReader();
        r.onload = ()=>{
          const img = new Image();
          img.onload = ()=>{
            try{
              const MAX_W = 900, MAX_H = 900;
              let w = Number(img.width)||0, h = Number(img.height)||0;
              if(!w || !h) return reject(new Error('Invalid image'));
              const scale = Math.min(1, MAX_W/w, MAX_H/h);
              const tw = Math.max(1, Math.round(w*scale)), th = Math.max(1, Math.round(h*scale));
              const canvas = document.createElement('canvas'); canvas.width = tw; canvas.height = th;
              const ctx = canvas.getContext('2d'); if(!ctx) return reject(new Error('Canvas not supported'));
              ctx.drawImage(img, 0, 0, tw, th);
              let quality = 0.82, out = canvas.toDataURL('image/jpeg', quality);
              const LIMIT = 900000;
              while(out.length > LIMIT && quality > 0.35){ quality -= 0.08; out = canvas.toDataURL('image/jpeg', quality); }
              if(out.length > LIMIT) return reject(new Error('Image is still too large.'));
              resolve(out);
            }catch(err){ reject(err instanceof Error ? err : new Error('Image processing error')); }
          };
          img.onerror = ()=> reject(new Error('Image load error'));
          img.src = String(r.result || '');
        };
        r.onerror = ()=> reject(new Error('File read error'));
        r.readAsDataURL(file);
      });
    }

    function splitCsvList(v){ return String(v||'').split(',').map(x=>String(x||'').trim()).filter(Boolean); }
    function parseRadarValues(v){ const arr = String(v||'').split(',').map(x=>Number(String(x||'').trim())).filter(x=>Number.isFinite(x)); return arr.length ? arr : [4.5,4.5,4.5,4.5,4.5]; }

    function buildPublicBarberCardHTML(barber){
      const role = String(barber?.publicRole||barber?.level||'Barber').trim(), name = String(barber?.name||'').trim();
      const photo = String(barber?.photo||'').trim(), about = String(barber?.about||'').trim(), price = String(barber?.basePrice||'').trim();
      const off = Array.isArray(barber?.offDays) ? barber.offDays.map(String).filter(Boolean).join(',') : '';
      const labels = Array.isArray(barber?.radarLabels) ? barber.radarLabels.map(String).join(',') : 'FADE,LONG,BEARD,STYLE,DETAIL';
      const values = Array.isArray(barber?.radarValues) ? barber.radarValues.map(v=>Number(v)||0).join(',') : '4.5,4.5,4.5,4.5,4.5';
      const safeName = escapeHtml(name), safeId = escapeHtml(String(barber?.serverId||barber?.id||'').trim());
      return \`<!-- \${safeName} -->\\n<article class="barber" data-barber-id="\${safeId}" data-barber="\${safeName}" data-role="\${escapeHtml(role)}" data-off="\${escapeHtml(off)}">\\n  <div class="barber__media"><img src="\${escapeHtml(photo)}" alt="\${safeName}"></div>\\n  <div class="barber__content">\\n    <div class="topline"><span class="badge">\${escapeHtml(role)}</span><span class="status-pill" data-status-for="\${safeName}" data-barber-id="\${safeId}">AVAILABLE</span><span class="price-pill">\${price ? '$'+escapeHtml(price) : ''}</span></div>\\n    <div class="title-row"><h2 class="title">\${safeName}</h2><div class="rating-row" data-barber="\${safeName}"><div class="stars"></div><div class="revcount">—</div></div></div>\\n    <div class="actions"><a class="btn btn--light" data-action="book" href="#" role="button">BOOK NOW</a><button class="btn js-review" data-barber="\${safeName}">REVIEW</button><button class="btn js-about" data-about-for="\${safeName}">ABOUT</button></div>\\n    <div class="more" data-more-for="\${safeName}"><p class="copy">\${escapeHtml(about)}</p><div class="radar" data-radar="\${escapeHtml(labels)}" data-values="\${escapeHtml(values)}"></div></div>\\n  </div>\\n</article>\`;
    }

    async function deleteBarberServer(barberId){
      const id = String(barberId||'').trim(); if(!id) throw new Error('Missing barber id');
      return await api(\`/api/barbers/\${encodeURIComponent(id)}\`, { method:'PATCH', body: { active: false, public_enabled: false } });
    }
    async function patchBarberServer(barberId, patch){
      const id = String(barberId||'').trim(); if(!id) throw new Error('Missing barber id');
      return await api(\`/api/barbers/\${encodeURIComponent(id)}\`, { method:'PATCH', body: { ...(patch||{}) } });
    }

    // ============================================================
    // PER-DAY SCHEDULE (7 days, each with enabled + startMin + endMin)
    // ============================================================
    const DAY_NAMES_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const DAY_DEFAULTS_PERDIEM = [
      { enabled: false, startMin: 10*60, endMin: 20*60 }, // Sun
      { enabled: true,  startMin: 10*60, endMin: 20*60 }, // Mon
      { enabled: true,  startMin: 10*60, endMin: 20*60 }, // Tue
      { enabled: true,  startMin: 10*60, endMin: 20*60 }, // Wed
      { enabled: true,  startMin: 10*60, endMin: 20*60 }, // Thu
      { enabled: true,  startMin: 10*60, endMin: 20*60 }, // Fri
      { enabled: true,  startMin:  9*60, endMin: 20*60 }, // Sat
    ];

    function getPerDaySchedule(barberId) {
      const all = loadSchedules();
      const stored = all && barberId ? all[String(barberId)] : null;
      if (stored && stored.perDay && Array.isArray(stored.perDay) && stored.perDay.length === 7) {
        return stored.perDay.map((d, i) => ({
          enabled: !!d.enabled,
          startMin: Math.max(0, Math.min(1440, Number(d.startMin ?? DAY_DEFAULTS_PERDIEM[i].startMin))),
          endMin:   Math.max(0, Math.min(1440, Number(d.endMin   ?? DAY_DEFAULTS_PERDIEM[i].endMin))),
        }));
      }
      // Migrate from old flat format
      if (stored && typeof stored === 'object') {
        const days = Array.isArray(stored.days) ? stored.days.map(Number) : [1,2,3,4,5,6];
        const sm = Number(stored.startMin ?? 10*60), em = Number(stored.endMin ?? 20*60);
        return DAY_DEFAULTS_PERDIEM.map((def, i) => ({
          enabled: days.includes(i),
          startMin: days.includes(i) ? sm : def.startMin,
          endMin:   days.includes(i) ? em : def.endMin,
        }));
      }
      return DAY_DEFAULTS_PERDIEM.map(d => ({ ...d }));
    }

    function setPerDaySchedule(barberId, perDay) {
      if (!barberId || !Array.isArray(perDay) || perDay.length !== 7) return;
      const all = loadSchedules();
      const enabledDays = perDay.map((d,i) => d.enabled ? i : -1).filter(i => i >= 0);
      const startMins = perDay.filter(d => d.enabled).map(d => d.startMin);
      const endMins   = perDay.filter(d => d.enabled).map(d => d.endMin);
      all[String(barberId)] = {
        perDay,
        days: enabledDays,
        startMin: startMins.length ? Math.min(...startMins) : 10*60,
        endMin:   endMins.length   ? Math.max(...endMins)   : 20*60,
      };
      saveSchedules(all);
    }

    function minToTimeVal(min) {
      return String(Math.floor(min/60)).padStart(2,'0') + ':' + String(min%60).padStart(2,'0');
    }
    function timeValToMin(val, fallback) {
      const m = String(val||'').match(/^(\\d{1,2}):(\\d{2})$/);
      if (!m) return Number(fallback||0);
      return Math.max(0,Math.min(23,Number(m[1])))*60 + Math.max(0,Math.min(59,Number(m[2])));
    }

    function buildSchedGridHtml(perDay) {
      return '<div class="sched-grid">' + DAY_NAMES_SHORT.map((name, i) => {
        const d = perDay[i];
        return \`<div class="sched-day \${d.enabled?'on':'off'}" data-dow="\${i}">\` +
          \`<div class="sched-day-name">\${name}</div>\` +
          \`<button type="button" class="sched-toggle js-day-toggle" data-dow="\${i}">\${d.enabled?'ON':'OFF'}</button>\` +
          \`<div class="sched-time"><label>From</label>\` +
          \`<input type="time" class="js-day-start" data-dow="\${i}" value="\${minToTimeVal(d.startMin)}"/></div>\` +
          \`<div class="sched-time"><label>To</label>\` +
          \`<input type="time" class="js-day-end" data-dow="\${i}" value="\${minToTimeVal(d.endMin)}"/></div>\` +
          \`</div>\`;
      }).join('') + '</div>';
    }

    function bindSchedGrid(container) {
      container.querySelectorAll('.js-day-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const dow = Number(btn.dataset.dow);
          const dayEl = container.querySelector('.sched-day[data-dow="'+dow+'"]');
          const isOn = dayEl.classList.contains('on');
          dayEl.classList.toggle('on', !isOn);
          dayEl.classList.toggle('off', isOn);
          btn.textContent = isOn ? 'OFF' : 'ON';
        });
      });
    }

    function readSchedGrid(container) {
      return DAY_NAMES_SHORT.map((_, i) => {
        const dayEl = container.querySelector('.sched-day[data-dow="'+i+'"]');
        const enabled = dayEl ? dayEl.classList.contains('on') : false;
        const startInput = container.querySelector('.js-day-start[data-dow="'+i+'"]');
        const endInput   = container.querySelector('.js-day-end[data-dow="'+i+'"]');
        const sm = timeValToMin(startInput?.value, DAY_DEFAULTS_PERDIEM[i].startMin);
        const em = timeValToMin(endInput?.value,   DAY_DEFAULTS_PERDIEM[i].endMin);
        return { enabled, startMin: sm, endMin: Math.max(sm+30, em) };
      });
    }

    function parseTimeHHMMToMin(v, fallback){ const s = String(v||'').trim(), m = s.match(/^(\\d{1,2}):(\\d{2})$/); if(!m) return Number(fallback||0); return Math.max(0, Math.min(23, Number(m[1])))*60 + Math.max(0, Math.min(59, Number(m[2]))); }
    function workDaysCsvToIndexes(v){
      const map = { sun:0,sunday:0,mon:1,monday:1,tue:2,tues:2,tuesday:2,wed:3,wednesday:3,thu:4,thur:4,thurs:4,thursday:4,fri:5,friday:5,sat:6,saturday:6 };
      const out = String(v||'').split(',').map(x=>String(x||'').trim().toLowerCase()).filter(Boolean).map(x=>map[x]).filter(x=>x!==undefined);
      return Array.from(new Set(out));
    }
    function indexesToWorkDaysCsv(days){ const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; return (Array.isArray(days) ? days : []).map(n=>names[Number(n)]).filter(Boolean).join(', '); }
    function scheduleToPublicOffDays(days){ const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; const on = new Set((Array.isArray(days) ? days : []).map(n=>Number(n))); return names.filter((_,idx)=>!on.has(idx)); }

    function removeBarberLocally(barberId){
      const id = String(barberId||'').trim(); if(!id) return;
      state.barbers = state.barbers.filter(b=>String(b.id)!==id && String(b.serverId||'')!==id);
      state.events = state.events.filter(ev=>String(ev.barberId||'')!==id);
      document.documentElement.style.setProperty('--dayCols', String(Math.max(1, state.barbers.length)));
      mBarber.innerHTML = ''; state.barbers.forEach(b=>{ const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; mBarber.appendChild(opt); });
      sBarber.innerHTML = ''; state.barbers.forEach(b=>{ const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; sBarber.appendChild(opt); });
      aBarber.innerHTML = '<option value="">— Select —</option>'; state.barbers.forEach(b=>{ const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; aBarber.appendChild(opt); });
    }

    /* ========= Bookings API ========= */
    function mapBookingToEvent(b){
      const start = parseIsoMaybe(b.start_at||b.startAt||b.start) || new Date();
      const end = parseIsoMaybe(b.end_at||b.endAt||b.end);
      const dur = Number(b.duration_minutes||b.durationMin||b.duration||30);
      const endSafe = end || new Date(start.getTime() + dur*60000);
      const startMin = start.getHours()*60 + start.getMinutes();
      const durMin = Math.max(1, Math.round((endSafe-start)/60000));
      const paid = !!(b.paid || b.is_paid || b.payment_status==='paid' || b.paymentStatus==='paid');
      return {
        id: String(b.id||b.booking_id||b.uuid||uid('e')),
        date: isoDate(start), startMin, durMin,
        status: String(b.status||'booked'), paid,
        barberId: String(b.barber_id||b.barberId||'').trim(),
        barberName: String(b.barber_name||b.barberName||b.barber||'').trim(),
        serviceId: String(b.service_id||b.serviceId||'').trim(),
        serviceName: String(b.service_name||b.serviceName||b.service||'').trim(),
        clientName: String(b.client_name||b.clientName||b.client||b.customer||'Client'),
        clientPhone: String(b.client_phone||b.phone||''),
        notes: String(b.notes||b.note||b.customer_note||b.customerNote||''),
        photoUrl: bookingPhotoUrl(b),  /* ✅ використовує виправлену функцію */
        photoName: bookingPhotoName(b),
        _raw: b,
      };
    }

    function getVisibleRange(){
      const d = new Date(state.anchor); d.setHours(0,0,0,0);
      const from = new Date(d), to = new Date(d);
      to.setDate(to.getDate()+1); to.setHours(0,0,0,0);
      return { from, to };
    }

    async function loadBookings(){
      const { from, to } = getVisibleRange();
      const qs = \`?from=\${encodeURIComponent(toIsoLocal(from))}&to=\${encodeURIComponent(toIsoLocal(to))}\`;
      const json = await api('/api/bookings' + qs);
      const list = Array.isArray(json) ? json : (json?.bookings || []);
      const remote = list.map(mapBookingToEvent);
      const localUnsynced = state.events.filter(e=>!(e._raw?.id||e._raw?.booking_id||e._raw?.uuid));
      state.events = [...remote, ...localUnsynced];
      try{ await sendAvailabilityReportToServer(); }catch(e){}
    }

    function buildBookingPayload(ev){
      const d = new Date(ev.date+'T00:00:00'), start = new Date(d);
      start.setHours(Math.floor(ev.startMin/60), ev.startMin%60, 0, 0);
      const end = new Date(start.getTime() + ev.durMin*60000);
      const barber = state.barbers.find(b=>String(b.id)===String(ev.barberId));
      const service = getServicesCached().find(s=>String(s.id)===String(ev.serviceId));
      return {
        source: "crm", status: ev.status||'booked', paid: !!ev.paid,
        start_at: toIsoLocal(start), end_at: toIsoLocal(end), duration_minutes: ev.durMin,
        barber_id: String(ev.barberId||barber?.serverId||''), barber_name: barber?.name||ev.barberName||'',
        service_id: String(ev.serviceId||''), service_name: service?.name||ev.serviceName||'',
        client_name: ev.clientName||'Client', client_phone: ev.clientPhone||'',
        notes: ev.notes||'', customer_note: ev.notes||'',
        client_photo_url: ev.photoUrl||'', client_photo_name: ev.photoName||'',
        reference_photo_url: ev.photoUrl||'', reference_photo_name: ev.photoName||'',
        client: ev.clientName||'Client', phone: ev.clientPhone||'',
        barber: barber?.name||ev.barberName||'', service: service?.name||ev.serviceName||''
      };
    }

    async function saveBooking(ev){
      const payload = buildBookingPayload(ev);
      const backendId = ev?._raw?.id || ev?._raw?.booking_id || ev?._raw?.uuid || ev?.id || null;
      if(backendId && !String(backendId).startsWith('e_')){
        const updated = await api(\`/api/bookings/\${encodeURIComponent(String(backendId))}\`, { method:'PATCH', body: payload });
        ev._raw = updated; ev.id = String(updated.id||ev.id);
        try{ await sendAvailabilityReportToServer(); }catch(e){} return updated;
      }
      const created = await api('/api/bookings', { method:'POST', body: payload });
      ev._raw = created; ev.id = String(created.id||ev.id);
      try{ await sendAvailabilityReportToServer(); }catch(e){} return created;
    }

    async function removeBooking(ev){
      const backendId = ev?._raw?.id || ev?._raw?.booking_id || ev?._raw?.uuid || ev?.id || null;
      if(!backendId) return;
      await api(\`/api/bookings/\${encodeURIComponent(String(backendId))}\`, { method:'DELETE' });
    }

    async function sendPaymentToTerminal(ev){
      const backendId = ev?._raw?.id || ev?._raw?.booking_id || ev?._raw?.uuid || ev?.id || null;
      if(!backendId) throw new Error('Booking not saved yet — save first, then send to Terminal');
      const svc = getServicesCached().find(s=>s.id===ev.serviceId);
      const amount = svc?.price ? Number(String(svc.price).replace(/[^\\d.]/g,'')) : 0;
      const result = await api('/api/payments/terminal', { method:'POST', body: {
        booking_id: String(backendId),
        barber_id: ev.barberId,
        client_name: ev.clientName,
        service_name: ev.serviceName,
        amount: isFinite(amount) ? amount : 0,
        currency: 'USD',
        note: 'ELEMENT • ' + ev.clientName + ' • ' + ev.serviceName + ' • ' + minutesToHHMM(ev.startMin)
      }});
      // result has { ok, checkout_id, checkout_status, ... }
      return result;
    }

    /* ========= Rendering ========= */
    function renderTimes(){
      timesEl.innerHTML = '';
      function hourLabel(h){ if(h===0) return '12am'; if(h<12) return h+'am'; if(h===12) return '12pm'; return (h-12)+'pm'; }
      for(let i=0;i<endHour-startHour;i++){
        const div = document.createElement('div'); div.className = 't';
        div.style.top = (i*2*slotH)+'px'; div.textContent = hourLabel(startHour+i);
        timesEl.appendChild(div);
      }
    }

    function renderHead(){
      daysHead.innerHTML = '';
      const d = new Date(state.anchor); d.setHours(0,0,0,0);
      rangeLine.textContent = d.toLocaleDateString([], {weekday:'long',month:'long',day:'numeric',year:'numeric'});
      state.barbers.forEach(b=>{
        const cell = document.createElement('div'); cell.className = 'daycell';
        const left = document.createElement('div'); left.className = 'barberTop';
        const dot = document.createElement('div'); dot.className = 'barberDot'; dot.style.background = \`var(--\${b.color})\`;
        let photoEl = null;
        if(b.photo){ photoEl = document.createElement('img'); photoEl.className = 'barberPhoto'; photoEl.alt = b.name; photoEl.src = b.photo; }
        const txt = document.createElement('div'); txt.style.cssText = 'min-width:0;display:flex;flex-direction:column;gap:3px;';
        const name = document.createElement('div'); name.className = 'barberName'; name.textContent = b.name;
        const sub = document.createElement('div'); sub.className = 'barberSub'; sub.textContent = b.level ? b.level : 'Barber';
        txt.appendChild(name); txt.appendChild(sub);
        left.appendChild(dot); if(photoEl) left.appendChild(photoEl); left.appendChild(txt);
        cell.appendChild(left); daysHead.appendChild(cell);
      });
    }

    function renderGrid(){
      gridEl.innerHTML = '';
      const colsCount = Math.max(1, state.barbers.length);
      const dayIso = isoDate(state.anchor);
      document.documentElement.style.setProperty('--dayCols', String(colsCount));

      for(let i=0;i<colsCount;i++){
        const col = document.createElement('div'); col.className = 'col'; col.dataset.col = String(i);
        const barber = state.barbers[i];
        if(barber){
          const dow = dateIsoToDow(dayIso);
          const perDayBarber = getPerDaySchedule(barber.id);
          const dayInfoBarber = perDayBarber[dow] || DAY_DEFAULTS_PERDIEM[dow];
          const worksToday = dayInfoBarber.enabled;
          const fullH = (endHour-startHour)*2*slotH;
          if(!worksToday){ const all = document.createElement('div'); all.className = 'offHours top'; all.style.height = fullH+'px'; col.appendChild(all); }
          else{
            const topOff = (dayInfoBarber.startMin/30)*slotH, botOff = ((1440-dayInfoBarber.endMin)/30)*slotH;
            if(topOff>0){ const t = document.createElement('div'); t.className = 'offHours top'; t.style.height = topOff+'px'; col.appendChild(t); }
            if(botOff>0){ const b = document.createElement('div'); b.className = 'offHours bottom'; b.style.height = botOff+'px'; col.appendChild(b); }
          }
        }
        const totalSlots = (endHour-startHour)*2;
        for(let s=0;s<=totalSlots;s++){ const line = document.createElement('div'); line.className = 'slotline'+(s%2===0?' strong':''); line.style.top = (s*slotH)+'px'; col.appendChild(line); }

        col.addEventListener('click', (e)=>{
          if(e.target.closest('.event')) return;
          const rect = col.getBoundingClientRect(), y = e.clientY - rect.top;
          const slotIndex = Math.max(0, Math.min(Math.round(y/slotH), (endHour-startHour)*2));
          let startMin = clampToWorkHours((startHour*60)+slotIndex*30);
          const barber = state.barbers[i];
          if(barber){
            const sched = getBarberSchedule(barber.id), dow = dateIsoToDow(isoDate(state.anchor));
            const worksToday = Array.isArray(sched.days) && sched.days.includes(dow);
            if(!worksToday) return;
            startMin = clampToSchedule(startMin, sched);
          }
          openCreateAt({ date: isoDate(state.anchor), startMin, barberId: barber?.id||'' });
        });

        col.addEventListener('dragover', (e)=>{ e.preventDefault(); col.classList.add('drop-ok'); });
        col.addEventListener('dragleave', ()=> col.classList.remove('drop-ok'));
        col.addEventListener('drop', (e)=>{
          e.preventDefault(); col.classList.remove('drop-ok');
          const id = e.dataTransfer.getData('text/event-id'); if(!id) return;
          const ev = state.events.find(x=>x.id===id); if(!ev) return;
          const rect = col.getBoundingClientRect(), y = e.clientY - rect.top;
          const slotIndex = Math.max(0, Math.min(Math.round(y/slotH), (endHour-startHour)*2));
          ev.startMin = clampToWorkHours((startHour*60)+slotIndex*30);
          const barber = state.barbers[i]; ev.barberId = barber?.id||ev.barberId; ev.barberName = barber?.name||ev.barberName; ev.date = isoDate(state.anchor);
          (async()=>{ try{ await saveBooking(ev); }catch(err){ console.warn('saveBooking(drop):', err.message); } refresh(); })();
        });
        gridEl.appendChild(col);
      }
      renderNowLine(); renderEvents();
    }

    function chipClass(status){ if(status==='arrived') return 'ok'; if(status==='done') return 'done'; if(status==='noshow') return 'noshow'; return ''; }
    function eventTopPx(startMin){ return ((startMin-startHour*60)/30)*slotH; }
    function eventHeightPx(durMin){ return (durMin/30)*slotH; }

    function filterVisibleEvents(){
      const sess = getSession(), q = (state.query||'').trim().toLowerCase(), dayIso = isoDate(state.anchor);
      const authUser = window.ELEMENT_AUTH?.user;
      const authRole = authUser?.role || 'owner';
      const authBarberId = String(authUser?.barber_id || '');
      return state.events.filter(ev=>ev.date===dayIso).filter(ev=>{
        if (authRole === 'barber' && authBarberId) return String(ev.barberId||'') === authBarberId;
        if(sess?.role===ROLES.BARBER) return String(ev.barberId||'')===String(sess.barberId||'');
        return true;
      }).filter(ev=>{ if(!q) return true; return (ev.clientName||'').toLowerCase().includes(q)||(ev.barberName||'').toLowerCase().includes(q)||(ev.serviceName||'').toLowerCase().includes(q)||(ev.status||'').toLowerCase().includes(q)||(ev.paid?'paid':'').includes(q); });
    }

    function colIndexForEvent(ev){ const idx = state.barbers.findIndex(b=>String(b.id)===String(ev.barberId)); return idx >= 0 ? idx : 0; }

    function renderEvents(){
      //console.log('renderEvents, events:', state.events.filter(ev=>ev.date===isoDate(state.anchor)).map(ev=>ev.clientName+':'+minutesToHHMM(ev.startMin)));
      gridEl.querySelectorAll('.event').forEach(x=>x.remove());
      const cols = Array.from(gridEl.querySelectorAll('.col'));
      const items = filterVisibleEvents();
      const byCol = new Map();
      items.forEach(ev=>{ const colIndex = colIndexForEvent(ev); if(!byCol.has(colIndex)) byCol.set(colIndex, []); byCol.get(colIndex).push({ ...ev, _colIndex: colIndex }); });

      byCol.forEach((list, colIndex)=>{
        list.sort((a,b)=>a.startMin-b.startMin);
        const lanes = [];
        list.forEach(ev=>{
          let lane = 0;
          while(true){ if(!lanes[lane]){ lanes[lane]=[]; break; } const last = lanes[lane][lanes[lane].length-1]; if(ev.startMin >= last.startMin+last.durMin) break; lane++; }
          ev._lane = lane; lanes[lane].push(ev);
        });
        const laneCount = Math.max(1, ...list.map(x=>x._lane+1));
        const col = cols[colIndex]; if(!col) return;

        list.forEach(ev=>{
          const div = document.createElement('div'); div.className = 'event'; div.draggable = false; div.dataset.id = ev.id;
          div.style.top = eventTopPx(ev.startMin)+'px'; div.style.height = eventHeightPx(ev.durMin)+'px';
          const gap = 6, laneW = (col.clientWidth-16-(laneCount-1)*gap)/laneCount, left = 8+ev._lane*(laneW+gap);
          div.style.left = left+'px'; div.style.right = 'auto'; div.style.width = laneW+'px';
          const barber = state.barbers.find(b=>String(b.id)===String(ev.barberId));
          div.dataset.color = barber?.color||'c2';
          const statusChip = \`<span class="chip \${chipClass(ev.status)}">\${escapeHtml(ev.status)}</span>\`;
          const paidChip = ev.paid ? \`<span class="chip paid">Paid</span>\` : '';
          const photoChip = bookingHasPhoto(ev) ? \`<span class="chip">Photo</span>\` : '';
          const notesChip = bookingHasNotes(ev) ? \`<span class="chip">Notes</span>\` : '';
          div.innerHTML = \`<div class="top"><div class="name">\${escapeHtml(ev.clientName)}</div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">\${photoChip}\${notesChip}\${paidChip}\${statusChip}</div></div><div class="meta">\${escapeHtml(minutesToHHMM(ev.startMin))} • \${escapeHtml(ev.serviceName||'Service')}</div><div class="resize" title="Resize"></div>\`;
          div.addEventListener('dragstart', (e)=>{ e.preventDefault(); });
          div.addEventListener('click', (e)=>{ if(e.target?.classList?.contains('resize')) return; openModal(ev.id); });
          div.querySelector('.resize').addEventListener('pointerdown', (e)=>{
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            startResize(e, ev.id, div);
          });
          div.addEventListener('pointerdown', (e)=>{
            e.preventDefault(); // prevent browser native drag
            if(e.target && (e.target.classList.contains('resize') || e.target.closest('.resize'))) return;
            startPointerDrag(e, ev.id, div);
          });
          col.appendChild(div);
        });
      });
    }
</script>

  <script>
function startPointerDrag(e, id, el){
      if(e.button!==0) return;
      if(e.target && (e.target.classList.contains('resize') || e.target.closest('.resize'))) return;
      const ev = state.events.find(x=>x.id===id); if(!ev) return;

      const minPx = slotH / 30; // px per 1 minute
      const totalH = (endHour - startHour) * 2 * slotH;

      // Where inside the event user clicked
      const elRect = el.getBoundingClientRect();
      const offsetY = e.clientY - elRect.top;

      const origCol = el.parentElement;
      const allCols = Array.from(gridEl.querySelectorAll('.col'));
      let currentColIdx = allCols.indexOf(origCol);
      if(currentColIdx < 0) currentColIdx = 0;

      let dragging = false;
      const startClientY = e.clientY;
      // Use ev.startMin to get exact pixel position (not el.style.top which may have rounding)
      const startTopPx = (ev.startMin - startHour*60) / 30 * slotH;
      const metaEl = el.querySelector('.meta');

      function onMove(m){
        if(!dragging){
          if(Math.abs(m.clientY - startClientY) < 4) return;
          dragging = true;
          el.style.cursor = 'grabbing';
          el.style.zIndex = '50';
          el.style.opacity = '0.9';
          // Disable overflow:hidden on all cols during drag
          allCols.forEach(c => c.style.overflow = 'visible');
        }

        // Vertical: move by delta from start
        const dy = m.clientY - startClientY;
        const rawTop = startTopPx + dy;
        const maxTop = totalH - el.offsetHeight;
        const snapped = Math.round(Math.max(0, Math.min(maxTop, rawTop)) / minPx) * minPx;
        el.style.top = snapped + 'px';

        // Horizontal: switch column when cursor center crosses boundary
        const colW = allCols[0]?.offsetWidth || 200;
        const gridRect = gridEl.getBoundingClientRect();
        const hoverCol = Math.max(0, Math.min(allCols.length - 1,
          Math.floor((m.clientX - gridRect.left) / colW)));

        if(hoverCol !== currentColIdx){
          allCols[hoverCol].appendChild(el);
          currentColIdx = hoverCol;
        }

        // Live time label
        const liveMin = startHour * 60 + Math.round(snapped / minPx);
        if(metaEl) metaEl.textContent = minutesToHHMM(liveMin) + ' • ' + escapeHtml(ev.serviceName || 'Service');
      }

      function onUp(){
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);

        allCols.forEach(c => c.style.overflow = '');
        el.style.cursor = '';
        el.style.opacity = '';
        el.style.zIndex = '';

        if(!dragging) return;

        const topPx = parseFloat(el.style.top) || 0;
        let newStartMin = startHour * 60 + Math.round(topPx / minPx);
        newStartMin = Math.max(startHour * 60, Math.min(newStartMin, endHour * 60 - Math.max(1, ev.durMin)));

        const newBarber = state.barbers[currentColIdx];
        const newBarberId = newBarber?.id || ev.barberId;
        const newBarberName = newBarber?.name || ev.barberName;

        const perDayDrag = getPerDaySchedule(newBarberId);
        const dowDrag = dateIsoToDow(ev.date);
        const dayInfoDrag = perDayDrag[dowDrag] || DAY_DEFAULTS_PERDIEM[dowDrag];
        if(dayInfoDrag.enabled){
          newStartMin = Math.max(dayInfoDrag.startMin, Math.min(newStartMin, dayInfoDrag.endMin - Math.max(1, ev.durMin)));
        }

        // Revert visually first
        renderEvents();

        if(newStartMin === ev.startMin && newBarberId === ev.barberId) return;

        // Show styled confirm
        const dcEl = document.getElementById('dragConfirm');
        const dcTime = document.getElementById('dcTime');
        const dcBarber = document.getElementById('dcBarber');
        const dcClient = document.getElementById('dcClient');
        const dcOk = document.getElementById('dcOk');
        const dcCancel = document.getElementById('dcCancel');

        dcTime.textContent = minutesToHHMM(newStartMin);
        dcBarber.textContent = newBarberName || '';
        dcClient.textContent = ev.clientName || '';
        dcEl.classList.add('open');

        function cleanup(){ dcEl.classList.remove('open'); dcOk.onclick = null; dcCancel.onclick = null; }

        dcCancel.onclick = ()=>{ cleanup(); };
        dcOk.onclick = ()=>{
          cleanup();
          ev.startMin = newStartMin;
          ev.barberId = newBarberId;
          ev.barberName = newBarberName;
          ev.date = isoDate(state.anchor);
          renderEvents();
          (async()=>{ try{ await saveBooking(ev); }catch(err){ console.warn('drag save:', err.message); } })();
        };
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    }
    function startResize(e, id, el){
      const ev = state.events.find(x=>x.id===id); if(!ev) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const minPx = slotH/30; // px per minute
      const startY = e.clientY;
      const startH = parseFloat(el.style.height) || el.offsetHeight;

      // Use window capture, not el capture, to avoid conflict with drag
      function onMove(m){
        m.preventDefault();
        const dy = m.clientY - startY;
        const newH = Math.max(minPx*5, startH + dy);
        const snappedH = Math.round(newH/minPx)*minPx;
        el.style.height = snappedH + 'px';
        // ✅ Show duration in real-time
        const liveDur = Math.max(5, Math.round(snappedH/minPx));
        const metaEl = el.querySelector('.meta');
        if(metaEl){
          const ev2 = state.events.find(x=>x.id===id);
          if(ev2) metaEl.textContent = minutesToHHMM(ev2.startMin) + ' • ' + escapeHtml(ev2.serviceName||'Service') + ' (' + liveDur + 'min)';
        }
      }

      function onUp(){
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);

        const heightPx = parseFloat(el.style.height)||minPx;
        let newDurMin = Math.max(5, Math.round(heightPx/minPx));

        const maxEnd = endHour*60;
        if(ev.startMin + newDurMin > maxEnd) newDurMin = Math.max(5, maxEnd - ev.startMin);

        const perDayResize = getPerDaySchedule(ev.barberId);
        const dowResize = dateIsoToDow(ev.date);
        const dayInfoResize = perDayResize[dowResize] || DAY_DEFAULTS_PERDIEM[dowResize];
        if(dayInfoResize.enabled){
          if(ev.startMin + newDurMin > dayInfoResize.endMin) newDurMin = Math.max(5, dayInfoResize.endMin - ev.startMin);
        }

        // Revert visually first
        renderEvents();

        if(newDurMin === ev.durMin) return;

        // Show styled confirm
        const dcEl = document.getElementById('dragConfirm');
        const dcTime = document.getElementById('dcTime');
        const dcBarber = document.getElementById('dcBarber');
        const dcClient = document.getElementById('dcClient');
        const dcOk = document.getElementById('dcOk');
        const dcCancel = document.getElementById('dcCancel');
        const dcTitle = document.getElementById('dragConfirmTitle');

        dcTitle.textContent = 'Resize booking';
        dcTime.textContent = newDurMin + ' min';
        dcBarber.textContent = ev.barberName || '';
        dcClient.textContent = ev.clientName || '';
        dcEl.classList.add('open');

        function cleanup(){ 
          dcEl.classList.remove('open'); 
          dcOk.onclick = null; 
          dcCancel.onclick = null;
          dcTitle.textContent = 'Move booking';
        }

        dcCancel.onclick = ()=>{ cleanup(); };
        dcOk.onclick = ()=>{
          cleanup();
          ev.durMin = newDurMin;
          renderEvents();
          (async()=>{ try{ await saveBooking(ev); }catch(err){ console.warn('resize save:', err.message); } })();
        };
      }

      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    }
    function renderNowLine(){
      gridEl.querySelectorAll('.nowLine').forEach(x=>x.remove());
      if(!isAnchorToday()) return;
      const now = new Date(), nowMin = now.getHours()*60+now.getMinutes();
      if(nowMin < startHour*60 || nowMin > endHour*60) return;
      const line = document.createElement('div'); line.className = 'nowLine';
      line.style.top = ((nowMin-startHour*60)/30*slotH)+'px';
      line.innerHTML = \`<div class="nowDot"></div><div class="nowLabel">\${escapeHtml(minutesToHHMM(nowMin))}</div>\`;
      gridEl.appendChild(line);
    }
    function startNowLineTimer(){ setInterval(()=> renderNowLine(), 30000); }

    function refreshClientDatalist(){
      clientList.innerHTML = '';
      loadClients().slice(0,200).forEach(c=>{ const opt = document.createElement('option'); opt.value = c.name; clientList.appendChild(opt); });
    }

    function serviceAssignedToBarber(s, barberId){ const ids = Array.isArray(s.barberIds) ? s.barberIds.map(String).filter(Boolean) : []; if(!ids.length) return true; return ids.includes(String(barberId)); }
    function servicesForBarber(barberId){ return getServicesCached().filter(s=>serviceAssignedToBarber(s, barberId)); }
    function refreshServiceSelectForBarber2(barberId){
      const list = servicesForBarber(barberId); mService.innerHTML = '';
      if(!list.length){ const opt = document.createElement('option'); opt.value = ''; opt.textContent = '— No services assigned (open Settings) —'; mService.appendChild(opt); return; }
      list.forEach(s=>{ const opt = document.createElement('option'); opt.value = s.id; opt.textContent = \`\${s.name}\${s.durationMin?' • '+s.durationMin+'m':''}\${s.price?' • $'+s.price:''}\`; mService.appendChild(opt); });
    }

    function overlaps(aStart, aDur, bStart, bDur){ const aEnd=aStart+aDur, bEnd=bStart+bDur; return aStart < bEnd && bStart < aEnd; }
    function busyIntervalsFor(barberId, dateIso, excludeEventId=null){ return state.events.filter(ev=>ev.date===dateIso && String(ev.barberId)===String(barberId)).filter(ev=>!excludeEventId||String(ev.id)!==String(excludeEventId)).map(ev=>({ start: ev.startMin, dur: ev.durMin })); }

    function buildAvailableStarts({ barberId, dateIso, durationMin, excludeEventId=null }){
      const dur = Math.max(30, Math.round((durationMin||30)/5)*5);
      const dow = dateIsoToDow(dateIso);
      const perDay = getPerDaySchedule(barberId);
      const dayInfo = perDay[dow] || DAY_DEFAULTS_PERDIEM[dow];
      if(!dayInfo.enabled) return [];
      const startMin = Math.max(0, Math.min(1440, dayInfo.startMin)), endMin = Math.max(0, Math.min(1440, dayInfo.endMin));
      const busy = busyIntervalsFor(barberId, dateIso, excludeEventId);

      // If today — skip slots that already passed
      const now = new Date();
      const todayIso = isoDate(now);
      const nowMin = (dateIso === todayIso) ? (now.getHours()*60 + now.getMinutes()) : 0;

      const starts = [];
      for(let t=startMin; t+dur<=endMin; t+=dur){
        if(t < nowMin) continue; // skip past slots
        const ok = !busy.some(b=>{ const aEnd=t+dur, bEnd=b.start+b.dur; return t<bEnd && b.start<aEnd; });
        if(ok) starts.push(t);
      }
      return starts;
    }

    function fillTimeSelectForCurrentContext({ barberId, dateIso, durationMin, excludeEventId=null, preferStartMin=null }){
      const starts = buildAvailableStarts({ barberId, dateIso, durationMin, excludeEventId });
      mStart.innerHTML = '';
      if(!starts.length){ const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No slots'; mStart.appendChild(opt); return; }
      starts.forEach(t=>{ const opt = document.createElement('option'); opt.value = String(t); opt.textContent = minutesToHHMM(t); mStart.appendChild(opt); });
      const pref = preferStartMin != null ? String(preferStartMin) : '';
      if(pref && Array.from(mStart.options).some(o=>o.value===pref)) mStart.value = pref;
      else mStart.value = mStart.options[0].value;
    }

    function fillDurationSelect(durationMin){ mDur.innerHTML = ''; const opt = document.createElement('option'); opt.value = String(durationMin||30); opt.textContent = \`\${durationMin||30} min\`; mDur.appendChild(opt); mDur.value = opt.value; }

    /* ========= Booking Modal ========= */
    function openCreateAt({ date, startMin, barberId }){
      const id = uid('e'), barber = state.barbers.find(b=>String(b.id)===String(barberId))||state.barbers[0]||null;
      const ev = { id, date: date||isoDate(state.anchor), startMin: startMin??(10*60), durMin: 30, status: 'booked', paid: false, barberId: barber?.id||'', barberName: barber?.name||'', serviceId: '', serviceName: '', clientName: '', clientPhone: '', notes: '', photoUrl: '', photoName: '', _raw: null };
      state.events.push(ev); openModal(id, { isNew:true });
    }

    function openModal(id, { isNew=false } = {}){
      const ev = state.events.find(x=>x.id===id); if(!ev) return;
      state.selectedId = id;
      const c = getClientByName(ev.clientName);
      ev.photoUrl = normalizePhotoUrl(ev.photoUrl || bookingPhotoUrl(ev._raw));
      ev.photoName = String(ev.photoName || bookingPhotoName(ev._raw) || '').trim();
      mClient.value = ev.clientName||'';
      mPhone.value = ev.clientPhone || c?.phone || '';
      mNotes.value = ev.notes || c?.notes || '';
      mBarber.value = ev.barberId||(state.barbers[0]?.id||'');
      refreshServiceSelectForBarber2(mBarber.value);
      if(ev.serviceId && Array.from(mService.options).some(o=>o.value===ev.serviceId)) mService.value = ev.serviceId;
      else mService.value = mService.options[0]?.value||'';
      mDate.value = ev.date||isoDate(state.anchor);
      const isExisting = !!(ev._raw?.id||ev._raw?.booking_id||ev._raw?.uuid);
      statusWrap.style.display = isExisting ? 'block' : 'none';
      if(isExisting) mStatus.value = ev.status||'booked'; else mStatus.value = 'booked';
      payBlock.style.display = isExisting ? 'block' : 'none';
      payHint.textContent = isExisting ? 'Send payment request to Square Terminal.' : '—';
      renderPaymentUI(ev);
      const service = getServicesCached().find(s=>s.id===mService.value);
      ev.durMin = Math.max(30, Math.round((service?.durationMin||30)/5)*5);
      fillDurationSelect(ev.durMin);
      fillTimeSelectForCurrentContext({ barberId: mBarber.value, dateIso: mDate.value, durationMin: ev.durMin, excludeEventId: ev.id, preferStartMin: ev.startMin });
      const barber = state.barbers.find(b=>String(b.id)===String(mBarber.value));
      mHint.textContent = \`Barber: \${barber?.name||'—'} • Date: \${mDate.value}\`;
      mDelete.textContent = isNew||!isExisting ? 'Cancel' : 'Delete';
      renderBookingPreview(ev);
      refreshClientDatalist();
      modalWrap.classList.add('open');
    }

    function renderPaymentUI(ev){
      payStatus.innerHTML = '';
      const methodLabels = { terminal:'Terminal', cash:'Cash', zelle:'Zelle', other:'Other', card:'Card' };
      const methodBtns = document.getElementById('payMethodBtns');
      const meta = document.getElementById('payMeta');
      const summary = document.getElementById('paySummary');

      if (ev.paid) {
        // ── PAID STATE: hide method buttons, show paid info + refund ──
        const statusChip = document.createElement('span');
        statusChip.className = 'chip paid';
        statusChip.textContent = 'Paid ✓';
        payStatus.appendChild(statusChip);
        if (ev.paymentMethod) {
          const mc = document.createElement('span');
          mc.className = 'chip';
          mc.textContent = methodLabels[ev.paymentMethod] || ev.paymentMethod;
          payStatus.appendChild(mc);
        }
        if (ev.tipAmount > 0) {
          const tc = document.createElement('span');
          tc.className = 'chip';
          tc.textContent = 'Tip $' + Number(ev.tipAmount).toFixed(2);
          payStatus.appendChild(tc);
        }
        if (meta) meta.textContent = 'Payment recorded';
        if (methodBtns) methodBtns.style.display = 'none';
        showCashNote(false); showPayTipSection(false);
        // Show refund button
        let refundRow = document.getElementById('payRefundRow');
        if (!refundRow) {
          refundRow = document.createElement('div');
          refundRow.id = 'payRefundRow';
          refundRow.style.cssText = 'margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
          const refundBtn = document.createElement('button');
          refundBtn.className = 'btn';
          refundBtn.style.cssText = 'height:36px;font-size:12px;padding:0 14px;border-color:rgba(255,107,107,.45);color:#ffd0d0;';
          refundBtn.textContent = '↩ Refund / undo';
          refundBtn.addEventListener('click', () => undoPayment(ev));
          refundRow.appendChild(refundBtn);
          document.getElementById('payHint').before(refundRow);
        }
        refundRow.style.display = 'flex';
        // Update summary (no tax change now, just show what was charged)
        const method = ev.paymentMethod || 'terminal';
        updatePaySummary(ev, method);
      } else {
        // ── UNPAID STATE: show method buttons ──
        const statusChip = document.createElement('span');
        statusChip.className = 'chip';
        statusChip.textContent = 'Not paid';
        payStatus.appendChild(statusChip);
        if (meta) meta.textContent = 'Choose method below';
        if (methodBtns) methodBtns.style.display = 'flex';
        // Hide refund row
        const refundRow = document.getElementById('payRefundRow');
        if (refundRow) refundRow.style.display = 'none';
        showCashNote(false); showPayTipSection(false);
        const method = _selectedPayMethod || 'terminal';
        updatePaySummary(ev, method);
        // Highlight last used method
        document.querySelectorAll('.pay-method-btn').forEach(btn => {
          btn.classList.toggle('active', ev.paymentMethod === btn.dataset.method);
        });
      }
    }

    async function undoPayment(ev) {
      if (!await dlgConfirm('It will be removed from the payments list.', 'Undo payment', 'Remove')) return;
      const backendId = ev._raw?.id || ev._raw?.booking_id || ev._raw?.uuid || ev.id;
      const isReal = backendId && !String(backendId).startsWith('e_');
      try {
        // 1. Delete from payment_requests (remove from Payments page)
        if (isReal) {
          await api('/api/payments/delete-by-booking', {
            method: 'DELETE',
            body: { booking_id: String(backendId) }
          }).catch(() => {}); // best-effort
        }
        // 2. Mark booking as unpaid
        if (isReal) {
          await api('/api/bookings/' + encodeURIComponent(String(backendId)), {
            method: 'PATCH', body: { paid: false, payment_method: null, tip: 0, tip_amount: 0 }
          });
        }
        ev.paid = false; ev.paymentMethod = null; ev.tipAmount = 0;
        _selectedPayMethod = 'terminal';
        // Reset confirm button
        const cb = document.getElementById('payConfirmBtn');
        if (cb) cb.style.display = 'none';
        renderPaymentUI(ev);
        if (payHint) payHint.textContent = 'Payment removed. Choose method to re-charge.';
        renderEvents();
      } catch(e) {
        dlgAlert(e.message, 'Error', 'error');
      }
    }

    function closeModal(){ 
      stopTerminalPoll();
      const ev = state.selectedId ? state.events.find(x=>x.id===state.selectedId) : null;
      // Remove ghost events (new unsaved bookings)
      if(ev && ev._raw === null) {
        state.events = state.events.filter(x=>x.id!==ev.id);
        renderEvents();
      }
      modalWrap.classList.remove('open'); state.selectedId = null; const box = document.getElementById('bookingPreviewBox'); if(box){ box.style.display='none'; box.innerHTML=''; } 
    }

    function recomputeTimeSlotsForModal(){
      const ev = state.events.find(x=>x.id===state.selectedId); if(!ev) return;
      const service = getServicesCached().find(s=>s.id===mService.value), dur = service?.durationMin||30;
      ev.durMin = Math.max(30, Math.round(dur/5)*5); fillDurationSelect(ev.durMin);
      const prefer = parseInt(mStart.value||'', 10);
      fillTimeSelectForCurrentContext({ barberId: mBarber.value, dateIso: mDate.value, durationMin: ev.durMin, excludeEventId: ev.id, preferStartMin: isFinite(prefer) ? prefer : ev.startMin });
    }

    mBarber.addEventListener('change', async ()=>{
      const ev = state.events.find(x=>x.id===state.selectedId), barberId = String(mBarber.value||'');
      if(ev){ ev.barberId = barberId; const barber = state.barbers.find(b=>String(b.id)===barberId); ev.barberName = barber?.name||ev.barberName; }
      if(!getServicesCached().length){ try{ await loadServicesServer(); }catch(e){ console.warn(e.message); } }
      refreshServiceSelectForBarber2(barberId);
      const hasCurrent = ev?.serviceId && Array.from(mService.options).some(o=>o.value===String(ev.serviceId));
      if(hasCurrent){ mService.value = String(ev.serviceId); }
      else{ mService.value = mService.options[0]?.value||''; if(ev){ ev.serviceId = String(mService.value||''); const svc = getServicesCached().find(s=>String(s.id)===String(ev.serviceId)); ev.serviceName = svc?.name||''; } }
      recomputeTimeSlotsForModal();
    });

    mService.addEventListener('change', ()=>{ const ev = state.events.find(x=>x.id===state.selectedId); if(!ev) return; const service = getServicesCached().find(s=>s.id===mService.value); ev.serviceId = mService.value; ev.serviceName = service?.name||''; recomputeTimeSlotsForModal(); });
    mDate.addEventListener('change', ()=> recomputeTimeSlotsForModal());
    mClient.addEventListener('change', ()=>{ const c = getClientByName(mClient.value); if(c){ if(!mPhone.value) mPhone.value = c.phone||''; if(!mNotes.value) mNotes.value = c.notes||''; } });
    mClose.addEventListener('click', closeModal);
    modalWrap.addEventListener('click', (e)=>{ if(e.target===modalWrap) closeModal(); });

    mSave.addEventListener('click', ()=>{
      const ev = state.events.find(x=>x.id===state.selectedId); if(!ev) return;
      const clientName = normalizeName(mClient.value); if(!clientName){ dlgAlert('Please enter a client name.', 'Required'); return; return; }
      const barberId = mBarber.value, barber = state.barbers.find(b=>String(b.id)===String(barberId));
      if(!barberId||!barber){ dlgAlert('Please choose a barber.', 'Required'); return; return; }
      const serviceId = mService.value; if(!serviceId){ dlgAlert('Please choose a service.', 'Required'); return; return; }
      const service = getServicesCached().find(s=>s.id===serviceId); if(!service){ dlgAlert('Service not found.', 'Error', 'error'); return; return; }
      const date = mDate.value; if(!date){ dlgAlert('Please choose a date.', 'Required'); return; return; }
      const startMin = parseInt(mStart.value||'', 10); if(!isFinite(startMin)){ dlgAlert('Please choose a time.', 'Required'); return; return; }
      const durMin = Math.max(30, Math.round((service.durationMin||30)/5)*5);
      const startClamped = clampToWorkHours(startMin);
      if(startClamped+durMin > endHour*60){ dlgAlert('Selected time does not fit in work hours.', 'Time conflict'); return; return; }
      const busy = busyIntervalsFor(barberId, date, ev.id);
      if(busy.some(b=>{ const aEnd=startClamped+durMin, bEnd=b.start+b.dur; return startClamped<bEnd && b.start<aEnd; })){ dlgAlert('This time slot is already booked.', 'Conflict'); recomputeTimeSlotsForModal(); return; }
      ev.clientName = clientName; ev.clientPhone = String(mPhone.value||'').trim(); ev.notes = String(mNotes.value||'').trim();
      ev.photoUrl = normalizePhotoUrl(ev.photoUrl||bookingPhotoUrl(ev._raw)); ev.photoName = String(ev.photoName||bookingPhotoName(ev._raw)||'').trim();
      ev.barberId = barberId; ev.barberName = barber.name; ev.serviceId = serviceId; ev.serviceName = service.name;
      const isExisting = !!(ev._raw?.id||ev._raw?.booking_id||ev._raw?.uuid);
      ev.status = isExisting ? (mStatus.value||'booked') : 'booked';
      ev.date = date; ev.startMin = startClamped; ev.durMin = durMin;
      upsertClientByName(ev.clientName, { phone: ev.clientPhone, notes: ev.notes }); refreshClientDatalist();
      (async()=>{ try{ await saveBooking(ev); }catch(err){ console.warn('save booking:', err.message); dlgAlert(err.message, 'API Error', 'error'); } renderBookingPreview(ev); refresh(); })();
      closeModal();
    });

    mDelete.addEventListener('click', async ()=>{
      const ev = state.events.find(x=>x.id===state.selectedId); if(!ev) return;
      const hasBackend = !!(ev._raw?.id||ev._raw?.booking_id||ev._raw?.uuid);
      if(!hasBackend){ state.events = state.events.filter(x=>x.id!==ev.id); closeModal(); refresh(); return; }
      if(!await dlgConfirm('This booking will be permanently deleted.', 'Delete booking', 'Delete')) return;
      try{ await removeBooking(ev); }catch(err){ console.warn('delete booking:', err.message); dlgAlert(err.message, 'API Error', 'error'); }
      state.events = state.events.filter(x=>x.id!==ev.id); closeModal(); refresh();
    });

    // ── Shop settings (tax/fees) ──────────────────────────────
    let _shopSettings = null;
    async function loadShopSettingsCRM() {
      try { _shopSettings = await api('/api/settings'); } catch(e) { _shopSettings = {}; }
    }

    function getServicePrice(ev) {
      const svc = getServicesCached().find(s => s.id === ev.serviceId);
      return svc?.price ? Number(String(svc.price).replace(/[^\\d.]/g,'')) : 0;
    }

    function calcTax(amount) {
      const tax = _shopSettings?.tax;
      if (!tax?.enabled || !tax?.rate) return { taxAmt: 0, total: amount, label: '' };
      const rate = Number(tax.rate) / 100;
      const label = String(tax.label || 'Tax') + ' (' + tax.rate + '%)';
      if (tax.included_in_price) {
        const base = amount / (1 + rate);
        return { taxAmt: Math.round((amount - base)*100)/100, total: amount, label };
      }
      const taxAmt = Math.round(amount * rate * 100) / 100;
      return { taxAmt, total: amount + taxAmt, label };
    }

    function updatePaySummary(ev, method) {
      const summary = document.getElementById('paySummary');
      const svcAmtEl = document.getElementById('paySvcAmt');
      const taxRowEl = document.getElementById('payTaxRow');
      const taxLabelEl = document.getElementById('payTaxLabel');
      const taxAmtEl = document.getElementById('payTaxAmt');
      const totalRowEl = document.getElementById('payTotalRow');
      const totalAmtEl = document.getElementById('payTotalAmt');
      if (!summary) return;

      const amount = getServicePrice(ev);
      if (!amount) { summary.style.display = 'none'; return; }

      // Cash = no tax
      const isCash = method === 'cash';
      const { taxAmt, total, label } = isCash ? { taxAmt: 0, total: amount, label: '' } : calcTax(amount);

      summary.style.display = 'block';
      svcAmtEl.textContent = '$' + amount.toFixed(2);

      if (taxAmt > 0 && !isCash) {
        taxRowEl.style.display = 'flex';
        taxLabelEl.textContent = label;
        taxAmtEl.textContent = '+$' + taxAmt.toFixed(2);
        totalRowEl.style.display = 'flex';
        totalAmtEl.textContent = '$' + total.toFixed(2);
      } else {
        taxRowEl.style.display = 'none';
        totalRowEl.style.display = 'none';
      }
      return { amount, taxAmt, total };
    }

    function showPayTipSection(show) {
      const ts = document.getElementById('payTipSection');
      const cn = document.getElementById('payCashNote');
      if (ts) ts.style.display = show ? 'block' : 'none';
      if (cn) cn.style.display = 'none';
    }
    function showCashNote(show) {
      const ts = document.getElementById('payTipSection');
      const cn = document.getElementById('payCashNote');
      if (ts) ts.style.display = 'none';
      if (cn) cn.style.display = show ? 'block' : 'none';
    }

    function getTipAmount() {
      const tipYesActive = document.getElementById('tipBtnYes')?.classList.contains('active');
      if (!tipYesActive) return 0;
      return parseFloat(document.getElementById('payTipInput')?.value || '0') || 0;
    }

    // Tip yes/no buttons
    document.getElementById('tipBtnNo')?.addEventListener('click', () => {
      document.getElementById('tipBtnNo').classList.add('active');
      document.getElementById('tipBtnYes').classList.remove('active');
      document.getElementById('payTipInputWrap').style.display = 'none';
    });
    document.getElementById('tipBtnYes')?.addEventListener('click', () => {
      document.getElementById('tipBtnYes').classList.add('active');
      document.getElementById('tipBtnNo').classList.remove('active');
      document.getElementById('payTipInputWrap').style.display = 'block';
      document.getElementById('payTipInput')?.focus();
    });

    // ── Payment handlers (Terminal / Cash / Zelle / Other) ─────
    let _terminalPollTimer = null;
    let _terminalPollCount = 0;
    let _selectedPayMethod = 'terminal'; // default

    function stopTerminalPoll() {
      if (_terminalPollTimer) { clearInterval(_terminalPollTimer); _terminalPollTimer = null; }
      _terminalPollCount = 0;
    }

    function setPayUI({ hint, btnLabel, btnDisabled, statusClass }) {
      if (payHint) payHint.textContent = hint || '';
      const activeBtn = document.querySelector('.pay-method-btn.active');
      if (activeBtn) { activeBtn.textContent = btnLabel || _selectedPayMethod; activeBtn.disabled = !!btnDisabled; }
      if (payStatus) {
        payStatus.innerHTML = '';
        const chip = document.createElement('span');
        chip.className = 'chip ' + (statusClass || '');
        chip.textContent = statusClass === 'paid' ? 'Paid ✓' : statusClass === 'ok' ? 'Processing…' : statusClass === 'noshow' ? 'Cancelled' : 'Not paid';
        payStatus.appendChild(chip);
      }
    }

    // Method button selection
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        // Block if already paid
        const _curEv = state.events.find(x => x.id === state.selectedId);
        if (_curEv?.paid) return;
        const method = btn.dataset.method;
        _selectedPayMethod = method;
        document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const _btnEv = state.events.find(x => x.id === state.selectedId);
        if (_btnEv) updatePaySummary(_btnEv, method);
        // Reset tip UI
        document.querySelectorAll('.pay-tip-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('payTipInputWrap').style.display = 'none';
        if (document.getElementById('payTipInput')) document.getElementById('payTipInput').value = '';
        // Show appropriate UI per method
        if (method === 'cash') {
          showCashNote(true);
          showPayTipSection(false);
        } else if (method === 'terminal') {
          showCashNote(false);
          showPayTipSection(false);
        } else {
          showCashNote(false);
          showPayTipSection(true);
        }
        // Show confirm button (not for terminal — terminal triggers immediately)
        const confirmBtn = document.getElementById('payConfirmBtn');
        if (confirmBtn) {
          confirmBtn.style.display = method === 'terminal' ? 'none' : 'block';
          const labels = { cash:'Confirm Cash payment', zelle:'Confirm Zelle payment', other:'Confirm payment' };
          confirmBtn.textContent = labels[method] || 'Confirm payment';
        }
        if (payHint) payHint.textContent = '';
        const ev = state.events.find(x => x.id === state.selectedId);
        if (!ev) return;
        if (method === 'terminal') {
          // Terminal executes immediately
          await handleTerminalPayment(ev, btn);
        }
        // cash/zelle/other — wait for confirm button click
      });
    });

    async function handleManualPayment(ev, method, btn) {
      stopTerminalPoll();
      const tipRaw = method === 'cash' ? 0 : getTipAmount();
      const svc    = getServicesCached().find(s => s.id === ev.serviceId);
      const amount = svc?.price ? Number(String(svc.price).replace(/[^\\d.]/g,'')) : 0;
      const methodLabels = { cash:'Cash', zelle:'Zelle', other:'Other' };
      btn.disabled = true;
      btn.textContent = 'Saving…';
      if (payHint) payHint.textContent = 'Saving ' + (methodLabels[method]||method) + ' payment…';
      try {
        const backendId = ev._raw?.id || ev._raw?.booking_id || ev._raw?.uuid || ev.id;
        const isRealBooking = backendId && !String(backendId).startsWith('e_');

        // 1. Log payment to Firestore via /api/payments/terminal
        //    Backend detects source='cash'/'zelle'/'other' and saves immediately (no Square)
        await api('/api/payments/terminal', {
          method: 'POST',
          body: {
            booking_id: isRealBooking ? String(backendId) : '',
            amount: amount,
            tip: tipRaw, tip_amount: tipRaw,
            currency: 'USD',
            client_name: ev.clientName,
            client_phone: ev.clientPhone || '',
            barber_id: ev.barberId,
            barber_name: ev.barberName || '',
            service_name: ev.serviceName,
            source: method,         // 'cash' | 'zelle' | 'other'
            payment_method: method,
            note: 'ELEMENT • ' + ev.clientName + ' • ' + ev.serviceName + ' • ' + minutesToHHMM(ev.startMin)
          }
        });

        // 2. Update booking as paid
        if (isRealBooking) {
          await api('/api/bookings/' + encodeURIComponent(String(backendId)), {
            method: 'PATCH',
            body: { paid: true, payment_method: method, tip: tipRaw, tip_amount: tipRaw, service_amount: amount }
          });
        }

        // 3. Update local event state
        ev.paid = true;
        ev.paymentMethod = method;
        ev.tipAmount = tipRaw;
        // Hide confirm button
        const cb = document.getElementById('payConfirmBtn');
        if (cb) cb.style.display = 'none';
        renderPaymentUI(ev);
        if (payHint) payHint.textContent = (methodLabels[method] || method) + ' payment recorded ✓';
        renderEvents();
      } catch(err) {
        if (payHint) payHint.textContent = 'Error: ' + err.message;
        dlgAlert(err.message, 'Payment Error', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = methodLabels[method] || method;
      }
    }

    async function pollTerminalStatus(checkout_id, ev) {
      _terminalPollCount = 0;
      stopTerminalPoll();
      setPayUI({ hint: 'Waiting for payment on Terminal…', btnLabel: 'Waiting…', btnDisabled: true, statusClass: 'ok' });
      _terminalPollTimer = setInterval(async () => {
        _terminalPollCount++;
        if (_terminalPollCount > 45) {
          stopTerminalPoll();
          setPayUI({ hint: 'Timed out. Check Terminal manually.', btnLabel: 'Terminal', btnDisabled: false, statusClass: '' });
          return;
        }
        try {
          const res = await api('/api/payments/terminal/status/' + encodeURIComponent(checkout_id));
          const status = String(res?.status || '').toUpperCase();
          if (status === 'COMPLETED') {
            stopTerminalPoll();
            ev.paid = true; ev.paymentMethod = 'terminal';
            try { await saveBooking(ev); } catch(e) { console.warn('save paid:', e.message); }
            setPayUI({ hint: 'Payment completed ✓', btnLabel: 'Terminal', btnDisabled: false, statusClass: 'paid' });
            renderPaymentUI(ev); renderEvents();
          } else if (status === 'CANCELED' || status === 'CANCEL_REQUESTED') {
            stopTerminalPoll();
            setPayUI({ hint: 'Payment cancelled on Terminal.', btnLabel: 'Terminal', btnDisabled: false, statusClass: 'noshow' });
          } else if (status === 'IN_PROGRESS') {
            setPayUI({ hint: 'Client is paying… (' + _terminalPollCount * 4 + 's)', btnLabel: 'Waiting…', btnDisabled: true, statusClass: 'ok' });
          }
        } catch(e) { console.warn('poll error:', e.message); }
      }, 4000);
    }

    // ── Confirm button handler ────────────────────────────────
    document.getElementById('payConfirmBtn')?.addEventListener('click', async () => {
      const ev = state.events.find(x => x.id === state.selectedId);
      if (!ev || !_selectedPayMethod || _selectedPayMethod === 'terminal') return;
      const confirmBtn = document.getElementById('payConfirmBtn');
      confirmBtn.style.display = 'none';
      await handleManualPayment(ev, _selectedPayMethod, confirmBtn);
    });

    async function handleTerminalPayment(ev, btn) {
      stopTerminalPoll();
      btn.disabled = true; btn.textContent = 'Sending…';
      if (payHint) payHint.textContent = 'Sending to Terminal…';
      try {
        const result = await sendPaymentToTerminal(ev);
        const checkout_id = result?.checkout_id || null;
        if (!checkout_id) {
          if (payHint) payHint.textContent = 'Sent. No checkout_id returned.';
          btn.disabled = false; btn.textContent = 'Terminal';
          return;
        }
        await pollTerminalStatus(checkout_id, ev);
      } catch(err) {
        if (payHint) payHint.textContent = 'Error: ' + err.message;
        btn.disabled = false; btn.textContent = 'Terminal';
        dlgAlert(err.message, 'Payment Error', 'error');
      }
    }

    // payBtn is the Terminal button (declared earlier in DOM refs)

    /* ========= Settings UI ========= */
    function openSettings(){
      const authRole = window.ELEMENT_AUTH?.user?.role || 'owner';
      const isBarber = authRole === 'barber';
      renderBarbersList(); renderServicesList(); renderClientsList();
      const pins = loadPins(); pOwner.value = pins.owner||''; pReception.value = pins.reception||''; pBarber.value = pins.barber||'';
      updateWhoAmI(); if(apiBaseInput) apiBaseInput.value = API_BASE||''; if(apiKeyInput) apiKeyInput.value = API_KEY||''; hideApiStatus();
      const addForm = document.getElementById('addBarberForm');
      if (addForm) addForm.style.display = isBarber ? 'none' : 'grid';
      if (isBarber) {
        ['tabBarbers','tabServices','tabPins','tabAccount'].forEach(id=>{
          const el = document.getElementById(id); if(el) el.style.display = 'none';
        });
        showPanel('clients');
      } else {
        ['tabBarbers','tabServices','tabPins','tabAccount'].forEach(id=>{
          const el = document.getElementById(id); if(el) el.style.display = '';
        });
      }
      settingsWrap.classList.add('open');
    }
    tabBarbers.addEventListener('click', ()=>showPanel('barbers'));
    tabServices.addEventListener('click', ()=>showPanel('services'));
    tabClients.addEventListener('click', ()=>showPanel('clients'));
    tabPins.addEventListener('click', ()=>showPanel('pins'));
    tabAccount.addEventListener('click', ()=>showPanel('account'));

    function renderBarbersList(){
      barbersList.innerHTML = '';
      state.barbers.forEach(b=>{
        const row = document.createElement('div'); row.className = 'row'; row.style.alignItems = 'flex-start';
        const perDay = getPerDaySchedule(b.id), currentPhoto = String(b.photo||'').trim();
        row.innerHTML = \`<div class="rowLeft" style="flex:1;min-width:0;gap:8px;">
          <div class="rowName">\${escapeHtml(b.name)}</div>
          <div class="rowMeta">\${escapeHtml(String(b.level||'Barber'))} • ID: \${escapeHtml(String(b.serverId||b.id||''))} • Login: \${escapeHtml(String(b.username||'—'))} • PIN: \${escapeHtml(String(b.password||'—'))}</div>
          <div class="form" style="padding:0;grid-template-columns:1fr 1fr;gap:8px;">
            <div class="field"><label>Skill / level</label><input class="js-b-level" value="\${escapeHtml(String(b.level||''))}"/></div>
            <div class="field"><label>Base price</label><input class="js-b-price" value="\${escapeHtml(String(b.basePrice||''))}" inputmode="decimal"/></div>
            <div class="field" style="grid-column:1/-1;"><label>Change photo</label><input type="file" class="js-b-photo" accept="image/*"/></div>
            \${currentPhoto ? \`<div class="field" style="grid-column:1/-1;"><label>Current photo</label><img src="\${escapeHtml(currentPhoto)}" alt="\${escapeHtml(b.name)}" style="width:72px;height:72px;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.12);"/></div>\` : ''}
          </div>
          <div class="field" style="margin:8px 0 0;">
            <label style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);">Schedule — click day to toggle ON/OFF, set hours per day</label>
            <div class="js-sched-grid">\${buildSchedGridHtml(perDay)}</div>
          </div>
        </div>
        <div class="rowActions" style="align-items:flex-start;"><button class="btn js-save">Save</button><button class="btn danger js-del">Delete</button></div>\`;

        bindSchedGrid(row.querySelector('.js-sched-grid'));
        row.querySelector('.js-del').addEventListener('click', async ()=>{
          if(!await dlgConfirm(\`Remove <strong>\${b.name}</strong> from the team?\`, 'Delete barber', 'Delete')) return;
          const btn = row.querySelector('.js-del'); btn.disabled = true; btn.textContent = 'Deleting...';
          try{ await deleteBarberServer(b.serverId||b.id); removeBarberLocally(b.serverId||b.id); renderBarbersList(); refresh(); try{ await sendAvailabilityReportToServer(); }catch(e){} }
          catch(e){ dlgAlert(e.message, 'Delete failed', 'error'); }finally{ btn.disabled = false; btn.textContent = 'Delete'; }
        });

        row.querySelector('.js-save').addEventListener('click', async ()=>{
          const btn = row.querySelector('.js-save'); btn.disabled = true; btn.textContent = 'Saving...';
          try{
            const perDayNew = readSchedGrid(row);
            const enabledDays = perDayNew.map((d,i)=>d.enabled?i:-1).filter(i=>i>=0);
            if(!enabledDays.length) throw new Error('Enable at least one working day');
            let nextPhoto = String(b.photo||'').trim();
            const file = row.querySelector('.js-b-photo')?.files?.[0];
            if(file) nextPhoto = await fileToDataURL(file);
            const nextLevel = String(row.querySelector('.js-b-level').value||'').trim(), nextPrice = String(row.querySelector('.js-b-price').value||'').trim();
            const startMins = perDayNew.filter(d=>d.enabled).map(d=>d.startMin);
            const endMins   = perDayNew.filter(d=>d.enabled).map(d=>d.endMin);
            const globalStart = startMins.length ? Math.min(...startMins) : 10*60;
            const globalEnd   = endMins.length   ? Math.max(...endMins)   : 20*60;
            const schedule = { startMin: globalStart, endMin: globalEnd, days: enabledDays, perDay: perDayNew };
            const publicOffDays = scheduleToPublicOffDays(enabledDays);
            await patchBarberServer(b.serverId||b.id, { level: nextLevel, public_role: String(b.publicRole||nextLevel||'').trim(), base_price: nextPrice, photo_url: nextPhoto, public_off_days: publicOffDays, schedule, work_schedule: schedule });
            b.level = nextLevel; b.basePrice = nextPrice; b.photo = nextPhoto; b.offDays = publicOffDays; b.schedule = schedule; b.workDays = enabledDays;
            setPerDaySchedule(b.id, perDayNew); renderBarbersList(); refresh(); try{ await sendAvailabilityReportToServer(); }catch(e){}
          }catch(e){ dlgAlert(e.message, 'Save failed', 'error'); }finally{ btn.disabled = false; btn.textContent = 'Save'; }
        });
        barbersList.appendChild(row);
      });
    }

    bAdd.addEventListener('click', async ()=>{
      const name = normalizeName(bName.value); if(!name){ dlgAlert('Barber name is required.', 'Required'); return; return; }
      const password = String(bPassword?.value||'').trim(); if(!password){ dlgAlert('Password or PIN is required.', 'Required'); return; return; }
      let photoData = '';
      const file = bPhoto.files && bPhoto.files[0] ? bPhoto.files[0] : null;
      if(file){ try{ photoData = await fileToDataURL(file); }catch(e){ dlgAlert(e.message, 'Photo error', 'error'); return; } }
      if(photoData && photoData.length > 900000){ dlgAlert('Photo is too large. Please use a smaller image.', 'Photo too large', 'error'); return; }
      bAdd.disabled = true; bAdd.textContent = 'Adding…';
      try{
        await addBarberToAPI({ name, level: normalizeName(bLevel.value), photoBase64: photoData, about: String(bAbout?.value||'').trim(), username: String(bUsername?.value||'').trim()||name.toLowerCase().replace(/\\s+/g,'.'), password, basePrice: String(bPrice?.value||'').trim(), publicRole: String(bRolePublic?.value||'').trim(), offDays: splitCsvList(bOffDays?.value||''), radarLabels: splitCsvList(bRadarLabels?.value||'FADE,LONG,BEARD,STYLE,DETAIL'), radarValues: parseRadarValues(bRadarValues?.value||'4.5,4.5,4.5,4.5,4.5'), publicEnabled: String(bPublicEnabled?.value||'true')==='true', schedule: { startMin: 8*60, endMin: 20*60, days: [1,2,3,4,5,6] }, workDays: [1,2,3,4,5,6] });
        [bName,bLevel,bAbout,bUsername,bPassword,bPrice,bRolePublic,bOffDays].forEach(el=>{ if(el) el.value=''; });
        if(bRadarLabels) bRadarLabels.value='FADE,LONG,BEARD,STYLE,DETAIL'; if(bRadarValues) bRadarValues.value='4.5,4.5,4.5,4.5,4.5'; if(bPublicEnabled) bPublicEnabled.value='true'; bPhoto.value='';
        await loadBarbers(); refresh(); dlgAlert('Barber added successfully!', 'Done ✓');
      }catch(err){ dlgAlert(err.message, 'API Error', 'error'); }finally{ bAdd.disabled = false; bAdd.textContent = '+ Add barber'; }
    });

    function renderServicesList(){
      const list = getServicesCached(); servicesList.innerHTML = '';
      if(!list.length){ servicesList.innerHTML = \`<div class="hint">No services yet.</div>\`; return; }
      list.forEach(s=>{
        const assigned = (s.barberIds||[]).map(id=>state.barbers.find(b=>String(b.id)===String(id))?.name).filter(Boolean);
        const meta = \`\${s.durationMin||30}m\${s.price?' • $'+s.price:''} • Assigned: \${assigned.length?assigned.join(', '):'—'}\`;
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = \`<div class="rowLeft"><div class="rowName">\${escapeHtml(s.name)}</div><div class="rowMeta">\${escapeHtml(meta)}</div></div><div class="rowActions"><button class="btn" data-act="toggle">Toggle assign</button><button class="btn danger" data-act="delete">Delete</button></div>\`;
        row.querySelector('[data-act="toggle"]').addEventListener('click', async ()=>{
          const bid = String(sBarber.value||''); if(!bid) return;
          const svc = getServicesCached().find(x=>x.id===s.id); if(!svc) return;
          const set = new Set(svc.barberIds||[]); if(set.has(bid)) set.delete(bid); else set.add(bid);
          try{ await patchServiceServer(s.id, { barberIds: Array.from(set) }); await loadServicesServer(); renderServicesList(); if(modalWrap.classList.contains('open')){ refreshServiceSelectForBarber2(mBarber.value); recomputeTimeSlotsForModal(); } }catch(err){ dlgAlert(err.message, 'API Error', 'error'); }
        });
        row.querySelector('[data-act="delete"]').addEventListener('click', async ()=>{
          if(!await dlgConfirm('This service will be removed.', 'Delete service', 'Delete')) return;
          try{ await deleteServiceServer(s.id); await loadServicesServer(); renderServicesList(); if(modalWrap.classList.contains('open')){ refreshServiceSelectForBarber2(mBarber.value); recomputeTimeSlotsForModal(); } }catch(err){ dlgAlert(err.message, 'API Error', 'error'); }
        });
        servicesList.appendChild(row);
      });
    }

    sAdd.addEventListener('click', async ()=>{
      const name = String(sName.value||'').trim(), barberId = String(sBarber.value||'').trim(), durMin = Number(sDur.value||30)||30, priceStr = String(sPrice.value||'').trim();
      if(!name){ dlgAlert('Service name is required.', 'Required'); return; return; } if(!barberId){ dlgAlert('Please choose a barber.', 'Required'); return; return; }
      const existing = getServicesCached().find(x=>String(x.name||'').trim().toLowerCase()===name.toLowerCase());
      const price_cents = Number.isFinite(Number(String(priceStr).replace(/[^\\d.]/g,''))) ? Math.max(0, Math.round(Number(String(priceStr).replace(/[^\\d.]/g,''))*100)) : 0;
      sAdd.disabled = true; sAdd.textContent = 'Saving…';
      try{
        if(existing){ await patchServiceServer(existing.id, { barberIds: [barberId], duration_minutes: durMin, price_cents }); }
        else{ await upsertServiceServer({ name, duration_minutes: durMin, price_cents, version: '1', barberIds: [barberId] }); }
        await loadServicesServer(); renderServicesList();
        if(modalWrap.classList.contains('open')){ renderServiceSelectForBarber(mBarber.value); recomputeTimeSlotsForModal(); }
        sName.value = ''; sPrice.value = '';
      }catch(err){ dlgAlert(err.message, 'API Error', 'error'); }finally{ sAdd.disabled = false; sAdd.textContent = '+ Add / Assign service'; }
    });

    function renderClientsList(){
      const list = loadClients(); clientsList.innerHTML = '';
      if(!list.length){ clientsList.innerHTML = \`<div class="hint">No clients yet.</div>\`; return; }
      list.slice(0,250).forEach(c=>{
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = \`<div class="rowLeft"><div class="rowName">\${escapeHtml(c.name)}</div><div class="rowMeta">\${escapeHtml(c.phone?c.phone:'—')}\${c.notes?' • '+escapeHtml(c.notes):''}</div></div><div class="rowActions"><button class="btn" data-act="edit">Edit</button><button class="btn danger" data-act="delete">Delete</button></div>\`;
        row.querySelector('[data-act="edit"]').addEventListener('click', ()=>{ cName.value = c.name||''; cPhone.value = c.phone||''; cNotes.value = c.notes||''; cAdd.textContent = 'Save client'; cAdd.dataset.editId = c.id; showPanel('clients'); });
        row.querySelector('[data-act="delete"]').addEventListener('click', async ()=>{ if(!await dlgConfirm('This client record will be removed.', 'Delete client', 'Delete')) return; const all = loadClients().filter(x=>x.id!==c.id); saveClients(all); renderClientsList(); refreshClientDatalist(); });
        clientsList.appendChild(row);
      });
    }

    cAdd.addEventListener('click', ()=>{
      const name = normalizeName(cName.value); if(!name){ dlgAlert('Client name is required.', 'Required'); return; }
      const phone = String(cPhone.value||'').trim(), notes = String(cNotes.value||'').trim(), editId = cAdd.dataset.editId||'', all = loadClients();
      if(editId){ const idx = all.findIndex(x=>x.id===editId); if(idx>=0){ all[idx] = { ...all[idx], name, phone, notes }; saveClients(all); } cAdd.dataset.editId = ''; cAdd.textContent = '+ Add client'; }
      else{ upsertClientByName(name, { phone, notes }); }
      cName.value = ''; cPhone.value = ''; cNotes.value = ''; renderClientsList(); refreshClientDatalist();
    });

    pSave.addEventListener('click', ()=>{ savePins({ owner: String(pOwner.value||'').trim()||'1403', reception: String(pReception.value||'').trim()||'2222', barber: String(pBarber.value||'').trim()||'1111' }); dlgAlert('PIN settings saved!', 'Saved ✓'); });
    logoutBtn2.addEventListener('click', ()=>{ clearSession(); updateWhoAmI(); closeSettings(); showAuth('Logged out'); });
    if(apiStatusClose) apiStatusClose.addEventListener('click', hideApiStatus);

    if(apiSaveBtn) apiSaveBtn.addEventListener('click', async ()=>{
      const base = (apiBaseInput?.value||'').trim(), key = (apiKeyInput?.value||'').trim();
      if(!base){ showApiStatus('Enter API Base URL'); return; }
      setApiConfig(base, key); showApiStatus('Saved. Reloading data…');
      try{ await loadBarbers(); }catch(e){} refresh();
    });

    if(apiTestBtn) apiTestBtn.addEventListener('click', async ()=>{
      const base = (apiBaseInput?.value||'').trim(), key = (apiKeyInput?.value||'').trim();
      if(!base){ showApiStatus('Enter API Base URL'); return; }
      const prevBase = API_BASE, prevKey = API_KEY;
      API_BASE = String(base).replace(/\\/+$/,''); API_KEY = String(key).trim();
      apiTestBtn.disabled = true; apiTestBtn.textContent = 'Testing…';
      try{ await api('/api/barbers'); showApiStatus('✅ API OK: /api/barbers responded'); }
      catch(err){ showApiStatus('❌ API error: '+err.message); }
      finally{ API_BASE = prevBase; API_KEY = prevKey; apiTestBtn.disabled = false; apiTestBtn.textContent = 'Test'; }
    });

    /* ========= Auth ========= */
    aRole.addEventListener('change', ()=>{ aBarberWrap.style.display = aRole.value===ROLES.BARBER ? 'block' : 'none'; });
    aClear.addEventListener('click', ()=>{ aPin.value = ''; authErr.style.display = 'none'; });
    aLogin.addEventListener('click', ()=>{
      const role = aRole.value, pin = (aPin.value||'').trim(), pins = loadPins();
      const barberId = role===ROLES.BARBER ? (aBarber.value||'') : '', barberName = role===ROLES.BARBER ? (state.barbers.find(b=>b.id===barberId)?.name||'') : '';
      if(!pin) return showAuth('Enter PIN');
      if((pins[role]||'')!==pin) return showAuth('Wrong PIN');
      if(role===ROLES.BARBER && !barberId) return showAuth('Choose barber');
      setSession({ role, barberId, barberName }); hideAuth(); updateWhoAmI(); refresh();
    });

    /* ========= Controls ========= */
    function shiftDay(dir){ state.anchor = addDays(state.anchor, dir); state.anchor.setHours(0,0,0,0); refresh(); }
    function goToday(){ const d = new Date(); d.setHours(0,0,0,0); state.anchor = d; refresh(); }
    btnPrev.addEventListener('click', ()=>shiftDay(-1));
    btnNext.addEventListener('click', ()=>shiftDay(1));
    btnToday.addEventListener('click', goToday);
    dateBtn.addEventListener('click', openDateModal);
    dateClose?.addEventListener('click', closeDateModal);
    dateWrap?.addEventListener('click', (e)=>{ if(e.target===dateWrap) closeDateModal(); });
    datePrev?.addEventListener('click', ()=>{ const m = startOfMonth(dateModal.month||state.anchor); m.setMonth(m.getMonth()-1); dateModal.month = m; renderDateModal(); });
    dateNext?.addEventListener('click', ()=>{ const m = startOfMonth(dateModal.month||state.anchor); m.setMonth(m.getMonth()+1); dateModal.month = m; renderDateModal(); });
    dateTodayBtn?.addEventListener('click', ()=>{ const t = new Date(); t.setHours(0,0,0,0); dateModal.selected = t; dateModal.month = startOfMonth(t); setAnchorFromDate(t); closeDateModal(); });
    btnNew.addEventListener('click', ()=>{
      const now = new Date(), startMin = clampToWorkHours(now.getHours()*60+Math.round(now.getMinutes()/30)*30);
      openCreateAt({ date: isoDate(state.anchor), startMin, barberId: state.barbers[0]?.id||'' });
    });
    search.addEventListener('input', (e)=>{ state.query = e.target.value||''; renderEvents(); });

    /* ========= Refresh ========= */
    let refreshLock = false;
    async function refresh(){
      if(refreshLock) return; refreshLock = true;
      try{
        if(!requireAuth()) return;
        renderTimes(); renderHead(); renderGrid();
        try{ await loadBookings(); }catch(err){ console.warn('loadBookings:', err.message); }
        const svcAll = getServicesCached();
        state.events.forEach(ev=>{
          if(!ev.barberName) ev.barberName = state.barbers.find(b=>String(b.id)===String(ev.barberId))?.name||ev.barberName;
          if(!ev.serviceName && ev.serviceId) ev.serviceName = svcAll.find(s=>s.id===ev.serviceId)?.name||ev.serviceName;
        });
        renderNowLine(); renderEvents(); refreshClientDatalist();
      }finally{ refreshLock = false; }
    }

    /* ========= Init ========= */
    (async function init(){
      loadShopSettingsCRM().catch(()=>{});
      const d = new Date(); d.setHours(0,0,0,0); state.anchor = d;
      updateWhoAmI();
      try{
        await loadBarbers();
        try{ await loadServicesServer(); }catch(e){ console.warn('loadServicesServer:', e.message); }
      }catch(err){
        console.warn('loadBarbers:', err.message);
        state.barbers = []; document.documentElement.style.setProperty('--dayCols','1');
        mBarber.innerHTML = ''; sBarber.innerHTML = ''; aBarber.innerHTML = '<option value="">— Select —</option>'; renderBarbersList();
        try{ await loadServicesServer(); }catch(e){ console.warn('loadServicesServer:', e.message); }
      }
      hideAuth(); // Auth disabled

      // Role-based UI restrictions
      (function(){
        const user = window.ELEMENT_AUTH?.user;
        if (!user) return;
        const role = user.role || 'owner';
        if (role === 'barber') {
          const sb = document.getElementById('settingsBtn');
          if (sb) sb.style.display = 'none';
          const w = document.getElementById('whoami');
          if (w) w.textContent = user.name || user.username || 'Barber';
        }
      })();

      startNowLineTimer(); refresh();
    })();
  
  // ── Styled dialog system ───────────────────────────────────
  const _dlgOverlay = document.getElementById('dlgOverlay');
  const _dlgWin     = document.getElementById('dlgWin');
  const _dlgTitle   = document.getElementById('dlgTitle');
  const _dlgMsg     = document.getElementById('dlgMsg');
  const _dlgBtns    = document.getElementById('dlgBtns');
  let _dlgResolve   = null;

  function dlgOpen(opts) {
    _dlgTitle.textContent = opts.title || '';
    _dlgMsg.innerHTML = opts.msg || '';
    _dlgBtns.innerHTML = '';
    (opts.buttons || [{ label:'OK', value:true, style:'primary' }]).forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      const styles = {
        primary: 'height:40px;padding:0 20px;border-radius:999px;border:1px solid rgba(10,132,255,.75);background:rgba(10,132,255,.18);color:#d7ecff;font-weight:900;font-size:13px;cursor:pointer;',
        default: 'height:40px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-weight:700;font-size:13px;cursor:pointer;',
        danger:  'height:40px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,107,107,.55);background:rgba(255,107,107,.12);color:#ffd0d0;font-weight:900;font-size:13px;cursor:pointer;',
      };
      btn.style.cssText = styles[b.style || 'default'];
      btn.addEventListener('click', () => { dlgClose(); if (_dlgResolve) _dlgResolve(b.value); });
      _dlgBtns.appendChild(btn);
    });
    _dlgOverlay.style.opacity = '1'; _dlgOverlay.style.pointerEvents = 'auto';
    _dlgWin.style.opacity = '1'; _dlgWin.style.pointerEvents = 'auto';
    _dlgWin.style.transform = 'translate(-50%,-50%) scale(1)';
  }

  function dlgClose() {
    _dlgOverlay.style.opacity = '0'; _dlgOverlay.style.pointerEvents = 'none';
    _dlgWin.style.opacity = '0'; _dlgWin.style.pointerEvents = 'none';
    _dlgWin.style.transform = 'translate(-50%,-50%) scale(.9)';
  }

  _dlgOverlay?.addEventListener('click', () => { dlgClose(); if (_dlgResolve) _dlgResolve(false); });

  function dlgConfirm(msg, title, dangerLabel) {
    return new Promise(resolve => {
      _dlgResolve = resolve;
      dlgOpen({ title: title || 'Confirm', msg, buttons: [
        { label: 'Cancel', style: 'default', value: false },
        { label: dangerLabel || 'OK', style: dangerLabel ? 'danger' : 'primary', value: true }
      ]});
    });
  }

  function dlgAlert(msg, title, type) {
    return new Promise(resolve => {
      _dlgResolve = resolve;
      dlgOpen({ title: title || (type === 'error' ? 'Error' : 'Notice'), msg, buttons: [
        { label: 'OK', style: type === 'error' ? 'danger' : 'primary', value: true }
      ]});
    });
  }


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

  <!-- Photo Lightbox -->
  <div id="photoLightbox">
    <button class="close-btn" onclick="closeLightbox()">✕</button>
    <img id="lightboxImg" src="" alt="Reference photo"/>
  </div>
  <!-- Drag Confirm -->
  <div id="dragConfirm">
    <div id="dragConfirmCard">
      <div id="dragConfirmTitle">Move booking</div>
      <div id="dragConfirmBody">
        <span class="barber-tag" id="dcBarber"></span>
        <span class="time" id="dcTime">—</span>
        <span class="barber-tag" id="dcClient"></span>
      </div>
      <div class="dragConfirmBtns">
        <button class="btn" id="dcCancel">Cancel</button>
        <button class="btn primary" id="dcOk">Move</button>
      </div>
    </div>
  </div>

<!-- ── Styled dialog modal ────────────────────────────────── -->
<div id="dlgOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:9000;opacity:0;pointer-events:none;transition:opacity .22s ease;"></div>
<div id="dlgWin" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);width:min(380px,90vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98));box-shadow:0 24px 80px rgba(0,0,0,.7);padding:24px 22px 18px;z-index:9001;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .22s ease;">
  <div id="dlgTitle" style="font-family:'Julius Sans One',sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:rgba(255,255,255,.55);margin-bottom:10px;"></div>
  <div id="dlgMsg" style="font-size:14px;font-weight:600;line-height:1.55;color:#e9e9e9;margin-bottom:20px;"></div>
  <div style="display:flex;gap:10px;justify-content:flex-end;" id="dlgBtns"></div>
</div>

</body>
`
