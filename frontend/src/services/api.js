// API Service for Frontend
class API {
  constructor() {
    // In production (when served by FastAPI), we use the relative path /api
    // In development, we use the local backend at localhost:8000
    const defaultBaseURL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api';
    this.baseURL = process.env.REACT_APP_API_URL || defaultBaseURL;
  }

  async request(method, endpoint, data = null, isFormData = false) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
      },
    };

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (parseError) {
        // If parsing fails, use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Generic HTTP methods
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data = null) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data = null) {
    return this.request('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // Detection endpoints
  async detectDamage(formData, metadata = null) {
    const url = `${this.baseURL}/detection/detect`;
    
    // Ensure formData has metadata appended
    if (metadata) {
      if (metadata.latitude) formData.append('latitude', metadata.latitude);
      if (metadata.longitude) formData.append('longitude', metadata.longitude);
      if (metadata.road_type) formData.append('road_type', metadata.road_type);
    }

    try {
      console.log('Sending detection request to:', url);
      console.log('FormData entries:', Array.from(formData.entries()).map(([k,v]) => [k, v instanceof File ? `File: ${v.name} (${v.size} bytes)` : v]));
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // NOTE: Don't set Content-Type header for FormData - browser will set it with correct boundary
      });

      console.log('Detection response status:', response.status);
      console.log('Detection response headers:', response.headers);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        console.error('Detection error response body:', errorText);
        throw new Error(`Detection failed with status ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const result = await response.json();
      console.log('Detection success:', result);
      return result;
    } catch (error) {
      console.error('Detection fetch error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Provide more specific error message for network errors
      if (error.name === 'TypeError' && error.message.includes('failed to fetch')) {
        throw new Error(`Network error - Unable to reach server at ${url}. Check if backend is running and CORS is configured correctly.`);
      }
      throw error;
    }
  }

  async getReport(reportId) {
    return this.request('GET', `/detection/report/${reportId}`);
  }

  async getRecentReports(limit = 10) {
    return this.request('GET', `/detection/reports/recent?limit=${limit}`);
  }

  async getDetectionStats() {
    return this.request('GET', `/detection/stats`);
  }

  async detectVideo(formData, frameInterval = 30) {
    const url = `${this.baseURL}/detection/detect-video?frame_interval=${frameInterval}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Video detection failed with status ${response.status}`);
    }

    return response.json();
  }

  async detectFrame(formData) {
    const url = `${this.baseURL}/detection/detect-frame`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Frame detection failed with status ${response.status}`);
    }

    return response.json();
  }

  // Contractor endpoints
  async recommendContractors(reportId) {
    return this.request('GET', `/contractors/recommend/${reportId}`);
  }

  async getContractors() {
    return this.request('GET', `/contractors/all`);
  }

  async getNearbyContractors(latitude, longitude, damageType = null) {
    let endpoint = `/contractors/nearby?latitude=${latitude}&longitude=${longitude}`;
    if (damageType) endpoint += `&damage_type=${damageType}`;
    return this.request('GET', endpoint);
  }

  async getContractor(contractorId) {
    return this.request('GET', `/contractors/${contractorId}`);
  }

  // Alert endpoints
  async sendAlert(reportId, phoneNumbers) {
    return this.request('POST', `/alerts/send-alert/${reportId}`, { phone_numbers: phoneNumbers });
  }

  async sendContractorAlert(reportId) {
    return this.request('POST', `/alerts/send-to-contractors/${reportId}`);
  }

  // Dashboard endpoints
  async getDashboardOverview() {
    return this.request('GET', '/dashboard/overview');
  }

  async getStatistics(days = 30, damageType = null) {
    let endpoint = `/dashboard/statistics?days=${days}`;
    if (damageType) endpoint += `&damage_type=${damageType}`;
    return this.request('GET', endpoint);
  }

  async getMapData() {
    return this.request('GET', `/dashboard/map-data`);
  }

  async getAlertsStatus() {
    return this.request('GET', `/dashboard/alerts-status`);
  }

  // Datasets endpoints
  async getDatasetsOverview() {
    return this.request('GET', '/datasets/overview');
  }

  async getArchiveImages(archiveName, category = null) {
    let endpoint = `/datasets/${archiveName}/images`;
    if (category) endpoint += `?category=${category}`;
    return this.request('GET', endpoint);
  }

  // AI Chat endpoints
  async chatWithAI(message, analysisContext = null, conversationHistory = []) {
    const url = `${this.baseURL}/ai/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        analysis_context: analysisContext,
        conversation_history: conversationHistory,
      }),
    });
    if (!response.ok) throw new Error(`AI Chat failed with status ${response.status}`);
    return response.json();
  }
}

const api = new API();
export default api;
