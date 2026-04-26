/**
 * User Page Logic
 * 用户页面特有逻辑：订单列表、标签切换
 */
import { orderApi } from '../api/orders.js';
import { authApi } from '../api/auth.js';

document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.user-sidebar .btn[data-target]');
  const contentAreas = document.querySelectorAll('.content-area');

  buttons.forEach(button => {
    button.addEventListener('click', function() {
      buttons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      const targetId = this.getAttribute('data-target');
      contentAreas.forEach(area => area.classList.remove('active'));

      const targetArea = document.getElementById(targetId);
      if (targetArea) {
        targetArea.classList.add('active');
      }
    });
  });

  document.querySelector('[data-target="orders-content"]').addEventListener('click', () => {
    setTimeout(loadUserOrders, 100);
  });

  loadUserOrders();
});

async function loadUserOrders() {
  const listEl = document.getElementById('realOrdersList');
  if (!listEl) return;

  try {
    const result = await orderApi.getUserRecent();

    if (result.code !== 0 || !result.data || result.data.length === 0) {
      listEl.innerHTML = '<p class="text-gray-500">You have no orders yet.</p>';
      return;
    }

    let html = '';
    result.data.forEach(order => {
      let items = [];
      try {
        items = JSON.parse(order.items_json);
      } catch (e) {}

      const itemText = items.map(i => `Product #${i.pid} × ${i.num}`).join(', ');

      html += `
      <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="text-sm text-gray-500">Order #${order.id}</span>
            <p class="font-medium">Total: ${order.currency} ${order.total_price}</p>
          </div>
          <span class="px-2 py-1 rounded text-xs font-medium ${
            order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }">
            ${order.status}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          <p>${itemText || 'No items'}</p>
        </div>
      </div>
      `;
    });

    listEl.innerHTML = html;
  } catch (err) {
    listEl.innerHTML = '<p class="text-red-500">Failed to load orders</p>';
  }
}

export { loadUserOrders };