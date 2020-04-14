'use strict';
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const PORT = process.env.PORT || 3030;
const app = express();
const superagent = require('superagent');
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);
//===============Routs=================\\
app.get('/', getDataFromDB);
app.get('/index',getDataFromDB);
app.get('/books/:bookID', detailsFun);
app.post('/books', saveToDB);
app.get('/searches/new', newSearch);
app.get('*', notFoundHandler);
//===============Callback Functions=================\\
function getDataFromDB(req, res) {
  const SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(result => {
      res.render('./pages/index', { data: result.rows })
    })
}
function detailsFun(req, res) {
  let saveId = [req.params.bookID];
  console.log(saveId);
  let sql = `SELECT * FROM books WHERE id = $1;`
  return client.query(sql, saveId)
    .then(result => {
      res.render('./pages/books/show', { data: result.rows[0] })
    })
}
function saveToDB(req, res) {
  let ln;
  let { author, title, isbn, image_url, description ,bookShelf} = req.body;
  console.log(req.body);
  let SQL = 'INSERT INTO books (author,title,isbn,image_url,description,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
  let safeValues = [author,title,isbn,image_url, description,bookShelf];
  const SQL2 = 'SELECT * FROM books;';
  client.query(SQL2)
    .then(result => {
      ln=result.rows.length;
    })
  return client.query(SQL, safeValues)
    .then(() => {
      res.redirect(`/books/${ln+1}`);
    })
}
function newSearch (req, res) {
  res.render('./pages/searches/new');
}
app.post('/searches', (request, response) => {
  const inputt = request.body.search;
  const radio = request.body.radio;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${inputt}+in${radio}:${inputt}`;
  superagent.get(url)
    .then(bookData => {
      let dataArray = bookData.body.items.map(value => {
        return new Book(value);
      })
      response.render('./pages/searches/show', { data: dataArray });
    })
    .catch((error) => {
      errorHandler(error, request, response);
    });
})
function Book(value) {
  this.image_url = value.volumeInfo.imageLinks.smallThumbnail ? value.volumeInfo.imageLinks.smallThumbnail : 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
  this.title = value.volumeInfo.title ? value.volumeInfo.title : 'No book with this title';
  this.author = value.volumeInfo.authors[0] ? value.volumeInfo.authors[0] : 'No books for this author';
  this.description = value.volumeInfo.description ? value.volumeInfo.description : '....';
  this.isbn = value.volumeInfo.industryIdentifiers[0].type + value.volumeInfo.industryIdentifiers[0].identifier ? value.volumeInfo.industryIdentifiers[0].type + value.volumeInfo.industryIdentifiers[0].identifier : '000000';
}
function errorHandler(err, req, res) {
  res.status(500).send(err);
}
function notFoundHandler(req, res) {
  res.status(404).send('This route does not exist!!');
}
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`)
    })
  })