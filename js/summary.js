window.H5P = window.H5P || {};

H5P.Summary = function (options, contentId) {
	var offset = 0;

	if ( !(this instanceof H5P.Summary) ){
		return new H5P.Summary(options, contentId);
	}

	var score = 0;
	var answer = Array();

	// Function for attaching the multichoice to a DOM element.
	var attach = function (target) {
		var c=0; // element counter
		var elements = Array();
		var $ = H5P.jQuery;
		var $target = typeof(target) === "string" ? $("#" + target) : $(target);
		var $myDom = $target;

		// Create array objects
		for (var i = 0; i < options.summaries.length; i++) {
			elements[i] = Array();
			for (var j = 0; j < options.summaries[i].length; j++) {
				answer[c] = j == 0; // First claim is correct
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

	// Create content panels
	var $summary = $('<ul class="summary" id="summary-list"></ul>');
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
		var $page = $('<ul class="summary-entries" id="panel-'+i+'" data-panel="'+i+'"></ul>');

		for (var j = 0; j < elements[i].length; j++) {
			var $node = $('<li id="node-'+elements[i][j].id+'" class="claim">'+elements[i][j].text+'</li>');

			// Add click event
			$node.click(function(){
				var $el = $('#'+this.id, $myDom);
				var node_id = parseInt(this.id.replace(/[a-z\-]+/,''));
				var classname = answer[node_id] ? 'success' : 'failed';

				$el.addClass(classname);

				// Correct answer?
				if(answer[node_id]){
					var position = $el.position();
					var summary = $summary.position();
					var $answer = $('<li class="answer" id="">'+$el.html()+'</li>');

					// Insert correct claim into summary
					$summary.append($answer);

					// Move into position over clicked element
					var w = $el.css('width');
					var h = $el.css('height');
					$answer.css('display', 'block');
					$answer.css('height', h);
					$answer.css('width', w);
					$answer.css('position', 'absolute');
					$answer.css('top', position.top);
					$answer.css('left', position.left);

					var panel = parseInt($el.parent().attr('data-panel'));
					var $curr_panel = $('#panel-'+panel, $myDom);
					var $next_panel = $('#panel-'+(panel + 1), $myDom);
					var height = $curr_panel.parent().css('height');

					// Fade out current panel
					$curr_panel.fadeOut('fast', function() {
						// Force panel height to recorded height
						$curr_panel.parent().css('height', height);

						// Animate answer to summary
						$answer.animate(
							{
								top: summary.top+offset,
								left: '-=5px',
								width: '+=10px'
							},
							{
								complete: function(){
									// Remove position (becomes inline);
									$(this).css('position', '');

									// Calculate offset for next summary item
									var tpadding = parseInt($answer.css('paddingTop'))*2;
									var tmargin = parseInt($answer.css('marginBottom'));
									var theight = parseInt($answer.css('height'));
									offset += theight + tpadding + tmargin + 1;

									// Show next panel if present
									if($next_panel.attr('id')){
										$curr_panel.parent().css('height', 'auto');
										$next_panel.fadeIn('fast', function() {
										});
									}
									else {
										// Hide intermediate evaluation
										$score.html('');

										// Show final evaluation
										var message = score ? 'OK. Du hadde '+score+' feil' : 'Gratulerer! Du hadde ingen feil!';
										var $evaluation = $('<div class="score-final" id="">'+message+'</div>');
										$summary.append($evaluation);
									}
								}
							}
						);
					});
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
