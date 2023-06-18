const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
//   Une sorte de bibliothéque d'extensions u'on passe à notre fonction storage

// Constante storage, à passer à multer comme configuration (logique pour indiquer où enregistrer les fichiers entrants )
const storage = multer.diskStorage({
  // fonction de multer qui dit qu'on va enregistrer sur le disk
  destination: (req, file, callback) => {
    callback(null, 'images');
    // fonction callback pour indiquer le dossier de destination
  },
  filename: (req, file, callback) => {
    // fonction filename spécifie le nom du fichier à utiliser
    const name = file.originalname.split(' ').join('_');
    // nom d'orgine récupéré depuis file.originalname + espace remplacé par underscores
    const extension = MIME_TYPES[file.mimetype];
    // utilise ensuite la constante dictionnaire de type MIME pour résoudre l'extension de fichier appropriée
    callback(null, name + Date.now() + '.' + extension);
    // fonction callback pour générer un nom de fichier unique (ajout de la date à la seconde pret)
  },
});

module.exports = multer({ storage: storage }).single('image');
// lorsque multer utilisé dans une route, gérera le téléchargement d'un seul fichier image et l'enregistrera dans le dossier spécifié
