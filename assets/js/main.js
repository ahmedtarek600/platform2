// =============================================
// assets/js/main.js  – بدون localStorage
// يستخدم window.APP المُحقَن من PHP
// =============================================

const app = window.APP;

/* ==============================================
   Custom Dropdown Initializer (تحويل كل select)
   ============================================== */
function initCustomDropdowns() {
  document.querySelectorAll('.custom-dropdown').forEach(drop => {
    if (drop.classList.contains('initialized')) return;
    drop.classList.add('initialized');

    const btn = drop.querySelector('.dropdown-btn');
    const menu = drop.querySelector('.dropdown-menu');
    const items = menu.querySelectorAll('.dropdown-item');
    const hiddenSelect = drop.querySelector('select');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns(drop);
      drop.classList.toggle('open');
    });

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const btnText = btn.querySelector('.dropdown-btn-text');
        if (btnText) btnText.textContent = item.textContent;
        if (hiddenSelect) {
          hiddenSelect.value = item.dataset.value;
          hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        drop.classList.remove('open');
      });
    });

    document.addEventListener('click', () => { drop.classList.remove('open'); });
    menu.addEventListener('click', (e) => e.stopPropagation());
  });
}

function closeAllDropdowns(except = null) {
  document.querySelectorAll('.custom-dropdown.open').forEach(d => {
    if (d !== except) d.classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', initCustomDropdowns);

/* ========================================
   Toast Banner
   ======================================== */
const loginToast = document.getElementById('loginToast');
function showLoginBanner() {
  loginToast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => loginToast.classList.remove('show'), 6000);
}

/* ========================================
   View Switching
   ======================================== */
function switchView(name) {
 /* if (name === 'dashboard' && !app.isLoggedIn) { showLoginBanner(); return; }*/
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const idMap = { home:'viewHome', features:'viewFeatures', contact:'viewContact', dashboard:'viewDashboard' };
  const target = document.getElementById(idMap[name]);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  document.getElementById('mobileMenu')?.classList.remove('open');
  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-view]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); switchView(el.dataset.view); });
});

document.getElementById('startLearningBtn')?.addEventListener('click', e => {
  e.preventDefault();
  app.isLoggedIn ? switchView('dashboard') : showLoginBanner();
});

document.getElementById('navUserAvatar')?.addEventListener('click', () => {
  switchView('dashboard');
  setTimeout(() => switchPanel('profile'), 50);
});

/* ========================================
   Mobile Menu
   ======================================== */
document.getElementById('menuBtn')?.addEventListener('click',  () => document.getElementById('mobileMenu')?.classList.toggle('open'));
document.getElementById('menuBtn2')?.addEventListener('click', () => document.getElementById('mobileMenu')?.classList.toggle('open'));

/* ========================================
   Dashboard: Sidebar Navigation
   ======================================== */
const panelMap = {
  content:      'panelContent',
  schedule:     'panelSchedule',
  exams:        'panelExams',
  exam_system:  'panelExamSystem',
  pending:      'panelPending',
  profile:      'panelProfile'
};

// مرجع خارجي لـ loadExamsSchedule – الدالة متعرّفة جوا if(app.isLoggedIn) block
// وهي block-scoped في المتصفحات الحديثة، فمحتاجين نعرّضها للـ outer scope
let _loadExamsScheduleFn = null;

