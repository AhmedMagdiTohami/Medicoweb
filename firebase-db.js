/**
 * MEDICO - Firebase Database & Cloud Firestore Integration Layer
 * Provides helper functions for automatic user profile synchronization,
 * activity logging, course bookings, order updates, and storage uploads.
 */

const firebaseConfig = {
    apiKey: "AIzaSyA49NmcBO1HmTR1_j01_EzmGUJAFl6SIS0",
    authDomain: "meproject-e1927.firebaseapp.com",
    projectId: "meproject-e1927",
    storageBucket: "meproject-e1927.firebasestorage.app",
    messagingSenderId: "666133437955",
    appId: "1:666133437955:web:6f9f05a96bd3a31ec2f836",
    measurementId: "G-4R6BE0X1G8"
};

// Initialize Firebase safely if not already initialized
if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.warn('Firebase init error:', e);
    }
}

const db = (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') ? firebase.firestore() : null;
const storage = (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') ? firebase.storage() : null;
const OWNER_EMAIL = 'drahmedmagdieltohami@gmail.com';

/**
 * Fetch client IP address using a public lookup service.
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            return data.ip;
        }
    } catch (err) {
        console.warn('[MedicoDB] IP address lookup failed (offline or blocked):', err.message);
    }
    return 'Client-side';
}

/**
 * Write a record to the activity_logs collection.
 * Handles failures gracefully.
 */
async function dbLogActivity(action, details = {}) {
    try {
        const user = firebase.auth().currentUser;
        const userId = user ? user.uid : 'anonymous';
        const email = user ? user.email : 'anonymous';
        const ip = await getClientIP();
        const userAgent = navigator.userAgent;

        await db.collection('activity_logs').add({
            userId: userId,
            email: email,
            action: action,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ip: ip,
            userAgent: userAgent
        });
        console.log(`[MedicoDB] Logged activity: "${action}"`);
    } catch (err) {
        console.error(`[MedicoDB] Error logging activity "${action}":`, err.message);
    }
}

/**
 * Automatically create or update a user document in the "users" collection.
 * Sets the role to admin if user email matches Dr. Ahmed's owner email.
 */
async function dbSyncUserLogin(user, displayName = '') {
    if (!user) return;
    try {
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        const now = firebase.firestore.FieldValue.serverTimestamp();
        
        if (!doc.exists) {
            // First time registration
            const role = (user.email === OWNER_EMAIL) ? 'admin' : 'student';
            const fullName = displayName || user.displayName || user.email.split('@')[0];
            
            await userRef.set({
                uid: user.uid,
                fullName: fullName,
                email: user.email,
                role: role,
                createdAt: now,
                lastLoginAt: now,
                lastSeenAt: now
            });
            console.log(`[MedicoDB] Registered new user: ${user.email} as ${role}`);
            await dbLogActivity('signup', { email: user.email, role: role });
        } else {
            // Existing user login
            const currentData = doc.data();
            const role = (user.email === OWNER_EMAIL) ? 'admin' : (currentData.role || 'student');
            
            await userRef.update({
                lastLoginAt: now,
                lastSeenAt: now,
                role: role
            });
            console.log(`[MedicoDB] Synced login for user: ${user.email}`);
            await dbLogActivity('login', { email: user.email, role: role });
        }
    } catch (err) {
        console.error('[MedicoDB] Error syncing user document:', err.message);
    }
}

/**
 * Log logout action and sign out user.
 */
async function dbLogout() {
    try {
        const user = firebase.auth().currentUser;
        if (user) {
            await dbLogActivity('logout', { email: user.email });
            await db.collection('users').doc(user.uid).update({
                lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (err) {
        console.warn('[MedicoDB] Error during pre-logout operations:', err.message);
    }
    return firebase.auth().signOut();
}

/**
 * Create a new pending order in the "course_orders" collection.
 */
async function dbCreateOrder(courseId, courseTitle, price, fullName, email) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User must be logged in to book a course');
    
    try {
        const orderRef = db.collection('course_orders').doc();
        const orderId = orderRef.id;
        const now = firebase.firestore.FieldValue.serverTimestamp();
        
        const orderData = {
            orderId: orderId,
            userId: user.uid,
            fullName: fullName || user.displayName || '',
            email: email || user.email,
            courseId: courseId,
            courseTitle: courseTitle,
            price: Number(price),
            paymentStatus: 'pending',
            paymentProofUrl: '',
            courseActivated: false,
            createdAt: now,
            updatedAt: now
        };
        
        await orderRef.set(orderData);
        await dbLogActivity('course booked', { courseId, courseTitle, orderId, price });
        await dbLogActivity('payment initiated', { courseId, courseTitle, orderId, price });
        return orderId;
    } catch (err) {
        console.error('[MedicoDB] Error creating course order:', err.message);
        throw err;
    }
}

/**
 * Upload a payment receipt screenshot to Firebase Storage and update the order record.
 */
async function dbUploadPaymentProof(orderId, file) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User must be logged in to upload payment proof');
    
    try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${orderId}_${Date.now()}.${fileExtension}`;
        const storageRef = storage.ref().child(`payment_proofs/${fileName}`);
        
        // Upload to Storage
        const snapshot = await storageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        
        // Update document
        await db.collection('course_orders').doc(orderId).update({
            paymentProofUrl: downloadUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await dbLogActivity('payment proof uploaded', { orderId: orderId, proofUrl: downloadUrl });
        return downloadUrl;
    } catch (err) {
        console.error('[MedicoDB] Error uploading payment proof:', err.message);
        throw err;
    }
}

/**
 * Check if a user has access to watch paid lessons for a course.
 * Returns true if the user is an admin or has an active paid order.
 */
async function dbCheckCourseAccess(courseId) {
    const user = firebase.auth().currentUser;
    if (!user) return false;
    
    try {
        // Admins automatically get access
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            return true;
        }
        
        // Check for active paid order
        const snapshot = await db.collection('course_orders')
            .where('userId', '==', user.uid)
            .where('courseId', '==', courseId)
            .where('paymentStatus', '==', 'paid')
            .where('courseActivated', '==', true)
            .limit(1)
            .get();
            
        return !snapshot.empty;
    } catch (err) {
        console.error(`[MedicoDB] Error checking course access for ${courseId}:`, err.message);
        return false;
    }
}

/**
 * Simple background worker to update lastSeenAt.
 */
async function dbUpdateLastSeen() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
        await db.collection('users').doc(user.uid).update({
            lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        // Fail silently
    }
}
