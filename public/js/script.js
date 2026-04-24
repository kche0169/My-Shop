// js/script.js

document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('slider-track');
  const slides = track?.children;
  const dots = document.getElementById('slider-dots')?.children;
  let current = 0;

  if (!track || !slides || !dots) {
    console.warn('Carousel elements not found. This page may not have a carousel.');
    return;
  }

  function showSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    current = index;
    track.style.transform = `translateX(-${index * 100}%)`;

    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('bg-white', i !== index);
      dots[i].classList.toggle('bg-blue-600', i === index);
    }
  }

  document.getElementById('prevSlide')?.addEventListener('click', () => showSlide(current - 1));
  document.getElementById('nextSlide')?.addEventListener('click', () => showSlide(current + 1));

  for (let i = 0; i < dots.length; i++) {
    dots[i].addEventListener('click', () => showSlide(i));
  }

  setInterval(() => showSlide(current + 1), 5000);

  showSlide(0);
});

document.addEventListener('DOMContentLoaded', () => {
  const btnOpen = document.getElementById('mobile-category-btn');
  const btnClose = document.getElementById('mobile-category-close');
  const drawer = document.getElementById('mobile-category-drawer');

  console.log('main.js loaded successfully');
  console.log('btnOpen:', btnOpen ? 'Found' : 'Not found');
  console.log('btnClose:', btnClose ? 'Found' : 'Not found');
  console.log('drawer:', drawer ? 'Found' : 'Not found');

  if (!btnOpen || !btnClose || !drawer) {
    console.error('Missing drawer elements. Please check HTML IDs.');
    return;
  }

  btnOpen.addEventListener('click', () => {
    console.log('Categories button clicked');
    drawer.classList.remove('-translate-x-full');
  });

  btnClose.addEventListener('click', () => {
    drawer.classList.add('-translate-x-full');
  });

  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) {
      drawer.classList.add('-translate-x-full');
    }
  });
});

// document.addEventListener('DOMContentLoaded', function() {
//   // 绑定 checkout 按钮（自动找 id="checkout-btn"）
//   if (window.Checkout) {
//     Checkout.initCheckoutButton('checkout-btn', 1);
//   }
// });