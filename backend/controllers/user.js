const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/users');

exports.signup = (req, res, next) => {
  bcrypt
    // fonction asynchrone qui renvoie une Promise dans laquelle nous recevons le hash généré ;
    .hash(req.body.password, 10)
    // fonction pour hasher(crypter) un mdp
    // 10 correspond au nombre de fois où on fait tourner l'algorithme pour faire cryper le mdp
    .then((hash) => {
      // nous créons un utilisateur et l'enregistrons dans la base de données
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch((error) => {
          console.log(error);
          console.log(user);
          res.status(400).json({
            error: error,
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        error: error,
      });
    });
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ error: 'Utilisateur et/ou mot de passe incorrect' });
        //si email n'existe pas dans la basse de donnée, message d'erreur (sans indiquer précisement le soucis si personne malveillante)
      }
      bcrypt
        .compare(req.body.password, user.password)
        //fonction compare de bcrypt pour comparer mdp saisie par utilisateur et ce qui est stocké dans basse de donné
        .then((valid) => {
          if (!valid) {
            // si réponse différente de valide = message error
            return res
              .status(401)
              .json({ error: 'Utilisateur et/ou mot de passe incorrect' });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.TOKEN, {
              expiresIn: '24h',
              // fonction sign de jsonwebtoken pour génerer un nouveau token
              // premier argument : l'id de l'utilisateur en tant que payload (donées encodées)
              // second argument : clé secrète utilisée pour signer le token (variable d'environement dot env)
              // troisiéme argument : duréee du token avant expiration et reco utilisateur
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
      // on verif erreur d'exécution et non pas erreur mdp non trouvé dans bdd
    })
    .catch((error) => res.status(500).json({ error }));
  // idem exécution et non utilisateur introuvable
};
