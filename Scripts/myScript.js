var graph,
	zoom = 100,
	editor,
	numeFisier = 'Nou',
	container,
	conectori = 1,
	toolbar,
	idCurent,
	idFisier = 0,
	folderFisier,
	isGraficEditorVisible = 1,
	stilCopiat;
var date = {};
var undoManager = new mxUndoManager(200);
var slider;

/* Variabile importante
 * graph, editor - variabile
 * conectori - 1 pt conectori statici, 0 pt conectori dinamici
 * date - obiect care stocheaza valorile din vizualizare posturi si ocupanti
 */

var marimiPagini = {
	A2: {
		w: '420mm',
		h: '594mm'
	},
	A3: {
		w: '297mm',
		h: '420mm'
	},
	A4: {
		w: '210mm',
		h: '297mm'
	},
	A5: {
		w: '148mm',
		h: '210mm'
	},
	LETTER: {
		w: '216mm',
		h: '279mm'
	}
};
var pagina = {
	marime: 'A4',
	mod: 'landscape'
};
$.fn.centrareOriz = function() {
	this.css('left', $(window).width() / 2 - $(this).width() / 2);
};
$.fn.centrareVert = function() {
	this.css('top', $(window).height() / 2 - $(this).height() / 2);
};

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function() {};

function alertModalEroare(textEroare) {
	//var audio = new Audio('Audio/eroare.mp3');
	//audio.play();
	$('#pEroare').text(textEroare);
	$('#modalEroare').stop(true, true).fadeIn();
	$('#modalEroare').stop(true, true).fadeOut(7500);
}
function alertModalSucces(textSucces) {
	//var audio = new Audio('Audio/succes.mp3');
	//audio.play();
	$('#pSucces').text(textSucces);
	$('#modalSucces').stop(true, true).fadeIn();
	$('#modalSucces').stop(true, true).fadeOut(7500);
}

function grupareDraggable() {
	$('.grupare:last').draggable({
		containment: 'window',
		helper: 'clone',
		handle: $('.post:last'),
		start: function(event, ui) {
			$(this).attr('id', 'inAer');
			$(this).parents('.windowPosturi').trigger('click');
			$(ui.helper).css('min-width', $(this).width() + 'px');
		},
		stop: function(event, ui) {
			$(this).removeAttr('id');
		}
	});
}
function getCellAtId(id) {
	return graph.getModel().cells[id];
}
function grupareDraggableSubmit() {
	$(postCurent).parents('.windowPosturi').find('.grupare:last').draggable({
		containment: 'window',
		helper: 'clone',
		handle: $(postCurent).parents('.windowPosturi').find('.post:last'),
		start: function(event, ui) {
			$(this).attr('id', 'inAer');
			$(this).parents('.windowPosturi').trigger('click');
			$(ui.helper).css('min-width', $(this).width() + 'px');
		},
		stop: function(event, ui) {
			$(this).removeAttr('id');
		}
	});
}
function GetFormattedDate(jsonDateString) {
	var d = new Date(parseInt(jsonDateString.replace('/Date(', '')));
	return d.toLocaleString();
}

Array.prototype.remove = function() {
	var what,
		a = arguments,
		L = a.length,
		ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this;
};
String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

function ObjectLength_Modern(object) {
	return Object.keys(object).length;
}

function ObjectLength_Legacy(object) {
	var length = 0;
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			++length;
		}
	}
	return length;
}

var ObjectLength = Object.keys ? ObjectLength_Modern : ObjectLength_Legacy;

function fileBrowserUpdate() {
	$('#rezultateServer').empty();
	$('#rezultateServer').append(
		'<i class="fa fa-spinner fa-pulse fa-3x fa-fw" id="dummySpinner" style="font-size:28px;margin-left:45%"></i>'
	);
	$.ajax({
		type: 'GET',
		url: '/OrganigramaGrafica/Home/getFiles',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		error: function() {
			$('#rezultateServer').empty();
			$('#rezultateServer').append('<p>Nu s-a putut realiza conexiunea la baza de date</p>');
		},
		success: function(data) {
			var valori = JSON.parse(data);
			for (i = 0; i < valori.length; i++) {
				if (valori[i].Folder) {
					var a = valori[i].Folder;
					valori[i].Folder = valori[i].Folder.replaceAll(' ', '_');
					if (!$('#' + valori[i].Folder + 'Folder')[0]) {
						$('#rezultateServer').prepend(
							'<div class="browsef folderF" id="' +
								valori[i].Folder +
								'Folder"><div class="browsef folder"><i style="padding:0 5px 0 5px;color:rgb(210,192,116);" class="fa fa-folder" aria-hidden="true"></i>' +
								a +
								'</div></div>'
						);
					}
					$('#' + valori[i].Folder + 'Folder').append(
						'<div class="browsef fisier" data-id="' +
							valori[i].Id +
							'" data-folder="' +
							a +
							'" style="display:none"><i style="padding:0 5px 0 5px" class="fa fa-file-o" aria-hidden="true"></i>' +
							valori[i].NumeFisier +
							'<span style="float:right;color:#777">' +
							GetFormattedDate(valori[i].UltimaModificare) +
							'</span></div>'
					);
				} else
					$('#rezultateServer').append(
						'<div class="browsef fisier" data-id="' +
							valori[i].Id +
							'" data-folder=""><i style="padding:0 5px 0 5px" class="fa fa-file-o" aria-hidden="true"></i>' +
							valori[i].NumeFisier +
							'<span style="float:right;color:#777">' +
							GetFormattedDate(valori[i].UltimaModificare) +
							'</span></div>'
					);
			}
			$('#rezultateServer').prepend(
				'<div class="root" style="display:none"><div class="browsef folder"><i style="padding:0 5px 0 5px;color:rgb(210,192,116);" class="fa fa-folder" aria-hidden="true"></i>...</div></div>'
			);
			$('.browsef').click(function(e) {
				e.stopPropagation();
				$('.selectat').removeClass('selectat');
				$(this).addClass('selectat');
				if ($(this).hasClass('fisier'))
					$('#serverNumeFisier').val($(this).html().split('</i>')[1].split('<span')[0]);
			});
			$('.folderF').dblclick(function(e) {
				e.preventDefault();
				var that = this;
				$('#rezultateServer').find('.browsef').each(function() {
					if (that != this) $(this).css('display', 'none');
				});
				$(this).find('.fisier').each(function() {
					$(this).css('display', 'block');
				});
				$('.selectat').removeClass('selectat');
				$('.root').css('display', 'block');
				$('.root').find('.browsef').css('display', 'block');
				$('#serverNumeFolder').val($(this).html().split('</i>')[1].split('</div>')[0]);
				$('.selectat').removeClass('selectat');
			});
			$('.root').dblclick(function(e) {
				e.preventDefault();
				$('.browsef').css('display', 'none');
				$('#rezultateServer').children('.browsef').each(function() {
					$(this).css('display', 'block');
				});
				$('#rezultateServer').children('.folderF').each(function() {
					$(this).children('.folder').css('display', 'block');
				});
				$('.root').css('display', 'none');
				$('#serverNumeFolder').val('');
			});
			$('#dummySpinner').remove();
		}
	});
}

var postCurent;

function modalTab($element) {
	var inputs = $element.find('select, input, textarea, button, a').filter(function() {
		return !$(this).hasClass('close');
	});
	var firstInput = inputs.first();
	var lastInput = inputs.last();

	/*set focus on first input*/
	firstInput.focus();

	/*redirect last tab to first input*/
	lastInput.off('keydown').on('keydown', function(e) {
		if (e.which === 9 && !e.shiftKey) {
			e.preventDefault();
			firstInput.focus();
		}
	});

	/*redirect first shift+tab to last input*/
	firstInput.off('keydown').on('keydown', function(e) {
		if (e.which === 9 && e.shiftKey) {
			e.preventDefault();
			lastInput.focus();
		}
	});
}

function setNumeFisier(text) {
	numeFisier = text;
	//$('#numeFisierDiv').html(numeFisier + '<br>' + folderFisier);
	$('#numeFisierDiv').text(numeFisier);
	$('#numeFolderDiv').text(folderFisier);
}
function pozitivSauZero(numar) {
	if (numar < 0) return 0;
	return numar;
}
function salveazaModificariPosturi() {
	var idCurent = $(postCurent).parents('.windowPosturi')[0].id.replace('windowPost', '');
	var lungime = 0;
	date[idCurent] = {};
	$(postCurent).parents('.windowPosturi').find('.grupare').each(function() {
		var arr = [];
		$(this).find('.angajatNume').each(function() {
			arr.push($(this).text());
		});
		date[idCurent][$(this).find('.postNume').text()] = arr;
		lungime++;
	});
	debugger;
	if (!getCellAtId(idCurent).getChildCount()) {
		graph.insertVertex(
			getCellAtId(idCurent),
			null,
			lungime + ' / ' + lungime,
			0.8,
			0.85,
			0,
			0,
			'align=left;',
			true
		).connectable = false;
	} else {
		if (lungime) getCellAtId(idCurent).children[0].value = lungime + ' / ' + lungime;
		else getCellAtId(idCurent).children[0].value = '';
		graph.refresh();
	}
}
function stergeAngajat(that) {
	postCurent = $(that).parents('.windowBody')[0];
	$(that).parents('.angajat').hide('slow', function() {
		$(that).parents('.angajat').remove();
		salveazaModificariPosturi();
	});
}
function stergePost(that) {
	postCurent = $(that).parents('.windowBody')[0];
	$(that).parents('.post').parent().hide('slow', function() {
		$(that).parents('.post').parent().remove();
		salveazaModificariPosturi();
	});
}
function angajatNou(that) {
	postCurent = that;
	$('#numeEOGAngajat').text($(postCurent).parents('.windowPosturi').find('.textNav').text());
	$('#numePostAngajat').text($(postCurent).parent().find('.postNume').text());
	$('#numeAngajat').val('');
	$('#dateAngajat').val('');
	$('#aa').css('display', 'block');
	$('#ma').css('display', 'none');
	$('#submitAngajat').css('display', 'inline-block');
	$('#submitModificaAngajat').css('display', 'none');
	$('#modalAngajatNou').fadeIn();
	setTimeout(function() {
		$('#numeAngajat').focus();
	}, 1);
	modalTab($('#modalAngajatNou'));
}
function modificaAngajat(that) {
	postCurent = that;
	$('#numeAngajat').val($(postCurent).parents('.angajat').find('.angajatNume').text());
	$('#numeModificaPostAngajat').text($(postCurent).parents('.angajat').find('.angajatNume').text());
	$('#aa').css('display', 'none');
	$('#ma').css('display', 'block');
	$('#submitAngajat').css('display', 'none');
	$('#submitModificaAngajat').css('display', 'inline-block');
	$('#modalAngajatNou').fadeIn();
	setTimeout(function() {
		$('#numeAngajat').focus();
	}, 1);
	modalTab($('#modalAngajatNou'));
}
function postNou(that) {
	postCurent = that;
	$('#numeEOG').text($(postCurent).parents('.windowPosturi').find('.textNav').text());
	$('#numePost').val('');
	$('#atributePost').val('');
	$('#ap').css('display', 'block');
	$('#mp').css('display', 'none');
	$('#submitPost').css('display', 'inline-block');
	$('#submitModificaPost').css('display', 'none');
	$('#modalPostNou').fadeIn();
	setTimeout(function() {
		$('#numePost').focus();
	}, 1);
	modalTab($('#modalPostNou'));
}
function modificaPost(that) {
	postCurent = that;
	$('#numeEOGP').text($(postCurent).parents('.post').find('.postNume').text());
	$('#numePost').val($(postCurent).parents('.post').find('.postNume').text());
	$('#submitPost').css('display', 'none');
	$('#ap').css('display', 'none');
	$('#mp').css('display', 'block');
	$('#submitModificaPost').css('display', 'inline-block');
	$('#modalPostNou').fadeIn();
	setTimeout(function() {
		$('#numePost').focus();
	}, 1);
	modalTab($('#modalPostNou'));
}
function salvModificari(that) {
	var exista = 0;
	$(that).parents('.windowPosturi').find('.postNume').each(function(index) {
		var val = $(this).text();
		$(that).parents('.windowPosturi').find('.postNume').each(function(index2) {
			if (val == $(this).text() && index != index2) {
				alertModalEroare('Nu pot sa existe 2 posturi cu acelasi nume.');
				exista = 1;
				return false;
			}
		});
		if (exista == 1) return false;
	});
	if (exista == 1) return false;
	var idCurent = $(that).parents('.windowPosturi')[0].id.replace('windowPost', '');
	date[idCurent] = {};
	$(that).parents('.windowPosturi').find('.grupare').each(function() {
		var arr = [];
		$(this).find('.angajatNume').each(function() {
			arr.push($(this).text());
		});
		date[idCurent][$(this).find('.postNume').text()] = arr;
	});
	alertModalSucces('Modificarile au fost efectuate!');
}
function windowPosturiClose(that) {
	$(that).parents('.windowPosturi').remove();
}

