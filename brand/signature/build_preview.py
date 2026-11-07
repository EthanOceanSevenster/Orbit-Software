"""Regenerate preview.html from signature.html.

The signature markup has exactly one home, signature.html. Django reads it, and
this script embeds the same bytes into the preview page, so the browser preview
can never drift away from what actually gets sent.

Run it after editing signature.html:

    python brand/signature/build_preview.py
"""

import pathlib

HERE = pathlib.Path(__file__).parent

SHELL = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Orbit Signature</title>
<style>
  :root { --bg:#f4f6fa; --card:#fff; --ink:#071630; --muted:#4b5563; --border:#e2e7ef; --brand:#0b5fff; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.55; }
  .wrap { max-width:900px; margin:0 auto; padding:40px 20px 80px; }
  .eyebrow { font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--brand);margin:0; }
  h1 { margin:8px 0 6px; font-size:32px; letter-spacing:-.5px; }
  .lede { margin:0; color:var(--muted); max-width:62ch; }
  section { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:28px; margin-bottom:20px; }
  h2 { margin:0 0 4px; font-size:18px; }
  .hint { margin:0 0 20px; color:var(--muted); font-size:14px; }
  .stage { border:1px dashed var(--border); border-radius:12px; padding:26px; background:#fff; overflow-x:auto; }
  .fields { display:flex; gap:12px; flex-wrap:wrap; }
  label { font-size:13px; color:var(--muted); }
  input { margin-top:4px; font:inherit; font-size:14px; padding:8px 10px; display:block;
    border:1px solid var(--border); border-radius:8px; background:var(--card); color:var(--ink); }
  .row { display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; align-items:center; }
  button { font:inherit; font-weight:600; font-size:14px; cursor:pointer; border-radius:8px;
    padding:10px 18px; border:1px solid var(--brand); background:var(--brand); color:#fff; transition:background .15s; }
  button:hover { background:#0049d6; }
  button.ghost { background:#fff; color:var(--ink); border-color:var(--border); }
  button.ghost:hover { background:var(--bg); }
  ol { padding-left:20px; margin:0; color:var(--muted); font-size:14px; }
  ol li { margin-bottom:8px; }
  ol li strong { color:var(--ink); }
  code { background:#eef1f6; padding:1px 6px; border-radius:4px;
    font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:.9em; }
  .note { border-left:3px solid var(--brand); background:#e9f0ff; padding:14px 18px;
    border-radius:0 8px 8px 0; font-size:14px; color:#1e3a8a; }
  .status { font-size:14px; color:#047857; font-weight:600; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#070d1a; --card:#0b1322; --ink:#e6ebf4; --muted:#9aa6b8; --border:#1c2840; }
    .stage { background:#fff; }
    code { background:#111a2e; }
    .note { background:#0f2251; color:#bfd4ff; }
  }
</style>
</head>
<body>
<div class="wrap">

  <header style="margin-bottom:36px">
    <p class="eyebrow">Orbit Software</p>
    <h1>Email signature</h1>
    <p class="lede">
      Fill in the company details, press Copy signature, then paste it into Gmail. It is
      built from tables with inline styles and contains no images at all, so it
      survives Gmail, Outlook and Apple Mail and cannot break when a recipient
      blocks remote content.
    </p>
  </header>

  <section>
    <h2>Your details</h2>
    <p class="hint">The preview updates as you type.</p>
    <div class="fields">
      <label>Contact email<input id="f-email" value="" placeholder="leave blank for none" style="width:250px"></label>
      <label>Website<input id="f-site" value="orbitsoftware.co.za" style="width:210px"></label>
      <label>Location<input id="f-loc" value="South Africa" style="width:200px"></label>
    </div>
    <p class="hint" style="margin:16px 0 0">
      There is no name, job title or phone number by design. Leave the email blank
      until a real company mailbox exists and the whole row disappears, rather than
      showing an address that bounces.
    </p>
  </section>

  <section>
    <h2>Preview</h2>
    <p class="hint">This is exactly what lands in the recipient's inbox.</p>
    <div class="stage"><div id="sig"></div></div>
    <div class="row">
      <button id="copy">Copy signature</button>
      <button class="ghost" id="copy-html">Copy HTML source</button>
      <span class="status" id="status" hidden>Copied</span>
    </div>
  </section>

  <section>
    <h2>Install in Gmail</h2>
    <ol>
      <li>Press <strong>Copy signature</strong> above.</li>
      <li>In Gmail, open <strong>Settings</strong> (the gear icon), then <strong>See all settings</strong>.</li>
      <li>Stay on the <strong>General</strong> tab and scroll down to <strong>Signature</strong>.</li>
      <li>Click <strong>Create new</strong>, name it <code>Orbit</code>, and paste into the box.</li>
      <li>Under <strong>Signature defaults</strong>, pick it for new emails and for replies.</li>
      <li>Scroll to the bottom and click <strong>Save Changes</strong>.</li>
    </ol>
    <p class="hint" style="margin:18px 0 0">
      Paste with <code>Ctrl+V</code>. Gmail sometimes trims a signature it thinks is long;
      if that happens, click the three dots at the bottom of the compose window to expand it.
    </p>
  </section>

  <section>
    <h2>One more Gmail setting</h2>
    <div class="note">
      The signature shows the company, but the <strong>sender name</strong> on replies you
      type by hand still comes from your Google profile. To change it, open Gmail
      <strong>Settings</strong>, then <strong>Accounts and Import</strong>, then
      <strong>Send mail as</strong>, click <strong>edit info</strong> next to your address,
      and set the name to <strong>Orbit Software</strong>.
    </div>
  </section>

  <section>
    <h2>Social links</h2>
    <p class="hint" style="margin:0">
      The two circles point at placeholder Facebook and LinkedIn home pages. Search the
      HTML source for <code>facebook.com</code> and <code>linkedin.com</code> in
      <code>signature.html</code> and swap in your real profile addresses, or delete that
      cell if you would rather not show them yet.
    </p>
  </section>

</div>

<!-- Embedded verbatim from signature.html by build_preview.py. Do not edit here. -->
<script type="text/plain" id="tpl">__SIGNATURE_TEMPLATE__</script>

<script>
function build() {
  const site = document.getElementById("f-site").value.trim()
    .replace(/^https?:\/\//, "").replace(/\/$/, "");
  const email = document.getElementById("f-email").value.trim();

  let html = document.getElementById("tpl").textContent;

  // Drop the comment that documents the template. It is for whoever edits
  // signature.html, not for the email.
  html = html.replace(/^\s*<!--[\s\S]*?-->\s*/, "");

  // The email row is optional. Drop it entirely when no address is given,
  // because a dead mailbox in a signature is worse than no mailbox at all.
  if (email) {
    html = html.replace(/<!--IF_EMAIL-->\r?\n?/, "").replace(/<!--END_EMAIL-->\r?\n?/, "");
  } else {
    html = html.replace(/<!--IF_EMAIL-->[\s\S]*?<!--END_EMAIL-->\r?\n?/, "");
  }

  // Tokens are wrapped in double underscores so they cannot collide with real
  // copy such as "WEBSITE DESIGN" in the services strip.
  const values = {
    __WEBSITE__: site,
    __LOCATION__: document.getElementById("f-loc").value.trim(),
    __EMAIL__: email,
  };
  for (const key of Object.keys(values)) {
    html = html.split(key).join(values[key]);
  }
  return html;
}

function render() { document.getElementById("sig").innerHTML = build(); }

function flash() {
  const el = document.getElementById("status");
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 2000);
}

async function copyRich() {
  const html = build();
  const text = document.getElementById("sig").innerText;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("sig"));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeAllRanges();
  }
  flash();
}

async function copySource() {
  try {
    await navigator.clipboard.writeText(build());
  } catch {
    const ta = document.createElement("textarea");
    ta.value = build();
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  flash();
}

document.querySelectorAll("input").forEach((i) => i.addEventListener("input", render));
document.getElementById("copy").addEventListener("click", copyRich);
document.getElementById("copy-html").addEventListener("click", copySource);
render();
</script>
</body>
</html>
"""


def main() -> None:
    template = (HERE / "signature.html").read_text(encoding="utf-8")
    # The template goes inside a <script type="text/plain"> block, so only the
    # closing-tag sequence needs neutralising. It does not appear in practice,
    # but guard anyway so a future edit cannot break the page.
    safe = template.replace("</script", "<\\/script")
    out = SHELL.replace("__SIGNATURE_TEMPLATE__", safe)
    (HERE / "preview.html").write_text(out, encoding="utf-8")
    print(f"preview.html rebuilt from signature.html ({len(template)} chars embedded)")


if __name__ == "__main__":
    main()
