// =============================================
// assets/js/exam.js – نظام أداء الامتحان الكامل
// يعمل على صفحة exams/take.php
// =============================================

const EAPP = window.EXAM_APP;

// ===== State =====
let examData      = null;   // بيانات الامتحان من الـ API
let sessionId     = null;   // معرف الجلسة
let questions     = [];     // قائمة الأسئلة
let answers       = {};     // الإجابات { question_id: value }
let currentIndex  = 0;      // السؤال الحالي
let timerInterval = null;   // interval الـ timer
let timeRemaining = 0;      // الثواني المتبقية
let cheatCount    = 0;      // عدد محاولات الغش
let examStarted   = false;  // هل بدأ الامتحان
let isSubmitting  = false;  // جاري التسليم

// ===== Local Storage Key =====
const LS_KEY = () => `exam_answers_${EAPP.examId}_${EAPP.userId}`;
const LS_TIME_KEY = () => `exam_time_${EAPP.examId}_${EAPP.userId}`;

// ===== Pages =====
function showPage(id) {
  document.querySelectorAll('.exam-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');
}

// ===== Load Exam Data & Show Instructions =====
async function loadExamInstructions() {
  try {
    const res  = await fetch(`../api/start_exam.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_id: EAPP.examId })
    });
    const data = await res.json();

    if (!data.success) {
      showInstructionsError(data.message || 'خطأ في تحميل الامتحان');
      return;
    }

    examData    = data.exam;
    sessionId   = data.session_id;
    questions   = data.questions;
    timeRemaining = data.time_remaining;

    // استرجاع الإجابات المحفوظة محلياً أولاً (أسرع من DB)
    const localSaved = JSON.parse(localStorage.getItem(LS_KEY()) || '{}');
    // دمج مع ما جاء من DB
    answers = { ...localSaved };
    if (data.saved_answers) {
      for (const [qId, ans] of Object.entries(data.saved_answers)) {
        if (!answers[qId]) {
          answers[qId] = ans.answer_mcq || ans.answer_essay || null;
        }
      }
    }

    buildInstructionsBox();
    document.getElementById('instructionsActions').style.display = 'flex';

  } catch (err) {
    showInstructionsError('تعذّر الاتصال بالخادم. حاول مرة أخرى.');
  }
}

function showInstructionsError(msg) {
  document.getElementById('instructionsBox').innerHTML = `
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
      <h3 style="color:#f87171;font-size:18px;margin-bottom:10px;">${escH(msg)}</h3>
      <a href="../index.php" class="btn btn-outline" style="margin-top:16px;">العودة للمنصة</a>
    </div>`;
}

function buildInstructionsBox() {
  const e = examData;
  document.getElementById('instructionsBox').innerHTML = `
    <div class="inst-header">
      <div style="font-size:36px;">🎓</div>
      <h2>Qize نظام الامتحانات 🎓</h2>
      <p>مرحبًا بك في المنصة الإلكترونية للاختبارات</p>
    </div>

    <div class="inst-section">
      <div class="inst-section-title">📋 التعليمات العامة:</div>
      <div class="inst-grid">
        <div class="inst-item">
          <span class="inst-item-label">⏱️ الوقت المحدد</span>
          <span class="inst-item-value">${e.duration_mins} دقيقة</span>
        </div>
        <div class="inst-item">
          <span class="inst-item-label">❓ عدد الأسئلة</span>
          <span class="inst-item-value">${questions.length} سؤال</span>
        </div>
        <div class="inst-item">
          <span class="inst-item-label">📊 الدرجة الكلية</span>
          <span class="inst-item-value">${e.total_marks} درجة</span>
        </div>
        <div class="inst-item">
          <span class="inst-item-label">✅ درجة النجاح</span>
          <span class="inst-item-value">${e.pass_marks} درجة</span>
        </div>
      </div>
    </div>

    <div class="inst-section">
      <div class="inst-section-title">⚠️ القواعد:</div>
      <div class="inst-rules">
        <div class="inst-rule warn">
          <span>⚠️</span>
          <span>الامتحان مسموح مرة واحدة فقط</span>
        </div>
        <div class="inst-rule">
          <span>📌</span>
          <span>لن يتم عرض الإجابات الصحيحة</span>
        </div>
        <div class="inst-rule">
          <span>📧</span>
          <span>سيتم إرسال النتيجة على ملفك الشخصي والإجابات بعد مراجعة الامتحان من المشرفين</span>
        </div>
      </div>
    </div>

    <div class="inst-section">
      <div class="inst-section-title">🔒 نظام الحماية:</div>
      <div class="inst-rules">
        <div class="inst-rule danger">
          <span>⚠️</span>
          <span>نظام الحماية مفعّل: منع النسخ واللصق وتصوير الشاشة</span>
        </div>
        <div class="inst-rule danger">
          <span>⚠️</span>
          <span>لا تغادر نافذة الامتحان أثناء الاختبار</span>
        </div>
        <div class="inst-rule danger">
          <span>⚠️</span>
          <span>نظام الحظر: 3 محاولات غش = حظر تلقائي وإلغاء الامتحان</span>
        </div>
      </div>
    </div>

    <div class="inst-section">
      <div class="inst-section-title">📊 معلومات الامتحان:</div>
      <div class="inst-rules">
        <div class="inst-rule">
          <span>📝</span>
          <span><strong>عنوان الامتحان:</strong> ${escH(e.title)}</span>
        </div>
        ${e.description ? `<div class="inst-rule">
          <span>📄</span>
          <span><strong>الوصف:</strong> ${escH(e.description)}</span>
        </div>` : ''}
      </div>
    </div>`;
}

// ===== Start Exam =====
document.getElementById('startExamBtn')?.addEventListener('click', () => {
  if (!questions.length) return;
  startExam();
});

function startExam() {
  examStarted = true;
  buildQuestionsNav();
  showQuestion(0);
  startTimer();
  activateAntiCheat();
  showPage('pageExam');
}

// ===== Build Questions Nav =====
function buildQuestionsNav() {
  const nav = document.getElementById('questionsNav');
  nav.innerHTML = '';
  questions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'qnav-btn';
    btn.textContent = i + 1;
    btn.dataset.index = i;
    btn.addEventListener('click', () => showQuestion(i));
    nav.appendChild(btn);
  });
  updateNavColors();
}

function updateNavColors() {
  document.querySelectorAll('.qnav-btn').forEach((btn, i) => {
    btn.classList.remove('current', 'answered', 'unanswered');
    if (i === currentIndex) {
      btn.classList.add('current');
    } else {
      const q = questions[i];
      if (answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '') {
        btn.classList.add('answered');
      } else if (examStarted) {
        btn.classList.add('unanswered');
      }
    }
  });
}

// ===== Show Question =====
function showQuestion(index) {
  currentIndex = index;
  const q = questions[index];
  if (!q) return;

  const area = document.getElementById('questionArea');
  const savedAnswer = answers[q.id] ?? null;

  let answerHtml = '';
  if (q.question_type === 'mcq') {
    const opts = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
      { key: 'd', text: q.option_d }
    ].filter(o => o.text);

    answerHtml = `<div class="mcq-options">
      ${opts.map(o => `
        <label class="mcq-option${savedAnswer === o.key ? ' selected' : ''}" data-val="${o.key}">
          <input type="radio" name="mcq_${q.id}" value="${o.key}" ${savedAnswer === o.key ? 'checked' : ''}>
          <span class="mcq-radio"></span>
          <span class="mcq-option-letter">${o.key.toUpperCase()}</span>
          <span class="mcq-option-text">${escH(o.text)}</span>
        </label>`).join('')}
    </div>`;
  } else {
    answerHtml = `<textarea class="essay-textarea" id="essayInput_${q.id}" placeholder="اكتب إجابتك هنا..." rows="6">${savedAnswer ? escH(savedAnswer) : ''}</textarea>`;
  }

  area.innerHTML = `
    <div class="question-header">
      <span class="question-num-badge">السؤال ${index + 1} من ${questions.length}</span>
      <span class="question-type-badge">${q.question_type === 'mcq' ? 'اختيار من متعدد' : 'مقالي'}</span>
      <span class="question-marks">${q.marks} درجة</span>
    </div>
    <div class="question-text">${escH(q.question_text)}</div>
    ${answerHtml}`;

  // MCQ click handlers
  if (q.question_type === 'mcq') {
    area.querySelectorAll('.mcq-option').forEach(opt => {
      opt.addEventListener('click', () => {
        area.querySelectorAll('.mcq-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const val = opt.dataset.val;
        saveAnswer(q.id, val, 'mcq');
      });
    });
  } else {
    // Essay auto-save on input
    const ta = document.getElementById(`essayInput_${q.id}`);
    if (ta) {
      let essayTimer = null;
      ta.addEventListener('input', () => {
        clearTimeout(essayTimer);
        essayTimer = setTimeout(() => saveAnswer(q.id, ta.value, 'essay'), 1500);
      });
    }
  }

  // Update nav + counter + buttons
  updateNavColors();
  document.getElementById('questionCounter').textContent = `السؤال ${index + 1} من ${questions.length}`;
  document.getElementById('prevBtn').disabled = (index === 0);
  document.getElementById('nextBtn').disabled = (index === questions.length - 1);
}

// ===== Save Answer =====
async function saveAnswer(questionId, value, type) {
  answers[questionId] = value;

  // حفظ محلي فوري
  localStorage.setItem(LS_KEY(), JSON.stringify(answers));
  updateNavColors();

  // حفظ في الـ DB (background)
  try {
    const body = { session_id: sessionId, question_id: questionId };
    if (type === 'mcq') body.answer_mcq = value;
    else body.answer_essay = value;

    fetch('../api/save_answer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) { /* silent */ }
}

// ===== Navigation =====
document.getElementById('prevBtn')?.addEventListener('click', () => {
  if (currentIndex > 0) showQuestion(currentIndex - 1);
});
document.getElementById('nextBtn')?.addEventListener('click', () => {
  if (currentIndex < questions.length - 1) showQuestion(currentIndex + 1);
});

// ===== Timer =====
function startTimer() {
  // استعادة الوقت من localStorage لو في
  const savedTime = parseInt(localStorage.getItem(LS_TIME_KEY()) || '0');
  if (savedTime > 0 && savedTime < timeRemaining) timeRemaining = savedTime;

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;
    localStorage.setItem(LS_TIME_KEY(), timeRemaining);
    updateTimerDisplay();

    // تحذير عند 5 دقائق
    if (timeRemaining === 300) {
      showCheatWarning('⏰ تنبيه: تبقّى 5 دقائق فقط!', false);
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const display = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = display;

  const timerEl = document.getElementById('examTimer');
  if (timerEl) {
    timerEl.classList.toggle('danger', timeRemaining <= 120 && timeRemaining > 0);
  }
}

function autoSubmit() {
  if (isSubmitting) return;
  submitExam(true);
}

// ===== Submit =====
document.getElementById('submitExamBtn')?.addEventListener('click', () => {
  const unanswered = questions.filter(q => !answers[q.id]).length;
  const modal = document.getElementById('submitConfirmModal');
  document.getElementById('submitSummary').innerHTML = `
    هل أنت متأكد من تسليم الامتحان؟<br>
    <span style="color:rgba(255,255,255,0.6);font-size:13px;">
      أجبت على ${questions.length - unanswered} من ${questions.length} سؤال.
      ${unanswered > 0 ? `<br><span style="color:#fbbf24;">${unanswered} سؤال لم تُجِب عليه.</span>` : ''}
    </span>`;
  modal.classList.add('active');
});

document.getElementById('confirmSubmitBtn')?.addEventListener('click', () => {
  document.getElementById('submitConfirmModal').classList.remove('active');
  submitExam(false);
});
document.getElementById('cancelSubmitBtn')?.addEventListener('click', () => {
  document.getElementById('submitConfirmModal').classList.remove('active');
});

async function submitExam(isTimeout = false) {
  if (isSubmitting) return;
  isSubmitting = true;
  clearInterval(timerInterval);

  // مسح localStorage
  localStorage.removeItem(LS_KEY());
  localStorage.removeItem(LS_TIME_KEY());

  try {
    const res  = await fetch('../api/submit_exam.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await res.json();

    if (data.success || isTimeout) {
      // صفحة النهاية
      const doneInfo = document.getElementById('doneInfo');
      if (doneInfo) {
        const answered = questions.filter(q => answers[q.id]).length;
        doneInfo.innerHTML = `
          الامتحان: <strong>${escH(examData?.title || '')}</strong><br>
          أجبت على <strong>${answered}</strong> من <strong>${questions.length}</strong> سؤال<br>
          ${isTimeout ? '⏰ انتهى وقت الامتحان' : '✅ تم التسليم بنجاح'}`;
      }
      showPage('pageDone');
    } else {
      alert(data.message || 'خطأ في التسليم');
      isSubmitting = false;
    }
  } catch (e) {
    showPage('pageDone');
  }
}

// ===== Anti-Cheat System =====
function activateAntiCheat() {

  // منع النسخ
  document.addEventListener('copy', handleCheat('copy_attempt'));
  document.addEventListener('cut',  handleCheat('copy_attempt'));

  // منع اللصق
  document.addEventListener('paste', handleCheat('paste_attempt'));

  // منع كليك يمين
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    triggerCheat('right_click');
  });

  // منع PrintScreen / Ctrl+S / Ctrl+P ...
  document.addEventListener('keydown', (e) => {
    if (e.key === 'PrintScreen') { e.preventDefault(); triggerCheat('screenshot'); }
    if ((e.ctrlKey || e.metaKey) && ['c','x','v','a','s','p','u'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      if (['c','x'].includes(e.key.toLowerCase())) triggerCheat('copy_attempt');
      if (e.key.toLowerCase() === 'v') triggerCheat('paste_attempt');
    }
  });

  // مغادرة النافذة (Tab Switch / تصغير)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && examStarted && !isSubmitting) {
      triggerCheat('tab_switch');
    }
  });

  // blur (Alt+Tab / تبديل النوافذ)
  window.addEventListener('blur', () => {
    if (examStarted && !isSubmitting) {
      triggerCheat('window_blur');
    }
  });
}

function handleCheat(type) {
  return (e) => {
    e.preventDefault();
    triggerCheat(type);
  };
}

async function triggerCheat(type) {
  if (!examStarted || isSubmitting || !sessionId) return;

  cheatCount++;

  // إرسال للـ Backend (أمان حقيقي)
  try {
    const res  = await fetch('../api/log_cheat.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, cheat_type: type })
    });
    const data = await res.json();

    if (data.is_banned) {
      // حظر فوري
      clearInterval(timerInterval);
      localStorage.removeItem(LS_KEY());
      localStorage.removeItem(LS_TIME_KEY());
      isSubmitting = true;
      showPage('pageBanned');
      return;
    }

    cheatCount = data.cheat_attempts;
  } catch (e) { /* silent */ }

  // تحذيرات للواجهة
  const warnings = {
    1: { title: '⚠️ إنذار أول!', msg: 'لقد خالفت قواعد الامتحان. تبقّى لك إنذاران قبل الحظر التلقائي.' },
    2: { title: '⚠️ إنذار ثانٍ!', msg: 'هذه هي مخالفتك الثانية. الإنذار التالي سيؤدي إلى حظرك وإلغاء الامتحان.' },
    3: { title: '🚫 تم الحظر!', msg: 'لقد تجاوزت عدد محاولات الغش المسموح بها. تم إلغاء امتحانك وإبلاغ المشرفين.' }
  };

  const w = warnings[Math.min(cheatCount, 3)];
  showCheatWarning(w.msg, true, w.title);

  if (cheatCount >= 3) {
    setTimeout(() => showPage('pageBanned'), 2000);
  }
}

function showCheatWarning(msg, isCheat = false, title = 'تنبيه!') {
  const modal = document.getElementById('cheatModal');
  document.getElementById('cheatModalTitle').textContent = title;
  document.getElementById('cheatModalMsg').textContent   = msg;
  if (isCheat) {
    modal.querySelector('.cheat-box').style.borderColor = 'rgba(239,68,68,0.5)';
  }
  modal.classList.add('active');
}

document.getElementById('cheatModalClose')?.addEventListener('click', () => {
  document.getElementById('cheatModal').classList.remove('active');
});

// ===== Helpers =====
function escH(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  showPage('pageInstructions');
  loadExamInstructions();
});
