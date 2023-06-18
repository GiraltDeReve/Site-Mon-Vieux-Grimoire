require('dotenv').config();

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    // on récupére le token en enlevant espace et on récup deuxiéme élément (tableau commence par 0)
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    // pour décoder token, on utilise la fonction verify de jasonwebtoken (on passe le token recup et la key secret (variable d'environnement avec dotenv))
    const userId = decodedToken.userId;
    // on récupére le user.id et on le décode
    req.auth = {
      userId: userId,
    };
    // on transfére aux autres middelware le userId ou aux gestionnaires de routes
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};

// on doit maintenant importer dans notre fichier route "books" ce middleware pour qu'il soit exécuter en début pour protéger les routes liés à books