function switchPanel(name) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.sidebar-link[data-dash="${name}"]`)?.classList.add('active');
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(panelMap[name]);
  if (panel) panel.classList.add('active');
  if (name === 'pending') loadPendingFiles();
  if (name === 'exams' && _loadExamsScheduleFn) _loadExamsScheduleFn();
  if (name === 'exam_system') initExamSystem();
}

document.querySelectorAll('.sidebar-link[data-dash]').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); switchPanel(link.dataset.dash); });
});

/* ========================================
   Contact Form → PHP API
   ======================================== */
const contactForm = document.getElementById('contactForm');
const cToast      = document.getElementById('cToast');
if (contactForm && cToast) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name',  document.getElementById('cName').value.trim());
    fd.append('code',  document.getElementById('cCode').value.trim());
    fd.append('email', document.getElementById('cEmail').value.trim());
    fd.append('msg',   document.getElementById('cMsg').value.trim());
    try {
      const res  = await fetch('api/contact.php', { method: 'POST', body: fd });
      const data = await res.json();
      cToast.style.display     = 'block';
      cToast.style.background  = data.success ? 'rgba(34,197,94,0.16)'  : 'rgba(239,68,68,0.16)';
      cToast.style.borderColor = data.success ? 'rgba(34,197,94,0.3)'   : 'rgba(239,68,68,0.3)';
      cToast.style.color       = data.success ? '#4ade80'                : '#f87171';
      cToast.textContent       = data.message;
      if (data.success) contactForm.reset();
      setTimeout(() => { cToast.style.display = 'none'; }, 3500);
    } catch {
      cToast.style.display    = 'block';
      cToast.textContent      = '⚠️ خطأ في الاتصال بالخادم';
      setTimeout(() => { cToast.style.display = 'none'; }, 3000);
    }
  });
}

/* ========================================
   UPLOAD MODAL
   ======================================== */
let _modalUploadCallback = null;

function openUploadModal(opts) {
  // opts: { type, subjectId, gradeOverride, onSuccess }
  const modal = document.getElementById('uploadModal');
  if (!modal) return;

  // إعادة ضبط الفورم أولاً
  document.getElementById('modalUploadForm').reset();
  document.getElementById('modalUploadMsg').style.display = 'none';

  // تعيين القيم المخفية بعد الـ reset
  document.getElementById('modalType').value    = opts.type    || '';
  document.getElementById('modalSubject').value = opts.subjectId || '';

  // حفظ الـ gradeOverride في data attribute على الفورم
  // (يُستخدم للجداول حيث الفرقة تُحدَّد من dropdown الصفحة)
  document.getElementById('modalUploadForm').dataset.gradeOverride = opts.gradeOverride || '';

  // إظهار/إخفاء حقول الأدمن:
  // للجداول (schedule / exam_schedule): نخفي grade dropdown من الـ modal
  // لأن الفرقة بتيجي من dropdown الصفحة مباشرة
  const isScheduleType = ['schedule', 'exam_schedule'].includes(opts.type);
  const adminFields = document.getElementById('modalAdminFields');
  if (adminFields) {
    adminFields.style.display = (app.isAdmin && !isScheduleType) ? 'block' : 'none';
  }

  // إظهار/إخفاء حقل السكشن (للسكاشن والجدول الدراسي فقط)
  const secField = document.getElementById('modalSectionField');
  if (secField) {
    secField.style.display = (opts.type === 'section' || opts.type === 'schedule') ? 'block' : 'none';
  }

  _modalUploadCallback = opts.onSuccess || null;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// إغلاق عند النقر على الخلفية
document.getElementById('uploadModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeUploadModal();
});
document.getElementById('modalCloseBtn')?.addEventListener('click', closeUploadModal);
document.getElementById('modalCancelBtn')?.addEventListener('click', closeUploadModal);

// رفع من الـ Modal
document.getElementById('modalUploadForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const msg = document.getElementById('modalUploadMsg');
  const fileInput = document.getElementById('modalFileInput');

  if (!fileInput.files.length) {
    showModalMsg('⚠️ اختر ملفاً للرفع', true);
    return;
  }

  const type      = document.getElementById('modalType').value;
  const subjectId = document.getElementById('modalSubject').value;

  if (!subjectId && !['schedule','exam_schedule'].includes(type)) {
    showModalMsg('⚠️ خطأ: لا يوجد مادة محددة', true);
    return;
  }

  const fd = new FormData();
  fd.append('file', fileInput.files[0]);
  fd.append('type', type);
  fd.append('subject_id', subjectId || 1);

  if (app.isAdmin) {
    // gradeOverride له الأولوية (للجداول) ← يجي من dropdown الصفحة
    // وإلا يُستخدم modalGrade (للمحتوى العادي)
    const gradeOverride = document.getElementById('modalUploadForm').dataset.gradeOverride;
    const grade = gradeOverride || document.getElementById('modalGrade')?.value || app.userGrade;
    fd.append('grade', grade);
    const sec = document.getElementById('modalSectionNumber')?.value;
    if (sec) fd.append('section_number', sec);
  } else {
    fd.append('grade', app.userGrade);
    if (type === 'section') {
      const sec = document.getElementById('modalSectionNumber')?.value;
      if (sec) fd.append('section_number', sec);
    }
  }

  const btn = this.querySelector('.modal-submit-btn');
  btn.disabled = true;
  btn.textContent = 'جاري الرفع...';

  try {
    const res  = await fetch('api/upload_file.php', { method: 'POST', body: fd });
    const data = await res.json();
    showModalMsg(data.message, !data.success);
    if (data.success) {
      this.reset();
      setTimeout(() => {
        closeUploadModal();
        if (typeof _modalUploadCallback === 'function') _modalUploadCallback();
      }, 1200);
    }
  } catch {
    showModalMsg('⚠️ خطأ في الاتصال بالخادم', true);
  }
  btn.disabled = false;
  btn.textContent = 'رفع الملف';
});

function showModalMsg(text, isError) {
  const msg = document.getElementById('modalUploadMsg');
  if (!msg) return;
  msg.textContent = text;
  msg.style.color   = isError ? '#f87171' : '#4ade80';
  msg.style.background = isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';
  msg.style.display = 'block';
}

/* ========================================
   FILE PREVIEW MODAL
   ======================================== */
function openPreviewModal(filePath, fileName) {
  const modal = document.getElementById('previewModal');
  if (!modal) return;

  const container = document.getElementById('previewContainer');
  const title     = document.getElementById('previewTitle');

  title.textContent = fileName || 'معاينة الملف';
  container.innerHTML = '';

  const ext = (filePath.split('.').pop() || '').toLowerCase();
  const imgExts  = ['jpg','jpeg','png','gif','webp'];
  const videoExts = ['mp4','avi','mkv','webm'];

  if (imgExts.includes(ext)) {
    container.innerHTML = `<img src="${escHtml(filePath)}" alt="${escHtml(fileName)}" style="max-width:100%;max-height:75vh;border-radius:10px;" />`;
  } else if (ext === 'pdf') {
    container.innerHTML = `<iframe src="${escHtml(filePath)}" style="width:100%;height:75vh;border:none;border-radius:10px;" allowfullscreen></iframe>`;
  } else if (videoExts.includes(ext)) {
    container.innerHTML = `<video controls style="max-width:100%;max-height:75vh;border-radius:10px;"><source src="${escHtml(filePath)}">المتصفح لا يدعم تشغيل الفيديو.</video>`;
  } else {
    // للملفات التي لا يمكن معاينتها مباشرة
    container.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <div style="font-size:64px;margin-bottom:16px;">${fileIcon(fileName)}</div>
        <p style="color:rgba(255,255,255,0.7);font-size:16px;">لا يمكن معاينة هذا النوع من الملفات مباشرةً</p>
        <a href="${escHtml(filePath)}" download class="btn btn-primary" style="margin-top:16px;display:inline-flex;">
          تحميل الملف ⬇
        </a>
      </div>`;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  if (!modal) return;
  modal.classList.remove('active');
  // إيقاف الفيديو/الـ iframe عند الإغلاق
  const container = document.getElementById('previewContainer');
  if (container) container.innerHTML = '';
  document.body.style.overflow = '';
}

document.getElementById('previewModal')?.addEventListener('click', function(e) {
  if (e.target === this) closePreviewModal();
});
document.getElementById('previewCloseBtn')?.addEventListener('click', closePreviewModal);

/* ========================================
   SUBJECTS – load via AJAX
   ======================================== */
