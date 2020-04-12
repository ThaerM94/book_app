'use strict';
require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 3030;
const app = express();
const superagent = require('superagent');
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');


app.get('/index',(request,respons) => {
    respons.render('./pages/index')
})

app.get('/' , (req,res)=>{
  res.render('./pages/index');
})


app.get('/searches/new',(request,respons) => {
  respons.render('./pages/searches/new')
})

app.post('/searches',(request,response)=>{
  const inputt = request.body.search;
  const radio = request.body.radio;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${inputt}+in${radio}:${inputt}`;

  // console.log(request.body);
  superagent.get(url)
    .then(bookData =>{
      let dataArray = bookData.body.items.map(value =>{
        return new Book(value);
      })
      response.render('./pages/searches/show',{data:dataArray});
    })
    .catch((error) => {
      errorHandler(error, request, response);
    });
})
function Book (value){
  if(value.volumeInfo.imageLinks.smallThumbnail === null) {
    this.image = 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
  } else {
    this.image = value.volumeInfo.imageLinks.smallThumbnail;
  }
  this.title = value.volumeInfo.title;
  this.author= value.volumeInfo.authors[0];
  this.description = value.volumeInfo.description;
}


app.get('*',(req,res)=>{
  res.status(404).send('This route does not exist!!');
})

function errorHandler (err,req,res){
  res.status(505).send(err);
}

app.listen(PORT,()=>{
  console.log(`Listening on PORT ${PORT}`)
})