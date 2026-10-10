const express = require('express');
const router = express.Router();

let memorySubaccounts = [
  {
    id: 'ACCT-001',
    name: 'Prem Spawar (ConnectsAI Main)',
    shortName: 'ConnectsAI Agency',
    type: 'Agency Master',
    domain: 'app.connectsai.in',
    displayPhoneNumber: '+91 86603 95136',
    phoneNumberId: '1299345543269323',
    wabaId: '972769282557039',
    adminEmail: 'premspaw@gmail.com',
    status: 'ACTIVE',
  },
  {
    id: 'ACCT-002',
    name: 'DermaSculpt Clinic',
    shortName: 'DermaSculpt Clinic',
    type: 'Client Subaccount',
    domain: 'dermasculpt.connectsai.in',
    displayPhoneNumber: '+91 98765 43210',
    phoneNumberId: '984720194827101',
    wabaId: 'waba_dermasculpt_8829',
    adminEmail: 'admin@dermasculpt.com',
    status: 'ACTIVE',
  },
];
let activeSubaccountId = 'ACCT-001';

router.get('/subaccounts', (req, res) => {
  res.json(memorySubaccounts);
});

router.post('/subaccounts', (req, res) => {
  const body = req.body || {};
  const nextNum = memorySubaccounts.length + 1;
  const nextId = `ACCT-00${nextNum}`;
  const newAcc = {
    id: nextId,
    name: body.name || 'New Client Subaccount',
    shortName: body.shortName || body.name || 'Client',
    type: 'Client Subaccount',
    domain: body.domain || `${(body.shortName || body.name || 'client').toLowerCase().replace(/\s+/g, '')}.connectsai.in`,
    displayPhoneNumber: body.displayPhoneNumber || '+91 99999 00000',
    phoneNumberId: body.phoneNumberId || `phone_${Date.now()}`,
    wabaId: body.wabaId || `waba_${Date.now()}`,
    adminEmail: body.adminEmail || 'client@example.com',
    status: 'ACTIVE',
  };
  memorySubaccounts.push(newAcc);
  activeSubaccountId = nextId;
  res.json(newAcc);
});

router.get('/subaccounts/active', (req, res) => {
  const acc = memorySubaccounts.find(a => a.id === activeSubaccountId) || memorySubaccounts[0];
  res.json(acc);
});

router.post('/subaccounts/active', (req, res) => {
  const id = req.body?.id;
  if (id) {
    activeSubaccountId = id;
    const acc = memorySubaccounts.find(a => a.id === id) || memorySubaccounts[0];
    return res.json({ ok: true, activeAccount: acc });
  }
  res.json({ ok: false });
});

module.exports = router;
