  
// js/script1.js  
  const swiper = new Swiper('.mySwiper', {
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });


    document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('mobile-category-btn');
    const btnClose = document.getElementById('mobile-category-close');
    const drawer = document.getElementById('mobile-category-drawer');

    if (btnOpen && btnClose && drawer) {
      btnOpen.addEventListener('click', () => {
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
    }
  });