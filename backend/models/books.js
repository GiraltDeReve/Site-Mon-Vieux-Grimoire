const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  //fonction "shéma" de mongose à laquelle on passe un objet pour dicter les champs
  userId: { type: String, required: true },
  // on donne un titre à notre champ et on passe sa config en précisant sa nature et si requis pour valider champ
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [
    {
      userId: { type: String, required: true },
      grade: { type: Number, required: true },
    },
  ],
  averageRating: { type: Number, required: true },
});

module.exports = mongoose.model('Book', bookSchema);
// on exporte le module terminé
// pour exporter notre champs, on doit utiliser la fonction "model" avec en premier argument le nom du model et en deuxiéme le schéma correspondant
