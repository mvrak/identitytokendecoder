import { Key } from "./key";
import { SettingsTab, TimeUnit } from "./settings";
import { Store } from "./store";
import { SigningAlgorithm, EncryptionAlgorithm, JWT, Token } from "./token";
import { TokenModel } from "./tokenModel";
import * as Claims from "./claims";
import * as Utils from "./utils";

export class App {
  private static readonly maxTokenMenuLength: number = 35;

  private static readonly tokenColors: string[] = [
    "w3-text-red",
    "w3-text-blue",
    "w3-text-green",
    "w3-text-orange",
    "w3-text-purple",
    "w3-text-teal",
    "w3-text-blue-gray",
    "w3-text-amber",
    "w3-text-indigo",
    "w3-text-lime"
  ];

  private _tokens: TokenModel[];
  private _keys: Key[];

  private _current: TokenModel | Key;

  private _settingsTab: SettingsTab;

  private _store: Store;

  constructor() {
    this._store = new Store();

    // TODO: Do token retrieval from local storage
    // const storedValues = this._storage.retrieveAll();
    // [this._tokens, this._keys] = storedValues[0];

    this._tokens = [
      new TokenModel("token1", "Sample Token", new Date("1 November, 2020"), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.GCy21r1m_iGRo7ihyi5vhgvBnQe1uGtLHpE7aUcUEfE"),
      new TokenModel("token2", "Sample Token 2", new Date("1 November, 2020"), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
    ];
    
    this._keys = [
      new Key("key1", "Sample Key", new Date("1 November, 2020"), "vFfSurgM7hZIkirsjn8IFhJ3optS_GCecC-_qGfhMRQ")
    ];

    this._settingsTab = SettingsTab.Verify;

    this._populateSelect();
    this._registerCallbacks();

    this._renderTokens();
    this._renderKeys();
    
    this._toggleMenu("tokens");

    this._displayToken(this._tokens[0]);
  }

  private _displayToken(token: TokenModel) {
    this._highlightMenuItem(token.id);
    this._current = token;

    this._expandMenu("tokens");

    document.getElementById("tokensDisplay").style.display = "block";
    document.getElementById("keysDisplay").style.display = "none";
    
    this._renderTokenTitle(token);
    document.getElementById("tokenLastSaved").innerHTML = Utils.displayDate(token.saved);
    document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.token.raw);
    
    this._renderTokenDetails(token);
    this._enableTokenButtons(token);
    this._openTab(this._settingsTab);
    
    this._verify(token)
      .then(() => this._decrypt(token))
      .then(() => this._renderTabs(token));
  }
  
  private _displayKey(key: Key) {
    this._highlightMenuItem(key.id);
    this._current = key;

    this._expandMenu("keys");

    document.getElementById("tokensDisplay").style.display = "none";
    document.getElementById("keysDisplay").style.display = "block";

    this._renderKeyTitle(key);
    document.getElementById("keyLastSaved").innerHTML = Utils.displayDate(key.saved);
    document.getElementById("publicKey").innerHTML = Utils.parseKey(key.publicKey ?? "", "<br>");
    document.getElementById("privateKey").innerHTML = Utils.parseKey(key.privateKey ?? "", "<br>");

    // Enable/disable buttons
    this._enableKeyButtons(key);
  }
  
  private _newToken() {
    const id = this._getNewTokenId();
    const newToken = new TokenModel(id, "New Token");
    this._tokens.push(newToken);
    this._renderNewToken(newToken);
    this._expandMenu("tokens");
    this._displayToken(newToken);
  }

  private _newKey() {
    const id = this._getNewKeyId();
    const newKey = new Key(id, "New Key");
    this._keys.push(newKey);
    this._renderNewKey(newKey);
    this._expandMenu("keys");
    this._displayKey(newKey);
  }

  private _onTokenChange() {
    const rawTokenDiv = document.getElementById("rawToken");
    const tokenString = rawTokenDiv.textContent;

    const token = this._current as TokenModel;
    token.setToken(tokenString);

    
    this._renderTokenTitle(token);
    rawTokenDiv.innerHTML = this._displayColorCodedToken(tokenString);
    this._renderTokenDetails(token);
    this._reRenderToken(token);
    
    // Enable/disable buttons
    this._enableTokenButtons(token);

    this._verify(token)
      .then(() => this._decrypt(token))
      .then(() => this._renderTabs(token));
  }

  private _onKeyChange() {
    const publicKeyDiv = document.getElementById("publicKey");
    const privateKeyDiv = document.getElementById("privateKey");
    
    const publicKey = publicKeyDiv.textContent;
    const privateKey = privateKeyDiv.textContent;

    const key = this._current as Key;
    key.publicKey = publicKey;
    key.privateKey = privateKey;

    this._renderKeyTitle(key);
    this._reRenderKey(key);

    // Enable/disable buttons
    this._enableKeyButtons(key);
  }

  private _onTokenTitleChange() {
    const token = this._current as TokenModel;
    const tokenTitle = document.getElementById("tokenTitle");
    
    token.title = tokenTitle.textContent;

    document.getElementById("tokenDirty").innerHTML = token.isDirty() ? "*" : "";
    this._reRenderToken(token);
    this._enableTokenButtons(token);
  }

  private _onKeyTitleChange() {
    const key = this._current as Key;
    const keyTitle = document.getElementById("keyTitle");
    
    key.title = keyTitle.textContent;

    document.getElementById("keyDirty").innerHTML = key.isDirty() ? "*" : "";
    this._reRenderKey(key);
    this._enableKeyButtons(key);
  }

  private _onTokenSave() {
    const token = this._current as TokenModel;
    token.save();

    this._store.saveToken(token);
    document.getElementById("tokenLastSaved").innerHTML = Utils.displayDate(token.saved);

    this._onSaveDiscardToken(token);
  }
  
  private _onTokenDiscard() {
    const token = this._current as TokenModel;
    token.discard();

    document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.token.raw);
    this._renderTokenDetails(token);
    this._onSaveDiscardToken(token);

    this._verify(token)
      .then(() => this._decrypt(token))
      .then(() => this._renderTabs(token));

  }
  
