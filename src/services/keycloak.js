import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'https://www.cerebroaifalabs.com/auth',
    realm: 'cerebro',
    clientId: 'cerebro',
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
