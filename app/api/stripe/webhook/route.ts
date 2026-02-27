import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;

async function airtableRequest(
  table: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: object,
  params?: string
) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}${params || ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Airtable ${method} ${table}: ${await res.text()}`);
  return res.json();
}

async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const data = await airtableRequest('Events Log', 'GET', undefined,
    `?filterByFormula=AND({Stripe Event ID}="${stripeEventId}")`);
  return data.records?.length > 0;
}

async function logEvent(id: string, type: string, status: string, details: string) {
  await airtableRequest('Events Log', 'POST', {
    records: [{ fields: { 'Stripe Event ID': id, 'Event Type': type, 'Status': status, 'Details': details, 'Processed At': new Date().toISOString() } }]
  });
}

async function upsertAccount(customerId: string, fields: object): Promise<string | null> {
  const existing = await airtableRequest('Accounts', 'GET', undefined,
    `?filterByFormula={Stripe Customer ID}="${customerId}"`);
  if (existing.records?.length > 0) {
    const id = existing.records[0].id;
    await airtableRequest('Accounts', 'PATCH', { records: [{ id, fields }] });
    return id;
  }
  const created = await airtableRequest('Accounts', 'POST', {
    records: [{ fields: { 'Stripe Customer ID': customerId, ...fields } }]
  });
  return created.records?.[0]?.id || null;
}

async function upsertContact(email: string, fields: object, accountId?: string): Promise<string | null> {
  const existing = await airtableRequest('Contacts', 'GET', undefined,
    `?filterByFormula={Email}="${email}"`);
  const f: any = { Email: email, ...fields };
  if (accountId) f['Account'] = [accountId];
  if (existing.records?.length > 0) {
    await airtableRequest('Contacts', 'PATCH', { records: [{ id: existing.records[0].id, fields: f }] });
    return existing.records[0].id;
  }
  const created = await airtableRequest('Contacts', 'POST', { records: [{ fields: f }] });
  return created.records?.[0]?.id || null;
}

async function writeInvoice(fields: object) {
  await airtableRequest('Invoices', 'POST', { records: [{ fields }] });
}

async function upsertRevenue(subId: string, fields: object) {
  const existing = await airtableRequest('Revenue Projections', 'GET', undefined,
    `?filterByFormula={Stripe Subscription ID}="${subId}"`);
  if (existing.records?.length > 0) {
    await airtableRequest('Revenue Projections', 'PATCH', { records: [{ id: existing.records[0].id, fields }] });
  } else {
    await airtableRequest('Revenue Projections', 'POST', {
      records: [{ fields: { 'Stripe Subscription ID': subId, ...fields } }]
    });
  }
}

async function handleCheckout(session: Stripe.Checkout.Session) {
  const cid = session.customer as string;
  const email = session.customer_email || session.customer_details?.email || '';
  const name = session.customer_details?.name || '';
  const subId = session.subscription as string;
  const amount = (session.amount_total || 0) / 100;
  const accountId = await upsertAccount(cid, { 'Name': name || email, 'Email': email, 'Status': 'Active', 'Revenue Stage': 'New Customer', 'Plan': session.metadata?.plan || 'Unknown' });
  if (email) await upsertContact(email, { 'Name': name, 'Status': 'Customer' }, accountId || undefined);
  await writeInvoice({ 'Stripe Session ID': session.id, 'Customer Email': email, 'Amount': amount, 'Currency': (session.currency || 'usd').toUpperCase(), 'Status': 'Paid', 'Type': 'Checkout', 'Date': new Date().toISOString(), ...(accountId ? { 'Account': [accountId] } : {}) });
  if (subId) {
    const sub = await stripe.subscriptions.retrieve(subId);
    const mrr = (sub.items.data[0]?.price?.unit_amount || 0) / 100;
    await upsertRevenue(subId, { 'Customer Email': email, 'MRR': mrr, 'ARR': mrr * 12, 'Status': 'Active', 'Start Date': new Date().toISOString(), 'Plan': session.metadata?.plan || 'Unknown', ...(accountId ? { 'Account': [accountId] } : {}) });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const cid = invoice.customer as string;
  const email = invoice.customer_email || '';
  const subId = invoice.subscription as string;
  const amount = invoice.amount_paid / 100;
  const accountId = await upsertAccount(cid, { 'Status': 'Active', 'Last Payment': new Date().toISOString(), 'Revenue Stage': 'Paying Customer' });
  await writeInvoice({ 'Stripe Invoice ID': invoice.id, 'Customer Email': email, 'Amount': amount, 'Currency': invoice.currency.toUpperCase(), 'Status': 'Paid', 'Type': 'Subscription Renewal', 'Date': new Date(invoice.created * 1000).toISOString(), 'Invoice URL': invoice.hosted_invoice_url || '', ...(accountId ? { 'Account': [accountId] } : {}) });
  if (subId) {
    const sub = await stripe.subscriptions.retrieve(subId);
    const mrr = (sub.items.data[0]?.price?.unit_amount || 0) / 100;
    await upsertRevenue(subId, { 'Status': 'Active', 'MRR': mrr, 'ARR': mrr * 12, 'Last Payment': new Date().toISOString(), ...(accountId ? { 'Account': [accountId] } : {}) });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const cid = invoice.customer as string;
  const email = invoice.customer_email || '';
  const subId = invoice.subscription as string;
  const accountId = await upsertAccount(cid, { 'Status': 'Payment Failed', 'Revenue Stage': 'At Risk', 'Escalation Level': 'Orange' });
  await writeInvoice({ 'Stripe Invoice ID': invoice.id, 'Customer Email': email, 'Amount': invoice.amount_due / 100, 'Currency': invoice.currency.toUpperCase(), 'Status': 'Failed', 'Type': 'Payment Failure', 'Date': new Date(invoice.created * 1000).toISOString(), ...(accountId ? { 'Account': [accountId] } : {}) });
  if (subId) await upsertRevenue(subId, { 'Status': 'At Risk', 'Escalation Level': 'Orange', ...(accountId ? { 'Account': [accountId] } : {}) });
}

async function handleSubDeleted(subscription: Stripe.Subscription) {
  const cid = subscription.customer as string;
  const accountId = await upsertAccount(cid, { 'Status': 'Churned', 'Revenue Stage': 'Churned', 'Escalation Level': 'Red', 'Churn Date': new Date().toISOString() });
  await upsertRevenue(subscription.id, { 'Status': 'Churned', 'MRR': 0, 'ARR': 0, 'Churn Date': new Date().toISOString(), 'Escalation Level': 'Red', ...(accountId ? { 'Account': [accountId] } : {}) });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  try {
    if (await isEventProcessed(event.id)) {
      return NextResponse.json({ status: 'already_processed' });
    }
  } catch {}
  try {
    switch (event.type) {
      case 'checkout.session.completed': await handleCheckout(event.data.object as Stripe.Checkout.Session); break;
      case 'invoice.paid': await handleInvoicePaid(event.data.object as Stripe.Invoice); break;
      case 'invoice.payment_failed': await handlePaymentFailed(event.data.object as Stripe.Invoice); break;
      case 'customer.subscription.deleted': await handleSubDeleted(event.data.object as Stripe.Subscription); break;
    }
    await logEvent(event.id, event.type, 'success', '{"processed":true}');
    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    try { await logEvent(event.id, event.type, 'error', err.message || 'Unknown'); } catch {}
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
