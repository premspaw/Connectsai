// Complete realistic mock dataset for ForgeGrowth-OSS preview mode

export const PREM_USER = {
  id: 1,
  username: 'premspaw',
  email: 'premspaw@gmail.com',
  displayName: 'Prem Spawar',
  role: 'admin',
  isActive: true,
  permissions: null,
  accountId: 'ACCT-001',
  accountName: 'Prem Spawar (ConnectsAI Main)',
  accountType: 'Agency Master',
  pages: [
    'home', 'chatbot-builder', 'template-builder', 'chats',
    'bulk-message', 'admin-settings', 'media-library', 'wa-links',
    'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
    'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
    'sales-pipeline', 'leads', 'payments', 'onboarding',
    'sales-funnel', 'message-costs'
  ],
  assignedWaNumbers: ['918660395136', '+918660395136'],
};

export const DERMASCULPT_USER = {
  id: 2,
  username: 'dermasculpt',
  email: 'admin@dermasculpt.com',
  displayName: 'DermaSculpt Clinic',
  role: 'admin',
  isActive: true,
  permissions: null,
  accountId: 'ACCT-002',
  accountName: 'DermaSculpt Clinic',
  accountType: 'Client Subaccount',
  pages: [
    'home', 'chatbot-builder', 'template-builder', 'chats',
    'bulk-message', 'admin-settings', 'media-library', 'wa-links',
    'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
    'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
    'sales-pipeline', 'leads', 'payments', 'onboarding',
    'sales-funnel', 'message-costs'
  ],
  assignedWaNumbers: ['919876543210', '+919876543210'],
};

export const SUBACCOUNTS_LIST = [
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
    user: PREM_USER,
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
    user: DERMASCULPT_USER,
  },
];

export function getStoredSubaccounts() {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('connects_subaccounts_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return SUBACCOUNTS_LIST;
}

export function saveStoredSubaccounts(list) {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('connects_subaccounts_list', JSON.stringify(list));
    } catch {}
  }
}

let _activeAccountId = 'ACCT-001';

export function getActiveAccountId() {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('connects_active_subaccount');
    if (stored) return stored;
  }
  return _activeAccountId;
}

export function setActiveAccountId(id) {
  _activeAccountId = id;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('connects_active_subaccount', id);
  }
}

export function getCurrentUser() {
  const currentId = getActiveAccountId();
  const list = getStoredSubaccounts();
  const acc = list.find(a => a.id === currentId);
  return acc ? acc.user : PREM_USER;
}

const DEMO_USER = PREM_USER;

let mockContactsList = [
  {
    id: 101,
    name: 'Hemanth (+91 81231 33382)',
    contact_number: '918123133382',
    last_message: 'Hi',
    unread_count: 0,
    updated_at: new Date().toISOString(),
    tags: ['WhatsApp Inbound', 'Live Lead'],
  }
];

let mockMessagesByContact = {
  '918123133382': [
    {
      id: 'msg_101_1',
      message_id: 'wamid.inbound_1',
      direction: 'incoming',
      contact_number: '918123133382',
      wa_number: '918660395136',
      message_body: 'Hi',
      message_type: 'text',
      timestamp: new Date().toISOString(),
      status: 'delivered',
    },
    {
      id: 'msg_101_2',
      message_id: 'wamid.HBgMOTE4MTIzMTMzMzgyFQIAERgSRUJGRjgxODNGMjI4RjlGM0M3AA==',
      direction: 'outgoing',
      contact_number: '918123133382',
      wa_number: '918660395136',
      message_body: 'Hello from Zerolens AI Studio! How can we assist you today?',
      message_type: 'text',
      timestamp: new Date().toISOString(),
      status: 'delivered',
    }
  ],
  '919876543210': [
    {
      id: 1,
      message_id: 'wamid_1',
      direction: 'inbound',
      message_body: 'Hello, I saw your ad on Facebook.',
      message_type: 'text',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'delivered',
    },
    {
      id: 2,
      message_id: 'wamid_2',
      direction: 'outbound',
      message_body: 'Welcome! We would love to share more details about our growth stack.',
      message_type: 'text',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      status: 'read',
    },
    {
      id: 3,
      message_id: 'wamid_3',
      direction: 'inbound',
      message_body: 'Interested in the advanced growth cohort',
      message_type: 'text',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      status: 'delivered',
    }
  ]
};

// Helper to record messages in mock state without duplicate outbound calls
function recordMockWhatsAppMessage(from, text, profileName, direction = 'incoming', extra = {}) {
  let c = mockContactsList.find((x) => x.contact_number === from);
  if (!c) {
    c = {
      id: Date.now(),
      name: profileName || `Client +${from}`,
      contact_number: from,
      last_message: text,
      unread_count: direction === 'incoming' ? 1 : 0,
      updated_at: new Date().toISOString(),
      tags: ['WhatsApp Inbound'],
    };
    mockContactsList.unshift(c);
  } else {
    c.last_message = text;
    if (direction === 'incoming') {
      c.unread_count = (c.unread_count || 0) + 1;
    }
    c.updated_at = new Date().toISOString();
    if (profileName && (!c.name || c.name.startsWith('Client +'))) c.name = profileName;
  }

  if (!mockMessagesByContact[from]) mockMessagesByContact[from] = [];
  mockMessagesByContact[from].push({
    id: Date.now(),
    message_id: direction === 'incoming' ? `wamid.in_${Date.now()}` : `wamid.out_${Date.now()}`,
    direction,
    message_body: text,
    message_type: 'text',
    timestamp: new Date().toISOString(),
    status: 'delivered',
    ...extra,
  });
}

// Patch a stored message (e.g. media_status 'pending' -> 'stored' once the
// file has been downloaded and archived).
export function updateMockMessage(contactNumber, messageId, patch) {
  const list = mockMessagesByContact[contactNumber] || [];
  const msg = list.find(m => m.message_id === messageId);
  if (msg) Object.assign(msg, patch);
  return msg || null;
}

