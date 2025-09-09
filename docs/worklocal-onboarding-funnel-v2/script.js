
(function(){
  const steps = Array.from(document.querySelectorAll('.step'));
  const total = steps.length;
  const state = {
    version: 2,
    step: clamp(parseInt(localStorage.getItem('wl.step') || '0', 10),0,total-1),
    theme: localStorage.getItem('wl.theme') || 'light',
    checklist: JSON.parse(localStorage.getItem('wl.checklist') || '{}'),
    name: localStorage.getItem('wl.name') || ''
  };

  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const startBtn = document.getElementById('start');
  const themeBtn = document.getElementById('theme');
  const exportBtn = document.getElementById('export');
  const importInput = document.getElementById('import');
  const progressBar = document.querySelector('.progress > div');
  const pageIndicator = document.querySelector('.page-indicator');
  const saved = document.getElementById('saved');
  const live = document.getElementById('live');
  const greeting = document.getElementById('greeting');
  const completion = document.getElementById('completion');
  const nameInput = document.getElementById('hire-name');
  const emailInput = document.getElementById('hire-email');
  const orgGithub = document.getElementById('org-github');
  const teamVercel = document.getElementById('team-vercel');
  const supabaseProject = document.getElementById('supabase-project');
  const linkGithub = document.getElementById('link-github-invite');
  const linkVercel = document.getElementById('link-vercel-invite');
  const linkSupabase = document.getElementById('link-supabase-invite');
  const genEmailBtn = document.getElementById('generate-invite-email');
  const txtGithub = document.getElementById('txt-github');
  const txtVercel = document.getElementById('txt-vercel');
  const txtSupabase = document.getElementById('txt-supabase');
  const adminModal = document.getElementById('admin-modal');
  const openAdmin = document.getElementById('open-admin');
  const closeAdmin = document.getElementById('close-admin');

  // Apply theme
  if(state.theme === 'dark'){ document.documentElement.classList.add('dark'); }

  function clamp(n, min=0, max=total-1){ return Math.max(min, Math.min(max, n)); }

  function render(){
    steps.forEach((el, idx) => {
      const isActive = idx === state.step;
      el.setAttribute('aria-hidden', String(!isActive));
    });
    prevBtn.disabled = state.step === 0;
    nextBtn.disabled = state.step === total - 1;
    const pct = ((state.step+1)/total*100).toFixed(2);
    progressBar.style.width = pct + '%';
    pageIndicator.textContent = `Step ${state.step+1} / ${total}`;
    if(completion) completion.textContent = `${Math.round(pct)}%`;
    if(greeting) greeting.textContent = state.name ? `Welcome back, ${state.name}` : '';
    localStorage.setItem('wl.step', String(state.step));
    // restore checklist
    document.querySelectorAll('[data-check]').forEach(cb => {
      const key = cb.getAttribute('data-check');
      cb.checked = !!state.checklist[key];
    });
    if(live) live.textContent = `Step ${state.step+1} of ${total}`;

    // Pre-flight inputs
    if(nameInput && nameInput.value !== state.name) nameInput.value = state.name;
    if(emailInput && emailInput.value !== (state.email||'')) emailInput.value = state.email||'';
    if(orgGithub && orgGithub.value !== (state.orgGithub||'')) orgGithub.value = state.orgGithub||'';
    if(teamVercel && teamVercel.value !== (state.teamVercel||'')) teamVercel.value = state.teamVercel||'';
    if(supabaseProject && supabaseProject.value !== (state.supabaseProject||'')) supabaseProject.value = state.supabaseProject||'';
    updateInviteLinks();
  }

  function go(delta){ state.step = clamp(state.step + delta); render(); }
  function goTo(i){ state.step = clamp(i); render(); }

  // One-time listeners (do not replace buttons dynamically; bug fix)
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  startBtn.addEventListener('click', () => goTo(0));

  document.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (/^[1-9]$/.test(e.key)) { const i = parseInt(e.key,10)-1; if(i<total) goTo(i); }
    if (e.code === 'Space') { e.preventDefault(); go(1); }
  });

  themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    state.theme = dark ? 'dark' : 'light';
    localStorage.setItem('wl.theme', state.theme);
  });

  // Copy buttons
  document.querySelectorAll('pre > code').forEach(code => {
    const btn = document.createElement('button');
    btn.className = 'button copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(code.textContent);
        btn.textContent = 'Copied!';
        setTimeout(()=>btn.textContent='Copy',1000);
      }catch(e){ btn.textContent='Copy failed'; setTimeout(()=>btn.textContent='Copy',1200); }
    });
    code.parentElement.insertAdjacentElement('beforebegin', btn);
  });

  // Checklist persistence
  document.addEventListener('change', (e) => {
    if(e.target.matches('[data-check]')){
      const key = e.target.getAttribute('data-check');
      state.checklist[key] = e.target.checked;
      localStorage.setItem('wl.checklist', JSON.stringify(state.checklist));
      microSaved();
    }
    if([nameInput,emailInput,orgGithub,teamVercel,supabaseProject].includes(e.target)){
      syncPreflightState(); updateInviteLinks(); microSaved();
    }
  });

  document.addEventListener('input', (e) => {
    if([nameInput,emailInput,orgGithub,teamVercel,supabaseProject].includes(e.target)){
      syncPreflightState(); updateInviteLinks();
    }
  });

  function syncPreflightState(){
    if(nameInput) { state.name = String(nameInput.value||'').trim(); localStorage.setItem('wl.name', state.name); }
    if(emailInput) { state.email = String(emailInput.value||'').trim(); localStorage.setItem('wl.email', state.email); }
    if(orgGithub) { state.orgGithub = String(orgGithub.value||'').trim(); localStorage.setItem('wl.orgGithub', state.orgGithub); }
    if(teamVercel) { state.teamVercel = String(teamVercel.value||'').trim(); localStorage.setItem('wl.teamVercel', state.teamVercel); }
    if(supabaseProject) { state.supabaseProject = String(supabaseProject.value||'').trim(); localStorage.setItem('wl.supabaseProject', state.supabaseProject); }
  }

  function updateInviteLinks(){
    if(linkGithub){
      const org = state.orgGithub || 'ORGANIZATION';
      const url = `https://github.com/orgs/${encodeURIComponent(org)}/people`;
      linkGithub.href = url; if(txtGithub) txtGithub.textContent = url;
    }
    if(linkVercel){
      const team = state.teamVercel || 'TEAM';
      const url = `https://vercel.com/teams/${encodeURIComponent(team)}/settings/members`;
      linkVercel.href = url; if(txtVercel) txtVercel.textContent = url;
    }
    if(linkSupabase){
      const ref = state.supabaseProject || 'PROJECT_REF';
      const url = `https://supabase.com/dashboard/project/${encodeURIComponent(ref)}/settings/general`;
      linkSupabase.href = url; if(txtSupabase) txtSupabase.textContent = url;
    }
  }

  if(genEmailBtn){
    genEmailBtn.addEventListener('click', () => {
      const to = state.email || '';
      const subj = encodeURIComponent('Welcome to Menuca — Access & Day‑1');
      const body = encodeURIComponent(
`Hi ${state.name||''},\n\nWelcome! Before Day‑1, please accept these invites and confirm access:\n\n• GitHub org: ${linkGithub ? linkGithub.href : ''}\n• Vercel team: ${linkVercel ? linkVercel.href : ''}\n• Supabase project: ${linkSupabase ? linkSupabase.href : ''}\n• Stripe (test mode): https://dashboard.stripe.com/settings/team?test=true\n\nProduction app: https://menuca-rebuild-pro.vercel.app/\n\nOn Day‑1 we’ll run the local app and ship a tiny change together.\n\n—`);
      window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subj}&body=${body}`;
    });
  }

  function microSaved(){
    if(!saved) return;
    saved.setAttribute('aria-hidden','false');
    saved.classList.add('is-visible');
    setTimeout(()=>{
      saved.classList.remove('is-visible');
      saved.setAttribute('aria-hidden','true');
    }, 900);
  }

  // Export / Import progress
  exportBtn.addEventListener('click', () => {
    const payload = {
      version: 2,
      step: state.step,
      theme: state.theme,
      checklist: state.checklist,
      name: state.name,
      email: state.email,
      orgGithub: state.orgGithub,
      teamVercel: state.teamVercel,
      supabaseProject: state.supabaseProject,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'worklocal-onboarding-progress.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    microSaved();
  });

  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    try{
      const data = JSON.parse(text);
      if(data.version !== 2) throw new Error('Unsupported version');
      if(typeof data.step === 'number') state.step = clamp(data.step);
      if(data.theme) { state.theme = data.theme; localStorage.setItem('wl.theme', state.theme); 
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
      }
      if(data.checklist) state.checklist = data.checklist;
      if(typeof data.name === 'string') { state.name = data.name; localStorage.setItem('wl.name', state.name); }
      if(typeof data.email === 'string') { state.email = data.email; localStorage.setItem('wl.email', state.email); }
      if(typeof data.orgGithub === 'string') { state.orgGithub = data.orgGithub; localStorage.setItem('wl.orgGithub', state.orgGithub); }
      if(typeof data.teamVercel === 'string') { state.teamVercel = data.teamVercel; localStorage.setItem('wl.teamVercel', state.teamVercel); }
      if(typeof data.supabaseProject === 'string') { state.supabaseProject = data.supabaseProject; localStorage.setItem('wl.supabaseProject', state.supabaseProject); }
      localStorage.setItem('wl.checklist', JSON.stringify(state.checklist));
      render();
      toast('Progress imported');
    }catch(err){
      toast('Invalid file', true);
    }finally{
      importInput.value = '';
    }
  });

  function toast(msg, isError=false){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.position='fixed'; el.style.bottom='64px'; el.style.left='50%'; el.style.transform='translateX(-50%)';
    el.style.padding='8px 12px'; el.style.borderRadius='10px'; el.style.fontWeight='600';
    el.style.background=isError? '#fee2e2' : '#ecfeff';
    el.style.color=isError? '#991b1b' : '#083344';
    el.style.border=isError? '1px solid #fecaca' : '1px solid #a5f3fc';
    el.style.zIndex='1000'; el.style.boxShadow='0 6px 20px rgba(0,0,0,.15)';
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; }, 1200);
    setTimeout(()=> el.remove(), 1600);
  }

  // Admin modal open/close
  function setAdmin(open){ if(!adminModal) return; adminModal.setAttribute('aria-hidden', String(!open)); }
  if(openAdmin){ openAdmin.addEventListener('click', ()=> setAdmin(true)); }
  if(closeAdmin){ closeAdmin.addEventListener('click', ()=> setAdmin(false)); }
  document.addEventListener('keydown', (e) => {
    if(e.shiftKey && (e.key === 'A' || e.key === 'a')){ e.preventDefault(); setAdmin(true); }
    if(e.key === 'Escape'){ setAdmin(false); }
  });
  try{ const qp = new URLSearchParams(location.search); if(qp.get('admin') === '1') setAdmin(true); }catch{}

  // Copy buttons inside admin links pane
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sel = btn.getAttribute('data-copy');
      const el = sel ? document.querySelector(sel) : null;
      if(!el) return;
      try{ await navigator.clipboard.writeText(el.textContent || ''); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy', 900);}catch{}
    });
  });

  // Step analytics (dwell time)
  let stepStart = performance.now();
  function trackStepChange(prev, next){
    const now = performance.now();
    const dwellMs = Math.max(0, now - stepStart);
    try{
      const logs = JSON.parse(localStorage.getItem('wl.analytics') || '[]');
      logs.push({ ts: Date.now(), prev, next, dwellMs });
      localStorage.setItem('wl.analytics', JSON.stringify(logs));
    }catch{}
    stepStart = now;
  }
  const _go = go; const _goTo = goTo;
  function go(delta){ const prev = state.step; state.step = clamp(state.step + delta); render(); trackStepChange(prev, state.step); maybeConfetti(); }
  function goTo(i){ const prev = state.step; state.step = clamp(i); render(); trackStepChange(prev, state.step); maybeConfetti(); }

  // Confetti on completion (step == last and checklist mostly done)
  async function maybeConfetti(){
    if(state.step !== total - 1) return;
    const checks = Object.values(state.checklist);
    const done = checks.filter(Boolean).length;
    if(done >= Math.max(1, Math.floor(checks.length * 0.6))){
      try{ const mod = await import('https://cdn.skypack.dev/canvas-confetti'); mod.default(); }catch{}
    }
  }

  // Personalize: infer name from feedback form once submitted
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if(!(form instanceof HTMLFormElement)) return;
    if(form.getAttribute('name') === 'onboarding-notes'){
      const input = form.querySelector('input[name="name"]');
      const val = input && input.value ? String(input.value).trim() : '';
      if(val){ state.name = val; localStorage.setItem('wl.name', val); render(); maybeConfetti(); }
    }
  });

  // Finish button confetti + toast
  const finish = document.getElementById('finish');
  if(finish){
    finish.addEventListener('click', async () => {
      toast('Day‑1 complete! 🎉');
      try{ const mod = await import('https://cdn.skypack.dev/canvas-confetti'); mod.default(); }catch{}
    });
  }

  // Initialize
  render();
})();
