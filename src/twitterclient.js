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

// TODO: Create a new class for the fetching of the user timeline.
// TODO: Visualize the data with d3.js
// TODO: User workers for the calculations
// TODO: count all hashtags in the tweets
// TODO: count all the user_mentions in the tweets
$(document).ready(function () {
    var user_info_url = 'https://api.twitter.com/1/users/show.json?callback=?&include_entities=true&screen_name=',
        user_timeline_url_base = ('https://api.twitter.com/1/statuses/user_timeline.json'
                            + '?callback=?'
                            + '&count=100'
                            + '&trim_user=1'
                            + '&include_entities=1'
                            + '&include_rts=1'
                            + '&contributor_details=1'
                            + '&screen_name='),
        request_number = 0,
        tweets = [],
        max_id = BigInteger(0),
        since_id = BigInteger(0),
        twitter_username = '';

    function getLocalStorageKey(username) {
        return 'user=' + username.toLowerCase();
    }

    function saveTweetsToLocalStorage() {
        try {
            localStorage[getLocalStorageKey(twitter_username)] = JSON.stringify(tweets);
        } catch(e) {
            console.log("Local storage is full, failed to store tweets for " + twitter_username);
        }
    }

    function addTweetsToTag(tag) {
        $.each(tweets, function (i, tweet) {
            $(tag).append('<p>'+ tweet.text +'</p>');
        });
    }

    function addMaxIdIfPresent(current_url) {
        var result = current_url;
        if (!max_id.isZero()) {
            result += '&max_id=' + max_id.prev().toString();
        }
        return result;
    }

    function addSinceIdIfPresent(current_url) {
        var result = current_url;
        if (!since_id.isZero()) {
            result += "&since_id=" + since_id.next().toString();
        }
        return result;
    }

    function makeSuccessFunction(current_request_number, base_url) {
        return (function (response) {
            if (current_request_number === request_number) {
                if (response.length > 0) { // did get new data
                    if (since_id.isZero()) { // a response with older tweets
                        tweets = tweets.concat(response);
                    } else if (max_id.isZero()) { // a response with newer tweets
                        tweets = response.concat(tweets);
                    } else { // need to sort!
                        tweets = tweets.concat(response);
                        tweets.sort(function (a, b) {
                            return BigInteger(a.id_str).compare(BigInteger(b.id_str));
                        });
                    }
                    max_id = BigInteger(response[response.length - 1].id_str); // The oldest is last
                    fetchUserTimeline(current_request_number, base_url);
                } else {
                    saveTweetsToLocalStorage();
                    addTweetsToTag('#tweets');
                }
            } else {
                console.log('Received response from old search!', current_request_number, request_number);
            }
        });
    }

    function error(d, msg) {
        console.log('Failed to fetch user timeline: ' + msg);
    }

    function makeRequest(current_request_number, base_url, request_url) {
        $.jsonp({
            url: request_url,
            success: makeSuccessFunction(current_request_number, base_url),
            error: error
        });
    }

    function fetchUserTimeline(current_request_number, base_url) {
        var current_url = base_url;

        // https://dev.twitter.com/docs/working-with-timelines
        current_url = addMaxIdIfPresent(current_url);
        current_url = addSinceIdIfPresent(current_url);
        makeRequest(current_request_number, base_url, current_url);
    }

    function fetchUserTweets(current_request_number) {
        var local_storage_key = getLocalStorageKey(twitter_username),
            current_url = user_timeline_url_base + twitter_username;
        if (localStorage[local_storage_key]) {
            tweets = JSON.parse(localStorage[local_storage_key]);
            console.log('Found ' + tweets.length + ' tweets in localStorage!');
            if (tweets.length > 0) {
                // set since_id to only fetch new feeds
                since_id = BigInteger(tweets[0].id_str);
            }
        }

        $('#tweets').html('');
        fetchUserTimeline(current_request_number, current_url);
    }

    function insertLabeledText(selector, label, text) {
        if (text !== '') {
            selector.append('<dt>' + label + '</dt><dd>' + text + '</dd>');
        }
    }

    $('#userSearch').submit(function () {
        var current_request_number;
        request_number += 1;
        current_request_number = request_number;

        // Reset the internal state, for the new request
        tweets = [];
        max_id = BigInteger(0);
        since_id = BigInteger(0);
        twitter_username = $('#twitter_username_query').val().toLowerCase();

        $('#twitterResults').html('');

        $.jsonp({
            url: user_info_url + twitter_username,
            success: function (response) {
                user_info = $('#user_info');
                user_info.html('');
                insertLabeledText(user_info, 'Name', response.name);
                insertLabeledText(user_info, 'Screen name', '@' + response.screen_name);
                insertLabeledText(user_info, 'Id', response.id);
                insertLabeledText(user_info, 'Location', response.location);
                insertLabeledText(user_info, 'Followers', response.followers_count);
                insertLabeledText(user_info, 'Following', response.friends_count);
                insertLabeledText(user_info, 'Favorites', response.favourites_count);
                insertLabeledText(user_info, 'Tweets', response.statuses_count);
                insertLabeledText(user_info, 'Created', response.created_at);

                $('#user_image').html('<img src="' + response.profile_image_url + '">');
                $('#user_description').html('<p>' + response.description + '</p>');

                fetchUserTweets(current_request_number);
            },
            error: function (d, msg) {
                console.log('error!');
            }
        });
        return false;
    });
});
