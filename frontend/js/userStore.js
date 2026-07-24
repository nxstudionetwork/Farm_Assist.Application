/* ========================================================================
   FARM ASSIST - CENTRAL USER STORE (frontend-only, backend-ready)
   Single source of truth for the logged-in user + profile synchronization.
   Backend integration: swap the localStorage calls in _read/_persist and
   the api.* stubs for real fetch() calls. Everything else stays the same.
   ======================================================================== */
(function (global) {
  'use strict';

  var KEYS = {
    users: 'fa-users',            // all registered accounts (mock DB)
    current: 'fa-current-user',   // logged-in user id/email
    auth: 'fa-auth',              // auth flag
    onboarded: 'fa-onboarded',    // onboarding completed flag (per user)
    prefs: 'fa-prefs'             // dashboard/user preferences
  };

  function _read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function _persist(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function getUsers() { return _read(KEYS.users, []); }
  function saveUsers(list) { _persist(KEYS.users, list); }

  // Compute initials from a full name: "Ramesh Kumar" -> "RK", "Suresh" -> "S"
  function initialsFor(name) {
    var n = (name || 'Farmer').trim();
    if (!n) return 'F';
    var parts = n.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // Returns an uploaded photo if present, else a generated SVG initials avatar (data URI).
  function avatarFor(user) {
    if (user && user.photo && /^data:|^https?:\/\//.test(user.photo)) return user.photo;
    return initialsSvg(initialsFor(user && user.fullName));
  }

  function initialsSvg(initials) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#2D8659"/><stop offset="1" stop-color="#1B5E3F"/>' +
      '</linearGradient></defs>' +
      '<rect width="100" height="100" rx="50" fill="url(#g)"/>' +
      '<text x="50" y="50" dy="0.35em" text-anchor="middle" ' +
      'font-family="Outfit, Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">' +
      initials + '</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function makeFarmerId(state) {
    var st = (state || 'IN').substring(0, 2).toUpperCase();
    return 'FA-' + st + '-' + Date.now().toString().slice(-6);
  }

  var UserStore = {
    KEYS: KEYS,

    /* ---- Registration ---------------------------------------------- */
    register: function (data) {
      var users = getUsers();
      var email = (data.email || '').trim().toLowerCase();
      if (email && users.some(function (u) { return u.email === email; })) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      var user = {
        id: 'U' + Date.now(),
        fullName: data.fullName || 'Farmer',
        email: email,
        phone: data.phone || '',
        password: data.password || '',           // mock only
        farmerId: data.farmerId || makeFarmerId(data.state),
        role: data.role || 'farmer',
        state: data.state || '',
        district: data.district || '',
        village: data.village || '',
        language: data.language || 'English',
        farmName: data.farmName || (data.fullName ? data.fullName.split(' ')[0] + "'s Farm" : 'My Farm'),
        farmSize: data.farmSize || '',
        primaryCrop: data.primaryCrop || '',
        photo: (data.photo && /^data:|^https?:\/\//.test(data.photo)) ? data.photo : '',
        createdAt: new Date().toISOString(),
        farms: []
      };
      user.farms.push({
        id: 'F' + Date.now(),
        name: user.farmName,
        size: user.farmSize || '10 Acres',
        crop: user.primaryCrop || 'Mixed',
        location: [user.village, user.district, user.state].filter(Boolean).join(', ') || 'India',
        isDefault: true
      });
      users.push(user);
      saveUsers(users);
      return { ok: true, user: user };
    },

    /* ---- Authentication -------------------------------------------- */
    login: function (identifier, password) {
      var users = getUsers();
      var id = (identifier || '').trim().toLowerCase();
      var user = users.filter(function (u) {
        return u.email === id || u.phone === identifier || u.farmerId === identifier;
      })[0];
      if (!user) return { ok: false, error: 'No account found. Please sign up first.' };
      if (password != null && user.password && user.password !== password) {
        return { ok: false, error: 'Incorrect password.' };
      }
      this.setSession(user);
      return { ok: true, user: user };
    },

    setSession: function (user) {
      _persist(KEYS.current, user.id);
      localStorage.setItem(KEYS.auth, 'true');
      localStorage.setItem('user-logged-in', 'true');        // legacy compatibility
      localStorage.setItem('session-last-activity', Date.now().toString());
      localStorage.setItem('user-role', user.role || 'farmer');
      localStorage.setItem('user-name', user.fullName || 'Farmer');
    },

    logout: function () {
      localStorage.removeItem(KEYS.current);
      localStorage.removeItem(KEYS.auth);
      localStorage.removeItem('user-logged-in');
      localStorage.removeItem('session-last-activity');
      sessionStorage.clear();
    },

    isLoggedIn: function () {
      return localStorage.getItem(KEYS.auth) === 'true' || localStorage.getItem('user-logged-in') === 'true';
    },

    /* ---- Current user ---------------------------------------------- */
    getCurrentUser: function () {
      var id = _read(KEYS.current, null);
      var users = getUsers();
      var user = id ? users.filter(function (u) { return u.id === id; })[0] : null;
      if (user) return user;
      // Fallback guest (never a fake person name)
      if (this.isLoggedIn()) {
        var nm = localStorage.getItem('user-name') || 'Farmer';
        var g = { id: 'guest', fullName: nm, email: '', phone: '', farmerId: 'GUEST',
          role: localStorage.getItem('user-role') || 'farmer', state: '', district: '', village: '',
          language: 'English', farmName: 'My Farm', farmSize: '', primaryCrop: '', photo: '', farms: [] };
        return g;
      }
      return null;
    },

    updateCurrentUser: function (patch) {
      var users = getUsers();
      var id = _read(KEYS.current, null);
      var idx = users.findIndex(function (u) { return u.id === id; });
      if (idx === -1) return null;
      users[idx] = Object.assign({}, users[idx], patch);
      if (patch.photo && /^data:|^https?:\/\//.test(patch.photo)) users[idx].photo = patch.photo;
      saveUsers(users);
      if (patch.fullName) localStorage.setItem('user-name', patch.fullName);
      this.hydrate();
      return users[idx];
    },

    avatarFor: avatarFor,
    initialsFor: initialsFor,

    /* ---- Preferences ----------------------------------------------- */
    getPrefs: function () {
      return _read(KEYS.prefs, {
        defaultFarm: null, language: 'English', units: 'metric',
        favorites: [], weatherLocation: '', notifications: true, layout: 'default'
      });
    },
    setPrefs: function (patch) {
      var p = Object.assign(this.getPrefs(), patch);
      _persist(KEYS.prefs, p);
      return p;
    },

    /* ---- Onboarding ------------------------------------------------ */
    hasOnboarded: function () {
      var u = this.getCurrentUser();
      var done = _read(KEYS.onboarded, {});
      return u ? !!done[u.id] : false;
    },
    markOnboarded: function () {
      var u = this.getCurrentUser();
      if (!u) return;
      var done = _read(KEYS.onboarded, {});
      done[u.id] = true;
      _persist(KEYS.onboarded, done);
    },

    /* ---- DOM SYNCHRONIZATION --------------------------------------
       Any element with data-user="field" gets the value.
       Any <img data-user-avatar> gets the avatar.
       data-user-farm="name|size|crop|location" gets default farm info.
       [data-user-greet] gets "Hello, <first name>".
    ---------------------------------------------------------------- */
    hydrate: function () {
      var u = this.getCurrentUser();
      if (!u) return;
      var defFarm = (u.farms && u.farms.length) ? (u.farms.filter(function (f) { return f.isDefault; })[0] || u.farms[0]) : null;

      document.querySelectorAll('[data-user]').forEach(function (el) {
        var field = el.getAttribute('data-user');
        var val = u[field];
        if (val == null || val === '') val = el.getAttribute('data-user-empty') || val;
        if (val != null && val !== '') el.textContent = val;
      });
      document.querySelectorAll('[data-user-greet]').forEach(function (el) {
        var first = (u.fullName || 'Farmer').split(' ')[0];
        el.textContent = 'Hello, ' + first;
      });
      document.querySelectorAll('img[data-user-avatar]').forEach(function (img) {
        img.src = avatarFor(u);
        img.alt = u.fullName + ' avatar';
      });
      if (defFarm) {
        document.querySelectorAll('[data-user-farm]').forEach(function (el) {
          var f = el.getAttribute('data-user-farm');
          if (defFarm[f] != null && defFarm[f] !== '') el.textContent = defFarm[f];
        });
      }
    }
  };

  global.UserStore = UserStore;

  // Auto-hydrate on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { UserStore.hydrate(); });
  } else {
    UserStore.hydrate();
  }
})(window);
