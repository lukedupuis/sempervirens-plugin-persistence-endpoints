import authorizer from '@sempervirens/authorizer';

const parseBindWithToken = ({ req, tokenKey, recordKey }) => {
  if (!tokenKey && !recordKey) {
    return null;

  } else if (!authorizer.isValid(req)) {
    throw new Error('USER_ERROR: Token is invalid.');

  } else if (!tokenKey || !recordKey) {
    throw new Error('USER_ERROR: "tokenKey" and "recordKey" are required.');
  }

  const decrypted = authorizer.decrypt(req);
  const tokenValue = decrypted[tokenKey];

  if (!tokenValue) {
    throw new Error('USER_ERROR: "tokenKey" value does not exist.');
  }

  return { tokenValue, recordKey };

};

export default parseBindWithToken;