if (app.isLoggedIn) {
  let currentSubjectId = null;
  let currentType      = 'lecture';
  let currentGrade     = app.userGrade;

  const subjectsBar    = document.getElementById('subjectsBar');
  const contentBtns    = document.getElementById('contentBtns');
  const filesList      = document.getElementById('filesList');
  const uploadArea     = document.getElementById('uploadArea');
  const sectionFilter  = document.getElementById('sectionFilter');
  const sectionSelect  = document.getElementById('sectionSelect');
  const uploadFormWrap = document.getElementById('uploadFormWrap');

  async function loadSubjects(grade) {
    subjectsBar.innerHTML = '<div class="loading-subjects">جاري تحميل المواد...</div>';
    contentBtns.style.display = 'none';
    uploadArea.style.display  = 'none';
    if (filesList) filesList.innerHTML = emptyState('اختر مادة لعرض محتواها', 'اختر مادة من القائمة أعلاه ثم اختر نوع المحتوى');
    currentSubjectId = null;

    const url = `api/get_subjects.php${grade ? '?grade=' + grade : ''}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.subjects.length) {
      subjectsBar.innerHTML = '<div class="loading-subjects" style="color:rgba(255,255,255,0.4);">لا توجد مواد لهذه الفرقة</div>';
      return;
    }
    subjectsBar.innerHTML = '';
    data.subjects.forEach(sub => {
      const btn = document.createElement('button');
      btn.className   = 'subject-btn';
      btn.textContent = sub.name;
      btn.dataset.id  = sub.id;
      btn.addEventListener('click', () => selectSubject(sub.id, btn));
      subjectsBar.appendChild(btn);
    });
  }

  function selectSubject(subjectId, btn) {
    document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSubjectId = subjectId;
    contentBtns.style.display = 'flex';
    uploadArea.style.display  = 'flex';
    loadFiles();
  }

  async function loadFiles() {
    if (!currentSubjectId) return;
    if (filesList) filesList.innerHTML = '<div class="loading-subjects">جاري التحميل...</div>';

    const secNum = (currentType === 'section' && sectionSelect && sectionSelect.value) ? sectionSelect.value : '';
    const grade  = (app.isAdmin && document.getElementById('adminGradeSelect'))
                   ? document.getElementById('adminGradeSelect').value
                   : app.userGrade;

    let url = `api/get_uploads.php?subject_id=${currentSubjectId}&type=${currentType}&grade=${grade}`;
    if (secNum) url += `&section_number=${secNum}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.uploads.length) {
      if (filesList) filesList.innerHTML = emptyState('لا يوجد ملفات', 'لا يوجد محتوى في هذا القسم حتى الآن');
      return;
    }

    // عرض الملفات كـ Cards في منتصف الصفحة
    if (filesList) {
      filesList.innerHTML = `<div class="files-cards-grid">
        ${data.uploads.map(f => fileCard(f)).join('')}
      </div>`;
    }
  }

  // ==================================
  // بطاقة الملف (Cards UI)
  // ==================================
  function fileCard(f) {
    const statusBadge = app.isAdmin
      ? `<span class="file-status-badge status-${f.status}">${statusLabel(f.status)}</span>`
      : '';

    const viewBtn   = `<button class="file-action-btn file-view-btn" onclick="openPreviewModal('${escHtml(f.file_path)}','${escHtml(f.original_name || 'ملف')}')">
                         <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                         عرض
                       </button>`;
    const dlBtn     = `<a class="file-action-btn file-dl-btn" href="${escHtml(f.file_path)}" download>
                         <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                         تحميل
                       </a>`;
    const deleteBtn = app.isAdmin
      ? `<button class="file-action-btn file-delete-btn" onclick="deleteFile(${f.id})">
           <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 6H21M19 6L18 20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
           حذف
         </button>`
      : '';

    const pendingAdminBtns = (app.isAdmin && f.status === 'pending')
      ? `<div class="file-review-actions">
           <button class="approve-btn" onclick="reviewFile(${f.id},'approve')">✅ قبول</button>
           <button class="reject-btn"  onclick="reviewFile(${f.id},'reject')">❌ رفض</button>
         </div>`
      : '';

    return `
      <div class="file-card-new" id="fcard-${f.id}">
        <div class="file-card-icon">${fileIcon(f.original_name || f.file_path)}</div>
        <div class="file-card-body">
          <span class="file-card-name">${escHtml(f.original_name || 'ملف')}</span>
          <span class="file-card-meta">رُفع بواسطة: ${escHtml(f.uploader_name)} &nbsp;|&nbsp; ${formatDate(f.created_at)}</span>
          ${f.section_number ? `<span class="file-card-meta">سكشن ${f.section_number}</span>` : ''}
          ${statusBadge}
        </div>
        <div class="file-card-actions">
          ${viewBtn}
          ${dlBtn}
          ${deleteBtn}
        </div>
        ${pendingAdminBtns}
      </div>`;
  }

  // حذف ملف (للأدمن) – بـ custom confirm modal
  window.deleteFile = function(uploadId) {
    openDeleteConfirm(uploadId);
  };

  document.querySelectorAll('.content-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.content-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.content;
      if (sectionFilter) sectionFilter.style.display = (currentType === 'section') ? 'flex' : 'none';
      const sectionFieldWrap = document.getElementById('sectionFieldWrap');
      if (sectionFieldWrap) sectionFieldWrap.style.display = (currentType === 'section') ? 'block' : 'none';
      loadFiles();
    });
  });

  sectionSelect?.addEventListener('change', loadFiles);

  document.getElementById('refreshBtn')?.addEventListener('click', () => loadFiles());

  // Admin grade switcher
  document.getElementById('adminGradeSelect')?.addEventListener('change', function() {
    currentGrade = parseInt(this.value);
    loadSubjects(currentGrade);
  });

  // زر رفع الملف – يفتح الـ Modal
  document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => {
    if (!currentSubjectId) { alert('اختر مادة أولاً'); return; }
    openUploadModal({
      type: currentType,
      subjectId: currentSubjectId,
      onSuccess: loadFiles
    });
  });

  // Initial load
  loadSubjects(app.isAdmin ? null : app.userGrade);

  /* ==============================
     SCHEDULE – Upload Button
     ============================== */
  document.getElementById('scheduleUploadBtn')?.addEventListener('click', () => {
    // استخدم الفرقة المختارة من dropdown الصفحة
    const grade = app.isAdmin
      ? (document.getElementById('schedGradeSelect')?.value || app.userGrade)
      : app.userGrade;
    openUploadModal({
      type: 'schedule',
      subjectId: 1,
      gradeOverride: grade,
      onSuccess: loadSchedule
    });
  });

  /* ==============================
     EXAMS – Upload Button
     ============================== */
  document.getElementById('examUploadBtn')?.addEventListener('click', () => {
    // استخدم الفرقة المختارة من dropdown الصفحة
    const grade = app.isAdmin
      ? (document.getElementById('examGradeSelect')?.value || app.userGrade)
      : app.userGrade;
    openUploadModal({
      type: 'exam_schedule',
      subjectId: 1,
      gradeOverride: grade,
      onSuccess: loadExamsSchedule
    });
  });

  /* ==============================
     SCHEDULE
     ============================== */
  document.getElementById('schedSectionSelect')?.addEventListener('change', loadSchedule);
  document.getElementById('schedGradeSelect')?.addEventListener('change', loadSchedule);

  async function loadSchedule() {
    const sec  = document.getElementById('schedSectionSelect')?.value;
    const cont = document.getElementById('scheduleContent');
    if (!cont) return;
    if (!sec) {
      cont.innerHTML = emptyState('اختر رقم السكشن لعرض الجدول', 'الفرقة يتم تحديدها تلقائياً من حسابك');
      return;
    }
    cont.innerHTML = '<div class="loading-subjects">جاري التحميل...</div>';

    // الأدمن يختار الفرقة من dropdown الصفحة – اليوزر يأخذها من Session تلقائياً
    const grade = (app.isAdmin && document.getElementById('schedGradeSelect'))
      ? document.getElementById('schedGradeSelect').value
      : app.userGrade;

    const url = `api/get_uploads.php?subject_id=1&type=schedule&section_number=${sec}&grade=${grade}`;
    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (!data.success || !data.uploads.length) {
        cont.innerHTML = emptyState('لا يوجد جدول لهذا السكشن', 'لم يتم رفع الجدول بعد');
        return;
      }
      cont.innerHTML = `<div class="files-cards-grid">
        ${data.uploads.map(f => scheduleCard(f, 'جدول دراسي')).join('')}
      </div>`;
    } catch {
      cont.innerHTML = emptyState('خطأ في تحميل الجدول', '');
    }
  }

  /* ==============================
     EXAMS SCHEDULE
     ============================== */
  document.getElementById('examGradeSelect')?.addEventListener('change', loadExamsSchedule);

  async function loadExamsSchedule() {
    const cont = document.getElementById('examsContent');
    if (!cont) return;
    cont.innerHTML = '<div class="loading-subjects">جاري التحميل...</div>';

    // الأدمن يختار الفرقة من dropdown الصفحة – اليوزر يأخذها من Session تلقائياً
    const grade = (app.isAdmin && document.getElementById('examGradeSelect'))
      ? document.getElementById('examGradeSelect').value
      : app.userGrade;

    const url = `api/get_uploads.php?subject_id=1&type=exam_schedule&grade=${grade}`;
    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (!data.success || !data.uploads.length) {
        cont.innerHTML = emptyState('لا يوجد جدول امتحانات', 'لم يتم رفع جدول الامتحانات بعد');
        return;
      }
      cont.innerHTML = `<div class="files-cards-grid">
        ${data.uploads.map(f => scheduleCard(f, 'جدول امتحانات')).join('')}
      </div>`;
    } catch {
      cont.innerHTML = emptyState('خطأ في تحميل جدول الامتحانات', '');
    }
  }

  // تعيين المرجع الخارجي بعد تعريف الدالة مباشرة
  // عشان switchPanel (المعرّفة برا الـ block) تقدر تستدعيها
  _loadExamsScheduleFn = loadExamsSchedule;

  // بطاقة الجدول
  function scheduleCard(f, cardTypeLabel) {
    const viewBtn = `<button class="file-action-btn file-view-btn" onclick="openPreviewModal('${escHtml(f.file_path)}','${escHtml(f.original_name || cardTypeLabel)}')">
                       <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                       عرض
                     </button>`;
    const dlBtn   = `<a class="file-action-btn file-dl-btn" href="${escHtml(f.file_path)}" download>
                       <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                       تحميل
                     </a>`;
    const deleteBtn = app.isAdmin
      ? `<button class="file-action-btn file-delete-btn" onclick="deleteFile(${f.id})">
           <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 6H21M19 6L18 20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
           حذف
         </button>`
      : '';

    const gradeLabels = {1:'الفرقة الأولى',2:'الفرقة الثانية',3:'الفرقة الثالثة',4:'الفرقة الرابعة'};
    const gradeText   = gradeLabels[parseInt(f.grade)] || `الفرقة ${f.grade}`;
    // رقم السكشن يظهر فقط في بطاقات الجدول الدراسي وليس جدول الامتحانات
    const secText = (f.type !== 'exam_schedule' && f.section_number) ? ` | سكشن ${f.section_number}` : '';

    return `
      <div class="file-card-new" id="fcard-${f.id}">
        <div class="file-card-icon">📅</div>
        <div class="file-card-body">
          <span class="file-card-name">${escHtml(f.original_name || cardTypeLabel)}</span>
          <span class="file-card-meta">${cardTypeLabel} &nbsp;|&nbsp; ${gradeText}${secText}</span>
          <span class="file-card-meta">${formatDate(f.created_at)}</span>
        </div>
        <div class="file-card-actions">
          ${viewBtn}
          ${dlBtn}
          ${deleteBtn}
        </div>
      </div>`;
  }

  /* ==============================
     ADMIN: PENDING FILES (Auto-refresh)
     ============================== */
  let _pendingTimer = null;

  async function loadPendingFiles() {
    if (!app.isAdmin) return;
    const list = document.getElementById('pendingList');
    if (!list) return;
    list.innerHTML = '<div class="loading-subjects">جاري التحميل...</div>';
    try {
      const res  = await fetch('api/get_pending.php');
      const data = await res.json();
      if (!data.success || !data.pending.length) {
        list.innerHTML = emptyState('لا توجد ملفات قيد المراجعة', 'جميع الملفات تمت مراجعتها');
      } else {
        list.innerHTML = `<div class="files-cards-grid">
          ${data.pending.map(f => pendingCard(f)).join('')}
        </div>`;
      }
    } catch {
      list.innerHTML = emptyState('خطأ في تحميل الملفات', '');
    }
  }

  // تحديث تلقائي كل 30 ثانية عند فتح قسم المراجعة
  function startPendingAutoRefresh() {
    stopPendingAutoRefresh();
    _pendingTimer = setInterval(loadPendingFiles, 30000);
  }

  function stopPendingAutoRefresh() {
    if (_pendingTimer) { clearInterval(_pendingTimer); _pendingTimer = null; }
  }

  // تفعيل التحديث التلقائي عند تبديل الـ panel
  const origSwitchPanel = window._switchPanel || switchPanel;
  document.querySelectorAll('.sidebar-link[data-dash]').forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.dash === 'pending') {
        loadPendingFiles();
        startPendingAutoRefresh();
      } else {
        stopPendingAutoRefresh();
      }
    });
  });

  document.getElementById('refreshPendingBtn')?.addEventListener('click', loadPendingFiles);

  function pendingCard(f) {
    const deleteBtn = `<button class="file-action-btn file-delete-btn" onclick="deleteFile(${f.id})">
                         <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 6H21M19 6L18 20C18 21.1 17.1 22 16 22H8C6.9 22 6 21.1 6 20L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                         حذف
                       </button>`;
    return `
      <div class="file-card-new" id="fcard-${f.id}">
        <div class="file-card-icon">${fileIcon(f.original_name || f.file_path)}</div>
        <div class="file-card-body">
          <span class="file-card-name">${escHtml(f.original_name || 'ملف')}</span>
          <span class="file-card-meta">المادة: ${escHtml(f.subject_name)} &nbsp;|&nbsp; الفرقة ${f.grade}</span>
          <span class="file-card-meta">رُفع بواسطة: ${escHtml(f.uploader_name)} (${escHtml(f.uploader_code)})</span>
          <span class="file-card-meta">النوع: ${typeLabel(f.type)} &nbsp;|&nbsp; ${formatDate(f.created_at)}</span>
          <span class="file-status-badge status-pending">⏳ قيد المراجعة</span>
        </div>
        <div class="file-card-actions">
          <button class="file-action-btn file-view-btn" onclick="openPreviewModal('${escHtml(f.file_path)}','${escHtml(f.original_name || 'ملف')}')">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
            عرض
          </button>
          <a class="file-action-btn file-dl-btn" href="${escHtml(f.file_path)}" download>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            تحميل
          </a>
          ${deleteBtn}
          <button class="approve-btn" onclick="reviewFile(${f.id},'approve')">✅ قبول</button>
          <button class="reject-btn"  onclick="reviewFile(${f.id},'reject')">❌ رفض</button>
        </div>
      </div>`;
  }

  window.reviewFile = async function(uploadId, action) {
    const card = document.getElementById('fcard-' + uploadId);
    if (card) card.style.opacity = '0.5';
    const fd = new FormData();
    fd.append('upload_id', uploadId);
    fd.append('action', action);
    try {
      const res  = await fetch('api/approve_upload.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && card) {
        card.style.transition = 'all 0.4s';
        card.style.opacity    = '0';
        card.style.transform  = 'scale(0.9)';
        setTimeout(() => card.remove(), 400);
      } else if (card) {
        card.style.opacity = '1';
      }
    } catch {
      if (card) card.style.opacity = '1';
    }
  };

  // حذف من أي قسم – بـ custom confirm modal
  window.deleteFile = function(uploadId) {
    openDeleteConfirm(uploadId);
  };
}

