hereconst axios = require('axios');

class XRocketService {
  constructor() {
    this.baseURL = process.env.XROCKET_BASE_URL;
    this.apiToken = process.env.XROCKET_API_TOKEN;
    this.appId = process.env.XROCKET_APP_ID;
  }

  // 🔑 Auth headers
  getHeaders() {
    return {
      'X-Api-Token': this.apiToken,
      'X-App-Id': this.appId,
      'Content-Type': 'application/json'
    };
  }

  // 💰 Get main account balance
  async getBalance() {
    try {
      const response = await axios.get(
        `${this.baseURL}/balance`,
        { headers: this.getHeaders() }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Balance fetch failed' 
      };
    }
  }

  // 🔍 Get user info by X-Rocket ID
  async getUserInfo(telegramId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${telegramId}`,
        { headers: this.getHeaders() }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { 
        success: false, 
        error: 'User not found on X-Rocket' 
      };
    }
  }
  // 💸 Transfer to X-Rocket user (P2P)
  async transferToUser({
    receiverTelegramId,
    amount,
    asset = 'USDT',
    memo = 'Titan P2P Transfer'
  }) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transfers`,
        {
          receiver_id: receiverTelegramId,
          amount: amount.toString(),
          asset,
          memo
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        transferId: response.data.id,
        data: response.data
      };
    } catch (err) {
      console.error('Transfer Error:', err.response?.data);
      return {
        success: false,
        error: err.response?.data?.message || 'Transfer failed'
      };
    }
  }

  // 🔍 Check transfer status
  async checkTransfer(transferId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transfers/${transferId}`,
        { headers: this.getHeaders() }
      );
      return { 
        success: true, 
        status: response.data.status,
        data: response.data 
      };
    } catch (err) {
      return { success: false, error: 'Status check failed' };
    }
  }
  // 📜 Get transfer history
  async getHistory(limit = 50) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transfers?limit=${limit}`,
        { headers: this.getHeaders() }
      );
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: 'History fetch failed' };
    }
  }
}

module.exports = new XRocketService();
