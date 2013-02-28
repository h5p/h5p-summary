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
    // TODO: Move to css
		$myDom.css({ border: '1px solid darkgrey', padding: '10px', backgroundColor: 'lightgrey'});

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
					text: options.summaries[i][j]
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

	// Create content
	var $summary = $('<div class="summary" id="summary-list">');
	var $evaluation = $('<div class="evaluation" id="option-list">Velg riktig alternativ til å legge til oppsummeringen</div>');
	var $score = $('<div class="score-intermediate" id="score"></div>');
	var $options = $('<div class="options" id="option-list">');

	// Insert content
	$myDom.append($summary);
	$evaluation.append($score);
	$myDom.append($evaluation);
	$myDom.append($options);

	// Add elements to content
	for (var i = 0; i < elements.length; i++) {
		var $page = $('<div class="summary-entries" id="panel-'+i+'" xpanel="'+i+'">');

		for (var j = 0; j < elements[i].length; j++) {
			var $node = $('<div id="node-'+elements[i][j].id+'" node="'+elements[i][j].id+'">'+elements[i][j].text+'</div>');

			// Add click event
			$node.click(function(){
				var $el = $('#'+this.id, $myDom);
				var node_id = parseInt($el.attr('node'));
				var classname = answer[node_id] ? 'success' : 'failed';

				$el.addClass(classname);

				// Correct answer?
				if(answer[node_id]){
					var $answer = $('<div class="" id="">'+$el.html()+'</div>');
					$summary.append($answer);

					var panel = parseInt($el.parent().attr('xpanel'));
					var $curr_panel = $('#panel-'+panel, $myDom);
					var $next_panel = $('#panel-'+(panel + 1), $myDom);

					// Hide this question set panel
					$curr_panel.slideUp('slow', function() {
						console.log("Fade out done " + this);
					});

					// Show next if present
					if($next_panel.attr('id')){
						$next_panel.css({ display: 'block' });
					}
					else {
						// Hide intermediate evaluation
						$score.html('');

						// Show final evaluation
						var $evaluation = $('<div class="score-final" id="">OK. Du hadde '+score+' feil</div>');
						$summary.append($evaluation);
					}
				}
				else {
					// Remove event handler (prevent repeated clicks)
					$el.off('click');
					$score.html('Antall feil: ' + (++score));
				}
			});
			$page.append($node);
		}

		$options.append($page);
	}

		// Show first panel
		$('#panel-0', $myDom).css({ display: 'block' });

		return this;
  };

  var returnObject = {
    attach: attach // Attach to DOM object
  };

  return returnObject;
};
