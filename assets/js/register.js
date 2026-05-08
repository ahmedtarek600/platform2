// =============================================
// assets/js/register.js  – بدون localStorage
// =============================================

const form            = document.getElementById('registerForm');
const fullName        = document.getElementById('fullName');
const uniCode         = document.getElementById('uniCode');
const grade           = document.getElementById('grade');
const password        = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const togglePass      = document.getElementById('togglePass');
const toggleConfirm   = document.getElementById('toggleConfirm');
const nameError       = document.getElementById('nameError');
const codeError       = document.getElementById('codeError');
const gradeError      = document.getElementById('gradeError');
const passError       = document.getElementById('passError');
const confirmError    = document.getElementById('confirmError');
const toast           = document.getElementById('toast');
const submitBtn       = document.getElementById('submitBtn');

function showToast(message, isError = false) {
  toast.textContent    = message;
  toast.style.background  = isError ? 'rgba(239,68,68,0.12)'  : 'rgba(34,197,94,0.12)';
  toast.style.borderColor = isError ? 'rgba(239,68,68,0.3)'   : 'rgba(34,197,94,0.3)';
  toast.style.color       = isError ? '#f87171'                : '#4ade80';
  toast.style.border      = '1px solid';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setError(input, errorEl, show, msg = null) {
  if (show) {
    input.style.borderColor = '#dc2626';
    errorEl.style.display   = 'block';
    if (msg) errorEl.textContent = msg;
  } else {
    input.style.borderColor = '';
    errorEl.style.display   = 'none';
  }
}

togglePass.addEventListener('click', () => {
  const h = password.type === 'password';
  password.type = h ? 'text' : 'password';
  togglePass.textContent = h ? 'إخفاء' : 'إظهار';
});
toggleConfirm.addEventListener('click', () => {
  const h = confirmPassword.type === 'password';
  confirmPassword.type = h ? 'text' : 'password';
  toggleConfirm.textContent = h ? 'إخفاء' : 'إظهار';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameVal    = fullName.value.trim();
  const codeVal    = uniCode.value.trim();
  const gradeVal   = grade.value;
  const passVal    = password.value;
  const confirmVal = confirmPassword.value;

  const nameInvalid    = nameVal.length === 0;
  const codeInvalid    = codeVal.length === 0;
  const gradeInvalid   = !gradeVal;
  const passInvalid    = passVal.length < 6;
  const confirmInvalid = confirmVal !== passVal;

  setError(fullName,        nameError,    nameInvalid);
  setError(uniCode,         codeError,    codeInvalid);
  setError(grade,           gradeError,   gradeInvalid);
  setError(password,        passError,    passInvalid,
           passVal.length === 0 ? 'من فضلك اكتب كلمة المرور' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  setError(confirmPassword, confirmError, confirmInvalid);

  if (nameInvalid || codeInvalid || gradeInvalid || passInvalid || confirmInvalid) {
    showToast('راجع البيانات أولاً', true);
    return;
  }

  submitBtn.disabled     = true;
  submitBtn.textContent  = 'جاري الإنشاء...';

  try {
    const fd = new FormData();
    fd.append('name',     nameVal);
    fd.append('code',     codeVal);
    fd.append('grade',    gradeVal);
    fd.append('password', passVal);
    fd.append('confirm',  confirmVal);

    const res  = await fetch('../auth/register.php', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
      showToast('✅ تم إنشاء الحساب بنجاح، جاري التحويل...');
      setTimeout(() => {
        window.location.href = data.redirect || '../login/index.php';
      }, 1200);
    } else {
      showToast(data.message || 'حدث خطأ، حاول مرة أخرى', true);
      submitBtn.disabled    = false;
      submitBtn.textContent = 'إنشاء الحساب';
    }
  } catch {
    showToast('خطأ في الاتصال بالخادم', true);
    submitBtn.disabled    = false;
    submitBtn.textContent = 'إنشاء الحساب';
  }
});
