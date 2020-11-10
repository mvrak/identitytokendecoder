import { Key } from "./key";
import { VerifySettings, DecryptSettings, TimeUnit } from "./settings";
import { TokenModel } from "./tokenModel";

interface StoredToken {
  id: string,
  title: string;
  saved: Date;
  raw: string;

  verifyKeyId: string;
  verifyAutoSelect: boolean;
  verifyAddExpiry: boolean;
  verifyValidTime: number;
  verifyValidTimeUnit: string;

  decryptKeyId: string;
  decryptAutoSelect: boolean;
}

interface StoredKey {
  id: string,
  title: string;
  saved: Date;
  publicKey: string;
  privateKey: string;
}

export class Store {
  private static readonly LocalStorageTokensKey: string = "tokens"; 
  private static readonly LocalStorageKeysKey: string = "keys"; 

  private static readonly SampleTokens: StoredToken[] = [
    {
      id: "token1",
      title: "Sample Token",
      saved: new Date(),
      raw: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dnZWRJbkFzIjoiYWRtaW4iLCJpYXQiOjE0MjI3Nzk2Mzh9.gzSraSYS8EXBxLN_oWnFSRgCzcmJmMjLiuyu5CSpyHI",
      verifyKeyId: null,
      verifyAutoSelect: true,
      verifyAddExpiry: false,
      verifyValidTime: 300,
      verifyValidTimeUnit: "sec",
      decryptKeyId: "",
      decryptAutoSelect: true 
    },
    {
      id: "token2",
      title: "Sample Encrypted Token",
      saved: new Date(),
      raw: "eyJ0eXAiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiQTI1NktXIiwia2lkIjoieFYtVVQ2SVl0THdwZmY3U1lRVUgyUGdiQl9kS21uZGVqeUZwSmM1Ni1FYyJ9.OCmqxfr3sIJ0hWstMMRJXe2StDBGmAuCgZDfgL_jfTXLpp4rsB-hHw.UaTzj5hEfvuqOSgo.s-8T703SvsBfVOI0ntoJuFStoAPT5W1isWR6US49QWSIPvGvLi3SBPrsfhbHDvfMYiVpz_jv0L44UyjL72xKnrhkpzrqfO_ITFxbbNAWmo7D_sjENbkLsjfd9ThfXqDqp1yQRaoIKl-DsZ3p4Qi1PLd57G2gJpmsJzIuIwu-gKe-E4OLMSZa8r_1iGpuSVeMfA2iP_gl0vNnAOY.OjMS82VFUI2gGRi1e5HWaw",
      verifyKeyId: null,
      verifyAutoSelect: true,
      verifyAddExpiry: false,
      verifyValidTime: 300,
      verifyValidTimeUnit: "sec",
      decryptKeyId: "",
      decryptAutoSelect: true 
    }
  ]

  private static readonly SampleKeys: StoredKey[] = [
    {
      id: "key1",
      title: "Sample Key",
      saved: new Date(),
      publicKey: "vFfSurgM7hZIkirsjn8IFhJ3optS_GCecC-_qGfhMRQ",
      privateKey: "vFfSurgM7hZIkirsjn8IFhJ3optS_GCecC-_qGfhMRQ"
    }
  ]

  private readonly _storage: Storage;

  private readonly _tokens: StoredToken[];
  private readonly _keys: StoredKey[];

  constructor() {
    this._storage = window.localStorage;

    let tokens = this._storage.getItem(Store.LocalStorageTokensKey);

    if (!!!tokens) {
      this._tokens = Store.SampleTokens
      this._storage.setItem(Store.LocalStorageTokensKey, JSON.stringify(Store.SampleTokens));
    } else {
      this._tokens = <StoredToken[]>JSON.parse(tokens);
    }
    
    let keys = this._storage.getItem(Store.LocalStorageKeysKey);

    if (!!!keys) {
      this._keys = Store.SampleKeys
      this._storage.setItem(Store.LocalStorageKeysKey, JSON.stringify(Store.SampleKeys));
    } else {
      this._keys = <StoredKey[]>JSON.parse(keys);
    }
  }

  public retrieveAll(): [TokenModel[], Key[]] {
    const keys = this._keys.map(k => this._getKey(k));
    const tokens = this._tokens.map(t => {
      const k1 = keys.find(k => k.id === t.verifyKeyId);
      const k2 = keys.find(k => k.id === t.decryptKeyId);
      return this._getTokenModel(t, k1, k2);
    });
    return [tokens, keys];
  }

  public saveToken(token: TokenModel) {
    const storedToken = this._getStoredToken(token);
    const index = this._tokens.findIndex(t => t.id === token.id);
    if (index !== -1) {
      this._tokens[index] = storedToken;
    } else {
      this._tokens.push(storedToken);
    }
    this._storage.setItem(Store.LocalStorageTokensKey, JSON.stringify(this._tokens));
  }

  public saveKey(key: Key) {
    const storedKey = this._getStoredKey(key);
    const index = this._keys.findIndex(t => t.id === key.id);
    if (index !== -1) {
      this._keys[index] = storedKey;
    } else {
      this._keys.push(storedKey);
    }
    this._storage.setItem(Store.LocalStorageKeysKey, JSON.stringify(this._keys));
  }

  public deleteToken(token: TokenModel) {
    const index = this._tokens.findIndex(t => t.id === token.id);
    if (index !== -1) {
      this._tokens.splice(index);
    }
    this._storage.setItem(Store.LocalStorageTokensKey, JSON.stringify(this._tokens));
  }

  public deleteKey(key: Key) {
    const index = this._keys.findIndex(t => t.id === key.id);
    if (index !== -1) {
      this._keys.splice(index);
    }
    this._storage.setItem(Store.LocalStorageKeysKey, JSON.stringify(this._keys));
  }

  public purgeLocalStorage() {
    localStorage.removeItem(Store.LocalStorageKeysKey);
    localStorage.removeItem(Store.LocalStorageTokensKey);
  }

  private _getTokenModel(storedToken: StoredToken, key1: Key, key2: Key): TokenModel {
    const verifySettings = new VerifySettings(key1, storedToken.verifyAutoSelect, storedToken.verifyAddExpiry,
      storedToken.verifyValidTime, storedToken.verifyValidTimeUnit as TimeUnit);
    const decryptSettings = new DecryptSettings(key2, storedToken.decryptAutoSelect);
    return new TokenModel(storedToken.id, storedToken.title, storedToken.saved, storedToken.raw, verifySettings, decryptSettings);

  }

  private _getKey(storedKey: StoredKey): Key {
    return new Key(storedKey.id, storedKey.title, storedKey.saved, storedKey.publicKey, storedKey.privateKey);
  }


  private _getStoredToken(token: TokenModel): StoredToken {
    return {
      id: token.id,
      title: token.title,
      saved: token.saved,
      raw: token.token.raw,
      verifyKeyId: token.verifySettings.key?.id,
      verifyAutoSelect: token.verifySettings.autoSelect,
      verifyAddExpiry: token.verifySettings.addExpiry,
      verifyValidTime: token.verifySettings.validTime,
      verifyValidTimeUnit: token.verifySettings.validTimeUnit,
      decryptKeyId: token.decryptSettings.key?.id,
      decryptAutoSelect: token.decryptSettings.autoSelect
    };
  }

  private _getStoredKey(key: Key): StoredKey {
    return {
      id: key.id,
      title: key.title,
      saved: key.saved,
      publicKey: key.publicKey,
      privateKey: key.privateKey
    };
  }
}
