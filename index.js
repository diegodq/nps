require('dotenv').config();
const express = require('express');
const handlebars = require('express-handlebars');
const routes = require('./routes');
const app = express();

const hbs = handlebars.create({
	partialsDir: ['views/partials']
})

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.use(express.json());
app.use(
	express.urlencoded({
		extended: true
	})
);

app.use(routes);

app.listen('3008', _ => {
	console.log('Server running on port 3008');
});