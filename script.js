(function () {
  'use strict';

  // Splash — show logo first, then fade out and remove
  var splash = document.getElementById('splash');
  if (splash) {
    // Allow scrolling immediately (don't wait for load) - critical for mobile
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    
    // Remove splash faster on mobile (detect touch device)
    var isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var splashDelay = isMobile ? 300 : 500; // Faster on mobile
    var splashTimeout = isMobile ? 1000 : 2000; // Remove faster on mobile
    
    window.addEventListener('load', function () {
      setTimeout(function () {
        splash.classList.add('splash--hidden');
        splash.addEventListener('transitionend', function () {
          splash.remove();
          // Ensure scrolling is enabled after splash is removed
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          document.body.style.height = '';
          document.documentElement.style.height = '';
        }, { once: true });
      }, splashDelay);
    });
    
    // Fallback: remove splash faster on mobile even if load event doesn't fire
    setTimeout(function() {
      if (splash && !splash.classList.contains('splash--hidden')) {
        splash.classList.add('splash--hidden');
        setTimeout(function() {
          if (splash.parentNode) {
            splash.remove();
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.style.height = '';
            document.documentElement.style.height = '';
          }
        }, 400);
      }
    }, splashTimeout);
    
    // On mobile, allow immediate scrolling by making splash non-interactive immediately
    if (isMobile) {
      // Make splash non-blocking immediately
      splash.style.pointerEvents = 'none';
      
      // Also remove splash on first touch/scroll on mobile
      var removeOnTouch = function() {
        if (splash && !splash.classList.contains('splash--hidden')) {
          splash.classList.add('splash--hidden');
          setTimeout(function() {
            if (splash.parentNode) splash.remove();
          }, 400);
        }
        window.removeEventListener('touchstart', removeOnTouch);
        window.removeEventListener('scroll', removeOnTouch);
      };
      window.addEventListener('touchstart', removeOnTouch, { once: true, passive: true });
      window.addEventListener('scroll', removeOnTouch, { once: true, passive: true });
    }
  } else {
    // No splash - ensure scrolling is enabled
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
  }

  var menuToggle = document.querySelector('.menu-toggle');
  var menuCb = document.getElementById('menu-toggle-cb');
  var nav = document.querySelector('.nav');
  var navLinks = document.querySelectorAll('.nav-list a');
  
  // Ensure hamburger menu works on mobile
  if (menuToggle && menuCb) {
    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      menuCb.checked = !menuCb.checked;
    });
  }
  var dots = document.querySelectorAll('.testimonials-dots .dot');
  var track = document.querySelector('.testimonials-track');
  var dateInput = document.getElementById('booking-date');

  // Set minimum date to today for booking
  if (dateInput) {
    var today = new Date().toISOString().slice(0, 10);
    dateInput.setAttribute('min', today);
  }

  // Booking form — submit via AJAX to Formspree (if slot booking not handled by booking-slots.js)
  var bookingConfig = window.BOOKING_CONFIG;
  var useSlotBooking = bookingConfig && bookingConfig.supabaseUrl && bookingConfig.supabaseAnonKey &&
    bookingConfig.supabaseUrl.indexOf('YOUR_') !== 0 && bookingConfig.supabaseAnonKey.indexOf('YOUR_') !== 0;
  var bookingForm = document.getElementById('booking-form-main') || document.querySelector('.booking-form');
  var formStatus = document.getElementById('form-status');
  var submitBtn = document.getElementById('booking-submit');
  if (bookingForm && formStatus && submitBtn && !useSlotBooking) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formStatus.textContent = '';
      formStatus.className = 'form-status';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      var formData = new FormData(bookingForm);
      var formspreeUrl = bookingForm.getAttribute('data-formspree-url');
      if (!formspreeUrl) return;
      fetch(formspreeUrl, {
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

  // Mobile menu — close when a nav link is clicked (after navigation)
  var menuCb = document.getElementById('menu-toggle-cb');
  if (menuCb && navLinks.length) {
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        // Let the link navigate normally - don't prevent default
        // Close menu after navigation starts
        var href = this.getAttribute('href');
        if (href && href !== '#' && href !== 'javascript:void(0)') {
          setTimeout(function() {
            if (menuCb) menuCb.checked = false;
          }, 400);
        }
        var mw = document.querySelector('.nav-more-wrap');
        if (mw) mw.classList.remove('open');
      }, false);
    });
  }

  // Close mobile menu when clicking overlay (backdrop) - use mousedown for better response
  if (menuCb && nav) {
    // Use capture phase to handle overlay clicks before they reach links
    document.addEventListener('mousedown', function(e) {
      if (menuCb.checked) {
        // If clicking outside nav (on overlay), close menu
        if (!nav.contains(e.target) && !e.target.closest('.menu-toggle')) {
          menuCb.checked = false;
        }
      }
    }, true);
    
    // Also handle touch events for mobile (passive to not block scroll)
    document.addEventListener('touchstart', function(e) {
      if (menuCb.checked) {
        if (!nav.contains(e.target) && !e.target.closest('.menu-toggle')) {
          menuCb.checked = false;
        }
      }
    }, { passive: true, capture: true });
  }
  
  // Ensure body scrolling is never blocked on mobile - CRITICAL
  var ensureScrollEnabled = function() {
    document.body.style.overflow = 'scroll';
    document.documentElement.style.overflow = 'scroll';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.position = 'relative';
    document.documentElement.style.position = 'relative';
    // Force enable touch scrolling
    document.body.style.webkitOverflowScrolling = 'touch';
    document.documentElement.style.webkitOverflowScrolling = 'touch';
  };
  
  // Run immediately and aggressively on mobile
  ensureScrollEnabled();
  
  // On mobile, be very aggressive about enabling scroll
  var isMobileDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isMobileDevice) {
    // Run multiple times to ensure it sticks
    setTimeout(ensureScrollEnabled, 0);
    setTimeout(ensureScrollEnabled, 50);
    setTimeout(ensureScrollEnabled, 100);
    setTimeout(ensureScrollEnabled, 200);
    setTimeout(ensureScrollEnabled, 500);
    
    // Also run on touch events
    document.addEventListener('touchstart', ensureScrollEnabled, { passive: true, once: false });
    document.addEventListener('touchmove', ensureScrollEnabled, { passive: true, once: false });
  }
  
  window.addEventListener('load', ensureScrollEnabled);
  window.addEventListener('DOMContentLoaded', ensureScrollEnabled);

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
