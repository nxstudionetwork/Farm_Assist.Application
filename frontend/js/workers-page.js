/*
================================================================================
FARM ASSIST - WORKERS PAGE (Professional Workforce Hiring Platform)
Consumes WorkerService (backend-ready) for all data + booking persistence.
================================================================================
*/
(function () {
  'use strict';

  var CATEGORY_ICONS = {
    'Harvest Workers': 'fa-wheat-awn',
    'Tractor Drivers': 'fa-tractor',
    'Machine Operators': 'fa-gears',
    'Drone Operators': 'fa-helicopter',
    'Livestock Workers': 'fa-cow',
    'Irrigation Workers': 'fa-droplet',
    'Field Workers': 'fa-user-group',
    'Equipment Mechanics': 'fa-screwdriver-wrench'
  };

  var state = { category: 'all', query: '', sort: 'rating', availableOnly: false, verifiedOnly: false };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function rupee(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function stars(rating) {
    var r = Math.round(parseFloat(rating));
    var out = '';
    for (var i = 1; i <= 5; i++) out += '<i class="fa' + (i <= r ? 's' : 'r') + ' fa-star"></i>';
    return out;
  }

  /* ---------------- Category chips ---------------- */
  function renderCategories() {
    var el = document.getElementById('worker-categories');
    if (!el || !window.WorkerService) return;
    WorkerService.categories().then(function (cats) {
      var total = (window.FarmDB && FarmDB.workers ? FarmDB.workers.length : 0);
      var html = '<button class="wk-chip' + (state.category === 'all' ? ' active' : '') + '" data-cat="all"><i class="fas fa-users"></i> All <span>' + total + '</span></button>';
      cats.forEach(function (c) {
        var icon = CATEGORY_ICONS[c.name] || 'fa-user';
        html += '<button class="wk-chip' + (state.category === c.name ? ' active' : '') + '" data-cat="' + esc(c.name) + '"><i class="fas ' + icon + '"></i> ' + esc(c.name) + ' <span>' + c.count + '</span></button>';
      });
      el.innerHTML = html;
      el.querySelectorAll('.wk-chip').forEach(function (b) {
        b.addEventListener('click', function () {
          state.category = b.dataset.cat;
          el.querySelectorAll('.wk-chip').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          renderList();
        });
      });
    });
  }

  /* ---------------- Worker list ---------------- */
  function renderList() {
    var el = document.getElementById('workers-list');
    if (!el || !window.WorkerService) return;
    el.innerHTML = skeletonCards(6);
    WorkerService.list({
      category: state.category, query: state.query, sort: state.sort,
      availableOnly: state.availableOnly, verifiedOnly: state.verifiedOnly
    }).then(function (workers) {
      var countEl = document.getElementById('worker-result-count');
      if (countEl) countEl.textContent = workers.length + ' worker' + (workers.length === 1 ? '' : 's') + ' available';
      if (!workers.length) {
        el.innerHTML = '<div class="wk-empty"><i class="fas fa-user-slash"></i><h4>No workers found</h4><p>Try adjusting your filters or search terms.</p></div>';
        return;
      }
      el.innerHTML = workers.map(cardHTML).join('');
      requestAnimationFrame(function () {
        el.querySelectorAll('.wk-card').forEach(function (c, i) {
          setTimeout(function () { c.classList.add('in'); }, Math.min(i, 8) * 40);
        });
      });
      bindCardActions(el);
    });
  }

  function cardHTML(w) {
    var saved = WorkerService.isSaved(w.id);
    return '' +
      '<article class="wk-card" data-id="' + esc(w.id) + '">' +
        '<div class="wk-card-top">' +
          '<div class="wk-avatar"><img loading="lazy" src="' + esc(w.image) + '" alt="' + esc(w.name) + '" onerror="this.src=\'https://ui-avatars.com/api/?background=1B5E3F&color=fff&name=' + encodeURIComponent(w.name) + '\'">' +
            (w.available ? '<span class="wk-online" title="Available"></span>' : '') + '</div>' +
          '<div class="wk-id">' +
            '<h4>' + esc(w.name) + (w.verified ? ' <i class="fas fa-circle-check wk-verified" title="Verified"></i>' : '') + '</h4>' +
            '<span class="wk-code">' + esc(w.id) + ' • ' + esc(w.category) + '</span>' +
            '<div class="wk-rating">' + stars(w.rating) + ' <b>' + esc(w.rating) + '</b> <small>(' + w.reviewsCount + ' reviews)</small></div>' +
          '</div>' +
          '<button class="wk-bookmark' + (saved ? ' on' : '') + '" data-act="save" aria-label="Save worker"><i class="' + (saved ? 'fas' : 'far') + ' fa-bookmark"></i></button>' +
        '</div>' +
        '<div class="wk-skills">' + (w.skills || []).slice(0, 3).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>' +
        '<div class="wk-meta">' +
          '<div><i class="fas fa-briefcase"></i> ' + esc(w.experience) + '</div>' +
          '<div><i class="fas fa-location-dot"></i> ' + esc(w.distance) + '</div>' +
          '<div><i class="fas fa-language"></i> ' + esc((w.languages || []).join(', ')) + '</div>' +
          '<div><i class="fas fa-circle-check"></i> ' + w.completedProjects + ' jobs</div>' +
        '</div>' +
        '<div class="wk-card-foot">' +
          '<div class="wk-wage"><b>' + rupee(w.dailyWage) + '</b><small>/day</small><span class="wk-avail ' + (w.available ? 'ok' : 'busy') + '">' + esc(w.availabilityNote) + '</span></div>' +
          '<div class="wk-actions">' +
            '<button class="wk-icon-btn" data-act="call" title="Call"><i class="fas fa-phone"></i></button>' +
            '<button class="wk-icon-btn" data-act="chat" title="Chat"><i class="fas fa-comment-dots"></i></button>' +
            '<button class="wk-icon-btn" data-act="share" title="Share"><i class="fas fa-share-nodes"></i></button>' +
            '<button class="wk-icon-btn" data-act="view" title="View Profile"><i class="fas fa-eye"></i></button>' +
          '</div>' +
        '</div>' +
        '<button class="wk-book-btn" data-act="book"' + (w.available ? '' : ' disabled') + '><i class="fas fa-calendar-check"></i> ' + (w.available ? 'Book Worker' : 'Currently Busy') + '</button>' +
      '</article>';
  }

  function bindCardActions(root) {
    root.querySelectorAll('.wk-card').forEach(function (card) {
      var id = card.dataset.id;
      card.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          WorkerService.get(id).then(function (w) {
            if (!w) return;
            var act = btn.dataset.act;
            if (act === 'book') openBookingModal(w);
            else if (act === 'view') openProfileModal(w);
            else if (act === 'call') window.showToast && showToast('Calling ' + w.name + ' at ' + w.phone + '...', 'info');
            else if (act === 'chat') window.showToast && showToast('Opening chat with ' + w.name + '...', 'info');
            else if (act === 'share') shareWorker(w);
            else if (act === 'save') {
              var on = WorkerService.toggleSaved(id);
              btn.classList.toggle('on', on);
              btn.querySelector('i').className = (on ? 'fas' : 'far') + ' fa-bookmark';
              window.showToast && showToast(on ? w.name + ' saved to your workers' : 'Removed from saved', on ? 'success' : 'info');
            }
          });
        });
      });
    });
  }

  function shareWorker(w) {
    var text = w.name + ' (' + w.category + ') - ' + w.rating + '★ - ' + rupee(w.dailyWage) + '/day';
    if (navigator.share) { navigator.share({ title: 'Farm Assist Worker', text: text }).catch(function () {}); }
    else { window.showToast && showToast('Worker profile link copied!', 'success'); }
  }

  /* ---------------- Profile modal (experience timeline + reviews) ---------------- */
  function openProfileModal(w) {
    var timeline = (w.timeline || []).map(function (t) {
      return '<li><span class="wk-tl-dot"></span><div><b>' + esc(t.role) + '</b><small>' + esc(t.place) + ' • since ' + t.year + '</small></div></li>';
    }).join('');
    var reviews = (w.reviews || []).map(function (r) {
      return '<div class="wk-review"><div class="wk-review-head"><b>' + esc(r.author) + '</b><span>' + stars(r.rating) + '</span></div><p>' + esc(r.comment) + '</p><small>' + esc(r.date) + '</small></div>';
    }).join('') || '<p class="wk-muted">No written reviews yet.</p>';

    var body = '' +
      '<div class="wk-profile">' +
        '<div class="wk-profile-head">' +
          '<img src="' + esc(w.image) + '" alt="' + esc(w.name) + '" onerror="this.src=\'https://ui-avatars.com/api/?background=1B5E3F&color=fff&name=' + encodeURIComponent(w.name) + '\'">' +
          '<div><h3>' + esc(w.name) + (w.verified ? ' <i class="fas fa-circle-check wk-verified"></i>' : '') + '</h3>' +
            '<p>' + esc(w.category) + ' • ' + esc(w.id) + '</p>' +
            '<div class="wk-rating">' + stars(w.rating) + ' <b>' + esc(w.rating) + '</b> <small>(' + w.reviewsCount + ' reviews)</small></div></div>' +
        '</div>' +
        '<div class="wk-stat-row">' +
          '<div><b>' + esc(w.experience) + '</b><small>Experience</small></div>' +
          '<div><b>' + w.completedProjects + '</b><small>Jobs Done</small></div>' +
          '<div><b>' + esc(w.distance) + '</b><small>Distance</small></div>' +
          '<div><b>' + rupee(w.dailyWage) + '</b><small>Daily Wage</small></div>' +
        '</div>' +
        '<h4 class="wk-sec">Skills</h4><div class="wk-skills">' + (w.skills || []).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div>' +
        '<h4 class="wk-sec">Languages</h4><p class="wk-muted">' + esc((w.languages || []).join(', ')) + '</p>' +
        '<h4 class="wk-sec">Experience Timeline</h4><ul class="wk-timeline">' + timeline + '</ul>' +
        '<h4 class="wk-sec">Recent Reviews</h4>' + reviews +
      '</div>';
    var footer = '<button class="btn-secondary" data-close>Close</button>' +
      '<button class="btn-primary" id="wk-profile-book"' + (w.available ? '' : ' disabled') + '><i class="fas fa-calendar-check"></i> ' + (w.available ? 'Book Worker' : 'Busy') + '</button>';
    var modal = buildModal('Worker Profile', body, footer);
    var bookBtn = modal.querySelector('#wk-profile-book');
    if (bookBtn) bookBtn.addEventListener('click', function () { closeWkModal(modal); openBookingModal(w); });
  }

  /* ---------------- Booking modal + calendar ---------------- */
  function openBookingModal(w) {
    var farms = (window.FarmDB && FarmDB.farms) || [];
    var today = new Date(); today.setDate(today.getDate() + 1);
    var minDate = today.toISOString().slice(0, 10);
    var farmOpts = farms.map(function (f) { return '<option value="' + esc(f.name) + '">' + esc(f.name) + '</option>'; }).join('');
    var workTypes = (w.skills || []).concat(['Custom Work']).map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');

    var body = '' +
      '<div class="wk-book-worker"><img src="' + esc(w.image) + '" onerror="this.src=\'https://ui-avatars.com/api/?background=1B5E3F&color=fff&name=' + encodeURIComponent(w.name) + '\'"><div><b>' + esc(w.name) + '</b><small>' + esc(w.category) + ' • ' + rupee(w.dailyWage) + '/day</small></div></div>' +
      '<form id="wk-book-form" class="wk-form" novalidate>' +
        '<div class="wk-grid2">' +
          '<label>Date <span class="req">*</span><input type="date" name="date" min="' + minDate + '" value="' + minDate + '" required></label>' +
          '<label>Time <span class="req">*</span><input type="time" name="time" value="08:00" required></label>' +
        '</div>' +
        '<label>Farm <span class="req">*</span><select name="farm" required>' + farmOpts + '</select></label>' +
        '<label>Location / Address <span class="req">*</span><input type="text" name="location" placeholder="e.g. Plot 4, near canal road" required></label>' +
        '<div class="wk-grid2">' +
          '<label>Work Type <span class="req">*</span><select name="workType" required>' + workTypes + '</select></label>' +
          '<label>Duration (days) <span class="req">*</span><input type="number" name="days" min="1" max="60" value="1" required></label>' +
        '</div>' +
        '<label>Notes <small class="wk-counter" id="wk-note-count">0/200</small><textarea name="notes" maxlength="200" rows="2" placeholder="Any special instructions..."></textarea></label>' +
        '<div class="wk-estimate"><span>Estimated Cost</span><b id="wk-est-total">' + rupee(WorkerService.estimateCost(w.dailyWage, 1).total) + '</b></div>' +
        '<div class="wk-est-breakdown" id="wk-est-breakdown"></div>' +
      '</form>';
    var footer = '<button class="btn-secondary" data-close>Cancel</button>' +
      '<button class="btn-primary" id="wk-confirm-book"><i class="fas fa-check"></i> Confirm Booking</button>';
    var modal = buildModal('Book Worker', body, footer);

    var form = modal.querySelector('#wk-book-form');
    var totalEl = modal.querySelector('#wk-est-total');
    var breakdownEl = modal.querySelector('#wk-est-breakdown');
    var noteCount = modal.querySelector('#wk-note-count');

    function recalc() {
      var days = parseInt(form.days.value || '1', 10) || 1;
      var est = WorkerService.estimateCost(w.dailyWage, days);
      totalEl.textContent = rupee(est.total);
      breakdownEl.innerHTML = '<span>' + rupee(w.dailyWage) + ' × ' + days + ' day(s) = ' + rupee(est.base) + '</span><span>Service fee (5%): ' + rupee(est.serviceFee) + '</span>';
    }
    form.days.addEventListener('input', recalc);
    form.notes.addEventListener('input', function () { noteCount.textContent = form.notes.value.length + '/200'; });
    recalc();

    modal.querySelector('#wk-confirm-book').addEventListener('click', function () {
      if (!validateForm(form)) { window.showToast && showToast('Please fill all required fields', 'warning'); return; }
      var btn = this; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
      var days = parseInt(form.days.value, 10);
      var est = WorkerService.estimateCost(w.dailyWage, days);
      WorkerService.book({
        workerId: w.id, workerName: w.name, workerImage: w.image, category: w.category,
        date: form.date.value, time: form.time.value, farm: form.farm.value, location: form.location.value,
        workType: form.workType.value, days: days, notes: form.notes.value,
        dailyWage: w.dailyWage, estimatedCost: est.total
      }).then(function (booking) {
        showBookingSuccess(modal, w, booking);
      });
    });
  }

  function validateForm(form) {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      if (!f.value.trim()) { f.classList.add('wk-invalid'); ok = false; }
      else f.classList.remove('wk-invalid');
    });
    return ok;
  }

  function showBookingSuccess(modal, w, booking) {
    var content = modal.querySelector('.wk-modal-body');
    var footer = modal.querySelector('.wk-modal-foot');
    content.innerHTML = '<div class="wk-success">' +
      '<div class="wk-success-ring"><i class="fas fa-check"></i></div>' +
      '<h3>Booking Confirmed!</h3>' +
      '<p>' + esc(w.name) + ' is booked for <b>' + esc(booking.workType) + '</b></p>' +
      '<div class="wk-success-card">' +
        '<div><span>Date</span><b>' + esc(booking.date) + ' ' + esc(booking.time) + '</b></div>' +
        '<div><span>Farm</span><b>' + esc(booking.farm) + '</b></div>' +
        '<div><span>Duration</span><b>' + booking.days + ' day(s)</b></div>' +
        '<div><span>Est. Cost</span><b>' + rupee(booking.estimatedCost) + '</b></div>' +
        '<div><span>Booking ID</span><b>' + esc(booking.id) + '</b></div>' +
      '</div></div>';
    footer.innerHTML = '<button class="btn-secondary" data-close>Done</button><button class="btn-primary" id="wk-view-bookings"><i class="fas fa-list"></i> My Bookings</button>';
    footer.querySelector('#wk-view-bookings').addEventListener('click', function () { closeWkModal(modal); switchTab('bookings'); });
    footer.querySelector('[data-close]').addEventListener('click', function () { closeWkModal(modal); renderBookings(); });
    if (window.showToast) showToast('Worker booked successfully!', 'success');
  }

  /* ---------------- My Bookings ---------------- */
  function renderBookings() {
    var el = document.getElementById('worker-bookings-list');
    if (!el || !window.WorkerService) return;
    WorkerService.myBookings().then(function (list) {
      if (!list.length) {
        el.innerHTML = '<div class="wk-empty"><i class="fas fa-calendar-xmark"></i><h4>No bookings yet</h4><p>Book a worker from the Marketplace to see it here.</p></div>';
        return;
      }
      el.innerHTML = list.map(function (b) {
        return '<div class="wk-booking-card" data-id="' + esc(b.id) + '">' +
          '<img src="' + esc(b.workerImage) + '" onerror="this.src=\'https://ui-avatars.com/api/?background=1B5E3F&color=fff&name=' + encodeURIComponent(b.workerName) + '\'">' +
          '<div class="wk-booking-info"><b>' + esc(b.workerName) + '</b><small>' + esc(b.workType) + ' • ' + esc(b.farm) + '</small>' +
            '<small><i class="fas fa-calendar"></i> ' + esc(b.date) + ' ' + esc(b.time) + ' • ' + b.days + ' day(s)</small></div>' +
          '<div class="wk-booking-side"><span class="badge badge-green">' + esc(b.status) + '</span><b>' + rupee(b.estimatedCost) + '</b>' +
            '<button class="wk-cancel" data-cancel="' + esc(b.id) + '">Cancel</button></div>' +
        '</div>';
      }).join('');
      el.querySelectorAll('[data-cancel]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Cancel this booking?')) return;
          WorkerService.cancelBooking(btn.dataset.cancel).then(function () {
            window.showToast && showToast('Booking cancelled', 'info');
            renderBookings();
          });
        });
      });
    });
  }

  /* ---------------- Generic modal builder (self-contained) ---------------- */
  function buildModal(title, bodyHTML, footerHTML) {
    var backdrop = document.createElement('div');
    backdrop.className = 'wk-modal-backdrop';
    backdrop.innerHTML = '<div class="wk-modal" role="dialog" aria-modal="true">' +
      '<div class="wk-modal-head"><h3>' + esc(title) + '</h3><button class="wk-modal-x" data-close aria-label="Close"><i class="fas fa-times"></i></button></div>' +
      '<div class="wk-modal-body">' + bodyHTML + '</div>' +
      '<div class="wk-modal-foot">' + footerHTML + '</div></div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { backdrop.classList.add('open'); });
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || (e.target.closest && e.target.closest('[data-close]'))) closeWkModal(backdrop);
    });
    document.addEventListener('keydown', function esc2(ev) {
      if (ev.key === 'Escape') { closeWkModal(backdrop); document.removeEventListener('keydown', esc2); }
    });
    return backdrop;
  }
  function closeWkModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { modal.remove(); }, 250);
  }

  function skeletonCards(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += '<div class="wk-skeleton"><div class="sk-avatar"></div><div class="sk-lines"><span></span><span></span><span></span></div></div>';
    return s;
  }

  /* ---------------- Tabs ---------------- */
  function switchTab(tab) {
    document.querySelectorAll('.wk-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    document.querySelectorAll('.wk-panel').forEach(function (p) { p.classList.toggle('active', p.dataset.panel === tab); });
    if (tab === 'bookings') renderBookings();
    if (tab === 'saved') renderSaved();
  }

  function renderSaved() {
    var el = document.getElementById('workers-saved-list');
    if (!el) return;
    el.innerHTML = skeletonCards(3);
    WorkerService.savedWorkers().then(function (list) {
      if (!list.length) { el.innerHTML = '<div class="wk-empty"><i class="far fa-bookmark"></i><h4>No saved workers</h4><p>Tap the bookmark icon on any worker to save them.</p></div>'; return; }
      el.innerHTML = list.map(cardHTML).join('');
      requestAnimationFrame(function () { el.querySelectorAll('.wk-card').forEach(function (c) { c.classList.add('in'); }); });
      bindCardActions(el);
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    if (!document.getElementById('workers-app')) return;
    renderCategories();
    renderList();

    var search = document.getElementById('worker-search');
    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { state.query = search.value; renderList(); }, 250);
      });
    }
    var sortSel = document.getElementById('worker-sort');
    if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; renderList(); });
    var availChk = document.getElementById('worker-avail-only');
    if (availChk) availChk.addEventListener('change', function () { state.availableOnly = availChk.checked; renderList(); });
    var verChk = document.getElementById('worker-verified-only');
    if (verChk) verChk.addEventListener('change', function () { state.verifiedOnly = verChk.checked; renderList(); });

    document.querySelectorAll('.wk-tab').forEach(function (t) {
      t.addEventListener('click', function () { switchTab(t.dataset.tab); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 60);
})();
