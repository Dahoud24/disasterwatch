const ON_DASHBOARD_PAGE =
  window.location.pathname.includes('dashboard.html') ||
  window.location.pathname.endsWith('/dashboard') ||
  window.location.pathname.endsWith('/dashboard.html');

if (ON_DASHBOARD_PAGE) {
  requireLogin();
}

function getBookmarkStorageKey() {
  const user = getLoggedInUser();
  if (!user) return 'dw_bookmarks_guest';

  const identifier = user.username || user.email;
  return 'dw_bookmarks_' + identifier;
}

function getBookmarks() {
  try {
    const raw = localStorage.getItem(getBookmarkStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading bookmarks from localStorage:', error);
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(getBookmarkStorageKey(), JSON.stringify(bookmarks));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function bookmarkEvent(eventData) {
  const user = getLoggedInUser();

  if (!user) {
    alert('Please log in first to bookmark events.');
    window.location.href = 'login.html';
    return;
  }

  const bookmarks = getBookmarks();

  const alreadySaved = bookmarks.find(function (bookmark) {
    return bookmark.id === eventData.id;
  });

  if (alreadySaved) {
    alert('You have already bookmarked this event!');
    return;
  }

  bookmarks.push({
    id: eventData.id,
    title: eventData.title || 'Untitled Event',
    category: eventData.category || 'Unknown',
    date: eventData.date || 'Unknown date',
    lat: eventData.lat ?? null,
    lng: eventData.lng ?? null,
    source: eventData.source || '',
    note: '',
    savedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  });

  saveBookmarks(bookmarks);
  alert('Bookmarked: ' + (eventData.title || 'Event'));
}

function deleteBookmark(eventId) {
  if (!confirm('Remove this bookmark?')) return;

  const updated = getBookmarks().filter(function (bookmark) {
    return bookmark.id !== eventId;
  });

  saveBookmarks(updated);
  renderDashboard();
}

function saveNote(eventId) {
  const textarea = document.getElementById('note-' + eventId);
  if (!textarea) return;

  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find(function (item) {
    return item.id === eventId;
  });

  if (bookmark) {
    bookmark.note = textarea.value;
    saveBookmarks(bookmarks);

    const btn = document.getElementById('saveBtn-' + eventId);
    if (btn) {
      btn.textContent = '✓ Saved!';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-outline-success');

      setTimeout(function () {
        btn.textContent = 'Save Note';
        btn.classList.remove('btn-outline-success');
        btn.classList.add('btn-success');
      }, 2000);
    }
  }
}

function renderDashboard() {
  const container = document.getElementById('bookmarkList');
  if (!container) return;

  try {
    const bookmarks = getBookmarks();
    const user = getLoggedInUser();

    console.log('Rendering bookmarks for:', user);
    console.log('Using storage key:', getBookmarkStorageKey());
    console.log('Bookmarks found:', bookmarks);

    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <div style="font-size: 4rem;">📍</div>
          <h4 class="mt-3">No bookmarks yet</h4>
          <p class="text-muted">
            Go to the <a href="index.html">Live Map</a> and click on a disaster marker to bookmark it.
          </p>
        </div>
      `;
      return;
    }

    const html = bookmarks.map(function (bookmark) {
      const safeId = String(bookmark.id || '');
      const safeTitle = escapeHtml(bookmark.title || 'Untitled Event');
      const safeCategory = escapeHtml(bookmark.category || 'Unknown');
      const safeDate = escapeHtml(bookmark.date || 'Unknown date');
      const safeSavedAt = escapeHtml(bookmark.savedAt || '');
      const safeNote = escapeHtml(bookmark.note || '');

      return `
        <div class="bookmark-card" id="card-${safeId}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="mb-1">${safeTitle}</h5>
              <span class="badge bg-primary me-1">${safeCategory}</span>
              <span class="text-muted small">Event date: ${safeDate}</span>
            </div>
            <span class="text-muted small">Saved: ${safeSavedAt}</span>
          </div>

          ${
            bookmark.lat !== null && bookmark.lng !== null
              ? `<p class="small text-muted mb-2">
                  Coordinates: ${Number(bookmark.lat).toFixed(4)}, ${Number(bookmark.lng).toFixed(4)}
                </p>`
              : ''
          }

          ${
            bookmark.source
              ? `<p class="small mb-2">
                  <a href="${bookmark.source}" target="_blank" rel="noopener noreferrer">View source</a>
                </p>`
              : ''
          }

          <div class="mb-2">
            <label class="form-label fw-bold small">My Note:</label>
            <textarea
              id="note-${safeId}"
              class="form-control form-control-sm"
              rows="3"
              placeholder="Add your personal notes about this event...">${safeNote}</textarea>
          </div>

          <div class="d-flex gap-2">
            <button
              id="saveBtn-${safeId}"
              onclick="saveNote('${safeId}')"
              class="btn btn-success btn-sm">Save Note</button>
            <button
              onclick="deleteBookmark('${safeId}')"
              class="btn btn-outline-danger btn-sm">🗑 Remove</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="mb-3">
        <p class="text-muted">
          Logged in as <strong>${escapeHtml(user ? (user.username || user.email) : 'Guest')}</strong>.
          You have <strong>${bookmarks.length}</strong> bookmark(s).
        </p>
      </div>
      ${html}
    `;
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        Could not load bookmarks. Please refresh the page.
      </div>
    `;
  }
}


window.bookmarkEvent = bookmarkEvent;
window.deleteBookmark = deleteBookmark;
window.saveNote = saveNote;

document.addEventListener('DOMContentLoaded', function () {
  if (ON_DASHBOARD_PAGE) {
    renderDashboard();
  }
});