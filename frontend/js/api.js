const API_BASE_URL = window.location.origin + '/api';

class ApiService {
  static getToken() {
    return localStorage.getItem('token');
  }

  static async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  static async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  static async registerShop(shopName, adminUsername, adminPassword) {
    return this.request('/auth/register-shop', {
      method: 'POST',
      body: JSON.stringify({ shopName, adminUsername, adminPassword })
    });
  }

  static async getDashboardStats() {
    return this.request('/dashboard');
  }

  static async getProducts(search = '') {
    return this.request(`/products${search ? `?search=${search}` : ''}`);
  }
  
  static async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  static async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  static async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  static async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  static async getSuppliers() {
    return this.request('/suppliers');
  }

  static async createSupplier(supplierData) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  }

  static async deleteSupplier(id) {
    return this.request(`/suppliers/${id}`, {
      method: 'DELETE'
    });
  }

  static async updateStock(productId, action, quantity) {
    return this.request('/inventory/update', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, action, quantity: parseInt(quantity, 10) })
    });
  }

  static async getInventoryLogs() {
    return this.request('/inventory/logs');
  }

  static async getCurrentUser() {
    return this.request('/auth/me');
  }

  static async getStaffUsers() {
    return this.request('/users');
  }

  static async createStaffUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async updateStaffUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async deleteStaffUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  static async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  static async changeStaffPassword(id, password) {
    return this.request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password })
    });
  }
}
