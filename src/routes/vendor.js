// src/routes/vendor.js
// Vendor-only endpoints — vendors can ONLY see payments where they've been notified
// GET /api/vendor/my-notifications  — list all payments that concern this vendor (by vendor_name lookup)

import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(requireRole('vendor')); // Only vendors can access this route

// ─── GET VENDOR PAYMENT NOTIFICATIONS ────────────────────────────────────────
// Returns only payments that are Paid AND where vendor_notified = true
// The vendor sees: amount, PO number, payment type, paid date, and UTR reference
router.get('/my-notifications', async (req, res) => {
  try {
    // Lookup POs where vendor_name matches this vendor's name
    const { data: pos, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, po_number, vendor_name')
      .ilike('vendor_name', req.user.name); // match by name registered at signup

    if (poError) throw poError;

    if (!pos || pos.length === 0) {
      return res.json({
        message: 'No purchase orders found linked to your vendor name.',
        data: []
      });
    }

    const poIds = pos.map(p => p.id);

    // Get only Paid + vendor_notified payments for those POs
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        type,
        amount,
        status,
        utr,
        vendor_notified,
        paid_at,
        purchase_orders ( po_number, vendor_name )
      `)
      .in('po_id', poIds)
      .eq('status', 'Paid')
      .eq('vendor_notified', true)
      .order('paid_at', { ascending: false });

    if (payError) throw payError;

    // Strip sensitive internal info — only show what the vendor needs to know
    const vendorView = (payments || []).map(p => ({
      payment_id:    p.id,
      po_number:     p.purchase_orders?.po_number,
      payment_type:  p.type,
      amount_paid:   p.amount,
      utr_reference: p.utr,
      paid_at:       p.paid_at,
      message:       `You have been paid ₹${parseFloat(p.amount).toLocaleString('en-IN')} via UTR: ${p.utr}`
    }));

    res.json({
      vendor: req.user.name,
      total_notifications: vendorView.length,
      data: vendorView
    });
  } catch (err) {
    console.error('GET /vendor/my-notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
