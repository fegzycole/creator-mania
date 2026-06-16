const { throwCreatorCardError } = require('./errors');

function hasAccessCode(data) {
  return Object.hasOwn(data, 'access_code');
}

function getAccessType(data) {
  return data.access_type || 'public';
}

function rejectPublicAccessCode(data) {
  if (getAccessType(data) === 'public' && hasAccessCode(data)) {
    throwCreatorCardError('AC05');
  }
}

function validateCreationAccess(data) {
  const accessType = getAccessType(data);

  if (accessType === 'private' && !hasAccessCode(data)) {
    throwCreatorCardError('AC01');
  }

  if (accessType !== 'private' && hasAccessCode(data)) {
    throwCreatorCardError('AC05');
  }
}

function normalizeCreationAccess(data) {
  const accessType = getAccessType(data);
  const accessCode = accessType === 'private' ? data.access_code : null;

  return { ...data, access_type: accessType, access_code: accessCode };
}

function enforceRetrievalAccess(card, query) {
  if (card.access_type !== 'private') return;
  if (!hasAccessCode(query)) throwCreatorCardError('AC03');
  if (query.access_code !== card.access_code) throwCreatorCardError('AC04');
}

module.exports = {
  rejectPublicAccessCode,
  validateCreationAccess,
  normalizeCreationAccess,
  enforceRetrievalAccess,
};
