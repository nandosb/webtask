/**
* Track sub-reddit authors
*/

const Redis = require('redis');
const _ = require('lodash');

/**
* @param context {WebtaskContext}
*/
module.exports = function(context, cb) {

  const rankingName = 'author_ranking',
        lastedAuthor = 'lasted_author',
        redisClient = Redis.createClient({
          host: context.data.redisHost,
          port: context.data.redisPort,
          database: context.data.redisDatabase,
          password: context.data.redisPassword
        });
  redisClient.on("connect", function () {
    // this should be a POST api call
    if (context.data.author) {
      redisClient.zincrby(rankingName, 1, context.data.author);
      redisClient.set(lastedAuthor, context.data.author);
      cb(null, { result: 'ok' });
    }
    // this should be a GET api call
    else {
      redisClient.zrevrangebyscore([rankingName, '+inf', '-inf', 'WITHSCORES', 'LIMIT', '0', '10'], function(error, res) {
        const result = [];
        // format the response like an object
        _.forEach(_.chunk(res, 2), function(chunk) {
          result.push({
            'username': chunk[0],
            'score': chunk[1]
          });
        });
        // show the response
        cb(null, { ranking: result });
      });
    }
  });
};
