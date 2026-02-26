/**
 * Reviews: load from Supabase and submit new reviews. Everyone sees reviews from DB.
 * Requires booking-config.js and Supabase (same as booking). Run supabase-reviews-table.sql first.
 */
(function () {
  'use strict';

  var config = window.BOOKING_CONFIG;
  var grid = document.getElementById('reviews-grid');
  if (!grid) return;

  var supabase = null;
  if (config && config.supabaseUrl && config.supabaseAnonKey &&
      config.supabaseUrl.indexOf('YOUR_') !== 0 && config.supabaseAnonKey.indexOf('YOUR_') !== 0 &&
      window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  function starString(rating) {
    var n = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderReview(r) {
    return '<blockquote class="review-card">' +
      '<div class="review-stars" aria-hidden="true">' + escapeHtml(starString(r.rating)) + '</div>' +
      '<p class="review-text">' + escapeHtml(r.review || '') + '</p>' +
      '<footer class="review-footer">— ' + escapeHtml(r.name || 'Patient') + '</footer>' +
      '</blockquote>';
  }

  function loadReviews() {
    if (!supabase) return;
    supabase.from('reviews').select('id, name, rating, review, created_at').order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) {
          console.warn('Reviews load error:', result.error);
          return;
        }
        var rows = result.data || [];
        if (rows.length > 0) {
          grid.innerHTML = rows.map(renderReview).join('');
        }
      });
  }

  loadReviews();

  // Form submit: insert into Supabase, then reload list
  var form = document.querySelector('.review-form');
  var status = document.getElementById('review-form-status');
  var submitBtn = document.getElementById('review-submit');
  if (form && status && submitBtn && supabase) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('review-name') && document.getElementById('review-name').value) || '';
      var rating = (document.getElementById('review-rating') && document.getElementById('review-rating').value) || '5';
      var review = (document.getElementById('review-text') && document.getElementById('review-text').value) || '';
      name = name.trim();
      review = review.trim();
      if (!name || !review) {
        status.className = 'form-status form-status--error';
        status.textContent = 'Please enter your name and review.';
        return;
      }

      status.textContent = '';
      status.className = 'form-status';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      supabase.from('reviews').insert({ name: name, rating: parseInt(rating, 10) || 5, review: review }).select()
        .then(function (result) {
          if (result.error) {
            status.className = 'form-status form-status--error';
            status.textContent = 'Could not send. Please try "Write a review on Google" above.';
            return;
          }
          status.className = 'form-status form-status--success';
          status.textContent = 'Thank you! Your review is now visible to everyone.';
          form.reset();
          loadReviews();
        })
        .catch(function () {
          status.className = 'form-status form-status--error';
          status.textContent = 'Could not send. Please try "Write a review on Google" above.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit review';
        });
    });
  } else if (form && status && submitBtn && !supabase) {
    // No Supabase: fallback to Formspree so at least you get email
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      var formData = new FormData(form);
      fetch(form.action, { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (res.ok) {
            status.className = 'form-status form-status--success';
            status.textContent = 'Thank you! Your review has been sent. We may feature it on our website.';
            form.reset();
          } else {
            status.className = 'form-status form-status--error';
            status.textContent = 'Could not send. Please try "Write a review on Google" above.';
          }
        })
        .catch(function () {
          status.className = 'form-status form-status--error';
          status.textContent = 'Could not send. Please try "Write a review on Google" above.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit review';
        });
    });
  }
})();
