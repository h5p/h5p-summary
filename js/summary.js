H5P.Summary = (function ($, Question, XApiEventBuilder) {

  function Summary(options, contentId, contentData) {
    if (!(this instanceof H5P.Summary)) {
      return new H5P.Summary(options, contentId);
    }
    this.id = this.contentId = contentId;
    Question.call(this, 'summary');
    this.offset = 0;
    this.score = 0;
    this.progress = 0;
    this.answers = [];
    this.answer = [];
    this.error_counts = [];
    /**
     * The key is panel index, returns an array of the answer indexes the user tried.
     *
     * @property {number[][]}
     */
    this.userResponses = [];

    /**
     * The first key is panel index, and the second key is data-bit, value is index in panel
     *
     * @property {number[][]}
     */
    this.dataBitMap = [];

    // Remove empty summary to avoid JS-errors
    if (options.summaries) {
      options.summaries = options.summaries.filter(function (element) {
        return element.summary !== undefined;
      });
    }
    
    if (contentData && contentData.previousState !== undefined &&
        contentData.previousState.progress !== undefined &&
        contentData.previousState.answers) {
      this.progress = contentData.previousState.progress || this.progress;
      this.answers = contentData.previousState.answers || this.answers;

      var currentProgress = this.progress;

      // Do not count score screen as an error
      if (this.progress >= options.summaries.length) {
        currentProgress = options.summaries.length - 1;
      }

      for (var i = 0; i <= currentProgress; i++) {
        if (this.error_counts[i] === undefined) {
          this.error_counts[i] = 0;
        }
        if (this.answers[i]) {
          this.score += this.answers[i].length;
          this.error_counts[i]++;
        }
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
      summary: "You got @score of @total statements (@percent %) correct on your first try.",
      resultLabel: "Your result:",
      intro: "Choose the correct statement.",
      solvedLabel: "Solved:",
      scoreLabel: "Wrong answers:",
      postUserStatistics: (H5P.postUserStatistics === true)
    }, options);

    this.summaries = that.options.summaries;

    // Required questiontype contract function
    this.showSolutions = function() {
      // intentionally left blank, no solution view exists
    };

    // Required questiontype contract function
    this.getMaxScore = function() {
      return this.summaries.length;
    };

    this.getScore = function() {
      var self = this;

      // count single correct answers
      return self.summaries.reduce(function(result, panel, index){
        var userResponse = self.userResponses[index] || [];

        return result + (self.correctOnFirstTry(userResponse) ? 1 : 0);
      }, 0);
    };

    this.getTitle = function() {
      return H5P.createTitle(this.options.intro);
    };

    this.getCurrentState = function () {
      return {
        progress: this.progress,
        answers: this.answers
      };
    };
  }

  Summary.prototype = Object.create(Question.prototype);
  Summary.prototype.constructor = Summary;

  /**
   * Registers DOM elements before they are attached.
   * Called from H5P.Question.
   */
  Summary.prototype.registerDomElements = function () {
    // Register task content area
    this.setContent(this.createQuestion());
  };

  // Function for attaching the multichoice to a DOM element.
  Summary.prototype.createQuestion = function() {
    var that = this;
    var id = 0; // element counter
    var elements = [];
    var $ = H5P.jQuery;
    this.$myDom = $('<div>', {
      'class': 'summary-content'
    });

    if (that.summaries === undefined || that.summaries.length === 0) {
      return;
    }

    // Create array objects
    for (var panelIndex = 0; panelIndex < that.summaries.length; panelIndex++) {
      if (!(that.summaries[panelIndex].summary && that.summaries[panelIndex].summary.length)) {
        continue;
      }

      elements[panelIndex] = {
        tip: that.summaries[panelIndex].tip,
        summaries: []
      };

      for (var summaryIndex = 0; summaryIndex < that.summaries[panelIndex].summary.length; summaryIndex++) {
        var isAnswer = (summaryIndex === 0);
        that.answer[id] = isAnswer; // First claim is correct

        // create mapping from data-bit to index in panel
        that.dataBitMap[panelIndex] = this.dataBitMap[panelIndex] || [];
        that.dataBitMap[panelIndex][id] = summaryIndex;

        // checks the answer and updates the user response array
        if(that.answers[panelIndex] && (that.answers[panelIndex].indexOf(id) !== -1)){
          this.storeUserResponse(panelIndex, summaryIndex);
        }

        // adds to elements
        elements[panelIndex].summaries[summaryIndex] = {
          id: id++,
          text: that.summaries[panelIndex].summary[summaryIndex]
        };
      }

      // if we have progressed passed this point, the success pattern must also be saved
      if(panelIndex < that.progress){
        this.storeUserResponse(panelIndex, 0);
      }

      // Randomize elements
      for (var k = elements[panelIndex].summaries.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var temp = elements[panelIndex].summaries[k];
        elements[panelIndex].summaries[k] = elements[panelIndex].summaries[j];
        elements[panelIndex].summaries[j] = temp;
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

    if (this.score) {
      $score.html(that.options.scoreLabel + ' ' + this.score).show();
    }

    // Insert content
    $summary_container.append($summary_list);
    this.$myDom.append($summary_container);
    this.$myDom.append($evaluation);
    this.$myDom.append($options);
    $evaluation.append($evaluation_content);
    $evaluation.append($evaluation);
    $evaluation.append($progress);
    $evaluation.append($score);

    /**
     * Handle selected alternative
     *
     * @param {jQuery} $el Selected element
     * @param {boolean} [setFocus] Set focus on first element of next panel.
     *  Used when alt was selected with keyboard.
     */
    var selectedAlt = function ($el, setFocus) {
      that.triggerXAPI('interacted');
      var node_id = Number($el.attr('data-bit'));
      var panel_id = Number($el.parent().data('panel'));
      if (that.error_counts[panel_id] === undefined) {
        that.error_counts[panel_id] = 0;
      }

      that.storeUserResponse(panel_id, node_id);

      // Correct answer?
      if (that.answer[node_id]) {
        that.progress++;
        var position = $el.position();
        var summary = $summary_list.position();
        var $answer = $('<li>' + $el.html() + '</li>');

        $progress.html(that.options.solvedLabel + ' '  + (panel_id + 1) + '/' + that.summaries.length);

        // Insert correct claim into summary list
        $summary_list.append($answer);
        $summary_container.addClass('has-results');
        that.adjustTargetHeight($summary_container, $summary_list, $answer);

        // Move into position over clicked element
        $answer.css({display: 'block', width: $el.css('width'), height: $el.css('height')});
        $answer.css({position: 'absolute', top: position.top, left: position.left});
        $answer.css({backgroundColor: '#9dd8bb', border: ''});
        setTimeout(function () {
          $answer.css({backgroundColor: ''});
        }, 1);
        //$answer.animate({backgroundColor: '#eee'}, 'slow');

        var panel = parseInt($el.parent().attr('data-panel'));
        var $curr_panel = $('.h5p-panel:eq(' + panel + ')', that.$myDom);
        var $next_panel = $('.h5p-panel:eq(' + (panel + 1) + ')', that.$myDom);
        var height = $curr_panel.parent().css('height');

        // Disable panel while waiting for animation
        $curr_panel.addClass('panel-disabled');

        // Update tip:
        $evaluation_content.find('.joubel-tip-container').remove();
        if (elements[that.progress] !== undefined &&
          elements[that.progress].tip !== undefined &&
          elements[that.progress].tip.trim().length > 0) {
          $evaluation_content.append(H5P.JoubelUI.createTip(elements[that.progress].tip));
        }

        $answer.animate(
          {
            top: summary.top + that.offset,
            left: '-=' + options_padding + 'px',
            width: '+=' + (options_padding * 2) + 'px'
          },
          {
            complete: function() {
              // Remove position (becomes inline);
              $(this).css('position', '').css({
                width: '',
                height: '',
                top: '',
                left: ''
              });
              $summary_container.css('height', '');

              // Calculate offset for next summary item
              var tpadding = parseInt($answer.css('paddingTop')) * 2;
              var tmargin = parseInt($answer.css('marginBottom'));
              var theight = parseInt($answer.css('height'));
              that.offset += theight + tpadding + tmargin + 1;

              // Fade out current panel
              $curr_panel.fadeOut('fast', function () {
                $curr_panel.parent().css('height', 'auto');
                // Show next panel if present
                if ($next_panel.length) {
                  $next_panel.fadeIn('fast');

                  // Focus first element of next panel
                  if (setFocus) {
                    $next_panel.children().get(0).focus();
                  }
                } else {
                  // Hide intermediate evaluation
                  $evaluation_content.html(that.options.resultLabel);

                  that.do_final_evaluation($summary_container, $options, $summary_list, that.score);
                }
                that.trigger('resize');
              });
            }
          }
        );
      }
      else {
        // Remove event handler (prevent repeated clicks) and mouseover effect
        $el.off('click');
        $el.addClass('summary-failed');
        $el.removeClass('summary-claim-unclicked');

        $evaluation.children('.summary-score').css('display', 'block');
        $score.html(that.options.scoreLabel + ' ' + (++that.score));
        that.error_counts[panel_id]++;
        if (that.answers[panel_id] === undefined) {
          that.answers[panel_id] = [];
        }
        that.answers[panel_id].push(node_id);
      }

      that.trigger('resize');
      $el.attr('tabindex', '-1');
    };

    $progress.html(that.options.solvedLabel + ' ' + this.progress + '/' + that.summaries.length);

    // Add elements to content
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      if (i < that.progress) { // i is panel_id
        for (var j = 0; j < element.summaries.length; j++) {
          var sum = element.summaries[j];
          if (that.answer[sum.id]) {
            $summary_list.append('<li style="display:block">' + sum.text + '</li>');
            $summary_container.addClass('has-results');
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
        var summaryLineClass = 'summary-claim-unclicked';

        // If progress is at current task
        if (that.progress === i && that.answers[that.progress]) {
          // Check if there are any previous wrong answers.
          for (var k = 0; k < that.answers[that.progress].length; k++) {
            if (that.answers[that.progress][k] === element.summaries[j].id) {
              summaryLineClass = 'summary-failed';
              break;
            }
          }
        }

        var $node = $('' +
          '<li role="button" tabindex="0" data-bit="' + element.summaries[j].id + '" class="' + summaryLineClass + '">' +
            element.summaries[j].text +
          '</li>');

        // Do not add click event for failed nodes
        if (summaryLineClass === 'summary-failed') {
          $page.append($node);
          continue;
        }

        $node.click(function() {
          selectedAlt($(this));
        }).keypress(function (e) {
          var keyPressed = e.which;
          // 32 - space
          if (keyPressed === 32) {
            selectedAlt($(this), true);
            e.preventDefault();
          }
        });

        $page.append($node);
      }

      $options.append($page);
    }

    if (that.progress === elements.length) {
      $evaluation_content.html(that.options.resultLabel);
      that.do_final_evaluation($summary_container, $options, $summary_list, that.score);
    }
    else {
      // Show first panel
      $('.h5p-panel:eq(' + (that.progress) + ')', that.$myDom).css({display: 'block'});
      if (that.progress) {
        that.offset = ($('.summary-claim-unclicked:visible:first', that.$myDom).outerHeight() * that.error_counts.length);
      }
    }

    that.trigger('resize');

    return this.$myDom;
  };

  /**
   * Calculate final score and display feedback.
   *
   * @param container
   * @param options_panel
   * @param list
   * @param score
   */
  Summary.prototype.do_final_evaluation = function (container, options_panel, list, score) {
    var that = this;
    var error_count = this.countErrors();

    // Calculate percentage
    var percent = 100 - (error_count / that.error_counts.length * 100);

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
    var summary = that.options.summary.replace('@score', that.summaries.length - error_count).replace('@total', that.summaries.length).replace('@percent', Math.round(percent));
    this.setFeedback(summary, that.summaries.length - error_count, that.summaries.length);

    that.trigger('resize');
    var myScore = Math.max(that.error_counts.length - error_count, 0);
    that.triggerXAPIScored(myScore, that.error_counts.length, 'answered');
  };

  /**
   * Resets the complete task back to its' initial state.
   * Used for contracts.
   */
  Summary.prototype.resetTask = function () {
    // Summary is not yet able to Reset itself
  };

  /**
   * Adjust height of container.
   *
   * @param container
   * @param elements
   * @param el
   */
  Summary.prototype.adjustTargetHeight = function (container, elements, el) {
    var new_height = parseInt(elements.outerHeight()) + parseInt(el.outerHeight()) + parseInt(el.css('marginBottom')) + parseInt(el.css('marginTop'));
    if (new_height > parseInt(container.css('height'))) {
      container.animate({height: new_height});
    }
  };

  /**
   * Count amount of wrong answers
   *
   * @returns {number}
   */
  Summary.prototype.countErrors = function() {
    var error_count = 0;

    // Count boards without errors
    for (var i = 0; i < this.summaries.length; i++) {
      if (this.error_counts[i] === undefined) {
        error_count++;
      }
      else {
        error_count += this.error_counts[i] ? 1 : 0;
      }
    }

    return error_count;
  };

  /**
   * Returns the choices array for xApi statements
   *
   * @param {String[]} answers
   *
   * @return {{ choices: []}}
   */
  Summary.prototype.getXApiChoices = function (answers) {
    var choices = answers.map(function(answer, index){
      return XApiEventBuilder.createChoice(index.toString(), answer);
    });

    return {
      choices: choices
    }
  };

  /**
   * Saves the user response
   *
   * @param {number} questionIndex
   * @param {number} answerIndex
   */
  Summary.prototype.storeUserResponse = function (questionIndex, answerIndex) {
    var self = this;
    if(self.userResponses[questionIndex] === undefined){
      self.userResponses[questionIndex] = [];
    }

    self.userResponses[questionIndex].push(this.dataBitMap[questionIndex][answerIndex]);
  };

  /**
   * Creates an xAPI answered event
   *
   * @param {string[]} summary
   * @param {number[]} userAnswer
   * @param {number} panelIndex
   *
   * @return {H5P.XAPIEvent}
   */
  Summary.prototype.createXApiAnsweredEvent = function (summary, userAnswer, panelIndex) {
    var self = this;
    var types = XApiEventBuilder.interactionTypes;

    // creates the definition object
    var definition = XApiEventBuilder.createDefinition()
      .interactionType(types.CHOICE)
      .correctResponsesPattern(['0'])
      .optional(self.getXApiChoices(summary))
      .build();

    // create the result object
    var result = XApiEventBuilder.createResult()
      .response(userAnswer.join('[,]'))
      .score((self.correctOnFirstTry(panelIndex) ? 1 : 0), 1)
      .build();

    return XApiEventBuilder.create()
      .verb(XApiEventBuilder.verbs.ANSWERED)
      .objectDefinition(definition)
      .contentId(self.contentId, panelIndex)
      .result(result)
      .build();
  };

  Summary.prototype.correctOnFirstTry = function(userAnswer){
    return (userAnswer.length === 1) && userAnswer[0] === 0;
  };

  /**
   * Retrieves the xAPI data necessary for generating result reports.
   *
   * @return {object}
   */
  Summary.prototype.getXAPIData = function(){
    var self = this;

    // create array with userAnswer
    var children =  self.summaries.map(function(panel, index) {
        var userResponse = self.userResponses[index] || [];
        var summary = panel.summary;
        var event = self.createXApiAnsweredEvent(summary, userResponse, index);
        return {
          statement: event.data.statement
        }
    });

    var result = XApiEventBuilder.createResult()
      .score(self.getScore(), self.getMaxScore())
      .build();

    // creates the definition object
    var definition = XApiEventBuilder.createDefinition()
      .interactionType(XApiEventBuilder.interactionTypes.COMPOUND)
      .name(self.options.intro)
      .description(self.options.intro)
      .build();

    var xAPIEvent = XApiEventBuilder.create()
      .verb(XApiEventBuilder.verbs.ANSWERED)
      .contentId(self.contentId)
      .objectDefinition(definition)
      .result(result)
      .build();

    return {
      statement: xAPIEvent.data.statement,
      children: children
    };
  };

  return Summary;

})(H5P.jQuery, H5P.Question, H5P.Summary.XApiEventBuilder);