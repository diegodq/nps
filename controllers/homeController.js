module.exports = {
	async home(request, response)
	{
		const cnpj = request.query.cnpj;
		if(!cnpj) {
			response.redirect(302, 'https://automatizavarejo.com.br');
		} else {
			return response.render('home/nps', { title: 'NPS - Automatiza Varejo' });
		}
	}
}