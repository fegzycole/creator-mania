const CreatorCardRepository = require('@app/repository/creator-card');
const { throwCreatorCardError } = require('./helpers/errors');
const { serializeCreatorCard } = require('./helpers/serializer');
const { validateDeleteData } = require('./helpers/validation');

function ensureDeletedCardExists(card) {
  if (!card) throwCreatorCardError('NF01');
}

async function deleteCreatorCard(serviceData) {
  const data = validateDeleteData(serviceData);
  const deleted = Date.now();
  const card = await CreatorCardRepository.markDeletedBySlug(data.slug, deleted);

  ensureDeletedCardExists(card);

  const response = serializeCreatorCard(card, { includeAccessCode: true });
  return response;
}

module.exports = deleteCreatorCard;
