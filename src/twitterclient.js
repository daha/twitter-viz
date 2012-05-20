// Copyright (c) 2012, David Haglund
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
//     * Redistributions of source code must retain the above
//       copyright notice, this list of conditions and the following
//       disclaimer.
//
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials
//       provided with the distribution.
//
//     * Neither the name of the copyright holder nor the names of its
//       contributors may be used to endorse or promote products
//       derived from this software without specific prior written
//       permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
// FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE.

/*globals $,document,TwitterUserTimeline,crossfilter */
// TODO: Visualize the data with d3.js
// TODO: Use workers for the calculations
// TODO: count all hashtags in the tweets
// TODO: count all the user_mentions in the tweets
"use strict";

$(document).ready(function () {
    var userInfoUrl = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
        twitterUserTimeline = null,
        chart = new Chart();

    function hideProgressBar(duration) {
        $('#progressbar').fadeOut(200, function () {
                                      $('.bar').width('0%');
                                  });
    }

    function postError(msg) {
        $('#alert_container').html((' <div class="span4 offset4 alert alert-error">' +
            '  <button class="close" data-dismiss="alert">x</button>' +
            '  <div id="alert_message">' + msg + '</div>' +
            ' </div>'));
        $(".alert").alert();
    }

    function error(d, msg) {
        hideProgressBar('fast');
        postError('Failed to fetch user timeline: ' + msg);
    }

    function clearErrors() {
        $(".alert").alert('close');
    }

    function insertLabeledText(selector, label, text) {
        if (text !== '') {
            selector.append('<dt>' + label + '</dt><dd>' + text + '</dd>');
        }
    }

    function updateProgressBar(percent) {
        $('.bar').width(percent + '%');
        $('#progressbar').show();
    }

    function showTweets(tweets) {
        $.each(tweets, function (i, tweet) {
            $('#tweets').append('<p>' + tweet.text + '</p>');
        });
        return false;
    }

    function visualize(tweets) {
        var cf = crossfilter(tweets),
            tweetsLength = cf.dimension(function (d) { return d.text.length; }),
            tweetsLengths = tweetsLength.group();

        chart.createChart("#tweet_lengths", tweetsLengths.all());
    }

    function complete(tweets) {
        hideProgressBar('slow');
        showTweets(tweets);
        visualize(twitterUserTimeline.tweets);
    }

    function submitQuery(twitterUsername) {
        var userInfo;
        $.jsonp({
                    url: userInfoUrl + twitterUsername,
                    success: function (response) {
                        userInfo = $('#user_info');
                        userInfo.html('');
                        insertLabeledText(userInfo, 'Name', response.name);
                        insertLabeledText(userInfo, 'Screen name', '@' + response.screen_name);
                        insertLabeledText(userInfo, 'Id', response.id);
                        insertLabeledText(userInfo, 'Location', response.location);
                        insertLabeledText(userInfo, 'Followers', response.followers_count);
                        insertLabeledText(userInfo, 'Following', response.friends_count);
                        insertLabeledText(userInfo, 'Favorites', response.favourites_count);
                        insertLabeledText(userInfo, 'Tweets', response.statuses_count);
                        insertLabeledText(userInfo, 'Created', response.created_at);
                        $('#user_image').html('<img src="' + response.profile_image_url + '">');
                        $('#user_description').html('<p>' + response.description + '</p>');
                        $('#tweets').html('');
                        $('#tweet_lengths').html('');

                        twitterUserTimeline.fetchUserTweets(twitterUsername, response.statuses_count);
                    },
                    error: function (d, msg) {
                        hideProgressBar('fast');
                        postError('Failed to find user ' + twitterUsername);
                    }
                });
    };

    twitterUserTimeline = new TwitterUserTimeline();

    twitterUserTimeline.updateProgress = updateProgressBar;
    twitterUserTimeline.complete = complete;
    twitterUserTimeline.error = error;

    console.log(twitterUserTimeline);

    $('#userSearch').submit(function () {
        var twitterUsername = $('#twitter_username_query').val().toLowerCase();

        clearErrors();
        submitQuery(twitterUsername);
        return false;
    });
});
