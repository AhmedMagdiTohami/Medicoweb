/**
 * MEDICO - Admin Dashboard JavaScript Controller
 * Handles auth state check, real-time Firestore synchronization,
 * statistics updates, and CRUD operations on users, orders, and logs.
 */

const auth = firebase.auth();
let usersList = [];
let ordersList = [];
let logsList = [];
let selectedOrderIdForReceipt = null;

// ==========================================
// 1. AUTHENTICATION & ACCESS CONTROL BLOCK
// ==========================================
auth.onAuthStateChanged(async (user) => {
    const authBlocker = document.getElementById('adminAuthBlocker');
    const accessDenied = document.getElementById('adminAccessDenied');
    const dashboardLayout = document.getElementById('adminDashboardLayout');

    if (!user) {
        // User not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    try {
        // Retrieve user document to check permissions
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            // Authorized admin user
            if (authBlocker) authBlocker.style.display = 'none';
            if (accessDenied) accessDenied.style.display = 'none';
            if (dashboardLayout) dashboardLayout.style.display = 'flex';
            
            document.getElementById('adminProfileName').textContent = `أهلاً، د. ${userDoc.data().fullName || user.email.split('@')[0]}`;
            
            // Sync background status and initialize data listeners
            dbUpdateLastSeen();
            initDashboardData();
        } else {
            // Non-admin user, deny access
            if (authBlocker) authBlocker.style.display = 'none';
            if (accessDenied) accessDenied.style.display = 'flex';
            if (dashboardLayout) dashboardLayout.style.display = 'none';
        }
    } catch (err) {
        console.error('[Admin Auth Error]', err);
        alert('حدث خطأ أثناء التحقق من الصلاحيات: ' + err.message);
    }
});

// Logout Buttons handlers
document.getElementById('adminLogoutBtn').addEventListener('click', handleAdminLogout);
document.getElementById('deniedLogoutBtn').addEventListener('click', handleAdminLogout);

function handleAdminLogout() {
    dbLogout().then(() => {
        window.location.href = 'login.html';
    });
}

// ==========================================
// 2. DATA SYNCHRONIZATION (FIRESTORE STREAM)
// ==========================================
function initDashboardData() {
    // A. Users Realtime Listener
    db.collection('users').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            usersList = [];
            snapshot.forEach(doc => {
                usersList.push(doc.data());
            });
            updateStats();
            renderUsersTable();
        }, err => console.error('Users listener error:', err));

    // B. Orders Realtime Listener
    db.collection('course_orders').orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            ordersList = [];
            snapshot.forEach(doc => {
                ordersList.push(doc.data());
            });
            updateStats();
            renderOrdersTable();
            renderRecentOrdersOverview();
        }, err => console.error('Orders listener error:', err));

    // C. Activity Logs Realtime Listener
    db.collection('activity_logs').orderBy('timestamp', 'desc').limit(200)
        .onSnapshot(snapshot => {
            logsList = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Format timestamp locally
                data.formattedTime = formatTimestamp(data.timestamp);
                logsList.push(data);
            });
            renderLogsTable();
            renderRecentLogsOverview();
        }, err => console.error('Logs listener error:', err));
}

// ==========================================
// 3. STATS UPDATER & RENDER HELPERS
// ==========================================
function updateStats() {
    // Total Users
    document.getElementById('statTotalUsers').textContent = usersList.length;
    
    // Total Orders
    document.getElementById('statTotalOrders').textContent = ordersList.length;
    
    // Pending Orders
    const pendingCount = ordersList.filter(o => o.paymentStatus === 'pending').length;
    document.getElementById('statPendingPayments').textContent = pendingCount;
    
    // Paid Revenue
    const totalRevenue = ordersList
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    document.getElementById('statPaidRevenue').textContent = totalRevenue.toLocaleString('ar-EG');
}

