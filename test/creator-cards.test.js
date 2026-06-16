process.env.USE_MOCK_MODEL = '1';

const assert = require('assert');
const createMockServer = require('@app-core/mock-server');
const { ulid } = require('@app-core/randomness');
const { MockModels, MockModelStubs } = require('@app/mock-models');

const createEndpoint = require('../endpoints/creator-cards/create-card');
const deleteEndpoint = require('../endpoints/creator-cards/delete-card');
const retrieveEndpoint = require('../endpoints/creator-cards/retrieve-card');

let cards;
const server = createMockServer(['endpoints/creator-cards']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchesQuery(card, query) {
  return Object.entries(query).every(([key, value]) => card[key] === value);
}

function duplicateSlugError() {
  const error = new Error('duplicate slug');
  error.code = '11000';
  error.keyPattern = { slug: 1 };
  return error;
}

function createCard(data) {
  if (cards.some((card) => card.slug === data.slug)) throw duplicateSlugError();

  const card = { ...clone(data), _id: ulid() };
  cards.push(card);
  return clone(card);
}

function findOneCard({ query }) {
  const card = cards.find((entry) => matchesQuery(entry, query));
  return card ? clone(card) : null;
}

function markDeletedCard(query, updateValues) {
  const card = cards.find((entry) => matchesQuery(entry, query));
  if (!card) return null;

  Object.assign(card, updateValues.$set);
  return clone(card);
}

function resetStore() {
  cards = [];
  MockModelStubs.CreatorCard.create.default = createCard;
  MockModelStubs.CreatorCard.findOne.default = findOneCard;
  MockModels.CreatorCard.findOneAndUpdate = markDeletedCard;
}

function validCreatorCard(overrides = {}) {
  return {
    title: 'George Cooks',
    description: 'Weekly cooking podcast',
    slug: 'george-cooks',
    creator_reference: 'crt_8f2k1m9x4p7w3q5z',
    links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
    service_rates: {
      currency: 'NGN',
      rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
    },
    status: 'published',
    ...overrides,
  };
}

async function createCardRequest(overrides = {}) {
  return server.post('/creator-cards', { body: validCreatorCard(overrides) });
}

function assertBusinessError(response, statusCode, code) {
  assert.strictEqual(response.statusCode, statusCode);
  assert.strictEqual(response.data.status, 'error');
  assert.strictEqual(response.data.code, code);
}

function assertNoMongoId(value) {
  assert.strictEqual(JSON.stringify(value).includes('"_id"'), false);
}

describe('Creator Card API', () => {
  beforeEach(resetStore);

  it('creates a full creator card', async () => {
    const response = await createCardRequest();
    const { data } = response.data;

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Created Successfully.');
    assert.ok(data.id);
    assertNoMongoId(data);
    assert.strictEqual(data.access_type, 'public');
    assert.strictEqual(data.access_code, null);
    assert.strictEqual(typeof data.created, 'number');
    assert.strictEqual(typeof data.updated, 'number');
    assert.strictEqual(data.deleted, null);
  });

  it('auto-generates a slug from the title', async () => {
    const response = await createCardRequest({
      title: 'Ada Designs Things',
      slug: undefined,
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.data.slug, 'ada-designs-things');
  });

  it('adds a suffix when an auto-generated slug is already taken', async () => {
    await createCardRequest({ title: 'Ada Designs Things', slug: undefined });

    const response = await createCardRequest({
      title: 'Ada Designs Things',
      slug: undefined,
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    });

    assert.strictEqual(response.statusCode, 200);
    assert.match(response.data.data.slug, /^ada-designs-things-[a-f0-9]{6}$/);
  });

  it('retries auto-generated slugs on create-time duplicate collisions', async () => {
    const originalCreate = MockModelStubs.CreatorCard.create.default;
    let shouldCollide = true;

    MockModelStubs.CreatorCard.create.default = (data) => {
      if (shouldCollide && data.slug === 'race-card') {
        shouldCollide = false;
        cards.push({ ...clone(data), _id: ulid() });
        throw duplicateSlugError();
      }

      return originalCreate(data);
    };

    const response = await createCardRequest({
      title: 'Race Card',
      slug: undefined,
      creator_reference: 'crt_r1a2c3e4c5a6r7d8',
    });

    assert.strictEqual(response.statusCode, 200);
    assert.match(response.data.data.slug, /^race-card-[a-f0-9]{6}$/);
  });

  it('creates a private creator card with access_code', async () => {
    const response = await createCardRequest({
      title: 'VIP Rate Card',
      slug: undefined,
      creator_reference: 'crt_x9y8z7w6v5u4t3s2',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.data.access_type, 'private');
    assert.strictEqual(response.data.data.access_code, 'A1B2C3');
  });

  it('retrieves a public published card', async () => {
    await createCardRequest();

    const response = await server.get('/creator-cards/george-cooks');
    const { data } = response.data;

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Retrieved Successfully.');
    assert.ok(data.id);
    assertNoMongoId(data);
    assert.strictEqual(Object.hasOwn(data, 'access_code'), false);
  });

  it('retrieves a private card with the correct access_code', async () => {
    await createCardRequest({
      title: 'VIP Rate Card',
      slug: 'vip-rate-card',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    const response = await server.get('/creator-cards/vip-rate-card?access_code=A1B2C3');

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(Object.hasOwn(response.data.data, 'access_code'), false);
  });

  it('deletes a card', async () => {
    await createCardRequest({
      title: 'Ada Designs Things',
      slug: 'ada-designs-things',
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    });

    const response = await server.delete('/creator-cards/ada-designs-things', {
      body: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Deleted Successfully.');
    assert.strictEqual(typeof response.data.data.deleted, 'number');
    assert.strictEqual(response.data.data.access_code, null);
    assertNoMongoId(response.data.data);
  });

  it('returns SL02 for a duplicate client-provided slug', async () => {
    await createCardRequest();

    const response = await createCardRequest({
      title: 'Another George',
      creator_reference: 'crt_m1n2b3v4c5x6z7l8',
    });

    assertBusinessError(response, 400, 'SL02');
  });

  it('returns AC01 when private access_code is missing', async () => {
    const response = await createCardRequest({
      title: 'Secret Card',
      slug: undefined,
      creator_reference: 'crt_q1w2e3r4t5y6u7i8',
      access_type: 'private',
    });

    assertBusinessError(response, 400, 'AC01');
  });

  it('returns AC05 when access_code is supplied for a public card', async () => {
    const response = await createCardRequest({
      title: 'Public Card',
      slug: undefined,
      creator_reference: 'crt_q1w2e3r4t5y6u7i8',
      access_type: 'public',
      access_code: 'A1B2C3',
    });

    assertBusinessError(response, 400, 'AC05');
  });

  it('returns AC05 before field validation for public access_code', async () => {
    const response = await createCardRequest({
      title: 'Public Card',
      slug: undefined,
      access_code: 'BAD',
    });

    assertBusinessError(response, 400, 'AC05');
  });

  it('returns HTTP 400 for invalid status', async () => {
    const response = await createCardRequest({ status: 'archived' });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.status, 'error');
  });

  it('returns NF01 for a non-existent card', async () => {
    const response = await server.get('/creator-cards/does-not-exist-123');

    assertBusinessError(response, 404, 'NF01');
  });

  it('returns NF02 for a draft card', async () => {
    await createCardRequest({ slug: 'my-draft-card', status: 'draft' });

    const response = await server.get('/creator-cards/my-draft-card');

    assertBusinessError(response, 404, 'NF02');
  });

  it('returns AC03 for private card retrieval without access_code', async () => {
    await createCardRequest({
      slug: 'vip-rate-card',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    const response = await server.get('/creator-cards/vip-rate-card');

    assertBusinessError(response, 403, 'AC03');
  });

  it('returns AC04 for private card retrieval with the wrong access_code', async () => {
    await createCardRequest({
      slug: 'vip-rate-card',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    const response = await server.get('/creator-cards/vip-rate-card?access_code=WRONG1');

    assertBusinessError(response, 403, 'AC04');
  });

  it('returns NF01 when deleting a non-existent card', async () => {
    const response = await server.delete('/creator-cards/does-not-exist-123', {
      body: { creator_reference: 'crt_q1w2e3r4t5y6u7i8' },
    });

    assertBusinessError(response, 404, 'NF01');
  });

  it('returns NF01 when retrieving a deleted card', async () => {
    await createCardRequest({
      slug: 'ada-designs-things',
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    });
    await server.delete('/creator-cards/ada-designs-things', {
      body: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
    });

    const response = await server.get('/creator-cards/ada-designs-things');

    assertBusinessError(response, 404, 'NF01');
  });

  it('rejects zero, negative, and decimal service rate amounts', async () => {
    const invalidAmounts = [0, -1, 1.5];

    const responses = await Promise.all(
      invalidAmounts.map((amount) =>
        createCardRequest({
          slug: `bad-amount-${String(amount).replace('.', '_').replace('-', 'n')}`,
          service_rates: {
            currency: 'NGN',
            rates: [{ name: 'IG Story Post', description: 'One story mention', amount }],
          },
        })
      )
    );

    responses.forEach((response) => {
      assert.strictEqual(response.statusCode, 400);
    });
  });

  it('rejects unsupported service rate currency', async () => {
    const response = await createCardRequest({
      service_rates: {
        currency: 'EUR',
        rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
      },
    });

    assert.strictEqual(response.statusCode, 400);
  });

  it('rejects empty service rate rates array', async () => {
    const response = await createCardRequest({
      service_rates: {
        currency: 'NGN',
        rates: [],
      },
    });

    assert.strictEqual(response.statusCode, 400);
  });

  it('rejects invalid service rate name and description fields', async () => {
    const invalidRates = [
      { name: 'IG', description: 'One story mention', amount: 5000000 },
      { name: 'IG Story Post', amount: 5000000 },
      { name: 'IG Story Post', description: 'x'.repeat(251), amount: 5000000 },
    ];

    const responses = await Promise.all(
      invalidRates.map((rate, index) =>
        createCardRequest({
          slug: `bad-rate-field-${index}`,
          service_rates: {
            currency: 'NGN',
            rates: [rate],
          },
        })
      )
    );

    responses.forEach((response) => {
      assert.strictEqual(response.statusCode, 400);
    });
  });

  it('rejects URLs that do not start with http:// or https://', async () => {
    const response = await createCardRequest({
      links: [{ title: 'YouTube', url: 'ftp://youtube.com/@georgecooks' }],
    });

    assert.strictEqual(response.statusCode, 400);
  });

  it('keeps endpoint paths at the root with no API version prefix', () => {
    assert.strictEqual(createEndpoint.path, '/creator-cards');
    assert.strictEqual(retrieveEndpoint.path, '/creator-cards/:slug');
    assert.strictEqual(deleteEndpoint.path, '/creator-cards/:slug');
  });
});
