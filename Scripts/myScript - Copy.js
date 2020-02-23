//#region variabileGlobale

//definire variabile globale
var hierarchy, modificariClase = '', claseModificate, ultimeleActiuni = [],
    valoriModificate = [], relatie, new_stylesheet, textFile = null, fullScreen = 0, activ = 0, globalID;
var instance;
var hexDigits = new Array;
var clipboard;
("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

//#endregion variabileGlobale

jQuery(function() {
    jQuery.fn.myDraggableSetup = function myDroppableSetup() {
        this.each(function () {
            $(this).draggable({
                containment: ".orgchart",
                stop: function (event, ui) {
                    instance.repaintEverything();
                }
            });
            $(this).addClass("move");
            $(this).on("drag", function (event, ui) {
                instance.repaintEverything();
            });
        });
        }
});

//#region funcImportante

var rotation = 0;

var set_position = function (width, height) {
    $('.ui-resizable-n').css('left', (width / 2 - 4) + 'px');
    $('.ui-resizable-e').css('top', (height / 2 - 4) + 'px');
    $('.ui-resizable-s').css('left', (width / 2 - 4) + 'px');
    $('.ui-resizable-w').css('top', (height / 2 - 4) + 'px');
};

jQuery.fn.rotate = function (degrees) {
    $(this).css({ 'transform': 'rotate(' + degrees + 'deg)' });
    return $(this);
};

function getRotationDegrees(obj) {
    var matrix = obj.css("-webkit-transform") ||
    obj.css("-moz-transform") ||
    obj.css("-ms-transform") ||
    obj.css("-o-transform") ||
    obj.css("transform");
    if (matrix !== 'none') {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    } else { var angle = 0; }
    return (angle < 0) ? angle + 360 : angle;
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}//transforma o culoare RGB in Hex

function hex(x) {
    return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}//subfunctie rgb2hex

function salvIerarhieUndo() {
    hierarchy = $('#chart-container').orgchart('getHierarchy');
}//salveaza ierarhia orgchartului pentru functia Undo

function isInt(value) {
    return !isNaN(value) &&
           parseInt(Number(value)) == value &&
           !isNaN(parseInt(value, 10));
}//verifica daca o variabila este int

function editareNod(id, nume, continut, clasa) {
    var obj = $('#' + id);
    obj.children('div').first().empty();
    obj.children('div').first().append(nume);
    obj.children('div').last().empty();
    obj.children('div').last().append(continut);
    if (clasa) obj.removeClass(obj.attr('class').replace('node', '').replace('focused', '').trim()).addClass(clasa);
}//editeaza un nod din orgchart

function modificariText() {
    var $this = $('.textbox').last();
    $($this).resizable({
        handles: "all",
        containment: ".orgchart",
        create: function (event, ui) {
            //inspect(event.target, {'onlykey':true});

            var width = $(event.target).width();
            var height = $(event.target).height();
            set_position(width, height);
        },
        resize: function (event, ui) {
            var width = $(event.target).width();
            var height = $(event.target).height();
            set_position(width, height);
        }
    });

    $($this).keydown(function (event) {
        if (event.keyCode == 8 && $(this).text() == "")
            if (confirm('Esti sigur ca vrei sa stergi aceasta caseta de text ?')) {
                this.remove();
            }
    });
    $($this).resizable("option", "disabled", true);
    $($this).addClass("move");
    $($this).draggable({
        containment: ".orgchart"
    })
    .click(function () {
        if ( $(this).is('.ui-draggable-dragging') ) {
            return;
        }
        $(window).unbind("mousedown mousemove");
        $(this).draggable("option", "disabled", true);
        $(this).removeClass("move");
        $(this).attr('contenteditable', 'true');
        if ($($this).is(":focus"))
        {
            set_position($($this).width(), $($this).height());
            $(this).resizable("option", "disabled", false);
        }
    })
    .blur(function(){
        $(this).draggable('option', 'disabled', false);
        $(this).addClass("move");
        $(this).resizable("option", "disabled", true);
        $(this).attr('contenteditable', 'false');
        $(window).unbind("mousedown mousemove").on("mousedown", function () {
            $(window).on("mousemove", function (e) {
                e.preventDefault();
            });
        });
    });
}//initializare functii jquery pentru textul din pagina

function undo(valoare) {
    var str;
    if ($('.orgchart').html().indexOf('<div class="window ui-draggable" style="display:') !== -1) {
        var sstr = $('.orgchart').html();
        str = sstr.substring($('.orgchart').html().indexOf('<div class="window ui-draggable" style="display:'), $('.orgchart').html().lastIndexOf(''));
    }
    $('.orgchart').remove();
    creareOrganigrama(valoare);
    if (str !== undefined) {
        $('.orgchart').append(str);
        modificariText();
    }
}//functie Undo a orgchart

function stergeTextBoxuri() {
    $('#selected-node').val('');
    $('#selected-content').val('');
    $('#selected-Clasa').val('');
    $('#selected-id').val('');
    $('#selected-node').data('node', null);
}//clear textboxuri

function deleteNode(node) {
    $(node).remove();
    instance.deleteEndpoint(node.id + "BottomCenter");
    instance.deleteEndpoint(node.id + "TopCenter");
    instance.deleteEndpoint(node.id + [0, 0.75, -1, 0]);
    instance.deleteEndpoint(node.id + [1, 0.75, 1, 0]);
    instance.deleteEndpoint(node.id + [0, 0.25, -1, 0]);
    instance.deleteEndpoint(node.id + [1, 0.25, 1, 0]);
    nodPrecedent = null;
}

function makeNodeDraggable($node) {
    $node.on('click', function (event) {
        if (!$(event.target).is('.edge')) {
            if (nodPrecedent && nodPrecedent !== this && !event.shiftKey) {
                $(nodPrecedent).resizable("option", "disabled", true);
                $(nodPrecedent).draggable("option", "disabled", false);
                $(nodPrecedent).addClass("move");
                $(nodPrecedent).removeClass("nodeFocused");
            }
            nodPrecedent = this;
            $(nodPrecedent).addClass("nodeFocused");
            if (!$(this).hasClass("ui-resizable")) {
                $(this).resizable({
                    handles: "all",
                    containment: ".orgchart",
                    create: function (event, ui) {
                        //inspect(event.target, {'onlykey':true});

                        var width = $(event.target).width();
                        var height = $(event.target).height();
                        set_position(width, height);
                    },
                    resize: function (event, ui) {
                        var width = $(event.target).width();
                        var height = $(event.target).height();
                        set_position(width, height);
                        if (instance) instance.repaintEverything();
                    }
                });
            }
            else {
                set_position($(this).width(), $(this).height());
                $(this).resizable("option", "disabled", false);
            }
            $(window).unbind("click").click(function (event) {
                if (!($(event.target).parents('.node')[0] || $(event.target).parents('.toolbar')[0] || $(event.target).is($('.toolbar'))) && event.originalEvent.target !== $('.orgchart')[0]) {
                    $('[contenteditable]').blur();
                    $('.node').blur();
                    $(window).unbind("mousedown mousemove").on("mousedown", function () {
                        $(window).on("mousemove", function (e) {
                            e.preventDefault();
                        });
                    });
                    $(nodPrecedent).resizable("option", "disabled", true);
                    $(nodPrecedent).draggable("option", "disabled", false);
                    $(nodPrecedent).removeClass("nodeFocused");
                    if (!$(nodPrecedent).hasClass("move")) $(nodPrecedent).addClass("move");
                    $(window).unbind('click');
                }
            });
        }
    });
    $node.dblclick(function () {
        $(window).unbind("mousedown mousemove");
        $(nodPrecedent).draggable("option", "disabled", true);
        $(nodPrecedent).removeClass("move");
    });
}

var nodPrecedent = undefined;

function creareOrganigrama(dataS, div) {
    $('#chart-container').orgchart({
        'data': dataS,
        'depth': 999,
        'nodeContent': 'title',
        'toggleSiblingsResp': false,
        'dropCriteria': function ($draggedNode, $dragZone, $dropZone) {
            return true;
        },
        'createNode': function ($node) {
            makeNodeDraggable($node);
        }
    });
    $('.orgchart').addClass('noncollapsable');
    $('.pagina').removeClass('overflowHidden');
    activ = 0;
    jsPlumbTest();
    $('.orgchart').mousedown(function (e) {
        $('.big-ghost').each(function () {
            $(this).remove();
        });
        $('.selectat').removeClass("selectat");
        if (e.target === this) {
        $(".ghost-select").addClass("ghost-active");
        $(".ghost-select").css({
            'left': e.pageX,
            'top': e.pageY
        });
        initialW = e.pageX;
        initialH = e.pageY;

        $(document).bind("mouseup", selectElements);
        $(document).bind("mousemove", openSelector);
        }
    });

    $.contextMenu({
        selector: '.node',
        zIndex: 101,
        callback: function (key, options) {
            switch (key) {
                case "cut":
                    var initID = this[0].id;
                    this[0].id = ++globalID;
                    clipboard = this[0].outerHTML;
                    this[0].id = initID;
                    deleteNode(this[0]);
                    break;
                case "copy":
                    debugger;
                    var initID = this[0].id;
                    this[0].id = ++globalID;
                    clipboard = this[0].outerHTML;
                    this[0].id = initID;
                    break;
                case "paste":
                    debugger;
                    $('.orgchart').prepend(clipboard);
                    $('#' + globalID).removeClass("jtk-connected").removeClass("jtk-endpoint-anchor");
                    _addEndpoints(globalID, ["BottomCenter", [0, 0.75, -1, 0], [1, 0.75, 1, 0]], ["TopCenter", [0, 0.25, -1, 0], [1, 0.25, 1, 0]]);
                    instance.connect({ uuids: [this[0].id + "BottomCenter", globalID + "TopCenter"], editable: true });
                    $('#' + globalID).myDraggableSetup();
                    makeNodeDraggable($('#' + globalID));
                    globalID++;
                    break;
                case "delete":
                    deleteNode(this[0]);
                    break;
                case "radacina":
                    $(this[0]).removeClass("radacina tulpina frunza default").addClass("radacina");
                    break;
                case "tulpina":
                    $(this[0]).removeClass("radacina tulpina frunza default").addClass("tulpina");
                    break;
                case "frunza":
                    $(this[0]).removeClass("radacina tulpina frunza default").addClass("frunza");
                    break;
                case "normal":
                    $(this[0]).removeClass("radacina tulpina frunza default").addClass("default");
                    break;
            }
        },
        items: {
            "edit": {
                name: "Schimba tipul elementului",
                "items": {
                    "radacina": { "name": "Radacina" },
                    "tulpina": { "name": "Tulpina" },
                    "frunza": { "name": "Frunza" },
                    "normal": { "name": "Normal" }
                }
            },
            "cut": { name: "Cut" },
            "copy": { name: "Copy" },
            "paste": {
                name: "Paste"
                , disabled: function () {
                    if (clipboard) return false;
                    return true;
                }
            },
            "delete": { name: "Sterge elementul" },
            "sep1": "---------",
            "delete2": {
                name: "Sterge toate legaturile elementului"
            }
        }
    });

    $.contextMenu({
        selector: '.orgchart',
        zIndex: 101,
        callback: function (key, options) {
            var m = "clicked: " + key;
            window.console && console.log(m) || alert(m);
        },
        items: {
            "paste": {
                name: "Paste element"
            },
            "sep1": "---------",
            "save": { name: "Salveaza organigrama" },
            "load": { name: "Incarca organigrama" },
            "add": { name: "Adauga o pagina noua" },
            "size": { name: "Marime organigrama" },
            "margins": { name: "Margini organigrama" }
        }
    });

    //$('.context-menu-one').on('click', function (e) {
    //    console.log('clicked', this);
    //});
    
    globalID = 7;

    $('.node').droppable({
        drop: function (event, ui) {
            if (!($(event.toElement).parents('div.node')[0] || $(event.toElement).is('div.textbox') || $(event.toElement).is('#big-ghost'))) {
                globalID++;
                $('.orgchart').prepend('<div id="' + globalID + '" class="node ' + $(event.toElement).parent().attr('class').split(' ')[1] + '"><div class="title" contenteditable spellcheck="false">Titlu</div><div class="content" contenteditable spellcheck="false">Continut</div></div>');

                $('#' + globalID).css("left", $(event.target).position().left + Math.floor($(event.target).width() / 2) - Math.floor($('#' + globalID).width() / 2));
                $('#' + globalID).css("top", $(event.target).position().top+75);
                $('#' + globalID).css("position", "absolute");
                $('#' + globalID).addClass("move");
                $('.lines').css("visibility", "hidden");
                _addEndpoints($('#' + globalID)[0].id, ["BottomCenter", [0, 0.75, -1, 0], [1, 0.75, 1, 0]], ["TopCenter", [0, 0.25, -1, 0], [1, 0.25, 1, 0]]);
                $('.node').draggable({ containment: ".orgchart" });
                instance.connect({ uuids: [$(event.target)[0].id + "BottomCenter", globalID + "TopCenter"], editable: true });
                $('.node').off("drag").on("drag", function (event, ui) {
                    instance.repaintEverything();
                });
                nodeDroppable();
            }
        }
    });
    $('.orgchart').droppable({
        drop: function (event, ui) {
            if (!($(event.toElement).parents('div.node')[0] || $(event.toElement).is('div.textbox') || $(event.toElement).is('#big-ghost') || $(event.toElement).is('div.node'))) {
                globalID++;
                $('.orgchart').prepend('<div id="' + globalID + '" class="node ' + $(event.toElement).parent().attr('class').split(' ')[1] + '"><div class="title" contenteditable spellcheck="false">Titlu</div><div class="content" contenteditable spellcheck="false">Continut</div></div>');
                console.log(event);
                console.log(ui);
                $('#' + globalID).css("left", event.clientX - $('.orgchart').position().left - $('#chart-container').position().left);
                $('#' + globalID).css("top", event.clientY - $('.orgchart').position().top - $('#chart-container').position().top);
                $('#' + globalID).css("position", "absolute");
                $('#' + globalID).addClass("move");
                _addEndpoints($('#' + globalID)[0].id, ["BottomCenter", [0, 0.75, -1, 0], [1, 0.75, 1, 0]], ["TopCenter", [0, 0.25, -1, 0], [1, 0.25, 1, 0]]);
                $('#' + globalID).myDraggableSetup();
                makeNodeDraggable($('#' + globalID));
            }
        }
    });

}//creaza organigrama

function nodeDroppable ()
{
    $('#' + globalID).droppable({
        drop: function (event, ui) {
            if (!($(event.toElement).parents('div.node')[0] || $(event.toElement).is('div.textbox') || $(event.toElement).is('#big-ghost'))) {
                var children = [
                    {
                        "id": ++globalID,
                        "name": "item",
                        "title": "continut",
                        "relationship": "100",                        
                        "className": $(event.toElement).parent().attr('class').split(' ')[1]
                    }
                ]
                $('.orgchart').prepend('<div class="node ' + $(event.toElement).parent().attr('class').split(' ')[1] + '" id="' + globalID + '"><div class="title" contenteditable spellcheck="false">Titlu</div><div class="content" contenteditable spellcheck="false">Continut</div></div>');

                $('#' + globalID).css("left", $(event.target).position().left + Math.floor($(event.target).width() / 2) - Math.floor($('#' + globalID).width() / 2));
                $('#' + globalID).css("top", $(event.target).position().top + 75);
                $('#' + globalID).css("position", "absolute");
                $('#' + globalID).addClass("move");
                $('.lines').css("visibility", "hidden");
                _addEndpoints($('#' + globalID)[0].id, ["BottomCenter"], ["TopCenter"]);
                $('.node').draggable({ containment: ".orgchart" });
                instance.connect({ uuids: [$(event.target)[0].id + "BottomCenter", globalID + "TopCenter"], editable: true });
                $('.node').off("drag").on("drag", function (event, ui) {
                    instance.repaintEverything();
                });
                nodeDroppable();
            }
        }
    });
}

function selectElements(e) {
    $(document).unbind("mousemove", openSelector);
    $(document).unbind("mouseup", selectElements);
    $(nodPrecedent).resizable("option", "disabled", true);
    $(nodPrecedent).removeClass("nodeFocused");
    var maxX = 0;
    var minX = 5000;
    var maxY = 0;
    var minY = 5000;
    var totalElements = 0;
    var elementArr = new Array();
    $(".node").each(function () {
        var aElem = $(".ghost-select");
        var bElem = $(this);
        var result = doObjectsCollide(aElem, bElem);


        if (result == true) {
            var aElemPos = bElem.offset();
            var bElemPos = bElem.offset();
            var aW = bElem.width();
            var aH = bElem.height();
            var bW = bElem.width();
            var bH = bElem.height();

            var coords = checkMaxMinPos(aElemPos, bElemPos, aW, aH, bW, bH, maxX, minX, maxY, minY);
            maxX = coords.maxX;
            minX = coords.minX;
            maxY = coords.maxY;
            minY = coords.minY;
            var parent = bElem.parent();

            //console.log(aElem, bElem,maxX, minX, maxY,minY);
            if (bElem.css("left") === "auto" && bElem.css("top") === "auto") {
                bElem.css({
                    'left': parent.css('left'),
                    'top': parent.css('top')
                });
            }
            $("body").append("<div id='big-ghost' class='big-ghost' x='" + Number(minX - 20) + "' y='" + Number(minY - 10) + "'></div>");

            $("#big-ghost").css({
                'width': maxX + 10 - minX,
                'height': maxY + 5 - minY,
                'top': minY - 2,
                'left': minX - 5
            });

            $("#big-ghost").addClass("move");

            $(this).addClass('selectat');
        }
    });

    $(".ghost-select").removeClass("ghost-active");
    $(".ghost-select").width(0).height(0);
    $('#big-ghost').draggable({
       stop: function (event, ui) {
            $('.selectat').each(function (index) {
                //left = $(this).position().left + $(this).position().left - $('#big-ghost').position().left;
                //left = $('#big-ghost').position().left + 5;
                //top = $('#big-ghost').position().left + 2;
                $(this).css("left", $('#big-ghost').position().left - minX + $(this).position().left + 5);
                $(this).css("top", $('#big-ghost').position().top - minY + $(this).position().top + 2);
                instance.repaintEverything();
            });
            minX = $('#big-ghost').position().left + 5;
            minY = $('#big-ghost').position().top + 2;
        },
        containment: '.orgchart'
    });

    //$('#big-ghost').draggable();

    ////////////////////////////////////////////////

}

function openSelector(e) {
    var w = Math.abs(initialW - e.pageX);
    var h = Math.abs(initialH - e.pageY);

    $(".ghost-select").css({
        'width': w,
        'height': h
    });
    if (e.pageX <= initialW && e.pageY >= initialH) {
        $(".ghost-select").css({
            'left': e.pageX
        });
    } else if (e.pageY <= initialH && e.pageX >= initialW) {
        $(".ghost-select").css({
            'top': e.pageY
        });
    } else if (e.pageY < initialH && e.pageX < initialW) {
        $(".ghost-select").css({
            'left': e.pageX,
            "top": e.pageY
        });
    }
}


function doObjectsCollide(a, b) { // a and b are your objects
    //console.log(a.offset().top,a.position().top, b.position().top, a.width(),a.height(), b.width(),b.height());
    var aTop = a.offset().top;
    var aLeft = a.offset().left;
    var bTop = b.offset().top;
    var bLeft = b.offset().left;

    return !(
        ((aTop + a.height()) < (bTop)) ||
        (aTop > (bTop + b.height())) ||
        ((aLeft + a.width()) < bLeft) ||
        (aLeft > (bLeft + b.width()))
    );
}

function checkMaxMinPos(a, b, aW, aH, bW, bH, maxX, minX, maxY, minY) {
    'use strict';

    if (a.left < b.left) {
        if (a.left < minX) {
            minX = a.left;
        }
    } else {
        if (b.left < minX) {
            minX = b.left;
        }
    }

    if (a.left + aW > b.left + bW) {
        if (a.left > maxX) {
            maxX = a.left + aW;
        }
    } else {
        if (b.left + bW > maxX) {
            maxX = b.left + bW;
        }
    }
    ////////////////////////////////
    if (a.top < b.top) {
        if (a.top < minY) {
            minY = a.top;
        }
    } else {
        if (b.top < minY) {
            minY = b.top;
        }
    }

    if (a.top + aH > b.top + bH) {
        if (a.top > maxY) {
            maxY = a.top + aH;
        }
    } else {
        if (b.top + bH > maxY) {
            maxY = b.top + bH;
        }
    }

    return {
        'maxX': maxX,
        'minX': minX,
        'maxY': maxY,
        'minY': minY
    };
}

function readSingleFile(evt) {
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function (e) {
            var contents = e.target.result;
            var data = JSON.parse(contents.split('~~!!^_^TEXT DESPARTITOR^_^!!~~')[0]);
            $('.orgchart').remove();
            creareOrganigrama(data);
            modificariClase = contents.split('~~!!^_^TEXT DESPARTITOR^_^!!~~')[1];
            claseModificate.html(modificariClase);
        };
        r.readAsText(f);
    } else {
        //alert("Nu s-a putut incarca fisierul.");
        $('#pEroare').text("Nu s-a putut incarca fisierul.");
        $('#modalEroare').fadeIn();
        setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
    }
}//incarca fisier

