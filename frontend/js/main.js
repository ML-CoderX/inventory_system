document.addEventListener('DOMContentLoaded', () => {
  // Check auth status for protected pages
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!isLoginPage && !token) {
    window.location.href = 'index.html';
  } else if (isLoginPage && token) {
    window.location.href = 'dashboard.html';
  }

  if (user && document.getElementById('usernameDisplay')) {
    document.getElementById('usernameDisplay').textContent = user.username;
  }

  // Load and enforce permissions dynamically on every protected page
  if (!isLoginPage && token) {
    // Initial enforcement using cached credentials
    enforcePermissions(user);

    // Refresh credentials with live API check to capture permission updates
    ApiService.getCurrentUser()
      .then(fullUser => {
        localStorage.setItem('user', JSON.stringify(fullUser));
        enforcePermissions(fullUser);
      })
      .catch(err => {
        console.error('Error fetching fresh user permissions:', err);
      });
  }

  // Handle Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    // Inject Change Password button next to logout button for admins only
    if (user && user.role === 'admin' && !document.getElementById('changePasswordBtn')) {
      const changePasswordBtn = document.createElement('button');
      changePasswordBtn.id = 'changePasswordBtn';
      changePasswordBtn.className = 'btn btn-primary';
      changePasswordBtn.style.marginRight = 'var(--space-1)';
      changePasswordBtn.textContent = 'Change Password';
      logoutBtn.parentElement.insertBefore(changePasswordBtn, logoutBtn);
      
      // Wire event listener to open password change modal
      changePasswordBtn.addEventListener('click', () => {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
          document.getElementById('cpCurrentPassword').value = '';
          document.getElementById('cpNewPassword').value = '';
          modal.showModal();
        }
      });
    }

    // Inject Change Password modal dialog dynamically if not present
    if (!document.getElementById('changePasswordModal')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'changePasswordModal';
      dialog.innerHTML = `
        <div class="dialog-header">
          <h3>Change Password</h3>
          <button class="close-dialog" id="closeCpModalBtn">&times;</button>
        </div>
        <form id="changePasswordForm">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" id="cpCurrentPassword" class="form-control" required placeholder="Enter current password">
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" id="cpNewPassword" class="form-control" required minlength="6" placeholder="Enter new password (min 6 chars)">
          </div>
          <div class="flex-between mt-2">
            <button type="button" class="btn btn-danger" id="cancelCpBtn">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </div>
        </form>
      `;
      document.body.appendChild(dialog);

      // Wire close handlers
      document.getElementById('closeCpModalBtn').addEventListener('click', () => dialog.close());
      document.getElementById('cancelCpBtn').addEventListener('click', () => dialog.close());

      // Wire submit handler
      document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('cpCurrentPassword').value;
        const newPassword = document.getElementById('cpNewPassword').value;

        try {
          const res = await ApiService.changePassword(currentPassword, newPassword);
          alert(res.message || 'Password updated successfully!');
          dialog.close();
        } catch (err) {
          alert(err.message || 'Failed to update password');
        }
      });
    }

    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    });
  }

  // Handle Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      try {
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        
        const data = await ApiService.login(username, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = 'dashboard.html';
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
      }
    });
  }

  // Handle Register Shop Dialog
  const registerShopModal = document.getElementById('registerShopModal');
  const openRegisterModalBtn = document.getElementById('openRegisterModal');
  const closeRegisterModalBtn = document.getElementById('closeRegisterModalBtn');
  const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
  const registerForm = document.getElementById('registerForm');

  if (openRegisterModalBtn && registerShopModal) {
    openRegisterModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (registerForm) registerForm.reset();
      document.getElementById('registerError').classList.add('hidden');
      document.getElementById('registerSuccess').classList.add('hidden');
      registerShopModal.showModal();
    });
  }

  if (closeRegisterModalBtn && registerShopModal) {
    closeRegisterModalBtn.addEventListener('click', () => registerShopModal.close());
  }
  if (cancelRegisterBtn && registerShopModal) {
    cancelRegisterBtn.addEventListener('click', () => registerShopModal.close());
  }

  if (registerForm && registerShopModal) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const shopName = document.getElementById('regShop').value.trim();
      const adminUsername = document.getElementById('regUsername').value.trim();
      const adminPassword = document.getElementById('regPassword').value;
      const errorDiv = document.getElementById('registerError');
      const successDiv = document.getElementById('registerSuccess');
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      try {
        submitBtn.textContent = 'Registering Shop...';
        submitBtn.disabled = true;
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');

        const res = await ApiService.registerShop(shopName, adminUsername, adminPassword);
        successDiv.textContent = res.message || 'Shop successfully registered!';
        successDiv.classList.remove('hidden');

        registerForm.reset();

        // Close register dialog after 2 seconds automatically
        setTimeout(() => {
          registerShopModal.close();
        }, 2000);
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
      } finally {
        submitBtn.textContent = 'Create Database & Register';
        submitBtn.disabled = false;
      }
    });
  }

});

// Enforce permission-based UI styling dynamically
function enforcePermissions(user) {
  if (!user) return;

  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    // 1. Add "Staff Accounts" link for admins if not present
    let staffLink = navMenu.querySelector('a[href="staff.html"]');
    if (user.role === 'admin' && !staffLink) {
      const li = document.createElement('li');
      const isStaffPage = window.location.pathname.endsWith('staff.html');
      li.innerHTML = `<a href="staff.html" class="${isStaffPage ? 'active' : ''}">Staff Accounts</a>`;
      navMenu.appendChild(li);
    }

    // 2. Hide Reports link for unauthorized staff
    let reportsLink = navMenu.querySelector('a[href="reports.html"]');
    if (reportsLink && user.role !== 'admin' && !user.can_view_reports) {
      reportsLink.parentElement.remove();
      // Redirect if unauthorized user attempts to stay on reports page
      if (window.location.pathname.endsWith('reports.html')) {
        window.location.href = 'dashboard.html';
      }
    }
  }

  // Redirect if unauthorized user tries to access staff accounts page
  if (window.location.pathname.endsWith('staff.html') && user.role !== 'admin') {
    window.location.href = 'dashboard.html';
  }

  // 3. Hide add/create buttons based on permissions
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn && user.role !== 'admin' && !user.can_manage_products) {
    addProductBtn.classList.add('hidden');
  }

  const addSupplierBtn = document.getElementById('addSupplierBtn');
  if (addSupplierBtn && user.role !== 'admin' && !user.can_manage_suppliers) {
    addSupplierBtn.classList.add('hidden');
  }
}

// Helper for UI notifications
function showNotification(message, type = 'success') {
  alert(message); // Could be replaced with a beautiful toast notification
}
