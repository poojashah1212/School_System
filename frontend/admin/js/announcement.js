// Announcement Management for Admin Dashboard

const ANNOUNCEMENT_API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api/admin/announcements'
    : 'https://smartschool-je18.onrender.com/api/admin/announcements';

document.addEventListener('DOMContentLoaded', () => {
    const noticeForm = document.getElementById('post-notice-form');
    if (noticeForm) {
        noticeForm.addEventListener('submit', handlePostNotice);
        
        // Character count logic
        const contentArea = document.getElementById('notice-content');
        const charCount = document.getElementById('char-count');
        if (contentArea && charCount) {
            contentArea.addEventListener('input', () => {
                const length = contentArea.value.length;
                charCount.textContent = `${length} / 500`;
                if (length >= 450) charCount.style.color = 'var(--danger)';
                else charCount.style.color = 'var(--text-muted)';
            });
        }
    }

    // Load announcements when the notice page is visited
    const noticeNavItem = document.querySelector('[data-page="post-notice"]');
    if (noticeNavItem) {
        noticeNavItem.addEventListener('click', () => {
            loadAnnouncements();
        });
    }
    
    // Check if we are already on the notice page (e.g. on refresh)
    if (document.getElementById('page-post-notice').classList.contains('active')) {
        loadAnnouncements();
    }
});

async function loadAnnouncements() {
    const noticesList = document.getElementById('notices-list');
    const totalCountEl = document.getElementById('total-notices-count');
    const token = localStorage.getItem('adminToken');

    if (!noticesList) return;

    try {
        const response = await fetch(ANNOUNCEMENT_API, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (result.success) {
            const announcements = result.data;
            totalCountEl.textContent = announcements.length;
            renderAnnouncements(announcements);
        } else {
            noticesList.innerHTML = '<div class="error-cell">Failed to load notices</div>';
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        noticesList.innerHTML = '<div class="error-cell">Error connecting to server</div>';
    }
}

function renderAnnouncements(announcements) {
    const noticesList = document.getElementById('notices-list');
    if (!announcements || announcements.length === 0) {
        noticesList.innerHTML = `
            <div class="empty-notices">
                <i class="fas fa-bullhorn"></i>
                <p>No notices posted yet.</p>
            </div>
        `;
        return;
    }

    noticesList.innerHTML = announcements.map(notice => `
        <div class="notice-card priority-${notice.priority || 'medium'}">
            <div class="notice-header">
                <h4 class="notice-title">${notice.title}</h4>
                <div class="notice-actions">
                    <button onclick="deleteAnnouncement('${notice._id}')" class="btn-delete-notice" title="Delete Notice">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="notice-meta">
                <span><i class="fas fa-users"></i> To: ${(notice.targetAudience || 'all').charAt(0).toUpperCase() + (notice.targetAudience || 'all').slice(1)}</span>
                <span><i class="fas fa-calendar-alt"></i> ${new Date(notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span class="priority-badge ${notice.priority || 'medium'}">${(notice.priority || 'medium').toUpperCase()}</span>
            </div>
            <div class="notice-body">${notice.content}</div>
        </div>
    `).join('');
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return '#ef4444'; // danger
        case 'medium': return '#f59e0b'; // warning
        case 'low': return '#10b981'; // success
        default: return '#3b82f6'; // primary
    }
}

async function handlePostNotice(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const title = document.getElementById('notice-title').value;
    const content = document.getElementById('notice-content').value;
    const targetAudience = document.getElementById('notice-audience').value;
    const priority = document.querySelector('input[name="notice-priority"]:checked').value;

    const postBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnContent = postBtn.innerHTML;
    postBtn.disabled = true;
    postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

    try {
        const response = await fetch(ANNOUNCEMENT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content, targetAudience, priority })
        });
        const result = await response.json();

        if (result.success) {
            notifyToast('Notice posted successfully!', 'success');
            clearNoticeForm();
            loadAnnouncements();
        } else {
            notifyToast(result.message || 'Failed to post notice', 'error');
        }
    } catch (error) {
        console.error('Error posting notice:', error);
        notifyToast('Error connecting to server', 'error');
    } finally {
        postBtn.disabled = false;
        postBtn.innerHTML = originalBtnContent;
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${ANNOUNCEMENT_API}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (result.success) {
            notifyToast('Notice deleted', 'success');
            loadAnnouncements();
        } else {
            notifyToast(result.message || 'Deletion failed', 'error');
        }
    } catch (error) {
        console.error('Error deleting notice:', error);
        notifyToast('Error connecting to server', 'error');
    }
}

function clearNoticeForm() {
    const form = document.getElementById('post-notice-form');
    if (form) {
        form.reset();
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.textContent = '0 / 500';
    }
}

// Use toast from dashboard if available
function notifyToast(message, type = 'success') {
    // Look for showToast in the global scope (from admin-dashboard.js)
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}