function schimbaPrevCSS() {
    new_stylesheet.html('.testTitle{background-color:' + $('#culoareBGS').val() + ';height:' + $('#inaltimeS').val() + ';line-height:' + $('#inaltimeS').val() + ';width:' + $('#latimeS').val() +
        ';color:' + $('#culoareFontS').val() + ';font-size:' + $('#marimeFontS').val() + ';font-family:' + $('#textFontS').val() + ';' +
        ($('#boldFontS').is(':checked') ? 'font-weight:bold;' : '') + ($('#italicFontS').is(':checked') ? 'font-style: italic;' : '') +
        ($('#stangaFontS').is(':checked') ? 'text-align:left;' : '') + ($('#centruFontS').is(':checked') ? 'text-align:center;' : '') + ($('#dreaptaFontS').is(':checked') ? 'text-align:right;' : '') + '}' +
        '.testContent{background-color:' + $('#culoareBGI').val() + ';height:' + $('#inaltimeI').val() + ';line-height:' + $('#inaltimeI').val() + ';width:' + $('#latimeI').val() +
        ';color:' + $('#culoareFontI').val() + ';font-size:' + $('#marimeFontI').val() + ';font-family:' + $('#textFontI').val() + ';' + 'border:1px solid ' + $('#culoareBI').val() + ';' +
        ($('#boldFontI').is(':checked') ? 'font-weight:bold;' : '') + ($('#italicFontI').is(':checked') ? 'font-style: italic;' : '') +
        ($('#stangaFontI').is(':checked') ? 'text-align:left;' : '') + ($('#centruFontI').is(':checked') ? 'text-align:center;' : '') + ($('#dreaptaFontI').is(':checked') ? 'text-align:right;' : '') + '}');
}//schimba CSS-ul nodului preview din modalul editare grafica

