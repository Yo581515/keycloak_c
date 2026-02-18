import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "testing",
  clientId: "react-client", // <-- put your Keycloak React client id here
});

export default keycloak;
