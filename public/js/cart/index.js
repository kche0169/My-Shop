/**
 * Cart Module Entry Point
 * 购物车模块入口
 */
(function(global) {
  'use strict';

  window.productCache = window.productCache || new Map();

  window.AppUtils = window.AppUtils || {
    formatPrice: function(price) {
      const num = parseFloat(price) || 0;
      return `$${num.toFixed(2)}`;
    }
  };

  window.AppConfig = window.AppConfig || {
    API_BASE_URL: '/api',
    DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image'
  };

  window.cartInitialized = false;
  window.cartEventsInitialized = false;
  window.cart = window.cart || null;

  function getCurrentUserId() {
    var storedId = localStorage.getItem('current_userid');
    return storedId ? parseInt(storedId, 10) : 1;
  }

  function initCartGlobal() {
    try {
      if (typeof ShoppingCart !== 'function') {
        throw new Error('ShoppingCart class not found!');
      }

      if (!window.cart) {
        var userid = getCurrentUserId();
        console.log('[initCartGlobal] Initializing cart with userid:', userid);
        window.cart = new ShoppingCart(userid);
      }

      if (!window.cartEventsInitialized) {
        initCartEvents();
        window.cartEventsInitialized = true;
      }

      window.cartInitialized = true;
    } catch (error) {
      console.error('[initCartGlobal] Cart initialization failed:', error);
    }
  }

  function initCartPopupControl() {
    var cartEntry = document.getElementById('cart-entry');
    var cartPopup = document.getElementById('cart-popup');
    if (!cartEntry || !cartPopup) return;

    var isPopupOpen = false;
    var hoverCloseTimer = null;
    var HOVER_DELAY = 300;

    var openPopup = function() {
      clearTimeout(hoverCloseTimer);
      cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      cartPopup.classList.add('opacity-100', 'pointer-events-auto');
      isPopupOpen = true;
      renderCartPopup(window.cart).catch(function(err) { console.error('Failed to render popup:', err); });
    };

    var closePopup = function() {
      clearTimeout(hoverCloseTimer);
      cartPopup.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      cartPopup.classList.remove('opacity-100', 'pointer-events-auto');
      isPopupOpen = false;
    };

    cartEntry.addEventListener('mouseenter', function() {
      if (!isPopupOpen) openPopup();
    });

    cartEntry.addEventListener('mouseleave', function() {
      if (!isPopupOpen) {
        hoverCloseTimer = setTimeout(closePopup, HOVER_DELAY);
      }
    });

    cartEntry.addEventListener('click', function(e) {
      var isControlBtn = e.target.closest('.cart-qty-minus, .cart-qty-plus, .cart-qty-input, .cart-item-delete');
      if (!isControlBtn) {
        isPopupOpen ? closePopup() : openPopup();
      }
    });

    var closeBtn = cartPopup.querySelector('.cart-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closePopup();
      });
    }

    document.addEventListener('click', function(e) {
      if (isPopupOpen && !cartPopup.contains(e.target) && !cartEntry.contains(e.target)) {
        closePopup();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isPopupOpen) {
        closePopup();
      }
    });

    cartPopup.addEventListener('mouseenter', function() {
      clearTimeout(hoverCloseTimer);
    });
    cartPopup.addEventListener('mouseleave', function() {
      if (!isPopupOpen) {
        hoverCloseTimer = setTimeout(closePopup, HOVER_DELAY);
      }
    });
  }

  async function renderCartPopup(cart) {
    var popupItems = document.getElementById('cart-popup-items');
    var popupTotal = document.getElementById('cart-popup-total');
    var cartCount = document.getElementById('cart-count');
    var cartTitle = document.getElementById('cart-popup-title');

    if (!popupItems || !popupTotal || !cartCount) {
      console.warn('Cart popup core DOM missing');
      return;
    }

    var cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
    var totalItemCount = cartItems.reduce(function(sum, item) { return sum + (item.num || 0); }, 0);

    cartCount.textContent = totalItemCount;
    if (cartTitle) cartTitle.textContent = 'Your Cart (' + totalItemCount + ' items)';

    if (totalItemCount === 0) {
      popupItems.innerHTML = '<div class="text-center text-gray-500 py-6"><i class="fa-solid fa-cart-shopping text-3xl mb-2"></i><p>Your cart is empty</p></div>';
      popupTotal.textContent = window.AppUtils.formatPrice(0);
      return;
    }

    popupItems.innerHTML = '';
    var validCartItems = cartItems.filter(function(item) { return item && item.pid && item.num > 0; });

    for (var i = 0; i < validCartItems.length; i++) {
      var item = validCartItems[i];
      try {
        var product = null;
        if (window.productCache.has(item.pid)) {
          product = window.productCache.get(item.pid);
        } else {
          var res = await axios.get(window.AppConfig.API_BASE_URL + '/products/detail?pid=' + item.pid);
          if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response');
          product = res.data.data || {};
          window.productCache.set(item.pid, product);
        }

        var productName = product.name || 'Product #' + item.pid;
        var productPrice = parseFloat(product.price || 0) || 0;
        var formattedPrice = window.AppUtils.formatPrice(productPrice);

        var itemEl = document.createElement('div');
        itemEl.className = 'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b';
        itemEl.dataset.pid = item.pid;
        itemEl.innerHTML = '<div class="cart-item-name font-medium">' + productName + '</div>' +
          '<div class="cart-item-price text-blue-600 font-bold">' + formattedPrice + '</div>' +
          '<div class="flex items-center gap-2">' +
          '<button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center" data-pid="' + item.pid + '"><i class="fa-solid fa-minus text-sm"></i></button>' +
          '<input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 rounded-md text-center text-sm" value="' + (item.num || 1) + '" min="1" data-pid="' + item.pid + '">' +
          '<button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center" data-pid="' + item.pid + '"><i class="fa-solid fa-plus text-sm"></i></button>' +
          '</div>' +
          '<button class="cart-item-delete text-red-500 hover:text-red-700 transition-colors" data-pid="' + item.pid + '"><i class="fa-solid fa-trash-can"></i></button>';

        popupItems.appendChild(itemEl);
      } catch (error) {
        console.error('Failed to render product ' + item.pid + ':', error);
        var fallbackEl = document.createElement('div');
        fallbackEl.className = 'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b';
        fallbackEl.innerHTML = '<div class="font-medium">Product #' + item.pid + '</div><div class="text-blue-600 font-bold">$0.00</div>' +
          '<div class="flex items-center gap-2"><button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300" data-pid="' + item.pid + '"><i class="fa-solid fa-minus"></i></button>' +
          '<input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 text-center" value="' + (item.num || 1) + '" min="1" data-pid="' + item.pid + '">' +
          '<button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300" data-pid="' + item.pid + '"><i class="fa-solid fa-plus"></i></button></div>' +
          '<button class="cart-item-delete text-red-500" data-pid="' + item.pid + '"><i class="fa-solid fa-trash-can"></i></button>';
        popupItems.appendChild(fallbackEl);
      }
    }

    var totalPrice = validCartItems.reduce(function(sum, item) {
      var product = window.productCache.get(item.pid) || {};
      var price = parseFloat(product.price || 0) || 0;
      return sum + (price * (item.num || 0));
    }, 0);
    popupTotal.textContent = window.AppUtils.formatPrice(totalPrice);
  }

  async function renderCartUI(cart) {
    var cartItemsEl = document.getElementById('cart-items');
    var cartTotalEl = document.getElementById('cart-total');
    var cartTitleEl = document.getElementById('cart-title');
    var cartCountEl = document.getElementById('cart-count');

    if (!cartItemsEl || !cartTotalEl || !cartTitleEl) return;

    var cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
    var validCartItems = cartItems.filter(function(item) { return item && item.pid && item.num > 0; });
    var totalItemCount = validCartItems.reduce(function(sum, item) { return sum + (item.num || 0); }, 0);

    cartTitleEl.textContent = 'My Shopping Cart (' + totalItemCount + ' items)';
    if (cartCountEl) cartCountEl.textContent = totalItemCount;

    if (totalItemCount === 0) {
      cartItemsEl.innerHTML = '<div class="text-center text-gray-500 py-12"><i class="fa-solid fa-cart-shopping text-5xl mb-4"></i><h3 class="text-xl font-bold mb-2">Your cart is empty</h3><p class="mb-4">Browse our products and add items to your cart</p><a href="/index.html" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Continue Shopping</a></div>';
      cartTotalEl.textContent = window.AppUtils.formatPrice(0);
      return;
    }

    var cartHtml = '';
    for (var i = 0; i < validCartItems.length; i++) {
      var item = validCartItems[i];
      try {
        var product = null;
        if (window.productCache.has(item.pid)) {
          product = window.productCache.get(item.pid);
        } else {
          var res = await axios.get(window.AppConfig.API_BASE_URL + '/products/detail?pid=' + item.pid);
          if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response');
          product = res.data.data || {};
          window.productCache.set(item.pid, product);
        }

        var productName = product.name || 'Product #' + item.pid;
        var productPrice = parseFloat(product.price || 0) || 0;
        var productImg = product.img_path || window.AppConfig.DEFAULT_IMG || 'https://via.placeholder.com/80';
        var subtotal = productPrice * (item.num || 1);

        cartHtml += '<div class="flex flex-col md:flex-row items-start md:items-center gap-4 py-4 border-b" data-pid="' + item.pid + '">' +
          '<img src="' + productImg + '" alt="' + productName + '" class="w-20 h-20 object-cover rounded">' +
          '<div class="flex-1 min-w-0"><h4 class="font-medium line-clamp-1">' + productName + '</h4><p class="text-gray-500 text-sm">PID: ' + item.pid + '</p></div>' +
          '<div class="font-bold">' + window.AppUtils.formatPrice(productPrice) + '</div>' +
          '<div class="flex items-center border rounded"><button class="cart-minus px-3 py-1 border-r" data-pid="' + item.pid + '"><i class="fa-solid fa-minus text-sm"></i></button>' +
          '<input type="number" class="cart-num w-12 px-2 py-1 text-center border-0 focus:outline-none" value="' + (item.num || 1) + '" min="1" data-pid="' + item.pid + '">' +
          '<button class="cart-plus px-3 py-1 border-l" data-pid="' + item.pid + '"><i class="fa-solid fa-plus text-sm"></i></button></div>' +
          '<div class="font-bold text-blue-600">' + window.AppUtils.formatPrice(subtotal) + '</div>' +
          '<button class="cart-delete text-red-500 hover:text-red-700" data-pid="' + item.pid + '" onclick="event.stopPropagation()"><i class="fa-solid fa-trash"></i></button></div>';
      } catch (error) {
        console.error('Failed to render product ' + item.pid + ':', error);
        cartHtml += '<div class="flex flex-col md:flex-row items-start md:items-center gap-4 py-4 border-b" data-pid="' + item.pid + '">' +
          '<div class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center"><i class="fa-solid fa-box text-gray-400"></i></div>' +
          '<div class="flex-1 min-w-0"><h4 class="font-medium line-clamp-1">Product #' + item.pid + '</h4><p class="text-gray-500 text-sm">PID: ' + item.pid + '</p></div>' +
          '<div class="font-bold">$0.00</div><div class="flex items-center border rounded"><button class="cart-minus px-3 py-1 border-r" data-pid="' + item.pid + '"><i class="fa-solid fa-minus text-sm"></i></button>' +
          '<input type="number" class="cart-num w-12 px-2 py-1 text-center border-0 focus:outline-none" value="' + (item.num || 1) + '" min="1" data-pid="' + item.pid + '">' +
          '<button class="cart-plus px-3 py-1 border-l" data-pid="' + item.pid + '"><i class="fa-solid fa-plus text-sm"></i></button></div>' +
          '<div class="font-bold text-blue-600">$0.00</div><button class="cart-delete text-red-500 hover:text-red-700" data-pid="' + item.pid + '" onclick="event.stopPropagation()"><i class="fa-solid fa-trash"></i></button></div>';
      }
    }

    cartItemsEl.innerHTML = cartHtml;
    var totalPrice = validCartItems.reduce(function(sum, item) {
      var product = window.productCache.get(item.pid) || {};
      var price = parseFloat(product.price || 0) || 0;
      return sum + (price * (item.num || 0));
    }, 0);
    cartTotalEl.textContent = window.AppUtils.formatPrice(totalPrice);
  }

  function initCartEvents() {
    initCartPopupControl();

    document.addEventListener('click', async function(e) {
      var plusBtn = e.target.closest('.cart-plus, .cart-qty-plus');
      if (plusBtn) {
        var pid = parseInt(plusBtn.dataset.pid);
        if (isNaN(pid)) return;
        var currentItem = window.cart.getCartItem(pid);
        if (!currentItem) return;
        try {
          await window.cart.updateNum(pid, currentItem.num + 1);
          await renderCartPopup(window.cart);
          if (document.getElementById('cart-items')) await renderCartUI(window.cart);
        } catch (error) {
          console.error('Failed to increase quantity:', error);
        }
        return;
      }

      var minusBtn = e.target.closest('.cart-minus, .cart-qty-minus');
      if (minusBtn) {
        var pid = parseInt(minusBtn.dataset.pid);
        if (isNaN(pid)) return;
        var currentItem = window.cart.getCartItem(pid);
        if (!currentItem || currentItem.num <= 1) return;
        try {
          await window.cart.updateNum(pid, currentItem.num - 1);
          await renderCartPopup(window.cart);
          if (document.getElementById('cart-items')) await renderCartUI(window.cart);
        } catch (error) {
          console.error('Failed to decrease quantity:', error);
        }
        return;
      }

      var deleteBtn = e.target.closest('.cart-item-delete, .cart-delete');
      if (deleteBtn) {
        e.stopPropagation();
        var pid = parseInt(deleteBtn.dataset.pid);
        if (isNaN(pid) || pid <= 0) return;
        if (!confirm('Are you sure you want to remove this item?')) return;
        try {
          var deleteSuccess = await window.cart.removeFromCart(pid);
          if (!deleteSuccess) return;
          window.productCache.delete(pid);
          await renderCartPopup(window.cart);
          if (document.getElementById('cart-items')) await renderCartUI(window.cart);
        } catch (error) {
          console.error('Failed to delete product:', error);
        }
        return;
      }
    });

    document.addEventListener('input', async function(e) {
      if (!e.target.classList.contains('cart-num') && !e.target.classList.contains('cart-qty-input')) return;
      var pid = parseInt(e.target.dataset.pid);
      var newNum = Math.max(1, parseInt(e.target.value) || 1);
      if (isNaN(pid)) return;
      var currentItem = window.cart.getCartItem(pid);
      if (!currentItem) return;
      try {
        await window.cart.updateNum(pid, newNum);
        await renderCartPopup(window.cart);
        if (document.getElementById('cart-items')) await renderCartUI(window.cart);
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    });

    var clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', async function(e) {
        e.stopPropagation();
        if (!confirm('Are you sure you want to clear your cart?')) return;
        try {
          await window.cart.clearCart();
          window.productCache.clear();
          await renderCartPopup(window.cart);
          if (document.getElementById('cart-items')) await renderCartUI(window.cart);
          var cartPopup = document.getElementById('cart-popup');
          if (cartPopup) {
            cartPopup.classList.add('hidden', 'opacity-0', 'pointer-events-none');
          }
        } catch (error) {
          console.error('Failed to clear cart:', error);
        }
      });
    }
  }

  global.addToCart = async function(pid, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log('[Add to Cart] Received PID:', pid);
    var validPid = parseInt(pid) || 0;

    if (!window.cart) {
      console.log('[Add to Cart] Cart not initialized, initializing...');
      initCartGlobal();
      await window.cart.load();
    }

    if (validPid <= 0) {
      alert('Invalid product ID');
      return;
    }

    try {
      var product = null;
      if (window.productCache.has(validPid)) {
        product = window.productCache.get(validPid);
      } else {
        var res = await axios.get(window.AppConfig.API_BASE_URL + '/products/detail?pid=' + validPid);
        if (!res.data || !res.data.data) {
          alert('Product not found');
          return;
        }
        product = res.data.data;
        window.productCache.set(validPid, product);
      }

      await window.cart.addToCart(validPid, 1);

      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);

      alert((product.name || 'Product #' + validPid) + ' added to cart!');

      var cartPopup = document.getElementById('cart-popup');
      if (cartPopup) {
        cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        cartPopup.classList.add('opacity-100', 'pointer-events-auto');
      }
    } catch (error) {
      console.error('[Add to Cart] Failed:', error);
      alert('Failed to add product to cart: ' + error.message);
    }
  };

  document.addEventListener('DOMContentLoaded', async function() {
    if (!window.cartInitialized) {
      initCartGlobal();
      if (window.cart) {
        await window.cart.load();
        await renderCartPopup(window.cart);
        if (document.getElementById('cart-items')) await renderCartUI(window.cart);
      }
    }
  });

  global.addEventListener('pageshow', async function() {
    if (window.cart && window.cartInitialized) {
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);
    } else if (!window.cartInitialized) {
      initCartGlobal();
      if (window.cart) {
        await window.cart.load();
        await renderCartPopup(window.cart);
        if (document.getElementById('cart-items')) await renderCartUI(window.cart);
      }
    }
  });

})(window);