function noduriDubluClick() {
    $(".node").dblclick(function () {
        //FUNCTIE DUBLU CLICK PE UN NOD
        //alert("Functie dublu click neimplementata");
        $('#modalEroare').fadeIn();
        setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
    });
}//dublu click nod

function zoomPan() {
    var $chart = $('.orgchart');
    $chart.on('mousedown', function (e) {
        var $this = $(this);
        if ($(e.target).closest('.node').length) {
            $this.data('panning', false);
            return;
        } else {
            $this.css('cursor', 'move').data('panning', true);
        }
        var lastX = 0;
        var lastY = 0;
        var lastTf = $this.css('transform');
        if (lastTf !== 'none') {
            var temp = lastTf.split(',');
            if (lastTf.indexOf('3d') === -1) {
                lastX = parseInt(temp[4]);
                lastY = parseInt(temp[5]);
            } else {
                lastX = parseInt(temp[12]);
                lastY = parseInt(temp[13]);
            }
        }
        var startX = e.pageX - lastX;
        var startY = e.pageY - lastY;

        $(document).on('mousemove', function (ev) {
            var newX = ev.pageX - startX;
            var newY = ev.pageY - startY;
            var lastTf = $this.css('transform');
            if (lastTf === 'none') {
                if (lastTf.indexOf('3d') === -1) {
                    $this.css('transform', 'matrix(1, 0, 0, 1, ' + newX + ', ' + newY + ')');
                } else {
                    $this.css('transform', 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ' + newX + ', ' + newY + ', 0, 1)');
                }
            } else {
                var matrix = lastTf.split(',');
                if (lastTf.indexOf('3d') === -1) {
                    matrix[4] = ' ' + newX;
                    matrix[5] = ' ' + newY + ')';
                } else {
                    matrix[12] = ' ' + newX;
                    matrix[13] = ' ' + newY;
                }
                $this.css('transform', matrix.join(','));
            }
        });
    });
    $(document).on('mouseup', function () {
        if ($chart.data('panning')) {
            $chart.css('cursor', 'default');
            $(this).off('mousemove');
        }
    });
    $chart.on('wheel', function (event) {
        event.preventDefault();
        var lastTf = $chart.css('transform');
        var newScale = 1 + (event.originalEvent.deltaY > 0 ? -0.2 : 0.2);
        if (lastTf === 'none') {
            $chart.css('transform', 'scale(' + newScale + ',' + newScale + ')');
        } else {
            if (lastTf.indexOf('3d') === -1) {
                $chart.css('transform', lastTf + ' scale(' + newScale + ',' + newScale + ')');
            } else {
                $chart.css('transform', lastTf + ' scale3d(' + newScale + ',' + newScale + ', 1)');
            }
        }
    });
}//adauga zoom+pan la orgchart

