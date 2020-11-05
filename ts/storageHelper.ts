import { Secret } from "./secret";
import { TokenModel } from "./tokenModel";

export class StorageHelper {
  private static readonly LocalStorageKey: string = "decoderidentitytokens"; 

  constructor() {
  }

  public retrieveAll(): [TokenModel[], Secret] {
    return null;
  }

  public saveToken(token: TokenModel) {
  }

  public saveSecret(secret: Secret) {
  }

  public purgeLocalStorage() {
    //tbd
    localStorage.removeItem(StorageHelper.LocalStorageKey);
  }
}