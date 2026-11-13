/**
 * MEDICO - Medical Educational Platform
 * JavaScript Logic
 * Author: Ahmed Magdy
 *
 * EMAIL INTEGRATION: EmailJS (https://www.emailjs.com)
 * ─────────────────────────────────────────────────────
 * SETUP STEPS (مطلوب مرة واحدة فقط):
 *  1. روح على https://www.emailjs.com واعمل حساب مجاني
 *  2. من Account → API Keys: انسخ الـ Public Key وحطه في EMAILJS_PUBLIC_KEY
 *  3. اضف Email Service (Gmail) واحفظ الـ Service ID في EMAILJS_SERVICE_ID
 *  4. اعمل 3 Templates زي ما هو موضح في التعليقات وحط الـ Template IDs
 */

// ==========================================
// EmailJS Configuration — عدّل القيم دي
// ==========================================
const EMAILJS_PUBLIC_KEY   = 'YOUR_PUBLIC_KEY';       // ← من Account → API Keys
const EMAILJS_SERVICE_ID   = 'YOUR_SERVICE_ID';       // ← اسم الـ Gmail service اللي ربطته
const TEMPLATE_BOOKING     = 'template_booking';      // ← Template ID للحجز
const TEMPLATE_COMMENT     = 'template_comment';      // ← Template ID للتعليقات
const TEMPLATE_CONTACT     = 'template_contact';      // ← Template ID للاتصال

const OWNER_EMAIL = 'drahmedmagdieltohami@gmail.com';

// ─── Helper: إرسال إيميل عبر EmailJS ───────────────────────────────────────
function sendEmail(templateId, params) {
    // params دي الـ variables اللي بتتبعت في الـ template
    return emailjs.send(EMAILJS_SERVICE_ID, templateId, params);
}