function zoomPanCancel() {
    var $chart = $('.orgchart');
    $chart.off('mousedown');
    $chart.off('mousemove');
    $chart.off('mouseup');
    $chart.off('wheel');
    $chart.css('transform', 'initial');
}//dezactiveaza zoom+pan

function orgNou() {
    $('#ecranBunVenit').fadeOut("slow");
    $('.orgchart').remove();
    var data = {
        'id': '1',
        'name': 'Entitate radacina',
        'title': 'NPP / NTP',
        'className': 'radacina',
        'children': [
          {
              'id': '2',
              'name': 'Entitate tulpina 1', 'title': 'NPP / NTP',
              'className': 'tulpina'
          },
          {
              'id': '3',
              'name': 'Entitate tulpina 2', 'title': 'NPP / NTP',
              'className': 'tulpina',
              'children': [
                {
                    'id': '6',
                    'name': 'Entitate frunza 1', 'title': 'NPP / NTP',
                    'className': 'frunza'
                },
                {
                    'id': '7',
                    'name': 'Entitate frunza 2', 'title': 'NPP / NTP',
                    'className': 'frunza'
                }
              ]
          },
          {
              'id': '4',
              'name': 'Entitate tulpina 3', 'title': 'NPP / NTP',
              'className': 'tulpina'
          },
          {
              'id': '5',
              'name': 'Entitate tulpina 4', 'title': 'NPP / NTP',
              'className': 'tulpina'
          }
        ]
    };
    creareOrganigrama(data);
    modificariClase = '';
    claseModificate.html(modificariClase);
    hierarchy = $('#chart-container').orgchart('getHierarchy');
    $('a').removeClass('activ');
}//buton organigrama noua template simplu

//#endregion funcImportante

//#region jquery

