window.H5P = window.H5P || {};

var score = 0;

H5P.Summary = function (options, contentId) {
	if ( !(this instanceof H5P.Summary) ){
		return new H5P.Summary(options, contentId);
	}

	var $ = H5P.jQuery;

	var params = options;
	var $myDom;
	var answer = Array();

	// Function for attaching the multichoice to a DOM element.
	var attach = function (target) {
		var $target;

		$target = typeof(target) === "string" ? $("#" + target) : $(target);

		// Render own DOM into target.
		$myDom = $target;
		$myDom.css({ border: '1px solid red', padding: '10px', backgroundColor: 'lightgrey'});

	var elements = Array();

	// Create array objects
	var c=0;
	for (var i = 0; i < options.summaries.length; i++) {
		elements[i] = Array();
		for (var j = 0; j < options.summaries[i].length; j++) {
			answer[c] = j == 0;
			elements[i][j] = {
				id: c++,
				node: j,
				text: options.summaries[i][j],
				correct: j == 0 // First summary is correct
			};
		}

		// Randomize elements
		for (var k = elements[i].length - 1; k > 0; k--) {
			var j = Math.floor(Math.random() * (k + 1));
			var temp = elements[i][k];
			elements[i][k] = elements[i][j];
			elements[i][j] = temp;
		}
	}

	var $summary = $('<div class="summary" id="summary-list" xpanel="'+i+'" style="background-color: lightgray; height: 200px">');
	var $evaluation = $('<div class="evaluation" id="option-list" style="">Velg riktig alternativ til å legge til oppsummeringen</div>');
	var $score = $('<div class="score" id="score" style="float: right"></div>');
	var $options = $('<div class="options" id="option-list" xpanel="'+i+'" style="padding: 10px; overflow: hidden; background-color: white; height: 100px">');

	$myDom.append($summary);
	$evaluation.append($score);
	$myDom.append($evaluation);
	$myDom.append($options);

	// Add elements to content
	for (var i = 0; i < elements.length; i++) {
		var $page = $('<div class="summary-entries" id="panel-'+i+'" xpanel="'+i+'" style="border: 1px solid #CCCCCC; display: none">');

		for (var j = 0; j < elements[i].length; j++) {
			var $node = $('<div id="node-'+elements[i][j].id+'" class="summary-entry" node="'+elements[i][j].id+'">'+elements[i][j].text+'</div>');
			$node.correct = elements[i][j].correct;
			$node.css({border: '3px solid green'});

			// Add click event
			$node.click(function(){
				var $el = $('#'+this.id, $myDom);
				var node_id = parseInt($el.attr('node'));
				var classname = answer[node_id] ? 'success' : 'failed';
				console.log('Node '+node_id+' clicked '+$el.attr('id') + " panel=" + $el.parent().attr('id'));
				$el.addClass(classname);

				// Correct answer?
				if(answer[node_id]){

					var $answer = $('<div class="" id="" style="">'+$el.html()+'</div>');
					$summary.append($answer);

					var panel = parseInt($el.parent().attr('xpanel'));
					var $curr_panel = $('#panel-'+panel, $myDom);
					var $next_panel = $('#panel-'+(panel + 1), $myDom);

					console.log(node_id+": Clicked answer " + answer[node_id] + ' in panel '+$el.attr('panel'));

					// Hide current
					$curr_panel.slideUp('slow', function() {
						// $curr_panel.css({ display: 'none' });
						console.log("Fade out done " + this);
					});

					// Show next if present
					if($next_panel.attr('id')){
						$next_panel.css({ display: 'block' });
						console.log("p="+$next_panel.attr('id'));
					}
				}
				else {
					// Remove event handler (prevent repeated clicks)
					score++;
					$el.off('click');
					var $score = $('#score', $myDom);
					$score.html('Antall feil: ' + score);
				}
			});
			$page.append($node);
		}

		$options.append($page);
	}

	var $c = $('#panel-0', $myDom);
	$c.css({ border: '1px solid green', display: 'block' });
    return this;
  };

  // Masquerade the main object to hide inner properties and functions.
  var returnObject = {
    attach: attach // Attach to DOM object
  };

  return returnObject;
};
