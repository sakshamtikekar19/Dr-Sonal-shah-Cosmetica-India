(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  var configStatus = document.getElementById('config-status');
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
    if (configStatus) configStatus.innerHTML = '<span style="color:#b91c1c;">Missing Supabase config. Edit <strong>booking-config.js</strong> with your Supabase URL and anon key.</span>';
    return;
  }

  var supabase = window.supabase && window.supabase.createClient && window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  if (!supabase) {
    if (configStatus) configStatus.innerHTML = '<span style="color:#b91c1c;">Supabase failed to load. Open this page via a web server (e.g. <code>npx serve .</code>) not as file://</span>';
    return;
  }
  if (configStatus) configStatus.textContent = 'First time? Create an admin user in Supabase: Authentication → Users → Add user.';

  var loginScreen = document.getElementById('login-screen');
  var adminScreen = document.getElementById('admin-screen');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var logoutBtn = document.getElementById('logout-btn');
  var bookingsTbody = document.getElementById('bookings-tbody');
  var bookingsCount = document.getElementById('bookings-count');
  var emptyState = document.getElementById('empty-state');
  var editModal = document.getElementById('edit-modal');
  var editForm = document.getElementById('edit-form');
  var modalClose = document.getElementById('modal-close');
  var editCancel = document.getElementById('edit-cancel');

  function showLogin() {
    loginScreen.style.display = 'block';
    adminScreen.style.display = 'none';
  }

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    loadBookings();
  }

  function loadBookings() {
    supabase.from('bookings').select('*').order('preferred_date', { ascending: false }).order('preferred_time', { ascending: true })
      .then(function (result) {
        var data = result.data || [];
        if (result.error) throw result.error;
        bookingsCount.textContent = data.length + ' appointment(s)';
        emptyState.style.display = data.length === 0 ? 'block' : 'none';
        bookingsTbody.closest('.bookings-table-wrap').style.display = data.length === 0 ? 'none' : 'block';
        bookingsTbody.innerHTML = data.map(function (row) {
          return '<tr data-id="' + row.id + '">' +
            '<td>' + escapeHtml(row.preferred_date || '') + '</td>' +
            '<td>' + escapeHtml(row.preferred_time || '') + '</td>' +
            '<td>' + escapeHtml(row.name || '') + '</td>' +
            '<td>' + escapeHtml(row.phone || '') + '</td>' +
            '<td>' + escapeHtml(row.email || '') + '</td>' +
            '<td>' + escapeHtml(row.service || '') + '</td>' +
            '<td>' + escapeHtml(row.follow_up_date || '') + '</td>' +
            '<td>' + escapeHtml((row.message || '').slice(0, 40)) + (row.message && row.message.length > 40 ? '…' : '') + '</td>' +
            '<td><button type="button" class="btn btn-primary btn-sm edit-btn">Edit</button> <button type="button" class="btn btn-secondary btn-sm delete-btn">Delete</button></td>' +
            '</tr>';
        }).join('');
        bindRowActions(data);
      })
      .catch(function (err) {
        bookingsCount.textContent = 'Error loading appointments';
        emptyState.style.display = 'none';
        var wrap = bookingsTbody.closest('.bookings-table-wrap');
        if (wrap) wrap.style.display = 'block';
        bookingsTbody.innerHTML = '<tr><td colspan="9" style="color:#b91c1c; padding: 1.5rem;">' + escapeHtml(err.message || 'Failed to load') + '</td></tr>';
      });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function bindRowActions(data) {
    var rows = bookingsTbody.querySelectorAll('tr[data-id]');
    rows.forEach(function (tr, i) {
      var row = data[i];
      if (!row) return;
      tr.querySelector('.edit-btn').addEventListener('click', function () { openEditModal(row); });
      tr.querySelector('.delete-btn').addEventListener('click', function () { deleteBooking(row); });
    });
  }

  function openEditModal(row) {
    document.getElementById('edit-id').value = row.id;
    document.getElementById('edit-date').value = row.preferred_date || '';
    document.getElementById('edit-time').value = row.preferred_time || '';
    document.getElementById('edit-name').value = row.name || '';
    document.getElementById('edit-phone').value = row.phone || '';
    document.getElementById('edit-email').value = row.email || '';
    document.getElementById('edit-service').value = row.service || '';
    document.getElementById('edit-follow-up-date').value = row.follow_up_date || '';
    document.getElementById('edit-message').value = row.message || '';
    editModal.classList.remove('hidden');
    editModal.setAttribute('aria-hidden', 'false');
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
    editModal.setAttribute('aria-hidden', 'true');
  }

  function deleteBooking(row) {
    if (!confirm('Delete this appointment?\n' + (row.preferred_date || '') + ' ' + (row.preferred_time || '') + ' – ' + (row.name || ''))) return;
    // Send WhatsApp cancellation first (fire-and-forget), then delete
    var config = window.BOOKING_CONFIG;
    supabase.functions.invoke('send-whatsapp', {
      headers: {
        'Authorization': 'Bearer ' + (config && config.supabaseAnonKey ? config.supabaseAnonKey : '')
      },
      body: {
        type: 'cancel',
        phone: row.phone,
        name: row.name,
        preferred_date: row.preferred_date,
        preferred_time: row.preferred_time
      }
    }).catch(function () { /* ignore */ });
    supabase.from('bookings').delete().eq('id', row.id)
      .then(function (result) {
        if (result.error) throw result.error;
        loadBookings();
        setTimeout(function () { alert('Booking deleted. A WhatsApp cancellation has been sent to the customer.'); }, 300);
      })
      .catch(function (err) {
        alert('Could not delete: ' + (err.message || 'Unknown error'));
      });
  }

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginError.textContent = '';
    var email = document.getElementById('admin-email').value.trim();
    var password = document.getElementById('admin-password').value;
    supabase.auth.signInWithPassword({ email: email, password: password })
      .then(function (result) {
        if (result.error) throw result.error;
        showAdmin();
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : 'Login failed';
        if (msg.toLowerCase().indexOf('invalid') !== -1 || msg.toLowerCase().indexOf('credentials') !== -1) {
          msg = 'Invalid email or password. Create an admin user in Supabase: Authentication → Users → Add user.';
        }
        loginError.textContent = msg;
      });
  });

  if (logoutBtn) logoutBtn.addEventListener('click', function () {
    supabase.auth.signOut().then(function () { showLogin(); });
  });

  editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('edit-id').value;
    var payload = {
      preferred_date: document.getElementById('edit-date').value,
      preferred_time: document.getElementById('edit-time').value,
      name: document.getElementById('edit-name').value.trim(),
      phone: document.getElementById('edit-phone').value.trim(),
      email: document.getElementById('edit-email').value.trim() || null,
      service: document.getElementById('edit-service').value.trim() || null,
      follow_up_date: document.getElementById('edit-follow-up-date').value || null,
      message: document.getElementById('edit-message').value.trim() || null
    };
    supabase.from('bookings').update(payload).eq('id', id)
      .then(function (result) {
        if (result.error) throw result.error;
        closeEditModal();
        loadBookings();
      })
      .catch(function (err) {
        alert('Could not update: ' + (err.message || 'Unknown error'));
      });
  });

  if (modalClose) modalClose.addEventListener('click', closeEditModal);
  if (editCancel) editCancel.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', function (e) {
    if (e.target === editModal) closeEditModal();
  });

  supabase.auth.getSession().then(function (result) {
    if (result.data && result.data.session) showAdmin();
    else showLogin();
  }).catch(function () {
    showLogin();
  });
})();
