/**
 * Cancel booking – customer self-service.
 * Uses PostgreSQL function via RPC (avoids Edge Function CORS issues).
 */
(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) return;

  var form = document.getElementById('cancel-booking-form');
  var statusEl = document.getElementById('cancel-form-status');
  var submitBtn = document.getElementById('cancel-submit-btn');
  if (!form || !statusEl || !submitBtn) return;

  // Create Supabase client - RPC calls handle CORS properly
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

    // Call PostgreSQL function via RPC - no CORS issues!
    supabase.rpc('cancel_booking', {
      p_phone: phone,
      p_preferred_date: date,
      p_preferred_time: time
    })
      .then(function (res) {
        if (res.error) {
          // Supabase RPC error
          var errorMsg = res.error.message || 'Could not cancel.';
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = errorMsg + ' Please cancel via WhatsApp or call +91 98704 39934.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Cancel my appointment';
          return;
        }
        
        // RPC returns the JSON directly
        var data = res.data;
        if (!data) {
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = 'Could not cancel. Please cancel via WhatsApp or call +91 98704 39934.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Cancel my appointment';
          return;
        }
        
        if (data.success === false || data.error) {
          statusEl.className = 'form-status form-status--error';
          statusEl.textContent = data.error || 'Could not cancel. Please cancel via WhatsApp or call +91 98704 39934.';
        } else {
          statusEl.className = 'form-status form-status--success';
          statusEl.textContent = data.message || 'Your appointment has been cancelled. You will receive a WhatsApp confirmation shortly.';
          form.reset();
          
          // Optionally trigger WhatsApp notification via Edge Function (fire-and-forget)
          if (data.booking) {
            supabase.functions.invoke('send-whatsapp', {
              body: {
                type: 'cancel',
                phone: data.booking.phone,
                name: data.booking.name,
                preferred_date: data.booking.preferred_date,
                preferred_time: data.booking.preferred_time
              }
            }).catch(function() {
              // Ignore WhatsApp errors - cancellation already succeeded
            });
          }
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