  private _onTokenDelete() {
    const token = this._current as TokenModel;
    
    let index = this._tokens.indexOf(token);
    this._tokens.splice(index, 1);
    
    this._renderTokens();
    if (this._tokens.length > 0) {
      if (index >= this._tokens.length) {
        index = this._tokens.length - 1;
      }
      this._displayToken(this._tokens[index]);
    } else {
      this._newToken();
    }
  }

  private _onKeySave() {
    const key = this._current as Key;
    key.save();
    
    this._store.saveKey(key);
    document.getElementById("tokenLastSaved").innerHTML = Utils.displayDate(key.saved);
    
    this._onSaveDiscardKey(key);
    this._enableKeyButtons(key);
  }
  
  private _onKeyDiscard() {
    const key = this._current as Key;
    key.discard();
    
    document.getElementById("publicKey").innerHTML = Utils.parseKey(key.publicKey ?? "", "<br>");
    document.getElementById("privateKey").innerHTML = Utils.parseKey(key.privateKey ?? "", "<br>");

    this._onSaveDiscardKey(key);
    this._enableKeyButtons(key);
  }
  
  private _onKeyDelete() {
    const key = this._current as Key;

    // Clear settings where this key is the key
    this._tokens.forEach((token) => {
      if (token.verifySettings.key === key) {
        token.verifySettings.key = null;
      }

      if (token.decryptSettings.key === key) {
        token.decryptSettings.key = null;
      }
    });

    let index = this._keys.indexOf(key);
    this._keys.splice(index, 1);
    
    this._renderKeys();
    if (this._keys.length > 0) {
      if (index >= this._keys.length) {
        index = this._keys.length - 1;
      }
      this._displayKey(this._keys[index]);
    } else {
      this._displayToken(this._tokens[0]);
    }
  }

  // private _onKeyFetch() {
  // }

  // private _onKeyUpload() {
  // }

  private _onVerifyKeyChanged(id: string) {
    const token = this._current as TokenModel;
    const keySelect = document.getElementById(id) as HTMLInputElement;
    
    token.verifySettings.key = this._keys.find((key) => key.id === keySelect.value);

    this._verify(token)
      .then(() => this._decrypt(token))
      .then(() => {
        this._renderVerifyTab(token);
        this._renderGenerateTab(token);
      });
  }

