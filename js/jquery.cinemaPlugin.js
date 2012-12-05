/**
 * JQuery Plugin zajišťující rezervační systém. Rezervační systém se dá použít na libovolnou rezervaci
 * např. kina nebo tenisového kurtu. Pomocí změny defaultních proněných jdou navolit své vlastní funkce
 * při práci s myší a obrázky které plugin využívá (jako je třeba sedačka).
 * 
 * Licence GPL, MIT, BSD
 * 
 * @version 1.00
 * @author Petr Kukrál
 * @param $ slouží ke kompatibilitě mezi zásuvnými moduly a knihovnami
 */

;(function($) {

/* nastavění uživatele doplněné o defaultní nastavení */
var opts;
/* obsahuje prvek nad kterym je system volan */
var thisSystem;

/**
 * Nejdříve načte nastavení uživatele a doplní je o defaultní nastavení. Poté zjistí v jakém je vstup formátu. Jestli
 * se jedná o formát xls, tak si ho převede na cvs. Z cvs se rozdělí skupiny (řádky) do pole array_series. Jednotlivé
 * skupiny se pak ještě rozdělí podle elementů a uloží do dvourozměrného pole array_series_elements. Z pole se
 * pak načítají jednotlivé skupiny a elementy. Při načtení každé skupiny se v cyklu vytvoří nový box na elementy
 * funkcí createSerie. Do tohoto boxu se pak elementy vkládají. Když element obsahuje první znak "[", je
 * vyhodnocen jako popisek řady. Ten se vytvoří pomocí funkce createMarkRowsOfElements Vše ostatní bude
 * vyhodnoceno jako normální element. Ten se vytvoří pomocí funkce createElement. Ta vrací počítadlo sedadel.
 * Je to z toho důvodu, že v této funkci se zjišťuje, jestli jde o platný element (např. sedačka) nebo neplatný (např.
 * ulička - ta se nepočítá). Nakonec se načtou všechny zarezervovaná místa a na všechny elementy kde to má smysl
 * (např. na sedačky které nejsou zarezervované) se navážou události.
 * 
 * @name booking_system
 * @param options Nastavení uživatele.
 * @example
 *  $(document).ready(function () {
 *	$("#cinema").booking_system({
 *		format: "xls",
 *		input: $(".xls").text()
 *	});
 * });
 */

$.fn.booking_system = function(options){
	/* uložení si objektu, nak kterým je systém volán do proměné */
	thisSystem = this;

	/* doplneni nevyplnenych nastaveni o deafultni nastaveni */
	var opts = $.extend({}, $.fn.booking_system.defaults, options);
	
	setOpts(opts);
	
	var cvs; var json;
	/* dvourozměrné pole obsahující jako první rozměr skupiny elementů a jako druhý elemnty ve skupinách */
	var array_series_elements;
	switch(opts.format) {
		case "xls": 
			cvs = cvsFromXls(opts.input);
			array_series_elements = doubleArrayFormCvs(cvs);
			break;
		case "cvs": 
			cvs = opts.input;
			array_series_elements = doubleArrayFormCvs(cvs)
			break;
		case "json":
			json = opts.input;
			array_series_elements = doubleArrayFromJSON(json)
			break;
		/*chyba, nepodporovany format*/
		default:
			alert("Nastala chyba, formát vstupu není podporovaný. Podporované formáty\n\
					jsou: json, cvs, xls");
			return;		
	}
	var serie_counter = 1;
	$.each(array_series_elements, function(index2, value){
		var element_counter = 1;
		serie_counter = createSerie($, serie_counter);

		$.each(this, function(index1, value){
			
			if(this.charAt(0) == "[")
			{
				createMarkRowsOfElements($, this);
			}else{
				element_counter = createElement($, this, index1, index2, element_counter);

				//element_counter = createElement($, value, opts.name_class_element, opts. name_class_without_element, index1, index2, element_counter, opts.img_element, opts.img_double_element);
			}
		});
	});
	$('body').append("<div style='clear:both'></div>");
	
	loadReservedElement();
	
	/* vytvoří popisky elementů */
	createLegend();

	$('.sedadlo[data-status!=reserved], .sedadlo_2[data-status!=reserved]')
	.click(
		opts.mouse_up_data,
		opts.mouse_up
	)
	.click(
		selected
	)
	.mouseover(
		opts.mouse_over_data,
		opts.mouse_over
	)
	.mouseout(
		opts.mouse_out_data,
		opts.mouse_out
	);
};

/**
 * Doplnění hodnot které zadal uživatel o defaultní hodnoty.
 */
$.fn.booking_system.defaults = {
	/* formát vstupu */
	format: "cvs",
	/* vstup */
	input: "1,1,1,2,;,1,1,1,1;,,2,, ;",
	/* název třídy elementu pro css */
	name_class_element: "sedadlo",
	/* název série - např. řady sedadel */
	name_class_serie: "ctverec",
	/* název třídy elementu pro prázdné místo pro css */
	name_class_without_element: "vynechane_misto",
	/* funkce která se spustí po přejetí myši přes element */
	mouse_over: mouseOverDefault,
	/* data pro funkci která se spustí po přejetí myši přes element */
	mouse_up: mouseUpDefault,
	/* data pro funkci která se spustí po klepnutí myši na element */
	mouse_out: mouseOutDefault,
	/* obrázek elementu */
	img_element: "images/modre_jednosedadlo.png",
	/* obrázek dvojelementu např. dvojsedačky */
	img_double_element: "images/modre_dvojsedadlo.png",
	/* obrázek rezervovaného elementu */
	img_reserved: "images/tmavesede_jednosedadlo.png",
	/* obrázek rezervovaného dvojelementu např. dvojsedačky */
	img_double_reserved: "images/tmavesede_dvojsedadlo.png",
	/* obrázek vybraného elementu */
	img_selected: "images/zelene_jednosedadlo.png",
	/* obrázek vybraného dvojelementu např. dvojsedačky */
	img_double_selected: "images/zelene_dvojsedadlo.png",
	/* jestli se má vypsat legenda */
	legend: "TRUE",
	/* id elementu nebo třída kam se má legenda vypsat */
	legend_target: "#legend .row",
	/* popisek legendy */
	legend_title: "Legenda",
	/* popisek elementu */
	legend_element: "volná sedačka",
	/* popisek rezervovaného elementu */
	legend_reserved: "rezervovaná sedačka",
	/* popisek vybraného elementu */
	legend_selected: "vybraná sedačka"
};

/**
 * Setter pro opts.
 * 
 * @name setOpts
 * @param opts Nastavení uživatele doplněné o defaultní nastavení.
 */

function setOpts(opts) {
	this.opts = opts;
}

/**
 * Getter pro opts.
 * 
 * @name getOpts
 * @return Nastavení uživatele doplněné o defaultní nastavení.
 */

function getOpts() {
	return this.opts;
}

/**
 * Načte elementy li z objektu reserved. Ten obsahuje zaregistrované elementy. Podle těch pak vyhledá elementy,
 * které jsou rezervované a označí je atributem reserved, který znemožní další rezervaci na tento element. Také
 * mu změní obrázek na rezervovaný element.
 * 
 * @name loadReservedElement
 */

function loadReservedElement() {
	var opts = this.opts;
	$("#reserved li")
		.each(function(index, element) {
			var id = $(this).html();
			var reservedElement = $("#" + id);
			reservedElement	
				.attr("data-status", "reserved");
			reservedElement
				.children()
				.attr("src", opts.img_reserved)
		});
}

/**
 * Rozhoduje, jestli element je nebo není vybraný. Jestli ano, tak zavolá funkci pro jeho odstranění z vybraných
 * elementů. Jestli vybraný není, zavolá funkci pro vybrání elementu.
 * 
 * @name selected
 * @param e Element na kterém funkce probíhá.
 */

function selected(e){
	
	var hClass = $(e.target)
			.parent()
			.hasClass("selected");
	if(hClass){
		removeFromSelected(e);
	}else{
		addToSelected(e);
	}
}

/**
 * Vybere daný element. Nejdříve údaje o elemntu tedy řadu (skupinu) a pořadové číslo vygeneruje do formuláře
 * jako skrytý prvek (slouží pro odeslání vybraných prvků). Poté přidá prvku třídu selected a změní na vybraný
 * obrázek.
 * 
 * @name addToSelected
 * @param e Element na kterém funkce probíhá.
 */

function addToSelected(e) {
	var element_series = $(e.target)
					.parent()
					.attr("id")
					.split("_");
	$("#selected form")
		.append("<input \n\
			id=form" + element_series[0] + "_"  + element_series[1] +  "\n\
			type='hidden' name='" + element_series[0] + "_" + element_series[1] + "' \n\
			value='" + element_series[0] + "_" + element_series[1] + "' \n\
		\>");
	
	var element = $(e.target);
	var parent_element = element
						.parent();
	parent_element
		.addClass("selected");

	/* kontrola jedná li se o jedno či dvoj element - např. dvojsedačka */
	var opts = getOpts();
	var type_element = parent_element
					.attr("class")
					.split("_");
					
	/* ověřuje, jestli element obsahuje "_CISLO" tedy jde o dvojelement */
	if("1" in type_element) {
		element
			.attr("src", opts.img_double_selected);
	}else{
		element
			.attr("src", opts.img_selected);
	}
}

/**
 * Odstraní element z vybraných elementů. Ostraní u elementu třídu selected a odstraní element z formuláře
 * vybraných elementů. Poté vrátí elementu původní obrázek.
 * 
 * @name removeFromSelected
 * @param e Element na kterém funkce probíhá.
 */

function removeFromSelected(e) {
	var element = $(e.target);
	var parentElement = element.parent();
	parentElement
		.removeClass("selected");
	var id = parentElement
			.attr("id");
	$("#form" + id)
		.remove();
	var opts = getOpts();
	var type_element = parentElement
					.attr("class")
					.split("_");
	if("1" in type_element) {
		element
			.attr("src", opts.img_double_element);
	}else{
		element
			.attr("src", opts.img_element);
	}
	
}

/**
 * Defaultní funkce která se zavolá po najetí myši na element. Tato funkce jde jednoduše překrýt v opts.
 * 
 * @name mouseOverDefault
 * @param e Element na kterém funkce probíhá.
 */

function mouseOverDefault(e) {
	$(e.target)
		.stop(true)
		.animate({opacity: 0}, 500);
}

/**
 * Defaultní funkce která se zavolá po klepnutí myší na element. Tato funkce jde jednoduše překrýt v opts.
 * 
 * @name mouseUpDefault
 * @param e Element na kterém funkce probíhá.
 */

function mouseUpDefault(e) {

}

/**
 * Defaultní funkce která se zavolá po opuštění myší element. Tato funkce jde jednoduše překrýt v opts.
 * 
 * @name mouseOutDefault
 * @param e Element na kterém funkce probíhá.
 */

function mouseOutDefault(e) {
	$(e.target)
		.stop(true)
		.animate({opacity: 1}, 200);
}

/*
 * Vytváří element. Nejdřív rozhodne, jedná-li se o prázdné místo, element nebo
 * dvojelement, popř. prázdný prvek a poté udělá příslušnou akci. U prázdného
 * místa vytvoří toto prázdné místo přičemž ho nezahrne do číslování elementů.
 * Při vytvoření elementu či dvojelementu ho vytvoří a zahrne tento element do
 * číslování. Při prázdném prveku tento prvek přeskočí a nezahrne ho do číslování.
 * 
 * @name createElement
 * @param $ Objekt jQuery.
 * @param value Jednosedačka či dvojsedačka nebo mezera.
 * @param index1 Index elementu zahrnující i prázdné elementy.
 * @param index2 Index řady (skupiny) elementu.
 * @param indexElement Index elementu nezahrnující prázdná mista.
 * 
 */
function createElement($, value, index1, index2, indexElement) {
	var opts = this.opts;
	
	var class_serie = opts.name_class_serie;
	if(value == "-"){
		$('.' + class_serie + ':last').append("<div id=" + index1 + "_" + index2 +  " class='" + opts.name_class_without_element + "'></div>");
		--indexElement;
	}else if(value == 1){
		$('.' + class_serie + ':last').append("<div id=" + index1 + "_" + index2 +  " class='" + opts.name_class_element + "'><img src=" + opts.img_element + " title='" + indexElement + "' \></div>");
	}else if(value == 2){
		$('.' + class_serie + ':last').append("<div id=" + index1 + "_" + index2 +  " class='" + opts.name_class_element + "_" + value + "'><img src=" + opts.img_double_element + "  title='" + indexElement + "' \></div>");
	}else if(value == 0 || value == ""){
		--indexElement;
	}
	return ++indexElement;
}

/**
 * Vytvoří řadu (skupinu) elementů.
 * 
 * @name createSerie
 * @param $ Objekt jQuery.
 * @param counter Index řady (skupiny).
 */

function createSerie($, counter) {
	var opts = this.opts;
	
	thisSystem.append("<div id='serie_" + counter  + "' class='" + opts.name_class_serie + "'></div>");
	return ++counter;
}

/**
 * Vytvoří označení řady
 * 
 * @name createMarkRowsOfElements
 * @param $ Objekt jQuery.
 * @param value Popisek řady.
 */

function createMarkRowsOfElements($, value) {
	var opts = this.opts;
	value = value.substring(1, value.length - 1);
	
	$('.' + opts.name_class_serie + ':last').append("<div class='serie_name'>" + value + "</div>");
}

/**
 * Vytvoří pole z řetězce.
 * 
 * @name arrayFromString
 * @param string Řetězec ze kteréhose bude dělat pole.
 * @return Pole vytvořené z řetězce.
 */

function arrayFromString(string) {
	var newArray = $.trim(string).split(';');
	$.each(newArray, function(index, value){
		newArray[index] = $.trim(value);
	});
	return newArray;
	
}

/**
 * Zpracování JSON
 * 
 * @name doubleArrayFromJSON
 * @param json Data elementů a řad ve fromátu JSON.
 */

function doubleArrayFromJSON(json) {
	var object = $.parseJSON(json);
	var newArray = new Array();
	var i = 0;
	$.each(object, function(index, value){
		if(value == false || value == undefined) {} /* ochrana proti false v JSON */
		else{ 
			if(newArray[value.serie] instanceof Array) {
				newArray[value.serie].push(value.type);++i;
			}else{
				newArray[value.serie] = new Array(value.type);++i;
			}
		}
	});
	/* odstraneni undefined prvku, jinak to nefunguje spravne */
	return newArray.splice(1);
}

/**
 * Přetransformuje řetězec z cvs formátu na xls formát.
 * 
 * @name cvsFromXls
 * @param string Řetězec ve formátu xls.
 * @return Řetězec ve formátu cvs.
 */

function cvsFromXls(string) {
	return $.trim(string)
			.replace(/\t/g, ",")
			.replace(/\n/g, ";");
	
}

/**
 * Vrátí dvourozměrné pole z cvs formátu
 * 
 * @name doubleArrayFromCvs
 * @param cvs Data elementu a rad v cvs.
 * @return array_series_elements Dvourozměrné pole obsahující jako první rozměr skupiny elementů a jako druhý elemnty ve skupinách.
 */


function doubleArrayFormCvs(cvs) {
	/* pole obsahující jednotlivé skupiny elementů, např. řady v kině */
	var array_series = arrayFromString(cvs);

	/* dvourozměrné pole obsahující jako první rozměr skupiny elementů a jako druhý elemnty ve skupinách */
	var array_series_elements = [];
	$.each(array_series, function(index){
		array_series_elements[index] = array_series[index].split(",");
	});
	
	return array_series_elements;
}

/**
 * Vytvoří legendu k normálnímu, rezervovanému a vybranému elementu
 * 
 * @name createLegend
 */

function createLegend() {
	var opts = this.opts;
	if(opts.legend == "TRUE") {
		var target = $(opts.legend_target);
		target.append("<h4 class='float_left' id='legend_title'>Legenda: </h4>");
		target.append("<div class='float_left'><img src='" + opts.img_element + "' alt='" + opts.legend_element +"' title='" + opts.legend_element + "' /></div>");
		target.append("<div class='float_left'><img src='" + opts.img_reserved + "' alt='" + opts.legend_reserved +"' title='" + opts.legend_reserved + "' /></div>");
		target.append("<div class='float_left'><img src='" + opts.img_selected + "' alt='" + opts.legend_selected +"' title='" + opts.legend_selected + "' /></div>");
	}
}

})(jQuery);