/**
 * Booking slot availability – show booked slots and prevent double-booking.
 * Requires Supabase: set window.BOOKING_CONFIG in contact.html (see BOOKING-SETUP.md).
 */
(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey ||
      config.supabaseUrl.indexOf('YOUR_') === 0 || config.supabaseAnonKey.indexOf('YOUR_') === 0) {
    return; // No Supabase configured – form works as normal
  }

  var TIME_SLOTS = [
    '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
    '12:00-12:30', '12:30-01:00', '01:00-01:30', '01:30-02:00',
    '06:00-06:30', '06:30-07:00', '07:00-07:30', '07:30-08:00',
    '08:00-08:30', '08:30-09:00'
  ];

  var form = document.querySelector('.booking-form');
  var dateInput = document.getElementById('booking-date');
  var timeSelect = document.getElementById('booking-time');
  var formStatus = document.getElementById('form-status');
  var submitBtn = document.getElementById('booking-submit');
  if (!form || !dateInput || !timeSelect || !formStatus || !submitBtn) return;

  var supabase = window.supabase && window.supabase.createClient && window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  if (!supabase) return;

  function setSlotOptions(bookedValues) {
    var options = timeSelect.querySelectorAll('option[value]');
    var currentVal = timeSelect.value;
    options.forEach(function (opt) {
      var v = opt.value;
      if (!v) return;
      var booked = bookedValues.indexOf(v) !== -1;
      opt.disabled = booked;
      if (booked) {
        var label = opt.textContent.replace(/\s*\(Booked\)\s*$/, '');
        if (opt.textContent.indexOf('(Booked)') === -1) opt.textContent = label + ' (Booked)';
      } else {
        opt.textContent = opt.textContent.replace(/\s*\(Booked\)\s*$/, '');
      }
    });
    if (currentVal && bookedValues.indexOf(currentVal) !== -1) timeSelect.value = '';
  }

  function updateTimeSlotAvailability() {
    var dateStr = dateInput.value;
    if (!dateStr) {
      setSlotOptions([]);
      return;
    }
    supabase.from('bookings').select('preferred_time').eq('preferred_date', dateStr)
      .then(function (result) {
        var booked = (result.data || []).map(function (r) { return r.preferred_time; });
        setSlotOptions(booked);
      })
      .catch(function () {
        setSlotOptions([]);
      });
  }

  dateInput.addEventListener('change', updateTimeSlotAvailability);
  dateInput.addEventListener('input', updateTimeSlotAvailability);
  if (dateInput.value) updateTimeSlotAvailability();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var dateStr = dateInput.value;
    var timeVal = timeSelect.value;
    if (!dateStr || !timeVal) return;

    var formData = new FormData(form);
    var payload = {
      preferred_date: dateStr,
      preferred_time: timeVal,
      name: formData.get('name') || '',
      phone: formData.get('phone') || '',
      email: formData.get('email') || '',
      service: formData.get('service') || '',
      message: formData.get('message') || ''
    };
    
    // Debug: log what we're sending
    console.log('Booking payload:', payload);

    formStatus.textContent = '';
    formStatus.className = 'form-status';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking…';

    supabase.from('bookings').insert(payload).select().single()
      .then(function () {
        // Send WhatsApp confirmation (fire-and-forget; don't block success)
        var whatsappPayload = {
          type: 'confirm',
          phone: payload.phone,
          name: payload.name,
          preferred_date: payload.preferred_date,
          preferred_time: payload.preferred_time,
          service: payload.service || ''
        };
        console.log('Sending WhatsApp payload:', whatsappPayload);
        supabase.functions.invoke('send-whatsapp', {
          headers: {
            'Authorization': 'Bearer ' + config.supabaseAnonKey
          },
          body: whatsappPayload
        }).then(function (r) {
          if (r.error) {
            console.error('WhatsApp confirm error:', r.error);
            console.error('Error details:', JSON.stringify(r.error, null, 2));
            if (r.error.message) console.error('Error message:', r.error.message);
            if (r.error.context && r.error.context.body) {
              console.error('Function response body:', r.error.context.body);
            }
          } else {
            console.log('WhatsApp confirm success:', r.data);
          }
        }).catch(function (err) {
          console.error('WhatsApp confirm failed:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
          if (err.context && err.context.body) {
            console.error('Function response body:', err.context.body);
          }
        });
        return fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' }
        });
      })
      .then(function (res) {
        if (res.ok) {
          formStatus.className = 'form-status form-status--success';
          formStatus.textContent = 'Thank you! Your appointment is booked. You will receive a WhatsApp confirmation shortly.';
          form.reset();
          if (dateInput) dateInput.setAttribute('min', new Date().toISOString().slice(0, 10));
          setSlotOptions([]);
          timeSelect.value = '';
        } else {
          formStatus.className = 'form-status form-status--error';
          formStatus.innerHTML = 'Request could not be sent. Please book via <a href="https://wa.me/919870439934" target="_blank" rel="noopener">WhatsApp</a> or call +91 98704 39934.';
        }
      })
      .catch(function (err) {
        var msg = (err && err.message) ? String(err.message) : '';
        var code = err && err.code;
        if (msg.indexOf('duplicate') !== -1 || msg.indexOf('unique') !== -1 || code === '23505') {
          formStatus.className = 'form-status form-status--error';
          formStatus.textContent = 'This slot was just booked. Please choose another date or time.';
          updateTimeSlotAvailability();
        } else if (msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1) {
          formStatus.className = 'form-status form-status--error';
          formStatus.textContent = 'Network error. Please open the site from a proper URL (not file://) or check your connection, then try again.';
        } else {
          formStatus.className = 'form-status form-status--error';
          formStatus.textContent = 'Could not reserve slot. Please try again or book via WhatsApp.';
        }
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Appointment';
      });
  }, true);
})();
