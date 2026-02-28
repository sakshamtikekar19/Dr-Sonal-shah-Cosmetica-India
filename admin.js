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

  var currentFilter = 'upcoming';
  var allBookingsData = [];

  function showLogin() {
    loginScreen.style.display = 'block';
    adminScreen.style.display = 'none';
  }

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminScreen.style.display = 'block';
    loadBookings();
    
    // Force Block Dates button to be visible
    setTimeout(function() {
      var btn = document.getElementById('block-dates-btn');
      if (btn) {
        console.log('Block Dates button found and made visible');
        btn.style.display = 'inline-block';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        btn.style.position = 'relative';
        btn.style.zIndex = '10';
      } else {
        console.error('Block Dates button NOT found - check HTML');
        // Try to find it again
        var toolbar = document.querySelector('.bookings-toolbar');
        if (toolbar) {
          console.log('Toolbar found, creating button manually');
          var manualBtn = document.createElement('button');
          manualBtn.type = 'button';
          manualBtn.className = 'btn btn-secondary';
          manualBtn.id = 'block-dates-btn';
          manualBtn.textContent = '🔒 Block Dates';
          manualBtn.style.cssText = 'display: inline-block !important; background: var(--teal) !important; color: var(--white) !important; padding: 0.5rem 1rem !important; margin-left: auto !important;';
          toolbar.appendChild(manualBtn);
          manualBtn.addEventListener('click', openBlockDatesModal);
        }
      }
    }, 100);
  }

  /** Normalize slot end: 01:00/02:00 = 1–2 PM, 06–09 = 6–9 PM (24h) for correct past check. */
  function slotEndTo24h(timeStr) {
    var m = (timeStr || '').trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return '23:59';
    var h = parseInt(m[1], 10);
    if (h >= 1 && h <= 9) h += 12;
    if (h === 24) h = 12;
    return (h < 10 ? '0' : '') + h + ':' + m[2];
  }

  /** True if the appointment's slot end (date + end of preferred_time) is in the past (local time). */
  function isPastBooking(row) {
    var dateStr = (row.preferred_date || '').trim();
    var slot = (row.preferred_time || '').trim();
    var endPart = slot.indexOf('-') !== -1 ? slot.split('-')[1].trim() : '23:59';
    var end24 = slotEndTo24h(endPart);
    var endStr = dateStr + 'T' + end24;
    var endMs = new Date(endStr).getTime();
    return endMs <= Date.now();
  }

  function applyFilter() {
    var filtered = currentFilter === 'upcoming' ? allBookingsData.filter(function (r) { return !isPastBooking(r); })
      : currentFilter === 'past' ? allBookingsData.filter(isPastBooking)
      : allBookingsData;
    var label = currentFilter === 'upcoming' ? 'upcoming' : currentFilter === 'past' ? 'past' : 'total';
    bookingsCount.textContent = filtered.length + ' ' + label + ' appointment(s)';
    emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
    if (emptyState) {
      var firstP = emptyState.querySelector('p');
      if (firstP) {
        firstP.textContent = currentFilter === 'upcoming' ? 'No upcoming appointments.' : currentFilter === 'past' ? 'No past appointments.' : 'No appointments yet.';
      }
    }
    bookingsTbody.closest('.bookings-table-wrap').style.display = filtered.length === 0 ? 'none' : 'block';
    if (filtered.length === 0) {
      bookingsTbody.innerHTML = '';
      return;
    }
    bookingsTbody.innerHTML = filtered.map(function (row) {
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
    bindRowActions(filtered);
  }

  function loadBookings() {
    supabase.from('bookings').select('*').order('preferred_date', { ascending: false }).order('preferred_time', { ascending: true })
      .then(function (result) {
        if (result.error) throw result.error;
        allBookingsData = result.data || [];
        applyFilter();
      })
      .catch(function (err) {
        bookingsCount.textContent = 'Error loading appointments';
        emptyState.style.display = 'none';
        var wrap = bookingsTbody.closest('.bookings-table-wrap');
        if (wrap) wrap.style.display = 'block';
        bookingsTbody.innerHTML = '<tr><td colspan="9" style="color:#b91c1c; padding: 1.5rem;">' + escapeHtml(err.message || 'Failed to load') + '</td></tr>';
      });
  }

  function setActiveTab(filter) {
    currentFilter = filter;
    var tabs = document.querySelectorAll('.bookings-tab');
    tabs.forEach(function (tab) {
      var isActive = (tab.getAttribute('data-filter') || '') === filter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    applyFilter();
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

  // Add booking
  var addBookingBtn = document.getElementById('add-booking-btn');
  var addBookingModal = document.getElementById('add-booking-modal');
  var addBookingForm = document.getElementById('add-booking-form');
  var addBookingStatus = document.getElementById('add-booking-status');
  var addDateInput = document.getElementById('add-date');
  var addBookingModalClose = document.getElementById('add-booking-modal-close');
  var addBookingCancel = document.getElementById('add-booking-cancel');

  function openAddBookingModal() {
    if (!addBookingModal) return;
    var today = new Date().toISOString().split('T')[0];
    if (addDateInput) addDateInput.min = today;
    if (addBookingStatus) addBookingStatus.textContent = '';
    if (addBookingForm) addBookingForm.reset();
    addBookingModal.classList.remove('hidden');
    addBookingModal.setAttribute('aria-hidden', 'false');
  }

  function closeAddBookingModal() {
    if (!addBookingModal) return;
    addBookingModal.classList.add('hidden');
    addBookingModal.setAttribute('aria-hidden', 'true');
    if (addBookingForm) addBookingForm.reset();
    if (addBookingStatus) addBookingStatus.textContent = '';
  }

  if (addBookingBtn) addBookingBtn.addEventListener('click', openAddBookingModal);
  if (addBookingModalClose) addBookingModalClose.addEventListener('click', closeAddBookingModal);
  if (addBookingCancel) addBookingCancel.addEventListener('click', closeAddBookingModal);
  if (addBookingModal) addBookingModal.addEventListener('click', function (e) { if (e.target === addBookingModal) closeAddBookingModal(); });

  if (addBookingForm) {
    addBookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (addBookingStatus) addBookingStatus.textContent = 'Saving…';
      var payload = {
        preferred_date: document.getElementById('add-date').value,
        preferred_time: document.getElementById('add-time').value,
        name: document.getElementById('add-name').value.trim(),
        phone: document.getElementById('add-phone').value.trim(),
        email: document.getElementById('add-email').value.trim() || null,
        service: document.getElementById('add-service').value.trim() || null,
        follow_up_date: document.getElementById('add-follow-up-date').value || null,
        message: document.getElementById('add-message').value.trim() || null
      };
      supabase.from('bookings').insert(payload)
        .then(function (result) {
          if (result.error) throw result.error;
          closeAddBookingModal();
          loadBookings();
          if (addBookingStatus) addBookingStatus.textContent = '';
          alert('Booking added. The slot is now reserved.');
          var config = window.BOOKING_CONFIG;
          if (config && config.supabaseAnonKey && payload.phone) {
            supabase.functions.invoke('send-whatsapp', {
              headers: { 'Authorization': 'Bearer ' + config.supabaseAnonKey },
              body: {
                type: 'confirm',
                phone: payload.phone,
                name: payload.name,
                preferred_date: payload.preferred_date,
                preferred_time: payload.preferred_time
              }
            }).catch(function () {});
          }
        })
        .catch(function (err) {
          var msg = err && err.message ? err.message : 'Failed to add booking';
          if (msg.indexOf('duplicate') !== -1 || msg.indexOf('unique') !== -1) {
            msg = 'This date and time slot is already booked. Please choose another slot.';
          }
          if (addBookingStatus) addBookingStatus.textContent = msg;
        });
    });
  }

  document.querySelectorAll('.bookings-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setActiveTab((btn.getAttribute('data-filter') || 'upcoming'));
    });
  });

  editModal.addEventListener('click', function (e) {
    if (e.target === editModal) closeEditModal();
  });

  // Block Dates functionality
  var blockDatesBtn = document.getElementById('block-dates-btn');
  var blockDatesModal = document.getElementById('block-dates-modal');
  var blockDatesForm = document.getElementById('block-dates-form');
  var blockModalClose = document.getElementById('block-modal-close');
  var blockCancel = document.getElementById('block-cancel');
  var blockDateInput = document.getElementById('block-date');
  var blockedDatesList = document.getElementById('blocked-dates-list');
  
  // Debug: Check if button exists
  if (!blockDatesBtn) {
    console.warn('Block Dates button not found in DOM');
  } else {
    console.log('Block Dates button found');
  }

  // Handle block type toggle (defined outside so it's not recreated each time)
  function toggleBlockType() {
    var blockTypeSingle = document.getElementById('block-type-single');
    var blockTypeRange = document.getElementById('block-type-range');
    var singleDateRow = document.getElementById('single-date-row');
    var rangeDateRow = document.getElementById('range-date-row');
    var blockDateFrom = document.getElementById('block-date-from');
    var blockDateTo = document.getElementById('block-date-to');
    
    if (!blockTypeSingle || !blockTypeRange || !singleDateRow || !rangeDateRow) return;
    
    if (blockTypeSingle.checked) {
      singleDateRow.style.display = 'block';
      rangeDateRow.style.display = 'none';
      if (blockDateInput) blockDateInput.required = true;
      if (blockDateFrom) blockDateFrom.required = false;
      if (blockDateTo) blockDateTo.required = false;
    } else {
      singleDateRow.style.display = 'none';
      rangeDateRow.style.display = 'block';
      if (blockDateInput) blockDateInput.required = false;
      if (blockDateFrom) blockDateFrom.required = true;
      if (blockDateTo) blockDateTo.required = true;
    }
  }

  function openBlockDatesModal() {
    if (!blockDatesModal) return;
    // Set minimum date to today
    var today = new Date().toISOString().split('T')[0];
    if (blockDateInput) {
      blockDateInput.min = today;
    }
    var blockDateFrom = document.getElementById('block-date-from');
    var blockDateTo = document.getElementById('block-date-to');
    if (blockDateFrom) blockDateFrom.min = today;
    if (blockDateTo) blockDateTo.min = today;
    
    // Set initial state
    var blockTypeSingle = document.getElementById('block-type-single');
    if (blockTypeSingle) {
      blockTypeSingle.checked = true;
    }
    toggleBlockType();
    
    blockDatesModal.classList.remove('hidden');
    blockDatesModal.setAttribute('aria-hidden', 'false');
    loadBlockedDates();
  }
  
  // Set up toggle listeners once (when page loads)
  setTimeout(function() {
    var blockTypeSingle = document.getElementById('block-type-single');
    var blockTypeRange = document.getElementById('block-type-range');
    if (blockTypeSingle) {
      blockTypeSingle.addEventListener('change', toggleBlockType);
    }
    if (blockTypeRange) {
      blockTypeRange.addEventListener('change', toggleBlockType);
    }
  }, 500);

  function closeBlockDatesModal() {
    if (!blockDatesModal) return;
    blockDatesModal.classList.add('hidden');
    blockDatesModal.setAttribute('aria-hidden', 'true');
    if (blockDatesForm) blockDatesForm.reset();
  }

  function loadBlockedDates() {
    if (!blockedDatesList) return;
    blockedDatesList.innerHTML = '<p class="text-muted">Loading...</p>';
    
    supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true })
      .then(function (result) {
        var blockedDates = result.data || [];
        if (result.error) throw result.error;
        
        if (blockedDates.length === 0) {
          blockedDatesList.innerHTML = '<p class="text-muted">No dates blocked.</p>';
          return;
        }
        
        var html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
        blockedDates.forEach(function (bd) {
          var dateStr = bd.blocked_date;
          var reason = bd.reason ? ' — ' + escapeHtml(bd.reason) : '';
          html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg); border-radius: 4px;">';
          html += '<span><strong>' + escapeHtml(dateStr) + '</strong>' + reason + '</span>';
          html += '<button type="button" class="btn btn-secondary btn-sm unblock-btn" data-id="' + bd.id + '" data-date="' + dateStr + '">Unblock</button>';
          html += '</div>';
        });
        html += '</div>';
        blockedDatesList.innerHTML = html;
        
        // Bind unblock buttons
        blockedDatesList.querySelectorAll('.unblock-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            var date = this.getAttribute('data-date');
            if (confirm('Unblock ' + date + '? Bookings will be allowed again.')) {
              supabase.from('blocked_dates').delete().eq('id', id)
                .then(function (result) {
                  if (result.error) throw result.error;
                  loadBlockedDates();
                })
                .catch(function (err) {
                  alert('Could not unblock: ' + (err.message || 'Unknown error'));
                });
            }
          });
        });
      })
      .catch(function (err) {
        blockedDatesList.innerHTML = '<p style="color: #b91c1c;">Error loading blocked dates: ' + (err.message || 'Unknown error') + '</p>';
      });
  }

  if (blockDatesBtn) blockDatesBtn.addEventListener('click', openBlockDatesModal);
  if (blockModalClose) blockModalClose.addEventListener('click', closeBlockDatesModal);
  if (blockCancel) blockCancel.addEventListener('click', closeBlockDatesModal);
  if (blockDatesModal) {
    blockDatesModal.addEventListener('click', function (e) {
      if (e.target === blockDatesModal) closeBlockDatesModal();
    });
  }

  if (blockDatesForm) {
    blockDatesForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var blockTypeSingle = document.getElementById('block-type-single');
      var isSingle = blockTypeSingle && blockTypeSingle.checked;
      var reason = document.getElementById('block-reason').value.trim();
      
      var datesToBlock = [];
      
      if (isSingle) {
        // Single date
        var date = blockDateInput.value;
        if (!date) {
          alert('Please select a date');
          return;
        }
        datesToBlock.push(date);
      } else {
        // Date range
        var dateFrom = document.getElementById('block-date-from').value;
        var dateTo = document.getElementById('block-date-to').value;
        
        if (!dateFrom || !dateTo) {
          alert('Please select both from and to dates');
          return;
        }
        
        if (dateFrom > dateTo) {
          alert('From date must be before or equal to To date');
          return;
        }
        
        // Generate all dates in range
        var start = new Date(dateFrom);
        var end = new Date(dateTo);
        var current = new Date(start);
        
        while (current <= end) {
          datesToBlock.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }
      
      if (datesToBlock.length === 0) {
        alert('Please select at least one date');
        return;
      }
      
      // Insert all dates
      var inserts = datesToBlock.map(function(date) {
        return {
          blocked_date: date,
          reason: reason || null
        };
      });
      
      supabase.from('blocked_dates').insert(inserts)
        .then(function (result) {
          if (result.error) throw result.error;
          var count = datesToBlock.length;
          var message = count === 1 
            ? 'Date blocked successfully. Bookings will not be allowed on ' + datesToBlock[0] + '.'
            : count + ' dates blocked successfully (' + datesToBlock[0] + ' to ' + datesToBlock[datesToBlock.length - 1] + ').';
          alert(message);
          blockDatesForm.reset();
          // Reset to single date mode
          if (blockTypeSingle) blockTypeSingle.checked = true;
          var singleDateRow = document.getElementById('single-date-row');
          var rangeDateRow = document.getElementById('range-date-row');
          if (singleDateRow) singleDateRow.style.display = 'block';
          if (rangeDateRow) rangeDateRow.style.display = 'none';
          loadBlockedDates();
        })
        .catch(function (err) {
          if (err.message && err.message.indexOf('duplicate') !== -1) {
            alert('Some of these dates are already blocked. Please check the blocked dates list.');
          } else {
            alert('Could not block dates: ' + (err.message || 'Unknown error'));
          }
        });
    });
  }

  // Block time slots (e.g. 3-hour treatment on a date)
  var BLOCK_SLOTS_ORDER = [
    '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
    '12:00-12:30', '12:30-01:00', '01:00-01:30', '01:30-02:00',
    '06:00-06:30', '06:30-07:00', '07:00-07:30', '07:30-08:00',
    '08:00-08:30', '08:30-09:00'
  ];
  var blockSlotsBtn = document.getElementById('block-slots-btn');
  var blockSlotsModal = document.getElementById('block-slots-modal');
  var blockSlotsForm = document.getElementById('block-slots-form');
  var blockSlotsModalClose = document.getElementById('block-slots-modal-close');
  var blockSlotsCancel = document.getElementById('block-slots-cancel');
  var blockSlotDate = document.getElementById('block-slot-date');
  var blockSlotStart = document.getElementById('block-slot-start');
  var blockSlotEnd = document.getElementById('block-slot-end');
  var blockedSlotsList = document.getElementById('blocked-slots-list');

  function openBlockSlotsModal() {
    if (!blockSlotsModal) return;
    var today = new Date().toISOString().split('T')[0];
    if (blockSlotDate) blockSlotDate.min = today;
    if (blockSlotsForm) blockSlotsForm.reset();
    blockSlotsModal.classList.remove('hidden');
    blockSlotsModal.setAttribute('aria-hidden', 'false');
    loadBlockedSlots();
  }

  function closeBlockSlotsModal() {
    if (!blockSlotsModal) return;
    blockSlotsModal.classList.add('hidden');
    blockSlotsModal.setAttribute('aria-hidden', 'true');
    if (blockSlotsForm) blockSlotsForm.reset();
  }

  function slotIndex(slotValue) {
    var i = BLOCK_SLOTS_ORDER.indexOf(slotValue);
    return i >= 0 ? i : -1;
  }

  function loadBlockedSlots() {
    if (!blockedSlotsList) return;
    blockedSlotsList.innerHTML = '<p class="text-muted">Loading...</p>';
    supabase.from('blocked_slots').select('*').order('blocked_date', { ascending: true }).order('start_slot', { ascending: true })
      .then(function (result) {
        var rows = result.data || [];
        if (result.error) throw result.error;
        if (rows.length === 0) {
          blockedSlotsList.innerHTML = '<p class="text-muted">No time slots blocked.</p>';
          return;
        }
        var html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
        rows.forEach(function (r) {
          var reason = r.reason ? ' — ' + escapeHtml(r.reason) : '';
          html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg); border-radius: 4px;">';
          html += '<span><strong>' + escapeHtml(r.blocked_date) + '</strong> ' + escapeHtml(r.start_slot) + ' – ' + escapeHtml(r.end_slot) + reason + '</span>';
          html += '<button type="button" class="btn btn-secondary btn-sm unblock-slot-btn" data-id="' + r.id + '">Remove</button>';
          html += '</div>';
        });
        html += '</div>';
        blockedSlotsList.innerHTML = html;
        blockedSlotsList.querySelectorAll('.unblock-slot-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (confirm('Remove this blocked time range? Those slots will be available again.')) {
              supabase.from('blocked_slots').delete().eq('id', id)
                .then(function (res) {
                  if (res.error) throw res.error;
                  loadBlockedSlots();
                })
                .catch(function (err) {
                  alert('Could not remove: ' + (err.message || 'Unknown error'));
                });
            }
          });
        });
      })
      .catch(function (err) {
        blockedSlotsList.innerHTML = '<p style="color: #b91c1c;">Error loading blocked slots. If the table does not exist, run supabase-blocked-slots-table.sql in Supabase.</p>';
      });
  }

  if (blockSlotStart) {
    blockSlotStart.addEventListener('change', function () {
      var startVal = blockSlotStart.value;
      var endSelect = blockSlotEnd;
      if (!endSelect || !startVal) return;
      var startIdx = slotIndex(startVal);
      var opts = endSelect.querySelectorAll('option[value]');
      opts.forEach(function (opt) {
        var v = opt.value;
        opt.disabled = slotIndex(v) < startIdx;
        if (opt.value === endSelect.value && slotIndex(v) < startIdx) endSelect.value = startVal;
      });
    });
  }

  if (blockSlotsBtn) blockSlotsBtn.addEventListener('click', openBlockSlotsModal);
  if (blockSlotsModalClose) blockSlotsModalClose.addEventListener('click', closeBlockSlotsModal);
  if (blockSlotsCancel) blockSlotsCancel.addEventListener('click', closeBlockSlotsModal);
  if (blockSlotsModal) blockSlotsModal.addEventListener('click', function (e) { if (e.target === blockSlotsModal) closeBlockSlotsModal(); });

  if (blockSlotsForm) {
    blockSlotsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var dateVal = blockSlotDate && blockSlotDate.value;
      var startVal = blockSlotStart && blockSlotStart.value;
      var endVal = blockSlotEnd && blockSlotEnd.value;
      if (!dateVal || !startVal || !endVal) {
        alert('Please select date, start and end time.');
        return;
      }
      var startIdx = slotIndex(startVal);
      var endIdx = slotIndex(endVal);
      if (endIdx < startIdx) {
        alert('End time must be the same or after start time.');
        return;
      }
      var reason = document.getElementById('block-slot-reason');
      var payload = {
        blocked_date: dateVal,
        start_slot: startVal,
        end_slot: endVal,
        reason: (reason && reason.value.trim()) || null
      };
      supabase.from('blocked_slots').insert(payload)
        .then(function (result) {
          if (result.error) throw result.error;
          alert('Time slots blocked. They will not appear as available on the booking page.');
          blockSlotsForm.reset();
          loadBlockedSlots();
        })
        .catch(function (err) {
          alert('Could not block slots: ' + (err.message || 'Unknown error'));
        });
    });
  }

  supabase.auth.getSession().then(function (result) {
    if (result.data && result.data.session) showAdmin();
    else showLogin();
  }).catch(function () {
    showLogin();
  });
})();