$(function () { //jquery functie pageload

    $(window).off("mousedown mousemove").on("mousedown mousemove", function (e) {
        e.preventDefault();
    });


    $('.toolbar').css("padding-left", $('.butoanestanga').css("width"));
    $('.toolbar').css("padding-right", $('.optiunibutoane').css("width"));
    $(window).on('resize', function () {
        $('.toolbar').css("padding-left", $('.butoanestanga').css("width"));
        $('.toolbar').css("padding-right", $('.optiunibutoane').css("width"));
        $('.big-ghost').each(function () {
            $(this).remove();
        });
    });

    $('.toolbar').bind('mousedown', function (e) {
        e.preventDefault();
    });

    $("head").append('<style type="text/css"></style>');
    new_stylesheet = $("head").children(':last');
    $("head").append('<style type="text/css"></style>');
    claseModificate = $("head").children(':last');

    $('input[name="chart-state"]').on('click', function () {
        $('#edit-panel, .orgchart').toggleClass('view-state');
    });

    $('input[name="node-type"]').on('click', function () {
        var $this = $(this);
        if ($this.val() === 'parent') {
            $('#edit-panel').addClass('edit-parent-node');
            $('#new-nodelist').children(':gt(0)').remove();
        } else {
            $('#edit-panel').removeClass('edit-parent-node');
        }
    });

    $('#btn-add-input').on('click', function () {
        $('#new-nodelist').append('<li><input type="text" class="new-node"></li>');
    });

    $('#btn-remove-input').on('click', function () {
        var inputs = $('#new-nodelist').children('li');
        if (inputs.length > 1) {
            inputs.last().remove();
        }
    });

    $('#btn-add-nodes').on('click', function () {
        var $chartContainer = $('#chart-container');
        var nodeVals = [];
        var continut = document.getElementById("continut-input").value;
        var id = Math.floor((Math.random() * 1000) + 1);//se genereaza un ID random
        var clasa = document.getElementById("clasa-input").value;
        $('#new-nodelist').find('.new-node').each(function (index, item) {
            var validVal = item.value.trim();
            if (validVal.length) {
                nodeVals.push(validVal);
            }
        });
        var $node = $('#selected-node').data('node');
        if (!nodeVals.length) {
            //alert('Nu s-au intros valori pentru nodul nou');
            $('#pEroare').text('Nu s-au intros valori pentru nodul nou');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
            return;
        }
        if (relatie == 2) {//adauga parintele principal al organgramei
            hierarchy = $('#chart-container').orgchart('getHierarchy');
            ultimeleActiuni.push('adaugare-parinte');
            valoriModificate.push(hierarchy);
            $chartContainer.orgchart('addParent', $chartContainer.find('.node:first'), { 'id': id, 'name': nodeVals[0], 'title': continut, 'className': clasa });
        } else if (relatie == 1) {//adauga un frate la nodul selectat
            ultimeleActiuni.push('adaugare');
            valoriModificate.push(id);
            $chartContainer.orgchart('addSiblings', $node,
              {

                  'siblings': nodeVals.map(function (item) { return { 'id': id, 'name': item, 'title': continut, 'relationship': '110', 'className': clasa }; })
              });
        } else {//adauga un copil la nodul selectat
            ultimeleActiuni.push('adaugare');
            valoriModificate.push(id);
            var hasChild = $node.parent().attr('colspan') > 0 ? true : false;
            if (!hasChild) {
                var rel = nodeVals.length > 1 ? '110' : '100';
                $chartContainer.orgchart('addChildren', $node, {
                    'children': nodeVals.map(function (item) {
                        return { 'id': id, 'name': item, 'title': continut, 'relationship': rel, 'className': clasa };
                    })
                }, $.extend({}, $chartContainer.find('.orgchart').data('options'), { depth: 0 }));
            } else {
                $chartContainer.orgchart('addSiblings', $node.closest('tr').siblings('.nodes').find('.node:first'),
                  {
                      'siblings': nodeVals.map(function (item) { return { 'id': id, 'name': item, 'title': continut, 'relationship': '110', 'className': clasa }; })
                  });
            }
        }
    });//noduri la organigrama

    $('#btn-delete-nodes').on('click', function () {
        var $node = $('#selected-node').data('node');
        if (!$node) {
            //alert('Nu a fost selectat nod-ul pentru stergere');
            $('#pEroare').text('Nu a fost selectat nod-ul pentru stergere');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
            return;
        }
        hierarchy = $('#chart-container').orgchart('getHierarchy');
        ultimeleActiuni.push('stergere');
        valoriModificate.push(hierarchy);
        $('#chart-container').orgchart('removeNodes', $node);
        $('#selected-node').data('node', null);
        stergeTextBoxuri();
    });//sterge nodul selectat

    $('#btn-edit').on('click', function () {
        var $node = $('#selected-node').data('node');
        if (!$node) {
            //alert('Nu a fost selectat un nod');
            $('#pEroare').text('Nu a fost selectat un nod');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
            return;
        }
        var id, nume, continut, clasa;
        nume = $('#selected-node').val();
        continut = $('#selected-content').val();
        clasa = $('#selected-Clasa').val();
        id = $('#selected-id').val();
        ultimeleActiuni.push('editare');
        valoriModificate.push([$node[0].id, $node[0].outerText.split('\n')[0], $node[0].outerText.split('\n')[1].split(' / ')[0], $node[0].outerText.split('\n')[1].split(' / ')[1], $node[0].className.replace('node', '').replace('focused', '').trim()]);
        editareNod(id, nume, continut, clasa);
    });//editeaza valorile nodului

    $('#btn-reset').on('click', function () {
        $('.orgchart').trigger('click');
        $('#new-nodelist').find('input:first').val('').parent().siblings().remove();
        $('#node-type-panel').find('input').prop('checked', false);
    });

    $('#editareClasaCss').on('click', function () {
        $('#anulMod').css('display', 'none');
        var id, nume, continut, clasa;
        nume = $('#selected-node').val();
        continut = $('#selected-content').val();
        clasa = $('#selected-Clasa').val();
        id = $('#selected-id').val();
        if (id && clasa) editareNod(id, nume, continut, clasa);
        if ($('#selected-Clasa').val() !== '') {
            $('#myModal').fadeIn();
            var numeClasa = $('#selected-Clasa').val();
            var titlu = '.orgchart .' + numeClasa + ' .title';
            var content = '.orgchart .' + numeClasa + ' .content';
            $('#numeModal').html('Nume Clasa');
            $('.testTitle').html('Test');
            $('.testContent').html('NPP / NTP');
            $('#testPreview').addClass('node ' + numeClasa);
            $('#numeClasa').val(numeClasa);
            $('#culoareBGS').val(rgb2hex($(titlu).css('background-color') ? $(titlu).css('background-color') : 'rgb(217, 83, 79)'));
            $('#culoareBGI').val(rgb2hex($(content).css('background-color') ? $(content).css('background-color') : 'rgb(250, 250, 250)'));
            $('#culoareBI').val(rgb2hex($(content).css('border-color') ? $(content).css('border-color') : 'rgb(217, 83, 79)'));
            $('#inaltimeS').val($(titlu).css('height') ? $(titlu).css('height') : '20px');
            $('#inaltimeI').val($(content).css('height') ? $(content).css('height') : '20px');
            $('#latimeS').val($(titlu).css('width') ? $(titlu).css('width') : '140px');
            $('#latimeI').val($(content).css('width') ? $(content).css('width') : '140px');
            $('#culoareFontS').val(rgb2hex($(titlu).css('color') ? $(titlu).css('color') : 'rgb(255, 255, 255)'));
            $('#culoareFontI').val(rgb2hex($(content).css('color') ? $(content).css('color') : 'rgb(0, 0, 0)'));
            $('#marimeFontS').val($(titlu).css('font-size') ? $(titlu).css('font-size') : '12px');
            $('#marimeFontI').val($(content).css('font-size') ? $(content).css('font-size') : '12px');
            $('#textFontS').val($(titlu).css('font-family') ? $(titlu).css('font-family').split(',')[0] : '12px');
            $('#textFontI').val($(content).css('font-family') ? $(content).css('font-family').split(',')[0] : '12px');
            if ($(titlu).css('font-weight') === "bold") { $('#boldFontS').prop('checked', true); $($('#boldFontS')[0].labels[0]).children().addClass("apasat"); }
            if ($(content).css('font-weight') === "bold") { $('#boldFontI').prop('checked', true); $($('#boldFontI')[0].labels[0]).children().addClass("apasat"); }
            schimbaPrevCSS();
        }
        else {
            //alert("Elementul selectat nu are precizat o clasa CSS");
            $('#pEroare').text('Elementul selectat nu are precizat o clasa CSS');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
        }
    });//schimba css-ul unei clase de elemente

    $('#editareElementCss').on('click', function () {
        $('#anulMod').css('display', 'block');
        var id, nume, continut, clasa;
        nume = $('#selected-node').val();
        continut = $('#selected-content').val();
        clasa = $('#selected-Clasa').val();
        id = $('#selected-id').val();
        if (id) editareNod(id, nume, continut, clasa);
        if ($('#selected-id').val()) {
            $('#myModal').fadeIn();
            var numeClasa = id;
            var titlu = '#' + numeClasa + ' .title';
            var content = '#' + numeClasa + ' .content';
            $('#numeModal').html('ID-ul elementului');
            $('.testTitle').html(nume);
            $('.testContent').html(continut);
            $('#testPreview').addClass('node ' + numeClasa);
            $('#numeClasa').val(numeClasa);
            $('#culoareBGS').val(rgb2hex($(titlu).css('background-color') ? $(titlu).css('background-color') : 'rgb(217, 83, 79)'));
            $('#culoareBGI').val(rgb2hex($(content).css('background-color') ? $(content).css('background-color') : 'rgb(250, 250, 250)'));
            $('#culoareBI').val(rgb2hex($(content).css('border-color') ? $(content).css('border-color') : 'rgb(217, 83, 79)'));
            $('#inaltimeS').val($(titlu).css('height') ? $(titlu).css('height') : '20px');
            $('#inaltimeI').val($(content).css('height') ? $(content).css('height') : '20px');
            $('#latimeS').val($(titlu).css('width') ? $(titlu).css('width') : '140px');
            $('#latimeI').val($(content).css('width') ? $(content).css('width') : '140px');
            $('#culoareFontS').val(rgb2hex($(titlu).css('color') ? $(titlu).css('color') : 'rgb(255, 255, 255)'));
            $('#culoareFontI').val(rgb2hex($(content).css('color') ? $(content).css('color') : 'rgb(0, 0, 0)'));
            $('#marimeFontS').val($(titlu).css('font-size') ? $(titlu).css('font-size') : '12px');
            $('#marimeFontI').val($(content).css('font-size') ? $(content).css('font-size') : '12px');
            $('#textFontS').val($(titlu).css('font-family') ? $(titlu).css('font-family').split(',')[0] : '12px');
            $('#textFontI').val($(content).css('font-family') ? $(content).css('font-family').split(',')[0] : '12px');

            if ($(titlu).css('font-weight') === "bold") { $('#boldFontS').prop('checked', true); $($('#boldFontS')[0].labels[0]).children().addClass("apasat"); }
            else { $('#boldFontS').prop('checked', false); $($('#boldFontS')[0].labels[0]).children().removeClass("apasat"); }
            if ($(content).css('font-weight') === "bold") { $('#boldFontI').prop('checked', true); $($('#boldFontI')[0].labels[0]).children().addClass("apasat"); }
            else { $('#boldFontI').prop('checked', false); $($('#boldFontI')[0].labels[0]).children().removeClass("apasat"); }

            if ($(titlu).css('font-style') === 'italic') { $('#italicFontS').prop('checked', true); $($('#italicFontS')[0].labels[0]).children().addClass("apasat"); }
            else { $('#italicFontS').prop('checked', false); $($('#italicFontS')[0].labels[0]).children().removeClass("apasat"); }
            if ($(content).css('font-style') === 'italic') { $('#italicFontI').prop('checked', true); $($('#italicFontI')[0].labels[0]).children().addClass("apasat"); }
            else { $('#italicFontI').prop('checked', false); $($('#italicFontI')[0].labels[0]).children().removeClass("apasat"); }

            schimbaPrevCSS();
        }
        else {
            //alert("Nu a fost selectat un element pentru modificare");
            $('#pEroare').text('Nu a fost selectat un element pentru modificare');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
        }
    });//schimba css-ul unui element din organigrama


    //inchidere modale prin click X
    $('#inchidereModal').on('click', function () {
        $('#myModal').css("display", "none");
    });
    $('#inchidereModal2').on('click', function () {
        $('#modalAdaugaElementNou').css("display", "none");
    });
    $('#inchidereModal3').on('click', function () {
        $('#modalIncarcaDinPC').css("display", "none");
    });

    $('#salvMod').on('click', function () {
        var numeClasa;
        if ($('#numeModal').html() === 'ID-ul elementului')
            numeClasa = '.orgchart div[id|="' + $('#selected-id').val() + '"] ';
        else numeClasa = '.orgchart .' + $('#numeClasa').val() + ' ';
        ultimeleActiuni.push('schimbareCSS');
        valoriModificate.push(modificariClase);
        if (modificariClase.indexOf(numeClasa + '.title {background-color:') !== -1) {//daca au fost deja facute modificari, se cauta numele clasei si se schimba valorile
            var str = modificariClase.substring(modificariClase.lastIndexOf(numeClasa + '.title '), modificariClase.lastIndexOf("/*sfarsit*/"));
            modificariClase = modificariClase.replace(str, numeClasa + '.title {background-color:' + $('#culoareBGS').val() + ';height:' + $('#inaltimeS').val() + ';line-height:' + $('#inaltimeS').val() + ';width:' + $('#latimeS').val() +
                                ';color:' + $('#culoareFontS').val() + ';font-size:' + $('#marimeFontS').val() + ';font-family:' + $('#textFontS').val() + ';' +
                                ($('#boldFontS').is(':checked') ? 'font-weight:bold;' : 'font-weight: normal;') + ($('#italicFontS').is(':checked') ? 'font-style: italic;' : '') +
                                ($('#stangaFontS').is(':checked') ? 'text-align:left;' : '') + ($('#centruFontS').is(':checked') ? 'text-align:center;' : '') + ($('#dreaptaFontS').is(':checked') ? 'text-align:right;' : '') + '-webkit-print-color-adjust: exact;}' +
                                numeClasa + '.content {background-color:' + $('#culoareBGI').val() + ';height:' + $('#inaltimeI').val() + ';line-height:' + $('#inaltimeI').val() + ';width:' + $('#latimeI').val() +
                                ';color:' + $('#culoareFontI').val() + ';font-size:' + $('#marimeFontI').val() + ';font-family:' + $('#textFontI').val() + ';' + 'border:1px solid' + $('#culoareBI').val() + ';' +
                                ($('#boldFontI').is(':checked') ? 'font-weight:bold;' : 'font-weight: normal;') + ($('#italicFontI').is(':checked') ? 'font-style: italic;' : '') +
                                ($('#stangaFontI').is(':checked') ? 'text-align:left;' : '') + ($('#centruFontI').is(':checked') ? 'text-align:center;' : '') + ($('#dreaptaFontI').is(':checked') ? 'text-align:right;' : '') + '-webkit-print-color-adjust: exact;}');
        }
        else {//daca este prima modificare se introduc valorile
            modificariClase += numeClasa + '.title {background-color:' + $('#culoareBGS').val() + ';height:' + $('#inaltimeS').val() + ';line-height:' + $('#inaltimeS').val() + ';width:' + $('#latimeS').val() +
                                ';color:' + $('#culoareFontS').val() + ';font-size:' + $('#marimeFontS').val() + ';font-family:' + $('#textFontS').val() + ';' +
                                ($('#boldFontS').is(':checked') ? 'font-weight:bold;' : 'font-weight: normal;') + ($('#italicFontS').is(':checked') ? 'font-style: italic;' : '') +
                                ($('#stangaFontS').is(':checked') ? 'text-align:left;' : '') + ($('#centruFontS').is(':checked') ? 'text-align:center;' : '') + ($('#dreaptaFontS').is(':checked') ? 'text-align:right;' : '') + '-webkit-print-color-adjust: exact;}';
            modificariClase += numeClasa + '.content {background-color:' + $('#culoareBGI').val() + ';height:' + $('#inaltimeI').val() + ';line-height:' + $('#inaltimeI').val() + ';width:' + $('#latimeI').val() +
                                ';color:' + $('#culoareFontI').val() + ';font-size:' + $('#marimeFontI').val() + ';font-family:' + $('#textFontI').val() + ';' + 'border:1px solid' + $('#culoareBI').val() + ';' +
                                ($('#boldFontI').is(':checked') ? 'font-weight:bold;' : 'font-weight: normal;') + ($('#italicFontI').is(':checked') ? 'font-style: italic;' : '') +
                                ($('#stangaFontI').is(':checked') ? 'text-align:left;' : '') + ($('#centruFontI').is(':checked') ? 'text-align:center;' : '') + ($('#dreaptaFontI').is(':checked') ? 'text-align:right;' : '') + '-webkit-print-color-adjust: exact;}/*sfarsit*/';
        }
        claseModificate.html(modificariClase);//realizeaza modificarea
        $('#myModal').css("display", "none");
        $('#modalSucces').fadeIn();
        setTimeout(function () { $('#modalSucces').fadeOut(); }, 5000);
    });//salveaza modificarile facute in modalul de schimbare css clasa/element

    $('#anulMod').on('click', function () {
        var numeID = '.orgchart div[id|="' + $('#selected-id').val() + '"] ';
        if (modificariClase.indexOf(numeID + '.title {background-color:') !== -1) {
            var str = modificariClase.substring(modificariClase.lastIndexOf(numeID + '.title '), modificariClase.lastIndexOf("/*sfarsit*/"));
            str += "/*sfarsit*/";
            ultimeleActiuni.push('schimbareCSS');
            valoriModificate.push(modificariClase);
            modificariClase = modificariClase.replace(str, '');
            claseModificate.html(modificariClase);
        }
        $('#myModal').css("display", "none");
    });//anuleaza modificarile facute in modalul de schimbare css clasa/element

    $('#btn-export-hier').on('click', function () {
        hierarchy = $('#chart-container').orgchart('getHierarchy');
        var str;
        if ($('.orgchart').html().indexOf('<div class="window ui-draggable" style="display:') !== -1)
            str = $('.orgchart').html().substring($('.orgchart').html().indexOf('<div class="window ui-draggable" style="display:'), $('.orgchart').html().lastIndexOf(''));
        else str = "";
        var data = new Blob([JSON.stringify(hierarchy, null, 2) + '\n' + '~~!!^_^TEXT DESPARTITOR^_^!!~~' + '\n' + modificariClase + '\n' + '~~!!^_^TEXT DESPARTITOR^_^!!~~' + '\n' + str], { type: 'text/plain' });
        if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
        }
        textFile = window.URL.createObjectURL(data);
        $('#test123').attr("href", textFile);
        var utc = new Date().toJSON().slice(0, 10);
        $('#test123').attr("download", "Organigrama Grafica " + utc + ".ogg");
    });//buton de salvare a ierarhiei + css a organigramei

    $('#btn-normal').on('click', function () {
        $('#chart-container').orgchart('zoom', true);
    });

    $('#orgNouFaraTemplate').on('click', function () {
        $('#ecranBunVenit').fadeOut("slow");
        $('.orgchart').remove();
        var data = {
            'id': '1',
            'name': 'Entitate radacina',
            'title': 'NPP / NTP',
            'className': 'radacina'
        };
        creareOrganigrama(data);
        modificariClase = '';
        claseModificate.html(modificariClase);
        hierarchy = $('#chart-container').orgchart('getHierarchy');
        $('#culoareLEG').val("#d9534f");
        $('a').removeClass('activ');
    });

    $('#orgNouCuTemplate').on('click', function () {
        orgNou();
    });
    $('#orgNouButon').on('click', function () {
        orgNou();
    });

    $('#btn-undo').on('click', function () {
        if (ultimeleActiuni.length > 0) {
            var ultimaActiune = ultimeleActiuni.pop();
            var valoare = valoriModificate.pop();
            switch (ultimaActiune) {
                case 'stergere':
                    //reinitializeaza orgchart-ul inainte de stergere (pentru ca elementele se sterg recursiv de la parinte la copil)
                    undo(valoare);
                    break;
                case 'adaugare':
                    //sterge elementul adaugat
                    $('#chart-container').orgchart('removeNodes', $('#' + valoare).closest('div'));
                    break;
                case 'adaugare-parinte':
                    undo(valoare);
                    break;
                case 'editare':
                    //se editeaza elementul cu valorile anterioare
                    editareNod(valoare[0], valoare[1], valoare[2], valoare[3], valoare[4]);
                    break;
                case 'schimbareCSS':
                    //schimba css la forma initiala
                    claseModificate.html(valoare);
                    modificariClase = valoare;
                    break;
                case 'dragndrop':
                    undo(valoare);
                    hierarchy = $('#chart-container').orgchart('getHierarchy');
                    break;
                default: return;
            }
        }
    });//buton undo

    $('#chart-container').on('drop', function () {
        //ultimeleActiuni.push('dragndrop');
        //valoriModificate.push(hierarchy);
        //salvIerarhieUndo();
    });//event folosit pe undo

    $('#btn-print').on('click', function () {
        $('.orgchart').removeClass('previewPrint');
        $('*').removeClass("focused");
        stergeTextBoxuri();
        $('.orgchart').printThis();
        //$('.orgchart').addClass('previewPrint');
    });//porneste preview-ul de printare

    $('#schimbaCuloareLEG').on('click', function () {
        if (modificariClase.indexOf('.orgchart td.top {') !== -1) {
            var str = modificariClase.substring(modificariClase.lastIndexOf('.orgchart td.top {'), modificariClase.lastIndexOf("/*LEG*/"));
            modificariClase = modificariClase.replace(str, '.orgchart td.top { \
                                                            border-top: 2px solid ' + $('#culoareLEG').val() + '; \
                                                                        } \
                                                            .orgchart td.right { \
                                                              border-right: 1px solid ' + $('#culoareLEG').val() + '; \
                                                                        float: none; \
                                                                        } \
                                                            .orgchart td.left { \
                                                              border-left: 1px solid ' + $('#culoareLEG').val() + '; \
                                                                        float: none; \
                                                                        } \
                                                            .orgchart td>.down { \
                                                            border: 1px solid ' + $('#culoareLEG').val() + '; }');
        }
        else
            modificariClase += '.orgchart td.top { \
                                border-top: 2px solid ' + $('#culoareLEG').val() + '; \
                                            } \
                                .orgchart td.right { \
                                  border-right: 1px solid ' + $('#culoareLEG').val() + '; \
                                            float: none; \
                                            } \
                                .orgchart td.left { \
                                  border-left: 1px solid ' + $('#culoareLEG').val() + '; \
                                            float: none; \
                                            } \
                                .orgchart td>.down { \
                                border: 1px solid ' + $('#culoareLEG').val() + '; }/*LEG*/';
        claseModificate.html(modificariClase);
    });//schimbarea culorii legaturii

    $('#adaugaText').click(function () {
        $('.orgchart').append("<div class=window style='display: inline-block;'><div contentEditable='true' class='textbox' style='display: inline-block;'>Drag and drop pentru a muta caseta, dublu click pentru a o edita.<div></div></div></div>");
        modificariText();
    });//adauga caseta text

    $('#adaugaFrunza').on('click', function () {
        var $node = $('#selected-node').data('node');
        if (!$node) {
            //alert('Nu a fost selectat nod-ul pentru adaugare');
            $('#pEroare').text('Nu a fost selectat nod-ul pentru adaugare');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
            return;
        }
        relatie = 0;
        $('#modalAdaugaElementNou').fadeIn();
    });//adauga nod frunza

    $('#adaugaVecin').on('click', function () {
        var $node = $('#selected-node').data('node');
        if (!$node) {
            //alert('Nu a fost selectat nod-ul pentru adaugare');
            $('#pEroare').text('Nu a fost selectat nod-ul pentru adaugare');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
            return;
        }
        relatie = 1;
        $('#modalAdaugaElementNou').fadeIn();
    });//adauga nod vecin

    $('#adaugaRadacina').on('click', function () {
        relatie = 2;
        $('#modalAdaugaElementNou').fadeIn();
    });//adauga nod radacina

    $('#btn-edit-text').on('click', function () {
        if ($('.bar').css("visibility") === "hidden") {
            $('.bar').css("visibility", "visible");
            $('#imgText').css("background-color", "#DDDDDD");
            $('#imgText').css("border", "1px solid #BEBEBE");
        }
        else {
            $('.bar').css("visibility", "hidden");
            $('#imgText').css("background-color", "");
            $('#imgText').css("border", "");
        }
    });//editeaza textul

    $('#incarcaDinPC').on('click', function () {
        $('#modalIncarcaDinPC').fadeIn();
    });
    $('#incarcaDinPCButon').on('click', function () {
        $('#modalIncarcaDinPC').fadeIn();
    });

    function incarcaFisier(e, input) {
        if (input === 0) var f = e.target.files[0];
        else {
            var f = e.originalEvent.dataTransfer.files[0];
            e.preventDefault();
            e.stopPropagation();
        }
        if (f.name[f.name.length - 3] + f.name[f.name.length - 2] + f.name[f.name.length - 1] == "ogg") {
            if (f) {
                var r = new FileReader();
                r.onload = function (e) {
                    var contents = e.target.result;
                    var data = JSON.parse(contents.split('~~!!^_^TEXT DESPARTITOR^_^!!~~')[0]);
                    $('.orgchart').remove();
                    creareOrganigrama(data);
                    modificariClase = contents.split('~~!!^_^TEXT DESPARTITOR^_^!!~~')[1];
                    claseModificate.html(modificariClase);
                    $('.orgchart').append(contents.split('~~!!^_^TEXT DESPARTITOR^_^!!~~')[2]);
                    modificariText();
                };
                r.readAsText(f);
                return true;
            } else {
                //alert("Au aparut erori in incarcarea fisierului");
                $('#pEroare').text('Au aparut erori in incarcarea fisierului');
                $('#modalEroare').fadeIn();
                setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
                return false;
            }
        }
        else {
            //alert("Fisierul incarcat nu este suportat (tip .ogg)");
            $('#pEroare').text('Fisierul incarcat nu este suportat (tip .ogg)');
            $('#modalEroare').fadeIn();
            setTimeout(function () { $('#modalEroare').fadeOut(); }, 5000);
            $('.dropZone').removeClass("dropZoneOver");
            return false;
        }
    }//functie de incarcare a fisierului

    $('#inputFisier').on('change', function (e) {
        var x = incarcaFisier(e, 0);
        if (x === true) {
            $('#modalIncarcaDinPC').css("display", "none");
            $('#ecranBunVenit').fadeOut("slow");
            $('#inputFisier').replaceWith($('#inputFisier') = $('#inputFisier').clone(true));
            salvIerarhieUndo();
        }
    });//drag and drop incarca fisier

    $('.dropZone').on('dragover', function () {
        $('.dropZone').addClass("dropZoneOver");
        return false;
    })
    .on('dragend', function () {
        $('.dropZone').removeClass("dropZoneOver");
        return false;
    })
    .on('dragleave', function () {
        $('.dropZone').removeClass("dropZoneOver");
        return false;
    })
    .on('drop', function (e) {
        var x = incarcaFisier(e, 1);
        if (x === true) {
            $('#modalIncarcaDinPC').css("display", "none");
            $('#ecranBunVenit').fadeOut("slow");
        }
        $('.dropZone').removeClass("dropZoneOver");
        salvIerarhieUndo();
    });//drag and drop efecte CSS de hover etc

    $('#modificari').on('change', function () {
        schimbaPrevCSS();
    });//

    $('#chart-container').scroll(function () {
        $('.big-ghost').each(function () {
            $(this).remove();
        });
    });

    $('#btn-portrait').on('click', function () {
        if (modificariClase.indexOf('.orgchart {width:') !== -1) {
            modificariClase = modificariClase.replace('.orgchart {width:297mm;height:209mm}', '.orgchart {width:210mm;height:296mm}');
            modificariClase = modificariClase.replace('.orgchart {width:initial;height:initial;background-image: linear-gradient(90deg, rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%), linear-gradient(rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%);background-size: 10px 10px;}', '.orgchart {width:210mm;height:296mm}');
        }
        else
            modificariClase += '.orgchart {width:210mm;height:296mm}';
        claseModificate.html(modificariClase);
    });//schimba spatiul de lucru intr-o pagina A4 portrait

    $('#btn-landscape').on('click', function () {
        if (modificariClase.indexOf('.orgchart {width:') !== -1) {
            modificariClase = modificariClase.replace('.orgchart {width:210mm;height:296mm}', '.orgchart {width:297mm;height:209mm}');
            modificariClase = modificariClase.replace('.orgchart {width:initial;height:initial;background-image: linear-gradient(90deg, rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%), linear-gradient(rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%);background-size: 10px 10px;}', '.orgchart {width:297mm;height:209mm}');
        }
        else
            modificariClase += '.orgchart {width:297mm;height:209mm}';
        claseModificate.html(modificariClase);
    });//schimba spatiul de lucru intr-o pagina A4 landscape

    $('#btn-grid').on('click', function () {
        if (modificariClase.indexOf('.orgchart {width:') !== -1) {
            modificariClase = modificariClase.replace('.orgchart {width:297mm;height:209mm}', '.orgchart {width:initial;height:initial;background-image: linear-gradient(90deg, rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%), linear-gradient(rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%);background-size: 10px 10px;}');
            modificariClase = modificariClase.replace('.orgchart {width:210mm;height:296mm}', '.orgchart {width:initial;height:initial;background-image: linear-gradient(90deg, rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%), linear-gradient(rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%);background-size: 10px 10px;}');
        }
        else
            modificariClase += '.orgchart {width:initial;height:initial;background-image: linear-gradient(90deg, rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%), linear-gradient(rgba(100, 100, 100, 0.15) 10%, rgba(0, 0, 0, 0) 10%);background-size: 10px 10px;}';
        claseModificate.html(modificariClase);
    });//schimba spatiul de lucru intr-un grid

    $('#btn-fullscreen').on('click', function () {
        var i = document.body;
        if (i.requestFullscreen) {
            i.requestFullscreen();
        } else if (i.webkitRequestFullscreen) {
            i.webkitRequestFullscreen();
        } else if (i.mozRequestFullScreen) {
            i.mozRequestFullScreen();
        } else if (i.msRequestFullscreen) {
            i.msRequestFullscreen();
        }
        else { return; }
        $('#inchideFullscreen').css("display", "block");
    });//initializeaza fullscreen pe editorul organigrama

    $('#btn-fullscreen-org').on('click', function () {
        var i = document.getElementsByClassName("orgchart")[0];
        if (i.requestFullscreen) {
            i.requestFullscreen();
        } else if (i.webkitRequestFullscreen) {
            i.webkitRequestFullscreen();
        } else if (i.mozRequestFullScreen) {
            i.mozRequestFullScreen();
        } else if (i.msRequestFullscreen) {
            i.msRequestFullscreen();
        }
        else { return; }
        $('#inchideFullscreen').css("display", "block");
        zoomPan();
    });//initializeaza fullscreen pe organigrama + adauga zoom/pan organigramei

    $('#btn-movechart').on('click', function () {
        if ($('table:first').hasClass('ui-draggable')) {
            $('table:first').draggable("destroy");
            $('#btn-movechart').removeClass("activ");
            $('table:first').removeClass("apasat");
        }
        else {
            $('table:first').draggable({
                containment: "parent"
            });
            $('#btn-movechart').addClass("activ");
            $('table:first').addClass("apasat");
        }
    });//initializeaza move in cadrul paginii organigramei

    $('#btn-rotate').click(function () {
        if ($('#btn-rotate').hasClass("activ")) {
            rotation = 0;
            $('#btn-rotate').removeClass("activ")
        }
        else
        {
            rotation = 1;
            if (activ===0){
            $('.node').on("click", function () {
                if (rotation !== 0) {
                    $(this).rotate(getRotationDegrees($(this)) + 90);
                }
            });
            activ = 1;
            }
            $('#btn-rotate').addClass("activ");
        }
    });//rotate a nodurilor WIP

    $('#inchideFullscreen').on('click', function () {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        $('#inchideFullscreen').css("display", "none");
        zoomPanCancel();
    });//inchidere mod fullscreen la click

    //tooltip boostrap
    $('[data-toggle="tooltip"]').tooltip({ placement: "right" });
    $('[data-toggle="tooltip2"]').tooltip({ placement: "left" });

    //efecte css modal
    $(":checkbox").change(function () {
        if (this.checked) {
            $(this.labels[0]).children().addClass("apasat");
        }
        else $(this.labels[0]).children().removeClass("apasat");
    });

    //Eventuri fullscreen
    document.addEventListener("fullscreenchange", function () {
        if (fullScreen === 1) { $('#inchideFullscreen').css("display", "none"); zoomPanCancel(); fullScreen = 0; }
        else fullScreen = 1;
    }, false);
    document.addEventListener("webkitfullscreenchange", function () {
        if (fullScreen === 1) { $('#inchideFullscreen').css("display", "none"); zoomPanCancel(); fullScreen = 0; }
        else fullScreen = 1;
    }, false);
    document.addEventListener("mozfullscreenchange", function () {
        if (fullScreen === 1) { $('#inchideFullscreen').css("display", "none"); zoomPanCancel(); fullScreen = 0; }
        else fullScreen = 1;
    }, false);
    document.addEventListener("MSFullscreenChange", function () {
        if (fullScreen === 1) { $('#inchideFullscreen').css("display", "none"); zoomPanCancel(); fullScreen = 0; }
        else fullScreen = 1;
    }, false);

    //$('[data-toggle="tooltip"]').tooltip();//Tooltip-uri

    $('.pagina').addClass("overflowHidden");

    //TESTEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE JSPLUMB

    $('.adaugaElement').draggable({
        helper: "clone",
        containment: "window",
        start: function (event, ui) {
            $('.node').addClass("nodePosibil");
        }
    });
    $('.adaugaElement').bind('dragstop', function (event, ui) {
        $('.node').removeClass("nodePosibil");
    });

    $('html').keyup(function (e) {
        if (e.keyCode == 46) {
            if ($('.nodeFocused')[0]){
                $('.nodeFocused').each(function () {
                    deleteNode(this);
                });
                return;
            }
            if ($('.selectat')[0]){
                $('.selectat').each(function () {
                    deleteNode(this);
                });
                $('.big-ghost').each(function () {
                    $(this).remove();
                });
                return;
            }
        }
    });

    //$(document).on("contextmenu", function (e) {
    //    e.preventDefault();
    //});
});

