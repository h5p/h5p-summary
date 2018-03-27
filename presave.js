var H5PPresave = H5PPresave || {};

H5PPresave['H5P.Summary'] = function (content, finished) {
  var presave = H5PEditor.Presave;
  var score = 0;

  if (isContentInValid()) {
    throw new presave.exceptions.InvalidContentSemanticsException('Invalid Summary Error');
  }

  score = content.summaries.length;

  presave.validateScore(score);

  if (finished) {
    finished({maxScore: score});
  }

  function isContentInValid() {
    return !presave.checkNestedRequirements(content, 'content.summaries') || !Array.isArray(content.summaries);
  }
};