/* ========================================
   DELETE CONFIRM MODAL
   ======================================== */
let _deleteTargetId = null;

function openDeleteConfirm(uploadId) {
  _deleteTargetId = uploadId;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeDeleteConfirm() {
  _deleteTargetId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.getElementById('deleteConfirmNo')?.addEventListener('click', closeDeleteConfirm);

document.getElementById('deleteConfirmModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeDeleteConfirm();
});

document.getElementById('deleteConfirmYes')?.addEventListener('click', async function() {
  if (!_deleteTargetId) return;
  const uploadId = _deleteTargetId;
  closeDeleteConfirm();

  const card = document.getElementById('fcard-' + uploadId);
  if (card) card.style.opacity = '0.5';

  const fd = new FormData();
  fd.append('upload_id', uploadId);
  fd.append('action', 'delete');
  try {
    const res  = await fetch('api/approve_upload.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success && card) {
      card.style.transition = 'all 0.4s';
      card.style.opacity    = '0';
      card.style.transform  = 'scale(0.9)';
      setTimeout(() => card.remove(), 400);
    } else if (card) {
      card.style.opacity = '1';
    }
  } catch {
    if (card) card.style.opacity = '1';
  }
});

/* ========================================
   HELPERS
   ======================================== */
function emptyState(title, sub) {
  return `<div class="empty-state">
    <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M22 19C22 19.5 21.8 20 21.4 20.4C21 20.8 20.5 21 20 21H4C3.5 21 3 20.8 2.6 20.4C2.2 20 2 19.5 2 19V5C2 4.5 2.2 4 2.6 3.6C3 3.2 3.5 3 4 3H9L11 6H20C20.5 6 21 6.2 21.4 6.6C21.8 7 22 7.5 22 8V19Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <h3>${title}</h3><p>${sub}</p></div>`;
}

function fileIcon(name) {
  if (!name) return '📄';
  const ext = name.split('.').pop().toLowerCase();
  const m = { pdf:'📕', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊', xls:'📈', xlsx:'📈',
              jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', mp4:'🎬', avi:'🎬', zip:'📦', rar:'📦' };
  return m[ext] || '📄';
}

function statusLabel(s) {
  return { approved:'✅ منشور', pending:'⏳ قيد المراجعة', rejected:'❌ مرفوض' }[s] || s;
}
function typeLabel(t) {
  return { lecture:'محاضرة', task:'تاسك', assignment:'اسايمنت', section:'سكشن', schedule:'جدول', exam_schedule:'جدول امتحانات' }[t] || t;
}
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ar-EG', { year:'numeric', month:'short', day:'numeric' });
}
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ============================================================
   EXAM SYSTEM – نظام الامتحانات الإلكترونية
   يعمل داخل panelExamSystem في الـ Dashboard
   ============================================================ */

let _examSystemInitialized = false;
let _currentExamTab = 'exams_list';  // التبويب الحالي

// ===== نقطة الدخول: تُستدعى من switchPanel =====
function initExamSystem() {
  if (!app.isLoggedIn) return;

  // ربط تبويبات الأدمن أو الطالب (مرة واحدة)
  if (!_examSystemInitialized) {
    _examSystemInitialized = true;

    // زر إنشاء امتحان (أدمن)
    document.getElementById('showCreateExamBtn')?.addEventListener('click', () => {
      const wrap = document.getElementById('createExamFormWrap');
      if (!wrap) return;
      const isHidden = wrap.style.display === 'none';
      wrap.style.display = isHidden ? 'block' : 'none';
      if (isHidden) loadSubjectsForExamForm();
    });

    document.getElementById('ecfCancelBtn')?.addEventListener('click', () => {
      document.getElementById('createExamFormWrap').style.display = 'none';
    });

    // تغيير الفرقة في النموذج → تحديث قائمة المواد
    document.getElementById('ecfGrade')?.addEventListener('change', loadSubjectsForExamForm);

    // زر إضافة سؤال
    document.getElementById('ecfAddQuestionBtn')?.addEventListener('click', addQuestionBlock);

    // زر رفع الامتحان
    document.getElementById('ecfSubmitBtn')?.addEventListener('click', submitCreateExam);

    // فلتر الفرقة للأدمن → تحديث القائمة
    document.getElementById('examSysGradeSelect')?.addEventListener('change', () => {
      loadExamsList();
    });

    // تبويبات
    document.querySelectorAll('[data-exam-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-exam-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentExamTab = btn.dataset.examTab;
        renderExamTab();
      });
    });
  }

  renderExamTab();
}

