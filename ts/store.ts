import { Key } from "./key";
import { TokenModel } from "./tokenModel";

export class Store {
  private static readonly LocalStorageKey: string = "decoderidentitytokens"; 

  constructor() {
  }

  public retrieveAll(): [TokenModel[], Key] {
    return null;
  }

  public saveToken(token: TokenModel) {
  }

  public saveKey(key: Key) {
  }

  public purgeLocalStorage() {
    //tbd
    localStorage.removeItem(Store.LocalStorageKey);
  }
}