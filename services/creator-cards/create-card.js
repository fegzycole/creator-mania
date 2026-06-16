const { ERROR_CODE } = require('@app-core/errors');
const CreatorCardRepository = require('@app/repository/creator-card');
const {
  normalizeCreationAccess,
  rejectPublicAccessCode,
  validateCreationAccess,
} = require('./helpers/access');
const { throwCreatorCardError } = require('./helpers/errors');
const { resolveSlug } = require('./helpers/slug');
const { serializeCreatorCard } = require('./helpers/serializer');
const { validateCreateData } = require('./helpers/validation');

const MAX_CREATE_RETRIES = 3;

function isDuplicateSlugError(error) {
  return error.errorCode === ERROR_CODE.DUPLRCRD || parseInt(error.code, 10) === 11000;
}

function handleCreateError(error) {
  if (!isDuplicateSlugError(error)) throw error;
}

async function saveCard(data) {
  try {
    return await CreatorCardRepository.create(data);
  } catch (error) {
    handleCreateError(error);
    return null;
  }
}

async function buildCardData(accessData) {
  const slug = await resolveSlug(accessData);
  return { ...accessData, slug, deleted: null };
}

async function createWithSlugRetry(accessData, attempt = 0) {
  const cardData = await buildCardData(accessData);
  const card = await saveCard(cardData);

  if (card) return card;
  if (accessData.slug || attempt >= MAX_CREATE_RETRIES) throwCreatorCardError('SL02');

  return createWithSlugRetry(accessData, attempt + 1);
}

async function createCreatorCard(serviceData) {
  rejectPublicAccessCode(serviceData);

  const data = validateCreateData(serviceData);

  validateCreationAccess(data);

  const accessData = normalizeCreationAccess(data);
  const card = await createWithSlugRetry(accessData);

  const response = serializeCreatorCard(card, { includeAccessCode: true });
  return response;
}

module.exports = createCreatorCard;
