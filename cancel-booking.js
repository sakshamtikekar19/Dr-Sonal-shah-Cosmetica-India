/**
 * Cancel booking – customer self-service.
 * Uses Supabase JS client functions.invoke() which handles CORS better than direct fetch.
 */
(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) return;

  var form = document.getElementById('cancel-booking-form');
  var statusEl = document.getElementById('cancel-form-status');
  var submitBtn = document.getElementById('cancel-submit-btn');
  if (!form || !statusEl || !submitBtn) return;

  // Create Supabase client - it handles CORS properly
  var supabase = window.supabase && window.supabase.createClient && window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  if (!supabase) {
    console.error('Supabase client not available');
    return;
  }

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

    // Use Supabase client's functions.invoke() - it handles CORS and auth properly
    supabase.functions.invoke('cancel-booking', {
      body: {
        phone: phone,
        preferred_date: date,
        preferred_time: time
      }
    })
      .then(function (res) {
        if (res.error) {
          // Supabase client error
          var errorMsg = res.error.message || 'Could not cancel.';
          if (errorMsg.indexOf('JWT') !== -1 || errorMsg.indexOf('unauthorized') !== -1 || errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('403') !== -1) {
            errorMsg = 'Access denied. In Supabase Dashboard go to Edge Functions → cancel-booking → Settings and turn OFF "Enforce JWT verification". Or cancel via WhatsApp/call +91 98704 39934.';
          }
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = errorMsg;
          submitBtn.disabled = false;
          submitBtn.textContent = 'Cancel my appointment';
          return;
        }
        
        // Success
        var data = res.data;
        if (data && data.error) {
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = data.error;
        } else {
          statusEl.className = 'form-status form-status--success';
          statusEl.textContent = (data && data.message) ? data.message : 'Your appointment has been cancelled. You will receive a WhatsApp confirmation shortly.';
          form.reset();
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cancel my appointment';
      })
      .catch(function (err) {
        statusEl.className = 'form-status form-status--error';
        var msg = (err && err.message) ? err.message : '';
        if (msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1 || msg.indexOf('Edge Function') !== -1 || msg.indexOf('Failed to send') !== -1 || msg.indexOf('CORS') !== -1) {
          statusEl.textContent = 'Cannot reach cancel service. Please cancel by messaging us on WhatsApp or calling +91 98704 39934.';
        } else {
          statusEl.textContent = (msg ? msg + '. ' : '') + 'Please cancel via WhatsApp or call +91 98704 39934.';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cancel my appointment';
      });
  });
})();
