const { randomBytes } = require('@app-core/randomness');
const CreatorCardRepository = require('@app/repository/creator-card');
const { throwCreatorCardError } = require('./errors');

const MAX_SLUG_LENGTH = 50;
const MIN_SLUG_LENGTH = 5;
const SUFFIX_LENGTH = 6;
const MAX_SLUG_RETRIES = 10;

function baseSlugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
}

function fitSlug(slug, maxLength) {
  return slug.slice(0, maxLength);
}

function suffixCapacity() {
  return MAX_SLUG_LENGTH - SUFFIX_LENGTH - 1;
}

function randomSuffix() {
  return randomBytes(SUFFIX_LENGTH);
}

function addSuffix(slug) {
  const base = fitSlug(slug, suffixCapacity());
  return `${base}-${randomSuffix()}`;
}

async function slugExists(slug) {
  const card = await CreatorCardRepository.findBySlug(slug);
  return !!card;
}

async function needsSuffix(slug) {
  if (slug.length < MIN_SLUG_LENGTH) return true;
  return slugExists(slug);
}

async function ensureClientSlugAvailable(slug) {
  if (await slugExists(slug)) {
    throwCreatorCardError('SL02');
  }
}

async function generateSlugWithSuffix(baseSlug, attempt = 0) {
  if (attempt >= MAX_SLUG_RETRIES) throwCreatorCardError('SL02');

  const slug = addSuffix(baseSlug);
  if (!(await slugExists(slug))) return slug;

  return generateSlugWithSuffix(baseSlug, attempt + 1);
}

async function generateSlug(title) {
  const baseSlug = fitSlug(baseSlugFromTitle(title), MAX_SLUG_LENGTH);
  if (await needsSuffix(baseSlug)) return generateSlugWithSuffix(baseSlug);
  return baseSlug;
}

async function resolveSlug(data) {
  if (!data.slug) return generateSlug(data.title);

  await ensureClientSlugAvailable(data.slug);
  return data.slug;
}

module.exports = { resolveSlug };