// ─── Helper: Loading state على الزرار أثناء الإرسال ───────────────────────
function setButtonLoading(btn, isLoading, originalText) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'جاري الإرسال...';
    } else {
        btn.disabled = false;
        btn.textContent = originalText || btn.dataset.originalText;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // ── Initialize EmailJS ──────────────────────────────────────────────────
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // ==========================================
    // 1. Mobile Navigation Toggle
    // ==========================================
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu      = document.getElementById('navMenu');
    const navLinks     = document.querySelectorAll('.nav-link');
    const header       = document.getElementById('header');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. Header Scroll & Scrollspy
    // ==========================================
    const sections = document.querySelectorAll('section[id]');

    function handleScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionId  = section.getAttribute('id');
            const link       = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (link) {
                if (scrollY > sectionTop && scrollY <= sectionTop + section.offsetHeight) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // ==========================================
    // 3. Scroll Reveal Animations
    // ==========================================
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ==========================================
    // 4. Input Validation Helpers
    // ==========================================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[0125]\d{8}$/;

    function validateField(input, fn, msg) {
        const group   = input.closest('.form-group');
        const errorEl = group.querySelector('.form-error');
        const val     = input.value.trim();
        if (!val) {
            group.classList.add('invalid');
            errorEl.textContent = 'هذا الحقل مطلوب.';
            return false;
        } else if (fn && !fn(val)) {
            group.classList.add('invalid');
            errorEl.textContent = msg;
            return false;
        } else {
            group.classList.remove('invalid');
            return true;
        }
    }

    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            input.closest('.form-group').classList.remove('invalid');
        });
    });

    // ==========================================
    // 5. Booking & Payment Modals Integration
    // ==========================================
    const bookingModal     = document.getElementById('bookingModal');
    const closeBookingBtn  = document.getElementById('closeBookingModal');
    const bookForm         = document.getElementById('bookingForm');
    const bookSuccessView  = document.getElementById('bookingSuccessView');
    const bookedCourseInput = document.getElementById('bookedCourseInput');
    const courseBadgeName  = document.getElementById('courseBadgeName');
    const bookSubmitBtn    = document.getElementById('bookSubmitBtn');

    // Payment Modal Elements
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModal');
    const paymentForm = document.getElementById('paymentStudentForm');
    const paymentFormView = document.getElementById('paymentFormView');
    const paymentSuccessView = document.getElementById('paymentSuccessView');

    const courseNameToId = {
        'علم التشريح ووظائف الأعضاء': 'anatomy',
        'علم الأدوية والعلاجات (Pharmacology)': 'pharmacology',
        'أساسيات الطب الباطني': 'internal-medicine',
        'طب الطوارئ والإسعافات الأولية': 'emergency',
        'الكيمياء الحيوية الطبية': 'biochemistry',
        'علم الأمراض العام (Pathology)': 'pathology',
        'مبادئ طب الأطفال الرعاية المتكاملة': 'pediatrics',
        'الجراحة والمهارات الكلينيكية': 'surgery-skills',
        'مادة الجراحة العامة': 'general-surgery'
    };

    document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', e => {
            const href = btn.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                // Allow direct navigation to course subpage
                return;
            }
            e.preventDefault();
            const courseName = btn.getAttribute('data-course-name');
            const courseId = btn.getAttribute('data-course-id') || courseNameToId[courseName] || 'anatomy';
            window.location.href = `course.html?id=${encodeURIComponent(courseId)}`;
        });
    });

    // Make entire course cards clickable to navigate to their sub-page
    document.querySelectorAll('.course-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', e => {
            if (e.target.closest('a') || e.target.closest('button')) {
                return; // Let the link handle itself
            }
            const courseId = card.getAttribute('data-course-id');
            if (courseId) {
                window.location.href = `course.html?id=${encodeURIComponent(courseId)}`;
            }
        });
    });

    function closeModal() {
        if (bookingModal) {
            bookingModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (closeBookingBtn) closeBookingBtn.addEventListener('click', closeModal);
    if (bookingModal) {
        bookingModal.addEventListener('click', e => { if (e.target === bookingModal) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && bookingModal.classList.contains('active')) closeModal(); });
    }

    // ── Submit Booking → Create Order and Launch Payment Modal ───────────────────
    if (bookForm) {
        bookForm.addEventListener('submit', async e => {
            e.preventDefault();

            if (!firebase.auth().currentUser) {
                alert('الرجاء تسجيل الدخول أولاً لكي تتمكن من حجز الكورسات.');
                window.location.href = 'login.html';
                return;
            }

            const nameInput  = document.getElementById('bookName');
            const emailInput = document.getElementById('bookEmail');
            const phoneInput = document.getElementById('bookPhone');

            const ok = [
                validateField(nameInput,  v => v.length >= 3,         'يجب أن يكون الاسم 3 أحرف على الأقل.'),
                validateField(emailInput, v => emailRegex.test(v),    'الرجاء إدخال بريد إلكتروني صحيح.'),
                validateField(phoneInput, v => phoneRegex.test(v),    'الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678).')
            ].every(Boolean);

            if (!ok) return;

            setButtonLoading(bookSubmitBtn, true);

            try {
                const courseName = bookedCourseInput.value;
                const courseId = courseNameToId[courseName] || 'anatomy';
                
                // Create Order in Firestore and Log Activities
                const orderId = await dbCreateOrder(courseId, courseName, 150, nameInput.value.trim(), emailInput.value.trim());
                
                // Store order ID on the payment form
                if (paymentForm) paymentForm.dataset.orderId = orderId;
                
                // Close Booking Modal
                closeModal();
                
                // Populate and Open Payment Modal
                if (paymentModal) {
                    document.getElementById('paymentCourseName').textContent = courseName;
                    document.getElementById('paymentCoursePrice').textContent = '150';
                    document.getElementById('paymentCourseHidden').value = courseId;
                    document.getElementById('paymentPriceHidden').value = '150';
                    document.getElementById('payStudentName').value = nameInput.value.trim();
                    document.getElementById('payStudentPhone').value = phoneInput.value.trim();
                    
                    paymentModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
                
                bookForm.reset();
            } catch (err) {
                console.error('[Booking Error]', err);
                alert('حدث خطأ أثناء حجز الكورس: ' + err.message);
            } finally {
                setButtonLoading(bookSubmitBtn, false, 'تأكيد الحجز والدفع (150 EGP)');
            }
        });
    }

    // ── Payment Modal Tabs Interactivity ──────────────────────────────────────────
    const payRadios = document.querySelectorAll('input[name="payment_method"]');
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
                setButtonLoading(confirmBtn, false, 'تأكيد الدفع والحجز');
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
            const courseId = document.getElementById('paymentCourseHidden').value;
            window.location.href = `course.html?id=${courseId}`;
        });
    }

    // ==========================================
    // 6. Pricing Package Form → Create Bundle Order & Launch Payment Modal
    // ==========================================
    const pricingForm         = document.getElementById('pricingForm');
    const pricingSuccessAlert = document.getElementById('pricingSuccessAlert');
    const pricingSubmitBtn    = document.getElementById('pricingSubmitBtn');

    if (pricingForm) {
        pricingForm.addEventListener('submit', async e => {
            e.preventDefault();

            if (!firebase.auth().currentUser) {
                alert('الرجاء تسجيل الدخول أولاً لكي تتمكن من طلب العضوية الشاملة.');
                window.location.href = 'login.html';
                return;
            }

            const nameInput  = document.getElementById('pricingName');
            const emailInput = document.getElementById('pricingEmail');
            const phoneInput = document.getElementById('pricingPhone');

            const ok = [
                validateField(nameInput,  v => v.length >= 3,      'يجب أن يكون الاسم 3 أحرف على الأقل.'),
                validateField(emailInput, v => emailRegex.test(v), 'الرجاء إدخال بريد إلكتروني صحيح.'),
                validateField(phoneInput, v => phoneRegex.test(v), 'الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678).')
            ].every(Boolean);

            if (!ok) return;

            setButtonLoading(pricingSubmitBtn, true);

            try {
                // Create pending order for bundle package in Firestore
                const orderId = await dbCreateOrder('package', 'باقة الكورسات الشاملة', 800, nameInput.value.trim(), emailInput.value.trim());
                
                if (paymentForm) paymentForm.dataset.orderId = orderId;
                
                // Open payment modal
                if (paymentModal) {
                    document.getElementById('paymentCourseName').textContent = 'باقة الكورسات الشاملة';
                    document.getElementById('paymentCoursePrice').textContent = '800';
                    document.getElementById('paymentCourseHidden').value = 'package';
                    document.getElementById('paymentPriceHidden').value = '800';
                    document.getElementById('payStudentName').value = nameInput.value.trim();
                    document.getElementById('payStudentPhone').value = phoneInput.value.trim();
                    
                    paymentModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
                
                pricingForm.reset();
                
                // Send email notification (non-blocking)
                sendEmail(TEMPLATE_BOOKING, {
                    to_email:      OWNER_EMAIL,
                    student_name:  nameInput.value.trim(),
                    student_email: emailInput.value.trim(),
                    student_phone: phoneInput.value.trim(),
                    course_name:   'باقة الكورسات الشاملة',
                    subject:       '💼 طلب باقة شاملة - MEDICO'
                }).catch(err => console.warn('EmailJS pricing error:', err));

            } catch (err) {
                console.error('[Pricing Booking Error]', err);
                alert('حدث خطأ أثناء طلب الباقة: ' + err.message);
            } finally {
                setButtonLoading(pricingSubmitBtn, false, 'اطلب العرض');
            }
        });
    }

    // ==========================================
    // 7. Contact Form → إرسال إيميل
    // ==========================================
    const contactForm         = document.getElementById('contactForm');
    const contactSuccessAlert = document.getElementById('contactSuccessAlert');
    const contactSubmitBtn    = document.getElementById('contactSubmitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();

            const nameInput    = document.getElementById('contactName');
            const emailInput   = document.getElementById('contactEmail');
            const messageInput = document.getElementById('contactMessage');

            const ok = [
                validateField(nameInput,    v => v.length >= 3,      'يجب أن يكون الاسم 3 أحرف على الأقل.'),
                validateField(emailInput,   v => emailRegex.test(v), 'الرجاء إدخال بريد إلكتروني صحيح.'),
                validateField(messageInput, v => v.length >= 10,     'يجب أن تحتوي الرسالة على 10 أحرف على الأقل.')
            ].every(Boolean);

            if (!ok) return;

            setButtonLoading(contactSubmitBtn, true);

            try {
                await sendEmail(TEMPLATE_CONTACT, {
                    to_email:     OWNER_EMAIL,
                    from_name:    nameInput.value.trim(),
                    from_email:   emailInput.value.trim(),
                    message:      messageInput.value.trim(),
                    subject:      `✉️ استفسار جديد من ${nameInput.value.trim()} - MEDICO`
                });
            } catch (err) {
                console.error('EmailJS error:', err);
            } finally {
                setButtonLoading(contactSubmitBtn, false, 'إرسال الاستفسار');
            }

            contactForm.reset();
            contactSuccessAlert.style.display = 'block';
            setTimeout(() => { contactSuccessAlert.style.display = 'none'; }, 7000);
        });
    }

    // ==========================================
    // 8. Comments System → إرسال إيميل + عرض فوري
    // ==========================================
    const commentForm       = document.getElementById('commentForm');
    const commentNameInput  = document.getElementById('commentName');
    const commentTextInput  = document.getElementById('commentText');
    const commentsListWrapper = document.getElementById('commentsListWrapper');
    const commentSubmitBtn  = document.getElementById('commentSubmitBtn');

    const defaultComments = [
        { name: 'سارة الأحمد',  text: 'منصة رائعة جداً! شرح الدكتور أحمد مجدي مبسط للغاية ويسهل فهم الكيمياء الحيوية التي كانت تمثل لي عقبة كبيرة. شكراً جزيلاً!', date: 'منذ يومين',  initial: 'س' },
        { name: 'د. محمد نجيب', text: 'الشرح العملي والتطبيقات الإكلينيكية في كورس الطوارئ ممتازة وتساعد في الحياة اليومية في المستشفى. أنصح كل طالب طب بالتسجيل.',    date: 'منذ 4 أيام', initial: 'م' },
        { name: 'أحمد عادل',    text: 'محتوى علمي متميز وأسلوب سلس جداً. السعر مناسب جداً مقارنة بالفائدة الكبيرة المكتسبة من الكورسات.',                               date: 'منذ أسبوع', initial: 'أ' }
    ];

    let medicoComments = JSON.parse(localStorage.getItem('medico_comments'));
    if (!medicoComments) {
        medicoComments = defaultComments;
        localStorage.setItem('medico_comments', JSON.stringify(medicoComments));
    }

    function escapeHTML(str) {
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }

    function renderComments() {
        if (!commentsListWrapper) return;
        commentsListWrapper.innerHTML = '';
        if (medicoComments.length === 0) {
            commentsListWrapper.innerHTML = '<div class="no-comments-msg">لا توجد تعليقات بعد. كن أول من يعلق!</div>';
            return;
        }
        medicoComments.slice().reverse().forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="comment-avatar">${escapeHTML(c.initial)}</div>
                <div class="comment-details">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHTML(c.name)}</span>
                        <span class="comment-date">${escapeHTML(c.date)}</span>
                    </div>
                    <p class="comment-text">${escapeHTML(c.text)}</p>
                </div>`;
            commentsListWrapper.appendChild(div);
        });
    }

    if (commentForm) {
        commentForm.addEventListener('submit', async e => {
            e.preventDefault();

            const isNameValid = validateField(commentNameInput, v => v.length >= 2, 'الرجاء إدخال الاسم.');
            const isTextValid = validateField(commentTextInput, v => v.length >= 3, 'الرجاء كتابة التعليق.');
            if (!isNameValid || !isTextValid) return;

            const nameVal    = commentNameInput.value.trim();
            const textVal    = commentTextInput.value.trim();
            const initialVal = nameVal.charAt(0);

            // ── أضف التعليق فوراً في الصفحة ────────────────────────────────
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
            const newComment = { name: nameVal, text: textVal, date: dateStr, initial: initialVal };
            medicoComments.push(newComment);
            localStorage.setItem('medico_comments', JSON.stringify(medicoComments));
            renderComments();
            commentForm.reset();

            // ── أرسل الإيميل في الخلفية ─────────────────────────────────────
            if (commentSubmitBtn) setButtonLoading(commentSubmitBtn, true);
            try {
                await sendEmail(TEMPLATE_COMMENT, {
                    to_email:      OWNER_EMAIL,
                    comment_name:  nameVal,
                    comment_text:  textVal,
                    comment_date:  dateStr,
                    subject:       `💬 تعليق جديد من ${nameVal} - MEDICO`
                });
            } catch (err) {
                console.error('EmailJS comment error:', err);
            } finally {
                if (commentSubmitBtn) setButtonLoading(commentSubmitBtn, false, 'إضافة تعليق');
            }
        });
    }

    renderComments();
});
