/**
 * Cancel booking – customer self-service.
 * Calls Supabase Edge Function cancel-booking via fetch (avoids "Failed to send request" from client).
 */
(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) return;

  var form = document.getElementById('cancel-booking-form');
  var statusEl = document.getElementById('cancel-form-status');
  var submitBtn = document.getElementById('cancel-submit-btn');
  if (!form || !statusEl || !submitBtn) return;

  var functionUrl = (config.supabaseUrl.replace(/\/$/, '') + '/functions/v1/cancel-booking');

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

    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.supabaseAnonKey,
        'apikey': config.supabaseAnonKey
      },
      body: JSON.stringify({
        phone: phone,
        preferred_date: date,
        preferred_time: time
      })
    })
      .then(function (res) {
        var ct = res.headers.get('Content-Type') || '';
        if (ct.indexOf('application/json') !== -1) {
          return res.json().then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          }).catch(function () {
            return { ok: res.ok, status: res.status, data: { error: 'Invalid response. Please cancel via WhatsApp or call +91 98704 39934.' } };
          });
        }
        if (res.status === 401 || res.status === 403) {
          return { ok: false, status: res.status, data: { error: 'Access denied. In Supabase Dashboard go to Edge Functions → cancel-booking → Settings and turn OFF "Enforce JWT verification". Or cancel via WhatsApp/call +91 98704 39934.' } };
        }
        return { ok: res.ok, status: res.status, data: { error: 'Request failed (' + res.status + '). Please cancel via WhatsApp or call +91 98704 39934.' } };
      })
      .then(function (result) {
        if (result.ok) {
          statusEl.className = 'form-status form-status--success';
          statusEl.textContent = (result.data && result.data.message) ? result.data.message : 'Your appointment has been cancelled. You will receive a WhatsApp confirmation shortly.';
          form.reset();
        } else {
          statusEl.className = 'form-status form-status--error';
          var msg = (result.data && result.data.error) ? result.data.error : ('Could not cancel. Please WhatsApp or call us at +91 98704 39934.');
          statusEl.textContent = msg;
        }
      })
      .catch(function (err) {
        statusEl.className = 'form-status form-status--error';
        var msg = (err && err.message) ? err.message : '';
        if (msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1 || msg.indexOf('Edge Function') !== -1 || msg.indexOf('Failed to send') !== -1) {
          statusEl.textContent = 'Cannot reach cancel service. Please cancel by messaging us on WhatsApp or calling +91 98704 39934.';
        } else {
          statusEl.textContent = (msg ? msg + '. ' : '') + 'Please cancel via WhatsApp or call +91 98704 39934.';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cancel my appointment';
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cancel my appointment';
      });
  });
})();