export function getMockResponse(urlPath, method = 'GET', body = null) {
  const [pathname] = urlPath.split('?');
  const path = pathname.replace(/^\/api/, '');

  // Subaccounts management
  if (path === '/subaccounts') {
    if (method === 'GET') return getStoredSubaccounts();
    if (method === 'POST') {
      const list = getStoredSubaccounts();
      const nextNum = list.length + 1;
      const nextId = `ACCT-00${nextNum}`;
      const newAcc = {
        id: nextId,
        name: body?.name || 'New Client Subaccount',
        shortName: body?.shortName || body?.name || 'Client',
        type: 'Client Subaccount',
        domain: body?.domain || `${(body?.shortName || body?.name || 'client').toLowerCase().replace(/\s+/g, '')}.connectsai.in`,
        displayPhoneNumber: body?.displayPhoneNumber || '+91 99999 00000',
        phoneNumberId: body?.phoneNumberId || `phone_${Date.now()}`,
        wabaId: body?.wabaId || `waba_${Date.now()}`,
        adminEmail: body?.adminEmail || 'client@example.com',
        status: 'ACTIVE',
        user: {
          id: nextNum,
          username: (body?.name || 'client').toLowerCase().replace(/\s+/g, ''),
          email: body?.adminEmail || 'client@example.com',
          displayName: body?.name || 'Client Admin',
          role: 'admin',
          accountId: nextId,
          accountName: body?.name,
          accountType: 'Client Subaccount',
          pages: PREM_USER.pages,
          assignedWaNumbers: [body?.displayPhoneNumber?.replace(/\D/g, '') || '919999900000'],
        }
      };
      list.push(newAcc);
      saveStoredSubaccounts(list);
      setActiveAccountId(nextId);
      return newAcc;
    }
  }
  if (path === '/subaccounts/active') {
    const list = getStoredSubaccounts();
    if (method === 'GET') {
      const acc = list.find(a => a.id === getActiveAccountId()) || list[0];
      return acc;
    }
    if (method === 'POST') {
      if (body?.id) {
        setActiveAccountId(body.id);
        const acc = list.find(a => a.id === body.id) || list[0];
        return { ok: true, activeAccount: acc, user: acc.user };
      }
    }
  }

  // Auth
  if (path === '/auth/me') return { user: getCurrentUser() };
  if (path === '/auth/login') {
    if (body?.email && body.email.toLowerCase().includes('dermasculpt')) {
      setActiveAccountId('ACCT-002');
      return { user: DERMASCULPT_USER };
    }
    setActiveAccountId('ACCT-001');
    return { user: PREM_USER };
  }
  if (path === '/auth/logout') return { ok: true };

  // Channels / WhatsApp
  if (path === '/whatsapp-accounts' || path.startsWith('/whatsapp-accounts/')) {
    if (path === '/whatsapp-accounts/health') {
      return { can_send_message: true, status: 'CONNECTED', quality_rating: 'GREEN' };
    }
    if (method === 'POST' || method === 'PUT') {
      return {
        id: '1',
        displayName: body?.displayName || 'Zerolens AI Studio',
        displayPhoneNumber: body?.displayPhoneNumber || '+91 86603 95136',
        phoneNumberId: body?.phoneNumberId || '1299345543269323',
        wabaId: body?.wabaId || '972769282557039',
        accessTokenMasked: 'EAAkCU...ZDZD',
        healthStatus: 'healthy',
        isDefault: true,
        isActive: true,
        status: 'CONNECTED',
        quality_rating: 'GREEN',
      };
    }
    if (path.startsWith('/whatsapp-accounts/') && method === 'GET') {
      return {
        id: '1',
        displayName: 'Zerolens AI Studio',
        displayPhoneNumber: '+91 86603 95136',
        phoneNumberId: '1299345543269323',
        wabaId: '972769282557039',
        metaAppId: '2535822183593217',
        accessToken: 'EAAkCURx3dQEBSqy41a0XbvLNGKQNwZBabHEZAn5I5mhMS6iJ7D48P0AKJ9yr6VvW6hIWdYHnFWUtK0cHNxUtNViApMK5SAJAB4pFyn96hnHuKMZC4LTivLKXxoFuMrdi6quDf2ND1NcB5UwBNBSrvGULCrvlcfwyrPdiOBs8t7ncsp85VeEMlaB3amCewZDZD',
        accessTokenMasked: 'EAAkCU...ZDZD',
        verifyToken: 'zylo_webhook_secret_2026',
        healthStatus: 'healthy',
        isDefault: true,
        isActive: true,
      };
    }
    if (method === 'DELETE') return { ok: true };
    return [{
      id: '1',
      displayName: 'Zerolens AI Studio',
      displayPhoneNumber: '+91 86603 95136',
      phoneNumberId: '1299345543269323',
      wabaId: '972769282557039',
      metaAppId: '2535822183593217',
      accessTokenMasked: 'EAAkCU...ZDZD',
      verifyToken: 'zylo_webhook_secret_2026',
      healthStatus: 'healthy',
      isDefault: true,
      isActive: true,
      phone_number_id: '1299345543269323',
      waba_id: '972769282557039',
      display_phone_number: '+91 86603 95136',
      verified_name: 'Zerolens AI Studio',
      status: 'CONNECTED',
      quality_rating: 'GREEN',
    }];
  }
  if (path === '/numbers') {
    return [{
      id: '1',
      wa_number: '918660395136',
      phone_number_id: '1299345543269323',
      waba_id: '972769282557039',
      display_phone_number: '+91 86603 95136',
      verified_name: 'Zerolens AI Studio',
    }];
  }

  // Home Dashboard
  if (path === '/dashboard') {
    return {
      kpis: [
        { key: 'newLeads', label: 'New Leads', value: 0, delta: 0, tooltip: 'Leads created in selected range' },
        { key: 'conversations', label: 'Active Conversations', value: 1, delta: 0, tooltip: 'WhatsApp conversations' },
        { key: 'conversionRate', label: 'Conversion Rate', value: 0, unit: '%', delta: 0, tooltip: 'Lead to enrollment rate' },
        { key: 'revenue', label: 'Total Revenue', value: 0, unit: '₹', delta: 0, tooltip: 'Collected via Razorpay' },
      ],
      alerts: [],
      funnel: {
        stages: [
          { stage: 'New', count: 0 },
          { stage: 'Contacted', count: 0 },
          { stage: 'Qualified', count: 0 },
          { stage: 'Enrolled', count: 0 },
        ]
      },
      tagDistribution: [
        { tag: 'WhatsApp Direct', count: 1 },
      ],
      automations: {
        active: 0,
        total: 0,
        successRate: 100,
        runs: {
          total: 0,
          paused: 0,
          error: 0,
        }
      },
      broadcasts: {
        sent: 0,
        recipients: 0,
        delivered: 0,
        readRate: 0,
        recent: []
      },
      sales: {
        recent: []
      },
      recentActivity: [
        { id: 1, contactName: 'Hemanth (+91 81231 33382)', time: 'Just now', text: 'Live chat connected' }
      ],
    };
  }
  if (path === '/dashboard/details') return { items: [], total: 0 };

  // Home Dashboard
  if (path === '/dashboard') {
    const leads = globalThis.__mockLeads || [];
    const totalLeads = leads.length;
    const newCount = leads.filter(l => l.stage === 'new').length;
    const contactedCount = leads.filter(l => l.stage === 'contacted').length;
    const engagedCount = leads.filter(l => l.stage === 'engaged' || l.stage === 'hot').length;
    const enrolledCount = leads.filter(l => l.stage === 'enrolled').length;
    const convRate = totalLeads > 0 ? Math.round((enrolledCount / totalLeads) * 100) : 25;

    return {
      kpis: [
        { key: 'newLeads', label: 'New Leads', value: totalLeads, delta: '+12%', tooltip: 'Total leads captured' },
        { key: 'conversations', label: 'Active Conversations', value: Object.keys(mockMessagesByContact || {}).length || 2, delta: '+4', tooltip: 'WhatsApp conversations' },
        { key: 'conversionRate', label: 'Conversion Rate', value: convRate, unit: '%', delta: '+5%', tooltip: 'Lead to enrollment rate' },
        { key: 'revenue', label: 'Total Revenue', value: 245000, unit: '₹', delta: '+18%', tooltip: 'Collected via Razorpay' },
      ],
      alerts: [],
      funnel: {
        stages: [
          { stage: 'New', count: newCount },
          { stage: 'Contacted', count: contactedCount },
          { stage: 'Qualified', count: engagedCount },
          { stage: 'Enrolled', count: enrolledCount },
        ]
      },
      tagDistribution: [
        { tag: 'WhatsApp Direct', count: leads.filter(l => l.source === 'WhatsApp Inbound' || l.source === 'WhatsApp Direct').length },
        { tag: 'Meta Ads', count: leads.filter(l => l.source === 'Meta Ads').length },
        { tag: 'Website Form', count: leads.filter(l => l.source === 'Website Form').length },
      ],
      automations: {
        active: 2,
        total: 2,
        successRate: 100,
        runs: {
          total: 14,
          paused: 0,
          error: 0,
        }
      },
      broadcasts: {
        sent: 1,
        recipients: 450,
        delivered: 442,
        readRate: 88,
        recent: []
      },
      sales: {
        recent: []
      },
      recentActivity: leads.slice(0, 4).map((l, idx) => ({
        id: idx + 1,
        contactName: `${l.name} (${l.phone || l.whatsapp_number})`,
        time: 'Active recently',
        text: `Stage: ${l.stage?.toUpperCase()} • ${l.source}`
      })),
    };
  }
  if (path === '/dashboard/details') return { items: [], total: 0 };

  // Funnel & Tags
  if (path === '/funnel/config' || path === '/funnel/stages') {
    return {
      stages: [
        { id: '1', key: 'new', name: 'New Lead', color: '#6366f1' },
        { id: '2', key: 'contacted', name: 'Contacted', color: '#06b6d4' },
        { id: '3', key: 'engaged', name: 'Engaged / Qualified', color: '#10b981' },
        { id: '4', key: 'hot', name: 'Hot / Booked', color: '#f59e0b' },
        { id: '5', key: 'enrolled', name: 'Enrolled', color: '#8b5cf6' },
      ],
      sources: ['Meta Ads', 'WhatsApp Direct', 'WhatsApp Inbound', 'Website Form', 'Organic Search', 'Referral'],
    };
  }
  if (path === '/funnel/chart') {
    const leads = globalThis.__mockLeads || [];
    return {
      stages: [
        { stage: 'New', count: leads.filter(l => l.stage === 'new').length },
        { stage: 'Contacted', count: leads.filter(l => l.stage === 'contacted').length },
        { stage: 'Qualified', count: leads.filter(l => l.stage === 'engaged' || l.stage === 'hot').length },
        { stage: 'Enrolled', count: leads.filter(l => l.stage === 'enrolled').length },
      ]
    };
  }
  if (path === '/funnel/sources') {
    return {
      sources: ['Meta Ads', 'WhatsApp Direct', 'WhatsApp Inbound', 'Website Form', 'Organic Search', 'Referral'],
    };
  }
  if (path === '/lead-sources') {
    const leads = globalThis.__mockLeads || [];
    const directCount = leads.filter(l => l.source === 'WhatsApp Inbound' || l.source === 'WhatsApp Direct').length;
    const metaCount = leads.filter(l => l.source === 'Meta Ads').length;
    const webCount = leads.filter(l => l.source === 'Website Form').length;
    return {
      sources: [
        { source: 'WhatsApp Direct', leads: directCount, hotPct: 50, enrolledPct: 25, costPerLead: 0, entryStage: 'new' },
        { source: 'Meta Ads', leads: metaCount, hotPct: 40, enrolledPct: 20, costPerLead: 120, entryStage: 'new' },
        { source: 'Website Form', leads: webCount, hotPct: 30, enrolledPct: 15, costPerLead: 0, entryStage: 'new' },
      ],
    };
  }
  if (path === '/tags') {
    return [
      { id: 1, name: 'VIP', color: '#10b981' },
      { id: 2, name: 'Hot Lead', color: '#ef4444' },
      { id: 3, name: 'Live Lead', color: '#8b5cf6' },
    ];
  }
  if (path === '/categories') {
    return [
      { id: 1, name: 'General', color: '#6366f1' },
      { id: 2, name: 'Onboarding', color: '#10b981' },
    ];
  }
  if (path === '/entity-fields') return [];
  if (path === '/field-registry') return { fields: [], leadFields: [], transactionFields: [] };

  // Marketing
  if (path === '/marketing/overview') {
    return {
      kpis: {
        newLeads: 0,
        costPerLead: 0,
        activeSpend: 0,
        enrollments: 0,
      },
      bySource: [],
      funnel: [
        { stage: 'New', count: 0 },
        { stage: 'Contacted', count: 0 },
        { stage: 'Qualified', count: 0 },
        { stage: 'Enrolled', count: 0 },
      ],
      trend: [],
    };
  }
  if (path === '/marketing/meta-ads/status') {
    return { status: 'connected', connected_at: new Date().toISOString() };
  }
  if (path === '/campaigns') {
    return [];
  }
  if (path === '/ctwa/overview') {
    return {
      kpis: {
        people: 0,
        ads: 0,
        leads: 0,
        enrolled: 0,
        revenue: 0,
        spend: 0,
        costPerLead: 0,
        roas: 0,
        leadToEnrolPct: 0,
      },
      timeseries: [],
      platforms: [],
      stages: [
        { stage: 'New', count: 0 },
        { stage: 'Contacted', count: 0 },
        { stage: 'Qualified', count: 0 },
        { stage: 'Enrolled', count: 0 },
      ],
      ads: [],
      campaigns: 0,
      clicks: 0,
      conversations: 0,
      costPerConversation: 0,
      spend: 0,
    };
  }

  // Chats / Contacts / Messages
  if (path === '/contacts' || path === '/saved-contacts') {
    if (method === 'POST') {
      const cleanNum = String(body?.contactNumber || body?.phone || '').replace(/\D/g, '');
      const name = body?.name || `Client +${cleanNum}`;
      const existing = mockContactsList.find(c => c.contact_number === cleanNum);
      if (existing) {
        existing.name = name;
        if (body?.tags) existing.tags = body.tags;
        return existing;
      }
      const newContact = {
        id: Date.now(),
        name,
        contact_number: cleanNum,
        last_message: 'New conversation started',
        unread_count: 0,
        updated_at: new Date().toISOString(),
        tags: body?.tags || ['New Client'],
      };
      mockContactsList.unshift(newContact);
      return newContact;
    }
    return mockContactsList;
  }
  if (path === '/contact') {
    let contactNumber = '';
    try {
      const parsed = new URL(urlPath, 'http://localhost');
      contactNumber = String(parsed.searchParams.get('contactNumber') || '').replace(/\D/g, '');
    } catch {}
    const c = mockContactsList.find(x => x.contact_number === contactNumber) || {
      id: 101,
      name: 'Hemanth (+91 81231 33382)',
      contact_number: contactNumber || '918123133382',
      tags: ['WhatsApp Inbound', 'Live Lead'],
      assignedUserId: null,
    };
    return c;
  }
  if (path === '/contact-names') {
    const map = {};
    mockContactsList.forEach(c => { map[c.contact_number] = c.name; });
    return map;
  }
  if (path === '/messages') {
    let cleanContact = '';
    try {
      const parsed = new URL(urlPath, 'http://localhost');
      cleanContact = String(parsed.searchParams.get('contactNumber') || '').replace(/\D/g, '');
    } catch {}
    const list = (cleanContact && mockMessagesByContact[cleanContact]) 
      ? mockMessagesByContact[cleanContact] 
      : (mockMessagesByContact['918123133382'] || []);
    return { messages: list };
  }
  if (path === '/messages/send' || path === '/messages/send-media' || path === '/messages/send-audio' || path === '/messages/send-library-media') {
    const to = String(body?.toNumber || body?.to || body?.contactNumber || '918123133382').replace(/\D/g, '');
    const text = body?.text || body?.body || body?.caption || 'Hello from Zerolens AI Studio';
    if (!mockMessagesByContact[to]) mockMessagesByContact[to] = [];
    const newMsg = {
      id: Date.now(),
      message_id: `wamid.out_${Date.now()}`,
      direction: 'outgoing',
      contact_number: to,
      wa_number: '918660395136',
      message_body: text,
      message_type: 'text',
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };
    mockMessagesByContact[to].push(newMsg);
    const c = mockContactsList.find(x => x.contact_number === to);
    if (c) {
      c.last_message = text;
      c.updated_at = new Date().toISOString();
    }
    // Forward directly to recipient over Meta Cloud API
    try {
      const token = 'EAAkCURx3dQEBSqy41a0XbvLNGKQNwZBabHEZAn5I5mhMS6iJ7D48P0AKJ9yr6VvW6hIWdYHnFWUtK0cHNxUtNViApMK5SAJAB4pFyn96hnHuKMZC4LTivLKXxoFuMrdi6quDf2ND1NcB5UwBNBSrvGULCrvlcfwyrPdiOBs8t7ncsp85VeEMlaB3amCewZDZD';
      const phoneId = '1299345543269323';
      fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      }).catch(() => {});
    } catch {}
    return { ok: true, message: newMsg };
  }
  if (path === '/webhook/whatsapp' || path === '/webhook') {
    try {
      const entries = body?.entry || [];
      for (const ent of entries) {
        for (const change of (ent?.changes || [])) {
          const val = change?.value;
          if (val?.messages) {
            for (const m of val.messages) {
              const from = String(m.from || '').replace(/\D/g, '');
              const MEDIA = { image: '📷 Photo', audio: '🎤 Voice note', voice: '🎤 Voice note', video: '🎥 Video', document: '📎 Document', sticker: 'Sticker' };
              const mediaObj = m[m.type];
              const isMedia = !!MEDIA[m.type];
              const text = m.text?.body
                || (m.type === 'interactive' ? m.interactive?.button_reply?.title : '')
                || mediaObj?.caption
                || (isMedia ? MEDIA[m.type] : `[${m.type}]`);
              const profileName = val.contacts?.find((c) => c.wa_id === from)?.profile?.name || `Client +${from}`;
              
              recordMockWhatsAppMessage(from, text, profileName, 'incoming', {
                message_id: m.id || `wamid.in_${Date.now()}`,
                contact_number: from,
                ...(isMedia ? {
                  message_type: m.type === 'voice' ? 'audio' : m.type,
                  media_status: 'pending',
                  media_mime_type: mediaObj?.mime_type || null,
                } : {}),
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('[webhook error]:', e);
    }
    return { status: 'ok' };
  }
  if (path === '/messages/window-status') {
    return {
      canSendFreeForm: true,
      lastIncomingSecondsAgo: 5,
      windowExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }
  if (path === '/messages/mark-read') {
    const contactNumber = String(body?.contactNumber || '').replace(/\D/g, '');
    const c = mockContactsList.find(x => x.contact_number === contactNumber);
    if (c) c.unread_count = 0;
    return { ok: true };
  }
  if (path === '/agent-conversation') {
    return { paused: false, is_active: true };
  }

  // Automations & Chatbots
  if (!globalThis.__mockChatbots || !globalThis.__mockChatbots[0]?.config?.nodes) {
    globalThis.__mockChatbots = [
      {
        id: 1,
        name: 'Welcome & Instant Consultation Booking',
        description: 'Sends instant WhatsApp welcome greeting and schedules appointment slot',
        trigger: 'Keyword: "hello", "hi", "demo", "appointment"',
        status: 'active',
        folder_id: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        config: {
          nodes: [
            {
              id: 'n1',
              type: 'trigger',
              x: 80,
              y: 120,
              title: 'Trigger: Keyword / Inbound',
              sub: 'When customer sends hello, hi, demo, or appointment',
              triggerKind: 'keyword',
              keyword: 'hello, hi, demo, appointment',
              matchType: 'contains',
              caseSensitive: false,
            },
            {
              id: 'n2',
              type: 'message',
              x: 420,
              y: 120,
              title: 'Welcome Message',
              sub: 'Greeting & Consultation options',
              messageMode: 'direct',
              directType: 'text',
              directData: {
                body: 'Hello {{name}}! 👋 Welcome to Zerolens AI Studio. How can we assist you today? Would you like to schedule a 1-on-1 consultation appointment or explore our WhatsApp CRM automation?'
              },
            },
            {
              id: 'n3',
              type: 'action',
              x: 760,
              y: 120,
              title: 'Update CRM Stage',
              sub: 'Set Lead Stage to Contacted',
              actions: [
                { type: 'set_field', field: 'stage', value: 'contacted' }
              ],
            },
          ],
          edges: [
            { from: 'n1', to: 'n2', fromHandle: 'default', toHandle: 'input' },
            { from: 'n2', to: 'n3', fromHandle: 'default', toHandle: 'input' },
          ],
        },
      },
      {
        id: 2,
        name: 'Lead Follow-Up & Nurturing Sequence (24h Delay)',
        description: 'Auto follow-up after 24 hours to check in and advance pipeline stage',
        trigger: 'Event: Lead moved to Contacted',
        status: 'active',
        folder_id: null,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString(),
        config: {
          nodes: [
            {
              id: 'n1',
              type: 'trigger',
              x: 80,
              y: 120,
              title: 'Trigger: Stage Contacted',
              sub: 'When lead enters Contacted stage',
              triggerKind: 'anyMessage',
            },
            {
              id: 'n2',
              type: 'delay',
              x: 420,
              y: 120,
              title: 'Wait 24 Hours',
              sub: 'Delay 1440 minutes',
              delayMode: 'duration',
              waitValue: '24',
              waitUnit: 'hours',
            },
            {
              id: 'n3',
              type: 'message',
              x: 760,
              y: 120,
              title: 'Follow-Up Message',
              sub: 'Appointment check-in',
              messageMode: 'direct',
              directType: 'text',
              directData: {
                body: 'Hi {{name}}, just following up to see if you have any questions about our WhatsApp CRM & AI appointment booking? Would you like to pick a time slot for tomorrow?'
              },
            },
            {
              id: 'n4',
              type: 'action',
              x: 1100,
              y: 120,
              title: 'Advance to Engaged',
              sub: 'Move stage to Engaged',
              actions: [
                { type: 'set_field', field: 'stage', value: 'engaged' }
              ],
            },
          ],
          edges: [
            { from: 'n1', to: 'n2', fromHandle: 'default', toHandle: 'input' },
            { from: 'n2', to: 'n3', fromHandle: 'default', toHandle: 'input' },
            { from: 'n3', to: 'n4', fromHandle: 'default', toHandle: 'input' },
          ],
        },
      },
      {
        id: 3,
        name: 'VIP Lead Booking & Instant Team Notification',
        description: 'Notifies team when a high-intent lead requests an appointment',
        trigger: 'Keyword: "consultation", "booking", "pricing"',
        status: 'active',
        folder_id: null,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date().toISOString(),
        config: {
          nodes: [
            {
              id: 'n1',
              type: 'trigger',
              x: 80,
              y: 120,
              title: 'Trigger: High Intent',
              sub: 'consultation, booking, pricing',
              triggerKind: 'keyword',
              keyword: 'consultation, booking, pricing',
              matchType: 'contains',
              caseSensitive: false,
            },
            {
              id: 'n2',
              type: 'action',
              x: 420,
              y: 120,
              title: 'Mark VIP & Hot Stage',
              sub: 'Tag: VIP, Stage: Hot',
              actions: [
                { type: 'add_tag', tag: 'VIP' },
                { type: 'set_field', field: 'stage', value: 'hot' },
              ],
            },
            {
              id: 'n3',
              type: 'handoff',
              x: 760,
              y: 120,
              title: 'Notify BDA / Team',
              sub: 'Assign to Admin User',
              assigneeId: 1,
            },
          ],
          edges: [
            { from: 'n1', to: 'n2', fromHandle: 'default', toHandle: 'input' },
            { from: 'n2', to: 'n3', fromHandle: 'default', toHandle: 'input' },
          ],
        },
      },
    ];
  }

  if (path.startsWith('/chatbots')) {
    if (path === '/chatbots' && method === 'POST') {
      const newFlow = {
        id: Date.now(),
        name: body?.name || 'New Automation Flow',
        trigger: body?.trigger || 'keyword',
        status: 'draft',
        folder_id: body?.folder_id || null,
        updated_at: new Date().toISOString(),
        nodes: body?.nodes || [
          { id: '1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'New Inbound Trigger' } },
          { id: '2', type: 'message', position: { x: 100, y: 220 }, data: { body: 'Hi {{name}}!' } }
        ],
        edges: body?.edges || [{ id: 'e1-2', source: '1', target: '2' }],
      };
      globalThis.__mockChatbots.unshift(newFlow);
      return newFlow;
    }
    const m = path.match(/\/chatbots\/([^/]+)/);
    const flowId = m ? m[1] : null;

    if (flowId && (method === 'PUT' || method === 'PATCH')) {
      const target = globalThis.__mockChatbots.find(f => String(f.id) === String(flowId));
      if (target && body) {
        Object.assign(target, body, { updated_at: new Date().toISOString() });
        return target;
      }
      return { id: flowId, ...body, updated_at: new Date().toISOString() };
    }
    if (flowId && method === 'DELETE') {
      globalThis.__mockChatbots = globalThis.__mockChatbots.filter(f => String(f.id) !== String(flowId));
      return { ok: true };
    }
    if (flowId && method === 'GET') {
      const target = globalThis.__mockChatbots.find(f => String(f.id) === String(flowId)) || globalThis.__mockChatbots[0];
      return target;
    }
    return globalThis.__mockChatbots;
  }

  // AI Models & Credentials Registry
  if (path === '/ai-models' || path.startsWith('/ai-models')) {
    const list = [
      {
        id: 1,
        provider: 'google',
        providerLabel: 'Google Cloud Vertex AI',
        label: 'Google Cloud Vertex AI (Project: project-c0b5ea74-5ba2-4e68-8ab)',
        apiKeyMasked: 'AQ.Ab8RN6Lw...4GZ3g (Active)',
        isDefault: true,
        status: 'connected',
        availableModels: [
          { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fastest, Low Latency - Active)' },
          { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Advanced Reasoning)' },
          { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Cloud Preview)' },
        ],
        enabledModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.5-flash-lite'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        provider: 'anthropic',
        providerLabel: 'Anthropic Claude',
        label: 'Claude 3.5 Sonnet',
        apiKeyMasked: 'sk-ant-api03-...',
        status: 'connected',
        availableModels: [
          { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
          { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
        ],
        enabledModels: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        provider: 'openai',
        providerLabel: 'OpenAI',
        label: 'OpenAI GPT-4o',
        apiKeyMasked: 'sk-proj-...',
        status: 'connected',
        availableModels: [
          { id: 'gpt-4o', label: 'GPT-4o' },
          { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
        ],
        enabledModels: ['gpt-4o', 'gpt-4o-mini'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    if (path.includes('/usage')) {
      return { totalCalls: 48, totalTokens: 14200, totalCostInr: 12.40 };
    }
    if (path.includes('/activity')) {
      return { items: [], total: 0 };
    }
    const m = path.match(/\/ai-models\/([^/]+)/);
    if (m && method === 'GET') {
      const target = list.find(x => String(x.id) === String(m[1])) || list[0];
      return target;
    }
    return list;
  }

  // Knowledge Base Management (Admin & AI Agent Grounding)
  if (!globalThis.__mockKnowledgeBase) {
    globalThis.__mockKnowledgeBase = [
      {
        id: 1,
        title: 'Zerolens AI Studio — Company Overview & Official Links',
        category: 'general',
        is_active: true,
        content: `COMPANY & BRAND IDENTITY:
• Brand Name: Zerolens AI Studio (Connects AI)
• Official Website: https://zerolens.ai
• Instagram Profile: https://instagram.com/zerolens.ai
• Direct Appointment Booking URL: https://zerolens.ai/book-demo
• WhatsApp Business Support: +91 86603 95136

CORE VALUE PROPOSITION:
Zerolens AI Studio empowers clinics, ecommerce brands, and high-growth businesses with:
1. WhatsApp CRM & Automation: Broadcast campaigns, custom lead forms, instant lead tagging.
2. AI Appointment Booking Agent: 24/7 intelligent multi-turn agent that qualifies leads, answers questions, and confirms demo slots.
3. Multimodal Voice & Image Understanding: Processes incoming voice notes in multiple languages and customer photo attachments automatically.
4. Gemini Live Cloud Telephony: Human-like voice calling for instant patient and customer callback.`,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Consultation & Appointment Booking FAQs',
        category: 'support',
        is_active: true,
        content: `APPOINTMENT & DEMO BOOKING DETAILS:
• Support & Working Hours: Monday to Saturday, 9:00 AM to 7:00 PM IST (Closed Sundays).
• Demo Call Format: 15-to-30 minute live video/phone walkthrough with our AI solution architect.
• Direct Booking Link: https://zerolens.ai/book-demo
• Rescheduling: Flexible rescheduling available anytime on WhatsApp.
• Requirements: We tailor solutions for dental/medical clinics, salons, real estate, education, and service businesses.`,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        title: 'Pricing & Service Packages',
        category: 'pricing',
        is_active: true,
        content: `PRICING & PLANS:
• Starter Automation Plan: ₹9,500/month (WhatsApp CRM, template broadcasts, unlimited contacts, basic pipeline).
• Growth & AI Agent Suite: ₹15,000/month (Full Vertex AI Gemini Appointment Booking Agent, Multimodal Voice/Image support, Funnel Pipelines, Razorpay integration).
• Enterprise Custom: Custom pricing for high-volume automated telephony and custom API webhooks.
• Payment Options: Secure payment links powered by Razorpay (UPI, Credit/Debit Cards, Net Banking).`,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 4,
        title: 'Multimodal Voice & Image Processing Guidelines',
        category: 'products',
        is_active: true,
        content: `MULTIMODAL CAPABILITIES:
• Voice Note Processing: Customers can send voice notes in English, Hindi, Kannada, Telugu, etc. The AI natively listens to the audio and responds with clear, accurate text answers.
• Image & Visual Processing: Customers can send photos (product snapshots, invoices, dental/clinic requirements, screenshots). The AI inspects the visual context and responds appropriately.`,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  }

  if (path === '/knowledge-bases' || path === '/knowledge-base' || path.startsWith('/knowledge-bases/')) {
    if (path === '/knowledge-bases' && method === 'POST') {
      const newDoc = {
        id: Date.now(),
        title: body?.title || 'New Knowledge Base Document',
        category: body?.category || 'general',
        content: body?.content || '',
        is_active: body?.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      globalThis.__mockKnowledgeBase.unshift(newDoc);
      return newDoc;
    }
    const m = path.match(/\/knowledge-bases\/([^/]+)/);
    const docId = m ? m[1] : null;
    if (docId) {
      const target = globalThis.__mockKnowledgeBase.find(d => String(d.id) === String(docId));
      if (method === 'PUT' || method === 'PATCH') {
        if (target && body) {
          Object.assign(target, body, { updated_at: new Date().toISOString() });
          return target;
        }
        return { id: docId, ...body, updated_at: new Date().toISOString() };
      }
      if (method === 'DELETE') {
        globalThis.__mockKnowledgeBase = globalThis.__mockKnowledgeBase.filter(d => String(d.id) !== String(docId));
        return { ok: true };
      }
      if (method === 'GET') {
        return target || globalThis.__mockKnowledgeBase[0];
      }
    }
    return globalThis.__mockKnowledgeBase;
  }

  // AI Agents Builder & Execution Engine
  if (!globalThis.__mockAgents || !globalThis.__mockAgents.length) {
    globalThis.__mockAgents = [
      {
        id: 1,
        name: 'WhatsApp Appointment Booking Agent (Zerolens AI)',
        description: 'Multi-turn WhatsApp assistant for appointment scheduling, lead qualification, and customer support with Vertex AI Gemini, Multimodal Voice & Image, and Knowledge Base.',
        waAccountId: '1',
        wa_account_id: '1',
        status: 'active',
        isActive: true,
        is_active: true,
        aiModelId: '1',
        aiProvider: 'google',
        llmModel: 'gemini-2.5-flash',
        provider: 'google',
        transcribeAudio: true,
        acceptImages: true,
        maxVoiceSeconds: 180,
        maxImagesPerConversation: 20,
        systemPrompt: `You are the intelligent WhatsApp AI Assistant for Zerolens AI Studio (Connects AI).

VERIFIED KNOWLEDGE BASE & STUDIO FACTS:
- Connects AI provides WhatsApp CRM, AI customer lead qualification, automated appointment booking, and Gemini Live cloud telephony.
- Business Hours: Monday to Saturday, 9:00 AM to 7:00 PM IST.
- Features: Automated WhatsApp broadcast campaigns, funnel pipelines, custom appointment booking, and Razorpay payment links.
- Official Links:
  • Website: https://zerolens.ai
  • Book Appointment: https://zerolens.ai/book-demo
  • Instagram: https://instagram.com/zerolens.ai

CONVERSATION & MEMORY GUIDELINES:
1. LONG-TERM CONTEXT MEMORY: You have access to the full conversation history. Actively remember every detail the customer shared across previous turns (e.g. their business name, clinic type, preferred meeting time, pricing questions, specific requirements).
2. MULTI-TURN CONTINUITY: If the customer refers to something discussed earlier, reference it accurately.
3. If they want to book an appointment or schedule a demo, propose or confirm available dates/times and provide https://zerolens.ai/book-demo.
4. Multimodal Voice & Image: If a customer sends an image or voice note, process it with full attention and reply helpfully.
5. Keep responses concise, friendly, natural, and helpful (1-3 brief paragraphs or bullet points). Use emojis tastefully.`,
        system_prompt: `You are the intelligent WhatsApp AI Assistant for Zerolens AI Studio (Connects AI).`,
        contextWindowMessages: 20,
        context_window_messages: 20,
        maxToolIterations: 6,
        maxRepliesPerConversation: null,
        maxRepliesPerMinute: 30,
        maxRunsPerDay: 500,
        limitReachedMessage: 'Thanks for all your questions. Let me get someone from our team to help you from here.',
        limitHandoff: true,
        limit_handoff: true,
        mediaGroups: [
          {
            description: 'Send official studio links (Website, Instagram, and Direct Demo Booking)',
            mediaIds: [],
            links: [
              'https://zerolens.ai',
              'https://zerolens.ai/book-demo',
              'https://instagram.com/zerolens.ai'
            ]
          },
          {
            description: 'Send service pricing packages & portfolio deck',
            mediaIds: [1],
            links: [
              'https://zerolens.ai/pricing'
            ]
          }
        ],
        tools: [
          {
            id: 'tool_appointment_booking',
            name: 'Appointment Booking Tool',
            description: 'Books or reschedules appointments in CRM calendar',
            type: 'builtin',
            enabled: true,
          },
          {
            id: 'tool_lead_form',
            name: 'Lead Capture & Field Extraction',
            description: 'Extracts customer name, email, business type and updates CRM lead fields',
            type: 'builtin',
            enabled: true,
          },
          {
            id: 'tool_knowledge_base',
            name: 'Verified Knowledge Base Grounding',
            description: 'Grounds responses in verified studio facts with zero hallucinations',
            type: 'builtin',
            enabled: true,
          }
        ],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
  }

  if (path === '/agents' || path.startsWith('/agents/')) {
    if (path === '/agents' && method === 'POST') {
      const newAgent = {
        id: Date.now(),
        name: body?.name || 'New AI Agent',
        description: body?.description || '',
        waAccountId: body?.waAccountId || '1',
        wa_account_id: body?.waAccountId || '1',
        isActive: body?.isActive ?? false,
        is_active: body?.isActive ?? false,
        aiModelId: body?.aiModelId || '1',
        aiProvider: body?.aiProvider || 'google',
        llmModel: body?.llmModel || 'gemini-2.5-flash',
        provider: 'google',
        systemPrompt: body?.systemPrompt || 'You are a helpful WhatsApp assistant. Keep replies concise.',
        system_prompt: body?.systemPrompt || '',
        contextWindowMessages: body?.contextWindowMessages || 20,
        context_window_messages: body?.contextWindowMessages || 20,
        maxToolIterations: body?.maxToolIterations || 6,
        maxRepliesPerMinute: body?.maxRepliesPerMinute || 30,
        maxRunsPerDay: body?.maxRunsPerDay || 500,
        limitReachedMessage: body?.limitReachedMessage || 'Thanks for all your questions. Let me get someone from our team to help you from here.',
        limitHandoff: body?.limitHandoff ?? true,
        limit_handoff: body?.limitHandoff ?? true,
        transcribeAudio: body?.transcribeAudio ?? true,
        acceptImages: body?.acceptImages ?? true,
        maxVoiceSeconds: body?.maxVoiceSeconds || 180,
        maxImagesPerConversation: body?.maxImagesPerConversation || 20,
        mediaGroups: body?.mediaGroups || [],
        tools: body?.tools || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      globalThis.__mockAgents.unshift(newAgent);
      return newAgent;
    }

    if (path === '/agents/import' && method === 'POST') {
      const imported = {
        id: Date.now(),
        name: body?.name || 'Imported Agent',
        description: body?.description || '',
        isActive: false,
        is_active: false,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      globalThis.__mockAgents.unshift(imported);
      return { agent: imported, warnings: [] };
    }

    const m = path.match(/\/agents\/([^/]+)/);
    const agentId = m ? m[1] : null;

    if (agentId) {
      if (path.includes('/runs')) {
        return [
          {
            id: 'run_101',
            agent_id: agentId,
            contact_number: '918123133382',
            contact_name: 'Dr. Hemanth',
            status: 'completed',
            model: 'gemini-2.5-flash',
            tokens_used: 342,
            latency_ms: 198,
            tools_called: ['Appointment Booking Tool'],
            created_at: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: 'run_102',
            agent_id: agentId,
            contact_number: '919876543210',
            contact_name: 'Rahul Sharma',
            status: 'completed',
            model: 'gemini-2.5-flash',
            tokens_used: 280,
            latency_ms: 215,
            tools_called: ['Lead Capture Tool'],
            created_at: new Date(Date.now() - 3600000).toISOString(),
          }
        ];
      }

      if (path.includes('/test-numbers/status')) {
        return { is_paused: false, paused_by: null };
      }

      const target = globalThis.__mockAgents.find(a => String(a.id) === String(agentId));

      if (method === 'PUT' || method === 'PATCH') {
        if (target && body) {
          Object.assign(target, body, {
            updated_at: new Date().toISOString(),
            systemPrompt: body.systemPrompt || body.system_prompt || target.systemPrompt,
            llmModel: body.llmModel || target.llmModel,
            aiModelId: body.aiModelId ? String(body.aiModelId) : target.aiModelId,
            transcribeAudio: body.transcribeAudio !== undefined ? body.transcribeAudio : target.transcribeAudio,
            acceptImages: body.acceptImages !== undefined ? body.acceptImages : target.acceptImages,
            contextWindowMessages: body.contextWindowMessages || body.context_window_messages || target.contextWindowMessages,
            isActive: body.isActive !== undefined ? body.isActive : (body.is_active !== undefined ? body.is_active : target.isActive),
          });
          return target;
        }
        return { id: agentId, ...body, updated_at: new Date().toISOString() };
      }

      if (method === 'DELETE') {
        globalThis.__mockAgents = globalThis.__mockAgents.filter(a => String(a.id) !== String(agentId));
        return { ok: true };
      }

      if (method === 'GET') {
        return target || globalThis.__mockAgents[0];
      }
    }

    return globalThis.__mockAgents;
  }
  if (path.startsWith('/automation-folders')) {
    if (method === 'POST') {
      return { id: Date.now(), name: body?.name || 'New Project' };
    }
    if (method === 'PUT' || method === 'PATCH') {
      const m = path.match(/\/automation-folders\/([^/]+)/);
      const id = m ? m[1] : 1;
      return { id, name: body?.name || 'Updated Project' };
    }
    if (method === 'DELETE') {
      return { ok: true };
    }
    return [
      { id: 1, name: 'Default Campaigns' },
      { id: 2, name: 'Lead Nurturing' }
    ];
  }
  if (path === '/automation-lead-fields') {
    return [
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email Address' },
      { key: 'city', label: 'City' },
      { key: 'budget', label: 'Budget' },
    ];
  }

  // Templates & Broadcasts
  if (path === '/templates') {
    return [
      {
        id: '1',
        name: 'welcome_greeting',
        language: 'en',
        category: 'MARKETING',
        status: 'APPROVED',
        body: 'Hi {{1}}, welcome to Zylo AI! How can we assist you today?',
      },
      {
        id: '2',
        name: 'webinar_confirmation',
        language: 'en',
        category: 'UTILITY',
        status: 'APPROVED',
        body: 'Your registration is confirmed for {{1}}. Click below to join.',
      }
    ];
  }
  if (path === '/templates/library') return [];
  if (path === '/broadcasts') {
    return [
      {
        id: 1,
        name: 'October Product Update',
        status: 'COMPLETED',
        recipients_count: 450,
        sent_count: 450,
        delivered_count: 442,
        read_count: 396,
        created_at: new Date(Date.now() - 172800000).toISOString(),
      }
    ];
  }
  if (path === '/broadcast-series') return [];

  // Message Costs
  if (path === '/message-costs/overview') {
    return {
      totalCost: 342.80,
      currency: 'INR',
      totalMessages: 1850,
      marketingCost: 280.50,
      utilityCost: 62.30,
    };
  }
  if (path === '/message-costs/templates' || path === '/message-costs/trend' || path === '/message-costs/breakdown') {
    return [];
  }
  if (path === '/message-costs/config') {
    return { currency: 'INR', rates: {} };
  }

  // Leads & Pipeline
  if (!globalThis.__mockLeads) {
    globalThis.__mockLeads = [
      {
        id: 101,
        name: 'Hemanth',
        phone: '918123133382',
        whatsapp_number: '918123133382',
        email: 'hemanth@zerolens.ai',
        profession: 'Business Owner',
        city: 'Indiranagar, Bengaluru',
        stage: 'hot',
        source: 'WhatsApp Inbound',
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        tags: ['Appointment Booked', 'Dental Clinic'],
        custom_fields: {
          business_type: 'Aesthetic Dental Clinic',
          appointment_slot: 'Friday 6:30 PM IST',
          requirements: 'Patient follow-ups & automated booking',
        },
      },
      {
        id: 1,
        name: 'Rahul Sharma',
        phone: '919876543210',
        whatsapp_number: '919876543210',
        email: 'rahul.s@example.com',
        profession: 'Marketing Professional',
        city: 'Mumbai',
        stage: 'engaged',
        source: 'Meta Ads',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        last_activity_at: new Date(Date.now() - 3600000).toISOString(),
        tags: ['VIP', 'Meta Ads Lead'],
        custom_fields: {
          ad_name: 'CTWA IG Reel 12',
          campaign_id: 'cmp_oct_growth',
        },
      },
      {
        id: 2,
        name: 'Priya Patel',
        phone: '919876543211',
        whatsapp_number: '919876543211',
        email: 'priya.p@example.com',
        profession: 'Freelancer',
        city: 'Bengaluru',
        stage: 'enrolled',
        source: 'WhatsApp Direct',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        last_activity_at: new Date(Date.now() - 1800000).toISOString(),
        tags: ['Enrolled', 'Paid Client'],
        total_paid: 15000,
        paid_course: 'WhatsApp Automation Bundle',
      },
      {
        id: 3,
        name: 'Amit Verma',
        phone: '919876543212',
        whatsapp_number: '919876543212',
        email: 'amit.v@example.com',
        profession: 'Engineer',
        city: 'Delhi',
        stage: 'new',
        source: 'Website Form',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        last_activity_at: new Date(Date.now() - 7200000).toISOString(),
        tags: ['Website Form'],
      }
    ];
  }

  if (path === '/leads' || path === '/leads/list') {
    if (method === 'POST') {
      const newLead = {
        id: Date.now(),
        name: body?.name || 'New Lead',
        phone: body?.phone || body?.whatsapp_number || '',
        whatsapp_number: body?.phone || body?.whatsapp_number || '',
        email: body?.email || '',
        profession: body?.profession || 'Business Owner',
        city: body?.city || '',
        stage: body?.stage || 'new',
        source: body?.source || 'WhatsApp Inbound',
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        tags: body?.tags || ['New Lead'],
        custom_fields: body?.custom_fields || {},
      };
      globalThis.__mockLeads.unshift(newLead);
      return { ok: true, lead: newLead };
    }

    let filtered = [...globalThis.__mockLeads];
    try {
      const parsed = new URL(urlPath, 'http://localhost');
      const qStage = parsed.searchParams.get('stage');
      const qSource = parsed.searchParams.get('source');
      const qSearch = (parsed.searchParams.get('search') || '').toLowerCase();

      if (qStage) filtered = filtered.filter(l => l.stage === qStage);
      if (qSource) filtered = filtered.filter(l => l.source === qSource);
      if (qSearch) {
        filtered = filtered.filter(l =>
          (l.name && l.name.toLowerCase().includes(qSearch)) ||
          (l.phone && l.phone.includes(qSearch)) ||
          (l.email && l.email.toLowerCase().includes(qSearch))
        );
      }
    } catch {}

    return { leads: filtered, total: filtered.length };
  }

  const leadMoveMatch = path.match(/\/leads\/(\d+)\/move/);
  if (leadMoveMatch) {
    const leadId = Number(leadMoveMatch[1]);
    const target = (globalThis.__mockLeads || []).find(l => Number(l.id) === leadId);
    if (target && body?.stage) {
      target.stage = body.stage;
      target.last_activity_at = new Date().toISOString();
    }
    return { ok: true, lead: target };
  }

  const leadIdMatch = path.match(/\/leads\/(\d+)/);
  if (leadIdMatch) {
    const leadId = Number(leadIdMatch[1]);
    const target = (globalThis.__mockLeads || []).find(l => Number(l.id) === leadId);
    if (path.includes('/timeline')) {
      return {
        events: [
          { id: 1, type: 'stage_change', text: `Stage moved to ${target?.stage?.toUpperCase() || 'NEW'}`, created_at: new Date().toISOString() },
          { id: 2, type: 'whatsapp_message', text: 'WhatsApp message sent & received', created_at: new Date().toISOString() }
        ],
        activity: []
      };
    }
    if (method === 'PATCH' || method === 'PUT') {
      if (target && body) {
        Object.assign(target, body, { last_activity_at: new Date().toISOString() });
      }
      return { ok: true, lead: target };
    }
    if (method === 'DELETE') {
      globalThis.__mockLeads = (globalThis.__mockLeads || []).filter(l => Number(l.id) !== leadId);
      return { ok: true };
    }
    return { lead: target || (globalThis.__mockLeads ? globalThis.__mockLeads[0] : {}) };
  }

  if (path === '/leads/board') {
    const columns = {
      new: [],
      contacted: [],
      engaged: [],
      hot: [],
      enrolled: [],
      cold_lost: [],
    };
    (globalThis.__mockLeads || []).forEach(lead => {
      const st = columns[lead.stage] ? lead.stage : 'new';
      columns[st].push(lead);
    });

    return {
      stages: ['new', 'contacted', 'engaged', 'hot', 'enrolled', 'cold_lost'],
      columns,
      conversions: [
        { from: 'new', to: 'contacted', pct: 80 },
        { from: 'contacted', to: 'engaged', pct: 65 },
        { from: 'engaged', to: 'hot', pct: 50 },
        { from: 'hot', to: 'enrolled', pct: 30 },
      ],
      coldAfterFollowUps: 3,
    };
  }
  if (path === '/leads/onboarding') return [];

  // Payments & Sales
  if (path === '/payment-requests') return { requests: [], total: 0 };
  if (path === '/payment-requests/summary') {
    return { totalCollected: 245000, pending: 18500, successfulCount: 38 };
  }
  if (path === '/razorpay/status') return { status: 'connected' };
  if (path === '/razorpay/config') return { keyId: 'rzp_live_sample', isLive: true };
  if (path === '/razorpay/events') return [];
  if (path === '/razorpay/payments') return [];
  if (path === '/razorpay/payments/summary') return { total: 245000, count: 38 };
  if (path === '/products') {
    return [
      { id: 1, name: 'Growth Mastery Cohort', price_paise: 1500000, active: true },
      { id: 2, name: 'WhatsApp Automation Bundle', price_paise: 950000, active: true },
    ];
  }
  if (path === '/products/revenue') return { total: 245000 };
  if (path === '/sales-log') return { rows: [], total: 0 };
  if (path === '/sales-log/summary') return { count: 2, total: 245000 };
  if (path === '/students') return [];

  // Pipelines
  if (path === '/pipelines') {
    return {
      pipelines: [
        {
          id: 1,
          name: 'Sales Pipeline',
          stages: [
            { id: 1, name: 'Discovery', sortOrder: 0 },
            { id: 2, name: 'Demo Call', sortOrder: 1 },
            { id: 3, name: 'Proposal', sortOrder: 2 },
            { id: 4, name: 'Closed Won', sortOrder: 3 },
          ]
        }
      ]
    };
  }
  if (path.startsWith('/pipelines/') && path.endsWith('/board')) {
    return {
      pipeline: { id: 1, name: 'Sales Pipeline' },
      stages: [
        { id: 1, name: 'Discovery', deals: [] },
        { id: 2, name: 'Demo Call', deals: [] },
        { id: 3, name: 'Proposal', deals: [] },
        { id: 4, name: 'Closed Won', deals: [] },
      ],
      deals: [
        { id: 1, title: 'Enterprise Growth Stack', stageId: 1, valuePaise: 5000000, contactName: 'Rahul Sharma' },
        { id: 2, title: 'Automation Add-on', stageId: 2, valuePaise: 1500000, contactName: 'Priya Patel' },
      ],
      kpis: {
        totalValue: 65000,
        openDeals: 2,
        wonDeals: 0,
        winRate: 0,
      }
    };
  }
  if (path === '/deal-contacts' || path === '/deal-assignees') return [];

  // Projects & Folders
  if (path === '/projects') {
    return [{ id: 1, name: 'Q4 Growth Campaign', count: 4 }];
  }

  // AI Models & Agents
  if (path === '/ai-models') {
    return [
      {
        id: 1,
        provider: 'gemini',
        providerLabel: 'Google Gemini (Vertex AI)',
        label: 'Google Cloud Vertex AI Production',
        apiKeyMasked: 'AQ.Ab8RN6Lw...4GZ3g (Service Account Active)',
        baseUrl: 'https://us-central1-aiplatform.googleapis.com',
        availableModels: [
          { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
          { id: 'gemini-3.5-transcribe-preview', name: 'Gemini 3.5 Transcribe' },
        ],
        enabledModels: ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-pro'],
        status: 'connected',
        is_active: true,
      },
      {
        id: 2,
        provider: 'anthropic',
        providerLabel: 'Anthropic Claude',
        label: 'Claude 3.5 Sonnet',
        apiKeyMasked: 'sk-ant-...',
        availableModels: [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
        ],
        enabledModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
        status: 'connected',
      },
      {
        id: 3,
        provider: 'openai',
        providerLabel: 'OpenAI',
        label: 'OpenAI GPT-4o',
        apiKeyMasked: 'sk-proj-...',
        availableModels: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        ],
        enabledModels: ['gpt-4o', 'gpt-4o-mini'],
        status: 'connected',
      },
    ];
  }
  if (path === '/agents') {
    return [
      {
        id: 1,
        name: 'WhatsApp Appointment Booking Agent (Gemini AI)',
        description: 'Greets inbound WhatsApp leads, collects name and queries, answers from Knowledge Base, and books appointments.',
        status: 'active',
        isActive: true,
        aiModelId: 1,
        aiProvider: 'gemini',
        aiModelLabel: 'Google Gemini (Vertex AI)',
        llmModel: 'gemini-3.5-flash-lite',
        systemPrompt: 'You are an intelligent appointment booking assistant for Connects AI. Warmly greet the customer, ask for their name, identify what service or consultation they need, answer questions strictly from the verified Knowledge Base, and book their appointment date and time.',
        triggerMode: 'any',
        created_at: new Date().toISOString(),
      }
    ];
  }

  // Message Formats & WA Links
  if (path === '/message-formats' || path === '/wa-links') {
    return [
      {
        id: 1,
        slug: 'growth-cohort',
        label: 'Growth Cohort Click-To-Chat',
        prefilled_text: 'Hi, I want to learn more about Zylo AI',
        clicks: 142,
        conversations: 89,
      }
    ];
  }

  // Media & Forms & Settings
  if (path === '/media-library') return [];
  // Lead Forms
  if (path.startsWith('/lead-forms') || path.startsWith('/public/lead-forms')) {
    if (!globalThis.__mockForms) {
      globalThis.__mockForms = [
        {
          id: 1,
          name: 'Course Interest & Consultation Form',
          slug: 'course-interest',
          description: 'Tell us about your learning goals and we will customize a curriculum for you.',
          formType: 'link',
          projectId: null,
          projectName: null,
          waAccountId: null,
          templateId: null,
          fields: [
            { key: 'full_name', label: 'Full Name', type: 'text', required: true, mapsTo: 'name' },
            { key: 'phone_number', label: 'WhatsApp Phone Number', type: 'phone', required: true, mapsTo: 'phone' },
            { key: 'experience_level', label: 'Experience Level', type: 'dropdown', required: false, options: ['Beginner', 'Intermediate', 'Advanced'] },
          ],
          hasLogo: false,
          hasBanner: false,
          status: 'published',
          successMessage: 'Thank you! Our admissions advisor will contact you on WhatsApp shortly.',
          defaultSource: 'website_form',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          submissionCount: 18,
        }
      ];
    }

    if (path.includes('/submissions')) {
      return { submissions: [], total: 0 };
    }
    if (path.includes('/dashboard')) {
      return { views: 42, submissions: 18, conversionRate: 42.8, identifiedSubmissions: 18, fields: [] };
    }
    if (path.includes('/templates')) {
      return { templates: [] };
    }

    if (path === '/lead-forms') {
      if (method === 'POST') {
        const id = Date.now();
        const newForm = {
          id,
          name: body?.name || 'Untitled Form',
          slug: String(body?.name || 'form').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
          description: body?.description || '',
          formType: body?.formType || 'link',
          projectId: body?.projectId || null,
          projectName: null,
          waAccountId: null,
          templateId: null,
          fields: body?.fields || [
            { key: 'full_name', label: 'Full Name', type: 'text', required: true, mapsTo: 'name' },
            { key: 'phone_number', label: 'WhatsApp Phone', type: 'phone', required: true, mapsTo: 'phone' },
          ],
          hasLogo: false,
          hasBanner: false,
          status: 'draft',
          successMessage: 'Thank you for your response!',
          defaultSource: 'website_form',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          submissionCount: 0,
        };
        globalThis.__mockForms.unshift(newForm);
        return { form: newForm };
      }
      return { forms: globalThis.__mockForms };
    }

    const m = path.match(/\/lead-forms\/(\d+)/);
    const formId = m ? Number(m[1]) : 1;
    let target = globalThis.__mockForms.find(f => f.id === formId) || globalThis.__mockForms[0];

    if (method === 'PUT' || method === 'PATCH') {
      if (target && body) {
        Object.assign(target, body, { updatedAt: new Date().toISOString() });
      }
      return { form: target };
    }
    if (method === 'DELETE') {
      globalThis.__mockForms = globalThis.__mockForms.filter(f => f.id !== formId);
      return { ok: true };
    }

    return { form: target };
  }
  if (path === '/storage/r2/status' || path === '/storage/r2') {
    return {
      connected: true,
      provider: 'Cloudflare R2',
      bucket: 'connects-ai-media',
      accountId: 'd8945011...',
      endpoint: 'https://d8945011e8c1b69f5204fd69b2bf12cf.r2.cloudflarestorage.com',
      egressCost: 'Free ($0.00 / GB)',
      status: 'active',
    };
  }
  if (path === '/storage/r2/test') {
    return {
      ok: true,
      message: 'Cloudflare R2 Connection & Upload Verified!',
      bucket: 'connects-ai-media',
      details: { key: `test/connection-test-${Date.now()}.txt` },
    };
  }
  if (path === '/domains') return [];
  if (path === '/domains/status') return { configured: true };
  if (path === '/users') return [DEMO_USER];
  if (path === '/roles') {
    return [
      { id: 1, key: 'admin', name: 'Admin' },
      { id: 2, key: 'agent', name: 'Agent' },
      { id: 3, key: 'viewer', name: 'Viewer' }
    ];
  }
  if (path === '/audit-log') return [];
  if (path === '/mcp/settings') return { enabled: true };
  if (path === '/mcp/keys' || path === '/mcp/oauth/clients') return [];
  if (path === '/integrations' || path === '/integrations/credentials') return [];
  if (path === '/webinars') return [];
  if (path === '/resources' || path === '/trigger-library') return [];

  // Default fallback
  if (path.endsWith('s') || path.includes('/list')) return [];
  return {};
}