  private _onDecryptKeyChanged(id: string) {
    const token = this._current as TokenModel;
    const keySelect = document.getElementById(id) as HTMLInputElement;

    token.decryptSettings.key = this._keys.find((key) => key.id === keySelect.value);

    this._decrypt(token).then(() => {
      this._renderDecryptTab(token);
      this._renderEncryptTab(token);
    });
  }

  private _onAutoSelectVerifyChanged() {
    const token = this._current as TokenModel;
    const autoSelect = document.getElementById("autoSelectVerify") as HTMLInputElement;

    token.verifySettings.autoSelect = autoSelect.checked;

    this._verify(token).then(() => {
      this._renderVerifyTab(token);
      this._renderGenerateTab(token);
    });
  }

  private _onAutoSelectDecryptChanged() {
    const token = this._current as TokenModel;
    const autoSelect = document.getElementById("autoSelectDecrypt") as HTMLInputElement;

    token.decryptSettings.autoSelect = autoSelect.checked;

    this._decrypt(token);
    this._renderDecryptTab(token);
    this._renderEncryptTab(token);
  }

  private _onEditKeyVerify() {
    const token = this._current as TokenModel;
    const settings = token.verifySettings;
    
    const key = settings.key;
    this._displayKey(key);
  }

  private _onEditKeyDecrypt() {
    const token = this._current as TokenModel;
    const settings = token.decryptSettings;
    
    const key = settings.key;
    this._displayKey(key);
  }

  private _onAddExpiryChanged() {
    const token = this._current as TokenModel;
    const settings = token.verifySettings;

    const addExpiry = document.getElementById("addExpiry") as HTMLInputElement;
    settings.addExpiry = addExpiry.checked;

    this._renderGenerateTab(token);
  }

  private _onValidTimeChanged() {
    const token = this._current as TokenModel;
    const settings = token.verifySettings;

    const validTime = document.getElementById("validTime") as HTMLInputElement;
    settings.validTime = parseFloat(validTime.value);

    this._renderGenerateTab(token);
  }

  private _onValidTimeUnitChanged() {
    const token = this._current as TokenModel;
    const settings = token.verifySettings;

    const validTimeUnit = document.getElementById("validTimeUnit") as HTMLInputElement;
    settings.validTimeUnit = validTimeUnit.value as TimeUnit;

    this._renderGenerateTab(token);
  }

  private _onAlgorithmChanged() {
    const token = this._current as TokenModel;
    const settings = token.verifySettings;

    const validTime = document.getElementById("validTime") as HTMLInputElement;
    settings.validTime = parseFloat(validTime.value);

    this._generate(token)
      .then(() => this._verify(token))
      .then(() => {
        this._renderVerifyTab(token);
        this._renderGenerateTab(token);
      });
  }

  private async _onCopy() {
    const token = this._current as TokenModel;

    await navigator.clipboard.writeText(token.token.raw);
  }

  private async _onGenerate() {
    const token = this._current as TokenModel;

    this._generate(token)
    .then(() => this._verify(token))
    .then(() => {
      this._renderVerifyTab(token);
      this._renderGenerateTab(token);
    });
  }

  private _purgeAll() {
    this._tokens = [];
    this._keys = [];
    this._settingsTab = SettingsTab.Verify;
    this._store.purgeLocalStorage();
    this._renderTokens();
    this._renderKeys();
    this._newToken();
  }

  private _openTab(tabName: SettingsTab) {
    // Get all elements with class="tabcontent" and hide them
    let tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
      (tabcontent[i] as HTMLElement).style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName + "-btn").className += " active";

