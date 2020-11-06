import { Secret } from "./secret";
import { SettingsTab, TimeUnit } from "./settings";
import { Store } from "./store";
import { SigningAlgorithm, EncryptionAlgorithm, JWT, Token } from "./token";
import { TokenModel } from "./tokenModel";
import * as Claims from "./claims";
import * as Utils from "./utils";
import { tokenToString } from "typescript";

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
  private _secrets: Secret[];

  private _current: TokenModel | Secret;

  private _settingsTab: SettingsTab;

  private _store: Store;

  constructor() {
    this._store = new Store();

    // TODO: Do token retrieval from local storage
    // const storedValues = this._storage.retrieveAll();
    // [this._tokens, this._secrets] = storedValues[0];

    this._tokens = [
      new TokenModel("token1", "Sample Token", new Date("1 November, 2020"), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODZlZmY0OS00OWQ2LTQ4YjQtODM4NC0yYTA5NDYxODJmN2YiLCJ2YWxpZCI6IjEiLCJ1c2VyaWQiOiIxIiwibmFtZSI6ImJpbGFsIiwiZXhwIjoxNTcwNjMwMzMwLCJpc3MiOiJodHRwOi8vbXlzaXRlLmNvbSIsImF1ZCI6Imh0dHA6Ly9teXNpdGUuY29tIn0.06vzYfiSpj1X9s0-CL2nE7NH4LloASMikZCNfHIJ8tY"),
      new TokenModel("token2", "Sample Token 2", new Date("1 November, 2020"), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
    ];
    
    this._secrets = [
      new Secret("secret1", "Sample Key", new Date("1 November, 2020"), "IUzI1NiIsInR5cCI6IkpXVCJ9")
    ];

    this._settingsTab = SettingsTab.Verify;

    this._populateSelect();
    this._registerCallbacks();

    this._renderTokens();
    this._renderSecrets();
    
    this._expandMenu("tokens");

    this._displayToken(this._tokens[0]);
  }

  private _displayToken(token: TokenModel) {
    this._highlightMenuItem(token.id);
    this._current = token;

    this._verify(token);
    this._decrypt(token);
    
    document.getElementById("tokensDisplay").style.display = "block";
    document.getElementById("secretsDisplay").style.display = "none";
    
    this._renderTokenTitle(token);
    document.getElementById("tokenLastSaved").innerHTML = Utils.displayDate(token.saved);
    document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.token.raw);
    
    this._renderTokenDetails(token);
    this._renderTabs(token);
    this._openTab(this._settingsTab);
    this._enableTokenButtons(token);
  }
  
  private _displaySecret(secret: Secret) {
    this._highlightMenuItem(secret.id);
    this._current = secret;
    
    document.getElementById("tokensDisplay").style.display = "none";
    document.getElementById("secretsDisplay").style.display = "block";

    this._renderSecretTitle(secret);
    document.getElementById("secretLastSaved").innerHTML = Utils.displayDate(secret.saved);
    document.getElementById("publicKey").innerHTML = secret.publicKey ?? "";
    document.getElementById("privateKey").innerHTML = secret.privateKey ?? "";

    // Enable/disable buttons
    this._enableSecretButtons(secret);
  }
  
  private _newToken() {
    const id = this._getNewTokenId();
    const newToken = new TokenModel(id, "New Token");
    this._tokens.push(newToken);
    this._renderNewToken(newToken);
    this._displayToken(newToken);
  }

  private _newSecret() {
    const id = this._getNewSecretId();
    const newSecret = new Secret(id, "New Secret");
    this._secrets.push(newSecret);
    this._renderNewSecret(newSecret);
    this._displaySecret(newSecret);
  }

  private _onTokenChange() {
    const rawTokenDiv = document.getElementById("rawToken");
    const tokenString = rawTokenDiv.textContent;

    const token = this._current as TokenModel;
    token.setToken(tokenString);

    this._verify(token);
    this._decrypt(token);

    this._renderTokenTitle(token);
    rawTokenDiv.innerHTML = this._displayColorCodedToken(tokenString);
    this._renderTokenDetails(token);
    this._reRenderToken(token);
    this._renderTabs(token);
    
    // Enable/disable buttons
    this._enableTokenButtons(token);
  }

  private _onSecretChange() {
    const publicKeyDiv = document.getElementById("publicKey");
    const privateKeyDiv = document.getElementById("privateKey");
    
    const publicKey = publicKeyDiv.textContent;
    const privateKey = privateKeyDiv.textContent;

    const secret = this._current as Secret;
    secret.publicKey = publicKey;
    secret.privateKey = privateKey;

    this._renderSecretTitle(secret);
    this._reRenderSecret(secret);

    // Enable/disable buttons
    this._enableSecretButtons(secret);
  }

  private _onTokenTitleChange() {
    const token = this._current as TokenModel;
    const tokenTitle = document.getElementById("tokenTitle");
    
    token.title = tokenTitle.textContent;

    document.getElementById("tokenDirty").innerHTML = token.isDirty() ? "*" : "";
    this._reRenderToken(token);
    this._enableTokenButtons(token);
  }

  private _onSecretTitleChange() {
    const secret = this._current as Secret;
    const secretTitle = document.getElementById("secretTitle");
    
    secret.title = secretTitle.textContent;

    document.getElementById("secretDirty").innerHTML = secret.isDirty() ? "*" : "";
    this._reRenderSecret(secret);
    this._enableSecretButtons(secret);
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

    this._verify(token);
    this._decrypt(token);

    document.getElementById("rawToken").innerHTML = this._displayColorCodedToken(token.token.raw);
    this._renderTokenDetails(token);
    this._renderTabs(token);

    this._onSaveDiscardToken(token);
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

  private _onSecretSave() {
    const secret = this._current as Secret;
    secret.save();
    
    this._store.saveSecret(secret);
    document.getElementById("tokenLastSaved").innerHTML = Utils.displayDate(secret.saved);
    
    this._onSaveDiscardSecret(secret);
    this._enableSecretButtons(secret);
  }
  
  private _onSecretDiscard() {
    const secret = this._current as Secret;
    secret.discard();
    
    document.getElementById("publicKey").innerHTML = secret.publicKey ?? "";
    document.getElementById("privateKey").innerHTML = secret.privateKey ?? "";

    this._onSaveDiscardSecret(secret);
    this._enableSecretButtons(secret);
  }
  
  private _onSecretDelete() {
    const secret = this._current as Secret;
    
    let index = this._secrets.indexOf(secret);
    this._secrets.splice(index, 1);
    
    this._renderSecrets();
    if (this._secrets.length > 0) {
      if (index >= this._secrets.length) {
        index = this._secrets.length - 1;
      }
      this._displaySecret(this._secrets[index]);
    } else {
      this._displayToken(this._tokens[0]);
    }
  }

  private _onSecretFetch() {
  }

  private _onSecretUpload() {
  }

  private _onVerifySecretChanged(id: string) {
    const token = this._current as TokenModel;
    const secretSelect = document.getElementById(id) as HTMLInputElement;
    
    token.verifySettings.secret = this._secrets.find((secret) => secret.id === secretSelect.value);

    this._verify(token);
    this._renderVerifyTab(token);
    this._renderGenerateTab(token);
  }

  private _onDecryptSecretChanged(id: string) {
    const token = this._current as TokenModel;
    const secretSelect = document.getElementById(id) as HTMLInputElement;

    token.decryptSettings.secret = this._secrets.find((secret) => secret.id === secretSelect.value);

    this._decrypt(token);
    this._renderDecryptTab(token);
    this._renderEncryptTab(token);
  }

  private _onAutoSelectVerifyChanged() {
    const token = this._current as TokenModel;
    const autoSelect = document.getElementById("autoSelectVerify") as HTMLInputElement;

    token.verifySettings.autoSelect = autoSelect.checked;

    this._verify(token);
    this._renderVerifyTab(token);
    this._renderGenerateTab(token);
  }

  private _onAutoSelectDecryptChanged() {
    const token = this._current as TokenModel;
    const autoSelect = document.getElementById("autoSelectDecrypt") as HTMLInputElement;

    token.decryptSettings.autoSelect = autoSelect.checked;

    this._decrypt(token);
    this._renderDecryptTab(token);
    this._renderEncryptTab(token);
  }

  private _purgeAll() {
    this._tokens = [];
    this._secrets = [];
    this._settingsTab = SettingsTab.Verify;
    this._store.purgeLocalStorage();
    this._renderTokens();
    this._renderSecrets();
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

  private _expandMenu(id: string) {
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

    document.getElementById("publicKey").addEventListener('input', () => this._onSecretChange());
    document.getElementById("privateKey").addEventListener('input', () => this._onSecretChange());

    document.getElementById("verify-btn").addEventListener('click', () => this._openTab(SettingsTab.Verify));
    document.getElementById("generate-btn").addEventListener('click', () => this._openTab(SettingsTab.Generate));
    document.getElementById("decrypt-btn").addEventListener('click', () => this._openTab(SettingsTab.Decrypt));
    document.getElementById("encrypt-btn").addEventListener('click', () => this._openTab(SettingsTab.Encrypt));

    document.getElementById("newToken").addEventListener('click', () => this._newToken());
    document.getElementById("newSecret").addEventListener('click', () => this._newSecret());
    
    document.getElementById("tokenTitle").addEventListener('input', () => this._onTokenTitleChange());
    document.getElementById("secretTitle").addEventListener('input', () => this._onSecretTitleChange());

    document.getElementById("tokenSave").addEventListener('click', () => this._onTokenSave());
    document.getElementById("tokenDiscard").addEventListener('click', () => this._onTokenDiscard());
    document.getElementById("tokenDelete").addEventListener('click', () => this._onTokenDelete());

    document.getElementById("secretSave").addEventListener('click', () => this._onSecretSave());
    document.getElementById("secretDiscard").addEventListener('click', () => this._onSecretDiscard());
    document.getElementById("secretDelete").addEventListener('click', () => this._onSecretDelete());
    document.getElementById("secretFetch").addEventListener('click', () => this._onSecretFetch());
    document.getElementById("secretUpload").addEventListener('click', () => this._onSecretDelete());

    document.getElementById("tokensBtn").addEventListener('click', () => this._expandMenu("tokens"));
    document.getElementById("secretsBtn").addEventListener('click', () => this._expandMenu("secrets"));

    document.getElementById("confirmPurge").addEventListener('click', () => this._purgeAll());

    document.getElementById("autoSelectVerify").addEventListener('input', () => this._onAutoSelectVerifyChanged());
    document.getElementById("autoSelectDecrypt").addEventListener('input', () => this._onAutoSelectDecryptChanged());
    
    document.getElementById("verifySecret").addEventListener('input', () => this._onVerifySecretChanged("verifySecret"));
    document.getElementById("generateSecret").addEventListener('input', () => this._onVerifySecretChanged("verifySecret"));
    document.getElementById("decryptSecret").addEventListener('input', () => this._onDecryptSecretChanged("decryptSecret"));
    document.getElementById("encryptSecret").addEventListener('input', () => this._onDecryptSecretChanged("encryptSecret"));
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

  private _renderSecretTitle(secret: Secret) {
    document.getElementById("secretTitle").innerHTML = secret.title;
    document.getElementById("secretDirty").innerHTML = secret.isDirty() ? "*" : "";
  }

  private _renderTokenDetails(token: TokenModel) {
    const decodedToken = document.getElementById("decodedToken");
    const tokenMessage = document.getElementById("tokenMessage");
    const claimsTable = document.getElementById("claimsTable");

    if (!token.token.raw) {
      decodedToken.innerHTML = "";
      claimsTable.innerHTML = `<table class="w3-table-all">
      <tr>
        <th width="20%">Claim type</th>
        <th width="30%">Value</th>
        <th width="50%">Notes</th>
      </tr>
      </table>`;
      tokenMessage.innerHTML = "";
    } else {
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
        tokenMessage.innerHTML = `<span class="w3-text-red">${token.tokenParseError}</span>`;
        
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
  
  private _renderSecret(secret: Secret): string {
    return `<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom menu w3-hover-light-grey" id="${secret.id}">
    ${this._renderSecretInner(secret)}
    </a>`;
  }

  private _renderTokenInner(token: TokenModel): string {
    return `<div class="w3-container">
      <i class="w3-margin-right fa fa-id-card-o"></i><span class="w3-opacity w3-large">${token.dirtyTitle()}</span>
      <h6 class="w3-opacity">${Utils.displayDateMenu(token.saved)}</h6>
      <p>${this._displayColorCodedToken(this._truncate(token.token.raw))}</p>
    </div>`; 
  }
  
  private _renderSecretInner(secret: Secret): string {
    return `<div class="w3-container">
      <i class="w3-margin-right fa fa-id-card-o"></i><span class="w3-opacity w3-large">${secret.dirtyTitle()}</span>
      <h6 class="w3-opacity">${Utils.displayDateMenu(secret.saved)}</h6>
      <p>${secret.publicKey}</p>
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
  
  private _renderSecrets() {
    const secretsDiv = document.getElementById("secrets");
    secretsDiv.innerHTML = "";

    this._secrets.forEach(secret => {
      secretsDiv.innerHTML += this._renderSecret(secret);
    });

    this._addSecretEventListeners();
  }

  private _renderNewToken(token: TokenModel) {
    const tokensDiv = document.getElementById("tokens");
    tokensDiv.innerHTML += this._renderToken(token);
    this._addTokenEventListeners();
  }
  
  private _renderNewSecret(secret: Secret) {
    const secretsDiv = document.getElementById("secrets");
    secretsDiv.innerHTML += this._renderSecret(secret);
    this._addSecretEventListeners();
  }

  private _reRenderToken(token: TokenModel) {
    document.getElementById(token.id).innerHTML = this._renderTokenInner(token);
  }

  private _reRenderSecret(secret: Secret) {
    document.getElementById(secret.id).innerHTML = this._renderSecretInner(secret);
  }

  private _addTokenEventListeners() {
    this._tokens.forEach(token => {
      document.getElementById(token.id).addEventListener('click', () => this._displayToken(token));
    });
  }

  private _addSecretEventListeners() {
    this._secrets.forEach(secret => {
      document.getElementById(secret.id).addEventListener('click', () => this._displaySecret(secret));
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
    this._setSecretSelect("verifySecret", settings.autoSelect, settings.secret);

    const autoSelect = document.getElementById("autoSelectVerify") as HTMLInputElement;
    autoSelect.checked = settings.autoSelect;

    this._displaySecretValue("verifySecretValue", settings.secret?.publicKey, "public");

    const sourceValue = document.getElementById("sourceValue");
    if (!!!settings.secret) {
      sourceValue.innerHTML = "None";
    } else if (!!!settings.secret.url) {
      sourceValue.innerHTML = "Secret Store";
    } else {
      sourceValue.innerHTML = `<a href="${settings.secret.url}">${settings.secret.url}</a>`
    }

    const algorithmValue = document.getElementById("algorithmValue");
    algorithmValue.innerHTML = settings.algorithm ?? "None";

    const signatureVerify = document.getElementById("signatureVerify");
    if (settings.verificationResult === null) {
      signatureVerify.innerHTML = `<h3 class="w3-blue signature-verify"><i class="w3-margin-left fa fa-question-circle"></i> Unable to verify signature</h3>`;
    } else if (settings.verificationResult) {
      signatureVerify.innerHTML = `<h3 class="w3-green signature-verify"><i class="w3-margin-left fa fa-check-circle"></i> Signature verified</h3>`;
    } else {
      signatureVerify.innerHTML = `<h3 class="w3-red signature-verify"><i class="w3-margin-left fa fa-times-circle"></i> Invalid signature</h3>`;
    }
  }
  
  private _renderGenerateTab(token: TokenModel) {
    const settings = token.verifySettings;
    this._setSecretSelect("generateSecret", settings.autoSelect, settings.secret);
    
    this._displaySecretValue("generateSecretValue", settings.secret?.privateKey, "private");

    const addExpiry = document.getElementById("addExpiry") as HTMLInputElement;
    addExpiry.checked = settings.addExpiry;

    const validTime = document.getElementById("validTime") as HTMLInputElement;
    validTime.value = settings.validTime?.toString() ?? "";

    const validTimeUnit = document.getElementById("validTimeUnit") as HTMLInputElement;
    validTimeUnit.value = settings.validTimeUnit;

    const algorithmValue = document.getElementById("algorithmValue") as HTMLInputElement;
    algorithmValue.value = settings.algorithm ?? "None";
  }
  
  private _renderDecryptTab(token: TokenModel) {
    const settings = token.decryptSettings;
    this._setSecretSelect("decryptSecret", settings.autoSelect, settings.secret);

    this._displaySecretValue("decryptSecretValue", settings.secret?.privateKey, "private");

    const autoSelect = document.getElementById("autoSelectDecrypt") as HTMLInputElement;
    autoSelect.checked = settings.autoSelect;
  }
  
  private _renderEncryptTab(token: TokenModel) {
    const settings = token.decryptSettings;
    this._setSecretSelect("encryptSecret", settings.autoSelect, settings.secret);

    this._displaySecretValue("encryptSecretValue", settings.secret?.publicKey, "public");

    const autoEncrypt = document.getElementById("autoEncrypt") as HTMLInputElement;
    autoEncrypt.checked = settings.autoEncrypt;

    const algorithmValue = document.getElementById("encryptAlgorithm") as HTMLInputElement;
    algorithmValue.value = settings.algorithm ?? "None";
  }

  private _setSecretSelect(id: string, autoSelect: boolean, secret: Secret) {
    if (autoSelect) {
      this._autoSecretSelect(id, secret?.title);
    } else {
      this._populateSecretSelect(id, secret?.id);
    }
  }

  private _populateSecretSelect(id: string, value: string) {
    const secretSelect = document.getElementById(id) as HTMLInputElement;
    if (this._secrets.length > 0) {
      secretSelect.innerHTML = "";
      this._secrets.forEach((secret) => {
        secretSelect.innerHTML += `<option value='${secret.id}'>${secret.title}</option>`;
      });
      secretSelect.value = value;
      secretSelect.disabled = false;
      secretSelect.className = secretSelect.className.replace(" w3-disabled", "");
    } else {
      secretSelect.innerHTML = "<option value='none'>No secrets available<option>";
      secretSelect.value = "none";
      secretSelect.disabled = true;
      if (secretSelect.className.indexOf("w3-disabled") === -1) { 
        secretSelect.className += " w3-disabled";
      }
    }
  }

  private _autoSecretSelect(id: string, value: string) {
    const secretSelect = document.getElementById(id) as HTMLInputElement;
    secretSelect.disabled = true;
    if (secretSelect.className.indexOf("w3-disabled") === -1) { 
      secretSelect.className += " w3-disabled";
    }
    secretSelect.innerHTML = `<option value='auto'>${value ?? "Could not find appropriate secret"}</option>`;
  }

  private _displaySecretValue(id: string, key: string, keyType: string) {
    const secretValue = document.getElementById(id);
    if (!!!key) {
      secretValue.innerHTML = `<span class='w3-opacity'>Specify a ${keyType} key to verify signature</span>`;
    } else {
      secretValue.innerHTML = key;
    }
  }

  private _onSaveDiscardToken(token: TokenModel) {
    this._renderTokenTitle(token);
    this._reRenderToken(token);
    this._enableTokenButtons(token);
  }

  private _onSaveDiscardSecret(secret: Secret) {
    this._renderSecretTitle(secret);
    this._reRenderSecret(secret);
    this._enableSecretButtons(secret);
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

  private _getNewSecretId(): string {
    let i = 1;
    while (true) {
      const id = `secret${i}`;
      if (!!!this._secrets.find(secret => secret.id === id)) {
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

  private _enableSecretButtons(secret: Secret) {
    const dirty = secret.isDirty();
    const notEmpty = !!secret.saved || secret.publicKey.length > 0 || secret.privateKey.length > 0;
    this._enableButton("secretSave", dirty);
    this._enableButton("secretDiscard", dirty && notEmpty);
    this._enableButton("secretDelete", notEmpty || this._secrets.length > 1);
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

  private _verify(token: TokenModel) {
    const settings = token.verifySettings;
    if (!token.isValid()) {
      settings.verificationResult = null;
      settings.algorithm = null;
    } else {
      var jwt = token.token as JWT;
      settings.algorithm = jwt.header["alg"];
      if (settings.autoSelect) {
        // Attempt to find a secret
        // Keep null for now
        settings.secret = null;
        settings.verificationResult = false;
      } else {
        // Set secret to first secret if none available
        if (!!!settings.secret && this._secrets.length > 0) {
          settings.secret = this._secrets[0];
        }
        if (!!!settings.secret?.publicKey) {
          // No public key
          settings.verificationResult = null;
        } else {
          settings.verificationResult = jwt.verify(settings.secret.publicKey);
        }
      }
    }
  }

  private _decrypt(token: TokenModel) {
    const settings = token.decryptSettings;
    if (settings.autoSelect) {
      // Attempt to find a secret
      // Keep null for now
      settings.secret = null;
    } else {
      // Set secret to first secret if none available
      if (!!!settings.secret && this._secrets.length > 0) {
        settings.secret = this._secrets[0];
      }
      // Attempt to decrypt
    }
  }
}
