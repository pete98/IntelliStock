import Constants from 'expo-constants';

interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
}

function getAuth0Config(): Auth0Config {
  const legacyExtra =
    (Constants.manifest as { extra?: Record<string, unknown> } | null)?.extra ?? {};
  const extra = Constants.expoConfig?.extra ?? legacyExtra;

  return {
    domain: typeof extra.auth0Domain === 'string' ? extra.auth0Domain : '',
    clientId: typeof extra.auth0ClientId === 'string' ? extra.auth0ClientId : '',
    audience: typeof extra.auth0Audience === 'string' ? extra.auth0Audience : undefined,
  };
}

export const auth0Config = getAuth0Config();
