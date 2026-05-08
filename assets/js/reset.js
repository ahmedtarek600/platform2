// =============================================
// assets/js/reset.js  – إعادة تعيين كلمة المرور
// يستدعي API PHP للتحقق من الكود وتغيير الكلمة
// =============================================

/* ====== helpers ====== */
function showToast(id, msg, isError = false) {
  const t = document.getElementById(id);
  t.textContent     = msg;
  t.style.background  = isError ? 'rgba(239,68,68,0.12)'  : 'rgba(34,197,94,0.12)';
  t.style.borderColor = isError ? 'rgba(239,68,68,0.3)'   : 'rgba(34,197,94,0.3)';
  t.style.color       = isError ? '#f87171'                : '#4ade80';
  t.style.border      = '1px solid';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function setError(input, el, show, msg) {
  if (show) {
    if (input) input.style.borderColor = '#dc2626';
    el.style.display = 'block';
    if (msg) el.textContent = msg;
  } else {
    if (input) input.style.borderColor = '';
    el.style.display = 'none';
  }
}

function goToStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById(n === 'success' ? 'stepSuccess' : 'step' + n);
  if (target) target.classList.remove('hidden');
  updateProgress(n);
}

function updateProgress(step) {
  const prog  = [document.getElementById('prog1'), document.getElementById('prog2'), document.getElementById('prog3')];
  const lines = [document.getElementById('line1'), document.getElementById('line2')];
  const stepNum = parseInt(step);
  prog.forEach((p, i) => {
    p.classList.remove('active', 'done');
    if (i + 1 < stepNum)      p.classList.add('done');
    else if (i + 1 === stepNum) p.classList.add('active');
  });
  lines.forEach((l, i) => {
    l.classList.remove('done');
    if (i + 1 < stepNum) l.classList.add('done');
  });
}

/* ====== STEP 1: التحقق من الكود الجامعي ====== */
let verifiedCode = '';
const form1   = document.getElementById('form1');
const codeInp = document.getElementById('uniCode');
const codeErr = document.getElementById('codeError');

form1.addEventListener('submit', async e => {
  e.preventDefault();
  const codeVal = codeInp.value.trim();
  if (!codeVal) {
    setError(codeInp, codeErr, true, 'من فضلك أدخل الكود الجامعي');
    return;
  }
  setError(codeInp, codeErr, false);

  const btn = document.getElementById('verifyBtn');
  btn.disabled = true;
  btn.textContent = 'جاري التحقق...';

  try {
    const fd = new FormData();
    fd.append('code', codeVal);
    const res  = await fetch('../api/reset_verify.php', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
      verifiedCode = codeVal;
      showToast('toast1', 'تم التحقق من الهوية ✓ جاري الانتقال...');
      setTimeout(() => goToStep(2), 900);
    } else {
      showToast('toast1', data.message || 'الكود الجامعي غير صحيح', true);
      setError(codeInp, codeErr, true, data.message || 'الكود الجامعي غير موجود');
    }
  } catch {
    showToast('toast1', 'خطأ في الاتصال بالخادم', true);
  }
  btn.disabled = false;
  btn.textContent = 'التحقق من الهوية';
});

/* ====== STEP 2: OTP (demo - any 6 digits) ====== */
const otpInputs = Array.from(document.querySelectorAll('.otp-input'));
const otpErr    = document.getElementById('otpError');
const form2     = document.getElementById('form2');

otpInputs.forEach((inp, idx) => {
  inp.addEventListener('input', () => {
    inp.value = inp.value.replace(/\D/, '').slice(-1);
    if (inp.value) { inp.classList.add('filled'); if (idx < 5) otpInputs[idx + 1].focus(); }
    else inp.classList.remove('filled');
    otpErr.style.display = 'none';
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !inp.value && idx > 0) {
      otpInputs[idx - 1].focus();
      otpInputs[idx - 1].value = '';
      otpInputs[idx - 1].classList.remove('filled');
    }
  });
  inp.addEventListener('paste', e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, i) => { if (otpInputs[i]) { otpInputs[i].value = ch; otpInputs[i].classList.add('filled'); } });
    const nxt = otpInputs.find(x => !x.value);
    (nxt || otpInputs[5]).focus();
  });
});

form2.addEventListener('submit', e => {
  e.preventDefault();
  const code = otpInputs.map(i => i.value).join('');
  if (code.length < 6) {
    setError(null, otpErr, true, 'من فضلك أدخل الرمز المكون من 6 أرقام');
    return;
  }
  // Demo: أي 6 أرقام مقبولة - في الإنتاج ترسل OTP حقيقي بالبريد
  showToast('toast2', 'تم التحقق من الرمز ✓ جاري الانتقال...');
  setTimeout(() => goToStep(3), 900);
});

document.getElementById('backToStep1').addEventListener('click', () => {
  otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
  goToStep(1);
});
document.getElementById('resendBtn').addEventListener('click', () => {
  showToast('toast2', 'تم إعادة إرسال رمز التحقق');
});

/* ====== STEP 3: كلمة المرور الجديدة ====== */
const form3         = document.getElementById('form3');
const newPass       = document.getElementById('newPass');
const confirmNew    = document.getElementById('confirmNewPass');
const toggleNew     = document.getElementById('toggleNew');
const toggleConfNew = document.getElementById('toggleConfirmNew');
const newPassErr    = document.getElementById('newPassError');
const confirmNewErr = document.getElementById('confirmNewError');

toggleNew.addEventListener('click', () => {
  const h = newPass.type === 'password';
  newPass.type = h ? 'text' : 'password';
  toggleNew.textContent = h ? 'إخفاء' : 'إظهار';
});
toggleConfNew.addEventListener('click', () => {
  const h = confirmNew.type === 'password';
  confirmNew.type = h ? 'text' : 'password';
  toggleConfNew.textContent = h ? 'إخفاء' : 'إظهار';
});

form3.addEventListener('submit', async e => {
  e.preventDefault();
  const p1 = newPass.value;
  const p2 = confirmNew.value;
  const p1Bad = p1.length < 6;
  const p2Bad = p1 !== p2;
  setError(newPass, newPassErr, p1Bad, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  setError(confirmNew, confirmNewErr, p2Bad, p2.length === 0 ? 'من فضلك أكد كلمة المرور' : 'كلمتا المرور غير متطابقتين');
  if (p1Bad || p2Bad) return;

  const btn = document.getElementById('resetBtn');
  btn.disabled = true;
  btn.textContent = 'جاري الحفظ...';

  try {
    const fd = new FormData();
    fd.append('code',     verifiedCode);
    fd.append('password', p1);
    const res  = await fetch('../api/reset_password.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      showToast('toast3', 'تم إعادة التعيين بنجاح 🎉');
      setTimeout(() => goToStep('success'), 1000);
    } else {
      showToast('toast3', data.message || 'حدث خطأ، حاول مرة أخرى', true);
    }
  } catch {
    showToast('toast3', 'خطأ في الاتصال بالخادم', true);
  }
  btn.disabled = false;
  btn.textContent = 'إعادة تعيين كلمة السر';
});

updateProgress(1);
