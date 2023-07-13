module.exports = {
	async home(request, response)
	{
		return response.render('home/nps', { title: 'NPS - Automatiza Varejo' });
	},

	async test(request, response) {
		return response.render('home/test', { title: 'test'});
	}
}