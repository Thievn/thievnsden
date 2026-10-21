/* Update toast and install banner. The signed-in app opts in with [data-den-app]. */
(function () {
  var W = window;
  var D = document;

  function ls(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (error) {
      return null;
    }
  }

  function standalone() {
    return matchMedia("(display-mode: standalone)").matches
      || matchMedia("(display-mode: fullscreen)").matches
      || navigator.standalone === true;
  }

  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var deferred = null;

  function el(tag, className, html) {
    var node = D.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  if ("serviceWorker" in navigator) {
    W.__denHadCtl = !!navigator.serviceWorker.controller;
    addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(function (reg) {
        function prompt(worker) {
          if (!worker || !navigator.serviceWorker.controller || D.getElementById("den-upd")) return;
          var toast = el(
            "div",
            "den-pwa",
            '<div class="den-upd-t"><b class="den-upd-v">Version</b><small>Ready when you are.</small></div><button class="den-upd-b" type="button">Update</button><button class="den-upd-x" type="button" aria-label="Dismiss">×</button>',
          );
          toast.id = "den-upd";
          toast.setAttribute("role", "status");
          D.body.appendChild(toast);
          fetch("/sw.js", { cache: "no-store" }).then(function (response) {
            return response.text();
          }).then(function (source) {
            var match = /VERSION\s*=\s*['"]([\d.]+)['"]/.exec(source);
            var label = toast.querySelector(".den-upd-v");
            if (match && label) label.textContent = "Version " + match[1];
          }).catch(function () {});
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { toast.classList.add("on"); });
          });
          toast.querySelector(".den-upd-b").onclick = function () {
            worker.postMessage({ type: "SKIP_WAITING" });
          };
          toast.querySelector(".den-upd-x").onclick = function () {
            toast.classList.remove("on");
            setTimeout(function () { toast.remove(); }, 350);
          };
        }

        if (reg.waiting) prompt(reg.waiting);
        reg.addEventListener("updatefound", function () {
          var installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", function () {
            if (installing.state === "installed") prompt(installing);
          });
        });
        setInterval(function () { reg.update().catch(function () {}); }, 3600e3);
        D.addEventListener("visibilitychange", function () {
          if (!D.hidden) reg.update().catch(function () {});
        });
      }).catch(function () {});

      var reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (reloaded || !W.__denHadCtl) return;
        reloaded = true;
        location.reload();
      });
    });
  }

  addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    sync();
  });

  addEventListener("appinstalled", function () {
    deferred = null;
    ls("den_installed", "1");
    sync();
    var banner = D.getElementById("den-install");
    if (banner) banner.remove();
  });

  function signedIn() {
    return !!D.querySelector("[data-den-app]");
  }

  function state() {
    if (standalone()) return "installed";
    if (deferred) return "prompt";
    if (isIOS) return "ios";
    return "none";
  }

  function iosSheet() {
    var sheet = D.getElementById("den-ios");
    if (!sheet) {
      sheet = el(
        "div",
        "den-pwa",
        '<div class="den-sheet" role="dialog" aria-modal="true" aria-label="Add Den to your home screen"><img src="/icons/icon-192.png" width="64" height="64" alt=""><h3>Add Den to your home screen</h3><p>It opens full screen, like an app.</p><ol><li><i>1</i><span>Tap <b>Share</b> <svg viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg></span></li><li><i>2</i><span>Tap <b>Add to Home Screen</b></span></li><li><i>3</i><span>Tap <b>Add</b></span></li></ol><button class="den-install-b" type="button">Got it</button></div>',
      );
      sheet.id = "den-ios";
      D.body.appendChild(sheet);
      sheet.onclick = function (event) {
        if (event.target === sheet || event.target.classList.contains("den-install-b")) sheet.classList.remove("on");
      };
    }
    requestAnimationFrame(function () { sheet.classList.add("on"); });
  }

  function install() {
    var current = state();
    if (current === "prompt" && deferred) {
      var prompt = deferred;
      deferred = null;
      prompt.prompt();
      return prompt.userChoice.then(function () { sync(); });
    }
    if (current === "ios") iosSheet();
    return Promise.resolve();
  }

  function banner() {
    var current = state();
    var bar = D.getElementById("den-install");
    if (!signedIn() || current === "installed" || current === "none" || ls("den_install_dismissed")) {
      if (bar) bar.remove();
      return;
    }
    if (bar) return;
    var hint = current === "ios" ? "Share, then Add to Home Screen." : "Opens full screen, from your home screen.";
    var label = current === "ios" ? "Show me" : "Install";
    bar = el(
      "div",
      "den-pwa",
      '<img src="/icons/icon-192.png" alt="" width="44" height="44"><div class="den-install-t"><b>Add Den to your home screen</b><span>' + hint + "</span></div><button class=\"den-install-b\" type=\"button\">" + label + '</button><button class="den-install-x" type="button" aria-label="Not now">×</button>',
    );
    bar.id = "den-install";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Install app");
    bar.querySelector(".den-install-b").onclick = function () { install(); };
    bar.querySelector(".den-install-x").onclick = function () {
      ls("den_install_dismissed", "1");
      bar.classList.remove("on");
      setTimeout(function () { bar.remove(); }, 350);
    };
    D.body.appendChild(bar);
    setTimeout(function () { bar.classList.add("on"); }, 40);
  }

  function sync() { banner(); }

  function boot() {
    setTimeout(banner, 500);
    new MutationObserver(function () { banner(); }).observe(D.documentElement, { childList: true, subtree: true });
  }

  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