// Date formatter
function formatTimestamp(timestamp) {
    if (!timestamp) return 'قيد الانتظار...';
    // Handle ServerTimestamp delay
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-EG', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

// ==========================================
// 4. USERS MANAGEMENT
// ==========================================
const userSearchInput = document.getElementById('userSearchInput');
userSearchInput.addEventListener('input', renderUsersTable);

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const searchVal = userSearchInput.value.trim().toLowerCase();
    
    tbody.innerHTML = '';
    
    const filteredUsers = usersList.filter(u => {
        return !searchVal || (u.email && u.email.toLowerCase().includes(searchVal));
    });
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">لا يوجد نتائج تطابق البحث.</td></tr>';
        return;
    }
    
    filteredUsers.forEach(u => {
        const tr = document.createElement('tr');
        const regDate = formatTimestamp(u.createdAt);
        const loginDate = formatTimestamp(u.lastLoginAt);
        const seenDate = formatTimestamp(u.lastSeenAt);
        
        tr.innerHTML = `
            <td><strong>${escapeHtml(u.fullName || 'بدون اسم')}</strong></td>
            <td><code>${escapeHtml(u.email)}</code></td>
            <td>${regDate}</td>
            <td>${loginDate}</td>
            <td>${seenDate}</td>
            <td><span class="badge ${u.role === 'admin' ? 'admin' : 'student'}">${u.role === 'admin' ? 'مشرف' : 'طالب'}</span></td>
            <td>
                <button class="btn-table toggle-role" onclick="toggleUserRole('${u.uid}', '${u.role}')">
                    تغيير إلى ${u.role === 'admin' ? 'طالب' : 'مشرف'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function toggleUserRole(uid, currentRole) {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    const confirmMsg = `هل أنت متأكد من تغيير صلاحية المستخدم إلى [${newRole === 'admin' ? 'مشرف' : 'طالب'}]؟`;
    if (!confirm(confirmMsg)) return;
    
    try {
        await db.collection('users').doc(uid).update({ role: newRole });
        await dbLogActivity('profile update', { targetUid: uid, roleChangedTo: newRole });
        alert('تم تحديث الصلاحية بنجاح.');
    } catch (err) {
        alert('فشل تعديل الصلاحيات: ' + err.message);
    }
}

// ==========================================
// 5. COURSE ORDERS MANAGEMENT
// ==========================================
const orderSearchInput = document.getElementById('orderSearchInput');
const orderStatusFilter = document.getElementById('orderStatusFilter');
orderSearchInput.addEventListener('input', renderOrdersTable);
orderStatusFilter.addEventListener('change', renderOrdersTable);

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    const searchVal = orderSearchInput.value.trim().toLowerCase();
    const statusVal = orderStatusFilter.value;
    
    tbody.innerHTML = '';
    
    const filteredOrders = ordersList.filter(o => {
        const matchesSearch = !searchVal || (o.email && o.email.toLowerCase().includes(searchVal));
        const matchesStatus = statusVal === 'all' || o.paymentStatus === statusVal;
        return matchesSearch && matchesStatus;
    });
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">لا توجد طلبات اشتراك تطابق الفلاتر.</td></tr>';
        return;
    }
    
    filteredOrders.forEach(o => {
        const tr = document.createElement('tr');
        const orderDate = formatTimestamp(o.createdAt);
        
        let proofButton = '<span style="color:var(--text-muted);">لا يوجد إثبات</span>';
        if (o.paymentProofUrl) {
            proofButton = `
                <button class="btn-table view" onclick="openReceiptPreview('${o.orderId}', '${o.paymentProofUrl}')">
                    عرض الإيصال
                </button>
            `;
        }
        
        const isActivated = o.courseActivated;
        
        tr.innerHTML = `
            <td><small><code>${o.orderId.substring(0, 8)}...</code></small></td>
            <td><strong>${escapeHtml(o.fullName || 'بدون اسم')}</strong></td>
            <td><code>${escapeHtml(o.email)}</code></td>
            <td>${escapeHtml(o.courseTitle)}</td>
            <td>${o.price} EGP</td>
            <td>${proofButton}</td>
            <td>${orderDate}</td>
            <td><span class="badge ${o.paymentStatus}">${o.paymentStatus === 'paid' ? 'مدفوع' : o.paymentStatus === 'rejected' ? 'مرفوض' : 'معلق'}</span></td>
            <td>
                <span class="badge ${isActivated ? 'active-access' : 'inactive-access'}">${isActivated ? 'مفعّل ✓' : 'مغلق ✗'}</span>
            </td>
            <td>
                <div class="btn-action-group">
                    ${o.paymentStatus !== 'paid' ? `<button class="btn-table approve" onclick="approveOrder('${o.orderId}')">تأكيد</button>` : ''}
                    ${o.paymentStatus !== 'rejected' ? `<button class="btn-table reject" onclick="rejectOrder('${o.orderId}')">رفض</button>` : ''}
                    <button class="btn-table view" onclick="toggleCourseAccess('${o.orderId}', ${isActivated})">
                        ${isActivated ? 'تعطيل' : 'تفعيل'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Approve Payment Order
async function approveOrder(orderId) {
    if (!confirm('تأكيد استلام المبلغ وتفعيل الكورس للطالب؟')) return;
    try {
        await db.collection('course_orders').doc(orderId).update({
            paymentStatus: 'paid',
            courseActivated: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const order = ordersList.find(o => o.orderId === orderId);
        if (order) {
            await dbLogActivity('payment successful', { orderId: orderId, courseId: order.courseId, email: order.email });
            await dbLogActivity('course activated', { orderId: orderId, courseId: order.courseId, email: order.email });
        }
        alert('تم تأكيد الدفع وتفعيل الكورس بنجاح.');
        closeReceiptPreview();
    } catch (err) {
        alert('فشل تأكيد الدفع: ' + err.message);
    }
}

// Reject Payment Order
async function rejectOrder(orderId) {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    try {
        await db.collection('course_orders').doc(orderId).update({
            paymentStatus: 'rejected',
            courseActivated: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const order = ordersList.find(o => o.orderId === orderId);
        if (order) {
            await dbLogActivity('payment rejected', { orderId: orderId, courseId: order.courseId, email: order.email });
            await dbLogActivity('course deactivated', { orderId: orderId, courseId: order.courseId, email: order.email });
        }
        alert('تم رفض الطلب بنجاح.');
        closeReceiptPreview();
    } catch (err) {
        alert('فشل الرفض: ' + err.message);
    }
}

// Manually Toggle Course Access
async function toggleCourseAccess(orderId, currentStatus) {
    const newStatus = !currentStatus;
    const actionName = newStatus ? 'تفعيل' : 'تعطيل';
    if (!confirm(`هل تريد ${actionName} وصول الطالب للكورس يدوياً؟`)) return;
    
    try {
        await db.collection('course_orders').doc(orderId).update({
            courseActivated: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const order = ordersList.find(o => o.orderId === orderId);
        if (order) {
            const act = newStatus ? 'course activated' : 'course deactivated';
            await dbLogActivity(act, { orderId: orderId, courseId: order.courseId, email: order.email });
        }
        alert(`تم ${actionName} الوصول بنجاح.`);
    } catch (err) {
        alert('فشل التعديل: ' + err.message);
    }
}

// ==========================================
// 6. ACTIVITY LOGS TIMELINE & SEARCH
// ==========================================
const logSearchInput = document.getElementById('logSearchInput');
const logActionFilter = document.getElementById('logActionFilter');
const logStartDateFilter = document.getElementById('logStartDateFilter');
const logEndDateFilter = document.getElementById('logEndDateFilter');

logSearchInput.addEventListener('input', renderLogsTable);
logActionFilter.addEventListener('change', renderLogsTable);
logStartDateFilter.addEventListener('change', renderLogsTable);
logEndDateFilter.addEventListener('change', renderLogsTable);

function renderLogsTable() {
    const tbody = document.getElementById('logsTableBody');
    const searchVal = logSearchInput.value.trim().toLowerCase();
    const actionVal = logActionFilter.value;
    const startVal = logStartDateFilter.value;
    const endVal = logEndDateFilter.value;
    
    tbody.innerHTML = '';
    
    const filteredLogs = logsList.filter(l => {
        const matchesSearch = !searchVal || (l.email && l.email.toLowerCase().includes(searchVal));
        const matchesAction = actionVal === 'all' || l.action === actionVal;
        
        // Date parse
        let matchesDates = true;
        if (l.timestamp) {
            const logDate = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
            if (startVal) {
                const startDate = new Date(startVal);
                startDate.setHours(0,0,0,0);
                if (logDate < startDate) matchesDates = false;
            }
            if (endVal) {
                const endDate = new Date(endVal);
                endDate.setHours(23,59,59,999);
                if (logDate > endDate) matchesDates = false;
            }
        }
        
        return matchesSearch && matchesAction && matchesDates;
    });
    
    if (filteredLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">لا توجد سجلات تطابق الفلاتر.</td></tr>';
        return;
    }
    
    filteredLogs.forEach(l => {
        const tr = document.createElement('tr');
        const detailsStr = l.details ? JSON.stringify(l.details) : 'لا يوجد تفاصيل';
        
        tr.innerHTML = `
            <td><code>${escapeHtml(l.email)}</code></td>
            <td><span class="timeline-action">${escapeHtml(l.action)}</span></td>
            <td><small style="color:rgba(255,255,255,0.7);">${escapeHtml(detailsStr)}</small></td>
            <td>${l.formattedTime}</td>
            <td><small><code>${escapeHtml(l.ip || 'Client-side')}</code></small></td>
            <td><small class="text-muted" style="display:inline-block; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(l.userAgent || '')}">${escapeHtml(l.userAgent || 'N/A')}</small></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// 7. OVERVIEW SUB-TABLES (RECENT DATA)
// ==========================================
function renderRecentOrdersOverview() {
    const tbody = document.getElementById('recentOrdersTableBody');
    tbody.innerHTML = '';
    
    const recents = ordersList.slice(0, 5);
    
    if (recents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">لا يوجد طلبات اشتراك بعد.</td></tr>';
        return;
    }
    
    recents.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(o.fullName)}</strong><br><small class="text-muted"><code>${escapeHtml(o.email)}</code></small></td>
            <td>${escapeHtml(o.courseTitle)}</td>
            <td>${o.price} EGP</td>
            <td><span class="badge ${o.paymentStatus}">${o.paymentStatus === 'paid' ? 'مدفوع' : o.paymentStatus === 'rejected' ? 'مرفوض' : 'معلق'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderRecentLogsOverview() {
    const container = document.getElementById('recentLogsTimeline');
    container.innerHTML = '';
    
    const recents = logsList.slice(0, 7);
    
    if (recents.length === 0) {
        container.innerHTML = '<div class="empty-state">لا توجد عمليات مسجلة بعد.</div>';
        return;
    }
    
    recents.forEach(l => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        let detailsText = '';
        if (l.details) {
            if (l.details.courseTitle) detailsText = `كورس: ${l.details.courseTitle}`;
            else if (l.details.roleChangedTo) detailsText = `تعديل صلاحية إلى: ${l.details.roleChangedTo}`;
            else if (l.details.method) detailsText = `بواسطة: ${l.details.method}`;
        }
        
        item.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-email"><code>${escapeHtml(l.email)}</code></span>
                    <span class="timeline-time">${l.formattedTime}</span>
                </div>
                <div>العملية: <span class="timeline-action">${escapeHtml(l.action)}</span></div>
                ${detailsText ? `<div class="timeline-desc">${escapeHtml(detailsText)}</div>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

// ==========================================
// 8. TABS INTERACTIVITY
// ==========================================
const tabs = document.querySelectorAll('.nav-item');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Toggle Nav item active
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Toggle panel display
        const targetTab = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${targetTab}`).classList.add('active');
    });
});

// ==========================================
// 9. RECEIPT PREVIEW MODAL LOGIC
// ==========================================
const receiptModal = document.getElementById('receiptPreviewModal');
const receiptCloseBtn = document.getElementById('closeReceiptModal');
const receiptImage = document.getElementById('receiptPreviewImage');
const receiptEmpty = document.getElementById('receiptEmptyState');
const receiptDownload = document.getElementById('downloadReceiptBtn');
const modalApproveBtn = document.getElementById('modalApproveBtn');

function openReceiptPreview(orderId, url) {
    selectedOrderIdForReceipt = orderId;
    
    if (url) {
        receiptImage.src = url;
        receiptImage.style.display = 'block';
        receiptEmpty.style.display = 'none';
        receiptDownload.href = url;
        receiptDownload.style.display = 'inline-block';
    } else {
        receiptImage.src = '';
        receiptImage.style.display = 'none';
        receiptEmpty.style.display = 'block';
        receiptDownload.style.display = 'none';
    }
    
    // Hide approve button inside modal if order is already paid
    const order = ordersList.find(o => o.orderId === orderId);
    if (order && order.paymentStatus === 'paid') {
        modalApproveBtn.style.display = 'none';
    } else {
        modalApproveBtn.style.display = 'inline-block';
    }
    
    if (receiptModal) {
        receiptModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeReceiptPreview() {
    if (receiptModal) {
        receiptModal.classList.remove('active');
        document.body.style.overflow = '';
        selectedOrderIdForReceipt = null;
    }
}

if (receiptCloseBtn) receiptCloseBtn.addEventListener('click', closeReceiptPreview);
if (receiptModal) {
    receiptModal.addEventListener('click', e => { if (e.target === receiptModal) closeReceiptPreview(); });
}

modalApproveBtn.addEventListener('click', () => {
    if (selectedOrderIdForReceipt) {
        approveOrder(selectedOrderIdForReceipt);
    }
});

// ==========================================
// Helper Utility Functions
// ==========================================
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
