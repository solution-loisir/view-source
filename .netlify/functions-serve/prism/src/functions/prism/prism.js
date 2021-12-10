// functions/prism/prism.js
var _self = typeof window != "undefined" ? window : typeof WorkerGlobalScope != "undefined" && self instanceof WorkerGlobalScope ? self : {};
var Prism = function(u) {
  var t = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, n = 0, e = {}, M = { manual: u.Prism && u.Prism.manual, disableWorkerMessageHandler: u.Prism && u.Prism.disableWorkerMessageHandler, util: { encode: function e2(n2) {
    return n2 instanceof W ? new W(n2.type, e2(n2.content), n2.alias) : Array.isArray(n2) ? n2.map(e2) : n2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
  }, type: function(e2) {
    return Object.prototype.toString.call(e2).slice(8, -1);
  }, objId: function(e2) {
    return e2.__id || Object.defineProperty(e2, "__id", { value: ++n }), e2.__id;
  }, clone: function t2(e2, r2) {
    var a2, n2;
    switch (r2 = r2 || {}, M.util.type(e2)) {
      case "Object":
        if (n2 = M.util.objId(e2), r2[n2])
          return r2[n2];
        for (var i2 in a2 = {}, r2[n2] = a2, e2)
          e2.hasOwnProperty(i2) && (a2[i2] = t2(e2[i2], r2));
        return a2;
      case "Array":
        return n2 = M.util.objId(e2), r2[n2] ? r2[n2] : (a2 = [], r2[n2] = a2, e2.forEach(function(e3, n3) {
          a2[n3] = t2(e3, r2);
        }), a2);
      default:
        return e2;
    }
  }, getLanguage: function(e2) {
    for (; e2; ) {
      var n2 = t.exec(e2.className);
      if (n2)
        return n2[1].toLowerCase();
      e2 = e2.parentElement;
    }
    return "none";
  }, setLanguage: function(e2, n2) {
    e2.className = e2.className.replace(RegExp(t, "gi"), ""), e2.classList.add("language-" + n2);
  }, currentScript: function() {
    if (typeof document == "undefined")
      return null;
    if ("currentScript" in document)
      return document.currentScript;
    try {
      throw new Error();
    } catch (e2) {
      var n2 = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(e2.stack) || [])[1];
      if (n2) {
        var t2 = document.getElementsByTagName("script");
        for (var r2 in t2)
          if (t2[r2].src == n2)
            return t2[r2];
      }
      return null;
    }
  }, isActive: function(e2, n2, t2) {
    for (var r2 = "no-" + n2; e2; ) {
      var a2 = e2.classList;
      if (a2.contains(n2))
        return true;
      if (a2.contains(r2))
        return false;
      e2 = e2.parentElement;
    }
    return !!t2;
  } }, languages: { plain: e, plaintext: e, text: e, txt: e, extend: function(e2, n2) {
    var t2 = M.util.clone(M.languages[e2]);
    for (var r2 in n2)
      t2[r2] = n2[r2];
    return t2;
  }, insertBefore: function(t2, e2, n2, r2) {
    var a2 = (r2 = r2 || M.languages)[t2], i2 = {};
    for (var l2 in a2)
      if (a2.hasOwnProperty(l2)) {
        if (l2 == e2)
          for (var o in n2)
            n2.hasOwnProperty(o) && (i2[o] = n2[o]);
        n2.hasOwnProperty(l2) || (i2[l2] = a2[l2]);
      }
    var s = r2[t2];
    return r2[t2] = i2, M.languages.DFS(M.languages, function(e3, n3) {
      n3 === s && e3 != t2 && (this[e3] = i2);
    }), i2;
  }, DFS: function e2(n2, t2, r2, a2) {
    a2 = a2 || {};
    var i2 = M.util.objId;
    for (var l2 in n2)
      if (n2.hasOwnProperty(l2)) {
        t2.call(n2, l2, n2[l2], r2 || l2);
        var o = n2[l2], s = M.util.type(o);
        s !== "Object" || a2[i2(o)] ? s !== "Array" || a2[i2(o)] || (a2[i2(o)] = true, e2(o, t2, l2, a2)) : (a2[i2(o)] = true, e2(o, t2, null, a2));
      }
  } }, plugins: {}, highlightAll: function(e2, n2) {
    M.highlightAllUnder(document, e2, n2);
  }, highlightAllUnder: function(e2, n2, t2) {
    var r2 = { callback: t2, container: e2, selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code' };
    M.hooks.run("before-highlightall", r2), r2.elements = Array.prototype.slice.apply(r2.container.querySelectorAll(r2.selector)), M.hooks.run("before-all-elements-highlight", r2);
    for (var a2, i2 = 0; a2 = r2.elements[i2++]; )
      M.highlightElement(a2, n2 === true, r2.callback);
  }, highlightElement: function(e2, n2, t2) {
    var r2 = M.util.getLanguage(e2), a2 = M.languages[r2];
    M.util.setLanguage(e2, r2);
    var i2 = e2.parentElement;
    i2 && i2.nodeName.toLowerCase() === "pre" && M.util.setLanguage(i2, r2);
    var l2 = { element: e2, language: r2, grammar: a2, code: e2.textContent };
    function o(e3) {
      l2.highlightedCode = e3, M.hooks.run("before-insert", l2), l2.element.innerHTML = l2.highlightedCode, M.hooks.run("after-highlight", l2), M.hooks.run("complete", l2), t2 && t2.call(l2.element);
    }
    if (M.hooks.run("before-sanity-check", l2), (i2 = l2.element.parentElement) && i2.nodeName.toLowerCase() === "pre" && !i2.hasAttribute("tabindex") && i2.setAttribute("tabindex", "0"), !l2.code)
      return M.hooks.run("complete", l2), void (t2 && t2.call(l2.element));
    if (M.hooks.run("before-highlight", l2), l2.grammar)
      if (n2 && u.Worker) {
        var s = new Worker(M.filename);
        s.onmessage = function(e3) {
          o(e3.data);
        }, s.postMessage(JSON.stringify({ language: l2.language, code: l2.code, immediateClose: true }));
      } else
        o(M.highlight(l2.code, l2.grammar, l2.language));
    else
      o(M.util.encode(l2.code));
  }, highlight: function(e2, n2, t2) {
    var r2 = { code: e2, grammar: n2, language: t2 };
    return M.hooks.run("before-tokenize", r2), r2.tokens = M.tokenize(r2.code, r2.grammar), M.hooks.run("after-tokenize", r2), W.stringify(M.util.encode(r2.tokens), r2.language);
  }, tokenize: function(e2, n2) {
    var t2 = n2.rest;
    if (t2) {
      for (var r2 in t2)
        n2[r2] = t2[r2];
      delete n2.rest;
    }
    var a2 = new i();
    return I(a2, a2.head, e2), function e3(n3, t3, r3, a3, i2, l2) {
      for (var o in r3)
        if (r3.hasOwnProperty(o) && r3[o]) {
          var s = r3[o];
          s = Array.isArray(s) ? s : [s];
          for (var u2 = 0; u2 < s.length; ++u2) {
            if (l2 && l2.cause == o + "," + u2)
              return;
            var c = s[u2], g = c.inside, f = !!c.lookbehind, h = !!c.greedy, d = c.alias;
            if (h && !c.pattern.global) {
              var v = c.pattern.toString().match(/[imsuy]*$/)[0];
              c.pattern = RegExp(c.pattern.source, v + "g");
            }
            for (var p = c.pattern || c, m = a3.next, y = i2; m !== t3.tail && !(l2 && y >= l2.reach); y += m.value.length, m = m.next) {
              var k = m.value;
              if (t3.length > n3.length)
                return;
              if (!(k instanceof W)) {
                var x, b = 1;
                if (h) {
                  if (!(x = z(p, y, n3, f)) || x.index >= n3.length)
                    break;
                  var w = x.index, A = x.index + x[0].length, P = y;
                  for (P += m.value.length; P <= w; )
                    m = m.next, P += m.value.length;
                  if (P -= m.value.length, y = P, m.value instanceof W)
                    continue;
                  for (var E = m; E !== t3.tail && (P < A || typeof E.value == "string"); E = E.next)
                    b++, P += E.value.length;
                  b--, k = n3.slice(y, P), x.index -= y;
                } else if (!(x = z(p, 0, k, f)))
                  continue;
                var w = x.index, L = x[0], S = k.slice(0, w), O = k.slice(w + L.length), j = y + k.length;
                l2 && j > l2.reach && (l2.reach = j);
                var C = m.prev;
                S && (C = I(t3, C, S), y += S.length), q(t3, C, b);
                var N = new W(o, g ? M.tokenize(L, g) : L, d, L);
                if (m = I(t3, C, N), O && I(t3, m, O), 1 < b) {
                  var _ = { cause: o + "," + u2, reach: j };
                  e3(n3, t3, r3, m.prev, y, _), l2 && _.reach > l2.reach && (l2.reach = _.reach);
                }
              }
            }
          }
        }
    }(e2, a2, n2, a2.head, 0), function(e3) {
      var n3 = [], t3 = e3.head.next;
      for (; t3 !== e3.tail; )
        n3.push(t3.value), t3 = t3.next;
      return n3;
    }(a2);
  }, hooks: { all: {}, add: function(e2, n2) {
    var t2 = M.hooks.all;
    t2[e2] = t2[e2] || [], t2[e2].push(n2);
  }, run: function(e2, n2) {
    var t2 = M.hooks.all[e2];
    if (t2 && t2.length)
      for (var r2, a2 = 0; r2 = t2[a2++]; )
        r2(n2);
  } }, Token: W };
  function W(e2, n2, t2, r2) {
    this.type = e2, this.content = n2, this.alias = t2, this.length = 0 | (r2 || "").length;
  }
  function z(e2, n2, t2, r2) {
    e2.lastIndex = n2;
    var a2 = e2.exec(t2);
    if (a2 && r2 && a2[1]) {
      var i2 = a2[1].length;
      a2.index += i2, a2[0] = a2[0].slice(i2);
    }
    return a2;
  }
  function i() {
    var e2 = { value: null, prev: null, next: null }, n2 = { value: null, prev: e2, next: null };
    e2.next = n2, this.head = e2, this.tail = n2, this.length = 0;
  }
  function I(e2, n2, t2) {
    var r2 = n2.next, a2 = { value: t2, prev: n2, next: r2 };
    return n2.next = a2, r2.prev = a2, e2.length++, a2;
  }
  function q(e2, n2, t2) {
    for (var r2 = n2.next, a2 = 0; a2 < t2 && r2 !== e2.tail; a2++)
      r2 = r2.next;
    (n2.next = r2).prev = n2, e2.length -= a2;
  }
  if (u.Prism = M, W.stringify = function n2(e2, t2) {
    if (typeof e2 == "string")
      return e2;
    if (Array.isArray(e2)) {
      var r2 = "";
      return e2.forEach(function(e3) {
        r2 += n2(e3, t2);
      }), r2;
    }
    var a2 = { type: e2.type, content: n2(e2.content, t2), tag: "span", classes: ["token", e2.type], attributes: {}, language: t2 }, i2 = e2.alias;
    i2 && (Array.isArray(i2) ? Array.prototype.push.apply(a2.classes, i2) : a2.classes.push(i2)), M.hooks.run("wrap", a2);
    var l2 = "";
    for (var o in a2.attributes)
      l2 += " " + o + '="' + (a2.attributes[o] || "").replace(/"/g, "&quot;") + '"';
    return "<" + a2.tag + ' class="' + a2.classes.join(" ") + '"' + l2 + ">" + a2.content + "</" + a2.tag + ">";
  }, !u.document)
    return u.addEventListener && (M.disableWorkerMessageHandler || u.addEventListener("message", function(e2) {
      var n2 = JSON.parse(e2.data), t2 = n2.language, r2 = n2.code, a2 = n2.immediateClose;
      u.postMessage(M.highlight(r2, M.languages[t2], t2)), a2 && u.close();
    }, false)), M;
  var r = M.util.currentScript();
  function a() {
    M.manual || M.highlightAll();
  }
  if (r && (M.filename = r.src, r.hasAttribute("data-manual") && (M.manual = true)), !M.manual) {
    var l = document.readyState;
    l === "loading" || l === "interactive" && r && r.defer ? document.addEventListener("DOMContentLoaded", a) : window.requestAnimationFrame ? window.requestAnimationFrame(a) : window.setTimeout(a, 16);
  }
  return M;
}(_self);
typeof module != "undefined" && module.exports && (module.exports = Prism), typeof global != "undefined" && (global.Prism = Prism);
Prism.languages.markup = { comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: true }, prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: true }, doctype: { pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i, greedy: true, inside: { "internal-subset": { pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/, lookbehind: true, greedy: true, inside: null }, string: { pattern: /"[^"]*"|'[^']*'/, greedy: true }, punctuation: /^<!|>$|[[\]]/, "doctype-tag": /^DOCTYPE/i, name: /[^\s<>'"]+/ } }, cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: true }, tag: { pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/, greedy: true, inside: { tag: { pattern: /^<\/?[^\s>\/]+/, inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ } }, "special-attr": [], "attr-value": { pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/, inside: { punctuation: [{ pattern: /^=/, alias: "attr-equals" }, /"|'/] } }, punctuation: /\/?>/, "attr-name": { pattern: /[^\s>\/]+/, inside: { namespace: /^[^\s>\/:]+:/ } } } }, entity: [{ pattern: /&[\da-z]{1,8};/i, alias: "named-entity" }, /&#x?[\da-f]{1,8};/i] }, Prism.languages.markup.tag.inside["attr-value"].inside.entity = Prism.languages.markup.entity, Prism.languages.markup.doctype.inside["internal-subset"].inside = Prism.languages.markup, Prism.hooks.add("wrap", function(a) {
  a.type === "entity" && (a.attributes.title = a.content.replace(/&amp;/, "&"));
}), Object.defineProperty(Prism.languages.markup.tag, "addInlined", { value: function(a, e) {
  var s = {};
  s["language-" + e] = { pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i, lookbehind: true, inside: Prism.languages[e] }, s.cdata = /^<!\[CDATA\[|\]\]>$/i;
  var t = { "included-cdata": { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: s } };
  t["language-" + e] = { pattern: /[\s\S]+/, inside: Prism.languages[e] };
  var n = {};
  n[a] = { pattern: RegExp("(<__[^>]*>)(?:<!\\[CDATA\\[(?:[^\\]]|\\](?!\\]>))*\\]\\]>|(?!<!\\[CDATA\\[)[^])*?(?=</__>)".replace(/__/g, function() {
    return a;
  }), "i"), lookbehind: true, greedy: true, inside: t }, Prism.languages.insertBefore("markup", "cdata", n);
} }), Object.defineProperty(Prism.languages.markup.tag, "addAttribute", { value: function(a, e) {
  Prism.languages.markup.tag.inside["special-attr"].push({ pattern: RegExp(`(^|["'\\s])(?:` + a + `)\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s'">=]+(?=[\\s>]))`, "i"), lookbehind: true, inside: { "attr-name": /^[^\s=]+/, "attr-value": { pattern: /=[\s\S]+/, inside: { value: { pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/, lookbehind: true, alias: [e, "language-" + e], inside: Prism.languages[e] }, punctuation: [{ pattern: /^=/, alias: "attr-equals" }, /"|'/] } } } });
} }), Prism.languages.html = Prism.languages.markup, Prism.languages.mathml = Prism.languages.markup, Prism.languages.svg = Prism.languages.markup, Prism.languages.xml = Prism.languages.extend("markup", {}), Prism.languages.ssml = Prism.languages.xml, Prism.languages.atom = Prism.languages.xml, Prism.languages.rss = Prism.languages.xml;
!function(s) {
  var e = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
  s.languages.css = { comment: /\/\*[\s\S]*?\*\//, atrule: { pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/, inside: { rule: /^@[\w-]+/, "selector-function-argument": { pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/, lookbehind: true, alias: "selector" }, keyword: { pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/, lookbehind: true } } }, url: { pattern: RegExp("\\burl\\((?:" + e.source + `|(?:[^\\\\\r
()"']|\\\\[^])*)\\)`, "i"), greedy: true, inside: { function: /^url/i, punctuation: /^\(|\)$/, string: { pattern: RegExp("^" + e.source + "$"), alias: "url" } } }, selector: { pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + e.source + ")*(?=\\s*\\{)"), lookbehind: true }, string: { pattern: e, greedy: true }, property: { pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i, lookbehind: true }, important: /!important\b/i, function: { pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i, lookbehind: true }, punctuation: /[(){};:,]/ }, s.languages.css.atrule.inside.rest = s.languages.css;
  var t = s.languages.markup;
  t && (t.tag.addInlined("style", "css"), t.tag.addAttribute("style", "css"));
}(Prism);
Prism.languages.clike = { comment: [{ pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true }], string: { pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: true }, "class-name": { pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i, lookbehind: true, inside: { punctuation: /[.\\]/ } }, keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/, boolean: /\b(?:false|true)\b/, function: /\b\w+(?=\()/, number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i, operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/, punctuation: /[{}[\];(),.:]/ };
Prism.languages.javascript = Prism.languages.extend("clike", { "class-name": [Prism.languages.clike["class-name"], { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/, lookbehind: true }], keyword: [{ pattern: /((?:^|\})\s*)catch\b/, lookbehind: true }, { pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/, lookbehind: true }], function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/, number: { pattern: RegExp("(^|[^\\w$])(?:NaN|Infinity|0[bB][01]+(?:_[01]+)*n?|0[oO][0-7]+(?:_[0-7]+)*n?|0[xX][\\dA-Fa-f]+(?:_[\\dA-Fa-f]+)*n?|\\d+(?:_\\d+)*n|(?:\\d+(?:_\\d+)*(?:\\.(?:\\d+(?:_\\d+)*)?)?|\\.\\d+(?:_\\d+)*)(?:[Ee][+-]?\\d+(?:_\\d+)*)?)(?![\\w$])"), lookbehind: true }, operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/ }), Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/, Prism.languages.insertBefore("javascript", "keyword", { regex: { pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/, lookbehind: true, greedy: true, inside: { "regex-source": { pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/, lookbehind: true, alias: "language-regex", inside: Prism.languages.regex }, "regex-delimiter": /^\/|\/$/, "regex-flags": /^[a-z]+$/ } }, "function-variable": { pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/, alias: "function" }, parameter: [{ pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/, lookbehind: true, inside: Prism.languages.javascript }], constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/ }), Prism.languages.insertBefore("javascript", "string", { hashbang: { pattern: /^#!.*/, greedy: true, alias: "comment" }, "template-string": { pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/, greedy: true, inside: { "template-punctuation": { pattern: /^`|`$/, alias: "string" }, interpolation: { pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/, lookbehind: true, inside: { "interpolation-punctuation": { pattern: /^\$\{|\}$/, alias: "punctuation" }, rest: Prism.languages.javascript } }, string: /[\s\S]+/ } }, "string-property": { pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m, lookbehind: true, greedy: true, alias: "property" } }), Prism.languages.insertBefore("javascript", "operator", { "literal-property": { pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m, lookbehind: true, alias: "property" } }), Prism.languages.markup && (Prism.languages.markup.tag.addInlined("script", "javascript"), Prism.languages.markup.tag.addAttribute("on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)", "javascript")), Prism.languages.js = Prism.languages.javascript;
//# sourceMappingURL=prism.js.map
