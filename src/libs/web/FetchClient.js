import fetch1 from "node-fetch";
import httpsProxy from "https-proxy-agent";

export const FetchClient = class {
  static async postjson(url, body) {
    return fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
    }).then(p => p.json());


  }

  static async postjsonx(url, body) {
    var response = await f.fetch(url, {
      method: "POST",
      body: JSON.stringify(body)
    }).then(p => p.json());

    return response;
  }

  static async fetch(url, request, proxy) {
    var response = null;
    if (proxy && proxy.enabled) {
      console.log("fetch with proxy", proxy.url);
      request.agent = new httpsProxy(proxy.url);
      response = await fetch1(url, request);
    }
    else {
      //console.log("fetch without proxy");
      response = await fetch1(url, request);
    }

    //console.log("core.fetch.response", response);
    return response;
  }
}