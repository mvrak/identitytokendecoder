import { JWK } from "node-jose";
import { Key } from "./key";

export class JWKWithKey {
  public jwk: JWK.Key;
  public key: Key;
}

export class KeyFetch {
  // Get 
  private _issuerKeys: { [issuer: string]: { [kid: string] : JWKWithKey } };

  constructor() {
    this._issuerKeys = {};
  }

  public async fetch(issuer: string, kid: string): Promise<JWKWithKey> {
    if (!!this._issuerKeys[issuer]) {
      if (!!this._issuerKeys[issuer][kid]) {
        return this._issuerKeys[issuer][kid];
      } else {
        return null;
      }
    }

    // Get from issuer
    return fetch(`${issuer}.well-known/openid-configuration`)
      .then(response => response.json())
      .then(data => {
        const uri = data.jwks_uri;
        if (!!!uri) {
          return null;
        }

        return fetch(uri)
          .then(response => response.json())
          .then(data => {
            if (!!!data.keys) {
              return null;
            }

            this._issuerKeys[issuer] = {}
            const promises: Promise<JWK.Key>[] = [];

            data.keys.forEach(k => {
              promises.push(JWK.asKey(k).then((jwk: JWK.Key) => {
                const key = new Key("auto", jwk.kid, undefined, jwk.toPEM());
                key.url = uri;
                this._issuerKeys[issuer][jwk.kid] = {
                  jwk: jwk,
                  key: key
                };
              }));
            });

            return Promise.all(promises).then(() => this._issuerKeys[issuer][kid]);
          })
      })
      .catch(() => null);
  }
}
