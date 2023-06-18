require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const mongoose = require('mongoose');
const path = require('path');

mongoose
  .connect(
    process.env.MONGO,
    // 'variable d'environnement dotenv du code de connexion à la basse de données mangoDB
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();
// permet de créer une application express

// premier middleware générale (appliqué à toutes les routes) exécuté dans notre code pour rajouter des header et
// donner les autorisations pour les requêtes en toute sécurité
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  //   permet d'accéder à notre API depuis n'importe quelle origine ( '*' )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
    // permet d'ajouter les headers mentionnés aux requêtes envoyées vers notre API (Origin , X-Requested-With , etc.)
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    // permet d'envoyer des requêtes avec les méthodes mentionnées ( GET ,POST , etc.)
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
// analyse les données du corps des requêtes avec le format d'encodage "urlencoded"
// extended: false = les données analysées ne doivent pas prendre en charge les objets complexes et les tableaux JSON imbriqués
app.use(bodyParser.json());
// permet de récupérer données json envoyés dans corps requête
app.use(cors());
// active le middleware CORS pour gérer les autorisations d'accès aux ressources partagées entre différents domaines
// permet à un site web de faire des requêtes AJAX vers un autre domaine
// on autorise les requêtes d'autres domaines a acceder à l'apis-

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));
// Pour créer et concaténer un chemin vers le dossier images

module.exports = app;
// permet de l'exporter aux autres fichiers pour qu'on puisse s'en servir (server.js)
