// ==UserScript==
// @name         Reflag Review
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.1
// @description  In the flag history, keeps only NAA/VLQ helpful-flagged answers and loads them to review and potentially ask for reflags
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/users\/flag-summary\/\d+/
// @grant        none
// ==/UserScript==

StackExchange.using("inlineEditing", function () {
  StackExchange.inlineEditing.init();
});

$('#mainbar.user-flag-history').prepend(
  $('<div>').append(
    $('<a>').attr('href', '#').click(function() {
      $('.flagged-post').hide();
      $('.flagged-post').filter(':has(.Helpful):not(:has(.deleted-answer))').filter(function() {
        return $.inArray($('.revision-comment', this).html(), ['not an answer', 'very low quality']) != -1 && $('.mod-flag', this).length == 1;
      }).each(function() {
        var href = $('.answer-hyperlink', this).attr('href');
        loadAnswerInto(href.split('#')[1], href.split('\/')[2], $(this));
      }).show();
      $(this).remove();
    }).html('reflags')
  ).css('padding-bottom', '10px')
);

function loadAnswerInto(answerId, questionId, $element) {
  $.get('/posts/ajax-load-realtime/' + answerId, function(data) {
    $element.html(data);
    $element.find('.js-show-link.comments-link').click();
    StackExchange.question.init({
      canViewVoteCounts: true,
      questionId: questionId
    });
    StackExchange.realtime.subscribeToQuestion('1', questionId);
  });
}
