import { FetchClient as core } from "./FetchClient.js";

export const HttpClient = class {
  constructor(baseUrl) {
    this.init(baseUrl);
    this.logResponse = false;
    this.collectResponses = false;
    this.responses = [];
  }

  static create(baseUrl) {
    return new HttpClient(baseUrl);
  }

  setCollectResponses(p) {
    this.collectResponses = p;
  }

  clearResponses() {
    this.responses = [];
  }

  getResponses() {
    return this.responses;
  }

  addLogResponse(hint, p) {
    this.responses.push(this.createLogResponse(hint, p));
  }

  createLogResponse(hint, p) {
    let response = {};
    response.hint = hint;
    if (!p) {
      response.content = "<null>";
      return this.response;
    }

    response.content = "exists";
    response.status = p["status"];
    response.statusText = p["statusText"];
    response.headers = {};
    for (var header of p.headers) {
      if (header && header.length > 0 && header[0] && header[0].startsWith("x-ms")) {
        if (header.length === 1) {
          response.headers[header[0]] = "";
        }
        else if (header.length === 2) {
          response.headers[header[0]] = header[1];
        }
      }
    }

    return response;
  }

  init(baseUrl) {
    this.baseUrl = baseUrl;
    this.proxy = null;
  }

  _buildUrl(query) {
    if (query.startsWith("https://") || query.startsWith("http://")) {
      return query;
    }

    return this.baseUrl + query;
  }

  async postjson(query, body, modifyHeaderAction) {
    return await this._withjson(query, body, "POST", modifyHeaderAction);
  }

  async patchjson(query, body, modifyHeaderAction) {
    return await this._withjson(query, body, "PATCH", modifyHeaderAction);
  }

  async _withjson(query, body, method, modifyHeaderAction) {
    var sbody = "string" === typeof(body) ? body : JSON.stringify(body);
    if (this.logResponse) { console.log("json body", sbody); }
    var headers = {
      'Content-Type': 'application/json'
      , 'Accept': 'application/json'
      , 'Prefer': 'return=representation'
    };
    if (modifyHeaderAction) { modifyHeaderAction(headers); }
    try {
      let url = this._buildUrl(query);
      let response = await core.fetch(url, {
        method: method,
        body: sbody,
        headers: headers,
      }, this.proxy);
      if (response) {
        var p = response;
        if (this.logResponse) { console.log("response", p); }
        if (this.collectResponses) { this.addLogResponse({ query: url, body: body, method: method }, p); }
        try {
          if (null === p || "" === p) {
            return {};
          }
          if (200 <= p.status && 299 >= p.status) {
            //fine
          }
          else {
            console.error(">> url", url);
            throw new Error(`Bad response status executing json request. status:${p.status}, '${p.statusText}', query:${url}, body:'${sbody}'`);
          }
          var pjson = null;
          try {
            pjson = await p.json();
          }
          catch (e) {
            //
          }
          if (pjson) {
            return pjson;
          }
          try {
            pjson = await p.text();
            return pjson;
          }
          catch (e) {
            //
          }
          if (this.logResponse) { console.log("response is not a string, so return it as it is.", "type", typeof (p)); }
          return p;
        }
        catch (e) {
          console.error("error:", e);
          //console.error("response:", p);
          throw e;
        }
      }
      else {
        return {};
      }

    }
    catch (e) {
      console.error("error:", e);
      if (this.collectResponses) { this.addLogResponse({ query: query, body: body, method: method, error: e }, null); }
    }

    return result;
  }

  async invoke(query, body, method, headers) {
    var result = null;
    if (this.logResponse) { console.log("body", body); }
    try {
      let response = await core.fetch(this._buildUrl(query), {
        method: method,
        body: body,
        headers: headers,
      }, this.proxy);
      if (response) {
        var p = response;
        if (this.logResponse) { console.log("response", p); }
        if (this.collectResponses) { this.addLogResponse({ query: query, body: body, method: method }, p); }
        try {
          if (null === p || "" === p) {
            return {};
          }
          if (200 <= p.status && 299 >= p.status) {
            //fine
          }
          else {
            throw new Error(`Bad response status executing json request. status:${p.status}, '${p.statusText}', query:${query}, body:'${body}'`);
          }
          result = await p.text();
          if (this.logResponse) {
            console.log("response", result);
          }
        }
        catch (e) {
          console.error("error:", e);
          //console.error("response:", p);
          throw e;
        }
      }
      else {
        result = null;
      }

    }
    catch (e) {
      console.error("error:", e);
      if (this.collectResponses) { this.addLogResponse({ query: query, body: body, method: method, error: e }, null); }
    }

    return result;
  }

  async get(query, modifyHeaderAction) {
    var headers = {
      'Accept': 'application/json'
    };
    if (modifyHeaderAction) { modifyHeaderAction(headers); }
    var url = this._buildUrl(query);
    if (this.logResponse) { console.log("request", url); }
    let result = await core.fetch(this._buildUrl(query), {
      method: "GET",
      headers: headers,
    }, this.proxy).then(p => {
      if (this.logResponse) { console.log("response", p); }
      if (this.collectResponses) { this.addLogResponse(query, p); }
      if (200 !== p.status && 204 !== p.status) {
        throw new Error(`Bad response status executing json request. status:${p.status}, '${p.statusText}'. query:${query}`);
      }
      return p.json()
    });
    return result;
  }

  async getRaw(query, modifyHeaderAction) {
    var headers = {
    };
    if (modifyHeaderAction) { modifyHeaderAction(headers); }
    var url = this._buildUrl(query);
    if (this.logResponse) { console.log("request", url); }
    let result = await core.fetch(this._buildUrl(query), {
      method: "GET",
      headers: headers,
    }, this.proxy).then(p => {
      if (this.logResponse) { console.log("response", p); }
      if (this.collectResponses) { this.addLogResponse(query, p); }
      if (200 !== p.status && 204 !== p.status) {
        throw new Error(`Bad response status executing json request. status:${p.status}, '${p.statusText}'. query:${query}`);
      }
      return p.text();
    });
    return result;
  }

  async download(query, modifyHeaderAction) {
    var headers = {};
    if (modifyHeaderAction) { modifyHeaderAction(headers); }

    let url = this._buildUrl(query);
    console.log("download", url);
    let result = await core.fetch(url, {
      method: "GET",
      headers: headers,
    }, this.proxy).then(async p => {
      if (this.logResponse) { console.log("response", p); }
      if (this.collectResponses) { this.addLogResponse(query, p); }
      if (200 !== p.status && 204 !== p.status) {
        throw new Error(`Bad response status executing json request. status:${p.status}, '${p.statusText}'. query:${query}`);
      }
      return await p.arrayBuffer();
    });
    return result;
  }
}

