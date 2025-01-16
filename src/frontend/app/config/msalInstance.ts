// src/frontend/app/config/msalInstance.ts
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: '09715aa2-7efa-440a-ac51-d3035ce26aed', // Azure AD アプリのクライアントID
    authority: 'https://login.microsoftonline.com/574b8a9d-3840-4f67-a91f-3928925912f4', // テナントID または "common"
    redirectUri: 'http://localhost:3000', // アプリのリダイレクトURI
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

export default msalInstance;
