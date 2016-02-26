// ==UserScript==
// @name         Show Timeline
// @namespace    https://github.com/Tunaki/stackoverflow-userscripts
// @version      0.1
// @description  Adds an anchor below posts that links to their timeline
// @author       Tunaki
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/q(uestions)?\/\d+/
// @require      http://code.jquery.com/jquery-2.2.1.min.js
// @grant        none
// ==/UserScript==

(function($) {
  $('.post-menu').each(function() {
    var $this = $(this);
    var answerId = $this.find('a.flag-post-link').attr('data-postid');
    $this.append($('<span>').attr('class', 'lsep').html('|'));
    $this.append($('<a>').attr({'class': 'short-link', 'href': '/posts/' + answerId + '/timeline'}).html('timeline'));
  });
}($));
