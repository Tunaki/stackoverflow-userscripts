// ==UserScript==
// @name         Reflag Review
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.2
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
      }).each(function(index) {
        var href = $('.answer-hyperlink', this).attr('href');
        loadAnswerInto(index, href.split('#')[1], href.split('\/')[2], $(this));
      }).show();
      $(this).remove();
    }).html('reflags')
  ).css('padding-bottom', '10px')
);

function loadAnswerInto(index, answerId, questionId, $element) {
  $.get('/posts/' + questionId + '/votes', function(votes) {
    $.get('/posts/ajax-load-realtime/' + answerId, function(data) {
      $element.html(data);
      if (index == 0) {        
        StackExchange.question.init({
          votesCast: votes,
          canViewVoteCounts: true,
          questionId: questionId,
          canOpenBounty: true
        });
      }
      StackExchange.realtime.subscribeToQuestion(StackExchange.options.site.id, questionId);
      $element.find('.js-show-link.comments-link').click();
    });
  });
}
