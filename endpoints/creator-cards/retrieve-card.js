const { createHandler } = require('@app-core/server');
const { CreatorCardMessages } = require('@app/messages');
const retrieveCreatorCard = require('@app/services/creator-cards/retrieve-card');

function requestData(rc) {
  return { ...rc.query, slug: rc.params.slug };
}

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const data = await retrieveCreatorCard(requestData(rc));

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.RETRIEVED,
      data,
    };
  },
});
