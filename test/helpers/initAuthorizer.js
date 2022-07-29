import { readFileSync } from 'fs';
import authorizer from '@sempervirens/authorizer';

const initAuthorizer = () => {
  authorizer.init({
    jwtPublicKey: readFileSync('./security/jwt/jwtRS256.key.pub', 'utf8'),
    jwtPrivateKey: readFileSync('./security/jwt/jwtRS256.key', 'utf8')
  });
};

export default initAuthorizer;