// Complete realistic mock dataset for ForgeGrowth-OSS preview mode

const DEMO_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'admin',
  isActive: true,
  permissions: null,
  pages: [
    'home', 'chatbot-builder', 'template-builder', 'chats',
    'bulk-message', 'admin-settings', 'media-library', 'wa-links',
    'pipelines', 'ai-agent-builder', 'lead-forms', 'projects',
    'mkt-overview', 'campaigns', 'ctwa-ads', 'conversion-api',
    'sales-pipeline', 'leads', 'payments', 'onboarding',
    'sales-funnel', 'message-costs'
  ],
  assignedWaNumbers: ['918660395136', '+918660395136', '919876543210'],
};

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

export function getMockResponse(urlPath, method = 'GET', body = null) {
  const [pathname] = urlPath.split('?');
  const path = pathname.replace(/^\/api/, '');

  // Auth
  if (path === '/auth/me' || path === '/auth/login') return { user: DEMO_USER };
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

  // Funnel & Tags
  if (path === '/funnel/config' || path === '/funnel/stages') {
    return {
      stages: [
        { id: '1', key: 'new', name: 'New Lead', color: '#6366f1' },
        { id: '2', key: 'contacted', name: 'Contacted', color: '#06b6d4' },
        { id: '3', key: 'qualified', name: 'Qualified', color: '#10b981' },
        { id: '4', key: 'enrolled', name: 'Enrolled', color: '#8b5cf6' },
      ],
      sources: ['Meta Ads', 'WhatsApp Direct', 'Website Form', 'Organic Search', 'Referral'],
    };
  }
  if (path === '/funnel/chart') {
    return {
      stages: [
        { stage: 'New', count: 0 },
        { stage: 'Contacted', count: 0 },
        { stage: 'Qualified', count: 0 },
        { stage: 'Enrolled', count: 0 },
      ]
    };
  }
  if (path === '/funnel/sources') {
    return {
      sources: ['Meta Ads', 'WhatsApp Direct', 'Website Form', 'Organic Search', 'Referral'],
    };
  }
  if (path === '/lead-sources') {
    return {
      sources: [
        { source: 'WhatsApp Direct', leads: 0, hotPct: 0, enrolledPct: 0, costPerLead: 0, entryStage: 'new' },
        { source: 'Meta Ads', leads: 0, hotPct: 0, enrolledPct: 0, costPerLead: 0, entryStage: 'new' },
        { source: 'Website Form', leads: 0, hotPct: 0, enrolledPct: 0, costPerLead: 0, entryStage: 'new' },
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
              const text = m.text?.body || (m.type === 'interactive' ? m.interactive?.button_reply?.title : `[${m.type}]`);
              const profileName = val.contacts?.find(c => c.wa_id === from)?.profile?.name || `Client +${from}`;
              let c = mockContactsList.find(x => x.contact_number === from);
              if (!c) {
                c = {
                  id: Date.now(),
                  name: profileName,
                  contact_number: from,
                  last_message: text,
                  unread_count: 1,
                  updated_at: new Date().toISOString(),
                  tags: ['WhatsApp Inbound'],
                };
                mockContactsList.unshift(c);
              } else {
                c.last_message = text;
                c.unread_count = (c.unread_count || 0) + 1;
                c.updated_at = new Date().toISOString();
                if (profileName && !c.name.includes(profileName)) c.name = profileName;
              }
              if (!mockMessagesByContact[from]) mockMessagesByContact[from] = [];
              mockMessagesByContact[from].push({
                id: Date.now(),
                message_id: m.id || `wamid.in_${Date.now()}`,
                direction: 'incoming',
                message_body: text,
                message_type: 'text',
                timestamp: new Date().toISOString(),
                status: 'delivered',
              });
            }
          }
        }
      }
    } catch {}
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
  if (path.startsWith('/chatbots')) {
    if (method === 'POST') {
      return {
        id: Date.now(),
        name: body?.name || 'New Flow',
        trigger: body?.trigger || 'keyword',
        status: 'draft',
        folder_id: body?.folder_id || null,
        updated_at: new Date().toISOString(),
        nodes: body?.nodes || [],
        edges: body?.edges || [],
      };
    }
    if (method === 'PUT' || method === 'PATCH') {
      const m = path.match(/\/chatbots\/([^/]+)/);
      const id = m ? m[1] : 1;
      return {
        id,
        name: body?.name || 'Updated Flow',
        ...body,
        updated_at: new Date().toISOString(),
      };
    }
    if (method === 'DELETE') {
      return { ok: true };
    }
    return [
      {
        id: 1,
        name: 'Welcome & Qualification Flow',
        trigger: 'Keyword: "hello", "hi"',
        status: 'active',
        folder_id: 1,
        updated_at: new Date().toISOString(),
        nodes: [
          { id: '1', type: 'trigger', data: { label: 'Keyword: hello, hi' } },
          { id: '2', type: 'message', data: { body: 'Welcome to Zylo AI! Which service are you interested in?' } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ],
      },
      {
        id: 2,
        name: 'Webinar Follow-Up Sequence',
        trigger: 'CTWA Ad Link',
        status: 'active',
        folder_id: 2,
        updated_at: new Date().toISOString(),
        nodes: [],
        edges: [],
      }
    ];
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
  if (path === '/leads') {
    return {
      leads: [
        {
          id: 101,
          name: 'Client (+91 81231 33382)',
          phone: '918123133382',
          email: 'client@example.com',
          stage: 'new',
          source: 'WhatsApp Inbound',
          created_at: new Date().toISOString(),
          tags: ['New Client'],
        },
        {
          id: 1,
          name: 'Rahul Sharma',
          phone: '919876543210',
          email: 'rahul.s@example.com',
          stage: 'qualified',
          source: 'Meta Ads',
          created_at: new Date().toISOString(),
          tags: ['VIP', 'Hot Lead'],
        },
        {
          id: 2,
          name: 'Priya Patel',
          phone: '919876543211',
          email: 'priya.p@example.com',
          stage: 'enrolled',
          source: 'WhatsApp Direct',
          created_at: new Date().toISOString(),
          tags: ['Webinar'],
        },
        {
          id: 3,
          name: 'Amit Verma',
          phone: '919876543212',
          email: 'amit.v@example.com',
          stage: 'new',
          source: 'Website Form',
          created_at: new Date().toISOString(),
          tags: [],
        }
      ],
      total: 4,
    };
  }
  if (path === '/leads/board') {
    return {
      stages: ['new', 'contacted', 'engaged', 'hot', 'enrolled', 'cold_lost'],
      columns: {
        new: [
          { id: 101, name: 'Client (+91 81231 33382)', phone: '918123133382', source: 'WhatsApp Inbound', stage: 'new' },
          { id: 3, name: 'Amit Verma', phone: '919876543212', source: 'Website Form', stage: 'new' }
        ],
        contacted: [],
        engaged: [{ id: 1, name: 'Rahul Sharma', phone: '919876543210', source: 'Meta Ads', stage: 'engaged' }],
        hot: [],
        enrolled: [{ id: 2, name: 'Priya Patel', phone: '919876543211', source: 'WhatsApp Direct', stage: 'enrolled' }],
        cold_lost: [],
      },
      conversions: [
        { from: 'new', to: 'contacted', pct: 67 },
        { from: 'contacted', to: 'engaged', pct: 50 },
        { from: 'engaged', to: 'hot', pct: 40 },
        { from: 'hot', to: 'enrolled', pct: 25 },
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
      { id: 1, name: 'Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet', status: 'connected' },
      { id: 2, name: 'GPT-4o', provider: 'openai', model: 'gpt-4o', status: 'connected' },
    ];
  }
  if (path === '/agents') {
    return [
      {
        id: 1,
        name: 'Lead Qualification Assistant',
        status: 'active',
        ai_model_id: 1,
        instructions: 'Greet inbound WhatsApp leads and qualify their interest.',
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
