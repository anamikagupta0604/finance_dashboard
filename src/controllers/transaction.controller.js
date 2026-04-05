const txService = require('../services/transaction.service');

async function createTransaction(req, res, next) {
  try {
    const tx = await txService.createTransaction(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Transaction created.', data: tx });
  } catch (err) { next(err); }
}

async function listTransactions(req, res, next) {
  try {
    const result = await txService.listTransactions({
      type:       req.query.type,
      category:   req.query.category,
      start_date: req.query.start_date,
      end_date:   req.query.end_date,
      page:       parseInt(req.query.page)  || 1,
      limit:      parseInt(req.query.limit) || 20,
      sort:       req.query.sort  || 'date',
      order:      req.query.order || 'desc',
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function getTransaction(req, res, next) {
  try {
    const tx = await txService.getTransactionById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
}

async function updateTransaction(req, res, next) {
  try {
    const tx = await txService.updateTransaction(req.params.id, req.body, req.user.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    res.json({ success: true, message: 'Transaction updated.', data: tx });
  } catch (err) { next(err); }
}

async function deleteTransaction(req, res, next) {
  try {
    const deleted = await txService.deleteTransaction(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    res.json({ success: true, message: 'Transaction soft-deleted.' });
  } catch (err) { next(err); }
}

module.exports = { createTransaction, listTransactions, getTransaction, updateTransaction, deleteTransaction };