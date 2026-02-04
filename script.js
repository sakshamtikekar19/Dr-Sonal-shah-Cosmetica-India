(function () {
  'use strict';

  // Splash — show logo first, then fade out and remove
  var splash = document.getElementById('splash');
  if (splash) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        splash.classList.add('splash--hidden');
        splash.addEventListener('transitionend', function () {
          splash.remove();
        }, { once: true });
      }, 500);
    });
  }

  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  var navLinks = document.querySelectorAll('.nav-list a');
  var dots = document.querySelectorAll('.testimonials-dots .dot');
  var track = document.querySelector('.testimonials-track');
  var dateInput = document.getElementById('booking-date');

  // Set minimum date to today for booking
  if (dateInput) {
    var today = new Date().toISOString().slice(0, 10);
    dateInput.setAttribute('min', today);
  }

  // Booking form — submit via AJAX to Formspree (sends to dr.shah.sonal.r@gmail.com)
  var bookingForm = document.querySelector('.booking-form');
  var formStatus = document.getElementById('form-status');
  var submitBtn = document.getElementById('booking-submit');
  if (bookingForm && formStatus && submitBtn) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formStatus.textContent = '';
      formStatus.className = 'form-status';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      var formData = new FormData(bookingForm);
      fetch(bookingForm.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            formStatus.className = 'form-status form-status--success';
            formStatus.textContent = 'Thank you! Your appointment request has been sent to Dr Sonal Shah Cosmetica India. We will confirm your appointment shortly.';
            bookingForm.reset();
            if (dateInput) dateInput.setAttribute('min', new Date().toISOString().slice(0, 10));
          } else {
            formStatus.className = 'form-status form-status--error';
            formStatus.innerHTML = 'Request could not be sent. Please book via <a href="https://wa.me/919870439934" target="_blank" rel="noopener">WhatsApp</a> or call us at +91 98704 39934.';
          }
        })
        .catch(function () {
          formStatus.className = 'form-status form-status--error';
          formStatus.innerHTML = 'Request could not be sent. Please book via <a href="https://wa.me/919870439934" target="_blank" rel="noopener">WhatsApp</a> or call us at +91 98704 39934.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Request Appointment';
        });
    });
  }

  // Mobile menu — close when a nav link is clicked (checkbox hack does open/close)
  var menuCb = document.getElementById('menu-toggle-cb');
  if (menuCb && navLinks.length) {
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        menuCb.checked = false;
        var mw = document.querySelector('.nav-more-wrap');
        if (mw) mw.classList.remove('open');
      });
    });
  }

  // Mobile "More" dropdown — single click handler for reliable tap
  var moreBtn = document.querySelector('.nav-more-btn');
  var moreWrap = document.querySelector('.nav-more-wrap');
  if (moreBtn && moreWrap) {
    var lastMoreTap = 0;
    moreBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (Date.now() - lastMoreTap < 500) return;
      lastMoreTap = Date.now();
      moreWrap.classList.toggle('open');
      moreBtn.setAttribute('aria-expanded', moreWrap.classList.contains('open'));
    });

    moreWrap.querySelectorAll('.nav-more-menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        moreWrap.classList.remove('open');
        moreBtn.setAttribute('aria-expanded', 'false');
        if (menuCb) menuCb.checked = false;
      });
    });
  }

  // Testimonial dots — scroll to card on click
  if (dots.length && track) {
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        dots.forEach(function (d) { d.classList.remove('active'); });
        dot.classList.add('active');
        var card = track.children[i];
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    });

    // Update active dot on scroll
    track.addEventListener('scroll', function () {
      var index = Math.round(track.scrollLeft / (track.scrollWidth / dots.length));
      index = Math.min(index, dots.length - 1);
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === index);
      });
    });
    // Auto-scroll testimonials
    var autoScroll = setInterval(function() {
      if (track.scrollWidth - track.scrollLeft <= track.clientWidth) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }, 5000);
    track.addEventListener('touchstart', function() { clearInterval(autoScroll); }, { passive: true });
  }

  // Scroll reveal — add .animate-in when elements enter viewport
  var revealEls = document.querySelectorAll('.reveal, .hero-content, .hero-image-wrap');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Parallax for hero bg
          if (entry.target.classList.contains('hero-bg-shape')) {
            window.addEventListener('scroll', function() {
              var scrolled = window.scrollY;
              entry.target.style.transform = 'translateY(' + (scrolled * 0.2) + 'px)';
            }, { passive: true });
          }
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
    
    // Parallax hero shape
    var heroShape = document.querySelector('.hero-bg-shape');
    if (heroShape) revealObs.observe(heroShape);
  } else {
    revealEls.forEach(function (el) { el.classList.add('animate-in'); });
  }

  // Header shadow on scroll
  var header = document.getElementById('header');
  if (header) {
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

})();
