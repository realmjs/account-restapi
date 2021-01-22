"use strict"

/*
  Apps are defined in environment variable in the pair of id|url, seperated by one space
  ex: APPS="id|url id|url"
*/
const Apps = process.env.APPS.split(' ').map( item => {
  const s = item.split('|');
  const app = s[0].trim();
  const url = s[1].trim();
  const { realm, key } = __findRealm(app);
  return { id: app, url, realm, key };
});
console.log('APPs = ')
console.log(Apps)

const helpers = {
  Apps,
  alert : msg => console.log(msg),
  Database: require('./database'),
  sendEmail,
  hooks: [(data) => console.log(`hook:\n ${data}`)],
}

module.exports = helpers;

function __findRealm(app) {
  const realms = __getRealms();
  for (let realm in realms) {
    if (realms[realm].apps.indexOf(app) !== -1) {
      return { realm, key: realms[realm].key };
    }
  }
  return { realm: undefined, key: undefined };
}

function __getRealms() {
  /*
  Realms are defined in environment variable in the pair of realm=[apps]|key, seperated by one space
  ex: REALMS="puclic=web,learn,exam|public-secret-key secure=admin|secure-secret-key"
  return realms = {
    public: {
      apps: [web, learn, exam],
      key: public-secret-key,
    },
    secure: {
      apps: [admin],
      key: secure-secret-key,
    },
  }
*/
  const realms = {};
  process.env.REALMS.split(' ').forEach(realm => {
    const s = realm.trim().split('|');
    // get realm name and app list
    const r = s[0].split('=');
    const name = r[0].trim();
    const apps = r[1].split(',').map(a => a.trim());
    const key = s[1].trim();
    realms[name] = { apps, key };
  });
  return realms;
}

function sendEmail ({recipient, template, data}) {
  return new Promise( (resolve, reject) => {
    console.log(`EMAIL: -----------------------------------------------------------`);
    console.log(`--> Sent email to:`);
    recipient.forEach( ({name, email}) => {
      console.log(`           + ${name}[${email}]`);
    })
    console.log(`--> Email Template: ${template}`);
    console.log('--> Data:');
    console.log(data)
    console.log(`-----------------------------------------------------------------`);
    resolve();
  });
}
