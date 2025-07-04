const session = new (require('@lib/Session'))();
const db = new (require('@lib/DataBase'))();
const fieldsMap = require('@fieldsMap/Move.json');
const { capitalize } = require('@lib/Util');

const qrysOwner = {
  workSpace: 'SELECT 1 FROM workSpace WHERE id = ? and idOwner = ? ',
  tableau: 'SELECT 1 FROM tableau t INNER JOIN workSpace ws ON t.idWorkSpace = ws.id WHERE t.id = ? and ? in (t.idOwner, ws.idOwner)',
  card: 'SELECT 1 FROM card c INNER JOIN tableau t ON c.idTableau = t.id inner join workSpace ws on t.idWorkspace = ws.id WHERE c.id = ? and ? IN (c.idOwner, t.idOwner, ws.idOwner)'
}


function auth(type = undefined) {
  return async (req, res, next) => {
  if (!await session.checkToken(req.headers['authorization'], req.ip)) return res.status(401).send('token unknown');

  if (type !== undefined) {
    const { idWorkSpace } = req.params
    const workSpaceValidate = await db.oneResult('SELECT 1 FROM userWorkSpace WHERE idUser = ? and idWorkSpace = ? and state in (?)', session.getUserId(), idWorkSpace, type);
    if (!workSpaceValidate) return res.status(403).send("no authorization");
  }
  next();
}
}


function authAndOwner(typeOwner) {
  return async (req, res, next) => {
    if (!await session.checkToken(req.headers['authorization'], req.ip)) return res.status(401).send('token unknown');

    const tableauValidate = await db.oneResult(qrysOwner[typeOwner], req.params[`id${capitalize(typeOwner)}`], session.getUserId());
    if (!tableauValidate) return res.status(403).send("no owner");
    next();
  }
};

function checkFields(nameMap) {
  return function (req, res, next) {
    const fieldsMap = require(`@fieldsMap/Default.json`);
    const missing = fieldsMap[nameMap].find(field => req.body[field] === undefined);
    if (missing) {
      return res.status(400).send(`Malformation: missing '${missing}'`);
    }

    next();
  }
};

function extraMiddleware(extras) {
  return function (req, res, next) {
    req.extras = extras;
    next();
  };
}

module.exports = { auth, checkFields, authAndOwner, extraMiddleware };