const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  senderId: { type: String, required: true, index: true },
  senderTelegramId: { type: String, required: true },
  receiverId: { type: String, required: true, index: true },
  receiverTelegramId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['p2p_transfer', 'withdrawal', 'task_pay', 'referral_pay'], 
    required: true 
  },
  asset: { type: String, default: 'USDT' },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  transferId: { type: String, unique: true, sparse: true },
  memo: String,
  apiResponse: { type: Object },
  errorMessage: String,
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
