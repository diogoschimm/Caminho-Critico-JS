/// <reference path="jquery-1.7.1.min.js" />

/* CC - v1.1.1 - 2016-05-01
* http://www.diogoschimm.eti.br
* Diogo Rodrigo Schimmelpfennig */

var cc_;
var data;
var prop;
var request;
var handleScroll;
var contextmenuFc;
var mouseupFc;
var mousemoveFc;
var mousedownFc;

(function () {

    var root = this;
    root.ContainerCC = function () {

        var ctt = {
            GRADIENTE: {
                X_AZUL: 0,
                X_VERDE: 1,
                X_VERMELHO: 2
            }
        };
        var dimRect = {
            hRect: 90, diffHRect: 50, arco: 0,
            wRect: 300, diffWRect: 50,
            hGrade: 0, wGrade: 0,
            hMin: 1000, wMin: 2000
        };
        var linha = {
            fracaoX: 10
        };

        var dados = {};
        var info = {};
        var dadosCaminhados = [];
        var indiceCaminho = 0;

        var _aux = {};
        var _niveis = [];
        var _maior = 0;

        var caminhoCriticoCalculado = [];

        var translatePos = { x: 0, y: 0 };
        var startDragOffset = {};

        var scaleMultiplier = 0.90;
        var deltaAtual = 1;

        var isRefresh = false;
        var contexto = {
            isContexto: false,
            isElemento: false,
            ponto: { x: 0, y: 0 },
            pontoHover: { x: 0, y: 0 },
            el: null
        };

        var CC = function (p_idElementoCanvas, p_idElementoContainer) {

            var Me = this;

            Me.Container = $('#' + p_idElementoContainer);
            Me.Canvas = document.getElementById(p_idElementoCanvas);
            Me.Context = Me.Canvas.getContext('2d');

            Me.Start = function (prop) {

                _aux = new Aux();
                dados = prop.data;
                info = prop.info;
                info.scale = info.scale / 100.0;

                translatePos.x = info.t.x;
                translatePos.y = info.t.y;

                // Montar a arvore 
                if (dados.length > 0) {
                    var _primeiros = _aux.BuscarArray(dados, _aux.BuscarPrimeiro);
                    for (var i = 0; i < _primeiros.length; i++) {

                        /*Novo Caminho*/

                        var soma = _aux.DiferencaDias(_primeiros[i].dtIni, _primeiros[i].dtFim);
                        var ids = [_primeiros[i].id];

                        caminhoCriticoCalculado[caminhoCriticoCalculado.length] = { total: soma, ids: ids };

                        new Caminhar(_primeiros[i], 0, soma, ids);
                    }

                    caminhoCriticoCalculado.sort(function (a, b) {
                        return a.total - b.total;
                    });

                    console.log(caminhoCriticoCalculado);

                    caminhoCriticoCalculado = caminhoCriticoCalculado[caminhoCriticoCalculado.length - 1].ids;
                    console.log(caminhoCriticoCalculado);
                }

                dimRect.hGrade = (_maior * (dimRect.hRect + dimRect.diffHRect)) + (dimRect.hRect + dimRect.diffHRect) + 300;
                dimRect.wGrade = (_niveis.length * (dimRect.wRect + dimRect.diffWRect)) + (dimRect.wRect + dimRect.diffWRect) + 500;

                if (dimRect.hGrade < dimRect.hMin) {
                    dimRect.hGrade = dimRect.hMin;
                }
                if (dimRect.wGrade < dimRect.wMin) {
                    dimRect.wGrade = dimRect.wMin;
                }

                SetPropriedadesCanvas(this, dimRect.hGrade, dimRect.wGrade);

                AdicionarListenerMovimentacao(this);
                AdicionarListenerContexto(this);
                AdicionarListenerZoom(this);
                Me.AtualizaCadeado();
            };

            Me.Desenhar = function () {
                Me.LimparTela();

                Me.Context.save();
                DefinirZoom();

                Me.Context.translate(translatePos.x, translatePos.y);
                Me.Context.scale(info.scale, info.scale);

                MontarGrade(this, dimRect.hGrade, dimRect.wGrade);

                var textoGeral = new CCTexto(info.nomeMapa);
                textoGeral.ConfigurarFonte('Arial', '30px', '#000', false, false);

                EscreverTextoGenerico(Me.Context, new CCPonto(70, 70), textoGeral);

                if (dados.length > 0) {

                    var pontoX = 0;

                    // Posicionamento dos Entregaveis
                    for (var i = 0; i < _niveis.length; i++) {

                        pontoX += (i + 1) * (dimRect.wRect + dimRect.diffWRect);

                        var pontoY = 0;
                        var itens = dados.filter(function (e) { return e.nivel == _niveis[i].n; });
                        for (var j = 0; j < itens.length; j++) {

                            pontoY = (j + 1) * (dimRect.hRect + dimRect.diffHRect);
                            itens[j].isCC = false;

                            if (caminhoCriticoCalculado.filter(function (e) { return e == itens[j].id }).length > 0) {
                                itens[j].isCC = true;
								if (itens[j].isRisco){
									itens[j].isCC = false;
								}
                            }

                            var w = dimRect.wRect;
                            var h = dimRect.hRect;
                            if (itens[j].isInicio || itens[j].isFim) {
                                itens[j].dimensao = { w: 150, h: 50 };
                            } else {
                                itens[j].dimensao = { w: w, h: h };
                            }

                            var isDefiniPosicionamento = true
                            if (itens[j].ponto && itens[j].ponto.isJaMovimentado){// && !isRefresh) {
                                isDefiniPosicionamento = false;
                            }
                            if (isDefiniPosicionamento) {
                                itens[j].ponto = { x: pontoX, y: pontoY };
                                _aux.DefinirPosicionamentoRetangulo(itens[j]);
                            }
                        }
                        pontoX = 0;
                    }

                    // Desenhar as linhas
                    for (var i = 0; i < _niveis.length; i++) {

                        var itens = dados.filter(function (e) { return e.nivel == _niveis[i].n; });
                        for (var j = 0; j < itens.length; j++) {

                            if (itens[j].prox) {
                                for (var z = 0; z < itens[j].prox.length; z++) {

                                    var _elementoAtual = itens[j];
                                    var _proximoElemento = _aux.BuscarArrayParams(dados, { id: _elementoAtual.prox[z] })[0];

                                    if (_proximoElemento.ponto && _proximoElemento.dimensao) {

                                        //if (!_proximoElemento.isSelecionado) {

                                        var wOrigem = _elementoAtual.dimensao.w;
                                        var hOrigem = _elementoAtual.dimensao.h;

                                        var hDestino = _proximoElemento.dimensao.h;

                                        var pontoOrigem = new CCPonto(_elementoAtual.ponto.x + wOrigem + 1, _elementoAtual.ponto.y + (hOrigem / 2));
                                        var pontoDestino = new CCPonto(_proximoElemento.ponto.x - 1, _proximoElemento.ponto.y + (hDestino / 2));

                                        var grad = ctt.GRADIENTE.X_AZUL;
                                        if (_proximoElemento.isCC && _elementoAtual.isCC) {
                                            grad = ctt.GRADIENTE.X_VERMELHO;
                                        }

                                        var isFracaoOrigem = true;
                                        var isFracaoDestino = true;

                                        if (!_proximoElemento.isCC && _elementoAtual.isCC) {
                                            isFracaoOrigem = false;
                                        }

                                        if (_proximoElemento.isCC && !_elementoAtual.isCC) {
                                            isFracaoDestino = false;
                                        }

                                        DesenharLinha(Me.Context, pontoOrigem, pontoDestino, grad, isFracaoOrigem, isFracaoDestino);
                                    }
                                }
                            }
                        }
                    }

                    // Desenhar os Entregaveis
                    var isPossuiItemSelecionado = false;
                    var elementoSelecionado = null;

                    for (var i = 0; i < _niveis.length; i++) {

                        var itens = dados.filter(function (e) { return e.nivel == _niveis[i].n; });
                        for (var j = 0; j < itens.length; j++) {

                            if (itens[j].isSelecionado && !isPossuiItemSelecionado) {

                                isPossuiItemSelecionado = true;
                                elementoSelecionado = itens[j];

                            } else {
                                Me.DesenharItem(itens[j]);
                            }
                        }
                    }

                    if (isPossuiItemSelecionado) {
                        Me.DesenharItem(elementoSelecionado);
                    }

                } else {

                    textoGeral.Texto = 'Não foi criado cronograma (entregáveis) para essa IAP. Utilize o módulo de Planejamento para criar entregáveis e montar as precedências.';
                    textoGeral.ConfigurarFonte('Arial', '18px', '#000', false, false);
                    EscreverTextoGenerico(Me.Context, new CCPonto(70, 100), textoGeral);
                }

                if (contexto.isContexto && contexto.isElemento && false) {
                    Me.DesenharMenuContexto();
                }

                Me.Context.restore();
            };

            Me.DesenharMenuContexto = function () {

                contexto.dimensao = { w: 230, h: 0 };

                var dadosMenuContexto = [],
                    hPadrao = 32,
                    diffTextoX = 35,
                    diffTextoY = 20;

                // Itens do Menu de Contexto
                dadosMenuContexto[0] = { texto: 'Editar Dados' };
                dadosMenuContexto[1] = { texto: 'Limpar Ligações Antecessoras' };
                dadosMenuContexto[2] = { texto: 'Limpar Ligações Posterioras' };

                // Posicionamento dos Itens do Menu de Contexto
                var yDiff = 0;
                for (var i = 0; i < dadosMenuContexto.length; i++) {
                    yDiff = 0;
                    if (i == 0) {
                        yDiff = contexto.ponto.y + 2;
                    } else {
                        yDiff = dadosMenuContexto[i - 1].ponto.y + dadosMenuContexto[i - 1].dimensao.h;
                    }
                    dadosMenuContexto[i].ponto = { x: contexto.ponto.x + 2, y: yDiff };
                    dadosMenuContexto[i].dimensao = { w: contexto.dimensao.w - 4, h: hPadrao };

                    contexto.dimensao.h += dadosMenuContexto[i].dimensao.h;
                }
                contexto.dimensao.h += 4;
                Me.DesenharMenuContexto_Caixa();

                // Texto Selecionado
                for (var i = 0; i < dadosMenuContexto.length; i++) {
                    var el = dadosMenuContexto[i];
                    if (contexto.pontoHover.x >= el.ponto.x && contexto.pontoHover.x <= el.ponto.x + el.dimensao.w &&
                        contexto.pontoHover.y >= el.ponto.y && contexto.pontoHover.y <= el.ponto.y + el.dimensao.h) {

                        Me.Context.fillStyle = "rgba(231, 238, 246, 0.8)";
                        Me.Context.strokeStyle = "#97C1F4";
                        Me.Context.fillRect(el.ponto.x , el.ponto.y  , el.dimensao.w, el.dimensao.h);
                        Me.Context.strokeRect(el.ponto.x, el.ponto.y, el.dimensao.w, el.dimensao.h);
                        break;
                    }
                }

                // Textos do Menu
                var p = new CCPonto(contexto.ponto.x, contexto.ponto.y);
                var t = new CCTexto();
                t.ConfigurarFonte('Arial', '12px', '#000', false, false);

                for (var i = 0; i < dadosMenuContexto.length; i++) {
                    p.X = dadosMenuContexto[i].ponto.x + diffTextoX;
                    p.Y = dadosMenuContexto[i].ponto.y + diffTextoY;
                    t.Texto = dadosMenuContexto[i].texto;

                    EscreverTextoGenerico(Me.Context, p, t, 'left');
                }
            };
            Me.DesenharMenuContexto_Caixa = function () {

                // Desenho da Caixa de Menu
                Me.Context.lineWidth = 1;
                Me.Context.strokeStyle = "#979797";
                Me.Context.setLineDash([0]);
                Me.Context.shadowColor = '#333';
                Me.Context.shadowBlur = 3;
                Me.Context.shadowOffsetX = 2;
                Me.Context.shadowOffsetY = 2;
                Me.Context.strokeRect(contexto.ponto.x, contexto.ponto.y, contexto.dimensao.w, contexto.dimensao.h);

                Me.Context.fillStyle = "#F0F0F0";
                Me.Context.fillRect(contexto.ponto.x, contexto.ponto.y, contexto.dimensao.w, contexto.dimensao.h);

                // Desenho da Linha de Menu (Cinza)
                Me.Context.shadowBlur = 0;
                Me.Context.shadowOffsetX = 0;
                Me.Context.shadowOffsetY = 0;
                Me.Context.lineWidth = 1;
                Me.Context.strokeStyle = "#E2E3E3";

                Me.Context.beginPath();
                Me.Context.moveTo(contexto.ponto.x + 25, contexto.ponto.y + 2);
                Me.Context.lineTo(contexto.ponto.x + 25, contexto.ponto.y + contexto.dimensao.h - 2);
                Me.Context.closePath();
                Me.Context.stroke();

                // Desenho da Linha de Menu (Branco)
                Me.Context.strokeStyle = "#FFF";

                Me.Context.beginPath();
                Me.Context.moveTo(contexto.ponto.x + 26, contexto.ponto.y + 2);
                Me.Context.lineTo(contexto.ponto.x + 26, contexto.ponto.y + contexto.dimensao.h - 2);
                Me.Context.closePath();
                Me.Context.stroke();

            };

            Me.DesenharItem = function (el) {

                var texto = new CCTexto('Início');
                texto.ConfigurarFonte('Arial', '13px', '#000', false, false);

                texto.Texto = el.descricao;
                texto.DtIni = el.dtIni;
                texto.DtFim = el.dtFim;
                texto.Resp = el.resp;

                var grad = ctt.GRADIENTE.X_VERDE;
                if (el.isCC) {
                    grad = ctt.GRADIENTE.X_VERMELHO;
                }
				if (el.isRisco){
					grad = ctt.GRADIENTE.X_AZUL;
				}

                var prop = {
                    context: Me.Context,
                    ponto: new CCPonto(el.ponto.x, el.ponto.y),
                    dimensao: new CCDimensao(el.dimensao.w, el.dimensao.h, dimRect.arco),
                    gradiente: grad,
                    texto: texto,
                    isSelecionado: el.isSelecionado,
                    canvas: Me.Canvas,
                    el: el
                };
                if (el.isInicio || el.isFim) {
                    prop.texto.ConfigurarFonte('Calibri', '18px', '#333', true, false)
                    DesenhaInicioFim(prop, 10);
                } else {
                    DesenharRetangulo(prop);
                    DesenhaAcoes(prop);
                }

            };

            Me.LimparTela = function () {
                Me.Context.clearRect(0, 0, Me.Canvas.width, Me.Canvas.height);
            };

            Me.ZoomPlus = function () {
                if (info.isPodeMovimentar) {
                    info.scale /= scaleMultiplier;
                    Me.Desenhar();
                }
                return false;
            };
            Me.ZoomMinus = function () {
                if (info.isPodeMovimentar) {
                    info.scale *= scaleMultiplier;
                    Me.Desenhar();
                }
                return false;
            };
            Me.ZoomReset = function () {
                if (info.isPodeMovimentar) {
                    info.scale = 1;
                    Me.Desenhar();
                }
                return false;
            };

            Me.FullScreen = function () {
                $(window.document.body).addClass('semOverflow');
                Me.Container.addClass('fullScreen');
                Me.Container.find('.fa-arrows-alt').parents('li').hide();
                Me.Container.find('.fa-compress').parents('li').show();

            };
            Me.NoFullScreen = function () {
                $(window.document.body).removeClass('semOverflow');
                Me.Container.removeClass('fullScreen');
                Me.Container.find('.fa-arrows-alt').parents('li').show();
                Me.Container.find('.fa-compress').parents('li').hide();
            };

            Me.MoveScreen = function () {
                info.isPodeMovimentar = !info.isPodeMovimentar;
                if (info.isPodeMovimentar) {
                    Me.Container.find('.fa-lock').removeClass('fa-lock').addClass('fa-unlock-alt');
                } else {
                    Me.Container.find('.fa-unlock-alt').removeClass('fa-unlock-alt').addClass('fa-lock');
                }
                Me.Salvar();
                return false;

            };

            Me.AtualizaCadeado = function () {
                if (info.isPodeMovimentar) {
                    Me.Container.find('.fa-lock').removeClass('fa-lock').addClass('fa-unlock-alt');
                } else {
                    Me.Container.find('.fa-unlock-alt').removeClass('fa-unlock-alt').addClass('fa-lock');
                }
                return false;

                Me.Salvar();
            };

            Me.Refresh = function () {

                info.scale = 1.0;
                translatePos = { x: 0, y: 0 };

                isRefresh = true;
                Me.Desenhar();
                isRefresh = false;
                Me.Salvar();
                return false;
            };

            Me.Salvar = function () {

                // if (request != null) {
                    // request.abort();
                // }

                // var tx = parseInt(translatePos.x);
                // var ty = parseInt(translatePos.y);
                // request = $.ajax({
                    // url: "../UI_EXP/hand_ATUALIZA_XY.ashx?tipo=IAP&idCenario=" + info.id + "&x=" + tx + "&y=" + ty + "&isPodeMovimentar=" + info.isPodeMovimentar.toString() + "&zoom=" + parseInt(info.scale * 100)
                // }).done(function (data) {
                    // console.log(data);
                // });


                return false;
            };

            eval('window._' + p_idElementoCanvas + ' = Me;');

            return this;
        };

        var Caminhar = function (data, nivelPai, p_soma, p_ids) {

            //console.log(data.descricao);

            if (dadosCaminhados.filter(function (el) { return el == data.id; }).length == 0) {

                if (!data.nivel || data.nivel <= nivelPai + 1) {
                    data.nivel = nivelPai + 1;
                }
                if (!_niveis.filter || _niveis.filter(function (el) { return el.n == data.nivel; }).length == 0) {
                    _niveis[nivelPai] = { n: nivelPai + 1 };
                }
                _niveis[nivelPai].qtde = dados.filter(function (el) { return el.nivel == _niveis[nivelPai].n; }).length;

                if (_maior <= _niveis[nivelPai].qtde) {
                    _maior = _niveis[nivelPai].qtde;
                }
                data.posicao = _niveis[nivelPai].qtde;

                dadosCaminhados[indiceCaminho] = data.id;
                indiceCaminho += 1;
            }
            if (data.prox) {
                data.prox.sort();
                for (var i = 0; i < data.prox.length; i++) {

                    var _el = _aux.BuscarArrayParams(dados, { id: data.prox[i] });
                    var soma = _aux.DiferencaDias(_el[0].dtIni, _el[0].dtFim);; 
					if (data.isRisco){
						soma = 0;
					}

                    var ids = p_ids.slice();
                    ids[ids.length] = _el[0].id;
                    console.log(ids);

                    /*Novo Caminho*/
                    if (i > 0) {
                        caminhoCriticoCalculado[caminhoCriticoCalculado.length] = { total: p_soma + soma, ids: ids };
                    } else {
                        caminhoCriticoCalculado[caminhoCriticoCalculado.length - 1] = { total: p_soma + soma, ids: ids };
                    }
                    new Caminhar(_el[0], nivelPai + 1, p_soma + soma, ids);
                }
            }
        };

        var CCPonto = function (x, y) {
            this.X = this.x = x;
            this.Y = this.y = y;
        };
        var CCDimensao = function (w, h, arc) {
            this.W = this.w = w;
            this.H = this.h = h;
            this.ARC = this.arc = arc;
        };
        var CCTexto = function (texto, dtIni, dtFim, resp) {
            var _nomeFonte,
                _tamanhoFonte,
                _corFonte,
                _negrito,
                _italico;

            this.Texto = texto;
            this.DtIni = dtIni;
            this.DtFim = dtFim;
            this.Resp = resp;

            this.NomeFonte = function () { return _nomeFonte };
            this.TamanhoFonte = function () { return _tamanhoFonte };
            this.CorFonte = function () { return _corFonte };
            this.Negrito = function () { return _negrito };
            this.Italico = function () { return _italico };

            this.ConfigurarFonte = function (nomeFonte, tamanhoFonte, corFonte, negrito, italico) {
                _nomeFonte = nomeFonte;
                _tamanhoFonte = tamanhoFonte;
                _corFonte = corFonte;
                _negrito = negrito;
                _italico = italico;
            }
        };

        var SetPropriedadesCanvas = function (obj, _h, _w) {
            var w, h;

            w = (_w) ? _w : obj.Container.width();
            h = (_h) ? _h : obj.Container.height();

            obj.Canvas.setAttribute("width", w);
            obj.Canvas.setAttribute("height", h);

        };
        var MontarGrade = function (obj, _h, _w) {

            // Contorno
            obj.Context.beginPath();
            obj.Context.moveTo(0, 0);
            obj.Context.lineTo(_w, 0);
            obj.Context.lineTo(_w, _h);
            obj.Context.lineTo(0, _h);
            obj.Context.lineTo(0.5, 0);
            obj.Context.closePath();
            obj.Context.fillStyle = "#FFF";
            obj.Context.fill();

            // Linhas
            obj.Context.beginPath();
            for (var x = 0.5; x < _w; x += 12) {
                obj.Context.moveTo(x, 0);
                obj.Context.lineTo(x, _h);
            }
            for (var y = 0.5; y < _h; y += 12) {
                obj.Context.moveTo(0, y);
                obj.Context.lineTo(_w, y);
            }
            obj.Context.closePath()
            obj.Context.strokeStyle = "#D6E5F3";
            obj.Context.strokeStyle = "#EFF4FA";
            obj.Context.stroke();

            // Linha Inicial
            obj.Context.beginPath();
            obj.Context.moveTo(37, 0);
            obj.Context.lineTo(37, _h);
            obj.Context.closePath()
            obj.Context.strokeStyle = "#FC7878";
            obj.Context.stroke();

        };

        var DesenharLinha = function (context, ponto1, ponto2, gradiente, isFracaoOrigem, isFracaoDestino) {

			var pontoOrigem = new CCPonto(ponto1.X + linha.fracaoX, ponto1.Y); 
		
            // OffSet Origem
            if (isFracaoOrigem) {
                context.beginPath();
                context.moveTo(ponto1.X, pontoOrigem.Y);
                context.lineTo(pontoOrigem.X , pontoOrigem.Y);
                context.setLineDash([0]);
                context.strokeStyle = "#000";
                switch (gradiente) {
                    case ctt.GRADIENTE.X_VERMELHO:
                        context.setLineDash([0]);
                        context.strokeStyle = "#F00";
                        context.lineWidth = 2;
                        break;
                }
                context.stroke();
				 
            }
			
			if (ponto2.X < ponto1.X){
				
				
				context.beginPath();
                context.moveTo(pontoOrigem.X, pontoOrigem.Y);
				
				if (ponto2.Y < ponto1.Y){
					pontoOrigem.Y  = pontoOrigem.Y - (parseInt(dimRect.hRect / 2) + linha.fracaoX);	
				}else{
					pontoOrigem.Y  = pontoOrigem.Y + (parseInt(dimRect.hRect / 2) + linha.fracaoX);	
				}
                context.lineTo(pontoOrigem.X, pontoOrigem.Y);
				
				context.setLineDash([3]);
                context.strokeStyle = "#000";
                switch (gradiente) {
                    case ctt.GRADIENTE.X_VERMELHO:
						context.setLineDash([0]);
                        context.strokeStyle = "#F00";
                        context.lineWidth = 2;
                        break;
                }
                context.stroke();
				
			}			
			

			var pontoDestino = new CCPonto(ponto2.X - linha.fracaoX, ponto2.Y);
			
			var isCompletar = false;
			if (ponto2.X < ponto1.X){
				isCompletar = true;
				if (ponto2.Y < ponto1.Y){
					pontoDestino.Y = ponto2.Y + (parseInt(dimRect.hRect / 2) + linha.fracaoX);	 
				}else{
					pontoDestino.Y = ponto2.Y - (parseInt(dimRect.hRect / 2) + linha.fracaoX);	 
				} 
			}
			
            // Tracejado
            context.beginPath();
            context.moveTo(pontoOrigem.X, pontoOrigem.Y);
            context.lineTo(pontoDestino.X, pontoDestino.Y);
            context.setLineDash([3]);
            context.strokeStyle = "#000";
            switch (gradiente) {
                case ctt.GRADIENTE.X_VERMELHO:
                    context.setLineDash([0]);
                    context.strokeStyle = "#F00";
                    context.lineWidth = 2;
                    break;
            }
            context.stroke();
			
			if (isCompletar){
				 context.beginPath();
				context.moveTo(pontoDestino.X, pontoDestino.Y);
				context.lineTo(ponto2.X - linha.fracaoX, ponto2.Y);
				context.setLineDash([3]);
				context.strokeStyle = "#000";
				switch (gradiente) {
					case ctt.GRADIENTE.X_VERMELHO:
						context.setLineDash([0]);
						context.strokeStyle = "#F00";
						context.lineWidth = 2;
						break;
				}
				context.stroke();
			}

            // OffSet destino
            if (isFracaoDestino) {

                context.beginPath();
                context.moveTo(ponto2.X - linha.fracaoX, ponto2.Y);
                context.lineTo(ponto2.X, ponto2.Y);
                context.setLineDash([0]);
                context.strokeStyle = "#000";
                switch (gradiente) {
                    case ctt.GRADIENTE.X_VERMELHO:
                        context.setLineDash([0]);
                        context.strokeStyle = "#F00";
                        context.lineWidth = 2;
                        break;
                }
                context.stroke();

                // SETA (Corpo)
                context.beginPath();
                context.moveTo(ponto2.X - 5, ponto2.Y - 5);
                context.lineTo(ponto2.X, ponto2.Y);
                context.lineTo(ponto2.X - 5, ponto2.Y + 5);
                context.lineTo(ponto2.X - 5, ponto2.Y - 5);
                context.fillStyle = "#000";
                switch (gradiente) {
                    case ctt.GRADIENTE.X_VERMELHO:
                        context.fillStyle = "#F00";
                        break;
                }
                context.fill();

                // SETA (Linha)
                context.setLineDash([0]);
                context.strokeStyle = "#000";
                switch (gradiente) {
                    case ctt.GRADIENTE.X_VERMELHO:
                        context.strokeStyle = "#F00";
                        break;
                }
                context.stroke();
            }
        };
        var DesenhaInicioFim = function (prop, r) {

            if (prop.dimensao.w < 2 * r) r = prop.dimensao.w / 2;
            if (prop.dimensao.h < 2 * r) r = prop.dimensao.h / 2;

            prop.context.strokeStyle = "#000";
            prop.context.fillStyle = "#FFF";
            prop.context.setLineDash([0]);
            prop.context.beginPath();
            prop.context.moveTo(prop.ponto.X + r, prop.ponto.Y);

            prop.context.arcTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y, prop.ponto.X + prop.dimensao.W, prop.ponto.Y + prop.dimensao.h, r);
            prop.context.arcTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y + prop.dimensao.h, prop.ponto.X, prop.ponto.Y + prop.dimensao.h, r);
            prop.context.arcTo(prop.ponto.X, prop.ponto.Y + prop.dimensao.h, prop.ponto.X, prop.ponto.Y, r);
            prop.context.arcTo(prop.ponto.X, prop.ponto.Y, prop.ponto.X + prop.dimensao.W, prop.ponto.Y, r);

            if (prop.isSelecionado) {
                prop.context.shadowColor = '#333';
                prop.context.shadowBlur = 10;
                prop.context.shadowOffsetX = 5;
                prop.context.shadowOffsetY = 5;
            }
            prop.context.closePath();
            prop.context.stroke();
            prop.context.fill();

            prop.ponto.X = prop.ponto.X + prop.dimensao.w / 2;
            prop.ponto.Y = prop.ponto.Y + prop.dimensao.H * 0.45;

            EscreverTextoGenerico(prop.context, prop.ponto, prop.texto, "center");

            prop.texto.ConfigurarFonte('Calibri', '15px', '#333', false, false);
            prop.ponto.Y = prop.ponto.Y + (prop.dimensao.H * 0.3);

            if (prop.el.isInicio) {
                prop.texto.Texto = prop.el.dtIni;
                EscreverTextoGenerico(prop.context, prop.ponto, prop.texto, "center");
            } else {
                prop.texto.Texto = prop.el.dtFim;
                EscreverTextoGenerico(prop.context, prop.ponto, prop.texto, "center");
            }
        }

        var DesenharRetangulo = function (prop) {

            // Desenhar o Retangulo Geral
            prop.context.beginPath();
            prop.context.moveTo(prop.ponto.X + prop.dimensao.ARC, prop.ponto.Y);
            prop.context.lineTo(prop.ponto.X + prop.dimensao.W - prop.dimensao.ARC, prop.ponto.Y);
            prop.context.quadraticCurveTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y, prop.ponto.X + prop.dimensao.W, prop.ponto.Y + prop.dimensao.ARC);

            prop.context.lineTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y + prop.dimensao.H - prop.dimensao.ARC);
            prop.context.quadraticCurveTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y + prop.dimensao.H, prop.ponto.X + prop.dimensao.W - prop.dimensao.ARC, prop.ponto.Y + prop.dimensao.H);

            prop.context.lineTo(prop.ponto.X + prop.dimensao.ARC, prop.ponto.Y + prop.dimensao.H);
            prop.context.quadraticCurveTo(prop.ponto.X, prop.ponto.Y + prop.dimensao.H, prop.ponto.X, prop.ponto.Y + prop.dimensao.H - prop.dimensao.ARC);

            prop.context.lineTo(prop.ponto.X, prop.ponto.Y + prop.dimensao.ARC);
            prop.context.quadraticCurveTo(prop.ponto.X, prop.ponto.Y, prop.ponto.X + prop.dimensao.ARC, prop.ponto.Y);
            prop.context.closePath();

            prop.context.setLineDash([0]);
            prop.context.strokeStyle = "#000";
            switch (prop.gradiente) {
                case ctt.GRADIENTE.X_AZUL:
                    prop.context.strokeStyle = "#ffd800";
                    break;
                case ctt.GRADIENTE.X_VERDE:
                    prop.context.strokeStyle = "#000";
                    break;
                case ctt.GRADIENTE.X_VERMELHO:
                    prop.context.strokeStyle = "#F00";
                    break;
            }
            prop.context.lineWidth = 3;
            prop.context.stroke();

            prop.context.shadowColor = '#666';
            prop.context.shadowBlur = 0;
            prop.context.shadowOffsetX = 0;
            prop.context.shadowOffsetY = 0;

            if (prop.isSelecionado) {

                prop.context.shadowColor = '#333';
                prop.context.shadowBlur = 10;
                prop.context.shadowOffsetX = 5;
                prop.context.shadowOffsetY = 5;
            }

            var grd = prop.context.createLinearGradient(0, prop.ponto.Y + (prop.dimensao.H * 0.3), 0, prop.ponto.Y + prop.dimensao.H);
            prop.context.fillStyle = "#FFF";
            prop.context.fill();

            prop.context.lineWidth = 1;
            prop.context.shadowBlur = 0;
            prop.context.shadowOffsetX = 0;
            prop.context.shadowOffsetY = 0;
            prop.context.strokeStyle = "#000";
            switch (prop.gradiente) {
                case ctt.GRADIENTE.X_AZUL:
                    prop.context.strokeStyle = "#ffd800";
                    break;
                case ctt.GRADIENTE.X_VERDE:
                    prop.context.strokeStyle = "#000";
                    break;
                case ctt.GRADIENTE.X_VERMELHO:
                    prop.context.strokeStyle = "#F00";
                    break;
            }

            // Desenhar Divisão (Tarefa x Datas)
            prop.context.beginPath();
            prop.context.moveTo(prop.ponto.X, prop.ponto.Y);
            prop.context.lineTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y);
            prop.context.lineTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y + (prop.dimensao.H * 0.34));
            prop.context.lineTo(prop.ponto.X, prop.ponto.Y + (prop.dimensao.H * 0.34));
            prop.context.lineTo(prop.ponto.X, prop.ponto.Y);
            prop.context.closePath();

            prop.context.fillStyle = "#F0F0F0";
            switch (prop.gradiente) {
                case ctt.GRADIENTE.X_AZUL:
                    prop.context.fillStyle = "#fff77d";
                    break;
                case ctt.GRADIENTE.X_VERDE:
                    prop.context.fillStyle = "#F0F0F0";
                    break;
                case ctt.GRADIENTE.X_VERMELHO:
                    prop.context.fillStyle = "#F00";
                    break;
            }
            prop.context.fill();

            prop.context.beginPath();
            prop.context.moveTo(prop.ponto.X, prop.ponto.Y + (prop.dimensao.H * 0.34));
            prop.context.lineTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y + (prop.dimensao.H * 0.34));
            prop.context.stroke();

            // Desenhar Divisão (Datas x Responsável)
            prop.context.beginPath();
            prop.context.moveTo(prop.ponto.X, prop.ponto.Y + (prop.dimensao.H * 0.68));
            prop.context.lineTo(prop.ponto.X + prop.dimensao.W, prop.ponto.Y + (prop.dimensao.H * 0.68));
            prop.context.stroke();

            // Desenhar Divisão (Datas x Datas)
            prop.context.beginPath();
            prop.context.moveTo(prop.ponto.X + (prop.dimensao.W / 2), prop.ponto.Y + (prop.dimensao.H * 0.34));
            prop.context.lineTo(prop.ponto.X + (prop.dimensao.W / 2), prop.ponto.Y + (prop.dimensao.H * 0.68));
            prop.context.stroke();

            if (prop.texto) {
                prop.texto.isCC = ctt.GRADIENTE.X_VERMELHO == prop.gradiente;

                var propTexto = {
                    context: prop.context,
                    ponto: prop.ponto,
                    texto: prop.texto,
                    dimensao: prop.dimensao
                };
                EscreverTexto(propTexto);
            }
        };
        var DesenhaAcoes = function (prop) {
            if (true && prop.isSelecionado) {

                //var prop = {
                //    context: Me.Context,
                //    ponto: pontoDim,
                //    dimensao: new CCDimensao(w, h, dimRect.arco),
                //    gradiente: grad,
                //    texto: texto,
                //    isSelecionado: itens[j].isSelecionado
                //};
                var dimEditar = {
                    xIni: prop.ponto.x,
                    yIni: prop.ponto.y - 40,
                    wIni: 28,
                    hIni: 28
                };
                var dimExcluir = {
                    xIni: dimEditar.xIni + dimEditar.wIni + 10,
                    yIni: prop.ponto.y - 40,
                    wIni: 28,
                    hIni: 28
                };

                // Propriedades
                prop.context.strokeStyle = "#000";
                prop.context.fillStyle = "#FFF";
                prop.context.shadowColor = '#666';
                prop.context.shadowBlur = 1;
                prop.context.shadowOffsetX = 1;
                prop.context.shadowOffsetY = 1;

                // Rect Editar
                prop.context.beginPath();
                prop.context.moveTo(dimEditar.xIni, dimEditar.yIni);
                prop.context.lineTo(dimEditar.xIni + dimEditar.wIni, dimEditar.yIni);
                prop.context.lineTo(dimEditar.xIni + dimEditar.wIni, dimEditar.yIni + dimEditar.hIni);
                prop.context.lineTo(dimEditar.xIni, dimEditar.yIni + dimEditar.hIni);
                prop.context.lineTo(dimEditar.xIni, dimEditar.yIni);
                prop.context.closePath()
                prop.context.stroke();
                prop.context.fill();

                prop.context.shadowBlur = 0;
                prop.context.shadowOffsetX = 0;
                prop.context.shadowOffsetY = 0;

                var imgEditar = new Image();
                imgEditar.src = '../../IMAGES/IMAGES_PROJETO/img_btn_editarGrid.gif';
                prop.context.drawImage(imgEditar, dimEditar.xIni, dimEditar.yIni);

                prop.context.strokeStyle = "#000";
                prop.context.fillStyle = "#FFF";
                prop.context.shadowColor = '#666';
                prop.context.shadowBlur = 1;
                prop.context.shadowOffsetX = 1;
                prop.context.shadowOffsetY = 1;

                // Rect Excluir
                prop.context.beginPath();
                prop.context.moveTo(dimExcluir.xIni, dimExcluir.yIni);
                prop.context.lineTo(dimExcluir.xIni + dimExcluir.wIni, dimExcluir.yIni);
                prop.context.lineTo(dimExcluir.xIni + dimExcluir.wIni, dimExcluir.yIni + dimExcluir.hIni);
                prop.context.lineTo(dimExcluir.xIni, dimExcluir.yIni + dimExcluir.hIni);
                prop.context.lineTo(dimExcluir.xIni, dimExcluir.yIni);
                prop.context.closePath()
                prop.context.stroke();
                prop.context.fill();

                var imgExcluir = new Image();
                imgExcluir.src = '../../IMAGES/IMAGES_PROJETO/img_btn_excluirGrid.gif';
                prop.context.drawImage(imgExcluir, dimExcluir.xIni, dimExcluir.yIni);

            }
        };

        var EscreverTexto = function (prop) {

            prop.context.fillStyle = prop.texto.CorFonte();
            if (prop.texto.isCC) {
                prop.context.fillStyle = "#FFF";
            }
            prop.context.textAlign = "left";
            prop.context.font = 'bold ' + prop.texto.TamanhoFonte() + ' ' + prop.texto.NomeFonte();
            prop.context.shadowColor = '#FFF';
            prop.context.shadowBlur = 0;
            prop.context.shadowOffsetX = 0;
            prop.context.shadowOffsetY = 0;

            // Escrever o Texto
            prop.context.font = 'bold ' + prop.texto.TamanhoFonte() + ' ' + prop.texto.NomeFonte();
            prop.context.fillText(_aux.Mid(prop.texto.Texto, 1, 40), prop.ponto.X + (prop.dimensao.W * 0.04), prop.ponto.Y + (prop.dimensao.H * 0.2));

            prop.context.font = (prop.texto.Negrito() ? 'bold ' : ' ') + prop.texto.TamanhoFonte() + ' ' + prop.texto.NomeFonte();
            prop.context.fillStyle = prop.texto.CorFonte();

            // Escrever a Data de Inicio
            prop.context.fillText(prop.texto.DtIni, prop.ponto.X + (prop.dimensao.W * 0.04), prop.ponto.Y + (prop.dimensao.H * 0.55));

            // Escrever a Data de Fim 
            prop.context.fillText(prop.texto.DtFim, prop.ponto.X + (prop.dimensao.W / 2) + (prop.dimensao.W * 0.04), prop.ponto.Y + (prop.dimensao.H * 0.55));

            // Escrever o Responsável 
            prop.context.fillText(_aux.Mid(prop.texto.Resp, 1, 40), prop.ponto.X + (prop.dimensao.W * 0.04), prop.ponto.Y + (prop.dimensao.H * 0.90));
        };
        var EscreverTextoGenerico = function (context, ponto, texto, p_aling) {

            context.fillStyle = texto.CorFonte();
            context.font = (texto.Italico() ? 'italic ' : ' ') + (texto.Negrito() ? 'bold ' : ' ') + texto.TamanhoFonte() + ' ' + texto.NomeFonte();
            context.shadowColor = '#FFF';
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            if (p_aling)
                context.textAlign = p_aling;
            else
                context.textAlign = "left";
            context.shadowOffsetY = 0;

            // Escrever o Texto
            context.fillText(texto.Texto, ponto.X, ponto.Y);
        };

        var DefinirZoom = function () {

            var zoom = parseInt(info.scale * 100) + '%';

            $('li.zoom').text(zoom);
        };

        var AdicionarListenerMovimentacao = function (p_obj) {

            var Me = p_obj;
            var mouseDown = false;
            var isElemento = false;
            var elemento;
            var posOrigem = { diffX: 0, diffY: 0 };

            Me.Canvas.removeEventListener('mousedown', mousedownFc, false);
            mousedownFc = function (evt) {
                mouseDown = true;
                $(document.body).css('cursor', 'move');

                contexto = {
                    isContexto: false,
                    isElemento: false,
                    ponto: { x: 0, y: 0 },
                    pontoHover: { x: 0, y: 0 },
                    el : null
                };

                // Identificar se essa posição é do canvas ou desenho
                if (info.isPodeMovimentar) {
                    var pos = new Pos(Me, evt);
                    pos.x = pos.x / info.scale;
                    pos.y = pos.y / info.scale;

                    for (var i = 0; i < dados.length; i++) {
                        var el = dados[i];
                        el.isSelecionado = false;

                        if (el && el.ponto && el.dimensao) {
                            if ((pos.x >= el.ponto.x && pos.x <= (el.ponto.x + el.dimensao.w)) &&
                                (pos.y >= el.ponto.y && pos.y <= (el.ponto.y + el.dimensao.h))) {
                                el.isSelecionado = isElemento = true;
                                elemento = el;
                            }
                        }
                    }
                }
                if (isElemento) {

                    evt = TrataEvento(evt);
                    posOrigem = {
                        diffX: ((evt.clientX / info.scale) - translatePos.x) - elemento.ponto.x,
                        diffY: ((evt.clientY / info.scale) - translatePos.y) - elemento.ponto.y
                    };

                } else {
                    evt = TrataEvento(evt);
                    startDragOffset.x = evt.clientX - translatePos.x;
                    startDragOffset.y = evt.clientY - translatePos.y;
                }
                Me.Desenhar();
            }
            Me.Canvas.addEventListener('mousedown', mousedownFc, false);

            window.removeEventListener('mousemove', mousemoveFc, false);
            mousemoveFc = function (evt) {
                if (mouseDown) {
                    if (isElemento) {
                        elemento.ponto.x = ((evt.clientX / info.scale) - translatePos.x) - posOrigem.diffX;
                        elemento.ponto.y = ((evt.clientY / info.scale) - translatePos.y) - posOrigem.diffY;
                        elemento.ponto.isJaMovimentado = true;
                    } else {
                        translatePos.x = evt.clientX - startDragOffset.x;
                        translatePos.y = evt.clientY - startDragOffset.y;
                        $(document.body).addClass('semSelecao');
                    }
                    Me.Desenhar();
                } else {
                    if (contexto.isContexto) {
                        var p = new Pos(Me, evt);
                        if (p.x >= contexto.ponto.x && p.x <= contexto.ponto.x + contexto.dimensao.w &&
                            p.y >= contexto.ponto.y && p.y <= contexto.ponto.y + contexto.dimensao.h) {
                            contexto.pontoHover = { x: p.x, y: p.y };
                            Me.Desenhar();
                        }
                    }
                }
            }
            window.addEventListener('mousemove', mousemoveFc, false);

            window.removeEventListener('mouseup', mouseupFc, false);

            var mouseupFc = function () {

                if (isElemento) {

                    var idEntregavel = elemento.id;
                    var px = parseInt(elemento.ponto.x);
                    var py = parseInt(elemento.ponto.y);
                    if (elemento.isInicio || elemento.isFim) {
                        if (elemento.isInicio) {
                            $.ajax({
                                url: "../UI_EXP/hand_ATUALIZA_XY.ashx?tipo=INICIO&idCenario=" + info.id + "&x=" + px + "&y=" + py
                            });
                        } else {
                            $.ajax({
                                url: "../UI_EXP/hand_ATUALIZA_XY.ashx?tipo=FIM&idCenario=" + info.id + "&x=" + px + "&y=" + py
                            });
                        }
                    } else {
                        $.ajax({
                            url: "../UI_EXP/hand_ATUALIZA_XY.ashx?tipo=ENTREGAVEL&idEntregavel=" + idEntregavel + "&x=" + px + "&y=" + py
                        });
                    }

                }

                mouseDown = false;
                isElemento = false;
                elemento = null;

                $(document.body).css('cursor', 'default');
                $(document.body).removeClass('semSelecao');
                Me.Salvar();

            }
            window.addEventListener('mouseup', mouseupFc, false);
        };

        function AdicionarListenerContexto(p_obj) {
            var Me = p_obj;

            Me.Canvas.removeEventListener('contextmenu', contextmenuFc, false);
            contextmenuFc = function (evt) {
                var e = evt || event;

                var pos = new Pos(Me, evt);
                pos.x = pos.x / info.scale;
                pos.y = pos.y / info.scale;

                var isElemento = false;
                var isInicio = false;
                var isFim = false;

                var elementoSelecionado = null;
                for (var i = 0; i < dados.length; i++) {
                    var el = dados[i];
                    el.isSelecionado = false;

                    if (el && el.ponto && el.dimensao && info.isPodeMovimentar) {
                        if ((pos.x >= el.ponto.x && pos.x <= (el.ponto.x + el.dimensao.w)) &&
                            (pos.y >= el.ponto.y && pos.y <= (el.ponto.y + el.dimensao.h))) {
                            el.isSelecionado = true;
                            isElemento = true;
                            elementoSelecionado = el;
                            break;
                        }
                    }
                }
                if (info.isPodeMovimentar) {
                    contexto = {
                        isContexto: true,
                        isElemento: isElemento,
                        ponto: { x: pos.x, y: pos.y },
                        pontoHover: { x: pos.x, y: pos.y },
                        el : elementoSelecionado
                    };
                }
                Me.Desenhar();
                e.preventDefault();
                return false;
            }
            Me.Canvas.addEventListener('contextmenu', contextmenuFc, false);
        };

        var AdicionarListenerZoom = function (p_obj) {

            var Me = p_obj;
            Me.Canvas.removeEventListener('mousewheel', handleScroll, false);
            Me.Canvas.removeEventListener('DOMMouseScroll', handleScroll, false);
            handleScroll = function (evt) {
                if (info.isPodeMovimentar) {
                    var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
                    if (delta) {

                        deltaAtual += delta;
                        if (delta > 0) {
                            info.scale /= scaleMultiplier;
                        } else {
                            info.scale *= scaleMultiplier;
                        }
                        Me.Salvar();
                        Me.Desenhar();
                        return evt.preventDefault() && false;
                    }

                }
            };

            Me.Canvas.addEventListener('DOMMouseScroll', handleScroll, false);
            Me.Canvas.addEventListener('mousewheel', handleScroll, false);
        };

        var Aux = function () {
            this.DiferencaDias = function (dataIni, dataFim) {

                var dt1 = new TratamentoData().ParseDate(dataIni);
                var dt2 = new TratamentoData().ParseDate(dataFim);

                return new TratamentoData().DateDiff(dt1, dt2);
            };

            this.DefinirPosicionamentoRetangulo = function (el) {

                var meioGrade = (dimRect.hGrade / 2);
                var elNivel = _niveis.filter(function (x) { return x.n == el.nivel; })[0];

                var meioNivel = 0;
                var diffMeio = 0;

                if (elNivel.qtde % 2 == 0) {

                    meioNivel = parseInt(elNivel.qtde / 2);
                    diffMeio = (meioNivel - el.posicao) + 0.5;

                } else {
                    meioNivel = parseInt(elNivel.qtde / 2) + 1;
                    diffMeio = meioNivel - el.posicao;
                }

                el.ponto.y = meioGrade - (diffMeio * (dimRect.hRect + dimRect.diffHRect) + (dimRect.hRect / 2));



                return new CCPonto(el.ponto.x, el.ponto.y);
            };

            this.BuscarArray = function (array, callBack) {
                return array.filter(callBack);
            };
            this.BuscarArrayParams = function (array, params) {
                return array.filter(function (obj) {
                    return Object.keys(params).every(function (c) {
                        return obj[c] == params[c];
                    });
                });
            };

            this.BuscarPrimeiro = function (el) {
                return el.isInicio;
            };
            this.BuscarItemId = function (el, id) {
                if (el.id == id) { return true; } else { return false; }
            };
            this.Mid = function (str, ini, fim) {
                if (str.length > fim) {
                    return str.substring(ini - 1, fim) + '...';
                } else {
                    return str;
                }
            }
        };
        var TratamentoData = function () {
            this.ParseDate = function (strData) {
                var dt;
                try {
                    var mdy = strData.split('/');
                    dt = new Date(mdy[2], mdy[1] - 1, mdy[0]);
                } catch (ex) { }
                return dt;
            };
            this.DateDiff = function (first, second) {
                return Math.round((second - first) / (1000 * 60 * 60 * 24));
            };
        };
        var TrataEvento = function (e) {

            if (e.touches) {
                e.clientX = e.touches[0].pageX;
                e.clientY = e.touches[0].pageY;
            }

            return {
                clientX: e.clientX,
                clientY: e.clientY,
                evt: e
            };
        };
        var Pos = function (p_obj, e) {
            var Me = p_obj;

            e = TrataEvento(e);

            var rectNav = Me.Canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rectNav.left)    - translatePos.x,
                y: (e.clientY - rectNav.top) - translatePos.y
            };
        };

        this.CCritico = CC;
    };

}).call(this);
 