function renderExamTab() {
  if (_currentExamTab === 'exams_list') loadExamsList();
  else if (_currentExamTab === 'submissions') loadSubmissions();
  else if (_currentExamTab === 'my_results') loadMyResults();
}

// ===== تحميل قائمة الامتحانات =====
async function loadExamsList() {
  const cont = document.getElementById('examSystemContent');
  if (!cont) return;
  cont.innerHTML = '<div class="loading-subjects">جاري تحميل الامتحانات...</div>';

  const grade = app.isAdmin
    ? (document.getElementById('examSysGradeSelect')?.value || app.userGrade)
    : app.userGrade;

  try {
    const res  = await fetch(`api/get_exams.php?grade=${grade}`);
    const data = await res.json();

    if (!data.success) {
      cont.innerHTML = emptyState('خطأ في تحميل الامتحانات', data.message || '');
      return;
    }

    if (!data.exams.length) {
      cont.innerHTML = emptyState(
        app.isAdmin ? 'لا توجد امتحانات لهذه الفرقة' : 'لا توجد امتحانات متاحة حالياً',
        app.isAdmin ? 'اضغط "+ إنشاء امتحان" لإضافة امتحان جديد' : 'ستجد الامتحانات هنا عند إتاحتها من الأدمن'
      );
      return;
    }

    cont.innerHTML = `<div class="exams-grid">${data.exams.map(e => examCard(e)).join('')}</div>`;

    // ربط أزرار الحذف والتفعيل (أدمن)
    cont.querySelectorAll('.exam-admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteExam(btn.dataset.id));
    });
    cont.querySelectorAll('.exam-admin-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleExam(btn.dataset.id, btn.dataset.active));
    });

  } catch (e) {
    cont.innerHTML = emptyState('خطأ في الاتصال بالخادم', '');
  }
}

