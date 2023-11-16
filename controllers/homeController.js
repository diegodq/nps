module.exports = {
	async home(request, response)
	{
		return response.render('home/nps', { title: 'NPS - AUTOMATIZA VAREJO' });
	}
}