// A TestFlight invite request. The message goes to apple@autarki.app.
// Cloudflare Email Routing forwards that address. This function does not
// keep the address and does not add the tester in App Store Connect.

var TO = "apple@autarki.app";
var FROM = "noreply@autarki.app";
var SUBJECT = "Apple Autarki Tester Request";

function cleanEmail(value) {
  if (typeof value !== "string") return "";
  var email = value.trim();
  if (!email || email.length > 254) return "";
  if (email.indexOf("\r") !== -1 || email.indexOf("\n") !== -1) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

function originAllowed(origin) {
  if (!origin) return true;
  if (origin === "https://autarki.app" || origin === "https://www.autarki.app") return true;
  if (origin.indexOf("http://127.0.0.1:") === 0) return true;
  if (origin.indexOf("http://localhost:") === 0) return true;
  return false;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

function html(sent) {
  var title = sent ? "Request sent." : "The request did not send.";
  var page = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + title + "</title></head><body><p>" + title + "</p><p><a href=\"/install#iphone\">Back to Install</a></p></body></html>";
  return new Response(page, {
    status: sent ? 200 : 400,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

async function readFields(request) {
  var type = request.headers.get("content-type") || "";
  if (type.indexOf("application/json") !== -1) {
    var body = await request.json();
    return {
      email: body && body.email,
      company: body && body.company
    };
  }
  var form = await request.formData();
  return {
    email: form.get("email"),
    company: form.get("company")
  };
}

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env || {};
  var wantsJson = (request.headers.get("accept") || "").indexOf("application/json") !== -1;
  if (!originAllowed(request.headers.get("origin"))) {
    return wantsJson ? json({ ok: false }, 403) : html(false);
  }
  var length = Number(request.headers.get("content-length") || 0);
  if (length > 4000) return wantsJson ? json({ ok: false }, 400) : html(false);

  var fields;
  try {
    fields = await readFields(request);
  } catch (e) {
    return wantsJson ? json({ ok: false }, 400) : html(false);
  }

  if (fields.company) return wantsJson ? json({ ok: true }, 200) : html(true);

  var email = cleanEmail(fields.email);
  if (!email) return wantsJson ? json({ ok: false }, 400) : html(false);
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    return wantsJson ? json({ ok: false }, 503) : html(false);
  }

  try {
    await env.EMAIL.send({
      to: TO,
      from: FROM,
      replyTo: email,
      subject: SUBJECT,
      text: email + "\n"
    });
  } catch (e) {
    return wantsJson ? json({ ok: false }, 502) : html(false);
  }
  return wantsJson ? json({ ok: true }, 200) : html(true);
}

export { cleanEmail, TO, FROM, SUBJECT };
