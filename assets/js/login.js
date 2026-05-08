// =============================================
// assets/js/login.js  – بدون localStorage
// =============================================

const form      = document.getElementById('loginForm');
const uniCode   = document.getElementById('uniCode');
const password  = document.getElementById('password');
const togglePass= document.getElementById('togglePass');
const codeError = document.getElementById('codeError');
const passError = document.getElementById('passError');
const toast     = document.getElementById('toast');
const submitBtn = document.getElementById('submitBtn');

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.background   = isError ? 'rgba(239,68,68,0.12)'  : 'rgba(34,197,94,0.12)';
  toast.style.borderColor  = isError ? 'rgba(239,68,68,0.3)'   : 'rgba(34,197,94,0.3)';
  toast.style.color        = isError ? '#f87171'                : '#4ade80';
  toast.style.border       = '1px solid';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setError(input, errorEl, show) {
  if (show) {
    input.style.borderColor = '#dc2626';
    errorEl.style.display   = 'block';
  } else {
    input.style.borderColor = '';
    errorEl.style.display   = 'none';
  }
}

togglePass.addEventListener('click', () => {
  const hidden = password.type === 'password';
  password.type = hidden ? 'text' : 'password';
  togglePass.textContent = hidden ? 'إخفاء' : 'إظهار';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const codeVal = uniCode.value.trim();
  const passVal = password.value.trim();

  const codeInvalid = codeVal.length === 0;
  const passInvalid = passVal.length === 0;

  setError(uniCode, codeError, codeInvalid);
  setError(password, passError, passInvalid);

  if (codeInvalid || passInvalid) {
    showToast('راجع البيانات أولاً', true);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري تسجيل الدخول...';

  try {
    const fd = new FormData();
    fd.append('code',     codeVal);
    fd.append('password', passVal);

    const res  = await fetch('../auth/login.php', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
      showToast('✅ تم تسجيل الدخول بنجاح، جاري التحويل...');
      setTimeout(() => {
        window.location.href = data.redirect || '../index.php';
      }, 1000);
    } else {
      showToast(data.message || 'حدث خطأ، حاول مرة أخرى', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'تسجيل الدخول';
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم، حاول مرة أخرى', true);
    submitBtn.disabled = false;
    submitBtn.textContent = 'تسجيل الدخول';
  }
});
