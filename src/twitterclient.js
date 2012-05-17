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

/*globals $,document,BigInteger,localStorage */
// TODO: Create a new class for the fetching of the user timeline.
// TODO: Visualize the data with d3.js
// TODO: User workers for the calculations
// TODO: count all hashtags in the tweets
// TODO: count all the user_mentions in the tweets

$(document).ready(function () {
    var userInfoUrl = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
        globalTwitterUsername = '',
        twitterUserTimeline = null;

    function postError(msg) {
        $('#alert_container').html(
        ' <div class="span4 offset4 alert alert-error">' +
        '  <button class="close" data-dismiss="alert">x</button>' +
        '  <div id="alert_message">' + msg + '</div>' +
        ' </div>');
        $(".alert").alert();
    }


    function completeBar() {
        $('.bar').width('100%');
    }

    function hideProgressBar(duration) {
        $('#progressbar').fadeOut(duration, function () {
            $(this).addClass('invisible');
            $('.bar').width('0%');
        });
    }


    function TwitterUserTimeline() {
        var userTimelineUrlBase = ('https://api.twitter.com/1/statuses/user_timeline.json'
                + '?callback=?'
                + '&count=100'
                + '&trim_user=1'
                + '&include_entities=1'
                + '&include_rts=1'
                + '&contributor_details=1'
                + '&screen_name='),
            requestNumber = 0,
            tweets = [],
            maxId = BigInteger(0),
            sinceId = BigInteger(0),
            expectedTweetCount = 0,
            twitterUsername = '';

        function updateProgressBar() {
            var width = Math.floor(tweets.length / expectedTweetCount * 100);
            $('.bar').width(width + '%');
            $('#progressbar').removeClass('invisible');
        }

        function getLocalStorageKey(username) {
            return 'user=' + username.toLowerCase();
        }

        function saveTweetsToLocalStorage() {
            try {
                localStorage[getLocalStorageKey(twitterUsername)] = JSON.stringify(tweets);
            } catch (e) {
                console.log("Local storage is full, failed to store tweets for " + twitterUsername);
            }
        }

        function addTweetsToTag(tag) {
            $.each(tweets, function (i, tweet) {
                $(tag).append('<p>' + tweet.text + '</p>');
            });
        }

        function addMaxIdIfPresent(currentUrl) {
            var result = currentUrl;
            if (!maxId.isZero()) {
                result += '&max_id=' + maxId.prev().toString();
            }
            return result;
        }

        function addSinceIdIfPresent(currentUrl) {
            var result = currentUrl;
            if (!sinceId.isZero()) {
                result += "&since_id=" + sinceId.next().toString();
            }
            return result;
        }


        function error(d, msg) {
            hideProgressBar('fast');
            postError('Failed to fetch user timeline: ' + msg);
        }

        function makeSuccessFunction(currentRequestNumber, baseUrl) {
            return function (response) {
                if (currentRequestNumber === requestNumber) {
                    if (response.length > 0) { // did get new data
                        if (sinceId.isZero()) { // a response with older tweets
                            tweets = tweets.concat(response);
                        } else if (maxId.isZero()) { // a response with newer tweets
                            tweets = response.concat(tweets);
                        } else { // need to sort!
                            tweets = tweets.concat(response);
                            tweets.sort(function (a, b) {
                                return BigInteger(a.id_str).compare(BigInteger(b.id_str));
                            });
                        }
                        updateProgressBar();
                        maxId = BigInteger(response[response.length - 1].id_str); // The oldest is last
                        fetchUserTimeline(currentRequestNumber, baseUrl);
                    } else {
                        completeBar();
                        saveTweetsToLocalStorage();
                        addTweetsToTag('#tweets');
                        hideProgressBar('slow');
                    }
                } else {
                    console.log('Received response from old search!', currentRequestNumber, requestNumber);
                }
            };
        }

        function makeRequest(currentRequestNumber, baseUrl, requestUrl) {
            $.jsonp({
                url: requestUrl,
                success: makeSuccessFunction(currentRequestNumber, baseUrl),
                error: error
            });
        }

        function fetchUserTimeline(currentRequestNumber, baseUrl) {
            var currentUrl = baseUrl;

            // https://dev.twitter.com/docs/working-with-timelines
            currentUrl = addMaxIdIfPresent(currentUrl);
            currentUrl = addSinceIdIfPresent(currentUrl);
            makeRequest(currentRequestNumber, baseUrl, currentUrl);
        }

        this.fetchUserTweets = function (username,  tweetCount) {
            var currentRequestNumber;
            requestNumber += 1;
            currentRequestNumber = requestNumber;
            twitterUsername = username;
            expectedTweetCount = tweetCount;
            tweets = [];
            maxId = BigInteger(0);
            sinceId = BigInteger(0);
            updateProgressBar();

            var localStorageKey = getLocalStorageKey(twitterUsername),
            currentUrl = userTimelineUrlBase + twitterUsername;
            if (localStorage[localStorageKey]) {
                tweets = JSON.parse(localStorage[localStorageKey]);
                updateProgressBar();
                console.log('Found ' + tweets.length + ' tweets in localStorage!');
                if (tweets.length > 0) {
                    // set sinceId to only fetch new feeds
                    sinceId = BigInteger(tweets[0].id_str);
                }
            }

            $('#tweets').html('');
            fetchUserTimeline(currentRequestNumber, currentUrl);
        };
    }

    function clearErrors() {
        $(".alert").alert('close');
    }

    function insertLabeledText(selector, label, text) {
        if (text !== '') {
            selector.append('<dt>' + label + '</dt><dd>' + text + '</dd>');
        }
    }

    twitterUserTimeline = new TwitterUserTimeline();

    $('#userSearch').submit(function () {
        var userInfo;

        // Reset the internal state, for the new request

        globalTwitterUsername = $('#twitter_username_query').val().toLowerCase();

        clearErrors();

        $.jsonp({
            url: userInfoUrl + globalTwitterUsername,
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

                twitterUserTimeline.fetchUserTweets(globalTwitterUsername, response.statuses_count);
            },
            error: function (d, msg) {
                hideProgressBar('fast');
                postError('Failed to find user ' + globalTwitterUsername);
            }
        });
        return false;
    });
});
