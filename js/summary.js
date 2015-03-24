var H5P = H5P || {};

H5P.Summary = function(options, contentId, contentData) {
  if (!(this instanceof H5P.Summary)) {
    return new H5P.Summary(options, contentId);
  }
  this.id = this.contentId = contentId;
  H5P.EventDispatcher.call(this);
  var offset = 0;
  var score = 0;
  var answer = Array();
  var error_counts = [];
  if (contentData && contentData.previousState !== undefined) {
    error_counts = contentData.previousState.answers;
    for (var i = 0; i < error_counts.length; i++) {
      score += error_counts[i];
    }
  }
  var that = this;
  this.options = H5P.jQuery.extend({}, {
    response: {
      scorePerfect:
              {
                title: "PERFECT!",
                message: "You got everything correct on your first try. Be proud!"
              },
      scoreOver70:
              {
                title: "Great!",
                message: "You got most of the statements correct on your first try!"
              },
      scoreOver40:
              {
                title: "Ok",
                message: "You got some of the statements correct on your first try. There is still room for improvement."
              },
      scoreOver0:
              {
                title: "Not good",
                message: "You need to work more on this"
              }
    },
    summary: "You got @score of @total statements (@percent %) correct.",
    resultLabel: "Your result:",
    intro: "Choose the correct statement.",
    solvedLabel: "Solved:",
    scoreLabel: "Wrong answers:",
    postUserStatistics: (H5P.postUserStatistics === true)
  }, options);

  var summaries = that.options.summaries;

  var countErrors = function() {
    var error_count = 0;

    // Count boards without errors
    for (var i = 0; i < summaries.length; i++) {
      if (error_counts[i] === undefined) {
        error_count++;
      }
      else {
        error_count += error_counts[i] ? 1 : 0;
      }
    }

    return error_count;
  };

  // Function for attaching the multichoice to a DOM element.
  this.attach = function(target) {
    var self = this;
    var c = 0; // element counter
    var elements = [];
    var $ = H5P.jQuery;
    var $target = typeof(target) === "string" ? $("#" + target) : $(target);
    var $myDom = $target;

    $target.addClass('summary-content');

    if (summaries === undefined || summaries.length === 0) {
      return;
    }

    function adjustTargetHeight(container, elements, el) {
      var new_height = parseInt(elements.outerHeight()) + parseInt(el.outerHeight()) + parseInt(el.css('marginBottom')) + parseInt(el.css('marginTop'));
      if (new_height > parseInt(container.css('height'))) {
        container.animate({height: new_height});
      }
    }

    function do_final_evaluation(container, options_panel, list, score) {
      var error_count = countErrors();

      // Calculate percentage
      var percent = 100 - (error_count / error_counts.length * 100);

      // Find evaluation message
      var from = 0;
      for (var i in that.options.response) {
        switch (i) {
          case "scorePerfect":
            from = 100;
            break;
          case "scoreOver70":
            from = 70;
            break;
          case "scoreOver40":
            from = 40;
            break;
          case "scoreOver0":
            from = 0;
            break;
        }
        if (percent >= from) {
          break;
        }
      }

      // Show final evaluation
      var summary = that.options.summary.replace('@score', summaries.length - error_count).replace('@total', summaries.length).replace('@percent', Math.round(percent));
      var message = '<h2>' + that.options.response[i].title + "</h2>" + summary + "<br/>" + that.options.response[i].message;
      var evaluation = $('<div class="evaluation-container"></div>');
      var evaluation_emoticon = $('<span class="h5p-evaluation-emoticon h5p-score-over-' + from + '"></span>');
      var evaluation_message = $('<div class="evaluation-message">' + message + '</div>');
      options_panel.append(evaluation);
      evaluation.append(evaluation_emoticon);
      evaluation.append(evaluation_message);
      evaluation.fadeIn('slow');
      // adjustTargetHeight(container, list, evaluation);


      self.trigger('resize');

      if (that.options.postUserStatistics === true) {
        var myScore = Math.max(error_counts.length - error_count, 0);
        that.triggerXAPICompleted(myScore, error_counts.length);
      }
    }

    // Create array objects
    for (var i = 0; i < summaries.length; i++) {
      elements[i] = {
        tip: summaries[i].tip,
        summaries: []
      };
      for (var j = 0; j < summaries[i].summary.length; j++) {
        answer[c] = (j === 0); // First claim is correct
        elements[i].summaries[j] = {
          id: c++,
          text: summaries[i].summary[j]
        };
      }

      // Randomize elements
      for (var k = elements[i].summaries.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var temp = elements[i].summaries[k];
        elements[i].summaries[k] = elements[i].summaries[j];
        elements[i].summaries[j] = temp;
      }
    }

    // Create content panels
    var $summary_container = $('<div class="summary-container"></div>');
    var $summary_list = $('<ul></ul>');
    var $evaluation = $('<div class="summary-evaluation"></div>');
    var $evaluation_content = $('<div class="summary-evaluation-content">' + that.options.intro + '</div>');
    var $score = $('<div class="summary-score"></div>');
    var $options = $('<div class="summary-options"></div>');
    var $progress = $('<div class="summary-progress"></div>');
    var options_padding = parseInt($options.css('paddingLeft'));

    if (score) {
      $score.html(that.options.scoreLabel + ' ' + score).show();
    }

    // Insert content
    $summary_container.append($summary_list);
    $myDom.append($summary_container);
    $myDom.append($evaluation);
    $myDom.append($options);
    $evaluation.append($evaluation_content);
    $evaluation.append($progress);
    $evaluation.append($score);

    $progress.html(that.options.solvedLabel + ' ' + error_counts.length + '/' + summaries.length);

    // Add elements to content
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      if (i <= error_counts.length - 1) {
        for (var j = 0; j < element.summaries.length; j++) {
          var sum = element.summaries[j];
          if (answer[sum.id]) {
            $summary_list.append('<li style="display:block">' + sum.text + '</li>');
            break;
          }
        }
        // Cannot use continue; due to id/animation system
      }

      var $page = $('<ul class="h5p-panel" data-panel="' + i + '"></ul>');


      // Create initial tip for first summary-list if tip is available
      if (i==0 && element.tip !== undefined && element.tip.trim().length > 0) {
        $evaluation_content.append(H5P.JoubelUI.createTip(element.tip));
      }

      for (var j = 0; j < element.summaries.length; j++) {
        var $node = $('<li data-bit="' + element.summaries[j].id + '" class="summary-claim-unclicked">' + element.summaries[j].text + '</li>');

        // When correct claim is clicked:
        // - Add claim to summary list
        // - Move claim over clicked element
        // - Animate correct claim into correct position
        // - Show next panel
        // When wrong claim is clicked:
        // - Remove clickable
        // - Add error background image (css)
        $node.click(function() {
          that.triggerXAPI('attempted');
          var $el = $(this);
          var node_id = $el.attr('data-bit');
          var classname = answer[node_id] ? 'success' : 'failed';
          panel_id = $el.parent().data('panel');
          if (error_counts[panel_id] === undefined) {
            error_counts[panel_id] = 0;
          }

          // Correct answer?
          if (answer[node_id]) {
            var position = $el.position();
            var summary = $summary_list.position();
            var $answer = $('<li>' + $el.html() + '</li>');

            $progress.html(that.options.solvedLabel + ' '  + (panel_id + 1) + '/' + summaries.length);

            // Insert correct claim into summary list
            $summary_list.append($answer);
            adjustTargetHeight($summary_container, $summary_list, $answer);

            // Move into position over clicked element
            $answer.css({display: 'block', width: $el.css('width'), height: $el.css('height')});
            $answer.css({position: 'absolute', top: position.top, left: position.left});
            $answer.css({backgroundColor: '#d1e2ce', borderColor: '#afcdaa'});
            setTimeout(function () {
              $answer.css({backgroundColor: '', borderColor: ''});
            }, 1);
            //$answer.animate({backgroundColor: '#eee'}, 'slow');

            var panel = parseInt($el.parent().attr('data-panel'));
            var $curr_panel = $('.h5p-panel:eq(' + panel + ')', $myDom);
            var $next_panel = $('.h5p-panel:eq(' + (panel + 1) + ')', $myDom);
            var height = $curr_panel.parent().css('height');

            // Update tip:
            $evaluation_content.find('.joubel-tip-container').remove();
            if (element.tip !== undefined && element.tip.trim().length > 0) {
              $evaluation_content.append(H5P.JoubelUI.createTip(element.tip));
            }

            // Fade out current panel
            $curr_panel.fadeOut('fast', function() {
              // Force panel height to recorded height
              $curr_panel.parent().css('height', '');

              // Animate answer to summary
              $answer.animate(
                {
                  top: summary.top + offset,
                  left: '-=' + options_padding + 'px',
                  width: '+=' + (options_padding * 2) + 'px'
                },
                {
                  complete: function() {
                    // Remove position (becomes inline);
                    $(this).css('position', '').css({width: '', height: '', top: '', left: ''});
                    $summary_container.css('height', '');

                    // Calculate offset for next summary item
                    var tpadding = parseInt($answer.css('paddingTop')) * 2;
                    var tmargin = parseInt($answer.css('marginBottom'));
                    var theight = parseInt($answer.css('height'));
                    offset += theight + tpadding + tmargin + 1;

                    // Show next panel if present
                    if ($next_panel.length) {
                      $curr_panel.parent().css('height', 'auto');
                      $next_panel.fadeIn('fast');
                    }
                    else {
                      // Hide intermediate evaluation
                      $evaluation_content.html(that.options.resultLabel);

                      do_final_evaluation($summary_container, $options, $summary_list, score);
                    }
                    self.trigger('resize');
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

            $('.summary-score').css('display', 'block');
            $score.html(that.options.scoreLabel + ' ' + (++score));
            error_counts[panel_id]++;
          }

          self.trigger('resize');
        });

        $page.append($node);
      }

      $options.append($page);
    }

    if (error_counts.length === elements.length) {
      $evaluation_content.html(that.options.resultLabel);
      do_final_evaluation($summary_container, $options, $summary_list, score);
    }
    else {
      // Show first panel
      $('.h5p-panel:eq(' + (error_counts.length) + ')', $myDom).css({display: 'block'});
      if (error_counts.length) {
        offset = ($('.summary-claim-unclicked:visible:first', $myDom).outerHeight() * error_counts.length);
      }
    }

    self.trigger('resize');

    return this;
  };

  // Required questiontype contract function
  this.showSolutions = function() {
    // intentionally left blank, no solution view exists
  };

  // Required questiontype contract function
  this.getMaxScore = function() {
    return summaries.length;
  };

  this.getScore = function() {
    return this.getMaxScore() - countErrors();
  }
  this.getH5PTitle = function() {
    return H5P.createH5PTitle(this.options.intro);
  };

  this.getCurrentState = function () {
    return {
      answers: error_counts
    };
  };
};

H5P.Summary.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.Summary.prototype.constructor = H5P.Summary;
