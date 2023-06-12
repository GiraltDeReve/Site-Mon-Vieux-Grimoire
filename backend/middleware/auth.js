require('dotenv').config();

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    // on récupére le token en enelevant espéca et en récup deuxiéme élément (tableau commence par 0)
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    //'RANDOM_TOKEN_SECRET'
    // process.env.TOKEN
    // pour décoder token, on utilise la fonction verify de jasonwebtoken (on passe le token recup et la key secret)
    const userId = decodedToken.userId;
    // on récupére le user.id et on le décode
    req.auth = {
      userId: userId,
    };
    // on transfére aux autres middelware le userId ou au gestionnaire de routes
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};

// on doit maintenant importer ce middleware pour qu'il soit exécuter en début pour protéger les routes liés à book
