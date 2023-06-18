const Book = require('../models/books');
const fs = require('fs');
const sharp = require('sharp');

exports.createBook = async (req, res, next) => {
  console.log(req.body);
  const bookObject = JSON.parse(req.body.book);
  // Avec fonction parse de JSON on parse l'objet requet parce que maintenant cet objet nous ais envoyé en chaine de caractére Json et non objet JS
  delete bookObject._id;
  delete bookObject._userId;
  // on supprime deux champs de cet objet qui nous ais renvoyé
  // l'id est généré authomatiquement par notre basse de donnée
  // on ne fait pas confiance au client donc on supprime l'userID et on va remplacer l'userId par celui du token

  try {
    // Redimensionner l'image
    const resizedImageBuffer = await sharp(req.file.path)
      .resize({ width: 800 })
      .toBuffer();
    // Enregistrer l'image redimensionnée
    const resizedImagePath = `${req.file.destination}/resized_${req.file.filename}`;
    await fs.promises.writeFile(resizedImagePath, resizedImageBuffer);

    const book = new Book({
      // on créé l'objet avec notre nouveau book
      ...bookObject,
      // opérateur de déversement (...) = pour déverser les propriétés de bookObject dans l'objet du livre
      userId: req.auth.userId,
      // on remplace le user id avec token de authentication
      imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${
        // multer nous passe que le nom de fichier donc on doit le générer nous même
        req.file.filename
      }`,
    });

    console.log(book);
    // sauvegarde de l'objet
    await book.save();

    // suppression de l'image non redimensionnée
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error(
          "Erreur lors de la suppression de l'image originale :",
          err
        );
      } else {
        console.log('Image originale supprimée');
      }
    });

    res.status(201).json({ message: 'Objet enregistré !' });
  } catch (error) {
    console.error('Erreur lors de la création du livre :', error);
    res.status(400).json({ error });
  }
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    // méthode mangoose findOne permet de trouver un seul document correspondant aux critères de recherche
    _id: req.params.id,
    //  = critére de recherche
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyBook = async (req, res, next) => {
  // Si l'utilisateur a mis à jour l'image: on reçoit l'élément form-data et le fichier
  // Sinon : uniquement les données JSON.
  try {
    // Vérifier si une nouvelle image a été téléchargée
    const isImageUploaded = req.file ? true : false;

    const bookObject = isImageUploaded
      ? {
          // objet file (image) ou non ? Si oui, on recup notre objet en parsant la chaine de caractére et en recréant l'url de l'image comme pécédemment
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${
            req.file.filename
          }`,
        }
      : { ...req.body };
    // si pas de fichier de transmis, on récupére simplpment l'objet dans le corps de la requête

    delete bookObject._userId;
    // on supprime de nouveau l'user id pour sécurité
    const book = await Book.findOne({ _id: req.params.id });
    // méthode findOne pour trouver livre dans bdd : critère de recherche est l'ID du livre
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    } // on vérifie que le livre existe

    if (book.userId != req.auth.userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    } // on vérifie que c'est le bon utilisateur (compare user id du token et celui de notre basse)

    if (isImageUploaded) {
      // on redimensionne l'image
      const resizedImageBuffer = await sharp(req.file.path)
        .resize({ width: 800 })
        .toBuffer();
      // Enregistrer l'image redimensionnée
      const resizedImagePath = `${req.file.destination}/resized_${req.file.filename}`;
      await fs.promises.writeFile(resizedImagePath, resizedImageBuffer);

      bookObject.imageUrl = `${req.protocol}://${req.get(
        'host'
      )}/images/resized_${req.file.filename}`;
    } // multer nous passe que le nom de fichier donc on doit générer l'url nous même

    await Book.updateOne(
      // on met à jour le livre avec les nouvelles modifications
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );

    const newImageFilename = isImageUploaded ? req.file.filename : null;
    // stocker nom fichier de la nouvelle image si celle-ci a été ajoutée (évite erreur suppression ancienne image)
    if (isImageUploaded && book.imageUrl) {
      // vérif si newImageFilename + url d'image à book existent, pour s'assurer de comparer ancienne et nouvelle images
      const filename = book.imageUrl.split('/images/')[1];
      // extraction du nom du fichier grâce a split
      if (filename !== newImageFilename) {
        // vérif que les deux noms sont différents, assurant encore une fois qu'une nouvelle image à été ajoutée
        fs.unlink(`images/${filename}`, (err) => {
          // supression de l'ancienne image filename
          if (err) {
            console.error(
              "Erreur lors de la suppression de l'ancienne image :",
              err
            );
          } else {
            console.log('Ancienne image supprimée');
          }
        });
      }
    }

    // on supprime l'image original pour garder uniquement celle redimensionnée
    if (isImageUploaded) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error(
            "Erreur lors de la suppression de l'image originale :",
            err
          );
        } else {
          console.log('Image originale supprimée');
        }
      });
    }

    res.status(200).json({ message: 'Objet modifié !' });
  } catch (error) {
    console.error('Erreur lors de la modification du livre :', error);
    res.status(400).json({ error });
  }
};

exports.deleteBook = (req, res, next) => {
  // on doit vérifier les droits d'authorisation comme on l'a fait pour chemin put
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        // utilisateur authorisé si le token correspondant dans la BDD
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        // extraction du nom du fichier d'image à parrir de l'url de l'image du livre
        fs.unlink(`images/${filename}`, () => {
          // fonction fs.unlink pour supprimer le fichier d'image du systéme de fichiers
          Book.deleteOne({ _id: req.params.id })
            // fonction book.deleteOne pour supprimer le doc du livre de la basse de données
            .then(() => {
              res.status(200).json({ message: 'Objet supprimé !' });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

// -------------------------------------------------------RATINGS --------------------------------

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // Tri par ordre décroissant de la note moyenne
    .limit(3) // Limite à 3 résultats
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.addRating = async (req, res, next) => {
  const ratingObject = req.body;
  const userId = ratingObject.userId;
  const rating = ratingObject.rating;

  try {
    // Recherche du livre à partir de son ID
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    } // on vérifie que le livre existe

    // Vérifier si l'utilisateur a déjà noté le livre
    if (book.ratings.find((r) => r.userId === userId)) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
    }

    // Vérifier si la notation est valide (entre 1 et 5 étoiles)
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'La notation doit être entre 1 et 5 étoiles.' });
    }

    // Ajouter la nouvelle évaluation à la liste
    book.ratings.push({ userId, grade: rating });

    // Calcul somme totale de toutes les évaluations
    let rates = 0;
    for (let i = 0; i < book.ratings.length; i++) {
      rates += book.ratings[i].grade;
    }
    // calcul somme moyenne des évaluations + arrondis résultat avec math.round
    book.averageRating = Math.round(rates / book.ratings.length);

    // modifs enregistrer en basse de données
    await book.save();

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
