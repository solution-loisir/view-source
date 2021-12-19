var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/node-fetch/lib/index.js
var require_lib = __commonJS({
  "node_modules/node-fetch/lib/index.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var Stream = _interopDefault(require("stream"));
    var http = _interopDefault(require("http"));
    var Url = _interopDefault(require("url"));
    var https = _interopDefault(require("https"));
    var zlib = _interopDefault(require("zlib"));
    var Readable = Stream.Readable;
    var BUFFER = Symbol("buffer");
    var TYPE = Symbol("type");
    var Blob = class {
      constructor() {
        this[TYPE] = "";
        const blobParts = arguments[0];
        const options = arguments[1];
        const buffers = [];
        let size = 0;
        if (blobParts) {
          const a = blobParts;
          const length = Number(a.length);
          for (let i = 0; i < length; i++) {
            const element = a[i];
            let buffer;
            if (element instanceof Buffer) {
              buffer = element;
            } else if (ArrayBuffer.isView(element)) {
              buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
            } else if (element instanceof ArrayBuffer) {
              buffer = Buffer.from(element);
            } else if (element instanceof Blob) {
              buffer = element[BUFFER];
            } else {
              buffer = Buffer.from(typeof element === "string" ? element : String(element));
            }
            size += buffer.length;
            buffers.push(buffer);
          }
        }
        this[BUFFER] = Buffer.concat(buffers);
        let type = options && options.type !== void 0 && String(options.type).toLowerCase();
        if (type && !/[^\u0020-\u007E]/.test(type)) {
          this[TYPE] = type;
        }
      }
      get size() {
        return this[BUFFER].length;
      }
      get type() {
        return this[TYPE];
      }
      text() {
        return Promise.resolve(this[BUFFER].toString());
      }
      arrayBuffer() {
        const buf = this[BUFFER];
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        return Promise.resolve(ab);
      }
      stream() {
        const readable = new Readable();
        readable._read = function() {
        };
        readable.push(this[BUFFER]);
        readable.push(null);
        return readable;
      }
      toString() {
        return "[object Blob]";
      }
      slice() {
        const size = this.size;
        const start = arguments[0];
        const end = arguments[1];
        let relativeStart, relativeEnd;
        if (start === void 0) {
          relativeStart = 0;
        } else if (start < 0) {
          relativeStart = Math.max(size + start, 0);
        } else {
          relativeStart = Math.min(start, size);
        }
        if (end === void 0) {
          relativeEnd = size;
        } else if (end < 0) {
          relativeEnd = Math.max(size + end, 0);
        } else {
          relativeEnd = Math.min(end, size);
        }
        const span = Math.max(relativeEnd - relativeStart, 0);
        const buffer = this[BUFFER];
        const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
        const blob = new Blob([], { type: arguments[2] });
        blob[BUFFER] = slicedBuffer;
        return blob;
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
      value: "Blob",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function FetchError(message, type, systemError) {
      Error.call(this, message);
      this.message = message;
      this.type = type;
      if (systemError) {
        this.code = this.errno = systemError.code;
      }
      Error.captureStackTrace(this, this.constructor);
    }
    FetchError.prototype = Object.create(Error.prototype);
    FetchError.prototype.constructor = FetchError;
    FetchError.prototype.name = "FetchError";
    var convert;
    try {
      convert = require("encoding").convert;
    } catch (e) {
    }
    var INTERNALS = Symbol("Body internals");
    var PassThrough = Stream.PassThrough;
    function Body(body) {
      var _this = this;
      var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$size = _ref.size;
      let size = _ref$size === void 0 ? 0 : _ref$size;
      var _ref$timeout = _ref.timeout;
      let timeout = _ref$timeout === void 0 ? 0 : _ref$timeout;
      if (body == null) {
        body = null;
      } else if (isURLSearchParams(body)) {
        body = Buffer.from(body.toString());
      } else if (isBlob(body))
        ;
      else if (Buffer.isBuffer(body))
        ;
      else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        body = Buffer.from(body);
      } else if (ArrayBuffer.isView(body)) {
        body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
      } else if (body instanceof Stream)
        ;
      else {
        body = Buffer.from(String(body));
      }
      this[INTERNALS] = {
        body,
        disturbed: false,
        error: null
      };
      this.size = size;
      this.timeout = timeout;
      if (body instanceof Stream) {
        body.on("error", function(err) {
          const error = err.name === "AbortError" ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, "system", err);
          _this[INTERNALS].error = error;
        });
      }
    }
    Body.prototype = {
      get body() {
        return this[INTERNALS].body;
      },
      get bodyUsed() {
        return this[INTERNALS].disturbed;
      },
      arrayBuffer() {
        return consumeBody.call(this).then(function(buf) {
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        });
      },
      blob() {
        let ct = this.headers && this.headers.get("content-type") || "";
        return consumeBody.call(this).then(function(buf) {
          return Object.assign(new Blob([], {
            type: ct.toLowerCase()
          }), {
            [BUFFER]: buf
          });
        });
      },
      json() {
        var _this2 = this;
        return consumeBody.call(this).then(function(buffer) {
          try {
            return JSON.parse(buffer.toString());
          } catch (err) {
            return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, "invalid-json"));
          }
        });
      },
      text() {
        return consumeBody.call(this).then(function(buffer) {
          return buffer.toString();
        });
      },
      buffer() {
        return consumeBody.call(this);
      },
      textConverted() {
        var _this3 = this;
        return consumeBody.call(this).then(function(buffer) {
          return convertBody(buffer, _this3.headers);
        });
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    Body.mixIn = function(proto) {
      for (const name of Object.getOwnPropertyNames(Body.prototype)) {
        if (!(name in proto)) {
          const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
          Object.defineProperty(proto, name, desc);
        }
      }
    };
    function consumeBody() {
      var _this4 = this;
      if (this[INTERNALS].disturbed) {
        return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
      }
      this[INTERNALS].disturbed = true;
      if (this[INTERNALS].error) {
        return Body.Promise.reject(this[INTERNALS].error);
      }
      let body = this.body;
      if (body === null) {
        return Body.Promise.resolve(Buffer.alloc(0));
      }
      if (isBlob(body)) {
        body = body.stream();
      }
      if (Buffer.isBuffer(body)) {
        return Body.Promise.resolve(body);
      }
      if (!(body instanceof Stream)) {
        return Body.Promise.resolve(Buffer.alloc(0));
      }
      let accum = [];
      let accumBytes = 0;
      let abort = false;
      return new Body.Promise(function(resolve, reject) {
        let resTimeout;
        if (_this4.timeout) {
          resTimeout = setTimeout(function() {
            abort = true;
            reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, "body-timeout"));
          }, _this4.timeout);
        }
        body.on("error", function(err) {
          if (err.name === "AbortError") {
            abort = true;
            reject(err);
          } else {
            reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, "system", err));
          }
        });
        body.on("data", function(chunk) {
          if (abort || chunk === null) {
            return;
          }
          if (_this4.size && accumBytes + chunk.length > _this4.size) {
            abort = true;
            reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, "max-size"));
            return;
          }
          accumBytes += chunk.length;
          accum.push(chunk);
        });
        body.on("end", function() {
          if (abort) {
            return;
          }
          clearTimeout(resTimeout);
          try {
            resolve(Buffer.concat(accum, accumBytes));
          } catch (err) {
            reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, "system", err));
          }
        });
      });
    }
    function convertBody(buffer, headers) {
      if (typeof convert !== "function") {
        throw new Error("The package `encoding` must be installed to use the textConverted() function");
      }
      const ct = headers.get("content-type");
      let charset = "utf-8";
      let res, str;
      if (ct) {
        res = /charset=([^;]*)/i.exec(ct);
      }
      str = buffer.slice(0, 1024).toString();
      if (!res && str) {
        res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
      }
      if (!res && str) {
        res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
        if (!res) {
          res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
          if (res) {
            res.pop();
          }
        }
        if (res) {
          res = /charset=(.*)/i.exec(res.pop());
        }
      }
      if (!res && str) {
        res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
      }
      if (res) {
        charset = res.pop();
        if (charset === "gb2312" || charset === "gbk") {
          charset = "gb18030";
        }
      }
      return convert(buffer, "UTF-8", charset).toString();
    }
    function isURLSearchParams(obj) {
      if (typeof obj !== "object" || typeof obj.append !== "function" || typeof obj.delete !== "function" || typeof obj.get !== "function" || typeof obj.getAll !== "function" || typeof obj.has !== "function" || typeof obj.set !== "function") {
        return false;
      }
      return obj.constructor.name === "URLSearchParams" || Object.prototype.toString.call(obj) === "[object URLSearchParams]" || typeof obj.sort === "function";
    }
    function isBlob(obj) {
      return typeof obj === "object" && typeof obj.arrayBuffer === "function" && typeof obj.type === "string" && typeof obj.stream === "function" && typeof obj.constructor === "function" && typeof obj.constructor.name === "string" && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
    }
    function clone(instance) {
      let p1, p2;
      let body = instance.body;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof Stream && typeof body.getBoundary !== "function") {
        p1 = new PassThrough();
        p2 = new PassThrough();
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS].body = p1;
        body = p2;
      }
      return body;
    }
    function extractContentType(body) {
      if (body === null) {
        return null;
      } else if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      } else if (isURLSearchParams(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      } else if (isBlob(body)) {
        return body.type || null;
      } else if (Buffer.isBuffer(body)) {
        return null;
      } else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        return null;
      } else if (ArrayBuffer.isView(body)) {
        return null;
      } else if (typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      } else if (body instanceof Stream) {
        return null;
      } else {
        return "text/plain;charset=UTF-8";
      }
    }
    function getTotalBytes(instance) {
      const body = instance.body;
      if (body === null) {
        return 0;
      } else if (isBlob(body)) {
        return body.size;
      } else if (Buffer.isBuffer(body)) {
        return body.length;
      } else if (body && typeof body.getLengthSync === "function") {
        if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || body.hasKnownLength && body.hasKnownLength()) {
          return body.getLengthSync();
        }
        return null;
      } else {
        return null;
      }
    }
    function writeToStream(dest, instance) {
      const body = instance.body;
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    }
    Body.Promise = global.Promise;
    var invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
    var invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
    function validateName(name) {
      name = `${name}`;
      if (invalidTokenRegex.test(name) || name === "") {
        throw new TypeError(`${name} is not a legal HTTP header name`);
      }
    }
    function validateValue(value) {
      value = `${value}`;
      if (invalidHeaderCharRegex.test(value)) {
        throw new TypeError(`${value} is not a legal HTTP header value`);
      }
    }
    function find(map, name) {
      name = name.toLowerCase();
      for (const key in map) {
        if (key.toLowerCase() === name) {
          return key;
        }
      }
      return void 0;
    }
    var MAP = Symbol("map");
    var Headers = class {
      constructor() {
        let init = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        this[MAP] = Object.create(null);
        if (init instanceof Headers) {
          const rawHeaders = init.raw();
          const headerNames = Object.keys(rawHeaders);
          for (const headerName of headerNames) {
            for (const value of rawHeaders[headerName]) {
              this.append(headerName, value);
            }
          }
          return;
        }
        if (init == null)
          ;
        else if (typeof init === "object") {
          const method = init[Symbol.iterator];
          if (method != null) {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            const pairs = [];
            for (const pair of init) {
              if (typeof pair !== "object" || typeof pair[Symbol.iterator] !== "function") {
                throw new TypeError("Each header pair must be iterable");
              }
              pairs.push(Array.from(pair));
            }
            for (const pair of pairs) {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              this.append(pair[0], pair[1]);
            }
          } else {
            for (const key of Object.keys(init)) {
              const value = init[key];
              this.append(key, value);
            }
          }
        } else {
          throw new TypeError("Provided initializer must be an object");
        }
      }
      get(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key === void 0) {
          return null;
        }
        return this[MAP][key].join(", ");
      }
      forEach(callback) {
        let thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
        let pairs = getHeaders(this);
        let i = 0;
        while (i < pairs.length) {
          var _pairs$i = pairs[i];
          const name = _pairs$i[0], value = _pairs$i[1];
          callback.call(thisArg, value, name, this);
          pairs = getHeaders(this);
          i++;
        }
      }
      set(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        this[MAP][key !== void 0 ? key : name] = [value];
      }
      append(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          this[MAP][key].push(value);
        } else {
          this[MAP][name] = [value];
        }
      }
      has(name) {
        name = `${name}`;
        validateName(name);
        return find(this[MAP], name) !== void 0;
      }
      delete(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          delete this[MAP][key];
        }
      }
      raw() {
        return this[MAP];
      }
      keys() {
        return createHeadersIterator(this, "key");
      }
      values() {
        return createHeadersIterator(this, "value");
      }
      [Symbol.iterator]() {
        return createHeadersIterator(this, "key+value");
      }
    };
    Headers.prototype.entries = Headers.prototype[Symbol.iterator];
    Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
      value: "Headers",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Headers.prototype, {
      get: { enumerable: true },
      forEach: { enumerable: true },
      set: { enumerable: true },
      append: { enumerable: true },
      has: { enumerable: true },
      delete: { enumerable: true },
      keys: { enumerable: true },
      values: { enumerable: true },
      entries: { enumerable: true }
    });
    function getHeaders(headers) {
      let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
      const keys = Object.keys(headers[MAP]).sort();
      return keys.map(kind === "key" ? function(k) {
        return k.toLowerCase();
      } : kind === "value" ? function(k) {
        return headers[MAP][k].join(", ");
      } : function(k) {
        return [k.toLowerCase(), headers[MAP][k].join(", ")];
      });
    }
    var INTERNAL = Symbol("internal");
    function createHeadersIterator(target, kind) {
      const iterator = Object.create(HeadersIteratorPrototype);
      iterator[INTERNAL] = {
        target,
        kind,
        index: 0
      };
      return iterator;
    }
    var HeadersIteratorPrototype = Object.setPrototypeOf({
      next() {
        if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
          throw new TypeError("Value of `this` is not a HeadersIterator");
        }
        var _INTERNAL = this[INTERNAL];
        const target = _INTERNAL.target, kind = _INTERNAL.kind, index = _INTERNAL.index;
        const values = getHeaders(target, kind);
        const len = values.length;
        if (index >= len) {
          return {
            value: void 0,
            done: true
          };
        }
        this[INTERNAL].index = index + 1;
        return {
          value: values[index],
          done: false
        };
      }
    }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
    Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
      value: "HeadersIterator",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function exportNodeCompatibleHeaders(headers) {
      const obj = Object.assign({ __proto__: null }, headers[MAP]);
      const hostHeaderKey = find(headers[MAP], "Host");
      if (hostHeaderKey !== void 0) {
        obj[hostHeaderKey] = obj[hostHeaderKey][0];
      }
      return obj;
    }
    function createHeadersLenient(obj) {
      const headers = new Headers();
      for (const name of Object.keys(obj)) {
        if (invalidTokenRegex.test(name)) {
          continue;
        }
        if (Array.isArray(obj[name])) {
          for (const val of obj[name]) {
            if (invalidHeaderCharRegex.test(val)) {
              continue;
            }
            if (headers[MAP][name] === void 0) {
              headers[MAP][name] = [val];
            } else {
              headers[MAP][name].push(val);
            }
          }
        } else if (!invalidHeaderCharRegex.test(obj[name])) {
          headers[MAP][name] = [obj[name]];
        }
      }
      return headers;
    }
    var INTERNALS$1 = Symbol("Response internals");
    var STATUS_CODES = http.STATUS_CODES;
    var Response = class {
      constructor() {
        let body = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        let opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        Body.call(this, body, opts);
        const status = opts.status || 200;
        const headers = new Headers(opts.headers);
        if (body != null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: opts.url,
          status,
          statusText: opts.statusText || STATUS_CODES[status],
          headers,
          counter: opts.counter
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      clone() {
        return new Response(clone(this), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected
        });
      }
    };
    Body.mixIn(Response.prototype);
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    Object.defineProperty(Response.prototype, Symbol.toStringTag, {
      value: "Response",
      writable: false,
      enumerable: false,
      configurable: true
    });
    var INTERNALS$2 = Symbol("Request internals");
    var parse_url = Url.parse;
    var format_url = Url.format;
    var streamDestructionSupported = "destroy" in Stream.Readable.prototype;
    function isRequest(input) {
      return typeof input === "object" && typeof input[INTERNALS$2] === "object";
    }
    function isAbortSignal(signal) {
      const proto = signal && typeof signal === "object" && Object.getPrototypeOf(signal);
      return !!(proto && proto.constructor.name === "AbortSignal");
    }
    var Request = class {
      constructor(input) {
        let init = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        let parsedURL;
        if (!isRequest(input)) {
          if (input && input.href) {
            parsedURL = parse_url(input.href);
          } else {
            parsedURL = parse_url(`${input}`);
          }
          input = {};
        } else {
          parsedURL = parse_url(input.url);
        }
        let method = init.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init.body != null || isRequest(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
        Body.call(this, inputBody, {
          timeout: init.timeout || input.timeout || 0,
          size: init.size || input.size || 0
        });
        const headers = new Headers(init.headers || input.headers || {});
        if (inputBody != null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init)
          signal = init.signal;
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS$2] = {
          method,
          redirect: init.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init.follow !== void 0 ? init.follow : input.follow !== void 0 ? input.follow : 20;
        this.compress = init.compress !== void 0 ? init.compress : input.compress !== void 0 ? input.compress : true;
        this.counter = init.counter || input.counter || 0;
        this.agent = init.agent || input.agent;
      }
      get method() {
        return this[INTERNALS$2].method;
      }
      get url() {
        return format_url(this[INTERNALS$2].parsedURL);
      }
      get headers() {
        return this[INTERNALS$2].headers;
      }
      get redirect() {
        return this[INTERNALS$2].redirect;
      }
      get signal() {
        return this[INTERNALS$2].signal;
      }
      clone() {
        return new Request(this);
      }
    };
    Body.mixIn(Request.prototype);
    Object.defineProperty(Request.prototype, Symbol.toStringTag, {
      value: "Request",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    function getNodeRequestOptions(request) {
      const parsedURL = request[INTERNALS$2].parsedURL;
      const headers = new Headers(request[INTERNALS$2].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (!parsedURL.protocol || !parsedURL.hostname) {
        throw new TypeError("Only absolute URLs are supported");
      }
      if (!/^https?:$/.test(parsedURL.protocol)) {
        throw new TypeError("Only HTTP(S) protocols are supported");
      }
      if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
        throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
      }
      let contentLengthValue = null;
      if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body != null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number") {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate");
      }
      let agent = request.agent;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      return Object.assign({}, parsedURL, {
        method: request.method,
        headers: exportNodeCompatibleHeaders(headers),
        agent
      });
    }
    function AbortError(message) {
      Error.call(this, message);
      this.type = "aborted";
      this.message = message;
      Error.captureStackTrace(this, this.constructor);
    }
    AbortError.prototype = Object.create(Error.prototype);
    AbortError.prototype.constructor = AbortError;
    AbortError.prototype.name = "AbortError";
    var PassThrough$1 = Stream.PassThrough;
    var resolve_url = Url.resolve;
    function fetch2(url, opts) {
      if (!fetch2.Promise) {
        throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
      }
      Body.Promise = fetch2.Promise;
      return new fetch2.Promise(function(resolve, reject) {
        const request = new Request(url, opts);
        const options = getNodeRequestOptions(request);
        const send = (options.protocol === "https:" ? https : http).request;
        const signal = request.signal;
        let response = null;
        const abort = function abort2() {
          let error = new AbortError("The user aborted a request.");
          reject(error);
          if (request.body && request.body instanceof Stream.Readable) {
            request.body.destroy(error);
          }
          if (!response || !response.body)
            return;
          response.body.emit("error", error);
        };
        if (signal && signal.aborted) {
          abort();
          return;
        }
        const abortAndFinalize = function abortAndFinalize2() {
          abort();
          finalize();
        };
        const req = send(options);
        let reqTimeout;
        if (signal) {
          signal.addEventListener("abort", abortAndFinalize);
        }
        function finalize() {
          req.abort();
          if (signal)
            signal.removeEventListener("abort", abortAndFinalize);
          clearTimeout(reqTimeout);
        }
        if (request.timeout) {
          req.once("socket", function(socket) {
            reqTimeout = setTimeout(function() {
              reject(new FetchError(`network timeout at: ${request.url}`, "request-timeout"));
              finalize();
            }, request.timeout);
          });
        }
        req.on("error", function(err) {
          reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
          finalize();
        });
        req.on("response", function(res) {
          clearTimeout(reqTimeout);
          const headers = createHeadersLenient(res.headers);
          if (fetch2.isRedirect(res.statusCode)) {
            const location = headers.get("Location");
            const locationURL = location === null ? null : resolve_url(request.url, location);
            switch (request.redirect) {
              case "error":
                reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
                finalize();
                return;
              case "manual":
                if (locationURL !== null) {
                  try {
                    headers.set("Location", locationURL);
                  } catch (err) {
                    reject(err);
                  }
                }
                break;
              case "follow":
                if (locationURL === null) {
                  break;
                }
                if (request.counter >= request.follow) {
                  reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
                  finalize();
                  return;
                }
                const requestOpts = {
                  headers: new Headers(request.headers),
                  follow: request.follow,
                  counter: request.counter + 1,
                  agent: request.agent,
                  compress: request.compress,
                  method: request.method,
                  body: request.body,
                  signal: request.signal,
                  timeout: request.timeout,
                  size: request.size
                };
                if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
                  reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
                  finalize();
                  return;
                }
                if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === "POST") {
                  requestOpts.method = "GET";
                  requestOpts.body = void 0;
                  requestOpts.headers.delete("content-length");
                }
                resolve(fetch2(new Request(locationURL, requestOpts)));
                finalize();
                return;
            }
          }
          res.once("end", function() {
            if (signal)
              signal.removeEventListener("abort", abortAndFinalize);
          });
          let body = res.pipe(new PassThrough$1());
          const response_options = {
            url: request.url,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers,
            size: request.size,
            timeout: request.timeout,
            counter: request.counter
          };
          const codings = headers.get("Content-Encoding");
          if (!request.compress || request.method === "HEAD" || codings === null || res.statusCode === 204 || res.statusCode === 304) {
            response = new Response(body, response_options);
            resolve(response);
            return;
          }
          const zlibOptions = {
            flush: zlib.Z_SYNC_FLUSH,
            finishFlush: zlib.Z_SYNC_FLUSH
          };
          if (codings == "gzip" || codings == "x-gzip") {
            body = body.pipe(zlib.createGunzip(zlibOptions));
            response = new Response(body, response_options);
            resolve(response);
            return;
          }
          if (codings == "deflate" || codings == "x-deflate") {
            const raw = res.pipe(new PassThrough$1());
            raw.once("data", function(chunk) {
              if ((chunk[0] & 15) === 8) {
                body = body.pipe(zlib.createInflate());
              } else {
                body = body.pipe(zlib.createInflateRaw());
              }
              response = new Response(body, response_options);
              resolve(response);
            });
            return;
          }
          if (codings == "br" && typeof zlib.createBrotliDecompress === "function") {
            body = body.pipe(zlib.createBrotliDecompress());
            response = new Response(body, response_options);
            resolve(response);
            return;
          }
          response = new Response(body, response_options);
          resolve(response);
        });
        writeToStream(req, request);
      });
    }
    fetch2.isRedirect = function(code) {
      return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
    };
    fetch2.Promise = global.Promise;
    module2.exports = exports2 = fetch2;
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = exports2;
    exports2.Headers = Headers;
    exports2.Request = Request;
    exports2.Response = Response;
    exports2.FetchError = FetchError;
  }
});

// node_modules/cross-fetch/dist/node-ponyfill.js
var require_node_ponyfill = __commonJS({
  "node_modules/cross-fetch/dist/node-ponyfill.js"(exports2, module2) {
    var nodeFetch = require_lib();
    var realFetch = nodeFetch.default || nodeFetch;
    var fetch2 = function(url, options) {
      if (/^\/\//.test(url)) {
        url = "https:" + url;
      }
      return realFetch.call(this, url, options);
    };
    fetch2.ponyfill = true;
    module2.exports = exports2 = fetch2;
    exports2.fetch = fetch2;
    exports2.Headers = nodeFetch.Headers;
    exports2.Request = nodeFetch.Request;
    exports2.Response = nodeFetch.Response;
    exports2.default = fetch2;
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/package.json
var require_package = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/package.json"(exports2, module2) {
    module2.exports = {
      "11ty": {
        compatibility: ">=0.5.4"
      },
      _from: "@11ty/eleventy-plugin-syntaxhighlight@^3.1.3",
      _id: "@11ty/eleventy-plugin-syntaxhighlight@3.1.3",
      _inBundle: false,
      _integrity: "sha512-xUNbUl1rC6nRGwoWhTcivjWc6h45Y7QzKpjjjLAII4XxR9JsR1kOWYNOyI6ErK4I218tsBwgSgGVHsSAVFuAcQ==",
      _location: "/@11ty/eleventy-plugin-syntaxhighlight",
      _phantomChildren: {},
      _requested: {
        type: "range",
        registry: true,
        raw: "@11ty/eleventy-plugin-syntaxhighlight@^3.1.3",
        name: "@11ty/eleventy-plugin-syntaxhighlight",
        escapedName: "@11ty%2feleventy-plugin-syntaxhighlight",
        scope: "@11ty",
        rawSpec: "^3.1.3",
        saveSpec: null,
        fetchSpec: "^3.1.3"
      },
      _requiredBy: [
        "/"
      ],
      _resolved: "https://registry.npmjs.org/@11ty/eleventy-plugin-syntaxhighlight/-/eleventy-plugin-syntaxhighlight-3.1.3.tgz",
      _shasum: "afbd846eaba16d0380c8684556eb796e2fe4b429",
      _spec: "@11ty/eleventy-plugin-syntaxhighlight@^3.1.3",
      _where: "/home/mathieu/web-x-ray",
      author: {
        name: "Zach Leatherman",
        email: "zachleatherman@gmail.com",
        url: "https://zachleat.com/"
      },
      bugs: {
        url: "https://github.com/11ty/eleventy-plugin-syntaxhighlight/issues"
      },
      bundleDependencies: false,
      dependencies: {
        linkedom: "^0.12.1",
        prismjs: "^1.25.0"
      },
      deprecated: false,
      description: "A pack of Eleventy plugins for syntax highlighting for Markdown and Liquid templates.",
      devDependencies: {
        ava: "^3.15.0",
        liquidjs: "^9.25.1",
        "markdown-it": "^12.2.0"
      },
      funding: {
        type: "opencollective",
        url: "https://opencollective.com/11ty"
      },
      homepage: "https://www.11ty.dev/docs/plugins/syntaxhighlight/",
      keywords: [
        "eleventy",
        "eleventy-plugin"
      ],
      license: "MIT",
      main: ".eleventy.js",
      name: "@11ty/eleventy-plugin-syntaxhighlight",
      publishConfig: {
        access: "public"
      },
      repository: {
        type: "git",
        url: "git+https://github.com/11ty/eleventy-plugin-syntaxhighlight.git"
      },
      scripts: {
        demo: "npx @11ty/eleventy --input=demo --output=demo/_site --config=demo/eleventy-config.js",
        start: "npx @11ty/eleventy --input=demo --output=demo/_site --config=demo/eleventy-config.js --serve",
        test: "npx ava"
      },
      version: "3.1.3"
    };
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/hasTemplateFormat.js
var require_hasTemplateFormat = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/hasTemplateFormat.js"(exports2, module2) {
    module2.exports = function(templateFormats = ["*"], format = false) {
      if (!Array.isArray(templateFormats)) {
        templateFormats = [templateFormats];
      }
      if (Array.isArray(templateFormats)) {
        if (templateFormats.indexOf("*") > -1 || templateFormats.indexOf(format) > -1) {
          return true;
        }
      }
      return false;
    };
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/PrismNormalizeAlias.js
var require_PrismNormalizeAlias = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/PrismNormalizeAlias.js"(exports2, module2) {
    var Prism = require("prismjs");
    module2.exports = function(language) {
      try {
        const PrismComponents = require("prismjs/components.json");
        let langs = PrismComponents.languages;
        if (langs[language]) {
          return language;
        }
        for (let langName in langs) {
          if (Array.isArray(langs[langName].alias)) {
            for (let alias of langs[langName].alias) {
              if (alias === language) {
                return langName;
              }
            }
          } else if (langs[langName].alias === language) {
            return langName;
          }
        }
      } catch (e) {
      }
      return language;
    };
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/PrismLoader.js
var require_PrismLoader = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/PrismLoader.js"(exports2, module2) {
    var Prism = require("prismjs");
    var PrismLoader = require("prismjs/components/index.js");
    var PrismAlias = require_PrismNormalizeAlias();
    module2.exports = function(language) {
      let normalizedLanguage = PrismAlias(language);
      if (!Prism.languages[normalizedLanguage]) {
        PrismLoader(normalizedLanguage);
      }
      if (!Prism.languages[normalizedLanguage]) {
        throw new Error(`"${language}" is not a valid Prism.js language for eleventy-plugin-syntaxhighlight`);
      }
      return Prism.languages[normalizedLanguage];
    };
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/HighlightLines.js
var require_HighlightLines = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/HighlightLines.js"(exports2, module2) {
    var HighlightLines = class {
      constructor(rangeStr) {
        this.highlights = this.convertRangeToHash(rangeStr);
      }
      convertRangeToHash(rangeStr) {
        let hash = {};
        if (!rangeStr) {
          return hash;
        }
        let ranges = rangeStr.split(",").map(function(range) {
          return range.trim();
        });
        for (let range of ranges) {
          let startFinish = range.split("-");
          let start = parseInt(startFinish[0], 10);
          let end = parseInt(startFinish[1] || start, 10);
          for (let j = start, k = end; j <= k; j++) {
            hash[j] = true;
          }
        }
        return hash;
      }
      isHighlighted(lineNumber) {
        return !!this.highlights[lineNumber];
      }
    };
    module2.exports = HighlightLines;
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/HighlightLinesGroup.js
var require_HighlightLinesGroup = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/HighlightLinesGroup.js"(exports2, module2) {
    var HighlightLines = require_HighlightLines();
    var HighlightLinesGroup = class {
      constructor(str, delimiter) {
        this.init(str, delimiter);
      }
      init(str = "", delimiter = " ") {
        this.str = str;
        this.delimiter = delimiter;
        let split = str.split(this.delimiter);
        this.highlights = new HighlightLines(split.length === 1 ? split[0] : "");
        this.highlightsAdd = new HighlightLines(split.length === 2 ? split[0] : "");
        this.highlightsRemove = new HighlightLines(split.length === 2 ? split[1] : "");
      }
      isHighlighted(lineNumber) {
        return this.highlights.isHighlighted(lineNumber);
      }
      isHighlightedAdd(lineNumber) {
        return this.highlightsAdd.isHighlighted(lineNumber);
      }
      isHighlightedRemove(lineNumber) {
        return this.highlightsRemove.isHighlighted(lineNumber);
      }
      hasTagMismatch(line) {
        let startCount = line.split("<span").length;
        let endCount = line.split("</span").length;
        if (startCount !== endCount) {
          return true;
        }
        return false;
      }
      splitLineMarkup(line, before, after) {
        if (this.hasTagMismatch(line)) {
          return line;
        }
        return before + line + after;
      }
      getLineMarkup(lineNumber, line, extraClasses = []) {
        let extraClassesStr = extraClasses.length ? " " + extraClasses.join(" ") : "";
        if (this.isHighlighted(lineNumber)) {
          return this.splitLineMarkup(line, `<mark class="highlight-line highlight-line-active${extraClassesStr}">`, `</mark>`);
        }
        if (this.isHighlightedAdd(lineNumber)) {
          return this.splitLineMarkup(line, `<ins class="highlight-line highlight-line-add${extraClassesStr}">`, `</ins>`);
        }
        if (this.isHighlightedRemove(lineNumber)) {
          return this.splitLineMarkup(line, `<del class="highlight-line highlight-line-remove${extraClassesStr}">`, `</del>`);
        }
        return this.splitLineMarkup(line, `<span class="highlight-line${extraClassesStr}">`, `</span>`);
      }
    };
    module2.exports = HighlightLinesGroup;
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/getAttributes.js
var require_getAttributes = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/getAttributes.js"(exports2, module2) {
    function attributeEntryToString([key, value]) {
      if (typeof value !== "string" && typeof value !== "number")
        throw new Error(`Attribute "${key}" must have a value of type string or number not "${typeof value}".`);
      return `${key}="${value}"`;
    }
    function getAttributes(attributes) {
      if (!attributes) {
        return "";
      } else if (typeof attributes === "object") {
        const formattedAttributes = Object.entries(attributes).map(attributeEntryToString);
        return formattedAttributes.length ? ` ${formattedAttributes.join(" ")}` : "";
      } else if (typeof attributes === "string") {
        throw new Error("Syntax highlighter plugin custom attributes on <pre> and <code> must be an object. Received: " + JSON.stringify(attributes));
      }
    }
    module2.exports = getAttributes;
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/HighlightPairedShortcode.js
var require_HighlightPairedShortcode = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/HighlightPairedShortcode.js"(exports2, module2) {
    var Prism = require("prismjs");
    var PrismLoader = require_PrismLoader();
    var HighlightLinesGroup = require_HighlightLinesGroup();
    var getAttributes = require_getAttributes();
    module2.exports = function(content, language, highlightNumbers, options = {}) {
      const preAttributes = getAttributes(options.preAttributes);
      const codeAttributes = getAttributes(options.codeAttributes);
      if (options.trim === void 0 || options.trim === true) {
        content = content.trim();
      }
      let highlightedContent;
      if (language === "text") {
        highlightedContent = content;
      } else {
        highlightedContent = Prism.highlight(content, PrismLoader(language), language);
      }
      let group = new HighlightLinesGroup(highlightNumbers);
      let lines = highlightedContent.split("\n");
      lines = lines.map(function(line, j) {
        if (options.alwaysWrapLineHighlights || highlightNumbers) {
          let lineContent = group.getLineMarkup(j, line);
          return lineContent;
        }
        return line;
      });
      return `<pre class="language-${language}"${preAttributes}><code class="language-${language}"${codeAttributes}>` + lines.join(options.lineSeparator || "<br>") + "</code></pre>";
    };
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/LiquidHighlightTag.js
var require_LiquidHighlightTag = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/LiquidHighlightTag.js"(exports2, module2) {
    var HighlightPairedShortcode = require_HighlightPairedShortcode();
    var LiquidHighlightTag = class {
      constructor(liquidEngine) {
        this.liquidEngine = liquidEngine;
      }
      getObject(options = {}) {
        let ret = function(highlighter) {
          return {
            parse: function(tagToken, remainTokens) {
              let split = tagToken.args.split(" ");
              this.language = split.shift();
              this.highlightLines = split.join(" ");
              this.tokens = [];
              var stream = highlighter.liquidEngine.parser.parseStream(remainTokens);
              stream.on("token", (token) => {
                if (token.name === "endhighlight") {
                  stream.stop();
                } else {
                  this.tokens.push(token);
                }
              }).on("end", (x) => {
                throw new Error(`tag ${tagToken.getText()} not closed`);
              });
              stream.start();
            },
            render: function(scope, hash) {
              let tokens = this.tokens.map((token) => {
                return token.raw || token.getText();
              });
              let tokenStr = tokens.join("").trim();
              return Promise.resolve(HighlightPairedShortcode(tokenStr, this.language, this.highlightLines, options));
            }
          };
        };
        return ret(this);
      }
    };
    module2.exports = LiquidHighlightTag;
  }
});

// node_modules/linkedom/cjs/shared/symbols.js
var require_symbols = __commonJS({
  "node_modules/linkedom/cjs/shared/symbols.js"(exports2) {
    "use strict";
    var CHANGED = Symbol("changed");
    exports2.CHANGED = CHANGED;
    var CLASS_LIST = Symbol("classList");
    exports2.CLASS_LIST = CLASS_LIST;
    var CUSTOM_ELEMENTS = Symbol("CustomElements");
    exports2.CUSTOM_ELEMENTS = CUSTOM_ELEMENTS;
    var CONTENT = Symbol("content");
    exports2.CONTENT = CONTENT;
    var DATASET = Symbol("dataset");
    exports2.DATASET = DATASET;
    var DOCTYPE = Symbol("doctype");
    exports2.DOCTYPE = DOCTYPE;
    var DOM_PARSER = Symbol("DOMParser");
    exports2.DOM_PARSER = DOM_PARSER;
    var END = Symbol("end");
    exports2.END = END;
    var EVENT_TARGET = Symbol("EventTarget");
    exports2.EVENT_TARGET = EVENT_TARGET;
    var IMAGE = Symbol("image");
    exports2.IMAGE = IMAGE;
    var MIME = Symbol("mime");
    exports2.MIME = MIME;
    var MUTATION_OBSERVER = Symbol("MutationObserver");
    exports2.MUTATION_OBSERVER = MUTATION_OBSERVER;
    var NEXT = Symbol("next");
    exports2.NEXT = NEXT;
    var OWNER_ELEMENT = Symbol("ownerElement");
    exports2.OWNER_ELEMENT = OWNER_ELEMENT;
    var PREV = Symbol("prev");
    exports2.PREV = PREV;
    var PRIVATE = Symbol("private");
    exports2.PRIVATE = PRIVATE;
    var SHEET = Symbol("sheet");
    exports2.SHEET = SHEET;
    var START = Symbol("start");
    exports2.START = START;
    var STYLE = Symbol("style");
    exports2.STYLE = STYLE;
    var VALUE = Symbol("value");
    exports2.VALUE = VALUE;
  }
});

// node_modules/htmlparser2/node_modules/entities/lib/decode_codepoint.js
var require_decode_codepoint = __commonJS({
  "node_modules/htmlparser2/node_modules/entities/lib/decode_codepoint.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var decodeMap = new Map([
      [0, 65533],
      [128, 8364],
      [130, 8218],
      [131, 402],
      [132, 8222],
      [133, 8230],
      [134, 8224],
      [135, 8225],
      [136, 710],
      [137, 8240],
      [138, 352],
      [139, 8249],
      [140, 338],
      [142, 381],
      [145, 8216],
      [146, 8217],
      [147, 8220],
      [148, 8221],
      [149, 8226],
      [150, 8211],
      [151, 8212],
      [152, 732],
      [153, 8482],
      [154, 353],
      [155, 8250],
      [156, 339],
      [158, 382],
      [159, 376]
    ]);
    var fromCodePoint = String.fromCodePoint || function(codePoint) {
      var output = "";
      if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      output += String.fromCharCode(codePoint);
      return output;
    };
    function decodeCodePoint(codePoint) {
      var _a;
      if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
        return "\uFFFD";
      }
      return fromCodePoint((_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint);
    }
    exports2.default = decodeCodePoint;
  }
});

// node_modules/htmlparser2/node_modules/entities/lib/generated/decode-data-html.js
var require_decode_data_html = __commonJS({
  "node_modules/htmlparser2/node_modules/entities/lib/generated/decode-data-html.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = new Uint16Array([14866, 60, 237, 340, 721, 1312, 1562, 1654, 1838, 1957, 2183, 2239, 2301, 2958, 3037, 3893, 4123, 4298, 4330, 4801, 5191, 5395, 5752, 5903, 5943, 5972, 6050, 0, 0, 0, 0, 0, 0, 6135, 6565, 7422, 8183, 8738, 9242, 9503, 9938, 10189, 10573, 10637, 10715, 11950, 12246, 13539, 13950, 14445, 14533, 15364, 16514, 16980, 17390, 17763, 17849, 18036, 18125, 4096, 69, 77, 97, 98, 99, 102, 103, 108, 109, 110, 111, 112, 114, 115, 116, 117, 92, 100, 106, 115, 122, 137, 142, 151, 157, 163, 167, 182, 196, 204, 220, 229, 108, 105, 103, 33024, 198, 59, 32768, 198, 80, 33024, 38, 59, 32768, 38, 99, 117, 116, 101, 33024, 193, 59, 32768, 193, 114, 101, 118, 101, 59, 32768, 258, 512, 105, 121, 127, 134, 114, 99, 33024, 194, 59, 32768, 194, 59, 32768, 1040, 114, 59, 32896, 55349, 56580, 114, 97, 118, 101, 33024, 192, 59, 32768, 192, 112, 104, 97, 59, 32768, 913, 97, 99, 114, 59, 32768, 256, 100, 59, 32768, 10835, 512, 103, 112, 172, 177, 111, 110, 59, 32768, 260, 102, 59, 32896, 55349, 56632, 112, 108, 121, 70, 117, 110, 99, 116, 105, 111, 110, 59, 32768, 8289, 105, 110, 103, 33024, 197, 59, 32768, 197, 512, 99, 115, 209, 214, 114, 59, 32896, 55349, 56476, 105, 103, 110, 59, 32768, 8788, 105, 108, 100, 101, 33024, 195, 59, 32768, 195, 109, 108, 33024, 196, 59, 32768, 196, 2048, 97, 99, 101, 102, 111, 114, 115, 117, 253, 278, 282, 310, 315, 321, 327, 332, 512, 99, 114, 258, 267, 107, 115, 108, 97, 115, 104, 59, 32768, 8726, 583, 271, 274, 59, 32768, 10983, 101, 100, 59, 32768, 8966, 121, 59, 32768, 1041, 768, 99, 114, 116, 289, 296, 306, 97, 117, 115, 101, 59, 32768, 8757, 110, 111, 117, 108, 108, 105, 115, 59, 32768, 8492, 97, 59, 32768, 914, 114, 59, 32896, 55349, 56581, 112, 102, 59, 32896, 55349, 56633, 101, 118, 101, 59, 32768, 728, 99, 114, 59, 32768, 8492, 109, 112, 101, 113, 59, 32768, 8782, 3584, 72, 79, 97, 99, 100, 101, 102, 104, 105, 108, 111, 114, 115, 117, 368, 373, 380, 426, 461, 466, 487, 491, 495, 533, 593, 695, 701, 707, 99, 121, 59, 32768, 1063, 80, 89, 33024, 169, 59, 32768, 169, 768, 99, 112, 121, 387, 393, 419, 117, 116, 101, 59, 32768, 262, 512, 59, 105, 398, 400, 32768, 8914, 116, 97, 108, 68, 105, 102, 102, 101, 114, 101, 110, 116, 105, 97, 108, 68, 59, 32768, 8517, 108, 101, 121, 115, 59, 32768, 8493, 1024, 97, 101, 105, 111, 435, 441, 449, 454, 114, 111, 110, 59, 32768, 268, 100, 105, 108, 33024, 199, 59, 32768, 199, 114, 99, 59, 32768, 264, 110, 105, 110, 116, 59, 32768, 8752, 111, 116, 59, 32768, 266, 512, 100, 110, 471, 478, 105, 108, 108, 97, 59, 32768, 184, 116, 101, 114, 68, 111, 116, 59, 32768, 183, 114, 59, 32768, 8493, 105, 59, 32768, 935, 114, 99, 108, 101, 1024, 68, 77, 80, 84, 508, 513, 520, 526, 111, 116, 59, 32768, 8857, 105, 110, 117, 115, 59, 32768, 8854, 108, 117, 115, 59, 32768, 8853, 105, 109, 101, 115, 59, 32768, 8855, 111, 512, 99, 115, 539, 562, 107, 119, 105, 115, 101, 67, 111, 110, 116, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 32768, 8754, 101, 67, 117, 114, 108, 121, 512, 68, 81, 573, 586, 111, 117, 98, 108, 101, 81, 117, 111, 116, 101, 59, 32768, 8221, 117, 111, 116, 101, 59, 32768, 8217, 1024, 108, 110, 112, 117, 602, 614, 648, 664, 111, 110, 512, 59, 101, 609, 611, 32768, 8759, 59, 32768, 10868, 768, 103, 105, 116, 621, 629, 634, 114, 117, 101, 110, 116, 59, 32768, 8801, 110, 116, 59, 32768, 8751, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 32768, 8750, 512, 102, 114, 653, 656, 59, 32768, 8450, 111, 100, 117, 99, 116, 59, 32768, 8720, 110, 116, 101, 114, 67, 108, 111, 99, 107, 119, 105, 115, 101, 67, 111, 110, 116, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 32768, 8755, 111, 115, 115, 59, 32768, 10799, 99, 114, 59, 32896, 55349, 56478, 112, 512, 59, 67, 713, 715, 32768, 8915, 97, 112, 59, 32768, 8781, 2816, 68, 74, 83, 90, 97, 99, 101, 102, 105, 111, 115, 743, 758, 763, 768, 773, 795, 809, 821, 826, 910, 1295, 512, 59, 111, 748, 750, 32768, 8517, 116, 114, 97, 104, 100, 59, 32768, 10513, 99, 121, 59, 32768, 1026, 99, 121, 59, 32768, 1029, 99, 121, 59, 32768, 1039, 768, 103, 114, 115, 780, 786, 790, 103, 101, 114, 59, 32768, 8225, 114, 59, 32768, 8609, 104, 118, 59, 32768, 10980, 512, 97, 121, 800, 806, 114, 111, 110, 59, 32768, 270, 59, 32768, 1044, 108, 512, 59, 116, 815, 817, 32768, 8711, 97, 59, 32768, 916, 114, 59, 32896, 55349, 56583, 512, 97, 102, 831, 897, 512, 99, 109, 836, 891, 114, 105, 116, 105, 99, 97, 108, 1024, 65, 68, 71, 84, 852, 859, 877, 884, 99, 117, 116, 101, 59, 32768, 180, 111, 581, 864, 867, 59, 32768, 729, 98, 108, 101, 65, 99, 117, 116, 101, 59, 32768, 733, 114, 97, 118, 101, 59, 32768, 96, 105, 108, 100, 101, 59, 32768, 732, 111, 110, 100, 59, 32768, 8900, 102, 101, 114, 101, 110, 116, 105, 97, 108, 68, 59, 32768, 8518, 2113, 920, 0, 0, 0, 925, 946, 0, 1139, 102, 59, 32896, 55349, 56635, 768, 59, 68, 69, 931, 933, 938, 32768, 168, 111, 116, 59, 32768, 8412, 113, 117, 97, 108, 59, 32768, 8784, 98, 108, 101, 1536, 67, 68, 76, 82, 85, 86, 961, 978, 996, 1080, 1101, 1125, 111, 110, 116, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 32768, 8751, 111, 1093, 985, 0, 0, 988, 59, 32768, 168, 110, 65, 114, 114, 111, 119, 59, 32768, 8659, 512, 101, 111, 1001, 1034, 102, 116, 768, 65, 82, 84, 1010, 1017, 1029, 114, 114, 111, 119, 59, 32768, 8656, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 8660, 101, 101, 59, 32768, 10980, 110, 103, 512, 76, 82, 1041, 1068, 101, 102, 116, 512, 65, 82, 1049, 1056, 114, 114, 111, 119, 59, 32768, 10232, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 10234, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 10233, 105, 103, 104, 116, 512, 65, 84, 1089, 1096, 114, 114, 111, 119, 59, 32768, 8658, 101, 101, 59, 32768, 8872, 112, 1042, 1108, 0, 0, 1115, 114, 114, 111, 119, 59, 32768, 8657, 111, 119, 110, 65, 114, 114, 111, 119, 59, 32768, 8661, 101, 114, 116, 105, 99, 97, 108, 66, 97, 114, 59, 32768, 8741, 110, 1536, 65, 66, 76, 82, 84, 97, 1152, 1179, 1186, 1236, 1272, 1288, 114, 114, 111, 119, 768, 59, 66, 85, 1163, 1165, 1170, 32768, 8595, 97, 114, 59, 32768, 10515, 112, 65, 114, 114, 111, 119, 59, 32768, 8693, 114, 101, 118, 101, 59, 32768, 785, 101, 102, 116, 1315, 1196, 0, 1209, 0, 1220, 105, 103, 104, 116, 86, 101, 99, 116, 111, 114, 59, 32768, 10576, 101, 101, 86, 101, 99, 116, 111, 114, 59, 32768, 10590, 101, 99, 116, 111, 114, 512, 59, 66, 1229, 1231, 32768, 8637, 97, 114, 59, 32768, 10582, 105, 103, 104, 116, 805, 1245, 0, 1256, 101, 101, 86, 101, 99, 116, 111, 114, 59, 32768, 10591, 101, 99, 116, 111, 114, 512, 59, 66, 1265, 1267, 32768, 8641, 97, 114, 59, 32768, 10583, 101, 101, 512, 59, 65, 1279, 1281, 32768, 8868, 114, 114, 111, 119, 59, 32768, 8615, 114, 114, 111, 119, 59, 32768, 8659, 512, 99, 116, 1300, 1305, 114, 59, 32896, 55349, 56479, 114, 111, 107, 59, 32768, 272, 4096, 78, 84, 97, 99, 100, 102, 103, 108, 109, 111, 112, 113, 115, 116, 117, 120, 1344, 1348, 1354, 1363, 1386, 1391, 1396, 1405, 1413, 1460, 1475, 1483, 1514, 1527, 1531, 1538, 71, 59, 32768, 330, 72, 33024, 208, 59, 32768, 208, 99, 117, 116, 101, 33024, 201, 59, 32768, 201, 768, 97, 105, 121, 1370, 1376, 1383, 114, 111, 110, 59, 32768, 282, 114, 99, 33024, 202, 59, 32768, 202, 59, 32768, 1069, 111, 116, 59, 32768, 278, 114, 59, 32896, 55349, 56584, 114, 97, 118, 101, 33024, 200, 59, 32768, 200, 101, 109, 101, 110, 116, 59, 32768, 8712, 512, 97, 112, 1418, 1423, 99, 114, 59, 32768, 274, 116, 121, 1060, 1431, 0, 0, 1444, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 32768, 9723, 101, 114, 121, 83, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 32768, 9643, 512, 103, 112, 1465, 1470, 111, 110, 59, 32768, 280, 102, 59, 32896, 55349, 56636, 115, 105, 108, 111, 110, 59, 32768, 917, 117, 512, 97, 105, 1489, 1504, 108, 512, 59, 84, 1495, 1497, 32768, 10869, 105, 108, 100, 101, 59, 32768, 8770, 108, 105, 98, 114, 105, 117, 109, 59, 32768, 8652, 512, 99, 105, 1519, 1523, 114, 59, 32768, 8496, 109, 59, 32768, 10867, 97, 59, 32768, 919, 109, 108, 33024, 203, 59, 32768, 203, 512, 105, 112, 1543, 1549, 115, 116, 115, 59, 32768, 8707, 111, 110, 101, 110, 116, 105, 97, 108, 69, 59, 32768, 8519, 1280, 99, 102, 105, 111, 115, 1572, 1576, 1581, 1620, 1648, 121, 59, 32768, 1060, 114, 59, 32896, 55349, 56585, 108, 108, 101, 100, 1060, 1591, 0, 0, 1604, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 32768, 9724, 101, 114, 121, 83, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 32768, 9642, 1601, 1628, 0, 1633, 0, 0, 1639, 102, 59, 32896, 55349, 56637, 65, 108, 108, 59, 32768, 8704, 114, 105, 101, 114, 116, 114, 102, 59, 32768, 8497, 99, 114, 59, 32768, 8497, 3072, 74, 84, 97, 98, 99, 100, 102, 103, 111, 114, 115, 116, 1678, 1683, 1688, 1701, 1708, 1729, 1734, 1739, 1742, 1748, 1828, 1834, 99, 121, 59, 32768, 1027, 33024, 62, 59, 32768, 62, 109, 109, 97, 512, 59, 100, 1696, 1698, 32768, 915, 59, 32768, 988, 114, 101, 118, 101, 59, 32768, 286, 768, 101, 105, 121, 1715, 1721, 1726, 100, 105, 108, 59, 32768, 290, 114, 99, 59, 32768, 284, 59, 32768, 1043, 111, 116, 59, 32768, 288, 114, 59, 32896, 55349, 56586, 59, 32768, 8921, 112, 102, 59, 32896, 55349, 56638, 101, 97, 116, 101, 114, 1536, 69, 70, 71, 76, 83, 84, 1766, 1783, 1794, 1803, 1809, 1821, 113, 117, 97, 108, 512, 59, 76, 1775, 1777, 32768, 8805, 101, 115, 115, 59, 32768, 8923, 117, 108, 108, 69, 113, 117, 97, 108, 59, 32768, 8807, 114, 101, 97, 116, 101, 114, 59, 32768, 10914, 101, 115, 115, 59, 32768, 8823, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32768, 10878, 105, 108, 100, 101, 59, 32768, 8819, 99, 114, 59, 32896, 55349, 56482, 59, 32768, 8811, 2048, 65, 97, 99, 102, 105, 111, 115, 117, 1854, 1861, 1874, 1880, 1884, 1897, 1919, 1934, 82, 68, 99, 121, 59, 32768, 1066, 512, 99, 116, 1866, 1871, 101, 107, 59, 32768, 711, 59, 32768, 94, 105, 114, 99, 59, 32768, 292, 114, 59, 32768, 8460, 108, 98, 101, 114, 116, 83, 112, 97, 99, 101, 59, 32768, 8459, 833, 1902, 0, 1906, 102, 59, 32768, 8461, 105, 122, 111, 110, 116, 97, 108, 76, 105, 110, 101, 59, 32768, 9472, 512, 99, 116, 1924, 1928, 114, 59, 32768, 8459, 114, 111, 107, 59, 32768, 294, 109, 112, 533, 1940, 1950, 111, 119, 110, 72, 117, 109, 112, 59, 32768, 8782, 113, 117, 97, 108, 59, 32768, 8783, 3584, 69, 74, 79, 97, 99, 100, 102, 103, 109, 110, 111, 115, 116, 117, 1985, 1990, 1996, 2001, 2010, 2025, 2030, 2034, 2043, 2077, 2134, 2155, 2160, 2167, 99, 121, 59, 32768, 1045, 108, 105, 103, 59, 32768, 306, 99, 121, 59, 32768, 1025, 99, 117, 116, 101, 33024, 205, 59, 32768, 205, 512, 105, 121, 2015, 2022, 114, 99, 33024, 206, 59, 32768, 206, 59, 32768, 1048, 111, 116, 59, 32768, 304, 114, 59, 32768, 8465, 114, 97, 118, 101, 33024, 204, 59, 32768, 204, 768, 59, 97, 112, 2050, 2052, 2070, 32768, 8465, 512, 99, 103, 2057, 2061, 114, 59, 32768, 298, 105, 110, 97, 114, 121, 73, 59, 32768, 8520, 108, 105, 101, 115, 59, 32768, 8658, 837, 2082, 0, 2110, 512, 59, 101, 2086, 2088, 32768, 8748, 512, 103, 114, 2093, 2099, 114, 97, 108, 59, 32768, 8747, 115, 101, 99, 116, 105, 111, 110, 59, 32768, 8898, 105, 115, 105, 98, 108, 101, 512, 67, 84, 2120, 2127, 111, 109, 109, 97, 59, 32768, 8291, 105, 109, 101, 115, 59, 32768, 8290, 768, 103, 112, 116, 2141, 2146, 2151, 111, 110, 59, 32768, 302, 102, 59, 32896, 55349, 56640, 97, 59, 32768, 921, 99, 114, 59, 32768, 8464, 105, 108, 100, 101, 59, 32768, 296, 828, 2172, 0, 2177, 99, 121, 59, 32768, 1030, 108, 33024, 207, 59, 32768, 207, 1280, 99, 102, 111, 115, 117, 2193, 2206, 2211, 2217, 2232, 512, 105, 121, 2198, 2203, 114, 99, 59, 32768, 308, 59, 32768, 1049, 114, 59, 32896, 55349, 56589, 112, 102, 59, 32896, 55349, 56641, 820, 2222, 0, 2227, 114, 59, 32896, 55349, 56485, 114, 99, 121, 59, 32768, 1032, 107, 99, 121, 59, 32768, 1028, 1792, 72, 74, 97, 99, 102, 111, 115, 2253, 2258, 2263, 2269, 2283, 2288, 2294, 99, 121, 59, 32768, 1061, 99, 121, 59, 32768, 1036, 112, 112, 97, 59, 32768, 922, 512, 101, 121, 2274, 2280, 100, 105, 108, 59, 32768, 310, 59, 32768, 1050, 114, 59, 32896, 55349, 56590, 112, 102, 59, 32896, 55349, 56642, 99, 114, 59, 32896, 55349, 56486, 2816, 74, 84, 97, 99, 101, 102, 108, 109, 111, 115, 116, 2323, 2328, 2333, 2374, 2396, 2775, 2780, 2797, 2804, 2934, 2954, 99, 121, 59, 32768, 1033, 33024, 60, 59, 32768, 60, 1280, 99, 109, 110, 112, 114, 2344, 2350, 2356, 2360, 2370, 117, 116, 101, 59, 32768, 313, 98, 100, 97, 59, 32768, 923, 103, 59, 32768, 10218, 108, 97, 99, 101, 116, 114, 102, 59, 32768, 8466, 114, 59, 32768, 8606, 768, 97, 101, 121, 2381, 2387, 2393, 114, 111, 110, 59, 32768, 317, 100, 105, 108, 59, 32768, 315, 59, 32768, 1051, 512, 102, 115, 2401, 2702, 116, 2560, 65, 67, 68, 70, 82, 84, 85, 86, 97, 114, 2423, 2470, 2479, 2530, 2537, 2561, 2618, 2666, 2683, 2690, 512, 110, 114, 2428, 2441, 103, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 32768, 10216, 114, 111, 119, 768, 59, 66, 82, 2451, 2453, 2458, 32768, 8592, 97, 114, 59, 32768, 8676, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 8646, 101, 105, 108, 105, 110, 103, 59, 32768, 8968, 111, 838, 2485, 0, 2498, 98, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 32768, 10214, 110, 805, 2503, 0, 2514, 101, 101, 86, 101, 99, 116, 111, 114, 59, 32768, 10593, 101, 99, 116, 111, 114, 512, 59, 66, 2523, 2525, 32768, 8643, 97, 114, 59, 32768, 10585, 108, 111, 111, 114, 59, 32768, 8970, 105, 103, 104, 116, 512, 65, 86, 2546, 2553, 114, 114, 111, 119, 59, 32768, 8596, 101, 99, 116, 111, 114, 59, 32768, 10574, 512, 101, 114, 2566, 2591, 101, 768, 59, 65, 86, 2574, 2576, 2583, 32768, 8867, 114, 114, 111, 119, 59, 32768, 8612, 101, 99, 116, 111, 114, 59, 32768, 10586, 105, 97, 110, 103, 108, 101, 768, 59, 66, 69, 2604, 2606, 2611, 32768, 8882, 97, 114, 59, 32768, 10703, 113, 117, 97, 108, 59, 32768, 8884, 112, 768, 68, 84, 86, 2626, 2638, 2649, 111, 119, 110, 86, 101, 99, 116, 111, 114, 59, 32768, 10577, 101, 101, 86, 101, 99, 116, 111, 114, 59, 32768, 10592, 101, 99, 116, 111, 114, 512, 59, 66, 2659, 2661, 32768, 8639, 97, 114, 59, 32768, 10584, 101, 99, 116, 111, 114, 512, 59, 66, 2676, 2678, 32768, 8636, 97, 114, 59, 32768, 10578, 114, 114, 111, 119, 59, 32768, 8656, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8660, 115, 1536, 69, 70, 71, 76, 83, 84, 2716, 2730, 2741, 2750, 2756, 2768, 113, 117, 97, 108, 71, 114, 101, 97, 116, 101, 114, 59, 32768, 8922, 117, 108, 108, 69, 113, 117, 97, 108, 59, 32768, 8806, 114, 101, 97, 116, 101, 114, 59, 32768, 8822, 101, 115, 115, 59, 32768, 10913, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32768, 10877, 105, 108, 100, 101, 59, 32768, 8818, 114, 59, 32896, 55349, 56591, 512, 59, 101, 2785, 2787, 32768, 8920, 102, 116, 97, 114, 114, 111, 119, 59, 32768, 8666, 105, 100, 111, 116, 59, 32768, 319, 768, 110, 112, 119, 2811, 2899, 2904, 103, 1024, 76, 82, 108, 114, 2821, 2848, 2860, 2887, 101, 102, 116, 512, 65, 82, 2829, 2836, 114, 114, 111, 119, 59, 32768, 10229, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 10231, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 10230, 101, 102, 116, 512, 97, 114, 2868, 2875, 114, 114, 111, 119, 59, 32768, 10232, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 10234, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 10233, 102, 59, 32896, 55349, 56643, 101, 114, 512, 76, 82, 2911, 2922, 101, 102, 116, 65, 114, 114, 111, 119, 59, 32768, 8601, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 8600, 768, 99, 104, 116, 2941, 2945, 2948, 114, 59, 32768, 8466, 59, 32768, 8624, 114, 111, 107, 59, 32768, 321, 59, 32768, 8810, 2048, 97, 99, 101, 102, 105, 111, 115, 117, 2974, 2978, 2982, 3007, 3012, 3022, 3028, 3033, 112, 59, 32768, 10501, 121, 59, 32768, 1052, 512, 100, 108, 2987, 2998, 105, 117, 109, 83, 112, 97, 99, 101, 59, 32768, 8287, 108, 105, 110, 116, 114, 102, 59, 32768, 8499, 114, 59, 32896, 55349, 56592, 110, 117, 115, 80, 108, 117, 115, 59, 32768, 8723, 112, 102, 59, 32896, 55349, 56644, 99, 114, 59, 32768, 8499, 59, 32768, 924, 2304, 74, 97, 99, 101, 102, 111, 115, 116, 117, 3055, 3060, 3067, 3089, 3201, 3206, 3874, 3880, 3889, 99, 121, 59, 32768, 1034, 99, 117, 116, 101, 59, 32768, 323, 768, 97, 101, 121, 3074, 3080, 3086, 114, 111, 110, 59, 32768, 327, 100, 105, 108, 59, 32768, 325, 59, 32768, 1053, 768, 103, 115, 119, 3096, 3160, 3194, 97, 116, 105, 118, 101, 768, 77, 84, 86, 3108, 3121, 3145, 101, 100, 105, 117, 109, 83, 112, 97, 99, 101, 59, 32768, 8203, 104, 105, 512, 99, 110, 3128, 3137, 107, 83, 112, 97, 99, 101, 59, 32768, 8203, 83, 112, 97, 99, 101, 59, 32768, 8203, 101, 114, 121, 84, 104, 105, 110, 83, 112, 97, 99, 101, 59, 32768, 8203, 116, 101, 100, 512, 71, 76, 3168, 3184, 114, 101, 97, 116, 101, 114, 71, 114, 101, 97, 116, 101, 114, 59, 32768, 8811, 101, 115, 115, 76, 101, 115, 115, 59, 32768, 8810, 76, 105, 110, 101, 59, 32768, 10, 114, 59, 32896, 55349, 56593, 1024, 66, 110, 112, 116, 3215, 3222, 3238, 3242, 114, 101, 97, 107, 59, 32768, 8288, 66, 114, 101, 97, 107, 105, 110, 103, 83, 112, 97, 99, 101, 59, 32768, 160, 102, 59, 32768, 8469, 3328, 59, 67, 68, 69, 71, 72, 76, 78, 80, 82, 83, 84, 86, 3269, 3271, 3293, 3312, 3352, 3430, 3455, 3551, 3589, 3625, 3678, 3821, 3861, 32768, 10988, 512, 111, 117, 3276, 3286, 110, 103, 114, 117, 101, 110, 116, 59, 32768, 8802, 112, 67, 97, 112, 59, 32768, 8813, 111, 117, 98, 108, 101, 86, 101, 114, 116, 105, 99, 97, 108, 66, 97, 114, 59, 32768, 8742, 768, 108, 113, 120, 3319, 3327, 3345, 101, 109, 101, 110, 116, 59, 32768, 8713, 117, 97, 108, 512, 59, 84, 3335, 3337, 32768, 8800, 105, 108, 100, 101, 59, 32896, 8770, 824, 105, 115, 116, 115, 59, 32768, 8708, 114, 101, 97, 116, 101, 114, 1792, 59, 69, 70, 71, 76, 83, 84, 3373, 3375, 3382, 3394, 3404, 3410, 3423, 32768, 8815, 113, 117, 97, 108, 59, 32768, 8817, 117, 108, 108, 69, 113, 117, 97, 108, 59, 32896, 8807, 824, 114, 101, 97, 116, 101, 114, 59, 32896, 8811, 824, 101, 115, 115, 59, 32768, 8825, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32896, 10878, 824, 105, 108, 100, 101, 59, 32768, 8821, 117, 109, 112, 533, 3437, 3448, 111, 119, 110, 72, 117, 109, 112, 59, 32896, 8782, 824, 113, 117, 97, 108, 59, 32896, 8783, 824, 101, 512, 102, 115, 3461, 3492, 116, 84, 114, 105, 97, 110, 103, 108, 101, 768, 59, 66, 69, 3477, 3479, 3485, 32768, 8938, 97, 114, 59, 32896, 10703, 824, 113, 117, 97, 108, 59, 32768, 8940, 115, 1536, 59, 69, 71, 76, 83, 84, 3506, 3508, 3515, 3524, 3531, 3544, 32768, 8814, 113, 117, 97, 108, 59, 32768, 8816, 114, 101, 97, 116, 101, 114, 59, 32768, 8824, 101, 115, 115, 59, 32896, 8810, 824, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32896, 10877, 824, 105, 108, 100, 101, 59, 32768, 8820, 101, 115, 116, 101, 100, 512, 71, 76, 3561, 3578, 114, 101, 97, 116, 101, 114, 71, 114, 101, 97, 116, 101, 114, 59, 32896, 10914, 824, 101, 115, 115, 76, 101, 115, 115, 59, 32896, 10913, 824, 114, 101, 99, 101, 100, 101, 115, 768, 59, 69, 83, 3603, 3605, 3613, 32768, 8832, 113, 117, 97, 108, 59, 32896, 10927, 824, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32768, 8928, 512, 101, 105, 3630, 3645, 118, 101, 114, 115, 101, 69, 108, 101, 109, 101, 110, 116, 59, 32768, 8716, 103, 104, 116, 84, 114, 105, 97, 110, 103, 108, 101, 768, 59, 66, 69, 3663, 3665, 3671, 32768, 8939, 97, 114, 59, 32896, 10704, 824, 113, 117, 97, 108, 59, 32768, 8941, 512, 113, 117, 3683, 3732, 117, 97, 114, 101, 83, 117, 512, 98, 112, 3694, 3712, 115, 101, 116, 512, 59, 69, 3702, 3705, 32896, 8847, 824, 113, 117, 97, 108, 59, 32768, 8930, 101, 114, 115, 101, 116, 512, 59, 69, 3722, 3725, 32896, 8848, 824, 113, 117, 97, 108, 59, 32768, 8931, 768, 98, 99, 112, 3739, 3757, 3801, 115, 101, 116, 512, 59, 69, 3747, 3750, 32896, 8834, 8402, 113, 117, 97, 108, 59, 32768, 8840, 99, 101, 101, 100, 115, 1024, 59, 69, 83, 84, 3771, 3773, 3781, 3793, 32768, 8833, 113, 117, 97, 108, 59, 32896, 10928, 824, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32768, 8929, 105, 108, 100, 101, 59, 32896, 8831, 824, 101, 114, 115, 101, 116, 512, 59, 69, 3811, 3814, 32896, 8835, 8402, 113, 117, 97, 108, 59, 32768, 8841, 105, 108, 100, 101, 1024, 59, 69, 70, 84, 3834, 3836, 3843, 3854, 32768, 8769, 113, 117, 97, 108, 59, 32768, 8772, 117, 108, 108, 69, 113, 117, 97, 108, 59, 32768, 8775, 105, 108, 100, 101, 59, 32768, 8777, 101, 114, 116, 105, 99, 97, 108, 66, 97, 114, 59, 32768, 8740, 99, 114, 59, 32896, 55349, 56489, 105, 108, 100, 101, 33024, 209, 59, 32768, 209, 59, 32768, 925, 3584, 69, 97, 99, 100, 102, 103, 109, 111, 112, 114, 115, 116, 117, 118, 3921, 3927, 3936, 3951, 3958, 3963, 3972, 3996, 4002, 4034, 4037, 4055, 4071, 4078, 108, 105, 103, 59, 32768, 338, 99, 117, 116, 101, 33024, 211, 59, 32768, 211, 512, 105, 121, 3941, 3948, 114, 99, 33024, 212, 59, 32768, 212, 59, 32768, 1054, 98, 108, 97, 99, 59, 32768, 336, 114, 59, 32896, 55349, 56594, 114, 97, 118, 101, 33024, 210, 59, 32768, 210, 768, 97, 101, 105, 3979, 3984, 3989, 99, 114, 59, 32768, 332, 103, 97, 59, 32768, 937, 99, 114, 111, 110, 59, 32768, 927, 112, 102, 59, 32896, 55349, 56646, 101, 110, 67, 117, 114, 108, 121, 512, 68, 81, 4014, 4027, 111, 117, 98, 108, 101, 81, 117, 111, 116, 101, 59, 32768, 8220, 117, 111, 116, 101, 59, 32768, 8216, 59, 32768, 10836, 512, 99, 108, 4042, 4047, 114, 59, 32896, 55349, 56490, 97, 115, 104, 33024, 216, 59, 32768, 216, 105, 573, 4060, 4067, 100, 101, 33024, 213, 59, 32768, 213, 101, 115, 59, 32768, 10807, 109, 108, 33024, 214, 59, 32768, 214, 101, 114, 512, 66, 80, 4085, 4109, 512, 97, 114, 4090, 4094, 114, 59, 32768, 8254, 97, 99, 512, 101, 107, 4101, 4104, 59, 32768, 9182, 101, 116, 59, 32768, 9140, 97, 114, 101, 110, 116, 104, 101, 115, 105, 115, 59, 32768, 9180, 2304, 97, 99, 102, 104, 105, 108, 111, 114, 115, 4141, 4150, 4154, 4159, 4163, 4166, 4176, 4198, 4284, 114, 116, 105, 97, 108, 68, 59, 32768, 8706, 121, 59, 32768, 1055, 114, 59, 32896, 55349, 56595, 105, 59, 32768, 934, 59, 32768, 928, 117, 115, 77, 105, 110, 117, 115, 59, 32768, 177, 512, 105, 112, 4181, 4194, 110, 99, 97, 114, 101, 112, 108, 97, 110, 101, 59, 32768, 8460, 102, 59, 32768, 8473, 1024, 59, 101, 105, 111, 4207, 4209, 4251, 4256, 32768, 10939, 99, 101, 100, 101, 115, 1024, 59, 69, 83, 84, 4223, 4225, 4232, 4244, 32768, 8826, 113, 117, 97, 108, 59, 32768, 10927, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32768, 8828, 105, 108, 100, 101, 59, 32768, 8830, 109, 101, 59, 32768, 8243, 512, 100, 112, 4261, 4267, 117, 99, 116, 59, 32768, 8719, 111, 114, 116, 105, 111, 110, 512, 59, 97, 4278, 4280, 32768, 8759, 108, 59, 32768, 8733, 512, 99, 105, 4289, 4294, 114, 59, 32896, 55349, 56491, 59, 32768, 936, 1024, 85, 102, 111, 115, 4306, 4313, 4318, 4323, 79, 84, 33024, 34, 59, 32768, 34, 114, 59, 32896, 55349, 56596, 112, 102, 59, 32768, 8474, 99, 114, 59, 32896, 55349, 56492, 3072, 66, 69, 97, 99, 101, 102, 104, 105, 111, 114, 115, 117, 4354, 4360, 4366, 4395, 4417, 4473, 4477, 4481, 4743, 4764, 4776, 4788, 97, 114, 114, 59, 32768, 10512, 71, 33024, 174, 59, 32768, 174, 768, 99, 110, 114, 4373, 4379, 4383, 117, 116, 101, 59, 32768, 340, 103, 59, 32768, 10219, 114, 512, 59, 116, 4389, 4391, 32768, 8608, 108, 59, 32768, 10518, 768, 97, 101, 121, 4402, 4408, 4414, 114, 111, 110, 59, 32768, 344, 100, 105, 108, 59, 32768, 342, 59, 32768, 1056, 512, 59, 118, 4422, 4424, 32768, 8476, 101, 114, 115, 101, 512, 69, 85, 4433, 4458, 512, 108, 113, 4438, 4446, 101, 109, 101, 110, 116, 59, 32768, 8715, 117, 105, 108, 105, 98, 114, 105, 117, 109, 59, 32768, 8651, 112, 69, 113, 117, 105, 108, 105, 98, 114, 105, 117, 109, 59, 32768, 10607, 114, 59, 32768, 8476, 111, 59, 32768, 929, 103, 104, 116, 2048, 65, 67, 68, 70, 84, 85, 86, 97, 4501, 4547, 4556, 4607, 4614, 4671, 4719, 4736, 512, 110, 114, 4506, 4519, 103, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 32768, 10217, 114, 111, 119, 768, 59, 66, 76, 4529, 4531, 4536, 32768, 8594, 97, 114, 59, 32768, 8677, 101, 102, 116, 65, 114, 114, 111, 119, 59, 32768, 8644, 101, 105, 108, 105, 110, 103, 59, 32768, 8969, 111, 838, 4562, 0, 4575, 98, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 32768, 10215, 110, 805, 4580, 0, 4591, 101, 101, 86, 101, 99, 116, 111, 114, 59, 32768, 10589, 101, 99, 116, 111, 114, 512, 59, 66, 4600, 4602, 32768, 8642, 97, 114, 59, 32768, 10581, 108, 111, 111, 114, 59, 32768, 8971, 512, 101, 114, 4619, 4644, 101, 768, 59, 65, 86, 4627, 4629, 4636, 32768, 8866, 114, 114, 111, 119, 59, 32768, 8614, 101, 99, 116, 111, 114, 59, 32768, 10587, 105, 97, 110, 103, 108, 101, 768, 59, 66, 69, 4657, 4659, 4664, 32768, 8883, 97, 114, 59, 32768, 10704, 113, 117, 97, 108, 59, 32768, 8885, 112, 768, 68, 84, 86, 4679, 4691, 4702, 111, 119, 110, 86, 101, 99, 116, 111, 114, 59, 32768, 10575, 101, 101, 86, 101, 99, 116, 111, 114, 59, 32768, 10588, 101, 99, 116, 111, 114, 512, 59, 66, 4712, 4714, 32768, 8638, 97, 114, 59, 32768, 10580, 101, 99, 116, 111, 114, 512, 59, 66, 4729, 4731, 32768, 8640, 97, 114, 59, 32768, 10579, 114, 114, 111, 119, 59, 32768, 8658, 512, 112, 117, 4748, 4752, 102, 59, 32768, 8477, 110, 100, 73, 109, 112, 108, 105, 101, 115, 59, 32768, 10608, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8667, 512, 99, 104, 4781, 4785, 114, 59, 32768, 8475, 59, 32768, 8625, 108, 101, 68, 101, 108, 97, 121, 101, 100, 59, 32768, 10740, 3328, 72, 79, 97, 99, 102, 104, 105, 109, 111, 113, 115, 116, 117, 4827, 4842, 4849, 4856, 4889, 4894, 4949, 4955, 4967, 4973, 5059, 5065, 5070, 512, 67, 99, 4832, 4838, 72, 99, 121, 59, 32768, 1065, 121, 59, 32768, 1064, 70, 84, 99, 121, 59, 32768, 1068, 99, 117, 116, 101, 59, 32768, 346, 1280, 59, 97, 101, 105, 121, 4867, 4869, 4875, 4881, 4886, 32768, 10940, 114, 111, 110, 59, 32768, 352, 100, 105, 108, 59, 32768, 350, 114, 99, 59, 32768, 348, 59, 32768, 1057, 114, 59, 32896, 55349, 56598, 111, 114, 116, 1024, 68, 76, 82, 85, 4906, 4917, 4928, 4940, 111, 119, 110, 65, 114, 114, 111, 119, 59, 32768, 8595, 101, 102, 116, 65, 114, 114, 111, 119, 59, 32768, 8592, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 8594, 112, 65, 114, 114, 111, 119, 59, 32768, 8593, 103, 109, 97, 59, 32768, 931, 97, 108, 108, 67, 105, 114, 99, 108, 101, 59, 32768, 8728, 112, 102, 59, 32896, 55349, 56650, 1091, 4979, 0, 0, 4983, 116, 59, 32768, 8730, 97, 114, 101, 1024, 59, 73, 83, 85, 4994, 4996, 5010, 5052, 32768, 9633, 110, 116, 101, 114, 115, 101, 99, 116, 105, 111, 110, 59, 32768, 8851, 117, 512, 98, 112, 5016, 5033, 115, 101, 116, 512, 59, 69, 5024, 5026, 32768, 8847, 113, 117, 97, 108, 59, 32768, 8849, 101, 114, 115, 101, 116, 512, 59, 69, 5043, 5045, 32768, 8848, 113, 117, 97, 108, 59, 32768, 8850, 110, 105, 111, 110, 59, 32768, 8852, 99, 114, 59, 32896, 55349, 56494, 97, 114, 59, 32768, 8902, 1024, 98, 99, 109, 112, 5079, 5102, 5155, 5158, 512, 59, 115, 5084, 5086, 32768, 8912, 101, 116, 512, 59, 69, 5093, 5095, 32768, 8912, 113, 117, 97, 108, 59, 32768, 8838, 512, 99, 104, 5107, 5148, 101, 101, 100, 115, 1024, 59, 69, 83, 84, 5120, 5122, 5129, 5141, 32768, 8827, 113, 117, 97, 108, 59, 32768, 10928, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 32768, 8829, 105, 108, 100, 101, 59, 32768, 8831, 84, 104, 97, 116, 59, 32768, 8715, 59, 32768, 8721, 768, 59, 101, 115, 5165, 5167, 5185, 32768, 8913, 114, 115, 101, 116, 512, 59, 69, 5176, 5178, 32768, 8835, 113, 117, 97, 108, 59, 32768, 8839, 101, 116, 59, 32768, 8913, 2816, 72, 82, 83, 97, 99, 102, 104, 105, 111, 114, 115, 5213, 5221, 5227, 5241, 5252, 5274, 5279, 5323, 5362, 5368, 5378, 79, 82, 78, 33024, 222, 59, 32768, 222, 65, 68, 69, 59, 32768, 8482, 512, 72, 99, 5232, 5237, 99, 121, 59, 32768, 1035, 121, 59, 32768, 1062, 512, 98, 117, 5246, 5249, 59, 32768, 9, 59, 32768, 932, 768, 97, 101, 121, 5259, 5265, 5271, 114, 111, 110, 59, 32768, 356, 100, 105, 108, 59, 32768, 354, 59, 32768, 1058, 114, 59, 32896, 55349, 56599, 512, 101, 105, 5284, 5300, 835, 5289, 0, 5297, 101, 102, 111, 114, 101, 59, 32768, 8756, 97, 59, 32768, 920, 512, 99, 110, 5305, 5315, 107, 83, 112, 97, 99, 101, 59, 32896, 8287, 8202, 83, 112, 97, 99, 101, 59, 32768, 8201, 108, 100, 101, 1024, 59, 69, 70, 84, 5335, 5337, 5344, 5355, 32768, 8764, 113, 117, 97, 108, 59, 32768, 8771, 117, 108, 108, 69, 113, 117, 97, 108, 59, 32768, 8773, 105, 108, 100, 101, 59, 32768, 8776, 112, 102, 59, 32896, 55349, 56651, 105, 112, 108, 101, 68, 111, 116, 59, 32768, 8411, 512, 99, 116, 5383, 5388, 114, 59, 32896, 55349, 56495, 114, 111, 107, 59, 32768, 358, 5426, 5417, 5444, 5458, 5473, 0, 5480, 5485, 0, 0, 0, 0, 0, 5494, 5500, 5564, 5579, 0, 5726, 5732, 5738, 5745, 512, 99, 114, 5421, 5429, 117, 116, 101, 33024, 218, 59, 32768, 218, 114, 512, 59, 111, 5435, 5437, 32768, 8607, 99, 105, 114, 59, 32768, 10569, 114, 820, 5449, 0, 5453, 121, 59, 32768, 1038, 118, 101, 59, 32768, 364, 512, 105, 121, 5462, 5469, 114, 99, 33024, 219, 59, 32768, 219, 59, 32768, 1059, 98, 108, 97, 99, 59, 32768, 368, 114, 59, 32896, 55349, 56600, 114, 97, 118, 101, 33024, 217, 59, 32768, 217, 97, 99, 114, 59, 32768, 362, 512, 100, 105, 5504, 5548, 101, 114, 512, 66, 80, 5511, 5535, 512, 97, 114, 5516, 5520, 114, 59, 32768, 95, 97, 99, 512, 101, 107, 5527, 5530, 59, 32768, 9183, 101, 116, 59, 32768, 9141, 97, 114, 101, 110, 116, 104, 101, 115, 105, 115, 59, 32768, 9181, 111, 110, 512, 59, 80, 5555, 5557, 32768, 8899, 108, 117, 115, 59, 32768, 8846, 512, 103, 112, 5568, 5573, 111, 110, 59, 32768, 370, 102, 59, 32896, 55349, 56652, 2048, 65, 68, 69, 84, 97, 100, 112, 115, 5595, 5624, 5635, 5648, 5664, 5671, 5682, 5712, 114, 114, 111, 119, 768, 59, 66, 68, 5606, 5608, 5613, 32768, 8593, 97, 114, 59, 32768, 10514, 111, 119, 110, 65, 114, 114, 111, 119, 59, 32768, 8645, 111, 119, 110, 65, 114, 114, 111, 119, 59, 32768, 8597, 113, 117, 105, 108, 105, 98, 114, 105, 117, 109, 59, 32768, 10606, 101, 101, 512, 59, 65, 5655, 5657, 32768, 8869, 114, 114, 111, 119, 59, 32768, 8613, 114, 114, 111, 119, 59, 32768, 8657, 111, 119, 110, 97, 114, 114, 111, 119, 59, 32768, 8661, 101, 114, 512, 76, 82, 5689, 5700, 101, 102, 116, 65, 114, 114, 111, 119, 59, 32768, 8598, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 32768, 8599, 105, 512, 59, 108, 5718, 5720, 32768, 978, 111, 110, 59, 32768, 933, 105, 110, 103, 59, 32768, 366, 99, 114, 59, 32896, 55349, 56496, 105, 108, 100, 101, 59, 32768, 360, 109, 108, 33024, 220, 59, 32768, 220, 2304, 68, 98, 99, 100, 101, 102, 111, 115, 118, 5770, 5776, 5781, 5785, 5798, 5878, 5883, 5889, 5895, 97, 115, 104, 59, 32768, 8875, 97, 114, 59, 32768, 10987, 121, 59, 32768, 1042, 97, 115, 104, 512, 59, 108, 5793, 5795, 32768, 8873, 59, 32768, 10982, 512, 101, 114, 5803, 5806, 59, 32768, 8897, 768, 98, 116, 121, 5813, 5818, 5866, 97, 114, 59, 32768, 8214, 512, 59, 105, 5823, 5825, 32768, 8214, 99, 97, 108, 1024, 66, 76, 83, 84, 5837, 5842, 5848, 5859, 97, 114, 59, 32768, 8739, 105, 110, 101, 59, 32768, 124, 101, 112, 97, 114, 97, 116, 111, 114, 59, 32768, 10072, 105, 108, 100, 101, 59, 32768, 8768, 84, 104, 105, 110, 83, 112, 97, 99, 101, 59, 32768, 8202, 114, 59, 32896, 55349, 56601, 112, 102, 59, 32896, 55349, 56653, 99, 114, 59, 32896, 55349, 56497, 100, 97, 115, 104, 59, 32768, 8874, 1280, 99, 101, 102, 111, 115, 5913, 5919, 5925, 5930, 5936, 105, 114, 99, 59, 32768, 372, 100, 103, 101, 59, 32768, 8896, 114, 59, 32896, 55349, 56602, 112, 102, 59, 32896, 55349, 56654, 99, 114, 59, 32896, 55349, 56498, 1024, 102, 105, 111, 115, 5951, 5956, 5959, 5965, 114, 59, 32896, 55349, 56603, 59, 32768, 926, 112, 102, 59, 32896, 55349, 56655, 99, 114, 59, 32896, 55349, 56499, 2304, 65, 73, 85, 97, 99, 102, 111, 115, 117, 5990, 5995, 6e3, 6005, 6014, 6027, 6032, 6038, 6044, 99, 121, 59, 32768, 1071, 99, 121, 59, 32768, 1031, 99, 121, 59, 32768, 1070, 99, 117, 116, 101, 33024, 221, 59, 32768, 221, 512, 105, 121, 6019, 6024, 114, 99, 59, 32768, 374, 59, 32768, 1067, 114, 59, 32896, 55349, 56604, 112, 102, 59, 32896, 55349, 56656, 99, 114, 59, 32896, 55349, 56500, 109, 108, 59, 32768, 376, 2048, 72, 97, 99, 100, 101, 102, 111, 115, 6066, 6071, 6078, 6092, 6097, 6119, 6123, 6128, 99, 121, 59, 32768, 1046, 99, 117, 116, 101, 59, 32768, 377, 512, 97, 121, 6083, 6089, 114, 111, 110, 59, 32768, 381, 59, 32768, 1047, 111, 116, 59, 32768, 379, 835, 6102, 0, 6116, 111, 87, 105, 100, 116, 104, 83, 112, 97, 99, 101, 59, 32768, 8203, 97, 59, 32768, 918, 114, 59, 32768, 8488, 112, 102, 59, 32768, 8484, 99, 114, 59, 32896, 55349, 56501, 5938, 6159, 6168, 6175, 0, 6214, 6222, 6233, 0, 0, 0, 0, 6242, 6267, 6290, 6429, 6444, 0, 6495, 6503, 6531, 6540, 0, 6547, 99, 117, 116, 101, 33024, 225, 59, 32768, 225, 114, 101, 118, 101, 59, 32768, 259, 1536, 59, 69, 100, 105, 117, 121, 6187, 6189, 6193, 6196, 6203, 6210, 32768, 8766, 59, 32896, 8766, 819, 59, 32768, 8767, 114, 99, 33024, 226, 59, 32768, 226, 116, 101, 33024, 180, 59, 32768, 180, 59, 32768, 1072, 108, 105, 103, 33024, 230, 59, 32768, 230, 512, 59, 114, 6226, 6228, 32768, 8289, 59, 32896, 55349, 56606, 114, 97, 118, 101, 33024, 224, 59, 32768, 224, 512, 101, 112, 6246, 6261, 512, 102, 112, 6251, 6257, 115, 121, 109, 59, 32768, 8501, 104, 59, 32768, 8501, 104, 97, 59, 32768, 945, 512, 97, 112, 6271, 6284, 512, 99, 108, 6276, 6280, 114, 59, 32768, 257, 103, 59, 32768, 10815, 33024, 38, 59, 32768, 38, 1077, 6295, 0, 0, 6326, 1280, 59, 97, 100, 115, 118, 6305, 6307, 6312, 6315, 6322, 32768, 8743, 110, 100, 59, 32768, 10837, 59, 32768, 10844, 108, 111, 112, 101, 59, 32768, 10840, 59, 32768, 10842, 1792, 59, 101, 108, 109, 114, 115, 122, 6340, 6342, 6345, 6349, 6391, 6410, 6422, 32768, 8736, 59, 32768, 10660, 101, 59, 32768, 8736, 115, 100, 512, 59, 97, 6356, 6358, 32768, 8737, 2098, 6368, 6371, 6374, 6377, 6380, 6383, 6386, 6389, 59, 32768, 10664, 59, 32768, 10665, 59, 32768, 10666, 59, 32768, 10667, 59, 32768, 10668, 59, 32768, 10669, 59, 32768, 10670, 59, 32768, 10671, 116, 512, 59, 118, 6397, 6399, 32768, 8735, 98, 512, 59, 100, 6405, 6407, 32768, 8894, 59, 32768, 10653, 512, 112, 116, 6415, 6419, 104, 59, 32768, 8738, 59, 32768, 197, 97, 114, 114, 59, 32768, 9084, 512, 103, 112, 6433, 6438, 111, 110, 59, 32768, 261, 102, 59, 32896, 55349, 56658, 1792, 59, 69, 97, 101, 105, 111, 112, 6458, 6460, 6463, 6469, 6472, 6476, 6480, 32768, 8776, 59, 32768, 10864, 99, 105, 114, 59, 32768, 10863, 59, 32768, 8778, 100, 59, 32768, 8779, 115, 59, 32768, 39, 114, 111, 120, 512, 59, 101, 6488, 6490, 32768, 8776, 113, 59, 32768, 8778, 105, 110, 103, 33024, 229, 59, 32768, 229, 768, 99, 116, 121, 6509, 6514, 6517, 114, 59, 32896, 55349, 56502, 59, 32768, 42, 109, 112, 512, 59, 101, 6524, 6526, 32768, 8776, 113, 59, 32768, 8781, 105, 108, 100, 101, 33024, 227, 59, 32768, 227, 109, 108, 33024, 228, 59, 32768, 228, 512, 99, 105, 6551, 6559, 111, 110, 105, 110, 116, 59, 32768, 8755, 110, 116, 59, 32768, 10769, 4096, 78, 97, 98, 99, 100, 101, 102, 105, 107, 108, 110, 111, 112, 114, 115, 117, 6597, 6602, 6673, 6688, 6701, 6707, 6768, 6773, 6891, 6898, 6999, 7023, 7309, 7316, 7334, 7383, 111, 116, 59, 32768, 10989, 512, 99, 114, 6607, 6652, 107, 1024, 99, 101, 112, 115, 6617, 6623, 6632, 6639, 111, 110, 103, 59, 32768, 8780, 112, 115, 105, 108, 111, 110, 59, 32768, 1014, 114, 105, 109, 101, 59, 32768, 8245, 105, 109, 512, 59, 101, 6646, 6648, 32768, 8765, 113, 59, 32768, 8909, 583, 6656, 6661, 101, 101, 59, 32768, 8893, 101, 100, 512, 59, 103, 6667, 6669, 32768, 8965, 101, 59, 32768, 8965, 114, 107, 512, 59, 116, 6680, 6682, 32768, 9141, 98, 114, 107, 59, 32768, 9142, 512, 111, 121, 6693, 6698, 110, 103, 59, 32768, 8780, 59, 32768, 1073, 113, 117, 111, 59, 32768, 8222, 1280, 99, 109, 112, 114, 116, 6718, 6731, 6738, 6743, 6749, 97, 117, 115, 512, 59, 101, 6726, 6728, 32768, 8757, 59, 32768, 8757, 112, 116, 121, 118, 59, 32768, 10672, 115, 105, 59, 32768, 1014, 110, 111, 117, 59, 32768, 8492, 768, 97, 104, 119, 6756, 6759, 6762, 59, 32768, 946, 59, 32768, 8502, 101, 101, 110, 59, 32768, 8812, 114, 59, 32896, 55349, 56607, 103, 1792, 99, 111, 115, 116, 117, 118, 119, 6789, 6809, 6834, 6850, 6872, 6879, 6884, 768, 97, 105, 117, 6796, 6800, 6805, 112, 59, 32768, 8898, 114, 99, 59, 32768, 9711, 112, 59, 32768, 8899, 768, 100, 112, 116, 6816, 6821, 6827, 111, 116, 59, 32768, 10752, 108, 117, 115, 59, 32768, 10753, 105, 109, 101, 115, 59, 32768, 10754, 1090, 6840, 0, 0, 6846, 99, 117, 112, 59, 32768, 10758, 97, 114, 59, 32768, 9733, 114, 105, 97, 110, 103, 108, 101, 512, 100, 117, 6862, 6868, 111, 119, 110, 59, 32768, 9661, 112, 59, 32768, 9651, 112, 108, 117, 115, 59, 32768, 10756, 101, 101, 59, 32768, 8897, 101, 100, 103, 101, 59, 32768, 8896, 97, 114, 111, 119, 59, 32768, 10509, 768, 97, 107, 111, 6905, 6976, 6994, 512, 99, 110, 6910, 6972, 107, 768, 108, 115, 116, 6918, 6927, 6935, 111, 122, 101, 110, 103, 101, 59, 32768, 10731, 113, 117, 97, 114, 101, 59, 32768, 9642, 114, 105, 97, 110, 103, 108, 101, 1024, 59, 100, 108, 114, 6951, 6953, 6959, 6965, 32768, 9652, 111, 119, 110, 59, 32768, 9662, 101, 102, 116, 59, 32768, 9666, 105, 103, 104, 116, 59, 32768, 9656, 107, 59, 32768, 9251, 770, 6981, 0, 6991, 771, 6985, 0, 6988, 59, 32768, 9618, 59, 32768, 9617, 52, 59, 32768, 9619, 99, 107, 59, 32768, 9608, 512, 101, 111, 7004, 7019, 512, 59, 113, 7009, 7012, 32896, 61, 8421, 117, 105, 118, 59, 32896, 8801, 8421, 116, 59, 32768, 8976, 1024, 112, 116, 119, 120, 7032, 7037, 7049, 7055, 102, 59, 32896, 55349, 56659, 512, 59, 116, 7042, 7044, 32768, 8869, 111, 109, 59, 32768, 8869, 116, 105, 101, 59, 32768, 8904, 3072, 68, 72, 85, 86, 98, 100, 104, 109, 112, 116, 117, 118, 7080, 7101, 7126, 7147, 7182, 7187, 7208, 7233, 7240, 7246, 7253, 7274, 1024, 76, 82, 108, 114, 7089, 7092, 7095, 7098, 59, 32768, 9559, 59, 32768, 9556, 59, 32768, 9558, 59, 32768, 9555, 1280, 59, 68, 85, 100, 117, 7112, 7114, 7117, 7120, 7123, 32768, 9552, 59, 32768, 9574, 59, 32768, 9577, 59, 32768, 9572, 59, 32768, 9575, 1024, 76, 82, 108, 114, 7135, 7138, 7141, 7144, 59, 32768, 9565, 59, 32768, 9562, 59, 32768, 9564, 59, 32768, 9561, 1792, 59, 72, 76, 82, 104, 108, 114, 7162, 7164, 7167, 7170, 7173, 7176, 7179, 32768, 9553, 59, 32768, 9580, 59, 32768, 9571, 59, 32768, 9568, 59, 32768, 9579, 59, 32768, 9570, 59, 32768, 9567, 111, 120, 59, 32768, 10697, 1024, 76, 82, 108, 114, 7196, 7199, 7202, 7205, 59, 32768, 9557, 59, 32768, 9554, 59, 32768, 9488, 59, 32768, 9484, 1280, 59, 68, 85, 100, 117, 7219, 7221, 7224, 7227, 7230, 32768, 9472, 59, 32768, 9573, 59, 32768, 9576, 59, 32768, 9516, 59, 32768, 9524, 105, 110, 117, 115, 59, 32768, 8863, 108, 117, 115, 59, 32768, 8862, 105, 109, 101, 115, 59, 32768, 8864, 1024, 76, 82, 108, 114, 7262, 7265, 7268, 7271, 59, 32768, 9563, 59, 32768, 9560, 59, 32768, 9496, 59, 32768, 9492, 1792, 59, 72, 76, 82, 104, 108, 114, 7289, 7291, 7294, 7297, 7300, 7303, 7306, 32768, 9474, 59, 32768, 9578, 59, 32768, 9569, 59, 32768, 9566, 59, 32768, 9532, 59, 32768, 9508, 59, 32768, 9500, 114, 105, 109, 101, 59, 32768, 8245, 512, 101, 118, 7321, 7326, 118, 101, 59, 32768, 728, 98, 97, 114, 33024, 166, 59, 32768, 166, 1024, 99, 101, 105, 111, 7343, 7348, 7353, 7364, 114, 59, 32896, 55349, 56503, 109, 105, 59, 32768, 8271, 109, 512, 59, 101, 7359, 7361, 32768, 8765, 59, 32768, 8909, 108, 768, 59, 98, 104, 7372, 7374, 7377, 32768, 92, 59, 32768, 10693, 115, 117, 98, 59, 32768, 10184, 573, 7387, 7399, 108, 512, 59, 101, 7392, 7394, 32768, 8226, 116, 59, 32768, 8226, 112, 768, 59, 69, 101, 7406, 7408, 7411, 32768, 8782, 59, 32768, 10926, 512, 59, 113, 7416, 7418, 32768, 8783, 59, 32768, 8783, 6450, 7448, 0, 7523, 7571, 7576, 7613, 0, 7618, 7647, 0, 0, 7764, 0, 0, 7779, 0, 0, 7899, 7914, 7949, 7955, 0, 8158, 0, 8176, 768, 99, 112, 114, 7454, 7460, 7509, 117, 116, 101, 59, 32768, 263, 1536, 59, 97, 98, 99, 100, 115, 7473, 7475, 7480, 7487, 7500, 7505, 32768, 8745, 110, 100, 59, 32768, 10820, 114, 99, 117, 112, 59, 32768, 10825, 512, 97, 117, 7492, 7496, 112, 59, 32768, 10827, 112, 59, 32768, 10823, 111, 116, 59, 32768, 10816, 59, 32896, 8745, 65024, 512, 101, 111, 7514, 7518, 116, 59, 32768, 8257, 110, 59, 32768, 711, 1024, 97, 101, 105, 117, 7531, 7544, 7552, 7557, 833, 7536, 0, 7540, 115, 59, 32768, 10829, 111, 110, 59, 32768, 269, 100, 105, 108, 33024, 231, 59, 32768, 231, 114, 99, 59, 32768, 265, 112, 115, 512, 59, 115, 7564, 7566, 32768, 10828, 109, 59, 32768, 10832, 111, 116, 59, 32768, 267, 768, 100, 109, 110, 7582, 7589, 7596, 105, 108, 33024, 184, 59, 32768, 184, 112, 116, 121, 118, 59, 32768, 10674, 116, 33280, 162, 59, 101, 7603, 7605, 32768, 162, 114, 100, 111, 116, 59, 32768, 183, 114, 59, 32896, 55349, 56608, 768, 99, 101, 105, 7624, 7628, 7643, 121, 59, 32768, 1095, 99, 107, 512, 59, 109, 7635, 7637, 32768, 10003, 97, 114, 107, 59, 32768, 10003, 59, 32768, 967, 114, 1792, 59, 69, 99, 101, 102, 109, 115, 7662, 7664, 7667, 7742, 7745, 7752, 7757, 32768, 9675, 59, 32768, 10691, 768, 59, 101, 108, 7674, 7676, 7680, 32768, 710, 113, 59, 32768, 8791, 101, 1074, 7687, 0, 0, 7709, 114, 114, 111, 119, 512, 108, 114, 7695, 7701, 101, 102, 116, 59, 32768, 8634, 105, 103, 104, 116, 59, 32768, 8635, 1280, 82, 83, 97, 99, 100, 7719, 7722, 7725, 7730, 7736, 59, 32768, 174, 59, 32768, 9416, 115, 116, 59, 32768, 8859, 105, 114, 99, 59, 32768, 8858, 97, 115, 104, 59, 32768, 8861, 59, 32768, 8791, 110, 105, 110, 116, 59, 32768, 10768, 105, 100, 59, 32768, 10991, 99, 105, 114, 59, 32768, 10690, 117, 98, 115, 512, 59, 117, 7771, 7773, 32768, 9827, 105, 116, 59, 32768, 9827, 1341, 7785, 7804, 7850, 0, 7871, 111, 110, 512, 59, 101, 7791, 7793, 32768, 58, 512, 59, 113, 7798, 7800, 32768, 8788, 59, 32768, 8788, 1086, 7809, 0, 0, 7820, 97, 512, 59, 116, 7814, 7816, 32768, 44, 59, 32768, 64, 768, 59, 102, 108, 7826, 7828, 7832, 32768, 8705, 110, 59, 32768, 8728, 101, 512, 109, 120, 7838, 7844, 101, 110, 116, 59, 32768, 8705, 101, 115, 59, 32768, 8450, 824, 7854, 0, 7866, 512, 59, 100, 7858, 7860, 32768, 8773, 111, 116, 59, 32768, 10861, 110, 116, 59, 32768, 8750, 768, 102, 114, 121, 7877, 7881, 7886, 59, 32896, 55349, 56660, 111, 100, 59, 32768, 8720, 33280, 169, 59, 115, 7892, 7894, 32768, 169, 114, 59, 32768, 8471, 512, 97, 111, 7903, 7908, 114, 114, 59, 32768, 8629, 115, 115, 59, 32768, 10007, 512, 99, 117, 7918, 7923, 114, 59, 32896, 55349, 56504, 512, 98, 112, 7928, 7938, 512, 59, 101, 7933, 7935, 32768, 10959, 59, 32768, 10961, 512, 59, 101, 7943, 7945, 32768, 10960, 59, 32768, 10962, 100, 111, 116, 59, 32768, 8943, 1792, 100, 101, 108, 112, 114, 118, 119, 7969, 7983, 7996, 8009, 8057, 8147, 8152, 97, 114, 114, 512, 108, 114, 7977, 7980, 59, 32768, 10552, 59, 32768, 10549, 1089, 7989, 0, 0, 7993, 114, 59, 32768, 8926, 99, 59, 32768, 8927, 97, 114, 114, 512, 59, 112, 8004, 8006, 32768, 8630, 59, 32768, 10557, 1536, 59, 98, 99, 100, 111, 115, 8022, 8024, 8031, 8044, 8049, 8053, 32768, 8746, 114, 99, 97, 112, 59, 32768, 10824, 512, 97, 117, 8036, 8040, 112, 59, 32768, 10822, 112, 59, 32768, 10826, 111, 116, 59, 32768, 8845, 114, 59, 32768, 10821, 59, 32896, 8746, 65024, 1024, 97, 108, 114, 118, 8066, 8078, 8116, 8123, 114, 114, 512, 59, 109, 8073, 8075, 32768, 8631, 59, 32768, 10556, 121, 768, 101, 118, 119, 8086, 8104, 8109, 113, 1089, 8093, 0, 0, 8099, 114, 101, 99, 59, 32768, 8926, 117, 99, 99, 59, 32768, 8927, 101, 101, 59, 32768, 8910, 101, 100, 103, 101, 59, 32768, 8911, 101, 110, 33024, 164, 59, 32768, 164, 101, 97, 114, 114, 111, 119, 512, 108, 114, 8134, 8140, 101, 102, 116, 59, 32768, 8630, 105, 103, 104, 116, 59, 32768, 8631, 101, 101, 59, 32768, 8910, 101, 100, 59, 32768, 8911, 512, 99, 105, 8162, 8170, 111, 110, 105, 110, 116, 59, 32768, 8754, 110, 116, 59, 32768, 8753, 108, 99, 116, 121, 59, 32768, 9005, 4864, 65, 72, 97, 98, 99, 100, 101, 102, 104, 105, 106, 108, 111, 114, 115, 116, 117, 119, 122, 8221, 8226, 8231, 8267, 8282, 8296, 8327, 8351, 8366, 8379, 8466, 8471, 8487, 8621, 8647, 8676, 8697, 8712, 8720, 114, 114, 59, 32768, 8659, 97, 114, 59, 32768, 10597, 1024, 103, 108, 114, 115, 8240, 8246, 8252, 8256, 103, 101, 114, 59, 32768, 8224, 101, 116, 104, 59, 32768, 8504, 114, 59, 32768, 8595, 104, 512, 59, 118, 8262, 8264, 32768, 8208, 59, 32768, 8867, 572, 8271, 8278, 97, 114, 111, 119, 59, 32768, 10511, 97, 99, 59, 32768, 733, 512, 97, 121, 8287, 8293, 114, 111, 110, 59, 32768, 271, 59, 32768, 1076, 768, 59, 97, 111, 8303, 8305, 8320, 32768, 8518, 512, 103, 114, 8310, 8316, 103, 101, 114, 59, 32768, 8225, 114, 59, 32768, 8650, 116, 115, 101, 113, 59, 32768, 10871, 768, 103, 108, 109, 8334, 8339, 8344, 33024, 176, 59, 32768, 176, 116, 97, 59, 32768, 948, 112, 116, 121, 118, 59, 32768, 10673, 512, 105, 114, 8356, 8362, 115, 104, 116, 59, 32768, 10623, 59, 32896, 55349, 56609, 97, 114, 512, 108, 114, 8373, 8376, 59, 32768, 8643, 59, 32768, 8642, 1280, 97, 101, 103, 115, 118, 8390, 8418, 8421, 8428, 8433, 109, 768, 59, 111, 115, 8398, 8400, 8415, 32768, 8900, 110, 100, 512, 59, 115, 8407, 8409, 32768, 8900, 117, 105, 116, 59, 32768, 9830, 59, 32768, 9830, 59, 32768, 168, 97, 109, 109, 97, 59, 32768, 989, 105, 110, 59, 32768, 8946, 768, 59, 105, 111, 8440, 8442, 8461, 32768, 247, 100, 101, 33280, 247, 59, 111, 8450, 8452, 32768, 247, 110, 116, 105, 109, 101, 115, 59, 32768, 8903, 110, 120, 59, 32768, 8903, 99, 121, 59, 32768, 1106, 99, 1088, 8478, 0, 0, 8483, 114, 110, 59, 32768, 8990, 111, 112, 59, 32768, 8973, 1280, 108, 112, 116, 117, 119, 8498, 8504, 8509, 8556, 8570, 108, 97, 114, 59, 32768, 36, 102, 59, 32896, 55349, 56661, 1280, 59, 101, 109, 112, 115, 8520, 8522, 8535, 8542, 8548, 32768, 729, 113, 512, 59, 100, 8528, 8530, 32768, 8784, 111, 116, 59, 32768, 8785, 105, 110, 117, 115, 59, 32768, 8760, 108, 117, 115, 59, 32768, 8724, 113, 117, 97, 114, 101, 59, 32768, 8865, 98, 108, 101, 98, 97, 114, 119, 101, 100, 103, 101, 59, 32768, 8966, 110, 768, 97, 100, 104, 8578, 8585, 8597, 114, 114, 111, 119, 59, 32768, 8595, 111, 119, 110, 97, 114, 114, 111, 119, 115, 59, 32768, 8650, 97, 114, 112, 111, 111, 110, 512, 108, 114, 8608, 8614, 101, 102, 116, 59, 32768, 8643, 105, 103, 104, 116, 59, 32768, 8642, 563, 8625, 8633, 107, 97, 114, 111, 119, 59, 32768, 10512, 1088, 8638, 0, 0, 8643, 114, 110, 59, 32768, 8991, 111, 112, 59, 32768, 8972, 768, 99, 111, 116, 8654, 8666, 8670, 512, 114, 121, 8659, 8663, 59, 32896, 55349, 56505, 59, 32768, 1109, 108, 59, 32768, 10742, 114, 111, 107, 59, 32768, 273, 512, 100, 114, 8681, 8686, 111, 116, 59, 32768, 8945, 105, 512, 59, 102, 8692, 8694, 32768, 9663, 59, 32768, 9662, 512, 97, 104, 8702, 8707, 114, 114, 59, 32768, 8693, 97, 114, 59, 32768, 10607, 97, 110, 103, 108, 101, 59, 32768, 10662, 512, 99, 105, 8725, 8729, 121, 59, 32768, 1119, 103, 114, 97, 114, 114, 59, 32768, 10239, 4608, 68, 97, 99, 100, 101, 102, 103, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 120, 8774, 8788, 8807, 8844, 8849, 8852, 8866, 8895, 8929, 8977, 8989, 9004, 9046, 9136, 9151, 9171, 9184, 9199, 512, 68, 111, 8779, 8784, 111, 116, 59, 32768, 10871, 116, 59, 32768, 8785, 512, 99, 115, 8793, 8801, 117, 116, 101, 33024, 233, 59, 32768, 233, 116, 101, 114, 59, 32768, 10862, 1024, 97, 105, 111, 121, 8816, 8822, 8835, 8841, 114, 111, 110, 59, 32768, 283, 114, 512, 59, 99, 8828, 8830, 32768, 8790, 33024, 234, 59, 32768, 234, 108, 111, 110, 59, 32768, 8789, 59, 32768, 1101, 111, 116, 59, 32768, 279, 59, 32768, 8519, 512, 68, 114, 8857, 8862, 111, 116, 59, 32768, 8786, 59, 32896, 55349, 56610, 768, 59, 114, 115, 8873, 8875, 8883, 32768, 10906, 97, 118, 101, 33024, 232, 59, 32768, 232, 512, 59, 100, 8888, 8890, 32768, 10902, 111, 116, 59, 32768, 10904, 1024, 59, 105, 108, 115, 8904, 8906, 8914, 8917, 32768, 10905, 110, 116, 101, 114, 115, 59, 32768, 9191, 59, 32768, 8467, 512, 59, 100, 8922, 8924, 32768, 10901, 111, 116, 59, 32768, 10903, 768, 97, 112, 115, 8936, 8941, 8960, 99, 114, 59, 32768, 275, 116, 121, 768, 59, 115, 118, 8950, 8952, 8957, 32768, 8709, 101, 116, 59, 32768, 8709, 59, 32768, 8709, 112, 512, 49, 59, 8966, 8975, 516, 8970, 8973, 59, 32768, 8196, 59, 32768, 8197, 32768, 8195, 512, 103, 115, 8982, 8985, 59, 32768, 331, 112, 59, 32768, 8194, 512, 103, 112, 8994, 8999, 111, 110, 59, 32768, 281, 102, 59, 32896, 55349, 56662, 768, 97, 108, 115, 9011, 9023, 9028, 114, 512, 59, 115, 9017, 9019, 32768, 8917, 108, 59, 32768, 10723, 117, 115, 59, 32768, 10865, 105, 768, 59, 108, 118, 9036, 9038, 9043, 32768, 949, 111, 110, 59, 32768, 949, 59, 32768, 1013, 1024, 99, 115, 117, 118, 9055, 9071, 9099, 9128, 512, 105, 111, 9060, 9065, 114, 99, 59, 32768, 8790, 108, 111, 110, 59, 32768, 8789, 1082, 9077, 0, 0, 9081, 109, 59, 32768, 8770, 97, 110, 116, 512, 103, 108, 9088, 9093, 116, 114, 59, 32768, 10902, 101, 115, 115, 59, 32768, 10901, 768, 97, 101, 105, 9106, 9111, 9116, 108, 115, 59, 32768, 61, 115, 116, 59, 32768, 8799, 118, 512, 59, 68, 9122, 9124, 32768, 8801, 68, 59, 32768, 10872, 112, 97, 114, 115, 108, 59, 32768, 10725, 512, 68, 97, 9141, 9146, 111, 116, 59, 32768, 8787, 114, 114, 59, 32768, 10609, 768, 99, 100, 105, 9158, 9162, 9167, 114, 59, 32768, 8495, 111, 116, 59, 32768, 8784, 109, 59, 32768, 8770, 512, 97, 104, 9176, 9179, 59, 32768, 951, 33024, 240, 59, 32768, 240, 512, 109, 114, 9189, 9195, 108, 33024, 235, 59, 32768, 235, 111, 59, 32768, 8364, 768, 99, 105, 112, 9206, 9210, 9215, 108, 59, 32768, 33, 115, 116, 59, 32768, 8707, 512, 101, 111, 9220, 9230, 99, 116, 97, 116, 105, 111, 110, 59, 32768, 8496, 110, 101, 110, 116, 105, 97, 108, 101, 59, 32768, 8519, 4914, 9262, 0, 9276, 0, 9280, 9287, 0, 0, 9318, 9324, 0, 9331, 0, 9352, 9357, 9386, 0, 9395, 9497, 108, 108, 105, 110, 103, 100, 111, 116, 115, 101, 113, 59, 32768, 8786, 121, 59, 32768, 1092, 109, 97, 108, 101, 59, 32768, 9792, 768, 105, 108, 114, 9293, 9299, 9313, 108, 105, 103, 59, 32768, 64259, 1082, 9305, 0, 0, 9309, 103, 59, 32768, 64256, 105, 103, 59, 32768, 64260, 59, 32896, 55349, 56611, 108, 105, 103, 59, 32768, 64257, 108, 105, 103, 59, 32896, 102, 106, 768, 97, 108, 116, 9337, 9341, 9346, 116, 59, 32768, 9837, 105, 103, 59, 32768, 64258, 110, 115, 59, 32768, 9649, 111, 102, 59, 32768, 402, 833, 9361, 0, 9366, 102, 59, 32896, 55349, 56663, 512, 97, 107, 9370, 9375, 108, 108, 59, 32768, 8704, 512, 59, 118, 9380, 9382, 32768, 8916, 59, 32768, 10969, 97, 114, 116, 105, 110, 116, 59, 32768, 10765, 512, 97, 111, 9399, 9491, 512, 99, 115, 9404, 9487, 1794, 9413, 9443, 9453, 9470, 9474, 0, 9484, 1795, 9421, 9426, 9429, 9434, 9437, 0, 9440, 33024, 189, 59, 32768, 189, 59, 32768, 8531, 33024, 188, 59, 32768, 188, 59, 32768, 8533, 59, 32768, 8537, 59, 32768, 8539, 772, 9447, 0, 9450, 59, 32768, 8532, 59, 32768, 8534, 1285, 9459, 9464, 0, 0, 9467, 33024, 190, 59, 32768, 190, 59, 32768, 8535, 59, 32768, 8540, 53, 59, 32768, 8536, 775, 9478, 0, 9481, 59, 32768, 8538, 59, 32768, 8541, 56, 59, 32768, 8542, 108, 59, 32768, 8260, 119, 110, 59, 32768, 8994, 99, 114, 59, 32896, 55349, 56507, 4352, 69, 97, 98, 99, 100, 101, 102, 103, 105, 106, 108, 110, 111, 114, 115, 116, 118, 9537, 9547, 9575, 9582, 9595, 9600, 9679, 9684, 9694, 9700, 9705, 9725, 9773, 9779, 9785, 9810, 9917, 512, 59, 108, 9542, 9544, 32768, 8807, 59, 32768, 10892, 768, 99, 109, 112, 9554, 9560, 9572, 117, 116, 101, 59, 32768, 501, 109, 97, 512, 59, 100, 9567, 9569, 32768, 947, 59, 32768, 989, 59, 32768, 10886, 114, 101, 118, 101, 59, 32768, 287, 512, 105, 121, 9587, 9592, 114, 99, 59, 32768, 285, 59, 32768, 1075, 111, 116, 59, 32768, 289, 1024, 59, 108, 113, 115, 9609, 9611, 9614, 9633, 32768, 8805, 59, 32768, 8923, 768, 59, 113, 115, 9621, 9623, 9626, 32768, 8805, 59, 32768, 8807, 108, 97, 110, 116, 59, 32768, 10878, 1024, 59, 99, 100, 108, 9642, 9644, 9648, 9667, 32768, 10878, 99, 59, 32768, 10921, 111, 116, 512, 59, 111, 9655, 9657, 32768, 10880, 512, 59, 108, 9662, 9664, 32768, 10882, 59, 32768, 10884, 512, 59, 101, 9672, 9675, 32896, 8923, 65024, 115, 59, 32768, 10900, 114, 59, 32896, 55349, 56612, 512, 59, 103, 9689, 9691, 32768, 8811, 59, 32768, 8921, 109, 101, 108, 59, 32768, 8503, 99, 121, 59, 32768, 1107, 1024, 59, 69, 97, 106, 9714, 9716, 9719, 9722, 32768, 8823, 59, 32768, 10898, 59, 32768, 10917, 59, 32768, 10916, 1024, 69, 97, 101, 115, 9734, 9737, 9751, 9768, 59, 32768, 8809, 112, 512, 59, 112, 9743, 9745, 32768, 10890, 114, 111, 120, 59, 32768, 10890, 512, 59, 113, 9756, 9758, 32768, 10888, 512, 59, 113, 9763, 9765, 32768, 10888, 59, 32768, 8809, 105, 109, 59, 32768, 8935, 112, 102, 59, 32896, 55349, 56664, 97, 118, 101, 59, 32768, 96, 512, 99, 105, 9790, 9794, 114, 59, 32768, 8458, 109, 768, 59, 101, 108, 9802, 9804, 9807, 32768, 8819, 59, 32768, 10894, 59, 32768, 10896, 34304, 62, 59, 99, 100, 108, 113, 114, 9824, 9826, 9838, 9843, 9849, 9856, 32768, 62, 512, 99, 105, 9831, 9834, 59, 32768, 10919, 114, 59, 32768, 10874, 111, 116, 59, 32768, 8919, 80, 97, 114, 59, 32768, 10645, 117, 101, 115, 116, 59, 32768, 10876, 1280, 97, 100, 101, 108, 115, 9867, 9882, 9887, 9906, 9912, 833, 9872, 0, 9879, 112, 114, 111, 120, 59, 32768, 10886, 114, 59, 32768, 10616, 111, 116, 59, 32768, 8919, 113, 512, 108, 113, 9893, 9899, 101, 115, 115, 59, 32768, 8923, 108, 101, 115, 115, 59, 32768, 10892, 101, 115, 115, 59, 32768, 8823, 105, 109, 59, 32768, 8819, 512, 101, 110, 9922, 9932, 114, 116, 110, 101, 113, 113, 59, 32896, 8809, 65024, 69, 59, 32896, 8809, 65024, 2560, 65, 97, 98, 99, 101, 102, 107, 111, 115, 121, 9958, 9963, 10015, 10020, 10026, 10060, 10065, 10085, 10147, 10171, 114, 114, 59, 32768, 8660, 1024, 105, 108, 109, 114, 9972, 9978, 9982, 9988, 114, 115, 112, 59, 32768, 8202, 102, 59, 32768, 189, 105, 108, 116, 59, 32768, 8459, 512, 100, 114, 9993, 9998, 99, 121, 59, 32768, 1098, 768, 59, 99, 119, 10005, 10007, 10012, 32768, 8596, 105, 114, 59, 32768, 10568, 59, 32768, 8621, 97, 114, 59, 32768, 8463, 105, 114, 99, 59, 32768, 293, 768, 97, 108, 114, 10033, 10048, 10054, 114, 116, 115, 512, 59, 117, 10041, 10043, 32768, 9829, 105, 116, 59, 32768, 9829, 108, 105, 112, 59, 32768, 8230, 99, 111, 110, 59, 32768, 8889, 114, 59, 32896, 55349, 56613, 115, 512, 101, 119, 10071, 10078, 97, 114, 111, 119, 59, 32768, 10533, 97, 114, 111, 119, 59, 32768, 10534, 1280, 97, 109, 111, 112, 114, 10096, 10101, 10107, 10136, 10141, 114, 114, 59, 32768, 8703, 116, 104, 116, 59, 32768, 8763, 107, 512, 108, 114, 10113, 10124, 101, 102, 116, 97, 114, 114, 111, 119, 59, 32768, 8617, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8618, 102, 59, 32896, 55349, 56665, 98, 97, 114, 59, 32768, 8213, 768, 99, 108, 116, 10154, 10159, 10165, 114, 59, 32896, 55349, 56509, 97, 115, 104, 59, 32768, 8463, 114, 111, 107, 59, 32768, 295, 512, 98, 112, 10176, 10182, 117, 108, 108, 59, 32768, 8259, 104, 101, 110, 59, 32768, 8208, 5426, 10211, 0, 10220, 0, 10239, 10255, 10267, 0, 10276, 10312, 0, 0, 10318, 10371, 10458, 10485, 10491, 0, 10500, 10545, 10558, 99, 117, 116, 101, 33024, 237, 59, 32768, 237, 768, 59, 105, 121, 10226, 10228, 10235, 32768, 8291, 114, 99, 33024, 238, 59, 32768, 238, 59, 32768, 1080, 512, 99, 120, 10243, 10247, 121, 59, 32768, 1077, 99, 108, 33024, 161, 59, 32768, 161, 512, 102, 114, 10259, 10262, 59, 32768, 8660, 59, 32896, 55349, 56614, 114, 97, 118, 101, 33024, 236, 59, 32768, 236, 1024, 59, 105, 110, 111, 10284, 10286, 10300, 10306, 32768, 8520, 512, 105, 110, 10291, 10296, 110, 116, 59, 32768, 10764, 116, 59, 32768, 8749, 102, 105, 110, 59, 32768, 10716, 116, 97, 59, 32768, 8489, 108, 105, 103, 59, 32768, 307, 768, 97, 111, 112, 10324, 10361, 10365, 768, 99, 103, 116, 10331, 10335, 10357, 114, 59, 32768, 299, 768, 101, 108, 112, 10342, 10345, 10351, 59, 32768, 8465, 105, 110, 101, 59, 32768, 8464, 97, 114, 116, 59, 32768, 8465, 104, 59, 32768, 305, 102, 59, 32768, 8887, 101, 100, 59, 32768, 437, 1280, 59, 99, 102, 111, 116, 10381, 10383, 10389, 10403, 10409, 32768, 8712, 97, 114, 101, 59, 32768, 8453, 105, 110, 512, 59, 116, 10396, 10398, 32768, 8734, 105, 101, 59, 32768, 10717, 100, 111, 116, 59, 32768, 305, 1280, 59, 99, 101, 108, 112, 10420, 10422, 10427, 10444, 10451, 32768, 8747, 97, 108, 59, 32768, 8890, 512, 103, 114, 10432, 10438, 101, 114, 115, 59, 32768, 8484, 99, 97, 108, 59, 32768, 8890, 97, 114, 104, 107, 59, 32768, 10775, 114, 111, 100, 59, 32768, 10812, 1024, 99, 103, 112, 116, 10466, 10470, 10475, 10480, 121, 59, 32768, 1105, 111, 110, 59, 32768, 303, 102, 59, 32896, 55349, 56666, 97, 59, 32768, 953, 114, 111, 100, 59, 32768, 10812, 117, 101, 115, 116, 33024, 191, 59, 32768, 191, 512, 99, 105, 10504, 10509, 114, 59, 32896, 55349, 56510, 110, 1280, 59, 69, 100, 115, 118, 10521, 10523, 10526, 10531, 10541, 32768, 8712, 59, 32768, 8953, 111, 116, 59, 32768, 8949, 512, 59, 118, 10536, 10538, 32768, 8948, 59, 32768, 8947, 59, 32768, 8712, 512, 59, 105, 10549, 10551, 32768, 8290, 108, 100, 101, 59, 32768, 297, 828, 10562, 0, 10567, 99, 121, 59, 32768, 1110, 108, 33024, 239, 59, 32768, 239, 1536, 99, 102, 109, 111, 115, 117, 10585, 10598, 10603, 10609, 10615, 10630, 512, 105, 121, 10590, 10595, 114, 99, 59, 32768, 309, 59, 32768, 1081, 114, 59, 32896, 55349, 56615, 97, 116, 104, 59, 32768, 567, 112, 102, 59, 32896, 55349, 56667, 820, 10620, 0, 10625, 114, 59, 32896, 55349, 56511, 114, 99, 121, 59, 32768, 1112, 107, 99, 121, 59, 32768, 1108, 2048, 97, 99, 102, 103, 104, 106, 111, 115, 10653, 10666, 10680, 10685, 10692, 10697, 10702, 10708, 112, 112, 97, 512, 59, 118, 10661, 10663, 32768, 954, 59, 32768, 1008, 512, 101, 121, 10671, 10677, 100, 105, 108, 59, 32768, 311, 59, 32768, 1082, 114, 59, 32896, 55349, 56616, 114, 101, 101, 110, 59, 32768, 312, 99, 121, 59, 32768, 1093, 99, 121, 59, 32768, 1116, 112, 102, 59, 32896, 55349, 56668, 99, 114, 59, 32896, 55349, 56512, 5888, 65, 66, 69, 72, 97, 98, 99, 100, 101, 102, 103, 104, 106, 108, 109, 110, 111, 112, 114, 115, 116, 117, 118, 10761, 10783, 10789, 10799, 10804, 10957, 11011, 11047, 11094, 11349, 11372, 11382, 11409, 11414, 11451, 11478, 11526, 11698, 11711, 11755, 11823, 11910, 11929, 768, 97, 114, 116, 10768, 10773, 10777, 114, 114, 59, 32768, 8666, 114, 59, 32768, 8656, 97, 105, 108, 59, 32768, 10523, 97, 114, 114, 59, 32768, 10510, 512, 59, 103, 10794, 10796, 32768, 8806, 59, 32768, 10891, 97, 114, 59, 32768, 10594, 4660, 10824, 0, 10830, 0, 10838, 0, 0, 0, 0, 0, 10844, 10850, 0, 10867, 10870, 10877, 0, 10933, 117, 116, 101, 59, 32768, 314, 109, 112, 116, 121, 118, 59, 32768, 10676, 114, 97, 110, 59, 32768, 8466, 98, 100, 97, 59, 32768, 955, 103, 768, 59, 100, 108, 10857, 10859, 10862, 32768, 10216, 59, 32768, 10641, 101, 59, 32768, 10216, 59, 32768, 10885, 117, 111, 33024, 171, 59, 32768, 171, 114, 2048, 59, 98, 102, 104, 108, 112, 115, 116, 10894, 10896, 10907, 10911, 10915, 10919, 10923, 10928, 32768, 8592, 512, 59, 102, 10901, 10903, 32768, 8676, 115, 59, 32768, 10527, 115, 59, 32768, 10525, 107, 59, 32768, 8617, 112, 59, 32768, 8619, 108, 59, 32768, 10553, 105, 109, 59, 32768, 10611, 108, 59, 32768, 8610, 768, 59, 97, 101, 10939, 10941, 10946, 32768, 10923, 105, 108, 59, 32768, 10521, 512, 59, 115, 10951, 10953, 32768, 10925, 59, 32896, 10925, 65024, 768, 97, 98, 114, 10964, 10969, 10974, 114, 114, 59, 32768, 10508, 114, 107, 59, 32768, 10098, 512, 97, 107, 10979, 10991, 99, 512, 101, 107, 10985, 10988, 59, 32768, 123, 59, 32768, 91, 512, 101, 115, 10996, 10999, 59, 32768, 10635, 108, 512, 100, 117, 11005, 11008, 59, 32768, 10639, 59, 32768, 10637, 1024, 97, 101, 117, 121, 11020, 11026, 11040, 11044, 114, 111, 110, 59, 32768, 318, 512, 100, 105, 11031, 11036, 105, 108, 59, 32768, 316, 108, 59, 32768, 8968, 98, 59, 32768, 123, 59, 32768, 1083, 1024, 99, 113, 114, 115, 11056, 11060, 11072, 11090, 97, 59, 32768, 10550, 117, 111, 512, 59, 114, 11067, 11069, 32768, 8220, 59, 32768, 8222, 512, 100, 117, 11077, 11083, 104, 97, 114, 59, 32768, 10599, 115, 104, 97, 114, 59, 32768, 10571, 104, 59, 32768, 8626, 1280, 59, 102, 103, 113, 115, 11105, 11107, 11228, 11231, 11250, 32768, 8804, 116, 1280, 97, 104, 108, 114, 116, 11119, 11136, 11157, 11169, 11216, 114, 114, 111, 119, 512, 59, 116, 11128, 11130, 32768, 8592, 97, 105, 108, 59, 32768, 8610, 97, 114, 112, 111, 111, 110, 512, 100, 117, 11147, 11153, 111, 119, 110, 59, 32768, 8637, 112, 59, 32768, 8636, 101, 102, 116, 97, 114, 114, 111, 119, 115, 59, 32768, 8647, 105, 103, 104, 116, 768, 97, 104, 115, 11180, 11194, 11204, 114, 114, 111, 119, 512, 59, 115, 11189, 11191, 32768, 8596, 59, 32768, 8646, 97, 114, 112, 111, 111, 110, 115, 59, 32768, 8651, 113, 117, 105, 103, 97, 114, 114, 111, 119, 59, 32768, 8621, 104, 114, 101, 101, 116, 105, 109, 101, 115, 59, 32768, 8907, 59, 32768, 8922, 768, 59, 113, 115, 11238, 11240, 11243, 32768, 8804, 59, 32768, 8806, 108, 97, 110, 116, 59, 32768, 10877, 1280, 59, 99, 100, 103, 115, 11261, 11263, 11267, 11286, 11298, 32768, 10877, 99, 59, 32768, 10920, 111, 116, 512, 59, 111, 11274, 11276, 32768, 10879, 512, 59, 114, 11281, 11283, 32768, 10881, 59, 32768, 10883, 512, 59, 101, 11291, 11294, 32896, 8922, 65024, 115, 59, 32768, 10899, 1280, 97, 100, 101, 103, 115, 11309, 11317, 11322, 11339, 11344, 112, 112, 114, 111, 120, 59, 32768, 10885, 111, 116, 59, 32768, 8918, 113, 512, 103, 113, 11328, 11333, 116, 114, 59, 32768, 8922, 103, 116, 114, 59, 32768, 10891, 116, 114, 59, 32768, 8822, 105, 109, 59, 32768, 8818, 768, 105, 108, 114, 11356, 11362, 11368, 115, 104, 116, 59, 32768, 10620, 111, 111, 114, 59, 32768, 8970, 59, 32896, 55349, 56617, 512, 59, 69, 11377, 11379, 32768, 8822, 59, 32768, 10897, 562, 11386, 11405, 114, 512, 100, 117, 11391, 11394, 59, 32768, 8637, 512, 59, 108, 11399, 11401, 32768, 8636, 59, 32768, 10602, 108, 107, 59, 32768, 9604, 99, 121, 59, 32768, 1113, 1280, 59, 97, 99, 104, 116, 11425, 11427, 11432, 11440, 11446, 32768, 8810, 114, 114, 59, 32768, 8647, 111, 114, 110, 101, 114, 59, 32768, 8990, 97, 114, 100, 59, 32768, 10603, 114, 105, 59, 32768, 9722, 512, 105, 111, 11456, 11462, 100, 111, 116, 59, 32768, 320, 117, 115, 116, 512, 59, 97, 11470, 11472, 32768, 9136, 99, 104, 101, 59, 32768, 9136, 1024, 69, 97, 101, 115, 11487, 11490, 11504, 11521, 59, 32768, 8808, 112, 512, 59, 112, 11496, 11498, 32768, 10889, 114, 111, 120, 59, 32768, 10889, 512, 59, 113, 11509, 11511, 32768, 10887, 512, 59, 113, 11516, 11518, 32768, 10887, 59, 32768, 8808, 105, 109, 59, 32768, 8934, 2048, 97, 98, 110, 111, 112, 116, 119, 122, 11543, 11556, 11561, 11616, 11640, 11660, 11667, 11680, 512, 110, 114, 11548, 11552, 103, 59, 32768, 10220, 114, 59, 32768, 8701, 114, 107, 59, 32768, 10214, 103, 768, 108, 109, 114, 11569, 11596, 11604, 101, 102, 116, 512, 97, 114, 11577, 11584, 114, 114, 111, 119, 59, 32768, 10229, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 10231, 97, 112, 115, 116, 111, 59, 32768, 10236, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 10230, 112, 97, 114, 114, 111, 119, 512, 108, 114, 11627, 11633, 101, 102, 116, 59, 32768, 8619, 105, 103, 104, 116, 59, 32768, 8620, 768, 97, 102, 108, 11647, 11651, 11655, 114, 59, 32768, 10629, 59, 32896, 55349, 56669, 117, 115, 59, 32768, 10797, 105, 109, 101, 115, 59, 32768, 10804, 562, 11671, 11676, 115, 116, 59, 32768, 8727, 97, 114, 59, 32768, 95, 768, 59, 101, 102, 11687, 11689, 11695, 32768, 9674, 110, 103, 101, 59, 32768, 9674, 59, 32768, 10731, 97, 114, 512, 59, 108, 11705, 11707, 32768, 40, 116, 59, 32768, 10643, 1280, 97, 99, 104, 109, 116, 11722, 11727, 11735, 11747, 11750, 114, 114, 59, 32768, 8646, 111, 114, 110, 101, 114, 59, 32768, 8991, 97, 114, 512, 59, 100, 11742, 11744, 32768, 8651, 59, 32768, 10605, 59, 32768, 8206, 114, 105, 59, 32768, 8895, 1536, 97, 99, 104, 105, 113, 116, 11768, 11774, 11779, 11782, 11798, 11817, 113, 117, 111, 59, 32768, 8249, 114, 59, 32896, 55349, 56513, 59, 32768, 8624, 109, 768, 59, 101, 103, 11790, 11792, 11795, 32768, 8818, 59, 32768, 10893, 59, 32768, 10895, 512, 98, 117, 11803, 11806, 59, 32768, 91, 111, 512, 59, 114, 11812, 11814, 32768, 8216, 59, 32768, 8218, 114, 111, 107, 59, 32768, 322, 34816, 60, 59, 99, 100, 104, 105, 108, 113, 114, 11841, 11843, 11855, 11860, 11866, 11872, 11878, 11885, 32768, 60, 512, 99, 105, 11848, 11851, 59, 32768, 10918, 114, 59, 32768, 10873, 111, 116, 59, 32768, 8918, 114, 101, 101, 59, 32768, 8907, 109, 101, 115, 59, 32768, 8905, 97, 114, 114, 59, 32768, 10614, 117, 101, 115, 116, 59, 32768, 10875, 512, 80, 105, 11890, 11895, 97, 114, 59, 32768, 10646, 768, 59, 101, 102, 11902, 11904, 11907, 32768, 9667, 59, 32768, 8884, 59, 32768, 9666, 114, 512, 100, 117, 11916, 11923, 115, 104, 97, 114, 59, 32768, 10570, 104, 97, 114, 59, 32768, 10598, 512, 101, 110, 11934, 11944, 114, 116, 110, 101, 113, 113, 59, 32896, 8808, 65024, 69, 59, 32896, 8808, 65024, 3584, 68, 97, 99, 100, 101, 102, 104, 105, 108, 110, 111, 112, 115, 117, 11978, 11984, 12061, 12075, 12081, 12095, 12100, 12104, 12170, 12181, 12188, 12204, 12207, 12223, 68, 111, 116, 59, 32768, 8762, 1024, 99, 108, 112, 114, 11993, 11999, 12019, 12055, 114, 33024, 175, 59, 32768, 175, 512, 101, 116, 12004, 12007, 59, 32768, 9794, 512, 59, 101, 12012, 12014, 32768, 10016, 115, 101, 59, 32768, 10016, 512, 59, 115, 12024, 12026, 32768, 8614, 116, 111, 1024, 59, 100, 108, 117, 12037, 12039, 12045, 12051, 32768, 8614, 111, 119, 110, 59, 32768, 8615, 101, 102, 116, 59, 32768, 8612, 112, 59, 32768, 8613, 107, 101, 114, 59, 32768, 9646, 512, 111, 121, 12066, 12072, 109, 109, 97, 59, 32768, 10793, 59, 32768, 1084, 97, 115, 104, 59, 32768, 8212, 97, 115, 117, 114, 101, 100, 97, 110, 103, 108, 101, 59, 32768, 8737, 114, 59, 32896, 55349, 56618, 111, 59, 32768, 8487, 768, 99, 100, 110, 12111, 12118, 12146, 114, 111, 33024, 181, 59, 32768, 181, 1024, 59, 97, 99, 100, 12127, 12129, 12134, 12139, 32768, 8739, 115, 116, 59, 32768, 42, 105, 114, 59, 32768, 10992, 111, 116, 33024, 183, 59, 32768, 183, 117, 115, 768, 59, 98, 100, 12155, 12157, 12160, 32768, 8722, 59, 32768, 8863, 512, 59, 117, 12165, 12167, 32768, 8760, 59, 32768, 10794, 564, 12174, 12178, 112, 59, 32768, 10971, 114, 59, 32768, 8230, 112, 108, 117, 115, 59, 32768, 8723, 512, 100, 112, 12193, 12199, 101, 108, 115, 59, 32768, 8871, 102, 59, 32896, 55349, 56670, 59, 32768, 8723, 512, 99, 116, 12212, 12217, 114, 59, 32896, 55349, 56514, 112, 111, 115, 59, 32768, 8766, 768, 59, 108, 109, 12230, 12232, 12240, 32768, 956, 116, 105, 109, 97, 112, 59, 32768, 8888, 97, 112, 59, 32768, 8888, 6144, 71, 76, 82, 86, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 108, 109, 111, 112, 114, 115, 116, 117, 118, 119, 12294, 12315, 12364, 12376, 12393, 12472, 12496, 12547, 12553, 12636, 12641, 12703, 12725, 12747, 12752, 12876, 12881, 12957, 13033, 13089, 13294, 13359, 13384, 13499, 512, 103, 116, 12299, 12303, 59, 32896, 8921, 824, 512, 59, 118, 12308, 12311, 32896, 8811, 8402, 59, 32896, 8811, 824, 768, 101, 108, 116, 12322, 12348, 12352, 102, 116, 512, 97, 114, 12329, 12336, 114, 114, 111, 119, 59, 32768, 8653, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8654, 59, 32896, 8920, 824, 512, 59, 118, 12357, 12360, 32896, 8810, 8402, 59, 32896, 8810, 824, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8655, 512, 68, 100, 12381, 12387, 97, 115, 104, 59, 32768, 8879, 97, 115, 104, 59, 32768, 8878, 1280, 98, 99, 110, 112, 116, 12404, 12409, 12415, 12420, 12452, 108, 97, 59, 32768, 8711, 117, 116, 101, 59, 32768, 324, 103, 59, 32896, 8736, 8402, 1280, 59, 69, 105, 111, 112, 12431, 12433, 12437, 12442, 12446, 32768, 8777, 59, 32896, 10864, 824, 100, 59, 32896, 8779, 824, 115, 59, 32768, 329, 114, 111, 120, 59, 32768, 8777, 117, 114, 512, 59, 97, 12459, 12461, 32768, 9838, 108, 512, 59, 115, 12467, 12469, 32768, 9838, 59, 32768, 8469, 836, 12477, 0, 12483, 112, 33024, 160, 59, 32768, 160, 109, 112, 512, 59, 101, 12489, 12492, 32896, 8782, 824, 59, 32896, 8783, 824, 1280, 97, 101, 111, 117, 121, 12507, 12519, 12525, 12540, 12544, 833, 12512, 0, 12515, 59, 32768, 10819, 111, 110, 59, 32768, 328, 100, 105, 108, 59, 32768, 326, 110, 103, 512, 59, 100, 12532, 12534, 32768, 8775, 111, 116, 59, 32896, 10861, 824, 112, 59, 32768, 10818, 59, 32768, 1085, 97, 115, 104, 59, 32768, 8211, 1792, 59, 65, 97, 100, 113, 115, 120, 12568, 12570, 12575, 12596, 12602, 12608, 12623, 32768, 8800, 114, 114, 59, 32768, 8663, 114, 512, 104, 114, 12581, 12585, 107, 59, 32768, 10532, 512, 59, 111, 12590, 12592, 32768, 8599, 119, 59, 32768, 8599, 111, 116, 59, 32896, 8784, 824, 117, 105, 118, 59, 32768, 8802, 512, 101, 105, 12613, 12618, 97, 114, 59, 32768, 10536, 109, 59, 32896, 8770, 824, 105, 115, 116, 512, 59, 115, 12631, 12633, 32768, 8708, 59, 32768, 8708, 114, 59, 32896, 55349, 56619, 1024, 69, 101, 115, 116, 12650, 12654, 12688, 12693, 59, 32896, 8807, 824, 768, 59, 113, 115, 12661, 12663, 12684, 32768, 8817, 768, 59, 113, 115, 12670, 12672, 12676, 32768, 8817, 59, 32896, 8807, 824, 108, 97, 110, 116, 59, 32896, 10878, 824, 59, 32896, 10878, 824, 105, 109, 59, 32768, 8821, 512, 59, 114, 12698, 12700, 32768, 8815, 59, 32768, 8815, 768, 65, 97, 112, 12710, 12715, 12720, 114, 114, 59, 32768, 8654, 114, 114, 59, 32768, 8622, 97, 114, 59, 32768, 10994, 768, 59, 115, 118, 12732, 12734, 12744, 32768, 8715, 512, 59, 100, 12739, 12741, 32768, 8956, 59, 32768, 8954, 59, 32768, 8715, 99, 121, 59, 32768, 1114, 1792, 65, 69, 97, 100, 101, 115, 116, 12767, 12772, 12776, 12781, 12785, 12853, 12858, 114, 114, 59, 32768, 8653, 59, 32896, 8806, 824, 114, 114, 59, 32768, 8602, 114, 59, 32768, 8229, 1024, 59, 102, 113, 115, 12794, 12796, 12821, 12842, 32768, 8816, 116, 512, 97, 114, 12802, 12809, 114, 114, 111, 119, 59, 32768, 8602, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8622, 768, 59, 113, 115, 12828, 12830, 12834, 32768, 8816, 59, 32896, 8806, 824, 108, 97, 110, 116, 59, 32896, 10877, 824, 512, 59, 115, 12847, 12850, 32896, 10877, 824, 59, 32768, 8814, 105, 109, 59, 32768, 8820, 512, 59, 114, 12863, 12865, 32768, 8814, 105, 512, 59, 101, 12871, 12873, 32768, 8938, 59, 32768, 8940, 105, 100, 59, 32768, 8740, 512, 112, 116, 12886, 12891, 102, 59, 32896, 55349, 56671, 33536, 172, 59, 105, 110, 12899, 12901, 12936, 32768, 172, 110, 1024, 59, 69, 100, 118, 12911, 12913, 12917, 12923, 32768, 8713, 59, 32896, 8953, 824, 111, 116, 59, 32896, 8949, 824, 818, 12928, 12931, 12934, 59, 32768, 8713, 59, 32768, 8951, 59, 32768, 8950, 105, 512, 59, 118, 12942, 12944, 32768, 8716, 818, 12949, 12952, 12955, 59, 32768, 8716, 59, 32768, 8958, 59, 32768, 8957, 768, 97, 111, 114, 12964, 12992, 12999, 114, 1024, 59, 97, 115, 116, 12974, 12976, 12983, 12988, 32768, 8742, 108, 108, 101, 108, 59, 32768, 8742, 108, 59, 32896, 11005, 8421, 59, 32896, 8706, 824, 108, 105, 110, 116, 59, 32768, 10772, 768, 59, 99, 101, 13006, 13008, 13013, 32768, 8832, 117, 101, 59, 32768, 8928, 512, 59, 99, 13018, 13021, 32896, 10927, 824, 512, 59, 101, 13026, 13028, 32768, 8832, 113, 59, 32896, 10927, 824, 1024, 65, 97, 105, 116, 13042, 13047, 13066, 13077, 114, 114, 59, 32768, 8655, 114, 114, 768, 59, 99, 119, 13056, 13058, 13062, 32768, 8603, 59, 32896, 10547, 824, 59, 32896, 8605, 824, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8603, 114, 105, 512, 59, 101, 13084, 13086, 32768, 8939, 59, 32768, 8941, 1792, 99, 104, 105, 109, 112, 113, 117, 13104, 13128, 13151, 13169, 13174, 13179, 13194, 1024, 59, 99, 101, 114, 13113, 13115, 13120, 13124, 32768, 8833, 117, 101, 59, 32768, 8929, 59, 32896, 10928, 824, 59, 32896, 55349, 56515, 111, 114, 116, 1086, 13137, 0, 0, 13142, 105, 100, 59, 32768, 8740, 97, 114, 97, 108, 108, 101, 108, 59, 32768, 8742, 109, 512, 59, 101, 13157, 13159, 32768, 8769, 512, 59, 113, 13164, 13166, 32768, 8772, 59, 32768, 8772, 105, 100, 59, 32768, 8740, 97, 114, 59, 32768, 8742, 115, 117, 512, 98, 112, 13186, 13190, 101, 59, 32768, 8930, 101, 59, 32768, 8931, 768, 98, 99, 112, 13201, 13241, 13254, 1024, 59, 69, 101, 115, 13210, 13212, 13216, 13219, 32768, 8836, 59, 32896, 10949, 824, 59, 32768, 8840, 101, 116, 512, 59, 101, 13226, 13229, 32896, 8834, 8402, 113, 512, 59, 113, 13235, 13237, 32768, 8840, 59, 32896, 10949, 824, 99, 512, 59, 101, 13247, 13249, 32768, 8833, 113, 59, 32896, 10928, 824, 1024, 59, 69, 101, 115, 13263, 13265, 13269, 13272, 32768, 8837, 59, 32896, 10950, 824, 59, 32768, 8841, 101, 116, 512, 59, 101, 13279, 13282, 32896, 8835, 8402, 113, 512, 59, 113, 13288, 13290, 32768, 8841, 59, 32896, 10950, 824, 1024, 103, 105, 108, 114, 13303, 13307, 13315, 13319, 108, 59, 32768, 8825, 108, 100, 101, 33024, 241, 59, 32768, 241, 103, 59, 32768, 8824, 105, 97, 110, 103, 108, 101, 512, 108, 114, 13330, 13344, 101, 102, 116, 512, 59, 101, 13338, 13340, 32768, 8938, 113, 59, 32768, 8940, 105, 103, 104, 116, 512, 59, 101, 13353, 13355, 32768, 8939, 113, 59, 32768, 8941, 512, 59, 109, 13364, 13366, 32768, 957, 768, 59, 101, 115, 13373, 13375, 13380, 32768, 35, 114, 111, 59, 32768, 8470, 112, 59, 32768, 8199, 2304, 68, 72, 97, 100, 103, 105, 108, 114, 115, 13403, 13409, 13415, 13420, 13426, 13439, 13446, 13476, 13493, 97, 115, 104, 59, 32768, 8877, 97, 114, 114, 59, 32768, 10500, 112, 59, 32896, 8781, 8402, 97, 115, 104, 59, 32768, 8876, 512, 101, 116, 13431, 13435, 59, 32896, 8805, 8402, 59, 32896, 62, 8402, 110, 102, 105, 110, 59, 32768, 10718, 768, 65, 101, 116, 13453, 13458, 13462, 114, 114, 59, 32768, 10498, 59, 32896, 8804, 8402, 512, 59, 114, 13467, 13470, 32896, 60, 8402, 105, 101, 59, 32896, 8884, 8402, 512, 65, 116, 13481, 13486, 114, 114, 59, 32768, 10499, 114, 105, 101, 59, 32896, 8885, 8402, 105, 109, 59, 32896, 8764, 8402, 768, 65, 97, 110, 13506, 13511, 13532, 114, 114, 59, 32768, 8662, 114, 512, 104, 114, 13517, 13521, 107, 59, 32768, 10531, 512, 59, 111, 13526, 13528, 32768, 8598, 119, 59, 32768, 8598, 101, 97, 114, 59, 32768, 10535, 9252, 13576, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13579, 0, 13596, 13617, 13653, 13659, 13673, 13695, 13708, 0, 0, 13713, 13750, 0, 13788, 13794, 0, 13815, 13890, 13913, 13937, 13944, 59, 32768, 9416, 512, 99, 115, 13583, 13591, 117, 116, 101, 33024, 243, 59, 32768, 243, 116, 59, 32768, 8859, 512, 105, 121, 13600, 13613, 114, 512, 59, 99, 13606, 13608, 32768, 8858, 33024, 244, 59, 32768, 244, 59, 32768, 1086, 1280, 97, 98, 105, 111, 115, 13627, 13632, 13638, 13642, 13646, 115, 104, 59, 32768, 8861, 108, 97, 99, 59, 32768, 337, 118, 59, 32768, 10808, 116, 59, 32768, 8857, 111, 108, 100, 59, 32768, 10684, 108, 105, 103, 59, 32768, 339, 512, 99, 114, 13663, 13668, 105, 114, 59, 32768, 10687, 59, 32896, 55349, 56620, 1600, 13680, 0, 0, 13684, 0, 13692, 110, 59, 32768, 731, 97, 118, 101, 33024, 242, 59, 32768, 242, 59, 32768, 10689, 512, 98, 109, 13699, 13704, 97, 114, 59, 32768, 10677, 59, 32768, 937, 110, 116, 59, 32768, 8750, 1024, 97, 99, 105, 116, 13721, 13726, 13741, 13746, 114, 114, 59, 32768, 8634, 512, 105, 114, 13731, 13735, 114, 59, 32768, 10686, 111, 115, 115, 59, 32768, 10683, 110, 101, 59, 32768, 8254, 59, 32768, 10688, 768, 97, 101, 105, 13756, 13761, 13766, 99, 114, 59, 32768, 333, 103, 97, 59, 32768, 969, 768, 99, 100, 110, 13773, 13779, 13782, 114, 111, 110, 59, 32768, 959, 59, 32768, 10678, 117, 115, 59, 32768, 8854, 112, 102, 59, 32896, 55349, 56672, 768, 97, 101, 108, 13800, 13804, 13809, 114, 59, 32768, 10679, 114, 112, 59, 32768, 10681, 117, 115, 59, 32768, 8853, 1792, 59, 97, 100, 105, 111, 115, 118, 13829, 13831, 13836, 13869, 13875, 13879, 13886, 32768, 8744, 114, 114, 59, 32768, 8635, 1024, 59, 101, 102, 109, 13845, 13847, 13859, 13864, 32768, 10845, 114, 512, 59, 111, 13853, 13855, 32768, 8500, 102, 59, 32768, 8500, 33024, 170, 59, 32768, 170, 33024, 186, 59, 32768, 186, 103, 111, 102, 59, 32768, 8886, 114, 59, 32768, 10838, 108, 111, 112, 101, 59, 32768, 10839, 59, 32768, 10843, 768, 99, 108, 111, 13896, 13900, 13908, 114, 59, 32768, 8500, 97, 115, 104, 33024, 248, 59, 32768, 248, 108, 59, 32768, 8856, 105, 573, 13917, 13924, 100, 101, 33024, 245, 59, 32768, 245, 101, 115, 512, 59, 97, 13930, 13932, 32768, 8855, 115, 59, 32768, 10806, 109, 108, 33024, 246, 59, 32768, 246, 98, 97, 114, 59, 32768, 9021, 5426, 13972, 0, 14013, 0, 14017, 14053, 0, 14058, 14086, 0, 0, 14107, 14199, 0, 14202, 0, 0, 14229, 14425, 0, 14438, 114, 1024, 59, 97, 115, 116, 13981, 13983, 13997, 14009, 32768, 8741, 33280, 182, 59, 108, 13989, 13991, 32768, 182, 108, 101, 108, 59, 32768, 8741, 1082, 14003, 0, 0, 14007, 109, 59, 32768, 10995, 59, 32768, 11005, 59, 32768, 8706, 121, 59, 32768, 1087, 114, 1280, 99, 105, 109, 112, 116, 14028, 14033, 14038, 14043, 14046, 110, 116, 59, 32768, 37, 111, 100, 59, 32768, 46, 105, 108, 59, 32768, 8240, 59, 32768, 8869, 101, 110, 107, 59, 32768, 8241, 114, 59, 32896, 55349, 56621, 768, 105, 109, 111, 14064, 14074, 14080, 512, 59, 118, 14069, 14071, 32768, 966, 59, 32768, 981, 109, 97, 116, 59, 32768, 8499, 110, 101, 59, 32768, 9742, 768, 59, 116, 118, 14092, 14094, 14103, 32768, 960, 99, 104, 102, 111, 114, 107, 59, 32768, 8916, 59, 32768, 982, 512, 97, 117, 14111, 14132, 110, 512, 99, 107, 14117, 14128, 107, 512, 59, 104, 14123, 14125, 32768, 8463, 59, 32768, 8462, 118, 59, 32768, 8463, 115, 2304, 59, 97, 98, 99, 100, 101, 109, 115, 116, 14152, 14154, 14160, 14163, 14168, 14179, 14182, 14188, 14193, 32768, 43, 99, 105, 114, 59, 32768, 10787, 59, 32768, 8862, 105, 114, 59, 32768, 10786, 512, 111, 117, 14173, 14176, 59, 32768, 8724, 59, 32768, 10789, 59, 32768, 10866, 110, 33024, 177, 59, 32768, 177, 105, 109, 59, 32768, 10790, 119, 111, 59, 32768, 10791, 59, 32768, 177, 768, 105, 112, 117, 14208, 14216, 14221, 110, 116, 105, 110, 116, 59, 32768, 10773, 102, 59, 32896, 55349, 56673, 110, 100, 33024, 163, 59, 32768, 163, 2560, 59, 69, 97, 99, 101, 105, 110, 111, 115, 117, 14249, 14251, 14254, 14258, 14263, 14336, 14348, 14367, 14413, 14418, 32768, 8826, 59, 32768, 10931, 112, 59, 32768, 10935, 117, 101, 59, 32768, 8828, 512, 59, 99, 14268, 14270, 32768, 10927, 1536, 59, 97, 99, 101, 110, 115, 14283, 14285, 14293, 14302, 14306, 14331, 32768, 8826, 112, 112, 114, 111, 120, 59, 32768, 10935, 117, 114, 108, 121, 101, 113, 59, 32768, 8828, 113, 59, 32768, 10927, 768, 97, 101, 115, 14313, 14321, 14326, 112, 112, 114, 111, 120, 59, 32768, 10937, 113, 113, 59, 32768, 10933, 105, 109, 59, 32768, 8936, 105, 109, 59, 32768, 8830, 109, 101, 512, 59, 115, 14343, 14345, 32768, 8242, 59, 32768, 8473, 768, 69, 97, 115, 14355, 14358, 14362, 59, 32768, 10933, 112, 59, 32768, 10937, 105, 109, 59, 32768, 8936, 768, 100, 102, 112, 14374, 14377, 14402, 59, 32768, 8719, 768, 97, 108, 115, 14384, 14390, 14396, 108, 97, 114, 59, 32768, 9006, 105, 110, 101, 59, 32768, 8978, 117, 114, 102, 59, 32768, 8979, 512, 59, 116, 14407, 14409, 32768, 8733, 111, 59, 32768, 8733, 105, 109, 59, 32768, 8830, 114, 101, 108, 59, 32768, 8880, 512, 99, 105, 14429, 14434, 114, 59, 32896, 55349, 56517, 59, 32768, 968, 110, 99, 115, 112, 59, 32768, 8200, 1536, 102, 105, 111, 112, 115, 117, 14457, 14462, 14467, 14473, 14480, 14486, 114, 59, 32896, 55349, 56622, 110, 116, 59, 32768, 10764, 112, 102, 59, 32896, 55349, 56674, 114, 105, 109, 101, 59, 32768, 8279, 99, 114, 59, 32896, 55349, 56518, 768, 97, 101, 111, 14493, 14513, 14526, 116, 512, 101, 105, 14499, 14508, 114, 110, 105, 111, 110, 115, 59, 32768, 8461, 110, 116, 59, 32768, 10774, 115, 116, 512, 59, 101, 14520, 14522, 32768, 63, 113, 59, 32768, 8799, 116, 33024, 34, 59, 32768, 34, 5376, 65, 66, 72, 97, 98, 99, 100, 101, 102, 104, 105, 108, 109, 110, 111, 112, 114, 115, 116, 117, 120, 14575, 14597, 14603, 14608, 14775, 14829, 14865, 14901, 14943, 14966, 15e3, 15139, 15159, 15176, 15182, 15236, 15261, 15267, 15309, 15352, 15360, 768, 97, 114, 116, 14582, 14587, 14591, 114, 114, 59, 32768, 8667, 114, 59, 32768, 8658, 97, 105, 108, 59, 32768, 10524, 97, 114, 114, 59, 32768, 10511, 97, 114, 59, 32768, 10596, 1792, 99, 100, 101, 110, 113, 114, 116, 14623, 14637, 14642, 14650, 14672, 14679, 14751, 512, 101, 117, 14628, 14632, 59, 32896, 8765, 817, 116, 101, 59, 32768, 341, 105, 99, 59, 32768, 8730, 109, 112, 116, 121, 118, 59, 32768, 10675, 103, 1024, 59, 100, 101, 108, 14660, 14662, 14665, 14668, 32768, 10217, 59, 32768, 10642, 59, 32768, 10661, 101, 59, 32768, 10217, 117, 111, 33024, 187, 59, 32768, 187, 114, 2816, 59, 97, 98, 99, 102, 104, 108, 112, 115, 116, 119, 14703, 14705, 14709, 14720, 14723, 14727, 14731, 14735, 14739, 14744, 14748, 32768, 8594, 112, 59, 32768, 10613, 512, 59, 102, 14714, 14716, 32768, 8677, 115, 59, 32768, 10528, 59, 32768, 10547, 115, 59, 32768, 10526, 107, 59, 32768, 8618, 112, 59, 32768, 8620, 108, 59, 32768, 10565, 105, 109, 59, 32768, 10612, 108, 59, 32768, 8611, 59, 32768, 8605, 512, 97, 105, 14756, 14761, 105, 108, 59, 32768, 10522, 111, 512, 59, 110, 14767, 14769, 32768, 8758, 97, 108, 115, 59, 32768, 8474, 768, 97, 98, 114, 14782, 14787, 14792, 114, 114, 59, 32768, 10509, 114, 107, 59, 32768, 10099, 512, 97, 107, 14797, 14809, 99, 512, 101, 107, 14803, 14806, 59, 32768, 125, 59, 32768, 93, 512, 101, 115, 14814, 14817, 59, 32768, 10636, 108, 512, 100, 117, 14823, 14826, 59, 32768, 10638, 59, 32768, 10640, 1024, 97, 101, 117, 121, 14838, 14844, 14858, 14862, 114, 111, 110, 59, 32768, 345, 512, 100, 105, 14849, 14854, 105, 108, 59, 32768, 343, 108, 59, 32768, 8969, 98, 59, 32768, 125, 59, 32768, 1088, 1024, 99, 108, 113, 115, 14874, 14878, 14885, 14897, 97, 59, 32768, 10551, 100, 104, 97, 114, 59, 32768, 10601, 117, 111, 512, 59, 114, 14892, 14894, 32768, 8221, 59, 32768, 8221, 104, 59, 32768, 8627, 768, 97, 99, 103, 14908, 14934, 14938, 108, 1024, 59, 105, 112, 115, 14918, 14920, 14925, 14931, 32768, 8476, 110, 101, 59, 32768, 8475, 97, 114, 116, 59, 32768, 8476, 59, 32768, 8477, 116, 59, 32768, 9645, 33024, 174, 59, 32768, 174, 768, 105, 108, 114, 14950, 14956, 14962, 115, 104, 116, 59, 32768, 10621, 111, 111, 114, 59, 32768, 8971, 59, 32896, 55349, 56623, 512, 97, 111, 14971, 14990, 114, 512, 100, 117, 14977, 14980, 59, 32768, 8641, 512, 59, 108, 14985, 14987, 32768, 8640, 59, 32768, 10604, 512, 59, 118, 14995, 14997, 32768, 961, 59, 32768, 1009, 768, 103, 110, 115, 15007, 15123, 15127, 104, 116, 1536, 97, 104, 108, 114, 115, 116, 15022, 15039, 15060, 15086, 15099, 15111, 114, 114, 111, 119, 512, 59, 116, 15031, 15033, 32768, 8594, 97, 105, 108, 59, 32768, 8611, 97, 114, 112, 111, 111, 110, 512, 100, 117, 15050, 15056, 111, 119, 110, 59, 32768, 8641, 112, 59, 32768, 8640, 101, 102, 116, 512, 97, 104, 15068, 15076, 114, 114, 111, 119, 115, 59, 32768, 8644, 97, 114, 112, 111, 111, 110, 115, 59, 32768, 8652, 105, 103, 104, 116, 97, 114, 114, 111, 119, 115, 59, 32768, 8649, 113, 117, 105, 103, 97, 114, 114, 111, 119, 59, 32768, 8605, 104, 114, 101, 101, 116, 105, 109, 101, 115, 59, 32768, 8908, 103, 59, 32768, 730, 105, 110, 103, 100, 111, 116, 115, 101, 113, 59, 32768, 8787, 768, 97, 104, 109, 15146, 15151, 15156, 114, 114, 59, 32768, 8644, 97, 114, 59, 32768, 8652, 59, 32768, 8207, 111, 117, 115, 116, 512, 59, 97, 15168, 15170, 32768, 9137, 99, 104, 101, 59, 32768, 9137, 109, 105, 100, 59, 32768, 10990, 1024, 97, 98, 112, 116, 15191, 15204, 15209, 15229, 512, 110, 114, 15196, 15200, 103, 59, 32768, 10221, 114, 59, 32768, 8702, 114, 107, 59, 32768, 10215, 768, 97, 102, 108, 15216, 15220, 15224, 114, 59, 32768, 10630, 59, 32896, 55349, 56675, 117, 115, 59, 32768, 10798, 105, 109, 101, 115, 59, 32768, 10805, 512, 97, 112, 15241, 15253, 114, 512, 59, 103, 15247, 15249, 32768, 41, 116, 59, 32768, 10644, 111, 108, 105, 110, 116, 59, 32768, 10770, 97, 114, 114, 59, 32768, 8649, 1024, 97, 99, 104, 113, 15276, 15282, 15287, 15290, 113, 117, 111, 59, 32768, 8250, 114, 59, 32896, 55349, 56519, 59, 32768, 8625, 512, 98, 117, 15295, 15298, 59, 32768, 93, 111, 512, 59, 114, 15304, 15306, 32768, 8217, 59, 32768, 8217, 768, 104, 105, 114, 15316, 15322, 15328, 114, 101, 101, 59, 32768, 8908, 109, 101, 115, 59, 32768, 8906, 105, 1024, 59, 101, 102, 108, 15338, 15340, 15343, 15346, 32768, 9657, 59, 32768, 8885, 59, 32768, 9656, 116, 114, 105, 59, 32768, 10702, 108, 117, 104, 97, 114, 59, 32768, 10600, 59, 32768, 8478, 6706, 15391, 15398, 15404, 15499, 15516, 15592, 0, 15606, 15660, 0, 0, 15752, 15758, 0, 15827, 15863, 15886, 16e3, 16006, 16038, 16086, 0, 16467, 0, 0, 16506, 99, 117, 116, 101, 59, 32768, 347, 113, 117, 111, 59, 32768, 8218, 2560, 59, 69, 97, 99, 101, 105, 110, 112, 115, 121, 15424, 15426, 15429, 15441, 15446, 15458, 15463, 15482, 15490, 15495, 32768, 8827, 59, 32768, 10932, 833, 15434, 0, 15437, 59, 32768, 10936, 111, 110, 59, 32768, 353, 117, 101, 59, 32768, 8829, 512, 59, 100, 15451, 15453, 32768, 10928, 105, 108, 59, 32768, 351, 114, 99, 59, 32768, 349, 768, 69, 97, 115, 15470, 15473, 15477, 59, 32768, 10934, 112, 59, 32768, 10938, 105, 109, 59, 32768, 8937, 111, 108, 105, 110, 116, 59, 32768, 10771, 105, 109, 59, 32768, 8831, 59, 32768, 1089, 111, 116, 768, 59, 98, 101, 15507, 15509, 15512, 32768, 8901, 59, 32768, 8865, 59, 32768, 10854, 1792, 65, 97, 99, 109, 115, 116, 120, 15530, 15535, 15556, 15562, 15566, 15572, 15587, 114, 114, 59, 32768, 8664, 114, 512, 104, 114, 15541, 15545, 107, 59, 32768, 10533, 512, 59, 111, 15550, 15552, 32768, 8600, 119, 59, 32768, 8600, 116, 33024, 167, 59, 32768, 167, 105, 59, 32768, 59, 119, 97, 114, 59, 32768, 10537, 109, 512, 105, 110, 15578, 15584, 110, 117, 115, 59, 32768, 8726, 59, 32768, 8726, 116, 59, 32768, 10038, 114, 512, 59, 111, 15597, 15600, 32896, 55349, 56624, 119, 110, 59, 32768, 8994, 1024, 97, 99, 111, 121, 15614, 15619, 15632, 15654, 114, 112, 59, 32768, 9839, 512, 104, 121, 15624, 15629, 99, 121, 59, 32768, 1097, 59, 32768, 1096, 114, 116, 1086, 15640, 0, 0, 15645, 105, 100, 59, 32768, 8739, 97, 114, 97, 108, 108, 101, 108, 59, 32768, 8741, 33024, 173, 59, 32768, 173, 512, 103, 109, 15664, 15681, 109, 97, 768, 59, 102, 118, 15673, 15675, 15678, 32768, 963, 59, 32768, 962, 59, 32768, 962, 2048, 59, 100, 101, 103, 108, 110, 112, 114, 15698, 15700, 15705, 15715, 15725, 15735, 15739, 15745, 32768, 8764, 111, 116, 59, 32768, 10858, 512, 59, 113, 15710, 15712, 32768, 8771, 59, 32768, 8771, 512, 59, 69, 15720, 15722, 32768, 10910, 59, 32768, 10912, 512, 59, 69, 15730, 15732, 32768, 10909, 59, 32768, 10911, 101, 59, 32768, 8774, 108, 117, 115, 59, 32768, 10788, 97, 114, 114, 59, 32768, 10610, 97, 114, 114, 59, 32768, 8592, 1024, 97, 101, 105, 116, 15766, 15788, 15796, 15808, 512, 108, 115, 15771, 15783, 108, 115, 101, 116, 109, 105, 110, 117, 115, 59, 32768, 8726, 104, 112, 59, 32768, 10803, 112, 97, 114, 115, 108, 59, 32768, 10724, 512, 100, 108, 15801, 15804, 59, 32768, 8739, 101, 59, 32768, 8995, 512, 59, 101, 15813, 15815, 32768, 10922, 512, 59, 115, 15820, 15822, 32768, 10924, 59, 32896, 10924, 65024, 768, 102, 108, 112, 15833, 15839, 15857, 116, 99, 121, 59, 32768, 1100, 512, 59, 98, 15844, 15846, 32768, 47, 512, 59, 97, 15851, 15853, 32768, 10692, 114, 59, 32768, 9023, 102, 59, 32896, 55349, 56676, 97, 512, 100, 114, 15868, 15882, 101, 115, 512, 59, 117, 15875, 15877, 32768, 9824, 105, 116, 59, 32768, 9824, 59, 32768, 8741, 768, 99, 115, 117, 15892, 15921, 15977, 512, 97, 117, 15897, 15909, 112, 512, 59, 115, 15903, 15905, 32768, 8851, 59, 32896, 8851, 65024, 112, 512, 59, 115, 15915, 15917, 32768, 8852, 59, 32896, 8852, 65024, 117, 512, 98, 112, 15927, 15952, 768, 59, 101, 115, 15934, 15936, 15939, 32768, 8847, 59, 32768, 8849, 101, 116, 512, 59, 101, 15946, 15948, 32768, 8847, 113, 59, 32768, 8849, 768, 59, 101, 115, 15959, 15961, 15964, 32768, 8848, 59, 32768, 8850, 101, 116, 512, 59, 101, 15971, 15973, 32768, 8848, 113, 59, 32768, 8850, 768, 59, 97, 102, 15984, 15986, 15996, 32768, 9633, 114, 566, 15991, 15994, 59, 32768, 9633, 59, 32768, 9642, 59, 32768, 9642, 97, 114, 114, 59, 32768, 8594, 1024, 99, 101, 109, 116, 16014, 16019, 16025, 16031, 114, 59, 32896, 55349, 56520, 116, 109, 110, 59, 32768, 8726, 105, 108, 101, 59, 32768, 8995, 97, 114, 102, 59, 32768, 8902, 512, 97, 114, 16042, 16053, 114, 512, 59, 102, 16048, 16050, 32768, 9734, 59, 32768, 9733, 512, 97, 110, 16058, 16081, 105, 103, 104, 116, 512, 101, 112, 16067, 16076, 112, 115, 105, 108, 111, 110, 59, 32768, 1013, 104, 105, 59, 32768, 981, 115, 59, 32768, 175, 1280, 98, 99, 109, 110, 112, 16096, 16221, 16288, 16291, 16295, 2304, 59, 69, 100, 101, 109, 110, 112, 114, 115, 16115, 16117, 16120, 16125, 16137, 16143, 16154, 16160, 16166, 32768, 8834, 59, 32768, 10949, 111, 116, 59, 32768, 10941, 512, 59, 100, 16130, 16132, 32768, 8838, 111, 116, 59, 32768, 10947, 117, 108, 116, 59, 32768, 10945, 512, 69, 101, 16148, 16151, 59, 32768, 10955, 59, 32768, 8842, 108, 117, 115, 59, 32768, 10943, 97, 114, 114, 59, 32768, 10617, 768, 101, 105, 117, 16173, 16206, 16210, 116, 768, 59, 101, 110, 16181, 16183, 16194, 32768, 8834, 113, 512, 59, 113, 16189, 16191, 32768, 8838, 59, 32768, 10949, 101, 113, 512, 59, 113, 16201, 16203, 32768, 8842, 59, 32768, 10955, 109, 59, 32768, 10951, 512, 98, 112, 16215, 16218, 59, 32768, 10965, 59, 32768, 10963, 99, 1536, 59, 97, 99, 101, 110, 115, 16235, 16237, 16245, 16254, 16258, 16283, 32768, 8827, 112, 112, 114, 111, 120, 59, 32768, 10936, 117, 114, 108, 121, 101, 113, 59, 32768, 8829, 113, 59, 32768, 10928, 768, 97, 101, 115, 16265, 16273, 16278, 112, 112, 114, 111, 120, 59, 32768, 10938, 113, 113, 59, 32768, 10934, 105, 109, 59, 32768, 8937, 105, 109, 59, 32768, 8831, 59, 32768, 8721, 103, 59, 32768, 9834, 3328, 49, 50, 51, 59, 69, 100, 101, 104, 108, 109, 110, 112, 115, 16322, 16327, 16332, 16337, 16339, 16342, 16356, 16368, 16382, 16388, 16394, 16405, 16411, 33024, 185, 59, 32768, 185, 33024, 178, 59, 32768, 178, 33024, 179, 59, 32768, 179, 32768, 8835, 59, 32768, 10950, 512, 111, 115, 16347, 16351, 116, 59, 32768, 10942, 117, 98, 59, 32768, 10968, 512, 59, 100, 16361, 16363, 32768, 8839, 111, 116, 59, 32768, 10948, 115, 512, 111, 117, 16374, 16378, 108, 59, 32768, 10185, 98, 59, 32768, 10967, 97, 114, 114, 59, 32768, 10619, 117, 108, 116, 59, 32768, 10946, 512, 69, 101, 16399, 16402, 59, 32768, 10956, 59, 32768, 8843, 108, 117, 115, 59, 32768, 10944, 768, 101, 105, 117, 16418, 16451, 16455, 116, 768, 59, 101, 110, 16426, 16428, 16439, 32768, 8835, 113, 512, 59, 113, 16434, 16436, 32768, 8839, 59, 32768, 10950, 101, 113, 512, 59, 113, 16446, 16448, 32768, 8843, 59, 32768, 10956, 109, 59, 32768, 10952, 512, 98, 112, 16460, 16463, 59, 32768, 10964, 59, 32768, 10966, 768, 65, 97, 110, 16473, 16478, 16499, 114, 114, 59, 32768, 8665, 114, 512, 104, 114, 16484, 16488, 107, 59, 32768, 10534, 512, 59, 111, 16493, 16495, 32768, 8601, 119, 59, 32768, 8601, 119, 97, 114, 59, 32768, 10538, 108, 105, 103, 33024, 223, 59, 32768, 223, 5938, 16538, 16552, 16557, 16579, 16584, 16591, 0, 16596, 16692, 0, 0, 0, 0, 0, 16731, 16780, 0, 16787, 16908, 0, 0, 0, 16938, 1091, 16543, 0, 0, 16549, 103, 101, 116, 59, 32768, 8982, 59, 32768, 964, 114, 107, 59, 32768, 9140, 768, 97, 101, 121, 16563, 16569, 16575, 114, 111, 110, 59, 32768, 357, 100, 105, 108, 59, 32768, 355, 59, 32768, 1090, 111, 116, 59, 32768, 8411, 108, 114, 101, 99, 59, 32768, 8981, 114, 59, 32896, 55349, 56625, 1024, 101, 105, 107, 111, 16604, 16641, 16670, 16684, 835, 16609, 0, 16624, 101, 512, 52, 102, 16614, 16617, 59, 32768, 8756, 111, 114, 101, 59, 32768, 8756, 97, 768, 59, 115, 118, 16631, 16633, 16638, 32768, 952, 121, 109, 59, 32768, 977, 59, 32768, 977, 512, 99, 110, 16646, 16665, 107, 512, 97, 115, 16652, 16660, 112, 112, 114, 111, 120, 59, 32768, 8776, 105, 109, 59, 32768, 8764, 115, 112, 59, 32768, 8201, 512, 97, 115, 16675, 16679, 112, 59, 32768, 8776, 105, 109, 59, 32768, 8764, 114, 110, 33024, 254, 59, 32768, 254, 829, 16696, 16701, 16727, 100, 101, 59, 32768, 732, 101, 115, 33536, 215, 59, 98, 100, 16710, 16712, 16723, 32768, 215, 512, 59, 97, 16717, 16719, 32768, 8864, 114, 59, 32768, 10801, 59, 32768, 10800, 116, 59, 32768, 8749, 768, 101, 112, 115, 16737, 16741, 16775, 97, 59, 32768, 10536, 1024, 59, 98, 99, 102, 16750, 16752, 16757, 16762, 32768, 8868, 111, 116, 59, 32768, 9014, 105, 114, 59, 32768, 10993, 512, 59, 111, 16767, 16770, 32896, 55349, 56677, 114, 107, 59, 32768, 10970, 97, 59, 32768, 10537, 114, 105, 109, 101, 59, 32768, 8244, 768, 97, 105, 112, 16793, 16798, 16899, 100, 101, 59, 32768, 8482, 1792, 97, 100, 101, 109, 112, 115, 116, 16813, 16868, 16873, 16876, 16883, 16889, 16893, 110, 103, 108, 101, 1280, 59, 100, 108, 113, 114, 16828, 16830, 16836, 16850, 16853, 32768, 9653, 111, 119, 110, 59, 32768, 9663, 101, 102, 116, 512, 59, 101, 16844, 16846, 32768, 9667, 113, 59, 32768, 8884, 59, 32768, 8796, 105, 103, 104, 116, 512, 59, 101, 16862, 16864, 32768, 9657, 113, 59, 32768, 8885, 111, 116, 59, 32768, 9708, 59, 32768, 8796, 105, 110, 117, 115, 59, 32768, 10810, 108, 117, 115, 59, 32768, 10809, 98, 59, 32768, 10701, 105, 109, 101, 59, 32768, 10811, 101, 122, 105, 117, 109, 59, 32768, 9186, 768, 99, 104, 116, 16914, 16926, 16931, 512, 114, 121, 16919, 16923, 59, 32896, 55349, 56521, 59, 32768, 1094, 99, 121, 59, 32768, 1115, 114, 111, 107, 59, 32768, 359, 512, 105, 111, 16942, 16947, 120, 116, 59, 32768, 8812, 104, 101, 97, 100, 512, 108, 114, 16956, 16967, 101, 102, 116, 97, 114, 114, 111, 119, 59, 32768, 8606, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 32768, 8608, 4608, 65, 72, 97, 98, 99, 100, 102, 103, 104, 108, 109, 111, 112, 114, 115, 116, 117, 119, 17016, 17021, 17026, 17043, 17057, 17072, 17095, 17110, 17119, 17139, 17172, 17187, 17202, 17290, 17330, 17336, 17365, 17381, 114, 114, 59, 32768, 8657, 97, 114, 59, 32768, 10595, 512, 99, 114, 17031, 17039, 117, 116, 101, 33024, 250, 59, 32768, 250, 114, 59, 32768, 8593, 114, 820, 17049, 0, 17053, 121, 59, 32768, 1118, 118, 101, 59, 32768, 365, 512, 105, 121, 17062, 17069, 114, 99, 33024, 251, 59, 32768, 251, 59, 32768, 1091, 768, 97, 98, 104, 17079, 17084, 17090, 114, 114, 59, 32768, 8645, 108, 97, 99, 59, 32768, 369, 97, 114, 59, 32768, 10606, 512, 105, 114, 17100, 17106, 115, 104, 116, 59, 32768, 10622, 59, 32896, 55349, 56626, 114, 97, 118, 101, 33024, 249, 59, 32768, 249, 562, 17123, 17135, 114, 512, 108, 114, 17128, 17131, 59, 32768, 8639, 59, 32768, 8638, 108, 107, 59, 32768, 9600, 512, 99, 116, 17144, 17167, 1088, 17150, 0, 0, 17163, 114, 110, 512, 59, 101, 17156, 17158, 32768, 8988, 114, 59, 32768, 8988, 111, 112, 59, 32768, 8975, 114, 105, 59, 32768, 9720, 512, 97, 108, 17177, 17182, 99, 114, 59, 32768, 363, 33024, 168, 59, 32768, 168, 512, 103, 112, 17192, 17197, 111, 110, 59, 32768, 371, 102, 59, 32896, 55349, 56678, 1536, 97, 100, 104, 108, 115, 117, 17215, 17222, 17233, 17257, 17262, 17280, 114, 114, 111, 119, 59, 32768, 8593, 111, 119, 110, 97, 114, 114, 111, 119, 59, 32768, 8597, 97, 114, 112, 111, 111, 110, 512, 108, 114, 17244, 17250, 101, 102, 116, 59, 32768, 8639, 105, 103, 104, 116, 59, 32768, 8638, 117, 115, 59, 32768, 8846, 105, 768, 59, 104, 108, 17270, 17272, 17275, 32768, 965, 59, 32768, 978, 111, 110, 59, 32768, 965, 112, 97, 114, 114, 111, 119, 115, 59, 32768, 8648, 768, 99, 105, 116, 17297, 17320, 17325, 1088, 17303, 0, 0, 17316, 114, 110, 512, 59, 101, 17309, 17311, 32768, 8989, 114, 59, 32768, 8989, 111, 112, 59, 32768, 8974, 110, 103, 59, 32768, 367, 114, 105, 59, 32768, 9721, 99, 114, 59, 32896, 55349, 56522, 768, 100, 105, 114, 17343, 17348, 17354, 111, 116, 59, 32768, 8944, 108, 100, 101, 59, 32768, 361, 105, 512, 59, 102, 17360, 17362, 32768, 9653, 59, 32768, 9652, 512, 97, 109, 17370, 17375, 114, 114, 59, 32768, 8648, 108, 33024, 252, 59, 32768, 252, 97, 110, 103, 108, 101, 59, 32768, 10663, 3840, 65, 66, 68, 97, 99, 100, 101, 102, 108, 110, 111, 112, 114, 115, 122, 17420, 17425, 17437, 17443, 17613, 17617, 17623, 17667, 17672, 17678, 17693, 17699, 17705, 17711, 17754, 114, 114, 59, 32768, 8661, 97, 114, 512, 59, 118, 17432, 17434, 32768, 10984, 59, 32768, 10985, 97, 115, 104, 59, 32768, 8872, 512, 110, 114, 17448, 17454, 103, 114, 116, 59, 32768, 10652, 1792, 101, 107, 110, 112, 114, 115, 116, 17469, 17478, 17485, 17494, 17515, 17526, 17578, 112, 115, 105, 108, 111, 110, 59, 32768, 1013, 97, 112, 112, 97, 59, 32768, 1008, 111, 116, 104, 105, 110, 103, 59, 32768, 8709, 768, 104, 105, 114, 17501, 17505, 17508, 105, 59, 32768, 981, 59, 32768, 982, 111, 112, 116, 111, 59, 32768, 8733, 512, 59, 104, 17520, 17522, 32768, 8597, 111, 59, 32768, 1009, 512, 105, 117, 17531, 17537, 103, 109, 97, 59, 32768, 962, 512, 98, 112, 17542, 17560, 115, 101, 116, 110, 101, 113, 512, 59, 113, 17553, 17556, 32896, 8842, 65024, 59, 32896, 10955, 65024, 115, 101, 116, 110, 101, 113, 512, 59, 113, 17571, 17574, 32896, 8843, 65024, 59, 32896, 10956, 65024, 512, 104, 114, 17583, 17589, 101, 116, 97, 59, 32768, 977, 105, 97, 110, 103, 108, 101, 512, 108, 114, 17600, 17606, 101, 102, 116, 59, 32768, 8882, 105, 103, 104, 116, 59, 32768, 8883, 121, 59, 32768, 1074, 97, 115, 104, 59, 32768, 8866, 768, 101, 108, 114, 17630, 17648, 17654, 768, 59, 98, 101, 17637, 17639, 17644, 32768, 8744, 97, 114, 59, 32768, 8891, 113, 59, 32768, 8794, 108, 105, 112, 59, 32768, 8942, 512, 98, 116, 17659, 17664, 97, 114, 59, 32768, 124, 59, 32768, 124, 114, 59, 32896, 55349, 56627, 116, 114, 105, 59, 32768, 8882, 115, 117, 512, 98, 112, 17685, 17689, 59, 32896, 8834, 8402, 59, 32896, 8835, 8402, 112, 102, 59, 32896, 55349, 56679, 114, 111, 112, 59, 32768, 8733, 116, 114, 105, 59, 32768, 8883, 512, 99, 117, 17716, 17721, 114, 59, 32896, 55349, 56523, 512, 98, 112, 17726, 17740, 110, 512, 69, 101, 17732, 17736, 59, 32896, 10955, 65024, 59, 32896, 8842, 65024, 110, 512, 69, 101, 17746, 17750, 59, 32896, 10956, 65024, 59, 32896, 8843, 65024, 105, 103, 122, 97, 103, 59, 32768, 10650, 1792, 99, 101, 102, 111, 112, 114, 115, 17777, 17783, 17815, 17820, 17826, 17829, 17842, 105, 114, 99, 59, 32768, 373, 512, 100, 105, 17788, 17809, 512, 98, 103, 17793, 17798, 97, 114, 59, 32768, 10847, 101, 512, 59, 113, 17804, 17806, 32768, 8743, 59, 32768, 8793, 101, 114, 112, 59, 32768, 8472, 114, 59, 32896, 55349, 56628, 112, 102, 59, 32896, 55349, 56680, 59, 32768, 8472, 512, 59, 101, 17834, 17836, 32768, 8768, 97, 116, 104, 59, 32768, 8768, 99, 114, 59, 32896, 55349, 56524, 5428, 17871, 17891, 0, 17897, 0, 17902, 17917, 0, 0, 17920, 17935, 17940, 17945, 0, 0, 17977, 17992, 0, 18008, 18024, 18029, 768, 97, 105, 117, 17877, 17881, 17886, 112, 59, 32768, 8898, 114, 99, 59, 32768, 9711, 112, 59, 32768, 8899, 116, 114, 105, 59, 32768, 9661, 114, 59, 32896, 55349, 56629, 512, 65, 97, 17906, 17911, 114, 114, 59, 32768, 10234, 114, 114, 59, 32768, 10231, 59, 32768, 958, 512, 65, 97, 17924, 17929, 114, 114, 59, 32768, 10232, 114, 114, 59, 32768, 10229, 97, 112, 59, 32768, 10236, 105, 115, 59, 32768, 8955, 768, 100, 112, 116, 17951, 17956, 17970, 111, 116, 59, 32768, 10752, 512, 102, 108, 17961, 17965, 59, 32896, 55349, 56681, 117, 115, 59, 32768, 10753, 105, 109, 101, 59, 32768, 10754, 512, 65, 97, 17981, 17986, 114, 114, 59, 32768, 10233, 114, 114, 59, 32768, 10230, 512, 99, 113, 17996, 18001, 114, 59, 32896, 55349, 56525, 99, 117, 112, 59, 32768, 10758, 512, 112, 116, 18012, 18018, 108, 117, 115, 59, 32768, 10756, 114, 105, 59, 32768, 9651, 101, 101, 59, 32768, 8897, 101, 100, 103, 101, 59, 32768, 8896, 2048, 97, 99, 101, 102, 105, 111, 115, 117, 18052, 18068, 18081, 18087, 18092, 18097, 18103, 18109, 99, 512, 117, 121, 18058, 18065, 116, 101, 33024, 253, 59, 32768, 253, 59, 32768, 1103, 512, 105, 121, 18073, 18078, 114, 99, 59, 32768, 375, 59, 32768, 1099, 110, 33024, 165, 59, 32768, 165, 114, 59, 32896, 55349, 56630, 99, 121, 59, 32768, 1111, 112, 102, 59, 32896, 55349, 56682, 99, 114, 59, 32896, 55349, 56526, 512, 99, 109, 18114, 18118, 121, 59, 32768, 1102, 108, 33024, 255, 59, 32768, 255, 2560, 97, 99, 100, 101, 102, 104, 105, 111, 115, 119, 18145, 18152, 18166, 18171, 18186, 18191, 18196, 18204, 18210, 18216, 99, 117, 116, 101, 59, 32768, 378, 512, 97, 121, 18157, 18163, 114, 111, 110, 59, 32768, 382, 59, 32768, 1079, 111, 116, 59, 32768, 380, 512, 101, 116, 18176, 18182, 116, 114, 102, 59, 32768, 8488, 97, 59, 32768, 950, 114, 59, 32896, 55349, 56631, 99, 121, 59, 32768, 1078, 103, 114, 97, 114, 114, 59, 32768, 8669, 112, 102, 59, 32896, 55349, 56683, 99, 114, 59, 32896, 55349, 56527, 512, 106, 110, 18221, 18224, 59, 32768, 8205, 106, 59, 32768, 8204]);
  }
});

// node_modules/htmlparser2/node_modules/entities/lib/generated/decode-data-xml.js
var require_decode_data_xml = __commonJS({
  "node_modules/htmlparser2/node_modules/entities/lib/generated/decode-data-xml.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = new Uint16Array([1024, 97, 103, 108, 113, 9, 23, 27, 31, 1086, 15, 0, 0, 19, 112, 59, 32768, 38, 111, 115, 59, 32768, 39, 116, 59, 32768, 62, 116, 59, 32768, 60, 117, 111, 116, 59, 32768, 34]);
  }
});

// node_modules/htmlparser2/node_modules/entities/lib/decode.js
var require_decode = __commonJS({
  "node_modules/htmlparser2/node_modules/entities/lib/decode.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decodeXML = exports2.decodeHTMLStrict = exports2.decodeHTML = exports2.determineBranch = exports2.JUMP_OFFSET_BASE = exports2.BinTrieFlags = exports2.xmlDecodeTree = exports2.htmlDecodeTree = void 0;
    var decode_data_html_1 = __importDefault(require_decode_data_html());
    exports2.htmlDecodeTree = decode_data_html_1.default;
    var decode_data_xml_1 = __importDefault(require_decode_data_xml());
    exports2.xmlDecodeTree = decode_data_xml_1.default;
    var decode_codepoint_1 = __importDefault(require_decode_codepoint());
    var BinTrieFlags;
    (function(BinTrieFlags2) {
      BinTrieFlags2[BinTrieFlags2["HAS_VALUE"] = 32768] = "HAS_VALUE";
      BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 32512] = "BRANCH_LENGTH";
      BinTrieFlags2[BinTrieFlags2["MULTI_BYTE"] = 128] = "MULTI_BYTE";
      BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
    })(BinTrieFlags = exports2.BinTrieFlags || (exports2.BinTrieFlags = {}));
    exports2.JUMP_OFFSET_BASE = 48 - 1;
    function getDecoder(decodeTree) {
      return function decodeHTMLBinary(str, strict) {
        var ret = "";
        var lastIdx = 0;
        var strIdx = 0;
        while ((strIdx = str.indexOf("&", strIdx)) >= 0) {
          ret += str.slice(lastIdx, strIdx);
          lastIdx = strIdx;
          strIdx += 1;
          if (str.charCodeAt(strIdx) === 35) {
            var start = strIdx + 1;
            var base = 10;
            var cp = str.charCodeAt(start);
            if ((cp | 32) === 120) {
              base = 16;
              strIdx += 1;
              start += 1;
            }
            while ((cp = str.charCodeAt(++strIdx)) >= 48 && cp <= 57 || base === 16 && (cp | 32) >= 97 && (cp | 32) <= 102)
              ;
            if (start !== strIdx) {
              var entity = str.substring(start, strIdx);
              var parsed = parseInt(entity, base);
              if (str.charCodeAt(strIdx) === 59) {
                strIdx += 1;
              } else if (strict) {
                continue;
              }
              ret += decode_codepoint_1.default(parsed);
              lastIdx = strIdx;
            }
            continue;
          }
          var result = null;
          var excess = 1;
          var treeIdx = 0;
          var current = decodeTree[treeIdx];
          for (; strIdx < str.length; strIdx++, excess++) {
            treeIdx = determineBranch(decodeTree, current, treeIdx + 1, str.charCodeAt(strIdx));
            if (treeIdx < 0)
              break;
            current = decodeTree[treeIdx];
            if (current & BinTrieFlags.HAS_VALUE) {
              if (strict && str.charCodeAt(strIdx) !== 59) {
                treeIdx += 1;
              } else {
                result = current & BinTrieFlags.MULTI_BYTE ? String.fromCharCode(decodeTree[++treeIdx], decodeTree[++treeIdx]) : String.fromCharCode(decodeTree[++treeIdx]);
                excess = 0;
              }
            }
          }
          if (result != null) {
            ret += result;
            lastIdx = strIdx - excess + 1;
          }
        }
        return ret + str.slice(lastIdx);
      };
    }
    function determineBranch(decodeTree, current, nodeIdx, char) {
      if (current <= 128) {
        return char === current ? nodeIdx : -1;
      }
      var branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 8;
      if (branchCount === 0) {
        return -1;
      }
      if (branchCount === 1) {
        return char === decodeTree[nodeIdx] ? nodeIdx + 1 : -1;
      }
      var jumpOffset = current & BinTrieFlags.JUMP_TABLE;
      if (jumpOffset) {
        var value = char - exports2.JUMP_OFFSET_BASE - jumpOffset;
        return value < 0 || value > branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
      }
      var lo = nodeIdx;
      var hi = lo + branchCount - 1;
      while (lo <= hi) {
        var mid = lo + hi >>> 1;
        var midVal = decodeTree[mid];
        if (midVal < char) {
          lo = mid + 1;
        } else if (midVal > char) {
          hi = mid - 1;
        } else {
          return decodeTree[mid + branchCount];
        }
      }
      return -1;
    }
    exports2.determineBranch = determineBranch;
    var htmlDecoder = getDecoder(decode_data_html_1.default);
    var xmlDecoder = getDecoder(decode_data_xml_1.default);
    function decodeHTML(str) {
      return htmlDecoder(str, false);
    }
    exports2.decodeHTML = decodeHTML;
    function decodeHTMLStrict(str) {
      return htmlDecoder(str, true);
    }
    exports2.decodeHTMLStrict = decodeHTMLStrict;
    function decodeXML(str) {
      return xmlDecoder(str, true);
    }
    exports2.decodeXML = decodeXML;
  }
});

// node_modules/htmlparser2/lib/Tokenizer.js
var require_Tokenizer = __commonJS({
  "node_modules/htmlparser2/lib/Tokenizer.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var decode_codepoint_1 = __importDefault(require_decode_codepoint());
    var decode_1 = require_decode();
    function isWhitespace(c) {
      return c === 32 || c === 10 || c === 9 || c === 12 || c === 13;
    }
    function isEndOfTagSection(c) {
      return c === 47 || c === 62 || isWhitespace(c);
    }
    function isNumber(c) {
      return c >= 48 && c <= 57;
    }
    function isASCIIAlpha(c) {
      return c >= 97 && c <= 122 || c >= 65 && c <= 90;
    }
    var Sequences = {
      Cdata: new Uint16Array([67, 68, 65, 84, 65, 91]),
      CdataEnd: new Uint16Array([93, 93, 62]),
      CommentEnd: new Uint16Array([45, 45, 62]),
      ScriptEnd: new Uint16Array([
        60,
        47,
        115,
        99,
        114,
        105,
        112,
        116
      ]),
      StyleEnd: new Uint16Array([60, 47, 115, 116, 121, 108, 101]),
      TitleEnd: new Uint16Array([60, 47, 116, 105, 116, 108, 101])
    };
    var Tokenizer = function() {
      function Tokenizer2(_a, cbs) {
        var _b = _a.xmlMode, xmlMode = _b === void 0 ? false : _b, _c = _a.decodeEntities, decodeEntities = _c === void 0 ? true : _c;
        this.cbs = cbs;
        this._state = 1;
        this.buffer = "";
        this.sectionStart = 0;
        this._index = 0;
        this.bufferOffset = 0;
        this.baseState = 1;
        this.isSpecial = false;
        this.running = true;
        this.ended = false;
        this.sequenceIndex = 0;
        this.trieIndex = 0;
        this.trieCurrent = 0;
        this.trieResult = null;
        this.entityExcess = 0;
        this.xmlMode = xmlMode;
        this.decodeEntities = decodeEntities;
        this.entityTrie = xmlMode ? decode_1.xmlDecodeTree : decode_1.htmlDecodeTree;
      }
      Tokenizer2.prototype.reset = function() {
        this._state = 1;
        this.buffer = "";
        this.sectionStart = 0;
        this._index = 0;
        this.bufferOffset = 0;
        this.baseState = 1;
        this.currentSequence = void 0;
        this.running = true;
        this.ended = false;
      };
      Tokenizer2.prototype.write = function(chunk) {
        if (this.ended)
          return this.cbs.onerror(Error(".write() after done!"));
        this.buffer += chunk;
        this.parse();
      };
      Tokenizer2.prototype.end = function(chunk) {
        if (this.ended)
          return this.cbs.onerror(Error(".end() after done!"));
        if (chunk)
          this.write(chunk);
        this.ended = true;
        if (this.running)
          this.finish();
      };
      Tokenizer2.prototype.pause = function() {
        this.running = false;
      };
      Tokenizer2.prototype.resume = function() {
        this.running = true;
        if (this._index < this.buffer.length) {
          this.parse();
        }
        if (this.ended) {
          this.finish();
        }
      };
      Tokenizer2.prototype.getAbsoluteSectionStart = function() {
        return this.sectionStart + this.bufferOffset;
      };
      Tokenizer2.prototype.getAbsoluteIndex = function() {
        return this.bufferOffset + this._index;
      };
      Tokenizer2.prototype.stateText = function(c) {
        if (c === 60 || !this.decodeEntities && this.fastForwardTo(60)) {
          if (this._index > this.sectionStart) {
            this.cbs.ontext(this.getSection());
          }
          this._state = 2;
          this.sectionStart = this._index;
        } else if (this.decodeEntities && c === 38) {
          this._state = 25;
        }
      };
      Tokenizer2.prototype.stateSpecialStartSequence = function(c) {
        var isEnd = this.sequenceIndex === this.currentSequence.length;
        var isMatch = isEnd ? isEndOfTagSection(c) : (c | 32) === this.currentSequence[this.sequenceIndex];
        if (!isMatch) {
          this.isSpecial = false;
        } else if (!isEnd) {
          this.sequenceIndex++;
          return;
        }
        this.sequenceIndex = 0;
        this._state = 3;
        this.stateInTagName(c);
      };
      Tokenizer2.prototype.stateInSpecialTag = function(c) {
        if (this.sequenceIndex === this.currentSequence.length) {
          if (c === 62 || isWhitespace(c)) {
            var endOfText = this._index - this.currentSequence.length;
            if (this.sectionStart < endOfText) {
              var actualIndex = this._index;
              this._index = endOfText;
              this.cbs.ontext(this.getSection());
              this._index = actualIndex;
            }
            this.isSpecial = false;
            this.sectionStart = endOfText + 2;
            this.stateInClosingTagName(c);
            return;
          }
          this.sequenceIndex = 0;
        }
        if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
          this.sequenceIndex += 1;
        } else if (this.sequenceIndex === 0) {
          if (this.currentSequence === Sequences.TitleEnd) {
            if (this.decodeEntities && c === 38) {
              this._state = 25;
            }
          } else if (this.fastForwardTo(60)) {
            this.sequenceIndex = 1;
          }
        } else {
          this.sequenceIndex = Number(c === 60);
        }
      };
      Tokenizer2.prototype.stateCDATASequence = function(c) {
        if (c === Sequences.Cdata[this.sequenceIndex]) {
          if (++this.sequenceIndex === Sequences.Cdata.length) {
            this._state = 21;
            this.currentSequence = Sequences.CdataEnd;
            this.sequenceIndex = 0;
            this.sectionStart = this._index + 1;
          }
        } else {
          this.sequenceIndex = 0;
          this._state = 16;
          this.stateInDeclaration(c);
        }
      };
      Tokenizer2.prototype.fastForwardTo = function(c) {
        while (++this._index < this.buffer.length) {
          if (this.buffer.charCodeAt(this._index) === c) {
            return true;
          }
        }
        this._index = this.buffer.length - 1;
        return false;
      };
      Tokenizer2.prototype.stateInCommentLike = function(c) {
        if (c === this.currentSequence[this.sequenceIndex]) {
          if (++this.sequenceIndex === this.currentSequence.length) {
            var section = this.buffer.slice(this.sectionStart, this._index - 2);
            if (this.currentSequence === Sequences.CdataEnd) {
              this.cbs.oncdata(section);
            } else {
              this.cbs.oncomment(section);
            }
            this.sequenceIndex = 0;
            this.sectionStart = this._index + 1;
            this._state = 1;
          }
        } else if (this.sequenceIndex === 0) {
          if (this.fastForwardTo(this.currentSequence[0])) {
            this.sequenceIndex = 1;
          }
        } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
          this.sequenceIndex = 0;
        }
      };
      Tokenizer2.prototype.isTagStartChar = function(c) {
        return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
      };
      Tokenizer2.prototype.startSpecial = function(sequence, offset) {
        this.isSpecial = true;
        this.currentSequence = sequence;
        this.sequenceIndex = offset;
        this._state = 23;
      };
      Tokenizer2.prototype.stateBeforeTagName = function(c) {
        if (c === 33) {
          this._state = 15;
          this.sectionStart = this._index + 1;
        } else if (c === 63) {
          this._state = 17;
          this.sectionStart = this._index + 1;
        } else if (this.isTagStartChar(c)) {
          var lower = c | 32;
          this.sectionStart = this._index;
          if (!this.xmlMode && lower === Sequences.TitleEnd[2]) {
            this.startSpecial(Sequences.TitleEnd, 3);
          } else {
            this._state = !this.xmlMode && lower === Sequences.ScriptEnd[2] ? 22 : 3;
          }
        } else if (c === 47) {
          this._state = 5;
        } else {
          this._state = 1;
          this.stateText(c);
        }
      };
      Tokenizer2.prototype.stateInTagName = function(c) {
        if (isEndOfTagSection(c)) {
          this.cbs.onopentagname(this.getSection());
          this.sectionStart = -1;
          this._state = 8;
          this.stateBeforeAttributeName(c);
        }
      };
      Tokenizer2.prototype.stateBeforeClosingTagName = function(c) {
        if (isWhitespace(c)) {
        } else if (c === 62) {
          this._state = 1;
        } else {
          this._state = this.isTagStartChar(c) ? 6 : 20;
          this.sectionStart = this._index;
        }
      };
      Tokenizer2.prototype.stateInClosingTagName = function(c) {
        if (c === 62 || isWhitespace(c)) {
          this.cbs.onclosetag(this.getSection());
          this.sectionStart = -1;
          this._state = 7;
          this.stateAfterClosingTagName(c);
        }
      };
      Tokenizer2.prototype.stateAfterClosingTagName = function(c) {
        if (c === 62 || this.fastForwardTo(62)) {
          this._state = 1;
          this.sectionStart = this._index + 1;
        }
      };
      Tokenizer2.prototype.stateBeforeAttributeName = function(c) {
        if (c === 62) {
          this.cbs.onopentagend();
          if (this.isSpecial) {
            this._state = 24;
            this.sequenceIndex = 0;
          } else {
            this._state = 1;
          }
          this.baseState = this._state;
          this.sectionStart = this._index + 1;
        } else if (c === 47) {
          this._state = 4;
        } else if (!isWhitespace(c)) {
          this._state = 9;
          this.sectionStart = this._index;
        }
      };
      Tokenizer2.prototype.stateInSelfClosingTag = function(c) {
        if (c === 62) {
          this.cbs.onselfclosingtag();
          this._state = 1;
          this.baseState = 1;
          this.sectionStart = this._index + 1;
          this.isSpecial = false;
        } else if (!isWhitespace(c)) {
          this._state = 8;
          this.stateBeforeAttributeName(c);
        }
      };
      Tokenizer2.prototype.stateInAttributeName = function(c) {
        if (c === 61 || isEndOfTagSection(c)) {
          this.cbs.onattribname(this.getSection());
          this.sectionStart = -1;
          this._state = 10;
          this.stateAfterAttributeName(c);
        }
      };
      Tokenizer2.prototype.stateAfterAttributeName = function(c) {
        if (c === 61) {
          this._state = 11;
        } else if (c === 47 || c === 62) {
          this.cbs.onattribend(void 0);
          this._state = 8;
          this.stateBeforeAttributeName(c);
        } else if (!isWhitespace(c)) {
          this.cbs.onattribend(void 0);
          this._state = 9;
          this.sectionStart = this._index;
        }
      };
      Tokenizer2.prototype.stateBeforeAttributeValue = function(c) {
        if (c === 34) {
          this._state = 12;
          this.sectionStart = this._index + 1;
        } else if (c === 39) {
          this._state = 13;
          this.sectionStart = this._index + 1;
        } else if (!isWhitespace(c)) {
          this.sectionStart = this._index;
          this._state = 14;
          this.stateInAttributeValueNoQuotes(c);
        }
      };
      Tokenizer2.prototype.handleInAttributeValue = function(c, quote) {
        if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
          this.cbs.onattribdata(this.getSection());
          this.sectionStart = -1;
          this.cbs.onattribend(String.fromCharCode(quote));
          this._state = 8;
        } else if (this.decodeEntities && c === 38) {
          this.baseState = this._state;
          this._state = 25;
        }
      };
      Tokenizer2.prototype.stateInAttributeValueDoubleQuotes = function(c) {
        this.handleInAttributeValue(c, 34);
      };
      Tokenizer2.prototype.stateInAttributeValueSingleQuotes = function(c) {
        this.handleInAttributeValue(c, 39);
      };
      Tokenizer2.prototype.stateInAttributeValueNoQuotes = function(c) {
        if (isWhitespace(c) || c === 62) {
          this.cbs.onattribdata(this.getSection());
          this.sectionStart = -1;
          this.cbs.onattribend(null);
          this._state = 8;
          this.stateBeforeAttributeName(c);
        } else if (this.decodeEntities && c === 38) {
          this.baseState = this._state;
          this._state = 25;
        }
      };
      Tokenizer2.prototype.stateBeforeDeclaration = function(c) {
        if (c === 91) {
          this._state = 19;
          this.sequenceIndex = 0;
        } else {
          this._state = c === 45 ? 18 : 16;
        }
      };
      Tokenizer2.prototype.stateInDeclaration = function(c) {
        if (c === 62 || this.fastForwardTo(62)) {
          this.cbs.ondeclaration(this.getSection());
          this._state = 1;
          this.sectionStart = this._index + 1;
        }
      };
      Tokenizer2.prototype.stateInProcessingInstruction = function(c) {
        if (c === 62 || this.fastForwardTo(62)) {
          this.cbs.onprocessinginstruction(this.getSection());
          this._state = 1;
          this.sectionStart = this._index + 1;
        }
      };
      Tokenizer2.prototype.stateBeforeComment = function(c) {
        if (c === 45) {
          this._state = 21;
          this.currentSequence = Sequences.CommentEnd;
          this.sequenceIndex = 2;
          this.sectionStart = this._index + 1;
        } else {
          this._state = 16;
        }
      };
      Tokenizer2.prototype.stateInSpecialComment = function(c) {
        if (c === 62 || this.fastForwardTo(62)) {
          this.cbs.oncomment(this.getSection());
          this._state = 1;
          this.sectionStart = this._index + 1;
        }
      };
      Tokenizer2.prototype.stateBeforeSpecialS = function(c) {
        var lower = c | 32;
        if (lower === Sequences.ScriptEnd[3]) {
          this.startSpecial(Sequences.ScriptEnd, 4);
        } else if (lower === Sequences.StyleEnd[3]) {
          this.startSpecial(Sequences.StyleEnd, 4);
        } else {
          this._state = 3;
          this.stateInTagName(c);
        }
      };
      Tokenizer2.prototype.stateBeforeEntity = function(c) {
        this.entityExcess = 1;
        if (c === 35) {
          this._state = 26;
        } else if (c === 38) {
        } else {
          this.trieIndex = 0;
          this.trieCurrent = this.entityTrie[0];
          this.trieResult = null;
          this._state = 27;
          this.stateInNamedEntity(c);
        }
      };
      Tokenizer2.prototype.stateInNamedEntity = function(c) {
        this.entityExcess += 1;
        this.trieIndex = (0, decode_1.determineBranch)(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c);
        if (this.trieIndex < 0) {
          this.emitNamedEntity();
          this._index--;
          return;
        }
        this.trieCurrent = this.entityTrie[this.trieIndex];
        if (this.trieCurrent & decode_1.BinTrieFlags.HAS_VALUE) {
          if (!this.allowLegacyEntity() && c !== 59) {
            this.trieIndex += 1;
          } else {
            var entityStart = this._index - this.entityExcess + 1;
            if (entityStart > this.sectionStart) {
              this.emitPartial(this.buffer.substring(this.sectionStart, entityStart));
            }
            this.trieResult = this.trieCurrent & decode_1.BinTrieFlags.MULTI_BYTE ? String.fromCharCode(this.entityTrie[++this.trieIndex], this.entityTrie[++this.trieIndex]) : String.fromCharCode(this.entityTrie[++this.trieIndex]);
            this.entityExcess = 0;
            this.sectionStart = this._index + 1;
          }
        }
      };
      Tokenizer2.prototype.emitNamedEntity = function() {
        if (this.trieResult) {
          this.emitPartial(this.trieResult);
        }
        this._state = this.baseState;
      };
      Tokenizer2.prototype.stateBeforeNumericEntity = function(c) {
        if ((c | 32) === 120) {
          this.entityExcess++;
          this._state = 29;
        } else {
          this._state = 28;
          this.stateInNumericEntity(c);
        }
      };
      Tokenizer2.prototype.decodeNumericEntity = function(base, strict) {
        var entityStart = this._index - this.entityExcess - 1;
        var numberStart = entityStart + 2 + (base >> 4);
        if (numberStart !== this._index) {
          if (entityStart > this.sectionStart) {
            this.emitPartial(this.buffer.substring(this.sectionStart, entityStart));
          }
          var entity = this.buffer.substring(numberStart, this._index);
          var parsed = parseInt(entity, base);
          this.emitPartial((0, decode_codepoint_1.default)(parsed));
          this.sectionStart = this._index + Number(strict);
        }
        this._state = this.baseState;
      };
      Tokenizer2.prototype.stateInNumericEntity = function(c) {
        if (c === 59) {
          this.decodeNumericEntity(10, true);
        } else if (!isNumber(c)) {
          if (this.allowLegacyEntity()) {
            this.decodeNumericEntity(10, false);
          } else {
            this._state = this.baseState;
          }
          this._index--;
        } else {
          this.entityExcess++;
        }
      };
      Tokenizer2.prototype.stateInHexEntity = function(c) {
        if (c === 59) {
          this.decodeNumericEntity(16, true);
        } else if ((c < 97 || c > 102) && (c < 65 || c > 70) && !isNumber(c)) {
          if (this.allowLegacyEntity()) {
            this.decodeNumericEntity(16, false);
          } else {
            this._state = this.baseState;
          }
          this._index--;
        } else {
          this.entityExcess++;
        }
      };
      Tokenizer2.prototype.allowLegacyEntity = function() {
        return !this.xmlMode && (this.baseState === 1 || this.baseState === 24);
      };
      Tokenizer2.prototype.cleanup = function() {
        if (this.running && this.sectionStart !== this._index && (this._state === 1 || this._state === 24 && this.sequenceIndex === 0)) {
          this.cbs.ontext(this.buffer.substr(this.sectionStart));
          this.sectionStart = this._index;
        }
        var start = this.sectionStart < 0 ? this._index : this.sectionStart;
        this.buffer = start === this.buffer.length ? "" : this.buffer.substr(start);
        this._index -= start;
        this.bufferOffset += start;
        if (this.sectionStart > 0) {
          this.sectionStart = 0;
        }
      };
      Tokenizer2.prototype.shouldContinue = function() {
        return this._index < this.buffer.length && this.running;
      };
      Tokenizer2.prototype.parse = function() {
        while (this.shouldContinue()) {
          var c = this.buffer.charCodeAt(this._index);
          if (this._state === 1) {
            this.stateText(c);
          } else if (this._state === 23) {
            this.stateSpecialStartSequence(c);
          } else if (this._state === 24) {
            this.stateInSpecialTag(c);
          } else if (this._state === 19) {
            this.stateCDATASequence(c);
          } else if (this._state === 12) {
            this.stateInAttributeValueDoubleQuotes(c);
          } else if (this._state === 9) {
            this.stateInAttributeName(c);
          } else if (this._state === 21) {
            this.stateInCommentLike(c);
          } else if (this._state === 20) {
            this.stateInSpecialComment(c);
          } else if (this._state === 8) {
            this.stateBeforeAttributeName(c);
          } else if (this._state === 3) {
            this.stateInTagName(c);
          } else if (this._state === 6) {
            this.stateInClosingTagName(c);
          } else if (this._state === 2) {
            this.stateBeforeTagName(c);
          } else if (this._state === 10) {
            this.stateAfterAttributeName(c);
          } else if (this._state === 13) {
            this.stateInAttributeValueSingleQuotes(c);
          } else if (this._state === 11) {
            this.stateBeforeAttributeValue(c);
          } else if (this._state === 5) {
            this.stateBeforeClosingTagName(c);
          } else if (this._state === 7) {
            this.stateAfterClosingTagName(c);
          } else if (this._state === 22) {
            this.stateBeforeSpecialS(c);
          } else if (this._state === 14) {
            this.stateInAttributeValueNoQuotes(c);
          } else if (this._state === 4) {
            this.stateInSelfClosingTag(c);
          } else if (this._state === 16) {
            this.stateInDeclaration(c);
          } else if (this._state === 15) {
            this.stateBeforeDeclaration(c);
          } else if (this._state === 18) {
            this.stateBeforeComment(c);
          } else if (this._state === 17) {
            this.stateInProcessingInstruction(c);
          } else if (this._state === 27) {
            this.stateInNamedEntity(c);
          } else if (this._state === 25) {
            this.stateBeforeEntity(c);
          } else if (this._state === 29) {
            this.stateInHexEntity(c);
          } else if (this._state === 28) {
            this.stateInNumericEntity(c);
          } else {
            this.stateBeforeNumericEntity(c);
          }
          this._index++;
        }
        this.cleanup();
      };
      Tokenizer2.prototype.finish = function() {
        if (this._state === 27) {
          this.emitNamedEntity();
        }
        if (this.sectionStart < this._index) {
          this.handleTrailingData();
        }
        this.cbs.onend();
      };
      Tokenizer2.prototype.handleTrailingData = function() {
        var data = this.buffer.substr(this.sectionStart);
        if (this._state === 21) {
          if (this.currentSequence === Sequences.CdataEnd) {
            this.cbs.oncdata(data);
          } else {
            this.cbs.oncomment(data);
          }
        } else if (this._state === 28 && this.allowLegacyEntity()) {
          this.decodeNumericEntity(10, false);
        } else if (this._state === 29 && this.allowLegacyEntity()) {
          this.decodeNumericEntity(16, false);
        } else if (this._state === 3 || this._state === 8 || this._state === 11 || this._state === 10 || this._state === 9 || this._state === 13 || this._state === 12 || this._state === 14 || this._state === 6) {
        } else {
          this.cbs.ontext(data);
        }
      };
      Tokenizer2.prototype.getSection = function() {
        return this.buffer.substring(this.sectionStart, this._index);
      };
      Tokenizer2.prototype.emitPartial = function(value) {
        if (this.baseState !== 1 && this.baseState !== 24) {
          this.cbs.onattribdata(value);
        } else {
          this.cbs.ontext(value);
        }
      };
      return Tokenizer2;
    }();
    exports2.default = Tokenizer;
  }
});

// node_modules/htmlparser2/lib/Parser.js
var require_Parser = __commonJS({
  "node_modules/htmlparser2/lib/Parser.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Parser = void 0;
    var Tokenizer_1 = __importDefault(require_Tokenizer());
    var formTags = new Set([
      "input",
      "option",
      "optgroup",
      "select",
      "button",
      "datalist",
      "textarea"
    ]);
    var pTag = new Set(["p"]);
    var tableSectionTags = new Set(["thead", "tbody"]);
    var ddtTags = new Set(["dd", "dt"]);
    var rtpTags = new Set(["rt", "rp"]);
    var openImpliesClose = new Map([
      ["tr", new Set(["tr", "th", "td"])],
      ["th", new Set(["th"])],
      ["td", new Set(["thead", "th", "td"])],
      ["body", new Set(["head", "link", "script"])],
      ["li", new Set(["li"])],
      ["p", pTag],
      ["h1", pTag],
      ["h2", pTag],
      ["h3", pTag],
      ["h4", pTag],
      ["h5", pTag],
      ["h6", pTag],
      ["select", formTags],
      ["input", formTags],
      ["output", formTags],
      ["button", formTags],
      ["datalist", formTags],
      ["textarea", formTags],
      ["option", new Set(["option"])],
      ["optgroup", new Set(["optgroup", "option"])],
      ["dd", ddtTags],
      ["dt", ddtTags],
      ["address", pTag],
      ["article", pTag],
      ["aside", pTag],
      ["blockquote", pTag],
      ["details", pTag],
      ["div", pTag],
      ["dl", pTag],
      ["fieldset", pTag],
      ["figcaption", pTag],
      ["figure", pTag],
      ["footer", pTag],
      ["form", pTag],
      ["header", pTag],
      ["hr", pTag],
      ["main", pTag],
      ["nav", pTag],
      ["ol", pTag],
      ["pre", pTag],
      ["section", pTag],
      ["table", pTag],
      ["ul", pTag],
      ["rt", rtpTags],
      ["rp", rtpTags],
      ["tbody", tableSectionTags],
      ["tfoot", tableSectionTags]
    ]);
    var voidElements = new Set([
      "area",
      "base",
      "basefont",
      "br",
      "col",
      "command",
      "embed",
      "frame",
      "hr",
      "img",
      "input",
      "isindex",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ]);
    var foreignContextElements = new Set(["math", "svg"]);
    var htmlIntegrationElements = new Set([
      "mi",
      "mo",
      "mn",
      "ms",
      "mtext",
      "annotation-xml",
      "foreignobject",
      "desc",
      "title"
    ]);
    var reNameEnd = /\s|\//;
    var Parser = function() {
      function Parser2(cbs, options) {
        if (options === void 0) {
          options = {};
        }
        var _a, _b, _c, _d, _e;
        this.options = options;
        this.startIndex = 0;
        this.endIndex = 0;
        this.openTagStart = 0;
        this.tagname = "";
        this.attribname = "";
        this.attribvalue = "";
        this.attribs = null;
        this.stack = [];
        this.foreignContext = [];
        this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
        this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : !options.xmlMode;
        this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : !options.xmlMode;
        this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== void 0 ? _c : Tokenizer_1.default)(this.options, this);
        (_e = (_d = this.cbs).onparserinit) === null || _e === void 0 ? void 0 : _e.call(_d, this);
      }
      Parser2.prototype.ontext = function(data) {
        var _a, _b;
        var idx = this.tokenizer.getAbsoluteIndex();
        this.endIndex = idx - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        this.startIndex = idx;
      };
      Parser2.prototype.isVoidElement = function(name) {
        return !this.options.xmlMode && voidElements.has(name);
      };
      Parser2.prototype.onopentagname = function(name) {
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        if (this.lowerCaseTagNames) {
          name = name.toLowerCase();
        }
        this.emitOpenTag(name);
      };
      Parser2.prototype.emitOpenTag = function(name) {
        var _a, _b, _c, _d;
        this.openTagStart = this.startIndex;
        this.tagname = name;
        var impliesClose = !this.options.xmlMode && openImpliesClose.get(name);
        if (impliesClose) {
          while (this.stack.length > 0 && impliesClose.has(this.stack[this.stack.length - 1])) {
            var el = this.stack.pop();
            (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, el, true);
          }
        }
        if (!this.isVoidElement(name)) {
          this.stack.push(name);
          if (foreignContextElements.has(name)) {
            this.foreignContext.push(true);
          } else if (htmlIntegrationElements.has(name)) {
            this.foreignContext.push(false);
          }
        }
        (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, name);
        if (this.cbs.onopentag)
          this.attribs = {};
      };
      Parser2.prototype.endOpenTag = function(isImplied) {
        var _a, _b;
        this.startIndex = this.openTagStart;
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        if (this.attribs) {
          (_b = (_a = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a, this.tagname, this.attribs, isImplied);
          this.attribs = null;
        }
        if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
          this.cbs.onclosetag(this.tagname, true);
        }
        this.tagname = "";
      };
      Parser2.prototype.onopentagend = function() {
        this.endOpenTag(false);
        this.startIndex = this.endIndex + 1;
      };
      Parser2.prototype.onclosetag = function(name) {
        var _a, _b, _c, _d, _e, _f;
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        if (this.lowerCaseTagNames) {
          name = name.toLowerCase();
        }
        if (foreignContextElements.has(name) || htmlIntegrationElements.has(name)) {
          this.foreignContext.pop();
        }
        if (!this.isVoidElement(name)) {
          var pos = this.stack.lastIndexOf(name);
          if (pos !== -1) {
            if (this.cbs.onclosetag) {
              var count = this.stack.length - pos;
              while (count--) {
                this.cbs.onclosetag(this.stack.pop(), count !== 0);
              }
            } else
              this.stack.length = pos;
          } else if (!this.options.xmlMode && name === "p") {
            this.emitOpenTag(name);
            this.closeCurrentTag(true);
          }
        } else if (!this.options.xmlMode && name === "br") {
          (_b = (_a = this.cbs).onopentagname) === null || _b === void 0 ? void 0 : _b.call(_a, name);
          (_d = (_c = this.cbs).onopentag) === null || _d === void 0 ? void 0 : _d.call(_c, name, {}, true);
          (_f = (_e = this.cbs).onclosetag) === null || _f === void 0 ? void 0 : _f.call(_e, name, false);
        }
        this.startIndex = this.endIndex + 1;
      };
      Parser2.prototype.onselfclosingtag = function() {
        if (this.options.xmlMode || this.options.recognizeSelfClosing || this.foreignContext[this.foreignContext.length - 1]) {
          this.closeCurrentTag(false);
          this.startIndex = this.endIndex + 1;
        } else {
          this.onopentagend();
        }
      };
      Parser2.prototype.closeCurrentTag = function(isOpenImplied) {
        var _a, _b;
        var name = this.tagname;
        this.endOpenTag(isOpenImplied);
        if (this.stack[this.stack.length - 1] === name) {
          (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, name, !isOpenImplied);
          this.stack.pop();
        }
      };
      Parser2.prototype.onattribname = function(name) {
        this.startIndex = this.tokenizer.getAbsoluteSectionStart();
        if (this.lowerCaseAttributeNames) {
          name = name.toLowerCase();
        }
        this.attribname = name;
      };
      Parser2.prototype.onattribdata = function(value) {
        this.attribvalue += value;
      };
      Parser2.prototype.onattribend = function(quote) {
        var _a, _b;
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        (_b = (_a = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a, this.attribname, this.attribvalue, quote);
        if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
          this.attribs[this.attribname] = this.attribvalue;
        }
        this.attribname = "";
        this.attribvalue = "";
      };
      Parser2.prototype.getInstructionName = function(value) {
        var idx = value.search(reNameEnd);
        var name = idx < 0 ? value : value.substr(0, idx);
        if (this.lowerCaseTagNames) {
          name = name.toLowerCase();
        }
        return name;
      };
      Parser2.prototype.ondeclaration = function(value) {
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        if (this.cbs.onprocessinginstruction) {
          var name_1 = this.getInstructionName(value);
          this.cbs.onprocessinginstruction("!" + name_1, "!" + value);
        }
        this.startIndex = this.endIndex + 1;
      };
      Parser2.prototype.onprocessinginstruction = function(value) {
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        if (this.cbs.onprocessinginstruction) {
          var name_2 = this.getInstructionName(value);
          this.cbs.onprocessinginstruction("?" + name_2, "?" + value);
        }
        this.startIndex = this.endIndex + 1;
      };
      Parser2.prototype.oncomment = function(value) {
        var _a, _b, _c, _d;
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        (_b = (_a = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a, value);
        (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
        this.startIndex = this.endIndex + 1;
      };
      Parser2.prototype.oncdata = function(value) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.endIndex = this.tokenizer.getAbsoluteIndex();
        if (this.options.xmlMode || this.options.recognizeCDATA) {
          (_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a);
          (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
          (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
        } else {
          (_h = (_g = this.cbs).oncomment) === null || _h === void 0 ? void 0 : _h.call(_g, "[CDATA[" + value + "]]");
          (_k = (_j = this.cbs).oncommentend) === null || _k === void 0 ? void 0 : _k.call(_j);
        }
        this.startIndex = this.endIndex + 1;
      };
      Parser2.prototype.onerror = function(err) {
        var _a, _b;
        (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, err);
      };
      Parser2.prototype.onend = function() {
        var _a, _b;
        if (this.cbs.onclosetag) {
          this.endIndex = this.startIndex;
          for (var i = this.stack.length; i > 0; this.cbs.onclosetag(this.stack[--i], true))
            ;
        }
        (_b = (_a = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a);
      };
      Parser2.prototype.reset = function() {
        var _a, _b, _c, _d;
        (_b = (_a = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.tokenizer.reset();
        this.tagname = "";
        this.attribname = "";
        this.attribs = null;
        this.stack = [];
        this.startIndex = 0;
        this.endIndex = 0;
        (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
      };
      Parser2.prototype.parseComplete = function(data) {
        this.reset();
        this.end(data);
      };
      Parser2.prototype.write = function(chunk) {
        this.tokenizer.write(chunk);
      };
      Parser2.prototype.end = function(chunk) {
        this.tokenizer.end(chunk);
      };
      Parser2.prototype.pause = function() {
        this.tokenizer.pause();
      };
      Parser2.prototype.resume = function() {
        this.tokenizer.resume();
      };
      Parser2.prototype.parseChunk = function(chunk) {
        this.write(chunk);
      };
      Parser2.prototype.done = function(chunk) {
        this.end(chunk);
      };
      return Parser2;
    }();
    exports2.Parser = Parser;
  }
});

// node_modules/domelementtype/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/domelementtype/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Doctype = exports2.CDATA = exports2.Tag = exports2.Style = exports2.Script = exports2.Comment = exports2.Directive = exports2.Text = exports2.Root = exports2.isTag = exports2.ElementType = void 0;
    var ElementType;
    (function(ElementType2) {
      ElementType2["Root"] = "root";
      ElementType2["Text"] = "text";
      ElementType2["Directive"] = "directive";
      ElementType2["Comment"] = "comment";
      ElementType2["Script"] = "script";
      ElementType2["Style"] = "style";
      ElementType2["Tag"] = "tag";
      ElementType2["CDATA"] = "cdata";
      ElementType2["Doctype"] = "doctype";
    })(ElementType = exports2.ElementType || (exports2.ElementType = {}));
    function isTag(elem) {
      return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
    }
    exports2.isTag = isTag;
    exports2.Root = ElementType.Root;
    exports2.Text = ElementType.Text;
    exports2.Directive = ElementType.Directive;
    exports2.Comment = ElementType.Comment;
    exports2.Script = ElementType.Script;
    exports2.Style = ElementType.Style;
    exports2.Tag = ElementType.Tag;
    exports2.CDATA = ElementType.CDATA;
    exports2.Doctype = ElementType.Doctype;
  }
});

// node_modules/domhandler/lib/node.js
var require_node = __commonJS({
  "node_modules/domhandler/lib/node.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (Object.prototype.hasOwnProperty.call(b2, p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.cloneNode = exports2.hasChildren = exports2.isDocument = exports2.isDirective = exports2.isComment = exports2.isText = exports2.isCDATA = exports2.isTag = exports2.Element = exports2.Document = exports2.NodeWithChildren = exports2.ProcessingInstruction = exports2.Comment = exports2.Text = exports2.DataNode = exports2.Node = void 0;
    var domelementtype_1 = require_lib2();
    var nodeTypes = new Map([
      [domelementtype_1.ElementType.Tag, 1],
      [domelementtype_1.ElementType.Script, 1],
      [domelementtype_1.ElementType.Style, 1],
      [domelementtype_1.ElementType.Directive, 1],
      [domelementtype_1.ElementType.Text, 3],
      [domelementtype_1.ElementType.CDATA, 4],
      [domelementtype_1.ElementType.Comment, 8],
      [domelementtype_1.ElementType.Root, 9]
    ]);
    var Node = function() {
      function Node2(type) {
        this.type = type;
        this.parent = null;
        this.prev = null;
        this.next = null;
        this.startIndex = null;
        this.endIndex = null;
      }
      Object.defineProperty(Node2.prototype, "nodeType", {
        get: function() {
          var _a;
          return (_a = nodeTypes.get(this.type)) !== null && _a !== void 0 ? _a : 1;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Node2.prototype, "parentNode", {
        get: function() {
          return this.parent;
        },
        set: function(parent) {
          this.parent = parent;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Node2.prototype, "previousSibling", {
        get: function() {
          return this.prev;
        },
        set: function(prev) {
          this.prev = prev;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Node2.prototype, "nextSibling", {
        get: function() {
          return this.next;
        },
        set: function(next) {
          this.next = next;
        },
        enumerable: false,
        configurable: true
      });
      Node2.prototype.cloneNode = function(recursive) {
        if (recursive === void 0) {
          recursive = false;
        }
        return cloneNode(this, recursive);
      };
      return Node2;
    }();
    exports2.Node = Node;
    var DataNode = function(_super) {
      __extends(DataNode2, _super);
      function DataNode2(type, data) {
        var _this = _super.call(this, type) || this;
        _this.data = data;
        return _this;
      }
      Object.defineProperty(DataNode2.prototype, "nodeValue", {
        get: function() {
          return this.data;
        },
        set: function(data) {
          this.data = data;
        },
        enumerable: false,
        configurable: true
      });
      return DataNode2;
    }(Node);
    exports2.DataNode = DataNode;
    var Text = function(_super) {
      __extends(Text2, _super);
      function Text2(data) {
        return _super.call(this, domelementtype_1.ElementType.Text, data) || this;
      }
      return Text2;
    }(DataNode);
    exports2.Text = Text;
    var Comment = function(_super) {
      __extends(Comment2, _super);
      function Comment2(data) {
        return _super.call(this, domelementtype_1.ElementType.Comment, data) || this;
      }
      return Comment2;
    }(DataNode);
    exports2.Comment = Comment;
    var ProcessingInstruction = function(_super) {
      __extends(ProcessingInstruction2, _super);
      function ProcessingInstruction2(name, data) {
        var _this = _super.call(this, domelementtype_1.ElementType.Directive, data) || this;
        _this.name = name;
        return _this;
      }
      return ProcessingInstruction2;
    }(DataNode);
    exports2.ProcessingInstruction = ProcessingInstruction;
    var NodeWithChildren = function(_super) {
      __extends(NodeWithChildren2, _super);
      function NodeWithChildren2(type, children) {
        var _this = _super.call(this, type) || this;
        _this.children = children;
        return _this;
      }
      Object.defineProperty(NodeWithChildren2.prototype, "firstChild", {
        get: function() {
          var _a;
          return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(NodeWithChildren2.prototype, "lastChild", {
        get: function() {
          return this.children.length > 0 ? this.children[this.children.length - 1] : null;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(NodeWithChildren2.prototype, "childNodes", {
        get: function() {
          return this.children;
        },
        set: function(children) {
          this.children = children;
        },
        enumerable: false,
        configurable: true
      });
      return NodeWithChildren2;
    }(Node);
    exports2.NodeWithChildren = NodeWithChildren;
    var Document = function(_super) {
      __extends(Document2, _super);
      function Document2(children) {
        return _super.call(this, domelementtype_1.ElementType.Root, children) || this;
      }
      return Document2;
    }(NodeWithChildren);
    exports2.Document = Document;
    var Element = function(_super) {
      __extends(Element2, _super);
      function Element2(name, attribs, children, type) {
        if (children === void 0) {
          children = [];
        }
        if (type === void 0) {
          type = name === "script" ? domelementtype_1.ElementType.Script : name === "style" ? domelementtype_1.ElementType.Style : domelementtype_1.ElementType.Tag;
        }
        var _this = _super.call(this, type, children) || this;
        _this.name = name;
        _this.attribs = attribs;
        return _this;
      }
      Object.defineProperty(Element2.prototype, "tagName", {
        get: function() {
          return this.name;
        },
        set: function(name) {
          this.name = name;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Element2.prototype, "attributes", {
        get: function() {
          var _this = this;
          return Object.keys(this.attribs).map(function(name) {
            var _a, _b;
            return {
              name,
              value: _this.attribs[name],
              namespace: (_a = _this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
              prefix: (_b = _this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name]
            };
          });
        },
        enumerable: false,
        configurable: true
      });
      return Element2;
    }(NodeWithChildren);
    exports2.Element = Element;
    function isTag(node) {
      return (0, domelementtype_1.isTag)(node);
    }
    exports2.isTag = isTag;
    function isCDATA(node) {
      return node.type === domelementtype_1.ElementType.CDATA;
    }
    exports2.isCDATA = isCDATA;
    function isText(node) {
      return node.type === domelementtype_1.ElementType.Text;
    }
    exports2.isText = isText;
    function isComment(node) {
      return node.type === domelementtype_1.ElementType.Comment;
    }
    exports2.isComment = isComment;
    function isDirective(node) {
      return node.type === domelementtype_1.ElementType.Directive;
    }
    exports2.isDirective = isDirective;
    function isDocument(node) {
      return node.type === domelementtype_1.ElementType.Root;
    }
    exports2.isDocument = isDocument;
    function hasChildren(node) {
      return Object.prototype.hasOwnProperty.call(node, "children");
    }
    exports2.hasChildren = hasChildren;
    function cloneNode(node, recursive) {
      if (recursive === void 0) {
        recursive = false;
      }
      var result;
      if (isText(node)) {
        result = new Text(node.data);
      } else if (isComment(node)) {
        result = new Comment(node.data);
      } else if (isTag(node)) {
        var children = recursive ? cloneChildren(node.children) : [];
        var clone_1 = new Element(node.name, __assign({}, node.attribs), children);
        children.forEach(function(child) {
          return child.parent = clone_1;
        });
        if (node.namespace != null) {
          clone_1.namespace = node.namespace;
        }
        if (node["x-attribsNamespace"]) {
          clone_1["x-attribsNamespace"] = __assign({}, node["x-attribsNamespace"]);
        }
        if (node["x-attribsPrefix"]) {
          clone_1["x-attribsPrefix"] = __assign({}, node["x-attribsPrefix"]);
        }
        result = clone_1;
      } else if (isCDATA(node)) {
        var children = recursive ? cloneChildren(node.children) : [];
        var clone_2 = new NodeWithChildren(domelementtype_1.ElementType.CDATA, children);
        children.forEach(function(child) {
          return child.parent = clone_2;
        });
        result = clone_2;
      } else if (isDocument(node)) {
        var children = recursive ? cloneChildren(node.children) : [];
        var clone_3 = new Document(children);
        children.forEach(function(child) {
          return child.parent = clone_3;
        });
        if (node["x-mode"]) {
          clone_3["x-mode"] = node["x-mode"];
        }
        result = clone_3;
      } else if (isDirective(node)) {
        var instruction = new ProcessingInstruction(node.name, node.data);
        if (node["x-name"] != null) {
          instruction["x-name"] = node["x-name"];
          instruction["x-publicId"] = node["x-publicId"];
          instruction["x-systemId"] = node["x-systemId"];
        }
        result = instruction;
      } else {
        throw new Error("Not implemented yet: ".concat(node.type));
      }
      result.startIndex = node.startIndex;
      result.endIndex = node.endIndex;
      if (node.sourceCodeLocation != null) {
        result.sourceCodeLocation = node.sourceCodeLocation;
      }
      return result;
    }
    exports2.cloneNode = cloneNode;
    function cloneChildren(childs) {
      var children = childs.map(function(child) {
        return cloneNode(child, true);
      });
      for (var i = 1; i < children.length; i++) {
        children[i].prev = children[i - 1];
        children[i - 1].next = children[i];
      }
      return children;
    }
  }
});

// node_modules/domhandler/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/domhandler/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DomHandler = void 0;
    var domelementtype_1 = require_lib2();
    var node_1 = require_node();
    __exportStar(require_node(), exports2);
    var reWhitespace = /\s+/g;
    var defaultOpts = {
      normalizeWhitespace: false,
      withStartIndices: false,
      withEndIndices: false,
      xmlMode: false
    };
    var DomHandler = function() {
      function DomHandler2(callback, options, elementCB) {
        this.dom = [];
        this.root = new node_1.Document(this.dom);
        this.done = false;
        this.tagStack = [this.root];
        this.lastNode = null;
        this.parser = null;
        if (typeof options === "function") {
          elementCB = options;
          options = defaultOpts;
        }
        if (typeof callback === "object") {
          options = callback;
          callback = void 0;
        }
        this.callback = callback !== null && callback !== void 0 ? callback : null;
        this.options = options !== null && options !== void 0 ? options : defaultOpts;
        this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
      }
      DomHandler2.prototype.onparserinit = function(parser) {
        this.parser = parser;
      };
      DomHandler2.prototype.onreset = function() {
        this.dom = [];
        this.root = new node_1.Document(this.dom);
        this.done = false;
        this.tagStack = [this.root];
        this.lastNode = null;
        this.parser = null;
      };
      DomHandler2.prototype.onend = function() {
        if (this.done)
          return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
      };
      DomHandler2.prototype.onerror = function(error) {
        this.handleCallback(error);
      };
      DomHandler2.prototype.onclosetag = function() {
        this.lastNode = null;
        var elem = this.tagStack.pop();
        if (this.options.withEndIndices) {
          elem.endIndex = this.parser.endIndex;
        }
        if (this.elementCB)
          this.elementCB(elem);
      };
      DomHandler2.prototype.onopentag = function(name, attribs) {
        var type = this.options.xmlMode ? domelementtype_1.ElementType.Tag : void 0;
        var element = new node_1.Element(name, attribs, void 0, type);
        this.addNode(element);
        this.tagStack.push(element);
      };
      DomHandler2.prototype.ontext = function(data) {
        var normalizeWhitespace = this.options.normalizeWhitespace;
        var lastNode = this.lastNode;
        if (lastNode && lastNode.type === domelementtype_1.ElementType.Text) {
          if (normalizeWhitespace) {
            lastNode.data = (lastNode.data + data).replace(reWhitespace, " ");
          } else {
            lastNode.data += data;
          }
          if (this.options.withEndIndices) {
            lastNode.endIndex = this.parser.endIndex;
          }
        } else {
          if (normalizeWhitespace) {
            data = data.replace(reWhitespace, " ");
          }
          var node = new node_1.Text(data);
          this.addNode(node);
          this.lastNode = node;
        }
      };
      DomHandler2.prototype.oncomment = function(data) {
        if (this.lastNode && this.lastNode.type === domelementtype_1.ElementType.Comment) {
          this.lastNode.data += data;
          return;
        }
        var node = new node_1.Comment(data);
        this.addNode(node);
        this.lastNode = node;
      };
      DomHandler2.prototype.oncommentend = function() {
        this.lastNode = null;
      };
      DomHandler2.prototype.oncdatastart = function() {
        var text = new node_1.Text("");
        var node = new node_1.NodeWithChildren(domelementtype_1.ElementType.CDATA, [text]);
        this.addNode(node);
        text.parent = node;
        this.lastNode = text;
      };
      DomHandler2.prototype.oncdataend = function() {
        this.lastNode = null;
      };
      DomHandler2.prototype.onprocessinginstruction = function(name, data) {
        var node = new node_1.ProcessingInstruction(name, data);
        this.addNode(node);
      };
      DomHandler2.prototype.handleCallback = function(error) {
        if (typeof this.callback === "function") {
          this.callback(error, this.dom);
        } else if (error) {
          throw error;
        }
      };
      DomHandler2.prototype.addNode = function(node) {
        var parent = this.tagStack[this.tagStack.length - 1];
        var previousSibling = parent.children[parent.children.length - 1];
        if (this.options.withStartIndices) {
          node.startIndex = this.parser.startIndex;
        }
        if (this.options.withEndIndices) {
          node.endIndex = this.parser.endIndex;
        }
        parent.children.push(node);
        if (previousSibling) {
          node.prev = previousSibling;
          previousSibling.next = node;
        }
        node.parent = parent;
        this.lastNode = null;
      };
      return DomHandler2;
    }();
    exports2.DomHandler = DomHandler;
    exports2.default = DomHandler;
  }
});

// node_modules/entities/lib/maps/entities.json
var require_entities = __commonJS({
  "node_modules/entities/lib/maps/entities.json"(exports2, module2) {
    module2.exports = { Aacute: "\xC1", aacute: "\xE1", Abreve: "\u0102", abreve: "\u0103", ac: "\u223E", acd: "\u223F", acE: "\u223E\u0333", Acirc: "\xC2", acirc: "\xE2", acute: "\xB4", Acy: "\u0410", acy: "\u0430", AElig: "\xC6", aelig: "\xE6", af: "\u2061", Afr: "\u{1D504}", afr: "\u{1D51E}", Agrave: "\xC0", agrave: "\xE0", alefsym: "\u2135", aleph: "\u2135", Alpha: "\u0391", alpha: "\u03B1", Amacr: "\u0100", amacr: "\u0101", amalg: "\u2A3F", amp: "&", AMP: "&", andand: "\u2A55", And: "\u2A53", and: "\u2227", andd: "\u2A5C", andslope: "\u2A58", andv: "\u2A5A", ang: "\u2220", ange: "\u29A4", angle: "\u2220", angmsdaa: "\u29A8", angmsdab: "\u29A9", angmsdac: "\u29AA", angmsdad: "\u29AB", angmsdae: "\u29AC", angmsdaf: "\u29AD", angmsdag: "\u29AE", angmsdah: "\u29AF", angmsd: "\u2221", angrt: "\u221F", angrtvb: "\u22BE", angrtvbd: "\u299D", angsph: "\u2222", angst: "\xC5", angzarr: "\u237C", Aogon: "\u0104", aogon: "\u0105", Aopf: "\u{1D538}", aopf: "\u{1D552}", apacir: "\u2A6F", ap: "\u2248", apE: "\u2A70", ape: "\u224A", apid: "\u224B", apos: "'", ApplyFunction: "\u2061", approx: "\u2248", approxeq: "\u224A", Aring: "\xC5", aring: "\xE5", Ascr: "\u{1D49C}", ascr: "\u{1D4B6}", Assign: "\u2254", ast: "*", asymp: "\u2248", asympeq: "\u224D", Atilde: "\xC3", atilde: "\xE3", Auml: "\xC4", auml: "\xE4", awconint: "\u2233", awint: "\u2A11", backcong: "\u224C", backepsilon: "\u03F6", backprime: "\u2035", backsim: "\u223D", backsimeq: "\u22CD", Backslash: "\u2216", Barv: "\u2AE7", barvee: "\u22BD", barwed: "\u2305", Barwed: "\u2306", barwedge: "\u2305", bbrk: "\u23B5", bbrktbrk: "\u23B6", bcong: "\u224C", Bcy: "\u0411", bcy: "\u0431", bdquo: "\u201E", becaus: "\u2235", because: "\u2235", Because: "\u2235", bemptyv: "\u29B0", bepsi: "\u03F6", bernou: "\u212C", Bernoullis: "\u212C", Beta: "\u0392", beta: "\u03B2", beth: "\u2136", between: "\u226C", Bfr: "\u{1D505}", bfr: "\u{1D51F}", bigcap: "\u22C2", bigcirc: "\u25EF", bigcup: "\u22C3", bigodot: "\u2A00", bigoplus: "\u2A01", bigotimes: "\u2A02", bigsqcup: "\u2A06", bigstar: "\u2605", bigtriangledown: "\u25BD", bigtriangleup: "\u25B3", biguplus: "\u2A04", bigvee: "\u22C1", bigwedge: "\u22C0", bkarow: "\u290D", blacklozenge: "\u29EB", blacksquare: "\u25AA", blacktriangle: "\u25B4", blacktriangledown: "\u25BE", blacktriangleleft: "\u25C2", blacktriangleright: "\u25B8", blank: "\u2423", blk12: "\u2592", blk14: "\u2591", blk34: "\u2593", block: "\u2588", bne: "=\u20E5", bnequiv: "\u2261\u20E5", bNot: "\u2AED", bnot: "\u2310", Bopf: "\u{1D539}", bopf: "\u{1D553}", bot: "\u22A5", bottom: "\u22A5", bowtie: "\u22C8", boxbox: "\u29C9", boxdl: "\u2510", boxdL: "\u2555", boxDl: "\u2556", boxDL: "\u2557", boxdr: "\u250C", boxdR: "\u2552", boxDr: "\u2553", boxDR: "\u2554", boxh: "\u2500", boxH: "\u2550", boxhd: "\u252C", boxHd: "\u2564", boxhD: "\u2565", boxHD: "\u2566", boxhu: "\u2534", boxHu: "\u2567", boxhU: "\u2568", boxHU: "\u2569", boxminus: "\u229F", boxplus: "\u229E", boxtimes: "\u22A0", boxul: "\u2518", boxuL: "\u255B", boxUl: "\u255C", boxUL: "\u255D", boxur: "\u2514", boxuR: "\u2558", boxUr: "\u2559", boxUR: "\u255A", boxv: "\u2502", boxV: "\u2551", boxvh: "\u253C", boxvH: "\u256A", boxVh: "\u256B", boxVH: "\u256C", boxvl: "\u2524", boxvL: "\u2561", boxVl: "\u2562", boxVL: "\u2563", boxvr: "\u251C", boxvR: "\u255E", boxVr: "\u255F", boxVR: "\u2560", bprime: "\u2035", breve: "\u02D8", Breve: "\u02D8", brvbar: "\xA6", bscr: "\u{1D4B7}", Bscr: "\u212C", bsemi: "\u204F", bsim: "\u223D", bsime: "\u22CD", bsolb: "\u29C5", bsol: "\\", bsolhsub: "\u27C8", bull: "\u2022", bullet: "\u2022", bump: "\u224E", bumpE: "\u2AAE", bumpe: "\u224F", Bumpeq: "\u224E", bumpeq: "\u224F", Cacute: "\u0106", cacute: "\u0107", capand: "\u2A44", capbrcup: "\u2A49", capcap: "\u2A4B", cap: "\u2229", Cap: "\u22D2", capcup: "\u2A47", capdot: "\u2A40", CapitalDifferentialD: "\u2145", caps: "\u2229\uFE00", caret: "\u2041", caron: "\u02C7", Cayleys: "\u212D", ccaps: "\u2A4D", Ccaron: "\u010C", ccaron: "\u010D", Ccedil: "\xC7", ccedil: "\xE7", Ccirc: "\u0108", ccirc: "\u0109", Cconint: "\u2230", ccups: "\u2A4C", ccupssm: "\u2A50", Cdot: "\u010A", cdot: "\u010B", cedil: "\xB8", Cedilla: "\xB8", cemptyv: "\u29B2", cent: "\xA2", centerdot: "\xB7", CenterDot: "\xB7", cfr: "\u{1D520}", Cfr: "\u212D", CHcy: "\u0427", chcy: "\u0447", check: "\u2713", checkmark: "\u2713", Chi: "\u03A7", chi: "\u03C7", circ: "\u02C6", circeq: "\u2257", circlearrowleft: "\u21BA", circlearrowright: "\u21BB", circledast: "\u229B", circledcirc: "\u229A", circleddash: "\u229D", CircleDot: "\u2299", circledR: "\xAE", circledS: "\u24C8", CircleMinus: "\u2296", CirclePlus: "\u2295", CircleTimes: "\u2297", cir: "\u25CB", cirE: "\u29C3", cire: "\u2257", cirfnint: "\u2A10", cirmid: "\u2AEF", cirscir: "\u29C2", ClockwiseContourIntegral: "\u2232", CloseCurlyDoubleQuote: "\u201D", CloseCurlyQuote: "\u2019", clubs: "\u2663", clubsuit: "\u2663", colon: ":", Colon: "\u2237", Colone: "\u2A74", colone: "\u2254", coloneq: "\u2254", comma: ",", commat: "@", comp: "\u2201", compfn: "\u2218", complement: "\u2201", complexes: "\u2102", cong: "\u2245", congdot: "\u2A6D", Congruent: "\u2261", conint: "\u222E", Conint: "\u222F", ContourIntegral: "\u222E", copf: "\u{1D554}", Copf: "\u2102", coprod: "\u2210", Coproduct: "\u2210", copy: "\xA9", COPY: "\xA9", copysr: "\u2117", CounterClockwiseContourIntegral: "\u2233", crarr: "\u21B5", cross: "\u2717", Cross: "\u2A2F", Cscr: "\u{1D49E}", cscr: "\u{1D4B8}", csub: "\u2ACF", csube: "\u2AD1", csup: "\u2AD0", csupe: "\u2AD2", ctdot: "\u22EF", cudarrl: "\u2938", cudarrr: "\u2935", cuepr: "\u22DE", cuesc: "\u22DF", cularr: "\u21B6", cularrp: "\u293D", cupbrcap: "\u2A48", cupcap: "\u2A46", CupCap: "\u224D", cup: "\u222A", Cup: "\u22D3", cupcup: "\u2A4A", cupdot: "\u228D", cupor: "\u2A45", cups: "\u222A\uFE00", curarr: "\u21B7", curarrm: "\u293C", curlyeqprec: "\u22DE", curlyeqsucc: "\u22DF", curlyvee: "\u22CE", curlywedge: "\u22CF", curren: "\xA4", curvearrowleft: "\u21B6", curvearrowright: "\u21B7", cuvee: "\u22CE", cuwed: "\u22CF", cwconint: "\u2232", cwint: "\u2231", cylcty: "\u232D", dagger: "\u2020", Dagger: "\u2021", daleth: "\u2138", darr: "\u2193", Darr: "\u21A1", dArr: "\u21D3", dash: "\u2010", Dashv: "\u2AE4", dashv: "\u22A3", dbkarow: "\u290F", dblac: "\u02DD", Dcaron: "\u010E", dcaron: "\u010F", Dcy: "\u0414", dcy: "\u0434", ddagger: "\u2021", ddarr: "\u21CA", DD: "\u2145", dd: "\u2146", DDotrahd: "\u2911", ddotseq: "\u2A77", deg: "\xB0", Del: "\u2207", Delta: "\u0394", delta: "\u03B4", demptyv: "\u29B1", dfisht: "\u297F", Dfr: "\u{1D507}", dfr: "\u{1D521}", dHar: "\u2965", dharl: "\u21C3", dharr: "\u21C2", DiacriticalAcute: "\xB4", DiacriticalDot: "\u02D9", DiacriticalDoubleAcute: "\u02DD", DiacriticalGrave: "`", DiacriticalTilde: "\u02DC", diam: "\u22C4", diamond: "\u22C4", Diamond: "\u22C4", diamondsuit: "\u2666", diams: "\u2666", die: "\xA8", DifferentialD: "\u2146", digamma: "\u03DD", disin: "\u22F2", div: "\xF7", divide: "\xF7", divideontimes: "\u22C7", divonx: "\u22C7", DJcy: "\u0402", djcy: "\u0452", dlcorn: "\u231E", dlcrop: "\u230D", dollar: "$", Dopf: "\u{1D53B}", dopf: "\u{1D555}", Dot: "\xA8", dot: "\u02D9", DotDot: "\u20DC", doteq: "\u2250", doteqdot: "\u2251", DotEqual: "\u2250", dotminus: "\u2238", dotplus: "\u2214", dotsquare: "\u22A1", doublebarwedge: "\u2306", DoubleContourIntegral: "\u222F", DoubleDot: "\xA8", DoubleDownArrow: "\u21D3", DoubleLeftArrow: "\u21D0", DoubleLeftRightArrow: "\u21D4", DoubleLeftTee: "\u2AE4", DoubleLongLeftArrow: "\u27F8", DoubleLongLeftRightArrow: "\u27FA", DoubleLongRightArrow: "\u27F9", DoubleRightArrow: "\u21D2", DoubleRightTee: "\u22A8", DoubleUpArrow: "\u21D1", DoubleUpDownArrow: "\u21D5", DoubleVerticalBar: "\u2225", DownArrowBar: "\u2913", downarrow: "\u2193", DownArrow: "\u2193", Downarrow: "\u21D3", DownArrowUpArrow: "\u21F5", DownBreve: "\u0311", downdownarrows: "\u21CA", downharpoonleft: "\u21C3", downharpoonright: "\u21C2", DownLeftRightVector: "\u2950", DownLeftTeeVector: "\u295E", DownLeftVectorBar: "\u2956", DownLeftVector: "\u21BD", DownRightTeeVector: "\u295F", DownRightVectorBar: "\u2957", DownRightVector: "\u21C1", DownTeeArrow: "\u21A7", DownTee: "\u22A4", drbkarow: "\u2910", drcorn: "\u231F", drcrop: "\u230C", Dscr: "\u{1D49F}", dscr: "\u{1D4B9}", DScy: "\u0405", dscy: "\u0455", dsol: "\u29F6", Dstrok: "\u0110", dstrok: "\u0111", dtdot: "\u22F1", dtri: "\u25BF", dtrif: "\u25BE", duarr: "\u21F5", duhar: "\u296F", dwangle: "\u29A6", DZcy: "\u040F", dzcy: "\u045F", dzigrarr: "\u27FF", Eacute: "\xC9", eacute: "\xE9", easter: "\u2A6E", Ecaron: "\u011A", ecaron: "\u011B", Ecirc: "\xCA", ecirc: "\xEA", ecir: "\u2256", ecolon: "\u2255", Ecy: "\u042D", ecy: "\u044D", eDDot: "\u2A77", Edot: "\u0116", edot: "\u0117", eDot: "\u2251", ee: "\u2147", efDot: "\u2252", Efr: "\u{1D508}", efr: "\u{1D522}", eg: "\u2A9A", Egrave: "\xC8", egrave: "\xE8", egs: "\u2A96", egsdot: "\u2A98", el: "\u2A99", Element: "\u2208", elinters: "\u23E7", ell: "\u2113", els: "\u2A95", elsdot: "\u2A97", Emacr: "\u0112", emacr: "\u0113", empty: "\u2205", emptyset: "\u2205", EmptySmallSquare: "\u25FB", emptyv: "\u2205", EmptyVerySmallSquare: "\u25AB", emsp13: "\u2004", emsp14: "\u2005", emsp: "\u2003", ENG: "\u014A", eng: "\u014B", ensp: "\u2002", Eogon: "\u0118", eogon: "\u0119", Eopf: "\u{1D53C}", eopf: "\u{1D556}", epar: "\u22D5", eparsl: "\u29E3", eplus: "\u2A71", epsi: "\u03B5", Epsilon: "\u0395", epsilon: "\u03B5", epsiv: "\u03F5", eqcirc: "\u2256", eqcolon: "\u2255", eqsim: "\u2242", eqslantgtr: "\u2A96", eqslantless: "\u2A95", Equal: "\u2A75", equals: "=", EqualTilde: "\u2242", equest: "\u225F", Equilibrium: "\u21CC", equiv: "\u2261", equivDD: "\u2A78", eqvparsl: "\u29E5", erarr: "\u2971", erDot: "\u2253", escr: "\u212F", Escr: "\u2130", esdot: "\u2250", Esim: "\u2A73", esim: "\u2242", Eta: "\u0397", eta: "\u03B7", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", euro: "\u20AC", excl: "!", exist: "\u2203", Exists: "\u2203", expectation: "\u2130", exponentiale: "\u2147", ExponentialE: "\u2147", fallingdotseq: "\u2252", Fcy: "\u0424", fcy: "\u0444", female: "\u2640", ffilig: "\uFB03", fflig: "\uFB00", ffllig: "\uFB04", Ffr: "\u{1D509}", ffr: "\u{1D523}", filig: "\uFB01", FilledSmallSquare: "\u25FC", FilledVerySmallSquare: "\u25AA", fjlig: "fj", flat: "\u266D", fllig: "\uFB02", fltns: "\u25B1", fnof: "\u0192", Fopf: "\u{1D53D}", fopf: "\u{1D557}", forall: "\u2200", ForAll: "\u2200", fork: "\u22D4", forkv: "\u2AD9", Fouriertrf: "\u2131", fpartint: "\u2A0D", frac12: "\xBD", frac13: "\u2153", frac14: "\xBC", frac15: "\u2155", frac16: "\u2159", frac18: "\u215B", frac23: "\u2154", frac25: "\u2156", frac34: "\xBE", frac35: "\u2157", frac38: "\u215C", frac45: "\u2158", frac56: "\u215A", frac58: "\u215D", frac78: "\u215E", frasl: "\u2044", frown: "\u2322", fscr: "\u{1D4BB}", Fscr: "\u2131", gacute: "\u01F5", Gamma: "\u0393", gamma: "\u03B3", Gammad: "\u03DC", gammad: "\u03DD", gap: "\u2A86", Gbreve: "\u011E", gbreve: "\u011F", Gcedil: "\u0122", Gcirc: "\u011C", gcirc: "\u011D", Gcy: "\u0413", gcy: "\u0433", Gdot: "\u0120", gdot: "\u0121", ge: "\u2265", gE: "\u2267", gEl: "\u2A8C", gel: "\u22DB", geq: "\u2265", geqq: "\u2267", geqslant: "\u2A7E", gescc: "\u2AA9", ges: "\u2A7E", gesdot: "\u2A80", gesdoto: "\u2A82", gesdotol: "\u2A84", gesl: "\u22DB\uFE00", gesles: "\u2A94", Gfr: "\u{1D50A}", gfr: "\u{1D524}", gg: "\u226B", Gg: "\u22D9", ggg: "\u22D9", gimel: "\u2137", GJcy: "\u0403", gjcy: "\u0453", gla: "\u2AA5", gl: "\u2277", glE: "\u2A92", glj: "\u2AA4", gnap: "\u2A8A", gnapprox: "\u2A8A", gne: "\u2A88", gnE: "\u2269", gneq: "\u2A88", gneqq: "\u2269", gnsim: "\u22E7", Gopf: "\u{1D53E}", gopf: "\u{1D558}", grave: "`", GreaterEqual: "\u2265", GreaterEqualLess: "\u22DB", GreaterFullEqual: "\u2267", GreaterGreater: "\u2AA2", GreaterLess: "\u2277", GreaterSlantEqual: "\u2A7E", GreaterTilde: "\u2273", Gscr: "\u{1D4A2}", gscr: "\u210A", gsim: "\u2273", gsime: "\u2A8E", gsiml: "\u2A90", gtcc: "\u2AA7", gtcir: "\u2A7A", gt: ">", GT: ">", Gt: "\u226B", gtdot: "\u22D7", gtlPar: "\u2995", gtquest: "\u2A7C", gtrapprox: "\u2A86", gtrarr: "\u2978", gtrdot: "\u22D7", gtreqless: "\u22DB", gtreqqless: "\u2A8C", gtrless: "\u2277", gtrsim: "\u2273", gvertneqq: "\u2269\uFE00", gvnE: "\u2269\uFE00", Hacek: "\u02C7", hairsp: "\u200A", half: "\xBD", hamilt: "\u210B", HARDcy: "\u042A", hardcy: "\u044A", harrcir: "\u2948", harr: "\u2194", hArr: "\u21D4", harrw: "\u21AD", Hat: "^", hbar: "\u210F", Hcirc: "\u0124", hcirc: "\u0125", hearts: "\u2665", heartsuit: "\u2665", hellip: "\u2026", hercon: "\u22B9", hfr: "\u{1D525}", Hfr: "\u210C", HilbertSpace: "\u210B", hksearow: "\u2925", hkswarow: "\u2926", hoarr: "\u21FF", homtht: "\u223B", hookleftarrow: "\u21A9", hookrightarrow: "\u21AA", hopf: "\u{1D559}", Hopf: "\u210D", horbar: "\u2015", HorizontalLine: "\u2500", hscr: "\u{1D4BD}", Hscr: "\u210B", hslash: "\u210F", Hstrok: "\u0126", hstrok: "\u0127", HumpDownHump: "\u224E", HumpEqual: "\u224F", hybull: "\u2043", hyphen: "\u2010", Iacute: "\xCD", iacute: "\xED", ic: "\u2063", Icirc: "\xCE", icirc: "\xEE", Icy: "\u0418", icy: "\u0438", Idot: "\u0130", IEcy: "\u0415", iecy: "\u0435", iexcl: "\xA1", iff: "\u21D4", ifr: "\u{1D526}", Ifr: "\u2111", Igrave: "\xCC", igrave: "\xEC", ii: "\u2148", iiiint: "\u2A0C", iiint: "\u222D", iinfin: "\u29DC", iiota: "\u2129", IJlig: "\u0132", ijlig: "\u0133", Imacr: "\u012A", imacr: "\u012B", image: "\u2111", ImaginaryI: "\u2148", imagline: "\u2110", imagpart: "\u2111", imath: "\u0131", Im: "\u2111", imof: "\u22B7", imped: "\u01B5", Implies: "\u21D2", incare: "\u2105", in: "\u2208", infin: "\u221E", infintie: "\u29DD", inodot: "\u0131", intcal: "\u22BA", int: "\u222B", Int: "\u222C", integers: "\u2124", Integral: "\u222B", intercal: "\u22BA", Intersection: "\u22C2", intlarhk: "\u2A17", intprod: "\u2A3C", InvisibleComma: "\u2063", InvisibleTimes: "\u2062", IOcy: "\u0401", iocy: "\u0451", Iogon: "\u012E", iogon: "\u012F", Iopf: "\u{1D540}", iopf: "\u{1D55A}", Iota: "\u0399", iota: "\u03B9", iprod: "\u2A3C", iquest: "\xBF", iscr: "\u{1D4BE}", Iscr: "\u2110", isin: "\u2208", isindot: "\u22F5", isinE: "\u22F9", isins: "\u22F4", isinsv: "\u22F3", isinv: "\u2208", it: "\u2062", Itilde: "\u0128", itilde: "\u0129", Iukcy: "\u0406", iukcy: "\u0456", Iuml: "\xCF", iuml: "\xEF", Jcirc: "\u0134", jcirc: "\u0135", Jcy: "\u0419", jcy: "\u0439", Jfr: "\u{1D50D}", jfr: "\u{1D527}", jmath: "\u0237", Jopf: "\u{1D541}", jopf: "\u{1D55B}", Jscr: "\u{1D4A5}", jscr: "\u{1D4BF}", Jsercy: "\u0408", jsercy: "\u0458", Jukcy: "\u0404", jukcy: "\u0454", Kappa: "\u039A", kappa: "\u03BA", kappav: "\u03F0", Kcedil: "\u0136", kcedil: "\u0137", Kcy: "\u041A", kcy: "\u043A", Kfr: "\u{1D50E}", kfr: "\u{1D528}", kgreen: "\u0138", KHcy: "\u0425", khcy: "\u0445", KJcy: "\u040C", kjcy: "\u045C", Kopf: "\u{1D542}", kopf: "\u{1D55C}", Kscr: "\u{1D4A6}", kscr: "\u{1D4C0}", lAarr: "\u21DA", Lacute: "\u0139", lacute: "\u013A", laemptyv: "\u29B4", lagran: "\u2112", Lambda: "\u039B", lambda: "\u03BB", lang: "\u27E8", Lang: "\u27EA", langd: "\u2991", langle: "\u27E8", lap: "\u2A85", Laplacetrf: "\u2112", laquo: "\xAB", larrb: "\u21E4", larrbfs: "\u291F", larr: "\u2190", Larr: "\u219E", lArr: "\u21D0", larrfs: "\u291D", larrhk: "\u21A9", larrlp: "\u21AB", larrpl: "\u2939", larrsim: "\u2973", larrtl: "\u21A2", latail: "\u2919", lAtail: "\u291B", lat: "\u2AAB", late: "\u2AAD", lates: "\u2AAD\uFE00", lbarr: "\u290C", lBarr: "\u290E", lbbrk: "\u2772", lbrace: "{", lbrack: "[", lbrke: "\u298B", lbrksld: "\u298F", lbrkslu: "\u298D", Lcaron: "\u013D", lcaron: "\u013E", Lcedil: "\u013B", lcedil: "\u013C", lceil: "\u2308", lcub: "{", Lcy: "\u041B", lcy: "\u043B", ldca: "\u2936", ldquo: "\u201C", ldquor: "\u201E", ldrdhar: "\u2967", ldrushar: "\u294B", ldsh: "\u21B2", le: "\u2264", lE: "\u2266", LeftAngleBracket: "\u27E8", LeftArrowBar: "\u21E4", leftarrow: "\u2190", LeftArrow: "\u2190", Leftarrow: "\u21D0", LeftArrowRightArrow: "\u21C6", leftarrowtail: "\u21A2", LeftCeiling: "\u2308", LeftDoubleBracket: "\u27E6", LeftDownTeeVector: "\u2961", LeftDownVectorBar: "\u2959", LeftDownVector: "\u21C3", LeftFloor: "\u230A", leftharpoondown: "\u21BD", leftharpoonup: "\u21BC", leftleftarrows: "\u21C7", leftrightarrow: "\u2194", LeftRightArrow: "\u2194", Leftrightarrow: "\u21D4", leftrightarrows: "\u21C6", leftrightharpoons: "\u21CB", leftrightsquigarrow: "\u21AD", LeftRightVector: "\u294E", LeftTeeArrow: "\u21A4", LeftTee: "\u22A3", LeftTeeVector: "\u295A", leftthreetimes: "\u22CB", LeftTriangleBar: "\u29CF", LeftTriangle: "\u22B2", LeftTriangleEqual: "\u22B4", LeftUpDownVector: "\u2951", LeftUpTeeVector: "\u2960", LeftUpVectorBar: "\u2958", LeftUpVector: "\u21BF", LeftVectorBar: "\u2952", LeftVector: "\u21BC", lEg: "\u2A8B", leg: "\u22DA", leq: "\u2264", leqq: "\u2266", leqslant: "\u2A7D", lescc: "\u2AA8", les: "\u2A7D", lesdot: "\u2A7F", lesdoto: "\u2A81", lesdotor: "\u2A83", lesg: "\u22DA\uFE00", lesges: "\u2A93", lessapprox: "\u2A85", lessdot: "\u22D6", lesseqgtr: "\u22DA", lesseqqgtr: "\u2A8B", LessEqualGreater: "\u22DA", LessFullEqual: "\u2266", LessGreater: "\u2276", lessgtr: "\u2276", LessLess: "\u2AA1", lesssim: "\u2272", LessSlantEqual: "\u2A7D", LessTilde: "\u2272", lfisht: "\u297C", lfloor: "\u230A", Lfr: "\u{1D50F}", lfr: "\u{1D529}", lg: "\u2276", lgE: "\u2A91", lHar: "\u2962", lhard: "\u21BD", lharu: "\u21BC", lharul: "\u296A", lhblk: "\u2584", LJcy: "\u0409", ljcy: "\u0459", llarr: "\u21C7", ll: "\u226A", Ll: "\u22D8", llcorner: "\u231E", Lleftarrow: "\u21DA", llhard: "\u296B", lltri: "\u25FA", Lmidot: "\u013F", lmidot: "\u0140", lmoustache: "\u23B0", lmoust: "\u23B0", lnap: "\u2A89", lnapprox: "\u2A89", lne: "\u2A87", lnE: "\u2268", lneq: "\u2A87", lneqq: "\u2268", lnsim: "\u22E6", loang: "\u27EC", loarr: "\u21FD", lobrk: "\u27E6", longleftarrow: "\u27F5", LongLeftArrow: "\u27F5", Longleftarrow: "\u27F8", longleftrightarrow: "\u27F7", LongLeftRightArrow: "\u27F7", Longleftrightarrow: "\u27FA", longmapsto: "\u27FC", longrightarrow: "\u27F6", LongRightArrow: "\u27F6", Longrightarrow: "\u27F9", looparrowleft: "\u21AB", looparrowright: "\u21AC", lopar: "\u2985", Lopf: "\u{1D543}", lopf: "\u{1D55D}", loplus: "\u2A2D", lotimes: "\u2A34", lowast: "\u2217", lowbar: "_", LowerLeftArrow: "\u2199", LowerRightArrow: "\u2198", loz: "\u25CA", lozenge: "\u25CA", lozf: "\u29EB", lpar: "(", lparlt: "\u2993", lrarr: "\u21C6", lrcorner: "\u231F", lrhar: "\u21CB", lrhard: "\u296D", lrm: "\u200E", lrtri: "\u22BF", lsaquo: "\u2039", lscr: "\u{1D4C1}", Lscr: "\u2112", lsh: "\u21B0", Lsh: "\u21B0", lsim: "\u2272", lsime: "\u2A8D", lsimg: "\u2A8F", lsqb: "[", lsquo: "\u2018", lsquor: "\u201A", Lstrok: "\u0141", lstrok: "\u0142", ltcc: "\u2AA6", ltcir: "\u2A79", lt: "<", LT: "<", Lt: "\u226A", ltdot: "\u22D6", lthree: "\u22CB", ltimes: "\u22C9", ltlarr: "\u2976", ltquest: "\u2A7B", ltri: "\u25C3", ltrie: "\u22B4", ltrif: "\u25C2", ltrPar: "\u2996", lurdshar: "\u294A", luruhar: "\u2966", lvertneqq: "\u2268\uFE00", lvnE: "\u2268\uFE00", macr: "\xAF", male: "\u2642", malt: "\u2720", maltese: "\u2720", Map: "\u2905", map: "\u21A6", mapsto: "\u21A6", mapstodown: "\u21A7", mapstoleft: "\u21A4", mapstoup: "\u21A5", marker: "\u25AE", mcomma: "\u2A29", Mcy: "\u041C", mcy: "\u043C", mdash: "\u2014", mDDot: "\u223A", measuredangle: "\u2221", MediumSpace: "\u205F", Mellintrf: "\u2133", Mfr: "\u{1D510}", mfr: "\u{1D52A}", mho: "\u2127", micro: "\xB5", midast: "*", midcir: "\u2AF0", mid: "\u2223", middot: "\xB7", minusb: "\u229F", minus: "\u2212", minusd: "\u2238", minusdu: "\u2A2A", MinusPlus: "\u2213", mlcp: "\u2ADB", mldr: "\u2026", mnplus: "\u2213", models: "\u22A7", Mopf: "\u{1D544}", mopf: "\u{1D55E}", mp: "\u2213", mscr: "\u{1D4C2}", Mscr: "\u2133", mstpos: "\u223E", Mu: "\u039C", mu: "\u03BC", multimap: "\u22B8", mumap: "\u22B8", nabla: "\u2207", Nacute: "\u0143", nacute: "\u0144", nang: "\u2220\u20D2", nap: "\u2249", napE: "\u2A70\u0338", napid: "\u224B\u0338", napos: "\u0149", napprox: "\u2249", natural: "\u266E", naturals: "\u2115", natur: "\u266E", nbsp: "\xA0", nbump: "\u224E\u0338", nbumpe: "\u224F\u0338", ncap: "\u2A43", Ncaron: "\u0147", ncaron: "\u0148", Ncedil: "\u0145", ncedil: "\u0146", ncong: "\u2247", ncongdot: "\u2A6D\u0338", ncup: "\u2A42", Ncy: "\u041D", ncy: "\u043D", ndash: "\u2013", nearhk: "\u2924", nearr: "\u2197", neArr: "\u21D7", nearrow: "\u2197", ne: "\u2260", nedot: "\u2250\u0338", NegativeMediumSpace: "\u200B", NegativeThickSpace: "\u200B", NegativeThinSpace: "\u200B", NegativeVeryThinSpace: "\u200B", nequiv: "\u2262", nesear: "\u2928", nesim: "\u2242\u0338", NestedGreaterGreater: "\u226B", NestedLessLess: "\u226A", NewLine: "\n", nexist: "\u2204", nexists: "\u2204", Nfr: "\u{1D511}", nfr: "\u{1D52B}", ngE: "\u2267\u0338", nge: "\u2271", ngeq: "\u2271", ngeqq: "\u2267\u0338", ngeqslant: "\u2A7E\u0338", nges: "\u2A7E\u0338", nGg: "\u22D9\u0338", ngsim: "\u2275", nGt: "\u226B\u20D2", ngt: "\u226F", ngtr: "\u226F", nGtv: "\u226B\u0338", nharr: "\u21AE", nhArr: "\u21CE", nhpar: "\u2AF2", ni: "\u220B", nis: "\u22FC", nisd: "\u22FA", niv: "\u220B", NJcy: "\u040A", njcy: "\u045A", nlarr: "\u219A", nlArr: "\u21CD", nldr: "\u2025", nlE: "\u2266\u0338", nle: "\u2270", nleftarrow: "\u219A", nLeftarrow: "\u21CD", nleftrightarrow: "\u21AE", nLeftrightarrow: "\u21CE", nleq: "\u2270", nleqq: "\u2266\u0338", nleqslant: "\u2A7D\u0338", nles: "\u2A7D\u0338", nless: "\u226E", nLl: "\u22D8\u0338", nlsim: "\u2274", nLt: "\u226A\u20D2", nlt: "\u226E", nltri: "\u22EA", nltrie: "\u22EC", nLtv: "\u226A\u0338", nmid: "\u2224", NoBreak: "\u2060", NonBreakingSpace: "\xA0", nopf: "\u{1D55F}", Nopf: "\u2115", Not: "\u2AEC", not: "\xAC", NotCongruent: "\u2262", NotCupCap: "\u226D", NotDoubleVerticalBar: "\u2226", NotElement: "\u2209", NotEqual: "\u2260", NotEqualTilde: "\u2242\u0338", NotExists: "\u2204", NotGreater: "\u226F", NotGreaterEqual: "\u2271", NotGreaterFullEqual: "\u2267\u0338", NotGreaterGreater: "\u226B\u0338", NotGreaterLess: "\u2279", NotGreaterSlantEqual: "\u2A7E\u0338", NotGreaterTilde: "\u2275", NotHumpDownHump: "\u224E\u0338", NotHumpEqual: "\u224F\u0338", notin: "\u2209", notindot: "\u22F5\u0338", notinE: "\u22F9\u0338", notinva: "\u2209", notinvb: "\u22F7", notinvc: "\u22F6", NotLeftTriangleBar: "\u29CF\u0338", NotLeftTriangle: "\u22EA", NotLeftTriangleEqual: "\u22EC", NotLess: "\u226E", NotLessEqual: "\u2270", NotLessGreater: "\u2278", NotLessLess: "\u226A\u0338", NotLessSlantEqual: "\u2A7D\u0338", NotLessTilde: "\u2274", NotNestedGreaterGreater: "\u2AA2\u0338", NotNestedLessLess: "\u2AA1\u0338", notni: "\u220C", notniva: "\u220C", notnivb: "\u22FE", notnivc: "\u22FD", NotPrecedes: "\u2280", NotPrecedesEqual: "\u2AAF\u0338", NotPrecedesSlantEqual: "\u22E0", NotReverseElement: "\u220C", NotRightTriangleBar: "\u29D0\u0338", NotRightTriangle: "\u22EB", NotRightTriangleEqual: "\u22ED", NotSquareSubset: "\u228F\u0338", NotSquareSubsetEqual: "\u22E2", NotSquareSuperset: "\u2290\u0338", NotSquareSupersetEqual: "\u22E3", NotSubset: "\u2282\u20D2", NotSubsetEqual: "\u2288", NotSucceeds: "\u2281", NotSucceedsEqual: "\u2AB0\u0338", NotSucceedsSlantEqual: "\u22E1", NotSucceedsTilde: "\u227F\u0338", NotSuperset: "\u2283\u20D2", NotSupersetEqual: "\u2289", NotTilde: "\u2241", NotTildeEqual: "\u2244", NotTildeFullEqual: "\u2247", NotTildeTilde: "\u2249", NotVerticalBar: "\u2224", nparallel: "\u2226", npar: "\u2226", nparsl: "\u2AFD\u20E5", npart: "\u2202\u0338", npolint: "\u2A14", npr: "\u2280", nprcue: "\u22E0", nprec: "\u2280", npreceq: "\u2AAF\u0338", npre: "\u2AAF\u0338", nrarrc: "\u2933\u0338", nrarr: "\u219B", nrArr: "\u21CF", nrarrw: "\u219D\u0338", nrightarrow: "\u219B", nRightarrow: "\u21CF", nrtri: "\u22EB", nrtrie: "\u22ED", nsc: "\u2281", nsccue: "\u22E1", nsce: "\u2AB0\u0338", Nscr: "\u{1D4A9}", nscr: "\u{1D4C3}", nshortmid: "\u2224", nshortparallel: "\u2226", nsim: "\u2241", nsime: "\u2244", nsimeq: "\u2244", nsmid: "\u2224", nspar: "\u2226", nsqsube: "\u22E2", nsqsupe: "\u22E3", nsub: "\u2284", nsubE: "\u2AC5\u0338", nsube: "\u2288", nsubset: "\u2282\u20D2", nsubseteq: "\u2288", nsubseteqq: "\u2AC5\u0338", nsucc: "\u2281", nsucceq: "\u2AB0\u0338", nsup: "\u2285", nsupE: "\u2AC6\u0338", nsupe: "\u2289", nsupset: "\u2283\u20D2", nsupseteq: "\u2289", nsupseteqq: "\u2AC6\u0338", ntgl: "\u2279", Ntilde: "\xD1", ntilde: "\xF1", ntlg: "\u2278", ntriangleleft: "\u22EA", ntrianglelefteq: "\u22EC", ntriangleright: "\u22EB", ntrianglerighteq: "\u22ED", Nu: "\u039D", nu: "\u03BD", num: "#", numero: "\u2116", numsp: "\u2007", nvap: "\u224D\u20D2", nvdash: "\u22AC", nvDash: "\u22AD", nVdash: "\u22AE", nVDash: "\u22AF", nvge: "\u2265\u20D2", nvgt: ">\u20D2", nvHarr: "\u2904", nvinfin: "\u29DE", nvlArr: "\u2902", nvle: "\u2264\u20D2", nvlt: "<\u20D2", nvltrie: "\u22B4\u20D2", nvrArr: "\u2903", nvrtrie: "\u22B5\u20D2", nvsim: "\u223C\u20D2", nwarhk: "\u2923", nwarr: "\u2196", nwArr: "\u21D6", nwarrow: "\u2196", nwnear: "\u2927", Oacute: "\xD3", oacute: "\xF3", oast: "\u229B", Ocirc: "\xD4", ocirc: "\xF4", ocir: "\u229A", Ocy: "\u041E", ocy: "\u043E", odash: "\u229D", Odblac: "\u0150", odblac: "\u0151", odiv: "\u2A38", odot: "\u2299", odsold: "\u29BC", OElig: "\u0152", oelig: "\u0153", ofcir: "\u29BF", Ofr: "\u{1D512}", ofr: "\u{1D52C}", ogon: "\u02DB", Ograve: "\xD2", ograve: "\xF2", ogt: "\u29C1", ohbar: "\u29B5", ohm: "\u03A9", oint: "\u222E", olarr: "\u21BA", olcir: "\u29BE", olcross: "\u29BB", oline: "\u203E", olt: "\u29C0", Omacr: "\u014C", omacr: "\u014D", Omega: "\u03A9", omega: "\u03C9", Omicron: "\u039F", omicron: "\u03BF", omid: "\u29B6", ominus: "\u2296", Oopf: "\u{1D546}", oopf: "\u{1D560}", opar: "\u29B7", OpenCurlyDoubleQuote: "\u201C", OpenCurlyQuote: "\u2018", operp: "\u29B9", oplus: "\u2295", orarr: "\u21BB", Or: "\u2A54", or: "\u2228", ord: "\u2A5D", order: "\u2134", orderof: "\u2134", ordf: "\xAA", ordm: "\xBA", origof: "\u22B6", oror: "\u2A56", orslope: "\u2A57", orv: "\u2A5B", oS: "\u24C8", Oscr: "\u{1D4AA}", oscr: "\u2134", Oslash: "\xD8", oslash: "\xF8", osol: "\u2298", Otilde: "\xD5", otilde: "\xF5", otimesas: "\u2A36", Otimes: "\u2A37", otimes: "\u2297", Ouml: "\xD6", ouml: "\xF6", ovbar: "\u233D", OverBar: "\u203E", OverBrace: "\u23DE", OverBracket: "\u23B4", OverParenthesis: "\u23DC", para: "\xB6", parallel: "\u2225", par: "\u2225", parsim: "\u2AF3", parsl: "\u2AFD", part: "\u2202", PartialD: "\u2202", Pcy: "\u041F", pcy: "\u043F", percnt: "%", period: ".", permil: "\u2030", perp: "\u22A5", pertenk: "\u2031", Pfr: "\u{1D513}", pfr: "\u{1D52D}", Phi: "\u03A6", phi: "\u03C6", phiv: "\u03D5", phmmat: "\u2133", phone: "\u260E", Pi: "\u03A0", pi: "\u03C0", pitchfork: "\u22D4", piv: "\u03D6", planck: "\u210F", planckh: "\u210E", plankv: "\u210F", plusacir: "\u2A23", plusb: "\u229E", pluscir: "\u2A22", plus: "+", plusdo: "\u2214", plusdu: "\u2A25", pluse: "\u2A72", PlusMinus: "\xB1", plusmn: "\xB1", plussim: "\u2A26", plustwo: "\u2A27", pm: "\xB1", Poincareplane: "\u210C", pointint: "\u2A15", popf: "\u{1D561}", Popf: "\u2119", pound: "\xA3", prap: "\u2AB7", Pr: "\u2ABB", pr: "\u227A", prcue: "\u227C", precapprox: "\u2AB7", prec: "\u227A", preccurlyeq: "\u227C", Precedes: "\u227A", PrecedesEqual: "\u2AAF", PrecedesSlantEqual: "\u227C", PrecedesTilde: "\u227E", preceq: "\u2AAF", precnapprox: "\u2AB9", precneqq: "\u2AB5", precnsim: "\u22E8", pre: "\u2AAF", prE: "\u2AB3", precsim: "\u227E", prime: "\u2032", Prime: "\u2033", primes: "\u2119", prnap: "\u2AB9", prnE: "\u2AB5", prnsim: "\u22E8", prod: "\u220F", Product: "\u220F", profalar: "\u232E", profline: "\u2312", profsurf: "\u2313", prop: "\u221D", Proportional: "\u221D", Proportion: "\u2237", propto: "\u221D", prsim: "\u227E", prurel: "\u22B0", Pscr: "\u{1D4AB}", pscr: "\u{1D4C5}", Psi: "\u03A8", psi: "\u03C8", puncsp: "\u2008", Qfr: "\u{1D514}", qfr: "\u{1D52E}", qint: "\u2A0C", qopf: "\u{1D562}", Qopf: "\u211A", qprime: "\u2057", Qscr: "\u{1D4AC}", qscr: "\u{1D4C6}", quaternions: "\u210D", quatint: "\u2A16", quest: "?", questeq: "\u225F", quot: '"', QUOT: '"', rAarr: "\u21DB", race: "\u223D\u0331", Racute: "\u0154", racute: "\u0155", radic: "\u221A", raemptyv: "\u29B3", rang: "\u27E9", Rang: "\u27EB", rangd: "\u2992", range: "\u29A5", rangle: "\u27E9", raquo: "\xBB", rarrap: "\u2975", rarrb: "\u21E5", rarrbfs: "\u2920", rarrc: "\u2933", rarr: "\u2192", Rarr: "\u21A0", rArr: "\u21D2", rarrfs: "\u291E", rarrhk: "\u21AA", rarrlp: "\u21AC", rarrpl: "\u2945", rarrsim: "\u2974", Rarrtl: "\u2916", rarrtl: "\u21A3", rarrw: "\u219D", ratail: "\u291A", rAtail: "\u291C", ratio: "\u2236", rationals: "\u211A", rbarr: "\u290D", rBarr: "\u290F", RBarr: "\u2910", rbbrk: "\u2773", rbrace: "}", rbrack: "]", rbrke: "\u298C", rbrksld: "\u298E", rbrkslu: "\u2990", Rcaron: "\u0158", rcaron: "\u0159", Rcedil: "\u0156", rcedil: "\u0157", rceil: "\u2309", rcub: "}", Rcy: "\u0420", rcy: "\u0440", rdca: "\u2937", rdldhar: "\u2969", rdquo: "\u201D", rdquor: "\u201D", rdsh: "\u21B3", real: "\u211C", realine: "\u211B", realpart: "\u211C", reals: "\u211D", Re: "\u211C", rect: "\u25AD", reg: "\xAE", REG: "\xAE", ReverseElement: "\u220B", ReverseEquilibrium: "\u21CB", ReverseUpEquilibrium: "\u296F", rfisht: "\u297D", rfloor: "\u230B", rfr: "\u{1D52F}", Rfr: "\u211C", rHar: "\u2964", rhard: "\u21C1", rharu: "\u21C0", rharul: "\u296C", Rho: "\u03A1", rho: "\u03C1", rhov: "\u03F1", RightAngleBracket: "\u27E9", RightArrowBar: "\u21E5", rightarrow: "\u2192", RightArrow: "\u2192", Rightarrow: "\u21D2", RightArrowLeftArrow: "\u21C4", rightarrowtail: "\u21A3", RightCeiling: "\u2309", RightDoubleBracket: "\u27E7", RightDownTeeVector: "\u295D", RightDownVectorBar: "\u2955", RightDownVector: "\u21C2", RightFloor: "\u230B", rightharpoondown: "\u21C1", rightharpoonup: "\u21C0", rightleftarrows: "\u21C4", rightleftharpoons: "\u21CC", rightrightarrows: "\u21C9", rightsquigarrow: "\u219D", RightTeeArrow: "\u21A6", RightTee: "\u22A2", RightTeeVector: "\u295B", rightthreetimes: "\u22CC", RightTriangleBar: "\u29D0", RightTriangle: "\u22B3", RightTriangleEqual: "\u22B5", RightUpDownVector: "\u294F", RightUpTeeVector: "\u295C", RightUpVectorBar: "\u2954", RightUpVector: "\u21BE", RightVectorBar: "\u2953", RightVector: "\u21C0", ring: "\u02DA", risingdotseq: "\u2253", rlarr: "\u21C4", rlhar: "\u21CC", rlm: "\u200F", rmoustache: "\u23B1", rmoust: "\u23B1", rnmid: "\u2AEE", roang: "\u27ED", roarr: "\u21FE", robrk: "\u27E7", ropar: "\u2986", ropf: "\u{1D563}", Ropf: "\u211D", roplus: "\u2A2E", rotimes: "\u2A35", RoundImplies: "\u2970", rpar: ")", rpargt: "\u2994", rppolint: "\u2A12", rrarr: "\u21C9", Rrightarrow: "\u21DB", rsaquo: "\u203A", rscr: "\u{1D4C7}", Rscr: "\u211B", rsh: "\u21B1", Rsh: "\u21B1", rsqb: "]", rsquo: "\u2019", rsquor: "\u2019", rthree: "\u22CC", rtimes: "\u22CA", rtri: "\u25B9", rtrie: "\u22B5", rtrif: "\u25B8", rtriltri: "\u29CE", RuleDelayed: "\u29F4", ruluhar: "\u2968", rx: "\u211E", Sacute: "\u015A", sacute: "\u015B", sbquo: "\u201A", scap: "\u2AB8", Scaron: "\u0160", scaron: "\u0161", Sc: "\u2ABC", sc: "\u227B", sccue: "\u227D", sce: "\u2AB0", scE: "\u2AB4", Scedil: "\u015E", scedil: "\u015F", Scirc: "\u015C", scirc: "\u015D", scnap: "\u2ABA", scnE: "\u2AB6", scnsim: "\u22E9", scpolint: "\u2A13", scsim: "\u227F", Scy: "\u0421", scy: "\u0441", sdotb: "\u22A1", sdot: "\u22C5", sdote: "\u2A66", searhk: "\u2925", searr: "\u2198", seArr: "\u21D8", searrow: "\u2198", sect: "\xA7", semi: ";", seswar: "\u2929", setminus: "\u2216", setmn: "\u2216", sext: "\u2736", Sfr: "\u{1D516}", sfr: "\u{1D530}", sfrown: "\u2322", sharp: "\u266F", SHCHcy: "\u0429", shchcy: "\u0449", SHcy: "\u0428", shcy: "\u0448", ShortDownArrow: "\u2193", ShortLeftArrow: "\u2190", shortmid: "\u2223", shortparallel: "\u2225", ShortRightArrow: "\u2192", ShortUpArrow: "\u2191", shy: "\xAD", Sigma: "\u03A3", sigma: "\u03C3", sigmaf: "\u03C2", sigmav: "\u03C2", sim: "\u223C", simdot: "\u2A6A", sime: "\u2243", simeq: "\u2243", simg: "\u2A9E", simgE: "\u2AA0", siml: "\u2A9D", simlE: "\u2A9F", simne: "\u2246", simplus: "\u2A24", simrarr: "\u2972", slarr: "\u2190", SmallCircle: "\u2218", smallsetminus: "\u2216", smashp: "\u2A33", smeparsl: "\u29E4", smid: "\u2223", smile: "\u2323", smt: "\u2AAA", smte: "\u2AAC", smtes: "\u2AAC\uFE00", SOFTcy: "\u042C", softcy: "\u044C", solbar: "\u233F", solb: "\u29C4", sol: "/", Sopf: "\u{1D54A}", sopf: "\u{1D564}", spades: "\u2660", spadesuit: "\u2660", spar: "\u2225", sqcap: "\u2293", sqcaps: "\u2293\uFE00", sqcup: "\u2294", sqcups: "\u2294\uFE00", Sqrt: "\u221A", sqsub: "\u228F", sqsube: "\u2291", sqsubset: "\u228F", sqsubseteq: "\u2291", sqsup: "\u2290", sqsupe: "\u2292", sqsupset: "\u2290", sqsupseteq: "\u2292", square: "\u25A1", Square: "\u25A1", SquareIntersection: "\u2293", SquareSubset: "\u228F", SquareSubsetEqual: "\u2291", SquareSuperset: "\u2290", SquareSupersetEqual: "\u2292", SquareUnion: "\u2294", squarf: "\u25AA", squ: "\u25A1", squf: "\u25AA", srarr: "\u2192", Sscr: "\u{1D4AE}", sscr: "\u{1D4C8}", ssetmn: "\u2216", ssmile: "\u2323", sstarf: "\u22C6", Star: "\u22C6", star: "\u2606", starf: "\u2605", straightepsilon: "\u03F5", straightphi: "\u03D5", strns: "\xAF", sub: "\u2282", Sub: "\u22D0", subdot: "\u2ABD", subE: "\u2AC5", sube: "\u2286", subedot: "\u2AC3", submult: "\u2AC1", subnE: "\u2ACB", subne: "\u228A", subplus: "\u2ABF", subrarr: "\u2979", subset: "\u2282", Subset: "\u22D0", subseteq: "\u2286", subseteqq: "\u2AC5", SubsetEqual: "\u2286", subsetneq: "\u228A", subsetneqq: "\u2ACB", subsim: "\u2AC7", subsub: "\u2AD5", subsup: "\u2AD3", succapprox: "\u2AB8", succ: "\u227B", succcurlyeq: "\u227D", Succeeds: "\u227B", SucceedsEqual: "\u2AB0", SucceedsSlantEqual: "\u227D", SucceedsTilde: "\u227F", succeq: "\u2AB0", succnapprox: "\u2ABA", succneqq: "\u2AB6", succnsim: "\u22E9", succsim: "\u227F", SuchThat: "\u220B", sum: "\u2211", Sum: "\u2211", sung: "\u266A", sup1: "\xB9", sup2: "\xB2", sup3: "\xB3", sup: "\u2283", Sup: "\u22D1", supdot: "\u2ABE", supdsub: "\u2AD8", supE: "\u2AC6", supe: "\u2287", supedot: "\u2AC4", Superset: "\u2283", SupersetEqual: "\u2287", suphsol: "\u27C9", suphsub: "\u2AD7", suplarr: "\u297B", supmult: "\u2AC2", supnE: "\u2ACC", supne: "\u228B", supplus: "\u2AC0", supset: "\u2283", Supset: "\u22D1", supseteq: "\u2287", supseteqq: "\u2AC6", supsetneq: "\u228B", supsetneqq: "\u2ACC", supsim: "\u2AC8", supsub: "\u2AD4", supsup: "\u2AD6", swarhk: "\u2926", swarr: "\u2199", swArr: "\u21D9", swarrow: "\u2199", swnwar: "\u292A", szlig: "\xDF", Tab: "	", target: "\u2316", Tau: "\u03A4", tau: "\u03C4", tbrk: "\u23B4", Tcaron: "\u0164", tcaron: "\u0165", Tcedil: "\u0162", tcedil: "\u0163", Tcy: "\u0422", tcy: "\u0442", tdot: "\u20DB", telrec: "\u2315", Tfr: "\u{1D517}", tfr: "\u{1D531}", there4: "\u2234", therefore: "\u2234", Therefore: "\u2234", Theta: "\u0398", theta: "\u03B8", thetasym: "\u03D1", thetav: "\u03D1", thickapprox: "\u2248", thicksim: "\u223C", ThickSpace: "\u205F\u200A", ThinSpace: "\u2009", thinsp: "\u2009", thkap: "\u2248", thksim: "\u223C", THORN: "\xDE", thorn: "\xFE", tilde: "\u02DC", Tilde: "\u223C", TildeEqual: "\u2243", TildeFullEqual: "\u2245", TildeTilde: "\u2248", timesbar: "\u2A31", timesb: "\u22A0", times: "\xD7", timesd: "\u2A30", tint: "\u222D", toea: "\u2928", topbot: "\u2336", topcir: "\u2AF1", top: "\u22A4", Topf: "\u{1D54B}", topf: "\u{1D565}", topfork: "\u2ADA", tosa: "\u2929", tprime: "\u2034", trade: "\u2122", TRADE: "\u2122", triangle: "\u25B5", triangledown: "\u25BF", triangleleft: "\u25C3", trianglelefteq: "\u22B4", triangleq: "\u225C", triangleright: "\u25B9", trianglerighteq: "\u22B5", tridot: "\u25EC", trie: "\u225C", triminus: "\u2A3A", TripleDot: "\u20DB", triplus: "\u2A39", trisb: "\u29CD", tritime: "\u2A3B", trpezium: "\u23E2", Tscr: "\u{1D4AF}", tscr: "\u{1D4C9}", TScy: "\u0426", tscy: "\u0446", TSHcy: "\u040B", tshcy: "\u045B", Tstrok: "\u0166", tstrok: "\u0167", twixt: "\u226C", twoheadleftarrow: "\u219E", twoheadrightarrow: "\u21A0", Uacute: "\xDA", uacute: "\xFA", uarr: "\u2191", Uarr: "\u219F", uArr: "\u21D1", Uarrocir: "\u2949", Ubrcy: "\u040E", ubrcy: "\u045E", Ubreve: "\u016C", ubreve: "\u016D", Ucirc: "\xDB", ucirc: "\xFB", Ucy: "\u0423", ucy: "\u0443", udarr: "\u21C5", Udblac: "\u0170", udblac: "\u0171", udhar: "\u296E", ufisht: "\u297E", Ufr: "\u{1D518}", ufr: "\u{1D532}", Ugrave: "\xD9", ugrave: "\xF9", uHar: "\u2963", uharl: "\u21BF", uharr: "\u21BE", uhblk: "\u2580", ulcorn: "\u231C", ulcorner: "\u231C", ulcrop: "\u230F", ultri: "\u25F8", Umacr: "\u016A", umacr: "\u016B", uml: "\xA8", UnderBar: "_", UnderBrace: "\u23DF", UnderBracket: "\u23B5", UnderParenthesis: "\u23DD", Union: "\u22C3", UnionPlus: "\u228E", Uogon: "\u0172", uogon: "\u0173", Uopf: "\u{1D54C}", uopf: "\u{1D566}", UpArrowBar: "\u2912", uparrow: "\u2191", UpArrow: "\u2191", Uparrow: "\u21D1", UpArrowDownArrow: "\u21C5", updownarrow: "\u2195", UpDownArrow: "\u2195", Updownarrow: "\u21D5", UpEquilibrium: "\u296E", upharpoonleft: "\u21BF", upharpoonright: "\u21BE", uplus: "\u228E", UpperLeftArrow: "\u2196", UpperRightArrow: "\u2197", upsi: "\u03C5", Upsi: "\u03D2", upsih: "\u03D2", Upsilon: "\u03A5", upsilon: "\u03C5", UpTeeArrow: "\u21A5", UpTee: "\u22A5", upuparrows: "\u21C8", urcorn: "\u231D", urcorner: "\u231D", urcrop: "\u230E", Uring: "\u016E", uring: "\u016F", urtri: "\u25F9", Uscr: "\u{1D4B0}", uscr: "\u{1D4CA}", utdot: "\u22F0", Utilde: "\u0168", utilde: "\u0169", utri: "\u25B5", utrif: "\u25B4", uuarr: "\u21C8", Uuml: "\xDC", uuml: "\xFC", uwangle: "\u29A7", vangrt: "\u299C", varepsilon: "\u03F5", varkappa: "\u03F0", varnothing: "\u2205", varphi: "\u03D5", varpi: "\u03D6", varpropto: "\u221D", varr: "\u2195", vArr: "\u21D5", varrho: "\u03F1", varsigma: "\u03C2", varsubsetneq: "\u228A\uFE00", varsubsetneqq: "\u2ACB\uFE00", varsupsetneq: "\u228B\uFE00", varsupsetneqq: "\u2ACC\uFE00", vartheta: "\u03D1", vartriangleleft: "\u22B2", vartriangleright: "\u22B3", vBar: "\u2AE8", Vbar: "\u2AEB", vBarv: "\u2AE9", Vcy: "\u0412", vcy: "\u0432", vdash: "\u22A2", vDash: "\u22A8", Vdash: "\u22A9", VDash: "\u22AB", Vdashl: "\u2AE6", veebar: "\u22BB", vee: "\u2228", Vee: "\u22C1", veeeq: "\u225A", vellip: "\u22EE", verbar: "|", Verbar: "\u2016", vert: "|", Vert: "\u2016", VerticalBar: "\u2223", VerticalLine: "|", VerticalSeparator: "\u2758", VerticalTilde: "\u2240", VeryThinSpace: "\u200A", Vfr: "\u{1D519}", vfr: "\u{1D533}", vltri: "\u22B2", vnsub: "\u2282\u20D2", vnsup: "\u2283\u20D2", Vopf: "\u{1D54D}", vopf: "\u{1D567}", vprop: "\u221D", vrtri: "\u22B3", Vscr: "\u{1D4B1}", vscr: "\u{1D4CB}", vsubnE: "\u2ACB\uFE00", vsubne: "\u228A\uFE00", vsupnE: "\u2ACC\uFE00", vsupne: "\u228B\uFE00", Vvdash: "\u22AA", vzigzag: "\u299A", Wcirc: "\u0174", wcirc: "\u0175", wedbar: "\u2A5F", wedge: "\u2227", Wedge: "\u22C0", wedgeq: "\u2259", weierp: "\u2118", Wfr: "\u{1D51A}", wfr: "\u{1D534}", Wopf: "\u{1D54E}", wopf: "\u{1D568}", wp: "\u2118", wr: "\u2240", wreath: "\u2240", Wscr: "\u{1D4B2}", wscr: "\u{1D4CC}", xcap: "\u22C2", xcirc: "\u25EF", xcup: "\u22C3", xdtri: "\u25BD", Xfr: "\u{1D51B}", xfr: "\u{1D535}", xharr: "\u27F7", xhArr: "\u27FA", Xi: "\u039E", xi: "\u03BE", xlarr: "\u27F5", xlArr: "\u27F8", xmap: "\u27FC", xnis: "\u22FB", xodot: "\u2A00", Xopf: "\u{1D54F}", xopf: "\u{1D569}", xoplus: "\u2A01", xotime: "\u2A02", xrarr: "\u27F6", xrArr: "\u27F9", Xscr: "\u{1D4B3}", xscr: "\u{1D4CD}", xsqcup: "\u2A06", xuplus: "\u2A04", xutri: "\u25B3", xvee: "\u22C1", xwedge: "\u22C0", Yacute: "\xDD", yacute: "\xFD", YAcy: "\u042F", yacy: "\u044F", Ycirc: "\u0176", ycirc: "\u0177", Ycy: "\u042B", ycy: "\u044B", yen: "\xA5", Yfr: "\u{1D51C}", yfr: "\u{1D536}", YIcy: "\u0407", yicy: "\u0457", Yopf: "\u{1D550}", yopf: "\u{1D56A}", Yscr: "\u{1D4B4}", yscr: "\u{1D4CE}", YUcy: "\u042E", yucy: "\u044E", yuml: "\xFF", Yuml: "\u0178", Zacute: "\u0179", zacute: "\u017A", Zcaron: "\u017D", zcaron: "\u017E", Zcy: "\u0417", zcy: "\u0437", Zdot: "\u017B", zdot: "\u017C", zeetrf: "\u2128", ZeroWidthSpace: "\u200B", Zeta: "\u0396", zeta: "\u03B6", zfr: "\u{1D537}", Zfr: "\u2128", ZHcy: "\u0416", zhcy: "\u0436", zigrarr: "\u21DD", zopf: "\u{1D56B}", Zopf: "\u2124", Zscr: "\u{1D4B5}", zscr: "\u{1D4CF}", zwj: "\u200D", zwnj: "\u200C" };
  }
});

// node_modules/entities/lib/maps/legacy.json
var require_legacy = __commonJS({
  "node_modules/entities/lib/maps/legacy.json"(exports2, module2) {
    module2.exports = { Aacute: "\xC1", aacute: "\xE1", Acirc: "\xC2", acirc: "\xE2", acute: "\xB4", AElig: "\xC6", aelig: "\xE6", Agrave: "\xC0", agrave: "\xE0", amp: "&", AMP: "&", Aring: "\xC5", aring: "\xE5", Atilde: "\xC3", atilde: "\xE3", Auml: "\xC4", auml: "\xE4", brvbar: "\xA6", Ccedil: "\xC7", ccedil: "\xE7", cedil: "\xB8", cent: "\xA2", copy: "\xA9", COPY: "\xA9", curren: "\xA4", deg: "\xB0", divide: "\xF7", Eacute: "\xC9", eacute: "\xE9", Ecirc: "\xCA", ecirc: "\xEA", Egrave: "\xC8", egrave: "\xE8", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", frac12: "\xBD", frac14: "\xBC", frac34: "\xBE", gt: ">", GT: ">", Iacute: "\xCD", iacute: "\xED", Icirc: "\xCE", icirc: "\xEE", iexcl: "\xA1", Igrave: "\xCC", igrave: "\xEC", iquest: "\xBF", Iuml: "\xCF", iuml: "\xEF", laquo: "\xAB", lt: "<", LT: "<", macr: "\xAF", micro: "\xB5", middot: "\xB7", nbsp: "\xA0", not: "\xAC", Ntilde: "\xD1", ntilde: "\xF1", Oacute: "\xD3", oacute: "\xF3", Ocirc: "\xD4", ocirc: "\xF4", Ograve: "\xD2", ograve: "\xF2", ordf: "\xAA", ordm: "\xBA", Oslash: "\xD8", oslash: "\xF8", Otilde: "\xD5", otilde: "\xF5", Ouml: "\xD6", ouml: "\xF6", para: "\xB6", plusmn: "\xB1", pound: "\xA3", quot: '"', QUOT: '"', raquo: "\xBB", reg: "\xAE", REG: "\xAE", sect: "\xA7", shy: "\xAD", sup1: "\xB9", sup2: "\xB2", sup3: "\xB3", szlig: "\xDF", THORN: "\xDE", thorn: "\xFE", times: "\xD7", Uacute: "\xDA", uacute: "\xFA", Ucirc: "\xDB", ucirc: "\xFB", Ugrave: "\xD9", ugrave: "\xF9", uml: "\xA8", Uuml: "\xDC", uuml: "\xFC", Yacute: "\xDD", yacute: "\xFD", yen: "\xA5", yuml: "\xFF" };
  }
});

// node_modules/entities/lib/maps/xml.json
var require_xml = __commonJS({
  "node_modules/entities/lib/maps/xml.json"(exports2, module2) {
    module2.exports = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
  }
});

// node_modules/entities/lib/maps/decode.json
var require_decode2 = __commonJS({
  "node_modules/entities/lib/maps/decode.json"(exports2, module2) {
    module2.exports = { "0": 65533, "128": 8364, "130": 8218, "131": 402, "132": 8222, "133": 8230, "134": 8224, "135": 8225, "136": 710, "137": 8240, "138": 352, "139": 8249, "140": 338, "142": 381, "145": 8216, "146": 8217, "147": 8220, "148": 8221, "149": 8226, "150": 8211, "151": 8212, "152": 732, "153": 8482, "154": 353, "155": 8250, "156": 339, "158": 382, "159": 376 };
  }
});

// node_modules/entities/lib/decode_codepoint.js
var require_decode_codepoint2 = __commonJS({
  "node_modules/entities/lib/decode_codepoint.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var decode_json_1 = __importDefault(require_decode2());
    function decodeCodePoint(codePoint) {
      if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
        return "\uFFFD";
      }
      if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
      }
      var output = "";
      if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      output += String.fromCharCode(codePoint);
      return output;
    }
    exports2.default = decodeCodePoint;
  }
});

// node_modules/entities/lib/decode.js
var require_decode3 = __commonJS({
  "node_modules/entities/lib/decode.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decodeHTML = exports2.decodeHTMLStrict = exports2.decodeXML = void 0;
    var entities_json_1 = __importDefault(require_entities());
    var legacy_json_1 = __importDefault(require_legacy());
    var xml_json_1 = __importDefault(require_xml());
    var decode_codepoint_1 = __importDefault(require_decode_codepoint2());
    exports2.decodeXML = getStrictDecoder(xml_json_1.default);
    exports2.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
    function getStrictDecoder(map) {
      var keys = Object.keys(map).join("|");
      var replace = getReplacer(map);
      keys += "|#[xX][\\da-fA-F]+|#\\d+";
      var re = new RegExp("&(?:" + keys + ");", "g");
      return function(str) {
        return String(str).replace(re, replace);
      };
    }
    var sorter = function(a, b) {
      return a < b ? 1 : -1;
    };
    exports2.decodeHTML = function() {
      var legacy = Object.keys(legacy_json_1.default).sort(sorter);
      var keys = Object.keys(entities_json_1.default).sort(sorter);
      for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
          keys[i] += ";?";
          j++;
        } else {
          keys[i] += ";";
        }
      }
      var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
      var replace = getReplacer(entities_json_1.default);
      function replacer(str) {
        if (str.substr(-1) !== ";")
          str += ";";
        return replace(str);
      }
      return function(str) {
        return String(str).replace(re, replacer);
      };
    }();
    function getReplacer(map) {
      return function replace(str) {
        if (str.charAt(1) === "#") {
          var secondChar = str.charAt(2);
          if (secondChar === "X" || secondChar === "x") {
            return decode_codepoint_1.default(parseInt(str.substr(3), 16));
          }
          return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        return map[str.slice(1, -1)];
      };
    }
  }
});

// node_modules/entities/lib/encode.js
var require_encode = __commonJS({
  "node_modules/entities/lib/encode.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.escape = exports2.encodeHTML = exports2.encodeXML = void 0;
    var xml_json_1 = __importDefault(require_xml());
    var inverseXML = getInverseObj(xml_json_1.default);
    var xmlReplacer = getInverseReplacer(inverseXML);
    exports2.encodeXML = getInverse(inverseXML, xmlReplacer);
    var entities_json_1 = __importDefault(require_entities());
    var inverseHTML = getInverseObj(entities_json_1.default);
    var htmlReplacer = getInverseReplacer(inverseHTML);
    exports2.encodeHTML = getInverse(inverseHTML, htmlReplacer);
    function getInverseObj(obj) {
      return Object.keys(obj).sort().reduce(function(inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
      }, {});
    }
    function getInverseReplacer(inverse) {
      var single = [];
      var multiple = [];
      for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
          single.push("\\" + k);
        } else {
          multiple.push(k);
        }
      }
      single.sort();
      for (var start = 0; start < single.length - 1; start++) {
        var end = start;
        while (end < single.length - 1 && single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
          end += 1;
        }
        var count = 1 + end - start;
        if (count < 3)
          continue;
        single.splice(start, count, single[start] + "-" + single[end]);
      }
      multiple.unshift("[" + single.join("") + "]");
      return new RegExp(multiple.join("|"), "g");
    }
    var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
    function singleCharReplacer(c) {
      return "&#x" + c.codePointAt(0).toString(16).toUpperCase() + ";";
    }
    function getInverse(inverse, re) {
      return function(data) {
        return data.replace(re, function(name) {
          return inverse[name];
        }).replace(reNonASCII, singleCharReplacer);
      };
    }
    var reXmlChars = getInverseReplacer(inverseXML);
    function escape(data) {
      return data.replace(reXmlChars, singleCharReplacer).replace(reNonASCII, singleCharReplacer);
    }
    exports2.escape = escape;
  }
});

// node_modules/entities/lib/index.js
var require_lib4 = __commonJS({
  "node_modules/entities/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.decodeXMLStrict = exports2.decodeHTML5Strict = exports2.decodeHTML4Strict = exports2.decodeHTML5 = exports2.decodeHTML4 = exports2.decodeHTMLStrict = exports2.decodeHTML = exports2.decodeXML = exports2.encodeHTML5 = exports2.encodeHTML4 = exports2.escape = exports2.encodeHTML = exports2.encodeXML = exports2.encode = exports2.decodeStrict = exports2.decode = void 0;
    var decode_1 = require_decode3();
    var encode_1 = require_encode();
    function decode(data, level) {
      return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
    }
    exports2.decode = decode;
    function decodeStrict(data, level) {
      return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
    }
    exports2.decodeStrict = decodeStrict;
    function encode(data, level) {
      return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
    }
    exports2.encode = encode;
    var encode_2 = require_encode();
    Object.defineProperty(exports2, "encodeXML", { enumerable: true, get: function() {
      return encode_2.encodeXML;
    } });
    Object.defineProperty(exports2, "encodeHTML", { enumerable: true, get: function() {
      return encode_2.encodeHTML;
    } });
    Object.defineProperty(exports2, "escape", { enumerable: true, get: function() {
      return encode_2.escape;
    } });
    Object.defineProperty(exports2, "encodeHTML4", { enumerable: true, get: function() {
      return encode_2.encodeHTML;
    } });
    Object.defineProperty(exports2, "encodeHTML5", { enumerable: true, get: function() {
      return encode_2.encodeHTML;
    } });
    var decode_2 = require_decode3();
    Object.defineProperty(exports2, "decodeXML", { enumerable: true, get: function() {
      return decode_2.decodeXML;
    } });
    Object.defineProperty(exports2, "decodeHTML", { enumerable: true, get: function() {
      return decode_2.decodeHTML;
    } });
    Object.defineProperty(exports2, "decodeHTMLStrict", { enumerable: true, get: function() {
      return decode_2.decodeHTMLStrict;
    } });
    Object.defineProperty(exports2, "decodeHTML4", { enumerable: true, get: function() {
      return decode_2.decodeHTML;
    } });
    Object.defineProperty(exports2, "decodeHTML5", { enumerable: true, get: function() {
      return decode_2.decodeHTML;
    } });
    Object.defineProperty(exports2, "decodeHTML4Strict", { enumerable: true, get: function() {
      return decode_2.decodeHTMLStrict;
    } });
    Object.defineProperty(exports2, "decodeHTML5Strict", { enumerable: true, get: function() {
      return decode_2.decodeHTMLStrict;
    } });
    Object.defineProperty(exports2, "decodeXMLStrict", { enumerable: true, get: function() {
      return decode_2.decodeXML;
    } });
  }
});

// node_modules/dom-serializer/lib/foreignNames.js
var require_foreignNames = __commonJS({
  "node_modules/dom-serializer/lib/foreignNames.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.attributeNames = exports2.elementNames = void 0;
    exports2.elementNames = new Map([
      ["altglyph", "altGlyph"],
      ["altglyphdef", "altGlyphDef"],
      ["altglyphitem", "altGlyphItem"],
      ["animatecolor", "animateColor"],
      ["animatemotion", "animateMotion"],
      ["animatetransform", "animateTransform"],
      ["clippath", "clipPath"],
      ["feblend", "feBlend"],
      ["fecolormatrix", "feColorMatrix"],
      ["fecomponenttransfer", "feComponentTransfer"],
      ["fecomposite", "feComposite"],
      ["feconvolvematrix", "feConvolveMatrix"],
      ["fediffuselighting", "feDiffuseLighting"],
      ["fedisplacementmap", "feDisplacementMap"],
      ["fedistantlight", "feDistantLight"],
      ["fedropshadow", "feDropShadow"],
      ["feflood", "feFlood"],
      ["fefunca", "feFuncA"],
      ["fefuncb", "feFuncB"],
      ["fefuncg", "feFuncG"],
      ["fefuncr", "feFuncR"],
      ["fegaussianblur", "feGaussianBlur"],
      ["feimage", "feImage"],
      ["femerge", "feMerge"],
      ["femergenode", "feMergeNode"],
      ["femorphology", "feMorphology"],
      ["feoffset", "feOffset"],
      ["fepointlight", "fePointLight"],
      ["fespecularlighting", "feSpecularLighting"],
      ["fespotlight", "feSpotLight"],
      ["fetile", "feTile"],
      ["feturbulence", "feTurbulence"],
      ["foreignobject", "foreignObject"],
      ["glyphref", "glyphRef"],
      ["lineargradient", "linearGradient"],
      ["radialgradient", "radialGradient"],
      ["textpath", "textPath"]
    ]);
    exports2.attributeNames = new Map([
      ["definitionurl", "definitionURL"],
      ["attributename", "attributeName"],
      ["attributetype", "attributeType"],
      ["basefrequency", "baseFrequency"],
      ["baseprofile", "baseProfile"],
      ["calcmode", "calcMode"],
      ["clippathunits", "clipPathUnits"],
      ["diffuseconstant", "diffuseConstant"],
      ["edgemode", "edgeMode"],
      ["filterunits", "filterUnits"],
      ["glyphref", "glyphRef"],
      ["gradienttransform", "gradientTransform"],
      ["gradientunits", "gradientUnits"],
      ["kernelmatrix", "kernelMatrix"],
      ["kernelunitlength", "kernelUnitLength"],
      ["keypoints", "keyPoints"],
      ["keysplines", "keySplines"],
      ["keytimes", "keyTimes"],
      ["lengthadjust", "lengthAdjust"],
      ["limitingconeangle", "limitingConeAngle"],
      ["markerheight", "markerHeight"],
      ["markerunits", "markerUnits"],
      ["markerwidth", "markerWidth"],
      ["maskcontentunits", "maskContentUnits"],
      ["maskunits", "maskUnits"],
      ["numoctaves", "numOctaves"],
      ["pathlength", "pathLength"],
      ["patterncontentunits", "patternContentUnits"],
      ["patterntransform", "patternTransform"],
      ["patternunits", "patternUnits"],
      ["pointsatx", "pointsAtX"],
      ["pointsaty", "pointsAtY"],
      ["pointsatz", "pointsAtZ"],
      ["preservealpha", "preserveAlpha"],
      ["preserveaspectratio", "preserveAspectRatio"],
      ["primitiveunits", "primitiveUnits"],
      ["refx", "refX"],
      ["refy", "refY"],
      ["repeatcount", "repeatCount"],
      ["repeatdur", "repeatDur"],
      ["requiredextensions", "requiredExtensions"],
      ["requiredfeatures", "requiredFeatures"],
      ["specularconstant", "specularConstant"],
      ["specularexponent", "specularExponent"],
      ["spreadmethod", "spreadMethod"],
      ["startoffset", "startOffset"],
      ["stddeviation", "stdDeviation"],
      ["stitchtiles", "stitchTiles"],
      ["surfacescale", "surfaceScale"],
      ["systemlanguage", "systemLanguage"],
      ["tablevalues", "tableValues"],
      ["targetx", "targetX"],
      ["targety", "targetY"],
      ["textlength", "textLength"],
      ["viewbox", "viewBox"],
      ["viewtarget", "viewTarget"],
      ["xchannelselector", "xChannelSelector"],
      ["ychannelselector", "yChannelSelector"],
      ["zoomandpan", "zoomAndPan"]
    ]);
  }
});

// node_modules/dom-serializer/lib/index.js
var require_lib5 = __commonJS({
  "node_modules/dom-serializer/lib/index.js"(exports2) {
    "use strict";
    var __assign = exports2 && exports2.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var ElementType = __importStar(require_lib2());
    var entities_1 = require_lib4();
    var foreignNames_1 = require_foreignNames();
    var unencodedElements = new Set([
      "style",
      "script",
      "xmp",
      "iframe",
      "noembed",
      "noframes",
      "plaintext",
      "noscript"
    ]);
    function formatAttributes(attributes, opts) {
      if (!attributes)
        return;
      return Object.keys(attributes).map(function(key) {
        var _a, _b;
        var value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
        if (opts.xmlMode === "foreign") {
          key = (_b = foreignNames_1.attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
        }
        if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
          return key;
        }
        return key + '="' + (opts.decodeEntities !== false ? entities_1.encodeXML(value) : value.replace(/"/g, "&quot;")) + '"';
      }).join(" ");
    }
    var singleTag = new Set([
      "area",
      "base",
      "basefont",
      "br",
      "col",
      "command",
      "embed",
      "frame",
      "hr",
      "img",
      "input",
      "isindex",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ]);
    function render(node, options) {
      if (options === void 0) {
        options = {};
      }
      var nodes = "length" in node ? node : [node];
      var output = "";
      for (var i = 0; i < nodes.length; i++) {
        output += renderNode(nodes[i], options);
      }
      return output;
    }
    exports2.default = render;
    function renderNode(node, options) {
      switch (node.type) {
        case ElementType.Root:
          return render(node.children, options);
        case ElementType.Directive:
        case ElementType.Doctype:
          return renderDirective(node);
        case ElementType.Comment:
          return renderComment(node);
        case ElementType.CDATA:
          return renderCdata(node);
        case ElementType.Script:
        case ElementType.Style:
        case ElementType.Tag:
          return renderTag(node, options);
        case ElementType.Text:
          return renderText(node, options);
      }
    }
    var foreignModeIntegrationPoints = new Set([
      "mi",
      "mo",
      "mn",
      "ms",
      "mtext",
      "annotation-xml",
      "foreignObject",
      "desc",
      "title"
    ]);
    var foreignElements = new Set(["svg", "math"]);
    function renderTag(elem, opts) {
      var _a;
      if (opts.xmlMode === "foreign") {
        elem.name = (_a = foreignNames_1.elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
        if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
          opts = __assign(__assign({}, opts), { xmlMode: false });
        }
      }
      if (!opts.xmlMode && foreignElements.has(elem.name)) {
        opts = __assign(__assign({}, opts), { xmlMode: "foreign" });
      }
      var tag = "<" + elem.name;
      var attribs = formatAttributes(elem.attribs, opts);
      if (attribs) {
        tag += " " + attribs;
      }
      if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
        if (!opts.xmlMode)
          tag += " ";
        tag += "/>";
      } else {
        tag += ">";
        if (elem.children.length > 0) {
          tag += render(elem.children, opts);
        }
        if (opts.xmlMode || !singleTag.has(elem.name)) {
          tag += "</" + elem.name + ">";
        }
      }
      return tag;
    }
    function renderDirective(elem) {
      return "<" + elem.data + ">";
    }
    function renderText(elem, opts) {
      var data = elem.data || "";
      if (opts.decodeEntities !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
        data = entities_1.encodeXML(data);
      }
      return data;
    }
    function renderCdata(elem) {
      return "<![CDATA[" + elem.children[0].data + "]]>";
    }
    function renderComment(elem) {
      return "<!--" + elem.data + "-->";
    }
  }
});

// node_modules/domutils/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/domutils/lib/stringify.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.innerText = exports2.textContent = exports2.getText = exports2.getInnerHTML = exports2.getOuterHTML = void 0;
    var domhandler_1 = require_lib3();
    var dom_serializer_1 = __importDefault(require_lib5());
    var domelementtype_1 = require_lib2();
    function getOuterHTML(node, options) {
      return (0, dom_serializer_1.default)(node, options);
    }
    exports2.getOuterHTML = getOuterHTML;
    function getInnerHTML(node, options) {
      return (0, domhandler_1.hasChildren)(node) ? node.children.map(function(node2) {
        return getOuterHTML(node2, options);
      }).join("") : "";
    }
    exports2.getInnerHTML = getInnerHTML;
    function getText(node) {
      if (Array.isArray(node))
        return node.map(getText).join("");
      if ((0, domhandler_1.isTag)(node))
        return node.name === "br" ? "\n" : getText(node.children);
      if ((0, domhandler_1.isCDATA)(node))
        return getText(node.children);
      if ((0, domhandler_1.isText)(node))
        return node.data;
      return "";
    }
    exports2.getText = getText;
    function textContent(node) {
      if (Array.isArray(node))
        return node.map(textContent).join("");
      if ((0, domhandler_1.hasChildren)(node) && !(0, domhandler_1.isComment)(node)) {
        return textContent(node.children);
      }
      if ((0, domhandler_1.isText)(node))
        return node.data;
      return "";
    }
    exports2.textContent = textContent;
    function innerText(node) {
      if (Array.isArray(node))
        return node.map(innerText).join("");
      if ((0, domhandler_1.hasChildren)(node) && (node.type === domelementtype_1.ElementType.Tag || (0, domhandler_1.isCDATA)(node))) {
        return innerText(node.children);
      }
      if ((0, domhandler_1.isText)(node))
        return node.data;
      return "";
    }
    exports2.innerText = innerText;
  }
});

// node_modules/domutils/lib/traversal.js
var require_traversal = __commonJS({
  "node_modules/domutils/lib/traversal.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.prevElementSibling = exports2.nextElementSibling = exports2.getName = exports2.hasAttrib = exports2.getAttributeValue = exports2.getSiblings = exports2.getParent = exports2.getChildren = void 0;
    var domhandler_1 = require_lib3();
    var emptyArray = [];
    function getChildren(elem) {
      var _a;
      return (_a = elem.children) !== null && _a !== void 0 ? _a : emptyArray;
    }
    exports2.getChildren = getChildren;
    function getParent(elem) {
      return elem.parent || null;
    }
    exports2.getParent = getParent;
    function getSiblings(elem) {
      var _a, _b;
      var parent = getParent(elem);
      if (parent != null)
        return getChildren(parent);
      var siblings = [elem];
      var prev = elem.prev, next = elem.next;
      while (prev != null) {
        siblings.unshift(prev);
        _a = prev, prev = _a.prev;
      }
      while (next != null) {
        siblings.push(next);
        _b = next, next = _b.next;
      }
      return siblings;
    }
    exports2.getSiblings = getSiblings;
    function getAttributeValue(elem, name) {
      var _a;
      return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
    }
    exports2.getAttributeValue = getAttributeValue;
    function hasAttrib(elem, name) {
      return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
    }
    exports2.hasAttrib = hasAttrib;
    function getName(elem) {
      return elem.name;
    }
    exports2.getName = getName;
    function nextElementSibling(elem) {
      var _a;
      var next = elem.next;
      while (next !== null && !(0, domhandler_1.isTag)(next))
        _a = next, next = _a.next;
      return next;
    }
    exports2.nextElementSibling = nextElementSibling;
    function prevElementSibling(elem) {
      var _a;
      var prev = elem.prev;
      while (prev !== null && !(0, domhandler_1.isTag)(prev))
        _a = prev, prev = _a.prev;
      return prev;
    }
    exports2.prevElementSibling = prevElementSibling;
  }
});

// node_modules/domutils/lib/manipulation.js
var require_manipulation = __commonJS({
  "node_modules/domutils/lib/manipulation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.prepend = exports2.prependChild = exports2.append = exports2.appendChild = exports2.replaceElement = exports2.removeElement = void 0;
    function removeElement(elem) {
      if (elem.prev)
        elem.prev.next = elem.next;
      if (elem.next)
        elem.next.prev = elem.prev;
      if (elem.parent) {
        var childs = elem.parent.children;
        childs.splice(childs.lastIndexOf(elem), 1);
      }
    }
    exports2.removeElement = removeElement;
    function replaceElement(elem, replacement) {
      var prev = replacement.prev = elem.prev;
      if (prev) {
        prev.next = replacement;
      }
      var next = replacement.next = elem.next;
      if (next) {
        next.prev = replacement;
      }
      var parent = replacement.parent = elem.parent;
      if (parent) {
        var childs = parent.children;
        childs[childs.lastIndexOf(elem)] = replacement;
      }
    }
    exports2.replaceElement = replaceElement;
    function appendChild(elem, child) {
      removeElement(child);
      child.next = null;
      child.parent = elem;
      if (elem.children.push(child) > 1) {
        var sibling = elem.children[elem.children.length - 2];
        sibling.next = child;
        child.prev = sibling;
      } else {
        child.prev = null;
      }
    }
    exports2.appendChild = appendChild;
    function append(elem, next) {
      removeElement(next);
      var parent = elem.parent;
      var currNext = elem.next;
      next.next = currNext;
      next.prev = elem;
      elem.next = next;
      next.parent = parent;
      if (currNext) {
        currNext.prev = next;
        if (parent) {
          var childs = parent.children;
          childs.splice(childs.lastIndexOf(currNext), 0, next);
        }
      } else if (parent) {
        parent.children.push(next);
      }
    }
    exports2.append = append;
    function prependChild(elem, child) {
      removeElement(child);
      child.parent = elem;
      child.prev = null;
      if (elem.children.unshift(child) !== 1) {
        var sibling = elem.children[1];
        sibling.prev = child;
        child.next = sibling;
      } else {
        child.next = null;
      }
    }
    exports2.prependChild = prependChild;
    function prepend(elem, prev) {
      removeElement(prev);
      var parent = elem.parent;
      if (parent) {
        var childs = parent.children;
        childs.splice(childs.indexOf(elem), 0, prev);
      }
      if (elem.prev) {
        elem.prev.next = prev;
      }
      prev.parent = parent;
      prev.prev = elem.prev;
      prev.next = elem;
      elem.prev = prev;
    }
    exports2.prepend = prepend;
  }
});

// node_modules/domutils/lib/querying.js
var require_querying = __commonJS({
  "node_modules/domutils/lib/querying.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.findAll = exports2.existsOne = exports2.findOne = exports2.findOneChild = exports2.find = exports2.filter = void 0;
    var domhandler_1 = require_lib3();
    function filter(test, node, recurse, limit) {
      if (recurse === void 0) {
        recurse = true;
      }
      if (limit === void 0) {
        limit = Infinity;
      }
      if (!Array.isArray(node))
        node = [node];
      return find(test, node, recurse, limit);
    }
    exports2.filter = filter;
    function find(test, nodes, recurse, limit) {
      var result = [];
      for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var elem = nodes_1[_i];
        if (test(elem)) {
          result.push(elem);
          if (--limit <= 0)
            break;
        }
        if (recurse && (0, domhandler_1.hasChildren)(elem) && elem.children.length > 0) {
          var children = find(test, elem.children, recurse, limit);
          result.push.apply(result, children);
          limit -= children.length;
          if (limit <= 0)
            break;
        }
      }
      return result;
    }
    exports2.find = find;
    function findOneChild(test, nodes) {
      return nodes.find(test);
    }
    exports2.findOneChild = findOneChild;
    function findOne(test, nodes, recurse) {
      if (recurse === void 0) {
        recurse = true;
      }
      var elem = null;
      for (var i = 0; i < nodes.length && !elem; i++) {
        var checked = nodes[i];
        if (!(0, domhandler_1.isTag)(checked)) {
          continue;
        } else if (test(checked)) {
          elem = checked;
        } else if (recurse && checked.children.length > 0) {
          elem = findOne(test, checked.children);
        }
      }
      return elem;
    }
    exports2.findOne = findOne;
    function existsOne(test, nodes) {
      return nodes.some(function(checked) {
        return (0, domhandler_1.isTag)(checked) && (test(checked) || checked.children.length > 0 && existsOne(test, checked.children));
      });
    }
    exports2.existsOne = existsOne;
    function findAll(test, nodes) {
      var _a;
      var result = [];
      var stack = nodes.filter(domhandler_1.isTag);
      var elem;
      while (elem = stack.shift()) {
        var children = (_a = elem.children) === null || _a === void 0 ? void 0 : _a.filter(domhandler_1.isTag);
        if (children && children.length > 0) {
          stack.unshift.apply(stack, children);
        }
        if (test(elem))
          result.push(elem);
      }
      return result;
    }
    exports2.findAll = findAll;
  }
});

// node_modules/domutils/lib/legacy.js
var require_legacy2 = __commonJS({
  "node_modules/domutils/lib/legacy.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getElementsByTagType = exports2.getElementsByTagName = exports2.getElementById = exports2.getElements = exports2.testElement = void 0;
    var domhandler_1 = require_lib3();
    var querying_1 = require_querying();
    var Checks = {
      tag_name: function(name) {
        if (typeof name === "function") {
          return function(elem) {
            return (0, domhandler_1.isTag)(elem) && name(elem.name);
          };
        } else if (name === "*") {
          return domhandler_1.isTag;
        }
        return function(elem) {
          return (0, domhandler_1.isTag)(elem) && elem.name === name;
        };
      },
      tag_type: function(type) {
        if (typeof type === "function") {
          return function(elem) {
            return type(elem.type);
          };
        }
        return function(elem) {
          return elem.type === type;
        };
      },
      tag_contains: function(data) {
        if (typeof data === "function") {
          return function(elem) {
            return (0, domhandler_1.isText)(elem) && data(elem.data);
          };
        }
        return function(elem) {
          return (0, domhandler_1.isText)(elem) && elem.data === data;
        };
      }
    };
    function getAttribCheck(attrib, value) {
      if (typeof value === "function") {
        return function(elem) {
          return (0, domhandler_1.isTag)(elem) && value(elem.attribs[attrib]);
        };
      }
      return function(elem) {
        return (0, domhandler_1.isTag)(elem) && elem.attribs[attrib] === value;
      };
    }
    function combineFuncs(a, b) {
      return function(elem) {
        return a(elem) || b(elem);
      };
    }
    function compileTest(options) {
      var funcs = Object.keys(options).map(function(key) {
        var value = options[key];
        return Object.prototype.hasOwnProperty.call(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
      });
      return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
    }
    function testElement(options, node) {
      var test = compileTest(options);
      return test ? test(node) : true;
    }
    exports2.testElement = testElement;
    function getElements(options, nodes, recurse, limit) {
      if (limit === void 0) {
        limit = Infinity;
      }
      var test = compileTest(options);
      return test ? (0, querying_1.filter)(test, nodes, recurse, limit) : [];
    }
    exports2.getElements = getElements;
    function getElementById(id, nodes, recurse) {
      if (recurse === void 0) {
        recurse = true;
      }
      if (!Array.isArray(nodes))
        nodes = [nodes];
      return (0, querying_1.findOne)(getAttribCheck("id", id), nodes, recurse);
    }
    exports2.getElementById = getElementById;
    function getElementsByTagName(tagName, nodes, recurse, limit) {
      if (recurse === void 0) {
        recurse = true;
      }
      if (limit === void 0) {
        limit = Infinity;
      }
      return (0, querying_1.filter)(Checks.tag_name(tagName), nodes, recurse, limit);
    }
    exports2.getElementsByTagName = getElementsByTagName;
    function getElementsByTagType(type, nodes, recurse, limit) {
      if (recurse === void 0) {
        recurse = true;
      }
      if (limit === void 0) {
        limit = Infinity;
      }
      return (0, querying_1.filter)(Checks.tag_type(type), nodes, recurse, limit);
    }
    exports2.getElementsByTagType = getElementsByTagType;
  }
});

// node_modules/domutils/lib/helpers.js
var require_helpers = __commonJS({
  "node_modules/domutils/lib/helpers.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.uniqueSort = exports2.compareDocumentPosition = exports2.removeSubsets = void 0;
    var domhandler_1 = require_lib3();
    function removeSubsets(nodes) {
      var idx = nodes.length;
      while (--idx >= 0) {
        var node = nodes[idx];
        if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
          nodes.splice(idx, 1);
          continue;
        }
        for (var ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
          if (nodes.includes(ancestor)) {
            nodes.splice(idx, 1);
            break;
          }
        }
      }
      return nodes;
    }
    exports2.removeSubsets = removeSubsets;
    function compareDocumentPosition(nodeA, nodeB) {
      var aParents = [];
      var bParents = [];
      if (nodeA === nodeB) {
        return 0;
      }
      var current = (0, domhandler_1.hasChildren)(nodeA) ? nodeA : nodeA.parent;
      while (current) {
        aParents.unshift(current);
        current = current.parent;
      }
      current = (0, domhandler_1.hasChildren)(nodeB) ? nodeB : nodeB.parent;
      while (current) {
        bParents.unshift(current);
        current = current.parent;
      }
      var maxIdx = Math.min(aParents.length, bParents.length);
      var idx = 0;
      while (idx < maxIdx && aParents[idx] === bParents[idx]) {
        idx++;
      }
      if (idx === 0) {
        return 1;
      }
      var sharedParent = aParents[idx - 1];
      var siblings = sharedParent.children;
      var aSibling = aParents[idx];
      var bSibling = bParents[idx];
      if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
          return 4 | 16;
        }
        return 4;
      }
      if (sharedParent === nodeA) {
        return 2 | 8;
      }
      return 2;
    }
    exports2.compareDocumentPosition = compareDocumentPosition;
    function uniqueSort(nodes) {
      nodes = nodes.filter(function(node, i, arr) {
        return !arr.includes(node, i + 1);
      });
      nodes.sort(function(a, b) {
        var relative = compareDocumentPosition(a, b);
        if (relative & 2) {
          return -1;
        } else if (relative & 4) {
          return 1;
        }
        return 0;
      });
      return nodes;
    }
    exports2.uniqueSort = uniqueSort;
  }
});

// node_modules/domutils/lib/feeds.js
var require_feeds = __commonJS({
  "node_modules/domutils/lib/feeds.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getFeed = void 0;
    var stringify_1 = require_stringify();
    var legacy_1 = require_legacy2();
    function getFeed(doc) {
      var feedRoot = getOneElement(isValidFeed, doc);
      return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
    }
    exports2.getFeed = getFeed;
    function getAtomFeed(feedRoot) {
      var _a;
      var childs = feedRoot.children;
      var feed = {
        type: "atom",
        items: (0, legacy_1.getElementsByTagName)("entry", childs).map(function(item) {
          var _a2;
          var children = item.children;
          var entry = { media: getMediaElements(children) };
          addConditionally(entry, "id", "id", children);
          addConditionally(entry, "title", "title", children);
          var href2 = (_a2 = getOneElement("link", children)) === null || _a2 === void 0 ? void 0 : _a2.attribs.href;
          if (href2) {
            entry.link = href2;
          }
          var description = fetch2("summary", children) || fetch2("content", children);
          if (description) {
            entry.description = description;
          }
          var pubDate = fetch2("updated", children);
          if (pubDate) {
            entry.pubDate = new Date(pubDate);
          }
          return entry;
        })
      };
      addConditionally(feed, "id", "id", childs);
      addConditionally(feed, "title", "title", childs);
      var href = (_a = getOneElement("link", childs)) === null || _a === void 0 ? void 0 : _a.attribs.href;
      if (href) {
        feed.link = href;
      }
      addConditionally(feed, "description", "subtitle", childs);
      var updated = fetch2("updated", childs);
      if (updated) {
        feed.updated = new Date(updated);
      }
      addConditionally(feed, "author", "email", childs, true);
      return feed;
    }
    function getRssFeed(feedRoot) {
      var _a, _b;
      var childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
      var feed = {
        type: feedRoot.name.substr(0, 3),
        id: "",
        items: (0, legacy_1.getElementsByTagName)("item", feedRoot.children).map(function(item) {
          var children = item.children;
          var entry = { media: getMediaElements(children) };
          addConditionally(entry, "id", "guid", children);
          addConditionally(entry, "title", "title", children);
          addConditionally(entry, "link", "link", children);
          addConditionally(entry, "description", "description", children);
          var pubDate = fetch2("pubDate", children);
          if (pubDate)
            entry.pubDate = new Date(pubDate);
          return entry;
        })
      };
      addConditionally(feed, "title", "title", childs);
      addConditionally(feed, "link", "link", childs);
      addConditionally(feed, "description", "description", childs);
      var updated = fetch2("lastBuildDate", childs);
      if (updated) {
        feed.updated = new Date(updated);
      }
      addConditionally(feed, "author", "managingEditor", childs, true);
      return feed;
    }
    var MEDIA_KEYS_STRING = ["url", "type", "lang"];
    var MEDIA_KEYS_INT = [
      "fileSize",
      "bitrate",
      "framerate",
      "samplingrate",
      "channels",
      "duration",
      "height",
      "width"
    ];
    function getMediaElements(where) {
      return (0, legacy_1.getElementsByTagName)("media:content", where).map(function(elem) {
        var attribs = elem.attribs;
        var media = {
          medium: attribs.medium,
          isDefault: !!attribs.isDefault
        };
        for (var _i = 0, MEDIA_KEYS_STRING_1 = MEDIA_KEYS_STRING; _i < MEDIA_KEYS_STRING_1.length; _i++) {
          var attrib = MEDIA_KEYS_STRING_1[_i];
          if (attribs[attrib]) {
            media[attrib] = attribs[attrib];
          }
        }
        for (var _a = 0, MEDIA_KEYS_INT_1 = MEDIA_KEYS_INT; _a < MEDIA_KEYS_INT_1.length; _a++) {
          var attrib = MEDIA_KEYS_INT_1[_a];
          if (attribs[attrib]) {
            media[attrib] = parseInt(attribs[attrib], 10);
          }
        }
        if (attribs.expression) {
          media.expression = attribs.expression;
        }
        return media;
      });
    }
    function getOneElement(tagName, node) {
      return (0, legacy_1.getElementsByTagName)(tagName, node, true, 1)[0];
    }
    function fetch2(tagName, where, recurse) {
      if (recurse === void 0) {
        recurse = false;
      }
      return (0, stringify_1.textContent)((0, legacy_1.getElementsByTagName)(tagName, where, recurse, 1)).trim();
    }
    function addConditionally(obj, prop, tagName, where, recurse) {
      if (recurse === void 0) {
        recurse = false;
      }
      var val = fetch2(tagName, where, recurse);
      if (val)
        obj[prop] = val;
    }
    function isValidFeed(value) {
      return value === "rss" || value === "feed" || value === "rdf:RDF";
    }
  }
});

// node_modules/domutils/lib/index.js
var require_lib6 = __commonJS({
  "node_modules/domutils/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.hasChildren = exports2.isDocument = exports2.isComment = exports2.isText = exports2.isCDATA = exports2.isTag = void 0;
    __exportStar(require_stringify(), exports2);
    __exportStar(require_traversal(), exports2);
    __exportStar(require_manipulation(), exports2);
    __exportStar(require_querying(), exports2);
    __exportStar(require_legacy2(), exports2);
    __exportStar(require_helpers(), exports2);
    __exportStar(require_feeds(), exports2);
    var domhandler_1 = require_lib3();
    Object.defineProperty(exports2, "isTag", { enumerable: true, get: function() {
      return domhandler_1.isTag;
    } });
    Object.defineProperty(exports2, "isCDATA", { enumerable: true, get: function() {
      return domhandler_1.isCDATA;
    } });
    Object.defineProperty(exports2, "isText", { enumerable: true, get: function() {
      return domhandler_1.isText;
    } });
    Object.defineProperty(exports2, "isComment", { enumerable: true, get: function() {
      return domhandler_1.isComment;
    } });
    Object.defineProperty(exports2, "isDocument", { enumerable: true, get: function() {
      return domhandler_1.isDocument;
    } });
    Object.defineProperty(exports2, "hasChildren", { enumerable: true, get: function() {
      return domhandler_1.hasChildren;
    } });
  }
});

// node_modules/htmlparser2/lib/FeedHandler.js
var require_FeedHandler = __commonJS({
  "node_modules/htmlparser2/lib/FeedHandler.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (Object.prototype.hasOwnProperty.call(b2, p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parseFeed = exports2.FeedHandler = exports2.getFeed = void 0;
    var domhandler_1 = __importDefault(require_lib3());
    var domutils_1 = require_lib6();
    Object.defineProperty(exports2, "getFeed", { enumerable: true, get: function() {
      return domutils_1.getFeed;
    } });
    var Parser_1 = require_Parser();
    var FeedHandler = function(_super) {
      __extends(FeedHandler2, _super);
      function FeedHandler2(callback, options) {
        var _this = this;
        if (typeof callback === "object") {
          callback = void 0;
          options = callback;
        }
        _this = _super.call(this, callback, options) || this;
        return _this;
      }
      FeedHandler2.prototype.onend = function() {
        var feed = (0, domutils_1.getFeed)(this.dom);
        if (feed) {
          this.feed = feed;
          this.handleCallback(null);
        } else {
          this.handleCallback(new Error("couldn't find root of feed"));
        }
      };
      return FeedHandler2;
    }(domhandler_1.default);
    exports2.FeedHandler = FeedHandler;
    function parseFeed(feed, options) {
      if (options === void 0) {
        options = { xmlMode: true };
      }
      var handler2 = new domhandler_1.default(null, options);
      new Parser_1.Parser(handler2, options).end(feed);
      return (0, domutils_1.getFeed)(handler2.dom);
    }
    exports2.parseFeed = parseFeed;
  }
});

// node_modules/htmlparser2/lib/index.js
var require_lib7 = __commonJS({
  "node_modules/htmlparser2/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.RssHandler = exports2.DefaultHandler = exports2.DomUtils = exports2.ElementType = exports2.Tokenizer = exports2.createDomStream = exports2.parseDOM = exports2.parseDocument = exports2.DomHandler = exports2.Parser = void 0;
    var Parser_1 = require_Parser();
    Object.defineProperty(exports2, "Parser", { enumerable: true, get: function() {
      return Parser_1.Parser;
    } });
    var domhandler_1 = require_lib3();
    Object.defineProperty(exports2, "DomHandler", { enumerable: true, get: function() {
      return domhandler_1.DomHandler;
    } });
    Object.defineProperty(exports2, "DefaultHandler", { enumerable: true, get: function() {
      return domhandler_1.DomHandler;
    } });
    function parseDocument(data, options) {
      var handler2 = new domhandler_1.DomHandler(void 0, options);
      new Parser_1.Parser(handler2, options).end(data);
      return handler2.root;
    }
    exports2.parseDocument = parseDocument;
    function parseDOM(data, options) {
      return parseDocument(data, options).children;
    }
    exports2.parseDOM = parseDOM;
    function createDomStream(cb, options, elementCb) {
      var handler2 = new domhandler_1.DomHandler(cb, options, elementCb);
      return new Parser_1.Parser(handler2, options);
    }
    exports2.createDomStream = createDomStream;
    var Tokenizer_1 = require_Tokenizer();
    Object.defineProperty(exports2, "Tokenizer", { enumerable: true, get: function() {
      return __importDefault(Tokenizer_1).default;
    } });
    var ElementType = __importStar(require_lib2());
    exports2.ElementType = ElementType;
    __exportStar(require_FeedHandler(), exports2);
    exports2.DomUtils = __importStar(require_lib6());
    var FeedHandler_1 = require_FeedHandler();
    Object.defineProperty(exports2, "RssHandler", { enumerable: true, get: function() {
      return FeedHandler_1.FeedHandler;
    } });
  }
});

// node_modules/linkedom/cjs/shared/constants.js
var require_constants = __commonJS({
  "node_modules/linkedom/cjs/shared/constants.js"(exports2) {
    "use strict";
    var NODE_END = -1;
    exports2.NODE_END = NODE_END;
    var ELEMENT_NODE = 1;
    exports2.ELEMENT_NODE = ELEMENT_NODE;
    var ATTRIBUTE_NODE = 2;
    exports2.ATTRIBUTE_NODE = ATTRIBUTE_NODE;
    var TEXT_NODE = 3;
    exports2.TEXT_NODE = TEXT_NODE;
    var COMMENT_NODE = 8;
    exports2.COMMENT_NODE = COMMENT_NODE;
    var DOCUMENT_NODE = 9;
    exports2.DOCUMENT_NODE = DOCUMENT_NODE;
    var DOCUMENT_TYPE_NODE = 10;
    exports2.DOCUMENT_TYPE_NODE = DOCUMENT_TYPE_NODE;
    var DOCUMENT_FRAGMENT_NODE = 11;
    exports2.DOCUMENT_FRAGMENT_NODE = DOCUMENT_FRAGMENT_NODE;
    var SHOW_ALL = -1;
    exports2.SHOW_ALL = SHOW_ALL;
    var SHOW_ELEMENT = 1;
    exports2.SHOW_ELEMENT = SHOW_ELEMENT;
    var SHOW_TEXT = 4;
    exports2.SHOW_TEXT = SHOW_TEXT;
    var SHOW_COMMENT = 128;
    exports2.SHOW_COMMENT = SHOW_COMMENT;
    var DOCUMENT_POSITION_DISCONNECTED = 1;
    exports2.DOCUMENT_POSITION_DISCONNECTED = DOCUMENT_POSITION_DISCONNECTED;
    var DOCUMENT_POSITION_PRECEDING = 2;
    exports2.DOCUMENT_POSITION_PRECEDING = DOCUMENT_POSITION_PRECEDING;
    var DOCUMENT_POSITION_FOLLOWING = 4;
    exports2.DOCUMENT_POSITION_FOLLOWING = DOCUMENT_POSITION_FOLLOWING;
    var DOCUMENT_POSITION_CONTAINS = 8;
    exports2.DOCUMENT_POSITION_CONTAINS = DOCUMENT_POSITION_CONTAINS;
    var DOCUMENT_POSITION_CONTAINED_BY = 16;
    exports2.DOCUMENT_POSITION_CONTAINED_BY = DOCUMENT_POSITION_CONTAINED_BY;
    var DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
    exports2.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
    var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
    exports2.SVG_NAMESPACE = SVG_NAMESPACE;
  }
});

// node_modules/linkedom/cjs/shared/object.js
var require_object = __commonJS({
  "node_modules/linkedom/cjs/shared/object.js"(exports2) {
    "use strict";
    var {
      assign,
      create,
      defineProperties,
      entries,
      getOwnPropertyDescriptors,
      keys,
      setPrototypeOf
    } = Object;
    exports2.assign = assign;
    exports2.create = create;
    exports2.defineProperties = defineProperties;
    exports2.entries = entries;
    exports2.getOwnPropertyDescriptors = getOwnPropertyDescriptors;
    exports2.keys = keys;
    exports2.setPrototypeOf = setPrototypeOf;
  }
});

// node_modules/linkedom/cjs/shared/utils.js
var require_utils = __commonJS({
  "node_modules/linkedom/cjs/shared/utils.js"(exports2) {
    "use strict";
    var { ELEMENT_NODE } = require_constants();
    var { END, MIME, NEXT, PREV } = require_symbols();
    var $String = String;
    exports2.String = $String;
    var getEnd = (node) => node.nodeType === ELEMENT_NODE ? node[END] : node;
    exports2.getEnd = getEnd;
    var ignoreCase = ({ ownerDocument }) => ownerDocument[MIME].ignoreCase;
    exports2.ignoreCase = ignoreCase;
    var knownAdjacent = (prev, next) => {
      prev[NEXT] = next;
      next[PREV] = prev;
    };
    exports2.knownAdjacent = knownAdjacent;
    var knownBoundaries = (prev, current, next) => {
      knownAdjacent(prev, current);
      knownAdjacent(getEnd(current), next);
    };
    exports2.knownBoundaries = knownBoundaries;
    var knownSegment = (prev, start, end, next) => {
      knownAdjacent(prev, start);
      knownAdjacent(getEnd(end), next);
    };
    exports2.knownSegment = knownSegment;
    var knownSiblings = (prev, current, next) => {
      knownAdjacent(prev, current);
      knownAdjacent(current, next);
    };
    exports2.knownSiblings = knownSiblings;
    var localCase = ({ localName, ownerDocument }) => {
      return ownerDocument[MIME].ignoreCase ? localName.toUpperCase() : localName;
    };
    exports2.localCase = localCase;
    var setAdjacent = (prev, next) => {
      if (prev)
        prev[NEXT] = next;
      if (next)
        next[PREV] = prev;
    };
    exports2.setAdjacent = setAdjacent;
  }
});

// node_modules/linkedom/cjs/interface/custom-element-registry.js
var require_custom_element_registry = __commonJS({
  "node_modules/linkedom/cjs/interface/custom-element-registry.js"(exports2) {
    "use strict";
    var { ELEMENT_NODE } = require_constants();
    var { END, NEXT } = require_symbols();
    var { entries, setPrototypeOf } = require_object();
    var reactive = false;
    var Classes = new WeakMap();
    exports2.Classes = Classes;
    var customElements = new WeakMap();
    exports2.customElements = customElements;
    var attributeChangedCallback = (element, attributeName, oldValue, newValue) => {
      if (reactive && customElements.has(element) && element.attributeChangedCallback && element.constructor.observedAttributes.includes(attributeName)) {
        element.attributeChangedCallback(attributeName, oldValue, newValue);
      }
    };
    exports2.attributeChangedCallback = attributeChangedCallback;
    var createTrigger = (method, isConnected) => (element) => {
      if (customElements.has(element)) {
        const info = customElements.get(element);
        if (info.connected !== isConnected && element.isConnected === isConnected) {
          info.connected = isConnected;
          if (method in element)
            element[method]();
        }
      }
    };
    var triggerConnected = createTrigger("connectedCallback", true);
    var connectedCallback = (element) => {
      if (reactive) {
        triggerConnected(element);
        let { [NEXT]: next, [END]: end } = element;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE)
            triggerConnected(next);
          next = next[NEXT];
        }
      }
    };
    exports2.connectedCallback = connectedCallback;
    var triggerDisconnected = createTrigger("disconnectedCallback", false);
    var disconnectedCallback = (element) => {
      if (reactive) {
        triggerDisconnected(element);
        let { [NEXT]: next, [END]: end } = element;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE)
            triggerDisconnected(next);
          next = next[NEXT];
        }
      }
    };
    exports2.disconnectedCallback = disconnectedCallback;
    var CustomElementRegistry = class {
      constructor(ownerDocument) {
        this.ownerDocument = ownerDocument;
        this.registry = new Map();
        this.waiting = new Map();
        this.active = false;
      }
      define(localName, Class, options = {}) {
        const { ownerDocument, registry, waiting } = this;
        if (registry.has(localName))
          throw new Error("unable to redefine " + localName);
        if (Classes.has(Class))
          throw new Error("unable to redefine the same class: " + Class);
        this.active = reactive = true;
        const { extends: extend } = options;
        Classes.set(Class, {
          ownerDocument,
          options: { is: extend ? localName : "" },
          localName: extend || localName
        });
        const check = extend ? (element) => {
          return element.localName === extend && element.getAttribute("is") === localName;
        } : (element) => element.localName === localName;
        registry.set(localName, { Class, check });
        if (waiting.has(localName)) {
          for (const resolve of waiting.get(localName))
            resolve(Class);
          waiting.delete(localName);
        }
        ownerDocument.querySelectorAll(extend ? `${extend}[is="${localName}"]` : localName).forEach(this.upgrade, this);
      }
      upgrade(element) {
        if (customElements.has(element))
          return;
        const { registry } = this;
        const ce = element.getAttribute("is") || element.localName;
        if (registry.has(ce)) {
          const { Class, check } = registry.get(ce);
          if (check(element)) {
            const { attributes, isConnected } = element;
            for (const attr of attributes)
              element.removeAttributeNode(attr);
            const values = entries(element);
            for (const [key] of values)
              delete element[key];
            setPrototypeOf(element, new Class(this.ownerDocument, ce));
            customElements.set(element, { connected: isConnected });
            for (const [key, value] of values)
              element[key] = value;
            for (const attr of attributes)
              element.setAttributeNode(attr);
            if (isConnected && element.connectedCallback)
              element.connectedCallback();
          }
        }
      }
      whenDefined(localName) {
        const { registry, waiting } = this;
        return new Promise((resolve) => {
          if (registry.has(localName))
            resolve(registry.get(localName).Class);
          else {
            if (!waiting.has(localName))
              waiting.set(localName, []);
            waiting.get(localName).push(resolve);
          }
        });
      }
      get(localName) {
        const info = this.registry.get(localName);
        return info && info.Class;
      }
    };
    exports2.CustomElementRegistry = CustomElementRegistry;
  }
});

// node_modules/linkedom/cjs/shared/parse-from-string.js
var require_parse_from_string = __commonJS({
  "node_modules/linkedom/cjs/shared/parse-from-string.js"(exports2) {
    "use strict";
    var HTMLParser2 = require_lib7();
    var { ELEMENT_NODE, SVG_NAMESPACE } = require_constants();
    var { CUSTOM_ELEMENTS, PREV, END, VALUE } = require_symbols();
    var { keys } = require_object();
    var { knownBoundaries, knownSiblings } = require_utils();
    var { attributeChangedCallback, connectedCallback } = require_custom_element_registry();
    var { Parser } = HTMLParser2;
    var notParsing = true;
    var append = (self, node, active) => {
      const end = self[END];
      node.parentNode = self;
      knownBoundaries(end[PREV], node, end);
      if (active && node.nodeType === ELEMENT_NODE)
        connectedCallback(node);
      return node;
    };
    var attribute = (element, end, attribute2, value, active) => {
      attribute2[VALUE] = value;
      attribute2.ownerElement = element;
      knownSiblings(end[PREV], attribute2, end);
      if (attribute2.name === "class")
        element.className = value;
      if (active)
        attributeChangedCallback(element, attribute2.name, null, value);
    };
    var isNotParsing = () => notParsing;
    exports2.isNotParsing = isNotParsing;
    var parseFromString = (document, isHTML, markupLanguage) => {
      const { active, registry } = document[CUSTOM_ELEMENTS];
      let node = document;
      let ownerSVGElement = null;
      notParsing = false;
      const content = new Parser({
        onprocessinginstruction(name, data) {
          if (name.toLowerCase() === "!doctype")
            document.doctype = data.slice(name.length).trim();
        },
        onopentag(name, attributes) {
          let create = true;
          if (isHTML) {
            if (ownerSVGElement) {
              node = append(node, document.createElementNS(SVG_NAMESPACE, name), active);
              node.ownerSVGElement = ownerSVGElement;
              create = false;
            } else if (name === "svg" || name === "SVG") {
              ownerSVGElement = document.createElementNS(SVG_NAMESPACE, name);
              node = append(node, ownerSVGElement, active);
              create = false;
            } else if (active) {
              const ce = name.includes("-") ? name : attributes.is || "";
              if (ce && registry.has(ce)) {
                const { Class } = registry.get(ce);
                node = append(node, new Class(), active);
                delete attributes.is;
                create = false;
              }
            }
          }
          if (create)
            node = append(node, document.createElement(name), false);
          let end = node[END];
          for (const name2 of keys(attributes))
            attribute(node, end, document.createAttribute(name2), attributes[name2], active);
        },
        oncomment(data) {
          append(node, document.createComment(data), active);
        },
        ontext(text) {
          append(node, document.createTextNode(text), active);
        },
        onclosetag() {
          if (isHTML && node === ownerSVGElement)
            ownerSVGElement = null;
          node = node.parentNode;
        }
      }, {
        lowerCaseAttributeNames: false,
        decodeEntities: true,
        xmlMode: !isHTML
      });
      content.write(markupLanguage);
      content.end();
      notParsing = true;
      return document;
    };
    exports2.parseFromString = parseFromString;
  }
});

// node_modules/linkedom/cjs/shared/register-html-class.js
var require_register_html_class = __commonJS({
  "node_modules/linkedom/cjs/shared/register-html-class.js"(exports2) {
    "use strict";
    var htmlClasses = new Map();
    exports2.htmlClasses = htmlClasses;
    var registerHTMLClass = (names, Class) => {
      for (const name of [].concat(names)) {
        htmlClasses.set(name, Class);
        htmlClasses.set(name.toUpperCase(), Class);
      }
    };
    exports2.registerHTMLClass = registerHTMLClass;
  }
});

// node_modules/linkedom/cjs/shared/jsdon.js
var require_jsdon = __commonJS({
  "node_modules/linkedom/cjs/shared/jsdon.js"(exports2) {
    "use strict";
    var {
      NODE_END,
      ATTRIBUTE_NODE,
      COMMENT_NODE,
      DOCUMENT_TYPE_NODE,
      ELEMENT_NODE,
      TEXT_NODE
    } = require_constants();
    var { END, NEXT, VALUE } = require_symbols();
    var { getEnd } = require_utils();
    var loopSegment = ({ [NEXT]: next, [END]: end }, json) => {
      while (next !== end) {
        switch (next.nodeType) {
          case ATTRIBUTE_NODE:
            attrAsJSON(next, json);
            break;
          case TEXT_NODE:
          case COMMENT_NODE:
            characterDataAsJSON(next, json);
            break;
          case ELEMENT_NODE:
            elementAsJSON(next, json);
            next = getEnd(next);
            break;
          case DOCUMENT_TYPE_NODE:
            documentTypeAsJSON(next, json);
            break;
        }
        next = next[NEXT];
      }
      const last = json.length - 1;
      const value = json[last];
      if (typeof value === "number" && value < 0)
        json[last] += NODE_END;
      else
        json.push(NODE_END);
    };
    var attrAsJSON = (attr, json) => {
      json.push(ATTRIBUTE_NODE, attr.name);
      const value = attr[VALUE].trim();
      if (value)
        json.push(value);
    };
    exports2.attrAsJSON = attrAsJSON;
    var characterDataAsJSON = (node, json) => {
      const value = node[VALUE];
      if (value.trim())
        json.push(node.nodeType, value);
    };
    exports2.characterDataAsJSON = characterDataAsJSON;
    var nonElementAsJSON = (node, json) => {
      json.push(node.nodeType);
      loopSegment(node, json);
    };
    exports2.nonElementAsJSON = nonElementAsJSON;
    var documentTypeAsJSON = ({ name, publicId, systemId }, json) => {
      json.push(DOCUMENT_TYPE_NODE, name);
      if (publicId)
        json.push(publicId);
      if (systemId)
        json.push(systemId);
    };
    exports2.documentTypeAsJSON = documentTypeAsJSON;
    var elementAsJSON = (element, json) => {
      json.push(ELEMENT_NODE, element.localName);
      loopSegment(element, json);
    };
    exports2.elementAsJSON = elementAsJSON;
  }
});

// node_modules/linkedom/cjs/interface/mutation-observer.js
var require_mutation_observer = __commonJS({
  "node_modules/linkedom/cjs/interface/mutation-observer.js"(exports2) {
    "use strict";
    var { MUTATION_OBSERVER } = require_symbols();
    var createRecord = (type, target, addedNodes, removedNodes, attributeName, oldValue) => ({ type, target, addedNodes, removedNodes, attributeName, oldValue });
    var queueAttribute = (observer, target, attributeName, attributeFilter, attributeOldValue, oldValue) => {
      if (!attributeFilter || attributeFilter.includes(attributeName)) {
        const { callback, records, scheduled } = observer;
        records.push(createRecord("attributes", target, [], [], attributeName, attributeOldValue ? oldValue : void 0));
        if (!scheduled) {
          observer.scheduled = true;
          Promise.resolve().then(() => {
            observer.scheduled = false;
            callback(records.splice(0), observer);
          });
        }
      }
    };
    var attributeChangedCallback = (element, attributeName, oldValue) => {
      const { ownerDocument } = element;
      const { active, observers } = ownerDocument[MUTATION_OBSERVER];
      if (active) {
        for (const observer of observers) {
          for (const [
            target,
            {
              childList,
              subtree,
              attributes,
              attributeFilter,
              attributeOldValue
            }
          ] of observer.nodes) {
            if (childList) {
              if (subtree && (target === ownerDocument || target.contains(element)) || !subtree && target.children.includes(element)) {
                queueAttribute(observer, element, attributeName, attributeFilter, attributeOldValue, oldValue);
                break;
              }
            } else if (attributes && target === element) {
              queueAttribute(observer, element, attributeName, attributeFilter, attributeOldValue, oldValue);
              break;
            }
          }
        }
      }
    };
    exports2.attributeChangedCallback = attributeChangedCallback;
    var moCallback = (element, parentNode) => {
      const { ownerDocument } = element;
      const { active, observers } = ownerDocument[MUTATION_OBSERVER];
      if (active) {
        for (const observer of observers) {
          for (const [target, { subtree, childList, characterData }] of observer.nodes) {
            if (childList) {
              if (parentNode && (target === parentNode || subtree && target.contains(parentNode)) || !parentNode && (subtree && (target === ownerDocument || target.contains(element)) || !subtree && target[characterData ? "childNodes" : "children"].includes(element))) {
                const { callback, records, scheduled } = observer;
                records.push(createRecord("childList", target, parentNode ? [] : [element], parentNode ? [element] : []));
                if (!scheduled) {
                  observer.scheduled = true;
                  Promise.resolve().then(() => {
                    observer.scheduled = false;
                    callback(records.splice(0), observer);
                  });
                }
                break;
              }
            }
          }
        }
      }
    };
    exports2.moCallback = moCallback;
    var MutationObserverClass = class {
      constructor(ownerDocument) {
        const observers = new Set();
        this.observers = observers;
        this.active = false;
        this.class = class MutationObserver {
          constructor(callback) {
            this.callback = callback;
            this.nodes = new Map();
            this.records = [];
            this.scheduled = false;
          }
          disconnect() {
            this.records.splice(0);
            this.nodes.clear();
            observers.delete(this);
            ownerDocument[MUTATION_OBSERVER].active = !!observers.size;
          }
          observe(target, options = {
            subtree: false,
            childList: false,
            attributes: false,
            attributeFilter: null,
            attributeOldValue: false,
            characterData: false
          }) {
            if ("attributeOldValue" in options || "attributeFilter" in options)
              options.attributes = true;
            options.childList = !!options.childList;
            options.subtree = !!options.subtree;
            this.nodes.set(target, options);
            observers.add(this);
            ownerDocument[MUTATION_OBSERVER].active = true;
          }
          takeRecords() {
            return this.records.splice(0);
          }
        };
      }
    };
    exports2.MutationObserverClass = MutationObserverClass;
  }
});

// node_modules/linkedom/cjs/shared/attributes.js
var require_attributes = __commonJS({
  "node_modules/linkedom/cjs/shared/attributes.js"(exports2) {
    "use strict";
    var { CLASS_LIST, NEXT, PREV, VALUE } = require_symbols();
    var { knownAdjacent, knownSiblings } = require_utils();
    var { attributeChangedCallback: ceAttributes } = require_custom_element_registry();
    var { attributeChangedCallback: moAttributes } = require_mutation_observer();
    var emptyAttributes = new Set([
      "allowfullscreen",
      "allowpaymentrequest",
      "async",
      "autofocus",
      "autoplay",
      "checked",
      "class",
      "contenteditable",
      "controls",
      "default",
      "defer",
      "disabled",
      "draggable",
      "formnovalidate",
      "hidden",
      "id",
      "ismap",
      "itemscope",
      "loop",
      "multiple",
      "muted",
      "nomodule",
      "novalidate",
      "open",
      "playsinline",
      "readonly",
      "required",
      "reversed",
      "selected",
      "style",
      "truespeed"
    ]);
    exports2.emptyAttributes = emptyAttributes;
    var setAttribute = (element, attribute) => {
      const { [VALUE]: value, name } = attribute;
      attribute.ownerElement = element;
      knownSiblings(element, attribute, element[NEXT]);
      if (name === "class")
        element.className = value;
      moAttributes(element, name, null);
      ceAttributes(element, name, null, value);
    };
    exports2.setAttribute = setAttribute;
    var removeAttribute = (element, attribute) => {
      const { [VALUE]: value, name } = attribute;
      knownAdjacent(attribute[PREV], attribute[NEXT]);
      attribute.ownerElement = attribute[PREV] = attribute[NEXT] = null;
      if (name === "class")
        element[CLASS_LIST] = null;
      moAttributes(element, name, value);
      ceAttributes(element, name, value, null);
    };
    exports2.removeAttribute = removeAttribute;
    var booleanAttribute = {
      get(element, name) {
        return element.hasAttribute(name);
      },
      set(element, name, value) {
        if (value)
          element.setAttribute(name, "");
        else
          element.removeAttribute(name);
      }
    };
    exports2.booleanAttribute = booleanAttribute;
    var numericAttribute = {
      get(element, name) {
        return parseFloat(element.getAttribute(name) || 0);
      },
      set(element, name, value) {
        element.setAttribute(name, value);
      }
    };
    exports2.numericAttribute = numericAttribute;
    var stringAttribute = {
      get(element, name) {
        return element.getAttribute(name) || "";
      },
      set(element, name, value) {
        element.setAttribute(name, value);
      }
    };
    exports2.stringAttribute = stringAttribute;
  }
});

// node_modules/@ungap/event-target/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/@ungap/event-target/cjs/index.js"(exports2, module2) {
    var self = {};
    try {
      self.EventTarget = new EventTarget().constructor;
    } catch (EventTarget2) {
      (function(Object2, wm) {
        var create = Object2.create;
        var defineProperty = Object2.defineProperty;
        var proto = EventTarget3.prototype;
        define(proto, "addEventListener", function(type, listener, options) {
          for (var secret = wm.get(this), listeners = secret[type] || (secret[type] = []), i = 0, length = listeners.length; i < length; i++) {
            if (listeners[i].listener === listener)
              return;
          }
          listeners.push({ target: this, listener, options });
        });
        define(proto, "dispatchEvent", function(event) {
          var secret = wm.get(this);
          var listeners = secret[event.type];
          if (listeners) {
            define(event, "target", this);
            define(event, "currentTarget", this);
            listeners.slice(0).some(dispatch, event);
            delete event.currentTarget;
            delete event.target;
          }
          return true;
        });
        define(proto, "removeEventListener", function(type, listener) {
          for (var secret = wm.get(this), listeners = secret[type] || (secret[type] = []), i = 0, length = listeners.length; i < length; i++) {
            if (listeners[i].listener === listener) {
              listeners.splice(i, 1);
              return;
            }
          }
        });
        self.EventTarget = EventTarget3;
        function EventTarget3() {
          "use strict";
          wm.set(this, create(null));
        }
        function define(target, name, value) {
          defineProperty(target, name, {
            configurable: true,
            writable: true,
            value
          });
        }
        function dispatch(info) {
          var options = info.options;
          if (options && options.once)
            info.target.removeEventListener(this.type, info.listener);
          if (typeof info.listener === "function")
            info.listener.call(info.target, this);
          else
            info.listener.handleEvent(this);
          return this._stopImmediatePropagationFlag;
        }
      })(Object, new WeakMap());
    }
    module2.exports = self.EventTarget;
  }
});

// node_modules/linkedom/cjs/interface/event-target.js
var require_event_target = __commonJS({
  "node_modules/linkedom/cjs/interface/event-target.js"(exports2) {
    "use strict";
    var EventTarget2 = ((m) => m.__esModule ? m.default : m)(require_cjs());
    var DOMEventTarget = class extends EventTarget2 {
      _getParent() {
        return null;
      }
      dispatchEvent(event) {
        const dispatched = super.dispatchEvent(event);
        if (dispatched && event.bubbles && !event.cancelBubble) {
          const parent = this._getParent();
          if (parent && parent.dispatchEvent) {
            const options = {
              bubbles: event.bubbles,
              cancelable: event.cancelable,
              composed: event.composed
            };
            return parent.dispatchEvent(new event.constructor(event.type, options));
          }
        }
        return dispatched;
      }
    };
    exports2.EventTarget = DOMEventTarget;
  }
});

// node_modules/linkedom/cjs/interface/node-list.js
var require_node_list = __commonJS({
  "node_modules/linkedom/cjs/interface/node-list.js"(exports2) {
    "use strict";
    var NodeList = class extends Array {
      item(i) {
        return i < this.length ? this[i] : null;
      }
    };
    exports2.NodeList = NodeList;
  }
});

// node_modules/linkedom/cjs/interface/node.js
var require_node2 = __commonJS({
  "node_modules/linkedom/cjs/interface/node.js"(exports2) {
    "use strict";
    var {
      ELEMENT_NODE,
      ATTRIBUTE_NODE,
      TEXT_NODE,
      COMMENT_NODE,
      DOCUMENT_NODE,
      DOCUMENT_FRAGMENT_NODE,
      DOCUMENT_TYPE_NODE,
      DOCUMENT_POSITION_DISCONNECTED,
      DOCUMENT_POSITION_PRECEDING,
      DOCUMENT_POSITION_FOLLOWING,
      DOCUMENT_POSITION_CONTAINS,
      DOCUMENT_POSITION_CONTAINED_BY,
      DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC
    } = require_constants();
    var { NEXT, PREV } = require_symbols();
    var { EventTarget: EventTarget2 } = require_event_target();
    var { NodeList } = require_node_list();
    var getParentNodeCount = ({ parentNode }) => {
      let count = 0;
      while (parentNode) {
        count++;
        parentNode = parentNode.parentNode;
      }
      return count;
    };
    var Node = class extends EventTarget2 {
      static get ELEMENT_NODE() {
        return ELEMENT_NODE;
      }
      static get ATTRIBUTE_NODE() {
        return ATTRIBUTE_NODE;
      }
      static get TEXT_NODE() {
        return TEXT_NODE;
      }
      static get COMMENT_NODE() {
        return COMMENT_NODE;
      }
      static get DOCUMENT_NODE() {
        return DOCUMENT_NODE;
      }
      static get DOCUMENT_FRAGMENT_NODE() {
        return DOCUMENT_FRAGMENT_NODE;
      }
      static get DOCUMENT_TYPE_NODE() {
        return DOCUMENT_TYPE_NODE;
      }
      constructor(ownerDocument, localName, nodeType) {
        super();
        this.ownerDocument = ownerDocument;
        this.localName = localName;
        this.nodeType = nodeType;
        this.parentNode = null;
        this[NEXT] = null;
        this[PREV] = null;
      }
      get ELEMENT_NODE() {
        return ELEMENT_NODE;
      }
      get ATTRIBUTE_NODE() {
        return ATTRIBUTE_NODE;
      }
      get TEXT_NODE() {
        return TEXT_NODE;
      }
      get COMMENT_NODE() {
        return COMMENT_NODE;
      }
      get DOCUMENT_NODE() {
        return DOCUMENT_NODE;
      }
      get DOCUMENT_FRAGMENT_NODE() {
        return DOCUMENT_FRAGMENT_NODE;
      }
      get DOCUMENT_TYPE_NODE() {
        return DOCUMENT_TYPE_NODE;
      }
      get isConnected() {
        return false;
      }
      get nodeName() {
        return this.localName;
      }
      get parentElement() {
        return null;
      }
      get previousSibling() {
        return null;
      }
      get previousElementSibling() {
        return null;
      }
      get nextSibling() {
        return null;
      }
      get nextElementSibling() {
        return null;
      }
      get childNodes() {
        return new NodeList();
      }
      get firstChild() {
        return null;
      }
      get lastChild() {
        return null;
      }
      get nodeValue() {
        return null;
      }
      set nodeValue(value) {
      }
      get textContent() {
        return null;
      }
      set textContent(value) {
      }
      normalize() {
      }
      cloneNode() {
        return null;
      }
      contains() {
        return false;
      }
      insertBefore() {
      }
      appendChild() {
      }
      replaceChild() {
      }
      removeChild() {
      }
      toString() {
        return "";
      }
      hasChildNodes() {
        return !!this.lastChild;
      }
      isSameNode(node) {
        return this === node;
      }
      compareDocumentPosition(target) {
        let result = 0;
        if (this !== target) {
          let self = getParentNodeCount(this);
          let other = getParentNodeCount(target);
          if (self < other) {
            result += DOCUMENT_POSITION_FOLLOWING;
            if (this.contains(target))
              result += DOCUMENT_POSITION_CONTAINED_BY;
          } else if (other < self) {
            result += DOCUMENT_POSITION_PRECEDING;
            if (target.contains(this))
              result += DOCUMENT_POSITION_CONTAINS;
          } else if (self && other) {
            const { childNodes } = this.parentNode;
            if (childNodes.indexOf(this) < childNodes.indexOf(target))
              result += DOCUMENT_POSITION_FOLLOWING;
            else
              result += DOCUMENT_POSITION_PRECEDING;
          }
          if (!self || !other) {
            result += DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
            result += DOCUMENT_POSITION_DISCONNECTED;
          }
        }
        return result;
      }
      isEqualNode(node) {
        if (this === node)
          return true;
        if (this.nodeType === node.nodeType) {
          switch (this.nodeType) {
            case DOCUMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE: {
              const aNodes = this.childNodes;
              const bNodes = node.childNodes;
              return aNodes.length === bNodes.length && aNodes.every((node2, i) => node2.isEqualNode(bNodes[i]));
            }
          }
          return this.toString() === node.toString();
        }
        return false;
      }
      _getParent() {
        return this.parentNode;
      }
      getRootNode() {
        let root = this;
        while (root.parentNode)
          root = root.parentNode;
        return root.nodeType === DOCUMENT_NODE ? root.documentElement : root;
      }
    };
    exports2.Node = Node;
  }
});

// node_modules/linkedom/cjs/interface/attr.js
var require_attr = __commonJS({
  "node_modules/linkedom/cjs/interface/attr.js"(exports2) {
    "use strict";
    var { ATTRIBUTE_NODE } = require_constants();
    var { CHANGED, VALUE } = require_symbols();
    var { String: String2 } = require_utils();
    var { attrAsJSON } = require_jsdon();
    var { emptyAttributes } = require_attributes();
    var { attributeChangedCallback: moAttributes } = require_mutation_observer();
    var { attributeChangedCallback: ceAttributes } = require_custom_element_registry();
    var { Node } = require_node2();
    var QUOTE = /"/g;
    var Attr = class extends Node {
      constructor(ownerDocument, name, value = "") {
        super(ownerDocument, "#attribute", ATTRIBUTE_NODE);
        this.ownerElement = null;
        this.name = String2(name);
        this[VALUE] = String2(value);
        this[CHANGED] = false;
      }
      get value() {
        return this[VALUE];
      }
      set value(newValue) {
        const { [VALUE]: oldValue, name, ownerElement } = this;
        this[VALUE] = String2(newValue);
        this[CHANGED] = true;
        if (ownerElement) {
          moAttributes(ownerElement, name, oldValue);
          ceAttributes(ownerElement, name, oldValue, this[VALUE]);
        }
      }
      cloneNode() {
        const { ownerDocument, name, [VALUE]: value } = this;
        return new Attr(ownerDocument, name, value);
      }
      toString() {
        const { name, [VALUE]: value } = this;
        return emptyAttributes.has(name) && !value ? name : `${name}="${value.replace(QUOTE, "&quot;")}"`;
      }
      toJSON() {
        const json = [];
        attrAsJSON(this, json);
        return json;
      }
    };
    exports2.Attr = Attr;
  }
});

// node_modules/linkedom/cjs/shared/node.js
var require_node3 = __commonJS({
  "node_modules/linkedom/cjs/shared/node.js"(exports2) {
    "use strict";
    var {
      COMMENT_NODE,
      DOCUMENT_NODE,
      DOCUMENT_FRAGMENT_NODE,
      TEXT_NODE,
      NODE_END
    } = require_constants();
    var { START, NEXT, PREV } = require_symbols();
    var { getEnd } = require_utils();
    var isConnected = ({ ownerDocument, parentNode }) => {
      while (parentNode) {
        if (parentNode === ownerDocument)
          return true;
        parentNode = parentNode.parentNode;
      }
      return false;
    };
    exports2.isConnected = isConnected;
    var parentElement = ({ parentNode }) => {
      if (parentNode) {
        switch (parentNode.nodeType) {
          case DOCUMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE:
            return null;
        }
      }
      return parentNode;
    };
    exports2.parentElement = parentElement;
    var previousSibling = ({ [PREV]: prev }) => {
      switch (prev ? prev.nodeType : 0) {
        case NODE_END:
          return prev[START];
        case TEXT_NODE:
        case COMMENT_NODE:
          return prev;
      }
      return null;
    };
    exports2.previousSibling = previousSibling;
    var nextSibling = (node) => {
      const next = getEnd(node)[NEXT];
      return next && (next.nodeType === NODE_END ? null : next);
    };
    exports2.nextSibling = nextSibling;
  }
});

// node_modules/linkedom/cjs/mixin/non-document-type-child-node.js
var require_non_document_type_child_node = __commonJS({
  "node_modules/linkedom/cjs/mixin/non-document-type-child-node.js"(exports2) {
    "use strict";
    var { ELEMENT_NODE } = require_constants();
    var { nextSibling, previousSibling } = require_node3();
    var nextElementSibling = (node) => {
      let next = nextSibling(node);
      while (next && next.nodeType !== ELEMENT_NODE)
        next = nextSibling(next);
      return next;
    };
    exports2.nextElementSibling = nextElementSibling;
    var previousElementSibling = (node) => {
      let prev = previousSibling(node);
      while (prev && prev.nodeType !== ELEMENT_NODE)
        prev = previousSibling(prev);
      return prev;
    };
    exports2.previousElementSibling = previousElementSibling;
  }
});

// node_modules/linkedom/cjs/mixin/child-node.js
var require_child_node = __commonJS({
  "node_modules/linkedom/cjs/mixin/child-node.js"(exports2) {
    "use strict";
    var { ELEMENT_NODE } = require_constants();
    var { NEXT, PREV } = require_symbols();
    var { getEnd, setAdjacent } = require_utils();
    var { moCallback } = require_mutation_observer();
    var { disconnectedCallback } = require_custom_element_registry();
    var asFragment = (ownerDocument, nodes) => {
      const fragment = ownerDocument.createDocumentFragment();
      fragment.append(...nodes);
      return fragment;
    };
    var before = (node, nodes) => {
      const { ownerDocument, parentNode } = node;
      if (parentNode)
        parentNode.insertBefore(asFragment(ownerDocument, nodes), node);
    };
    exports2.before = before;
    var after = (node, nodes) => {
      const { ownerDocument, parentNode } = node;
      if (parentNode)
        parentNode.insertBefore(asFragment(ownerDocument, nodes), getEnd(node)[NEXT]);
    };
    exports2.after = after;
    var replaceWith = (node, nodes) => {
      const { ownerDocument, parentNode } = node;
      if (parentNode) {
        parentNode.insertBefore(asFragment(ownerDocument, nodes), node);
        node.remove();
      }
    };
    exports2.replaceWith = replaceWith;
    var remove = (prev, current, next) => {
      const { parentNode, nodeType } = current;
      if (prev || next) {
        setAdjacent(prev, next);
        current[PREV] = null;
        getEnd(current)[NEXT] = null;
      }
      if (parentNode) {
        current.parentNode = null;
        moCallback(current, parentNode);
        if (nodeType === ELEMENT_NODE)
          disconnectedCallback(current);
      }
    };
    exports2.remove = remove;
  }
});

// node_modules/linkedom/cjs/interface/character-data.js
var require_character_data = __commonJS({
  "node_modules/linkedom/cjs/interface/character-data.js"(exports2) {
    "use strict";
    var { NEXT, PREV, VALUE } = require_symbols();
    var { String: String2 } = require_utils();
    var { isConnected, parentElement, previousSibling, nextSibling } = require_node3();
    var { characterDataAsJSON } = require_jsdon();
    var { previousElementSibling, nextElementSibling } = require_non_document_type_child_node();
    var { before, after, replaceWith, remove } = require_child_node();
    var { Node } = require_node2();
    var { moCallback } = require_mutation_observer();
    var CharacterData = class extends Node {
      constructor(ownerDocument, localName, nodeType, data) {
        super(ownerDocument, localName, nodeType);
        this[VALUE] = String2(data);
      }
      get isConnected() {
        return isConnected(this);
      }
      get parentElement() {
        return parentElement(this);
      }
      get previousSibling() {
        return previousSibling(this);
      }
      get nextSibling() {
        return nextSibling(this);
      }
      get previousElementSibling() {
        return previousElementSibling(this);
      }
      get nextElementSibling() {
        return nextElementSibling(this);
      }
      before(...nodes) {
        before(this, nodes);
      }
      after(...nodes) {
        after(this, nodes);
      }
      replaceWith(...nodes) {
        replaceWith(this, nodes);
      }
      remove() {
        remove(this[PREV], this, this[NEXT]);
      }
      get data() {
        return this[VALUE];
      }
      set data(value) {
        this[VALUE] = String2(value);
        moCallback(this, this.parentNode);
      }
      get nodeValue() {
        return this.data;
      }
      set nodeValue(value) {
        this.data = value;
      }
      get textContent() {
        return this.data;
      }
      set textContent(value) {
        this.data = value;
      }
      get length() {
        return this.data.length;
      }
      substringData(offset, count) {
        return this.data.substr(offset, count);
      }
      appendData(data) {
        this.data += data;
      }
      insertData(offset, data) {
        const { data: t } = this;
        this.data = t.slice(0, offset) + data + t.slice(offset);
      }
      deleteData(offset, count) {
        const { data: t } = this;
        this.data = t.slice(0, offset) + t.slice(offset + count);
      }
      replaceData(offset, count, data) {
        const { data: t } = this;
        this.data = t.slice(0, offset) + data + t.slice(offset + count);
      }
      toJSON() {
        const json = [];
        characterDataAsJSON(this, json);
        return json;
      }
    };
    exports2.CharacterData = CharacterData;
  }
});

// node_modules/linkedom/cjs/shared/text-escaper.js
var require_text_escaper = __commonJS({
  "node_modules/linkedom/cjs/shared/text-escaper.js"(exports2) {
    "use strict";
    var { replace } = "";
    var ca = /[<>&\xA0]/g;
    var esca = {
      "\xA0": "&nbsp;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    var pe = (m) => esca[m];
    var escape = (es) => replace.call(es, ca, pe);
    exports2.escape = escape;
  }
});

// node_modules/linkedom/cjs/interface/comment.js
var require_comment = __commonJS({
  "node_modules/linkedom/cjs/interface/comment.js"(exports2) {
    "use strict";
    var { COMMENT_NODE } = require_constants();
    var { VALUE } = require_symbols();
    var { escape } = require_text_escaper();
    var { CharacterData } = require_character_data();
    var Comment = class extends CharacterData {
      constructor(ownerDocument, data = "") {
        super(ownerDocument, "#comment", COMMENT_NODE, data);
      }
      cloneNode() {
        const { ownerDocument, [VALUE]: data } = this;
        return new Comment(ownerDocument, data);
      }
      toString() {
        return `<!--${escape(this[VALUE])}-->`;
      }
    };
    exports2.Comment = Comment;
  }
});

// node_modules/boolbase/index.js
var require_boolbase = __commonJS({
  "node_modules/boolbase/index.js"(exports2, module2) {
    module2.exports = {
      trueFunc: function trueFunc() {
        return true;
      },
      falseFunc: function falseFunc() {
        return false;
      }
    };
  }
});

// node_modules/css-what/lib/parse.js
var require_parse = __commonJS({
  "node_modules/css-what/lib/parse.js"(exports2) {
    "use strict";
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from, pack) {
      if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar)
              ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isTraversal = void 0;
    var reName = /^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
    var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
    var actionTypes = new Map([
      ["~", "element"],
      ["^", "start"],
      ["$", "end"],
      ["*", "any"],
      ["!", "not"],
      ["|", "hyphen"]
    ]);
    var Traversals = {
      ">": "child",
      "<": "parent",
      "~": "sibling",
      "+": "adjacent"
    };
    var attribSelectors = {
      "#": ["id", "equals"],
      ".": ["class", "element"]
    };
    var unpackPseudos = new Set([
      "has",
      "not",
      "matches",
      "is",
      "where",
      "host",
      "host-context"
    ]);
    var traversalNames = new Set(__spreadArray([
      "descendant"
    ], Object.keys(Traversals).map(function(k) {
      return Traversals[k];
    }), true));
    var caseInsensitiveAttributes = new Set([
      "accept",
      "accept-charset",
      "align",
      "alink",
      "axis",
      "bgcolor",
      "charset",
      "checked",
      "clear",
      "codetype",
      "color",
      "compact",
      "declare",
      "defer",
      "dir",
      "direction",
      "disabled",
      "enctype",
      "face",
      "frame",
      "hreflang",
      "http-equiv",
      "lang",
      "language",
      "link",
      "media",
      "method",
      "multiple",
      "nohref",
      "noresize",
      "noshade",
      "nowrap",
      "readonly",
      "rel",
      "rev",
      "rules",
      "scope",
      "scrolling",
      "selected",
      "shape",
      "target",
      "text",
      "type",
      "valign",
      "valuetype",
      "vlink"
    ]);
    function isTraversal(selector) {
      return traversalNames.has(selector.type);
    }
    exports2.isTraversal = isTraversal;
    var stripQuotesFromPseudos = new Set(["contains", "icontains"]);
    var quotes = new Set(['"', "'"]);
    function funescape(_, escaped, escapedWhitespace) {
      var high = parseInt(escaped, 16) - 65536;
      return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
    }
    function unescapeCSS(str) {
      return str.replace(reEscape, funescape);
    }
    function isWhitespace(c) {
      return c === " " || c === "\n" || c === "	" || c === "\f" || c === "\r";
    }
    function parse(selector, options) {
      var subselects = [];
      var endIndex = parseSelector(subselects, "" + selector, options, 0);
      if (endIndex < selector.length) {
        throw new Error("Unmatched selector: " + selector.slice(endIndex));
      }
      return subselects;
    }
    exports2.default = parse;
    function parseSelector(subselects, selector, options, selectorIndex) {
      var _a, _b;
      if (options === void 0) {
        options = {};
      }
      var tokens = [];
      var sawWS = false;
      function getName(offset) {
        var match = selector.slice(selectorIndex + offset).match(reName);
        if (!match) {
          throw new Error("Expected name, found " + selector.slice(selectorIndex));
        }
        var name = match[0];
        selectorIndex += offset + name.length;
        return unescapeCSS(name);
      }
      function stripWhitespace(offset) {
        while (isWhitespace(selector.charAt(selectorIndex + offset)))
          offset++;
        selectorIndex += offset;
      }
      function isEscaped(pos) {
        var slashCount = 0;
        while (selector.charAt(--pos) === "\\")
          slashCount++;
        return (slashCount & 1) === 1;
      }
      function ensureNotTraversal() {
        if (tokens.length > 0 && isTraversal(tokens[tokens.length - 1])) {
          throw new Error("Did not expect successive traversals.");
        }
      }
      stripWhitespace(0);
      while (selector !== "") {
        var firstChar = selector.charAt(selectorIndex);
        if (isWhitespace(firstChar)) {
          sawWS = true;
          stripWhitespace(1);
        } else if (firstChar in Traversals) {
          ensureNotTraversal();
          tokens.push({ type: Traversals[firstChar] });
          sawWS = false;
          stripWhitespace(1);
        } else if (firstChar === ",") {
          if (tokens.length === 0) {
            throw new Error("Empty sub-selector");
          }
          subselects.push(tokens);
          tokens = [];
          sawWS = false;
          stripWhitespace(1);
        } else if (selector.startsWith("/*", selectorIndex)) {
          var endIndex = selector.indexOf("*/", selectorIndex + 2);
          if (endIndex < 0) {
            throw new Error("Comment was not terminated");
          }
          selectorIndex = endIndex + 2;
        } else {
          if (sawWS) {
            ensureNotTraversal();
            tokens.push({ type: "descendant" });
            sawWS = false;
          }
          if (firstChar in attribSelectors) {
            var _c = attribSelectors[firstChar], name_1 = _c[0], action = _c[1];
            tokens.push({
              type: "attribute",
              name: name_1,
              action,
              value: getName(1),
              namespace: null,
              ignoreCase: options.xmlMode ? null : false
            });
          } else if (firstChar === "[") {
            stripWhitespace(1);
            var namespace = null;
            if (selector.charAt(selectorIndex) === "|") {
              namespace = "";
              selectorIndex += 1;
            }
            if (selector.startsWith("*|", selectorIndex)) {
              namespace = "*";
              selectorIndex += 2;
            }
            var name_2 = getName(0);
            if (namespace === null && selector.charAt(selectorIndex) === "|" && selector.charAt(selectorIndex + 1) !== "=") {
              namespace = name_2;
              name_2 = getName(1);
            }
            if ((_a = options.lowerCaseAttributeNames) !== null && _a !== void 0 ? _a : !options.xmlMode) {
              name_2 = name_2.toLowerCase();
            }
            stripWhitespace(0);
            var action = "exists";
            var possibleAction = actionTypes.get(selector.charAt(selectorIndex));
            if (possibleAction) {
              action = possibleAction;
              if (selector.charAt(selectorIndex + 1) !== "=") {
                throw new Error("Expected `=`");
              }
              stripWhitespace(2);
            } else if (selector.charAt(selectorIndex) === "=") {
              action = "equals";
              stripWhitespace(1);
            }
            var value = "";
            var ignoreCase = null;
            if (action !== "exists") {
              if (quotes.has(selector.charAt(selectorIndex))) {
                var quote = selector.charAt(selectorIndex);
                var sectionEnd = selectorIndex + 1;
                while (sectionEnd < selector.length && (selector.charAt(sectionEnd) !== quote || isEscaped(sectionEnd))) {
                  sectionEnd += 1;
                }
                if (selector.charAt(sectionEnd) !== quote) {
                  throw new Error("Attribute value didn't end");
                }
                value = unescapeCSS(selector.slice(selectorIndex + 1, sectionEnd));
                selectorIndex = sectionEnd + 1;
              } else {
                var valueStart = selectorIndex;
                while (selectorIndex < selector.length && (!isWhitespace(selector.charAt(selectorIndex)) && selector.charAt(selectorIndex) !== "]" || isEscaped(selectorIndex))) {
                  selectorIndex += 1;
                }
                value = unescapeCSS(selector.slice(valueStart, selectorIndex));
              }
              stripWhitespace(0);
              var forceIgnore = selector.charAt(selectorIndex);
              if (forceIgnore === "s" || forceIgnore === "S") {
                ignoreCase = false;
                stripWhitespace(1);
              } else if (forceIgnore === "i" || forceIgnore === "I") {
                ignoreCase = true;
                stripWhitespace(1);
              }
            }
            if (!options.xmlMode) {
              ignoreCase !== null && ignoreCase !== void 0 ? ignoreCase : ignoreCase = caseInsensitiveAttributes.has(name_2);
            }
            if (selector.charAt(selectorIndex) !== "]") {
              throw new Error("Attribute selector didn't terminate");
            }
            selectorIndex += 1;
            var attributeSelector = {
              type: "attribute",
              name: name_2,
              action,
              value,
              namespace,
              ignoreCase
            };
            tokens.push(attributeSelector);
          } else if (firstChar === ":") {
            if (selector.charAt(selectorIndex + 1) === ":") {
              tokens.push({
                type: "pseudo-element",
                name: getName(2).toLowerCase()
              });
              continue;
            }
            var name_3 = getName(1).toLowerCase();
            var data = null;
            if (selector.charAt(selectorIndex) === "(") {
              if (unpackPseudos.has(name_3)) {
                if (quotes.has(selector.charAt(selectorIndex + 1))) {
                  throw new Error("Pseudo-selector " + name_3 + " cannot be quoted");
                }
                data = [];
                selectorIndex = parseSelector(data, selector, options, selectorIndex + 1);
                if (selector.charAt(selectorIndex) !== ")") {
                  throw new Error("Missing closing parenthesis in :" + name_3 + " (" + selector + ")");
                }
                selectorIndex += 1;
              } else {
                selectorIndex += 1;
                var start = selectorIndex;
                var counter = 1;
                for (; counter > 0 && selectorIndex < selector.length; selectorIndex++) {
                  if (selector.charAt(selectorIndex) === "(" && !isEscaped(selectorIndex)) {
                    counter++;
                  } else if (selector.charAt(selectorIndex) === ")" && !isEscaped(selectorIndex)) {
                    counter--;
                  }
                }
                if (counter) {
                  throw new Error("Parenthesis not matched");
                }
                data = selector.slice(start, selectorIndex - 1);
                if (stripQuotesFromPseudos.has(name_3)) {
                  var quot = data.charAt(0);
                  if (quot === data.slice(-1) && quotes.has(quot)) {
                    data = data.slice(1, -1);
                  }
                  data = unescapeCSS(data);
                }
              }
            }
            tokens.push({ type: "pseudo", name: name_3, data });
          } else {
            var namespace = null;
            var name_4 = void 0;
            if (firstChar === "*") {
              selectorIndex += 1;
              name_4 = "*";
            } else if (reName.test(selector.slice(selectorIndex))) {
              if (selector.charAt(selectorIndex) === "|") {
                namespace = "";
                selectorIndex += 1;
              }
              name_4 = getName(0);
            } else {
              if (tokens.length && tokens[tokens.length - 1].type === "descendant") {
                tokens.pop();
              }
              addToken(subselects, tokens);
              return selectorIndex;
            }
            if (selector.charAt(selectorIndex) === "|") {
              namespace = name_4;
              if (selector.charAt(selectorIndex + 1) === "*") {
                name_4 = "*";
                selectorIndex += 2;
              } else {
                name_4 = getName(1);
              }
            }
            if (name_4 === "*") {
              tokens.push({ type: "universal", namespace });
            } else {
              if ((_b = options.lowerCaseTags) !== null && _b !== void 0 ? _b : !options.xmlMode) {
                name_4 = name_4.toLowerCase();
              }
              tokens.push({ type: "tag", name: name_4, namespace });
            }
          }
        }
      }
      addToken(subselects, tokens);
      return selectorIndex;
    }
    function addToken(subselects, tokens) {
      if (subselects.length > 0 && tokens.length === 0) {
        throw new Error("Empty sub-selector");
      }
      subselects.push(tokens);
    }
  }
});

// node_modules/css-what/lib/stringify.js
var require_stringify2 = __commonJS({
  "node_modules/css-what/lib/stringify.js"(exports2) {
    "use strict";
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from, pack) {
      if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar)
              ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var actionTypes = {
      equals: "",
      element: "~",
      start: "^",
      end: "$",
      any: "*",
      not: "!",
      hyphen: "|"
    };
    var charsToEscape = new Set(__spreadArray(__spreadArray([], Object.keys(actionTypes).map(function(typeKey) {
      return actionTypes[typeKey];
    }).filter(Boolean), true), [
      ":",
      "[",
      "]",
      " ",
      "\\",
      "(",
      ")",
      "'"
    ], false));
    function stringify(selector) {
      return selector.map(stringifySubselector).join(", ");
    }
    exports2.default = stringify;
    function stringifySubselector(token) {
      return token.map(stringifyToken).join("");
    }
    function stringifyToken(token) {
      switch (token.type) {
        case "child":
          return " > ";
        case "parent":
          return " < ";
        case "sibling":
          return " ~ ";
        case "adjacent":
          return " + ";
        case "descendant":
          return " ";
        case "universal":
          return getNamespace(token.namespace) + "*";
        case "tag":
          return getNamespacedName(token);
        case "pseudo-element":
          return "::" + escapeName(token.name);
        case "pseudo":
          if (token.data === null)
            return ":" + escapeName(token.name);
          if (typeof token.data === "string") {
            return ":" + escapeName(token.name) + "(" + escapeName(token.data) + ")";
          }
          return ":" + escapeName(token.name) + "(" + stringify(token.data) + ")";
        case "attribute": {
          if (token.name === "id" && token.action === "equals" && !token.ignoreCase && !token.namespace) {
            return "#" + escapeName(token.value);
          }
          if (token.name === "class" && token.action === "element" && !token.ignoreCase && !token.namespace) {
            return "." + escapeName(token.value);
          }
          var name_1 = getNamespacedName(token);
          if (token.action === "exists") {
            return "[" + name_1 + "]";
          }
          return "[" + name_1 + actionTypes[token.action] + "='" + escapeName(token.value) + "'" + (token.ignoreCase ? "i" : token.ignoreCase === false ? "s" : "") + "]";
        }
      }
    }
    function getNamespacedName(token) {
      return "" + getNamespace(token.namespace) + escapeName(token.name);
    }
    function getNamespace(namespace) {
      return namespace !== null ? (namespace === "*" ? "*" : escapeName(namespace)) + "|" : "";
    }
    function escapeName(str) {
      return str.split("").map(function(c) {
        return charsToEscape.has(c) ? "\\" + c : c;
      }).join("");
    }
  }
});

// node_modules/css-what/lib/index.js
var require_lib8 = __commonJS({
  "node_modules/css-what/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
          __createBinding(exports3, m, p);
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.stringify = exports2.parse = void 0;
    __exportStar(require_parse(), exports2);
    var parse_1 = require_parse();
    Object.defineProperty(exports2, "parse", { enumerable: true, get: function() {
      return __importDefault(parse_1).default;
    } });
    var stringify_1 = require_stringify2();
    Object.defineProperty(exports2, "stringify", { enumerable: true, get: function() {
      return __importDefault(stringify_1).default;
    } });
  }
});

// node_modules/css-select/lib/procedure.js
var require_procedure = __commonJS({
  "node_modules/css-select/lib/procedure.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isTraversal = exports2.procedure = void 0;
    exports2.procedure = {
      universal: 50,
      tag: 30,
      attribute: 1,
      pseudo: 0,
      "pseudo-element": 0,
      descendant: -1,
      child: -1,
      parent: -1,
      sibling: -1,
      adjacent: -1,
      _flexibleDescendant: -1
    };
    function isTraversal(t) {
      return exports2.procedure[t.type] < 0;
    }
    exports2.isTraversal = isTraversal;
  }
});

// node_modules/css-select/lib/sort.js
var require_sort = __commonJS({
  "node_modules/css-select/lib/sort.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var procedure_1 = require_procedure();
    var attributes = {
      exists: 10,
      equals: 8,
      not: 7,
      start: 6,
      end: 6,
      any: 5,
      hyphen: 4,
      element: 4
    };
    function sortByProcedure(arr) {
      var procs = arr.map(getProcedure);
      for (var i = 1; i < arr.length; i++) {
        var procNew = procs[i];
        if (procNew < 0)
          continue;
        for (var j = i - 1; j >= 0 && procNew < procs[j]; j--) {
          var token = arr[j + 1];
          arr[j + 1] = arr[j];
          arr[j] = token;
          procs[j + 1] = procs[j];
          procs[j] = procNew;
        }
      }
    }
    exports2.default = sortByProcedure;
    function getProcedure(token) {
      var proc = procedure_1.procedure[token.type];
      if (token.type === "attribute") {
        proc = attributes[token.action];
        if (proc === attributes.equals && token.name === "id") {
          proc = 9;
        }
        if (token.ignoreCase) {
          proc >>= 1;
        }
      } else if (token.type === "pseudo") {
        if (!token.data) {
          proc = 3;
        } else if (token.name === "has" || token.name === "contains") {
          proc = 0;
        } else if (Array.isArray(token.data)) {
          proc = 0;
          for (var i = 0; i < token.data.length; i++) {
            if (token.data[i].length !== 1)
              continue;
            var cur = getProcedure(token.data[i][0]);
            if (cur === 0) {
              proc = 0;
              break;
            }
            if (cur > proc)
              proc = cur;
          }
          if (token.data.length > 1 && proc > 0)
            proc -= 1;
        } else {
          proc = 1;
        }
      }
      return proc;
    }
  }
});

// node_modules/css-select/lib/attributes.js
var require_attributes2 = __commonJS({
  "node_modules/css-select/lib/attributes.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.attributeRules = void 0;
    var boolbase_1 = require_boolbase();
    var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
    function escapeRegex(value) {
      return value.replace(reChars, "\\$&");
    }
    exports2.attributeRules = {
      equals: function(next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        if (data.ignoreCase) {
          value = value.toLowerCase();
          return function(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.length === value.length && attr.toLowerCase() === value && next(elem);
          };
        }
        return function(elem) {
          return adapter.getAttributeValue(elem, name) === value && next(elem);
        };
      },
      hyphen: function(next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        var len = value.length;
        if (data.ignoreCase) {
          value = value.toLowerCase();
          return function hyphenIC(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len).toLowerCase() === value && next(elem);
          };
        }
        return function hyphen(elem) {
          var attr = adapter.getAttributeValue(elem, name);
          return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len) === value && next(elem);
        };
      },
      element: function(next, _a, _b) {
        var name = _a.name, value = _a.value, ignoreCase = _a.ignoreCase;
        var adapter = _b.adapter;
        if (/\s/.test(value)) {
          return boolbase_1.falseFunc;
        }
        var regex = new RegExp("(?:^|\\s)".concat(escapeRegex(value), "(?:$|\\s)"), ignoreCase ? "i" : "");
        return function element(elem) {
          var attr = adapter.getAttributeValue(elem, name);
          return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
        };
      },
      exists: function(next, _a, _b) {
        var name = _a.name;
        var adapter = _b.adapter;
        return function(elem) {
          return adapter.hasAttrib(elem, name) && next(elem);
        };
      },
      start: function(next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        var len = value.length;
        if (len === 0) {
          return boolbase_1.falseFunc;
        }
        if (data.ignoreCase) {
          value = value.toLowerCase();
          return function(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.length >= len && attr.substr(0, len).toLowerCase() === value && next(elem);
          };
        }
        return function(elem) {
          var _a2;
          return !!((_a2 = adapter.getAttributeValue(elem, name)) === null || _a2 === void 0 ? void 0 : _a2.startsWith(value)) && next(elem);
        };
      },
      end: function(next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        var len = -value.length;
        if (len === 0) {
          return boolbase_1.falseFunc;
        }
        if (data.ignoreCase) {
          value = value.toLowerCase();
          return function(elem) {
            var _a2;
            return ((_a2 = adapter.getAttributeValue(elem, name)) === null || _a2 === void 0 ? void 0 : _a2.substr(len).toLowerCase()) === value && next(elem);
          };
        }
        return function(elem) {
          var _a2;
          return !!((_a2 = adapter.getAttributeValue(elem, name)) === null || _a2 === void 0 ? void 0 : _a2.endsWith(value)) && next(elem);
        };
      },
      any: function(next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name, value = data.value;
        if (value === "") {
          return boolbase_1.falseFunc;
        }
        if (data.ignoreCase) {
          var regex_1 = new RegExp(escapeRegex(value), "i");
          return function anyIC(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.length >= value.length && regex_1.test(attr) && next(elem);
          };
        }
        return function(elem) {
          var _a2;
          return !!((_a2 = adapter.getAttributeValue(elem, name)) === null || _a2 === void 0 ? void 0 : _a2.includes(value)) && next(elem);
        };
      },
      not: function(next, data, _a) {
        var adapter = _a.adapter;
        var name = data.name;
        var value = data.value;
        if (value === "") {
          return function(elem) {
            return !!adapter.getAttributeValue(elem, name) && next(elem);
          };
        } else if (data.ignoreCase) {
          value = value.toLowerCase();
          return function(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return (attr == null || attr.length !== value.length || attr.toLowerCase() !== value) && next(elem);
          };
        }
        return function(elem) {
          return adapter.getAttributeValue(elem, name) !== value && next(elem);
        };
      }
    };
  }
});

// node_modules/nth-check/lib/parse.js
var require_parse2 = __commonJS({
  "node_modules/nth-check/lib/parse.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.parse = void 0;
    var whitespace = new Set([9, 10, 12, 13, 32]);
    var ZERO = "0".charCodeAt(0);
    var NINE = "9".charCodeAt(0);
    function parse(formula) {
      formula = formula.trim().toLowerCase();
      if (formula === "even") {
        return [2, 0];
      } else if (formula === "odd") {
        return [2, 1];
      }
      var idx = 0;
      var a = 0;
      var sign = readSign();
      var number = readNumber();
      if (idx < formula.length && formula.charAt(idx) === "n") {
        idx++;
        a = sign * (number !== null && number !== void 0 ? number : 1);
        skipWhitespace();
        if (idx < formula.length) {
          sign = readSign();
          skipWhitespace();
          number = readNumber();
        } else {
          sign = number = 0;
        }
      }
      if (number === null || idx < formula.length) {
        throw new Error("n-th rule couldn't be parsed ('" + formula + "')");
      }
      return [a, sign * number];
      function readSign() {
        if (formula.charAt(idx) === "-") {
          idx++;
          return -1;
        }
        if (formula.charAt(idx) === "+") {
          idx++;
        }
        return 1;
      }
      function readNumber() {
        var start = idx;
        var value = 0;
        while (idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE) {
          value = value * 10 + (formula.charCodeAt(idx) - ZERO);
          idx++;
        }
        return idx === start ? null : value;
      }
      function skipWhitespace() {
        while (idx < formula.length && whitespace.has(formula.charCodeAt(idx))) {
          idx++;
        }
      }
    }
    exports2.parse = parse;
  }
});

// node_modules/nth-check/lib/compile.js
var require_compile = __commonJS({
  "node_modules/nth-check/lib/compile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compile = void 0;
    var boolbase_1 = require_boolbase();
    function compile(parsed) {
      var a = parsed[0];
      var b = parsed[1] - 1;
      if (b < 0 && a <= 0)
        return boolbase_1.falseFunc;
      if (a === -1)
        return function(index) {
          return index <= b;
        };
      if (a === 0)
        return function(index) {
          return index === b;
        };
      if (a === 1)
        return b < 0 ? boolbase_1.trueFunc : function(index) {
          return index >= b;
        };
      var absA = Math.abs(a);
      var bMod = (b % absA + absA) % absA;
      return a > 1 ? function(index) {
        return index >= b && index % absA === bMod;
      } : function(index) {
        return index <= b && index % absA === bMod;
      };
    }
    exports2.compile = compile;
  }
});

// node_modules/nth-check/lib/index.js
var require_lib9 = __commonJS({
  "node_modules/nth-check/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compile = exports2.parse = void 0;
    var parse_1 = require_parse2();
    Object.defineProperty(exports2, "parse", { enumerable: true, get: function() {
      return parse_1.parse;
    } });
    var compile_1 = require_compile();
    Object.defineProperty(exports2, "compile", { enumerable: true, get: function() {
      return compile_1.compile;
    } });
    function nthCheck(formula) {
      return (0, compile_1.compile)((0, parse_1.parse)(formula));
    }
    exports2.default = nthCheck;
  }
});

// node_modules/css-select/lib/pseudo-selectors/filters.js
var require_filters = __commonJS({
  "node_modules/css-select/lib/pseudo-selectors/filters.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.filters = void 0;
    var nth_check_1 = __importDefault(require_lib9());
    var boolbase_1 = require_boolbase();
    function getChildFunc(next, adapter) {
      return function(elem) {
        var parent = adapter.getParent(elem);
        return parent != null && adapter.isTag(parent) && next(elem);
      };
    }
    exports2.filters = {
      contains: function(next, text, _a) {
        var adapter = _a.adapter;
        return function contains(elem) {
          return next(elem) && adapter.getText(elem).includes(text);
        };
      },
      icontains: function(next, text, _a) {
        var adapter = _a.adapter;
        var itext = text.toLowerCase();
        return function icontains(elem) {
          return next(elem) && adapter.getText(elem).toLowerCase().includes(itext);
        };
      },
      "nth-child": function(next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = (0, nth_check_1.default)(rule);
        if (func === boolbase_1.falseFunc)
          return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
          return getChildFunc(next, adapter);
        return function nthChild(elem) {
          var siblings = adapter.getSiblings(elem);
          var pos = 0;
          for (var i = 0; i < siblings.length; i++) {
            if (equals(elem, siblings[i]))
              break;
            if (adapter.isTag(siblings[i])) {
              pos++;
            }
          }
          return func(pos) && next(elem);
        };
      },
      "nth-last-child": function(next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = (0, nth_check_1.default)(rule);
        if (func === boolbase_1.falseFunc)
          return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
          return getChildFunc(next, adapter);
        return function nthLastChild(elem) {
          var siblings = adapter.getSiblings(elem);
          var pos = 0;
          for (var i = siblings.length - 1; i >= 0; i--) {
            if (equals(elem, siblings[i]))
              break;
            if (adapter.isTag(siblings[i])) {
              pos++;
            }
          }
          return func(pos) && next(elem);
        };
      },
      "nth-of-type": function(next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = (0, nth_check_1.default)(rule);
        if (func === boolbase_1.falseFunc)
          return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
          return getChildFunc(next, adapter);
        return function nthOfType(elem) {
          var siblings = adapter.getSiblings(elem);
          var pos = 0;
          for (var i = 0; i < siblings.length; i++) {
            var currentSibling = siblings[i];
            if (equals(elem, currentSibling))
              break;
            if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) {
              pos++;
            }
          }
          return func(pos) && next(elem);
        };
      },
      "nth-last-of-type": function(next, rule, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var func = (0, nth_check_1.default)(rule);
        if (func === boolbase_1.falseFunc)
          return boolbase_1.falseFunc;
        if (func === boolbase_1.trueFunc)
          return getChildFunc(next, adapter);
        return function nthLastOfType(elem) {
          var siblings = adapter.getSiblings(elem);
          var pos = 0;
          for (var i = siblings.length - 1; i >= 0; i--) {
            var currentSibling = siblings[i];
            if (equals(elem, currentSibling))
              break;
            if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) {
              pos++;
            }
          }
          return func(pos) && next(elem);
        };
      },
      root: function(next, _rule, _a) {
        var adapter = _a.adapter;
        return function(elem) {
          var parent = adapter.getParent(elem);
          return (parent == null || !adapter.isTag(parent)) && next(elem);
        };
      },
      scope: function(next, rule, options, context) {
        var equals = options.equals;
        if (!context || context.length === 0) {
          return exports2.filters.root(next, rule, options);
        }
        if (context.length === 1) {
          return function(elem) {
            return equals(context[0], elem) && next(elem);
          };
        }
        return function(elem) {
          return context.includes(elem) && next(elem);
        };
      },
      hover: dynamicStatePseudo("isHovered"),
      visited: dynamicStatePseudo("isVisited"),
      active: dynamicStatePseudo("isActive")
    };
    function dynamicStatePseudo(name) {
      return function dynamicPseudo(next, _rule, _a) {
        var adapter = _a.adapter;
        var func = adapter[name];
        if (typeof func !== "function") {
          return boolbase_1.falseFunc;
        }
        return function active(elem) {
          return func(elem) && next(elem);
        };
      };
    }
  }
});

// node_modules/css-select/lib/pseudo-selectors/pseudos.js
var require_pseudos = __commonJS({
  "node_modules/css-select/lib/pseudo-selectors/pseudos.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.verifyPseudoArgs = exports2.pseudos = void 0;
    exports2.pseudos = {
      empty: function(elem, _a) {
        var adapter = _a.adapter;
        return !adapter.getChildren(elem).some(function(elem2) {
          return adapter.isTag(elem2) || adapter.getText(elem2) !== "";
        });
      },
      "first-child": function(elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var firstChild = adapter.getSiblings(elem).find(function(elem2) {
          return adapter.isTag(elem2);
        });
        return firstChild != null && equals(elem, firstChild);
      },
      "last-child": function(elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var siblings = adapter.getSiblings(elem);
        for (var i = siblings.length - 1; i >= 0; i--) {
          if (equals(elem, siblings[i]))
            return true;
          if (adapter.isTag(siblings[i]))
            break;
        }
        return false;
      },
      "first-of-type": function(elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var siblings = adapter.getSiblings(elem);
        var elemName = adapter.getName(elem);
        for (var i = 0; i < siblings.length; i++) {
          var currentSibling = siblings[i];
          if (equals(elem, currentSibling))
            return true;
          if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) {
            break;
          }
        }
        return false;
      },
      "last-of-type": function(elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var siblings = adapter.getSiblings(elem);
        var elemName = adapter.getName(elem);
        for (var i = siblings.length - 1; i >= 0; i--) {
          var currentSibling = siblings[i];
          if (equals(elem, currentSibling))
            return true;
          if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) {
            break;
          }
        }
        return false;
      },
      "only-of-type": function(elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        var elemName = adapter.getName(elem);
        return adapter.getSiblings(elem).every(function(sibling) {
          return equals(elem, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elemName;
        });
      },
      "only-child": function(elem, _a) {
        var adapter = _a.adapter, equals = _a.equals;
        return adapter.getSiblings(elem).every(function(sibling) {
          return equals(elem, sibling) || !adapter.isTag(sibling);
        });
      }
    };
    function verifyPseudoArgs(func, name, subselect) {
      if (subselect === null) {
        if (func.length > 2) {
          throw new Error("pseudo-selector :".concat(name, " requires an argument"));
        }
      } else if (func.length === 2) {
        throw new Error("pseudo-selector :".concat(name, " doesn't have any arguments"));
      }
    }
    exports2.verifyPseudoArgs = verifyPseudoArgs;
  }
});

// node_modules/css-select/lib/pseudo-selectors/aliases.js
var require_aliases = __commonJS({
  "node_modules/css-select/lib/pseudo-selectors/aliases.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.aliases = void 0;
    exports2.aliases = {
      "any-link": ":is(a, area, link)[href]",
      link: ":any-link:not(:visited)",
      disabled: ":is(\n        :is(button, input, select, textarea, optgroup, option)[disabled],\n        optgroup[disabled] > option,\n        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)\n    )",
      enabled: ":not(:disabled)",
      checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",
      required: ":is(input, select, textarea)[required]",
      optional: ":is(input, select, textarea):not([required])",
      selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
      checkbox: "[type=checkbox]",
      file: "[type=file]",
      password: "[type=password]",
      radio: "[type=radio]",
      reset: "[type=reset]",
      image: "[type=image]",
      submit: "[type=submit]",
      parent: ":not(:empty)",
      header: ":is(h1, h2, h3, h4, h5, h6)",
      button: ":is(button, input[type=button])",
      input: ":is(input, textarea, select, button)",
      text: "input:is(:not([type!='']), [type=text])"
    };
  }
});

// node_modules/css-select/lib/pseudo-selectors/subselects.js
var require_subselects = __commonJS({
  "node_modules/css-select/lib/pseudo-selectors/subselects.js"(exports2) {
    "use strict";
    var __spreadArray = exports2 && exports2.__spreadArray || function(to, from, pack) {
      if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar)
              ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.subselects = exports2.getNextSiblings = exports2.ensureIsTag = exports2.PLACEHOLDER_ELEMENT = void 0;
    var boolbase_1 = require_boolbase();
    var procedure_1 = require_procedure();
    exports2.PLACEHOLDER_ELEMENT = {};
    function ensureIsTag(next, adapter) {
      if (next === boolbase_1.falseFunc)
        return boolbase_1.falseFunc;
      return function(elem) {
        return adapter.isTag(elem) && next(elem);
      };
    }
    exports2.ensureIsTag = ensureIsTag;
    function getNextSiblings(elem, adapter) {
      var siblings = adapter.getSiblings(elem);
      if (siblings.length <= 1)
        return [];
      var elemIndex = siblings.indexOf(elem);
      if (elemIndex < 0 || elemIndex === siblings.length - 1)
        return [];
      return siblings.slice(elemIndex + 1).filter(adapter.isTag);
    }
    exports2.getNextSiblings = getNextSiblings;
    var is = function(next, token, options, context, compileToken) {
      var opts = {
        xmlMode: !!options.xmlMode,
        adapter: options.adapter,
        equals: options.equals
      };
      var func = compileToken(token, opts, context);
      return function(elem) {
        return func(elem) && next(elem);
      };
    };
    exports2.subselects = {
      is,
      matches: is,
      where: is,
      not: function(next, token, options, context, compileToken) {
        var opts = {
          xmlMode: !!options.xmlMode,
          adapter: options.adapter,
          equals: options.equals
        };
        var func = compileToken(token, opts, context);
        if (func === boolbase_1.falseFunc)
          return next;
        if (func === boolbase_1.trueFunc)
          return boolbase_1.falseFunc;
        return function not(elem) {
          return !func(elem) && next(elem);
        };
      },
      has: function(next, subselect, options, _context, compileToken) {
        var adapter = options.adapter;
        var opts = {
          xmlMode: !!options.xmlMode,
          adapter,
          equals: options.equals
        };
        var context = subselect.some(function(s) {
          return s.some(procedure_1.isTraversal);
        }) ? [exports2.PLACEHOLDER_ELEMENT] : void 0;
        var compiled = compileToken(subselect, opts, context);
        if (compiled === boolbase_1.falseFunc)
          return boolbase_1.falseFunc;
        if (compiled === boolbase_1.trueFunc) {
          return function(elem) {
            return adapter.getChildren(elem).some(adapter.isTag) && next(elem);
          };
        }
        var hasElement = ensureIsTag(compiled, adapter);
        var _a = compiled.shouldTestNextSiblings, shouldTestNextSiblings = _a === void 0 ? false : _a;
        if (context) {
          return function(elem) {
            context[0] = elem;
            var childs = adapter.getChildren(elem);
            var nextElements = shouldTestNextSiblings ? __spreadArray(__spreadArray([], childs, true), getNextSiblings(elem, adapter), true) : childs;
            return next(elem) && adapter.existsOne(hasElement, nextElements);
          };
        }
        return function(elem) {
          return next(elem) && adapter.existsOne(hasElement, adapter.getChildren(elem));
        };
      }
    };
  }
});

// node_modules/css-select/lib/pseudo-selectors/index.js
var require_pseudo_selectors = __commonJS({
  "node_modules/css-select/lib/pseudo-selectors/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compilePseudoSelector = exports2.aliases = exports2.pseudos = exports2.filters = void 0;
    var boolbase_1 = require_boolbase();
    var css_what_1 = require_lib8();
    var filters_1 = require_filters();
    Object.defineProperty(exports2, "filters", { enumerable: true, get: function() {
      return filters_1.filters;
    } });
    var pseudos_1 = require_pseudos();
    Object.defineProperty(exports2, "pseudos", { enumerable: true, get: function() {
      return pseudos_1.pseudos;
    } });
    var aliases_1 = require_aliases();
    Object.defineProperty(exports2, "aliases", { enumerable: true, get: function() {
      return aliases_1.aliases;
    } });
    var subselects_1 = require_subselects();
    function compilePseudoSelector(next, selector, options, context, compileToken) {
      var name = selector.name, data = selector.data;
      if (Array.isArray(data)) {
        return subselects_1.subselects[name](next, data, options, context, compileToken);
      }
      if (name in aliases_1.aliases) {
        if (data != null) {
          throw new Error("Pseudo ".concat(name, " doesn't have any arguments"));
        }
        var alias = (0, css_what_1.parse)(aliases_1.aliases[name], options);
        return subselects_1.subselects.is(next, alias, options, context, compileToken);
      }
      if (name in filters_1.filters) {
        return filters_1.filters[name](next, data, options, context);
      }
      if (name in pseudos_1.pseudos) {
        var pseudo_1 = pseudos_1.pseudos[name];
        (0, pseudos_1.verifyPseudoArgs)(pseudo_1, name, data);
        return pseudo_1 === boolbase_1.falseFunc ? boolbase_1.falseFunc : next === boolbase_1.trueFunc ? function(elem) {
          return pseudo_1(elem, options, data);
        } : function(elem) {
          return pseudo_1(elem, options, data) && next(elem);
        };
      }
      throw new Error("unmatched pseudo-class :".concat(name));
    }
    exports2.compilePseudoSelector = compilePseudoSelector;
  }
});

// node_modules/css-select/lib/general.js
var require_general = __commonJS({
  "node_modules/css-select/lib/general.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compileGeneralSelector = void 0;
    var attributes_1 = require_attributes2();
    var pseudo_selectors_1 = require_pseudo_selectors();
    function compileGeneralSelector(next, selector, options, context, compileToken) {
      var adapter = options.adapter, equals = options.equals;
      switch (selector.type) {
        case "pseudo-element":
          throw new Error("Pseudo-elements are not supported by css-select");
        case "attribute":
          return attributes_1.attributeRules[selector.action](next, selector, options);
        case "pseudo":
          return (0, pseudo_selectors_1.compilePseudoSelector)(next, selector, options, context, compileToken);
        case "tag":
          return function tag(elem) {
            return adapter.getName(elem) === selector.name && next(elem);
          };
        case "descendant":
          if (options.cacheResults === false || typeof WeakSet === "undefined") {
            return function descendant(elem) {
              var current = elem;
              while (current = adapter.getParent(current)) {
                if (adapter.isTag(current) && next(current)) {
                  return true;
                }
              }
              return false;
            };
          }
          var isFalseCache_1 = new WeakSet();
          return function cachedDescendant(elem) {
            var current = elem;
            while (current = adapter.getParent(current)) {
              if (!isFalseCache_1.has(current)) {
                if (adapter.isTag(current) && next(current)) {
                  return true;
                }
                isFalseCache_1.add(current);
              }
            }
            return false;
          };
        case "_flexibleDescendant":
          return function flexibleDescendant(elem) {
            var current = elem;
            do {
              if (adapter.isTag(current) && next(current))
                return true;
            } while (current = adapter.getParent(current));
            return false;
          };
        case "parent":
          return function parent(elem) {
            return adapter.getChildren(elem).some(function(elem2) {
              return adapter.isTag(elem2) && next(elem2);
            });
          };
        case "child":
          return function child(elem) {
            var parent = adapter.getParent(elem);
            return parent != null && adapter.isTag(parent) && next(parent);
          };
        case "sibling":
          return function sibling(elem) {
            var siblings = adapter.getSiblings(elem);
            for (var i = 0; i < siblings.length; i++) {
              var currentSibling = siblings[i];
              if (equals(elem, currentSibling))
                break;
              if (adapter.isTag(currentSibling) && next(currentSibling)) {
                return true;
              }
            }
            return false;
          };
        case "adjacent":
          return function adjacent(elem) {
            var siblings = adapter.getSiblings(elem);
            var lastElement;
            for (var i = 0; i < siblings.length; i++) {
              var currentSibling = siblings[i];
              if (equals(elem, currentSibling))
                break;
              if (adapter.isTag(currentSibling)) {
                lastElement = currentSibling;
              }
            }
            return !!lastElement && next(lastElement);
          };
        case "universal":
          return next;
      }
    }
    exports2.compileGeneralSelector = compileGeneralSelector;
  }
});

// node_modules/css-select/lib/compile.js
var require_compile2 = __commonJS({
  "node_modules/css-select/lib/compile.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.compileToken = exports2.compileUnsafe = exports2.compile = void 0;
    var css_what_1 = require_lib8();
    var boolbase_1 = require_boolbase();
    var sort_1 = __importDefault(require_sort());
    var procedure_1 = require_procedure();
    var general_1 = require_general();
    var subselects_1 = require_subselects();
    function compile(selector, options, context) {
      var next = compileUnsafe(selector, options, context);
      return (0, subselects_1.ensureIsTag)(next, options.adapter);
    }
    exports2.compile = compile;
    function compileUnsafe(selector, options, context) {
      var token = typeof selector === "string" ? (0, css_what_1.parse)(selector, options) : selector;
      return compileToken(token, options, context);
    }
    exports2.compileUnsafe = compileUnsafe;
    function includesScopePseudo(t) {
      return t.type === "pseudo" && (t.name === "scope" || Array.isArray(t.data) && t.data.some(function(data) {
        return data.some(includesScopePseudo);
      }));
    }
    var DESCENDANT_TOKEN = { type: "descendant" };
    var FLEXIBLE_DESCENDANT_TOKEN = {
      type: "_flexibleDescendant"
    };
    var SCOPE_TOKEN = { type: "pseudo", name: "scope", data: null };
    function absolutize(token, _a, context) {
      var adapter = _a.adapter;
      var hasContext = !!(context === null || context === void 0 ? void 0 : context.every(function(e) {
        var parent = adapter.isTag(e) && adapter.getParent(e);
        return e === subselects_1.PLACEHOLDER_ELEMENT || parent && adapter.isTag(parent);
      }));
      for (var _i = 0, token_1 = token; _i < token_1.length; _i++) {
        var t = token_1[_i];
        if (t.length > 0 && (0, procedure_1.isTraversal)(t[0]) && t[0].type !== "descendant") {
        } else if (hasContext && !t.some(includesScopePseudo)) {
          t.unshift(DESCENDANT_TOKEN);
        } else {
          continue;
        }
        t.unshift(SCOPE_TOKEN);
      }
    }
    function compileToken(token, options, context) {
      var _a;
      token = token.filter(function(t) {
        return t.length > 0;
      });
      token.forEach(sort_1.default);
      context = (_a = options.context) !== null && _a !== void 0 ? _a : context;
      var isArrayContext = Array.isArray(context);
      var finalContext = context && (Array.isArray(context) ? context : [context]);
      absolutize(token, options, finalContext);
      var shouldTestNextSiblings = false;
      var query = token.map(function(rules) {
        if (rules.length >= 2) {
          var first = rules[0], second = rules[1];
          if (first.type !== "pseudo" || first.name !== "scope") {
          } else if (isArrayContext && second.type === "descendant") {
            rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
          } else if (second.type === "adjacent" || second.type === "sibling") {
            shouldTestNextSiblings = true;
          }
        }
        return compileRules(rules, options, finalContext);
      }).reduce(reduceRules, boolbase_1.falseFunc);
      query.shouldTestNextSiblings = shouldTestNextSiblings;
      return query;
    }
    exports2.compileToken = compileToken;
    function compileRules(rules, options, context) {
      var _a;
      return rules.reduce(function(previous, rule) {
        return previous === boolbase_1.falseFunc ? boolbase_1.falseFunc : (0, general_1.compileGeneralSelector)(previous, rule, options, context, compileToken);
      }, (_a = options.rootFunc) !== null && _a !== void 0 ? _a : boolbase_1.trueFunc);
    }
    function reduceRules(a, b) {
      if (b === boolbase_1.falseFunc || a === boolbase_1.trueFunc) {
        return a;
      }
      if (a === boolbase_1.falseFunc || b === boolbase_1.trueFunc) {
        return b;
      }
      return function combine(elem) {
        return a(elem) || b(elem);
      };
    }
  }
});

// node_modules/css-select/lib/index.js
var require_lib10 = __commonJS({
  "node_modules/css-select/lib/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.aliases = exports2.pseudos = exports2.filters = exports2.is = exports2.selectOne = exports2.selectAll = exports2.prepareContext = exports2._compileToken = exports2._compileUnsafe = exports2.compile = void 0;
    var DomUtils = __importStar(require_lib6());
    var boolbase_1 = require_boolbase();
    var compile_1 = require_compile2();
    var subselects_1 = require_subselects();
    var defaultEquals = function(a, b) {
      return a === b;
    };
    var defaultOptions = {
      adapter: DomUtils,
      equals: defaultEquals
    };
    function convertOptionFormats(options) {
      var _a, _b, _c, _d;
      var opts = options !== null && options !== void 0 ? options : defaultOptions;
      (_a = opts.adapter) !== null && _a !== void 0 ? _a : opts.adapter = DomUtils;
      (_b = opts.equals) !== null && _b !== void 0 ? _b : opts.equals = (_d = (_c = opts.adapter) === null || _c === void 0 ? void 0 : _c.equals) !== null && _d !== void 0 ? _d : defaultEquals;
      return opts;
    }
    function wrapCompile(func) {
      return function addAdapter(selector, options, context) {
        var opts = convertOptionFormats(options);
        return func(selector, opts, context);
      };
    }
    exports2.compile = wrapCompile(compile_1.compile);
    exports2._compileUnsafe = wrapCompile(compile_1.compileUnsafe);
    exports2._compileToken = wrapCompile(compile_1.compileToken);
    function getSelectorFunc(searchFunc) {
      return function select(query, elements, options) {
        var opts = convertOptionFormats(options);
        if (typeof query !== "function") {
          query = (0, compile_1.compileUnsafe)(query, opts, elements);
        }
        var filteredElements = prepareContext(elements, opts.adapter, query.shouldTestNextSiblings);
        return searchFunc(query, filteredElements, opts);
      };
    }
    function prepareContext(elems, adapter, shouldTestNextSiblings) {
      if (shouldTestNextSiblings === void 0) {
        shouldTestNextSiblings = false;
      }
      if (shouldTestNextSiblings) {
        elems = appendNextSiblings(elems, adapter);
      }
      return Array.isArray(elems) ? adapter.removeSubsets(elems) : adapter.getChildren(elems);
    }
    exports2.prepareContext = prepareContext;
    function appendNextSiblings(elem, adapter) {
      var elems = Array.isArray(elem) ? elem.slice(0) : [elem];
      for (var i = 0; i < elems.length; i++) {
        var nextSiblings = (0, subselects_1.getNextSiblings)(elems[i], adapter);
        elems.push.apply(elems, nextSiblings);
      }
      return elems;
    }
    exports2.selectAll = getSelectorFunc(function(query, elems, options) {
      return query === boolbase_1.falseFunc || !elems || elems.length === 0 ? [] : options.adapter.findAll(query, elems);
    });
    exports2.selectOne = getSelectorFunc(function(query, elems, options) {
      return query === boolbase_1.falseFunc || !elems || elems.length === 0 ? null : options.adapter.findOne(query, elems);
    });
    function is(elem, query, options) {
      var opts = convertOptionFormats(options);
      return (typeof query === "function" ? query : (0, compile_1.compile)(query, opts))(elem);
    }
    exports2.is = is;
    exports2.default = exports2.selectAll;
    var pseudo_selectors_1 = require_pseudo_selectors();
    Object.defineProperty(exports2, "filters", { enumerable: true, get: function() {
      return pseudo_selectors_1.filters;
    } });
    Object.defineProperty(exports2, "pseudos", { enumerable: true, get: function() {
      return pseudo_selectors_1.pseudos;
    } });
    Object.defineProperty(exports2, "aliases", { enumerable: true, get: function() {
      return pseudo_selectors_1.aliases;
    } });
  }
});

// node_modules/linkedom/cjs/shared/matches.js
var require_matches = __commonJS({
  "node_modules/linkedom/cjs/shared/matches.js"(exports2) {
    "use strict";
    var CSSselect = require_lib10();
    var { ELEMENT_NODE, TEXT_NODE } = require_constants();
    var { ignoreCase } = require_utils();
    var { isArray } = Array;
    var isTag = ({ nodeType }) => nodeType === ELEMENT_NODE;
    var existsOne = (test, elements) => elements.some((element) => isTag(element) && (test(element) || existsOne(test, getChildren(element))));
    var getAttributeValue = (element, name) => element.getAttribute(name);
    var getChildren = ({ childNodes }) => childNodes;
    var getName = (element) => {
      const { localName } = element;
      return ignoreCase(element) ? localName.toLowerCase() : localName;
    };
    var getParent = ({ parentNode }) => parentNode;
    var getSiblings = (element) => {
      const { parentNode } = element;
      return parentNode ? getChildren(parentNode) : element;
    };
    var getText = (node) => {
      if (isArray(node))
        return node.map(getText).join("");
      if (isTag(node))
        return getText(getChildren(node));
      if (node.nodeType === TEXT_NODE)
        return node.data;
      return "";
    };
    var hasAttrib = (element, name) => element.hasAttribute(name);
    var removeSubsets = (nodes) => {
      let { length } = nodes;
      while (length--) {
        const node = nodes[length];
        if (length && -1 < nodes.lastIndexOf(node, length - 1)) {
          nodes.splice(length, 1);
          continue;
        }
        for (let { parentNode } = node; parentNode; parentNode = parentNode.parentNode) {
          if (nodes.includes(parentNode)) {
            nodes.splice(length, 1);
            break;
          }
        }
      }
      return nodes;
    };
    var findAll = (test, nodes) => {
      const matches2 = [];
      for (const node of nodes) {
        if (isTag(node)) {
          if (test(node))
            matches2.push(node);
          matches2.push(...findAll(test, getChildren(node)));
        }
      }
      return matches2;
    };
    var findOne = (test, nodes) => {
      for (let node of nodes)
        if (test(node) || (node = findOne(test, getChildren(node))))
          return node;
      return null;
    };
    var adapter = {
      isTag,
      existsOne,
      getAttributeValue,
      getChildren,
      getName,
      getParent,
      getSiblings,
      getText,
      hasAttrib,
      removeSubsets,
      findAll,
      findOne
    };
    var prepareMatch = (element, selectors) => {
      return CSSselect.compile(selectors, {
        xmlMode: !ignoreCase(element),
        adapter
      });
    };
    exports2.prepareMatch = prepareMatch;
    var matches = (element, selectors) => {
      return CSSselect.is(element, selectors, {
        strict: true,
        xmlMode: !ignoreCase(element),
        adapter
      });
    };
    exports2.matches = matches;
  }
});

// node_modules/linkedom/cjs/interface/text.js
var require_text = __commonJS({
  "node_modules/linkedom/cjs/interface/text.js"(exports2) {
    "use strict";
    var { TEXT_NODE } = require_constants();
    var { VALUE } = require_symbols();
    var { escape } = require_text_escaper();
    var { CharacterData } = require_character_data();
    var Text = class extends CharacterData {
      constructor(ownerDocument, data = "") {
        super(ownerDocument, "#text", TEXT_NODE, data);
      }
      get wholeText() {
        const text = [];
        let { previousSibling, nextSibling } = this;
        while (previousSibling) {
          if (previousSibling.nodeType === TEXT_NODE)
            text.unshift(previousSibling[VALUE]);
          else
            break;
          previousSibling = previousSibling.previousSibling;
        }
        text.push(this[VALUE]);
        while (nextSibling) {
          if (nextSibling.nodeType === TEXT_NODE)
            text.push(nextSibling[VALUE]);
          else
            break;
          nextSibling = nextSibling.nextSibling;
        }
        return text.join("");
      }
      cloneNode() {
        const { ownerDocument, [VALUE]: data } = this;
        return new Text(ownerDocument, data);
      }
      toString() {
        return escape(this[VALUE]);
      }
    };
    exports2.Text = Text;
  }
});

// node_modules/linkedom/cjs/mixin/parent-node.js
var require_parent_node = __commonJS({
  "node_modules/linkedom/cjs/mixin/parent-node.js"(exports2) {
    "use strict";
    var {
      ATTRIBUTE_NODE,
      DOCUMENT_FRAGMENT_NODE,
      ELEMENT_NODE,
      TEXT_NODE,
      NODE_END,
      COMMENT_NODE
    } = require_constants();
    var { PRIVATE, END, NEXT, PREV, START, VALUE } = require_symbols();
    var { prepareMatch } = require_matches();
    var { previousSibling, nextSibling } = require_node3();
    var { getEnd, knownAdjacent, knownBoundaries, knownSegment, knownSiblings, localCase } = require_utils();
    var { Node } = require_node2();
    var { Text } = require_text();
    var { NodeList } = require_node_list();
    var { moCallback } = require_mutation_observer();
    var { connectedCallback } = require_custom_element_registry();
    var { nextElementSibling } = require_non_document_type_child_node();
    var isNode = (node) => node instanceof Node;
    var insert = (parentNode, child, nodes) => {
      const { ownerDocument } = parentNode;
      for (const node of nodes)
        parentNode.insertBefore(isNode(node) ? node : new Text(ownerDocument, node), child);
    };
    var ParentNode = class extends Node {
      constructor(ownerDocument, localName, nodeType) {
        super(ownerDocument, localName, nodeType);
        this[PRIVATE] = null;
        this[NEXT] = this[END] = {
          [NEXT]: null,
          [PREV]: this,
          [START]: this,
          nodeType: NODE_END,
          ownerDocument: this.ownerDocument,
          parentNode: null
        };
      }
      get childNodes() {
        const childNodes = new NodeList();
        let { firstChild } = this;
        while (firstChild) {
          childNodes.push(firstChild);
          firstChild = nextSibling(firstChild);
        }
        return childNodes;
      }
      get children() {
        const children = new NodeList();
        let { firstElementChild } = this;
        while (firstElementChild) {
          children.push(firstElementChild);
          firstElementChild = nextElementSibling(firstElementChild);
        }
        return children;
      }
      get firstChild() {
        let { [NEXT]: next, [END]: end } = this;
        while (next.nodeType === ATTRIBUTE_NODE)
          next = next[NEXT];
        return next === end ? null : next;
      }
      get firstElementChild() {
        let { firstChild } = this;
        while (firstChild) {
          if (firstChild.nodeType === ELEMENT_NODE)
            return firstChild;
          firstChild = nextSibling(firstChild);
        }
        return null;
      }
      get lastChild() {
        const prev = this[END][PREV];
        switch (prev.nodeType) {
          case NODE_END:
            return prev[START];
          case ATTRIBUTE_NODE:
            return null;
        }
        return prev === this ? null : prev;
      }
      get lastElementChild() {
        let { lastChild } = this;
        while (lastChild) {
          if (lastChild.nodeType === ELEMENT_NODE)
            return lastChild;
          lastChild = previousSibling(lastChild);
        }
        return null;
      }
      get childElementCount() {
        return this.children.length;
      }
      prepend(...nodes) {
        insert(this, this.firstChild, nodes);
      }
      append(...nodes) {
        insert(this, this[END], nodes);
      }
      replaceChildren(...nodes) {
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end && next.nodeType === ATTRIBUTE_NODE)
          next = next[NEXT];
        while (next !== end) {
          const after = getEnd(next)[NEXT];
          next.remove();
          next = after;
        }
        if (nodes.length)
          insert(this, end, nodes);
      }
      getElementsByClassName(className) {
        const elements = new NodeList();
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE && next.hasAttribute("class") && next.classList.has(className))
            elements.push(next);
          next = next[NEXT];
        }
        return elements;
      }
      getElementsByTagName(tagName) {
        const elements = new NodeList();
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE && (next.localName === tagName || localCase(next) === tagName))
            elements.push(next);
          next = next[NEXT];
        }
        return elements;
      }
      querySelector(selectors) {
        const matches = prepareMatch(this, selectors);
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE && matches(next))
            return next;
          next = next[NEXT];
        }
        return null;
      }
      querySelectorAll(selectors) {
        const matches = prepareMatch(this, selectors);
        const elements = new NodeList();
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE && matches(next))
            elements.push(next);
          next = next[NEXT];
        }
        return elements;
      }
      appendChild(node) {
        return this.insertBefore(node, this[END]);
      }
      contains(node) {
        let parentNode = node;
        while (parentNode && parentNode !== this)
          parentNode = parentNode.parentNode;
        return parentNode === this;
      }
      insertBefore(node, before = null) {
        if (node === before)
          return node;
        if (node === this)
          throw new Error("unable to append a node to itself");
        const next = before || this[END];
        switch (node.nodeType) {
          case ELEMENT_NODE:
            node.remove();
            node.parentNode = this;
            knownBoundaries(next[PREV], node, next);
            moCallback(node, null);
            connectedCallback(node);
            break;
          case DOCUMENT_FRAGMENT_NODE: {
            let { [PRIVATE]: parentNode, firstChild, lastChild } = node;
            if (firstChild) {
              knownSegment(next[PREV], firstChild, lastChild, next);
              knownAdjacent(node, node[END]);
              if (parentNode)
                parentNode.replaceChildren();
              do {
                firstChild.parentNode = this;
                moCallback(firstChild, null);
                if (firstChild.nodeType === ELEMENT_NODE)
                  connectedCallback(firstChild);
              } while (firstChild !== lastChild && (firstChild = nextSibling(firstChild)));
            }
            break;
          }
          case TEXT_NODE:
          case COMMENT_NODE:
            node.remove();
          default:
            node.parentNode = this;
            knownSiblings(next[PREV], node, next);
            moCallback(node, null);
            break;
        }
        return node;
      }
      normalize() {
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          const { [NEXT]: $next, [PREV]: $prev, nodeType } = next;
          if (nodeType === TEXT_NODE) {
            if (!next[VALUE])
              next.remove();
            else if ($prev && $prev.nodeType === TEXT_NODE) {
              $prev.textContent += next.textContent;
              next.remove();
            }
          }
          next = $next;
        }
      }
      removeChild(node) {
        if (node.parentNode !== this)
          throw new Error("node is not a child");
        node.remove();
        return node;
      }
      replaceChild(node, replaced) {
        const next = getEnd(replaced)[NEXT];
        replaced.remove();
        this.insertBefore(node, next);
        return replaced;
      }
    };
    exports2.ParentNode = ParentNode;
  }
});

// node_modules/linkedom/cjs/mixin/non-element-parent-node.js
var require_non_element_parent_node = __commonJS({
  "node_modules/linkedom/cjs/mixin/non-element-parent-node.js"(exports2) {
    "use strict";
    var { ELEMENT_NODE } = require_constants();
    var { END, NEXT } = require_symbols();
    var { nonElementAsJSON } = require_jsdon();
    var { ParentNode } = require_parent_node();
    var NonElementParentNode = class extends ParentNode {
      getElementById(id) {
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          if (next.nodeType === ELEMENT_NODE && next.id === id)
            return next;
          next = next[NEXT];
        }
        return null;
      }
      cloneNode(deep) {
        const { ownerDocument, constructor } = this;
        const nonEPN = new constructor(ownerDocument);
        if (deep) {
          const { [END]: end } = nonEPN;
          for (const node of this.childNodes)
            nonEPN.insertBefore(node.cloneNode(deep), end);
        }
        return nonEPN;
      }
      toString() {
        const { childNodes, localName } = this;
        return `<${localName}>${childNodes.join("")}</${localName}>`;
      }
      toJSON() {
        const json = [];
        nonElementAsJSON(this, json);
        return json;
      }
    };
    exports2.NonElementParentNode = NonElementParentNode;
  }
});

// node_modules/linkedom/cjs/interface/document-fragment.js
var require_document_fragment = __commonJS({
  "node_modules/linkedom/cjs/interface/document-fragment.js"(exports2) {
    "use strict";
    var { DOCUMENT_FRAGMENT_NODE } = require_constants();
    var { NonElementParentNode } = require_non_element_parent_node();
    var DocumentFragment = class extends NonElementParentNode {
      constructor(ownerDocument) {
        super(ownerDocument, "#document-fragment", DOCUMENT_FRAGMENT_NODE);
      }
    };
    exports2.DocumentFragment = DocumentFragment;
  }
});

// node_modules/linkedom/cjs/interface/document-type.js
var require_document_type = __commonJS({
  "node_modules/linkedom/cjs/interface/document-type.js"(exports2) {
    "use strict";
    var { DOCUMENT_TYPE_NODE } = require_constants();
    var { documentTypeAsJSON } = require_jsdon();
    var { Node } = require_node2();
    var DocumentType = class extends Node {
      constructor(ownerDocument, name, publicId = "", systemId = "") {
        super(ownerDocument, "#document-type", DOCUMENT_TYPE_NODE);
        this.name = name;
        this.publicId = publicId;
        this.systemId = systemId;
      }
      cloneNode() {
        const { ownerDocument, name, publicId, systemId } = this;
        return new DocumentType(ownerDocument, name, publicId, systemId);
      }
      toString() {
        const { name, publicId, systemId } = this;
        const hasPublic = 0 < publicId.length;
        const str = [name];
        if (hasPublic)
          str.push("PUBLIC", `"${publicId}"`);
        if (systemId.length) {
          if (!hasPublic)
            str.push("SYSTEM");
          str.push(`"${systemId}"`);
        }
        return `<!DOCTYPE ${str.join(" ")}>`;
      }
      toJSON() {
        const json = [];
        documentTypeAsJSON(this, json);
        return json;
      }
    };
    exports2.DocumentType = DocumentType;
  }
});

// node_modules/uhyphen/cjs/index.js
var require_cjs2 = __commonJS({
  "node_modules/uhyphen/cjs/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (camel) => camel.replace(/(([A-Z0-9])([A-Z0-9][a-z]))|(([a-z])([A-Z]))/g, "$2$5-$3$6").toLowerCase();
  }
});

// node_modules/linkedom/cjs/dom/string-map.js
var require_string_map = __commonJS({
  "node_modules/linkedom/cjs/dom/string-map.js"(exports2) {
    "use strict";
    var uhyphen = ((m) => m.__esModule ? m.default : m)(require_cjs2());
    var { setPrototypeOf } = require_object();
    var refs = new WeakMap();
    var key = (name) => `data-${uhyphen(name)}`;
    var prop = (name) => name.slice(5).replace(/-([a-z])/g, (_, $1) => $1.toUpperCase());
    var handler2 = {
      get(dataset, name) {
        if (name in dataset)
          return refs.get(dataset).getAttribute(key(name));
      },
      set(dataset, name, value) {
        dataset[name] = value;
        refs.get(dataset).setAttribute(key(name), value);
        return true;
      },
      deleteProperty(dataset, name) {
        if (name in dataset)
          refs.get(dataset).removeAttribute(key(name));
        return delete dataset[name];
      }
    };
    var DOMStringMap = class {
      constructor(ref) {
        for (const { name, value } of ref.attributes) {
          if (/^data-/.test(name))
            this[prop(name)] = value;
        }
        refs.set(this, ref);
        return new Proxy(this, handler2);
      }
    };
    exports2.DOMStringMap = DOMStringMap;
    setPrototypeOf(DOMStringMap.prototype, null);
  }
});

// node_modules/linkedom/cjs/dom/token-list.js
var require_token_list = __commonJS({
  "node_modules/linkedom/cjs/dom/token-list.js"(exports2) {
    "use strict";
    var { OWNER_ELEMENT } = require_symbols();
    var { setAttribute } = require_attributes();
    var { Attr } = require_attr();
    var { add } = Set.prototype;
    var addTokens = (self, tokens) => {
      for (const token of tokens) {
        if (token)
          add.call(self, token);
      }
    };
    var update = ({ [OWNER_ELEMENT]: ownerElement, value }) => {
      const attribute = ownerElement.getAttributeNode("class");
      if (attribute)
        attribute.value = value;
      else
        setAttribute(ownerElement, new Attr(ownerElement.ownerDocument, "class", value));
    };
    var DOMTokenList = class extends Set {
      constructor(ownerElement) {
        super();
        this[OWNER_ELEMENT] = ownerElement;
        const attribute = ownerElement.getAttributeNode("class");
        if (attribute)
          addTokens(this, attribute.value.split(/\s+/));
      }
      get length() {
        return this.size;
      }
      get value() {
        return [...this].join(" ");
      }
      add(...tokens) {
        addTokens(this, tokens);
        update(this);
      }
      contains(token) {
        return this.has(token);
      }
      remove(...tokens) {
        for (const token of tokens)
          this.delete(token);
        update(this);
      }
      toggle(token, force) {
        if (this.has(token)) {
          if (force)
            return true;
          this.delete(token);
          update(this);
        } else if (force || arguments.length === 1) {
          super.add(token);
          update(this);
          return true;
        }
        return false;
      }
      replace(token, newToken) {
        if (this.has(token)) {
          this.delete(token);
          super.add(newToken);
          update(this);
          return true;
        }
        return false;
      }
      supports() {
        return true;
      }
    };
    exports2.DOMTokenList = DOMTokenList;
  }
});

// node_modules/linkedom/cjs/interface/css-style-declaration.js
var require_css_style_declaration = __commonJS({
  "node_modules/linkedom/cjs/interface/css-style-declaration.js"(exports2) {
    "use strict";
    var uhyphen = ((m) => m.__esModule ? m.default : m)(require_cjs2());
    var { CHANGED, PRIVATE, VALUE } = require_symbols();
    var refs = new WeakMap();
    var getKeys = (style) => [...style.keys()].filter((key) => key !== PRIVATE);
    var updateKeys = (style) => {
      const attr = refs.get(style).getAttributeNode("style");
      if (!attr || attr[CHANGED] || style.get(PRIVATE) !== attr) {
        style.clear();
        if (attr) {
          style.set(PRIVATE, attr);
          for (const rule of attr[VALUE].split(/\s*;\s*/)) {
            const pair = rule.split(/\s*:\s*/);
            if (1 < pair.length) {
              let [key, value] = pair;
              key = key.trim();
              value = value.trim();
              if (key && value)
                style.set(key, value);
            }
          }
        }
      }
      return attr;
    };
    var handler2 = {
      get(style, name) {
        if (name in prototype)
          return style[name];
        updateKeys(style);
        if (name === "length")
          return getKeys(style).length;
        if (/^\d+$/.test(name))
          return getKeys(style)[name];
        return style.get(uhyphen(name));
      },
      set(style, name, value) {
        if (name === "cssText")
          style[name] = value;
        else {
          let attr = updateKeys(style);
          if (value == null)
            style.delete(uhyphen(name));
          else
            style.set(uhyphen(name), value);
          if (!attr) {
            const element = refs.get(style);
            attr = element.ownerDocument.createAttribute("style");
            element.setAttributeNode(attr);
            style.set(PRIVATE, attr);
          }
          attr[CHANGED] = false;
          attr[VALUE] = style.toString();
        }
        return true;
      }
    };
    var CSSStyleDeclaration = class extends Map {
      constructor(element) {
        super();
        refs.set(this, element);
        return new Proxy(this, handler2);
      }
      get cssText() {
        return this.toString();
      }
      set cssText(value) {
        refs.get(this).setAttribute("style", value);
      }
      [Symbol.iterator]() {
        const keys = getKeys(this[PRIVATE]);
        const { length } = keys;
        let i = 0;
        return {
          next() {
            const done = i === length;
            return { done, value: done ? null : keys[i++] };
          }
        };
      }
      get [PRIVATE]() {
        return this;
      }
      toString() {
        const self = this[PRIVATE];
        updateKeys(self);
        const cssText = [];
        self.forEach(push, cssText);
        return cssText.join(";");
      }
    };
    exports2.CSSStyleDeclaration = CSSStyleDeclaration;
    var { prototype } = CSSStyleDeclaration;
    function push(value, key) {
      if (key !== PRIVATE)
        this.push(`${key}:${value}`);
    }
  }
});

// node_modules/linkedom/cjs/interface/event.js
var require_event = __commonJS({
  "node_modules/linkedom/cjs/interface/event.js"(exports2) {
    "use strict";
    var BUBBLING_PHASE = 3;
    var CAPTURING_PHASE = 1;
    var GlobalEvent = typeof Event === "function" ? Event : class Event {
      static get BUBBLING_PHASE() {
        return BUBBLING_PHASE;
      }
      static get CAPTURING_PHASE() {
        return CAPTURING_PHASE;
      }
      constructor(type, eventInitDict = {}) {
        this.type = type;
        this.bubbles = !!eventInitDict.bubbles;
        this.cancelBubble = false;
        this._stopImmediatePropagationFlag = false;
        this.cancelable = !!eventInitDict.cancelable;
        this.eventPhase = this.BUBBLING_PHASE;
        this.timeStamp = Date.now();
        this.defaultPrevented = false;
        this.originalTarget = null;
        this.returnValue = null;
        this.srcElement = null;
        this.target = null;
      }
      get BUBBLING_PHASE() {
        return BUBBLING_PHASE;
      }
      get CAPTURING_PHASE() {
        return CAPTURING_PHASE;
      }
      preventDefault() {
        this.defaultPrevented = true;
      }
      stopPropagation() {
        this.cancelBubble = true;
      }
      stopImmediatePropagation() {
        this._stopImmediatePropagationFlag = true;
      }
    };
    var DOMEvent = class extends GlobalEvent {
      stopImmediatePropagation() {
        super.stopPropagation();
        if (typeof super.stopImmediatePropagation === "function")
          super.stopImmediatePropagation();
      }
    };
    exports2.Event = DOMEvent;
  }
});

// node_modules/linkedom/cjs/interface/named-node-map.js
var require_named_node_map = __commonJS({
  "node_modules/linkedom/cjs/interface/named-node-map.js"(exports2) {
    "use strict";
    var NamedNodeMap = class extends Array {
      constructor(ownerElement) {
        super();
        this.ownerElement = ownerElement;
      }
      getNamedItem(name) {
        return this.ownerElement.getAttributeNode(name);
      }
      setNamedItem(attr) {
        this.ownerElement.setAttributeNode(attr);
        this.unshift(attr);
      }
      removeNamedItem(name) {
        const item = this.getNamedItem(name);
        this.ownerElement.removeAttribute(name);
        this.splice(this.indexOf(item), 1);
      }
      item(index) {
        return index < this.length ? this[index] : null;
      }
      getNamedItemNS(_, name) {
        return this.getNamedItem(name);
      }
      setNamedItemNS(_, attr) {
        return this.setNamedItem(attr);
      }
      removeNamedItemNS(_, name) {
        return this.removeNamedItem(name);
      }
    };
    exports2.NamedNodeMap = NamedNodeMap;
  }
});

// node_modules/linkedom/cjs/interface/shadow-root.js
var require_shadow_root = __commonJS({
  "node_modules/linkedom/cjs/interface/shadow-root.js"(exports2) {
    "use strict";
    var { DOCUMENT_FRAGMENT_NODE } = require_constants();
    var { NonElementParentNode } = require_non_element_parent_node();
    var ShadowRoot = class extends NonElementParentNode {
      constructor(ownerDocument) {
        super(ownerDocument, "#shadow-root", DOCUMENT_FRAGMENT_NODE);
      }
    };
    exports2.ShadowRoot = ShadowRoot;
  }
});

// node_modules/linkedom/cjs/interface/element.js
var require_element = __commonJS({
  "node_modules/linkedom/cjs/interface/element.js"(exports2) {
    "use strict";
    var {
      ATTRIBUTE_NODE,
      COMMENT_NODE,
      ELEMENT_NODE,
      NODE_END,
      TEXT_NODE,
      SVG_NAMESPACE
    } = require_constants();
    var {
      setAttribute,
      removeAttribute,
      numericAttribute,
      stringAttribute
    } = require_attributes();
    var {
      CLASS_LIST,
      DATASET,
      STYLE,
      END,
      NEXT,
      PREV,
      START,
      MIME,
      CUSTOM_ELEMENTS
    } = require_symbols();
    var {
      ignoreCase,
      knownAdjacent,
      localCase
    } = require_utils();
    var { elementAsJSON } = require_jsdon();
    var { matches, prepareMatch } = require_matches();
    var { parseFromString } = require_parse_from_string();
    var { isConnected, parentElement, previousSibling, nextSibling } = require_node3();
    var { previousElementSibling, nextElementSibling } = require_non_document_type_child_node();
    var { before, after, replaceWith, remove } = require_child_node();
    var { ParentNode } = require_parent_node();
    var { DOMStringMap } = require_string_map();
    var { DOMTokenList } = require_token_list();
    var { CSSStyleDeclaration } = require_css_style_declaration();
    var { Event: Event2 } = require_event();
    var { NamedNodeMap } = require_named_node_map();
    var { ShadowRoot } = require_shadow_root();
    var { NodeList } = require_node_list();
    var { Attr } = require_attr();
    var { Text } = require_text();
    var attributesHandler = {
      get(target, key) {
        return key in target ? target[key] : target.find(({ name }) => name === key);
      }
    };
    var create = (ownerDocument, element, localName) => {
      if ("ownerSVGElement" in element) {
        const svg = ownerDocument.createElementNS(SVG_NAMESPACE, localName);
        svg.ownerSVGElement = element.ownerSVGElement;
        return svg;
      }
      return ownerDocument.createElement(localName);
    };
    var isVoid = ({ localName, ownerDocument }) => {
      return ownerDocument[MIME].voidElements.test(localName);
    };
    var shadowRoots = new WeakMap();
    var Element = class extends ParentNode {
      constructor(ownerDocument, localName) {
        super(ownerDocument, localName, ELEMENT_NODE);
        this[CLASS_LIST] = null;
        this[DATASET] = null;
        this[STYLE] = null;
      }
      get isConnected() {
        return isConnected(this);
      }
      get parentElement() {
        return parentElement(this);
      }
      get previousSibling() {
        return previousSibling(this);
      }
      get nextSibling() {
        return nextSibling(this);
      }
      get previousElementSibling() {
        return previousElementSibling(this);
      }
      get nextElementSibling() {
        return nextElementSibling(this);
      }
      before(...nodes) {
        before(this, nodes);
      }
      after(...nodes) {
        after(this, nodes);
      }
      replaceWith(...nodes) {
        replaceWith(this, nodes);
      }
      remove() {
        remove(this[PREV], this, this[END][NEXT]);
      }
      get id() {
        return stringAttribute.get(this, "id");
      }
      set id(value) {
        stringAttribute.set(this, "id", value);
      }
      get className() {
        return this.classList.value;
      }
      set className(value) {
        const { classList } = this;
        classList.clear();
        classList.add(...value.split(/\s+/));
      }
      get nodeName() {
        return localCase(this);
      }
      get tagName() {
        return localCase(this);
      }
      get classList() {
        return this[CLASS_LIST] || (this[CLASS_LIST] = new DOMTokenList(this));
      }
      get dataset() {
        return this[DATASET] || (this[DATASET] = new DOMStringMap(this));
      }
      get nonce() {
        return stringAttribute.get(this, "nonce");
      }
      set nonce(value) {
        stringAttribute.set(this, "nonce", value);
      }
      get style() {
        return this[STYLE] || (this[STYLE] = new CSSStyleDeclaration(this));
      }
      get tabIndex() {
        return numericAttribute.get(this, "tabindex") || -1;
      }
      set tabIndex(value) {
        numericAttribute.set(this, "tabindex", value);
      }
      get innerText() {
        return this.textContent;
      }
      get textContent() {
        const text = [];
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          if (next.nodeType === TEXT_NODE)
            text.push(next.textContent);
          next = next[NEXT];
        }
        return text.join("");
      }
      set textContent(text) {
        this.replaceChildren();
        if (text)
          this.appendChild(new Text(this.ownerDocument, text));
      }
      get innerHTML() {
        return this.childNodes.join("");
      }
      set innerHTML(html) {
        const { ownerDocument } = this;
        const { constructor } = ownerDocument;
        const document = new constructor();
        document[CUSTOM_ELEMENTS] = ownerDocument[CUSTOM_ELEMENTS];
        const { childNodes } = parseFromString(document, ignoreCase(this), html);
        this.replaceChildren(...childNodes);
      }
      get outerHTML() {
        return this.toString();
      }
      set outerHTML(html) {
        const template = this.ownerDocument.createElement("");
        template.innerHTML = html;
        this.replaceWith(...template.childNodes);
      }
      get attributes() {
        const attributes = new NamedNodeMap(this);
        let next = this[NEXT];
        while (next.nodeType === ATTRIBUTE_NODE) {
          attributes.push(next);
          next = next[NEXT];
        }
        return new Proxy(attributes, attributesHandler);
      }
      focus() {
        this.dispatchEvent(new Event2("focus"));
      }
      getAttribute(name) {
        if (name === "class")
          return this.className;
        const attribute = this.getAttributeNode(name);
        return attribute && attribute.value;
      }
      getAttributeNode(name) {
        let next = this[NEXT];
        while (next.nodeType === ATTRIBUTE_NODE) {
          if (next.name === name)
            return next;
          next = next[NEXT];
        }
        return null;
      }
      getAttributeNames() {
        const attributes = new NodeList();
        let next = this[NEXT];
        while (next.nodeType === ATTRIBUTE_NODE) {
          attributes.push(next.name);
          next = next[NEXT];
        }
        return attributes;
      }
      hasAttribute(name) {
        return !!this.getAttributeNode(name);
      }
      hasAttributes() {
        return this[NEXT].nodeType === ATTRIBUTE_NODE;
      }
      removeAttribute(name) {
        if (name === "class" && this[CLASS_LIST])
          this[CLASS_LIST].clear();
        let next = this[NEXT];
        while (next.nodeType === ATTRIBUTE_NODE) {
          if (next.name === name) {
            removeAttribute(this, next);
            return;
          }
          next = next[NEXT];
        }
      }
      removeAttributeNode(attribute) {
        let next = this[NEXT];
        while (next.nodeType === ATTRIBUTE_NODE) {
          if (next === attribute) {
            removeAttribute(this, next);
            return;
          }
          next = next[NEXT];
        }
      }
      setAttribute(name, value) {
        if (name === "class")
          this.className = value;
        else {
          const attribute = this.getAttributeNode(name);
          if (attribute)
            attribute.value = value;
          else
            setAttribute(this, new Attr(this.ownerDocument, name, value));
        }
      }
      setAttributeNode(attribute) {
        const { name } = attribute;
        const previously = this.getAttributeNode(name);
        if (previously !== attribute) {
          if (previously)
            this.removeAttributeNode(previously);
          const { ownerElement } = attribute;
          if (ownerElement)
            ownerElement.removeAttributeNode(attribute);
          setAttribute(this, attribute);
        }
        return previously;
      }
      toggleAttribute(name, force) {
        if (this.hasAttribute(name)) {
          if (!force) {
            this.removeAttribute(name);
            return false;
          }
          return true;
        } else if (force || arguments.length === 1) {
          this.setAttribute(name, "");
          return true;
        }
        return false;
      }
      get shadowRoot() {
        if (shadowRoots.has(this)) {
          const { mode, shadowRoot } = shadowRoots.get(this);
          if (mode === "open")
            return shadowRoot;
        }
        return null;
      }
      attachShadow(init) {
        if (shadowRoots.has(this))
          throw new Error("operation not supported");
        const shadowRoot = new ShadowRoot(this.ownerDocument);
        shadowRoot.append(...this.childNodes);
        shadowRoots.set(this, {
          mode: init.mode,
          shadowRoot
        });
        return shadowRoot;
      }
      matches(selectors) {
        return matches(this, selectors);
      }
      closest(selectors) {
        let parentElement2 = this;
        const matches2 = prepareMatch(parentElement2, selectors);
        while (parentElement2 && !matches2(parentElement2))
          parentElement2 = parentElement2.parentElement;
        return parentElement2;
      }
      insertAdjacentElement(position, element) {
        const { parentElement: parentElement2 } = this;
        switch (position) {
          case "beforebegin":
            if (parentElement2) {
              parentElement2.insertBefore(element, this);
              break;
            }
            return null;
          case "afterbegin":
            this.insertBefore(element, this.firstChild);
            break;
          case "beforeend":
            this.insertBefore(element, null);
            break;
          case "afterend":
            if (parentElement2) {
              parentElement2.insertBefore(element, this.nextSibling);
              break;
            }
            return null;
        }
        return element;
      }
      insertAdjacentHTML(position, html) {
        const template = this.ownerDocument.createElement("template");
        template.innerHTML = html;
        this.insertAdjacentElement(position, template.content);
      }
      insertAdjacentText(position, text) {
        const node = this.ownerDocument.createTextNode(text);
        this.insertAdjacentElement(position, node);
      }
      cloneNode(deep = false) {
        const { ownerDocument, localName } = this;
        const addNext = (next2) => {
          next2.parentNode = parentNode;
          knownAdjacent($next, next2);
          $next = next2;
        };
        const clone = create(ownerDocument, this, localName);
        let parentNode = clone, $next = clone;
        let { [NEXT]: next, [END]: prev } = this;
        while (next !== prev && (deep || next.nodeType === ATTRIBUTE_NODE)) {
          switch (next.nodeType) {
            case NODE_END:
              knownAdjacent($next, parentNode[END]);
              $next = parentNode[END];
              parentNode = parentNode.parentNode;
              break;
            case ELEMENT_NODE: {
              const node = create(ownerDocument, next, next.localName);
              addNext(node);
              parentNode = node;
              break;
            }
            case ATTRIBUTE_NODE:
            case TEXT_NODE:
            case COMMENT_NODE:
              addNext(next.cloneNode(deep));
              break;
          }
          next = next[NEXT];
        }
        knownAdjacent($next, clone[END]);
        return clone;
      }
      toString() {
        const out = [];
        const { [END]: end } = this;
        let next = { [NEXT]: this };
        let isOpened = false;
        do {
          next = next[NEXT];
          switch (next.nodeType) {
            case ATTRIBUTE_NODE: {
              const attr = " " + next;
              switch (attr) {
                case " id":
                case " class":
                case " style":
                  break;
                default:
                  out.push(attr);
              }
              break;
            }
            case NODE_END: {
              const start = next[START];
              if (isOpened) {
                if ("ownerSVGElement" in start)
                  out.push(" />");
                else if (isVoid(start))
                  out.push(ignoreCase(start) ? ">" : " />");
                else
                  out.push(`></${start.localName}>`);
                isOpened = false;
              } else
                out.push(`</${start.localName}>`);
              break;
            }
            case ELEMENT_NODE:
              if (isOpened)
                out.push(">");
              if (next.toString !== this.toString) {
                out.push(next.toString());
                next = next[END];
                isOpened = false;
              } else {
                out.push(`<${next.localName}`);
                isOpened = true;
              }
              break;
            case TEXT_NODE:
            case COMMENT_NODE:
              out.push((isOpened ? ">" : "") + next);
              isOpened = false;
              break;
          }
        } while (next !== end);
        return out.join("");
      }
      toJSON() {
        const json = [];
        elementAsJSON(this, json);
        return json;
      }
      getAttributeNS(_, name) {
        return this.getAttribute(name);
      }
      getElementsByTagNameNS(_, name) {
        return this.getElementsByTagName(name);
      }
      hasAttributeNS(_, name) {
        return this.hasAttribute(name);
      }
      removeAttributeNS(_, name) {
        this.removeAttribute(name);
      }
      setAttributeNS(_, name, value) {
        this.setAttribute(name, value);
      }
      setAttributeNodeNS(attr) {
        return this.setAttributeNode(attr);
      }
    };
    exports2.Element = Element;
  }
});

// node_modules/linkedom/cjs/svg/element.js
var require_element2 = __commonJS({
  "node_modules/linkedom/cjs/svg/element.js"(exports2) {
    "use strict";
    var { Element } = require_element();
    var classNames = new WeakMap();
    var handler2 = {
      get(target, name) {
        return target[name];
      },
      set(target, name, value) {
        target[name] = value;
        return true;
      }
    };
    var SVGElement = class extends Element {
      constructor(ownerDocument, localName, ownerSVGElement = null) {
        super(ownerDocument, localName);
        this.ownerSVGElement = ownerSVGElement;
      }
      get className() {
        if (!classNames.has(this))
          classNames.set(this, new Proxy({ baseVal: "", animVal: "" }, handler2));
        return classNames.get(this);
      }
      set className(value) {
        const { classList } = this;
        classList.clear();
        classList.add(...value.split(/\s+/));
      }
      setAttribute(name, value) {
        if (name === "style") {
          const { className } = this;
          className.baseVal = className.animVal = value;
        }
        super.setAttribute(name, value);
      }
    };
    exports2.SVGElement = SVGElement;
  }
});

// node_modules/linkedom/cjs/shared/facades.js
var require_facades = __commonJS({
  "node_modules/linkedom/cjs/shared/facades.js"(exports2) {
    "use strict";
    var { Attr: _Attr } = require_attr();
    var { CharacterData: _CharacterData } = require_character_data();
    var { Comment: _Comment } = require_comment();
    var { DocumentFragment: _DocumentFragment } = require_document_fragment();
    var { DocumentType: _DocumentType } = require_document_type();
    var { Element: _Element } = require_element();
    var { Node: _Node } = require_node2();
    var { ShadowRoot: _ShadowRoot } = require_shadow_root();
    var { Text: _Text } = require_text();
    var { SVGElement: _SVGElement } = require_element2();
    var { setPrototypeOf } = require_object();
    var illegalConstructor = () => {
      throw new TypeError("Illegal constructor");
    };
    exports2.illegalConstructor = illegalConstructor;
    function Attr() {
      illegalConstructor();
    }
    exports2.Attr = Attr;
    setPrototypeOf(Attr, _Attr);
    Attr.prototype = _Attr.prototype;
    function CharacterData() {
      illegalConstructor();
    }
    exports2.CharacterData = CharacterData;
    setPrototypeOf(CharacterData, _CharacterData);
    CharacterData.prototype = _CharacterData.prototype;
    function Comment() {
      illegalConstructor();
    }
    exports2.Comment = Comment;
    setPrototypeOf(Comment, _Comment);
    Comment.prototype = _Comment.prototype;
    function DocumentFragment() {
      illegalConstructor();
    }
    exports2.DocumentFragment = DocumentFragment;
    setPrototypeOf(DocumentFragment, _DocumentFragment);
    DocumentFragment.prototype = _DocumentFragment.prototype;
    function DocumentType() {
      illegalConstructor();
    }
    exports2.DocumentType = DocumentType;
    setPrototypeOf(DocumentType, _DocumentType);
    DocumentType.prototype = _DocumentType.prototype;
    function Element() {
      illegalConstructor();
    }
    exports2.Element = Element;
    setPrototypeOf(Element, _Element);
    Element.prototype = _Element.prototype;
    function Node() {
      illegalConstructor();
    }
    exports2.Node = Node;
    setPrototypeOf(Node, _Node);
    Node.prototype = _Node.prototype;
    function ShadowRoot() {
      illegalConstructor();
    }
    exports2.ShadowRoot = ShadowRoot;
    setPrototypeOf(ShadowRoot, _ShadowRoot);
    ShadowRoot.prototype = _ShadowRoot.prototype;
    function Text() {
      illegalConstructor();
    }
    exports2.Text = Text;
    setPrototypeOf(Text, _Text);
    Text.prototype = _Text.prototype;
    function SVGElement() {
      illegalConstructor();
    }
    exports2.SVGElement = SVGElement;
    setPrototypeOf(SVGElement, _SVGElement);
    SVGElement.prototype = _SVGElement.prototype;
    var Facades = {
      Attr,
      CharacterData,
      Comment,
      DocumentFragment,
      DocumentType,
      Element,
      Node,
      ShadowRoot,
      Text,
      SVGElement
    };
    exports2.Facades = Facades;
  }
});

// node_modules/linkedom/cjs/html/element.js
var require_element3 = __commonJS({
  "node_modules/linkedom/cjs/html/element.js"(exports2) {
    "use strict";
    var { END } = require_symbols();
    var { booleanAttribute, stringAttribute } = require_attributes();
    var { Event: Event2 } = require_event();
    var { Element } = require_element();
    var { Classes, customElements } = require_custom_element_registry();
    var Level0 = new WeakMap();
    var level0 = {
      get(element, name) {
        return Level0.has(element) && Level0.get(element)[name] || null;
      },
      set(element, name, value) {
        if (!Level0.has(element))
          Level0.set(element, {});
        const handlers = Level0.get(element);
        const type = name.slice(2);
        if (handlers[name])
          element.removeEventListener(type, handlers[name], false);
        if (handlers[name] = value)
          element.addEventListener(type, value, false);
      }
    };
    var HTMLElement = class extends Element {
      static get observedAttributes() {
        return [];
      }
      constructor(ownerDocument = null, localName = "") {
        super(ownerDocument, localName);
        if (!ownerDocument) {
          const { constructor: Class, [END]: end } = this;
          if (!Classes.has(Class))
            throw new Error("unable to initialize this Custom Element");
          const { ownerDocument: ownerDocument2, localName: localName2, options } = Classes.get(Class);
          this.ownerDocument = end.ownerDocument = ownerDocument2;
          this.localName = localName2;
          customElements.set(this, { connected: false });
          if (options.is)
            this.setAttribute("is", options.is);
        }
      }
      blur() {
        this.dispatchEvent(new Event2("blur"));
      }
      click() {
        this.dispatchEvent(new Event2("click"));
      }
      get accessKeyLabel() {
        const { accessKey } = this;
        return accessKey && `Alt+Shift+${accessKey}`;
      }
      get isContentEditable() {
        return this.hasAttribute("contenteditable");
      }
      get contentEditable() {
        return booleanAttribute.get(this, "contenteditable");
      }
      set contentEditable(value) {
        booleanAttribute.set(this, "contenteditable", value);
      }
      get draggable() {
        return booleanAttribute.get(this, "draggable");
      }
      set draggable(value) {
        booleanAttribute.set(this, "draggable", value);
      }
      get hidden() {
        return booleanAttribute.get(this, "hidden");
      }
      set hidden(value) {
        booleanAttribute.set(this, "hidden", value);
      }
      get spellcheck() {
        return booleanAttribute.get(this, "spellcheck");
      }
      set spellcheck(value) {
        booleanAttribute.set(this, "spellcheck", value);
      }
      get accessKey() {
        return stringAttribute.get(this, "accesskey");
      }
      set accessKey(value) {
        stringAttribute.set(this, "accesskey", value);
      }
      get dir() {
        return stringAttribute.get(this, "dir");
      }
      set dir(value) {
        stringAttribute.set(this, "dir", value);
      }
      get lang() {
        return stringAttribute.get(this, "lang");
      }
      set lang(value) {
        stringAttribute.set(this, "lang", value);
      }
      get title() {
        return stringAttribute.get(this, "title");
      }
      set title(value) {
        stringAttribute.set(this, "title", value);
      }
      get onabort() {
        return level0.get(this, "onabort");
      }
      set onabort(value) {
        level0.set(this, "onabort", value);
      }
      get onblur() {
        return level0.get(this, "onblur");
      }
      set onblur(value) {
        level0.set(this, "onblur", value);
      }
      get oncancel() {
        return level0.get(this, "oncancel");
      }
      set oncancel(value) {
        level0.set(this, "oncancel", value);
      }
      get oncanplay() {
        return level0.get(this, "oncanplay");
      }
      set oncanplay(value) {
        level0.set(this, "oncanplay", value);
      }
      get oncanplaythrough() {
        return level0.get(this, "oncanplaythrough");
      }
      set oncanplaythrough(value) {
        level0.set(this, "oncanplaythrough", value);
      }
      get onchange() {
        return level0.get(this, "onchange");
      }
      set onchange(value) {
        level0.set(this, "onchange", value);
      }
      get onclick() {
        return level0.get(this, "onclick");
      }
      set onclick(value) {
        level0.set(this, "onclick", value);
      }
      get onclose() {
        return level0.get(this, "onclose");
      }
      set onclose(value) {
        level0.set(this, "onclose", value);
      }
      get oncontextmenu() {
        return level0.get(this, "oncontextmenu");
      }
      set oncontextmenu(value) {
        level0.set(this, "oncontextmenu", value);
      }
      get oncuechange() {
        return level0.get(this, "oncuechange");
      }
      set oncuechange(value) {
        level0.set(this, "oncuechange", value);
      }
      get ondblclick() {
        return level0.get(this, "ondblclick");
      }
      set ondblclick(value) {
        level0.set(this, "ondblclick", value);
      }
      get ondrag() {
        return level0.get(this, "ondrag");
      }
      set ondrag(value) {
        level0.set(this, "ondrag", value);
      }
      get ondragend() {
        return level0.get(this, "ondragend");
      }
      set ondragend(value) {
        level0.set(this, "ondragend", value);
      }
      get ondragenter() {
        return level0.get(this, "ondragenter");
      }
      set ondragenter(value) {
        level0.set(this, "ondragenter", value);
      }
      get ondragleave() {
        return level0.get(this, "ondragleave");
      }
      set ondragleave(value) {
        level0.set(this, "ondragleave", value);
      }
      get ondragover() {
        return level0.get(this, "ondragover");
      }
      set ondragover(value) {
        level0.set(this, "ondragover", value);
      }
      get ondragstart() {
        return level0.get(this, "ondragstart");
      }
      set ondragstart(value) {
        level0.set(this, "ondragstart", value);
      }
      get ondrop() {
        return level0.get(this, "ondrop");
      }
      set ondrop(value) {
        level0.set(this, "ondrop", value);
      }
      get ondurationchange() {
        return level0.get(this, "ondurationchange");
      }
      set ondurationchange(value) {
        level0.set(this, "ondurationchange", value);
      }
      get onemptied() {
        return level0.get(this, "onemptied");
      }
      set onemptied(value) {
        level0.set(this, "onemptied", value);
      }
      get onended() {
        return level0.get(this, "onended");
      }
      set onended(value) {
        level0.set(this, "onended", value);
      }
      get onerror() {
        return level0.get(this, "onerror");
      }
      set onerror(value) {
        level0.set(this, "onerror", value);
      }
      get onfocus() {
        return level0.get(this, "onfocus");
      }
      set onfocus(value) {
        level0.set(this, "onfocus", value);
      }
      get oninput() {
        return level0.get(this, "oninput");
      }
      set oninput(value) {
        level0.set(this, "oninput", value);
      }
      get oninvalid() {
        return level0.get(this, "oninvalid");
      }
      set oninvalid(value) {
        level0.set(this, "oninvalid", value);
      }
      get onkeydown() {
        return level0.get(this, "onkeydown");
      }
      set onkeydown(value) {
        level0.set(this, "onkeydown", value);
      }
      get onkeypress() {
        return level0.get(this, "onkeypress");
      }
      set onkeypress(value) {
        level0.set(this, "onkeypress", value);
      }
      get onkeyup() {
        return level0.get(this, "onkeyup");
      }
      set onkeyup(value) {
        level0.set(this, "onkeyup", value);
      }
      get onload() {
        return level0.get(this, "onload");
      }
      set onload(value) {
        level0.set(this, "onload", value);
      }
      get onloadeddata() {
        return level0.get(this, "onloadeddata");
      }
      set onloadeddata(value) {
        level0.set(this, "onloadeddata", value);
      }
      get onloadedmetadata() {
        return level0.get(this, "onloadedmetadata");
      }
      set onloadedmetadata(value) {
        level0.set(this, "onloadedmetadata", value);
      }
      get onloadstart() {
        return level0.get(this, "onloadstart");
      }
      set onloadstart(value) {
        level0.set(this, "onloadstart", value);
      }
      get onmousedown() {
        return level0.get(this, "onmousedown");
      }
      set onmousedown(value) {
        level0.set(this, "onmousedown", value);
      }
      get onmouseenter() {
        return level0.get(this, "onmouseenter");
      }
      set onmouseenter(value) {
        level0.set(this, "onmouseenter", value);
      }
      get onmouseleave() {
        return level0.get(this, "onmouseleave");
      }
      set onmouseleave(value) {
        level0.set(this, "onmouseleave", value);
      }
      get onmousemove() {
        return level0.get(this, "onmousemove");
      }
      set onmousemove(value) {
        level0.set(this, "onmousemove", value);
      }
      get onmouseout() {
        return level0.get(this, "onmouseout");
      }
      set onmouseout(value) {
        level0.set(this, "onmouseout", value);
      }
      get onmouseover() {
        return level0.get(this, "onmouseover");
      }
      set onmouseover(value) {
        level0.set(this, "onmouseover", value);
      }
      get onmouseup() {
        return level0.get(this, "onmouseup");
      }
      set onmouseup(value) {
        level0.set(this, "onmouseup", value);
      }
      get onmousewheel() {
        return level0.get(this, "onmousewheel");
      }
      set onmousewheel(value) {
        level0.set(this, "onmousewheel", value);
      }
      get onpause() {
        return level0.get(this, "onpause");
      }
      set onpause(value) {
        level0.set(this, "onpause", value);
      }
      get onplay() {
        return level0.get(this, "onplay");
      }
      set onplay(value) {
        level0.set(this, "onplay", value);
      }
      get onplaying() {
        return level0.get(this, "onplaying");
      }
      set onplaying(value) {
        level0.set(this, "onplaying", value);
      }
      get onprogress() {
        return level0.get(this, "onprogress");
      }
      set onprogress(value) {
        level0.set(this, "onprogress", value);
      }
      get onratechange() {
        return level0.get(this, "onratechange");
      }
      set onratechange(value) {
        level0.set(this, "onratechange", value);
      }
      get onreset() {
        return level0.get(this, "onreset");
      }
      set onreset(value) {
        level0.set(this, "onreset", value);
      }
      get onresize() {
        return level0.get(this, "onresize");
      }
      set onresize(value) {
        level0.set(this, "onresize", value);
      }
      get onscroll() {
        return level0.get(this, "onscroll");
      }
      set onscroll(value) {
        level0.set(this, "onscroll", value);
      }
      get onseeked() {
        return level0.get(this, "onseeked");
      }
      set onseeked(value) {
        level0.set(this, "onseeked", value);
      }
      get onseeking() {
        return level0.get(this, "onseeking");
      }
      set onseeking(value) {
        level0.set(this, "onseeking", value);
      }
      get onselect() {
        return level0.get(this, "onselect");
      }
      set onselect(value) {
        level0.set(this, "onselect", value);
      }
      get onshow() {
        return level0.get(this, "onshow");
      }
      set onshow(value) {
        level0.set(this, "onshow", value);
      }
      get onstalled() {
        return level0.get(this, "onstalled");
      }
      set onstalled(value) {
        level0.set(this, "onstalled", value);
      }
      get onsubmit() {
        return level0.get(this, "onsubmit");
      }
      set onsubmit(value) {
        level0.set(this, "onsubmit", value);
      }
      get onsuspend() {
        return level0.get(this, "onsuspend");
      }
      set onsuspend(value) {
        level0.set(this, "onsuspend", value);
      }
      get ontimeupdate() {
        return level0.get(this, "ontimeupdate");
      }
      set ontimeupdate(value) {
        level0.set(this, "ontimeupdate", value);
      }
      get ontoggle() {
        return level0.get(this, "ontoggle");
      }
      set ontoggle(value) {
        level0.set(this, "ontoggle", value);
      }
      get onvolumechange() {
        return level0.get(this, "onvolumechange");
      }
      set onvolumechange(value) {
        level0.set(this, "onvolumechange", value);
      }
      get onwaiting() {
        return level0.get(this, "onwaiting");
      }
      set onwaiting(value) {
        level0.set(this, "onwaiting", value);
      }
      get onauxclick() {
        return level0.get(this, "onauxclick");
      }
      set onauxclick(value) {
        level0.set(this, "onauxclick", value);
      }
      get ongotpointercapture() {
        return level0.get(this, "ongotpointercapture");
      }
      set ongotpointercapture(value) {
        level0.set(this, "ongotpointercapture", value);
      }
      get onlostpointercapture() {
        return level0.get(this, "onlostpointercapture");
      }
      set onlostpointercapture(value) {
        level0.set(this, "onlostpointercapture", value);
      }
      get onpointercancel() {
        return level0.get(this, "onpointercancel");
      }
      set onpointercancel(value) {
        level0.set(this, "onpointercancel", value);
      }
      get onpointerdown() {
        return level0.get(this, "onpointerdown");
      }
      set onpointerdown(value) {
        level0.set(this, "onpointerdown", value);
      }
      get onpointerenter() {
        return level0.get(this, "onpointerenter");
      }
      set onpointerenter(value) {
        level0.set(this, "onpointerenter", value);
      }
      get onpointerleave() {
        return level0.get(this, "onpointerleave");
      }
      set onpointerleave(value) {
        level0.set(this, "onpointerleave", value);
      }
      get onpointermove() {
        return level0.get(this, "onpointermove");
      }
      set onpointermove(value) {
        level0.set(this, "onpointermove", value);
      }
      get onpointerout() {
        return level0.get(this, "onpointerout");
      }
      set onpointerout(value) {
        level0.set(this, "onpointerout", value);
      }
      get onpointerover() {
        return level0.get(this, "onpointerover");
      }
      set onpointerover(value) {
        level0.set(this, "onpointerover", value);
      }
      get onpointerup() {
        return level0.get(this, "onpointerup");
      }
      set onpointerup(value) {
        level0.set(this, "onpointerup", value);
      }
    };
    exports2.HTMLElement = HTMLElement;
  }
});

// node_modules/linkedom/cjs/html/template-element.js
var require_template_element = __commonJS({
  "node_modules/linkedom/cjs/html/template-element.js"(exports2) {
    "use strict";
    var { CONTENT, PRIVATE } = require_symbols();
    var { registerHTMLClass } = require_register_html_class();
    var { HTMLElement } = require_element3();
    var tagName = "template";
    var HTMLTemplateElement = class extends HTMLElement {
      constructor(ownerDocument) {
        super(ownerDocument, tagName);
        const content = this.ownerDocument.createDocumentFragment();
        (this[CONTENT] = content)[PRIVATE] = this;
      }
      get content() {
        if (this.hasChildNodes() && !this[CONTENT].hasChildNodes()) {
          for (const node of this.childNodes)
            this[CONTENT].appendChild(node.cloneNode(true));
        }
        return this[CONTENT];
      }
    };
    registerHTMLClass(tagName, HTMLTemplateElement);
    exports2.HTMLTemplateElement = HTMLTemplateElement;
  }
});

// node_modules/linkedom/cjs/html/html-element.js
var require_html_element = __commonJS({
  "node_modules/linkedom/cjs/html/html-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLHtmlElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "html") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLHtmlElement = HTMLHtmlElement;
  }
});

// node_modules/linkedom/cjs/html/text-element.js
var require_text_element = __commonJS({
  "node_modules/linkedom/cjs/html/text-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var { toString } = HTMLElement.prototype;
    var TextElement = class extends HTMLElement {
      get innerHTML() {
        return this.textContent;
      }
      set innerHTML(html) {
        this.textContent = html;
      }
      toString() {
        const outerHTML = toString.call(this.cloneNode());
        return outerHTML.replace(/></, `>${this.textContent}<`);
      }
    };
    exports2.TextElement = TextElement;
  }
});

// node_modules/linkedom/cjs/html/script-element.js
var require_script_element = __commonJS({
  "node_modules/linkedom/cjs/html/script-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { TextElement } = require_text_element();
    var tagName = "script";
    var HTMLScriptElement = class extends TextElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
    };
    registerHTMLClass(tagName, HTMLScriptElement);
    exports2.HTMLScriptElement = HTMLScriptElement;
  }
});

// node_modules/linkedom/cjs/html/frame-element.js
var require_frame_element = __commonJS({
  "node_modules/linkedom/cjs/html/frame-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLFrameElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "frame") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLFrameElement = HTMLFrameElement;
  }
});

// node_modules/linkedom/cjs/html/i-frame-element.js
var require_i_frame_element = __commonJS({
  "node_modules/linkedom/cjs/html/i-frame-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLIFrameElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "iframe") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLIFrameElement = HTMLIFrameElement;
  }
});

// node_modules/linkedom/cjs/html/object-element.js
var require_object_element = __commonJS({
  "node_modules/linkedom/cjs/html/object-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLObjectElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "object") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLObjectElement = HTMLObjectElement;
  }
});

// node_modules/linkedom/cjs/html/head-element.js
var require_head_element = __commonJS({
  "node_modules/linkedom/cjs/html/head-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLHeadElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "head") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLHeadElement = HTMLHeadElement;
  }
});

// node_modules/linkedom/cjs/html/body-element.js
var require_body_element = __commonJS({
  "node_modules/linkedom/cjs/html/body-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLBodyElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "body") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLBodyElement = HTMLBodyElement;
  }
});

// node_modules/cssom/lib/StyleSheet.js
var require_StyleSheet = __commonJS({
  "node_modules/cssom/lib/StyleSheet.js"(exports2) {
    var CSSOM = {};
    CSSOM.StyleSheet = function StyleSheet() {
      this.parentStyleSheet = null;
    };
    exports2.StyleSheet = CSSOM.StyleSheet;
  }
});

// node_modules/cssom/lib/CSSRule.js
var require_CSSRule = __commonJS({
  "node_modules/cssom/lib/CSSRule.js"(exports2) {
    var CSSOM = {};
    CSSOM.CSSRule = function CSSRule() {
      this.parentRule = null;
      this.parentStyleSheet = null;
    };
    CSSOM.CSSRule.UNKNOWN_RULE = 0;
    CSSOM.CSSRule.STYLE_RULE = 1;
    CSSOM.CSSRule.CHARSET_RULE = 2;
    CSSOM.CSSRule.IMPORT_RULE = 3;
    CSSOM.CSSRule.MEDIA_RULE = 4;
    CSSOM.CSSRule.FONT_FACE_RULE = 5;
    CSSOM.CSSRule.PAGE_RULE = 6;
    CSSOM.CSSRule.KEYFRAMES_RULE = 7;
    CSSOM.CSSRule.KEYFRAME_RULE = 8;
    CSSOM.CSSRule.MARGIN_RULE = 9;
    CSSOM.CSSRule.NAMESPACE_RULE = 10;
    CSSOM.CSSRule.COUNTER_STYLE_RULE = 11;
    CSSOM.CSSRule.SUPPORTS_RULE = 12;
    CSSOM.CSSRule.DOCUMENT_RULE = 13;
    CSSOM.CSSRule.FONT_FEATURE_VALUES_RULE = 14;
    CSSOM.CSSRule.VIEWPORT_RULE = 15;
    CSSOM.CSSRule.REGION_STYLE_RULE = 16;
    CSSOM.CSSRule.prototype = {
      constructor: CSSOM.CSSRule
    };
    exports2.CSSRule = CSSOM.CSSRule;
  }
});

// node_modules/cssom/lib/CSSStyleRule.js
var require_CSSStyleRule = __commonJS({
  "node_modules/cssom/lib/CSSStyleRule.js"(exports2) {
    var CSSOM = {
      CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
      CSSRule: require_CSSRule().CSSRule
    };
    CSSOM.CSSStyleRule = function CSSStyleRule() {
      CSSOM.CSSRule.call(this);
      this.selectorText = "";
      this.style = new CSSOM.CSSStyleDeclaration();
      this.style.parentRule = this;
    };
    CSSOM.CSSStyleRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSStyleRule.prototype.constructor = CSSOM.CSSStyleRule;
    CSSOM.CSSStyleRule.prototype.type = 1;
    Object.defineProperty(CSSOM.CSSStyleRule.prototype, "cssText", {
      get: function() {
        var text;
        if (this.selectorText) {
          text = this.selectorText + " {" + this.style.cssText + "}";
        } else {
          text = "";
        }
        return text;
      },
      set: function(cssText) {
        var rule = CSSOM.CSSStyleRule.parse(cssText);
        this.style = rule.style;
        this.selectorText = rule.selectorText;
      }
    });
    CSSOM.CSSStyleRule.parse = function(ruleText) {
      var i = 0;
      var state = "selector";
      var index;
      var j = i;
      var buffer = "";
      var SIGNIFICANT_WHITESPACE = {
        "selector": true,
        "value": true
      };
      var styleRule = new CSSOM.CSSStyleRule();
      var name, priority = "";
      for (var character; character = ruleText.charAt(i); i++) {
        switch (character) {
          case " ":
          case "	":
          case "\r":
          case "\n":
          case "\f":
            if (SIGNIFICANT_WHITESPACE[state]) {
              switch (ruleText.charAt(i - 1)) {
                case " ":
                case "	":
                case "\r":
                case "\n":
                case "\f":
                  break;
                default:
                  buffer += " ";
                  break;
              }
            }
            break;
          case '"':
            j = i + 1;
            index = ruleText.indexOf('"', j) + 1;
            if (!index) {
              throw '" is missing';
            }
            buffer += ruleText.slice(i, index);
            i = index - 1;
            break;
          case "'":
            j = i + 1;
            index = ruleText.indexOf("'", j) + 1;
            if (!index) {
              throw "' is missing";
            }
            buffer += ruleText.slice(i, index);
            i = index - 1;
            break;
          case "/":
            if (ruleText.charAt(i + 1) === "*") {
              i += 2;
              index = ruleText.indexOf("*/", i);
              if (index === -1) {
                throw new SyntaxError("Missing */");
              } else {
                i = index + 1;
              }
            } else {
              buffer += character;
            }
            break;
          case "{":
            if (state === "selector") {
              styleRule.selectorText = buffer.trim();
              buffer = "";
              state = "name";
            }
            break;
          case ":":
            if (state === "name") {
              name = buffer.trim();
              buffer = "";
              state = "value";
            } else {
              buffer += character;
            }
            break;
          case "!":
            if (state === "value" && ruleText.indexOf("!important", i) === i) {
              priority = "important";
              i += "important".length;
            } else {
              buffer += character;
            }
            break;
          case ";":
            if (state === "value") {
              styleRule.style.setProperty(name, buffer.trim(), priority);
              priority = "";
              buffer = "";
              state = "name";
            } else {
              buffer += character;
            }
            break;
          case "}":
            if (state === "value") {
              styleRule.style.setProperty(name, buffer.trim(), priority);
              priority = "";
              buffer = "";
            } else if (state === "name") {
              break;
            } else {
              buffer += character;
            }
            state = "selector";
            break;
          default:
            buffer += character;
            break;
        }
      }
      return styleRule;
    };
    exports2.CSSStyleRule = CSSOM.CSSStyleRule;
  }
});

// node_modules/cssom/lib/CSSStyleSheet.js
var require_CSSStyleSheet = __commonJS({
  "node_modules/cssom/lib/CSSStyleSheet.js"(exports2) {
    var CSSOM = {
      StyleSheet: require_StyleSheet().StyleSheet,
      CSSStyleRule: require_CSSStyleRule().CSSStyleRule
    };
    CSSOM.CSSStyleSheet = function CSSStyleSheet() {
      CSSOM.StyleSheet.call(this);
      this.cssRules = [];
    };
    CSSOM.CSSStyleSheet.prototype = new CSSOM.StyleSheet();
    CSSOM.CSSStyleSheet.prototype.constructor = CSSOM.CSSStyleSheet;
    CSSOM.CSSStyleSheet.prototype.insertRule = function(rule, index) {
      if (index < 0 || index > this.cssRules.length) {
        throw new RangeError("INDEX_SIZE_ERR");
      }
      var cssRule = CSSOM.parse(rule).cssRules[0];
      cssRule.parentStyleSheet = this;
      this.cssRules.splice(index, 0, cssRule);
      return index;
    };
    CSSOM.CSSStyleSheet.prototype.deleteRule = function(index) {
      if (index < 0 || index >= this.cssRules.length) {
        throw new RangeError("INDEX_SIZE_ERR");
      }
      this.cssRules.splice(index, 1);
    };
    CSSOM.CSSStyleSheet.prototype.toString = function() {
      var result = "";
      var rules = this.cssRules;
      for (var i = 0; i < rules.length; i++) {
        result += rules[i].cssText + "\n";
      }
      return result;
    };
    exports2.CSSStyleSheet = CSSOM.CSSStyleSheet;
    CSSOM.parse = require_parse3().parse;
  }
});

// node_modules/cssom/lib/MediaList.js
var require_MediaList = __commonJS({
  "node_modules/cssom/lib/MediaList.js"(exports2) {
    var CSSOM = {};
    CSSOM.MediaList = function MediaList() {
      this.length = 0;
    };
    CSSOM.MediaList.prototype = {
      constructor: CSSOM.MediaList,
      get mediaText() {
        return Array.prototype.join.call(this, ", ");
      },
      set mediaText(value) {
        var values = value.split(",");
        var length = this.length = values.length;
        for (var i = 0; i < length; i++) {
          this[i] = values[i].trim();
        }
      },
      appendMedium: function(medium) {
        if (Array.prototype.indexOf.call(this, medium) === -1) {
          this[this.length] = medium;
          this.length++;
        }
      },
      deleteMedium: function(medium) {
        var index = Array.prototype.indexOf.call(this, medium);
        if (index !== -1) {
          Array.prototype.splice.call(this, index, 1);
        }
      }
    };
    exports2.MediaList = CSSOM.MediaList;
  }
});

// node_modules/cssom/lib/CSSImportRule.js
var require_CSSImportRule = __commonJS({
  "node_modules/cssom/lib/CSSImportRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule,
      CSSStyleSheet: require_CSSStyleSheet().CSSStyleSheet,
      MediaList: require_MediaList().MediaList
    };
    CSSOM.CSSImportRule = function CSSImportRule() {
      CSSOM.CSSRule.call(this);
      this.href = "";
      this.media = new CSSOM.MediaList();
      this.styleSheet = new CSSOM.CSSStyleSheet();
    };
    CSSOM.CSSImportRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSImportRule.prototype.constructor = CSSOM.CSSImportRule;
    CSSOM.CSSImportRule.prototype.type = 3;
    Object.defineProperty(CSSOM.CSSImportRule.prototype, "cssText", {
      get: function() {
        var mediaText = this.media.mediaText;
        return "@import url(" + this.href + ")" + (mediaText ? " " + mediaText : "") + ";";
      },
      set: function(cssText) {
        var i = 0;
        var state = "";
        var buffer = "";
        var index;
        for (var character; character = cssText.charAt(i); i++) {
          switch (character) {
            case " ":
            case "	":
            case "\r":
            case "\n":
            case "\f":
              if (state === "after-import") {
                state = "url";
              } else {
                buffer += character;
              }
              break;
            case "@":
              if (!state && cssText.indexOf("@import", i) === i) {
                state = "after-import";
                i += "import".length;
                buffer = "";
              }
              break;
            case "u":
              if (state === "url" && cssText.indexOf("url(", i) === i) {
                index = cssText.indexOf(")", i + 1);
                if (index === -1) {
                  throw i + ': ")" not found';
                }
                i += "url(".length;
                var url = cssText.slice(i, index);
                if (url[0] === url[url.length - 1]) {
                  if (url[0] === '"' || url[0] === "'") {
                    url = url.slice(1, -1);
                  }
                }
                this.href = url;
                i = index;
                state = "media";
              }
              break;
            case '"':
              if (state === "url") {
                index = cssText.indexOf('"', i + 1);
                if (!index) {
                  throw i + `: '"' not found`;
                }
                this.href = cssText.slice(i + 1, index);
                i = index;
                state = "media";
              }
              break;
            case "'":
              if (state === "url") {
                index = cssText.indexOf("'", i + 1);
                if (!index) {
                  throw i + `: "'" not found`;
                }
                this.href = cssText.slice(i + 1, index);
                i = index;
                state = "media";
              }
              break;
            case ";":
              if (state === "media") {
                if (buffer) {
                  this.media.mediaText = buffer.trim();
                }
              }
              break;
            default:
              if (state === "media") {
                buffer += character;
              }
              break;
          }
        }
      }
    });
    exports2.CSSImportRule = CSSOM.CSSImportRule;
  }
});

// node_modules/cssom/lib/CSSGroupingRule.js
var require_CSSGroupingRule = __commonJS({
  "node_modules/cssom/lib/CSSGroupingRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule
    };
    CSSOM.CSSGroupingRule = function CSSGroupingRule() {
      CSSOM.CSSRule.call(this);
      this.cssRules = [];
    };
    CSSOM.CSSGroupingRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSGroupingRule.prototype.constructor = CSSOM.CSSGroupingRule;
    CSSOM.CSSGroupingRule.prototype.insertRule = function insertRule(rule, index) {
      if (index < 0 || index > this.cssRules.length) {
        throw new RangeError("INDEX_SIZE_ERR");
      }
      var cssRule = CSSOM.parse(rule).cssRules[0];
      cssRule.parentRule = this;
      this.cssRules.splice(index, 0, cssRule);
      return index;
    };
    CSSOM.CSSGroupingRule.prototype.deleteRule = function deleteRule(index) {
      if (index < 0 || index >= this.cssRules.length) {
        throw new RangeError("INDEX_SIZE_ERR");
      }
      this.cssRules.splice(index, 1)[0].parentRule = null;
    };
    exports2.CSSGroupingRule = CSSOM.CSSGroupingRule;
  }
});

// node_modules/cssom/lib/CSSConditionRule.js
var require_CSSConditionRule = __commonJS({
  "node_modules/cssom/lib/CSSConditionRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule,
      CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule
    };
    CSSOM.CSSConditionRule = function CSSConditionRule() {
      CSSOM.CSSGroupingRule.call(this);
      this.cssRules = [];
    };
    CSSOM.CSSConditionRule.prototype = new CSSOM.CSSGroupingRule();
    CSSOM.CSSConditionRule.prototype.constructor = CSSOM.CSSConditionRule;
    CSSOM.CSSConditionRule.prototype.conditionText = "";
    CSSOM.CSSConditionRule.prototype.cssText = "";
    exports2.CSSConditionRule = CSSOM.CSSConditionRule;
  }
});

// node_modules/cssom/lib/CSSMediaRule.js
var require_CSSMediaRule = __commonJS({
  "node_modules/cssom/lib/CSSMediaRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule,
      CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
      CSSConditionRule: require_CSSConditionRule().CSSConditionRule,
      MediaList: require_MediaList().MediaList
    };
    CSSOM.CSSMediaRule = function CSSMediaRule() {
      CSSOM.CSSConditionRule.call(this);
      this.media = new CSSOM.MediaList();
    };
    CSSOM.CSSMediaRule.prototype = new CSSOM.CSSConditionRule();
    CSSOM.CSSMediaRule.prototype.constructor = CSSOM.CSSMediaRule;
    CSSOM.CSSMediaRule.prototype.type = 4;
    Object.defineProperties(CSSOM.CSSMediaRule.prototype, {
      "conditionText": {
        get: function() {
          return this.media.mediaText;
        },
        set: function(value) {
          this.media.mediaText = value;
        },
        configurable: true,
        enumerable: true
      },
      "cssText": {
        get: function() {
          var cssTexts = [];
          for (var i = 0, length = this.cssRules.length; i < length; i++) {
            cssTexts.push(this.cssRules[i].cssText);
          }
          return "@media " + this.media.mediaText + " {" + cssTexts.join("") + "}";
        },
        configurable: true,
        enumerable: true
      }
    });
    exports2.CSSMediaRule = CSSOM.CSSMediaRule;
  }
});

// node_modules/cssom/lib/CSSSupportsRule.js
var require_CSSSupportsRule = __commonJS({
  "node_modules/cssom/lib/CSSSupportsRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule,
      CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
      CSSConditionRule: require_CSSConditionRule().CSSConditionRule
    };
    CSSOM.CSSSupportsRule = function CSSSupportsRule() {
      CSSOM.CSSConditionRule.call(this);
    };
    CSSOM.CSSSupportsRule.prototype = new CSSOM.CSSConditionRule();
    CSSOM.CSSSupportsRule.prototype.constructor = CSSOM.CSSSupportsRule;
    CSSOM.CSSSupportsRule.prototype.type = 12;
    Object.defineProperty(CSSOM.CSSSupportsRule.prototype, "cssText", {
      get: function() {
        var cssTexts = [];
        for (var i = 0, length = this.cssRules.length; i < length; i++) {
          cssTexts.push(this.cssRules[i].cssText);
        }
        return "@supports " + this.conditionText + " {" + cssTexts.join("") + "}";
      }
    });
    exports2.CSSSupportsRule = CSSOM.CSSSupportsRule;
  }
});

// node_modules/cssom/lib/CSSFontFaceRule.js
var require_CSSFontFaceRule = __commonJS({
  "node_modules/cssom/lib/CSSFontFaceRule.js"(exports2) {
    var CSSOM = {
      CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
      CSSRule: require_CSSRule().CSSRule
    };
    CSSOM.CSSFontFaceRule = function CSSFontFaceRule() {
      CSSOM.CSSRule.call(this);
      this.style = new CSSOM.CSSStyleDeclaration();
      this.style.parentRule = this;
    };
    CSSOM.CSSFontFaceRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSFontFaceRule.prototype.constructor = CSSOM.CSSFontFaceRule;
    CSSOM.CSSFontFaceRule.prototype.type = 5;
    Object.defineProperty(CSSOM.CSSFontFaceRule.prototype, "cssText", {
      get: function() {
        return "@font-face {" + this.style.cssText + "}";
      }
    });
    exports2.CSSFontFaceRule = CSSOM.CSSFontFaceRule;
  }
});

// node_modules/cssom/lib/CSSHostRule.js
var require_CSSHostRule = __commonJS({
  "node_modules/cssom/lib/CSSHostRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule
    };
    CSSOM.CSSHostRule = function CSSHostRule() {
      CSSOM.CSSRule.call(this);
      this.cssRules = [];
    };
    CSSOM.CSSHostRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSHostRule.prototype.constructor = CSSOM.CSSHostRule;
    CSSOM.CSSHostRule.prototype.type = 1001;
    Object.defineProperty(CSSOM.CSSHostRule.prototype, "cssText", {
      get: function() {
        var cssTexts = [];
        for (var i = 0, length = this.cssRules.length; i < length; i++) {
          cssTexts.push(this.cssRules[i].cssText);
        }
        return "@host {" + cssTexts.join("") + "}";
      }
    });
    exports2.CSSHostRule = CSSOM.CSSHostRule;
  }
});

// node_modules/cssom/lib/CSSKeyframeRule.js
var require_CSSKeyframeRule = __commonJS({
  "node_modules/cssom/lib/CSSKeyframeRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule,
      CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration
    };
    CSSOM.CSSKeyframeRule = function CSSKeyframeRule() {
      CSSOM.CSSRule.call(this);
      this.keyText = "";
      this.style = new CSSOM.CSSStyleDeclaration();
      this.style.parentRule = this;
    };
    CSSOM.CSSKeyframeRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSKeyframeRule.prototype.constructor = CSSOM.CSSKeyframeRule;
    CSSOM.CSSKeyframeRule.prototype.type = 8;
    Object.defineProperty(CSSOM.CSSKeyframeRule.prototype, "cssText", {
      get: function() {
        return this.keyText + " {" + this.style.cssText + "} ";
      }
    });
    exports2.CSSKeyframeRule = CSSOM.CSSKeyframeRule;
  }
});

// node_modules/cssom/lib/CSSKeyframesRule.js
var require_CSSKeyframesRule = __commonJS({
  "node_modules/cssom/lib/CSSKeyframesRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule
    };
    CSSOM.CSSKeyframesRule = function CSSKeyframesRule() {
      CSSOM.CSSRule.call(this);
      this.name = "";
      this.cssRules = [];
    };
    CSSOM.CSSKeyframesRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSKeyframesRule.prototype.constructor = CSSOM.CSSKeyframesRule;
    CSSOM.CSSKeyframesRule.prototype.type = 7;
    Object.defineProperty(CSSOM.CSSKeyframesRule.prototype, "cssText", {
      get: function() {
        var cssTexts = [];
        for (var i = 0, length = this.cssRules.length; i < length; i++) {
          cssTexts.push("  " + this.cssRules[i].cssText);
        }
        return "@" + (this._vendorPrefix || "") + "keyframes " + this.name + " { \n" + cssTexts.join("\n") + "\n}";
      }
    });
    exports2.CSSKeyframesRule = CSSOM.CSSKeyframesRule;
  }
});

// node_modules/cssom/lib/CSSValue.js
var require_CSSValue = __commonJS({
  "node_modules/cssom/lib/CSSValue.js"(exports2) {
    var CSSOM = {};
    CSSOM.CSSValue = function CSSValue() {
    };
    CSSOM.CSSValue.prototype = {
      constructor: CSSOM.CSSValue,
      set cssText(text) {
        var name = this._getConstructorName();
        throw new Error('DOMException: property "cssText" of "' + name + '" is readonly and can not be replaced with "' + text + '"!');
      },
      get cssText() {
        var name = this._getConstructorName();
        throw new Error('getter "cssText" of "' + name + '" is not implemented!');
      },
      _getConstructorName: function() {
        var s = this.constructor.toString(), c = s.match(/function\s([^\(]+)/), name = c[1];
        return name;
      }
    };
    exports2.CSSValue = CSSOM.CSSValue;
  }
});

// node_modules/cssom/lib/CSSValueExpression.js
var require_CSSValueExpression = __commonJS({
  "node_modules/cssom/lib/CSSValueExpression.js"(exports2) {
    var CSSOM = {
      CSSValue: require_CSSValue().CSSValue
    };
    CSSOM.CSSValueExpression = function CSSValueExpression(token, idx) {
      this._token = token;
      this._idx = idx;
    };
    CSSOM.CSSValueExpression.prototype = new CSSOM.CSSValue();
    CSSOM.CSSValueExpression.prototype.constructor = CSSOM.CSSValueExpression;
    CSSOM.CSSValueExpression.prototype.parse = function() {
      var token = this._token, idx = this._idx;
      var character = "", expression = "", error = "", info, paren = [];
      for (; ; ++idx) {
        character = token.charAt(idx);
        if (character === "") {
          error = "css expression error: unfinished expression!";
          break;
        }
        switch (character) {
          case "(":
            paren.push(character);
            expression += character;
            break;
          case ")":
            paren.pop(character);
            expression += character;
            break;
          case "/":
            if (info = this._parseJSComment(token, idx)) {
              if (info.error) {
                error = "css expression error: unfinished comment in expression!";
              } else {
                idx = info.idx;
              }
            } else if (info = this._parseJSRexExp(token, idx)) {
              idx = info.idx;
              expression += info.text;
            } else {
              expression += character;
            }
            break;
          case "'":
          case '"':
            info = this._parseJSString(token, idx, character);
            if (info) {
              idx = info.idx;
              expression += info.text;
            } else {
              expression += character;
            }
            break;
          default:
            expression += character;
            break;
        }
        if (error) {
          break;
        }
        if (paren.length === 0) {
          break;
        }
      }
      var ret;
      if (error) {
        ret = {
          error
        };
      } else {
        ret = {
          idx,
          expression
        };
      }
      return ret;
    };
    CSSOM.CSSValueExpression.prototype._parseJSComment = function(token, idx) {
      var nextChar = token.charAt(idx + 1), text;
      if (nextChar === "/" || nextChar === "*") {
        var startIdx = idx, endIdx, commentEndChar;
        if (nextChar === "/") {
          commentEndChar = "\n";
        } else if (nextChar === "*") {
          commentEndChar = "*/";
        }
        endIdx = token.indexOf(commentEndChar, startIdx + 1 + 1);
        if (endIdx !== -1) {
          endIdx = endIdx + commentEndChar.length - 1;
          text = token.substring(idx, endIdx + 1);
          return {
            idx: endIdx,
            text
          };
        } else {
          var error = "css expression error: unfinished comment in expression!";
          return {
            error
          };
        }
      } else {
        return false;
      }
    };
    CSSOM.CSSValueExpression.prototype._parseJSString = function(token, idx, sep) {
      var endIdx = this._findMatchedIdx(token, idx, sep), text;
      if (endIdx === -1) {
        return false;
      } else {
        text = token.substring(idx, endIdx + sep.length);
        return {
          idx: endIdx,
          text
        };
      }
    };
    CSSOM.CSSValueExpression.prototype._parseJSRexExp = function(token, idx) {
      var before = token.substring(0, idx).replace(/\s+$/, ""), legalRegx = [
        /^$/,
        /\($/,
        /\[$/,
        /\!$/,
        /\+$/,
        /\-$/,
        /\*$/,
        /\/\s+/,
        /\%$/,
        /\=$/,
        /\>$/,
        /<$/,
        /\&$/,
        /\|$/,
        /\^$/,
        /\~$/,
        /\?$/,
        /\,$/,
        /delete$/,
        /in$/,
        /instanceof$/,
        /new$/,
        /typeof$/,
        /void$/
      ];
      var isLegal = legalRegx.some(function(reg) {
        return reg.test(before);
      });
      if (!isLegal) {
        return false;
      } else {
        var sep = "/";
        return this._parseJSString(token, idx, sep);
      }
    };
    CSSOM.CSSValueExpression.prototype._findMatchedIdx = function(token, idx, sep) {
      var startIdx = idx, endIdx;
      var NOT_FOUND = -1;
      while (true) {
        endIdx = token.indexOf(sep, startIdx + 1);
        if (endIdx === -1) {
          endIdx = NOT_FOUND;
          break;
        } else {
          var text = token.substring(idx + 1, endIdx), matched = text.match(/\\+$/);
          if (!matched || matched[0] % 2 === 0) {
            break;
          } else {
            startIdx = endIdx;
          }
        }
      }
      var nextNewLineIdx = token.indexOf("\n", idx + 1);
      if (nextNewLineIdx < endIdx) {
        endIdx = NOT_FOUND;
      }
      return endIdx;
    };
    exports2.CSSValueExpression = CSSOM.CSSValueExpression;
  }
});

// node_modules/cssom/lib/MatcherList.js
var require_MatcherList = __commonJS({
  "node_modules/cssom/lib/MatcherList.js"(exports2) {
    var CSSOM = {};
    CSSOM.MatcherList = function MatcherList() {
      this.length = 0;
    };
    CSSOM.MatcherList.prototype = {
      constructor: CSSOM.MatcherList,
      get matcherText() {
        return Array.prototype.join.call(this, ", ");
      },
      set matcherText(value) {
        var values = value.split(",");
        var length = this.length = values.length;
        for (var i = 0; i < length; i++) {
          this[i] = values[i].trim();
        }
      },
      appendMatcher: function(matcher) {
        if (Array.prototype.indexOf.call(this, matcher) === -1) {
          this[this.length] = matcher;
          this.length++;
        }
      },
      deleteMatcher: function(matcher) {
        var index = Array.prototype.indexOf.call(this, matcher);
        if (index !== -1) {
          Array.prototype.splice.call(this, index, 1);
        }
      }
    };
    exports2.MatcherList = CSSOM.MatcherList;
  }
});

// node_modules/cssom/lib/CSSDocumentRule.js
var require_CSSDocumentRule = __commonJS({
  "node_modules/cssom/lib/CSSDocumentRule.js"(exports2) {
    var CSSOM = {
      CSSRule: require_CSSRule().CSSRule,
      MatcherList: require_MatcherList().MatcherList
    };
    CSSOM.CSSDocumentRule = function CSSDocumentRule() {
      CSSOM.CSSRule.call(this);
      this.matcher = new CSSOM.MatcherList();
      this.cssRules = [];
    };
    CSSOM.CSSDocumentRule.prototype = new CSSOM.CSSRule();
    CSSOM.CSSDocumentRule.prototype.constructor = CSSOM.CSSDocumentRule;
    CSSOM.CSSDocumentRule.prototype.type = 10;
    Object.defineProperty(CSSOM.CSSDocumentRule.prototype, "cssText", {
      get: function() {
        var cssTexts = [];
        for (var i = 0, length = this.cssRules.length; i < length; i++) {
          cssTexts.push(this.cssRules[i].cssText);
        }
        return "@-moz-document " + this.matcher.matcherText + " {" + cssTexts.join("") + "}";
      }
    });
    exports2.CSSDocumentRule = CSSOM.CSSDocumentRule;
  }
});

// node_modules/cssom/lib/parse.js
var require_parse3 = __commonJS({
  "node_modules/cssom/lib/parse.js"(exports2) {
    var CSSOM = {};
    CSSOM.parse = function parse(token) {
      var i = 0;
      var state = "before-selector";
      var index;
      var buffer = "";
      var valueParenthesisDepth = 0;
      var SIGNIFICANT_WHITESPACE = {
        "selector": true,
        "value": true,
        "value-parenthesis": true,
        "atRule": true,
        "importRule-begin": true,
        "importRule": true,
        "atBlock": true,
        "conditionBlock": true,
        "documentRule-begin": true
      };
      var styleSheet = new CSSOM.CSSStyleSheet();
      var currentScope = styleSheet;
      var parentRule;
      var ancestorRules = [];
      var hasAncestors = false;
      var prevScope;
      var name, priority = "", styleRule, mediaRule, supportsRule, importRule, fontFaceRule, keyframesRule, documentRule, hostRule;
      var atKeyframesRegExp = /@(-(?:\w+-)+)?keyframes/g;
      var parseError = function(message) {
        var lines = token.substring(0, i).split("\n");
        var lineCount = lines.length;
        var charCount = lines.pop().length + 1;
        var error = new Error(message + " (line " + lineCount + ", char " + charCount + ")");
        error.line = lineCount;
        error["char"] = charCount;
        error.styleSheet = styleSheet;
        throw error;
      };
      for (var character; character = token.charAt(i); i++) {
        switch (character) {
          case " ":
          case "	":
          case "\r":
          case "\n":
          case "\f":
            if (SIGNIFICANT_WHITESPACE[state]) {
              buffer += character;
            }
            break;
          case '"':
            index = i + 1;
            do {
              index = token.indexOf('"', index) + 1;
              if (!index) {
                parseError('Unmatched "');
              }
            } while (token[index - 2] === "\\");
            buffer += token.slice(i, index);
            i = index - 1;
            switch (state) {
              case "before-value":
                state = "value";
                break;
              case "importRule-begin":
                state = "importRule";
                break;
            }
            break;
          case "'":
            index = i + 1;
            do {
              index = token.indexOf("'", index) + 1;
              if (!index) {
                parseError("Unmatched '");
              }
            } while (token[index - 2] === "\\");
            buffer += token.slice(i, index);
            i = index - 1;
            switch (state) {
              case "before-value":
                state = "value";
                break;
              case "importRule-begin":
                state = "importRule";
                break;
            }
            break;
          case "/":
            if (token.charAt(i + 1) === "*") {
              i += 2;
              index = token.indexOf("*/", i);
              if (index === -1) {
                parseError("Missing */");
              } else {
                i = index + 1;
              }
            } else {
              buffer += character;
            }
            if (state === "importRule-begin") {
              buffer += " ";
              state = "importRule";
            }
            break;
          case "@":
            if (token.indexOf("@-moz-document", i) === i) {
              state = "documentRule-begin";
              documentRule = new CSSOM.CSSDocumentRule();
              documentRule.__starts = i;
              i += "-moz-document".length;
              buffer = "";
              break;
            } else if (token.indexOf("@media", i) === i) {
              state = "atBlock";
              mediaRule = new CSSOM.CSSMediaRule();
              mediaRule.__starts = i;
              i += "media".length;
              buffer = "";
              break;
            } else if (token.indexOf("@supports", i) === i) {
              state = "conditionBlock";
              supportsRule = new CSSOM.CSSSupportsRule();
              supportsRule.__starts = i;
              i += "supports".length;
              buffer = "";
              break;
            } else if (token.indexOf("@host", i) === i) {
              state = "hostRule-begin";
              i += "host".length;
              hostRule = new CSSOM.CSSHostRule();
              hostRule.__starts = i;
              buffer = "";
              break;
            } else if (token.indexOf("@import", i) === i) {
              state = "importRule-begin";
              i += "import".length;
              buffer += "@import";
              break;
            } else if (token.indexOf("@font-face", i) === i) {
              state = "fontFaceRule-begin";
              i += "font-face".length;
              fontFaceRule = new CSSOM.CSSFontFaceRule();
              fontFaceRule.__starts = i;
              buffer = "";
              break;
            } else {
              atKeyframesRegExp.lastIndex = i;
              var matchKeyframes = atKeyframesRegExp.exec(token);
              if (matchKeyframes && matchKeyframes.index === i) {
                state = "keyframesRule-begin";
                keyframesRule = new CSSOM.CSSKeyframesRule();
                keyframesRule.__starts = i;
                keyframesRule._vendorPrefix = matchKeyframes[1];
                i += matchKeyframes[0].length - 1;
                buffer = "";
                break;
              } else if (state === "selector") {
                state = "atRule";
              }
            }
            buffer += character;
            break;
          case "{":
            if (state === "selector" || state === "atRule") {
              styleRule.selectorText = buffer.trim();
              styleRule.style.__starts = i;
              buffer = "";
              state = "before-name";
            } else if (state === "atBlock") {
              mediaRule.media.mediaText = buffer.trim();
              if (parentRule) {
                ancestorRules.push(parentRule);
              }
              currentScope = parentRule = mediaRule;
              mediaRule.parentStyleSheet = styleSheet;
              buffer = "";
              state = "before-selector";
            } else if (state === "conditionBlock") {
              supportsRule.conditionText = buffer.trim();
              if (parentRule) {
                ancestorRules.push(parentRule);
              }
              currentScope = parentRule = supportsRule;
              supportsRule.parentStyleSheet = styleSheet;
              buffer = "";
              state = "before-selector";
            } else if (state === "hostRule-begin") {
              if (parentRule) {
                ancestorRules.push(parentRule);
              }
              currentScope = parentRule = hostRule;
              hostRule.parentStyleSheet = styleSheet;
              buffer = "";
              state = "before-selector";
            } else if (state === "fontFaceRule-begin") {
              if (parentRule) {
                fontFaceRule.parentRule = parentRule;
              }
              fontFaceRule.parentStyleSheet = styleSheet;
              styleRule = fontFaceRule;
              buffer = "";
              state = "before-name";
            } else if (state === "keyframesRule-begin") {
              keyframesRule.name = buffer.trim();
              if (parentRule) {
                ancestorRules.push(parentRule);
                keyframesRule.parentRule = parentRule;
              }
              keyframesRule.parentStyleSheet = styleSheet;
              currentScope = parentRule = keyframesRule;
              buffer = "";
              state = "keyframeRule-begin";
            } else if (state === "keyframeRule-begin") {
              styleRule = new CSSOM.CSSKeyframeRule();
              styleRule.keyText = buffer.trim();
              styleRule.__starts = i;
              buffer = "";
              state = "before-name";
            } else if (state === "documentRule-begin") {
              documentRule.matcher.matcherText = buffer.trim();
              if (parentRule) {
                ancestorRules.push(parentRule);
                documentRule.parentRule = parentRule;
              }
              currentScope = parentRule = documentRule;
              documentRule.parentStyleSheet = styleSheet;
              buffer = "";
              state = "before-selector";
            }
            break;
          case ":":
            if (state === "name") {
              name = buffer.trim();
              buffer = "";
              state = "before-value";
            } else {
              buffer += character;
            }
            break;
          case "(":
            if (state === "value") {
              if (buffer.trim() === "expression") {
                var info = new CSSOM.CSSValueExpression(token, i).parse();
                if (info.error) {
                  parseError(info.error);
                } else {
                  buffer += info.expression;
                  i = info.idx;
                }
              } else {
                state = "value-parenthesis";
                valueParenthesisDepth = 1;
                buffer += character;
              }
            } else if (state === "value-parenthesis") {
              valueParenthesisDepth++;
              buffer += character;
            } else {
              buffer += character;
            }
            break;
          case ")":
            if (state === "value-parenthesis") {
              valueParenthesisDepth--;
              if (valueParenthesisDepth === 0)
                state = "value";
            }
            buffer += character;
            break;
          case "!":
            if (state === "value" && token.indexOf("!important", i) === i) {
              priority = "important";
              i += "important".length;
            } else {
              buffer += character;
            }
            break;
          case ";":
            switch (state) {
              case "value":
                styleRule.style.setProperty(name, buffer.trim(), priority);
                priority = "";
                buffer = "";
                state = "before-name";
                break;
              case "atRule":
                buffer = "";
                state = "before-selector";
                break;
              case "importRule":
                importRule = new CSSOM.CSSImportRule();
                importRule.parentStyleSheet = importRule.styleSheet.parentStyleSheet = styleSheet;
                importRule.cssText = buffer + character;
                styleSheet.cssRules.push(importRule);
                buffer = "";
                state = "before-selector";
                break;
              default:
                buffer += character;
                break;
            }
            break;
          case "}":
            switch (state) {
              case "value":
                styleRule.style.setProperty(name, buffer.trim(), priority);
                priority = "";
              case "before-name":
              case "name":
                styleRule.__ends = i + 1;
                if (parentRule) {
                  styleRule.parentRule = parentRule;
                }
                styleRule.parentStyleSheet = styleSheet;
                currentScope.cssRules.push(styleRule);
                buffer = "";
                if (currentScope.constructor === CSSOM.CSSKeyframesRule) {
                  state = "keyframeRule-begin";
                } else {
                  state = "before-selector";
                }
                break;
              case "keyframeRule-begin":
              case "before-selector":
              case "selector":
                if (!parentRule) {
                  parseError("Unexpected }");
                }
                hasAncestors = ancestorRules.length > 0;
                while (ancestorRules.length > 0) {
                  parentRule = ancestorRules.pop();
                  if (parentRule.constructor.name === "CSSMediaRule" || parentRule.constructor.name === "CSSSupportsRule") {
                    prevScope = currentScope;
                    currentScope = parentRule;
                    currentScope.cssRules.push(prevScope);
                    break;
                  }
                  if (ancestorRules.length === 0) {
                    hasAncestors = false;
                  }
                }
                if (!hasAncestors) {
                  currentScope.__ends = i + 1;
                  styleSheet.cssRules.push(currentScope);
                  currentScope = styleSheet;
                  parentRule = null;
                }
                buffer = "";
                state = "before-selector";
                break;
            }
            break;
          default:
            switch (state) {
              case "before-selector":
                state = "selector";
                styleRule = new CSSOM.CSSStyleRule();
                styleRule.__starts = i;
                break;
              case "before-name":
                state = "name";
                break;
              case "before-value":
                state = "value";
                break;
              case "importRule-begin":
                state = "importRule";
                break;
            }
            buffer += character;
            break;
        }
      }
      return styleSheet;
    };
    exports2.parse = CSSOM.parse;
    CSSOM.CSSStyleSheet = require_CSSStyleSheet().CSSStyleSheet;
    CSSOM.CSSStyleRule = require_CSSStyleRule().CSSStyleRule;
    CSSOM.CSSImportRule = require_CSSImportRule().CSSImportRule;
    CSSOM.CSSGroupingRule = require_CSSGroupingRule().CSSGroupingRule;
    CSSOM.CSSMediaRule = require_CSSMediaRule().CSSMediaRule;
    CSSOM.CSSConditionRule = require_CSSConditionRule().CSSConditionRule;
    CSSOM.CSSSupportsRule = require_CSSSupportsRule().CSSSupportsRule;
    CSSOM.CSSFontFaceRule = require_CSSFontFaceRule().CSSFontFaceRule;
    CSSOM.CSSHostRule = require_CSSHostRule().CSSHostRule;
    CSSOM.CSSStyleDeclaration = require_CSSStyleDeclaration().CSSStyleDeclaration;
    CSSOM.CSSKeyframeRule = require_CSSKeyframeRule().CSSKeyframeRule;
    CSSOM.CSSKeyframesRule = require_CSSKeyframesRule().CSSKeyframesRule;
    CSSOM.CSSValueExpression = require_CSSValueExpression().CSSValueExpression;
    CSSOM.CSSDocumentRule = require_CSSDocumentRule().CSSDocumentRule;
  }
});

// node_modules/cssom/lib/CSSStyleDeclaration.js
var require_CSSStyleDeclaration = __commonJS({
  "node_modules/cssom/lib/CSSStyleDeclaration.js"(exports2) {
    var CSSOM = {};
    CSSOM.CSSStyleDeclaration = function CSSStyleDeclaration() {
      this.length = 0;
      this.parentRule = null;
      this._importants = {};
    };
    CSSOM.CSSStyleDeclaration.prototype = {
      constructor: CSSOM.CSSStyleDeclaration,
      getPropertyValue: function(name) {
        return this[name] || "";
      },
      setProperty: function(name, value, priority) {
        if (this[name]) {
          var index = Array.prototype.indexOf.call(this, name);
          if (index < 0) {
            this[this.length] = name;
            this.length++;
          }
        } else {
          this[this.length] = name;
          this.length++;
        }
        this[name] = value + "";
        this._importants[name] = priority;
      },
      removeProperty: function(name) {
        if (!(name in this)) {
          return "";
        }
        var index = Array.prototype.indexOf.call(this, name);
        if (index < 0) {
          return "";
        }
        var prevValue = this[name];
        this[name] = "";
        Array.prototype.splice.call(this, index, 1);
        return prevValue;
      },
      getPropertyCSSValue: function() {
      },
      getPropertyPriority: function(name) {
        return this._importants[name] || "";
      },
      getPropertyShorthand: function() {
      },
      isPropertyImplicit: function() {
      },
      get cssText() {
        var properties = [];
        for (var i = 0, length = this.length; i < length; ++i) {
          var name = this[i];
          var value = this.getPropertyValue(name);
          var priority = this.getPropertyPriority(name);
          if (priority) {
            priority = " !" + priority;
          }
          properties[i] = name + ": " + value + priority + ";";
        }
        return properties.join(" ");
      },
      set cssText(text) {
        var i, name;
        for (i = this.length; i--; ) {
          name = this[i];
          this[name] = "";
        }
        Array.prototype.splice.call(this, 0, this.length);
        this._importants = {};
        var dummyRule = CSSOM.parse("#bogus{" + text + "}").cssRules[0].style;
        var length = dummyRule.length;
        for (i = 0; i < length; ++i) {
          name = dummyRule[i];
          this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
        }
      }
    };
    exports2.CSSStyleDeclaration = CSSOM.CSSStyleDeclaration;
    CSSOM.parse = require_parse3().parse;
  }
});

// node_modules/cssom/lib/clone.js
var require_clone = __commonJS({
  "node_modules/cssom/lib/clone.js"(exports2) {
    var CSSOM = {
      CSSStyleSheet: require_CSSStyleSheet().CSSStyleSheet,
      CSSRule: require_CSSRule().CSSRule,
      CSSStyleRule: require_CSSStyleRule().CSSStyleRule,
      CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
      CSSConditionRule: require_CSSConditionRule().CSSConditionRule,
      CSSMediaRule: require_CSSMediaRule().CSSMediaRule,
      CSSSupportsRule: require_CSSSupportsRule().CSSSupportsRule,
      CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
      CSSKeyframeRule: require_CSSKeyframeRule().CSSKeyframeRule,
      CSSKeyframesRule: require_CSSKeyframesRule().CSSKeyframesRule
    };
    CSSOM.clone = function clone(stylesheet) {
      var cloned = new CSSOM.CSSStyleSheet();
      var rules = stylesheet.cssRules;
      if (!rules) {
        return cloned;
      }
      for (var i = 0, rulesLength = rules.length; i < rulesLength; i++) {
        var rule = rules[i];
        var ruleClone = cloned.cssRules[i] = new rule.constructor();
        var style = rule.style;
        if (style) {
          var styleClone = ruleClone.style = new CSSOM.CSSStyleDeclaration();
          for (var j = 0, styleLength = style.length; j < styleLength; j++) {
            var name = styleClone[j] = style[j];
            styleClone[name] = style[name];
            styleClone._importants[name] = style.getPropertyPriority(name);
          }
          styleClone.length = style.length;
        }
        if (rule.hasOwnProperty("keyText")) {
          ruleClone.keyText = rule.keyText;
        }
        if (rule.hasOwnProperty("selectorText")) {
          ruleClone.selectorText = rule.selectorText;
        }
        if (rule.hasOwnProperty("mediaText")) {
          ruleClone.mediaText = rule.mediaText;
        }
        if (rule.hasOwnProperty("conditionText")) {
          ruleClone.conditionText = rule.conditionText;
        }
        if (rule.hasOwnProperty("cssRules")) {
          ruleClone.cssRules = clone(rule).cssRules;
        }
      }
      return cloned;
    };
    exports2.clone = CSSOM.clone;
  }
});

// node_modules/cssom/lib/index.js
var require_lib11 = __commonJS({
  "node_modules/cssom/lib/index.js"(exports2) {
    "use strict";
    exports2.CSSStyleDeclaration = require_CSSStyleDeclaration().CSSStyleDeclaration;
    exports2.CSSRule = require_CSSRule().CSSRule;
    exports2.CSSGroupingRule = require_CSSGroupingRule().CSSGroupingRule;
    exports2.CSSConditionRule = require_CSSConditionRule().CSSConditionRule;
    exports2.CSSStyleRule = require_CSSStyleRule().CSSStyleRule;
    exports2.MediaList = require_MediaList().MediaList;
    exports2.CSSMediaRule = require_CSSMediaRule().CSSMediaRule;
    exports2.CSSSupportsRule = require_CSSSupportsRule().CSSSupportsRule;
    exports2.CSSImportRule = require_CSSImportRule().CSSImportRule;
    exports2.CSSFontFaceRule = require_CSSFontFaceRule().CSSFontFaceRule;
    exports2.CSSHostRule = require_CSSHostRule().CSSHostRule;
    exports2.StyleSheet = require_StyleSheet().StyleSheet;
    exports2.CSSStyleSheet = require_CSSStyleSheet().CSSStyleSheet;
    exports2.CSSKeyframesRule = require_CSSKeyframesRule().CSSKeyframesRule;
    exports2.CSSKeyframeRule = require_CSSKeyframeRule().CSSKeyframeRule;
    exports2.MatcherList = require_MatcherList().MatcherList;
    exports2.CSSDocumentRule = require_CSSDocumentRule().CSSDocumentRule;
    exports2.CSSValue = require_CSSValue().CSSValue;
    exports2.CSSValueExpression = require_CSSValueExpression().CSSValueExpression;
    exports2.parse = require_parse3().parse;
    exports2.clone = require_clone().clone;
  }
});

// node_modules/linkedom/cjs/html/style-element.js
var require_style_element = __commonJS({
  "node_modules/linkedom/cjs/html/style-element.js"(exports2) {
    "use strict";
    var { parse } = require_lib11();
    var { registerHTMLClass } = require_register_html_class();
    var { SHEET } = require_symbols();
    var { TextElement } = require_text_element();
    var tagName = "style";
    var HTMLStyleElement = class extends TextElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
        this[SHEET] = null;
      }
      get sheet() {
        const sheet = this[SHEET];
        if (sheet !== null) {
          return sheet;
        }
        return this[SHEET] = parse(this.textContent);
      }
      get innerHTML() {
        return super.innerHTML || "";
      }
      set innerHTML(value) {
        super.textContent = value;
        this[SHEET] = null;
      }
      get innerText() {
        return super.innerText || "";
      }
      set innerText(value) {
        super.textContent = value;
        this[SHEET] = null;
      }
      get textContent() {
        return super.textContent || "";
      }
      set textContent(value) {
        super.textContent = value;
        this[SHEET] = null;
      }
    };
    registerHTMLClass(tagName, HTMLStyleElement);
    exports2.HTMLStyleElement = HTMLStyleElement;
  }
});

// node_modules/linkedom/cjs/html/time-element.js
var require_time_element = __commonJS({
  "node_modules/linkedom/cjs/html/time-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLTimeElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "time") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLTimeElement = HTMLTimeElement;
  }
});

// node_modules/linkedom/cjs/html/field-set-element.js
var require_field_set_element = __commonJS({
  "node_modules/linkedom/cjs/html/field-set-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLFieldSetElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "fieldset") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLFieldSetElement = HTMLFieldSetElement;
  }
});

// node_modules/linkedom/cjs/html/embed-element.js
var require_embed_element = __commonJS({
  "node_modules/linkedom/cjs/html/embed-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLEmbedElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "embed") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLEmbedElement = HTMLEmbedElement;
  }
});

// node_modules/linkedom/cjs/html/hr-element.js
var require_hr_element = __commonJS({
  "node_modules/linkedom/cjs/html/hr-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLHRElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "hr") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLHRElement = HTMLHRElement;
  }
});

// node_modules/linkedom/cjs/html/progress-element.js
var require_progress_element = __commonJS({
  "node_modules/linkedom/cjs/html/progress-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLProgressElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "progress") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLProgressElement = HTMLProgressElement;
  }
});

// node_modules/linkedom/cjs/html/paragraph-element.js
var require_paragraph_element = __commonJS({
  "node_modules/linkedom/cjs/html/paragraph-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLParagraphElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "p") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLParagraphElement = HTMLParagraphElement;
  }
});

// node_modules/linkedom/cjs/html/table-element.js
var require_table_element = __commonJS({
  "node_modules/linkedom/cjs/html/table-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLTableElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "table") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLTableElement = HTMLTableElement;
  }
});

// node_modules/linkedom/cjs/html/frame-set-element.js
var require_frame_set_element = __commonJS({
  "node_modules/linkedom/cjs/html/frame-set-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLFrameSetElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "frameset") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLFrameSetElement = HTMLFrameSetElement;
  }
});

// node_modules/linkedom/cjs/html/li-element.js
var require_li_element = __commonJS({
  "node_modules/linkedom/cjs/html/li-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLLIElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "li") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLLIElement = HTMLLIElement;
  }
});

// node_modules/linkedom/cjs/html/base-element.js
var require_base_element = __commonJS({
  "node_modules/linkedom/cjs/html/base-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLBaseElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "base") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLBaseElement = HTMLBaseElement;
  }
});

// node_modules/linkedom/cjs/html/data-list-element.js
var require_data_list_element = __commonJS({
  "node_modules/linkedom/cjs/html/data-list-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLDataListElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "datalist") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLDataListElement = HTMLDataListElement;
  }
});

// node_modules/linkedom/cjs/html/input-element.js
var require_input_element = __commonJS({
  "node_modules/linkedom/cjs/html/input-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { booleanAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var tagName = "input";
    var HTMLInputElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get autofocus() {
        return booleanAttribute.get(this, "autofocus") || -1;
      }
      set autofocus(value) {
        booleanAttribute.set(this, "autofocus", value);
      }
      get disabled() {
        return booleanAttribute.get(this, "disabled");
      }
      set disabled(value) {
        booleanAttribute.set(this, "disabled", value);
      }
      get name() {
        return this.getAttribute("name");
      }
      set name(value) {
        this.setAttribute("name", value);
      }
      get placeholder() {
        return this.getAttribute("placeholder");
      }
      set placeholder(value) {
        this.setAttribute("placeholder", value);
      }
      get type() {
        return this.getAttribute("type");
      }
      set type(value) {
        this.setAttribute("type", value);
      }
    };
    registerHTMLClass(tagName, HTMLInputElement);
    exports2.HTMLInputElement = HTMLInputElement;
  }
});

// node_modules/linkedom/cjs/html/param-element.js
var require_param_element = __commonJS({
  "node_modules/linkedom/cjs/html/param-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLParamElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "param") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLParamElement = HTMLParamElement;
  }
});

// node_modules/linkedom/cjs/html/media-element.js
var require_media_element = __commonJS({
  "node_modules/linkedom/cjs/html/media-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLMediaElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "media") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLMediaElement = HTMLMediaElement;
  }
});

// node_modules/linkedom/cjs/html/audio-element.js
var require_audio_element = __commonJS({
  "node_modules/linkedom/cjs/html/audio-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLAudioElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "audio") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLAudioElement = HTMLAudioElement;
  }
});

// node_modules/linkedom/cjs/html/heading-element.js
var require_heading_element = __commonJS({
  "node_modules/linkedom/cjs/html/heading-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { HTMLElement } = require_element3();
    var tagName = "h1";
    var HTMLHeadingElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
    };
    registerHTMLClass([tagName, "h2", "h3", "h4", "h5", "h6"], HTMLHeadingElement);
    exports2.HTMLHeadingElement = HTMLHeadingElement;
  }
});

// node_modules/linkedom/cjs/html/directory-element.js
var require_directory_element = __commonJS({
  "node_modules/linkedom/cjs/html/directory-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLDirectoryElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "dir") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLDirectoryElement = HTMLDirectoryElement;
  }
});

// node_modules/linkedom/cjs/html/quote-element.js
var require_quote_element = __commonJS({
  "node_modules/linkedom/cjs/html/quote-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLQuoteElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "quote") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLQuoteElement = HTMLQuoteElement;
  }
});

// node_modules/linkedom/commonjs/canvas.cjs
var require_canvas = __commonJS({
  "node_modules/linkedom/commonjs/canvas.cjs"(exports2, module2) {
    try {
      module2.exports = require("canvas");
    } catch (fallback) {
      class Canvas {
        constructor(width, height) {
          this.width = width;
          this.height = height;
        }
        getContext() {
          return null;
        }
        toDataURL() {
          return "";
        }
      }
      module2.exports = {
        createCanvas: (width, height) => new Canvas(width, height)
      };
    }
  }
});

// node_modules/linkedom/cjs/html/canvas-element.js
var require_canvas_element = __commonJS({
  "node_modules/linkedom/cjs/html/canvas-element.js"(exports2) {
    "use strict";
    var { IMAGE } = require_symbols();
    var { registerHTMLClass } = require_register_html_class();
    var { numericAttribute } = require_attributes();
    var Canvas = ((m) => m.__esModule ? m.default : m)(require_canvas());
    var { HTMLElement } = require_element3();
    var { createCanvas } = Canvas;
    var tagName = "canvas";
    var HTMLCanvasElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
        this[IMAGE] = createCanvas(300, 150);
      }
      get width() {
        return this[IMAGE].width;
      }
      set width(value) {
        numericAttribute.set(this, "width", value);
        this[IMAGE].width = value;
      }
      get height() {
        return this[IMAGE].height;
      }
      set height(value) {
        numericAttribute.set(this, "height", value);
        this[IMAGE].height = value;
      }
      getContext(type) {
        return this[IMAGE].getContext(type);
      }
      toDataURL(...args) {
        return this[IMAGE].toDataURL(...args);
      }
    };
    registerHTMLClass(tagName, HTMLCanvasElement);
    exports2.HTMLCanvasElement = HTMLCanvasElement;
  }
});

// node_modules/linkedom/cjs/html/legend-element.js
var require_legend_element = __commonJS({
  "node_modules/linkedom/cjs/html/legend-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLLegendElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "legend") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLLegendElement = HTMLLegendElement;
  }
});

// node_modules/linkedom/cjs/html/option-element.js
var require_option_element = __commonJS({
  "node_modules/linkedom/cjs/html/option-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLOptionElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "option") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLOptionElement = HTMLOptionElement;
  }
});

// node_modules/linkedom/cjs/html/span-element.js
var require_span_element = __commonJS({
  "node_modules/linkedom/cjs/html/span-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLSpanElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "span") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLSpanElement = HTMLSpanElement;
  }
});

// node_modules/linkedom/cjs/html/meter-element.js
var require_meter_element = __commonJS({
  "node_modules/linkedom/cjs/html/meter-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLMeterElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "meter") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLMeterElement = HTMLMeterElement;
  }
});

// node_modules/linkedom/cjs/html/video-element.js
var require_video_element = __commonJS({
  "node_modules/linkedom/cjs/html/video-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLVideoElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "video") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLVideoElement = HTMLVideoElement;
  }
});

// node_modules/linkedom/cjs/html/table-cell-element.js
var require_table_cell_element = __commonJS({
  "node_modules/linkedom/cjs/html/table-cell-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLTableCellElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "td") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLTableCellElement = HTMLTableCellElement;
  }
});

// node_modules/linkedom/cjs/html/title-element.js
var require_title_element = __commonJS({
  "node_modules/linkedom/cjs/html/title-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { TextElement } = require_text_element();
    var tagName = "title";
    var HTMLTitleElement = class extends TextElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
    };
    registerHTMLClass(tagName, HTMLTitleElement);
    exports2.HTMLTitleElement = HTMLTitleElement;
  }
});

// node_modules/linkedom/cjs/html/output-element.js
var require_output_element = __commonJS({
  "node_modules/linkedom/cjs/html/output-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLOutputElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "output") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLOutputElement = HTMLOutputElement;
  }
});

// node_modules/linkedom/cjs/html/table-row-element.js
var require_table_row_element = __commonJS({
  "node_modules/linkedom/cjs/html/table-row-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLTableRowElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "tr") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLTableRowElement = HTMLTableRowElement;
  }
});

// node_modules/linkedom/cjs/html/data-element.js
var require_data_element = __commonJS({
  "node_modules/linkedom/cjs/html/data-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLDataElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "data") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLDataElement = HTMLDataElement;
  }
});

// node_modules/linkedom/cjs/html/menu-element.js
var require_menu_element = __commonJS({
  "node_modules/linkedom/cjs/html/menu-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLMenuElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "menu") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLMenuElement = HTMLMenuElement;
  }
});

// node_modules/linkedom/cjs/html/select-element.js
var require_select_element = __commonJS({
  "node_modules/linkedom/cjs/html/select-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { booleanAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var { NodeList } = require_node_list();
    var tagName = "select";
    var HTMLSelectElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get options() {
        let children = new NodeList();
        let { firstElementChild } = this;
        while (firstElementChild) {
          if (firstElementChild.tagName === "OPTGROUP")
            children.push(...firstElementChild.children);
          else
            children.push(firstElementChild);
          firstElementChild = firstElementChild.nextElementSibling;
        }
        return children;
      }
      get disabled() {
        return booleanAttribute.get(this, "disabled");
      }
      set disabled(value) {
        booleanAttribute.set(this, "disabled", value);
      }
      get name() {
        return this.getAttribute("name");
      }
      set name(value) {
        this.setAttribute("name", value);
      }
    };
    registerHTMLClass(tagName, HTMLSelectElement);
    exports2.HTMLSelectElement = HTMLSelectElement;
  }
});

// node_modules/linkedom/cjs/html/br-element.js
var require_br_element = __commonJS({
  "node_modules/linkedom/cjs/html/br-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLBRElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "br") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLBRElement = HTMLBRElement;
  }
});

// node_modules/linkedom/cjs/html/button-element.js
var require_button_element = __commonJS({
  "node_modules/linkedom/cjs/html/button-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { booleanAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var tagName = "button";
    var HTMLButtonElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get disabled() {
        return booleanAttribute.get(this, "disabled");
      }
      set disabled(value) {
        booleanAttribute.set(this, "disabled", value);
      }
      get name() {
        return this.getAttribute("name");
      }
      set name(value) {
        this.setAttribute("name", value);
      }
      get type() {
        return this.getAttribute("type");
      }
      set type(value) {
        this.setAttribute("type", value);
      }
    };
    registerHTMLClass(tagName, HTMLButtonElement);
    exports2.HTMLButtonElement = HTMLButtonElement;
  }
});

// node_modules/linkedom/cjs/html/map-element.js
var require_map_element = __commonJS({
  "node_modules/linkedom/cjs/html/map-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLMapElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "map") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLMapElement = HTMLMapElement;
  }
});

// node_modules/linkedom/cjs/html/opt-group-element.js
var require_opt_group_element = __commonJS({
  "node_modules/linkedom/cjs/html/opt-group-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLOptGroupElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "optgroup") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLOptGroupElement = HTMLOptGroupElement;
  }
});

// node_modules/linkedom/cjs/html/d-list-element.js
var require_d_list_element = __commonJS({
  "node_modules/linkedom/cjs/html/d-list-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLDListElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "dl") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLDListElement = HTMLDListElement;
  }
});

// node_modules/linkedom/cjs/html/text-area-element.js
var require_text_area_element = __commonJS({
  "node_modules/linkedom/cjs/html/text-area-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { booleanAttribute } = require_attributes();
    var { TextElement } = require_text_element();
    var tagName = "textarea";
    var HTMLTextAreaElement = class extends TextElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get disabled() {
        return booleanAttribute.get(this, "disabled");
      }
      set disabled(value) {
        booleanAttribute.set(this, "disabled", value);
      }
      get name() {
        return this.getAttribute("name");
      }
      set name(value) {
        this.setAttribute("name", value);
      }
      get placeholder() {
        return this.getAttribute("placeholder");
      }
      set placeholder(value) {
        this.setAttribute("placeholder", value);
      }
      get type() {
        return this.getAttribute("type");
      }
      set type(value) {
        this.setAttribute("type", value);
      }
      get value() {
        return this.textContent;
      }
      set value(content) {
        this.textContent = content;
      }
    };
    registerHTMLClass(tagName, HTMLTextAreaElement);
    exports2.HTMLTextAreaElement = HTMLTextAreaElement;
  }
});

// node_modules/linkedom/cjs/html/font-element.js
var require_font_element = __commonJS({
  "node_modules/linkedom/cjs/html/font-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLFontElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "font") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLFontElement = HTMLFontElement;
  }
});

// node_modules/linkedom/cjs/html/div-element.js
var require_div_element = __commonJS({
  "node_modules/linkedom/cjs/html/div-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLDivElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "div") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLDivElement = HTMLDivElement;
  }
});

// node_modules/linkedom/cjs/html/link-element.js
var require_link_element = __commonJS({
  "node_modules/linkedom/cjs/html/link-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { booleanAttribute, stringAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var tagName = "link";
    var HTMLLinkElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get disabled() {
        return booleanAttribute.get(this, "disabled");
      }
      set disabled(value) {
        booleanAttribute.set(this, "disabled", value);
      }
      get href() {
        return stringAttribute.get(this, "href");
      }
      set href(value) {
        stringAttribute.set(this, "href", value);
      }
      get hreflang() {
        return stringAttribute.get(this, "hreflang");
      }
      set hreflang(value) {
        stringAttribute.set(this, "hreflang", value);
      }
      get media() {
        return stringAttribute.get(this, "media");
      }
      set media(value) {
        stringAttribute.set(this, "media", value);
      }
      get rel() {
        return stringAttribute.get(this, "rel");
      }
      set rel(value) {
        stringAttribute.set(this, "rel", value);
      }
      get type() {
        return stringAttribute.get(this, "type");
      }
      set type(value) {
        stringAttribute.set(this, "type", value);
      }
    };
    registerHTMLClass(tagName, HTMLLinkElement);
    exports2.HTMLLinkElement = HTMLLinkElement;
  }
});

// node_modules/linkedom/cjs/html/slot-element.js
var require_slot_element = __commonJS({
  "node_modules/linkedom/cjs/html/slot-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLSlotElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "slot") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLSlotElement = HTMLSlotElement;
  }
});

// node_modules/linkedom/cjs/html/form-element.js
var require_form_element = __commonJS({
  "node_modules/linkedom/cjs/html/form-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLFormElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "form") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLFormElement = HTMLFormElement;
  }
});

// node_modules/linkedom/cjs/html/image-element.js
var require_image_element = __commonJS({
  "node_modules/linkedom/cjs/html/image-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { numericAttribute, stringAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var tagName = "img";
    var HTMLImageElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get alt() {
        return stringAttribute.get(this, "alt");
      }
      set alt(value) {
        stringAttribute.set(this, "alt", value);
      }
      get sizes() {
        return stringAttribute.get(this, "sizes");
      }
      set sizes(value) {
        stringAttribute.set(this, "sizes", value);
      }
      get src() {
        return stringAttribute.get(this, "src");
      }
      set src(value) {
        stringAttribute.set(this, "src", value);
      }
      get srcset() {
        return stringAttribute.get(this, "srcset");
      }
      set srcset(value) {
        stringAttribute.set(this, "srcset", value);
      }
      get title() {
        return stringAttribute.get(this, "title");
      }
      set title(value) {
        stringAttribute.set(this, "title", value);
      }
      get width() {
        return numericAttribute.get(this, "width");
      }
      set width(value) {
        numericAttribute.set(this, "width", value);
      }
      get height() {
        return numericAttribute.get(this, "height");
      }
      set height(value) {
        numericAttribute.set(this, "height", value);
      }
    };
    registerHTMLClass(tagName, HTMLImageElement);
    exports2.HTMLImageElement = HTMLImageElement;
  }
});

// node_modules/linkedom/cjs/html/pre-element.js
var require_pre_element = __commonJS({
  "node_modules/linkedom/cjs/html/pre-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLPreElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "pre") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLPreElement = HTMLPreElement;
  }
});

// node_modules/linkedom/cjs/html/u-list-element.js
var require_u_list_element = __commonJS({
  "node_modules/linkedom/cjs/html/u-list-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLUListElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "ul") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLUListElement = HTMLUListElement;
  }
});

// node_modules/linkedom/cjs/html/meta-element.js
var require_meta_element = __commonJS({
  "node_modules/linkedom/cjs/html/meta-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLMetaElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "meta") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLMetaElement = HTMLMetaElement;
  }
});

// node_modules/linkedom/cjs/html/picture-element.js
var require_picture_element = __commonJS({
  "node_modules/linkedom/cjs/html/picture-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLPictureElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "picture") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLPictureElement = HTMLPictureElement;
  }
});

// node_modules/linkedom/cjs/html/area-element.js
var require_area_element = __commonJS({
  "node_modules/linkedom/cjs/html/area-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLAreaElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "area") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLAreaElement = HTMLAreaElement;
  }
});

// node_modules/linkedom/cjs/html/o-list-element.js
var require_o_list_element = __commonJS({
  "node_modules/linkedom/cjs/html/o-list-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLOListElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "ol") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLOListElement = HTMLOListElement;
  }
});

// node_modules/linkedom/cjs/html/table-caption-element.js
var require_table_caption_element = __commonJS({
  "node_modules/linkedom/cjs/html/table-caption-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLTableCaptionElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "caption") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLTableCaptionElement = HTMLTableCaptionElement;
  }
});

// node_modules/linkedom/cjs/html/anchor-element.js
var require_anchor_element = __commonJS({
  "node_modules/linkedom/cjs/html/anchor-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { stringAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var tagName = "a";
    var HTMLAnchorElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get href() {
        return encodeURI(stringAttribute.get(this, "href"));
      }
      set href(value) {
        stringAttribute.set(this, "href", decodeURI(value));
      }
      get download() {
        return encodeURI(stringAttribute.get(this, "download"));
      }
      set download(value) {
        stringAttribute.set(this, "download", decodeURI(value));
      }
      get target() {
        return stringAttribute.get(this, "target");
      }
      set target(value) {
        stringAttribute.set(this, "target", value);
      }
      get type() {
        return stringAttribute.get(this, "type");
      }
      set type(value) {
        stringAttribute.set(this, "type", value);
      }
    };
    registerHTMLClass(tagName, HTMLAnchorElement);
    exports2.HTMLAnchorElement = HTMLAnchorElement;
  }
});

// node_modules/linkedom/cjs/html/label-element.js
var require_label_element = __commonJS({
  "node_modules/linkedom/cjs/html/label-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLLabelElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "label") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLLabelElement = HTMLLabelElement;
  }
});

// node_modules/linkedom/cjs/html/unknown-element.js
var require_unknown_element = __commonJS({
  "node_modules/linkedom/cjs/html/unknown-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLUnknownElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "unknown") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLUnknownElement = HTMLUnknownElement;
  }
});

// node_modules/linkedom/cjs/html/mod-element.js
var require_mod_element = __commonJS({
  "node_modules/linkedom/cjs/html/mod-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLModElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "mod") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLModElement = HTMLModElement;
  }
});

// node_modules/linkedom/cjs/html/details-element.js
var require_details_element = __commonJS({
  "node_modules/linkedom/cjs/html/details-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLDetailsElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "details") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLDetailsElement = HTMLDetailsElement;
  }
});

// node_modules/linkedom/cjs/html/source-element.js
var require_source_element = __commonJS({
  "node_modules/linkedom/cjs/html/source-element.js"(exports2) {
    "use strict";
    var { registerHTMLClass } = require_register_html_class();
    var { stringAttribute } = require_attributes();
    var { HTMLElement } = require_element3();
    var tagName = "source";
    var HTMLSourceElement = class extends HTMLElement {
      constructor(ownerDocument, localName = tagName) {
        super(ownerDocument, localName);
      }
      get src() {
        return stringAttribute.get(this, "src");
      }
      set src(value) {
        stringAttribute.set(this, "src", value);
      }
      get srcset() {
        return stringAttribute.get(this, "srcset");
      }
      set srcset(value) {
        stringAttribute.set(this, "srcset", value);
      }
      get sizes() {
        return stringAttribute.get(this, "sizes");
      }
      set sizes(value) {
        stringAttribute.set(this, "sizes", value);
      }
      get type() {
        return stringAttribute.get(this, "type");
      }
      set type(value) {
        stringAttribute.set(this, "type", value);
      }
    };
    registerHTMLClass(tagName, HTMLSourceElement);
    exports2.HTMLSourceElement = HTMLSourceElement;
  }
});

// node_modules/linkedom/cjs/html/track-element.js
var require_track_element = __commonJS({
  "node_modules/linkedom/cjs/html/track-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLTrackElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "track") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLTrackElement = HTMLTrackElement;
  }
});

// node_modules/linkedom/cjs/html/marquee-element.js
var require_marquee_element = __commonJS({
  "node_modules/linkedom/cjs/html/marquee-element.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var HTMLMarqueeElement = class extends HTMLElement {
      constructor(ownerDocument, localName = "marquee") {
        super(ownerDocument, localName);
      }
    };
    exports2.HTMLMarqueeElement = HTMLMarqueeElement;
  }
});

// node_modules/linkedom/cjs/shared/html-classes.js
var require_html_classes = __commonJS({
  "node_modules/linkedom/cjs/shared/html-classes.js"(exports2) {
    "use strict";
    var { HTMLElement } = require_element3();
    var { HTMLTemplateElement } = require_template_element();
    var { HTMLHtmlElement } = require_html_element();
    var { HTMLScriptElement } = require_script_element();
    var { HTMLFrameElement } = require_frame_element();
    var { HTMLIFrameElement } = require_i_frame_element();
    var { HTMLObjectElement } = require_object_element();
    var { HTMLHeadElement } = require_head_element();
    var { HTMLBodyElement } = require_body_element();
    var { HTMLStyleElement } = require_style_element();
    var { HTMLTimeElement } = require_time_element();
    var { HTMLFieldSetElement } = require_field_set_element();
    var { HTMLEmbedElement } = require_embed_element();
    var { HTMLHRElement } = require_hr_element();
    var { HTMLProgressElement } = require_progress_element();
    var { HTMLParagraphElement } = require_paragraph_element();
    var { HTMLTableElement } = require_table_element();
    var { HTMLFrameSetElement } = require_frame_set_element();
    var { HTMLLIElement } = require_li_element();
    var { HTMLBaseElement } = require_base_element();
    var { HTMLDataListElement } = require_data_list_element();
    var { HTMLInputElement } = require_input_element();
    var { HTMLParamElement } = require_param_element();
    var { HTMLMediaElement } = require_media_element();
    var { HTMLAudioElement } = require_audio_element();
    var { HTMLHeadingElement } = require_heading_element();
    var { HTMLDirectoryElement } = require_directory_element();
    var { HTMLQuoteElement } = require_quote_element();
    var { HTMLCanvasElement } = require_canvas_element();
    var { HTMLLegendElement } = require_legend_element();
    var { HTMLOptionElement } = require_option_element();
    var { HTMLSpanElement } = require_span_element();
    var { HTMLMeterElement } = require_meter_element();
    var { HTMLVideoElement } = require_video_element();
    var { HTMLTableCellElement } = require_table_cell_element();
    var { HTMLTitleElement } = require_title_element();
    var { HTMLOutputElement } = require_output_element();
    var { HTMLTableRowElement } = require_table_row_element();
    var { HTMLDataElement } = require_data_element();
    var { HTMLMenuElement } = require_menu_element();
    var { HTMLSelectElement } = require_select_element();
    var { HTMLBRElement } = require_br_element();
    var { HTMLButtonElement } = require_button_element();
    var { HTMLMapElement } = require_map_element();
    var { HTMLOptGroupElement } = require_opt_group_element();
    var { HTMLDListElement } = require_d_list_element();
    var { HTMLTextAreaElement } = require_text_area_element();
    var { HTMLFontElement } = require_font_element();
    var { HTMLDivElement } = require_div_element();
    var { HTMLLinkElement } = require_link_element();
    var { HTMLSlotElement } = require_slot_element();
    var { HTMLFormElement } = require_form_element();
    var { HTMLImageElement } = require_image_element();
    var { HTMLPreElement } = require_pre_element();
    var { HTMLUListElement } = require_u_list_element();
    var { HTMLMetaElement } = require_meta_element();
    var { HTMLPictureElement } = require_picture_element();
    var { HTMLAreaElement } = require_area_element();
    var { HTMLOListElement } = require_o_list_element();
    var { HTMLTableCaptionElement } = require_table_caption_element();
    var { HTMLAnchorElement } = require_anchor_element();
    var { HTMLLabelElement } = require_label_element();
    var { HTMLUnknownElement } = require_unknown_element();
    var { HTMLModElement } = require_mod_element();
    var { HTMLDetailsElement } = require_details_element();
    var { HTMLSourceElement } = require_source_element();
    var { HTMLTrackElement } = require_track_element();
    var { HTMLMarqueeElement } = require_marquee_element();
    exports2.HTMLElement = HTMLElement;
    exports2.HTMLTemplateElement = HTMLTemplateElement;
    exports2.HTMLHtmlElement = HTMLHtmlElement;
    exports2.HTMLScriptElement = HTMLScriptElement;
    exports2.HTMLFrameElement = HTMLFrameElement;
    exports2.HTMLIFrameElement = HTMLIFrameElement;
    exports2.HTMLObjectElement = HTMLObjectElement;
    exports2.HTMLHeadElement = HTMLHeadElement;
    exports2.HTMLBodyElement = HTMLBodyElement;
    exports2.HTMLStyleElement = HTMLStyleElement;
    exports2.HTMLTimeElement = HTMLTimeElement;
    exports2.HTMLFieldSetElement = HTMLFieldSetElement;
    exports2.HTMLEmbedElement = HTMLEmbedElement;
    exports2.HTMLHRElement = HTMLHRElement;
    exports2.HTMLProgressElement = HTMLProgressElement;
    exports2.HTMLParagraphElement = HTMLParagraphElement;
    exports2.HTMLTableElement = HTMLTableElement;
    exports2.HTMLFrameSetElement = HTMLFrameSetElement;
    exports2.HTMLLIElement = HTMLLIElement;
    exports2.HTMLBaseElement = HTMLBaseElement;
    exports2.HTMLDataListElement = HTMLDataListElement;
    exports2.HTMLInputElement = HTMLInputElement;
    exports2.HTMLParamElement = HTMLParamElement;
    exports2.HTMLMediaElement = HTMLMediaElement;
    exports2.HTMLAudioElement = HTMLAudioElement;
    exports2.HTMLHeadingElement = HTMLHeadingElement;
    exports2.HTMLDirectoryElement = HTMLDirectoryElement;
    exports2.HTMLQuoteElement = HTMLQuoteElement;
    exports2.HTMLCanvasElement = HTMLCanvasElement;
    exports2.HTMLLegendElement = HTMLLegendElement;
    exports2.HTMLOptionElement = HTMLOptionElement;
    exports2.HTMLSpanElement = HTMLSpanElement;
    exports2.HTMLMeterElement = HTMLMeterElement;
    exports2.HTMLVideoElement = HTMLVideoElement;
    exports2.HTMLTableCellElement = HTMLTableCellElement;
    exports2.HTMLTitleElement = HTMLTitleElement;
    exports2.HTMLOutputElement = HTMLOutputElement;
    exports2.HTMLTableRowElement = HTMLTableRowElement;
    exports2.HTMLDataElement = HTMLDataElement;
    exports2.HTMLMenuElement = HTMLMenuElement;
    exports2.HTMLSelectElement = HTMLSelectElement;
    exports2.HTMLBRElement = HTMLBRElement;
    exports2.HTMLButtonElement = HTMLButtonElement;
    exports2.HTMLMapElement = HTMLMapElement;
    exports2.HTMLOptGroupElement = HTMLOptGroupElement;
    exports2.HTMLDListElement = HTMLDListElement;
    exports2.HTMLTextAreaElement = HTMLTextAreaElement;
    exports2.HTMLFontElement = HTMLFontElement;
    exports2.HTMLDivElement = HTMLDivElement;
    exports2.HTMLLinkElement = HTMLLinkElement;
    exports2.HTMLSlotElement = HTMLSlotElement;
    exports2.HTMLFormElement = HTMLFormElement;
    exports2.HTMLImageElement = HTMLImageElement;
    exports2.HTMLPreElement = HTMLPreElement;
    exports2.HTMLUListElement = HTMLUListElement;
    exports2.HTMLMetaElement = HTMLMetaElement;
    exports2.HTMLPictureElement = HTMLPictureElement;
    exports2.HTMLAreaElement = HTMLAreaElement;
    exports2.HTMLOListElement = HTMLOListElement;
    exports2.HTMLTableCaptionElement = HTMLTableCaptionElement;
    exports2.HTMLAnchorElement = HTMLAnchorElement;
    exports2.HTMLLabelElement = HTMLLabelElement;
    exports2.HTMLUnknownElement = HTMLUnknownElement;
    exports2.HTMLModElement = HTMLModElement;
    exports2.HTMLDetailsElement = HTMLDetailsElement;
    exports2.HTMLSourceElement = HTMLSourceElement;
    exports2.HTMLTrackElement = HTMLTrackElement;
    exports2.HTMLMarqueeElement = HTMLMarqueeElement;
    var HTMLClasses = {
      HTMLElement,
      HTMLTemplateElement,
      HTMLHtmlElement,
      HTMLScriptElement,
      HTMLFrameElement,
      HTMLIFrameElement,
      HTMLObjectElement,
      HTMLHeadElement,
      HTMLBodyElement,
      HTMLStyleElement,
      HTMLTimeElement,
      HTMLFieldSetElement,
      HTMLEmbedElement,
      HTMLHRElement,
      HTMLProgressElement,
      HTMLParagraphElement,
      HTMLTableElement,
      HTMLFrameSetElement,
      HTMLLIElement,
      HTMLBaseElement,
      HTMLDataListElement,
      HTMLInputElement,
      HTMLParamElement,
      HTMLMediaElement,
      HTMLAudioElement,
      HTMLHeadingElement,
      HTMLDirectoryElement,
      HTMLQuoteElement,
      HTMLCanvasElement,
      HTMLLegendElement,
      HTMLOptionElement,
      HTMLSpanElement,
      HTMLMeterElement,
      HTMLVideoElement,
      HTMLTableCellElement,
      HTMLTitleElement,
      HTMLOutputElement,
      HTMLTableRowElement,
      HTMLDataElement,
      HTMLMenuElement,
      HTMLSelectElement,
      HTMLBRElement,
      HTMLButtonElement,
      HTMLMapElement,
      HTMLOptGroupElement,
      HTMLDListElement,
      HTMLTextAreaElement,
      HTMLFontElement,
      HTMLDivElement,
      HTMLLinkElement,
      HTMLSlotElement,
      HTMLFormElement,
      HTMLImageElement,
      HTMLPreElement,
      HTMLUListElement,
      HTMLMetaElement,
      HTMLPictureElement,
      HTMLAreaElement,
      HTMLOListElement,
      HTMLTableCaptionElement,
      HTMLAnchorElement,
      HTMLLabelElement,
      HTMLUnknownElement,
      HTMLModElement,
      HTMLDetailsElement,
      HTMLSourceElement,
      HTMLTrackElement,
      HTMLMarqueeElement
    };
    exports2.HTMLClasses = HTMLClasses;
  }
});

// node_modules/linkedom/cjs/shared/mime.js
var require_mime = __commonJS({
  "node_modules/linkedom/cjs/shared/mime.js"(exports2) {
    "use strict";
    var voidElements = { test: () => true };
    var Mime = {
      "text/html": {
        docType: "<!DOCTYPE html>",
        ignoreCase: true,
        voidElements: /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i
      },
      "image/svg+xml": {
        docType: '<?xml version="1.0" encoding="utf-8"?>',
        ignoreCase: false,
        voidElements
      },
      "text/xml": {
        docType: '<?xml version="1.0" encoding="utf-8"?>',
        ignoreCase: false,
        voidElements
      },
      "application/xml": {
        docType: '<?xml version="1.0" encoding="utf-8"?>',
        ignoreCase: false,
        voidElements
      },
      "application/xhtml+xml": {
        docType: '<?xml version="1.0" encoding="utf-8"?>',
        ignoreCase: false,
        voidElements
      }
    };
    exports2.Mime = Mime;
  }
});

// node_modules/linkedom/cjs/interface/custom-event.js
var require_custom_event = __commonJS({
  "node_modules/linkedom/cjs/interface/custom-event.js"(exports2) {
    "use strict";
    var { Event: Event2 } = require_event();
    var GlobalCustomEvent = typeof CustomEvent === "function" ? CustomEvent : class CustomEvent extends Event2 {
      constructor(type, eventInitDict = {}) {
        super(type, eventInitDict);
        this.detail = eventInitDict.detail;
      }
    };
    exports2.CustomEvent = GlobalCustomEvent;
  }
});

// node_modules/linkedom/cjs/interface/input-event.js
var require_input_event = __commonJS({
  "node_modules/linkedom/cjs/interface/input-event.js"(exports2) {
    "use strict";
    var { Event: Event2 } = require_event();
    var InputEvent = class extends Event2 {
      constructor(type, inputEventInit = {}) {
        super(type, inputEventInit);
        this.inputType = inputEventInit.inputType;
        this.data = inputEventInit.data;
        this.dataTransfer = inputEventInit.dataTransfer;
        this.isComposing = inputEventInit.isComposing || false;
        this.ranges = inputEventInit.ranges;
      }
    };
    exports2.InputEvent = InputEvent;
  }
});

// node_modules/linkedom/cjs/interface/image.js
var require_image = __commonJS({
  "node_modules/linkedom/cjs/interface/image.js"(exports2) {
    "use strict";
    var { HTMLImageElement } = require_image_element();
    var ImageClass = (ownerDocument) => class Image extends HTMLImageElement {
      constructor(width, height) {
        super(ownerDocument);
        switch (arguments.length) {
          case 1:
            this.height = width;
            this.width = width;
            break;
          case 2:
            this.height = height;
            this.width = width;
            break;
        }
      }
    };
    exports2.ImageClass = ImageClass;
  }
});

// node_modules/linkedom/cjs/interface/range.js
var require_range = __commonJS({
  "node_modules/linkedom/cjs/interface/range.js"(exports2) {
    "use strict";
    var { END, NEXT, PREV, START } = require_symbols();
    var { getEnd, setAdjacent } = require_utils();
    var deleteContents = ({ [START]: start, [END]: end }, fragment = null) => {
      setAdjacent(start[PREV], end[NEXT]);
      do {
        const after = getEnd(start);
        const next = after === end ? after : after[NEXT];
        if (fragment)
          fragment.insertBefore(start, fragment[END]);
        else
          start.remove();
        start = next;
      } while (start !== end);
    };
    var Range = class {
      constructor() {
        this[START] = null;
        this[END] = null;
        this.commonAncestorContainer = null;
      }
      insertNode(newNode) {
        this[END].parentNode.insertBefore(newNode, this[START]);
      }
      selectNode(node) {
        this[START] = node;
        this[END] = getEnd(node);
      }
      surroundContents(parentNode) {
        parentNode.replaceChildren(this.extractContents());
      }
      setStartBefore(node) {
        this[START] = node;
      }
      setStartAfter(node) {
        this[START] = node.nextSibling;
      }
      setEndBefore(node) {
        this[END] = getEnd(node.previousSibling);
      }
      setEndAfter(node) {
        this[END] = getEnd(node);
      }
      cloneContents() {
        let { [START]: start, [END]: end } = this;
        const fragment = start.ownerDocument.createDocumentFragment();
        while (start !== end) {
          fragment.insertBefore(start.cloneNode(true), fragment[END]);
          start = getEnd(start);
          if (start !== end)
            start = start[NEXT];
        }
        return fragment;
      }
      deleteContents() {
        deleteContents(this);
      }
      extractContents() {
        const fragment = this[START].ownerDocument.createDocumentFragment();
        deleteContents(this, fragment);
        return fragment;
      }
      createContextualFragment(html) {
        const template = this.commonAncestorContainer.createElement("template");
        template.innerHTML = html;
        this.selectNode(template.content);
        return template.content;
      }
      cloneRange() {
        const range = new Range();
        range[START] = this[START];
        range[END] = this[END];
        return range;
      }
    };
    exports2.Range = Range;
  }
});

// node_modules/linkedom/cjs/interface/tree-walker.js
var require_tree_walker = __commonJS({
  "node_modules/linkedom/cjs/interface/tree-walker.js"(exports2) {
    "use strict";
    var {
      DOCUMENT_NODE,
      ELEMENT_NODE,
      TEXT_NODE,
      COMMENT_NODE,
      SHOW_ALL,
      SHOW_ELEMENT,
      SHOW_COMMENT,
      SHOW_TEXT
    } = require_constants();
    var { PRIVATE, END, NEXT } = require_symbols();
    var isOK = ({ nodeType }, mask) => {
      switch (nodeType) {
        case ELEMENT_NODE:
          return mask & SHOW_ELEMENT;
        case TEXT_NODE:
          return mask & SHOW_TEXT;
        case COMMENT_NODE:
          return mask & SHOW_COMMENT;
      }
      return 0;
    };
    var TreeWalker = class {
      constructor(root, whatToShow = SHOW_ALL) {
        this.root = root;
        this.currentNode = root;
        this.whatToShow = whatToShow;
        let { [NEXT]: next, [END]: end } = root;
        if (root.nodeType === DOCUMENT_NODE) {
          const { documentElement } = root;
          next = documentElement;
          end = documentElement[END];
        }
        const nodes = [];
        while (next !== end) {
          if (isOK(next, whatToShow))
            nodes.push(next);
          next = next[NEXT];
        }
        this[PRIVATE] = { i: 0, nodes };
      }
      nextNode() {
        const $ = this[PRIVATE];
        this.currentNode = $.i < $.nodes.length ? $.nodes[$.i++] : null;
        return this.currentNode;
      }
    };
    exports2.TreeWalker = TreeWalker;
  }
});

// node_modules/linkedom/cjs/interface/document.js
var require_document = __commonJS({
  "node_modules/linkedom/cjs/interface/document.js"(exports2) {
    "use strict";
    var { performance } = require("perf_hooks");
    var { DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE, DOCUMENT_TYPE_NODE, ELEMENT_NODE, SVG_NAMESPACE } = require_constants();
    var {
      CUSTOM_ELEMENTS,
      DOM_PARSER,
      IMAGE,
      MUTATION_OBSERVER,
      DOCTYPE,
      END,
      NEXT,
      MIME,
      EVENT_TARGET
    } = require_symbols();
    var { Facades, illegalConstructor } = require_facades();
    var { HTMLClasses } = require_html_classes();
    var { Mime } = require_mime();
    var { knownSiblings } = require_utils();
    var { assign, create, defineProperties, setPrototypeOf } = require_object();
    var { NonElementParentNode } = require_non_element_parent_node();
    var { SVGElement } = require_element2();
    var { Attr } = require_attr();
    var { Comment } = require_comment();
    var { CustomElementRegistry } = require_custom_element_registry();
    var { CustomEvent: CustomEvent2 } = require_custom_event();
    var { DocumentFragment } = require_document_fragment();
    var { DocumentType } = require_document_type();
    var { Element } = require_element();
    var { Event: Event2 } = require_event();
    var { EventTarget: EventTarget2 } = require_event_target();
    var { InputEvent } = require_input_event();
    var { ImageClass } = require_image();
    var { MutationObserverClass } = require_mutation_observer();
    var { NamedNodeMap } = require_named_node_map();
    var { NodeList } = require_node_list();
    var { Range } = require_range();
    var { Text } = require_text();
    var { TreeWalker } = require_tree_walker();
    var query = (method, ownerDocument, selectors) => {
      let { [NEXT]: next, [END]: end } = ownerDocument;
      return method.call({ ownerDocument, [NEXT]: next, [END]: end }, selectors);
    };
    var globalExports = assign({}, Facades, HTMLClasses, {
      CustomEvent: CustomEvent2,
      Event: Event2,
      EventTarget: EventTarget2,
      InputEvent,
      NamedNodeMap,
      NodeList
    });
    var window = new WeakMap();
    var Document = class extends NonElementParentNode {
      constructor(type) {
        super(null, "#document", DOCUMENT_NODE);
        this[CUSTOM_ELEMENTS] = { active: false, registry: null };
        this[MUTATION_OBSERVER] = { active: false, class: null };
        this[MIME] = Mime[type];
        this[DOCTYPE] = null;
        this[DOM_PARSER] = null;
        this[IMAGE] = null;
      }
      get defaultView() {
        if (!window.has(this))
          window.set(this, new Proxy(globalThis, {
            set: (target, name, value) => {
              switch (name) {
                case "addEventListener":
                case "removeEventListener":
                case "dispatchEvent":
                  this[EVENT_TARGET][name] = value;
                  break;
                default:
                  target[name] = value;
                  break;
              }
              return true;
            },
            get: (globalThis2, name) => {
              switch (name) {
                case "addEventListener":
                case "removeEventListener":
                case "dispatchEvent":
                  if (!this[EVENT_TARGET]) {
                    const et = this[EVENT_TARGET] = new EventTarget2();
                    et.dispatchEvent = et.dispatchEvent.bind(et);
                    et.addEventListener = et.addEventListener.bind(et);
                    et.removeEventListener = et.removeEventListener.bind(et);
                  }
                  return this[EVENT_TARGET][name];
                case "document":
                  return this;
                case "navigator":
                  return {
                    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"
                  };
                case "window":
                  return window.get(this);
                case "customElements":
                  if (!this[CUSTOM_ELEMENTS].registry)
                    this[CUSTOM_ELEMENTS] = new CustomElementRegistry(this);
                  return this[CUSTOM_ELEMENTS];
                case "performance":
                  return performance;
                case "DOMParser":
                  return this[DOM_PARSER];
                case "Image":
                  if (!this[IMAGE])
                    this[IMAGE] = ImageClass(this);
                  return this[IMAGE];
                case "MutationObserver":
                  if (!this[MUTATION_OBSERVER].class)
                    this[MUTATION_OBSERVER] = new MutationObserverClass(this);
                  return this[MUTATION_OBSERVER].class;
              }
              return globalExports[name] || globalThis2[name];
            }
          }));
        return window.get(this);
      }
      get doctype() {
        const docType = this[DOCTYPE];
        if (docType)
          return docType;
        const { firstChild } = this;
        if (firstChild && firstChild.nodeType === DOCUMENT_TYPE_NODE)
          return this[DOCTYPE] = firstChild;
        return null;
      }
      set doctype(value) {
        if (/^([a-z:]+)(\s+system|\s+public(\s+"([^"]+)")?)?(\s+"([^"]+)")?/i.test(value)) {
          const { $1: name, $4: publicId, $6: systemId } = RegExp;
          this[DOCTYPE] = new DocumentType(this, name, publicId, systemId);
          knownSiblings(this, this[DOCTYPE], this[NEXT]);
        }
      }
      get documentElement() {
        return this.firstElementChild;
      }
      get isConnected() {
        return true;
      }
      createAttribute(name) {
        return new Attr(this, name);
      }
      createComment(textContent) {
        return new Comment(this, textContent);
      }
      createDocumentFragment() {
        return new DocumentFragment(this);
      }
      createDocumentType(name, publicId, systemId) {
        return new DocumentType(this, name, publicId, systemId);
      }
      createElement(localName) {
        return new Element(this, localName);
      }
      createRange() {
        const range = new Range();
        range.commonAncestorContainer = this;
        return range;
      }
      createTextNode(textContent) {
        return new Text(this, textContent);
      }
      createTreeWalker(root, whatToShow = -1) {
        return new TreeWalker(root, whatToShow);
      }
      createNodeIterator(root, whatToShow = -1) {
        return this.createTreeWalker(root, whatToShow);
      }
      createEvent(name) {
        const event = create(name === "Event" ? new Event2("") : new CustomEvent2(""));
        event.initEvent = event.initCustomEvent = (type, canBubble = false, cancelable = false, detail) => {
          defineProperties(event, {
            type: { value: type },
            canBubble: { value: canBubble },
            cancelable: { value: cancelable },
            detail: { value: detail }
          });
        };
        return event;
      }
      cloneNode(deep = false) {
        const {
          constructor,
          [CUSTOM_ELEMENTS]: customElements,
          [DOCTYPE]: doctype
        } = this;
        const document = new constructor();
        document[CUSTOM_ELEMENTS] = customElements;
        if (deep) {
          const end = document[END];
          const { childNodes } = this;
          for (let { length } = childNodes, i = 0; i < length; i++)
            document.insertBefore(childNodes[i].cloneNode(true), end);
          if (doctype)
            document[DOCTYPE] = childNodes[0];
        }
        return document;
      }
      importNode(externalNode) {
        const deep = 1 < arguments.length && !!arguments[1];
        const node = externalNode.cloneNode(deep);
        const { [CUSTOM_ELEMENTS]: customElements } = this;
        const { active } = customElements;
        const upgrade = (element) => {
          const { ownerDocument, nodeType } = element;
          element.ownerDocument = this;
          if (active && ownerDocument !== this && nodeType === ELEMENT_NODE)
            customElements.upgrade(element);
        };
        upgrade(node);
        if (deep) {
          switch (node.nodeType) {
            case ELEMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE: {
              let { [NEXT]: next, [END]: end } = node;
              while (next !== end) {
                if (next.nodeType === ELEMENT_NODE)
                  upgrade(next);
                next = next[NEXT];
              }
              break;
            }
          }
        }
        return node;
      }
      toString() {
        return this.childNodes.join("");
      }
      querySelector(selectors) {
        return query(super.querySelector, this, selectors);
      }
      querySelectorAll(selectors) {
        return query(super.querySelectorAll, this, selectors);
      }
      getElementsByTagNameNS(_, name) {
        return this.getElementsByTagName(name);
      }
      createAttributeNS(_, name) {
        return this.createAttribute(name);
      }
      createElementNS(nsp, localName, options) {
        return nsp === SVG_NAMESPACE ? new SVGElement(this, localName, null) : this.createElement(localName, options);
      }
    };
    exports2.Document = Document;
    setPrototypeOf(globalExports.Document = function Document2() {
      illegalConstructor();
    }, Document).prototype = Document.prototype;
  }
});

// node_modules/linkedom/cjs/html/document.js
var require_document2 = __commonJS({
  "node_modules/linkedom/cjs/html/document.js"(exports2) {
    "use strict";
    var { ELEMENT_NODE } = require_constants();
    var { CUSTOM_ELEMENTS, END, NEXT } = require_symbols();
    var { htmlClasses } = require_register_html_class();
    var { Document } = require_document();
    var { NodeList } = require_node_list();
    var { customElements } = require_custom_element_registry();
    var { HTMLElement } = require_element3();
    var createHTMLElement = (ownerDocument, builtin, localName, options) => {
      if (!builtin && htmlClasses.has(localName)) {
        const Class = htmlClasses.get(localName);
        return new Class(ownerDocument, localName);
      }
      const { [CUSTOM_ELEMENTS]: { active, registry } } = ownerDocument;
      if (active) {
        const ce = builtin ? options.is : localName;
        if (registry.has(ce)) {
          const { Class } = registry.get(ce);
          const element = new Class(ownerDocument, localName);
          customElements.set(element, { connected: false });
          return element;
        }
      }
      return new HTMLElement(ownerDocument, localName);
    };
    var HTMLDocument = class extends Document {
      constructor() {
        super("text/html");
      }
      get all() {
        const nodeList = new NodeList();
        let { [NEXT]: next, [END]: end } = this;
        while (next !== end) {
          switch (next.nodeType) {
            case ELEMENT_NODE:
              nodeList.push(next);
              break;
          }
          next = next[NEXT];
        }
        return nodeList;
      }
      get head() {
        const { documentElement } = this;
        let { firstElementChild } = documentElement;
        if (!firstElementChild) {
          firstElementChild = this.createElement("head");
          documentElement.prepend(firstElementChild);
        }
        return firstElementChild;
      }
      get body() {
        const { head } = this;
        let { nextElementSibling } = head;
        if (!nextElementSibling) {
          nextElementSibling = this.createElement("body");
          head.after(nextElementSibling);
        }
        return nextElementSibling;
      }
      get title() {
        const { head } = this;
        let title = head.getElementsByTagName("title").shift();
        return title ? title.textContent : "";
      }
      set title(textContent) {
        const { head } = this;
        let title = head.getElementsByTagName("title").shift();
        if (title)
          title.textContent = textContent;
        else {
          head.insertBefore(this.createElement("title"), head.firstChild).textContent = textContent;
        }
      }
      createElement(localName, options) {
        const builtin = !!(options && options.is);
        const element = createHTMLElement(this, builtin, localName, options);
        if (builtin)
          element.setAttribute("is", options.is);
        return element;
      }
    };
    exports2.HTMLDocument = HTMLDocument;
  }
});

// node_modules/linkedom/cjs/svg/document.js
var require_document3 = __commonJS({
  "node_modules/linkedom/cjs/svg/document.js"(exports2) {
    "use strict";
    var { MIME } = require_symbols();
    var { Document } = require_document();
    var SVGDocument = class extends Document {
      constructor() {
        super("image/svg+xml");
      }
      toString() {
        return this[MIME].docType + super.toString();
      }
    };
    exports2.SVGDocument = SVGDocument;
  }
});

// node_modules/linkedom/cjs/xml/document.js
var require_document4 = __commonJS({
  "node_modules/linkedom/cjs/xml/document.js"(exports2) {
    "use strict";
    var { MIME } = require_symbols();
    var { Document } = require_document();
    var XMLDocument = class extends Document {
      constructor() {
        super("text/xml");
      }
      toString() {
        return this[MIME].docType + super.toString();
      }
    };
    exports2.XMLDocument = XMLDocument;
  }
});

// node_modules/linkedom/cjs/dom/parser.js
var require_parser = __commonJS({
  "node_modules/linkedom/cjs/dom/parser.js"(exports2) {
    "use strict";
    var { DOM_PARSER } = require_symbols();
    var { parseFromString } = require_parse_from_string();
    var { HTMLDocument } = require_document2();
    var { SVGDocument } = require_document3();
    var { XMLDocument } = require_document4();
    var DOMParser = class {
      parseFromString(markupLanguage, mimeType) {
        let isHTML = false, document;
        if (mimeType === "text/html") {
          isHTML = true;
          document = new HTMLDocument();
        } else if (mimeType === "image/svg+xml")
          document = new SVGDocument();
        else
          document = new XMLDocument();
        document[DOM_PARSER] = DOMParser;
        return markupLanguage ? parseFromString(document, isHTML, markupLanguage) : document;
      }
    };
    exports2.DOMParser = DOMParser;
  }
});

// node_modules/linkedom/cjs/shared/parse-json.js
var require_parse_json = __commonJS({
  "node_modules/linkedom/cjs/shared/parse-json.js"(exports2) {
    "use strict";
    var {
      NODE_END,
      ELEMENT_NODE,
      ATTRIBUTE_NODE,
      TEXT_NODE,
      COMMENT_NODE,
      DOCUMENT_NODE,
      DOCUMENT_TYPE_NODE,
      DOCUMENT_FRAGMENT_NODE
    } = require_constants();
    var { END, PREV } = require_symbols();
    var { htmlClasses } = require_register_html_class();
    var { knownBoundaries, knownSiblings } = require_utils();
    var { Attr } = require_attr();
    var { Comment } = require_comment();
    var { DocumentType } = require_document_type();
    var { Text } = require_text();
    var { HTMLDocument } = require_document2();
    var { HTMLElement } = require_element3();
    var { SVGElement } = require_element2();
    var { parse } = JSON;
    var append = (parentNode, node, end) => {
      node.parentNode = parentNode;
      knownSiblings(end[PREV], node, end);
    };
    var createHTMLElement = (ownerDocument, localName) => {
      if (htmlClasses.has(localName)) {
        const Class = htmlClasses.get(localName);
        return new Class(ownerDocument, localName);
      }
      return new HTMLElement(ownerDocument, localName);
    };
    var parseJSON = (value) => {
      const array = typeof value === "string" ? parse(value) : value;
      const { length } = array;
      const document = new HTMLDocument();
      let parentNode = document, end = parentNode[END], svg = false, i = 0;
      while (i < length) {
        let nodeType = array[i++];
        switch (nodeType) {
          case ELEMENT_NODE: {
            const localName = array[i++];
            const isSVG = svg || localName === "svg" || localName === "SVG";
            const element = isSVG ? new SVGElement(document, localName, parentNode.ownerSVGElement || null) : createHTMLElement(document, localName);
            knownBoundaries(end[PREV], element, end);
            element.parentNode = parentNode;
            parentNode = element;
            end = parentNode[END];
            svg = isSVG;
            break;
          }
          case ATTRIBUTE_NODE: {
            const name = array[i++];
            const value2 = typeof array[i] === "string" ? array[i++] : "";
            const attr = new Attr(document, name, value2);
            attr.ownerElement = parentNode;
            knownSiblings(end[PREV], attr, end);
            break;
          }
          case TEXT_NODE:
            append(parentNode, new Text(document, array[i++]), end);
            break;
          case COMMENT_NODE:
            append(parentNode, new Comment(document, array[i++]), end);
            break;
          case DOCUMENT_TYPE_NODE: {
            const args = [document];
            while (typeof array[i] === "string")
              args.push(array[i++]);
            if (args.length === 3 && /\.dtd$/i.test(args[2]))
              args.splice(2, 0, "");
            append(parentNode, new DocumentType(...args), end);
            break;
          }
          case DOCUMENT_FRAGMENT_NODE:
            parentNode = document.createDocumentFragment();
            end = parentNode[END];
          case DOCUMENT_NODE:
            break;
          default:
            do {
              nodeType -= NODE_END;
              if (svg && !parentNode.ownerSVGElement)
                svg = false;
              parentNode = parentNode.parentNode || parentNode;
            } while (nodeType < 0);
            end = parentNode[END];
            break;
        }
      }
      switch (i && array[0]) {
        case ELEMENT_NODE:
          return document.firstElementChild;
        case DOCUMENT_FRAGMENT_NODE:
          return parentNode;
      }
      return document;
    };
    exports2.parseJSON = parseJSON;
    var toJSON = (node) => node.toJSON();
    exports2.toJSON = toJSON;
  }
});

// node_modules/linkedom/cjs/index.js
var require_cjs3 = __commonJS({
  "node_modules/linkedom/cjs/index.js"(exports2) {
    "use strict";
    var { DOMParser } = require_parser();
    var { Document: _Document } = require_document();
    var { illegalConstructor } = require_facades();
    var { setPrototypeOf } = require_object();
    ((m) => {
      exports2.parseJSON = m.parseJSON;
      exports2.toJSON = m.toJSON;
    })(require_parse_json());
    ((m) => Object.keys(m).map((k) => k !== "default" && (exports2[k] = m[k])))(require_facades());
    ((m) => Object.keys(m).map((k) => k !== "default" && (exports2[k] = m[k])))(require_html_classes());
    exports2.DOMParser = DOMParser;
    ((m) => {
      exports2.CustomEvent = m.CustomEvent;
    })(require_custom_event());
    ((m) => {
      exports2.Event = m.Event;
    })(require_event());
    ((m) => {
      exports2.EventTarget = m.EventTarget;
    })(require_event_target());
    ((m) => {
      exports2.InputEvent = m.InputEvent;
    })(require_input_event());
    ((m) => {
      exports2.NodeList = m.NodeList;
    })(require_node_list());
    var parseHTML = (html) => new DOMParser().parseFromString(html, "text/html").defaultView;
    exports2.parseHTML = parseHTML;
    function Document() {
      illegalConstructor();
    }
    exports2.Document = Document;
    setPrototypeOf(Document, _Document).prototype = _Document.prototype;
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/CharacterWrap.js
var require_CharacterWrap = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/CharacterWrap.js"(exports2, module2) {
    var HighlightPairedShortcode = require_HighlightPairedShortcode();
    var { parseHTML } = require_cjs3();
    var IndexCounter = class {
      constructor() {
        this.index = 0;
      }
      add() {
        this.index++;
      }
      valueOf() {
        return this.index;
      }
    };
    var CharacterWrap = class {
      constructor() {
        this.multipleCursors = false;
        this.typingConfig = ["0"];
        this.contentTransforms = [];
        this.classPrefix = "charwrap";
      }
      setClassPrefix(prefix) {
        this.classPrefix = prefix;
      }
      setMultipleCursors(useMultipleCursors) {
        this.multipleCursors = !!useMultipleCursors;
      }
      setTypingConfigArray(typingConfig) {
        this.typingConfig = typingConfig;
      }
      addContentTransform(callback) {
        this.contentTransforms.push(callback);
      }
      getTypingConfigResults(indexCounter) {
        let charIndex = indexCounter.valueOf();
        let lowestIndex = 99999999;
        let waitToShow = {};
        let showCursor = false;
        for (let cfg of this.typingConfig) {
          let start, end;
          cfg = "" + cfg;
          if (cfg.indexOf(",") > -1) {
            let split = cfg.split(",");
            start = parseInt(split[0], 10);
            end = split.length > 1 ? start + parseInt(split[1], 10) : charIndex + 1;
          } else if (cfg.indexOf("-") > -1) {
            let split = cfg.split("-");
            start = parseInt(split[0], 10);
            end = split.length > 1 ? parseInt(split[1], 10) : charIndex + 1;
          } else {
            start = parseInt(cfg, 10);
            end = charIndex + 1;
          }
          for (let j = start + 1; j < end; j++) {
            waitToShow[j] = true;
          }
          if (this.multipleCursors && start === charIndex) {
            showCursor = true;
          }
          lowestIndex = Math.min(lowestIndex, start);
        }
        if (!this.multipleCursors && lowestIndex === charIndex) {
          showCursor = true;
        }
        return { showTyped: !waitToShow[charIndex], showCursor };
      }
      modifyNode(node, indexCounter) {
        let classes = [this.classPrefix];
        let showTyped = true;
        let showCursor = false;
        indexCounter.add();
        let results = this.getTypingConfigResults(indexCounter);
        showTyped = results.showTyped;
        showCursor = results.showCursor;
        if (showTyped) {
          classes.push(`${this.classPrefix}-typed ${this.classPrefix}-typed-initial`);
        }
        if (showCursor) {
          classes.push(`${this.classPrefix}-cursor ${this.classPrefix}-cursor-initial`);
        }
        node.className = classes.join(" ");
        node.setAttribute("data-index", indexCounter.valueOf());
      }
      walkTree(doc, root, indexCounter = null) {
        for (let node of root.childNodes) {
          if (node.nodeType === 3) {
            let characters = Array.from(node.textContent);
            for (let char of characters) {
              let newTextEl = doc.createElement("span");
              this.modifyNode(newTextEl, indexCounter);
              newTextEl.innerHTML = char;
              node.parentNode.insertBefore(newTextEl, node);
            }
            node.remove();
          } else if (node.nodeType === 1) {
            if (node.classList.contains(this.classPrefix)) {
              continue;
            }
            if (node.nodeName === "BR") {
              this.modifyNode(node, indexCounter);
            } else {
              this.walkTree(doc, node, indexCounter);
            }
          }
        }
      }
      wrapContent(content, codeFormat) {
        for (let transform of this.contentTransforms) {
          let result = transform(content);
          if (result === false) {
            return content;
          }
        }
        let highlightedContent = HighlightPairedShortcode(content, codeFormat, "", {
          trim: false
        });
        let { document } = parseHTML(`<html><body>${highlightedContent}</body></html>`);
        let counter = new IndexCounter();
        let bodyEl = document.getElementsByTagName("body")[0];
        this.walkTree(document, bodyEl, counter);
        return bodyEl.innerHTML;
      }
    };
    module2.exports = CharacterWrap;
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/markdownSyntaxHighlightOptions.js
var require_markdownSyntaxHighlightOptions = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/src/markdownSyntaxHighlightOptions.js"(exports2, module2) {
    var Prism = require("prismjs");
    var PrismLoader = require_PrismLoader();
    var HighlightLinesGroup = require_HighlightLinesGroup();
    var getAttributes = require_getAttributes();
    module2.exports = function(options = {}) {
      const preAttributes = getAttributes(options.preAttributes);
      const codeAttributes = getAttributes(options.codeAttributes);
      return function(str, language) {
        if (!language) {
          return "";
        }
        let split = language.split("/");
        if (split.length) {
          language = split.shift();
        }
        let html;
        if (language === "text") {
          html = str;
        } else {
          html = Prism.highlight(str, PrismLoader(language), language);
        }
        let hasHighlightNumbers = split.length > 0;
        let highlights = new HighlightLinesGroup(split.join("/"), "/");
        let lines = html.split("\n").slice(0, -1);
        lines = lines.map(function(line, j) {
          if (options.alwaysWrapLineHighlights || hasHighlightNumbers) {
            let lineContent = highlights.getLineMarkup(j, line);
            return lineContent;
          }
          return line;
        });
        return `<pre class="language-${language}"${preAttributes}><code class="language-${language}"${codeAttributes}>${lines.join(options.lineSeparator || "<br>")}</code></pre>`;
      };
    };
  }
});

// node_modules/@11ty/eleventy-plugin-syntaxhighlight/.eleventy.js
var require_eleventy = __commonJS({
  "node_modules/@11ty/eleventy-plugin-syntaxhighlight/.eleventy.js"(exports2, module2) {
    var pkg = require_package();
    var Prism = require("prismjs");
    var hasTemplateFormat = require_hasTemplateFormat();
    var HighlightPairedShortcode = require_HighlightPairedShortcode();
    var LiquidHighlightTag = require_LiquidHighlightTag();
    var CharacterWrap = require_CharacterWrap();
    var markdownPrismJs = require_markdownSyntaxHighlightOptions();
    module2.exports = {
      initArguments: { Prism },
      configFunction: function(eleventyConfig, options = {}) {
        try {
          eleventyConfig.versionCheck(pkg["11ty"].compatibility);
        } catch (e) {
          console.log(`WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}`);
        }
        options = Object.assign({
          alwaysWrapLineHighlights: false,
          lineSeparator: "<br>",
          preAttributes: {},
          codeAttributes: {}
        }, options);
        if (hasTemplateFormat(options.templateFormats, "liquid")) {
          eleventyConfig.addLiquidTag("highlight", (liquidEngine) => {
            let highlight = new LiquidHighlightTag(liquidEngine);
            return highlight.getObject(options);
          });
        }
        if (hasTemplateFormat(options.templateFormats, "njk")) {
          eleventyConfig.addPairedNunjucksShortcode("highlight", (content, args) => {
            let [language, ...highlightNumbers] = args.split(" ");
            return HighlightPairedShortcode(content, language, highlightNumbers.join(" "), options);
          });
        }
        if (hasTemplateFormat(options.templateFormats, "md")) {
          eleventyConfig.addMarkdownHighlighter(markdownPrismJs(options));
        }
      }
    };
    module2.exports.pairedShortcode = HighlightPairedShortcode;
    module2.exports.CharacterWrap = CharacterWrap;
  }
});

// functions/getcode/eleventy-app-config-modules.js
var require_eleventy_app_config_modules = __commonJS({
  "functions/getcode/eleventy-app-config-modules.js"() {
    require("@11ty/eleventy");
    require_eleventy();
  }
});

// functions/getcode/eleventy-app-globaldata-modules.js
var require_eleventy_app_globaldata_modules = __commonJS({
  "functions/getcode/eleventy-app-globaldata-modules.js"() {
  }
});

// functions/getcode/eleventy-bundler-modules.js
var require_eleventy_bundler_modules = __commonJS({
  "functions/getcode/eleventy-bundler-modules.js"() {
    require_eleventy_app_config_modules();
    require_eleventy_app_globaldata_modules();
  }
});

// functions/getcode/index.js
var { EleventyServerless } = require("@11ty/eleventy");
var fetch = require_node_ponyfill();
require_eleventy_bundler_modules();
async function handler(event) {
  let textResult;
  try {
    if (event.queryStringParameters.siteUrl) {
      const url = new URL(event.queryStringParameters.siteUrl);
      const result = await fetch(url);
      textResult = await result.text();
    }
  } catch (error) {
    console.error("Fetching error:", error);
  }
  let elev = new EleventyServerless("getcode", {
    path: event.path,
    query: event.queryStringParameters,
    functionsDir: "./functions/",
    config: function(config) {
      config.addGlobalData("sourceCode", textResult);
    }
  });
  try {
    let [page] = await elev.getOutput();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=UTF-8"
      },
      body: page.content
    };
  } catch (error) {
    if (elev.isServerlessUrl(event.path)) {
      console.log("Serverless Error:", error);
    }
    return {
      statusCode: error.httpStatusCode || 500,
      body: JSON.stringify({
        error: error.message
      }, null, 2)
    };
  }
}
exports.handler = handler;
/*! (c) Andrea Giammarchi - ISC */
//# sourceMappingURL=index.js.map
