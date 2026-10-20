/**
 * Runs inline on the TV board. Written as plain ES5 on purpose: smart-TV browsers are often too old for the
 * Next/React bundle, so the board must not depend on it. Card rotation is pure CSS (see page.tsx); this only does
 * the extras: relative times, the New tag + confetti for a win that arrived since last load, and the scheduled reload.
 */
export const BOARD_SCRIPT = `(function () {
  var root = document.getElementById("zk-board"); if (!root) return;
  var newest = root.getAttribute("data-newest") || "", KEY = "zaka_board_newest", seen = null;
  try { seen = localStorage.getItem(KEY); if (newest) localStorage.setItem(KEY, newest); } catch (e) {}
  var fresh = !!(newest && seen && seen !== newest);
  if (fresh) {
    var tags = document.querySelectorAll('[data-new-for="' + newest + '"]');
    for (var t = 0; t < tags.length; t++) tags[t].style.display = "";
  }

  function ago(iso) {
    var s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    if (s < 604800) return Math.floor(s / 86400) + "d ago";
    return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  }
  function times() {
    var els = document.querySelectorAll("[data-at]");
    for (var i = 0; i < els.length; i++) els[i].textContent = ago(els[i].getAttribute("data-at"));
  }
  times(); setInterval(times, 60000);

  function confetti(n) {
    var C = ["#F09A72", "#E57F98", "#B48AD6", "#7C86E0", "#64AEDB", "#5FBF88", "#E9C64A"];
    var box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:50";
    for (var k = 0; k < n; k++) {
      var p = document.createElement("i"), w = 7 + Math.random() * 7, round = Math.random() < 0.3, dur = 2.4 + Math.random() * 1.6;
      p.className = "zk-confetti";
      p.style.cssText = "left:" + Math.random() * 100 + "%;width:" + w + "px;height:" + (round ? w : w * 0.45) + "px;background:" + C[k % 7] +
        ";border-radius:" + (round ? "9999px" : "2px") + ";animation-duration:" + dur + "s;animation-delay:" + Math.random() * 0.5 + "s";
      p.style.setProperty("--dx", (Math.random() - 0.5) * 24 + "vw");
      p.style.setProperty("--rot", Math.random() * 900 - 450 + "deg");
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 5000);
  }
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!still) confetti(fresh ? 80 : 30);

  // check for new wins hourly, weekdays 7am-5pm (TV's clock) only, to keep Supabase/Vercel usage low.
  // the first check of a new day is a reload too, which also resets a browser that's been open for days.
  var loaded = Date.now(), day = new Date().toDateString();
  setInterval(function () {
    var now = new Date(), d = now.getDay(), h = now.getHours();
    if (d < 1 || d > 5 || h < 7 || h >= 17) return;
    if (now.toDateString() !== day || now.getTime() - loaded >= 3600000) window.location.reload();
  }, 60000);
})();`;
