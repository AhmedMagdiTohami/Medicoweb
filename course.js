/**
 * MEDICO - Course Page JavaScript
 * course.js
 *
 * Handles:
 *  1. Reading course ID from URL params and loading course data
 *  2. Rendering curriculum (lessons list) from localStorage
 *  3. Google Drive video embed (converts sharing link → embed URL)
 *  4. Booking/enrollment form submission via EmailJS
 *  5. Admin panel: add lectures from Google Drive
 *  6. Related courses sidebar
 */

// ==========================================
// EmailJS Configuration
// ==========================================
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const TEMPLATE_BOOKING   = 'template_booking';
const OWNER_EMAIL        = 'drahmedmagdieltohami@gmail.com';

// ==========================================
// COURSES DATABASE (matching index.html courses)
// ==========================================
const COURSES_DB = [
    {
        id: 'anatomy',
        name: 'علم التشريح ووظائف الأعضاء',
        badge: 'أساسي',
        price: 150,
        duration: '6 أسابيع',
        image: 'assets/images/course_anatomy.png',
        desc: 'شرح تفصيلي لتراكيب أعضاء جسم الإنسان ووظائف الأجهزة الحيوية المختلفة بأحدث الصور والوسائل البصرية المساعدة.',
        fullDesc: `
            <p>كورس علم التشريح ووظائف الأعضاء هو المدخل الأساسي لكل طالب طب يسعى لبناء أساس علمي متين. في هذا الكورس ستتعرف على:</p>
            <p>• تراكيب جسم الإنسان من الخلية حتى الأعضاء الكاملة بطريقة مبسطة ومصورة</p>
            <p>• وظائف كل جهاز من أجهزة الجسم (الدوري، التنفسي، الهضمي، العصبي، وغيرها)</p>
            <p>• الربط بين التشريح والتطبيقات الكلينيكية اليومية</p>
            <p>• مراجعات دورية وأسئلة تفاعلية لتثبيت المعلومات</p>
        `
    },
    {
        id: 'pharmacology',
        name: 'علم الأدوية والعلاجات (Pharmacology)',
        badge: 'كلينيكال',
        price: 150,
        duration: '8 أسابيع',
        image: 'assets/images/course_pharmacology.png',
        desc: 'دراسة آليات عمل المجموعات الدوائية والتأثيرات العلاجية والجانبية مع التركيز على الاستخدام الإكلينيكي.',
        fullDesc: `
            <p>كورس الفارماكولوجي يغطي كل ما تحتاجه لفهم علم الأدوية وطريقة عملها في الجسم:</p>
            <p>• آليات عمل أهم المجموعات الدوائية وتصنيفاتها</p>
            <p>• التأثيرات العلاجية والآثار الجانبية وكيفية تجنبها</p>
            <p>• الجرعات المعتمدة والتفاعلات الدوائية الشائعة</p>
            <p>• الوصفات الطبية الكلينيكية وطريقة كتابتها بشكل صحيح</p>
        `
    },
    {
        id: 'internal-medicine',
        name: 'أساسيات الطب الباطني',
        badge: 'متقدم',
        price: 150,
        duration: '10 أسابيع',
        image: 'assets/images/course_internal_medicine.png',
        desc: 'مدخل شامل لتشخيص وفحص الأمراض الباطنية الشائعة مثل السكري وارتفاع الضغط واختلال الغدد الصماء.',
        fullDesc: `
            <p>كورس الطب الباطني يُعدّك للتعامل مع أكثر الأمراض شيوعاً في الممارسة اليومية:</p>
            <p>• تشخيص وعلاج مرض السكري وأنواعه وتعقيداته</p>
            <p>• ارتفاع ضغط الدم والبروتوكولات العلاجية الحديثة</p>
            <p>• أمراض الغدة الدرقية والغدد الصماء</p>
            <p>• الفحص الكلينيكي الصحيح وكيفية كتابة التقرير الطبي</p>
        `
    },
    {
        id: 'emergency',
        name: 'طب الطوارئ والإسعافات الأولية',
        badge: 'عملي',
        price: 150,
        duration: '5 أسابيع',
        image: 'assets/images/course_emergency.png',
        desc: 'دليل تدريبي تطبيقي للتعامل مع الحالات الحرجة والحوادث، الإنعاش القلبي الرئوي، ووقف النزيف.',
        fullDesc: `
            <p>كورس الطوارئ يُعلمك المهارات الحيوية التي قد تُنقذ حياة:</p>
            <p>• الإنعاش القلبي الرئوي CPR بالمعايير الدولية</p>
            <p>• التعامل مع النزيف والكسور والحروق بشكل صحيح</p>
            <p>• الحالات الحرجة: الصدمة، الاختناق، السكتة الدماغية</p>
            <p>• تريّاج المرضى وترتيب أولويات الإسعاف</p>
        `
    },
    {
        id: 'biochemistry',
        name: 'الكيمياء الحيوية الطبية',
        badge: 'أكاديمي',
        price: 150,
        duration: '7 أسابيع',
        image: 'assets/images/course_biochemistry.png',
        desc: 'شرح تفاعلي للأيض ومسارات السكريات والبروتينات والدهون في الجسم مع ربطها بالأمراض الوراثية.',
        fullDesc: `
            <p>كورس الكيمياء الحيوية يكشف لك ما يحدث داخل خلايا الجسم على المستوى الجزيئي:</p>
            <p>• أيض الكربوهيدرات: الجلايكوليسيس، دورة كريبس، الفسفرة التأكسدية</p>
            <p>• أيض البروتينات والأحماض الأمينية وعلاقتها بالأمراض</p>
            <p>• الدهون والكوليسترول وأثرها على الصحة</p>
            <p>• الأنزيمات وكيفية تفسير نتائج التحاليل المعملية</p>
        `
    },
    {
        id: 'pathology',
        name: 'علم الأمراض العام (Pathology)',
        badge: 'أساسي',
        price: 150,
        duration: '8 أسابيع',
        image: 'assets/images/course_pathology.png',
        desc: 'فهم الأسباب والآليات المرضية وراء التغيرات النسيجية والخلوية والالتهابات والأورام الخبيثة.',
        fullDesc: `
            <p>كورس علم الأمراض يُفسّر لك لماذا تحدث الأمراض على المستوى الخلوي والنسيجي:</p>
            <p>• آليات إصابة الخلية والموت الخلوي (Necrosis, Apoptosis)</p>
            <p>• الالتهاب الحاد والمزمن وآليات الشفاء</p>
            <p>• الأورام: الحميدة والخبيثة، أسباب السرطان وانتشاره</p>
            <p>• كيفية قراءة تقرير الباثولوجي وربطه بالتشخيص الكلينيكي</p>
        `
    },
    {
        id: 'pediatrics',
        name: 'مبادئ طب الأطفال الرعاية المتكاملة',
        badge: 'كلينيكال',
        price: 150,
        duration: '6 أسابيع',
        image: 'assets/images/course_pediatrics.svg',
        desc: 'النمو والتطور لدى الرضع والأطفال، التطعيمات الأساسية، علاج النزلات المعوية والأمراض التنفسية الشائعة.',
        fullDesc: `
            <p>كورس طب الأطفال يُعلمك أساسيات رعاية الأطفال من الولادة حتى المراهقة:</p>
            <p>• مراحل النمو والتطور الطبيعية ومؤشرات القلق</p>
            <p>• جدول التطعيمات الوطني والدولي وأهميته</p>
            <p>• الأمراض الشائعة عند الأطفال وطرق علاجها</p>
            <p>• الإسهال والتجفيف عند الرضع والتدخل الصحيح</p>
        `
    },
    {
        id: 'surgery-skills',
        name: 'الجراحة والمهارات الكلينيكية',
        badge: 'متقدم',
        price: 150,
        duration: '9 أسابيع',
        image: 'assets/images/course_surgery_skills.svg',
        desc: 'شرح المهارات الجراحية الأساسية، خياطة الجروح، معايير التعقيم بغرف العمليات.',
        fullDesc: `
            <p>كورس المهارات الجراحية يُعدّك للعمل في بيئة جراحية احترافية:</p>
            <p>• معايير التعقيم وإجراءات السلامة في غرفة العمليات</p>
            <p>• تقنيات خياطة الجروح وأنواع الغرز المختلفة</p>
            <p>• قراءة الفحوصات والأشعة المستخدمة في الجراحة</p>
            <p>• الإجراءات الجراحية البسيطة وكيفية تنفيذها بأمان</p>
        `
    },
    {
        id: 'general-surgery',
        name: 'مادة الجراحة العامة',
        badge: 'متخصص',
        price: 150,
        duration: '10 أسابيع',
        image: 'assets/images/course_general_surgery.svg',
        desc: 'تغطية شاملة لمبادئ الجراحة العامة، المهارات الجراحية الأساسية، خياطة الجروح، ومعايير التعقيم.',
        fullDesc: `
            <p>كورس الجراحة العامة هو التغطية الأشمل لكل ما يخص الجراحة:</p>
            <p>• مبادئ الجراحة وأخلاقياتها والتوثيق الجراحي</p>
            <p>• جراحات البطن الشائعة (الزائدة، المرارة، الفتق)</p>
            <p>• التعامل مع الإصابات والصدمات الجراحية</p>
            <p>• ما بعد الجراحة: الرعاية ومتابعة المرضى</p>
        `
    }
];

