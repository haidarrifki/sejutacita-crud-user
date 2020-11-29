const crypto = require('crypto');

exports.hash = async (plainText) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(8).toString("hex");

    crypto.scrypt(plainText, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ":" + derivedKey.toString('hex'))
    });
  });
}

exports.verify = async (plainText, hash) => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");

    crypto.scrypt(plainText, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key == derivedKey.toString('hex'));
    });
  });
}