function windowPosturiMaximize(that) {
	var windowPosturiCurent = $(that).parents('.windowPosturi');

	if ($(that).children().hasClass('fa-window-maximize')) {
		windowPosturiCurent.css('top', '0');
		windowPosturiCurent.css('left', '0');
		windowPosturiCurent.css('width', '100%');
		windowPosturiCurent.css('height', '100%');
		windowPosturiCurent
			.find('.windowDinamic')
			.css(
				'max-height',
				windowPosturiCurent.height() - 30 - windowPosturiCurent.find('.windowStatic').height() - 15 + 'px'
			);
		$(that).children().removeClass('fa-window-maximize').addClass('fa-window-restore');
	} else {
		windowPosturiCurent.css('width', '400px');
		windowPosturiCurent.css('height', '300px');
		windowPosturiCurent.centrareVert();
		windowPosturiCurent.centrareOriz();
		windowPosturiCurent
			.find('.windowDinamic')
			.css(
				'max-height',
				windowPosturiCurent.height() - 30 - windowPosturiCurent.find('.windowStatic').height() - 15 + 'px'
			);
		$(that).children().removeClass('fa-window-restore').addClass('fa-window-maximize');
	}
}
function windowPosturiMinimize(that) {
	var windowPosturiCurent = $(that).parents('.windowPosturi');

	if (windowPosturiCurent.css('height') == '30px') {
		windowPosturiCurent.css('width', '400px');
		windowPosturiCurent.css('height', '300px');
		windowPosturiCurent.centrareVert();
		windowPosturiCurent.centrareOriz();
	} else {
		windowPosturiCurent.css('top', $(window).height() - 30 + 'px');
		windowPosturiCurent.css('left', '0');
		windowPosturiCurent.css('width', '100px');
		windowPosturiCurent.css('height', '30px');
	}
}

function addToolbarItem(graph, toolbar, prototype, image, text) {
	//functie care adauga butoane in meniul din stanga
	if (prototype)
		var funct = function(graph, evt, cell) {
			graph.stopEditing(false);
			var pt = graph.getPointForEvent(evt);
			var x = prototype.style;
			prototype.style +=
				'fontFamily=' +
				$('#selectFont').val() +
				';fontSize=' +
				($('#inputFontSize').val() != '' ? $('#inputFontSize').val() : 12) +
				';';
			var vertex = graph.getModel().cloneCell(prototype);
			prototype.style = x;
			vertex.geometry.x = pt.x;
			vertex.geometry.y = pt.y;
			if (conectori == 1) vertex.connectable = false;
			//else vertex.connectable = true;
			if (text) vertex.value = 'Dublu click pentru \n a edita elementul';

			graph.setSelectionCells(graph.importCells([ vertex ], 0, 0, cell));
			$('#chart-container').trigger('click');
		};
	else {
		var funct = function(graph, evt, cell) {
			graph.stopEditing(false);
			var pt = graph.getPointForEvent(evt);
			var test = graph.insertEdge(null, null, null, null, null);
			var geo = new mxGeometry();
			geo.sourcePoint = pt;
			geo.targetPoint = new mxPoint(pt.x + 140, pt.y + 50);
			test.geometry = geo;
			if (text) test.style = 'endArrow=classic;startArrow=classic;';
			graph.refresh();
		};
	}
	//creeaza butonul
	var img = toolbar.addMode(null, image, funct);
	mxUtils.makeDraggable(img, graph, funct);
}

function detectIE() {
	var ua = window.navigator.userAgent;

	var msie = ua.indexOf('MSIE ');
	if (msie > 0) {
		// IE 10 sau mai vechi
		return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	}

	var trident = ua.indexOf('Trident/');
	if (trident > 0) {
		// IE 11
		var rv = ua.indexOf('rv:');
		return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	}

	var edge = ua.indexOf('Edge/');
	if (edge > 0) {
		// Edge
		return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
	}

	// alt browser
	return false;
}

if (typeof SVGElement === 'object' && !SVGElement.prototype.outerHTML) {
	Object.defineProperty(SVGElement.prototype, 'outerHTML', {
		get: function() {
			var $node, $temp;
			$temp = document.createElement('div');
			$node = this.cloneNode(true);
			$temp.appendChild($node);
			return $temp.innerHTML;
		},
		enumerable: false,
		configurable: true
	});
}

function loadFileOnline(id) {
	$.ajax({
		type: 'GET',
		url: '/OrganigramaGrafica/Home/getCodFisier',
		data: {
			id: id
		},
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
		error: function() {
			alertModalEroare('Baza de date nu este momentan disponibila');
		},
		success: function(data) {
			idFisier = id;
			folderFisier = '';
			if (!JSON.parse(data)[0]) {
				alertModalEroare('Fisierul nu a fost gasit in baza de date');
				return;
			}
			var valori = JSON.parse(data)[0].Fisier;
			var parsed = Papa.parse(window.atob(valori), { header: true });
			var continut = parsed.data[0];
			// continut.{obiecte} - numeFisier,marPagina,modPagina,contectori,continutFisier,obiectDate

			//marime pagina
			$('#pageBackground').css(
				'width',
				continut.modPagina == 'portrait'
					? marimiPagini[continut.marPagina].w
					: marimiPagini[continut.marPagina].h
			);
			$('#pageBackground').css(
				'height',
				continut.modPagina == 'portrait'
					? marimiPagini[continut.marPagina].h
					: marimiPagini[continut.marPagina].w
			);
			graph.scrollTileSize = new mxRectangle(0, 0, $('#pageBackground').height(), $('#pageBackground').width());
			mxConstants.PAGE_FORMAT_A4_PORTRAIT.height = $('#pageBackground').height();
			mxConstants.PAGE_FORMAT_A4_PORTRAIT.width = $('#pageBackground').width();
			graph.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
			graph.refresh();
			//-marime pagina

			//incarca date fisier in organigrama
			setNumeFisier(continut.numeFisier.replace('.ogg', ''));
			//document.title = numeFisier;
			pagina.marime = continut.marPagina;
			pagina.mod = continut.modPagina;
			conectori = continut.conectori;
			date = JSON.parse(continut.obiectDate);
			if (continut.defaultVertex) graph.stylesheet.styles.defaultVertex = JSON.parse(continut.defaultVertex);
			if (continut.defaultEdge) graph.stylesheet.styles.defaultEdge = JSON.parse(continut.defaultEdge);

			var doc = mxUtils.parseXml(continut.continutFisier);
			var node = doc.documentElement;
			editor.readGraphModel(node);
			//--

			//centreaza pagina in mijloc
			var width = $('#pageBackground').width();
			var widthContainer = $('#chart-container').find('svg:first').width();
			var widthContainer2 = $('#chart-container').width();
			var height = $('#pageBackground').height();
			var heightContainer = $('#chart-container').find('svg:first').height();
			$('#pageBackground').css('left', (widthContainer - width) / 2);
			$('#pageBackground').css('top', (heightContainer - height) / 2);
			graph.container.scrollTop = (heightContainer - height) / 2 - 40;
			graph.container.scrollLeft = (widthContainer - widthContainer2) / 2;
			//--

			$('.modal').css('display', 'none');
			$('#ecranBunVenit').fadeOut('slow');
		}
	});
}

/* Pentru debug:
 * 1. Inspect element butonul cu pricina
 * 2. Identificare ID element
 * 3. Cautare in sursa eventurile .click cu modelul jquery de element id $('#IDHTML') sau $("#IDHTML")
 */

