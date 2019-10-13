$(function(){
	
	var data = [
		{
			id:0, isInicio:true, isFim: false, 
			descricao: 'Início', 
			dtIni: '01/01/2017', dtFim: '01/01/2017', 
			resp: '', 
			prox: [1, 2], 
			ponto: { isJaMovimentado: false,  x: 0,  y: 0 }
		},
		{
			id:1, isInicio:false, isFim: false, 
			descricao: 'Definição do Escopo do projeto', 
			dtIni: '01/01/2017',  dtFim: '25/01/2017', 
			resp: 'Diogo Rodrigo Schimmelpfennig', 
			prox: [3, 5], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		},
		{
			id:2, isInicio:false, isFim: false, 
			descricao: 'Pesquisas Bibliográficas do Escopo do projeto', 
			dtIni: '05/01/2017',  dtFim: '18/01/2017', 
			resp: 'Dilmar Douglas Schimmelpfennig', 
			prox: [3, 4, 20], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		},
		{
			id:20, isInicio:false, isFim: false, 
			descricao: 'Plano de Ação de Risco', 
			dtIni: '05/01/2017',  dtFim: '18/01/2017', 
			resp: 'Dilmar Douglas Schimmelpfennig', 
			prox: [21], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 },
			isRisco: 1
		},
		{
			id:21, isInicio:false, isFim: false, 
			descricao: 'Plano de Ação de Risco', 
			dtIni: '05/01/2017',  dtFim: '18/02/2017', 
			resp: 'Dilmar Douglas Schimmelpfennig', 
			prox: [], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 },
			isRisco: 1
		},
		{
			id:3, isInicio:false, isFim: false, 
			descricao: 'Desenvolvimento do Plano de Projeto', 
			dtIni: '22/01/2017',  dtFim: '25/01/2017', 
			resp: 'Elmar Schimmelpfennig', 
			prox: [6], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		},
		{
			id:4, isInicio:false, isFim: false, 
			descricao: 'Desenvolvimento do Plano de Comunicação', 
			dtIni: '22/01/2017',  dtFim: '25/01/2017', 
			resp: 'Dirce Schimmelpfennig', 
			prox: [6], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		},
		{
			id:5, isInicio:false, isFim: false, 
			descricao: 'Aprovação do orçamento', 
			dtIni: '22/01/2017',  dtFim: '25/01/2017', 
			resp: 'Dirce Schimmelpfennig', 
			prox: [6], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		},
		{
			id:6, isInicio:false, isFim: false, 
			descricao: 'Documentação do Projeto', 
			dtIni: '22/01/2017',  dtFim: '25/01/2017', 
			resp: 'Dirce Schimmelpfennig', 
			prox: [99999], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		},
		{
			id:99999, isInicio:false, isFim: true, 
			descricao: 'Fim', 
			dtIni: '22/01/2017',  dtFim: '25/01/2017', 
			resp: 'Dirce Schimmelpfennig', 
			prox: [], 
			ponto: { isJaMovimentado: false, x: 0, y: 0 } 
		}
	];
	
	var prop = {
		data: data,
		info:{
			id: 1,
			nomeMapa: 'Caminho Crítico do Sistema de Vendas',
			scale: 100,
			isPodeMovimentar: true,
			t:{
				x: 0,
				y: 0
			}
		}
	};
	
	var cc = new ContainerCC().CCritico('CanvasCC', 'cv');
	cc.Start(prop);
	cc.Desenhar();
	
});