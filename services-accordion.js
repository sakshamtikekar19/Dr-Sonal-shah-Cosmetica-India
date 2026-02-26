/**
 * Services accordion – 4 categories (Skin, Hair, Weight Gain, Weight Loss) with expand/collapse.
 * Data matches services-app/data/services.ts. Load after DOM ready.
 */
(function () {
  'use strict';

  var servicesData = [
    {
      id: 'skin',
      title: 'Skin Treatments',
      subHeadings: [
        { title: 'PMU (Permanent Makeup)', treatments: [
          { name: 'Lip Pigment', description: 'Enhances natural lip color and definition.' },
          { name: 'Eyebrows', description: 'Semi-permanent shaping for fuller, defined brows.' },
          { name: 'BB Glow', description: 'A rejuvenating skin treatment for a semi-permanent foundation effect.' },
          { name: 'Blush for Cheeks', description: 'Adds a natural, long-lasting rosy tint to the face.' },
          { name: 'Micro Pigmentation on Scalp', description: 'Mimics hair follicles to treat thinning or baldness.' }
        ]},
        { title: 'Laser Treatment', treatments: [
          { name: 'CO2 / Fractional Laser', description: 'Advanced skin resurfacing for scars and deep rejuvenation.' },
          { name: 'Pico Laser', description: 'Ultra-fast laser for pigmentation and skin toning.' },
          { name: 'Tattoo Removal', description: 'Safe and effective clearing of unwanted ink.' },
          { name: 'Laser Hair Reduction', description: 'Permanent reduction of unwanted body hair.' },
          { name: 'Melasma Treatment', description: 'Targeted laser therapy to lighten stubborn hormonal patches.' }
        ]},
        { title: 'Anti-Aging & IV Therapy', treatments: [
          { name: 'IV Infusions', description: 'Specialized drips (Glutathione, Weight Loss, Skin Booster, Liver Detox) for internal glow and health.' },
          { name: 'HIFU Laser', description: 'High-intensity focused ultrasound for face contouring and skin tightening.' }
        ]},
        { title: 'Chemical Peeling', treatments: [
          { name: 'Range of Peels', description: 'Targeted treatments (Yellow, Party, Acne, Glycolic, Lactic, Salisix, Cosmelan) for skin renewal and glow.' }
        ]},
        { title: 'Hydra Facial & Rejuvenation', treatments: [
          { name: 'Specialty Facials', description: 'Ice & Fire, Exosome treatments, and Korean Glass Glow for ultimate hydration.' }
        ]},
        { title: 'Electrocautery', treatments: [
          { name: 'Warts & Keloid Removal', description: 'Precision removal of skin growths and raised scars.' },
          { name: 'Microdermabrasion', description: 'Mechanical exfoliation for smoother, brighter skin.' }
        ]},
        { title: 'Oxygeno Therapy', treatments: [
          { name: 'Oxygeno Therapy', description: 'Infuses oxygen and nutrients deep into the skin layers.' }
        ]},
        { title: 'Nitrogen Infuser', treatments: [
          { name: 'Nitrogen Infuser', description: 'Cryo-based therapy for skin tightening and pore reduction.' }
        ]},
        { title: 'Aesthetic Surgery & Contouring', treatments: [
          { name: 'Blepharoplasty', description: 'Eyelid surgery to remove excess skin and fat for a refreshed, youthful look.' },
          { name: 'Xanthelasma Surgery', description: 'Removal of cholesterol deposits around the eyelids for clearer skin.' },
          { name: 'Dimple Creation', description: 'Surgical or minimally invasive creation of natural-looking dimples.' },
          { name: 'Nose Shaping (Surgical & Fillers)', description: 'Rhinoplasty or filler-based nose reshaping for balanced facial proportions.' }
        ]},
        { title: 'Botox, Fillers & Threads', treatments: [
          { name: 'Botox, Fillers & Threads', description: 'Non-surgical injectables to smooth wrinkles and lift facial contours.' }
        ]}
      ]
    },
    {
      id: 'hair',
      title: 'Hair Treatments',
      subHeadings: [
        { title: 'Hair Restoration & Therapy', treatments: [
          { name: 'Hair Transplant', description: 'Permanent surgical restoration of hair follicles.' },
          { name: 'Hair Loss Treatment', description: 'Comprehensive clinical protocols to stop thinning.' },
          { name: 'Laser Therapy', description: 'Advanced Laser Combing and Helmets to stimulate growth.' }
        ]},
        { title: 'Scalp & Medical Care', treatments: [
          { name: 'Mesopeel & Scalp Care', description: 'Specialized peels and anti-dandruff treatments for scalp health.' },
          { name: 'Medical Solutions', description: 'Personalized oral medicines and external growth applications.' }
        ]}
      ]
    },
    {
      id: 'weight-gain',
      title: 'Weight Gain',
      subHeadings: [
        { title: 'Weight Gain', treatments: [
          { name: 'Weight Gain Treatment', description: 'Clinical approach using oral medications to improve appetite and mass.' },
          { name: 'Dietician Consultation', description: 'In-center personalized meal planning for healthy weight gain.' }
        ]}
      ]
    },
    {
      id: 'weight-loss',
      title: 'Weight Loss',
      subHeadings: [
        { title: 'Weight Loss', treatments: [
          { name: 'Lipolysis Injections', description: 'Targeted fat-dissolving injections for stubborn areas.' },
          { name: 'Medical Weight Loss', description: 'Management via Mounjaro and Ozempic for metabolic health.' },
          { name: 'In-house Dietician', description: 'Professional dietary guidance to ensure sustainable results.' }
        ]}
      ]
    }
  ];

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function render() {
    var container = document.getElementById('services-accordion');
    if (!container) return;

    container.innerHTML = '';
    var openId = null;

    servicesData.forEach(function (cat) {
      var card = document.createElement('div');
      card.className = 'services-accordion-card';
      card.setAttribute('data-id', cat.id);

      var header = document.createElement('button');
      header.type = 'button';
      header.className = 'services-accordion-header';
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', 'panel-' + cat.id);
      header.id = 'accordion-' + cat.id;
      header.innerHTML = '<span class="services-accordion-title">' + escapeHtml(cat.title) + '</span><span class="services-accordion-icon" aria-hidden="true"></span>';
      card.appendChild(header);

      var panel = document.createElement('div');
      panel.className = 'services-accordion-panel';
      panel.id = 'panel-' + cat.id;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', 'accordion-' + cat.id);
      panel.style.maxHeight = '0';

      var inner = document.createElement('div');
      inner.className = 'services-accordion-panel-inner';

      cat.subHeadings.forEach(function (sub) {
        var subBlock = document.createElement('div');
        subBlock.className = 'services-accordion-sub';
        subBlock.innerHTML = '<h3 class="services-accordion-subtitle">' + escapeHtml(sub.title) + '</h3>';
        var list = document.createElement('div');
        list.className = 'services-accordion-treatments';
        sub.treatments.forEach(function (t) {
          list.innerHTML += '<div class="services-accordion-treatment"><strong>' + escapeHtml(t.name) + '</strong><p>' + escapeHtml(t.description) + '</p></div>';
        });
        subBlock.appendChild(list);
        inner.appendChild(subBlock);
      });

      panel.appendChild(inner);
      card.appendChild(panel);
      container.appendChild(card);

      header.addEventListener('click', function () {
        var isOpen = openId === cat.id;
        var allPanels = container.querySelectorAll('.services-accordion-panel');
        var allHeaders = container.querySelectorAll('.services-accordion-header');
        allPanels.forEach(function (p) { p.style.maxHeight = '0'; });
        allHeaders.forEach(function (h) { h.setAttribute('aria-expanded', 'false'); });
        card.classList.remove('is-open');

        if (!isOpen) {
          panel.style.maxHeight = panel.scrollHeight + 'px';
          header.setAttribute('aria-expanded', 'true');
          card.classList.add('is-open');
          openId = cat.id;
        } else {
          openId = null;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