//Functia jquery de apel la incarcarea DOM
$(function() {
	//MAIN ORGCHART
	editor = new mxEditor();

	if (!mxClient.isBrowserSupported()) {
		mxUtils.error('Browser is not supported!', 200, false);
	} else {
		container = $('#chart-container')[0];
		mxEvent.disableContextMenu(container);

		var model = new mxGraphModel();
		graph = new mxGraph(container, model);

		graph.autoScroll = false;
		graph.collapsedImage = new mxRectangle(0, 0, 9, 9);
		graph.expandedImage = new mxRectangle(0, 0, 9, 9);

		var rotationHandle = new mxImage(
			'data:image/png;base64,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',
			18,
			20
		);
		var mainHandle = new mxImage(
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAACXBIWXMAAAsTAAALEwEAmpwYAAABLUlEQVQ4y61US4rCQBBNeojiRrLSnbMOWWU3V1FPouARcgc9hyLOCSSbYZw5gRCIkM9KbevJaycS4zCOBY+iq6pf1y+xrNtiE6oEY/tVzMUXgSNoCJrUDu3qHpldutwSuIKOoEvt0m7I7DoCvNj2fb8XRdEojuN5lmVraJxhh59xFSLFF9phGL7lef6hRb63R73aHM8aAjv8JHJ47yqLlud5r0VRbHa51sPZQVuT/QU4ww4/4ljaJRubrC5SxouD6TWBQV/sEIkbs0eOIVGssSO1L5D6LQID+BHHZjdMSYpj7KZpun7/uk8CP5rNqTXLJP/OpNyTMWruP9CTP08nCILKdCp7gkCzJ8vPnz2BvW5PKhuLjJBykiQLaWIEjTP3o3Zjn/LtPO0rfvh/cgKu7z6wtPPltQAAAABJRU5ErkJggg==',
			17,
			17
		);

		graph.selectCells = function(vertices, edges, parent) {
			parent = parent || this.getDefaultParent();

			var filter = mxUtils.bind(this, function(cell) {
				return (
					this.view.getState(cell) != null &&
					((this.model.isVertex(cell) &&
						this.model.getParent(cell).id == '1' &&
						vertices &&
						!this.model.isEdge(this.model.getParent(cell))) ||
						(this.model.isEdge(cell) && edges))
				);
			});

			var cells = this.model.filterDescendants(filter, parent);
			this.setSelectionCells(cells);
		};

		var vertexHandlerCreateSizerShape = mxVertexHandler.prototype.createSizerShape;
		mxVertexHandler.prototype.createSizerShape = function(bounds, index, fillColor) {
			this.handleImage =
				index == mxEvent.ROTATION_HANDLE
					? rotationHandle
					: index == mxEvent.LABEL_HANDLE ? this.secondaryHandleImage : this.handleImage;

			return vertexHandlerCreateSizerShape.apply(this, arguments);
		};

		mxVertexHandler.prototype.rotationCursor = 'pointer';

		mxVertexHandler.prototype.rotateCell = function(cell, angle, parent) {
			if (angle != 0) {
				var model = this.graph.getModel();

				if (model.isVertex(cell) || model.isEdge(cell)) {
					if (!model.isEdge(cell)) {
						var state = this.graph.view.getState(cell);
						var style = state != null ? state.style : this.graph.getCellStyle(cell);

						if (style != null) {
							var total = (style[mxConstants.STYLE_ROTATION] || 0) + angle;
							this.graph.setCellStyles(mxConstants.STYLE_ROTATION, total, [ cell ]);
						}
					}

					var geo = this.graph.getCellGeometry(cell);

					if (geo != null) {
						var pgeo = this.graph.getCellGeometry(parent);

						if (pgeo != null && !model.isEdge(parent)) {
							geo = geo.clone();
							geo.rotate(angle, new mxPoint(pgeo.width / 2, pgeo.height / 2));
							model.setGeometry(cell, geo);
						}

						if ((model.isVertex(cell) && !geo.relative) || model.isEdge(cell)) {
							// Recursive rotation
							var childCount = model.getChildCount(cell);

							for (var i = 0; i < childCount; i++) {
								this.rotateCell(model.getChildAt(cell, i), angle, cell);
							}
						}
					}
				}
				console.log(angle);
			}
		};

		//mxEdgeHandler.prototype.parentHighlightEnabled = true;
		//mxEdgeHandler.prototype.dblClickRemoveEnabled = true;
		//mxEdgeHandler.prototype.straightRemoveEnabled = true;
		//mxEdgeHandler.prototype.virtualBendsEnabled = true;
		//mxEdgeHandler.prototype.mergeRemoveEnabled = true;
		//mxEdgeHandler.prototype.manageLabelHandle = true;
		//mxEdgeHandler.prototype.outlineConnect = true;

		mxVertexHandler.prototype.handleImage = mainHandle;
		//mxEdgeHandler.prototype.handleImage = mainHandle;
		mxOutline.prototype.sizerImage = mainHandle;

		graph.dropEnabled = true;

		mxConnectionHandler.prototype.movePreviewAway = false;
		mxConnectionHandler.prototype.waypointsEnabled = true;
		mxGraph.prototype.resetEdgesOnConnect = false;
		mxConstants.SHADOWCOLOR = '#C0C0C0';

		mxConstants.HANDLE_FILLCOLOR = '#99ccff';
		mxConstants.HANDLE_STROKECOLOR = '#0088cf';
		mxConstants.VERTEX_SELECTION_COLOR = '#00a8ff';
		mxConstants.OUTLINE_COLOR = '#00a8ff';
		mxConstants.OUTLINE_HANDLE_FILLCOLOR = '#99ccff';
		mxConstants.OUTLINE_HANDLE_STROKECOLOR = '#00a8ff';
		mxConstants.CONNECT_HANDLE_FILLCOLOR = '#cee7ff';
		mxConstants.EDGE_SELECTION_COLOR = '#00a8ff';
		mxConstants.DEFAULT_VALID_COLOR = '#00a8ff';
		mxConstants.LABEL_HANDLE_FILLCOLOR = '#cee7ff';
		mxConstants.GUIDE_COLOR = '#0088cf';
		mxConstants.HIGHLIGHT_OPACITY = 30;
		mxConstants.HIGHLIGHT_SIZE = 8;
		mxConstants.SHADOW_OPACITY = 0.25;
		mxConstants.SHADOWCOLOR = '#000000';
		mxConstants.VML_SHADOWCOLOR = '#d0d0d0';
		mxConstants.PAGE_FORMAT_A4_PORTRAIT.height = $('#pageBackground').height();
		mxConstants.PAGE_FORMAT_A4_PORTRAIT.width = $('#pageBackground').width();

		$('#pageBackground').css('display', 'none');
		graph.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
		graph.pageScale = 1;
		graph.pageBreaksVisible = true;
		graph.pageBreakDashed = true;
		graph.pageVisible = true;
		//graph.preferPageSize = true;
		graph.centerZoom = true;
		// Takes zoom into account for moving cells
		graph.graphHandler.scaleGrid = true;
		graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';
		graph.zoomFactor = 1.25;

		//Paging
		graph.scrollTileSize = new mxRectangle(0, 0, $('#pageBackground').height(), $('#pageBackground').width());

		/**
         * Returns the padding for pages in page view with scrollbars.
         */
		graph.getPagePadding = function() {
			return new mxPoint(
				Math.max(0, Math.round(graph.container.offsetWidth - 34)),
				Math.max(0, Math.round(graph.container.offsetHeight - 34))
			);
		};

		/**
         * Returns the size of the page format scaled with the page size.
         */
		graph.getPageSize = function() {
			return this.pageVisible
				? new mxRectangle(0, 0, this.pageFormat.width * this.pageScale, this.pageFormat.height * this.pageScale)
				: this.scrollTileSize;
		};
		/**
         * Returns a rectangle describing the position and count of the
         * background pages, where x and y are the position of the top,
         * left page and width and height are the vertical and horizontal
         * page count.
         */
		graph.getPageLayout = function() {
			var size = this.pageVisible ? this.getPageSize() : this.scrollTileSize;
			var bounds = this.getGraphBounds();

			if (bounds.width == 0 || bounds.height == 0) {
				return new mxRectangle(0, 0, 1, 1);
			} else {
				// Computes untransformed graph bounds
				var x = Math.ceil(bounds.x / this.view.scale - this.view.translate.x);
				var y = Math.ceil(bounds.y / this.view.scale - this.view.translate.y);
				var w = Math.floor(bounds.width / this.view.scale);
				var h = Math.floor(bounds.height / this.view.scale);

				var x0 = Math.floor(x / size.width);
				var y0 = Math.floor(y / size.height);
				var w0 = Math.ceil((x + w) / size.width) - x0;
				var h0 = Math.ceil((y + h) / size.height) - y0;

				return new mxRectangle(x0, y0, w0, h0);
			}
		};

		// Fits the number of background pages to the graph
		graph.view.getBackgroundPageBounds = function() {
			var layout = this.graph.getPageLayout();
			var page = this.graph.getPageSize();
			return new mxRectangle(
				this.scale * (this.translate.x + layout.x * page.width),
				this.scale * (this.translate.y + layout.y * page.height),
				this.scale * layout.width * page.width,
				this.scale * layout.height * page.height
			);
		};

		graph.getPreferredPageSize = function(bounds, width, height) {
			var pages = this.getPageLayout();
			var size = this.getPageSize();

			return new mxRectangle(0, 0, pages.width * size.width, pages.height * size.height);
		};

		/**
         * Guesses autoTranslate to avoid another repaint (see below).
         * Works if only the scale of the graph changes or if pages
         * are visible and the visible pages do not change.
         */
		var graphViewValidate = graph.view.validate;
		graph.view.validate = function() {
			if (this.graph.container != null && mxUtils.hasScrollbars(this.graph.container)) {
				var pad = this.graph.getPagePadding();
				var size = this.graph.getPageSize();

				// Updating scrollbars here causes flickering in quirks and is not needed
				// if zoom method is always used to set the current scale on the graph.
				var tx = this.translate.x;
				var ty = this.translate.y;
				this.translate.x = pad.x / this.scale - (this.x0 || 0) * size.width;
				this.translate.y = pad.y / this.scale - (this.y0 || 0) * size.height;
			}

			graphViewValidate.apply(this, arguments);
		};

		var graphSizeDidChange = graph.sizeDidChange;
		graph.sizeDidChange = function() {
			if (this.container != null && mxUtils.hasScrollbars(this.container)) {
				var pages = this.getPageLayout();
				var pad = this.getPagePadding();
				var size = this.getPageSize();

				// Updates the minimum graph size
				var minw = Math.ceil(2 * pad.x / this.view.scale + pages.width * size.width);
				var minh = Math.ceil(2 * pad.y / this.view.scale + pages.height * size.height);

				var min = graph.minimumGraphSize;

				// LATER: Fix flicker of scrollbar size in IE quirks mode
				// after delayed call in window.resize event handler
				if (min == null || min.width != minw || min.height != minh) {
					graph.minimumGraphSize = new mxRectangle(0, 0, minw, minh);
				}

				// Updates auto-translate to include padding and graph size
				var dx = pad.x / this.view.scale - pages.x * size.width;
				var dy = pad.y / this.view.scale - pages.y * size.height;

				if (!this.autoTranslate && (this.view.translate.x != dx || this.view.translate.y != dy)) {
					this.autoTranslate = true;
					this.view.x0 = pages.x;
					this.view.y0 = pages.y;

					// NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
					// BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
					// SHOULD MOVE TRANSLATE/SCALE TO VIEW.
					var tx = graph.view.translate.x;
					var ty = graph.view.translate.y;

					graph.view.setTranslate(dx, dy);
					graph.container.scrollLeft += (dx - tx) * graph.view.scale;
					graph.container.scrollTop += (dy - ty) * graph.view.scale;

					this.autoTranslate = false;
					return;
				}

				var width = $('#pageBackground').width();
				var widthContainer = $('#chart-container').find('svg:first').width();
				var widthContainer2 = $('#chart-container').width();
				var height = $('#pageBackground').height();
				var heightContainer = $('#chart-container').find('svg:first').height();
				$('#pageBackground').css('left', (widthContainer - width) / 2);
				$('#pageBackground').css('top', (heightContainer - height) / 2);

				graphSizeDidChange.apply(this, arguments);
			}
		};
		//lul

		// Public helper method for shared clipboard.
		mxClipboard.cellsToString = function(cells) {
			var codec = new mxCodec();
			var model = new mxGraphModel();
			var parent = model.getChildAt(model.getRoot(), 0);

			debugger;

			for (var i = 0; i < cells.length; i++) {
				model.add(parent, cells[i]);
			}

			return mxUtils.getXml(codec.encode(model));
		};

		// Focused but invisible textarea during control or meta key events
		var textInput = document.createElement('textarea');
		mxUtils.setOpacity(textInput, 0);
		textInput.style.width = '1px';
		textInput.style.height = '1px';
		var restoreFocus = false;
		var gs = graph.gridSize;
		var lastPaste = null;
		var dx = 0;
		var dy = 0;

		// Workaround for no copy event in IE/FF if empty
		textInput.value = ' ';

		// Shows a textare when control/cmd is pressed to handle native clipboard actions
		mxEvent.addListener(document, 'keydown', function(evt) {
			// No dialog visible
			var source = mxEvent.getSource(evt);

			if (
				graph.isEnabled() &&
				!graph.isMouseDown &&
				!graph.isEditing() &&
				source.nodeName != 'INPUT' &&
				!document.activeElement.isContentEditable
			) {
				if (
					evt.keyCode == 224 /* FF */ ||
					(!mxClient.IS_MAC && evt.keyCode == 17) /* Control */ ||
					(mxClient.IS_MAC && evt.keyCode == 91) /* Meta */
				) {
					// Cannot use parentNode for check in IE
					if (!restoreFocus) {
						// Avoid autoscroll but allow handling of events
						textInput.style.position = 'absolute';
						textInput.style.left = graph.container.scrollLeft + 10 + 'px';
						textInput.style.top = graph.container.scrollTop + 10 + 'px';
						graph.container.appendChild(textInput);

						restoreFocus = true;
						textInput.focus();
						textInput.select();
					}
				}
			}
		});

		// Restores focus on graph container and removes text input from DOM
		mxEvent.addListener(document, 'keyup', function(evt) {
			if (
				restoreFocus &&
				(evt.keyCode == 224 /* FF */ || evt.keyCode == 17 /* Control */ || evt.keyCode == 91) /* Meta */
			) {
				restoreFocus = false;

				if (!graph.isEditing()) {
					graph.container.focus();
				}

				textInput.parentNode.removeChild(textInput);
			}
		});

		// Inserts the XML for the given cells into the text input for copy
		var copyCells = function(graph, cells) {
			if (cells.length > 0) {
				var clones = graph.cloneCells(cells);

				// Checks for orphaned relative children and makes absolute
				for (var i = 0; i < clones.length; i++) {
					var state = graph.view.getState(cells[i]);

					if (state != null) {
						var geo = graph.getCellGeometry(clones[i]);

						if (geo != null && geo.relative) {
							geo.relative = false;
							geo.x = state.x / state.view.scale - state.view.translate.x;
							geo.y = state.y / state.view.scale - state.view.translate.y;
						}
					}
				}

				textInput.value = mxClipboard.cellsToString(clones);
			}

			textInput.select();
			lastPaste = textInput.value;
		};

		// Handles copy event by putting XML for current selection into text input
		mxEvent.addListener(
			textInput,
			'copy',
			mxUtils.bind(this, function(evt) {
				if (graph.isEnabled() && !graph.isSelectionEmpty()) {
					copyCells(graph, mxUtils.sortCells(graph.model.getTopmostCells(graph.getSelectionCells())));
					dx = 0;
					dy = 0;
				}
			})
		);

		// Handles cut event by removing cells putting XML into text input
		mxEvent.addListener(
			textInput,
			'cut',
			mxUtils.bind(this, function(evt) {
				if (graph.isEnabled() && !graph.isSelectionEmpty()) {
					copyCells(graph, graph.removeCells());
					dx = -gs;
					dy = -gs;
				}
			})
		);

		// Merges XML into existing graph and layers
		var importXml = function(xml, dx, dy) {
			dx = dx != null ? dx : 0;
			dy = dy != null ? dy : 0;
			var cells = [];

			try {
				var doc = mxUtils.parseXml(xml);
				var node = doc.documentElement;

				if (node != null) {
					var model = new mxGraphModel();
					var codec = new mxCodec(node.ownerDocument);
					codec.decode(node, model);

					var childCount = model.getChildCount(model.getRoot());
					var targetChildCount = graph.model.getChildCount(graph.model.getRoot());

					// Merges existing layers and adds new layers
					graph.model.beginUpdate();
					try {
						for (var i = 0; i < childCount; i++) {
							var parent = model.getChildAt(model.getRoot(), i);

							// Adds cells to existing layers if not locked
							if (targetChildCount > i) {
								// Inserts into active layer if only one layer is being pasted
								var target =
									childCount == 1
										? graph.getDefaultParent()
										: graph.model.getChildAt(graph.model.getRoot(), i);

								if (!graph.isCellLocked(target)) {
									var children = model.getChildren(parent);
									cells = cells.concat(graph.importCells(children, dx, dy, target));
								}
							} else {
								// Delta is non cascading, needs separate move for layers
								parent = graph.importCells([ parent ], 0, 0, graph.model.getRoot())[0];
								var children = graph.model.getChildren(parent);
								graph.moveCells(children, dx, dy);
								cells = cells.concat(children);
							}
						}
					} finally {
						graph.model.endUpdate();
					}
				}
			} catch (e) {
				alertModalEroare(e);
				throw e;
			}

			return cells;
		};

		// Parses and inserts XML into graph
		var pasteText = function(text) {
			var xml = mxUtils.trim(text);
			var x = graph.container.scrollLeft / graph.view.scale - graph.view.translate.x;
			var y = graph.container.scrollTop / graph.view.scale - graph.view.translate.y;

			if (xml.length > 0) {
				if (lastPaste != xml) {
					lastPaste = xml;
					dx = 0;
					dy = 0;
				} else {
					dx += gs;
					dy += gs;
				}

				// Standard paste via control-v
				if (xml.substring(0, 14) == '<mxGraphModel>') {
					graph.setSelectionCells(importXml(xml, dx, dy));
					graph.scrollCellToVisible(graph.getSelectionCell());
				}
			}
		};

		// Cross-browser function to fetch text from paste events
		var extractGraphModelFromEvent = function(evt) {
			var data = null;

			if (evt != null) {
				var provider = evt.dataTransfer != null ? evt.dataTransfer : evt.clipboardData;

				if (provider != null) {
					if (document.documentMode == 10 || document.documentMode == 11) {
						data = provider.getData('Text');
					} else {
						data = mxUtils.indexOf(provider.types, 'text/html') >= 0 ? provider.getData('text/html') : null;

						if (mxUtils.indexOf(provider.types, 'text/plain' && (data == null || data.length == 0))) {
							data = provider.getData('text/plain');
						}
					}
				}
			}

			return data;
		};

		// Handles paste event by parsing and inserting XML
		mxEvent.addListener(textInput, 'paste', function(evt) {
			// Clears existing contents before paste - should not be needed
			// because all text is selected, but doesn't hurt since the
			// actual pasting of the new text is delayed in all cases.
			textInput.value = '';

			if (graph.isEnabled()) {
				var xml = extractGraphModelFromEvent(evt);

				if (xml != null && xml.length > 0) {
					pasteText(xml);
				} else {
					// Timeout for new value to appear
					window.setTimeout(
						mxUtils.bind(this, function() {
							pasteText(textInput.value);
						}),
						0
					);
				}
			}

			textInput.select();
		});

		mxEvent.addListener(container, 'dragover', function(evt) {
			if (graph.isEnabled()) {
				evt.stopPropagation();
				evt.preventDefault();
			}
		});

		mxEvent.addListener(container, 'drop', function(evt) {
			if (graph.isEnabled()) {
				evt.stopPropagation();
				evt.preventDefault();

				// Gets drop location point for vertex
				var pt = mxUtils.convertPoint(graph.container, mxEvent.getClientX(evt), mxEvent.getClientY(evt));
				var tr = graph.view.translate;
				var scale = graph.view.scale;
				var x = pt.x / scale - tr.x;
				var y = pt.y / scale - tr.y;

				// Converts local images to data urls
				var filesArray = evt.dataTransfer.files;

				for (var i = 0; i < filesArray.length; i++) {
					handleDrop(graph, filesArray[i], x + i * 10, y + i * 10);
				}
			}
		});

		function handleDrop(graph, file, x, y) {
			if (file.type.substring(0, 5) == 'image') {
				var reader = new FileReader();

				reader.onload = function(e) {
					// Gets size of image for vertex
					var data = e.target.result;

					// SVG needs special handling to add viewbox if missing and
					// find initial size from SVG attributes (only for IE11)
					if (file.type.substring(0, 9) == 'image/svg') {
						var comma = data.indexOf(',');
						var svgText = atob(data.substring(comma + 1));
						var root = mxUtils.parseXml(svgText);

						// Parses SVG to find width and height
						if (root != null) {
							var svgs = root.getElementsByTagName('svg');

							if (svgs.length > 0) {
								var svgRoot = svgs[0];
								var w = parseFloat(svgRoot.getAttribute('width'));
								var h = parseFloat(svgRoot.getAttribute('height'));

								// Check if viewBox attribute already exists
								var vb = svgRoot.getAttribute('viewBox');

								if (vb == null || vb.length == 0) {
									svgRoot.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
								} else if (isNaN(w) || isNaN(h)) {
									// Uses width and height from viewbox for
									// missing width and height attributes
									var tokens = vb.split(' ');

									if (tokens.length > 3) {
										w = parseFloat(tokens[2]);
										h = parseFloat(tokens[3]);
									}
								}

								w = Math.max(1, Math.round(w));
								h = Math.max(1, Math.round(h));

								data = 'data:image/svg+xml,' + btoa(mxUtils.getXml(svgs[0], '\n'));
								graph.insertVertex(null, null, '', x, y, w, h, 'shape=image;image=' + data + ';');
							}
						}
					} else {
						var img = new Image();

						img.onload = function() {
							var w = Math.max(1, img.width);
							var h = Math.max(1, img.height);

							// Converts format of data url to cell style value for use in vertex
							var semi = data.indexOf(';');

							if (semi > 0) {
								data = data.substring(0, semi) + data.substring(data.indexOf(',', semi + 1));
							}

							graph.insertVertex(null, null, '', x, y, w, h, 'shape=image;image=' + data + ';');
						};

						img.src = data;
					}
				};

				reader.readAsDataURL(file);
			}
		}

		mxEvent.addMouseWheelListener(function(evt, up) {
			if (evt.altKey) {
				evt.preventDefault();
				if (up) {
					graph.zoomIn();
					zoom = Math.round(1.25 * zoom);
					$('#zoomCounter').text(zoom + '%');
					$('#zoomCounter').stop(true, true).fadeIn();
					$('#zoomCounter').stop(true, true).fadeOut(1500);
				} else {
					graph.zoomOut();
					zoom = Math.round(0.8 * zoom);
					$('#zoomCounter').text(zoom + '%');
					$('#zoomCounter').stop(true, true).fadeIn();
					$('#zoomCounter').stop(true, true).fadeOut(1500);
				}
				mxEvent.consume(evt);
			}
		});

		mxEvent.addListener($('#chart-container')[0], 'click', function() {
			if (graph.getSelectionCell()) {
				$(
					'#selectFont option[value="' +
						(graph.getCellStyle(graph.getSelectionCell()).fontFamily || 'Arial') +
						'"]'
				).prop('selected', 'selected');
				$('#inputFontSize').val(graph.getCellStyle(graph.getSelectionCell()).fontSize);

				if (graph.getSelectionCell().vertex) {
					$('#elementSelectat').text(graph.getSelectionCell().value);
					$('.elementStil').css('display', 'block');
				} else {
					$('#elementSelectat').text('Conexiune');
					$('.elementStil').css('display', 'none');
				}

				$('#inputBgColor').spectrum('set', graph.getCellStyle(graph.getSelectionCell()).fillColor);
				$('#inputBorderColor').spectrum('set', graph.getCellStyle(graph.getSelectionCell()).strokeColor);
				$('#inputTextColor').spectrum('set', graph.getCellStyle(graph.getSelectionCell()).fontColor);
				$('#showStil').css('display', 'block');
			} else {
				$('#elementSelectat').text('Foaie de lucru');
				$('#showStil').css('display', 'none');
			}
		});

		mxEvent.addListener($('#chart-container')[0], 'mouseUp', function() {
			$('#chart-container').trigger('click');
		});

		//stiluri
		var style = graph.getStylesheet().getDefaultVertexStyle();
		style['fillColor'] = '#FFFFFF';
		style['strokeColor'] = '#000000';
		style['fontColor'] = '#000000';
		style['fontStyle'] = '1';

		style = graph.getStylesheet().getDefaultEdgeStyle();
		style['strokeColor'] = '#000000';
		style['fontColor'] = '#000000';
		style['fontStyle'] = '0';
		style['fontStyle'] = '0';
		style['startSize'] = '6';
		style['endSize'] = '6';

		function LinkShape() {
			mxArrow.call(this);
		}

		mxCellRenderer.prototype.defaultShapes['link'] = LinkShape;

		mxConstants.HANDLE_FILLCOLOR = '#ffffff';
		mxConstants.HANDLE_STROKECOLOR = '#cccccc';
		mxConstants.VERTEX_SELECTION_COLOR = '#cccccc';
		mxConstants.EDGE_SELECTION_COLOR = '#cccccc';
		mxGraphHandler.prototype.guidesEnabled = true;
		mxEdgeHandler.prototype.snapToTerminals = true;
		mxVertexHandler.prototype.rotationEnabled = true;
		mxVertexHandler.prototype.livePreview = true;
		mxVertexHandler.prototype.manageSizers = true;
		mxVertexHandler.prototype.parentHighlightEnabled = true;
		mxVertexHandler.prototype.rotationHandleVSpacing = -20;

		var tbContainer = $('.butoanestanga')[0];
		toolbar = new mxToolbar(tbContainer);
		toolbar.enabled = false;

		var addVertex = function(icon, w, h, style, text) {
			var vertex = new mxCell(null, new mxGeometry(0, 0, w, h), style);
			vertex.setVertex(true);

			addToolbarItem(graph, toolbar, vertex, icon, text);
		};

		//graph.setConnectable(true);
		graph.setMultigraph(false);

		// DE ADAUGAT UNDO PENTRU STILURI !!!!

		addVertex('./Images/text.png', 140, 50, 'text;strokeColor=none;fillColor=none;fontStyle=0;', true);
		addVertex('./Images/1.png', 140, 50, 'shape=rectangle;fontStyle=0;', true);
		addVertex('./Images/2.png', 140, 50, 'shape=rectangle;fontStyle=0;rounded=1;', true);
		addVertex('./Images/3.png', 140, 50, 'shape=ellipse;fontStyle=0;', true);
		addVertex('./Images/5.png', 140, 50, 'shape=hexagon;fontStyle=0;', true);
		addVertex('./Images/6.png', 140, 50, 'shape=cloud;fontStyle=0;', true);
		addVertex('./Images/4.png', 140, 50, 'shape=swimlane;fontStyle=0;', true);
		addVertex('./Images/7.png', 40, 50, 'shape=actor;fontStyle=0;', false);
		//addVertex('/OrganigramaGrafica/Images/1.png', 140, 50, 'shape=rhombus;fontStyle=0;', true); -- de adaugat
		addToolbarItem(graph, toolbar, null, './Images/con1.png', null);
		addToolbarItem(graph, toolbar, null, './Images/con2.png', '2capete');
		toolbar.addLine();

		$('.mxToolbarMode').each(function(index) {
			$(this).attr('title', 'Drag and Drop pentru a adauga un element nou !').attr('data-toggle', 'tooltipAdd');
		});

		mxDragSource.prototype.getDropTarget = function(graph, x, y) {
			var cell = graph.getCellAt(x, y);

			if (!graph.isValidDropTarget(cell)) {
				cell = null;
			}

			return cell;
		};
		graph.panningHandler.panningEnabled = true;
		mxPanningHandler.prototype.isPanningTrigger = function(me) {
			var evt = me.getEvent();
			return mxEvent.isMiddleMouseButton(evt);
		};
		new mxRubberband(graph);

		var parent = graph.getDefaultParent();
		graph.getModel().beginUpdate();
		try {
			var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
			var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
			var e1 = graph.insertEdge(parent, null, '', v1, v2);
		} finally {
			graph.getModel().endUpdate();
			graph.removeCells([ v1 ], false);
			graph.removeCells([ v2 ], false);
			graph.removeCells([ e1 ]);
		}
		var popupHandler = new mxDefaultPopupMenu();
		// var undoManager = new mxUndoManager();
		var listener = function(sender, evt) {
			undoManager.undoableEditHappened(evt.getProperty('edit'));
		};
		graph.getModel().addListener(mxEvent.UNDO, listener);
		graph.getView().addListener(mxEvent.UNDO, listener);
		editor.graph = graph;
	}

	/**************************************************
     * Context-Menu with custom command "label"
     **************************************************/
	$.contextMenu({
		selector: 'g',
		build: function($trigger, e) {
			var pt = graph.getPointForEvent(e);
			if (graph.isSelectionEmpty()) {
				return {
					callback: function(key, options) {
						if (key == 'undo') undoManager.undo();
						else if (key == 'redo') undoManager.redo();
						else {
							editor.actions[key](editor);
							if (key == 'paste') {
								if (graph.getSelectionCell().geometry.sourcePoint == null) {
									graph.getSelectionCell().geometry.x = pt.x;
									graph.getSelectionCell().geometry.y = pt.y;
								} else {
									graph.getSelectionCell().geometry.sourcePoint.x = pt.x;
									graph.getSelectionCell().geometry.sourcePoint.y = pt.y;
									graph.getSelectionCell().geometry.targetPoint.x += pt.x;
									graph.getSelectionCell().geometry.targetPoint.x += pt.y;
								}
								graph.refresh();
							}
						}
					},
					items: {
						undo: { name: 'Undo' },
						redo: { name: 'Redo' },
						sep1: '---------',
						paste: {
							name: 'Paste',
							disabled: function() {
								return mxClipboard.isEmpty();
							}
						},
						sep2: '---------',
						selectVertices: { name: 'Selecteaza elementele' },
						selectEdges: { name: 'Selecteaza legaturile' },
						sep3: '---------',
						selectAll: { name: 'Selecteaza tot' }
					}
				};
			} else {
				return {
					callback: function(key, options) {
						if (key == 'duplicate') {
							editor.actions['copy'](editor);
							editor.actions['paste'](editor);
						} else editor.actions[key](editor);
					},
					items: {
						edit: { name: 'Edit' },
						delete: { name: 'Delete' },
						sep1: '---------',
						copy: { name: 'Copy' },
						cut: { name: 'Cut' },
						duplicate: { name: 'Dubleaza' },
						sep2: '---------',
						toFront: { name: 'Adu in fata' },
						toBack: { name: 'Trimite in spate' }
					}
				};
			}
		}
	});

	$(document).mousedown(function(e) {
		if ((e.which == 2 || e.button == 4) && e.ctrlKey) $('#btnZoomInitial').trigger('click'); //BUTON ROTITA MOUSE zoom initial
	});

	$(document).on('keydown', function(e) {
		if (e.keyCode === 27) $('.modal').css('display', 'none');

		if (e.ctrlKey) {
			//SHORTCUT-URI CU CTRL
			switch (e.keyCode) {
				case 65: //CTRL+A deschide posturi si ocupanti organigrama
					if (
						document.activeElement.tagName.toLowerCase() == 'textarea' ||
						(!document.activeElement.isContentEditable &&
							!(document.activeElement.tagName.toLowerCase() == 'input'))
					) {
						e.preventDefault();
						$('#btnPosturi').trigger('click');
					}
					break;
				case 66: //CTRL+B bold text
					e.preventDefault();
					editor.actions.bold(editor);
					break;
				case 68: //CTRL+D aliniere dreapta text
					e.preventDefault();
					editor.actions.alignFontRight(editor);
					break;
				case 69: //CTRL+E edit organigrama
					e.preventDefault();
					editor.actions.edit(editor);
					break;
				case 72: //CTRL+H adu in fata elementul organigrama
					e.preventDefault();
					editor.actions.toFront(editor);
					break;
				case 73: //CTRL+I italic text
					e.preventDefault();
					editor.actions.italic(editor);
					break;
				case 74: //CTRL+J trimite in spate elementul organigrama
					e.preventDefault();
					editor.actions.toBack(editor);
					break;
				case 76: //CTRL+L aliniere stanga text
					e.preventDefault();
					editor.actions.alignFontLeft(editor);
					break;
				case 77: //CTRL+M aliniere mij text
					e.preventDefault();
					editor.actions.alignFontCenter(editor);
					break;
				case 79: //CTRL+O open organigrama
					e.preventDefault();
					$('#modalIncarcaDinPC').fadeIn();
					modalTab($('#modalIncarcaDinPC'));
					break;
				case 80: //CTRL+P print organigrama
					e.preventDefault();
					$('#modalPrint').fadeIn();
					break;
				case 81: //CTRL+Q nou organigrama
					e.preventDefault();
					$('#modalOrgNou').fadeIn();
					$('#numeProiect').val('Organigrama Grafica ' + new Date().toJSON().slice(0, 10));
					break;
				case 82: //CTRL+R redo organigrama
					e.preventDefault();
					undoManager.redo();
					break;
				case 83: //CTRL+S save organigrama
					e.preventDefault();
					$('#numeFisier').val(numeFisier);
					$('#modalNumeFisier').fadeIn();
					setTimeout(function() {
						$('#numeFisier').focus();
					}, 1);
					modalTab($('#modalNumeFisier'));
					break;
				case 85: //CTRL+U underline text
					e.preventDefault();
					editor.actions.underline(editor);
					break;
				case 90: //CTRL+Z undo organigrama
					e.preventDefault();
					if (
						document.activeElement.tagName.toLowerCase() == 'textarea' ||
						(!document.activeElement.isContentEditable &&
							!(document.activeElement.tagName.toLowerCase() == 'input'))
					) {
						undoManager.undo();
					}
				default:
					break;
			}
		}
		if (!document.activeElement.isContentEditable && !(document.activeElement.tagName.toLowerCase() == 'input')) {
			//daca nu exista un content editable activ
			if (!$('.mxPlainTextEditor')[0]) {
				if (e.keyCode === 46) graph.removeCells();
			}
			if (e.keyCode === 90 && e.ctrlKey && !$('.mxCellEditor')[0]) {
				undoManager.undo();
			}
			if (e.keyCode >= 37 && e.keyCode <= 40 && graph.getSelectionCells().length > 0) {
				//misca elementele organigramei cu ajutorul sagetilor
				e.preventDefault();
				for (var i = 0; i < graph.getSelectionCells().length; i++) {
					if (e.keyCode === 37) {
						//sageata stanga
						if (graph.getSelectionCells()[i].geometry.sourcePoint == null)
							graph.getSelectionCells()[i].geometry.x -= 1;
						else {
							graph.getSelectionCells()[i].geometry.sourcePoint.x -= 1;
							graph.getSelectionCells()[i].geometry.targetPoint.x -= 1;
						}
					} else if (e.keyCode === 38) {
						//sageata sus
						if (graph.getSelectionCells()[i].geometry.sourcePoint == null)
							graph.getSelectionCells()[i].geometry.y -= 1;
						else {
							graph.getSelectionCells()[i].geometry.sourcePoint.y -= 1;
							graph.getSelectionCells()[i].geometry.targetPoint.y -= 1;
						}
					} else if (e.keyCode === 39) {
						//sageata dreapta
						if (graph.getSelectionCells()[i].geometry.sourcePoint == null)
							graph.getSelectionCells()[i].geometry.x += 1;
						else {
							graph.getSelectionCells()[i].geometry.sourcePoint.x += 1;
							graph.getSelectionCells()[i].geometry.targetPoint.x += 1;
						}
					} else {
						//sageata jos
						if (graph.getSelectionCells()[i].geometry.sourcePoint == null)
							graph.getSelectionCells()[i].geometry.y += 1;
						else {
							graph.getSelectionCells()[i].geometry.sourcePoint.y += 1;
							graph.getSelectionCells()[i].geometry.targetPoint.y += 1;
						}
					}
				}
				graph.refresh();
			}
		} else {
			if (e.keyCode === 13) {
				if ($(':focus').hasClass('postNume') || $(':focus').hasClass('angajatNume')) {
					e.preventDefault();
					$('div[contentEditable]').blur();
				}
			}
		}
	});

	//#BUTOANE
	$('#submitPost').click(function() {
		if ($('#numePost').val().trim() == '') {
			alertModalEroare('Campul Numele postului nu poate sa fie gol');
			return false;
		}
		var exista = 0;
		$(postCurent).parents('.windowPosturi').find('.postNume').each(function(index) {
			var val = $(this).text();
			if (val == $('#numePost').val()) {
				alertModalEroare('Nu pot sa existe 2 posturi cu acelasi nume.');
				exista = 1;
				return false;
			}
		});
		if (exista == 1) return false;
		$(postCurent.parentNode.parentNode)
			.find('.windowDinamic')
			.append(
				'<div class="grupare"><div class="post"><i class="fa fa-briefcase"></i>&nbsp;<div class="postNume">' +
					$('#numePost').val().trim() +
					'</div><span style="float:right;cursor:pointer" onclick="angajatNou(this);"> + Angajat nou</span><span style="float:right;cursor:pointer;margin-right:10px" onclick="modificaPost(this);"> Modifica post</span><span style="float:right;cursor:pointer;margin-right: 10px;" onclick="stergePost(this);"> - Inchide post  </span></div><div class="angajati"></div></div>'
			);
		grupareDraggableSubmit();
		$('.modal').css('display', 'none');
		salveazaModificariPosturi();
		return true;
	});

	$('#submitModificaPost').click(function() {
		var exista = 0;
		$(postCurent).parents('.windowPosturi').find('.postNume').each(function(index) {
			var val = $(this).text();
			if (val == $('#numePost').val()) {
				alertModalEroare('Nu pot sa existe 2 posturi cu acelasi nume.');
				exista = 1;
				return false;
			}
		});
		if (exista == 1) return false;
		$(postCurent).parents('.post').find('.postNume').text($('#numePost').val().trim());
		$('.modal').css('display', 'none');
		salveazaModificariPosturi();
		return true;
	});

	$('#submitAngajat').click(function() {
		if ($('#numeAngajat').val().trim() == '') {
			alertModalEroare('Campul Numele angajatului nu poate sa fie gol');
			return false;
		}
		$(postCurent.parentElement.parentNode)
			.find('.angajati')
			.append(
				'<div class="angajat"><i class="fa fa-user" aria-hidden="true"></i>&nbsp;<div class="angajatNume">' +
					$('#numeAngajat').val().trim() +
					'</div><span style="float:right;cursor:pointer" onclick="modificaAngajat(this);">Modifica</span><span style="float:right;cursor:pointer;margin-right:10px" onclick="stergeAngajat(this);"> - Sterge angajat</span></div>'
			);
		$('.modal').css('display', 'none');
		salveazaModificariPosturi();
	});

	$('#submitModificaAngajat').click(function() {
		$(postCurent).parents('.angajat').find('.angajatNume').text($('#numeAngajat').val().trim());
		$('.modal').css('display', 'none');
		salveazaModificariPosturi();
		return true;
	});

	$('#submitFisier').on('click', function() {
		download($('#numeFisier').val() + '.ogg', formeazaFisierBase64());
	});

	function formeazaFisierBase64() {
		var a = [];
		a.push({
			numeFisier: numeFisier + '.ogg',
			marPagina: pagina.marime,
			modPagina: pagina.mod,
			conectori: conectori,
			continutFisier: editor.writeGraphModel(),
			obiectDate: JSON.stringify(date),
			defaultEdge: JSON.stringify(graph.getStylesheet().styles.defaultEdge),
			defaultVertex: JSON.stringify(graph.getStylesheet().styles.defaultVertex)
		});
		return window.btoa(Papa.unparse(a));
	}

	$('#salvareCuParola').change(function() {
		if (this.checked) {
			// daca se bifeaza
			$('#inputFisierParola').show('slow');
		} else {
			$('#inputFisierParola').hide('slow');
		}
	});

	function download(filename, text) {
		if (navigator.appVersion.toString().indexOf('.NET') > 0) {
			try {
				blob = new Blob([ text ], { type: 'text/plain;charset=utf-8' });
			} catch (e) {
				// Old browser, need to use blob builder
				window.BlobBuilder =
					window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
				if (window.BlobBuilder) {
					var bb = new BlobBuilder();
					bb.append(text);
					blob = bb.getBlob('text/plain;charset=utf-8');
				}
			}
			window.navigator.msSaveBlob(blob, filename);
		} else {
			var element = document.createElement('a');
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
			element.setAttribute('download', filename);
			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		}
	}
	function incarcaFisier(e, input) {
		if (input === 0) var f = e.target.files[0];
		else {
			var f = e.originalEvent.dataTransfer.files[0];
			e.preventDefault();
			e.stopPropagation();
		}
		if (f.name[f.name.length - 3] + f.name[f.name.length - 2] + f.name[f.name.length - 1] == 'ogg') {
			if (f) {
				var r = new FileReader();
				r.onload = function(e) {
					try {
						window.atob(e.target.result);
					} catch (err) {
						alertModalEroare('Structura documentului este veche sau corupta');
						return;
					}
					var parsed = Papa.parse(window.atob(e.target.result), { header: true });
					var continut = parsed.data[0];
					// continut.{obiecte} - numeFisier,marPagina,modPagina,contectori,continutFisier,obiectDate

					//marime pagina
					$('#pageBackground').css(
						'width',
						continut.modPagina == 'portrait'
							? marimiPagini[continut.marPagina].w
							: marimiPagini[continut.marPagina].h
					);
					$('#pageBackground').css(
						'height',
						continut.modPagina == 'portrait'
							? marimiPagini[continut.marPagina].h
							: marimiPagini[continut.marPagina].w
					);
					graph.scrollTileSize = new mxRectangle(
						0,
						0,
						$('#pageBackground').height(),
						$('#pageBackground').width()
					);
					mxConstants.PAGE_FORMAT_A4_PORTRAIT.height = $('#pageBackground').height();
					mxConstants.PAGE_FORMAT_A4_PORTRAIT.width = $('#pageBackground').width();
					graph.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
					graph.refresh();
					//-marime pagina

					//incarca date fisier in organigrama
					setNumeFisier(continut.numeFisier.replace('.ogg', ''));
					//document.title = numeFisier;
					pagina.marime = continut.marPagina;
					pagina.mod = continut.modPagina;
					conectori = continut.conectori;
					date = JSON.parse(continut.obiectDate);
					if (continut.defaultVertex)
						graph.stylesheet.styles.defaultVertex = JSON.parse(continut.defaultVertex);
					if (continut.defaultEdge) graph.stylesheet.styles.defaultEdge = JSON.parse(continut.defaultEdge);
					folderFisier = '';

					var doc = mxUtils.parseXml(continut.continutFisier);
					var node = doc.documentElement;
					editor.readGraphModel(node);
					//--

					//centreaza pagina in mijloc
					var width = $('#pageBackground').width();
					var widthContainer = $('#chart-container').find('svg:first').width();
					var widthContainer2 = $('#chart-container').width();
					var height = $('#pageBackground').height();
					var heightContainer = $('#chart-container').find('svg:first').height();
					$('#pageBackground').css('left', (widthContainer - width) / 2);
					$('#pageBackground').css('top', (heightContainer - height) / 2);
					graph.container.scrollTop = (heightContainer - height) / 2 - 40;
					graph.container.scrollLeft = (widthContainer - widthContainer2) / 2;
					//--
					undoManager.clear();

					$('#modalIncarcaDinPC').css('display', 'none');
					$('#ecranBunVenit').fadeOut('slow');
					$('#inputFisier').replaceWith($('#inputFisier').clone(true));
					return true;
				};
				r.readAsText(f);
				return false;
			} else {
				alertModalEroare('Au aparut erori in incarcarea fisierului.');
				return false;
			}
		} else {
			alertModalEroare('Fisierul incarcat nu este suportat (necesita extensia .ogg)');
			$('.dropZone').removeClass('dropZoneOver');
			return false;
		}
	} //functie de incarcare a fisierului

	$('#inputFisier').on('change', function(e) {
		incarcaFisier(e, 0);
	}); //drag and drop incarca fisier

	$('.dropZone')
		.on('dragover', function() {
			$('.dropZone').addClass('dropZoneOver');
			return false;
		})
		.on('dragend', function() {
			$('.dropZone').removeClass('dropZoneOver');
			return false;
		})
		.on('dragleave', function() {
			$('.dropZone').removeClass('dropZoneOver');
			return false;
		})
		.on('drop', function(e) {
			incarcaFisier(e, 1);
			$('.dropZone').removeClass('dropZoneOver');
		}); //drag and drop efecte CSS de hover etc

	$('#pdfPrint').click(function() {
		//var svg = document.getElementById('svg-container').innerHTML;

		var pdfMarimi = {
			A2: {
				w: 1191,
				h: 1648
			},
			A3: {
				w: 842,
				h: 1191
			},
			A4: {
				w: 595,
				h: 842
			},
			A5: {
				w: 420,
				h: 595
			},
			LETTER: {
				w: 612,
				h: 791
			}
		};
		//var w = (pagina.mod == 'portrait') ? pdfMarimi[pagina.marime].w : pdfMarimi[pagina.marime].h;
		//var h = (pagina.mod == 'portrait') ? pdfMarimi[pagina.marime].h : pdfMarimi[pagina.marime].w;
		//var scaleText = w / $('#pageBackground').width();

		var w = $('#pageBackground').width();
		var h = $('#pageBackground').height();
		var scale = 1;

		// Applies scale to page
		var pf = mxRectangle.fromRectangle(graph.pageFormat || mxConstants.PAGE_FORMAT_A4_PORTRAIT);
		pf.width = Math.round(pf.width * scale * graph.pageScale);
		pf.height = Math.round(pf.height * scale * graph.pageScale);

		// Finds top left corner of top left page
		var bounds = mxRectangle.fromRectangle(graph.getGraphBounds());
		bounds.x -= graph.view.translate.x * graph.view.scale;
		bounds.y -= graph.view.translate.y * graph.view.scale;

		var x0 = Math.floor(bounds.x / pf.width) * pf.width;
		var y0 = Math.floor(bounds.y / pf.height) * pf.height;

		var preview = new mxPrintPreview(graph, scale, pf, 0, -x0, -y0);
		preview.marginTop = scale * graph.pageScale;
		preview.marginBottom = scale * graph.pageScale;
		preview.autoOrigin = false;

		var oldRenderPage = preview.renderPage;
		preview.renderPage = function(w, h, x, y, content, pageNumber) {
			var div = oldRenderPage.apply(this, arguments);
			return div;
		};

		var pagini = preview.open('pdf', $('#pdfDownloadFrame')[0].contentWindow);
		var pdf = new jsPDF(pagina.mod.charAt(0), 'pt', [ w, h ]);

		$(pagini).find('svg').each(function(index) {
			if (index !== 0) pdf.addPage();

			var c = pdf.canvas;
			c.width = w;
			c.height = h;
			var ctx = c.getContext('2d');
			ctx.ignoreClearRect = true;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, w, h);
			//ctx.scale(scaleText, scaleText);
			//SCALE FROM CENTER

			$(this).find('g').each(function(index) {
				//$(this).attr("font-size", Math.round(parseFloat($(this).attr("font-size"))) + "px");
				if ($(this).attr('font-size')) {
					//$(this).attr("font-size", Math.round(parseFloat($(this).attr("font-size")) * scaleText) + "px");
					$(this).attr('font-size', Math.round(parseFloat($(this).attr('font-size'))) + 'px');

					//$(this).find('text').each(function (index) {
					//    $(this).attr("y", $(this).attr("y") * scaleText);
					//});
				}
			});
			var svg = $('<div>').append($(this).clone()).html();
			svg = svg.split('&nbsp;').join('');

			//load a svg snippet in the canvas with id = 'drawingArea'
			canvg(c, svg, {
				ignoreMouse: true,
				ignoreAnimation: true,
				ignoreDimensions: true,
				log: true
			});
		});

		if (detectIE()) {
			try {
				blob = new Blob(pdf.output(), {
					type: 'text/plain;charset=utf-8'
				});
			} catch (e) {
				// Old browser, need to use blob builder
				window.BlobBuilder =
					window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
				if (window.BlobBuilder) {
					var bb = new BlobBuilder();
					bb.append(pdf.output());
					blob = bb.getBlob('text/plain;charset=utf-8');
				}
			}
			window.navigator.msSaveBlob(blob, numeFisier + '.pdf');
		} else {
			pdf.save(numeFisier);
		}
		$('#pdfDownloadFrame').attr('src', 'about:blank');
		$('#modalPrint').css('display', 'none');
	});
	$('#htmlPrint').click(function() {
		var scale = 1;

		// Applies scale to page
		var pf = mxRectangle.fromRectangle(graph.pageFormat || mxConstants.PAGE_FORMAT_A4_PORTRAIT);
		pf.width = Math.round(pf.width * scale * graph.pageScale);
		pf.height = Math.round(pf.height * scale * graph.pageScale);

		// Finds top left corner of top left page
		var bounds = mxRectangle.fromRectangle(graph.getGraphBounds());
		bounds.x -= graph.view.translate.x * graph.view.scale;
		bounds.y -= graph.view.translate.y * graph.view.scale;

		var x0 = Math.floor(bounds.x / pf.width) * pf.width;
		var y0 = Math.floor(bounds.y / pf.height) * pf.height;

		//var preview = new mxPrintPreview(graph, scale, pf, 0, -x0, -y0);
		preview = new mxPrintPreview(graph, scale, pf, 0, -x0, -y0);
		preview.marginTop = scale * graph.pageScale;
		preview.marginBottom = scale * graph.pageScale;
		preview.autoOrigin = false;

		var oldRenderPage = preview.renderPage;
		preview.renderPage = function(w, h, x, y, content, pageNumber) {
			var div = oldRenderPage.apply(this, arguments);
			return div;
		};
		preview.open();
		$('#modalPrint').css('display', 'none');
	});

	$('#chart-container').height($(window).height() - $('.toolbar').height() - $('.navbarX').height());
	$('#chart-container').width($(window).width() - 80 - 97 - 200 * isGraficEditorVisible);

	//#MODALE FadeIn

	$('#incarcaDinPC').click(function() {
		customConfirm();
		$('#modalIncarcaDinPC').fadeIn();
		modalTab($('#modalIncarcaDinPC'));
	});
	$('#descarcaFisier').click(function() {
		$('#numeFisier').val(numeFisier);
		$('#modalNumeFisier').fadeIn();
		setTimeout(function() {
			$('#numeFisier').focus();
		}, 1);
		modalTab($('#modalNumeFisier'));
	});
	$('#orgNouButon').click(function() {
		$('#modalOrgNou').fadeIn();
		$('#numeProiect').val('Organigrama Grafica ' + new Date().toJSON().slice(0, 10));
		setTimeout(function() {
			$('#numeProiect').focus();
		}, 1);
		modalTab($('#modalOrgNou'));
	});

	$('#incarcaServerButon').click(function() {
		fileBrowserUpdate();
		$('.salveazaForm').css('display', 'none');
		$('#submitSalveazaInServer').css('display', 'none');
		$('#butonIncarcaDinServer').css('display', 'inline-block');
		$('#modalServerTitlu').text('Incarca din Server');
		$('#modalServer').fadeIn();
		modalTab($('#modalServer'));
	});
	$('#setariEditor').click(function() {
		$('#cbAlerta')[0].checked = !localStorage['nuArata'];
		$('#setariNumeProiect').val(numeFisier);
		$('#setariMarimePagina').val(pagina.marime);
		if (pagina.mod == 'portrait') $('input[type="radio"]:eq(4)').prop('checked', true);
		else $('input[type="radio"]:eq(5)').prop('checked', true);
		if (conectori == 1) $('input[type="radio"]:eq(6)').prop('checked', true);
		else $('input[type="radio"]:eq(7)').prop('checked', true);
		$('#modalSetariEditor').fadeIn();
		modalTab($('#modalSetariEditor'));
	});
	$('#comenziRapide').click(function() {
		$('#modalComenziRapide').fadeIn();
		modalTab($('#modalComenziRapide'));
	});
	$('#incarcaDinServer').click(function() {
		customConfirm();
		fileBrowserUpdate();
		$('.salveazaForm').css('display', 'none');
		$('#submitSalveazaInServer').css('display', 'none');
		$('#butonIncarcaDinServer').css('display', 'inline-block');
		$('#modalServerTitlu').text('Incarca din Server');
		$('#modalServer').fadeIn();
		modalTab($('#modalServer'));
	});
	$('#incarcaDinPCButon').click(function() {
		$('#modalIncarcaDinPC').fadeIn();
		modalTab($('#modalIncarcaDinPC'));
	});
	$('#orgNouMenu').click(function() {
		customConfirm();
		$('#modalOrgNou').fadeIn();
		setTimeout(function() {
			$('#numeProiect').focus();
		}, 1);
		$('#numeProiect').val('Organigrama Grafica ' + new Date().toJSON().slice(0, 10));
		modalTab($('#modalOrgNou'));
	});
	$('#btnPrint').click(function() {
		$('#modalPrint').fadeIn();
		modalTab($('#modalPrint'));
	});

	function customConfirm() {
		if (!localStorage['nuArata']) {
			$('.modal-content').css('display', 'none');
			$('#modalConfirm').css('display', 'block');
			$('#modalContentConfirm').fadeIn();
			modalTab($('#modalContentConfirm'));
		}
	}

	$('#confirmOk').click(function() {
		if ($('#nuArata')[0].checked) localStorage['nuArata'] = 'activat';
	});

	//#end MODALE

	$('#salveazaSetariEditor').click(function() {
		if ($('#cbAlerta')[0].checked) {
			localStorage['nuArata'] = '';
		} else {
			localStorage['nuArata'] = 'activat';
		}
		setNumeFisier($('#setariNumeProiect').val());
		pagina.marime = $('#setariMarimePagina').val();
		if ($('input[type="radio"]:eq(4)').prop('checked')) pagina.mod = 'portrait';
		else pagina.mod = 'landscape';
		if ($('input[type="radio"]:eq(6)').prop('checked') && conectori == 0) {
			conectori = 1;
			graph.selectVertices();
			var noduri = graph.getSelectionCells();
			graph.selectCells();
			for (i = 0; i < noduri.length; i++) {
				noduri[i].connectable = false;
			}
		} else if (conectori == 1) {
			conectori = 0;
			graph.selectVertices();
			var noduri = graph.getSelectionCells();
			graph.selectCells();
			for (i = 0; i < noduri.length; i++) {
				noduri[i].connectable = true;
			}
		}
		$('#pageBackground').css(
			'width',
			pagina.mod == 'portrait' ? marimiPagini[pagina.marime].w : marimiPagini[pagina.marime].h
		);
		$('#pageBackground').css(
			'height',
			pagina.mod == 'portrait' ? marimiPagini[pagina.marime].h : marimiPagini[pagina.marime].w
		);
		mxConstants.PAGE_FORMAT_A4_PORTRAIT.height = $('#pageBackground').height();
		mxConstants.PAGE_FORMAT_A4_PORTRAIT.width = $('#pageBackground').width();
		graph.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
		graph.scrollTileSize = new mxRectangle(0, 0, $('#pageBackground').height(), $('#pageBackground').width());
		graph.refresh();
		$('#modalSetariEditor').css('display', 'none');
	});

	$('#creeazaOrganigrama').click(function() {
		$('#pageBackground').css(
			'width',
			$('input[type="radio"]:checked').val() == true
				? marimiPagini[$('#marimePagina').val()].w
				: marimiPagini[$('#marimePagina').val()].h
		);
		$('#pageBackground').css(
			'height',
			$('input[type="radio"]:checked').val() == true
				? marimiPagini[$('#marimePagina').val()].h
				: marimiPagini[$('#marimePagina').val()].w
		);
		conectori = $('input[type="radio"]:checked:eq(1)').val();

		mxConstants.PAGE_FORMAT_A4_PORTRAIT.height = $('#pageBackground').height();
		mxConstants.PAGE_FORMAT_A4_PORTRAIT.width = $('#pageBackground').width();
		graph.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
		graph.scrollTileSize = new mxRectangle(0, 0, $('#pageBackground').height(), $('#pageBackground').width());
		graph.refresh();
		var doc = mxUtils.parseXml(
			'<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'
		);
		var node = doc.documentElement;
		editor.readGraphModel(node);

		date = {};
		undoManager.clear();
		idFisier = 0;
		folderFisier = '';

		$('#ecranBunVenit').fadeOut('slow');
		var width = $('#pageBackground').width();
		var widthContainer = $('#chart-container').find('svg:first').width();
		var widthContainer2 = $('#chart-container').width();
		var height = $('#pageBackground').height();
		var heightContainer = $('#chart-container').find('svg:first').height();
		$('#pageBackground').css('left', (widthContainer - width) / 2);
		$('#pageBackground').css('top', (heightContainer - height) / 2);
		graph.container.scrollTop = (heightContainer - height) / 2 - 40;
		graph.container.scrollLeft = (widthContainer - widthContainer2) / 2;
		setNumeFisier($('#numeProiect').val());
		//document.title = numeFisier;
		pagina.marime = $('#marimePagina').val();
		pagina.mod = $('input[type="radio"]:checked').val() == true ? 'portrait' : 'landscape';
		$('#modalOrgNou').fadeOut();
	});

	$(window).on('resize', function() {
		if ($(window).height() == screen.height)
			$('#chart-container').height(screen.height - $('.toolbar').height() - $('.navbarX').height());
		$('#chart-container').height($(window).height() - $('.toolbar').height() - $('.navbarX').height());
		$('#chart-container').width($(window).width() - 80 - 97 - 200 * isGraficEditorVisible);
		graph.sizeDidChange();
		//if ($('.windowPosturi').css("height") == '30px') {
		//    $('.windowPosturi').css("top", ($(window).height() - 30) + "px");
		//}
		//else {
		//    $('.windowPosturi').centrareOriz();
		//    $('.windowPosturi').centrareVert();
		//}
		$('.windowPosturi').each(function(index) {
			if ($(this).width() != 100) {
				if ($(this).width() + $(this).position().left >= $(window).width()) $(this).centrareOriz();
				if ($(this).height() + $(this).position().top >= $(window).height()) $(this).centrareVert();
			} else {
				$(this).css('top', $(window).height() - 30 + 'px');
			}
		});
	});

	$('#btnZoomInitial').click(function() {
		graph.zoomActual();
		var width = $('#pageBackground').width();
		var widthContainer = $('#chart-container').find('svg:first').width();
		var widthContainer2 = $('#chart-container').width();
		var height = $('#pageBackground').height();
		var heightContainer = $('#chart-container').find('svg:first').height();
		graph.container.scrollTop = (heightContainer - height) / 2 - 40;
		graph.container.scrollLeft = (widthContainer - widthContainer2) / 2;
		zoom = 100;
	});

	$('#btnZoomIn').click(function() {
		graph.zoomIn();
		zoom = Math.round(1.25 * zoom);
		$('#zoomCounter').text(zoom + '%');
		$('#zoomCounter').stop(true, true).fadeIn();
		$('#zoomCounter').stop(true, true).fadeOut(1500);
	});
	$('#btnZoomOut').click(function() {
		graph.zoomOut();
		zoom = Math.round(0.8 * zoom);
		$('#zoomCounter').text(zoom + '%');
		$('#zoomCounter').stop(true, true).fadeIn();
		$('#zoomCounter').stop(true, true).fadeOut(1500);
	});

	$('#btnUndo').click(function() {
		undoManager.undo();
		$('#chart-container').trigger('click');
	});

	$('#btnRedo').click(function() {
		undoManager.redo();
		$('#chart-container').trigger('click');
	});

	$('#btnPosturi').click(function() {
		if (!graph.getSelectionCell() || !graph.getSelectionCell().value) {
			alertModalEroare('Nu a fost selectat un element valid');
			return;
		}
		if ($('#windowPost' + graph.getSelectionCell().id)) {
			$('#windowPost' + graph.getSelectionCell().id).remove();
		}
		$('#windowPosturiExemplu').find('.textNav:first').text(graph.getSelectionCell().value);
		$('body').append(
			'<div class="windowPosturi" style="display:block" id="windowPost' +
				graph.getSelectionCell().id +
				'">' +
				$('#windowPosturiExemplu').html() +
				'</div>'
		);

		$('.windowPosturi:last').draggable({
			handle: '.windowHeader',
			containment: 'window',
			scroll: false,
			stack: '.windowPosturi'
		});

		$('.windowPosturi:last').click(function(event) {
			var widget = $(this).data('ui-draggable');
			widget._mouseStart(event);
			widget._mouseDrag(event);
			widget._mouseStop(event);
		});

		$('.windowPosturi:last')
			.resizable({
				minWidth: 275,
				minHeight: 70,
				containment: 'body',
				handles: 'n, e, s, w, ne, se, sw, nw',
				stop: function(ev, ui) {
					$(this)
						.find('.windowDinamic')
						.css(
							'max-height',
							pozitivSauZero($(this).height() - 30 - $(this).find('.windowStatic').height() - 15) + 'px'
						);
				}
			})
			.on('resize', function(e) {
				$(this)
					.find('.windowDinamic')
					.css(
						'max-height',
						pozitivSauZero($(this).height() - 30 - $(this).find('.windowStatic').height() - 15) + 'px'
					);
				e.stopPropagation();
			});

		$('.windowPosturi:last').droppable({
			greedy: true,
			drop: function(ev, ui) {
				if ($(ev.originalEvent.target).hasClass('post')) {
					var exista = 0;
					$(this).find('.postNume').each(function() {
						if ($(ev.originalEvent.target).find('.postNume').text() == $(this).text()) {
							$(this)
								.parents('.grupare')
								.find('.angajati')
								.append($(ev.originalEvent.target).parents('.grupare').find('.angajati').html());
							exista = 1;
						}
					});
					if (exista == 0)
						$(this)
							.find('.windowDinamic')
							.append('<div class="grupare">' + $(ev.originalEvent.target.parentNode).html() + '</div>');
					var handlePost = $(this).find('.post:last');
					$(this).find('.grupare:last').draggable({
						containment: 'window',
						helper: 'clone',
						handle: handlePost,
						start: function(event, ui) {
							$(this).attr('id', 'inAer');
							$(this).parents('.windowPosturi').trigger('click');
							$(ui.helper).css('min-width', $(this).width() + 'px');
						},
						stop: function(event, ui) {
							$(this).removeAttr('id');
						}
					});
					$('#inAer').remove();
					postCurent = $(ev.originalEvent.target).parents('.windowDinamic')[0];
					$(ev.originalEvent.target.parentNode).remove();
					salveazaModificariPosturi();
					postCurent = $(this).find('.windowDinamic')[0];
					salveazaModificariPosturi();
				}
			}
		});

		$('.windowPosturi:last').centrareOriz();
		$('.windowPosturi:last').centrareVert();

		if (date[graph.getSelectionCell().id]) {
			for (var post in date[graph.getSelectionCell().id]) {
				if (!date[graph.getSelectionCell().id].hasOwnProperty(post)) continue;

				$('.windowDinamic:last').append(
					'<div class="grupare"><div class="post"><i class="fa fa-briefcase"></i>&nbsp;<div class="postNume">' +
						post +
						'</div><span style="float:right;cursor:pointer" onclick="angajatNou(this);"> + Angajat nou</span><span style="float:right;cursor:pointer;margin-right:10px" onclick="modificaPost(this);">Modifica post</span><span style="float:right;cursor:pointer;margin-right: 10px" onclick="stergePost(this);"> - Inchide post  </span></div><div class="angajati"></div></div>'
				);

				var obj = date[graph.getSelectionCell().id][post];
				for (i = 0; i < obj.length; i++) {
					$('.windowDinamic:last')
						.find('.angajati:last')
						.append(
							'<div class="angajat"><i class="fa fa-user" aria-hidden="true"></i>&nbsp;<div class="angajatNume">' +
								obj[i] +
								'</div><span style="float:right;cursor:pointer" onclick="modificaAngajat(this);">Modifica</span><span style="float:right;cursor:pointer;margin-right:10px" onclick="stergeAngajat(this);"> - Sterge angajat</span></div>'
						);
				}
				grupareDraggable();
			}
		}

		$('.windowPosturi:last').trigger('click');

		$('[data-toggle="tooltipWindow"]').tooltip({ placement: 'bottom', delay: { show: 200 } });
	});

	$('#selectFont').change(function() {
		for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
			graph.getSelectionCells()[i].style += ';fontFamily=' + $(this).val();
		}
		graph.stopEditing(false);
		graph.refresh();
	});
	$('#inputFontSize').change(function() {
		for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
			graph.getSelectionCells()[i].style += ';fontSize=' + $(this).val();
		}
		graph.stopEditing(false);
		graph.refresh();
	});

	$('[data-toggle="tooltip"]').tooltip({ placement: 'left', delay: { show: 200 } });
	$('[data-toggle="tooltipMenu"]').tooltip({ placement: 'bottom', delay: { show: 200 } });
	$('[data-toggle="tooltipAdd"]').tooltip({ placement: 'right', delay: { show: 200 } });

	var colorPalette = [
		'000000',
		'FFFFFF',
		'FFDCFF',
		'D2FFA5',
		'CCFFFF',
		'006699',
		'009933',
		'CC3366',
		'f44336',
		'e91e63',
		'9c27b0',
		'673ab7',
		'3f51b5',
		'2196f3',
		'03a9f4',
		'00bcd4',
		'009688',
		'4caf50',
		'8bc34a',
		'cddc39',
		'ffeb3b',
		'ffc107',
		'ff9800',
		'ff5722',
		'795548',
		'9e9e9e',
		'607d8b'
	];
	var fontForePalette = $('.fontForePalette');
	var fontBackPalette = $('.fontBackPalette');
	var bgForePalette = $('.bgForePalette');
	var bgBackPalette = $('.bgBackPalette');

	for (var i = 0; i < colorPalette.length; i++) {
		fontForePalette.append(
			'<a href="javascript:void(0)" data-command="fontForeColor" data-value="' +
				'#' +
				colorPalette[i] +
				'" style="background-color:' +
				'#' +
				colorPalette[i] +
				';" class="palette-item"></a>'
		);
		fontBackPalette.append(
			'<a href="javascript:void(0)" data-command="fontBackColor" data-value="' +
				'#' +
				colorPalette[i] +
				'" style="background-color:' +
				'#' +
				colorPalette[i] +
				';" class="palette-item"></a>'
		);
		bgForePalette.append(
			'<a href="javascript:void(0)" data-command="bgForeColor" data-value="' +
				'#' +
				colorPalette[i] +
				'" style="background-color:' +
				'#' +
				colorPalette[i] +
				';" class="palette-item"></a>'
		);
		bgBackPalette.append(
			'<a href="javascript:void(0)" data-command="bgBackColor" data-value="' +
				'#' +
				colorPalette[i] +
				'" style="background-color:' +
				'#' +
				colorPalette[i] +
				';" class="palette-item"></a>'
		);
	}

	$('.toolbar a').click(function(e) {
		var command = $(this).data('command');
		debugger;
		if (command == 'plus') {
			$('#inputFontSize').val(parseInt($('#inputFontSize').val(), 10) + 1);
			$('#inputFontSize').trigger('change');
		} else if (command == 'minus') {
			if ($('#inputFontSize').val() != 0) $('#inputFontSize').val(parseInt($('#inputFontSize').val(), 10) - 1);
			$('#inputFontSize').trigger('change');
		} else if (command == 'fontForeColor' || command == 'fontBackColor') {
			var value = $(this).data('value');
			for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
				if (command == 'fontBackColor') graph.getSelectionCells()[i].style += ';labelBackgroundColor=' + value;
				else graph.getSelectionCells()[i].style += ';fontColor=' + value;
			}
			graph.stopEditing(false);
			graph.refresh();
		} else if (command == 'bgForeColor' || command == 'bgBackColor') {
			var value = $(this).data('value');
			for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
				if (command == 'bgBackColor') graph.getSelectionCells()[i].style += ';fillColor=' + value;
				else graph.getSelectionCells()[i].style += ';strokeColor=' + value;
			}
			graph.stopEditing(false);
			graph.refresh();
		} else {
			editor.actions[command](editor);
			if (command !== 'edit') graph.stopEditing(false);
		}
	});
	$('#verificareIerarhie').click(function() {
		debugger;
		graph.selectEdges();
		var relatii = [];
		var arce = graph.getSelectionCells();
		graph.selectVertices();
		var noduri = graph.getSelectionCells();
		graph.selectCells();
		for (i = 0; i < arce.length; i++) {
			if (arce[i].style && arce[i].style.includes('startArrow')) {
				arce[i].style = 'strokeColor=#ff0000;';
				arce.remove(arce[i]);
				i--;
			}
		}

		if (!arce.length || !noduri.length) {
			graph.refresh();
			return;
		}

		for (i = 0; i < arce.length; i++) {
			var ierarh = {};
			if (arce[i].source && arce[i].target) {
				ierarh.parinte = arce[i].source.id;
				ierarh.copil = arce[i].target.id;
			} else {
				if (arce[i].source) ierarh.parinte = arce[i].source.id;
				if (arce[i].target) ierarh.copil = arce[i].target.id;
				for (j = 0; j < noduri.length; j++) {
					if (
						noduri[j].geometry.x <= arce[i].geometry.sourcePoint.x &&
						arce[i].geometry.sourcePoint.x <= noduri[j].geometry.x + noduri[j].geometry.width &&
						(noduri[j].geometry.y <= arce[i].geometry.sourcePoint.y &&
							arce[i].geometry.sourcePoint.y <= noduri[j].geometry.y + noduri[j].geometry.height)
					) {
						ierarh.parinte = noduri[j].id;
						if (ierarh.copil) break;
					} else if (
						noduri[j].geometry.x <= arce[i].geometry.targetPoint.x &&
						arce[i].geometry.targetPoint.x <= noduri[j].geometry.x + noduri[j].geometry.width &&
						(noduri[j].geometry.y <= arce[i].geometry.targetPoint.y &&
							arce[i].geometry.targetPoint.y <= noduri[j].geometry.y + noduri[j].geometry.height)
					) {
						ierarh.copil = noduri[j].id;
						if (ierarh.parinte) break;
					}
				}
			}
			if (ierarh.copil && ierarh.parinte) {
				relatii.push(ierarh);
				arce[i].style = 'strokeColor=#000000;';
			} else {
				arce[i].style = 'strokeColor=#ff0000;';
			}
		}
		if (!relatii.length) {
			graph.refresh();
			return;
		}

		var relatii2 = {};
		for (i = 0; i < relatii.length; i++) {
			if (!relatii2[relatii[i].copil]) relatii2[relatii[i].copil] = [];
			if (!relatii2[relatii[i].parinte]) relatii2[relatii[i].parinte] = [];
			relatii2[relatii[i].copil].push(relatii[i].parinte);
		}
		console.log(relatii2);

		if (arce.length == relatii.length) {
			alertModalSucces('Organigrama indeplineste condintiile de ierarhie.');
		} else {
			alertModalEroare(
				'Exista ' +
					(arce.length - relatii.length) +
					' conexiuni care nu indeplinesc conditiile de ierarhie (conexiunile duble nu sunt luate in calcul)'
			);
		}

		graph.refresh();
	});
	$('.windowPosturi').centrareOriz();
	$('.windowPosturi').centrareVert();
	$('.windowPosturi').draggable({
		handle: '.windowHeader',
		containment: 'window',
		scroll: false,
		stack: '.windowPosturi'
	});

	//$('.windowPosturi').resizable({
	//    minWidth: 240,
	//    minHeight: 70,
	//    containment: 'body',
	//    handles: "n, e, s, w, ne, se, sw, nw"
	//}).on('resize', function (e) {
	//    $('#windowDinamic').css('max-height', ($('#windowPosturi').height() - 30 - $('#windowStatic').height() - 15) + 'px');
	//    e.stopPropagation();
	//});

	$('.mxToolbarMode').on('mouseover', function() {
		$(this).css('width', 150 * zoom / 100 + 'px');
	});

	$('#salveazaInServer').click(function() {
		$('#serverNumeFisier').val(numeFisier);
		$('#serverNumeFolder').val(folderFisier);
		$('.salveazaForm').css('display', 'block');
		$('#submitSalveazaInServer').css('display', 'inline-block');
		$('#butonIncarcaDinServer').css('display', 'none');
		$('#modalServerTitlu').text('Salveaza in Server');
		$('#modalServer').fadeIn();
		setTimeout(function() {
			$('#serverNumeFisier').focus();
		}, 1);
		modalTab($('#modalServer'));
	});
	$('#submitSalveazaInServer').click(function() {
		idFisier = $('.selectat').data('id') ? $('.selectat').data('id') : 0;
		if (idFisier == 0) {
			$('.fileBrowser').find('.fisier').each(function() {
				if (
					$('#serverNumeFisier').val() == $(this).html().split('</i>')[1].split('<span')[0] &&
					$('#serverNumeFolder').val() == $(this).data('folder')
				) {
					idFisier = $(this).data('id');
					return;
				}
			});
		}
		if (idFisier != 0) {
			$('#modalConfirmServer').fadeIn();
		} else ajaxUploadToServer();
		setNumeFisier($('#serverNumeFisier').val());
	});

	$('#submitRescrieFisier').click(function() {
		ajaxUploadToServer();
	});

	function ajaxUploadToServer() {
		$.ajax({
			type: 'POST',
			url: '/OrganigramaGrafica/Home/uploadToServer',
			data: JSON.stringify({
				numeFisier: $('#serverNumeFisier').val(),
				fisier: formeazaFisierBase64(),
				folder: $('#serverNumeFolder').val(),
				id: idFisier
			}),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			success: function(data) {
				alertModalSucces('Fisierul a fost incarcat in server!');
				$('.modal').css('display', 'none');
				fileBrowserUpdate();
			}
		});
	}

	$(document).on('mousedown', '[data-ripple]', function(e) {
		var $self = $(this);

		if ($self.is('.btn-disabled')) {
			return;
		}
		if ($self.closest('[data-ripple]')) {
			e.stopPropagation();
		}

		var initPos = $self.css('position'),
			offs = $self.offset(),
			x = e.pageX - offs.left,
			y = e.pageY - offs.top,
			dia = Math.min(this.offsetHeight, this.offsetWidth, 100), // diametru
			$ripple = $('<div/>', { class: 'ripple', appendTo: $self });

		if (!initPos || initPos === 'static') {
			$self.css({ position: 'relative' });
		}

		$('<div/>', {
			class: 'rippleWave',
			css: {
				background: $self.data('ripple'),
				width: dia,
				height: dia,
				left: x - dia / 2,
				top: y - dia / 2
			},
			appendTo: $ripple,
			one: {
				animationend: function() {
					$ripple.remove();
				}
			}
		});
	});

	$('#butonIncarcaDinServer').click(function() {
		if ($('.selectat').data('id')) {
			$.ajax({
				type: 'GET',
				url: '/OrganigramaGrafica/Home/getCodFisier',
				data: {
					id: $('.selectat').data('id')
				},
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				success: function(data) {
					idFisier = $('.selectat').data('id');
					folderFisier = $('.selectat').data('folder');
					var valori = JSON.parse(data)[0].Fisier;
					var parsed = Papa.parse(window.atob(valori), { header: true });
					var continut = parsed.data[0];
					// continut.{obiecte} - numeFisier,marPagina,modPagina,contectori,continutFisier,obiectDate

					//marime pagina
					$('#pageBackground').css(
						'width',
						continut.modPagina == 'portrait'
							? marimiPagini[continut.marPagina].w
							: marimiPagini[continut.marPagina].h
					);
					$('#pageBackground').css(
						'height',
						continut.modPagina == 'portrait'
							? marimiPagini[continut.marPagina].h
							: marimiPagini[continut.marPagina].w
					);
					graph.scrollTileSize = new mxRectangle(
						0,
						0,
						$('#pageBackground').height(),
						$('#pageBackground').width()
					);
					mxConstants.PAGE_FORMAT_A4_PORTRAIT.height = $('#pageBackground').height();
					mxConstants.PAGE_FORMAT_A4_PORTRAIT.width = $('#pageBackground').width();
					graph.pageFormat = mxConstants.PAGE_FORMAT_A4_PORTRAIT;
					graph.refresh();
					//-marime pagina

					//incarca date fisier in organigrama
					setNumeFisier(continut.numeFisier.replace('.ogg', ''));
					//document.title = numeFisier;
					pagina.marime = continut.marPagina;
					pagina.mod = continut.modPagina;
					conectori = continut.conectori;
					date = JSON.parse(continut.obiectDate);
					if (continut.defaultVertex)
						graph.stylesheet.styles.defaultVertex = JSON.parse(continut.defaultVertex);
					if (continut.defaultEdge) graph.stylesheet.styles.defaultEdge = JSON.parse(continut.defaultEdge);

					var doc = mxUtils.parseXml(continut.continutFisier);
					var node = doc.documentElement;
					editor.readGraphModel(node);
					//--

					//centreaza pagina in mijloc
					var width = $('#pageBackground').width();
					var widthContainer = $('#chart-container').find('svg:first').width();
					var widthContainer2 = $('#chart-container').width();
					var height = $('#pageBackground').height();
					var heightContainer = $('#chart-container').find('svg:first').height();
					$('#pageBackground').css('left', (widthContainer - width) / 2);
					$('#pageBackground').css('top', (heightContainer - height) / 2);
					graph.container.scrollTop = (heightContainer - height) / 2 - 40;
					graph.container.scrollLeft = (widthContainer - widthContainer2) / 2;
					//--
					undoManager.clear();

					$('.modal').css('display', 'none');
					$('#ecranBunVenit').fadeOut('slow');
				}
			});
		} else {
			alertModalEroare('Nu a fost selectat un fisier');
		}
	});

	var editId;

	$(document).on('focus', '.mxPlainTextEditor', function() {
		editId = graph.getSelectionCell().id;
	});

	$(document).on('blur', '.mxPlainTextEditor', function() {
		$('#windowPost' + editId).find('.textNav').text($('.mxPlainTextEditor').text());
	});

	$('#rezultateServer').disableSelection();
	$('#numeFisierDiv').disableSelection();
	$('#numeFolderDiv').disableSelection();
	$('.optiunibutoane').disableSelection();
	$('#editareCelula').disableSelection();
	$('.butoanestanga').disableSelection();
	$('.toolbar').disableSelection();
	$('.navbarX').disableSelection();

	$('.salveazaForm').click(function() {
		$('.selectat').removeClass('selectat');
	});
	fileBrowserUpdate();

	$(window).bind('beforeunload', function() {
		return 'Esti sigur ca vrei sa inchizi editorul? Modificarile nesalvate vor fi pierdute.';
	});

	$.fn.resizeselect = function(settings) {
		return this.each(function() {
			var arrowWidth = 40;

			$(this)
				.change(function() {
					var $this = $(this);

					// create test element
					var text = $this.find('option:selected').text();
					var $test = $('<span>').html(text);

					// add to body, get width, and get out
					$test.appendTo('body');
					var width = $test.width();
					$test.remove();

					// set select width
					$this.width(width + arrowWidth);

					// run on start
				})
				.change();
		});
	};

	$('select.resizeselect').resizeselect();

	$('#selectFontSize').change(function() {
		$('#inputFontSize').val($(this).find(':selected').val());
		$(this).val(999);
		$('#selectFontSize').blur();
		$('#inputFontSize').trigger('change');
	});

	$('#selectFontSize').hover(
		function() {
			$('#inputFontSize').css('border-color', '#58B3F0');
		},
		function() {
			$('#inputFontSize').css('border-color', '');
		}
	);
	$('#inputFontSize').hover(
		function() {
			$('#selectFontSize').css('border-color', '#58B3F0');
		},
		function() {
			$('#selectFontSize').css('border-color', '');
		}
	);
	$('#inputFontSize').keydown(function(e) {
		if (e.keyCode >= 64 || e.keyCode == 32) {
			e.preventDefault();
		} else {
			if (e.shiftKey && e.keyCode < 37 && e.keyCode > 40) e.preventDefault();
			if ($(this).val() == 0) $(this).val('');
		}
	});

	$('#btnZoomInitial').trigger('click');
	//$('#editareCelula').draggable({
	//    handle: $('#editareCelula').find('.modal-header')
	//});
	//$('#editareCelula').resizable({
	//    handles: "n, e, s, w, ne, se, sw, nw"
	//});

	$('#salveazaStilDefault').click(function() {
		graph.stylesheet.styles.defaultVertex = graph.getCellStyle(graph.getSelectionCell());

		$('#stilDefault').css('background-color', $('#inputBgColor').val());
		$('#stilDefault').css('border-color', $('#inputBorderColor').val());
		$('#stilDefault').find('.textStil').css('color', $('#inputTextColor').val());
	});
	$('#adaugaStil').click(function() {
		var gasit = 0;

		$('.lslide').each(function(index) {
			if (gasit != 0) return;

			debugger;

			if (
				$(this).find('.cutieStil').css('background-color') == $('#inputBgColor').val() &&
				$(this).find('.cutieStil').css('border-color') == $('#inputBorderColor').val() &&
				$(this).find('.cutieStil').find('.textStil').css('color') == $('#inputTextColor').val()
			)
				gasit = index + 1;
		});

		if (gasit == 0) {
			$('#listaStiluri').append(
				'<li class="lslide"> \
                                        <div class="cutieStil" style="background-color:' +
					$('#inputBgColor').val() +
					';border:1px solid ' +
					$('#inputBorderColor').val() +
					'"> \
                                            <span class="textStil" style="color:' +
					$('#inputTextColor').val() +
					'">T</span> \
                                        </div> \
                                      </li>'
			);
			slider.refresh();
			slider.goToSlide($('.lslide').length - 4);
		} else {
			if (gasit < $('.lslide').length - 3) slider.goToSlide(gasit - 1);
			else slider.goToSlide($('.lslide').length - 4);
		}
	});
	$('#copiazaStil').click(function() {
		stilCopiat = graph.getSelectionCell().style;
	});
	$('#lipesteStil').click(function() {
		if (stilCopiat) {
			graph.getModel().setStyle(graph.getSelectionCell(), stilCopiat);
			for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
				graph.getModel().setStyle(graph.getSelectionCells()[i], stilCopiat);
			}
		}
	});

	$('.stilColorInput').spectrum({
		preferredFormat: 'rgb',
		showPalette: true,
		hideAfterPaletteSelect: true,
		showInitial: true,
		showInput: true,
		change: function(color) {
			debugger;
			if (this.id.indexOf('Bg') !== -1) {
				//graph.getCellStyle(graph.getSelectionCell()).fillColor = color.toString();
				for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
					//graph.getSelectionCells()[i].style += ";fillColor=" +
					graph
						.getModel()
						.setStyle(
							graph.getSelectionCells()[i],
							graph.getSelectionCells()[i].style + ';fillColor=' + color.toString()
						);
				}
			}
			if (this.id.indexOf('Text') !== -1) {
				for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
					//graph.getSelectionCells()[i].style += ";fontColor=" + color.toString();
					graph
						.getModel()
						.setStyle(
							graph.getSelectionCells()[i],
							graph.getSelectionCells()[i].style + ';fontColor=' + color.toString()
						);
				}
			}
			if (this.id.indexOf('Border') !== -1) {
				for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
					//graph.getSelectionCells()[i].style += ";strokeColor=" + color.toString();
					graph
						.getModel()
						.setStyle(
							graph.getSelectionCells()[i],
							graph.getSelectionCells()[i].style + ';strokeColor=' + color.toString()
						);
				}
			}
			graph.stopEditing(false);
			graph.refresh();
		},
		palette: [
			[
				'rgb(1, 1, 1)',
				'rgb(30,30,30)',
				'rgb(67, 67, 67)',
				'rgb(80,80,80)',
				'rgb(102, 102, 102)',
				'rgb(130,130,130)',
				'rgb(170,170,170)',
				'rgb(204, 204, 204)',
				'rgb(217, 217, 217)',
				'rgb(255, 255, 255)'
			],
			[
				'rgb(152, 0, 0)',
				'rgb(255, 0, 0)',
				'rgb(255, 153, 0)',
				'rgb(255, 255, 0)',
				'rgb(0, 255, 0)',
				'rgb(0, 255, 255)',
				'rgb(74, 134, 232)',
				'rgb(0, 0, 255)',
				'rgb(153, 0, 255)',
				'rgb(255, 0, 255)'
			],
			[
				'rgb(230, 184, 175)',
				'rgb(244, 204, 204)',
				'rgb(252, 229, 205)',
				'rgb(255, 242, 204)',
				'rgb(217, 234, 211)',
				'rgb(208, 224, 227)',
				'rgb(201, 218, 248)',
				'rgb(207, 226, 243)',
				'rgb(217, 210, 233)',
				'rgb(234, 209, 220)'
			],
			[
				'rgb(221, 126, 107)',
				'rgb(234, 153, 153)',
				'rgb(249, 203, 156)',
				'rgb(255, 229, 153)',
				'rgb(182, 215, 168)',
				'rgb(162, 196, 201)',
				'rgb(164, 194, 244)',
				'rgb(159, 197, 232)',
				'rgb(180, 167, 214)',
				'rgb(213, 166, 189)'
			],
			[
				'rgb(204, 65, 37)',
				'rgb(224, 102, 102)',
				'rgb(246, 178, 107)',
				'rgb(255, 217, 102)',
				'rgb(147, 196, 125)',
				'rgb(118, 165, 175)',
				'rgb(109, 158, 235)',
				'rgb(111, 168, 220)',
				'rgb(142, 124, 195)',
				'rgb(194, 123, 160)'
			],
			[
				'rgb(166, 28, 0)',
				'rgb(204, 0, 0)',
				'rgb(230, 145, 56)',
				'rgb(241, 194, 50)',
				'rgb(106, 168, 79)',
				'rgb(69, 129, 142)',
				'rgb(60, 120, 216)',
				'rgb(61, 133, 198)',
				'rgb(103, 78, 167)',
				'rgb(166, 77, 121)'
			],
			[
				'rgb(91, 15, 0)',
				'rgb(102, 0, 0)',
				'rgb(120, 63, 4)',
				'rgb(127, 96, 0)',
				'rgb(39, 78, 19)',
				'rgb(12, 52, 61)',
				'rgb(28, 69, 135)',
				'rgb(7, 55, 99)',
				'rgb(32, 18, 77)',
				'rgb(76, 17, 48)'
			]
		]
	});

	$(document).on('click', '.cutieStil', function() {
		var bgColor = $(this).css('background-color');
		var borderColor = $(this).css('border-top-color');
		var textColor = $(this).find('.textStil').css('color');

		$('#inputBgColor').spectrum('set', bgColor);
		$('#inputBorderColor').spectrum('set', borderColor);
		$('#inputTextColor').spectrum('set', textColor);

		for (var i = 0, len = graph.getSelectionCells().length; i < len; i++) {
			graph
				.getModel()
				.setStyle(
					graph.getSelectionCells()[i],
					graph.getSelectionCells()[i].style +
						';fillColor=' +
						bgColor +
						';strokeColor=' +
						borderColor +
						';fontColor=' +
						textColor
				);
		}
	});
	//var slider
	slider = $('#listaStiluri').lightSlider({
		item: 4,
		loop: false,
		slideMove: 1,
		autoWidth: true,
		enableDrag: false,
		controls: false,
		pager: false,
		slideMargin: 7,
		easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
		speed: 100
	});
	$('#controlDreapta').click(function() {
		slider.goToNextSlide();
	});
	$('#controlStanga').click(function() {
		slider.goToPrevSlide();
	});

	$('#inputBgColor').spectrum('set', '#ffffff');
	$('#inputBorderColor').spectrum('set', '#000000');
	$('#inputTextColor').spectrum('set', '#000000');

	$('#numeProiect').val('Organigrama Grafica ' + new Date().toJSON().slice(0, 10));
	$('#creeazaOrganigrama').trigger('click');
});