// ==========================================
// Helper: Convert Google Drive share URL → embed URL
// ==========================================
function driveToEmbedUrl(url) {
    if (!url) return '';
    url = url.trim();

    // Already an embed URL
    if (url.includes('/preview')) return url;

    // Pattern: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }

    // Pattern: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
        return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
    }

    // YouTube URL fallback
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    }

    return url; // Return as-is if no pattern matched
}

// ==========================================
// Helper: EmailJS send
// ==========================================
function sendEmail(templateId, params) {
    return emailjs.send(EMAILJS_SERVICE_ID, templateId, params);
}

function setButtonLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.origText = btn.innerHTML;
        btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>جاري الإرسال...</span>';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.origText || btn.innerHTML;
    }
}

// ==========================================
// MAIN INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // ── Init EmailJS ───────────────────────────────
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // ── Get courseId from URL ──────────────────────
    const params   = new URLSearchParams(window.location.search);
    const courseId = params.get('id') || 'anatomy';
    const course   = COURSES_DB.find(c => c.id === courseId) || COURSES_DB[0];

    // ── Lessons storage key ────────────────────────
    const LESSONS_KEY = `medico_lessons_${courseId}`;

    // ==========================================
    // 1. Populate Course Meta in Hero Section
    // ==========================================
    document.title = `MEDICO - ${course.name}`;
    document.querySelector('meta[name="description"]').content = course.desc;

    setEl('breadcrumbCourse', course.name);
    setEl('courseTitle', course.name);
    setEl('courseDesc', course.desc);
    setEl('courseBadge', course.badge);
    setEl('metaLessons', getLessons().length + ' محاضرة');
    setEl('metaDuration', course.duration);
    setEl('metaPrice', course.price + ' EGP');

    // Enrollment sidebar
    setEl('enrollCourseName', course.name, 'value');
    setEl('enrollPrice', course.price);

    const thumbImg = document.getElementById('enrollThumbImg');
    if (thumbImg) {
        thumbImg.src = course.image;
        thumbImg.alt = course.name;
    }

    // Full Description
    const descEl = document.getElementById('courseFullDesc');
    if (descEl) descEl.innerHTML = course.fullDesc || `<p>${course.desc}</p>`;

    // ==========================================
    // 2. Render Curriculum
    // ==========================================
    let courseIsUnlocked = false;

    // Log course page view activity
    if (typeof dbLogActivity !== 'undefined') {
        dbLogActivity('course page viewed', { courseId: courseId, courseTitle: course.name });
    }

    // Watch auth state and check Firestore access dynamically
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                courseIsUnlocked = await dbCheckCourseAccess(courseId);
            } else {
                courseIsUnlocked = false;
            }
            renderCurriculum();
        });
    }

    // ==========================================
    // 3. Render Related Courses
    // ==========================================
    renderRelated();

    // ==========================================
    // 4. Video Player Logic
    // ==========================================
    let currentLesson = null;

    function playLesson(lesson) {
        if (lesson.access === 'paid' && !courseIsUnlocked) {
            // Show locked overlay
            showEl('videoLockedOverlay', true);
            hideEl('videoPlaceholder');
            hideEl('videoIframe');
            setEl('currentVideoTitle', lesson.title + ' 🔒');
            return;
        }

        const embedUrl = driveToEmbedUrl(lesson.driveUrl);
        if (!embedUrl) {
            alert('رابط الفيديو غير صحيح. يرجى التحقق من رابط Google Drive.');
            return;
        }

        // Hide placeholder & locked overlay
        hideEl('videoPlaceholder');
        showEl('videoLockedOverlay', false);

        // Load iframe
        const iframe = document.getElementById('videoIframe');
        iframe.src = embedUrl;
        iframe.style.display = 'block';

        // Update header title
        setEl('currentVideoTitle', lesson.title);

        // Update active state in list
        document.querySelectorAll('.lesson-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`.lesson-item[data-id="${lesson.id}"]`);
        if (activeItem) activeItem.classList.add('active');

        currentLesson = lesson;

        // Scroll to video on mobile
        if (window.innerWidth < 900) {
            document.getElementById('videoPlayerCard').scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Video Placeholder Click Handler
    const placeholderEl = document.getElementById('videoPlaceholder');
    if (placeholderEl) {
        placeholderEl.addEventListener('click', () => {
            const lessons = getLessons();
            if (lessons.length > 0) {
                // Play first free lesson or the very first lesson
                const firstFree = lessons.find(l => l.access === 'free') || lessons[0];
                playLesson(firstFree);
            } else {
                alert('لا توجد محاضرات مضافة حالياً لهذا الكورس. يمكنك إضافة محاضرات من لوحة التحكم.');
            }
        });
    }

    // ==========================================
    // 5. Render Curriculum Function
    // ==========================================
    function renderCurriculum() {
        const lessons     = getLessons();
        const listEl      = document.getElementById('lessonsList');
        const countEl     = document.getElementById('curriculumCount');
        const noLessonsEl = document.getElementById('noLessonsMsg');
        const metaEl      = document.getElementById('metaLessons');

        if (metaEl) metaEl.textContent = lessons.length + ' محاضرة';
        if (countEl) countEl.textContent = lessons.length + ' محاضرة';

        if (!listEl) return;

        // Clear existing except noLessonsMsg
        Array.from(listEl.children).forEach(child => {
            if (child.id !== 'noLessonsMsg') child.remove();
        });

        if (lessons.length === 0) {
            if (noLessonsEl) noLessonsEl.style.display = 'flex';
            return;
        }

        if (noLessonsEl) noLessonsEl.style.display = 'none';

        lessons.forEach((lesson, idx) => {
            const item = document.createElement('div');
            const isPaidLocked = lesson.access === 'paid' && !courseIsUnlocked;
            item.className = `lesson-item${isPaidLocked ? ' locked' : ''}`;
            item.dataset.id = lesson.id;

            const statusIcon = isPaidLocked
                ? `<svg class="lesson-status-icon lock-icon-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
                : `<svg class="lesson-status-icon play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

            const accessBadge = lesson.access === 'free'
                ? `<span style="font-size:0.72rem;background:#d1fae5;color:#059669;padding:2px 8px;border-radius:50px;font-weight:700;">مجاني</span>`
                : '';

            item.innerHTML = `
                <div class="lesson-num">${idx + 1}</div>
                <div class="lesson-info">
                    <div class="lesson-title">${escapeHtml(lesson.title)}</div>
                    <div class="lesson-duration">
                        ${lesson.duration ? escapeHtml(lesson.duration) : ''}
                        ${accessBadge}
                    </div>
                </div>
                ${statusIcon}
            `;

            item.addEventListener('click', () => {
                if (isPaidLocked) {
                    // Show locked overlay and scroll to enroll box
                    showEl('videoLockedOverlay', true);
                    hideEl('videoPlaceholder');
                    hideEl('videoIframe');
                    setEl('currentVideoTitle', lesson.title + ' 🔒');
                    setTimeout(() => {
                        document.getElementById('enrollSection').scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                } else {
                    playLesson(lesson);
                }
            });

            listEl.insertBefore(item, noLessonsEl);
        });
    }

    // ==========================================
    // 6. Render Related Courses
    // ==========================================
    function renderRelated() {
        const relatedEl = document.getElementById('relatedList');
        if (!relatedEl) return;

        const related = COURSES_DB.filter(c => c.id !== courseId).slice(0, 4);
        relatedEl.innerHTML = '';

        related.forEach(rc => {
            const a = document.createElement('a');
            a.href = `course.html?id=${rc.id}`;
            a.className = 'related-item';
            a.innerHTML = `
                <div class="related-item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                </div>
                <div class="related-item-info">
                    <div class="related-item-title">${escapeHtml(rc.name)}</div>
                    <div class="related-item-price">${rc.price} EGP</div>
                </div>
            `;
            relatedEl.appendChild(a);
        });
    }

    // ==========================================
    // 7. Enrollment Form
    // ==========================================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[0125]\d{8}$/;

    const enrollForm = document.getElementById('courseEnrollForm');
    const enrollSubmitBtn = document.getElementById('enrollSubmitBtn');

    // Input validation helpers
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            input.closest('.form-group').classList.remove('invalid');
        });
    });

    function validateField(input, fn, msg) {
        const group   = input.closest('.form-group');
        const errorEl = group.querySelector('.form-error');
        const val     = input.value.trim();
        if (!val) {
            group.classList.add('invalid');
            if (errorEl) errorEl.textContent = 'هذا الحقل مطلوب.';
            return false;
        } else if (fn && !fn(val)) {
            group.classList.add('invalid');
            if (errorEl) errorEl.textContent = msg;
            return false;
        } else {
            group.classList.remove('invalid');
            return true;
        }
    }

    // Payment Modal Elements in Course Page
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModal');
    const paymentForm = document.getElementById('paymentStudentForm');
    const paymentFormView = document.getElementById('paymentFormView');
    const paymentSuccessView = document.getElementById('paymentSuccessView');

    if (enrollForm) {
        enrollForm.addEventListener('submit', async e => {
            e.preventDefault();

            if (!firebase.auth().currentUser) {
                alert('الرجاء تسجيل الدخول أولاً لكي تتمكن من حجز الكورسات.');
                window.location.href = 'login.html';
                return;
            }

            const nameInput  = document.getElementById('enrollName');
            const emailInput = document.getElementById('enrollEmail');
            const phoneInput = document.getElementById('enrollPhone');

            const ok = [
                validateField(nameInput,  v => v.length >= 3,       'يجب أن يكون الاسم 3 أحرف على الأقل.'),
                validateField(emailInput, v => emailRegex.test(v),  'الرجاء إدخال بريد إلكتروني صحيح.'),
                validateField(phoneInput, v => phoneRegex.test(v),  'الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678).')
            ].every(Boolean);

            if (!ok) return;

            setButtonLoading(enrollSubmitBtn, true);

            try {
                // Create Pending Order in Firestore and Log Activities
                const orderId = await dbCreateOrder(courseId, course.name, course.price, nameInput.value.trim(), emailInput.value.trim());
                
                // Store order ID on the payment form
                if (paymentForm) paymentForm.dataset.orderId = orderId;
                
                // Populate and Open Payment Modal
                if (paymentModal) {
                    document.getElementById('paymentCourseName').textContent = course.name;
                    document.getElementById('paymentCoursePrice').textContent = course.price;
                    document.getElementById('paymentCourseHidden').value = courseId;
                    document.getElementById('paymentPriceHidden').value = course.price;
                    document.getElementById('payStudentName').value = nameInput.value.trim();
                    document.getElementById('payStudentPhone').value = phoneInput.value.trim();
                    
                    paymentModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
                
                enrollForm.reset();
            } catch (err) {
                console.error('[Enrollment Error]', err);
                alert('حدث خطأ أثناء حجز الكورس: ' + err.message);
            } finally {
                setButtonLoading(enrollSubmitBtn, false);
            }
        });
    }

    // ── Payment Modal Tabs Interactivity ──────────────────────────────────────────
    const payRadios = document.querySelectorAll('input[name="payment_method"]');
    if (payRadios.length > 0) {
        payRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
                radio.closest('.payment-method-card').classList.add('selected');
                
                const method = radio.value;
                document.querySelectorAll('.payment-detail-content').forEach(d => d.classList.remove('active'));
                if (method === 'vodafone') {
                    document.getElementById('vodafoneDetails').classList.add('active');
                } else if (method === 'instapay') {
                    document.getElementById('instapayDetails').classList.add('active');
                } else if (method === 'bank') {
                    document.getElementById('bankDetails').classList.add('active');
                }
            });
        });
    }

    // Close Payment Modal
    function closePaymentModal() {
        if (paymentModal) {
            paymentModal.classList.remove('active');
            document.body.style.overflow = '';
            if (paymentFormView) paymentFormView.style.display = 'block';
            if (paymentSuccessView) paymentSuccessView.style.display = 'none';
        }
    }
    if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
    if (paymentModal) {
        paymentModal.addEventListener('click', e => { if (e.target === paymentModal) closePaymentModal(); });
    }

    // ── Payment Form Submission with Proof Upload ─────────────────────────────────
    if (paymentForm) {
        paymentForm.addEventListener('submit', async e => {
            e.preventDefault();
            
            const nameInput = document.getElementById('payStudentName');
            const phoneInput = document.getElementById('payStudentPhone');
            const receiptInput = document.getElementById('payReceiptFile');
            const confirmBtn = document.getElementById('payConfirmBtn');
            
            const isNameOk = validateField(nameInput, v => v.length >= 3, 'الرجاء إدخال الاسم الكريم (3 أحرف على الأقل).');
            const isPhoneOk = validateField(phoneInput, v => phoneRegex.test(v), 'الرجاء إدخال رقم هاتف مصري صحيح.');
            
            if (!isNameOk || !isPhoneOk) return;
            
            const orderId = paymentForm.dataset.orderId;
            if (!orderId) {
                alert('فشل العثور على معرّف الحجز. الرجاء إغلاق النافذة والمحاولة مجدداً.');
                return;
            }
            
            setButtonLoading(confirmBtn, true);
            
            try {
                // Upload Receipt Screenshot if provided
                if (receiptInput && receiptInput.files.length > 0) {
                    confirmBtn.innerHTML = '<span>جاري رفع إثبات الدفع...</span>';
                    await dbUploadPaymentProof(orderId, receiptInput.files[0]);
                } else {
                    // Update metadata
                    await db.collection('course_orders').doc(orderId).update({
                        fullName: nameInput.value.trim(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                // Transition to success view
                if (paymentFormView) paymentFormView.style.display = 'none';
                if (paymentSuccessView) paymentSuccessView.style.display = 'block';
                
                // Send email notification (non-blocking)
                sendEmail(TEMPLATE_BOOKING, {
                    to_email:      OWNER_EMAIL,
                    student_name:  nameInput.value.trim(),
                    student_email: firebase.auth().currentUser?.email || 'N/A',
                    student_phone: phoneInput.value.trim(),
                    course_name:   document.getElementById('paymentCourseName').textContent,
                    subject:       `💰 تم استلام إثبات دفع جديد - MEDICO`
                }).catch(err => console.warn('Email notification failed:', err));
                
            } catch (err) {
                console.error('[Payment Confirmation Error]', err);
                alert('حدث خطأ أثناء تأكيد الدفع: ' + err.message);
            } finally {
                setButtonLoading(confirmBtn, false);
            }
        });
    }

    // ── Copy buttons clipboard interaction ────────────────────────────────────────
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-copy');
            navigator.clipboard.writeText(text).then(() => {
                const origHTML = btn.innerHTML;
                btn.innerHTML = '✓';
                setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
            });
        });
    });

    // ── Go to Videos redirect handler ─────────────────────────────────────────────
    const goToVideosBtn = document.getElementById('goToVideosBtn');
    if (goToVideosBtn) {
        goToVideosBtn.addEventListener('click', () => {
            closePaymentModal();
            // Trigger refresh so access status is re-read from Firestore
            window.location.reload();
        });
    }

    // ==========================================
    // 8. Admin Panel (add lectures)
    // ==========================================
    let adminClickCount = 0;
    let adminClickTimer = null;

    const adminToggle = document.getElementById('adminToggleBtn');
    const adminPanel  = document.getElementById('adminUploadPanel');

    if (adminToggle) {
        adminToggle.addEventListener('click', () => {
            adminClickCount++;
            clearTimeout(adminClickTimer);
            adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 2000);

            if (adminClickCount >= 5) {
                adminClickCount = 0;
                if (adminPanel) {
                    const isHidden = adminPanel.style.display === 'none' || adminPanel.style.display === '';
                    adminPanel.style.display = isHidden ? 'block' : 'none';
                    if (isHidden) {
                        adminPanel.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    }

    // Auto-detect admin access via URL param or logged in Firebase admin email
    function checkAdminAccess() {
        const isAdminParam = params.get('admin') === 'true';
        if (isAdminParam) {
            if (adminPanel) adminPanel.style.display = 'block';
            return;
        }

        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged(user => {
                if (user && user.email === OWNER_EMAIL) {
                    if (adminPanel) adminPanel.style.display = 'block';
                }
            });
        }
    }
    checkAdminAccess();

    const adminAddBtn = document.getElementById('adminAddLessonBtn');
    if (adminAddBtn) {
        adminAddBtn.addEventListener('click', () => {
            const titleEl    = document.getElementById('adminLessonTitle');
            const driveEl    = document.getElementById('adminDriveLink');
            const durationEl = document.getElementById('adminLessonDuration');
            const accessEl   = document.getElementById('adminLessonAccess');

            const title    = titleEl.value.trim();
            const driveUrl = driveEl.value.trim();
            const duration = durationEl.value.trim();
            const access   = accessEl.value;

            if (!title) {
                titleEl.style.borderColor = 'var(--danger)';
                setTimeout(() => { titleEl.style.borderColor = ''; }, 2000);
                return;
            }

            if (!driveUrl) {
                driveEl.style.borderColor = 'var(--danger)';
                setTimeout(() => { driveEl.style.borderColor = ''; }, 2000);
                return;
            }

            // Validate drive URL
            const embedUrl = driveToEmbedUrl(driveUrl);
            if (!embedUrl) {
                alert('رابط Google Drive غير صحيح. يرجى نسخ رابط المشاركة الصحيح.');
                return;
            }

            const lessons = getLessons();
            const newLesson = {
                id:       'lesson_' + Date.now(),
                title,
                driveUrl,
                duration,
                access
            };

            lessons.push(newLesson);
            saveLessons(lessons);
            renderCurriculum();

            // Clear inputs
            titleEl.value    = '';
            driveEl.value    = '';
            durationEl.value = '';
            accessEl.value   = 'free';

            // Show success feedback
            adminAddBtn.innerHTML = '✓ تمت الإضافة بنجاح!';
            adminAddBtn.style.background = 'var(--success)';
            setTimeout(() => {
                adminAddBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة المحاضرة
                `;
                adminAddBtn.style.background = '';
            }, 2500);
        });
    }

    // ==========================================
    // 9. Mobile Navigation Toggle
    // ==========================================
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu      = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Mobile hamburger animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        .mobile-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .mobile-toggle.active span:nth-child(2) { opacity: 0; }
        .mobile-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
    `;
    document.head.appendChild(style);

    // ==========================================
    // Helper Functions
    // ==========================================
    function isCourseUnlocked(cId) {
        try {
            const unlocked = JSON.parse(localStorage.getItem('medico_unlocked_courses')) || [];
            return unlocked.includes(cId);
        } catch { return false; }
    }

    function unlockCourse(cId) {
        try {
            const unlocked = JSON.parse(localStorage.getItem('medico_unlocked_courses')) || [];
            if (!unlocked.includes(cId)) {
                unlocked.push(cId);
                localStorage.setItem('medico_unlocked_courses', JSON.stringify(unlocked));
            }
        } catch {}
    }

    function getLessons() {
        try {
            const stored = localStorage.getItem(LESSONS_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch {}

        // Default lessons mapped by courseId
        const defaultDriveUrl = 'https://drive.google.com/file/d/1t3X8ZfI_G_J5f2U4G4A9P0y7F1Z3-Q4e/view';
        const defaults = {
            'anatomy': [
                { id: 'anatomy_1', title: 'المقدمة والتمهيد لعلم التشريح ووظائف الأعضاء', driveUrl: defaultDriveUrl, duration: '15 دقيقة', access: 'free' },
                { id: 'anatomy_2', title: 'المحاضرة الأولى - مصطلحات التشريح والمستويات التشريحية', driveUrl: defaultDriveUrl, duration: '45 دقيقة', access: 'paid' },
                { id: 'anatomy_3', title: 'المحاضرة الثانية - بنية الخلية والأنسجة الأساسية', driveUrl: defaultDriveUrl, duration: '60 دقيقة', access: 'paid' }
            ],
            'pharmacology': [
                { id: 'pharm_1', title: 'مقدمة في علم الأدوية والمصطلحات الدوائية', driveUrl: defaultDriveUrl, duration: '20 دقيقة', access: 'free' },
                { id: 'pharm_2', title: 'المحاضرة الأولى - امتصاص وتوزيع الدواء (Pharmacokinetics)', driveUrl: defaultDriveUrl, duration: '50 دقيقة', access: 'paid' },
                { id: 'pharm_3', title: 'المحاضرة الثانية - آليات عمل الأدوية والمستقبلات', driveUrl: defaultDriveUrl, duration: '55 دقيقة', access: 'paid' }
            ],
            'internal-medicine': [
                { id: 'med_1', title: 'مقدمة في الفحص الكلينيكي وأخذ التاريخ المرضي', driveUrl: defaultDriveUrl, duration: '25 دقيقة', access: 'free' },
                { id: 'med_2', title: 'المحاضرة الأولى - تشخيص وعلاج ارتفاع ضغط الدم الشرياني', driveUrl: defaultDriveUrl, duration: '55 دقيقة', access: 'paid' },
                { id: 'med_3', title: 'المحاضرة الثانية - اضطرابات الغدد الصماء والسكري', driveUrl: defaultDriveUrl, duration: '65 دقيقة', access: 'paid' }
            ],
            'emergency': [
                { id: 'em_1', title: 'المبادئ الأساسية للإسعافات الأولية وسلسلة البقاء', driveUrl: defaultDriveUrl, duration: '15 دقيقة', access: 'free' },
                { id: 'em_2', title: 'المحاضرة الأولى - الإنعاش القلبي الرئوي (CPR) للبالغين والأطفال', driveUrl: defaultDriveUrl, duration: '45 دقيقة', access: 'paid' },
                { id: 'em_3', title: 'المحاضرة الثانية - التعامل مع الكسور، الحروق والجروح النازفة', driveUrl: defaultDriveUrl, duration: '50 دقيقة', access: 'paid' }
            ],
            'biochemistry': [
                { id: 'biochem_1', title: 'مقدمة في بنية الكربوهيدرات ووظائفها الحيوية', driveUrl: defaultDriveUrl, duration: '18 دقيقة', access: 'free' },
                { id: 'biochem_2', title: 'المحاضرة الأولى - مسار تحلل السكر (Glycolysis) وإنتاج الطاقة', driveUrl: defaultDriveUrl, duration: '48 دقيقة', access: 'paid' },
                { id: 'biochem_3', title: 'المحاضرة الثانية - تمثيل الدهون والكوليسترول في الدم', driveUrl: defaultDriveUrl, duration: '55 دقيقة', access: 'paid' }
            ],
            'pathology': [
                { id: 'path_1', title: 'مقدمة في علم الأمراض والتغيرات الخلوية', driveUrl: defaultDriveUrl, duration: '20 دقيقة', access: 'free' },
                { id: 'path_2', title: 'المحاضرة الأولى - الالتهاب الحاد والالتهاب المزمن وآليات حدوثهما', driveUrl: defaultDriveUrl, duration: '50 دقيقة', access: 'paid' },
                { id: 'path_3', title: 'المحاضرة الثانية - الأورام الحميدة والخبيثة ومعايير التفريق بينها', driveUrl: defaultDriveUrl, duration: '60 دقيقة', access: 'paid' }
            ],
            'pediatrics': [
                { id: 'ped_1', title: 'مراحل التطور والنمو الطبيعي للطفل حديث الولادة', driveUrl: defaultDriveUrl, duration: '22 دقيقة', access: 'free' },
                { id: 'ped_2', title: 'المحاضرة الأولى - النزلات المعوية الحادة والتعامل مع الجفاف', driveUrl: defaultDriveUrl, duration: '50 دقيقة', access: 'paid' },
                { id: 'ped_3', title: 'المحاضرة الثانية - التطعيمات الأساسية وجداول اللقاحات', driveUrl: defaultDriveUrl, duration: '45 دقيقة', access: 'paid' }
            ],
            'surgery-skills': [
                { id: 'surg_skills_1', title: 'أدوات الجراحة الأساسية وطريقة استخدامها الصحيحة', driveUrl: defaultDriveUrl, duration: '20 دقيقة', access: 'free' },
                { id: 'surg_skills_2', title: 'المحاضرة الأولى - أنواع الغرز الجراحية وتقنيات خياطة الجروح', driveUrl: defaultDriveUrl, duration: '55 دقيقة', access: 'paid' },
                { id: 'surg_skills_3', title: 'المحاضرة الثانية - التعقيم الكامل داخل غرف العمليات وسلامة الجراح', driveUrl: defaultDriveUrl, duration: '45 دقيقة', access: 'paid' }
            ],
            'general-surgery': [
                { id: 'gen_surg_1', title: 'مقدمة في الجراحة العامة وعلم الجراحة الإكلينيكي', driveUrl: defaultDriveUrl, duration: '25 دقيقة', access: 'free' },
                { id: 'gen_surg_2', title: 'المحاضرة الأولى - الزائدة الدودية الحادة: التشخيص والتدخل الجراحي', driveUrl: defaultDriveUrl, duration: '60 دقيقة', access: 'paid' },
                { id: 'gen_surg_3', title: 'المحاضرة الثانية - جراحات الفتق بأنواعه وعلاجه بالشبكة الجراحية', driveUrl: defaultDriveUrl, duration: '55 دقيقة', access: 'paid' }
            ]
        };

        const courseDefaults = defaults[courseId] || [
            { id: courseId + '_1', title: 'مقدمة وتمهيد للكورس', driveUrl: defaultDriveUrl, duration: '15 دقيقة', access: 'free' },
            { id: courseId + '_2', title: 'المحاضرة الأولى - المفاهيم والأسس', driveUrl: defaultDriveUrl, duration: '40 دقيقة', access: 'paid' },
            { id: courseId + '_3', title: 'المحاضرة الثانية - دراسة تفصيلية', driveUrl: defaultDriveUrl, duration: '55 دقيقة', access: 'paid' }
        ];

        try {
            localStorage.setItem(LESSONS_KEY, JSON.stringify(courseDefaults));
        } catch {}
        return courseDefaults;
    }

    function saveLessons(lessons) {
        localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
    }

    function setEl(id, value, prop = 'textContent') {
        const el = document.getElementById(id);
        if (el) el[prop] = value;
    }

    function showEl(id, show) {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    function hideEl(id) {
        const el = document.getElementById(id);
        if (el && el.tagName === 'IFRAME') { el.style.display = 'none'; el.src = ''; }
        else if (el) el.style.display = 'none';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }

}); // end DOMContentLoaded