//#endregion jquery

instance = window.jsp = jsPlumb.getInstance({
    // default drag options
    DragOptions: { cursor: 'pointer', zIndex: 2000 },
    // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
    // case it returns the 'labelText' member that we set on each connection in the 'init' method below.

    Container: $('.orgchart')
});

var basicType = {
    connector: "StateMachine",
    paintStyle: { stroke: "blue", strokeWidth: 1 },
    hoverPaintStyle: { stroke: "blue" },
};
instance.registerConnectionType("basic", basicType);

// this is the paint style for the connecting lines..
var connectorPaintStyle = {
    strokeWidth: 1,
    stroke: "#D9534F",
    joinstyle: "round"
},
// .. and this is the hover style.
    connectorHoverStyle = {
        strokeWidth: 1,
        stroke: "#216477"
    },
    endpointHoverStyle1 = {
        fill: "#4cd964",
    },
    endpointHoverStyle2 = {
        fill: "#ff3a31",
    },
// the definition of source endpoints (the small blue ones)
    sourceEndpoint = {
        endpoint: "Dot",
        paintStyle: {
            //stroke: "#7AB02C",
            fill: "transparent",
            radius: 6
            //strokeWidth: 1
        },
        isSource: true,
        maxConnections: -1,
        connector: ["Flowchart", { stub: 5, gap: 0, cornerRadius: 0, alwaysRespectStubs: false }],
        connectorStyle: connectorPaintStyle,
        hoverPaintStyle: endpointHoverStyle1,
        connectorHoverStyle: connectorHoverStyle,
        dragOptions: {},
        overlays: [
            ["Label", {
                location: [0.5, 1.5],
                label: "Drag",
                cssClass: "endpointSourceLabel",
                visible: false
            }]
        ]
    },
