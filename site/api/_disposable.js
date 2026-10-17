// Temporary / disposable email providers. Matching covers the domain and any subdomain of it.
const DOMAINS = new Set(`
10minutemail.com 10minutemail.net 10minutemail.org 10minemail.com 10mail.org 20minutemail.com 20minutemail.it 30minutemail.com 60minutemail.com
1secmail.com 1secmail.net 1secmail.org esiix.com wwjmp.com xojxe.com yoggm.com vjuum.com laafd.com txcct.com dpptd.com kzccv.com qiott.com oosln.com
guerrillamail.com guerrillamail.net guerrillamail.org guerrillamail.biz guerrillamail.de guerrillamail.info guerrillamailblock.com sharklasers.com grr.la pokemail.net spam4.me
mailinator.com mailinator.net mailinator2.com mailinater.com notmailinator.com reallymymail.com sogetthis.com zippymail.info mailinator.org
tempmail.com tempmail.net tempmail.org tempmail.io tempmail.dev tempmail.plus tempmailo.com temp-mail.org temp-mail.io temp-mail.ru tempail.com tempr.email tempinbox.com tempinbox.xyz
tmpmail.org tmpmail.net tmpeml.com tmail.ws emltmp.com tmpbox.net
throwawaymail.com throwam.com trashmail.com trashmail.net trashmail.de trashmail.org trashmail.io trash-mail.com trashmail.me wegwerfmail.de wegwerfmail.net wegwerfmail.org
yopmail.com yopmail.fr yopmail.net cool.fr.nf jetable.fr.nf nospam.ze.tc nomail.xl.cx mega.zik.dj speed.1s.fr courriel.fr.nf moncourrier.fr.nf monemail.fr.nf monmail.fr.nf
getnada.com nada.email nada.ltd maildrop.cc maildrop.gq mailnesia.com mailcatch.com mailtemp.info mail-temp.com maildim.com mailpoof.com mailforspam.com mailsac.com
dispostable.com fakeinbox.com fakemail.net fakemailgenerator.com email-fake.com emailfake.com generator.email fake-mail.net luxusmail.org
mytemp.email mohmal.com emailondeck.com burnermail.io inboxkitten.com moakt.com moakt.cc disbox.net discard.email discardmail.com discardmail.de
mintemail.com spamgourmet.com spambox.us spambog.com spamavert.com spamfree24.org spamhereplease.com spamspot.com spamex.com spaml.com
jetable.org dropmail.me dropmail.cc 10mail.xyz harakirimail.com anonbox.net anonymbox.com byom.de mail.tm mail.gw mailtothis.com
mt2014.com mt2015.com mailexpire.com mailmoat.com mailnull.com mailscrap.com mailslurp.com mailzilla.org meltmail.com
getairmail.com gmailnator.com gmail.gq 0box.eu 0-mail.com 33mail.org? 4warding.com 7tags.com a-bc.net amilegit.com bccto.me binkmail.com bobmail.info
bugmenot.com chammy.info cuvox.de dayrep.com deadaddress.com despam.it devnullmail.com dingbone.com dodgeit.com dontreg.com e4ward.com
emailias.com emailsensei.com emailtemporanea.com emailtemporar.ro emailwarden.com enterto.com fakeinformation.com fastacura.com fleckens.hu
getonemail.com haltospam.com hidemail.de imails.info incognitomail.com incognitomail.net instant-mail.de kasmail.com killmail.com klassmaster.com
koszmail.pl kulturbetrieb.info lifebyfood.com lortemail.dk lovemeleaveme.com mailbucket.org mailde.de mailguard.me mailhazard.com mailimate.com
mailmetrash.com mailnator.com mailshell.com mailsiphon.com mailtemporaire.com mailtome.de mailtrash.net mailzilla.com nepwk.com nobulk.com
noclickemail.com nogmailspam.info nomail.pw nospamfor.us nowmymail.com objectmail.com odaymail.com oneoffemail.com onewaymail.com
pjjkp.com poofy.org proxymail.eu putthisinyourspamdatabase.com quickinbox.com rcpt.at recode.me regbypass.com safetymail.info sandelf.de
scatmail.com selfdestructingmail.com sendspamhere.com shiftmail.com skeefmail.com slopsbox.com smellfear.com snakemail.com sofort-mail.de
spambob.com spamcowboy.com spamday.com spamfighter.cf spamify.com spamobox.com speed.1s.fr supermailer.jp suremail.info teleworm.us
thankyou2010.com thisisnotmyrealemail.com tradermail.info trash2009.com trashdevil.com trashymail.com tyldd.com uggsrock.com veryrealemail.com
vidchart.com webemail.me wh4f.org whyspam.me willhackforfood.biz wuzupmail.net xagloo.com yep.it yuurok.com zehnminutenmail.de zoemail.org
`.split(/\s+/).map(s => s.replace('?', '').trim().toLowerCase()).filter(Boolean));

// words that give away a throwaway provider even when the domain is new
const PATTERN = /(temp(orary)?-?mail|10-?minute|20-?minute|guerrilla|trash-?mail|throw-?away|disposable|fake-?(mail|inbox)|mailinator|yopmail|burner|spam-?(box|gourmet|free)|minutemail|nada\.|inboxbear|tmpmail|dropmail)/i;

function isDisposable(email) {
  const domain = String(email).split('@').pop().toLowerCase().replace(/\.+$/, '');
  if (!domain) return true;
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) if (DOMAINS.has(parts.slice(i).join('.'))) return true;
  return PATTERN.test(domain);
}
module.exports = { isDisposable };