// ===== بناء كارد الامتحان =====
function examCard(e) {
  const isAttempted = parseInt(e.user_attempted) > 0;
  const userStatus  = e.user_status || null;
  const isBanned    = userStatus === 'banned';
  const isDone      = (userStatus === 'submitted' || userStatus === 'timed_out');

  let statusBadge = '';
  let startBtn    = '';

  if (app.isAdmin) {
    statusBadge = e.is_active == 1
      ? `<span class="exam-card-status exam-status-available">مفعّل ✅</span>`
      : `<span class="exam-card-status exam-status-banned">معطّل ⛔</span>`;

    startBtn = `
      <div class="exam-card-admin-btns">
        <button class="exam-admin-btn exam-admin-toggle-btn"
          data-id="${e.id}" data-active="${e.is_active}">
          ${e.is_active == 1 ? '⛔ تعطيل' : '✅ تفعيل'}
        </button>
        <button class="exam-admin-btn exam-admin-delete-btn" data-id="${e.id}">
          🗑️ حذف
        </button>
      </div>
      <div class="exam-card-meta" style="grid-template-columns:1fr;">
        <div class="exam-meta-item">
          <span class="exam-meta-label">📥 الطلاب الذين سلّموا</span>
          <span class="exam-meta-value">${e.submissions_count ?? 0} طالب</span>
        </div>
      </div>`;
  } else {
    if (isBanned) {
      statusBadge = `<span class="exam-card-status exam-status-banned">محظور 🚫</span>`;
      startBtn    = `<button class="exam-start-card-btn" disabled>محظور من الامتحان</button>`;
    } else if (isDone) {
      statusBadge = `<span class="exam-card-status exam-status-done">تم الأداء ✅</span>`;
      startBtn    = `<button class="exam-start-card-btn" disabled>تم التسليم</button>`;
    } else {
      statusBadge = `<span class="exam-card-status exam-status-available">متاح 🟢</span>`;
      startBtn    = `<a class="exam-start-card-btn" href="exams/take.php?exam_id=${e.id}">
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 3L19 12L5 21V3Z" fill="currentColor"/></svg>
        ابدأ الامتحان
      </a>`;
    }
  }

  return `
    <div class="exam-card">
      <div class="exam-card-header">
        <span class="exam-card-icon">📝</span>
        ${statusBadge}
      </div>
      <div class="exam-card-title">${escHtml(e.title)}</div>
      <div class="exam-card-subject">${escHtml(e.subject_name)}</div>
      ${e.description ? `<div class="exam-card-desc">${escHtml(e.description)}</div>` : ''}
      <div class="exam-card-meta">
        <div class="exam-meta-item">
          <span class="exam-meta-label">⏱️ المدة</span>
          <span class="exam-meta-value">${e.duration_mins} دقيقة</span>
        </div>
        <div class="exam-meta-item">
          <span class="exam-meta-label">❓ الأسئلة</span>
          <span class="exam-meta-value">${e.num_questions} سؤال</span>
        </div>
        <div class="exam-meta-item">
          <span class="exam-meta-label">📊 الدرجة الكلية</span>
          <span class="exam-meta-value">${e.total_marks} درجة</span>
        </div>
        <div class="exam-meta-item">
          <span class="exam-meta-label">✅ النجاح</span>
          <span class="exam-meta-value">${e.pass_marks} درجة</span>
        </div>
      </div>
      ${startBtn}
    </div>`;
}

// ===== حذف امتحان =====
async function deleteExam(examId) {
  if (!confirm('هل أنت متأكد من حذف هذا الامتحان وجميع بيانات الطلاب؟')) return;
  try {
    const res  = await fetch('api/delete_exam.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_id: examId })
    });
    const data = await res.json();
    if (data.success) loadExamsList();
    else alert(data.message || 'خطأ في الحذف');
  } catch { alert('خطأ في الاتصال'); }
}

// ===== تفعيل / تعطيل امتحان =====
async function toggleExam(examId, currentActive) {
  try {
    const res  = await fetch('api/toggle_exam.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_id: examId, is_active: currentActive == 1 ? 0 : 1 })
    });
    const data = await res.json();
    if (data.success) loadExamsList();
    else alert(data.message || 'خطأ');
  } catch { alert('خطأ في الاتصال'); }
}

// ===== مراجعة الإجابات (أدمن) =====
async function loadSubmissions() {
  const cont = document.getElementById('examSystemContent');
  if (!cont) return;
  cont.innerHTML = '<div class="loading-subjects">جاري تحميل الإجابات...</div>';

  try {
    const res  = await fetch('api/get_exam_submissions.php');
    const data = await res.json();

    if (!data.success || !data.submissions.length) {
      cont.innerHTML = emptyState('لا توجد امتحانات مسلّمة', 'ستظهر هنا بعد تسليم الطلاب لامتحاناتهم');
      return;
    }

    cont.innerHTML = `<div class="exam-submissions-list">${data.submissions.map(s => submissionCard(s)).join('')}</div>`;

    // ربط أزرار الحفظ
    cont.querySelectorAll('.grade-save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const resultId = btn.dataset.resultId;
        const input    = document.getElementById(`grade_input_${resultId}`);
        const notes    = document.getElementById(`grade_notes_${resultId}`);
        if (!input) return;
        saveGrade(resultId, input.value, notes?.value || '');
      });
    });

    // ربط أزرار عرض الإجابات
    cont.querySelectorAll('.exam-review-btn').forEach(btn => {
      btn.addEventListener('click', () => viewAnswers(btn.dataset.sessionId, btn.dataset.studentName));
    });

  } catch (e) {
    cont.innerHTML = emptyState('خطأ في تحميل البيانات', '');
  }
}

function submissionCard(s) {
  const isReviewed = s.is_reviewed == 1;
  const cheatWarn  = s.cheat_attempts > 0
    ? `<span style="color:#fbbf24;">⚠️ محاولات غش: ${s.cheat_attempts}</span>` : '';

  const gradeSection = isReviewed
    ? `<div class="grade-input-wrap">
         <label>✅ الدرجة المُعطاة:</label>
         <span style="font-size:20px;font-weight:900;color:#4ade80;">${s.obtained_marks}</span>
         <span style="color:rgba(255,255,255,0.5);font-size:13px;">/ ${s.total_marks}</span>
         ${s.notes ? `<span style="color:rgba(255,255,255,0.55);font-size:12px;">| ${escHtml(s.notes)}</span>` : ''}
       </div>`
    : `<div class="grade-input-wrap">
         <label>الدرجة (من ${s.total_marks}):</label>
         <input type="number" class="grade-num-input" id="grade_input_${s.result_id}"
           min="0" max="${s.total_marks}" placeholder="0" />
         <input type="text" class="ecf-input" id="grade_notes_${s.result_id}"
           placeholder="ملاحظات (اختياري)" style="flex:1;max-width:200px;" />
         <button class="grade-save-btn" data-result-id="${s.result_id}">💾 حفظ</button>
       </div>`;

  return `
    <div class="exam-sub-card" id="sub_card_${s.result_id}">
      <div class="exam-sub-header">
        <span class="exam-sub-title">📝 ${escHtml(s.exam_title)}</span>
        <span class="exam-sub-badge ${isReviewed ? 'sub-reviewed' : 'sub-pending'}">
          ${isReviewed ? '✅ تمت المراجعة' : '⏳ قيد المراجعة'}
        </span>
      </div>
      <div class="exam-sub-meta">
        <span>👤 ${escHtml(s.student_name)}</span>
        <span>🎓 كود: ${escHtml(s.student_code)}</span>
        <span>📚 ${escHtml(s.subject_name)} - الفرقة ${s.exam_grade}</span>
        <span>📅 ${formatDate(s.submitted_at)}</span>
        ${cheatWarn}
      </div>
      <div class="exam-sub-actions">
        <button class="exam-review-btn"
          data-session-id="${s.session_id}"
          data-student-name="${escHtml(s.student_name)}">
          🔍 عرض الإجابات
        </button>
      </div>
      ${gradeSection}
    </div>`;
}

// ===== حفظ الدرجة =====
async function saveGrade(resultId, marks, notes) {
  if (marks === '' || marks === null) { alert('أدخل الدرجة أولاً'); return; }
  try {
    const res  = await fetch('api/review_exam.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_id: resultId, obtained_marks: parseInt(marks), notes })
    });
    const data = await res.json();
    if (data.success) {
      // تحديث الكارد بدون إعادة تحميل كاملة
      const card = document.getElementById(`sub_card_${resultId}`);
      if (card) {
        card.style.transition = 'all 0.4s';
        card.style.borderColor = 'rgba(34,197,94,0.4)';
        setTimeout(() => loadSubmissions(), 800);
      }
    } else {
      alert(data.message || 'خطأ في الحفظ');
    }
  } catch { alert('خطأ في الاتصال'); }
}

