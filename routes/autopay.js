const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const xrocketService = require('../services/xrocketService');
const { notifyUser } = require('../services/socketService');

// 🚀 1. Initiate Auto-Pay Transfer
router.post('/initiate', async (req, res) => {
  try {
    const { senderTelegramId, receiverTelegramId, amount, asset = 'USDT', memo = 'Titan P2P Transfer' } = req.body;

    if (!senderTelegramId || !receiverTelegramId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // 2. Validate receiver account exists on X-Rocket
    const receiverCheck = await xrocketService.getUserInfo(receiverTelegramId);
    if (!receiverCheck.success) {
      return res.status(400).json({ success: false, error: 'Receiver not found on X-Rocket' });
    }

    // 3. Log transaction as pending/processing
    const transaction = new Transaction({
      senderId: senderTelegramId,
      senderTelegramId,
      receiverId: receiverTelegramId,
      receiverTelegramId,
      type: 'p2p_transfer',
      asset,
      amount,
      fee: 0,
      netAmount: amount,
      status: 'processing',
      memo
    });
    await transaction.save();

    // 4. Execute Auto-Transfer via X-Rocket API
    const transferResult = await xrocketService.transferToUser({
      receiverTelegramId,
      amount,
      asset,
      memo
    });

    if (transferResult.success) {
      // 5. Update DB with success
      transaction.status = 'completed';
      transaction.transferId = transferResult.transferId;
      transaction.apiResponse = transferResult.data;      transaction.processedAt = new Date();
      await transaction.save();

      // 6. Notify both users via Socket
      notifyUser(senderTelegramId, 'transfer_success', {
        transactionId: transaction._id,
        amount,
        asset,
        receiver: receiverTelegramId
      });

      notifyUser(receiverTelegramId, 'payment_received', {
        transactionId: transaction._id,
        amount,
        asset,
        sender: senderTelegramId
      });

      return res.json({
        success: true,
        message: 'Transfer completed successfully',
        transactionId: transaction._id,
        transferId: transferResult.transferId
      });
    } else {
      // Handle API failure
      transaction.status = 'failed';
      transaction.errorMessage = transferResult.error;
      await transaction.save();

      notifyUser(senderTelegramId, 'transfer_failed', {
        transactionId: transaction._id,
        error: transferResult.error
      });

      return res.status(400).json({
        success: false,
        error: transferResult.error,
        transactionId: transaction._id
      });
    }

  } catch (err) {
    console.error('Initiate Transfer Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 🔍 Check Transaction Status
router.get('/status/:id', async (req, res) => {  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Not found' });
    
    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 📜 Get User Transaction History
router.get('/history/:telegramId', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { senderTelegramId: req.params.telegramId },
        { receiverTelegramId: req.params.telegramId }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
