/*
================================================================================
FARM ASSIST - BACKEND-READY SERVICE LAYER
--------------------------------------------------------------------------------
This module is the SINGLE data-access boundary for the whole app. Every UI screen
should call these services instead of touching FarmDB / localStorage directly.

Today each method resolves against the in-memory mock database (FarmDB) and the
browser storage. Tomorrow, when a real backend exists (FastAPI / Django / Node),
ONLY the private `http()` helper and the body of each method need to change to
`return http('GET', '/api/workers')` etc. The UI signatures (Promise-returning
functions) stay identical, so no screen has to be rewritten.

Design rules:
  - Every public method returns a Promise (async), mirroring real network calls.
  - A small simulated latency makes loading states realistic.
  - Storage keys are centralised in Storage so migration is trivial.
================================================================================
*/
(function (global) {
  'use strict';

  var DB = global.FarmDB || {};

  /* ----------------------------------------------------------------------
   * Config - flip USE_REMOTE to true once a backend is wired up.
   * -------------------------------------------------------------------- */
  var Config = {
    USE_REMOTE: false,
    BASE_URL: '/api',
    LATENCY: 220 // ms of simulated network delay for mock mode
  };

  /* ----------------------------------------------------------------------
   * Low-level helpers
   * -------------------------------------------------------------------- */
  function delay(value) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(value); }, Config.LATENCY);
    });
  }

  // The ONLY place that changes when moving to a real backend.
  function http(method, path, body) {
    if (!Config.USE_REMOTE) {
      return Promise.reject(new Error('Remote disabled - mock mode'));
    }
    return fetch(Config.BASE_URL + path, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (Storage.get('fa-auth-token') || '') },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // Resolve either from remote or from a mock producer.
  function resolve(method, path, mockFn, body) {
    if (Config.USE_REMOTE) return http(method, path, body);
    try { return delay(mockFn()); }
    catch (e) { return Promise.reject(e); }
  }

  function clone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
  }

  function paginate(list, page, perPage) {
    page = page || 1; perPage = perPage || 20;
    var start = (page - 1) * perPage;
    return {
      page: page,
      perPage: perPage,
      total: list.length,
      totalPages: Math.ceil(list.length / perPage),
      items: list.slice(start, start + perPage)
    };
  }

  /* ----------------------------------------------------------------------
   * Storage - centralised persistence utility (LocalStorage / Session)
   * -------------------------------------------------------------------- */
  var Storage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return fallback === undefined ? null : fallback;
        try { return JSON.parse(raw); } catch (e) { return raw; }
      } catch (e) { return fallback === undefined ? null : fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) { try { localStorage.removeItem(key); } catch (e) {} },
    session: {
      get: function (key, fallback) {
        try { var raw = sessionStorage.getItem(key); return raw === null ? (fallback === undefined ? null : fallback) : JSON.parse(raw); }
        catch (e) { return fallback === undefined ? null : fallback; }
      },
      set: function (key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
    }
  };

  /* ----------------------------------------------------------------------
   * AuthService - delegates to UserStore where present
   * -------------------------------------------------------------------- */
  var AuthService = {
    login: function (credentials) {
      return resolve('POST', '/auth/login', function () {
        if (global.UserStore && UserStore.login) {
          var u = UserStore.login(credentials.identifier, credentials.password);
          if (!u) throw new Error('Invalid credentials');
          return { user: u, token: 'mock-' + Date.now() };
        }
        return { user: { fullName: 'Farmer' }, token: 'mock-' + Date.now() };
      }, credentials);
    },
    register: function (payload) {
      return resolve('POST', '/auth/register', function () {
        if (global.UserStore && UserStore.register) return { user: UserStore.register(payload), token: 'mock-' + Date.now() };
        return { user: payload, token: 'mock-' + Date.now() };
      }, payload);
    },
    logout: function () {
      return resolve('POST', '/auth/logout', function () {
        if (global.UserStore && UserStore.logout) UserStore.logout();
        return { ok: true };
      });
    },
    currentUser: function () {
      return resolve('GET', '/auth/me', function () {
        return global.UserStore && UserStore.getCurrentUser ? UserStore.getCurrentUser() : null;
      });
    }
  };

  /* ----------------------------------------------------------------------
   * Generic CRUD-ish list service factory (used by simple modules)
   * -------------------------------------------------------------------- */
  function listService(collection, path) {
    return {
      list: function (opts) {
        opts = opts || {};
        return resolve('GET', path, function () {
          var data = clone(DB[collection] || []);
          if (opts.filter) data = data.filter(opts.filter);
          if (opts.sort) data.sort(opts.sort);
          if (opts.page || opts.perPage) return paginate(data, opts.page, opts.perPage);
          return data;
        });
      },
      get: function (id) {
        return resolve('GET', path + '/' + id, function () {
          return clone((DB[collection] || []).filter(function (x) { return String(x.id) === String(id); })[0] || null);
        });
      },
      count: function () {
        return resolve('GET', path + '/count', function () { return (DB[collection] || []).length; });
      }
    };
  }

  /* ----------------------------------------------------------------------
   * WorkerService - richer domain logic + bookings
   * -------------------------------------------------------------------- */
  var BOOKINGS_KEY = 'fa-worker-bookings';
  var SAVED_WORKERS_KEY = 'fa-saved-workers';

  var WorkerService = {
    list: function (opts) {
      opts = opts || {};
      return resolve('GET', '/workers', function () {
        var data = clone(DB.workers || []);
        if (opts.category && opts.category !== 'all') data = data.filter(function (w) { return w.category === opts.category; });
        if (opts.query) {
          var q = opts.query.toLowerCase();
          data = data.filter(function (w) {
            return w.name.toLowerCase().indexOf(q) > -1 ||
              (w.skills || []).join(' ').toLowerCase().indexOf(q) > -1 ||
              (w.location || '').toLowerCase().indexOf(q) > -1;
          });
        }
        if (opts.availableOnly) data = data.filter(function (w) { return w.available; });
        if (opts.verifiedOnly) data = data.filter(function (w) { return w.verified; });
        if (opts.sort === 'rating') data.sort(function (a, b) { return parseFloat(b.rating) - parseFloat(a.rating); });
        if (opts.sort === 'wage') data.sort(function (a, b) { return a.dailyWage - b.dailyWage; });
        if (opts.sort === 'distance') data.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
        return data;
      });
    },
    get: function (id) {
      return resolve('GET', '/workers/' + id, function () {
        return clone((DB.workers || []).filter(function (w) { return w.id === id; })[0] || null);
      });
    },
    categories: function () {
      return resolve('GET', '/workers/categories', function () {
        var map = {};
        (DB.workers || []).forEach(function (w) { map[w.category] = (map[w.category] || 0) + 1; });
        return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; });
      });
    },
    estimateCost: function (dailyWage, days) {
      var base = dailyWage * days;
      var serviceFee = Math.round(base * 0.05);
      return { base: base, serviceFee: serviceFee, total: base + serviceFee };
    },
    book: function (booking) {
      return resolve('POST', '/workers/bookings', function () {
        var all = Storage.get(BOOKINGS_KEY, []);
        booking.id = 'BKG-' + Date.now();
        booking.status = 'Confirmed';
        booking.createdAt = new Date().toISOString();
        all.unshift(booking);
        Storage.set(BOOKINGS_KEY, all);
        return booking;
      }, booking);
    },
    myBookings: function () {
      return resolve('GET', '/workers/bookings', function () { return Storage.get(BOOKINGS_KEY, []); });
    },
    cancelBooking: function (id) {
      return resolve('DELETE', '/workers/bookings/' + id, function () {
        var all = Storage.get(BOOKINGS_KEY, []).filter(function (b) { return b.id !== id; });
        Storage.set(BOOKINGS_KEY, all);
        return { ok: true };
      });
    },
    toggleSaved: function (id) {
      var saved = Storage.get(SAVED_WORKERS_KEY, []);
      var idx = saved.indexOf(id);
      if (idx > -1) saved.splice(idx, 1); else saved.push(id);
      Storage.set(SAVED_WORKERS_KEY, saved);
      return saved.indexOf(id) > -1;
    },
    isSaved: function (id) { return Storage.get(SAVED_WORKERS_KEY, []).indexOf(id) > -1; },
    savedWorkers: function () {
      return resolve('GET', '/workers/saved', function () {
        var saved = Storage.get(SAVED_WORKERS_KEY, []);
        return clone((DB.workers || []).filter(function (w) { return saved.indexOf(w.id) > -1; }));
      });
    }
  };

  /* ----------------------------------------------------------------------
   * Domain services (mock-backed today, REST-ready tomorrow)
   * -------------------------------------------------------------------- */
  var FarmService = listService('farms', '/farms');
  FarmService.plots = function (farmId) {
    return resolve('GET', '/farms/' + farmId + '/plots', function () {
      var plots = clone(DB.plots || []);
      return farmId ? plots.filter(function (p) { return String(p.farmId) === String(farmId); }) : plots;
    });
  };

  var WeatherService = {
    forecast: function (days) {
      return resolve('GET', '/weather/forecast', function () {
        return clone((DB.weatherData || []).slice(0, days || 7));
      });
    },
    history: function () {
      return resolve('GET', '/weather/history', function () { return clone(DB.weatherData || []); });
    }
  };

  var MarketplaceService = listService('products', '/products');
  MarketplaceService.orders = listService('orders', '/orders').list;
  MarketplaceService.prices = function () {
    return resolve('GET', '/market-prices', function () { return clone(DB.marketPrices || []); });
  };

  var NotificationService = listService('notifications', '/notifications');
  NotificationService.unreadCount = function () {
    return resolve('GET', '/notifications/unread', function () {
      return (DB.notifications || []).filter(function (n) { return !n.read; }).length;
    });
  };

  var GovernmentService = listService('govSchemes', '/schemes');
  var FinanceService = listService('transactions', '/transactions');
  FinanceService.summary = function () {
    return resolve('GET', '/transactions/summary', function () {
      var tx = DB.transactions || [];
      var income = 0, expense = 0;
      tx.forEach(function (t) { if (t.type === 'income') income += t.amount; else expense += t.amount; });
      return { income: income, expense: expense, net: income - expense, count: tx.length };
    });
  };

  var ExpertService = listService('experts', '/experts');
  var NewsService = listService('news', '/news');
  var CommunityService = listService('posts', '/posts');
  var LivestockService = listService('livestock', '/livestock');
  var EquipmentService = listService('equipmentRentals', '/equipment');
  var LearningService = listService('courses', '/courses');
  var DocumentService = listService('documents', '/documents');

  var AIService = {
    diagnose: function (imageMeta) {
      return resolve('POST', '/ai/diagnose', function () {
        var diseases = DB.cropDiseases || [];
        var pick = diseases[Math.floor(Math.random() * diseases.length)] || { name: 'Healthy', confidence: 98 };
        return { result: pick, confidence: (85 + Math.floor(Math.random() * 14)), analyzedAt: new Date().toISOString() };
      }, imageMeta);
    },
    recommend: function (context) {
      return resolve('POST', '/ai/recommend', function () {
        return clone((DB.suggestions || []).slice(0, 5));
      }, context);
    }
  };

  /* ----------------------------------------------------------------------
   * Public API
   * -------------------------------------------------------------------- */
  global.API = {
    config: Config,
    Storage: Storage,
    Auth: AuthService,
    Farm: FarmService,
    Worker: WorkerService,
    Weather: WeatherService,
    Marketplace: MarketplaceService,
    Notification: NotificationService,
    Government: GovernmentService,
    Finance: FinanceService,
    Expert: ExpertService,
    News: NewsService,
    Community: CommunityService,
    Livestock: LivestockService,
    Equipment: EquipmentService,
    Learning: LearningService,
    Document: DocumentService,
    AI: AIService
  };

  // Friendly aliases matching the spec naming.
  global.AuthService = AuthService;
  global.FarmService = FarmService;
  global.WorkerService = WorkerService;
  global.WeatherService = WeatherService;
  global.MarketplaceService = MarketplaceService;
  global.NotificationService = NotificationService;
  global.GovernmentService = GovernmentService;
  global.FinanceService = FinanceService;
  global.AIService = AIService;

})(window);
