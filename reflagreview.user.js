// ==UserScript==
// @name         Reflag Review
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.2.1
// @description  In the flag history, keeps only NAA/VLQ helpful-flagged on non-deleted answers and loads them to review and potentially ask for reflags
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/users\/flag-summary\/\d+/
// @grant        none
// ==/UserScript==

StackExchange.using("inlineEditing", function () {
  StackExchange.inlineEditing.init();
});

var time = 0;

$('#mainbar.user-flag-history').prepend(
  $('<div>').append(
    $('<a>').attr('href', '#').click(function() {
      $('.flagged-post').hide();
      var $posts = $('.flagged-post').filter(':has(.Helpful):not(:has(.deleted-answer))').filter(function() {
        return $.inArray($('.revision-comment', this).html(), ['not an answer', 'very low quality']) != -1 && $('.mod-flag', this).length == 1;
      });
      var length = $posts.length;
      $posts.each(function(index) {
        var href = $('.answer-hyperlink', this).attr('href');
        setTimeout(loadAnswerInto, time, index === length - 1, href.split('#')[1], href.split('\/')[2], $(this));
        time += 500;
      }).show();
      $(this).remove();
    }).html('reflags')
  ).css('padding-bottom', '10px')
);

function loadAnswerInto(last, answerId, questionId, $element) {
  $.get('/posts/' + questionId + '/votes', function(votes) {
    $.get('/posts/ajax-load-realtime/' + answerId, function(data) {
      $element.html(data);
      if (last) {        
        StackExchange.question.init({
          votesCast: votes,
          canViewVoteCounts: true,
          questionId: questionId
        });
        $('.js-show-link.comments-link').click();
      }
      StackExchange.realtime.subscribeToQuestion(StackExchange.options.site.id, questionId);
    });
  });
}
