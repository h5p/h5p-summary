var H5P = H5P || {};

H5P.Summary = function (options, contentId) {
  if ( !(this instanceof H5P.Summary) ){
    return new H5P.Summary(options, contentId);
  }

  var offset = 0;
  var score = 0;
  var answer = Array();

  // Function for attaching the multichoice to a DOM element.
  var attach = function (target) {
    var c=0; // element counter
    var elements = Array();
    var $ = H5P.jQuery;
    var $target = typeof(target) === "string" ? $("#" + target) : $(target);
    var $myDom = $target;

    $target.addClass('summary-content');

    function adjustTargetHeight(container, elements, el) {
		var new_height = parseInt(elements.outerHeight()) + parseInt(el.outerHeight()) + parseInt(el.css('marginBottom')) + parseInt(el.css('marginTop'));
      if(new_height > parseInt(container.css('height'))) {
        container.animate({ height: new_height });
      }
    }

    function do_final_evaluation(container, options_panel, list, score) {
      var error_count = 0;

      // Count boards without errors
      for (var i = 0; i < options.summaries.length; i++) {
        error_count += options.summaries[i].error_count ? 1 : 0;
      }

      // Calculate percentage
      var percent = 100 - (error_count / options.summaries.length * 100);

      // Find evaluation message
      for(var i = 0; i < options.response.length; i++) {
        if(percent >= options.response[i].from) {
          break;
        }
      }

      // Show final evaluation
      var summary = options.summary.replace('@score', options.summaries.length-error_count).replace('@total', options.summaries.length).replace('@percent', Math.round(percent));
      var message = '<h2>' + options.response[i].title + "</h2>" + summary + "<br/>" + options.response[i].message;
      var evaluation = $('<div class="score-over-'+options.response[i].from+'">'+message+'</div>');
      options_panel.append(evaluation);
		evaluation.fadeIn('slow');
      // adjustTargetHeight(container, list, evaluation);
    }

    // Create array objects
    for (var i = 0; i < options.summaries.length; i++) {
      options.summaries[i].error_count = 0;

      elements[i] = Array();
      for (var j = 0; j < options.summaries[i].length; j++) {
        answer[c] = j == 0; // First claim is correct
        elements[i][j] = {
          id: c++,
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
    var $summary_container = $('<div class="summary-container"></div>');
    var $summary_list = $('<ul></ul>');
    var $evaluation = $('<div class="summary-evaluation">Velg riktig alternativ til å legge til oppsummeringen</div>');
    var $score = $('<div></div>');
    var $options = $('<div class="summary-options">');
    var options_padding = parseInt($options.css('paddingLeft'));

    // Insert content
    $summary_container.append($summary_list);
    $myDom.append($summary_container);
    $evaluation.append($score);
    $myDom.append($evaluation);
    $myDom.append($options);

    // Add elements to content
    for (var i = 0; i < elements.length; i++) {
      var $page = $('<ul id="panel-'+i+'" data-panel="'+i+'"></ul>');

      for (var j = 0; j < elements[i].length; j++) {
        var $node = $('<li id="summary-node-'+elements[i][j].id+'" class="summary-claim-unclicked">'+elements[i][j].text+'</li>');

        // When correct claim is clicked:
        // - Add claim to summary list
        // - Move claim over clicked element
        // - Animate correct claim into correct position
        // - Show next panel
        // When wrong claim is clicked:
        // - Remove clickable
        // - Add error background image (css)
        $node.click(function(){
          var $el = $('#'+this.id, $myDom);
          var node_id = parseInt(this.id.replace(/[a-z\-]+/,''));
          var classname = answer[node_id] ? 'success' : 'failed';

          // Correct answer?
          if(answer[node_id]){
            var position = $el.position();
            var summary = $summary_list.position();
            var $answer = $('<li>'+$el.html()+'</li>');

            // Insert correct claim into summary list
            $summary_list.append($answer);
            adjustTargetHeight($summary_container, $summary_list, $answer);

            // Move into position over clicked element
            $answer.css({ display: 'block', width: $el.css('width'), height: $el.css('height') });
            $answer.css({ position: 'absolute', top: position.top, left: position.left });
            $answer.css('background-position', (parseInt($el.innerWidth()) - 25) + 'px center');

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
                  left: '-='+options_padding+'px',
                  width: '+='+(options_padding*2)+'px'
                },
                {
                  step: function(){
                    // Need to reposition background image on each step as el width grows in animation
                    $(this).css('background-position', (parseInt($(this).innerWidth()) - 25) + 'px center');
                  },
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
                      $next_panel.fadeIn('fast');
                    }
                    else {
                      // Hide intermediate evaluation
                      $evaluation.html('&nbsp;');

                      do_final_evaluation($summary_container, $options, $summary_list, score);
                    }
                  }
                }
              );
            });
          }
          else {
            // Remove event handler (prevent repeated clicks) and mouseover effect
            $el.off('click');
            $el.addClass('summary-failed');
            $el.removeClass('summary-claim-unclicked');
            $el.css('background-position', (parseInt($el.innerWidth()) - 25) + 'px center');
            $score.html('Antall feil: ' + (++score));
            panel_id = $el.parent().attr('data-panel');
            options.summaries[panel_id].error_count++;
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