// the definition of target endpoints (will appear when the user drags a connection)
    targetEndpoint = {
        endpoint: "Dot",
        paintStyle: { fill: "transparent", radius: 6 },
        hoverPaintStyle: endpointHoverStyle2,
        maxConnections: 1,
        dropOptions: { hoverClass: "hover", activeClass: "active" },
        isTarget: true,
        overlays: [
            ["Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel", visible: false }]
        ]
    },
    init = function (connection) {
        connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
    };

var _addEndpoints = function (toId, sourceAnchors, targetAnchors) {
    for (var i = 0; i < sourceAnchors.length; i++) {
        var sourceUUID = toId + sourceAnchors[i];
        instance.addEndpoint(toId, sourceEndpoint, {
            anchor: sourceAnchors[i], uuid: sourceUUID
        });
    }
    for (var j = 0; j < targetAnchors.length; j++) {
        var targetUUID = toId + targetAnchors[j];
        instance.addEndpoint(toId, targetEndpoint, { anchor: targetAnchors[j], uuid: targetUUID });
    }
};

function jsPlumbTest ()
{
    $('.lines').css("visibility", "hidden");

    // suspend drawing and initialise.
        instance.batch(function () {

            //$('table').remove();
            //for (var i = 1; i <= 7; i++)
            //$('.orgchart').append('<div class="node frunza" id="' + i + '"><div class="title" contentEditable>Entitate grafica</div><div class="content" contentEditable>NPP/NTP</div></div>');

            var left, top;

            //$('.orgchart').css('transform', 'scale(1.5,1.5)');

            $('.node').each(function (index) {
                left = $(this).position().left;
                top = $(this).position().top;
                $(this).css("left", left);
                $(this).css("top", top);
            });

            $('.node').each(function (index) {
                $(this).prependTo(".orgchart");
            });

            $('table').remove();

            $('.node').css("position", "absolute");
            //$('.node').css("z-index", "absolute");

            $('.node').each(function (index) {
                _addEndpoints(this.id, ["BottomCenter", [0, 0.75, -1, 0], [1, 0.75, 1, 0]], ["TopCenter", [0, 0.25, -1, 0], [1, 0.25, 1, 0]]);
            });

            // listen for new connections; initialise them the same way we initialise the connections at startup.
            instance.bind("connection", function (connInfo, originalEvent) {
                init(connInfo.connection);
            });

            // make all the window divs draggable
            //instance.draggable($(".node"));
            $('.node').myDraggableSetup();
            // THIS DEMO ONLY USES getSelector FOR CONVENIENCE. Use your library's appropriate selector
            // method, or document.querySelectorAll:
            //jsPlumb.draggable(document.querySelectorAll(".window"), { grid: [20, 20] });

            // connect a few up
            instance.connect({ uuids: ["1BottomCenter", "2TopCenter"], editable: true });
            instance.connect({ uuids: ["1BottomCenter", "3TopCenter"], editable: true });
            instance.connect({ uuids: ["1BottomCenter", "4TopCenter"], editable: true });
            instance.connect({ uuids: ["1BottomCenter", "5TopCenter"], editable: true });
            instance.connect({ uuids: ["3BottomCenter", "6TopCenter"], editable: true });
            instance.connect({ uuids: ["3BottomCenter", "7TopCenter"], editable: true });
            //instance.connect({ uuids: ["1BottomCenter", "2TopCenter"], editable: true });
            //

            //
            // listen for clicks on connections, and offer to delete connections on click.
            //
            instance.bind("click", function (conn, originalEvent) {
                // if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
                //   instance.detach(conn);
                conn.toggleType("basic");
            });
        });
    }