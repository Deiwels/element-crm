'use client'
export default function SignInPage() {
  const html = `
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#000;color:#e9e9e9;font-family:Inter,system-ui,-apple-system,sans-serif;}
.login-wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000;padding:20px;z-index:9999;}
.card{width:100%;max-width:400px;border-radius:24px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));box-shadow:0 24px 80px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.04);backdrop-filter:blur(20px);padding:36px 32px 32px;}
.logo{font-family:"Julius Sans One",sans-serif;letter-spacing:.22em;text-transform:uppercase;font-size:20px;text-align:center;margin-bottom:6px;}
.tagline{text-align:center;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:32px;}
.field{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.50);}
input{height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.30);color:#fff;padding:0 16px;font-size:15px;font-family:inherit;outline:none;transition:border-color .18s,box-shadow .18s;width:100%;}
input:focus{border-color:rgba(10,132,255,.65);box-shadow:0 0 0 3px rgba(10,132,255,.18);}
input::placeholder{color:rgba(255,255,255,.25);}
.btn-login{width:100%;height:52px;margin-top:8px;border-radius:14px;border:1px solid rgba(10,132,255,.65);background:rgba(10,132,255,.14);box-shadow:0 0 0 1px rgba(10,132,255,.18) inset,0 0 24px rgba(10,132,255,.20);color:#d7ecff;font-family:inherit;font-size:14px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .18s ease;}
.btn-login:hover:not(:disabled){background:rgba(10,132,255,.22);transform:translateY(-1px);}
.btn-login:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.error{margin-top:14px;padding:12px 16px;border-radius:12px;border:1px solid rgba(255,107,107,.30);background:rgba(255,107,107,.08);color:#ffd0d0;font-size:13px;display:none;}
.error.show{display:block;}
.hint{margin-top:20px;text-align:center;font-size:11px;color:rgba(255,255,255,.25);letter-spacing:.06em;}
.spinner{display:inline-block;width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.18);border-top-color:#fff;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px;}
@keyframes spin{to{transform:rotate(360deg);}}
</style>
<div class="login-wrap">
  <div class="card">
    <div class="logo">Element</div>
    <div class="tagline">CRM \xb7 Staff portal</div>
    <div class="field"><label>Username</label><input type="text" id="username" placeholder="Enter your username" autocomplete="username" autocapitalize="none" spellcheck="false"/></div>
    <div class="field"><label>Password</label><input type="password" id="password" placeholder="Enter your password" autocomplete="current-password"/></div>
    <button class="btn-login" id="btnLogin">Sign in</button>
    <div class="error" id="errMsg"></div>
    <div class="hint">Accounts are created by the owner.</div>
  </div>
</div>
<script>
const API_BASE='https://element-crm-api-431945333485.us-central1.run.app';
const btnLogin=document.getElementById('btnLogin');
const errMsg=document.getElementById('errMsg');
const usernameI=document.getElementById('username');
const passwordI=document.getElementById('password');
function showErr(msg){errMsg.textContent=msg;errMsg.classList.add('show');}
function hideErr(){errMsg.classList.remove('show');}
const existingToken=localStorage.getItem('ELEMENT_TOKEN');
if(existingToken){
  fetch(API_BASE+'/api/auth/me',{headers:{'Authorization':'Bearer '+existingToken}})
    .then(r=>r.json()).then(d=>{
      if(d.user){const role=d.user.role||'barber';const params=new URLSearchParams(window.location.search);window.location.href=params.get('redirect')||(role==='barber'?'/calendar':'/dashboard');}
    }).catch(()=>{localStorage.removeItem('ELEMENT_TOKEN');localStorage.removeItem('ELEMENT_USER');});
}
async function doLogin(){
  const username=usernameI.value.trim(),password=passwordI.value;
  if(!username||!password){showErr('Enter username and password.');return;}
  hideErr();btnLogin.disabled=true;btnLogin.innerHTML='<span class="spinner"><\/span>Signing in\u2026';
  try{
    const res=await fetch(API_BASE+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Login failed');
    localStorage.setItem('ELEMENT_TOKEN',data.token);
    localStorage.setItem('ELEMENT_USER',JSON.stringify(data.user));
    const role=data.user?.role||'barber';
    const params=new URLSearchParams(window.location.search);
    window.location.href=params.get('redirect')||(role==='barber'?'/calendar':'/dashboard');
  }catch(e){showErr(e.message||'Login failed');btnLogin.disabled=false;btnLogin.textContent='Sign in';}
}
btnLogin.addEventListener('click',doLogin);
[usernameI,passwordI].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();}));
<\/script>
`
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
