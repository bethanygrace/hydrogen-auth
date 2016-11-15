'use babel';

import { CompositeDisposable, Disposable } from 'atom';

ws = require('ws')
xhr = require('xmlhttprequest')
http = require('http')
https = require('https')
querystring = require('querystring');
views = require ('./views')

const hostToCookie = {};

function login() {
    let gatewaysStr = atom.config.get('Hydrogen.gateways');
    let gateways = null;
    try {
        gateways = JSON.parse(gatewaysStr);
    } catch (error) {
        let message = "Your Hydrogen config is broken: #{key}"
        atom.notifications.addError(message, {detail: error})
    }

    let gatewayListing = new views.CustomListView('No gateways available', function(gatewayInfo) {
        let url = gatewayInfo.options.baseUrl;
        if (!url) {
            atom.notifications.addError("Gateway has no options.baseUrl!")
            return;
        }

        let loginInput = new views.TextInputView("Please review and confirm the login URL", url+"/login", function(loginURL) {
            let passwordInput = new views.TextInputView("Enter your password (text not hidden)", "", function(password) {
                connect(loginURL, password);
                atom.notifications.addSuccess('You should now try connecting to the gateway again.');
            });
            passwordInput.attach()
        });
        loginInput.attach()
    })

    gatewayListing.setItems(gateways)
    gatewayListing.setError('Select a gateway')
}

function parseURL(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
}

function connect(url, password) {
    let parsed = parseURL(url);
    console.log('Connecting to', parsed.protocol+'//'+parsed.hostname+":"+parsed.port+parsed.pathname)
    let postData = querystring.stringify({password: password})
    var postOptions = {
        protocol: parsed.protocol,
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var request;
    if (parsed.protocol == 'https:') {
        request = https.request;
    } else {
        request = http.request;
    }

    var postReq = request(postOptions, function(res) {
        hostToCookie[parsed.host] = postReq.res.headers['set-cookie'][0];
        console.log('Get response', postReq.res.headers['set-cookie'][0]);
        console.log(hostToCookie)
    });

    postReq.write(postData);
    postReq.end();
    console.log('Wrote out request');
}

function getConnectionInfo(url) {
    for (var host in hostToCookie) {
       if (hostToCookie.hasOwnProperty(host)) {
           if (url.includes(host)) {
               return {'host': host, 'cookie': hostToCookie[host]};
           }
       }
    }
    return null;
}

function myXMLHttpRequest() {
    xhr.XMLHttpRequest.call(this)

    let oldOpen = this.open;

    this.open = function(method, url, async, user, password) {
        try {
            oldOpen.call(this, method, url, async, user, password);
        } catch (e) {
            console.log("myXMLHttpRequest: got error", e)
            throw (e);
        }

        let connectionInfo = getConnectionInfo(url);

        if (connectionInfo) {
            this.setDisableHeaderCheck(true)
            this.setRequestHeader('Host', connectionInfo.host)
            this.setRequestHeader('Cookie', connectionInfo.cookie)
        }
    }
}
myXMLHttpRequest.prototype = Object.create(xhr.XMLHttpRequest.prototype, {})

function myWebSocket(address, protocols, options) {
    let connectionInfo = getConnectionInfo(address);
    if (connectionInfo) {
        if (options === undefined) {
            options = {}
        }
        if (options.headers === undefined) {
            options.headers = {}
        }

        options.headers.Host = connectionInfo.host;
        options.headers.Cookie = connectionInfo.cookie;
    }

    try {
        ws.call(this, address, protocols, options)
    } catch (e) {
        console.log("myWebSocket: got error", e)
        throw (e);
    }
}
myWebSocket.prototype = Object.create(ws.prototype, {})

function monkeypatch() {
    global.XMLHttpRequest = myXMLHttpRequest
    global.WebSocket = myWebSocket
}

const HydrogenAuthPlugin = {
  subscriptions: null,
  hydrogen: null,

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'hydrogen-auth:login-to-gateway': () => this.connectToHydrogen(),
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  consumeHydrogen(hydrogen) {
    this.hydrogen = hydrogen;
    return new Disposable(() => {
      this.hydrogen = null;
    });
  },

  connectToHydrogen() {
      if (!this.hydrogen) {
          atom.notifications.addError('Hydrogen `v1.0.0+` has to be running.');
          return;
      }

      monkeypatch();
      login();
  },
};

export default HydrogenAuthPlugin;