    this._settingsTab = tabName;
  }

  private _toggleMenu(id: string) {
    let x = document.getElementById(id);
    if (x.className.indexOf("w3-show") == -1) {
      x.className += " w3-show"; 
      x.previousElementSibling.className += " w3-red";
    } else { 
      x.className = x.className.replace(" w3-show", "");
      x.previousElementSibling.className = 
      x.previousElementSibling.className.replace(" w3-red", "");
    }
  }

  private _expandMenu(id: string) {
    let x = document.getElementById(id);
    if (x.className.indexOf("w3-show") == -1) {
      x.className += " w3-show"; 
      x.previousElementSibling.className += " w3-red";
    }
  }

  private _w3OpenClose(display: string) {
    document.getElementById("mySidebar").style.display = display;
    document.getElementById("myOverlay").style.display = display;
  }

  private _registerCallbacks() {
    // Callbacks
    document.getElementById("closeSideMenu").addEventListener('click', () => this._w3OpenClose("none"));
    document.getElementById("closeSideMenuOverlay").addEventListener('click', () => this._w3OpenClose("none"));

    document.getElementById("openSideMenu").addEventListener('click', () => this._w3OpenClose("block"));

    document.getElementById("rawToken").addEventListener('input', () => this._onTokenChange());

    document.getElementById("publicKey").addEventListener('input', () => this._onKeyChange());
    document.getElementById("privateKey").addEventListener('input', () => this._onKeyChange());

    document.getElementById("verify-btn").addEventListener('click', () => this._openTab(SettingsTab.Verify));
    document.getElementById("generate-btn").addEventListener('click', () => this._openTab(SettingsTab.Generate));
    document.getElementById("decrypt-btn").addEventListener('click', () => this._openTab(SettingsTab.Decrypt));
    document.getElementById("encrypt-btn").addEventListener('click', () => this._openTab(SettingsTab.Encrypt));

    document.getElementById("newToken").addEventListener('click', () => this._newToken());
    document.getElementById("newKey").addEventListener('click', () => this._newKey());
    
    document.getElementById("tokenTitle").addEventListener('input', () => this._onTokenTitleChange());
    document.getElementById("keyTitle").addEventListener('input', () => this._onKeyTitleChange());

    document.getElementById("tokenSave").addEventListener('click', () => this._onTokenSave());
    document.getElementById("tokenDiscard").addEventListener('click', () => this._onTokenDiscard());
    document.getElementById("tokenDelete").addEventListener('click', () => this._onTokenDelete());

    document.getElementById("keySave").addEventListener('click', () => this._onKeySave());
    document.getElementById("keyDiscard").addEventListener('click', () => this._onKeyDiscard());
    document.getElementById("keyDelete").addEventListener('click', () => this._onKeyDelete());
    // document.getElementById("keyFetch").addEventListener('click', () => this._onKeyFetch());
    // document.getElementById("keyUpload").addEventListener('click', () => this._onKeyDelete());

    document.getElementById("tokensBtn").addEventListener('click', () => this._toggleMenu("tokens"));
    document.getElementById("keysBtn").addEventListener('click', () => this._toggleMenu("keys"));

    document.getElementById("confirmPurge").addEventListener('click', () => this._purgeAll());

    document.getElementById("autoSelectVerify").addEventListener('input', () => this._onAutoSelectVerifyChanged());
    document.getElementById("autoSelectDecrypt").addEventListener('input', () => this._onAutoSelectDecryptChanged());
    
    document.getElementById("verifyKey").addEventListener('input', () => this._onVerifyKeyChanged("verifyKey"));
    document.getElementById("generateKey").addEventListener('input', () => this._onVerifyKeyChanged("verifyKey"));
    document.getElementById("decryptKey").addEventListener('input', () => this._onDecryptKeyChanged("decryptKey"));
    document.getElementById("encryptKey").addEventListener('input', () => this._onDecryptKeyChanged("encryptKey"));

    document.getElementById("addExpiry").addEventListener('input', () => this._onAddExpiryChanged());
    document.getElementById("validTime").addEventListener('input', () => this._onValidTimeChanged());
    document.getElementById("validTimeUnit").addEventListener('input', () => this._onValidTimeUnitChanged());
    document.getElementById("algorithm").addEventListener('input', () => this._onAlgorithmChanged());

    document.getElementById("verifyEditKey").addEventListener('click', () => this._onEditKeyVerify());
    document.getElementById("generateEditKey").addEventListener('click', () => this._onEditKeyVerify());
    document.getElementById("decryptEditKey").addEventListener('click', () => this._onEditKeyDecrypt());
    document.getElementById("encryptEditKey").addEventListener('click', () => this._onEditKeyDecrypt());

    document.getElementById("verifyNewKey").addEventListener('click', () => this._newKey());
    document.getElementById("generateNewKey").addEventListener('click', () => this._newKey());
    document.getElementById("decryptNewKey").addEventListener('click', () => this._newKey());
    document.getElementById("encryptNewKey").addEventListener('click', () => this._newKey());

    document.getElementById("generateBtn").addEventListener('click', () => this._onGenerate());
    document.getElementById("generateCopyBtn").addEventListener('click', () => this._onCopy());
    document.getElementById("decryptCopyBtn").addEventListener('click', () => this._onCopy());
  }

  private _highlightMenuItem(id: string) {
    let x = document.getElementsByClassName("menu");
    for (let i = 0; i < x.length; i++) {
      x[i].className = x[i].className.replace(" w3-light-grey", "");
    }
    let y = document.getElementById(id);
    if (!!y) {
      y.className += " w3-light-grey";
    }
  }

  private _renderTokenTitle(token: TokenModel) {
    document.getElementById("tokenTitle").innerHTML = token.title;
    document.getElementById("tokenDirty").innerHTML = token.isDirty() ? "*" : "";
  }

  private _renderKeyTitle(key: Key) {
    document.getElementById("keyTitle").innerHTML = key.title;
    document.getElementById("keyDirty").innerHTML = key.isDirty() ? "*" : "";
  }

  private _renderTokenDetails(token: TokenModel) {
    const decodedToken = document.getElementById("decodedToken");
    const tokenMessage = document.getElementById("tokenMessage");
    const claimsTable = document.getElementById("claimsTable");

    if (token.isValid()) {
      const jwt = token.token as JWT;
      decodedToken.innerHTML = this._displayDecodedToken(jwt);
      claimsTable.innerHTML = this._displayClaimsTable(jwt);

      const issuer = Claims.getIssuerDetails(jwt.payload["iss"]);
      if (!!issuer) {
        tokenMessage.innerHTML = Claims.issuingProviderDescriptions[issuer];
      } else {
        tokenMessage.innerHTML = "This token is valid";
      }
    } else {
      tokenMessage.innerHTML = token.tokenParseError ? `<span class="w3-text-red">${token.tokenParseError}</span>` : "";
      
      const jwt = token.lastValid as JWT;
      
      if (!!jwt) {
        decodedToken.innerHTML = this._displayDecodedToken(jwt);
        claimsTable.innerHTML = this._displayClaimsTable(jwt);
      } else {
        decodedToken.innerHTML = "";
        claimsTable.innerHTML = `<table class="w3-table-all">
        <tr>
          <th width="20%">Claim type</th>
          <th width="30%">Value</th>
          <th width="50%">Notes</th>
        </tr>
        </table>`;
        tokenMessage.innerHTML = "";
      }
    }
  }

  private _displayDecodedToken(token: JWT): string {
    const header = Utils.formatJson(token.header);
    const payload = Utils.formatJson(token.payload);
    return `<span class="w3-text-red">${header}</span>.<span class="w3-text-blue">${payload}</span>.<span class="w3-text-green">[Signature]</span>`;
  }

  private _displayClaimsTable(token: JWT): string {
    return `<table class="w3-table-all">
    <tr>
      <th width="20%">Claim type</th>
      <th width="30%">Value</th>
      <th width="50%">Notes</th>
    </tr>
    ${this._getTableContents(token.payload)}
    </table>`;
  }

  private _getTableContents(payload: object): string {
    let contents = "";
    for (const claimType in payload) {
      const value = payload[claimType];
      const notes = Claims.claimTypeDescriptions[claimType] ?? "";
      const displayValue = Claims.translateClaimsValue(claimType, value);
      contents += `<tr><td>${claimType}</td><td>${displayValue}</td><td>${notes}</td></tr>`
    }
    return contents;
  }

  private _truncate(item: string): string {
    if (item.length > App.maxTokenMenuLength) {
      item = item.slice(0, App.maxTokenMenuLength - 3) + "...";
    }
    return item;
  }

  private _renderToken(token: TokenModel): string {
    return `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" id="${token.id}">
    ${this._renderTokenInner(token)}
    </a>`; 
  }
  
  private _renderKey(key: Key): string {
    return `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" id="${key.id}">
    ${this._renderKeyInner(key)}
    </a>`;
  }

  private _renderTokenInner(token: TokenModel): string {
    return `<div class="w3-container">
      <i class="w3-margin-right fa fa-id-card-o"></i><span class="w3-opacity w3-large">${token.dirtyTitle()}</span>
      <h6 class="w3-opacity"><i class="fa fa-clock-o "></i> ${Utils.displayDateMenu(token.saved)}</h6>
      <p>${this._displayColorCodedToken(this._truncate(token.token.raw))}</p>
    </div>`; 
  }
  
  private _renderKeyInner(key: Key): string {
    return `<div class="w3-container">
      <i class="w3-margin-right fa fa-id-card-o"></i><span class="w3-opacity w3-large">${key.dirtyTitle()}</span>
      <h6 class="w3-opacity"><i class="fa fa-clock-o "></i> ${Utils.displayDateMenu(key.saved)}</h6>
      <p>${this._truncate(key.publicKey)}</p>
    </div>`;
  }

  private _renderTokens() {
    const tokensDiv = document.getElementById("tokens");
    tokensDiv.innerHTML = "";

    this._tokens.forEach(token => {
      tokensDiv.innerHTML += this._renderToken(token);
    });

    this._addTokenEventListeners();
  }
  
  private _renderKeys() {
    const keysDiv = document.getElementById("keys");
    keysDiv.innerHTML = "";

    this._keys.forEach(key => {
      keysDiv.innerHTML += this._renderKey(key);
    });

    this._addKeyEventListeners();
  }

  private _renderNewToken(token: TokenModel) {
    const tokensDiv = document.getElementById("tokens");
    tokensDiv.innerHTML += this._renderToken(token);
    this._addTokenEventListeners();
  }
  
  private _renderNewKey(key: Key) {
    const keysDiv = document.getElementById("keys");
    keysDiv.innerHTML += this._renderKey(key);
    this._addKeyEventListeners();
  }

  private _reRenderToken(token: TokenModel) {
    document.getElementById(token.id).innerHTML = this._renderTokenInner(token);
  }

  private _reRenderKey(key: Key) {
    document.getElementById(key.id).innerHTML = this._renderKeyInner(key);
  }

  private _addTokenEventListeners() {
    this._tokens.forEach(token => {
      document.getElementById(token.id).addEventListener('click', () => this._displayToken(token));
    });
  }

  private _addKeyEventListeners() {
    this._keys.forEach(key => {
      document.getElementById(key.id).addEventListener('click', () => this._displayKey(key));
    });
  }

  private _renderTabs(token: TokenModel) {
    this._renderVerifyTab(token);
    this._renderGenerateTab(token);
    this._renderDecryptTab(token);
    this._renderEncryptTab(token);
  }

  private _renderVerifyTab(token: TokenModel) {
    const settings = token.verifySettings;

    this._enableButton("verifyEditKey", !!settings.key && !!!settings.key.url);
    this._setKeySelect("verifyKey", settings.autoSelect, settings.key);

    const autoSelect = document.getElementById("autoSelectVerify") as HTMLInputElement;
    autoSelect.checked = settings.autoSelect;

    this._displayKeyValue("verifyKeyValue", settings.key?.publicKey, "Specify a public key to verify signature");

    const sourceValue = document.getElementById("sourceValue");
    if (!!!settings.key) {
      sourceValue.innerHTML = "None";
    } else if (!!!settings.key.url) {
      sourceValue.innerHTML = "Key Store";
    } else {
      sourceValue.innerHTML = `<a href="${settings.key.url}">${settings.key.url}</a>`
    }

    const algorithmValue = document.getElementById("algorithmValue");
    algorithmValue.innerHTML = settings.algorithm ?? "None";

    const signatureVerify = document.getElementById("signatureVerify");
    if (settings.verificationResult === true) {
      signatureVerify.innerHTML = `<h3 class="w3-green signature-verify"><i class="w3-margin-left fa fa-check-circle"></i> Signature verified</h3>`;
    } else if (settings.verificationResult === false) {
      signatureVerify.innerHTML = `<h3 class="w3-red signature-verify"><i class="w3-margin-left fa fa-times-circle"></i> Invalid signature</h3>`;
    } else {
      signatureVerify.innerHTML = `<h3 class="w3-blue signature-verify"><i class="w3-margin-left fa fa-question-circle"></i> ${settings.verificationResult}</h3>`;
    }
  }
  
  private _renderGenerateTab(token: TokenModel) {
    const settings = token.verifySettings;

    this._enableButton("generateEditKey", !!settings.key && !!!settings.key.url);
    this._setKeySelect("generateKey", settings.autoSelect, settings.key);
    
    let privateKey = settings.key?.privateKey;
    if (!!!privateKey) {
      privateKey = settings.algorithm?.startsWith("HS") ? settings.key?.publicKey : "";
    }

    this._displayKeyValue("generateKeyValue", privateKey, "Specify a private key to generate signature");
    
    const algorithmSelect = document.getElementById("algorithm") as HTMLInputElement;
    algorithmSelect.value = settings.algorithm ?? "None";

    const addExpiry = document.getElementById("addExpiry") as HTMLInputElement;
    addExpiry.checked = settings.addExpiry;

    const validTime = document.getElementById("validTime") as HTMLInputElement;
    validTime.value = settings.validTime?.toString() ?? "";
    validTime.disabled = !settings.addExpiry;

    const validTimeUnit = document.getElementById("validTimeUnit") as HTMLInputElement;
    validTimeUnit.value = settings.validTimeUnit;
    validTimeUnit.disabled = !settings.addExpiry;

    this._enableButton("generateBtn", !!privateKey);
  }
  
  private _renderDecryptTab(token: TokenModel) {
    const settings = token.decryptSettings;

    this._enableButton("decryptEditKey", !!settings.key && !!!settings.key.url);
    this._setKeySelect("decryptKey", settings.autoSelect, settings.key);

    this._displayKeyValue("decryptKeyValue", settings.key?.privateKey, "Specify a private key to decrypt token");

    const autoSelect = document.getElementById("autoSelectDecrypt") as HTMLInputElement;
    autoSelect.checked = settings.autoSelect;
  }
  
  private _renderEncryptTab(token: TokenModel) {
    const settings = token.decryptSettings;

    this._enableButton("encryptEditKey", !!settings.key && !!!settings.key.url);
    this._setKeySelect("encryptKey", settings.autoSelect, settings.key);

    this._displayKeyValue("encryptKeyValue", settings.key?.publicKey, "Specify a public key to encrypt token");

    const autoEncrypt = document.getElementById("autoEncrypt") as HTMLInputElement;
    autoEncrypt.checked = settings.autoEncrypt;

    const algorithmValue = document.getElementById("encryptAlgorithm") as HTMLInputElement;
    algorithmValue.value = settings.algorithm ?? "None";
  }

  private _setKeySelect(id: string, autoSelect: boolean, key: Key) {
    if (autoSelect) {
      this._autoKeySelect(id, key?.title);
    } else {
      this._populateKeySelect(id, key?.id);
    }
  }

  private _populateKeySelect(id: string, value: string) {
    const keySelect = document.getElementById(id) as HTMLInputElement;
    if (this._keys.length > 0) {
      keySelect.innerHTML = "";
      this._keys.forEach((key) => {
        keySelect.innerHTML += `<option value='${key.id}'>${key.title}</option>`;
      });
      keySelect.value = value;
      keySelect.disabled = false;
      keySelect.className = keySelect.className.replace(" w3-disabled", "");
    } else {
      keySelect.innerHTML = "<option value='none'>No keys available<option>";
      keySelect.value = "none";
      keySelect.disabled = true;
      if (keySelect.className.indexOf("w3-disabled") === -1) { 
        keySelect.className += " w3-disabled";
      }
    }
  }

  private _autoKeySelect(id: string, value: string) {
    const keySelect = document.getElementById(id) as HTMLInputElement;
    keySelect.disabled = true;
    if (keySelect.className.indexOf("w3-disabled") === -1) { 
      keySelect.className += " w3-disabled";
    }
    keySelect.innerHTML = `<option value='auto'>${value ?? "Could not find appropriate key"}</option>`;
  }

  private _displayKeyValue(id: string, key: string, emptyMessage: string) {
    const keyValue = document.getElementById(id);
    if (!!!key) {
      keyValue.innerHTML = `<span class='w3-opacity'>${emptyMessage}</span>`;
    } else {
      keyValue.innerHTML = Utils.parseKey(key, "<br>");
    }
  }

  private _onSaveDiscardToken(token: TokenModel) {
    this._renderTokenTitle(token);
    this._reRenderToken(token);
    this._enableTokenButtons(token);
  }

  private _onSaveDiscardKey(key: Key) {
    this._renderKeyTitle(key);
    this._reRenderKey(key);
    this._enableKeyButtons(key);
  }

  private _displayColorCodedToken(rawToken: string): string {
    const segments = rawToken.split(".");
    let coloredstring = "";
    for (let i = 0; i < segments.length; i++) {
      coloredstring += `<span class='${App.tokenColors[i]}'>${segments[i]}</span>.`;
    }
    return coloredstring.slice(0, -1);
  }

  private _getNewTokenId(): string {
    let i = 1;
    while (true) {
      const id = `token${i}`;
      if (!!!this._tokens.find(token => token.id === id)) {
        return id;
      }
      i++;
    }
  }

  private _getNewKeyId(): string {
    let i = 1;
    while (true) {
      const id = `key${i}`;
      if (!!!this._keys.find(key => key.id === id)) {
        return id;
      }
      i++;
    }
  }

  private _enableTokenButtons(token: TokenModel) {
    const dirty = token.isDirty();
    const notEmpty = !!token.saved || token.token.raw.length > 0;
    this._enableButton("tokenSave", dirty);
    this._enableButton("tokenDiscard", dirty && notEmpty);
    this._enableButton("tokenDelete", notEmpty || this._tokens.length > 1);
  }

  private _enableKeyButtons(key: Key) {
    const dirty = key.isDirty();
    const notEmpty = !!key.saved || key.publicKey.length > 0 || key.privateKey.length > 0;
    this._enableButton("keySave", dirty);
    this._enableButton("keyDiscard", dirty && notEmpty);
    this._enableButton("keyDelete", notEmpty || this._keys.length > 1);
  }

  private _enableButton(id: string, enable: boolean) {
    const x = document.getElementById(id) as HTMLInputElement;
    x.disabled = !enable;
    if (enable) {
      // Remove w3-disabled
      x.className = x.className.replace(" w3-disabled", "");
    } else if (x.className.indexOf("w3-disabled") === -1) { 
      x.className += " w3-disabled";
    }
  }

  private _populateSelect() {
    const singingAlg = document.getElementById("algorithm");
    for (const alg in SigningAlgorithm) {
      singingAlg.innerHTML += `<option value='${SigningAlgorithm[alg]}'>${SigningAlgorithm[alg]}</option>`;
    }

    const encryptAlg = document.getElementById("encryptAlgorithm");
    for (const alg in EncryptionAlgorithm) {
      encryptAlg.innerHTML += `<option value='${EncryptionAlgorithm[alg]}'>${EncryptionAlgorithm[alg]}</option>`;
    }

    const validTimeUnit = document.getElementById("validTimeUnit");
    for (const unit in TimeUnit) {
      validTimeUnit.innerHTML += `<option value='${TimeUnit[unit]}'>${TimeUnit[unit]}</option>`;
    }
  }

  private async _verify(token: TokenModel) {
    const settings = token.verifySettings;
    if (!token.isValid()) {
      if (settings.autoSelect) {
        settings.key = null;
      } else if (!!!settings.key && this._keys.length > 0) {
        settings.key = this._keys[0];
      }
      settings.verificationResult = "Unable to verify - token invalid";
      settings.algorithm = null;
    } else {
      var jwt = token.token as JWT;
      settings.algorithm = jwt.header["alg"];
      if (settings.autoSelect) {
        // Attempt to find a key
        if (this._keys.length === 0) {
          settings.key = null;
          settings.verificationResult = "Unable to verify - no key";
        } else {
          settings.key = await jwt.searchAndVerify(this._keys, settings.algorithm);
          settings.verificationResult = !!settings.key;
        }
      } else {
        // Set key to first key if none available
        if (!!!settings.key && this._keys.length > 0) {
          settings.key = this._keys[0];
        }
        if (!!!settings.key?.publicKey) {
          // No public key
          settings.verificationResult = "Unable to verify - no key";
        } else {
          settings.verificationResult = await jwt.verify(settings.key.publicKey, settings.algorithm);
        }
      }
    }
  }

  private async _generate(token: TokenModel) {
  }

  private async _decrypt(token: TokenModel) {
    const settings = token.decryptSettings;
    if (settings.autoSelect) {
      // Attempt to find a key
      // Keep null for now
      settings.key = null;
    } else {
      // Set key to first key if none available
      if (!!!settings.key && this._keys.length > 0) {
        settings.key = this._keys[0];
      }
      // Attempt to decrypt
    }
  }
}