// ===== عرض إجابات طالب (أدمن) =====
async function viewAnswers(sessionId, studentName) {
  const cont = document.getElementById('examSystemContent');
  if (!cont) return;
  cont.innerHTML = '<div class="loading-subjects">جاري تحميل الإجابات...</div>';

  try {
    const res  = await fetch(`api/get_exam_answers.php?session_id=${sessionId}`);
    const data = await res.json();

    if (!data.success) {
      cont.innerHTML = emptyState('خطأ في تحميل الإجابات', data.message || '');
      return;
    }

    const { session, questions, cheat_log } = data;

    const cheatSection = cheat_log.length
      ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:14px;padding:16px;margin-bottom:20px;">
           <div style="font-size:14px;font-weight:800;color:#f87171;margin-bottom:10px;">⚠️ سجل محاولات الغش (${cheat_log.length})</div>
           ${cheat_log.map(c => `<div style="font-size:12px;color:rgba(255,255,255,0.6);padding:4px 0;">
             ${c.attempt_num}. ${escHtml(c.cheat_type)} — ${formatDate(c.logged_at)}
           </div>`).join('')}
         </div>` : '';

    const qHtml = questions.map((q, i) => {
      const studentAns = q.question_type === 'mcq' ? q.answer_mcq : q.answer_essay;
      const isCorrect  = q.question_type === 'mcq' && q.correct_answer && studentAns === q.correct_answer;
      const isWrong    = q.question_type === 'mcq' && q.correct_answer && studentAns && !isCorrect;

      const borderColor = !studentAns
        ? 'rgba(255,255,255,0.1)'
        : (q.question_type === 'mcq' ? (isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(83,183,255,0.3)');

      const optionsList = q.question_type === 'mcq'
        ? ['a','b','c','d'].filter(k => q[`option_${k}`]).map(k => {
            const isAns  = studentAns === k;
            const isCor  = q.correct_answer === k;
            const color  = isCor ? '#4ade80' : (isAns && !isCor ? '#f87171' : 'rgba(255,255,255,0.7)');
            return `<div style="padding:8px 12px;border-radius:10px;border:1px solid ${isCor?'rgba(34,197,94,0.35)':'rgba(255,255,255,0.1)'};background:${isCor?'rgba(34,197,94,0.08)':'transparent'};font-size:13px;color:${color};">
              ${isCor?'✅ ':''} ${isAns && !isCor ?'❌ ':''}<strong>${k.toUpperCase()}.</strong> ${escHtml(q[`option_${k}`])}
            </div>`;
          }).join('')
        : `<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6;">
             ${studentAns ? escHtml(studentAns) : '<span style="color:rgba(255,255,255,0.35);">لم تُكتب إجابة</span>'}
           </div>`;

      return `<div style="background:rgba(255,255,255,0.05);border:1px solid ${borderColor};border-radius:14px;padding:20px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span style="background:rgba(47,123,255,0.2);color:#7eb8ff;border:1px solid rgba(47,123,255,0.35);border-radius:20px;padding:3px 12px;font-size:12px;font-weight:800;">
            س ${i + 1}
          </span>
          <span style="font-size:11px;color:rgba(255,255,255,0.45);">${q.marks} درجة</span>
          ${!studentAns ? '<span style="color:#fbbf24;font-size:12px;">⚠️ بدون إجابة</span>' : ''}
        </div>
        <div style="font-size:15px;color:#fff;font-weight:700;margin-bottom:14px;line-height:1.6;">${escHtml(q.question_text)}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">${optionsList}</div>
      </div>`;
    }).join('');

    cont.innerHTML = `
      <div>
        <button class="btn btn-outline" id="backToSubmissions" style="margin-bottom:20px;">
          ← العودة للقائمة
        </button>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:18px 20px;margin-bottom:20px;">
          <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:8px;">
            إجابات: ${escHtml(studentName)}
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:rgba(255,255,255,0.6);font-weight:700;">
            <span>📝 ${escHtml(session.exam_title)}</span>
            <span>⏱️ بدأ: ${formatDate(session.started_at)}</span>
            <span>✅ سلّم: ${formatDate(session.submitted_at)}</span>
            <span>⚠️ محاولات غش: ${session.cheat_attempts}</span>
          </div>
        </div>
        ${cheatSection}
        ${qHtml}
      </div>`;

    document.getElementById('backToSubmissions')?.addEventListener('click', loadSubmissions);

  } catch (e) {
    cont.innerHTML = emptyState('خطأ في تحميل الإجابات', '');
  }
}

// ===== نتائجي (الطالب) =====
async function loadMyResults() {
  const cont = document.getElementById('examSystemContent');
  if (!cont) return;
  cont.innerHTML = '<div class="loading-subjects">جاري تحميل نتائجك...</div>';

  try {
    const res  = await fetch('api/get_exam_submissions.php');
    const data = await res.json();

    if (!data.success || !data.submissions.length) {
      cont.innerHTML = emptyState('لا توجد نتائج بعد', 'ستظهر هنا نتائج الامتحانات بعد مراجعتها من الأدمن');
      return;
    }

    cont.innerHTML = `
      <div class="student-results-list">
        ${data.submissions.map(s => `
          <div class="student-result-card">
            <span class="src-icon">📊</span>
            <div class="src-info">
              <div class="src-title">${escHtml(s.exam_title)}</div>
              <div class="src-sub">${escHtml(s.subject_name)} &nbsp;|&nbsp; ${formatDate(s.submitted_at)}</div>
            </div>
            ${s.is_reviewed == 1
              ? `<div class="src-grade">
                   <span class="src-grade-val">${s.obtained_marks}</span>
                   <span class="src-grade-total">من ${s.total_marks}</span>
                   ${s.obtained_marks >= s.pass_marks
                     ? '<span style="color:#4ade80;font-size:11px;font-weight:800;">✅ ناجح</span>'
                     : '<span style="color:#f87171;font-size:11px;font-weight:800;">❌ راسب</span>'}
                 </div>`
              : '<span class="src-pending-badge">⏳ قيد المراجعة</span>'}
          </div>`).join('')}
      </div>`;

  } catch (e) {
    cont.innerHTML = emptyState('خطأ في تحميل البيانات', '');
  }
}

/* ============================================================
   إنشاء الامتحان (نموذج الأدمن)
   ============================================================ */

let _questionCount = 0;

// جلب المواد حسب الفرقة لملء قائمة المادة في النموذج
async function loadSubjectsForExamForm() {
  const grade   = document.getElementById('ecfGrade')?.value || app.userGrade;
  const select  = document.getElementById('ecfSubject');
  if (!select) return;
  select.innerHTML = '<option value="">جاري التحميل...</option>';
  try {
    const res  = await fetch(`api/get_subjects.php?grade=${grade}`);
    const data = await res.json();
    select.innerHTML = '<option value="">اختر المادة...</option>';
    if (data.success) {
      data.subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        select.appendChild(opt);
      });
    }
  } catch {
    select.innerHTML = '<option value="">خطأ في التحميل</option>';
  }
}

// إضافة بلوك سؤال
function addQuestionBlock() {
  _questionCount++;
  const list = document.getElementById('ecfQuestionsList');
  if (!list) return;

  const block = document.createElement('div');
  block.className = 'ecf-question-block';
  block.dataset.qNum = _questionCount;
  block.innerHTML = `
    <div class="ecf-question-header">
      <span class="ecf-question-num">سؤال ${_questionCount}</span>
      <select class="ecf-select" name="q_type_${_questionCount}" style="max-width:160px;">
        <option value="mcq">اختيار من متعدد (MCQ)</option>
        <option value="essay">مقالي</option>
      </select>
      <input type="number" class="ecf-input" name="q_marks_${_questionCount}"
        placeholder="الدرجة" value="1" min="1" style="max-width:80px;" />
      <button type="button" class="ecf-remove-q-btn" data-qnum="${_questionCount}">✕ حذف</button>
    </div>
    <div class="ecf-field full">
      <label class="ecf-label">نص السؤال *</label>
      <textarea class="ecf-textarea" name="q_text_${_questionCount}" placeholder="اكتب السؤال هنا..." rows="2"></textarea>
    </div>
    <div class="ecf-mcq-wrap" id="mcq_wrap_${_questionCount}">
      <div class="ecf-mcq-options">
        <div class="ecf-field">
          <label class="ecf-label">الاختيار أ *</label>
          <input type="text" class="ecf-input" name="q_a_${_questionCount}" placeholder="الاختيار أ" />
        </div>
        <div class="ecf-field">
          <label class="ecf-label">الاختيار ب *</label>
          <input type="text" class="ecf-input" name="q_b_${_questionCount}" placeholder="الاختيار ب" />
        </div>
        <div class="ecf-field">
          <label class="ecf-label">الاختيار ج</label>
          <input type="text" class="ecf-input" name="q_c_${_questionCount}" placeholder="الاختيار ج" />
        </div>
        <div class="ecf-field">
          <label class="ecf-label">الاختيار د</label>
          <input type="text" class="ecf-input" name="q_d_${_questionCount}" placeholder="الاختيار د" />
        </div>
      </div>
      <div class="ecf-field" style="margin-top:8px;">
        <label class="ecf-label">الإجابة الصحيحة *</label>
        <select class="ecf-select" name="q_correct_${_questionCount}" style="max-width:200px;">
          <option value="a">أ</option>
          <option value="b">ب</option>
          <option value="c">ج</option>
          <option value="d">د</option>
        </select>
      </div>
    </div>`;

  // إخفاء / إظهار خيارات MCQ حسب النوع
  const typeSelect = block.querySelector(`[name="q_type_${_questionCount}"]`);
  const mcqWrap    = block.querySelector(`#mcq_wrap_${_questionCount}`);
  typeSelect.addEventListener('change', () => {
    mcqWrap.style.display = typeSelect.value === 'mcq' ? 'block' : 'none';
  });

  // حذف بلوك
  block.querySelector('.ecf-remove-q-btn').addEventListener('click', () => {
    block.remove();
    // إعادة ترقيم العناوين
    document.querySelectorAll('.ecf-question-block').forEach((b, i) => {
      b.querySelector('.ecf-question-num').textContent = `سؤال ${i + 1}`;
    });
  });

  list.appendChild(block);
}

// رفع الامتحان
async function submitCreateExam() {
  const btn = document.getElementById('ecfSubmitBtn');
  const msg = document.getElementById('ecfMsg');
  if (!btn || !msg) return;

  // جمع البيانات
  const grade      = document.getElementById('ecfGrade')?.value;
  const subjectId  = document.getElementById('ecfSubject')?.value;
  const title      = document.getElementById('ecfTitle')?.value.trim();
  const desc       = document.getElementById('ecfDesc')?.value.trim();
  const duration   = document.getElementById('ecfDuration')?.value;
  const totalMarks = document.getElementById('ecfTotalMarks')?.value;
  const passMarks  = document.getElementById('ecfPassMarks')?.value;

  if (!title || !grade || !subjectId || !duration) {
    showEcfMsg('⚠️ يرجى ملء جميع الحقول الإلزامية', true);
    return;
  }

  // جمع الأسئلة
  const blocks    = document.querySelectorAll('.ecf-question-block');
  const questions = [];

  for (const block of blocks) {
    const n    = block.dataset.qNum;
    const type = block.querySelector(`[name="q_type_${n}"]`)?.value;
    const text = block.querySelector(`[name="q_text_${n}"]`)?.value.trim();
    const marks= block.querySelector(`[name="q_marks_${n}"]`)?.value || 1;

    if (!text) {
      showEcfMsg('⚠️ يرجى ملء نص جميع الأسئلة', true);
      return;
    }

    const q = { question_text: text, question_type: type, marks: parseInt(marks) };

    if (type === 'mcq') {
      q.option_a      = block.querySelector(`[name="q_a_${n}"]`)?.value.trim();
      q.option_b      = block.querySelector(`[name="q_b_${n}"]`)?.value.trim();
      q.option_c      = block.querySelector(`[name="q_c_${n}"]`)?.value.trim();
      q.option_d      = block.querySelector(`[name="q_d_${n}"]`)?.value.trim();
      q.correct_answer= block.querySelector(`[name="q_correct_${n}"]`)?.value;
      if (!q.option_a || !q.option_b) {
        showEcfMsg('⚠️ يجب إضافة الاختيار أ وب على الأقل لكل سؤال MCQ', true);
        return;
      }
    }
    questions.push(q);
  }

  if (!questions.length) {
    showEcfMsg('⚠️ يجب إضافة سؤال واحد على الأقل', true);
    return;
  }

  btn.disabled     = true;
  btn.textContent  = 'جاري الرفع...';

  try {
    const res  = await fetch('api/create_exam.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description: desc, grade, subject_id: subjectId,
        duration_mins: parseInt(duration),
        total_marks: parseInt(totalMarks),
        pass_marks: parseInt(passMarks),
        questions
      })
    });
    const data = await res.json();

    if (data.success) {
      showEcfMsg('✅ تم رفع الامتحان بنجاح!', false);
      // تصفير النموذج
      setTimeout(() => {
        document.getElementById('createExamFormWrap').style.display = 'none';
        document.getElementById('ecfTitle').value   = '';
        document.getElementById('ecfDesc').value    = '';
        document.getElementById('ecfQuestionsList').innerHTML = '';
        _questionCount = 0;
        msg.style.display = 'none';
        loadExamsList();
      }, 1500);
    } else {
      showEcfMsg(data.message || 'خطأ في الرفع', true);
    }
  } catch {
    showEcfMsg('⚠️ خطأ في الاتصال بالخادم', true);
  }

  btn.disabled    = false;
  btn.innerHTML   = `<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M17 8L12 3L7 8M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> رفع الامتحان`;
}

function showEcfMsg(text, isError) {
  const msg = document.getElementById('ecfMsg');
  if (!msg) return;
  msg.textContent  = text;
  msg.className    = `ecf-msg ${isError ? 'error' : 'success'}`;
  msg.style.display = 'block';
  if (!isError) setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

