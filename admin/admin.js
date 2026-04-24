// 接口基础路径：匹配你的app.js端口，无需修改
// const baseUrl = 'http://localhost:3000/api';
const baseUrl = '/api';

// 页面加载时加载分类+产品列表
window.onload = () => {
  getCateList();
  getProList();
};

// ==================== 分类管理（增删改）====================
// 1. 获取所有分类（渲染下拉框+列表）
function getCateList() {
  axios.get(`${baseUrl}/cate/all`).then(res => {
    const data = res.data.data;
    const cateTable = document.getElementById('cateTable');
    const addProCate = document.getElementById('addProCate');
    const editProCate = document.getElementById('editProCate');
    
    // 清空列表和下拉框
    cateTable.innerHTML = '<tr><th>分类ID</th><th>分类名</th><th>操作</th></tr>';
    addProCate.innerHTML = '<option value="">请选择分类</option>';
    editProCate.innerHTML = '<option value="">请选择分类</option>';

    // 渲染分类列表和产品表单的分类下拉框
    data.forEach(cate => {
      // 分类列表
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cate.catid}</td>
        <td>${cate.name}</td>
        <td>
          <button onclick="editCate(${cate.catid}, '${cate.name}')">修改</button>
          <button onclick="delCate(${cate.catid})">删除</button>
        </td>
      `;
      cateTable.appendChild(tr);

      // 产品表单的分类下拉选项
      addProCate.innerHTML += `<option value="${cate.catid}">${cate.name}</option>`;
      editProCate.innerHTML += `<option value="${cate.catid}">${cate.name}</option>`;
    });
  }).catch(err => {
    const errMsg = err.response?.data?.msg || err.message || "加载分类失败：未知错误";
    alert(errMsg);
  });
}

// 2. 新增分类（表单提交）
document.getElementById('addCateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim(); // 输入清洗：去除首尾空格
  axios.post(`${baseUrl}/cate/add`, { name }).then(res => {
    alert(res.data.msg);
    e.target.reset();
    getCateList(); // 刷新分类列表
    getProList();  // 刷新产品列表
    // ======== 新增：标记分类已更新（用于首页实时同步） ========
    localStorage.setItem('cateUpdated', Date.now());
  }).catch(err => {
    const errMsg = err.response?.data?.msg || err.message || "新增分类失败：未知错误";
    alert(errMsg);
  });
});

// 3. 编辑分类（赋值到表单）
function editCate(catid, name) {
  document.getElementById('editCateId').value = catid;
  document.getElementById('editCateName').value = name;
}

// 4. 保存分类修改
document.getElementById('editCateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const catid = e.target.catid.value;
  const name = e.target.name.value.trim(); // 输入清洗
  axios.post(`${baseUrl}/cate/edit`, { catid, name }).then(res => {
    alert(res.data.msg);
    e.target.reset();
    getCateList();
    getProList();
    // ======== 新增：标记分类已更新（用于首页实时同步） ========
    localStorage.setItem('cateUpdated', Date.now());
  }).catch(err => {
    const errMsg = err.response?.data?.msg || err.message || "修改分类失败：未知错误";
    alert(errMsg);
  });
});

// 5. 删除分类
function delCate(catid) {
  if (confirm('删除分类会同时删除关联产品和图片，确定吗？')) {
    axios.get(`${baseUrl}/cate/del/${catid}`).then(res => {
      alert(res.data.msg);
      getCateList();
      getProList();
      // ======== 新增：标记分类已更新（用于首页实时同步） ========
      localStorage.setItem('cateUpdated', Date.now());
    }).catch(err => {
      const errMsg = err.response?.data?.msg || err.message || "删除分类失败：未知错误";
      alert(errMsg);
    });
  }
}

// ==================== 产品管理（增删改+图片上传）====================
// 1. 获取所有产品【核心修复：图片路径+分类名字段】
function getProList() {
  axios.get(`${baseUrl}/products/list`).then(res => {
    const data = res.data.data;
    const proTable = document.getElementById('proTable');
    proTable.innerHTML = '<tr><th>产品ID</th><th>分类</th><th>产品名</th><th>价格</th><th>图片</th><th>操作</th></tr>';

    data.forEach(pro => {
      const tr = document.createElement('tr');
      // 核心修复1：区分新旧商品的图片路径
      let imgHtml = '无图片';
      if (pro.img_path) {
        // 判断是旧商品（直接图片路径）还是新商品（文件夹路径）
        const imgSrc = pro.img_path.includes('.jpg') 
          ? pro.img_path  // 旧商品：直接用完整图片路径
          : `${pro.img_path}/thumb.jpg`; // 新商品：拼接缩略图路径
        
        // 核心修复2：使用正确的图片路径（不再指向uploads）
        imgHtml = `<img src="${imgSrc}" width="50" height="50" onerror="this.src='../images/default.png'">`;
      }
      
      // 核心修复3：分类名字段从 cate_name → cateName（匹配后端返回）
      tr.innerHTML = `
        <td>${pro.pid}</td>
        <td>${pro.cateName || '未知分类'}</td>
        <td>${pro.name}</td>
        <td>$${pro.price.toFixed(2)}</td>
        <td>${imgHtml}</td>
        <td>
          <button onclick="editPro(${pro.pid}, ${pro.catid}, '${pro.name}', ${pro.price}, '${(pro.description || '').replace(/'/g, '&apos;')}')">修改</button>
          <button onclick="delPro(${pro.pid})">删除</button>
        </td>
      `;
      proTable.appendChild(tr);
    });
  }).catch(err => {
    const errMsg = err.response?.data?.msg || err.message || "加载产品失败：未知错误";
    alert(errMsg);
  });
}

// 2. 新增产品【保留：FormData+图片大小校验 + 新增FormData日志】
document.getElementById('addProForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fileInput = e.target.proImg;
  const file = fileInput.files[0];
  // Phase2B硬性要求：图片大小≤10MB
  if (file && file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过10MB！（Phase2B要求）');
    return;
  }
  const formData = new FormData(e.target);
  
  // ======== 新增：打印FormData所有字段（用于验证文件是否封装） ========
  console.log('===== 新增产品 - FormData 内容 =====');
  for (let [key, value] of formData.entries()) {
    console.log('FormData字段：', key, value); // 文件会显示为 File 对象
  }
  // ================================================================

  axios.post(`${baseUrl}/products/add`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => {
    alert(res.data.msg);
    e.target.reset();
    getProList(); // 刷新产品列表
  }).catch(err => {
    const errMsg = err.response?.data?.msg || err.message || "新增产品失败：未知错误";
    alert(errMsg);
  });
});

// 3. 编辑产品（赋值到表单+单引号转义，避免JS报错）
function editPro(pid, catid, name, price, description) {
  const escapeDesc = (description || '').replace(/'/g, '&apos;');
  document.getElementById('editProId').value = pid;
  document.getElementById('editProCate').value = catid;
  document.getElementById('editProName').value = name;
  document.getElementById('editProPrice').value = price;
  document.getElementById('editProDesc').value = escapeDesc;
  document.getElementById('editProForm').style.display = 'block';
}

// 4. 取消产品修改
document.getElementById('cancelEdit').addEventListener('click', () => {
  document.getElementById('editProForm').style.display = 'none';
  document.getElementById('editProForm').reset();
});

// 5. 保存产品修改【保留：FormData+图片校验 + 新增FormData日志】
document.getElementById('editProForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fileInput = e.target.proImg;
  const file = fileInput.files[0];
  // Phase2B图片大小校验
  if (file && file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过10MB！（Phase2B要求）');
    return;
  }
  const formData = new FormData(e.target);
  
  // ======== 新增：打印FormData所有字段（用于验证文件是否封装） ========
  console.log('===== 编辑产品 - FormData 内容 =====');
  for (let [key, value] of formData.entries()) {
    console.log('FormData字段：', key, value); // 文件会显示为 File 对象
  }
  // ================================================================

  axios.post(`${baseUrl}/products/edit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => {
    alert(res.data.msg);
    e.target.reset();
    document.getElementById('editProForm').style.display = 'none';
    getProList();
  }).catch(err => {
    const errMsg = err.response?.data?.msg || err.message || "修改产品失败：未知错误";
    alert(errMsg);
  });
});

// 6. 删除产品【保留：图片清理提示】
function delPro(pid) {
  if (confirm('删除产品会同时删除服务器上的原图和缩略图，确定吗？')) {
    axios.get(`${baseUrl}/products/del/${pid}`).then(res => {
      alert(res.data.msg);
      getProList();
    }).catch(err => {
      const errMsg = err.response?.data?.msg || err.message || "删除产品失败：未知错误";
      alert(errMsg);
    });
  }
}

// Log Out 按钮点击事件
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    // 调用后端登出接口，清除 Cookie
    await axios.get('/api/logout');
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    // 清除 localStorage 里的角色缓存
    localStorage.removeItem('userRole');
    // 强制跳转到首页
    window.location.replace('/');
  }
});

// Back 按钮点击事件：直接回首页
document.getElementById('backBtn').addEventListener('click', () => {
  window.location.replace('/index.html');
});

// Orders 按钮点击事件：导航到管理员订单页
document.getElementById('ordersBtn').addEventListener('click', () => {
  window.location.replace('/admin/orders.html');
});

async function loadOrders() {
  const r = await fetch('/api/orders/admin/all');
  const data = await r.json();
  const list = document.getElementById('order-list');

  if (data.code !== 0) {
    list.innerHTML = '<p class="text-red-500">Failed to load orders</p>';
    return;
  }

  data.data.forEach(o => {
    list.innerHTML += `
      <div class="border p-4 rounded-lg shadow">
        <p><strong>Order ID:</strong> ${o.id}</p>
        <p><strong>User ID:</strong> ${o.userid}</p>
        <p><strong>Total:</strong> ${o.currency} ${o.total_price.toFixed(2)}</p>
        <p><strong>Status:</strong> <span class="px-2 py-1 rounded ${o.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${o.status}</span></p>
        <p><strong>Items:</strong> ${o.items_json}</p>
      </div>
    `;
  });
}
loadOrders();