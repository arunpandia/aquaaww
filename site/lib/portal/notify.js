// Best-effort emails about orders and support. Wording is plain on purpose; none of it blocks the action that caused it.
const { sendMail, quiet, notifyTo } = require('./mail');
const BASE = 'https://dusktillus.store';
const inr = p => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const lineText = o => o.lines.map(l => `${l.qty} x ${l.name}  ${inr(l.unit * l.qty)}`).join('\n');

exports.orderPaid = (o, downloads) => quiet(async () => {
  const dl = downloads.length ? '\n\nYour downloads:\n' + downloads.map(d => `${d.name}: ${BASE}${d.url}`).join('\n') + '\n(Each link works for 60 days and a limited number of downloads.)' : '';
  const ship = o.physical ? `\n\nWe will email you the courier and tracking number when your order is dispatched, usually within 2 to 4 working days. It ships to ${[o.shipTo.line1, o.shipTo.line2, o.shipTo.city, o.shipTo.state, o.shipTo.pin].filter(Boolean).join(', ')}.` : '';
  await sendMail({ to: o.customer.email, subject: `Your Dusktillus order ${o.id}`, replyTo: notifyTo(),
    text: `Thank you, ${o.customer.name}. Your payment was received.\n\nOrder ${o.id}\n${lineText(o)}\nShipping ${inr(o.shipping)}\nTotal ${inr(o.total)}${ship}${dl}\n\nQuestions? Just reply to this email.` });
  await sendMail({ to: notifyTo(), subject: `New order ${o.id}: ${inr(o.total)}`, replyTo: o.customer.email,
    text: `${o.customer.name} <${o.customer.email}>\n${o.physical ? 'PHYSICAL (needs shipping)' : 'Digital only'}\n\n${lineText(o)}\nTotal ${inr(o.total)}` });
});

exports.shipped = o => quiet(() => sendMail({ to: o.customer.email, subject: `Your order ${o.id} is on its way`, replyTo: notifyTo(),
  text: `Good news, your order ${o.id} has been dispatched.\n\nCourier: ${o.carrier || 'to be confirmed'}\nTracking number: ${o.tracking || 'to be confirmed'}${o.trackingUrl ? '\nTrack it: ' + o.trackingUrl : ''}\n\nDelivery usually takes 4 to 10 working days.` }));

exports.ticketNew = t => quiet(() => sendMail({ to: notifyTo(), subject: `Support: ${t.subject}`, replyTo: t.email,
  text: `New support ticket ${t.id} from ${t.email}${t.orderId ? ' about order ' + t.orderId : ''}\n\n${t.messages[0].text}` }));

exports.ticketReplied = (t, text) => quiet(() => sendMail({ to: t.email, subject: `Re: ${t.subject} [${t.id}]`, replyTo: notifyTo(),
  text: `${text}\n\n- Dusktillus support\n\n(Ticket ${t.id}. Reply here or sign in to see the whole conversation.)` }));
