/**
 * Cancel booking – customer self-service.
 * Calls Supabase Edge Function cancel-booking with phone, date, time.
 */
(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) return;

  var form = document.getElementById('cancel-booking-form');
  var statusEl = document.getElementById('cancel-form-status');
  var submitBtn = document.getElementById('cancel-submit-btn');
  if (!form || !statusEl || !submitBtn) return;

  var supabase = window.supabase && window.supabase.createClient && window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  if (!supabase) return;

  // Set cancel-date min to today (optional: allow past dates so they can cancel old bookings)
  var cancelDate = document.getElementById('cancel-date');
  if (cancelDate) {
    cancelDate.removeAttribute('min');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = document.getElementById('cancel-phone').value.trim();
    var date = document.getElementById('cancel-date').value;
    var time = document.getElementById('cancel-time').value;
    if (!phone || !date || !time) return;

    statusEl.textContent = '';
    statusEl.className = 'form-status';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cancelling…';

    supabase.functions.invoke('cancel-booking', {
      headers: {
        'Authorization': 'Bearer ' + config.supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: {
        phone: phone,
        preferred_date: date,
        preferred_time: time
      }
    })
      .then(function (res) {
        var data = res.data;
        var err = res.error;
        if (err) {
          statusEl.className = 'form-status form-status--error';
          var msg = (data && data.error) ? data.error : (err.message || 'Could not cancel. Please WhatsApp or call us at +91 98704 39934.');
          statusEl.textContent = msg;
          submitBtn.disabled = false;
          submitBtn.textContent = 'Cancel my appointment';
          return;
        }
        if (data && data.error) {
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = data.error;
          submitBtn.disabled = false;
          submitBtn.textContent = 'Cancel my appointment';
          return;
        }
        statusEl.className = 'form-status form-status--success';
        statusEl.textContent = data && data.message ? data.message : 'Your appointment has been cancelled. You will receive a WhatsApp confirmation shortly.';
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cancel my appointment';
      })
      .catch(function (err) {
        statusEl.className = 'form-status form-status--error';
        statusEl.textContent = err.message || 'Could not cancel. Please WhatsApp or call us at +91 98704 39934.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cancel my appointment';
      });
  });
})();
