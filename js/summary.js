window.H5P = window.H5P || {};

H5P.Summary = function (options, contentId) {
	if ( !(this instanceof H5P.Summary) ){
		return new H5P.Summary(options, contentId);
	}

	var $ = H5P.jQuery;

  var params = options;
  var $myDom;

  // Function for attaching the multichoice to a DOM element.
  var attach = function (target) {
    var $target;
    if (typeof(target) === "string") {
      $target = $("#" + target);
    } else {
      $target = $(target);
    }

    // Render own DOM into target.
    $myDom = $target;
    $myDom.html('options='+options.summaries);
    return this;
  };

  // Masquerade the main object to hide inner properties and functions.
  var returnObject = {
    attach: attach // Attach to DOM object
  };

  return returnObject;
};
