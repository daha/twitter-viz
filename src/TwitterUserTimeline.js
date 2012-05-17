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

/*globals $,BigInteger,localStorage */
"use strict";

function TwitterUserTimeline() {
    var that = this,
        userTimelineUrlBase = ('https://api.twitter.com/1/statuses/user_timeline.json'
            + '?callback=?'
            + '&count=100'
            + '&trim_user=1'
            + '&include_entities=1'
            + '&include_rts=1'
            + '&contributor_details=1'
            + '&screen_name='),
        requestNumber = 0,
        maxId = BigInteger(0),
        sinceId = BigInteger(0),
        expectedTweetCount = 0;

    this.tweets = [];

    this.complete = function (tweets) {
        // A callback function called when all the available tweets has been downloaded.
    };

    this.updateProgress = function (percent) {
        // A callback function called when the progress is updated.
    };

    this.error = function (d, msg) {
        // A callback function called in case of a error.
    };

    function updateProgress() {
        var percent = Math.floor(that.tweets.length / expectedTweetCount * 100);
        that.updateProgress(percent);
    }

    function getLocalStorageKey(twitterUsername) {
        return 'user=' + twitterUsername.toLowerCase();
    }

    function saveTweetsToLocalStorage(twitterUsername) {
        try {
            localStorage[getLocalStorageKey(twitterUsername)] = JSON.stringify(that.tweets);
        } catch (e) {
            console.log("Local storage is full, failed to store tweets for " + twitterUsername);
        }
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

    function makeSuccessFunction(currentRequestNumber, twitterUsername, baseUrl) {
        return function (response) {
            if (currentRequestNumber === requestNumber) {
                if (response.length > 0) { // did get new data
                    if (sinceId.isZero()) { // a response with older tweets
                        that.tweets = that.tweets.concat(response);
                    } else if (maxId.isZero()) { // a response with newer tweets
                        that.tweets = response.concat(that.tweets);
                    } else { // need to sort!
                        that.tweets = that.tweets.concat(response);
                        that.tweets.sort(function (a, b) {
                            return BigInteger(a.id_str).compare(BigInteger(b.id_str));
                        });
                    }
                    updateProgress();
                    maxId = BigInteger(response[response.length - 1].id_str); // The oldest is last
                    fetchUserTimeline(currentRequestNumber, twitterUsername, baseUrl);
                } else {
                    that.updateProgress(100);
                    saveTweetsToLocalStorage(twitterUsername);
                    that.complete(that.tweets);
                }
            } else {
                console.log('Received response from old search!', currentRequestNumber, requestNumber);
            }
        };
    }

    function makeRequest(currentRequestNumber, twitterUsername, baseUrl, requestUrl) {
        $.jsonp({
            url: requestUrl,
            success: makeSuccessFunction(currentRequestNumber, twitterUsername, baseUrl),
            error: that.error
        });
    }

    function fetchUserTimeline(currentRequestNumber, twitterUsername, baseUrl) {
        var currentUrl = baseUrl;

        // https://dev.twitter.com/docs/working-with-timelines
        currentUrl = addMaxIdIfPresent(currentUrl);
        currentUrl = addSinceIdIfPresent(currentUrl);
        makeRequest(currentRequestNumber, twitterUsername, baseUrl, currentUrl);
    }

    this.fetchUserTweets = function (twitterUsername,  tweetCount) {
        var currentRequestNumber,
            localStorageKey = getLocalStorageKey(twitterUsername),
            currentUrl = userTimelineUrlBase + twitterUsername;
        requestNumber += 1;
        currentRequestNumber = requestNumber;
        expectedTweetCount = tweetCount;
        that.tweets = [];
        maxId = BigInteger(0);
        sinceId = BigInteger(0);
        updateProgress();

        if (localStorage[localStorageKey]) {
            that.tweets = JSON.parse(localStorage[localStorageKey]);
            updateProgress();
            console.log('Found ' + that.tweets.length + ' tweets in localStorage!');
            if (that.tweets.length > 0) {
                // set sinceId to only fetch new feeds
                sinceId = BigInteger(that.tweets[0].id_str);
            }
        }

        fetchUserTimeline(currentRequestNumber, twitterUsername, currentUrl);
    };
}
