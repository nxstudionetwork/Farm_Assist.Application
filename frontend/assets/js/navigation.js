/* ========================================================================
   FARM ASSIST - SINGLE REUSABLE NAVIGATION COMPONENT v6.0
   Renders identical navigation on every page: Top Bar, Sidebar,
   Bottom Nav, Inbox Dropdown, Profile Dropdown, Command Palette,
   and Toasts.
   ======================================================================== */
(function (global) {
  'use strict';

  var COLLAPSE_KEY = 'fa-sidebar-collapsed';
  var GROUPS_KEY = 'fa-sidebar-groups';
  var SKIP_PAGES = ['login.html', 'signup.html', 'forgot.html', 'onboarding.html'];
  var AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=150&h=150';

  /* ------------------------------------------------------------------
     NAVIGATION STRUCTURE
     ------------------------------------------------------------------ */
  var NAV = [
    { type: 'item', label: 'Dashboard', icon: 'fa-house', href: 'index.html' },
    { type: 'item', label: 'My Farm', icon: 'fa-tractor', href: 'farm.html' },
    {
      type: 'group', label: 'Farm Operations', children: [
        { label: 'Crops & Seeds', icon: 'fa-seedling', href: 'seeds.html' },
        { label: 'Livestock', icon: 'fa-cow', href: 'livestock.html' },
        { label: 'Workers', icon: 'fa-people-group', href: 'workers.html' },
        { label: 'Farm Calendar', icon: 'fa-calendar-days', href: 'tools.html' },
        { label: 'Tasks', icon: 'fa-list-check', href: 'tools.html' },
        { label: 'Documents', icon: 'fa-folder-open', href: 'documents.html' }
      ]
    },
    {
      type: 'group', label: 'Marketplace & Finance', children: [
        { label: 'Marketplace', icon: 'fa-shopping-bag', href: 'marketplace.html' },
        { label: 'Market Prices', icon: 'fa-chart-line', href: 'market-prices.html' },
        { label: 'Finance', icon: 'fa-indian-rupee-sign', href: 'finance.html' },
        { label: 'Insurance', icon: 'fa-shield-halved', href: 'finance.html' },
        { label: 'Government Schemes', icon: 'fa-landmark', href: 'schemes.html' }
      ]
    },
    {
      type: 'group', label: 'Community', children: [
        { label: 'Community', icon: 'fa-people-group', href: 'community.html' },
        { label: 'Expert Hub', icon: 'fa-user-doctor', href: 'expert.html' },
        { label: 'Messages', icon: 'fa-comments', href: 'messages.html' },
        { label: 'News', icon: 'fa-newspaper', href: 'news.html' }
      ]
    },
    {
      type: 'group', label: 'Tools & Resources', children: [
        { label: 'Farm Map', icon: 'fa-map-location-dot', href: 'map.html' },
        { label: 'Weather', icon: 'fa-cloud-sun', href: 'weather.html' },
        { label: 'Smart Monitoring', icon: 'fa-satellite-dish', href: 'monitoring.html' },
        { label: 'AI Assistant', icon: 'fa-robot', href: 'ai.html' },
        { label: 'Emergency', icon: 'fa-truck-medical', href: 'emergency.html' }
      ]
    },
    { type: 'item', label: 'Profile', icon: 'fa-user-circle', href: 'profile.html' },
    { type: 'item', label: 'Settings', icon: 'fa-gear', href: 'settings.html' },
    { type: 'item', label: 'Help & Support', icon: 'fa-circle-question', href: 'help.html' }
  ];

  var BOTTOM_NAV = [
    { label: 'Farm', icon: 'fa-tractor', href: 'farm.html' },
    { label: 'Monitor', icon: 'fa-satellite-dish', href: 'monitoring.html' },
    { label: 'Home', icon: 'fa-home', href: 'index.html', center: true },
    { label: 'AI Help', icon: 'fa-robot', href: 'ai.html' },
    { label: 'Market', icon: 'fa-shopping-basket', href: 'marketplace.html' }
  ];

  /* ------------------------------------------------------------------
     MOCK INBOX DATA
     ------------------------------------------------------------------ */
  var INBOX_MESSAGES = [
    { id: 1, sender: 'Rajesh Kumar', msg: 'Replied to your pest management question', time: '2m ago', unread: true, type: 'community', avatar: 'RK' },
    { id: 2, sender: 'Dr. Arvind S.', msg: 'Your soil test results are ready. NPK levels need adjustment.', time: '15m ago', unread: true, type: 'expert', avatar: 'DA' },
    { id: 3, sender: 'PM-KISAN Update', msg: '15th installment deposited to your account', time: '1h ago', unread: true, type: 'alert', avatar: 'PK' },
    { id: 4, sender: 'Marketplace', msg: 'Your order #ORD-9801 has been shipped', time: '2h ago', unread: false, type: 'update', avatar: 'MP' },
    { id: 5, sender: 'Farm Assist', msg: 'Heavy rain advisory: Secure your crops before tomorrow', time: '3h ago', unread: false, type: 'alert', avatar: 'FA' },
    { id: 6, sender: 'Mahesh Patil', msg: 'Confirmed booking for tomorrow', time: '5h ago', unread: false, type: 'community', avatar: 'MP' },
    { id: 7, sender: 'Expert Hub', msg: 'New course available: Advanced Organic Farming', time: '1d ago', unread: false, type: 'expert', avatar: 'EH' }
  ];

  /* ------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------ */
  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function getOpenGroups() {
    try { return JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}'); } catch (e) { return {}; }
  }

  function setOpenGroups(g) {
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(g)); } catch (e) {}
  }

  function isCollapsed() {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  }

  function setCollapsed(val) {
    localStorage.setItem(COLLAPSE_KEY, val ? '1' : '0');
  }

  function getUserData() {
    try {
      if (window.UserStore && UserStore.getCurrentUser) return UserStore.getCurrentUser();
    } catch (e) {}
    var name = '';
    try { name = localStorage.getItem('user-name') || ''; } catch (e) {}
    return { fullName: name || 'Farmer', email: '', role: 'farmer' };
  }

  function getUserAvatar() {
    try {
      if (window.UserStore && UserStore.avatarFor) return UserStore.avatarFor(getUserData());
    } catch (e) {}
    return AVATAR_URL;
  }

  function getFarmId() {
    var id = '';
    try { id = localStorage.getItem('farm-id') || ''; } catch (e) {}
    return id || 'FA-10245';
  }

  function getUnreadCount() {
    return INBOX_MESSAGES.filter(function (m) { return m.unread; }).length;
  }

  function isLoginPage() {
    return SKIP_PAGES.indexOf(currentPage()) !== -1;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------
     REMOVE EXISTING INLINE NAVIGATION
     ------------------------------------------------------------------ */
  function removeExistingNav() {
    var selectors = [
      'header.top-bar', '.sidebar-backdrop', 'aside.sidebar',
      'nav.bottom-nav', '.profile-dropdown', '.inbox-dropdown',
      '.cmd-palette-backdrop', '.toast-container', '#superapp-shell-injected'
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { el.remove(); });
    });
  }

  /* ------------------------------------------------------------------
     INJECT TOP BAR
     ------------------------------------------------------------------ */
  function injectTopBar() {
    if (document.querySelector('header.top-bar')) return;
    var unreadCount = getUnreadCount();
    var header = document.createElement('header');
    header.className = 'top-bar';
    header.innerHTML =
      '<div class="top-bar-left">' +
        '<button class="hamburger-btn" id="menu-btn" aria-label="Toggle Navigation Drawer" aria-expanded="false">' +
          '<i class="fas fa-bars"></i>' +
        '</button>' +
        '<a href="index.html" class="app-logo">' +
          '<img src="assets/icons/icon.svg" alt="" width="28" height="28" style="margin-right:8px;">' +
          '<span class="app-logo-text">Farm Assist</span>' +
        '</a>' +
      '</div>' +
      '<div class="top-bar-right">' +
        '<a href="map.html" class="top-btn" aria-label="Farm Map" title="Farm Map">' +
          '<i class="fas fa-map-location-dot"></i>' +
        '</a>' +
        '<button class="top-btn" id="inbox-btn" aria-label="Inbox" title="Inbox">' +
          '<i class="fas fa-inbox"></i>' +
          (unreadCount > 0 ? '<span class="badge" id="inbox-badge">' + unreadCount + '</span>' : '') +
        '</button>' +
        '<button class="profile-avatar top-bar-avatar" id="nav-profile-avatar" aria-label="Profile Menu">' +
          '<img data-user-avatar src="' + AVATAR_URL + '" alt="Profile">' +
        '</button>' +
      '</div>';
    document.body.insertBefore(header, document.body.firstChild);
  }

  /* ------------------------------------------------------------------
     INJECT SIDEBAR BACKDROP
     ------------------------------------------------------------------ */
  function injectBackdrop() {
    if (document.querySelector('.sidebar-backdrop')) return;
    var bd = document.createElement('div');
    bd.className = 'sidebar-backdrop';
    bd.id = 'sidebar-backdrop';
    document.body.appendChild(bd);
  }

  /* ------------------------------------------------------------------
     INJECT SIDEBAR
     ------------------------------------------------------------------ */
  function injectSidebar() {
    if (document.querySelector('aside.sidebar')) return;
    var page = currentPage();
    var openGroups = getOpenGroups();
    var farmId = getFarmId();
    var user = getUserData();

    NAV.forEach(function (n, i) {
      if (n.type === 'group' && n.children.some(function (c) { return c.href === page; })) {
        openGroups['g' + i] = true;
      }
    });
    setOpenGroups(openGroups);

    var menuHtml = '';
    NAV.forEach(function (n, i) {
      if (n.type === 'item') {
        menuHtml += buildSidebarItem(n, page, false);
      } else if (n.type === 'group') {
        var isOpen = !!openGroups['g' + i];
        var hasActive = n.children.some(function (c) { return c.href === page; });
        menuHtml += '<div class="sb-group' + (isOpen ? ' open' : '') + '" data-group="g' + i + '">';
        menuHtml += '<button type="button" class="sb-group-head' + (hasActive ? ' has-active' : '') + '" data-group-toggle="g' + i + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">';
        menuHtml += '<span class="sb-group-label"><span class="sb-group-label-text">' + escapeHtml(n.label) + '</span></span>';
        menuHtml += '<i class="fas fa-chevron-down sb-caret"></i>';
        menuHtml += '</button>';
        menuHtml += '<div class="sb-group-body">';
        n.children.forEach(function (c) { menuHtml += buildSidebarItem(c, page, true); });
        menuHtml += '</div></div>';
      }
    });

    var aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = 'sidebar';
    aside.innerHTML =
      '<div class="sidebar-header">' +
        '<div class="sidebar-brand">' +
          '<img src="assets/icons/icon.svg" alt="" width="32" height="32" class="sidebar-logo-img">' +
          '<div class="sidebar-brand-info">' +
            '<div class="sidebar-brand-name">Farm Assist</div>' +
            '<div class="sidebar-brand-id">Farm ID: ' + escapeHtml(farmId) + '</div>' +
          '</div>' +
        '</div>' +
        '<button class="sidebar-close" id="sidebar-close" aria-label="Close sidebar"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="sidebar-user">' +
        '<img data-user-avatar src="' + AVATAR_URL + '" alt="Profile" class="sidebar-user-avatar">' +
        '<div class="sidebar-user-info">' +
          '<h4 id="sidebar-name" data-user="fullName">' + escapeHtml(user.fullName || 'Farmer') + '</h4>' +
          '<p>' + escapeHtml(user.email || user.role || 'farmer') + '</p>' +
        '</div>' +
      '</div>' +
      '<nav class="sidebar-menu" id="sidebar-menu" aria-label="Main navigation">' +
        menuHtml +
      '</nav>' +
      '<div class="sidebar-footer">' +
        '<div class="sidebar-footer-brand">' +
          '<span class="sidebar-footer-powered">Powered by</span>' +
          '<span class="sidebar-footer-ifx">IFX Group</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(aside);
  }

  function buildSidebarItem(item, page, isChild) {
    var active = item.href === page ? ' active' : '';
    var safeLabel = escapeHtml(item.label);
    return '<a href="' + item.href + '" class="sidebar-item' + (isChild ? ' sb-child' : '') + active + '">' +
      '<i class="fas ' + item.icon + '"></i><span class="sb-label">' + safeLabel + '</span></a>';
  }

  /* ------------------------------------------------------------------
     INJECT BOTTOM NAV
     ------------------------------------------------------------------ */
  function injectBottomNav() {
    if (document.querySelector('nav.bottom-nav')) return;
    var page = currentPage();
    var html = '';
    BOTTOM_NAV.forEach(function (item) {
      var active = item.href === page ? ' active' : '';
      var cls = 'bottom-nav-item' + active + (item.center ? ' home-highlight' : '');
      html += '<a href="' + item.href + '" class="' + cls + '" aria-label="' + escapeHtml(item.label) + '">';
      html += '<i class="fas ' + item.icon + '"></i>';
      html += '<span>' + escapeHtml(item.label) + '</span></a>';
    });
    var nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.id = 'bottom-nav';
    nav.setAttribute('aria-label', 'Bottom navigation');
    nav.innerHTML = html;
    document.body.appendChild(nav);
  }

  /* ------------------------------------------------------------------
     INJECT INBOX DROPDOWN
     ------------------------------------------------------------------ */
  function injectInboxDropdown() {
    if (document.getElementById('inbox-dropdown')) return;
    var dd = document.createElement('div');
    dd.className = 'inbox-dropdown';
    dd.id = 'inbox-dropdown';
    dd.innerHTML = buildInboxHTML('all');
    document.body.appendChild(dd);
  }

  function buildInboxHTML(filter) {
    var messages = INBOX_MESSAGES;
    if (filter && filter !== 'all') {
      if (filter === 'unread') {
        messages = messages.filter(function (m) { return m.unread; });
      } else {
        messages = messages.filter(function (m) { return m.type === filter; });
      }
    }

    var avatarColors = ['#1B5E3F', '#40916C', '#E9B640', '#8B6F47', '#0F2E1E', '#52B788', '#2D8659'];

    var html =
      '<div class="inbox-header">' +
        '<h3><i class="fas fa-inbox"></i> Inbox</h3>' +
        '<button class="inbox-mark-read" id="inbox-mark-all" aria-label="Mark all messages as read">Mark all read</button>' +
      '</div>' +
      '<div class="inbox-filters">' +
        '<button class="inbox-filter-chip' + (filter === 'all' ? ' active' : '') + '" data-filter="all">All</button>' +
        '<button class="inbox-filter-chip' + (filter === 'unread' ? ' active' : '') + '" data-filter="unread">Unread</button>' +
        '<button class="inbox-filter-chip' + (filter === 'community' ? ' active' : '') + '" data-filter="community">Community</button>' +
        '<button class="inbox-filter-chip' + (filter === 'expert' ? ' active' : '') + '" data-filter="expert">Experts</button>' +
        '<button class="inbox-filter-chip' + (filter === 'alert' ? ' active' : '') + '" data-filter="alert">Alerts</button>' +
      '</div>' +
      '<div class="inbox-list">';

    if (messages.length === 0) {
      html += '<div class="inbox-empty"><i class="fas fa-check-circle"></i><p>All caught up!</p></div>';
    } else {
      messages.forEach(function (m, idx) {
        var color = avatarColors[m.id % avatarColors.length];
        html +=
          '<div class="inbox-item' + (m.unread ? ' unread' : '') + '" data-id="' + m.id + '" tabindex="0">' +
            '<div class="inbox-item-avatar" style="background:' + color + ';">' +
              '<span>' + escapeHtml(m.avatar) + '</span>' +
            '</div>' +
            '<div class="inbox-item-content">' +
              '<div class="inbox-item-top">' +
                '<span class="inbox-item-sender">' + escapeHtml(m.sender) + '</span>' +
                '<span class="inbox-item-time">' + escapeHtml(m.time) + '</span>' +
              '</div>' +
              '<p class="inbox-item-msg">' + escapeHtml(m.msg) + '</p>' +
            '</div>' +
            (m.unread ? '<span class="inbox-unread-dot"></span>' : '') +
          '</div>';
      });
    }

    html += '</div>' +
      '<div class="inbox-footer">' +
        '<a href="messages.html" class="inbox-view-all">View All Messages <i class="fas fa-arrow-right"></i></a>' +
      '</div>';
    return html;
  }

  /* ------------------------------------------------------------------
     INJECT PROFILE DROPDOWN
     ------------------------------------------------------------------ */
  function injectProfileDropdown() {
    if (document.getElementById('profile-dropdown')) return;
    var user = getUserData();
    var avatar = getUserAvatar();
    var menu = document.createElement('div');
    menu.className = 'profile-dropdown';
    menu.id = 'profile-dropdown';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<div class="pd-head">' +
        '<img src="' + avatar + '" alt="avatar" class="pd-avatar">' +
        '<div class="pd-head-info">' +
          '<h5>' + escapeHtml(user.fullName || 'Farmer') + '</h5>' +
          '<p>' + escapeHtml(user.email || user.role || 'farmer') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="pd-divider"></div>' +
      '<a href="profile.html" class="pd-item" role="menuitem"><i class="fas fa-user"></i> My Profile</a>' +
      '<a href="farm.html" class="pd-item" role="menuitem"><i class="fas fa-tractor"></i> My Farms</a>' +
      '<a href="settings.html" class="pd-item" role="menuitem"><i class="fas fa-gear"></i> Settings</a>' +
      '<a href="documents.html" class="pd-item" role="menuitem"><i class="fas fa-folder"></i> Documents</a>' +
      '<a href="help.html" class="pd-item" role="menuitem"><i class="fas fa-circle-question"></i> Help</a>' +
      '<div class="pd-divider"></div>' +
      '<button type="button" class="pd-item pd-logout" id="nav-pd-logout" role="menuitem"><i class="fas fa-right-from-bracket"></i> Logout</button>';
    document.body.appendChild(menu);
  }

  /* ------------------------------------------------------------------
     INJECT COMMAND PALETTE
     ------------------------------------------------------------------ */
  function injectCommandPalette() {
    if (document.getElementById('cmd-palette-backdrop')) return;
    var cmd = document.createElement('div');
    cmd.id = 'cmd-palette-backdrop';
    cmd.className = 'cmd-palette-backdrop';
    cmd.setAttribute('role', 'dialog');
    cmd.setAttribute('aria-modal', 'true');
    cmd.innerHTML =
      '<div class="cmd-palette-box">' +
        '<div class="cmd-palette-header">' +
          '<i class="fas fa-search" style="color:var(--premium-green);"></i>' +
          '<input type="text" id="cmd-search-input" class="cmd-palette-input" placeholder="Search pages... (Ctrl+K)" autocomplete="off" aria-label="Search pages">' +
          '<kbd class="cmd-palette-kbd">ESC</kbd>' +
        '</div>' +
        '<div class="cmd-palette-results" id="cmd-search-results">' +
          '<div class="cmd-search-placeholder">Type to search pages and actions...</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(cmd);
  }

  /* ------------------------------------------------------------------
     INJECT TOAST CONTAINER
     ------------------------------------------------------------------ */
  function injectToastContainer() {
    if (document.getElementById('toast-container')) return;
    var tc = document.createElement('div');
    tc.id = 'toast-container';
    tc.className = 'toast-container';
    tc.setAttribute('aria-live', 'polite');
    document.body.appendChild(tc);
  }

  /* ------------------------------------------------------------------
     EVENT BINDING
     ------------------------------------------------------------------ */
  function bindEvents() {
    var menuBtn = document.getElementById('menu-btn');
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    var closeBtn = document.getElementById('sidebar-close');

    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        var isOpen = sidebar.classList.contains('open');
        sidebar.classList.toggle('open', !isOpen);
        backdrop.classList.toggle('active', !isOpen);
        menuBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    function closeSidebarFn() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeSidebarFn);
    if (backdrop) backdrop.addEventListener('click', closeSidebarFn);

    /* -- Sidebar group expand/collapse -------------------------------- */
    var sidebarMenu = document.getElementById('sidebar-menu');
    if (sidebarMenu) {
      sidebarMenu.addEventListener('click', function (e) {
        var toggle = e.target.closest('[data-group-toggle]');
        if (!toggle) return;
        var id = toggle.getAttribute('data-group-toggle');
        var group = sidebarMenu.querySelector('[data-group="' + id + '"]');
        if (!group) return;
        var openGroups = getOpenGroups();
        var nowOpen = !group.classList.contains('open');
        group.classList.toggle('open', nowOpen);
        openGroups[id] = nowOpen;
        setOpenGroups(openGroups);
        toggle.setAttribute('aria-expanded', String(nowOpen));
      });
    }

    /* -- Logout ------------------------------------------------------ */
    var pdLogout = document.getElementById('nav-pd-logout');
    if (pdLogout) {
      pdLogout.addEventListener('click', function () {
        if (confirm('Are you sure you want to log out?')) {
          try {
            localStorage.removeItem('user-logged-in');
            localStorage.removeItem('user-name');
          } catch (e) {}
          closeProfileDropdown();
          window.location.href = 'login.html';
        }
      });
    }

    /* -- INBOX DROPDOWN ---------------------------------------------- */
    bindInboxDropdown();

    /* -- Profile avatar dropdown ------------------------------------- */
    bindProfileDropdown();

    /* -- Keyboard shortcuts ------------------------------------------ */
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape') {
        closeCommandPalette();
        closeInboxDropdown();
        closeProfileDropdown();
      }
    });

    /* -- Command palette backdrop click to close --------------------- */
    var cmdBackdrop = document.getElementById('cmd-palette-backdrop');
    if (cmdBackdrop) {
      cmdBackdrop.addEventListener('click', function (e) {
        if (e.target === cmdBackdrop) closeCommandPalette();
      });
    }

    /* -- Init command palette search --------------------------------- */
    initCommandPaletteSearch();
  }

  /* ------------------------------------------------------------------
     INBOX DROPDOWN LOGIC
     ------------------------------------------------------------------ */
  function bindInboxDropdown() {
    var inboxBtn = document.getElementById('inbox-btn');
    var dd = document.getElementById('inbox-dropdown');
    if (!inboxBtn || !dd) return;

    function positionDD() {
      var r = inboxBtn.getBoundingClientRect();
      dd.style.top = (r.bottom + 8) + 'px';
      dd.style.right = Math.max(8, window.innerWidth - r.right - 10) + 'px';
      dd.style.left = 'auto';
      if (window.innerWidth < 600) {
        dd.style.left = '8px';
        dd.style.right = '8px';
      }
    }

    inboxBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeProfileDropdown();
      if (dd.classList.contains('open')) {
        closeInboxDropdown();
        return;
      }
      positionDD();
      dd.classList.add('open');
      bindInboxFilters();
      bindInboxItems();
    });

    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target) && e.target !== inboxBtn && !inboxBtn.contains(e.target)) {
        closeInboxDropdown();
      }
    });

    window.addEventListener('resize', function () {
      if (dd.classList.contains('open')) positionDD();
    });
  }

  function closeInboxDropdown() {
    var dd = document.getElementById('inbox-dropdown');
    if (dd) dd.classList.remove('open');
  }

  function bindInboxFilters() {
    var dd = document.getElementById('inbox-dropdown');
    if (!dd) return;
    dd.querySelectorAll('.inbox-filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');
        dd.innerHTML = buildInboxHTML(filter);
        bindInboxFilters();
        bindInboxItems();
      });
    });
    var markAll = document.getElementById('inbox-mark-all');
    if (markAll) {
      markAll.addEventListener('click', function () {
        INBOX_MESSAGES.forEach(function (m) { m.unread = false; });
        dd.innerHTML = buildInboxHTML('all');
        bindInboxFilters();
        bindInboxItems();
        updateInboxBadge();
        showToast('All messages marked as read', 'success');
      });
    }
  }

  function bindInboxItems() {
    var dd = document.getElementById('inbox-dropdown');
    if (!dd) return;
    dd.querySelectorAll('.inbox-item').forEach(function (item) {
      function handleClick() {
        var id = parseInt(item.getAttribute('data-id'));
        var msg = INBOX_MESSAGES.find(function (m) { return m.id === id; });
        if (msg) msg.unread = false;
        item.classList.remove('unread');
        var dot = item.querySelector('.inbox-unread-dot');
        if (dot) dot.remove();
        updateInboxBadge();
        closeInboxDropdown();
        window.location.href = 'chat.html?id=' + id;
      }
      item.addEventListener('click', handleClick);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
      });
    });
  }

  function updateInboxBadge() {
    var count = getUnreadCount();
    var badge = document.getElementById('inbox-badge');
    var btn = document.getElementById('inbox-btn');
    if (count > 0) {
      if (badge) {
        badge.textContent = count;
      } else if (btn) {
        var newBadge = document.createElement('span');
        newBadge.className = 'badge';
        newBadge.id = 'inbox-badge';
        newBadge.textContent = count;
        btn.appendChild(newBadge);
      }
    } else if (badge) {
      badge.remove();
    }
  }

  /* ------------------------------------------------------------------
     PROFILE DROPDOWN LOGIC
     ------------------------------------------------------------------ */
  function bindProfileDropdown() {
    var headerAvatar = document.getElementById('nav-profile-avatar');
    var menu = document.getElementById('profile-dropdown');
    if (!headerAvatar || !menu) return;

    function positionMenu() {
      var r = headerAvatar.getBoundingClientRect();
      menu.style.top = (r.bottom + 8) + 'px';
      menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
      menu.style.left = 'auto';
      if (window.innerWidth < 400) {
        menu.style.left = '8px';
        menu.style.right = '8px';
      }
    }

    headerAvatar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeInboxDropdown();
      positionMenu();
      menu.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== headerAvatar && !headerAvatar.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    window.addEventListener('resize', function () {
      if (menu.classList.contains('open')) positionMenu();
    });
  }

  function closeProfileDropdown() {
    var menu = document.getElementById('profile-dropdown');
    if (menu) menu.classList.remove('open');
  }

  /* ------------------------------------------------------------------
     COMMAND PALETTE SEARCH LOGIC
     ------------------------------------------------------------------ */
  function initCommandPaletteSearch() {
    var input = document.getElementById('cmd-search-input');
    var results = document.getElementById('cmd-search-results');
    if (!input || !results) return;

    input.addEventListener('input', function () {
      clearTimeout(input._debounce);
      input._debounce = setTimeout(function () { performSearch(input.value.trim()); }, 150);
    });

    input.addEventListener('keydown', function (e) {
      var items = results.querySelectorAll('.cmd-item');
      var selected = results.querySelector('.cmd-item.selected');
      var idx = Array.prototype.indexOf.call(items, selected);

      if (e.key === 'Enter') {
        e.preventDefault();
        if (selected) { selected.click(); return; }
        if (items.length) items[0].click();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items.forEach(function (i) { i.classList.remove('selected'); });
        if (idx < items.length - 1) items[idx + 1].classList.add('selected');
        else if (items.length) items[0].classList.add('selected');
        var newSel = results.querySelector('.cmd-item.selected');
        if (newSel) newSel.scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        items.forEach(function (i) { i.classList.remove('selected'); });
        if (idx > 0) items[idx - 1].classList.add('selected');
        else if (items.length) items[items.length - 1].classList.add('selected');
        var newSel2 = results.querySelector('.cmd-item.selected');
        if (newSel2) newSel2.scrollIntoView({ block: 'nearest' });
      }
    });

    function performSearch(query) {
      if (!query) {
        showSuggestions();
        return;
      }
      var q = query.toLowerCase();
      var allPages = [];
      NAV.forEach(function (n) {
        if (n.type === 'item') allPages.push({ label: n.label, icon: n.icon, href: n.href });
        if (n.type === 'group') n.children.forEach(function (c) { allPages.push({ label: c.label, icon: c.icon, href: c.href }); });
      });

      var matches = allPages.filter(function (p) {
        return p.label.toLowerCase().indexOf(q) !== -1;
      });

      var html = '';
      if (matches.length) {
        html += '<div class="cmd-section-label"><i class="fas fa-search"></i> Pages</div>';
        matches.forEach(function (m) {
          html += '<div class="cmd-item" data-href="' + m.href + '" tabindex="0">';
          html += '<i class="fas ' + m.icon + '"></i><span class="cmd-item-title">' + escapeHtml(m.label) + '</span>';
          html += '<span class="cmd-item-category">Page</span></div>';
        });
      } else {
        html += '<div class="cmd-empty"><i class="fas fa-search"></i><p>No results for "' + escapeHtml(query) + '"</p></div>';
      }
      results.innerHTML = html;
      bindResultClickes();
    }

    function showSuggestions() {
      var quickPages = [
        { href: 'index.html', label: 'Dashboard', icon: 'fa-house' },
        { href: 'farm.html', label: 'My Farm', icon: 'fa-tractor' },
        { href: 'ai.html', label: 'AI Assistant', icon: 'fa-robot' },
        { href: 'marketplace.html', label: 'Marketplace', icon: 'fa-shopping-bag' },
        { href: 'monitoring.html', label: 'Smart Monitoring', icon: 'fa-satellite-dish' },
        { href: 'messages.html', label: 'Messages', icon: 'fa-comments' },
        { href: 'weather.html', label: 'Weather', icon: 'fa-cloud-sun' },
        { href: 'map.html', label: 'Farm Map', icon: 'fa-map-location-dot' }
      ];

      var html = '<div class="cmd-section-label"><i class="fas fa-bolt"></i> Quick Access</div>';
      quickPages.forEach(function (item) {
        html += '<div class="cmd-item" data-href="' + item.href + '" tabindex="0">';
        html += '<i class="fas ' + item.icon + '"></i><span class="cmd-item-title">' + escapeHtml(item.label) + '</span>';
        html += '<span class="cmd-item-category">Page</span></div>';
      });
      results.innerHTML = html;
      bindResultClickes();
    }

    function bindResultClickes() {
      results.querySelectorAll('.cmd-item').forEach(function (item) {
        function navigate() {
          var href = item.getAttribute('data-href');
          if (href) window.location.href = href;
        }
        item.addEventListener('click', navigate);
        item.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
        });
      });
    }

    showSuggestions();
  }

  /* ------------------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------------------ */
  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    var menuBtn = document.getElementById('menu-btn');
    if (!sidebar) return;
    var isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isOpen);
    if (backdrop) backdrop.classList.toggle('active', !isOpen);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(!isOpen));
  }

  function closeSidebar() {
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebar-backdrop');
    var menuBtn = document.getElementById('menu-btn');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleCommandPalette() {
    var palette = document.getElementById('cmd-palette-backdrop');
    if (!palette) return;
    palette.classList.toggle('active');
    if (palette.classList.contains('active')) {
      var input = document.getElementById('cmd-search-input');
      if (input) { input.value = ''; input.focus(); }
    }
  }

  function closeCommandPalette() {
    var p = document.getElementById('cmd-palette-backdrop');
    if (p) p.classList.remove('active');
  }

  function navigateTo(href) {
    window.location.href = href;
  }

  function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast-msg ' + type;
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', danger: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
    var icon = icons[type] || icons.success;
    toast.innerHTML = '<i class="fas ' + icon + '"></i><span>' + escapeHtml(message) + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function updateBadge(count) {
    count = typeof count === 'number' ? count : getUnreadCount();
    var badge = document.getElementById('inbox-badge');
    var btn = document.getElementById('inbox-btn');
    if (count > 0) {
      if (badge) {
        badge.textContent = count;
      } else if (btn) {
        var el = document.createElement('span');
        el.className = 'badge';
        el.id = 'inbox-badge';
        el.textContent = count;
        btn.appendChild(el);
      }
    } else if (badge) {
      badge.remove();
    }
  }

  function showProfileDropdown() {
    var menu = document.getElementById('profile-dropdown');
    var avatar = document.getElementById('nav-profile-avatar');
    if (!menu || !avatar) return;
    closeInboxDropdown();
    var r = avatar.getBoundingClientRect();
    menu.style.top = (r.bottom + 8) + 'px';
    menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    menu.style.left = 'auto';
    if (window.innerWidth < 400) {
      menu.style.left = '8px';
      menu.style.right = '8px';
    }
    menu.classList.add('open');
  }

  function showInboxDropdown() {
    var dd = document.getElementById('inbox-dropdown');
    var btn = document.getElementById('inbox-btn');
    if (!dd || !btn) return;
    closeProfileDropdown();
    var r = btn.getBoundingClientRect();
    dd.style.top = (r.bottom + 8) + 'px';
    dd.style.right = Math.max(8, window.innerWidth - r.right - 10) + 'px';
    dd.style.left = 'auto';
    if (window.innerWidth < 600) {
      dd.style.left = '8px';
      dd.style.right = '8px';
    }
    dd.classList.add('open');
    bindInboxFilters();
    bindInboxItems();
  }

  function applyCollapse() {
    var collapsed = isCollapsed();
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }

  function initDefaultCollapseByViewport() {
    if (localStorage.getItem(COLLAPSE_KEY) === null) {
      var w = window.innerWidth;
      setCollapsed(w < 1024);
    }
  }

  /* ------------------------------------------------------------------
     INIT
     ------------------------------------------------------------------ */
  function init() {
    if (isLoginPage()) return;

    removeExistingNav();

    injectTopBar();
    injectBackdrop();
    injectSidebar();
    injectBottomNav();
    injectInboxDropdown();
    injectProfileDropdown();
    injectCommandPalette();
    injectToastContainer();

    initDefaultCollapseByViewport();
    applyCollapse();

    bindEvents();

    var displayName = localStorage.getItem('user-display-name');
    if (displayName) {
      var sidebarName = document.getElementById('sidebar-name');
      if (sidebarName) sidebarName.textContent = displayName;
    }

    console.log('[Farm Assist Navigation] v6.0 Initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.Navigation = {
    init: init,
    navigateTo: navigateTo,
    showToast: showToast,
    updateBadge: updateBadge,
    showProfileDropdown: showProfileDropdown,
    showInboxDropdown: showInboxDropdown,
    NAV: NAV,
    BOTTOM_NAV: BOTTOM_NAV
  };

  global.showToast = showToast;

})(window);
