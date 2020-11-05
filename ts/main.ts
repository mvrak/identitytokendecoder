import { App } from "./app";

const app = new App();

// Callbacks
document.getElementById("closeSideMenu").addEventListener('click', () => app.w3OpenClose("none"));
document.getElementById("closeSideMenuOverlay").addEventListener('click', () => app.w3OpenClose("none"));

document.getElementById("openSideMenu").addEventListener('click', () => app.w3OpenClose("block"));

document.getElementById("rawToken").addEventListener('input', () => app.onTokenChange());

document.getElementById("publicKey").addEventListener('input', () => app.onSecretChange());
document.getElementById("privateKey").addEventListener('input', () => app.onSecretChange());

document.getElementById("verify-btn").addEventListener('click', () => app.openTab("verify"));
document.getElementById("generate-btn").addEventListener('click', () => app.openTab("generate"));
document.getElementById("decrypt-btn").addEventListener('click', () => app.openTab("decrypt"));
document.getElementById("encrypt-btn").addEventListener('click', () => app.openTab("encrypt"));

document.getElementById("newToken").addEventListener('click', () => app.newToken());
document.getElementById("newSecret").addEventListener('click', () => app.newSecret());

document.getElementById("tokenSave").addEventListener('click', () => app.onTokenSave());
document.getElementById("tokenDiscard").addEventListener('click', () => app.onTokenDiscard());
document.getElementById("tokenDelete").addEventListener('click', () => app.onTokenDelete());

document.getElementById("secretSave").addEventListener('click', () => app.onSecretSave());
document.getElementById("secretDiscard").addEventListener('click', () => app.onSecretDiscard());
document.getElementById("secretDelete").addEventListener('click', () => app.onSecretDelete());
document.getElementById("secretFetch").addEventListener('click', () => app.onSecretFetch());
document.getElementById("secretUpload").addEventListener('click', () => app.onSecretDelete());

document.getElementById("tokensBtn").addEventListener('click', () => app.expandMenu("tokens"));
document.getElementById("secretsBtn").addEventListener('click', () => app.expandMenu("secrets"));

document.getElementById("confirmPurge").addEventListener('click', () => app.purgeAll());
